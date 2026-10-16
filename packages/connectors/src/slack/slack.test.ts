import { describe, expect, it } from "vitest";
import { classifySlackIntent } from "./intent.js";
import { normalizeSlackMention } from "./normalize.js";
import { syntheticSlackWebhookBody } from "./synthetic.js";

describe("TASK-0121 slack normalizer (80/20)", () => {
  it("parses complete_work_item intent", () => {
    const intent = classifySlackIntent(
      "<@UBOT> mark API design complete in Project Checkout",
    );
    expect(intent).toEqual({
      kind: "complete_work_item",
      workItemHint: "API design",
      projectHint: "Project Checkout",
    });
  });

  it("ambiguous phrase does not imply complete_work_item", () => {
    const intent = classifySlackIntent("<@UBOT> mark something as complete");
    expect(intent.kind).toBe("ambiguous");
  });

  it("normalize builds dedup key for slack provider", () => {
    const body = syntheticSlackWebhookBody("001", "mark Task A complete in Proj B");
    const norm = normalizeSlackMention(body.eventId, body.deliveryId, body.payload);
    expect(norm.provider).toBe("slack");
    expect(norm.dedupKey).toContain("slack");
    expect(norm.intent.kind).toBe("complete_work_item");
  });
});
