export class DirectDomainWriteForbiddenError extends Error {
  constructor(detail = "Direct domain persistence from AI is forbidden") {
    super(detail);
    this.name = "DirectDomainWriteForbiddenError";
  }
}

export class PolicyGateError extends Error {
  constructor(
    readonly code:
      | "direct_write_forbidden"
      | "unknown_tool"
      | "forbidden_actor"
      | "elevation_required"
      | "controlado_requires_approver"
      | "policy_gate",
    message: string,
  ) {
    super(message);
    this.name = "PolicyGateError";
  }
}
