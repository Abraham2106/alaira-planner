import { z } from "zod";

export const NormalizedEventKindSchema = z.enum([
  "artifact.lifecycle.changed",
  "user.intent.received",
  "artifact.activity.detected",
]);

export type NormalizedEventKind = z.infer<typeof NormalizedEventKindSchema>;

export const EvidenceEffectSchema = z.enum([
  "none",
  "may_propose_progress",
  "context_only",
]);

export type EvidenceEffect = z.infer<typeof EvidenceEffectSchema>;

export const ExternalActorSchema = z.object({
  externalId: z.string().min(1),
  displayName: z.string().optional(),
  resolvedUserId: z.string().uuid().nullable(),
});

export type ExternalActor = z.infer<typeof ExternalActorSchema>;

export const ArtifactRefSchema = z.object({
  externalId: z.string().min(1),
  kind: z.string().min(1),
  url: z.string().url().optional(),
});

export type ArtifactRef = z.infer<typeof ArtifactRefSchema>;

/** REQ-087 — shape normalizado; persistencia fuera de alcance del SDK. */
export const EvidenceEventShapeSchema = z.object({
  eventId: z.string().min(1),
  source: z.string().min(1),
  externalId: z.string().min(1),
  dedupeKey: z.string().min(1),
  actor: ExternalActorSchema,
  timestamp: z.string().datetime(),
  eventType: NormalizedEventKindSchema,
  artifact: ArtifactRefSchema.nullable(),
  projectCandidate: z.string().uuid().nullable(),
  workItemCandidate: z.string().uuid().nullable(),
  confidence: z.number().min(0).max(1),
  rawReference: z.record(z.unknown()),
  normalizedPayload: z.record(z.unknown()),
  aiInterpretation: z.string().nullable(),
  acceptedBy: z.string().uuid().nullable(),
  effect: EvidenceEffectSchema,
});

export type EvidenceEventShape = z.infer<typeof EvidenceEventShapeSchema>;

export function evidenceEffectForEventType(
  eventType: NormalizedEventKind,
): EvidenceEffect {
  switch (eventType) {
    case "artifact.lifecycle.changed":
    case "user.intent.received":
      return "may_propose_progress";
    case "artifact.activity.detected":
      return "context_only";
  }
}
