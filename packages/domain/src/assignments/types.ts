import type { WorkCalendarDefinition } from "../schedule/types.js";

export type ProjectPersonRecord = {
  id: string;
  projectId: string;
  displayName: string;
  teamName: string | null;
  maxUnits: number;
  calendar: WorkCalendarDefinition;
};

export type WorkNodeAssignmentRecord = {
  id: string;
  projectId: string;
  personId: string;
  workNodeId: string;
  units: number;
  workMinutes: number;
  durationMinutes: number;
  scheduledStartEpochMs: number;
  scheduledFinishEpochMs: number;
};
