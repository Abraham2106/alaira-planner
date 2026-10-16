import type { TenantId } from "@alaira/domain";

/** Deterministic UUIDv7-style ids for synthetic fixtures (never production data). */
export function syntheticUuid(suffix: string): string {
  const tail = suffix.replace(/[^0-9a-f]/gi, "").padStart(12, "0").slice(0, 12);
  return `018f0000-0000-7000-8000-${tail}`;
}

export const TENANT_A_ID = "018f0000-0000-7000-8000-000000000001" as TenantId;
export const TENANT_B_ID = "018f0000-0000-7000-8000-000000000002" as TenantId;

/** @deprecated Use TENANT_A_ID / syntheticUuid */
export function syntheticTenantId(label: string): string {
  return syntheticUuid(label);
}
