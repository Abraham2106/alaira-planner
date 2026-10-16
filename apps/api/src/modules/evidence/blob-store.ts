import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type StoredBlob = {
  storageKey: string;
  contentType: string;
  byteSize: number;
  sha256Hex: string;
};

export interface EvidenceBlobStore {
  put(
    tenantId: string,
    blobId: string,
    contentType: string,
    bytes: Buffer,
  ): Promise<StoredBlob>;
  get(tenantId: string, storageKey: string): Promise<Buffer>;
}

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Adaptador local (RR-0003): sin S3 obligatorio en dev/CI. */
export class LocalFilesystemBlobStore implements EvidenceBlobStore {
  constructor(private readonly rootDir: string) {}

  private objectPath(tenantId: string, storageKey: string): string {
    return join(this.rootDir, tenantId, storageKey);
  }

  async put(
    tenantId: string,
    blobId: string,
    contentType: string,
    bytes: Buffer,
  ): Promise<StoredBlob> {
    const storageKey = `${blobId}.bin`;
    const path = this.objectPath(tenantId, storageKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
    return {
      storageKey,
      contentType,
      byteSize: bytes.byteLength,
      sha256Hex: sha256Hex(bytes),
    };
  }

  async get(tenantId: string, storageKey: string): Promise<Buffer> {
    const path = this.objectPath(tenantId, storageKey);
    return readFile(path);
  }
}

let defaultStore: EvidenceBlobStore | null = null;

export function getEvidenceBlobStore(): EvidenceBlobStore {
  if (!defaultStore) {
    const root =
      process.env.EVIDENCE_BLOB_ROOT?.trim() ||
      join(process.cwd(), ".data", "evidence-blobs");
    defaultStore = new LocalFilesystemBlobStore(root);
  }
  return defaultStore;
}

/** Permite inyectar mock en tests. */
export function setEvidenceBlobStore(store: EvidenceBlobStore | null): void {
  defaultStore = store;
}
