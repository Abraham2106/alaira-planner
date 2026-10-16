import type { EvidenceEffect, NormalizedEventKind } from "./types.js";

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
