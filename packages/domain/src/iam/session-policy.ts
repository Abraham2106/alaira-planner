import { DomainError } from "../index.js";

export type SessionTimestamps = {
  expiresAt: Date;
  absoluteExpiresAt: Date;
  lastActivityAt: Date;
  revokedAt: Date | null;
};

/** Idle window after last activity; absolute cap is enforced separately. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;

export function assertSessionActive(
  session: SessionTimestamps,
  now: Date,
): void {
  if (session.revokedAt !== null) {
    throw new DomainError("FORBIDDEN", "Invalid session");
  }
  if (session.expiresAt.getTime() <= now.getTime()) {
    throw new DomainError("FORBIDDEN", "Invalid session");
  }
  if (session.absoluteExpiresAt.getTime() <= now.getTime()) {
    throw new DomainError("FORBIDDEN", "Invalid session");
  }
}

export function nextSessionExpiry(
  lastActivityAt: Date,
  absoluteExpiresAt: Date,
  now: Date,
): Date {
  const idleCap = new Date(now.getTime() + SESSION_IDLE_MS);
  return idleCap.getTime() < absoluteExpiresAt.getTime()
    ? idleCap
    : absoluteExpiresAt;
}
