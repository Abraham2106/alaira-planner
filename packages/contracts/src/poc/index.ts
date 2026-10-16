import { z } from "zod";

export const context = "poc";

export const schemas = {
  AcceptPocItemBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
  }),
  PocItemResponse: z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(["draft", "accepted"]),
  }),
};

export type AcceptPocItemBody = z.infer<(typeof schemas)["AcceptPocItemBody"]>;
