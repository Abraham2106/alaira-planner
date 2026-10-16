import { buildWebhookDedupKey } from "../fabric/dedup.js";
import type { SlackAppMentionPayload, SlackWebhookPayload } from "./types.js";
import { classifySlackIntent, type ClassifiedIntent } from "./intent.js";

export type NormalizedSlackMention = {
  provider: "slack";
  eventId: string;
  deliveryId: string;
  dedupKey: string;
  slackUserId: string;
  channelId: string;
  messageTs: string;
  text: string;
  intent: ClassifiedIntent;
};

export function parseSlackWebhookPayload(payload: Record<string, unknown>): SlackWebhookPayload {
  const slack = payload.slack as SlackAppMentionPayload | undefined;
  if (!slack || slack.type !== "app_mention" || !slack.user || !slack.text) {
    throw new Error("invalid_slack_payload");
  }
  return { slack };
}

export function normalizeSlackMention(
  eventId: string,
  deliveryId: string,
  payload: Record<string, unknown>,
): NormalizedSlackMention {
  const { slack } = parseSlackWebhookPayload(payload);
  const dedupKey = buildWebhookDedupKey({
    provider: "slack",
    eventId,
    deliveryId,
  });
  return {
    provider: "slack",
    eventId,
    deliveryId,
    dedupKey,
    slackUserId: slack.user,
    channelId: slack.channel,
    messageTs: slack.ts,
    text: slack.text,
    intent: classifySlackIntent(slack.text),
  };
}
