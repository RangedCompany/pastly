"use client";
import { useTranslations } from "@/components/i18n";
import { useMemo, useState } from "react";
export default function TableRenderer({ rows }: { rows: string[][] }) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{
    index: number;
    ascending: boolean;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [header = [], ...data] = rows;
  const filtered = useMemo(() => {
    const result = data.filter((row) =>
      row.some((cell) =>
        cell
          .toLocaleLowerCase(t.locale)
          .includes(query.toLocaleLowerCase(t.locale)),
      ),
    );
    if (sort)
      result.sort(
        (a, b) =>
          (a[sort.index] ?? "").localeCompare(b[sort.index] ?? "", t.locale, {
            numeric: true,
          }) * (sort.ascending ? 1 : -1),
      );
    return result;
  }, [data, query, sort, t.locale]);
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 100) - 1),
  );
  return (
    <div className="table-view">
      <div className="render-toolbar">
        <label>
          {t("Rechercher dans le tableau")}{" "}
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <span>
          {filtered.length} {t("lignes ·")} {header.length} {t("colonnes")}
        </span>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={t("Tableau de données")}
      >
        <table>
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th
                  key={i}
                  scope="col"
                  aria-sort={
                    sort?.index === i
                      ? sort.ascending
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSort({
                        index: i,
                        ascending: sort?.index === i ? !sort.ascending : true,
                      });
                      setPage(0);
                    }}
                  >
                    {cell || t("Colonne {number}", { number: i + 1 })}{" "}
                    {sort?.index === i ? (sort.ascending ? "↑" : "↓") : "↕"}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered
              .slice(current * 100, (current + 1) * 100)
              .map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 100 && (
        <div className="render-toolbar">
          <button
            className="button button-secondary"
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            {t("Précédent")}
          </button>
          <span>
            {t("Page")} {current + 1} / {Math.ceil(filtered.length / 100)}
          </span>
          <button
            className="button button-secondary"
            type="button"
            disabled={(current + 1) * 100 >= filtered.length}
            onClick={() => setPage(current + 1)}
          >
            {t("Suivant")}
          </button>
        </div>
      )}
      <p className="viewer-hint">
        {t(
          "La première ligne sert d’en-tête. Le téléchargement conserve le fichier original, sans appliquer le tri.",
        )}
      </p>
    </div>
  );
}
