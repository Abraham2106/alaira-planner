import { createHash } from "node:crypto";
import argon2 from "argon2";

/** Argon2id parameters aligned with OWASP memory-hard defaults (M1). */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
};

export async function hashPasswordArgon2id(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPasswordArgon2id(
  encoded: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(encoded, plain);
  } catch {
    return false;
  }
}

/** SHA-256 of opaque invitation / accept tokens (stored form). */
export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
