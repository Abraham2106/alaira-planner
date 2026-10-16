import type { ProjectAuditEvent } from "./types.js";

/** REQ-097: human-readable line reconstructing what changed and why. */
export function formatReadableAuditEntry(event: ProjectAuditEvent): string {
  const segments = [event.summary];
  if (event.evidenceRef) {
    segments.push(`evidence=${event.evidenceRef}`);
  }
  if (event.effect) {
    segments.push(`effect=${event.effect}`);
  }
  if (event.causationId) {
    segments.push(`because=${event.causationId}`);
  }
  return segments.join(" · ");
}
