import { DomainError } from "../index.js";

export function assertPasswordAcceptable(password: string): void {
  if (password.length < 12) {
    throw new DomainError("VALIDATION", "Password must be at least 12 characters");
  }
  if (password.length > 256) {
    throw new DomainError("VALIDATION", "Password too long");
  }
}
