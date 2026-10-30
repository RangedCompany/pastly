import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  LayoutGrid,
  LogOut,
  Plus,
  ShieldCheck,
  StickyNote,
  UserRound,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/app/actions/auth";

export function Navbar({
  user,
  isAdmin = false,
}: {
  user: User | null;
  isAdmin?: boolean;
}) {
  return (
    <header className="site-header">
      <nav aria-label="Navigation principale" className="nav-inner">
        <Link href="/" className="brand" aria-label="Pastly, accueil">
          <span className="brand-icon">
            <StickyNote size={22} strokeWidth={2} />
          </span>
          pastly<span className="brand-dot">.</span>
        </Link>
        <div className="nav-links">
          <Link href="/explore">
            <Compass size={17} />
            Explorer
          </Link>
          {user && (
            <Link href="/dashboard">
              <LayoutGrid size={17} />
              Mes post-it
            </Link>
          )}
        </div>
        <div className="nav-actions">
          {user && isAdmin && (
            <Link
              href="/admin"
              className="icon-button"
              aria-label="Administration"
              title="Administration"
            >
              <ShieldCheck size={21} />
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/profile"
                className="icon-button"
                aria-label="Mon profil"
              >
                <UserRound size={20} />
              </Link>
              <form action={signOut}>
                <button
                  className="icon-button"
                  aria-label="Déconnexion"
                  title="Déconnexion"
                >
                  <LogOut size={19} />
                </button>
              </form>
            </>
          ) : (
            <Link className="login-link" href="/login">
              Connexion
            </Link>
          )}
          <Link
            className="button button-primary nav-create"
            href="/notes/new"
            aria-label="Créer une note"
          >
            <Plus size={17} />
            <span>Créer une note</span>
          </Link>
        </div>
      </nav>
      <nav aria-label="Navigation mobile" className="mobile-nav">
        <Link href="/explore">
          <Compass size={17} />
          Explorer
        </Link>
        <Link href="/dashboard">
          <LayoutGrid size={17} />
          Mes post-it
        </Link>
        <Link href={user ? "/profile" : "/signup"}>
          <UserRound size={17} />
          {user ? "Mon profil" : "S’inscrire"}
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/">
        pastly<span className="brand-dot">.</span>
      </Link>
      <p>Les petites idées méritent une place.</p>
      <Link href="/explore" className="footer-explore">
        Un peu d’inspiration
        <ArrowUpRight size={15} />
      </Link>
      <nav className="footer-legal" aria-label="Informations légales">
        <Link href="/terms">Conditions d’utilisation</Link>
        <Link href="/privacy">Confidentialité</Link>
      </nav>
    </footer>
  );
}
