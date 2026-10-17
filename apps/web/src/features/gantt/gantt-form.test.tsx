import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GanttWorkspace } from "./GanttWorkspace.js";
import { mapVarianceToRows } from "./gantt-model.js";
import { GanttTable } from "./GanttTable.js";

vi.mock("./api.js", () => ({
  createGanttApi: () => ({
    getBaselineVariance: vi.fn(),
    getBaselineSummary: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe("GanttWorkspace", () => {
  it("loads from the active project instead of an id field", () => {
    render(<GanttWorkspace />);
    expect(screen.queryByLabelText(/ID de proyecto/i)).toBeNull();
    expect(screen.getByText(/Elegí un proyecto/i)).toBeTruthy();
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("does not expose baseline mutation controls", () => {
    render(<GanttWorkspace />);
    expect(screen.queryByRole("button", { name: /aprobar baseline/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /mutar/i })).toBeNull();
  });
});

describe("GanttTable keyboard", () => {
  it("moves row focus with arrow keys", () => {
    const rows = mapVarianceToRows({
      projectId: "prj_018f00000000700080000000000001",
      baselineVersion: 1,
      forecastVersion: 1,
      tasks: [
        {
          workNodeId: "wkn_a",
          baseline: {
            workNodeId: "wkn_a",
            earlyStartEpochMs: 1,
            earlyFinishEpochMs: 2,
            plannedCostMinor: null,
          },
          forecast: null,
          actual: null,
          variance: {
            workNodeId: "wkn_a",
            forecastFinishVsBaselineMinutes: null,
            actualFinishVsBaselineMinutes: null,
            actualCostVsBaselineMinor: null,
          },
        },
        {
          workNodeId: "wkn_b",
          baseline: {
            workNodeId: "wkn_b",
            earlyStartEpochMs: 3,
            earlyFinishEpochMs: 4,
            plannedCostMinor: null,
          },
          forecast: null,
          actual: null,
          variance: {
            workNodeId: "wkn_b",
            forecastFinishVsBaselineMinutes: 10,
            actualFinishVsBaselineMinutes: null,
            actualCostVsBaselineMinor: null,
          },
        },
      ],
    });
    render(<GanttTable rows={rows} />);
    const bodyRows = screen.getAllByRole("row").slice(1);
    bodyRows[0]?.focus();
    fireEvent.keyDown(bodyRows[0]!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(bodyRows[1]);
  });
});
