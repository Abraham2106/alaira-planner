import { ApiClientError } from "../../lib/api-client/errors.js";

const TENANT_LEAK_PATTERN = /tenant|org_|prj_[a-z0-9]+.*other/i;

function safeMessage(text: string): string | null {
  if (TENANT_LEAK_PATTERN.test(text)) return null;
  return text;
}

/** Maps API failures to user-safe copy (no cross-tenant payload leakage). */
export function formatApiError(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Error inesperado. Reintenta más tarde.";
  }
  if (error.status === 404) {
    return "Recurso no encontrado o no disponible en tu espacio de trabajo.";
  }
  if (error.status === 403) {
    return "No tienes permiso para esta acción.";
  }
  if (error.status === 401) {
    return "Sesión requerida. Inicia sesión para continuar.";
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
