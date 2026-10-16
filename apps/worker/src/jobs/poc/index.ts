import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import pg from "pg";

const adminUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@postgres:5432/alaira";

function s3Client(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT;
  if (!endpoint) return null;
  return new S3Client({
    endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
    },
  });
}

export async function tick(): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(`
      UPDATE outbox_event o
      SET processed_at = now()
      FROM (
        SELECT id FROM outbox_event
        WHERE processed_at IS NULL
          AND created_at < now() - interval '1 second'
        LIMIT 10
      ) sub
      WHERE o.id = sub.id
    `);
  } finally {
    await client.end();
  }

  const bucket = process.env.S3_BUCKET;
  const s3 = s3Client();
  if (s3 && bucket) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      // Bucket may be created by ops; POC only verifies connectivity when present.
    }
  }
}
