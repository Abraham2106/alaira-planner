export const ORG_ROLES = ["owner", "admin", "member", "guest"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PROJECT_ROLES = ["pm", "reviewer", "executor"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export function isOrgRole(value: string): value is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(value);
}

export function isProjectRole(value: string): value is ProjectRole {
  return (PROJECT_ROLES as readonly string[]).includes(value);
}
