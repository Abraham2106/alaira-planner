import { KeyboardEvent, useCallback, useId, useRef, useState } from "react";
import type { ScheduleException } from "./exceptions-model.js";

type ExceptionsListProps = {
  items: ScheduleException[];
  loaded?: boolean;
};

const KIND_LABEL: Record<ScheduleException["kind"], string> = {
  forecast_slip: "Desvío de forecast",
  actual_slip: "Desvío real",
  cost_overrun: "Desvío de coste",
};

export function ExceptionsList({ items, loaded = true }: ExceptionsListProps) {
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
      <p className="ct-empty" role="status">
        {loaded ? "No hay excepciones en este proyecto." : "Cargá el proyecto para ver excepciones."}
      </p>
    );
  }

  return (
    <div className="ct-sheet">
      <div className="ct-row ct-row-head" aria-hidden="true">
        <span>Nodo</span>
        <span>Tipo</span>
        <span>Detalle</span>
      </div>
      <ul id={listId} className="ct-rows" aria-label="Excepciones de cronograma">
        {items.map((item, index) => (
          <li
            key={`${item.workNodeId}-${item.kind}-${index}`}
            className="ct-row"
            tabIndex={index === focusedIndex ? 0 : -1}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span className="ct-row-id">{item.workNodeId}</span>
            <span className="ct-row-kind">{KIND_LABEL[item.kind]}</span>
            <span className="ct-row-summary" title={item.summary}>
              {item.summary}
            </span>
          </li>
        ))}
      </ul>
      <p className="ct-note">Flechas, Inicio y Fin para recorrer excepciones.</p>
    </div>
  );
}
