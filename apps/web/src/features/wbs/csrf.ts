/** Mirrors IAM session cookies (TASK-0101); readable non-HttpOnly cookie for write requests. */
export const CSRF_COOKIE_NAME = "alaira_csrf";
export const CSRF_HEADER_NAME = "x-alaira-csrf";

export function readCsrfTokenFromDocument(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const escaped = CSRF_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  if (!match?.[1]) return undefined;
  return decodeURIComponent(match[1]);
}

export function jsonWriteHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = readCsrfTokenFromDocument();
  if (csrf) {
    headers[CSRF_HEADER_NAME] = csrf;
  }
  return headers;
}
