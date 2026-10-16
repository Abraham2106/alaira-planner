import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EncryptedSecret = {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
  keyId: string;
};

const DEFAULT_KEY_ID = "fabric-dev-v1";

export function resolveFabricMasterKey(): Buffer {
  const env = process.env.CONNECTOR_FABRIC_MASTER_KEY;
  if (env) {
    const buf = Buffer.from(env, "base64");
    if (buf.length === 32) return buf;
  }
  return createHash("sha256").update("alaira-connector-fabric-test-key").digest();
}

export function encryptSecret(plaintext: string, key: Buffer): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag, keyId: DEFAULT_KEY_ID };
}

export function decryptSecret(blob: EncryptedSecret, key: Buffer): string {
  const decipher = createDecipheriv("aes-256-gcm", key, blob.iv);
  decipher.setAuthTag(blob.tag);
  return Buffer.concat([decipher.update(blob.ciphertext), decipher.final()]).toString("utf8");
}
