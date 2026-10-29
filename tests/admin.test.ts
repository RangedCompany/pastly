import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminOverview } from "../src/lib/admin.types";

const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const C = "cccccccc-cccc-4ccc-accc-cccccccccccc";
const D = "dddddddd-dddd-4ddd-addd-dddddddddddd";
const E = "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee";
let db: PGlite;

async function as<T>(
  role: "anon" | "authenticated",
  user: string | null,
  run: () => Promise<T>,
  commit = false,
) {
  await db.exec(`begin; set local role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [
    user ?? "",
  ]);
  try {
    const value = await run();
    await db.exec(commit ? "commit;" : "rollback;");
    return value;
  } catch (error) {
    await db.exec("rollback;");
    throw error;
  }
}

async function overview(query = "", role = "all", page = 1) {
  const result = await db.query<{ data: AdminOverview }>(
    "select public.admin_overview($1,$2,$3) as data",
    [query, role, page],
  );
  return result.rows[0].data;
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, created_at timestamptz default now(),
      email_confirmed_at timestamptz, last_sign_in_at timestamptz, raw_user_meta_data jsonb default '{}', encrypted_password text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  for (const migration of [
    "202610290001_postly.sql",
    "202610290002_admin.sql",
  ]) {
    await db.exec(
      readFileSync(
        new URL(`../supabase/migrations/${migration}`, import.meta.url),
        "utf8",
      ),
    );
  }
  await db.query(
    `insert into auth.users (id,email,created_at,email_confirmed_at,last_sign_in_at,encrypted_password)
    values ($1,'alice@example.test','2000-01-01',now(),now(),'NEVER_EXPOSE'),
    ($2,'bob@example.test',now(),now(),'2000-01-01','NEVER_EXPOSE'),
    ($3,'charlie@example.test','2000-01-01',now(),null,'NEVER_EXPOSE'),
    ($4,'pending@example.test','2000-01-01',null,null,'NEVER_EXPOSE'),
    ($5,'missing@example.test','2000-01-01',now(),null,'NEVER_EXPOSE')`,
    [A, B, C, D, E],
  );
  await db.exec(`insert into auth.users (id,email,created_at,email_confirmed_at)
    select ('00000000-0000-4000-a000-' || lpad(i::text,12,'0'))::uuid, 'member' || i || '@example.test', '2000-01-01', now()
    from generate_series(1,21) i;`);
  await db.query(
    "insert into public.admin_members (user_id) values ($1),($2)",
    [A, C],
  );
  await db.query("delete from public.profiles where id=$1", [E]);
  await db.query(
    "update public.profiles set display_name='Bob unique',username='bob_unique' where id=$1",
    [B],
  );
  await db.query(
    `insert into public.notes (owner_id,title,content,is_public) values
    ($1,'Public A','Public',true),($2,'Private B','PRIVATE_NOTE_CONTENT',false),
    ($2,'Private B2','PRIVATE_NOTE_CONTENT',false),($3,'Public C','Public',true)`,
    [A, B, C],
  );
});

afterAll(async () => {
  await db?.close();
});

describe("administration : contrôle en base et confidentialité", () => {
  it.each([
    "select public.admin_overview()",
    `select public.admin_set_role('${B}',true)`,
    "select public.is_admin()",
  ])("refuse l'appel anonyme : %s", async (sql) => {
    await expect(as("anon", null, () => db.query(sql))).rejects.toThrow(
      /permission denied/,
    );
  });

  it.each([
    "select public.admin_overview()",
    `select public.admin_set_role('${B}',true)`,
  ])("refuse un membre même par appel RPC direct : %s", async (sql) => {
    await expect(as("authenticated", B, () => db.query(sql))).rejects.toThrow(
      /Accès administrateur requis/,
    );
  });

  it.each(["admin_members", "admin_role_events"])(
    "empêche lecture et falsification directes de %s",
    async (table) => {
      for (const user of [A, B]) {
        await expect(
          as("authenticated", user, () =>
            db.query(`select * from public.${table}`),
          ),
        ).rejects.toThrow(/permission denied/);
        await expect(
          as("authenticated", user, () =>
            db.query(`delete from public.${table}`),
          ),
        ).rejects.toThrow(/permission denied/);
      }
    },
  );

  it("interdit l'auto-promotion par insertion dans la table des admins", async () => {
    await expect(
      as("authenticated", B, () =>
        db.query("insert into public.admin_members (user_id) values ($1)", [B]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("ignore les rôles déclarés dans les métadonnées du compte", async () => {
    await db.query(
      `update auth.users set raw_user_meta_data='{"is_admin":true,"role":"admin"}' where id=$1`,
      [B],
    );
    await as("authenticated", B, async () => {
      expect(
        (
          await db.query<{ allowed: boolean }>(
            "select public.is_admin() as allowed",
          )
        ).rows[0].allowed,
      ).toBe(false);
    });
    await expect(as("authenticated", B, () => overview())).rejects.toThrow(
      /Accès administrateur requis/,
    );
  });

  it("renvoie les vrais comptes Auth, compte les notes privées et signale les profils absents sans retourner de contenu", async () => {
    await as("authenticated", A, async () => {
      const data = await overview();
      expect(data.summary).toMatchObject({
        accounts: 26,
        admins: 2,
        pending: 1,
        new_accounts_7d: 1,
        sign_ins_7d: 1,
        notes: 4,
        public_notes: 2,
        private_notes: 2,
        new_notes_7d: 4,
        missing_profiles: 1,
        without_notes: 23,
      });
      const bob = (await overview("bob@example.test")).accounts[0];
      expect(bob).toMatchObject({
        id: B,
        note_count: 2,
        public_note_count: 0,
        private_note_count: 2,
        is_admin: false,
      });
      expect(
        (await overview("missing@example.test")).accounts[0].username,
      ).toBeNull();
      expect(JSON.stringify(data)).not.toMatch(
        /PRIVATE_NOTE_CONTENT|NEVER_EXPOSE|encrypted_password|raw_user_meta_data/,
      );
      // La supervision n'étend pas l'accès aux textes des notes privées.
      expect(
        (await db.query("select * from public.notes where owner_id=$1", [B]))
          .rows,
      ).toHaveLength(0);
    });
  });

  it("ne publie ni les emails ni les rôles dans les profils publics", async () => {
    await as("anon", null, async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "select * from public.profiles limit 1",
      );
      expect(Object.keys(rows[0]).sort()).toEqual([
        "created_at",
        "display_name",
        "id",
        "username",
      ]);
    });
  });

  it("recherche les emails, pseudos, noms et UUID et traite les caractères spéciaux littéralement", async () => {
    await as("authenticated", A, async () => {
      for (const query of ["BOB@EXAMPLE.TEST", "bob_unique", "Bob unique", B])
        expect((await overview(query)).accounts[0].id).toBe(B);
      for (const query of ["%", "' OR true --", ","])
        expect((await overview(query)).total).toBe(0);
      expect((await overview("_")).total).toBe(25); // pseudos membre_<uuid> et bob_unique
      expect((await overview("", "admin")).total).toBe(2);
      expect((await overview("", "member")).total).toBe(24);
      expect((await overview("", "pending")).accounts[0].id).toBe(D);
    });
  });

  it("pagine sans doublons avec un ordre stable", async () => {
    await as("authenticated", A, async () => {
      const first = await overview();
      const second = await overview("", "all", 2);
      expect(first.accounts).toHaveLength(20);
      expect(second.accounts).toHaveLength(6);
      expect(
        new Set([...first.accounts, ...second.accounts].map((u) => u.id)).size,
      ).toBe(26);
      expect((await overview("", "all", 3)).accounts).toEqual([]);
    });
  });

  it.each([
    ["", "invalid", 1],
    ["", "all", 0],
    ["", "all", 10001],
    ["a".repeat(101), "all", 1],
  ] as const)(
    "valide les paramètres même par RPC : %s, %s, %s",
    async (query, role, page) => {
      await expect(
        as("authenticated", A, () => overview(query, role, page)),
      ).rejects.toThrow(/Filtres invalides/);
    },
  );

  it("attribue, journalise et révoque les droits ; la révocation s'applique à la requête suivante", async () => {
    try {
      await as(
        "authenticated",
        A,
        () => db.query("select public.admin_set_role($1,true)", [B]),
        true,
      );
      await as("authenticated", B, async () => {
        expect((await overview()).summary.admins).toBe(3);
      });
      await as(
        "authenticated",
        A,
        () => db.query("select public.admin_set_role($1,true)", [B]),
        true,
      );
      expect(
        (
          await db.query(
            "select * from public.admin_role_events where target_id=$1",
            [B],
          )
        ).rows,
      ).toHaveLength(1);
      await as(
        "authenticated",
        A,
        () => db.query("select public.admin_set_role($1,false)", [B]),
        true,
      );
      await expect(as("authenticated", B, () => overview())).rejects.toThrow(
        /Accès administrateur requis/,
      );
      await expect(
        as("authenticated", B, () =>
          db.query("select public.admin_set_role($1,true)", [B]),
        ),
      ).rejects.toThrow(/Accès administrateur requis/);
      await as("authenticated", A, async () => {
        const events = (await overview()).events;
        expect(events.map((e) => e.action)).toEqual(["revoked", "granted"]);
        expect(events[0]).toMatchObject({
          actor_id: A,
          target_id: B,
          actor_email: "alice@example.test",
          target_email: "bob@example.test",
        });
      });
    } finally {
      await db.query("delete from public.admin_members where user_id=$1", [B]);
      await db.exec("delete from public.admin_role_events");
    }
  });

  it("refuse de promouvoir un compte non confirmé ou absent", async () => {
    await expect(
      as("authenticated", A, () =>
        db.query("select public.admin_set_role($1,true)", [D]),
      ),
    ).rejects.toThrow(/confirmer son email/);
    await expect(
      as("authenticated", A, () =>
        db.query("select public.admin_set_role($1,true)", [
          "ffffffff-ffff-4fff-afff-ffffffffffff",
        ]),
      ),
    ).rejects.toThrow(/Compte introuvable/);
  });

  it("protège ses propres droits et conserve le dernier administrateur", async () => {
    await expect(
      as("authenticated", A, () =>
        db.query("select public.admin_set_role($1,false)", [A]),
      ),
    ).rejects.toThrow(/propres droits/);
    await db.query("delete from public.admin_members where user_id=$1", [C]);
    try {
      await expect(
        as("authenticated", A, () =>
          db.query("select public.admin_set_role($1,false)", [A]),
        ),
      ).rejects.toThrow(/propres droits/);
      expect(
        (await db.query("select * from public.admin_members")).rows,
      ).toHaveLength(1);
    } finally {
      await db.query("insert into public.admin_members (user_id) values ($1)", [
        C,
      ]);
    }
  });

  it("initialise le premier admin par email ET pseudo et journalise cette initialisation", async () => {
    const script = readFileSync(
      new URL("../supabase/bootstrap-admin.sql", import.meta.url),
      "utf8",
    )
      .replace("REPLACE_WITH_EMAIL", "alice@example.test")
      .replace("REPLACE_WITH_USERNAME", `membre_${A.replaceAll("-", "")}`)
      .replace(/^begin;\s*$/m, "")
      .replace(/^commit;\s*$/m, "");
    await db.exec(
      "begin; delete from public.admin_members; delete from public.admin_role_events;",
    );
    try {
      await db.exec(script);
      expect(
        (await db.query("select user_id from public.admin_members")).rows,
      ).toEqual([{ user_id: A }]);
      expect(
        (
          await db.query(
            "select actor_id,target_id,action from public.admin_role_events",
          )
        ).rows,
      ).toEqual([{ actor_id: null, target_id: A, action: "granted" }]);
      await expect(db.exec(script)).rejects.toThrow(/existe déjà/);
    } finally {
      await db.exec("rollback;");
    }
  });

  it("refuse l'initialisation si le pseudo ne correspond pas à l'email", async () => {
    const script = readFileSync(
      new URL("../supabase/bootstrap-admin.sql", import.meta.url),
      "utf8",
    )
      .replace("REPLACE_WITH_EMAIL", "alice@example.test")
      .replace("REPLACE_WITH_USERNAME", "wrong_account")
      .replace(/^begin;\s*$/m, "")
      .replace(/^commit;\s*$/m, "");
    await db.exec("begin; delete from public.admin_members;");
    try {
      await expect(db.exec(script)).rejects.toThrow(/no rows/);
    } finally {
      await db.exec("rollback;");
    }
  });
});
