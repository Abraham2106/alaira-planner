import type { RawConnectorEvent } from "../sdk/types.js";

const FAKE_PROVIDER = "fake-reference";

export const SYNTHETIC_TENANT_ID =
  "018f0000-0000-7000-8000-0000000000a1";
export const SYNTHETIC_CONNECTION_ID = "conn_fake_001";
export const SYNTHETIC_PROJECT_ID =
  "018f0000-0000-7000-8000-000000000101";
export const SYNTHETIC_WORK_ITEM_ID =
  "018f0000-0000-7000-8000-000000000201";
export const SYNTHETIC_USER_ID =
  "018f0000-0000-7000-8000-000000000301";

export function syntheticLifecyclePayload(): RawConnectorEvent {
  return {
    provider: FAKE_PROVIDER,
    deliveryId: "dlv_fake_lifecycle_001",
    eventId: "evt_fake_pr_merged_001",
    resourceId: "artifact_fake_pr_42",
    receivedAt: "2026-10-15T18:00:00.000Z",
    payload: {
      kind: "pull_request",
      action: "merged",
      title: "[SYNTHETIC] API payments design",
      branch: "feature/WP-14-payments",
    },
  };
}

export function syntheticIntentPayload(): RawConnectorEvent {
  return {
    provider: FAKE_PROVIDER,
    deliveryId: "dlv_fake_intent_001",
    eventId: "evt_fake_intent_001",
    resourceId: "channel_fake_general",
    receivedAt: "2026-10-15T18:05:00.000Z",
    payload: {
      kind: "message",
      text: "[SYNTHETIC] @Alaira mark task X complete in project Y",
      channel: "general",
    },
  };
}

export function syntheticActivityPayload(): RawConnectorEvent {
  return {
    provider: FAKE_PROVIDER,
    deliveryId: "dlv_fake_activity_001",
    eventId: "evt_fake_commit_001",
    resourceId: "repo_fake_api",
    receivedAt: "2026-10-15T18:10:00.000Z",
    payload: {
      kind: "commit",
      sha: "abc123synthetic",
      message: "[SYNTHETIC] chore: adjust logging",
    },
  };
}

export function syntheticBackfillBatch(): RawConnectorEvent[] {
  return [
    syntheticLifecyclePayload(),
    syntheticActivityPayload(),
  ];
}
