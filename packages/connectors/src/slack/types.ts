/** Synthetic Slack event shapes (no Slack API calls in M1). */

export type SlackAppMentionPayload = {
  type: "app_mention";
  user: string;
  text: string;
  channel: string;
  ts: string;
  team?: string;
};

export type SlackWebhookPayload = {
  slack: SlackAppMentionPayload;
};
