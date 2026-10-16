import { timingSafeEqual } from "node:crypto";
import { DomainError } from "../index.js";

export function assertCsrfMatch(expected: string, provided: string | undefined): void {
  if (!provided || provided.length !== expected.length) {
    throw new DomainError("FORBIDDEN", "CSRF validation failed");
  }
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new DomainError("FORBIDDEN", "CSRF validation failed");
  }
}
