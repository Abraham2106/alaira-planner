import { describe, expect, it } from "vitest";
import { acceptPocItem, DomainError, type ActorContext, type PocItem, type TenantId } from "./index.js";

const tenantA = "018f0000-0000-7000-8000-000000000001" as TenantId;
const tenantB = "018f0000-0000-7000-8000-000000000002" as TenantId;

describe("acceptPocItem", () => {
  it("denies cross-tenant as NOT_FOUND", () => {
    const item: PocItem = {
      id: "x",
      tenantId: tenantB,
      title: "t",
      status: "draft",
      version: 1,
    };
    const actor: ActorContext = {
      tenantId: tenantA,
      userId: "u",
      roles: ["member"],
    };
    expect(() => acceptPocItem(item, actor)).toThrow(DomainError);
  });
});
