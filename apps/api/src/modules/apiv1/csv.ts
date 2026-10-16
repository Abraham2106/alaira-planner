import {
  PORT_SAMPLE_MAX_ROWS,
  PORT_SAMPLE_PROJECT_HEADERS,
} from "@alaira/contracts/apiv1";
import type { DeliveryProfile } from "@alaira/domain/project";
import { assertDeliveryProfile } from "@alaira/domain/project";

export type CsvProjectRow = {
  rowNum: number;
  name: string;
  deliveryProfile: DeliveryProfile;
};

export type CsvParseResult =
  | { ok: true; rows: CsvProjectRow[] }
  | { ok: false; errors: { row: number; message: string }[] };

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function boolCell(value: string, row: number, col: string): boolean | { error: string } {
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return { error: `Invalid boolean for ${col} at row ${row}` };
}

export function parseProjectsSampleCsv(text: string): CsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line, idx) => line.length > 0 || idx === 0);
  if (lines.length === 0) {
    return { ok: false, errors: [{ row: 1, message: "Empty CSV" }] };
  }
  const headerCells = parseCsvLine(lines[0]!);
  const expected = [...PORT_SAMPLE_PROJECT_HEADERS];
  if (headerCells.length !== expected.length || !expected.every((h, i) => headerCells[i] === h)) {
    return {
      ok: false,
      errors: [
        {
          row: 1,
          message: `Header must be exactly: ${expected.join(",")}`,
        },
      ],
    };
  }
  const dataLines = lines.slice(1);
  if (dataLines.length > PORT_SAMPLE_MAX_ROWS) {
    return {
      ok: false,
      errors: [
        {
          row: PORT_SAMPLE_MAX_ROWS + 2,
          message: `Row limit ${PORT_SAMPLE_MAX_ROWS} exceeded (${dataLines.length} data rows); import rejected`,
        },
      ],
    };
  }
  const errors: { row: number; message: string }[] = [];
  const rows: CsvProjectRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const rowNum = i + 2;
    const cells = parseCsvLine(dataLines[i]!);
    if (cells.length !== expected.length) {
      errors.push({ row: rowNum, message: `Expected ${expected.length} columns` });
      continue;
    }
    const [
      name,
      planningMode,
      scheduleEngine,
      agileExecution,
      financialControl,
      resourcePlanning,
      baselineRequired,
    ] = cells;
    if (!name?.trim()) {
      errors.push({ row: rowNum, message: "name is required" });
      continue;
    }
    const se = boolCell(scheduleEngine ?? "", rowNum, "schedule_engine");
    if (typeof se !== "boolean") {
      errors.push({ row: rowNum, message: se.error });
      continue;
    }
    const ae = boolCell(agileExecution ?? "", rowNum, "agile_execution");
    if (typeof ae !== "boolean") {
      errors.push({ row: rowNum, message: ae.error });
      continue;
    }
    const rp = boolCell(resourcePlanning ?? "", rowNum, "resource_planning");
    if (typeof rp !== "boolean") {
      errors.push({ row: rowNum, message: rp.error });
      continue;
    }
    const br = boolCell(baselineRequired ?? "", rowNum, "baseline_required");
    if (typeof br !== "boolean") {
      errors.push({ row: rowNum, message: br.error });
      continue;
    }
    try {
      const deliveryProfile = assertDeliveryProfile({
        planningMode: planningMode as DeliveryProfile["planningMode"],
        scheduleEngine: se,
        agileExecution: ae,
        financialControl: financialControl as DeliveryProfile["financialControl"],
        resourcePlanning: rp,
        baselineRequired: br,
      });
      rows.push({ rowNum, name: name.trim(), deliveryProfile });
    } catch {
      errors.push({ row: rowNum, message: "Invalid delivery profile combination" });
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, rows };
}

export function serializeProjectsSampleCsv(
  rows: { name: string; deliveryProfile: DeliveryProfile }[],
): string {
  const header = PORT_SAMPLE_PROJECT_HEADERS.join(",");
  const body = rows.map((row) => {
    const p = row.deliveryProfile;
    const cells = [
      `"${row.name.replace(/"/g, '""')}"`,
      p.planningMode,
      String(p.scheduleEngine),
      String(p.agileExecution),
      p.financialControl,
      String(p.resourcePlanning),
      String(p.baselineRequired),
    ];
    return cells.join(",");
  });
  return [header, ...body].join("\n") + (body.length ? "\n" : "");
}
