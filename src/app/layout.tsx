import type { Metadata } from "next";
import { Telemetry } from "@/components/telemetry";
import { Navbar, Footer } from "@/components/navbar";
import { getUser } from "@/lib/auth";
import { getIsAdmin } from "@/lib/admin";
import { siteUrl } from "@/lib/env";
import "./globals.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Pastly — Collez. Visualisez. Conservez. Partagez.",
    template: "%s · Pastly",
  },
  description:
    "Collez du Markdown, JSON, Mermaid, du code ou du texte. Visualisez sans compte, conservez vos contenus dans votre bibliothèque et partagez-les avec Pastly.",
  applicationName: "Pastly",
  icons: { icon: "/icon.svg" },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  const isAdmin = await getIsAdmin();
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <Navbar user={user} isAdmin={isAdmin} />
        <main id="main" className="site-main">
          {children}
        </main>
        <Footer />
        <Telemetry />
      </body>
    </html>
  );
}
