import pg from "pg";
import type { TenantId } from "@alaira/domain";

/** Synthetic fixtures for POC integration tests only. */
export async function seedPocSyntheticTenants(adminUrl: string): Promise<{
  tenantA: TenantId;
  tenantB: TenantId;
  sessionA: string;
  sessionB: string;
  itemA: string;
  itemB: string;
}> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const tenantA = "018f0000-0000-7000-8000-000000000001" as TenantId;
    const tenantB = "018f0000-0000-7000-8000-000000000002" as TenantId;
    const userA = "018f0000-0000-7000-8000-000000000011";
    const userB = "018f0000-0000-7000-8000-000000000022";
    const sessionA = "018f0000-0000-7000-8000-0000000000a1";
    const sessionB = "018f0000-0000-7000-8000-0000000000b1";
    const itemA = "018f0000-0000-7000-8000-0000000000aa";
    const itemB = "018f0000-0000-7000-8000-0000000000bb";

    await client.query("DELETE FROM poc_item");
    await client.query("DELETE FROM idempotency_record");
    await client.query("DELETE FROM outbox_event");
    await client.query("DELETE FROM session");
    await client.query("DELETE FROM app_user");
    await client.query("DELETE FROM tenant");

    await client.query(
      `INSERT INTO tenant (id, name) VALUES ($1, 'Tenant A'), ($2, 'Tenant B')`,
      [tenantA, tenantB],
    );
    await client.query(
      `INSERT INTO app_user (id, tenant_id, email) VALUES ($1, $3, 'a@test.local'), ($2, $4, 'b@test.local')`,
      [userA, userB, tenantA, tenantB],
    );
    await client.query(
      `INSERT INTO session (id, tenant_id, user_id, expires_at) VALUES ($1, $3, $5, now() + interval '1 day'), ($2, $4, $6, now() + interval '1 day')`,
      [sessionA, sessionB, tenantA, tenantB, userA, userB],
    );
    await client.query(
      `INSERT INTO poc_item (id, tenant_id, title, status) VALUES ($1, $3, 'Item A', 'draft'), ($2, $4, 'Item B', 'draft')`,
      [itemA, itemB, tenantA, tenantB],
    );

    return { tenantA, tenantB, sessionA, sessionB, itemA, itemB };
  } finally {
    await client.end();
  }
}
