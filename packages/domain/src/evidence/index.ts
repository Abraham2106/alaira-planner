export type {
  ArtifactRef,
  CreateManualEvidenceInput,
  EvidenceEffect,
  EvidenceEvent,
  EvidenceKind,
  EvidenceLinkMethod,
  EvidenceLinkState,
  EvidenceRecord,
  ExternalActor,
  IngestEvidenceEventInput,
  NormalizedEventKind,
} from "./types.js";
export {
  assertManualEvidenceInput,
  buildEvidenceEvent,
  buildEvidenceRecord,
  normalizeDedupeKey,
} from "./build.js";
export {
  parseEvidenceExternalId,
  toEvidenceExternalId,
  type EvidenceExternalIdKind,
} from "./external-id.js";
