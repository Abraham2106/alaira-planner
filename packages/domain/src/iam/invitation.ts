import { DomainError } from "../index.js";

export type InvitationRecord = {
  id: string;
  tenantId: string;
  email: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export function assertInvitationAcceptable(
  invitation: InvitationRecord,
  now: Date,
): void {
  if (invitation.usedAt !== null) {
    throw new DomainError("CONFLICT", "Invitation already used");
  }
  if (invitation.expiresAt.getTime() <= now.getTime()) {
    throw new DomainError("FORBIDDEN", "Invitation expired");
  }
}
