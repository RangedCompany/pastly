import Link from "next/link";
export default function NotFound() {
  return (
    <div className="error-page">
      <span className="eyebrow">404 · RIEN À CET ENDROIT</span>
      <h1>Ce petit coin est vide.</h1>
      <p>
        Cette page n’existe pas ou n’est pas accessible. D’autres idées vous
        attendent dans Explorer.
      </p>
      <Link href="/explore" className="button button-primary">
        Retourner dans Explorer
      </Link>
    </div>
  );
}
