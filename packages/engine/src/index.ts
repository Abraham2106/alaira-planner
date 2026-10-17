/**
 * Motor determinista: única autoridad sobre fechas, costos y estados calculados (NFR-021).
 */
export type ScheduleSnapshot = {
  asOf: string;
  plannedEnd: string;
};

export function computeScheduleSnapshot(
  plannedStartIso: string,
  durationDays: number,
): ScheduleSnapshot {
  const start = new Date(plannedStartIso);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid planned start date");
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + durationDays);
  return {
    asOf: new Date().toISOString(),
    plannedEnd: end.toISOString(),
  };
}

export function computeAcceptanceCostCents(baseCents: number): number {
  if (!Number.isFinite(baseCents) || baseCents < 0) {
    throw new Error("Invalid base cost");
  }
  return baseCents;
}
