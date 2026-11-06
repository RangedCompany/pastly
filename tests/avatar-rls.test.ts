import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const image = "cccccccc-cccc-4ccc-accc-cccccccccccc.webp";
let db: PGlite;
async function as<T>(role: "anon" | "authenticated", user: string | null, run: () => Promise<T>) {
  await db.exec(`begin; set local role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? ""]);
  try { return await run(); } finally { await db.exec("rollback;"); }
}
beforeAll(async () => {
  db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;`);
  await db.exec(readFileSync(new URL("../supabase/migrations/202610290001_postly.sql", import.meta.url), "utf8"));
  // Minimal Storage tables exercise SQL policies, not the remote Storage API.
  await db.exec(`create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select, insert, update, delete on storage.objects to anon, authenticated;`);
  await db.exec(readFileSync(new URL("../supabase/migrations/202611060001_profile_avatars.sql", import.meta.url), "utf8"));
  await db.query("insert into auth.users (id,email) values ($1,'a@example.test'),($2,'b@example.test')", [A, B]);
  await db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)", [`${B}/${image}`]);
});
afterAll(async () => { await db?.close(); });

describe("RLS des photos de profil", () => {
  it("ajoute une photo facultative et un bucket public borné", async () => {
    expect((await db.query("select avatar_path from public.profiles")).rows).toEqual([{ avatar_path: null }, { avatar_path: null }]);
    expect((await db.query("select public,file_size_limit,allowed_mime_types from storage.buckets where id='avatars'")).rows[0])
      .toEqual({ public: true, file_size_limit: 2097152, allowed_mime_types: ["image/webp"] });
  });
  it("autorise sa propre photo mais ne modifie pas celle d’un tiers", async () => {
    await as("authenticated", A, async () => {
      expect((await db.query("update public.profiles set avatar_path=$1 where id=$2 returning id", [`${A}/${image}`, A])).rows).toHaveLength(1);
      expect((await db.query("update public.profiles set avatar_path=$1 where id=$2 returning id", [`${B}/${image}`, B])).rows).toHaveLength(0);
    });
  });
  it("refuse de référencer la photo d’un autre utilisateur ou une URL externe", async () => {
    for (const path of [`${B}/${image}`, "https://example.test/photo.webp"])
      await expect(as("authenticated", A, () => db.query("update public.profiles set avatar_path=$1 where id=$2", [path, A]))).rejects.toThrow();
  });
  it("autorise l’envoi uniquement dans son dossier d’avatars", async () => {
    await as("authenticated", A, async () => {
      await db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)", [`${A}/${image}`]);
    });
    for (const [bucket, path] of [["avatars", `${B}/${image}`], ["other", `${A}/${image}`], ["avatars", `${A}/script.svg`]])
      await expect(as("authenticated", A, () => db.query("insert into storage.objects(bucket_id,name) values ($1,$2)", [bucket, path]))).rejects.toThrow();
  });
  it("interdit les écritures anonymes et la suppression des photos d’un tiers", async () => {
    await expect(as("anon", null, () => db.query("update public.profiles set avatar_path=null where id=$1", [A]))).rejects.toThrow();
    await expect(as("anon", null, () => db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)", [`${A}/${image}`]))).rejects.toThrow();
    await as("authenticated", A, async () => {
      expect((await db.query("delete from storage.objects where name=$1 returning id", [`${B}/${image}`])).rows).toHaveLength(0);
    });
    await as("authenticated", B, async () => {
      expect((await db.query("delete from storage.objects where name=$1 returning id", [`${B}/${image}`])).rows).toHaveLength(1);
    });
  });
});
