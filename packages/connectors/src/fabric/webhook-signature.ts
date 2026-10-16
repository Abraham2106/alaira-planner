import { createHmac, timingSafeEqual } from "node:crypto";

export const FABRIC_SIGNATURE_HEADER = "x-alaira-signature";
export const FABRIC_TIMESTAMP_HEADER = "x-alaira-timestamp";
export const FABRIC_DELIVERY_ID_HEADER = "x-alaira-delivery-id";

const DEFAULT_TOLERANCE_SEC = 300;

export type VerifyWebhookInput = {
  signingSecret: string;
  rawBody: string | Buffer;
  timestampHeader: string;
  signatureHeader: string;
  nowMs?: number;
  toleranceSec?: number;
};

export type VerifyWebhookResult =
  | { ok: true; timestampSec: number }
  | { ok: false; reason: "missing_headers" | "stale_timestamp" | "invalid_signature" };

export function signWebhookPayload(
  signingSecret: string,
  timestampSec: number,
  rawBody: string | Buffer,
): string {
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const signed = `${timestampSec}.${body}`;
  return `sha256=${createHmac("sha256", signingSecret).update(signed, "utf8").digest("hex")}`;
}

export function verifyWebhookSignature(input: VerifyWebhookInput): VerifyWebhookResult {
  const { signingSecret, rawBody, timestampHeader, signatureHeader } = input;
  if (!timestampHeader?.trim() || !signatureHeader?.trim()) {
    return { ok: false, reason: "missing_headers" };
  }
  const timestampSec = Number(timestampHeader.trim());
  if (!Number.isFinite(timestampSec)) {
    return { ok: false, reason: "invalid_signature" };
  }
  const nowSec = Math.floor((input.nowMs ?? Date.now()) / 1000);
  if (Math.abs(nowSec - timestampSec) > (input.toleranceSec ?? DEFAULT_TOLERANCE_SEC)) {
    return { ok: false, reason: "stale_timestamp" };
  }
  const expected = signWebhookPayload(signingSecret, timestampSec, rawBody);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader.trim(), "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid_signature" };
  }
  return { ok: true, timestampSec };
}
