import { z } from "zod";

export const context = "eventlog";

const uuid = z.string().uuid();

const EventLogEntry = z.object({
  id: uuid,
  projectId: uuid,
  sequenceNum: z.number().int().positive(),
  eventType: z.string(),
  schemaVersion: z.number().int(),
  aggregateId: uuid.optional(),
  occurredAt: z.string(),
  actorUserId: uuid,
  correlationId: uuid.optional(),
  causationId: uuid.optional(),
  summary: z.string(),
  readable: z.string(),
  payload: z.record(z.unknown()),
  evidenceRef: z.string().optional(),
  effect: z.string().optional(),
});

export const schemas = {
  AppendEventLogBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
    eventType: z.string().min(1).max(128),
    summary: z.string().min(1).max(2000),
    aggregateId: uuid.optional(),
    correlationId: uuid.optional(),
    causationId: uuid.optional(),
    payload: z.record(z.unknown()).optional(),
    evidenceRef: z.string().min(1).max(512).optional(),
    effect: z.string().min(1).max(512).optional(),
  }),
  EventLogEntry,
  AppendEventLogResponse: z.object({
    entry: EventLogEntry,
  }),
  ListEventLogResponse: z.object({
    entries: z.array(EventLogEntry),
  }),
};
