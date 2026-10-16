import type { TenantId } from "../index.js";

export type ProjectAuditEvent = {
  id: string;
  tenantId: TenantId;
  projectId: string;
  sequenceNum: number;
  eventType: string;
  schemaVersion: number;
  aggregateId?: string;
  occurredAt: string;
  actorUserId: string;
  correlationId?: string;
  causationId?: string;
  summary: string;
  payload: Record<string, unknown>;
  evidenceRef?: string;
  effect?: string;
};

export type AppendProjectAuditEventInput = {
  eventType: string;
  summary: string;
  aggregateId?: string;
  correlationId?: string;
  causationId?: string;
  payload?: Record<string, unknown>;
  evidenceRef?: string;
  effect?: string;
};

export const EVENTLOG_OUTBOX_EVENT_TYPE = "eventlog.audit_event.recorded" as const;
