import { evidenceEffectForEventType } from "../sdk/effect.js";
import type { Connector } from "../sdk/connector.js";
import type {
  AuthorizeInput,
  AuthorizeResult,
  BackfillInput,
  BackfillResult,
  ConnectorDefinition,
  ConnectorHealthReport,
  ExecuteActionInput,
  ExecuteActionResult,
  FetchArtifactInput,
  FetchArtifactResult,
  HealthCheckInput,
  NormalizeInput,
  NormalizeResult,
  RawConnectorEvent,
  ReceiveEventInput,
  ReceiveEventResult,
  ResolveIdentityInput,
  ResolveIdentityResult,
  RevokeInput,
  RevokeResult,
  SubscribeInput,
  SubscribeResult,
  TenantConnectorContext,
} from "../sdk/types.js";
import {
  buildGithubExternalEventId,
  buildGithubResourceId,
  GITHUB_PROVIDER,
  inferGithubEventType,
  normalizeGithubWebhook,
  type GithubLinkHint,
} from "./normalize.js";
import { SYNTHETIC_GITHUB_LOGIN, syntheticPullRequestMerged } from "./synthetic-payloads.js";

type ConnectionState = {
  authorized: boolean;
  revoked: boolean;
  degraded: boolean;
  seenDeliveryIds: Set<string>;
  identityMap: Map<string, string | null>;
};

function connectionKey(ctx: TenantConnectorContext): string {
  return `${ctx.tenantId}:${ctx.connectionId}`;
}

function buildDefinition(): ConnectorDefinition {
  return {
    id: "github-synthetic",
    provider: GITHUB_PROVIDER,
    displayName: "GitHub (synthetic stub)",
    capabilities: [
      "oauth",
      "webhooks",
      "backfill",
      "read_artifacts",
      "write_actions",
      "identity_resolution",
    ],
  };
}

export class GithubSyntheticConnector implements Connector {
  readonly definition = buildDefinition();
  private readonly connections = new Map<string, ConnectionState>();

  private state(ctx: TenantConnectorContext): ConnectionState {
    const key = connectionKey(ctx);
    let s = this.connections.get(key);
    if (!s) {
      s = {
        authorized: false,
        revoked: false,
        degraded: false,
        seenDeliveryIds: new Set(),
        identityMap: new Map([[SYNTHETIC_GITHUB_LOGIN, null]]),
      };
      this.connections.set(key, s);
    }
    return s;
  }

  async authorize(input: AuthorizeInput): Promise<AuthorizeResult> {
    const s = this.state(input);
    if (s.revoked) return { authorized: false, grantedScopes: [] };
    const ok = input.syntheticGrant.startsWith("gh_synth_grant_");
    if (ok) s.authorized = true;
    return { authorized: ok, grantedScopes: ok ? input.requestedScopes : [] };
  }

  async revoke(input: RevokeInput): Promise<RevokeResult> {
    this.state(input).revoked = true;
    this.state(input).authorized = false;
    return { revoked: true };
  }

  async subscribe(input: SubscribeInput): Promise<SubscribeResult> {
    const s = this.state(input);
    if (!s.authorized || s.revoked) return { subscriptionIds: [] };
    return { subscriptionIds: input.resourceIds.map((r) => `gh_sub_${r}`) };
  }

  async backfill(input: BackfillInput): Promise<BackfillResult> {
    const s = this.state(input);
    if (!s.authorized || s.revoked) return { events: [], nextCursor: null };
    const payload = syntheticPullRequestMerged("backfill");
    const event: RawConnectorEvent = {
      provider: GITHUB_PROVIDER,
      deliveryId: "gh-del-backfill-1",
      eventId: buildGithubExternalEventId(payload),
      resourceId: buildGithubResourceId(payload),
      receivedAt: new Date().toISOString(),
      payload,
    };
    return { events: [event], nextCursor: null };
  }

  async receiveEvent(input: ReceiveEventInput): Promise<ReceiveEventResult> {
    const s = this.state(input);
    const duplicate = s.seenDeliveryIds.has(input.raw.deliveryId);
    if (!duplicate) s.seenDeliveryIds.add(input.raw.deliveryId);
    return { receiptId: `rcpt_gh_${input.raw.deliveryId}`, duplicate };
  }

