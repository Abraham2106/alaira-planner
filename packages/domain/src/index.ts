export type TenantId = string & { readonly __brand: "TenantId" };

export type ActorContext = {
  tenantId: TenantId;
  userId: string;
  roles: readonly string[];
};

export type PocItemStatus = "draft" | "accepted";

export type PocItem = {
  id: string;
  tenantId: TenantId;
  title: string;
  status: PocItemStatus;
  version: number;
};

export type AcceptPocItemCommand = {
  itemId: string;
  idempotencyKey: string;
};

export type DomainErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "VALIDATION";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function assertTenantScope(
  actor: ActorContext,
  resourceTenantId: TenantId,
): void {
  if (actor.tenantId !== resourceTenantId) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
}

export function acceptPocItem(
  item: PocItem,
  actor: ActorContext,
): { item: PocItem; domainEvent: { type: "poc.item.accepted"; itemId: string } } {
  assertTenantScope(actor, item.tenantId);
  if (item.status === "accepted") {
    throw new DomainError("CONFLICT", "Item already accepted");
  }
  const next: PocItem = {
    ...item,
    status: "accepted",
    version: item.version + 1,
  };
  return {
    item: next,
    domainEvent: { type: "poc.item.accepted", itemId: item.id },
  };
}
