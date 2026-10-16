import { KeyboardEvent, useCallback, useId, useRef, useState } from "react";
import { resolveDefaultLocale } from "../shell/datetime/format.js";

export type EventLogRow = {
  id: string;
  sequenceNum: number;
  eventType: string;
  summary: string;
  occurredAt: string;
  readable: string;
};

type EventLogListProps = {
  entries: EventLogRow[];
};

export function EventLogList({ entries }: EventLogListProps) {
  const listId = useId();
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const locale = resolveDefaultLocale();

  const focusItem = useCallback(
    (index: number) => {
      if (entries.length === 0) return;
      const clamped = Math.max(0, Math.min(index, entries.length - 1));
      setFocusedIndex(clamped);
      itemRefs.current[clamped]?.focus();
    },
    [entries.length],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(entries.length - 1);
    }
  };

  if (entries.length === 0) {
    return <p className="planner-muted">Sin entradas en el Project Event Log para este proyecto.</p>;
  }

  return (
    <div className="ct-event-log">
      <ul
        id={listId}
        className="ct-event-log-list"
        aria-label="Project Event Log legible"
        role="list"
      >
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className="ct-event-log-item"
            tabIndex={index === focusedIndex ? 0 : -1}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <div className="ct-event-log-meta">
              <span className="ct-event-log-seq">#{entry.sequenceNum}</span>
              <time dateTime={entry.occurredAt}>
                {new Date(entry.occurredAt).toLocaleString(locale)}
              </time>
              <span className="ct-event-log-type">{entry.eventType}</span>
            </div>
            <p className="ct-event-log-readable">{entry.readable}</p>
            <p className="planner-muted ct-event-log-summary">{entry.summary}</p>
          </li>
        ))}
      </ul>
      <p className="planner-muted" id={`${listId}-hint`}>
        Flechas arriba/abajo, Inicio y Fin para recorrer entradas del log (REQ-097).
      </p>
    </div>
  );
}
