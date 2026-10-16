import { z } from "zod";

const uuid = z.string().uuid();

export const LinkIdentityBodySchema = z.object({
  slackUserId: z.string().min(1).max(64),
  appUserId: uuid,
});

export const MentionIngestResponseSchema = z.object({
  receiptId: z.string().uuid(),
  webhookStatus: z.enum(["accepted", "duplicate"]),
  outcome: z.enum([
    "pending_created",
    "duplicate_no_state_change",
    "needs_link",
    "needs_disambiguation",
    "rejected_permission",
    "ignored_unknown",
  ]),
  pendingRequestId: uuid.optional(),
  message: z.string(),
});

export const schemas = {
  LinkIdentityBody: LinkIdentityBodySchema,
  MentionIngestResponse: MentionIngestResponseSchema,
};