  async normalize(input: NormalizeInput): Promise<NormalizeResult> {
    const link: GithubLinkHint = {
      workNodeId: input.workItemCandidate ?? null,
      projectId: input.projectCandidate ?? null,
      confidence: input.confidence ?? (input.workItemCandidate ? 0.92 : 0.2),
    };
    const result = normalizeGithubWebhook(input.raw, input.resolvedActor, link);
    if (result.skipped || !result.ingest) {
      const eventType = inferGithubEventType(input.raw.payload) ?? "artifact.activity.detected";
      return {
        evidence: {
          eventId: `ev_skip_${input.raw.eventId}`,
          source: GITHUB_PROVIDER,
          externalId: input.raw.eventId,
          dedupeKey: `${GITHUB_PROVIDER}:skip:${input.raw.deliveryId}`,
          actor: input.resolvedActor,
          timestamp: input.raw.receivedAt,
          eventType,
          artifact: null,
          projectCandidate: null,
          workItemCandidate: null,
          confidence: 0,
          rawReference: { skipped: true },
          normalizedPayload: input.raw.payload,
          aiInterpretation: null,
          acceptedBy: null,
          effect: evidenceEffectForEventType(eventType),
        },
      };
    }
    const ing = result.ingest;
    return {
      evidence: {
        eventId: `ev_${ing.externalId}`,
        source: ing.source,
        externalId: ing.externalId,
        dedupeKey: ing.dedupeKey,
        actor: ing.actor,
        timestamp: ing.timestamp,
        eventType: ing.eventType,
        artifact: ing.artifact,
        projectCandidate: ing.projectCandidate,
        workItemCandidate: ing.workItemCandidate,
        confidence: ing.confidence,
        rawReference: ing.rawReference,
        normalizedPayload: ing.normalizedPayload,
        aiInterpretation: ing.aiInterpretation,
        acceptedBy: ing.acceptedBy,
        effect: ing.effect,
      },
    };
  }

  async resolveIdentity(input: ResolveIdentityInput): Promise<ResolveIdentityResult> {
    const mapped = this.state(input).identityMap.get(input.externalActorId);
    return {
      actor: {
        externalId: input.externalActorId,
        displayName: `[SYNTHETIC GH] ${input.externalActorId}`,
        resolvedUserId: mapped ?? null,
      },
    };
  }

  async fetchArtifact(input: FetchArtifactInput): Promise<FetchArtifactResult> {
    return {
      artifact: {
        externalId: input.artifactExternalId,
        kind: "pull_request",
        url: `https://github.local/${input.artifactExternalId}`,
      },
      snapshot: { state: "merged", synthetic: true },
    };
  }

  async executeAction(input: ExecuteActionInput): Promise<ExecuteActionResult> {
    const s = this.state(input);
    if (!s.authorized || s.revoked) {
      return { externalActionId: "", status: "rejected" };
    }
    return {
      externalActionId: `gh_act_${input.action}_${Date.now()}`,
      status: "accepted",
    };
  }

  async healthCheck(input: HealthCheckInput): Promise<ConnectorHealthReport> {
    const s = this.state(input);
    if (s.revoked) {
      return {
        status: "revoked",
        lastSuccessfulSyncAt: null,
        lagSeconds: null,
        message: "GitHub connection revoked (synthetic)",
      };
    }
    if (!s.authorized) {
      return { status: "disconnected", lastSuccessfulSyncAt: null, lagSeconds: null };
    }
    if (s.degraded) {
      return {
        status: "degraded",
        lastSuccessfulSyncAt: new Date().toISOString(),
        lagSeconds: 90,
        repairableErrors: ["synthetic_rate_limit"],
      };
    }
    return {
      status: "connected",
      lastSuccessfulSyncAt: new Date().toISOString(),
      lagSeconds: 8,
    };
  }
}

export function createGithubSyntheticConnector(): GithubSyntheticConnector {
  return new GithubSyntheticConnector();
}
