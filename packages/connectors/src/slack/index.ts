export { classifySlackIntent, type ClassifiedIntent, type SlackIntentKind } from "./intent.js";
export { normalizeSlackMention, parseSlackWebhookPayload, type NormalizedSlackMention } from "./normalize.js";
export {
  SYNTHETIC_SLACK_CHANNEL,
  SYNTHETIC_SLACK_USER_GUEST,
  SYNTHETIC_SLACK_USER_LINKED,
  syntheticAppMention,
  syntheticSlackWebhookBody,
} from "./synthetic.js";
export type { SlackAppMentionPayload, SlackWebhookPayload } from "./types.js";
