import pg from "pg";
import type { TenantId } from "@alaira/domain";
import { loadDbConfig } from "./config.js";

const { appUrl } = loadDbConfig();

export const appPool = new pg.Pool({ connectionString: appUrl, max: 10 });

export async function withTenantTx<T>(
  tenantId: TenantId,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await appPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
