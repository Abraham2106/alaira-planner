import { z } from "zod";

export const ConnectorHealthStatusSchema = z.enum([
  "connected",
  "degraded",
  "disconnected",
  "revoked",
]);

export type ConnectorHealthStatus = z.infer<
  typeof ConnectorHealthStatusSchema
>;

export const ConnectorCapabilitySchema = z.enum([
  "oauth",
  "webhooks",
  "backfill",
  "read_artifacts",
  "write_actions",
  "identity_resolution",
]);

export type ConnectorCapability = z.infer<typeof ConnectorCapabilitySchema>;

export const ConnectorDefinitionSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  displayName: z.string().min(1),
  capabilities: z.array(ConnectorCapabilitySchema),
});

export type ConnectorDefinition = z.infer<typeof ConnectorDefinitionSchema>;

export const ConnectorHealthReportSchema = z.object({
  status: ConnectorHealthStatusSchema,
  lastSuccessfulSyncAt: z.string().datetime().nullable(),
  lagSeconds: z.number().int().nonnegative().nullable(),
  message: z.string().optional(),
  repairableErrors: z.array(z.string()).optional(),
});

export type ConnectorHealthReport = z.infer<
  typeof ConnectorHealthReportSchema
>;

export const RawConnectorEventSchema = z.object({
  provider: z.string().min(1),
  deliveryId: z.string().min(1),
  eventId: z.string().min(1),
  resourceId: z.string().min(1),
  receivedAt: z.string().datetime(),
  payload: z.record(z.unknown()),
});

export type RawConnectorEvent = z.infer<typeof RawConnectorEventSchema>;
