import { describe, expect, it } from "vitest";
import { createTestStrategyFixtures } from "./fixtures/build.js";

describe("TEST_STRATEGY §3 fixtures", () => {
  const fx = createTestStrategyFixtures();

  it("defines tenants A/B with homonymous primary users", () => {
    const nameA = fx.tenants.a.users[0]?.displayName;
    const nameB = fx.tenants.b.users[0]?.displayName;
    expect(nameA).toBe(nameB);
    expect(fx.tenants.a.id).not.toBe(fx.tenants.b.id);
    expect(fx.tenants.a.users[0]?.tenantId).toBe(fx.tenants.a.id);
    expect(fx.tenants.b.users[0]?.tenantId).toBe(fx.tenants.b.id);
  });

  it("predictive project has two-level WBS and two calendars with holidays", () => {
    const p = fx.predictiveProject.a;
    expect(p.wbs.children?.length).toBe(2);
    expect(p.calendars).toHaveLength(2);
    expect(p.calendars[0]?.holidays.length).toBeGreaterThan(0);
    expect(p.calendars[1]?.holidays.length).toBeGreaterThan(0);
  });

  it("agile project enforces WIP=2 and changed workflow", () => {
    const a = fx.agileProject.a;
    const doing = a.columns.find((c) => c.name === "Doing");
    expect(doing?.wipLimit).toBe(2);
    expect(a.workflowRevision.to).toBeGreaterThan(a.workflowRevision.from);
  });

  it("Plataforma 2.0 hybrid maps stories to one deliverable per tenant", () => {
    const h = fx.hybridPlatform.a;
    expect(h.name).toBe("Plataforma 2.0");
    expect(h.branches.some((b) => b.deliveryProfile === "predictive")).toBe(true);
    expect(h.branches.some((b) => b.deliveryProfile === "scrum")).toBe(true);
    expect(h.storyMappings[0]?.storyIds.length).toBeGreaterThan(1);
    expect(h.branches.every((b) => b.baselineFinish !== b.forecastFinish)).toBe(true);
  });

  it("includes documentary evidence and three autonomy AIProposals per tenant", () => {
    const perTenant = fx.evidenceEvents.filter((e) => e.repositoryIndependent);
    expect(perTenant.length).toBeGreaterThanOrEqual(2);
    for (const tenant of [fx.tenants.a.id, fx.tenants.b.id]) {
      const levels = fx.aiProposals
        .filter((p) => p.tenantId === tenant)
        .map((p) => p.autonomyLevel);
      expect(levels).toContain("informar");
      expect(levels).toContain("proponer");
      expect(levels).toContain("controlado");
    }
  });

  it("records direct write attempts for schedule and cost", () => {
    const fields = new Set(fx.directWriteAttempts.map((d) => d.attemptedField));
    expect(fields.has("schedule_finish")).toBe(true);
    expect(fields.has("cost_amount")).toBe(true);
  });
});
