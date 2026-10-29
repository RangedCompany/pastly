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

function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeZone: "Europe/Paris",
      }).format(new Date(value))
    : "Jamais";
}

export function AdminDashboard({
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
  const { summary, accounts, total, events } = data;
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  function href(n: number) {
    return `/admin?${new URLSearchParams({ q: query, role, page: String(n) })}`;
  }

  return (
    <div className="container admin-page">
      <div className="heading-row">
        <header className="page-heading">
          <span className="eyebrow">LES COULISSES DE PASTLY</span>
          <h1>Administration</h1>
          <p>Les comptes, les post-it et les accès, réunis au même endroit.</p>
        </header>
        <Link
          href={href(page)}
          prefetch={false}
          className="button button-secondary"
        >
          <RefreshCw size={17} aria-hidden="true" />
          Actualiser
        </Link>
      </div>

      <section className="admin-stats" aria-label="Vue d’ensemble">
        <article className="admin-stat">
          <Users size={21} aria-hidden="true" />
          <h2>Comptes créés</h2>
          <strong>{summary.accounts}</strong>
          <p>+{summary.new_accounts_7d} sur les 7 derniers jours</p>
        </article>
        <article className="admin-stat">
          <StickyNote size={21} aria-hidden="true" />
          <h2>Post-it</h2>
          <strong>{summary.notes}</strong>
          <p>
            {summary.public_notes} publics · {summary.private_notes} privés
          </p>
        </article>
        <article className="admin-stat">
          <ShieldCheck size={21} aria-hidden="true" />
          <h2>Administrateurs</h2>
          <strong>{summary.admins}</strong>
          <p>Accès à la supervision et aux droits</p>
        </article>
        <article className="admin-stat">
          <Activity size={21} aria-hidden="true" />
          <h2>Connexions récentes</h2>
          <strong>{summary.sign_ins_7d}</strong>
          <p>Comptes connectés sur les 7 derniers jours</p>
        </article>
      </section>

      <section className="admin-health" aria-labelledby="health-heading">
        <h2 id="health-heading">À suivre</h2>
        <div>
          <Link href="/admin?role=pending">
            {summary.pending} email{summary.pending > 1 ? "s" : ""} à confirmer{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <span>
            {summary.without_notes} compte{summary.without_notes > 1 ? "s" : ""}{" "}
            sans post-it
          </span>
          <span>{summary.new_notes_7d} post-it créés sur 7 jours</span>
          <span className={summary.missing_profiles ? "admin-warning" : ""}>
            {summary.missing_profiles} profil
            {summary.missing_profiles > 1 ? "s" : ""} manquant
            {summary.missing_profiles > 1 ? "s" : ""}
          </span>
        </div>
      </section>

      <section aria-labelledby="accounts-heading">
        <div className="admin-section-heading">
          <h2 id="accounts-heading">Les comptes</h2>
          <span>
            {total} résultat{total > 1 ? "s" : ""}
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
              Rechercher un compte
            </label>
            <input
              id="admin-search"
              type="search"
              name="q"
              defaultValue={query}
              maxLength={100}
              placeholder="Email, pseudo, nom ou identifiant…"
            />
          </div>
          <label className="sr-only" htmlFor="admin-role">
            Filtrer les comptes
          </label>
          <select id="admin-role" name="role" defaultValue={role}>
            <option value="all">Tous les comptes</option>
            <option value="admin">Administrateurs</option>
            <option value="member">Membres</option>
            <option value="pending">Email à confirmer</option>
          </select>
          <button className="button button-primary">Rechercher</button>
          {(query || role !== "all") && (
            <Link href="/admin" className="button button-secondary">
              Effacer les filtres
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
                  <h3>{account.display_name ?? "Profil manquant"}</h3>
                  <p className="admin-email">
                    {account.email ?? "Sans adresse email"}
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
                    {account.is_admin ? "Administrateur" : "Membre"}
                  </span>
                  <span
                    className={`admin-badge ${account.email_confirmed_at ? "" : "admin-badge-amber"}`}
                  >
                    {account.email_confirmed_at
                      ? "Email confirmé"
                      : "Email à confirmer"}
                  </span>
                </div>
              </div>
              <dl className="admin-account-details">
                <div>
                  <dt>Post-it</dt>
                  <dd>
                    <strong>{account.note_count}</strong>{" "}
                    <span>
                      dont {account.public_note_count} publics et{" "}
                      {account.private_note_count} privés
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Inscription</dt>
                  <dd>{date(account.created_at)}</dd>
                </div>
                <div>
                  <dt>Dernière connexion</dt>
                  <dd>{date(account.last_sign_in_at)}</dd>
                </div>
                <div>
                  <dt>Dernier post-it créé</dt>
                  <dd>{date(account.last_note_at)}</dd>
                </div>
              </dl>
              <div className="admin-account-bottom">
                <span className="admin-account-id">ID : {account.id}</span>
                <AdminRoleControl
                  account={account}
                  currentUserId={currentUserId}
                />
              </div>
            </article>
          ))}
          {!accounts.length && (
            <div className="empty-state">
              <h3>Aucun compte ne correspond.</h3>
              <p>Essayez un autre nom ou effacez les filtres.</p>
              <Link className="button button-secondary" href="/admin">
                Voir tous les comptes
              </Link>
            </div>
          )}
        </div>
        {(pages > 1 || page > 1) && (
          <nav aria-label="Pagination des comptes" className="pagination">
            {page > 1 ? (
              <Link
                className="button button-secondary"
                href={href(page - 1)}
                prefetch={false}
              >
                Précédent
              </Link>
            ) : (
              <span />
            )}
            <span>
              Page {page} sur {pages} · {total} comptes
            </span>
            {page < pages ? (
              <Link
                className="button button-secondary"
                href={href(page + 1)}
                prefetch={false}
              >
                Suivant
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>

      <section className="admin-audit" aria-labelledby="audit-heading">
        <div className="admin-section-heading">
          <h2 id="audit-heading">Historique des accès</h2>
          <span>30 derniers changements</span>
        </div>
        <p className="admin-section-description">
          Chaque attribution ou retrait de droits est enregistré avec son
          auteur.
        </p>
        {events.length ? (
          <ol className="admin-events">
            {events.map((event) => (
              <li key={event.id}>
                <span
                  className={`admin-badge ${event.action === "granted" ? "admin-badge-green" : "admin-badge-amber"}`}
                >
                  {event.action === "granted"
                    ? "Accès accordé"
                    : "Accès retiré"}
                </span>
                <div>
                  <strong>{event.target_email ?? "Compte supprimé"}</strong>
                  <p>
                    Par{" "}
                    {event.actor_email ??
                      "Initialisation SQL / compte supprimé"}
                  </p>
                </div>
                <time dateTime={event.created_at}>
                  {new Intl.DateTimeFormat("fr-FR", {
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
            Aucun changement de droits enregistré.
          </p>
        )}
      </section>
      <p className="admin-footnote">
        Les statistiques incluent les nombres de notes privées, jamais leur
        contenu. La dernière connexion correspond à l’authentification, pas à
        une présence en temps réel. Données actualisées au chargement de la
        page.
      </p>
    </div>
  );
}
