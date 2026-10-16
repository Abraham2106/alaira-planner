/** Tipos alineados con `@alaira/contracts` / contexto `connectors` (REQ-087). */

export type NormalizedEventKind =
  | "artifact.lifecycle.changed"
  | "user.intent.received"
  | "artifact.activity.detected";

export type EvidenceEffect =
  | "none"
  | "may_propose_progress"
  | "context_only";

export type ExternalActor = {
  externalId: string;
  displayName?: string;
  resolvedUserId: string | null;
};

export type ArtifactRef = {
  externalId: string;
  kind: string;
  url?: string;
};

/** REQ-087 — hecho externo normalizado; el núcleo persiste en capas posteriores. */
export type EvidenceEventShape = {
  eventId: string;
  source: string;
  externalId: string;
  dedupeKey: string;
  actor: ExternalActor;
  timestamp: string;
  eventType: NormalizedEventKind;
  artifact: ArtifactRef | null;
  projectCandidate: string | null;
  workItemCandidate: string | null;
  confidence: number;
  rawReference: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  aiInterpretation: string | null;
  acceptedBy: string | null;
  effect: EvidenceEffect;
};

export type ConnectorHealthStatus =
  | "connected"
  | "degraded"
  | "disconnected"
  | "revoked";

export type ConnectorCapability =
  | "oauth"
  | "webhooks"
  | "backfill"
  | "read_artifacts"
  | "write_actions"
  | "identity_resolution";

export type ConnectorDefinition = {
  id: string;
  provider: string;
  displayName: string;
  capabilities: readonly ConnectorCapability[];
};

export type ConnectorHealthReport = {
  status: ConnectorHealthStatus;
  lastSuccessfulSyncAt: string | null;
  lagSeconds: number | null;
  message?: string;
  repairableErrors?: string[];
};

export type RawConnectorEvent = {
  provider: string;
  deliveryId: string;
  eventId: string;
  resourceId: string;
  receivedAt: string;
  payload: Record<string, unknown>;
};

export type TenantConnectorContext = {
  tenantId: string;
  connectionId: string;
};

export type AuthorizeInput = TenantConnectorContext & {
  /** Código o token sintético; sin OAuth real en M1 SDK. */
  syntheticGrant: string;
  requestedScopes: readonly string[];
};

export type AuthorizeResult = {
  authorized: boolean;
  grantedScopes: readonly string[];
};

export type RevokeInput = TenantConnectorContext;

export type RevokeResult = {
  revoked: boolean;
};

export type SubscribeInput = TenantConnectorContext & {
  resourceIds: readonly string[];
};

export type SubscribeResult = {
  subscriptionIds: readonly string[];
};

export type BackfillInput = TenantConnectorContext & {
  cursor?: string;
  limit: number;
};

export type BackfillResult = {
  events: readonly RawConnectorEvent[];
  nextCursor: string | null;
};

export type ReceiveEventInput = TenantConnectorContext & {
  raw: RawConnectorEvent;
};

export type ReceiveEventResult = {
  receiptId: string;
  duplicate: boolean;
};

export type NormalizeInput = {
  raw: RawConnectorEvent;
  resolvedActor: ExternalActor;
  projectCandidate?: string | null;
  workItemCandidate?: string | null;
  confidence?: number;
};

export type NormalizeResult = {
  evidence: EvidenceEventShape;
};

export type ResolveIdentityInput = TenantConnectorContext & {
  externalActorId: string;
};

export type ResolveIdentityResult = {
  actor: ExternalActor;
};

export type FetchArtifactInput = TenantConnectorContext & {
  artifactExternalId: string;
};

export type FetchArtifactResult = {
  artifact: ArtifactRef;
  snapshot: Record<string, unknown>;
};

export type ExecuteActionInput = TenantConnectorContext & {
  action: string;
  targetResourceId: string;
  parameters: Record<string, unknown>;
};

export type ExecuteActionResult = {
  externalActionId: string;
  status: "accepted" | "rejected";
};

export type HealthCheckInput = TenantConnectorContext;

export type HealthCheckResult = ConnectorHealthReport;
