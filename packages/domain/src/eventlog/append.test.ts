import { describe, expect, it } from "vitest";
import type { ActorContext, TenantId } from "../index.js";
import { buildCompensatingAuditEventInput, buildProjectAuditEvent } from "./append.js";
import { formatReadableAuditEntry } from "./readable.js";

const tenant = "018f0000-0000-7000-8000-000000000001" as TenantId;
const actor: ActorContext = {
  tenantId: tenant,
  userId: "018f0000-0000-7000-8000-0000000000aa",
  roles: ["member"],
};

describe("eventlog domain", () => {
  it("formats readable entry with evidence and causation", () => {
    const event = buildProjectAuditEvent(
      actor,
      "018f0000-0000-7000-8000-0000000000bb",
      tenant,
      {
        eventType: "deliverable.accepted",
        summary: "Deliverable A accepted",
        evidenceRef: "evidence:pr-42",
        effect: "schedule_recalc_queued",
        causationId: "018f0000-0000-7000-8000-0000000000cc",
      },
      "018f0000-0000-7000-8000-0000000000dd",
      "2026-01-01T00:00:00.000Z",
      1,
    );
    expect(formatReadableAuditEntry(event)).toBe(
      "Deliverable A accepted · evidence=evidence:pr-42 · effect=schedule_recalc_queued · because=018f0000-0000-7000-8000-0000000000cc",
    );
  });

  it("compensation is modeled as a new event type", () => {
    const input = buildCompensatingAuditEventInput(
      "deliverable.accepted",
      "Reviewer reversed acceptance",
      "018f0000-0000-7000-8000-0000000000cc",
    );
    expect(input.eventType).toBe("deliverable.accepted.compensated");
    expect(input.effect).toBe("compensating_entry");
  });
});
