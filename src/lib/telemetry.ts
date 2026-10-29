// Les recherches de comptes de l'administration peuvent contenir des emails.
export function excludeAdminTelemetry<T extends { url: string }>(
  event: T,
): T | null {
  try {
    const { pathname } = new URL(event.url, "https://pastly.invalid");
    return pathname === "/admin" || pathname.startsWith("/admin/")
      ? null
      : event;
  } catch {
    return null;
  }
}
