import { Sprout } from "lucide-react";
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <aside className="auth-story" aria-hidden="true">
        <span className="eyebrow">BIENVENUE DANS VOTRE ATELIER</span>
        <h2>
          Faites une place
          <br />à vos idées.
        </h2>
        <div className="demo-note paper-yellow">
          <span className="tape" />
          <h3>Note à moi-même</h3>
          <p>
            Les petites choses peuvent
            <br />
            être de grands débuts.
          </p>
          <Sprout size={24} className="demo-mark" />
        </div>
        <p>Un peu de papier. Beaucoup de possibilités.</p>
      </aside>
      <section className="auth-panel">
        <span className="eyebrow">PASTLY, TOUT SIMPLEMENT</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </section>
    </div>
  );
}
