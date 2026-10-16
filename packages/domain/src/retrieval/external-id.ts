const PREFIX = "rtc_";

export function toRetrievalChunkExternalId(uuid: string): string {
  const normalized = uuid.replace(/-/g, "").toLowerCase();
  return `${PREFIX}${normalized}`;
}

export function parseRetrievalChunkExternalId(external: string): string | null {
  if (!external.startsWith(PREFIX)) return null;
  const hex = external.slice(PREFIX.length);
  if (!/^[0-9a-f]{32}$/i.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
