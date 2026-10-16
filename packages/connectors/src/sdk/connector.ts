import type {
  AuthorizeInput,
  AuthorizeResult,
  BackfillInput,
  BackfillResult,
  ConnectorDefinition,
  ExecuteActionInput,
  ExecuteActionResult,
  FetchArtifactInput,
  FetchArtifactResult,
  HealthCheckInput,
  HealthCheckResult,
  NormalizeInput,
  NormalizeResult,
  ReceiveEventInput,
  ReceiveEventResult,
  ResolveIdentityInput,
  ResolveIdentityResult,
  RevokeInput,
  RevokeResult,
  SubscribeInput,
  SubscribeResult,
} from "./types.js";

/** Contrato uniforme de adaptadores (INTEGRATIONS.md §2). */
export interface Connector {
  readonly definition: ConnectorDefinition;

  authorize(input: AuthorizeInput): Promise<AuthorizeResult>;
  revoke(input: RevokeInput): Promise<RevokeResult>;
  subscribe(input: SubscribeInput): Promise<SubscribeResult>;
  backfill(input: BackfillInput): Promise<BackfillResult>;
  receiveEvent(input: ReceiveEventInput): Promise<ReceiveEventResult>;
  normalize(input: NormalizeInput): Promise<NormalizeResult>;
  resolveIdentity(input: ResolveIdentityInput): Promise<ResolveIdentityResult>;
  fetchArtifact(input: FetchArtifactInput): Promise<FetchArtifactResult>;
  executeAction(input: ExecuteActionInput): Promise<ExecuteActionResult>;
  healthCheck(input: HealthCheckInput): Promise<HealthCheckResult>;
}

export function isConnector(value: unknown): value is Connector {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Connector;
  return (
    typeof c.definition === "object" &&
    typeof c.authorize === "function" &&
    typeof c.revoke === "function" &&
    typeof c.subscribe === "function" &&
    typeof c.backfill === "function" &&
    typeof c.receiveEvent === "function" &&
    typeof c.normalize === "function" &&
    typeof c.resolveIdentity === "function" &&
    typeof c.fetchArtifact === "function" &&
    typeof c.executeAction === "function" &&
    typeof c.healthCheck === "function"
  );
}
