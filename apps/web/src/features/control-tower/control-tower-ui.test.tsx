import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ControlTowerWorkspace } from "./ControlTowerWorkspace.js";
import { EventLogList } from "./EventLogList.js";
import { MyWorkWorkspace } from "./MyWorkWorkspace.js";

vi.mock("./api.js", () => ({
  createControlTowerApi: () => ({
    getBaselineVariance: vi.fn(),
    searchEventLog: vi.fn(),
    runObservation: vi.fn(),
    confirmProposal: vi.fn(),
    rejectProposal: vi.fn(),
  }),
  newIdempotencyKey: () => "test-idempotency-key-012345678901234567890",
}));

afterEach(() => {
  cleanup();
});

describe("ControlTowerWorkspace", () => {
  it("uses fieldset/legend for load and tab sections", () => {
    render(<ControlTowerWorkspace />);
    expect(screen.getByText(/Cargar cockpit del proyecto/i)).toBeTruthy();
    expect(screen.getAllByLabelText(/ID de proyecto/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Vistas de control/i)).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: /Vista de control/i })).toBeTruthy();
  });
});

describe("MyWorkWorkspace", () => {
  it("renders Ask/Command legend", () => {
    render(<MyWorkWorkspace />);
    expect(screen.getByText(/Ask \/ Command/i)).toBeTruthy();
  });
});

describe("EventLogList keyboard", () => {
  it("moves focus between log entries with arrow keys", () => {
    render(
      <EventLogList
        entries={[
          {
            id: "a",
            sequenceNum: 1,
            eventType: "test.a",
            summary: "s1",
            occurredAt: "2026-01-01T12:00:00.000Z",
            readable: "readable one",
          },
          {
            id: "b",
            sequenceNum: 2,
            eventType: "test.b",
            summary: "s2",
            occurredAt: "2026-01-02T12:00:00.000Z",
            readable: "readable two",
          },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    items[0]?.focus();
    fireEvent.keyDown(items[0]!, { key: "ArrowDown" });
    expect(items[1]).toHaveFocus();
  });
});
