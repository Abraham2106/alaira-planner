import type { SlackAppMentionPayload } from "./types.js";

export const SYNTHETIC_SLACK_USER_LINKED = "U_SYNTH_LINKED_0121";
export const SYNTHETIC_SLACK_USER_GUEST = "U_SYNTH_GUEST_0121";
export const SYNTHETIC_SLACK_CHANNEL = "C_SYNTH_GENERAL_0121";

export function syntheticAppMention(
  overrides: Partial<SlackAppMentionPayload> & { text: string },
): SlackAppMentionPayload {
  return {
    type: "app_mention",
    user: overrides.user ?? SYNTHETIC_SLACK_USER_LINKED,
    text: overrides.text,
    channel: overrides.channel ?? SYNTHETIC_SLACK_CHANNEL,
    ts: overrides.ts ?? "1729000000.000100",
    team: overrides.team ?? "T_SYNTH_0121",
  };
}

export function syntheticSlackWebhookBody(suffix: string, text: string, user?: string) {
  const mention = syntheticAppMention({ text, user, ts: `1729000000.${suffix}` });
  return {
    provider: "slack",
    eventId: `ev-slack-0121-${suffix}`,
    deliveryId: `del-slack-0121-${suffix}`,
    resourceId: mention.channel,
    payload: { slack: mention },
  };
}
