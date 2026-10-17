/** Login stores the token here (TASK-0101 / auth handoff). */
export const CSRF_SESSION_KEY = "alaira-csrf";
export const CSRF_COOKIE_NAME = "alaira_csrf";
export const CSRF_HEADER_NAME = "x-alaira-csrf";

function readStorage(key: string): string | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  try {
    const value = sessionStorage.getItem(key)?.trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

/** Readable CSRF cookie. The session cookie stays HttpOnly. */
export function readCsrfFromCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const escaped = CSRF_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  if (!match?.[1]) return undefined;
  try {
    const value = decodeURIComponent(match[1]).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

/** Session storage from login, then the readable cookie. */
export function readWriteCsrfToken(): string | undefined {
  return readStorage(CSRF_SESSION_KEY) ?? readCsrfFromCookie();
}

export function hasSessionCredential(): boolean {
  return Boolean(readWriteCsrfToken());
}
