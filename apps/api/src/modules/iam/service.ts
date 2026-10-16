import { randomBytes } from "node:crypto";
import { v7 as uuidv7 } from "uuid";
import type { TenantId } from "@alaira/domain";
import { DomainError } from "@alaira/domain";
import {
  assertInvitationAcceptable,
  assertPasswordAcceptable,
  parseExternalId,
  toExternalId,
} from "@alaira/domain/iam";
import { appPool, withTenantTx } from "../../db/pool.js";
import {
  hashOpaqueToken,
  hashPasswordArgon2id,
  verifyPasswordArgon2id,
} from "./password.js";
import {
  createSessionForUser,
  type IamSession,
} from "./session.js";

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 8;

async function assertLoginNotRateLimited(
  tenantSlug: string,
  email: string,
): Promise<void> {
  const { rows } = await appPool.query<{ failures: string }>(
    `SELECT count(*)::text AS failures FROM iam_login_attempt
     WHERE tenant_slug_lower = lower($1) AND email_lower = lower($2)
       AND success = false AND attempted_at > now() - ($3::text || ' milliseconds')::interval`,
    [tenantSlug, email, String(LOGIN_WINDOW_MS)],
  );
  const failures = Number(rows[0]?.failures ?? "0");
  if (failures >= LOGIN_MAX_FAILURES) {
    throw new DomainError("FORBIDDEN", "Too many login attempts");
  }
}

async function recordLoginAttempt(
  tenantSlug: string,
  email: string,
  success: boolean,
): Promise<void> {
  await appPool.query(
    `INSERT INTO iam_login_attempt (email_lower, tenant_slug_lower, success) VALUES (lower($1), lower($2), $3)`,
    [email, tenantSlug, success],
  );
}

