const PREFIXES = {
  tenant: "tnt_",
  user: "usr_",
  invitation: "inv_",
} as const;

export type ExternalIdKind = keyof typeof PREFIXES;

export function toExternalId(kind: ExternalIdKind, uuid: string): string {
  const normalized = uuid.replace(/-/g, "").toLowerCase();
  return `${PREFIXES[kind]}${normalized}`;
}

export function parseExternalId(
  external: string,
  kind: ExternalIdKind,
): string | null {
  const prefix = PREFIXES[kind];
  if (!external.startsWith(prefix)) return null;
  const hex = external.slice(prefix.length);
  if (!/^[0-9a-f]{32}$/i.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
