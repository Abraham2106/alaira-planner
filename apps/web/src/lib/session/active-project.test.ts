import { afterEach, describe, expect, it } from "vitest";
import {
  ACTIVE_PROJECT_STORAGE_KEY,
  clearActiveProjectId,
  hrefWithProject,
  projectIdFromHash,
  readActiveProjectId,
  rememberActiveProjectId,
} from "./active-project.js";

afterEach(() => {
  sessionStorage.clear();
  window.location.hash = "#/";
});

describe("active project id", () => {
  it("reads the hash query ahead of session storage", () => {
    sessionStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "prj_stored");
    expect(projectIdFromHash("#/projects/wbs?project=prj_hash")).toBe("prj_hash");
    expect(readActiveProjectId("#/projects/wbs?project=prj_hash")).toBe("prj_hash");
  });

  it("keeps the same id in session storage after remember and clear", () => {
    window.location.hash = "#/projects";
    rememberActiveProjectId("prj_018f00000000700080000000000001");
    expect(sessionStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBe(
      "prj_018f00000000700080000000000001",
    );
    expect(window.location.hash).toContain("project=prj_018f00000000700080000000000001");
    window.location.hash = "#/projects/gantt";
    expect(readActiveProjectId()).toBe("prj_018f00000000700080000000000001");
    expect(hrefWithProject("#/projects/control")).toBe(
      "#/projects/control?project=prj_018f00000000700080000000000001",
    );
    expect(hrefWithProject("#/my-work")).toBe("#/my-work");
    clearActiveProjectId();
    expect(sessionStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBeNull();
  });
});
