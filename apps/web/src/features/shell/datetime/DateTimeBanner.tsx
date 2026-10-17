import { useEffect, useState } from "react";
import {
  formatInstantForDisplay,
  resolveDefaultLocale,
  resolveDefaultTimeZone,
  type DateTimeDisplayParts,
} from "./format.js";

type DateTimeBannerProps = {
  locale?: string;
  timeZone?: string;
};

export function DateTimeBanner({ locale, timeZone }: DateTimeBannerProps) {
  const resolvedLocale = locale ?? resolveDefaultLocale();
  const resolvedZone = timeZone ?? resolveDefaultTimeZone();
  const [parts, setParts] = useState<DateTimeDisplayParts>(() =>
    formatInstantForDisplay(new Date(), resolvedZone, resolvedLocale),
  );

  useEffect(() => {
    const tick = () => {
      setParts(formatInstantForDisplay(new Date(), resolvedZone, resolvedLocale));
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [resolvedLocale, resolvedZone]);

  const quietLabel = new Intl.DateTimeFormat(resolvedLocale, {
    timeZone: resolvedZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(parts.isoUtc));

  return (
    <div className="shell-datetime" aria-live="polite" aria-atomic="true">
      <time dateTime={parts.isoUtc} title={`${parts.timeZoneId} (${parts.utcOffsetLabel})`}>
        {quietLabel}
      </time>
    </div>
  );
}
