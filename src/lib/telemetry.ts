// Les recherches de comptes de l'administration peuvent contenir des emails.
export function excludeAdminTelemetry<T extends { url: string }>(
  event: T,
): T | null {
  try {
    const url = new URL(event.url, "https://pastly.invalid");
    if (
      ["/admin", "/dashboard", "/notes", "/auth", "/reset-password"].some(
        (path) => url.pathname === path || url.pathname.startsWith(path + "/"),
      )
    )
      return null;
    // Search terms can quote a private document. Never send query strings or fragments.
    if (url.search || url.hash) {
      url.search = "";
      url.hash = "";
      return {
        ...event,
        url: event.url.startsWith("/") ? url.pathname : url.toString(),
      };
    }
    return event;
  } catch {
    return null;
  }
}
