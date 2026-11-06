import { getTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Telemetry } from "@/components/telemetry";
import { Navbar, Footer } from "@/components/navbar";
import { getIdentity } from "@/lib/auth";
import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getIsAdmin } from "@/lib/admin";
import { siteUrl } from "@/lib/env";
import "./globals.css";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "@/components/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: t("Pastly — Collez. Visualisez. Conservez. Partagez."),
      template: "%s · Pastly",
    },
    description: t(
      "Collez du Markdown, JSON, Mermaid, du code ou du texte. Visualisez sans compte, conservez vos contenus dans votre bibliothèque et partagez-les avec Pastly.",
    ),
    applicationName: "Pastly",
    icons: { icon: "/icon.svg" },
  };
}
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, messages, t } = await getI18n();
  const user = await getIdentity();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          <a className="skip-link" href="#main">
            {t("Aller au contenu")}
          </a>
          <Navbar
            user={user}
            adminControl={
              user ? (
                <Suspense fallback={null}>
                  <AdminLink />
                </Suspense>
              ) : null
            }
          />
          <main id="main" className="site-main">
            {children}
          </main>
          <Footer />
          <Telemetry />
        </I18nProvider>
      </body>
    </html>
  );
}

async function AdminLink() {
  const t = await getTranslations();
  if (!(await getIsAdmin())) return null;
  return (
    <Link
      href="/admin"
      className="icon-button"
      aria-label={t("Administration")}
      title={t("Administration")}
    >
      <ShieldCheck size={21} />
    </Link>
  );
}
