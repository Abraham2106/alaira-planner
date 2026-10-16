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
  NormalizedEventKind,
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
  syntheticBackfillBatch,
  SYNTHETIC_USER_ID,
} from "./synthetic-payloads.js";

type ConnectionState = {
  authorized: boolean;
  revoked: boolean;
  degraded: boolean;
  disconnected: boolean;
  lastSuccessfulSyncAt: string | null;
  subscriptions: string[];
  seenDeliveryIds: Set<string>;
  identityMap: Map<string, string | null>;
};

const DEFAULT_STATE: ConnectionState = {
  authorized: false,
  revoked: false,
  degraded: false,
  disconnected: false,
  lastSuccessfulSyncAt: null,
  subscriptions: [],
  seenDeliveryIds: new Set(),
  identityMap: new Map([["actor_fake_bot", SYNTHETIC_USER_ID]]),
};

function connectionKey(ctx: TenantConnectorContext): string {
  return `${ctx.tenantId}:${ctx.connectionId}`;
}

function inferEventType(raw: RawConnectorEvent): NormalizedEventKind {
  const kind = raw.payload.kind;
  if (kind === "message") return "user.intent.received";
  if (kind === "commit") return "artifact.activity.detected";
  return "artifact.lifecycle.changed";
}

function buildDefinition(): ConnectorDefinition {
  return {
    id: "fake-reference",
    provider: "fake-reference",
    displayName: "Fake reference connector (synthetic only)",
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

export class FakeReferenceConnector implements Connector {
  readonly definition = buildDefinition();
  private readonly connections = new Map<string, ConnectionState>();

  private state(ctx: TenantConnectorContext): ConnectionState {
    const key = connectionKey(ctx);
    let s = this.connections.get(key);
    if (!s) {
      s = {
        ...DEFAULT_STATE,
        seenDeliveryIds: new Set(),
        identityMap: new Map(DEFAULT_STATE.identityMap),
        subscriptions: [],
      };
      this.connections.set(key, s);
    }
    return s;
  }

  async authorize(input: AuthorizeInput): Promise<AuthorizeResult> {
    const s = this.state(input);
    if (s.revoked) {
      return { authorized: false, grantedScopes: [] };
    }
    const ok = input.syntheticGrant.startsWith("fake_grant_");
    if (ok) {
      s.authorized = true;
      s.disconnected = false;
      s.lastSuccessfulSyncAt = new Date().toISOString();
    }
    return {
      authorized: ok,
      grantedScopes: ok ? input.requestedScopes : [],
    };
  }

  async revoke(input: RevokeInput): Promise<RevokeResult> {
    const s = this.state(input);
    s.revoked = true;
    s.authorized = false;
    s.subscriptions = [];
    return { revoked: true };
  }

  async subscribe(input: SubscribeInput): Promise<SubscribeResult> {
    const s = this.state(input);
    if (!s.authorized || s.revoked) {
      return { subscriptionIds: [] };
    }
    const ids = input.resourceIds.map((r) => `sub_fake_${r}`);
    s.subscriptions.push(...ids);
    return { subscriptionIds: ids };
  }

  async backfill(input: BackfillInput): Promise<BackfillResult> {
    const s = this.state(input);
    if (!s.authorized || s.revoked || s.disconnected) {
      return { events: [], nextCursor: null };
    }
    const events = syntheticBackfillBatch().slice(0, input.limit);
    s.lastSuccessfulSyncAt = new Date().toISOString();
    return { events, nextCursor: input.cursor ? null : "cursor_fake_page_2" };
  }

  async receiveEvent(input: ReceiveEventInput): Promise<ReceiveEventResult> {
    const s = this.state(input);
    const duplicate = s.seenDeliveryIds.has(input.raw.deliveryId);
    if (!duplicate) {
      s.seenDeliveryIds.add(input.raw.deliveryId);
    }
    return {
      receiptId: `rcpt_${input.raw.deliveryId}`,
      duplicate,
    };
  }

  async normalize(input: NormalizeInput): Promise<NormalizeResult> {
    const raw = input.raw;
    const eventType = inferEventType(raw);
    const effect = evidenceEffectForEventType(eventType);
    const dedupeKey = `${raw.provider}:${raw.eventId}`;
    const evidence = {
      eventId: `ev_${raw.eventId}`,
      source: raw.provider,
      externalId: raw.eventId,
      dedupeKey,
      actor: input.resolvedActor,
      timestamp: raw.receivedAt,
      eventType,
      artifact:
        eventType === "user.intent.received"
          ? null
          : {
              externalId: raw.resourceId,
              kind: String(raw.payload.kind ?? "unknown"),
            },
      projectCandidate: input.projectCandidate ?? null,
      workItemCandidate: input.workItemCandidate ?? null,
      confidence: input.confidence ?? 0.85,
      rawReference: { deliveryId: raw.deliveryId, resourceId: raw.resourceId },
      normalizedPayload: { ...raw.payload },
      aiInterpretation: null,
      acceptedBy: null,
      effect,
    };
    return { evidence };
  }

  async resolveIdentity(
    input: ResolveIdentityInput,
  ): Promise<ResolveIdentityResult> {
    const mapped = this.state(input).identityMap.get(input.externalActorId);
    return {
      actor: {
        externalId: input.externalActorId,
        displayName: `[SYNTHETIC] ${input.externalActorId}`,
        resolvedUserId: mapped ?? null,
      },
    };
  }

  async fetchArtifact(
    input: FetchArtifactInput,
  ): Promise<FetchArtifactResult> {
    return {
      artifact: {
        externalId: input.artifactExternalId,
        kind: "synthetic_document",
        url: `https://fake.example.local/artifacts/${input.artifactExternalId}`,
      },
      snapshot: {
        title: "[SYNTHETIC] Reference artifact",
        revision: "1",
      },
    };
  }

  async executeAction(
    input: ExecuteActionInput,
  ): Promise<ExecuteActionResult> {
    const s = this.state(input);
    if (!s.authorized || s.revoked) {
      return { externalActionId: "", status: "rejected" };
    }
    return {
      externalActionId: `act_fake_${input.action}_${Date.now()}`,
      status: "accepted",
    };
  }

  async healthCheck(input: HealthCheckInput): Promise<ConnectorHealthReport> {
    const s = this.state(input);
    if (s.revoked) {
      return {
        status: "revoked",
        lastSuccessfulSyncAt: s.lastSuccessfulSyncAt,
        lagSeconds: null,
        message: "Connection revoked (synthetic)",
      };
    }
    if (s.disconnected || !s.authorized) {
      return {
        status: "disconnected",
        lastSuccessfulSyncAt: s.lastSuccessfulSyncAt,
        lagSeconds: null,
        message: "Not authorized or disconnected (synthetic)",
      };
    }
    if (s.degraded) {
      return {
        status: "degraded",
        lastSuccessfulSyncAt: s.lastSuccessfulSyncAt,
        lagSeconds: 120,
        message: "Elevated lag (synthetic)",
        repairableErrors: ["synthetic_rate_limit"],
      };
    }
    return {
      status: "connected",
      lastSuccessfulSyncAt: s.lastSuccessfulSyncAt,
      lagSeconds: 5,
    };
  }

  /** Solo pruebas: forzar estado degradado sin tocar el núcleo SDK. */
  setDegraded(ctx: TenantConnectorContext, degraded: boolean): void {
    this.state(ctx).degraded = degraded;
  }

  setDisconnected(ctx: TenantConnectorContext, disconnected: boolean): void {
    this.state(ctx).disconnected = disconnected;
  }
}

export function createFakeReferenceConnector(): FakeReferenceConnector {
  return new FakeReferenceConnector();
}
