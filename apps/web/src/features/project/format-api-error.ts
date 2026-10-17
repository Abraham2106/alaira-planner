import { hasSessionCredential } from "../../lib/api-client/csrf.js";
import { ApiClientError } from "../../lib/api-client/errors.js";

const TENANT_LEAK_PATTERN = /tenant|org_|prj_[a-z0-9]+.*other/i;

function safeMessage(text: string): string | null {
  if (TENANT_LEAK_PATTERN.test(text)) return null;
  return text;
}

function failureText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const record = body as Record<string, unknown>;
  const chunks: string[] = [];
  if (typeof record.error === "string") chunks.push(record.error);
  if (typeof record.message === "string") chunks.push(record.message);
  const nested = record.error;
  if (nested && typeof nested === "object") {
    const message = (nested as { message?: unknown }).message;
    if (typeof message === "string") chunks.push(message);
  }
  return chunks.join(" ").toLowerCase();
}

function failureCode(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const code = (body as { error?: unknown }).error;
  return typeof code === "string" ? code.trim().toLowerCase() : "";
}

/** Maps API failures to user-safe copy (no cross-tenant payload leakage). */
export function formatApiError(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Error inesperado. Reintenta más tarde.";
  }
  if (error.status === 404) {
    return "Recurso no encontrado o no disponible en tu espacio de trabajo.";
  }
  if (error.status === 401) {
    return "Sesión requerida. Inicia sesión para continuar.";
  }
  if (error.status === 403) {
    const text = failureText(error.body);
    if (text.includes("missing session") || text.includes("sesión ausente")) {
      return "No hay sesión activa. Entrá para continuar.";
    }
    if (
      text.includes("invalid session") ||
      text.includes("expired") ||
      text.includes("caduc") ||
      text.includes("revoked")
    ) {
      return "La sesión caducó. Volvé a entrar.";
    }
    if (failureCode(error.body) === "forbidden" && !hasSessionCredential()) {
      return "No hay sesión activa. Entrá para continuar.";
    }
    return "No tienes permiso para esta acción.";
  }
  if (error.body && typeof error.body === "object" && error.body !== null) {
    const record = error.body as Record<string, unknown>;
    const nested = record.error;
    if (nested && typeof nested === "object" && nested !== null) {
      const message = (nested as { message?: unknown }).message;
      if (typeof message === "string") {
        const safe = safeMessage(message);
        if (safe) return safe;
      }
    }
    const topMessage = record.message;
    if (typeof topMessage === "string") {
      const safe = safeMessage(topMessage);
      if (safe) return safe;
    }
  }
  return `No se pudo completar la solicitud (HTTP ${error.status}).`;
}
