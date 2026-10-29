"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-page">
      <span className="eyebrow">PETIT CONTRETEMPS</span>
      <h1>Une idée s’est égarée.</h1>
      <p>
        Nous n’avons pas pu charger cette page. Vérifiez votre connexion et
        réessayez dans un instant.
      </p>
      <button className="button button-primary" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
