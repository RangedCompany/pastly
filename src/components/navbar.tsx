import { getTranslations } from "@/lib/i18n/server";
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
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import { LanguagePicker } from "./language-picker";

export async function Navbar({
  user,
  isAdmin = false,
  adminControl,
}: {
  user: Pick<User, "id"> | null;
  isAdmin?: boolean;
  adminControl?: ReactNode;
}) {
  const t = await getTranslations();
  return (
    <header className="site-header">
      <nav aria-label={t("Navigation principale")} className="nav-inner">
        <Link href="/" className="brand" aria-label={t("Pastly, accueil")}>
          <span className="brand-icon">
            <StickyNote size={22} strokeWidth={2} />
          </span>
          pastly<span className="brand-dot">.</span>
        </Link>
        <div className="nav-links">
          <Link href="/explore">
            <Compass size={17} />
            {t("Explorer")}
          </Link>
          {user && (
            <Link href="/dashboard">
              <LayoutGrid size={17} />
              {t("Ma bibliothèque")}
            </Link>
          )}
        </div>
        <div className="nav-actions">
          {adminControl}
          {user && isAdmin && (
            <Link
              href="/admin"
              className="icon-button"
              aria-label={t("Administration")}
              title={t("Administration")}
            >
              <ShieldCheck size={21} />
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/profile"
                className="icon-button"
                aria-label={t("Mon profil")}
              >
                <UserRound size={20} />
              </Link>
              <form action={signOut}>
                <button
                  className="icon-button"
                  aria-label={t("Déconnexion")}
                  title={t("Déconnexion")}
                >
                  <LogOut size={19} />
                </button>
              </form>
            </>
          ) : (
            <Link className="login-link" href="/login">
              {t("Connexion")}
            </Link>
          )}
          <Link
            className="button button-primary nav-create"
            href="/"
            aria-label={t("Nouveau contenu")}
          >
            <Plus size={17} />
            <span>{t("Nouveau contenu")}</span>
          </Link>
        </div>
      </nav>
      <nav aria-label={t("Navigation mobile")} className="mobile-nav">
        <Link href="/explore">
          <Compass size={17} />
          {t("Explorer")}
        </Link>
        <Link href="/dashboard">
          <LayoutGrid size={17} />
          {t("Ma bibliothèque")}
        </Link>
        <Link href={user ? "/profile" : "/signup"}>
          <UserRound size={17} />
          {user ? t("Mon profil") : t("S’inscrire")}
        </Link>
      </nav>
    </header>
  );
}
export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/">
        pastly<span className="brand-dot">.</span>
      </Link>
      <p>{t("Collez. Visualisez. Conservez. Partagez.")}</p>
      <Link href="/explore" className="footer-explore">
        {t("Un peu d’inspiration")}
        <ArrowUpRight size={15} />
      </Link>
      <nav className="footer-legal" aria-label={t("Informations légales")}>
        <LanguagePicker />
        <Link href="/terms">{t("Conditions d’utilisation")}</Link>
        <Link href="/privacy">{t("Confidentialité")}</Link>
      </nav>
    </footer>
  );
}
