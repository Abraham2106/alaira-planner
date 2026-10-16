export const AUTHZ_ACTIONS = [
  "org:read",
  "org:invite",
  "org:manage_members",
  "membership:assign_role",
  "project:read",
  "project:write",
  "poc:write",
] as const;

export type AuthzAction = (typeof AUTHZ_ACTIONS)[number];

export function isAuthzAction(value: string): value is AuthzAction {
  return (AUTHZ_ACTIONS as readonly string[]).includes(value);
}
