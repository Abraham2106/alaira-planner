import { ApiClientError } from "../../lib/api-client/errors.js";
import { hasSessionCredential } from "../../lib/api-client/csrf.js";

export type WorkNodeRef = {
  id: string;
  nodeType: "work_package" | "deliverable" | "milestone";
  parentWorkNodeId: string | null;
};

export type LifecycleFact = {
  executionStatus: "in_progress" | "execution_complete";
  completionRequestStatus: "none" | "pending" | "withdrawn";
  acceptanceStatus: "not_accepted" | "accepted" | "rejected";
};

export type RollupFact = {
  workNodeId: string;
  progressPercent: number;
  leaves: { workNodeId: string; weight: number; progressPercent: number }[];
};

export type AcceptanceFact = {
  workNodeId: string;
  progressPercent: number;
  lifecycle: LifecycleFact;
};

export type NodeFact = {
  progressPercent: number | null;
  weight: number | null;
  responsibleName: string | null;
  lifecycle: LifecycleFact | null;
};

export function assembleFacts(input: {
  nodes: readonly WorkNodeRef[];
  rollups: readonly RollupFact[];
  acceptance: readonly AcceptanceFact[];
  assignments: readonly { workNodeId: string; personId: string }[];
  people: readonly { id: string; displayName: string }[];
}): Record<string, NodeFact> {
  const facts: Record<string, NodeFact> = {};
  for (const node of input.nodes) {
    facts[node.id] = {
      progressPercent: null,
      weight: null,
      responsibleName: null,
      lifecycle: null,
    };
  }

  for (const rollup of input.rollups) {
    for (const leaf of rollup.leaves) {
      const fact = facts[leaf.workNodeId];
      if (!fact) continue;
      fact.weight = leaf.weight;
      fact.progressPercent = leaf.progressPercent;
    }
  }

  for (const rollup of input.rollups) {
    const own = facts[rollup.workNodeId];
    if (own) own.progressPercent = rollup.progressPercent;
  }

  for (const row of input.acceptance) {
    const fact = facts[row.workNodeId];
    if (!fact) continue;
    fact.lifecycle = row.lifecycle;
    if (fact.progressPercent === null) fact.progressPercent = row.progressPercent;
  }

  const names = new Map(input.people.map((person) => [person.id, person.displayName]));
  const byNode = new Map<string, string[]>();
  for (const assignment of input.assignments) {
    const name = names.get(assignment.personId);
    if (!name) continue;
    const list = byNode.get(assignment.workNodeId) ?? [];
    list.push(name);
    byNode.set(assignment.workNodeId, list);
  }
  for (const [id, list] of byNode) {
    const fact = facts[id];
    if (fact) fact.responsibleName = list.join(" · ");
  }

  return facts;
}

/** One root package rollup. Several roots are not averaged. */
export function projectProgressPercent(
  nodes: readonly WorkNodeRef[],
  facts: Record<string, NodeFact>,
): number | null {
  const roots = nodes.filter(
    (node) => node.parentWorkNodeId === null && node.nodeType === "work_package",
  );
  if (roots.length !== 1) return null;
  return facts[roots[0]!.id]?.progressPercent ?? null;
}

export function classifyFailure(error: unknown): "session" | "forbidden" | "error" {
  if (error instanceof ApiClientError && error.status === 403) {
    return hasSessionCredential() ? "forbidden" : "session";
  }
  return "error";
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}
