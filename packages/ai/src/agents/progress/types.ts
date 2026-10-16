import type { NormalizedEventKind, EvidenceEffect } from "@alaira/domain/evidence";

/** Evidence snapshot for progress evaluation (GitHub / TASK-0120 shape). */
export type ProgressEvidenceInput = {
  evidenceId: string;
  source: string;
  externalId: string;
  eventType: NormalizedEventKind;
  effect: EvidenceEffect;
  artifact?: { externalId: string; kind: string; url?: string } | null;
  normalizedPayload?: Record<string, unknown>;
};

export type ProgressAgentResult = {
  criteriaSatisfied: string[];
  criteriaPending: string[];
  mayCloseItem: boolean;
  /** REQ-092: never auto-close when criteria remain. */
  autoAcceptForbidden: true;
  suggestedProgressPercent: number;
  citedEvidenceIds: string[];
  progressProposal?: {
    priorPercentComplete: number;
    proposedPercentComplete: number;
  };
  summary: string;
};
