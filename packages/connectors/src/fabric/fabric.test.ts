import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, resolveFabricMasterKey } from "./crypto.js";
import { buildWebhookDedupKey, hashWebhookPayload } from "./dedup.js";
import { redactForLog } from "./redact.js";
import { SYNTHETIC_OAUTH_TOKEN, SYNTHETIC_WEBHOOK_SECRET } from "./test-vectors.js";
import { signWebhookPayload, verifyWebhookSignature } from "./webhook-signature.js";

describe("connector fabric (TASK-0119)", () => {
  it("encrypt/decrypt roundtrip", () => {
    const key = resolveFabricMasterKey();
    expect(decryptSecret(encryptSecret(SYNTHETIC_OAUTH_TOKEN, key), key)).toBe(
      SYNTHETIC_OAUTH_TOKEN,
    );
  });

  it("HMAC verify", () => {
    const body = "{}";
    const ts = 1_700_000_000;
    const sig = signWebhookPayload(SYNTHETIC_WEBHOOK_SECRET, ts, body);
    expect(
      verifyWebhookSignature({
        signingSecret: SYNTHETIC_WEBHOOK_SECRET,
        rawBody: body,
        timestampHeader: String(ts),
        signatureHeader: sig,
        nowMs: ts * 1000,
      }).ok,
    ).toBe(true);
  });

  it("stale timestamp", () => {
    const ts = 1_000;
    const sig = signWebhookPayload(SYNTHETIC_WEBHOOK_SECRET, ts, "{}");
    expect(
      verifyWebhookSignature({
        signingSecret: SYNTHETIC_WEBHOOK_SECRET,
        rawBody: "{}",
        timestampHeader: String(ts),
        signatureHeader: sig,
        nowMs: 9_000_000_000,
      }).reason,
    ).toBe("stale_timestamp");
  });

  it("dedup + hash", () => {
    expect(buildWebhookDedupKey({ provider: "f", eventId: "e", deliveryId: "d" })).toBe("f:e:d");
    expect(hashWebhookPayload({ a: 1 })).toBe(hashWebhookPayload({ a: 1 }));
  });

  it("TC-SEC-05 redact", () => {
    const o = redactForLog({ access_token: SYNTHETIC_OAUTH_TOKEN }) as Record<string, unknown>;
    expect(o.access_token).toBe("[redacted]");
  });
});