export async function registerTenantCommand(input: {
  organizationName: string;
  slug: string;
  ownerEmail: string;
  ownerDisplayName: string;
  password: string;
}): Promise<{ tenantId: string; userId: string }> {
  assertPasswordAcceptable(input.password);

  const tenantId = uuidv7();
  const userId = uuidv7();
  const passwordHash = await hashPasswordArgon2id(input.password);

  const client = await appPool.connect();
  try {
    await client.query("BEGIN");
    const slugTaken = await client.query(
      `SELECT 1 FROM tenant WHERE lower(slug) = lower($1)`,
      [input.slug],
    );
    if (slugTaken.rowCount) {
      throw new DomainError("CONFLICT", "Tenant slug already exists");
    }

    await client.query(
      `INSERT INTO tenant (id, name, slug) VALUES ($1, $2, $3)`,
      [tenantId, input.organizationName, input.slug.toLowerCase()],
    );
    await client.query(
      `INSERT INTO app_user (id, tenant_id, email, password_hash, display_name)
       VALUES ($1, $2, lower($3), $4, $5)`,
      [userId, tenantId, input.ownerEmail, passwordHash, input.ownerDisplayName],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return {
    tenantId: toExternalId("tenant", tenantId),
    userId: toExternalId("user", userId),
  };
}

export async function loginCommand(input: {
  tenantSlug: string;
  email: string;
  password: string;
}): Promise<{ tenantId: TenantId; userId: string; sessionId: string; csrfToken: string }> {
  await assertLoginNotRateLimited(input.tenantSlug, input.email);

  const tenantRes = await appPool.query<{ id: string }>(
    `SELECT id FROM tenant WHERE lower(slug) = lower($1)`,
    [input.tenantSlug],
  );
  const tenantId = tenantRes.rows[0]?.id as TenantId | undefined;
  if (!tenantId) {
    await recordLoginAttempt(input.tenantSlug, input.email, false);
    throw new DomainError("FORBIDDEN", "Invalid credentials");
  }

  const { rows } = await withTenantTx(tenantId, async (client) =>
    client.query<{
      id: string;
      password_hash: string | null;
      deactivated_at: Date | null;
    }>(
      `SELECT id, password_hash, deactivated_at FROM app_user
       WHERE tenant_id = $1 AND lower(email) = lower($2)`,
      [tenantId, input.email],
    ),
  );
  const row = rows[0];
  if (!row?.password_hash || row.deactivated_at) {
    await recordLoginAttempt(input.tenantSlug, input.email, false);
    throw new DomainError("FORBIDDEN", "Invalid credentials");
  }

  const ok = await verifyPasswordArgon2id(row.password_hash, input.password);
  if (!ok) {
    await recordLoginAttempt(input.tenantSlug, input.email, false);
    throw new DomainError("FORBIDDEN", "Invalid credentials");
  }

  await recordLoginAttempt(input.tenantSlug, input.email, true);
  const session = await createSessionForUser(tenantId, row.id);
  return {
    tenantId,
    userId: row.id,
    sessionId: session.sessionId,
    csrfToken: session.csrfToken,
  };
}

export async function getMeForSession(session: IamSession): Promise<{
  userId: string;
  tenantId: string;
  email: string;
  displayName: string | null;
}> {
  return withTenantTx(session.tenantId, async (client) => {
    const { rows } = await client.query<{
      id: string;
      tenant_id: string;
      email: string;
      display_name: string | null;
    }>(
      `SELECT id, tenant_id, email, display_name FROM app_user WHERE id = $1`,
      [session.userId],
    );
    const row = rows[0];
    if (!row) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return {
      userId: toExternalId("user", row.id),
      tenantId: toExternalId("tenant", row.tenant_id),
      email: row.email,
      displayName: row.display_name,
    };
  });
}

export async function createInvitationCommand(
  session: IamSession,
  email: string,
): Promise<{ invitationId: string; acceptToken: string; expiresAt: string }> {
  const invitationId = uuidv7();
  const acceptToken = randomBytes(32).toString("base64url");
  const tokenHash = hashOpaqueToken(acceptToken);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  await withTenantTx(session.tenantId, async (client) => {
    await client.query(
      `INSERT INTO iam_invitation (id, tenant_id, email, token_hash, expires_at, created_by)
       VALUES ($1, $2, lower($3), $4, $5, $6)`,
      [invitationId, session.tenantId, email, tokenHash, expiresAt, session.userId],
    );
  });

  return {
    invitationId: toExternalId("invitation", invitationId),
    acceptToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function acceptInvitationCommand(input: {
  acceptToken: string;
  password: string;
  displayName: string;
}): Promise<{ userId: string; tenantId: string }> {
  assertPasswordAcceptable(input.password);
  const tokenHash = hashOpaqueToken(input.acceptToken);

  const client = await appPool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{
      id: string;
      tenant_id: string;
      email: string;
      expires_at: Date;
      used_at: Date | null;
    }>(
      `SELECT id, tenant_id, email, expires_at, used_at FROM iam_invitation WHERE token_hash = $1 FOR UPDATE`,
      [tokenHash],
    );
    const inv = rows[0];
    if (!inv) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    assertInvitationAcceptable(
      {
        id: inv.id,
        tenantId: inv.tenant_id,
        email: inv.email,
        expiresAt: inv.expires_at,
        usedAt: inv.used_at,
      },
      new Date(),
    );

    const existing = await client.query(
      `SELECT id FROM app_user WHERE tenant_id = $1 AND lower(email) = lower($2)`,
      [inv.tenant_id, inv.email],
    );
    if (existing.rowCount) {
      throw new DomainError("CONFLICT", "User already exists for invitation");
    }

    const userId = uuidv7();
    const passwordHash = await hashPasswordArgon2id(input.password);
    await client.query(
      `INSERT INTO app_user (id, tenant_id, email, password_hash, display_name)
       VALUES ($1, $2, lower($3), $4, $5)`,
      [userId, inv.tenant_id, inv.email, passwordHash, input.displayName],
    );
    await client.query(`UPDATE iam_invitation SET used_at = now() WHERE id = $1`, [inv.id]);
    await client.query("COMMIT");

    return {
      userId: toExternalId("user", userId),
      tenantId: toExternalId("tenant", inv.tenant_id),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deactivateMemberCommand(
  session: IamSession,
  targetExternalUserId: string,
): Promise<{ userId: string; deactivatedAt: string }> {
  const targetId = parseExternalId(targetExternalUserId, "user");
  if (!targetId) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  if (targetId === session.userId) {
    throw new DomainError("FORBIDDEN", "Cannot deactivate self");
  }

  return withTenantTx(session.tenantId, async (client) => {
    const { rows } = await client.query<{ id: string; deactivated_at: Date | null }>(
      `UPDATE app_user SET deactivated_at = now()
       WHERE id = $1 AND tenant_id = $2 AND deactivated_at IS NULL
       RETURNING id, deactivated_at`,
      [targetId, session.tenantId],
    );
    const row = rows[0];
    if (!row?.deactivated_at) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    await client.query(`UPDATE session SET revoked_at = now() WHERE user_id = $1 AND tenant_id = $2`, [
      targetId,
      session.tenantId,
    ]);
    return {
      userId: toExternalId("user", row.id),
      deactivatedAt: row.deactivated_at.toISOString(),
    };
  });
}
