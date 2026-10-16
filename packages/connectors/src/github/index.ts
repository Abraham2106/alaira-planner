export { createGithubSyntheticConnector, GithubSyntheticConnector } from "./github-connector.js";
export {
  buildGithubEvidenceDedupeKey,
  buildGithubExternalEventId,
  buildGithubResourceId,
  extractLinkedIssueNumber,
  GITHUB_PROVIDER,
  inferGithubEventType,
  normalizeGithubWebhook,
  type GithubLinkHint,
  type GithubWebhookEnvelope,
} from "./normalize.js";
export {
  SYNTHETIC_GITHUB_LOGIN,
  SYNTHETIC_GITHUB_REPO,
  syntheticPullRequestMerged,
  syntheticPullRequestOpened,
  type SyntheticPullRequestMergedPayload,
} from "./synthetic-payloads.js";
