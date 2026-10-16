import {
  assignmentRecalcModeSchema,
  capacityAnalysisRequestSchema,
  capacityAnalysisResultSchema,
  overassignmentConflictSchema,
  personResourceSchema,
  resourceAssignmentSchema,
  taskAssignmentWindowSchema,
} from "./schemas.js";

export const context = "capacity";

export const schemas = {
  AssignmentRecalcMode: assignmentRecalcModeSchema,
  PersonResource: personResourceSchema,
  ResourceAssignment: resourceAssignmentSchema,
  TaskAssignmentWindow: taskAssignmentWindowSchema,
  CapacityAnalysisRequest: capacityAnalysisRequestSchema,
  OverassignmentConflict: overassignmentConflictSchema,
  CapacityAnalysisResult: capacityAnalysisResultSchema,
};

export * from "./schemas.js";
