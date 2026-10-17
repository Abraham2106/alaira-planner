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
  loaded?: boolean;
};

export function EventLogList({ entries, loaded = true }: EventLogListProps) {
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
    return (
      <p className="ct-empty">
        {loaded ? "No hay registros en este proyecto." : "Cargá el proyecto para ver el registro."}
      </p>
    );
  }

  return (
    <div className="ct-sheet">
      <div className="ct-row ct-row-log ct-row-head" aria-hidden="true">
        <span>#</span>
        <span>Cuándo</span>
        <span>Tipo</span>
        <span>Qué pasó</span>
      </div>
      <ul id={listId} className="ct-rows" aria-label="Project Event Log legible" role="list">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className="ct-row ct-row-log"
            tabIndex={index === focusedIndex ? 0 : -1}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span className="ct-row-id">#{entry.sequenceNum}</span>
            <time dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString(locale)}</time>
            <span className="ct-mono-inline">{entry.eventType}</span>
            <span className="ct-row-summary" title={`${entry.readable} ${entry.summary}`}>
              {entry.readable}
              {entry.summary ? ` — ${entry.summary}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <p className="ct-note" id={`${listId}-hint`}>
        Flechas arriba/abajo, Inicio y Fin para recorrer el log.
      </p>
    </div>
  );
}
