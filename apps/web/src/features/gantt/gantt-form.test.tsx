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
  it("uses fieldset and legend for load and view sections", () => {
    render(<GanttWorkspace />);
    const fieldsets = screen.getAllByRole("group");
    expect(fieldsets.length).toBeGreaterThanOrEqual(1);
    for (const fieldset of fieldsets) {
      expect(fieldset.tagName).toBe("FIELDSET");
      expect(fieldset.querySelector("legend")).toBeTruthy();
    }
    expect(screen.getByText(/Cargar cronograma del proyecto/i)).toBeTruthy();
    expect(screen.getByLabelText(/ID de proyecto/i)).toBeTruthy();
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
