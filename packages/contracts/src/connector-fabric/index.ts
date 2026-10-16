import { z } from "zod";
import {
  ConnectorHealthReportSchema,
  ConnectorHealthStatusSchema,
} from "../connectors/connector-sdk.js";

export const context = "connector-fabric";
const uuid = z.string().uuid();

export const WebhookIngestBodySchema = z.object({
  provider: z.string().min(1).max(64),
  eventId: z.string().min(1).max(256),
  deliveryId: z.string().min(1).max(256),
  resourceId: z.string().min(1).max(256),
  payload: z.record(z.unknown()).default({}),
});

export const WebhookIngestResponseSchema = z.object({
  receiptId: uuid,
  status: z.enum(["accepted", "duplicate"]),
  dedupKey: z.string(),
});

export const ConnectionHealthResponseSchema = z.object({
  connectionId: uuid,
  provider: z.string(),
  displayName: z.string(),
  health: ConnectorHealthReportSchema,
});

export const StoreSyntheticTokenBodySchema = z.object({
  kind: z.enum(["oauth_access", "oauth_refresh", "webhook_signing"]),
  plaintext: z.string().min(1).max(4096),
});

export const schemas = {
  WebhookIngestBody: WebhookIngestBodySchema,
  WebhookIngestResponse: WebhookIngestResponseSchema,
  ConnectionHealthResponse: ConnectionHealthResponseSchema,
  StoreSyntheticTokenBody: StoreSyntheticTokenBodySchema,
  ConnectorHealthStatus: ConnectorHealthStatusSchema,
};

export type WebhookIngestBody = z.infer<typeof WebhookIngestBodySchema>;
export type WebhookIngestResponse = z.infer<typeof WebhookIngestResponseSchema>;
export type ConnectionHealthResponse = z.infer<typeof ConnectionHealthResponseSchema>;
export type { ConnectorHealthStatus } from "../connectors/connector-sdk.js";
