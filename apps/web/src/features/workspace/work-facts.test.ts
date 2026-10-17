import { describe, expect, it } from "vitest";
import { ApiClientError } from "../../lib/api-client/errors.js";
import { CSRF_SESSION_KEY } from "../../lib/api-client/csrf.js";
import {
  assembleFacts,
  classifyFailure,
  projectProgressPercent,
  type WorkNodeRef,
} from "./work-facts.js";

const nodes: WorkNodeRef[] = [
  {
    id: "pkg_root",
    nodeType: "work_package",
    parentWorkNodeId: null,
  },
  {
    id: "del_a",
    nodeType: "deliverable",
    parentWorkNodeId: "pkg_root",
  },
  {
    id: "del_b",
    nodeType: "deliverable",
    parentWorkNodeId: "pkg_root",
  },
];

describe("assembleFacts", () => {
  it("uses the engine rollup instead of an equal-weight average", () => {
    const facts = assembleFacts({
      nodes,
      rollups: [
        {
          workNodeId: "pkg_root",
          progressPercent: 40,
          leaves: [
            { workNodeId: "del_a", weight: 1, progressPercent: 0 },
            { workNodeId: "del_b", weight: 1, progressPercent: 100 },
          ],
        },
      ],
      acceptance: [
        {
          workNodeId: "del_b",
          progressPercent: 100,
          lifecycle: {
            executionStatus: "execution_complete",
            completionRequestStatus: "none",
            acceptanceStatus: "accepted",
          },
        },
      ],
      assignments: [{ workNodeId: "del_a", personId: "per_1" }],
      people: [{ id: "per_1", displayName: "Ada" }],
    });

    expect(facts.pkg_root?.progressPercent).toBe(40);
    expect(facts.del_a?.progressPercent).toBe(0);
    expect(facts.del_a?.weight).toBe(1);
    expect(facts.del_a?.responsibleName).toBe("Ada");
    expect(facts.del_b?.responsibleName).toBeNull();
    expect(facts.del_b?.lifecycle?.acceptanceStatus).toBe("accepted");
    expect(projectProgressPercent(nodes, facts)).toBe(40);
  });

  it("leaves progress empty when the server did not return it", () => {
    const facts = assembleFacts({
      nodes,
      rollups: [],
      acceptance: [],
      assignments: [{ workNodeId: "del_a", personId: "per_missing" }],
      people: [],
    });
    expect(facts.pkg_root?.progressPercent).toBeNull();
    expect(facts.pkg_root?.weight).toBeNull();
    expect(facts.del_a?.responsibleName).toBeNull();
    expect(projectProgressPercent(nodes, facts)).toBeNull();
  });

  it("does not average several root packages", () => {
    const many: WorkNodeRef[] = [
      { id: "a", nodeType: "work_package", parentWorkNodeId: null },
      { id: "b", nodeType: "work_package", parentWorkNodeId: null },
    ];
    const facts = assembleFacts({
      nodes: many,
      rollups: [
        { workNodeId: "a", progressPercent: 10, leaves: [] },
        { workNodeId: "b", progressPercent: 90, leaves: [] },
      ],
      acceptance: [],
      assignments: [],
      people: [],
    });
    expect(projectProgressPercent(many, facts)).toBeNull();
    expect(facts.a?.progressPercent).toBe(10);
    expect(facts.b?.progressPercent).toBe(90);
  });
});

describe("classifyFailure", () => {
  it("treats 403 without a local credential as a missing session", () => {
    sessionStorage.removeItem(CSRF_SESSION_KEY);
    expect(classifyFailure(new ApiClientError(403, { error: "forbidden" }))).toBe("session");
  });

  it("treats 403 with a local credential as missing permission", () => {
    sessionStorage.setItem(CSRF_SESSION_KEY, "token");
    expect(classifyFailure(new ApiClientError(403, { error: "forbidden" }))).toBe("forbidden");
    sessionStorage.removeItem(CSRF_SESSION_KEY);
  });
});
