import DOMPurify from "dompurify";
export function sanitizeSvg(svg: string) {
  const clean = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: [
      "foreignObject",
      "a",
      "image",
      "animate",
      "animateMotion",
      "animateTransform",
      "set",
    ],
    FORBID_ATTR: ["href", "xlink:href"],
  });
  const doc = new DOMParser().parseFromString(clean, "image/svg+xml");
  if (
    doc.querySelector("parsererror") ||
    doc.documentElement.localName !== "svg"
  )
    throw new Error("Fichier SVG invalide.");
  // Only local fragment references are allowed in styles and presentation attributes.
  for (const element of doc.querySelectorAll("*")) {
    for (const attr of [...element.attributes]) {
      if (
        /url\s*\(\s*["']?(?!#)/i.test(attr.value) ||
        /@import|javascript:|https?:|data:/i.test(attr.value)
      )
        element.removeAttribute(attr.name);
    }
    if (
      element.localName === "style" &&
      /@import|url\s*\(\s*["']?(?!#)/i.test(element.textContent ?? "")
    )
      element.remove();
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}
