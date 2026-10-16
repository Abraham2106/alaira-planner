import { evidenceEffectForEventType } from "../sdk/effect.js";
import type {
  EvidenceEffect,
  ExternalActor,
  NormalizedEventKind,
  RawConnectorEvent,
} from "../sdk/types.js";

export const GITHUB_PROVIDER = "github";

export type GithubWebhookEnvelope = Record<string, unknown>;

export type GithubLinkHint = {
  workNodeId: string | null;
  projectId: string | null;
  confidence: number;
  linkState?: "proposed" | "confirmed" | "unlinked";
  linkMethod?: "rule" | "ai" | "manual" | "none";
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function readNumber(obj: Record<string, unknown>, key: string): number | null {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function parseRepositoryFullName(payload: GithubWebhookEnvelope): string | null {
  const repo = asRecord(payload.repository);
  return repo ? readString(repo, "full_name") : null;
}

export function extractLinkedIssueNumber(payload: GithubWebhookEnvelope): number | null {
  const explicit = readNumber(payload, "linked_issue_number");
  if (explicit !== null) return explicit;
  const pr = asRecord(payload.pull_request);
  const body = pr ? readString(pr, "body") : null;
  if (!body) return null;
  const match = body.match(/(?:close[sd]?|fix(?:e[sd])?)\s+#(\d+)/i);
  if (match?.[1]) return Number.parseInt(match[1], 10);
  const ref = body.match(/#(\d+)/);
  return ref?.[1] ? Number.parseInt(ref[1], 10) : null;
}

export function inferGithubEventType(payload: GithubWebhookEnvelope): NormalizedEventKind | null {
  const action = readString(payload, "action");
  const pr = asRecord(payload.pull_request);
  if (pr && action === "closed" && pr.merged === true) {
    return "artifact.lifecycle.changed";
  }
  if (pr && (action === "opened" || action === "synchronize" || action === "reopened")) {
    return "artifact.activity.detected";
  }
  const review = asRecord(payload.review);
  if (review && action === "submitted") {
    return review.state === "approved"
      ? "artifact.lifecycle.changed"
      : "artifact.activity.detected";
  }
  return null;
}

export function buildGithubResourceId(payload: GithubWebhookEnvelope): string {
  const repo = parseRepositoryFullName(payload) ?? "unknown/unknown";
  const pr = asRecord(payload.pull_request);
  const num = pr ? readNumber(pr, "number") : null;
  if (num !== null) return `${repo}/pull/${num}`;
  return repo;
}

export function buildGithubExternalEventId(payload: GithubWebhookEnvelope): string {
  const action = readString(payload, "action") ?? "event";
  const pr = asRecord(payload.pull_request);
  const num = pr ? readNumber(pr, "number") : null;
  if (num !== null && action === "closed" && pr?.merged === true) {
    return `pr-${num}-merged`;
  }
  return `${action}-${buildGithubResourceId(payload)}`;
}

export function buildGithubEvidenceDedupeKey(
  deliveryId: string,
  payload: GithubWebhookEnvelope,
): string {
  return `${GITHUB_PROVIDER}:${buildGithubExternalEventId(payload)}:${deliveryId}`;
}

export function normalizeGithubWebhook(
  raw: RawConnectorEvent,
  actor: ExternalActor,
  link: GithubLinkHint,
): {
  skipped: boolean;
  ingest?: {
    source: string;
    externalId: string;
    dedupeKey: string;
    actor: ExternalActor;
    timestamp: string;
    eventType: NormalizedEventKind;
    artifact: { externalId: string; kind: string; url?: string } | null;
    projectCandidate: string | null;
    workItemCandidate: string | null;
    confidence: number;
    rawReference: Record<string, unknown>;
    normalizedPayload: Record<string, unknown>;
    aiInterpretation: string | null;
    acceptedBy: string | null;
    effect: EvidenceEffect;
    linkState?: GithubLinkHint["linkState"];
    linkMethod?: GithubLinkHint["linkMethod"];
  };
} {
  const payload = raw.payload;
  const eventType = inferGithubEventType(payload);
  if (!eventType) return { skipped: true };

  const pr = asRecord(payload.pull_request);
  const mergedAt = pr ? readString(pr, "merged_at") : null;
  const timestamp = mergedAt ?? raw.receivedAt;
  const effect = evidenceEffectForEventType(eventType);
  const dedupeKey = buildGithubEvidenceDedupeKey(raw.deliveryId, payload);
  const externalId = buildGithubExternalEventId(payload);
  const resourceId = buildGithubResourceId(payload);
  const htmlUrl = pr ? readString(pr, "html_url") : null;

  const workItemCandidate = link.workNodeId;
  const projectCandidate = link.projectId;
  const confidence = link.confidence;
  const linkState =
    link.linkState ??
    (workItemCandidate && confidence >= 0.85
      ? "confirmed"
      : workItemCandidate
        ? "proposed"
        : "unlinked");
  const linkMethod =
    link.linkMethod ??
    (linkState === "unlinked" ? "none" : confidence >= 0.85 ? "rule" : "manual");

  return {
    skipped: false,
    ingest: {
      source: GITHUB_PROVIDER,
      externalId,
      dedupeKey,
      actor,
      timestamp,
      eventType,
      artifact: {
        externalId: resourceId,
        kind: eventType === "artifact.lifecycle.changed" ? "pull_request_merged" : "pull_request",
        ...(htmlUrl ? { url: htmlUrl } : {}),
      },
      projectCandidate,
      workItemCandidate,
      confidence,
      rawReference: {
        deliveryId: raw.deliveryId,
        eventId: raw.eventId,
        resourceId: raw.resourceId,
        provider: raw.provider,
      },
      normalizedPayload: { ...payload },
      aiInterpretation: null,
      acceptedBy: null,
      effect,
      linkState,
      linkMethod,
    },
  };
}
