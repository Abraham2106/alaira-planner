import { DomainError } from "../index.js";

export type MembershipRecord = {
  userId: string;
  tenantId: string;
  email: string;
  deactivatedAt: Date | null;
};

export function assertActiveMembership(membership: MembershipRecord): void {
  if (membership.deactivatedAt !== null) {
    throw new DomainError("FORBIDDEN", "Membership deactivated");
  }
}
