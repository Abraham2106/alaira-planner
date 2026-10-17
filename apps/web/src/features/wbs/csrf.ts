export {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  readCsrfFromCookie as readCsrfTokenFromDocument,
} from "../../lib/api-client/csrf.js";
import { CSRF_HEADER_NAME, readWriteCsrfToken } from "../../lib/api-client/csrf.js";

export function jsonWriteHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = readWriteCsrfToken();
  if (csrf) {
    headers[CSRF_HEADER_NAME] = csrf;
  }
  return headers;
}
