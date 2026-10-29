import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Vrai moteur PostgreSQL embarqué. Auth / PostgREST / cookies ne sont pas simulés comme étant testés ici.
const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const C = "cccccccc-cccc-4ccc-accc-cccccccccccc";
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
    const result = await run();
    await db.exec(commit ? "commit;" : "rollback;");
    return result;
  } catch (error) {
    await db.exec("rollback;");
    throw error;
  }
}
async function createNote(isPublic = true) {
  const result = await db.query<{ id: string }>(
    "insert into public.notes (owner_id,title,content,is_public) values ($1,'Une idée','Un contenu',$2) returning id",
    [A, isPublic],
  );
  return result.rows[0].id;
}
beforeAll(async () => {
  db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
  await db.exec(
    readFileSync(
      new URL(
        "../supabase/migrations/202610290001_postly.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.query(
    "insert into auth.users (id,email) values ($1,'alice@example.test'),($2,'bob@example.test'),($3,'charlie@example.test')",
    [A, B, C],
  );
});
afterAll(async () => {
  await db?.close();
});

describe("RLS notes, privilèges et confidentialité", () => {
  it("crée des profils sans publier les emails", async () => {
    await as("anon", null, async () => {
      const { rows } = await db.query<Record<string, unknown>>(
        "select * from public.profiles",
      );
      expect(rows).toHaveLength(3);
      expect(Object.keys(rows[0]).sort()).toEqual([
        "created_at",
        "display_name",
        "id",
        "username",
      ]);
    });
  });
  it("met les nouvelles notes en public par défaut", async () => {
    await as("authenticated", A, async () => {
      const { rows } = await db.query<{ is_public: boolean }>(
        "insert into public.notes (title,content) values ('Titre','Texte') returning is_public",
      );
      expect(rows[0].is_public).toBe(true);
    });
  });
  it("autorise la lecture anonyme des notes publiques", async () => {
    const id = await createNote();
    try {
      await as("anon", null, async () =>
        expect(
          (await db.query("select * from public.notes where id=$1", [id])).rows,
        ).toHaveLength(1),
      );
    } finally {
      await db.query("delete from public.notes where id=$1", [id]);
    }
  });
  it("interdit la création anonyme", async () => {
    await expect(
      as("anon", null, () =>
        db.query(
          "insert into public.notes (owner_id,title,content) values ($1,'Titre','Contenu')",
          [A],
        ),
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("interdit l'usurpation du propriétaire à la création", async () => {
    await expect(
      as("authenticated", B, () =>
        db.query(
          "insert into public.notes (owner_id,title,content) values ($1,'Titre','Contenu')",
          [A],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });
  it("retire immédiatement une note et son lien des lectures publiques après passage en privé", async () => {
    const id = await createNote();
    try {
      await as(
        "authenticated",
        A,
        async () => {
          const result = await db.query(
            "update public.notes set is_public=false where id=$1 returning id",
            [id],
          );
          expect(result.rows).toHaveLength(1);
        },
        true,
      );
      await as("anon", null, async () => {
        expect(
          (await db.query("select * from public.notes where is_public")).rows,
        ).toHaveLength(0);
        expect(
          (await db.query("select * from public.notes where id=$1", [id])).rows,
        ).toHaveLength(0);
      });
      await as("authenticated", B, async () =>
        expect(
          (await db.query("select * from public.notes where id=$1", [id])).rows,
        ).toHaveLength(0),
      );
      await as("authenticated", A, async () =>
        expect(
          (await db.query("select * from public.notes where id=$1", [id])).rows,
        ).toHaveLength(1),
      );
    } finally {
      await db.query("delete from public.notes where id=$1", [id]);
    }
  });
  it.each([true, false])(
    "empêche un autre utilisateur de modifier ou supprimer une note publique=%s",
    async (isPublic) => {
      const id = await createNote(isPublic);
      try {
        await as("authenticated", B, async () => {
          expect(
            (
              await db.query(
                "update public.notes set title='Piraté' where id=$1 returning id",
                [id],
              )
            ).rows,
          ).toHaveLength(0);
          expect(
            (
              await db.query(
                "delete from public.notes where id=$1 returning id",
                [id],
              )
            ).rows,
          ).toHaveLength(0);
        });
        const { rows } = await db.query<{ title: string }>(
          "select title from public.notes where id=$1",
          [id],
        );
        expect(rows[0].title).toBe("Une idée");
      } finally {
        await db.query("delete from public.notes where id=$1", [id]);
      }
    },
  );
  it("autorise les modifications, couleurs et suppressions du propriétaire", async () => {
    await as("authenticated", A, async () => {
      const id = await createNote(false);
      const { rows } = await db.query<{ color: string; is_public: boolean }>(
        "update public.notes set color='blue',is_public=true where id=$1 returning color,is_public",
        [id],
      );
      expect(rows[0]).toEqual({ color: "blue", is_public: true });
      expect(
        (
          await db.query("delete from public.notes where id=$1 returning id", [
            id,
          ])
        ).rows,
      ).toHaveLength(1);
    });
  });
  it.each(["owner_id", "id", "created_at", "updated_at"])(
    "interdit la modification de %s par l'API",
    async (column) => {
      const id = await createNote();
      try {
        const value = column.endsWith("_at") ? "now()" : `'${B}'`;
        await expect(
          as("authenticated", A, () =>
            db.query(`update public.notes set ${column}=${value} where id=$1`, [
              id,
            ]),
          ),
        ).rejects.toThrow(/permission denied/);
      } finally {
        await db.query("delete from public.notes where id=$1", [id]);
      }
    },
  );
  it("défend aussi l'immuabilité du propriétaire par trigger", async () => {
    const id = await createNote();
    try {
      await expect(
        db.query("update public.notes set owner_id=$1 where id=$2", [B, id]),
      ).rejects.toThrow(/immuable/);
    } finally {
      await db.query("delete from public.notes where id=$1", [id]);
    }
  });
  it("actualise updated_at", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into public.notes (owner_id,title,content,updated_at) values ($1,'Idée','Texte','2000-01-01T00:00:00Z') returning id",
      [A],
    );
    const id = rows[0].id;
    try {
      await as("authenticated", A, async () => {
        const after = await db.query<{ updated_at: Date }>(
          "update public.notes set content='Révision' where id=$1 returning updated_at",
          [id],
        );
        expect(after.rows[0].updated_at.getTime()).toBeGreaterThan(
          Date.parse("2000-01-01T00:00:00Z"),
        );
      });
    } finally {
      await db.query("delete from public.notes where id=$1", [id]);
    }
  });
  it.each([
    "color='red'",
    "title=''",
    "content=''",
    "title='   '",
    "title=repeat('a',121)",
    "content=repeat('a',5001)",
    "title='a' || repeat(' ',120)",
    "content='a' || repeat(' ',5000)",
  ])("fait respecter les contraintes SQL : %s", async (invalid) => {
    const id = await createNote();
    try {
      await expect(
        as("authenticated", A, () =>
          db.query(`update public.notes set ${invalid} where id=$1`, [id]),
        ),
      ).rejects.toThrow(/check constraint/);
    } finally {
      await db.query("delete from public.notes where id=$1", [id]);
    }
  });
});
describe("profils publics et réparation", () => {
  it("autorise uniquement la modification de son profil", async () => {
    await as("authenticated", A, async () => {
      expect(
        (
          await db.query(
            "update public.profiles set display_name='Alice' where id=$1 returning id",
            [A],
          )
        ).rows,
      ).toHaveLength(1);
      expect(
        (
          await db.query(
            "update public.profiles set display_name='Autre' where id=$1 returning id",
            [B],
          )
        ).rows,
      ).toHaveLength(0);
    });
  });
  it("garantit l'unicité des noms d'utilisateur", async () => {
    const { rows } = await db.query<{ username: string }>(
      "select username from public.profiles where id=$1",
      [B],
    );
    await expect(
      as("authenticated", A, () =>
        db.query("update public.profiles set username=$1 where id=$2", [
          rows[0].username,
          A,
        ]),
      ),
    ).rejects.toThrow(/unique constraint/);
  });
  it("répare un profil manquant pour le seul utilisateur courant, de façon idempotente", async () => {
    await db.query("delete from public.profiles where id=$1", [C]);
    await as("authenticated", C, async () => {
      expect(
        (
          await db.query<{ id: string }>(
            "select * from public.ensure_my_profile()",
          )
        ).rows[0].id,
      ).toBe(C);
      expect(
        (
          await db.query<{ id: string }>(
            "select * from public.ensure_my_profile()",
          )
        ).rows[0].id,
      ).toBe(C);
    });
    await expect(
      as("anon", null, () =>
        db.query("select * from public.ensure_my_profile()"),
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("ne bloque pas une inscription si le trigger de profil échoue", async () => {
    await db.exec(
      "begin; alter table public.profiles add constraint simulated_failure check (false) not valid;",
    );
    try {
      const id = "dddddddd-dddd-4ddd-addd-dddddddddddd";
      await db.query("insert into auth.users (id) values ($1)", [id]);
      expect(
        (await db.query("select id from auth.users where id=$1", [id])).rows,
      ).toHaveLength(1);
      expect(
        (await db.query("select id from public.profiles where id=$1", [id]))
          .rows,
      ).toHaveLength(0);
    } finally {
      await db.exec("rollback;");
    }
  });
});
