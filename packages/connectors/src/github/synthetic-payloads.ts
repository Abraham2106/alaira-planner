/** Payloads GitHub sintéticos (sin API real). */

export const SYNTHETIC_GITHUB_REPO = "synth-org/alaira-demo";
export const SYNTHETIC_GITHUB_LOGIN = "synth-gh-actor";

export type SyntheticPullRequestMergedPayload = {
  action: "closed";
  pull_request: {
    id: number;
    number: number;
    merged: true;
    merged_at: string;
    html_url: string;
    title: string;
    body: string;
    head: { ref: string };
    user: { login: string; id: number };
  };
  repository: { full_name: string; id: number };
  linked_issue_number?: number;
};

export function syntheticPullRequestMerged(
  suffix: string,
  opts?: { issueNumber?: number; branchRef?: string },
): SyntheticPullRequestMergedPayload {
  const issue = opts?.issueNumber ?? 7;
  return {
    action: "closed",
    pull_request: {
      id: 900_000 + issue,
      number: 42,
      merged: true,
      merged_at: "2026-10-16T08:00:00.000Z",
      html_url: `https://github.local/${SYNTHETIC_GITHUB_REPO}/pull/42`,
      title: `[SYNTHETIC] Merge feature ${suffix}`,
      body: `Closes #${issue}\n\nEvidencia TC-GH-01 (${suffix})`,
      head: { ref: opts?.branchRef ?? `feature/tc-gh-01-${suffix}` },
      user: { login: SYNTHETIC_GITHUB_LOGIN, id: 4242 },
    },
    repository: { full_name: SYNTHETIC_GITHUB_REPO, id: 101 },
    linked_issue_number: issue,
  };
}

export function syntheticPullRequestOpened(suffix: string): Record<string, unknown> {
  return {
    action: "opened",
    pull_request: {
      id: 800_000,
      number: 99,
      merged: false,
      html_url: `https://github.local/${SYNTHETIC_GITHUB_REPO}/pull/99`,
      title: `[SYNTHETIC] WIP ${suffix}`,
      user: { login: SYNTHETIC_GITHUB_LOGIN, id: 4242 },
    },
    repository: { full_name: SYNTHETIC_GITHUB_REPO, id: 101 },
  };
}
