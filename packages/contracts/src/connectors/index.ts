import {
  ArtifactRefSchema,
  EvidenceEffectSchema,
  EvidenceEventShapeSchema,
  ExternalActorSchema,
  NormalizedEventKindSchema,
  evidenceEffectForEventType,
} from "./evidence.js";
import {
  ConnectorCapabilitySchema,
  ConnectorDefinitionSchema,
  ConnectorHealthReportSchema,
  ConnectorHealthStatusSchema,
  RawConnectorEventSchema,
} from "./connector-sdk.js";

export const context = "connectors";

export const schemas = {
  NormalizedEventKind: NormalizedEventKindSchema,
  EvidenceEffect: EvidenceEffectSchema,
  ExternalActor: ExternalActorSchema,
  ArtifactRef: ArtifactRefSchema,
  EvidenceEventShape: EvidenceEventShapeSchema,
  ConnectorHealthStatus: ConnectorHealthStatusSchema,
  ConnectorCapability: ConnectorCapabilitySchema,
  ConnectorDefinition: ConnectorDefinitionSchema,
  ConnectorHealthReport: ConnectorHealthReportSchema,
  RawConnectorEvent: RawConnectorEventSchema,
};

export {
  ArtifactRefSchema,
  ConnectorCapabilitySchema,
  ConnectorDefinitionSchema,
  ConnectorHealthReportSchema,
  ConnectorHealthStatusSchema,
  EvidenceEffectSchema,
  EvidenceEventShapeSchema,
  ExternalActorSchema,
  NormalizedEventKindSchema,
  RawConnectorEventSchema,
  evidenceEffectForEventType,
};

export type {
  ArtifactRef,
  EvidenceEffect,
  EvidenceEventShape,
  ExternalActor,
  NormalizedEventKind,
} from "./evidence.js";

export type {
  ConnectorCapability,
  ConnectorDefinition,
  ConnectorHealthReport,
  ConnectorHealthStatus,
  RawConnectorEvent,
} from "./connector-sdk.js";
