import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

// Aucun secret administrateur. Deux comptes confirmés doivent être préparés manuellement.
const env = process.env;
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "PASTLY_TEST_USER_A_EMAIL",
  "PASTLY_TEST_USER_A_PASSWORD",
  "PASTLY_TEST_USER_B_EMAIL",
  "PASTLY_TEST_USER_B_PASSWORD",
];
if (
  env.PASTLY_INTEGRATION_CONFIRM !== "dedicated-test-project" ||
  required.some((key) => !env[key])
) {
  console.error(
    "Intégration non exécutée : configurez un projet de TEST dédié, deux comptes confirmés et PASTLY_INTEGRATION_CONFIRM=dedicated-test-project (voir README).",
  );
  process.exit(2);
}
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
const client = () =>
  createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    options,
  );
const anon = client(),
  alice = client(),
  bob = client();
const a = await alice.auth.signInWithPassword({
  email: env.PASTLY_TEST_USER_A_EMAIL!,
  password: env.PASTLY_TEST_USER_A_PASSWORD!,
});
const b = await bob.auth.signInWithPassword({
  email: env.PASTLY_TEST_USER_B_EMAIL!,
  password: env.PASTLY_TEST_USER_B_PASSWORD!,
});
assert.ifError(a.error);
assert.ifError(b.error);
assert.ok(a.data.user && b.data.user && a.data.user.id !== b.data.user.id);
let noteId: string | undefined;
try {
  assert.ifError((await alice.rpc("ensure_my_profile")).error);
  const inserted = await alice
    .from("notes")
    .insert({
      owner_id: a.data.user.id,
      title: "Test Pastly temporaire",
      content: "Note de test supprimée en fin de scénario",
      color: "yellow",
    })
    .select()
    .single();
  assert.ifError(inserted.error);
  noteId = inserted.data.id;
  assert.equal(inserted.data.is_public, true);
  assert.equal(
    (await anon.from("notes").select("id").eq("id", noteId)).data?.length,
    1,
    "lecture publique",
  );
  assert.equal(
    (
      await anon
        .from("notes")
        .select("id")
        .eq("id", noteId)
        .eq("is_public", true)
    ).data?.length,
    1,
    "fil public",
  );
  assert.ok(
    (
      await anon.from("notes").insert({
        owner_id: a.data.user.id,
        title: "Interdit",
        content: "Texte",
      })
    ).error,
    "création anonyme refusée",
  );
  assert.ok(
    (
      await bob.from("notes").insert({
        owner_id: a.data.user.id,
        title: "Interdit",
        content: "Texte",
      })
    ).error,
    "usurpation refusée",
  );
  assert.ifError(
    (await alice.from("notes").update({ is_public: false }).eq("id", noteId))
      .error,
  );
  assert.equal(
    (await anon.from("notes").select("*").eq("id", noteId)).data?.length,
    0,
    "ancien lien anonyme inaccessible",
  );
  assert.equal(
    (
      await anon
        .from("notes")
        .select("id")
        .eq("is_public", true)
        .eq("id", noteId)
    ).data?.length,
    0,
    "retirée du fil public",
  );
  assert.equal(
    (await bob.from("notes").select("*").eq("id", noteId)).data?.length,
    0,
    "privée inaccessible à B",
  );
  assert.equal(
    (
      await bob
        .from("notes")
        .update({ title: "Interdit" })
        .eq("id", noteId)
        .select()
    ).data?.length,
    0,
    "modification de B refusée",
  );
  assert.equal(
    (await bob.from("notes").delete().eq("id", noteId).select()).data?.length,
    0,
    "suppression de B refusée",
  );
  assert.ok(
    (
      await alice
        .from("notes")
        .update({ owner_id: b.data.user.id })
        .eq("id", noteId)
    ).error,
    "propriétaire immuable",
  );
  assert.equal(
    (await alice.from("notes").select("id").eq("id", noteId)).data?.length,
    1,
    "lecture par propriétaire",
  );
  assert.ifError(
    (
      await alice
        .from("notes")
        .update({ title: "Modification autorisée", color: "green" })
        .eq("id", noteId)
    ).error,
  );
  const profile = await anon
    .from("profiles")
    .select("*")
    .eq("id", a.data.user.id)
    .single();
  assert.ifError(profile.error);
  assert.ok(!("email" in profile.data), "pas d'email public");
  const deleted = await alice
    .from("notes")
    .delete()
    .eq("id", noteId)
    .select("id");
  assert.ifError(deleted.error);
  assert.equal(deleted.data?.length, 1);
  noteId = undefined;
  console.log(
    "Intégration Supabase réussie : lecture publique, RLS, changement de visibilité, confidentialité, modification et suppression.",
  );
} finally {
  if (noteId) {
    const cleanup = await alice.from("notes").delete().eq("id", noteId);
    if (cleanup.error)
      console.error(
        "Nettoyage impossible : supprimez le post-it de test depuis le compte A.",
      );
  }
  await Promise.all([
    alice.auth.signOut({ scope: "local" }),
    bob.auth.signOut({ scope: "local" }),
  ]);
}
