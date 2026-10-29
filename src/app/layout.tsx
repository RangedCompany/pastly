import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/navbar";
import { getUser } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import "./globals.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Pastly — Les petites idées méritent une place",
    template: "%s · Pastly",
  },
  description:
    "Un coin chaleureux pour poser vos idées, créer des post-it colorés et partager un peu d’inspiration. Ou garder vos mots rien que pour vous.",
  applicationName: "Pastly",
  icons: { icon: "/icon.svg" },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <Navbar user={user} />
        <main id="main" className="site-main">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
