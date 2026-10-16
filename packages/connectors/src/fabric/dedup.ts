import { createHash } from "node:crypto";

export type DedupKeyParts = { provider: string; eventId: string; deliveryId: string };

export function buildWebhookDedupKey(parts: DedupKeyParts): string {
  return `${parts.provider}:${parts.eventId}:${parts.deliveryId}`;
}

export function hashWebhookPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload ?? {}), "utf8").digest("hex");
}
