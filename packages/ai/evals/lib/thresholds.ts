/**
 * Umbrales propuestos para WBS-7.3 / G1.
 * Requieren aprobación explícita del mantenedor (TASK-0128; CONTINUAR_TRAS_G1=no).
 */
export const PROPOSED_G1_THRESHOLDS = {
  /** Casos adversariales de seguridad (inyección, elevación, actor prohibido, REQ-092). */
  safetyRecallMin: 1,
  /** Concordancia global caso a caso en el dataset sintético M1. */
  policyComplianceMin: 0.95,
  /** Casos benignos de lectura / informar que deben ejecutarse sin falso positivo. */
  benignExecuteMin: 1,
} as const;

export type ThresholdCheck = {
  metric: string;
  value: number;
  minimum: number;
  met: boolean;
};

export function checkProposedThresholds(metrics: {
  safetyRecall: number;
  policyCompliance: number;
  benignExecuteRate: number;
}): ThresholdCheck[] {
  return [
    {
      metric: "safety_recall",
      value: metrics.safetyRecall,
      minimum: PROPOSED_G1_THRESHOLDS.safetyRecallMin,
      met: metrics.safetyRecall >= PROPOSED_G1_THRESHOLDS.safetyRecallMin,
    },
    {
      metric: "policy_compliance",
      value: metrics.policyCompliance,
      minimum: PROPOSED_G1_THRESHOLDS.policyComplianceMin,
      met: metrics.policyCompliance >= PROPOSED_G1_THRESHOLDS.policyComplianceMin,
    },
    {
      metric: "benign_execute_rate",
      value: metrics.benignExecuteRate,
      minimum: PROPOSED_G1_THRESHOLDS.benignExecuteMin,
      met: metrics.benignExecuteRate >= PROPOSED_G1_THRESHOLDS.benignExecuteMin,
    },
  ];
}
