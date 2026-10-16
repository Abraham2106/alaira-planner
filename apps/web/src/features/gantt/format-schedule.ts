/** Formats variance minutes as human-readable schedule delta (TC-UI-01 partial). */
export function formatVarianceMinutes(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes === 0) return "0 min (en línea)";
  const sign = minutes > 0 ? "+" : "";
  const abs = Math.abs(minutes);
  if (abs < 60) return `${sign}${minutes} min`;
  const hours = Math.floor(abs / 60);
  const rem = abs % 60;
  const core = rem === 0 ? `${hours} h` : `${hours} h ${rem} min`;
  return minutes < 0 ? `−${core}` : `+${core}`;
}

export function formatEpochMs(epochMs: number | null, locale: string): string {
  if (epochMs == null) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(epochMs));
}
