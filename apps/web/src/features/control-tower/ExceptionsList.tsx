import { KeyboardEvent, useCallback, useId, useRef, useState } from "react";
import type { ScheduleException } from "./exceptions-model.js";

type ExceptionsListProps = {
  items: ScheduleException[];
};

export function ExceptionsList({ items }: ExceptionsListProps) {
  const listId = useId();
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const focusItem = useCallback(
    (index: number) => {
      if (items.length === 0) return;
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      setFocusedIndex(clamped);
      itemRefs.current[clamped]?.focus();
    },
    [items.length],
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
      focusItem(items.length - 1);
    }
  };

  if (items.length === 0) {
    return (
      <p className="planner-muted" role="status">
        Sin excepciones de cronograma detectadas en la varianza cargada (cockpit exception-first).
      </p>
    );
  }

  return (
    <div className="ct-exceptions">
      <ul id={listId} className="ct-exceptions-list" aria-label="Excepciones de cronograma">
        {items.map((item, index) => (
          <li
            key={`${item.workNodeId}-${item.kind}-${index}`}
            className="ct-exceptions-item"
            tabIndex={index === focusedIndex ? 0 : -1}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <strong>{item.workNodeId}</strong>
            <span className="ct-exceptions-kind">{item.kind}</span>
            <p>{item.summary}</p>
          </li>
        ))}
      </ul>
      <p className="planner-muted">
        Usa el teclado para revisar excepciones antes de abrir el detalle en Gantt.
      </p>
    </div>
  );
}
