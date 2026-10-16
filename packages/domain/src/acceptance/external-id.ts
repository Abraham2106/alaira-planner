const PREFIXES = {
  acceptanceDecision: "acd_",
  progressStrategy: "pgs_",
} as const;

export type AcceptanceExternalIdKind = keyof typeof PREFIXES;

export function toAcceptanceExternalId(kind: AcceptanceExternalIdKind, uuid: string): string {
  const normalized = uuid.replace(/-/g, "").toLowerCase();
  return `${PREFIXES[kind]}${normalized}`;
}

export function parseAcceptanceExternalId(
  external: string,
  kind: AcceptanceExternalIdKind,
): string | null {
  const prefix = PREFIXES[kind];
  if (!external.startsWith(prefix)) return null;
  const hex = external.slice(prefix.length);
  if (!/^[0-9a-f]{32}$/i.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
