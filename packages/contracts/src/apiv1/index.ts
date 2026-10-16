import { z } from "zod";

export const context = "apiv1";

/** TC-PORT-01 sample: max rows per import (no silent truncation). */
export const PORT_SAMPLE_MAX_ROWS = 500;

export const PORT_SAMPLE_PROJECT_HEADERS = [
  "name",
  "planning_mode",
  "schedule_engine",
  "agile_execution",
  "financial_control",
  "resource_planning",
  "baseline_required",
] as const;

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);

const planningMode = z.enum(["predictive", "scrum", "kanban", "hybrid"]);

export const schemas = {
  PaginationQuery: z.object({
    page,
    pageSize,
  }),

  SearchProjectsQuery: z.object({
    page,
    pageSize,
    q: z.string().max(256).optional(),
    planningMode: planningMode.optional(),
  }),

  SearchProjectItem: z.object({
    id: z.string(),
    name: z.string(),
    planningMode,
    version: z.number().int().nonnegative(),
  }),

  SearchProjectsResponse: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        planningMode,
        version: z.number().int().nonnegative(),
      }),
    ),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),

  SearchEventLogQuery: z.object({
    page,
    pageSize,
    eventType: z.string().max(128).optional(),
  }),

  EventLogSearchEntry: z.object({
    id: z.string().uuid(),
    sequenceNum: z.number().int().positive(),
    eventType: z.string(),
    summary: z.string(),
    occurredAt: z.string(),
    readable: z.string(),
  }),

  SearchEventLogResponse: z.object({
    projectId: z.string(),
    items: z.array(
      z.object({
        id: z.string().uuid(),
        sequenceNum: z.number().int().positive(),
        eventType: z.string(),
        summary: z.string(),
        occurredAt: z.string(),
        readable: z.string(),
      }),
    ),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),

  CsvImportReport: z.object({
    imported: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    errors: z.array(
      z.object({
        row: z.number().int().positive(),
        message: z.string(),
      }),
    ),
  }),

  OpenApiDocument: z.object({
    openapi: z.string(),
    info: z.object({
      title: z.string(),
      version: z.string(),
    }),
    paths: z.record(z.unknown()),
  }),
};

export { buildOpenApiDocument, OPENAPI_DOCUMENT_PATHS } from "./openapi.js";
