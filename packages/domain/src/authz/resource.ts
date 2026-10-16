export type PolicyResource =
  | { type: "organization"; tenantId: string }
  | { type: "membership"; tenantId: string; userId: string }
  | { type: "project"; tenantId: string; projectId: string };
