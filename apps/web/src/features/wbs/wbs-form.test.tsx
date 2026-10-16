import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WbsWorkspace } from "./WbsWorkspace.js";

vi.mock("./api.js", () => ({
  createWbsApi: () => ({
    listTree: vi.fn(),
    createPackage: vi.fn(),
    reparentNode: vi.fn(),
    createProjectionLink: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe("WbsWorkspace", () => {
  it("wraps legends inside fieldset elements", () => {
    render(<WbsWorkspace />);
    const fieldsets = screen.getAllByRole("group");
    expect(fieldsets.length).toBe(4);
    for (const fieldset of fieldsets) {
      expect(fieldset.tagName).toBe("FIELDSET");
      expect(fieldset.querySelector("legend")).toBeTruthy();
    }
  });

  it("renders WBS and dependency fieldsets with accessible legends", () => {
    render(<WbsWorkspace />);
    expect(screen.getByText(/Árbol WBS del proyecto/i)).toBeTruthy();
    expect(screen.getByLabelText(/Código WBS/i)).toBeTruthy();
    expect(screen.getByText(/Dependencia jerárquica/i)).toBeTruthy();
    expect(screen.getByText(/Dependencia de proyección/i)).toBeTruthy();
  });
});
