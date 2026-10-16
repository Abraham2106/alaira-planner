import { schemas, type AcceptPocItemBody } from "@alaira/contracts/poc";
import type { ApiClient } from "./http-client.js";

export function createPocApi(client: ApiClient) {
  return {
    getItem(id: string) {
      return client.get(`poc/items/${encodeURIComponent(id)}`, schemas.PocItemResponse);
    },
    acceptItem(id: string, body: AcceptPocItemBody) {
      return client.post(
        `poc/items/${encodeURIComponent(id)}/accept`,
        schemas.PocItemResponse,
        body,
      );
    },
  };
}

export type PocApi = ReturnType<typeof createPocApi>;
