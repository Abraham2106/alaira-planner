const API_V1_PREFIX = "/api/v1";

/** Ensures every request targets the public v1 API surface (no private UI routes). */
export function toApiV1Path(segment: string): string {
  const trimmed = segment.replace(/^\/+/, "");
  if (trimmed.startsWith("api/") && !trimmed.startsWith("api/v1/")) {
    throw new Error("Only /api/v1 public endpoints are allowed");
  }
  if (trimmed.startsWith("api/v1/")) {
    return `/${trimmed}`;
  }
  return `${API_V1_PREFIX}/${trimmed}`;
}

export { API_V1_PREFIX };
