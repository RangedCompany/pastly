import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import {
  ArrowUpRight,
  RefreshCw,
  Search,
  ShieldCheck,
  StickyNote,
  Users,
  Activity,
} from "lucide-react";
import {
  ADMIN_PAGE_SIZE,
  type AdminOverview,
  type AdminRoleFilter,
} from "@/lib/admin.types";
import { AdminRoleControl } from "./admin-role-control";

function date(value: string | null, t: import("@/lib/i18n/locale").Translator) {
  return value
    ? new Intl.DateTimeFormat(t.locale, {
        dateStyle: "medium",
        timeZone: "Europe/Paris",
      }).format(new Date(value))
    : t("Jamais");
}

export async function AdminDashboard({
  data,
  currentUserId,
  query,
  role,
  page,
}: {
  data: AdminOverview;
  currentUserId: string;
  query: string;
  role: AdminRoleFilter;
  page: number;
}) {
  const t = await getTranslations();
  const { summary, accounts, total, events } = data;
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  function href(n: number) {
    return `/admin?${new URLSearchParams({ q: query, role, page: String(n) })}`;
  }

  return (
    <div className="container admin-page">
      <div className="heading-row">
        <header className="page-heading">
          <span className="eyebrow">{t("LES COULISSES DE PASTLY")}</span>
          <h1>{t("Administration")}</h1>
          <p>
            {t("Les comptes, les notes et les accès, réunis au même endroit.")}
          </p>
        </header>
        <Link
          href={href(page)}
          prefetch={false}
          className="button button-secondary"
        >
          <RefreshCw size={17} aria-hidden="true" />
          {t("Actualiser")}
        </Link>
      </div>

      <section className="admin-stats" aria-label={t("Vue d’ensemble")}>
        <article className="admin-stat">
          <Users size={21} aria-hidden="true" />
          <h2>{t("Comptes créés")}</h2>
          <strong>{summary.accounts}</strong>
          <p>
            +{summary.new_accounts_7d} {t("sur les 7 derniers jours")}
          </p>
        </article>
        <article className="admin-stat">
          <StickyNote size={21} aria-hidden="true" />
          <h2>{t("Notes")}</h2>
          <strong>{summary.notes}</strong>
          <p>
            {t("{public} publics · {private} privés", {
              public: summary.public_notes,
              private: summary.private_notes,
            })}
          </p>
        </article>
        <article className="admin-stat">
          <ShieldCheck size={21} aria-hidden="true" />
          <h2>{t("Administrateurs")}</h2>
          <strong>{summary.admins}</strong>
          <p>{t("Accès à la supervision et aux droits")}</p>
        </article>
        <article className="admin-stat">
          <Activity size={21} aria-hidden="true" />
          <h2>{t("Connexions récentes")}</h2>
          <strong>{summary.sign_ins_7d}</strong>
          <p>{t("Comptes connectés sur les 7 derniers jours")}</p>
        </article>
      </section>

      <section className="admin-health" aria-labelledby="health-heading">
        <h2 id="health-heading">{t("À suivre")}</h2>
        <div>
          <Link href="/admin?role=pending">
            {t.plural(
              "{count} email à confirmer",
              "{count} emails à confirmer",
              summary.pending,
            )}{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <span>
            {summary.without_notes} {t("compte")}
            {summary.without_notes > 1 ? "s" : ""} {t("sans note")}
          </span>
          <span>
            {summary.new_notes_7d} {t("notes créées sur 7 jours")}
          </span>
          <span className={summary.missing_profiles ? "admin-warning" : ""}>
            {t.plural(
              "{count} profil manquant",
              "{count} profils manquants",
              summary.missing_profiles,
            )}
          </span>
        </div>
      </section>

      <section aria-labelledby="accounts-heading">
        <div className="admin-section-heading">
          <h2 id="accounts-heading">{t("Les comptes")}</h2>
          <span>
            {t.plural("{count} résultat", "{count} résultats", total)}
          </span>
        </div>
        <form
          className="search-form admin-filters"
          role="search"
          action="/admin"
        >
          <div className="search-input">
            <Search size={18} aria-hidden="true" />
            <label htmlFor="admin-search" className="sr-only">
              {t("Rechercher un compte")}
            </label>
            <input
              id="admin-search"
              type="search"
              name="q"
              defaultValue={query}
              maxLength={100}
              placeholder={t("Email, pseudo, nom ou identifiant…")}
            />
          </div>
          <label className="sr-only" htmlFor="admin-role">
            {t("Filtrer les comptes")}
          </label>
          <select id="admin-role" name="role" defaultValue={role}>
            <option value="all">{t("Tous les comptes")}</option>
            <option value="admin">{t("Administrateurs")}</option>
            <option value="member">{t("Membres")}</option>
            <option value="pending">{t("Email à confirmer")}</option>
          </select>
          <button className="button button-primary">{t("Rechercher")}</button>
          {(query || role !== "all") && (
            <Link href="/admin" className="button button-secondary">
              {t("Effacer les filtres")}
            </Link>
          )}
        </form>

        <div className="admin-accounts">
          {accounts.map((account) => (
            <article
              className="admin-account"
              key={account.id}
              aria-label={account.email ?? account.id}
            >
              <div className="admin-account-heading">
                <div>
                  <h3>{account.display_name ?? t("Profil manquant")}</h3>
                  <p className="admin-email">
                    {account.email ?? t("Sans adresse email")}
                  </p>
                  {account.username && (
                    <Link
                      href={`/u/${account.username}`}
                      className="admin-profile-link"
                      prefetch={false}
                    >
                      @{account.username}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  )}
                </div>
                <div className="admin-badges">
                  <span
                    className={`admin-badge ${account.is_admin ? "admin-badge-green" : ""}`}
                  >
                    {account.is_admin ? t("Administrateur") : t("Membre")}
                  </span>
                  <span
                    className={`admin-badge ${account.email_confirmed_at ? "" : "admin-badge-amber"}`}
                  >
                    {account.email_confirmed_at
                      ? t("Email confirmé")
                      : t("Email à confirmer")}
                  </span>
                </div>
              </div>
              <dl className="admin-account-details">
                <div>
                  <dt>{t("Notes")}</dt>
                  <dd>
                    <strong>{account.note_count}</strong>{" "}
                    <span>
                      {t("dont")} {account.public_note_count} {t("publics et")}{" "}
                      {account.private_note_count} {t("privés")}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>{t("Inscription")}</dt>
                  <dd>{date(account.created_at, t)}</dd>
                </div>
                <div>
                  <dt>{t("Dernière connexion")}</dt>
                  <dd>{date(account.last_sign_in_at, t)}</dd>
                </div>
                <div>
                  <dt>{t("Dernière note créée")}</dt>
                  <dd>{date(account.last_note_at, t)}</dd>
                </div>
              </dl>
              <div className="admin-account-bottom">
                <span className="admin-account-id">
                  {t("ID :")} {account.id}
                </span>
                <AdminRoleControl
                  account={account}
                  currentUserId={currentUserId}
                />
              </div>
            </article>
          ))}
          {!accounts.length && (
            <div className="empty-state">
              <h3>{t("Aucun compte ne correspond.")}</h3>
              <p>{t("Essayez un autre nom ou effacez les filtres.")}</p>
              <Link className="button button-secondary" href="/admin">
                {t("Voir tous les comptes")}
              </Link>
            </div>
          )}
        </div>
        {(pages > 1 || page > 1) && (
          <nav aria-label={t("Pagination des comptes")} className="pagination">
            {page > 1 ? (
              <Link
                className="button button-secondary"
                href={href(page - 1)}
                prefetch={false}
              >
                {t("Précédent")}
              </Link>
            ) : (
              <span />
            )}
            <span>
              {t("Page {page} sur {pages} · {total} comptes", {
                page,
                pages,
                total,
              })}
            </span>
            {page < pages ? (
              <Link
                className="button button-secondary"
                href={href(page + 1)}
                prefetch={false}
              >
                {t("Suivant")}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>

      <section className="admin-audit" aria-labelledby="audit-heading">
        <div className="admin-section-heading">
          <h2 id="audit-heading">{t("Historique des accès")}</h2>
          <span>{t("30 derniers changements")}</span>
        </div>
        <p className="admin-section-description">
          {t(
            "Chaque attribution ou retrait de droits est enregistré avec son auteur.",
          )}
        </p>
        {events.length ? (
          <ol className="admin-events">
            {events.map((event) => (
              <li key={event.id}>
                <span
                  className={`admin-badge ${event.action === "granted" ? "admin-badge-green" : "admin-badge-amber"}`}
                >
                  {event.action === "granted"
                    ? t("Accès accordé")
                    : t("Accès retiré")}
                </span>
                <div>
                  <strong>{event.target_email ?? t("Compte supprimé")}</strong>
                  <p>
                    {t("Par")}{" "}
                    {event.actor_email ??
                      t("Initialisation SQL / compte supprimé")}
                  </p>
                </div>
                <time dateTime={event.created_at}>
                  {new Intl.DateTimeFormat(t.locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Europe/Paris",
                  }).format(new Date(event.created_at))}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="admin-empty-audit">
            {t("Aucun changement de droits enregistré.")}
          </p>
        )}
      </section>
      <p className="admin-footnote">
        {t(
          "Les statistiques incluent les nombres de notes privées, jamais leur contenu. La dernière connexion correspond à l’authentification, pas à une présence en temps réel. Données actualisées au chargement de la page.",
        )}
      </p>
    </div>
  );
}
