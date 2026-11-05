"use client";
import { useState } from "react";
import { CopyButton } from "./copy-button";
function stringify(value: unknown) {
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  return JSON.stringify(value, null, 2) ?? String(value);
}
function TreeNode({
  name,
  value,
  depth,
  openDepth,
}: {
  name: string;
  value: unknown;
  depth: number;
  openDepth: number;
}) {
  const [limit, setLimit] = useState(50);
  const [open, setOpen] = useState(depth < openDepth);
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const entries = Object.entries(value);
    return (
      <details
        className="tree-node"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary>
          <strong>{name}</strong>{" "}
          <span className="tree-type">
            {Array.isArray(value) ? "Tableau" : "Objet"} · {entries.length}
          </span>
        </summary>
        {open && (
          <>
            <CopyButton value={stringify(value)} label="Copier la valeur" />
            <div className="tree-children">
              {entries.slice(0, limit).map(([key, child]) => (
                <TreeNode
                  key={key}
                  name={key}
                  value={child}
                  depth={depth + 1}
                  openDepth={openDepth}
                />
              ))}
              {entries.length > limit && (
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => setLimit(limit + 50)}
                >
                  Afficher 50 valeurs de plus ({entries.length - limit}{" "}
                  restantes)
                </button>
              )}
            </div>
          </>
        )}
      </details>
    );
  }
  return (
    <div className="tree-leaf">
      <strong>{name}</strong>
      <span className={`value-${value === null ? "null" : typeof value}`}>
        {stringify(value)}
      </span>
      <CopyButton
        value={typeof value === "string" ? value : stringify(value)}
        label="Copier la valeur"
      />
    </div>
  );
}
export default function StructuredRenderer({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(1);
  return (
    <div className="structured-view">
      <div className="render-toolbar">
        <button
          className="button button-quiet"
          type="button"
          onClick={() => setExpanded(3)}
        >
          Déplier 3 niveaux
        </button>
        <button
          className="button button-quiet"
          type="button"
          onClick={() => setExpanded(0)}
        >
          Tout replier
        </button>
      </div>
      <TreeNode
        key={expanded}
        name="racine"
        value={value}
        depth={0}
        openDepth={expanded}
      />
    </div>
  );
}
