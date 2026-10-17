import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api-client/errors.js";
import { CSRF_SESSION_KEY } from "../../lib/api-client/csrf.js";
import { ACTIVE_PROJECT_STORAGE_KEY } from "../../lib/session/active-project.js";
import { routeFromHash } from "../shell/navigation/routes.js";
import { ProjectWork } from "./ProjectWork.js";

const PROJECT_ID = "prj_test0001";

const api = vi.hoisted(() => ({
  getProject: vi.fn(),
  listTree: vi.fn(),
  listPeople: vi.fn(),
  listAssignments: vi.fn(),
  getRollup: vi.fn(),
  getAcceptanceState: vi.fn(),
  requestCompletion: vi.fn(),
  acceptDeliverable: vi.fn(),
  rejectDeliverable: vi.fn(),
  revertAcceptance: vi.fn(),
  createEvidenceLink: vi.fn(),
  setProgressStrategy: vi.fn(),
  setManualProgress: vi.fn(),
}));

vi.mock("./work-api.js", () => ({
  createWorkApi: () => api,
}));

vi.mock("../gantt/api.js", () => ({
  createGanttApi: () => ({
    getBaselineVariance: vi.fn().mockRejectedValue(new ApiClientError(500, { error: "variance_down" })),
    getScheduleForecast: vi.fn(),
  }),
}));

const project = {
  id: PROJECT_ID,
  tenantId: "ten_test0001",
  name: "Obra real",
  deliveryProfile: {
    planningMode: "predictive",
    scheduleEngine: true,
    agileExecution: false,
    financialControl: "none",
    resourcePlanning: false,
    baselineRequired: false,
  },
  version: 1,
};

const tree = {
  nodes: [
    {
      id: "pkg_root",
      nodeType: "work_package" as const,
      wbsCode: "1",
      title: "Paquete",
      parentWorkNodeId: null,
    },
    {
      id: "del_a",
      nodeType: "deliverable" as const,
      wbsCode: "1.1",
      title: "Uno",
      parentWorkNodeId: "pkg_root",
    },
    {
      id: "del_b",
      nodeType: "deliverable" as const,
      wbsCode: "1.2",
      title: "Dos",
      parentWorkNodeId: "pkg_root",
    },
  ],
};

function stubReads() {
  api.getProject.mockResolvedValue(project);
  api.listTree.mockResolvedValue(tree);
  api.listPeople.mockResolvedValue({ people: [] });
  api.listAssignments.mockResolvedValue({ assignments: [] });
  api.getRollup.mockImplementation(async (_projectId: string, nodeId: string) => {
    if (nodeId !== "pkg_root") throw new ApiClientError(404, { error: "not_found" });
    return {
      workNodeId: "pkg_root",
      progressPercent: 40,
      leaves: [
        { workNodeId: "del_a", weight: 1, progressPercent: 0 },
        { workNodeId: "del_b", weight: 1, progressPercent: 100 },
      ],
    };
  });
  api.getAcceptanceState.mockImplementation(async (_projectId: string, nodeId: string) => ({
    workNodeId: nodeId,
    lifecycle: {
      executionStatus: "in_progress",
      completionRequestStatus: nodeId === "del_a" ? "pending" : "none",
      acceptanceStatus: "not_accepted",
    },
    progressPercent: nodeId === "del_b" ? 100 : 0,
    latestDecisionId: null,
  }));
}

beforeEach(() => {
  sessionStorage.clear();
  window.location.hash = "#/";
  for (const fn of Object.values(api)) fn.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("route del ejemplo", () => {
  it("keeps the example off the home route", () => {
    expect(routeFromHash("#/").id).toBe("home");
    expect(routeFromHash("#/ejemplo").id).toBe("ejemplo");
    expect(routeFromHash("#/projects/wbs?project=prj_test0001").id).toBe("wbs");
  });
});

describe("ProjectWork", () => {
  it("asks for a project instead of showing the example", () => {
    render(<ProjectWork />);
    expect(screen.getByRole("heading", { name: "Elegí un proyecto" })).toBeTruthy();
    expect(screen.queryByText("ALA-01")).toBeNull();
    expect(screen.queryByLabelText(/ID de proyecto/i)).toBeNull();
  });

  it("shows engine rollup progress and acceptance actions", async () => {
    sessionStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, PROJECT_ID);
    stubReads();
    render(<ProjectWork />);
    expect(await screen.findByRole("heading", { name: "Obra real" })).toBeTruthy();
    expect(screen.getByTestId("project-progress")).toHaveTextContent("40%");
    expect(screen.queryByText("50%")).toBeNull();
    expect(screen.getAllByText("Sin dato del servidor").length).toBeGreaterThan(0);
    const region = screen.getByRole("region", { name: /Trabajo del proyecto/i });
    region.focus();
    expect(region).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /Uno/i }));
    expect(screen.getByRole("button", { name: "Solicitar finalización" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aceptar entregable" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rechazar entregable" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Revertir aceptación" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Vincular evidencia" })).toBeTruthy();
    expect(screen.queryByLabelText(/Estado de la tarea/i)).toBeNull();
  });

  it("keeps only pending completion requests on my work", async () => {
    sessionStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, PROJECT_ID);
    stubReads();
    render(<ProjectWork mode="decisions" />);
    expect(await screen.findByRole("button", { name: /Uno/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Dos/i })).toBeNull();
    expect(screen.queryByText("ALA-01")).toBeNull();
  });

  it("shows forbidden without falling back to example data", async () => {
    sessionStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, PROJECT_ID);
    sessionStorage.setItem(CSRF_SESSION_KEY, "token");
    api.getProject.mockRejectedValue(new ApiClientError(403, { error: "forbidden" }));
    api.listTree.mockRejectedValue(new ApiClientError(403, { error: "forbidden" }));
    render(<ProjectWork />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/No tienes permiso/i);
    expect(screen.queryByText("ALA-01")).toBeNull();
    expect(screen.queryByText("Obra real")).toBeNull();
  });

  it("shows an error on the schedule instead of the example timeline", async () => {
    sessionStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, PROJECT_ID);
    stubReads();
    render(<ProjectWork />);
    await screen.findByRole("heading", { name: "Obra real" });
    fireEvent.click(screen.getByRole("button", { name: "Cronograma" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText(/Octubre 2026/i)).toBeNull();
  });
});
