import type { DomainToolStore } from "../../domain-tools/store.js";
import { gatherCriterionKeysFromEvidence } from "./evidence.js";
import type { ProgressEvidenceInput } from "./types.js";

/** Merges evidence-derived checklist keys into the domain store snapshot. */
export function domainStoreWithEvidence(
  base: DomainToolStore,
  evidence: readonly ProgressEvidenceInput[],
): DomainToolStore {
  const fromEvidence = new Set(gatherCriterionKeysFromEvidence(evidence));

  return {
    ...base,
    async getAcceptanceCriteria(ctx) {
      const snapshot = await base.getAcceptanceCriteria(ctx);
      const satisfiedKeys = new Set(snapshot.satisfiedKeys);
      for (const key of fromEvidence) {
        satisfiedKeys.add(key);
      }
      return { criteria: snapshot.criteria, satisfiedKeys };
    },
  };
}
