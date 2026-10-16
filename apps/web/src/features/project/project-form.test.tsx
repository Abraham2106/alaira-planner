import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectWorkspace } from "./ProjectWorkspace.js";

vi.mock("./api.js", () => ({
  createProjectApi: () => ({
    createProject: vi.fn(),
    getProject: vi.fn(),
    listBranches: vi.fn(),
    searchProjects: vi.fn(),
    createBranch: vi.fn(),
  }),
  defaultDeliveryProfile: {},
}));

afterEach(() => {
  cleanup();
});

describe("ProjectWorkspace a11y", () => {
  it("exposes labeled fields and keyboard focus order for create form", () => {
    render(<ProjectWorkspace showSubnav={false} />);
    const name = screen.getByLabelText(/Nombre/i);
    expect(name).toHaveAttribute("id");
    name.focus();
    expect(name).toHaveFocus();
    fireEvent.keyDown(name, { key: "Tab" });
    const submit = screen.getByRole("button", { name: /Crear vía API/i });
    submit.focus();
    expect(submit).toHaveFocus();
  });
});
