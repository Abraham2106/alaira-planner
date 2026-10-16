export type DateTimeDisplayParts = {
  localLabel: string;
  timeZoneId: string;
  utcOffsetLabel: string;
  isoUtc: string;
};

/** Formats an instant with explicit zone and offset (REQ-078). */
export function formatInstantForDisplay(
  instant: Date,
  timeZone: string,
  locale: string,
): DateTimeDisplayParts {
  const localFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: "medium",
    timeStyle: "medium",
  });
  const offsetFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "longOffset",
  });
  const offsetPart = offsetFormatter.formatToParts(instant).find((p) => p.type === "timeZoneName");
  return {
    localLabel: localFormatter.format(instant),
    timeZoneId: timeZone,
    utcOffsetLabel: offsetPart?.value ?? "UTC",
    isoUtc: instant.toISOString(),
  };
}

export function resolveDefaultTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function resolveDefaultLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
}
