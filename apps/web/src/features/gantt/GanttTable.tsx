import { KeyboardEvent, useCallback, useId, useRef, useState } from "react";
import { resolveDefaultLocale } from "../shell/datetime/format.js";
import type { GanttTaskRow } from "./gantt-model.js";
import { formatEpochMs, formatVarianceMinutes } from "./format-schedule.js";

type GanttTableProps = {
  rows: GanttTaskRow[];
};

export function GanttTable({ rows }: GanttTableProps) {
  const tableId = useId();
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const locale = resolveDefaultLocale();

  const focusRow = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, rows.length - 1));
    setFocusedIndex(clamped);
    rowRefs.current[clamped]?.focus();
  }, [rows.length]);

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusRow(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusRow(rows.length - 1);
    }
  };

  return (
    <div className="gantt-table-wrap">
      <table className="gantt-table" id={tableId} aria-label="Cronograma tabular con desviación vs baseline">
        <thead>
          <tr>
            <th scope="col">Tarea</th>
            <th scope="col">Baseline fin</th>
            <th scope="col">Forecast fin</th>
            <th scope="col">Real fin</th>
            <th scope="col">Δ forecast vs baseline</th>
            <th scope="col">Δ real vs baseline</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.workNodeId}
              tabIndex={index === focusedIndex ? 0 : -1}
              data-focused={index === focusedIndex ? "true" : undefined}
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              onFocus={() => setFocusedIndex(index)}
              onKeyDown={(event) => onRowKeyDown(event, index)}
            >
              <th scope="row">{row.workNodeId}</th>
              <td>{formatEpochMs(row.baselineFinishMs, locale)}</td>
              <td>{formatEpochMs(row.forecastFinishMs, locale)}</td>
              <td>{formatEpochMs(row.actualFinishMs, locale)}</td>
              <td>{formatVarianceMinutes(row.forecastFinishVsBaselineMinutes)}</td>
              <td>{formatVarianceMinutes(row.actualFinishVsBaselineMinutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="planner-muted" id={`${tableId}-hint`}>
        Usa flechas arriba/abajo, Inicio y Fin para moverte entre filas cuando una fila tiene el foco.
      </p>
    </div>
  );
}
