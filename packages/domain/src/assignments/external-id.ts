const PREFIXES = {
  person: "prs_",
  assignment: "asn_",
} as const;

export type AssignmentExternalIdKind = keyof typeof PREFIXES;

export function toAssignmentExternalId(kind: AssignmentExternalIdKind, uuid: string): string {
  const normalized = uuid.replace(/-/g, "").toLowerCase();
  return `${PREFIXES[kind]}${normalized}`;
}

export function parseAssignmentExternalId(
  external: string,
  kind: AssignmentExternalIdKind,
): string | null {
  const prefix = PREFIXES[kind];
  if (!external.startsWith(prefix)) return null;
  const hex = external.slice(prefix.length);
  if (!/^[0-9a-f]{32}$/i.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
