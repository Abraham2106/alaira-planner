import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_SESSION_KEY,
  readWriteCsrfToken,
} from "../../lib/api-client/csrf.js";
import { clearActiveProjectId } from "../../lib/session/active-project.js";

export { CSRF_SESSION_KEY };

const LOGIN_FALLBACK = "No se pudo entrar.";
const REGISTER_FALLBACK = "No se pudo registrar.";
const LOGOUT_FALLBACK = "No se pudo cerrar la sesión.";

export type LoginBody = {
  tenantSlug: string;
  email: string;
  password: string;
};

export type RegisterBody = {
  organizationName: string;
  slug: string;
  ownerEmail: string;
  ownerDisplayName: string;
  password: string;
};

export function messageFromPayload(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }
  const error = record.error;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object") {
    const nested = (error as Record<string, unknown>).message;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return fallback;
}

async function readFailure(response: Response, fallback: string): Promise<string> {
  try {
    const payload: unknown = await response.json();
    return messageFromPayload(payload, fallback);
  } catch {
    return fallback;
  }
}

function saveCsrfToken(token: string): void {
  sessionStorage.setItem(CSRF_SESSION_KEY, token);
}

export function readStoredCsrfToken(): string | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  const token = sessionStorage.getItem(CSRF_SESSION_KEY)?.trim();
  return token || undefined;
}

export function clearStoredCsrf(): void {
  try {
    sessionStorage.removeItem(CSRF_SESSION_KEY);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.cookie = `${CSRF_COOKIE_NAME}=; Max-Age=0; path=/`;
  }
}

/** Revokes the server session. Local credentials stay until the POST succeeds. */
export async function logoutRequest(): Promise<void> {
  const token = readWriteCsrfToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers[CSRF_HEADER_NAME] = token;

  let response: Response;
  try {
    response = await fetch("/api/v1/iam/auth/logout", {
      method: "POST",
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error(LOGOUT_FALLBACK);
  }

  if (!response.ok) {
    throw new Error(await readFailure(response, LOGOUT_FALLBACK));
  }

  clearStoredCsrf();
  clearActiveProjectId();
  if (typeof window !== "undefined" && window.location.hash !== "#/entrar") {
    window.location.hash = "#/entrar";
  }
}

export async function loginRequest(body: LoginBody): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/v1/iam/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(LOGIN_FALLBACK);
  }

  if (!response.ok) {
    throw new Error(await readFailure(response, LOGIN_FALLBACK));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(LOGIN_FALLBACK);
  }

  const token =
    payload && typeof payload === "object"
      ? (payload as { csrfToken?: unknown }).csrfToken
      : undefined;
  if (typeof token !== "string" || !token) {
    throw new Error(LOGIN_FALLBACK);
  }
  saveCsrfToken(token);
}

export async function registerRequest(body: RegisterBody): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/v1/iam/tenants/register", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(REGISTER_FALLBACK);
  }

  if (!response.ok) {
    throw new Error(await readFailure(response, REGISTER_FALLBACK));
  }
}
