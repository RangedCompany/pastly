import Link from "next/link";
import { legal } from "@/lib/legal";

export function LegalContact() {
  return (
    <address>
      {legal.publisher}
      <br />
      {legal.address}
      <br />
      <a href={`mailto:${legal.email}`}>{legal.email}</a>
    </address>
  );
}

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="legal-page">
      <header className="page-heading">
        <span className="eyebrow">PASTLY, EN TOUTE TRANSPARENCE</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <p className="legal-updated">
          Mise à jour le{" "}
          <time dateTime={legal.updatedAtIso}>{legal.updatedAt}</time>
        </p>
      </header>
      <nav className="legal-navigation" aria-label="Informations légales">
        <Link href="/terms">Conditions d’utilisation</Link>
        <Link href="/privacy">Politique de confidentialité</Link>
      </nav>
      <div className="legal-content">{children}</div>
    </article>
  );
}
