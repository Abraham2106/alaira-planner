import type { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { v7 as uuidv7 } from "uuid";
import type { TenantId } from "@alaira/domain";
import { DomainError } from "@alaira/domain";
import {
  assertActiveMembership,
  assertCsrfMatch,
  assertSessionActive,
  nextSessionExpiry,
  SESSION_ABSOLUTE_MS,
  type MembershipRecord,
  type SessionTimestamps,
} from "@alaira/domain/iam";
import { appPool, withTenantTx } from "../../db/pool.js";

export const SESSION_COOKIE = "alaira_session";
export const CSRF_COOKIE = "alaira_csrf";
export const CSRF_HEADER = "x-alaira-csrf";

export type IamSession = {
  sessionId: string;
  tenantId: TenantId;
  userId: string;
  csrfToken: string;
};

type SessionRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  expires_at: Date;
  absolute_expires_at: Date;
  last_activity_at: Date;
  revoked_at: Date | null;
  csrf_token: string;
};

type MembershipRow = {
  id: string;
  tenant_id: string;
  email: string;
  deactivated_at: Date | null;
};

async function loadMembership(userId: string, tenantId: TenantId): Promise<MembershipRecord> {
  return withTenantTx(tenantId, async (client) => {
    const { rows } = await client.query<MembershipRow>(
      `SELECT id, tenant_id, email, deactivated_at FROM app_user WHERE id = $1`,
      [userId],
    );
    const row = rows[0];
    if (!row) {
      throw new DomainError("FORBIDDEN", "Invalid session");
    }
    return {
      userId: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      deactivatedAt: row.deactivated_at,
    };
  });
}

export async function resolveIamSession(request: FastifyRequest): Promise<IamSession> {
  const sessionId =
    (request.cookies?.[SESSION_COOKIE] as string | undefined) ??
    (request.headers["x-alaira-session"] as string | undefined);
  if (!sessionId) {
    throw new DomainError("FORBIDDEN", "Missing session");
  }

  const { rows } = await appPool.query<SessionRow>(
    `SELECT id, tenant_id, user_id, expires_at, absolute_expires_at, last_activity_at, revoked_at, csrf_token
     FROM session WHERE id = $1`,
    [sessionId],
  );
  const row = rows[0];
  if (!row) {
    throw new DomainError("FORBIDDEN", "Invalid session");
  }

  const now = new Date();
  assertSessionActive(
    {
      expiresAt: row.expires_at,
      absoluteExpiresAt: row.absolute_expires_at,
      lastActivityAt: row.last_activity_at,
      revokedAt: row.revoked_at,
    },
    now,
  );

  const membership = await loadMembership(row.user_id, row.tenant_id as TenantId);
  assertActiveMembership(membership);

  const nextIdle = nextSessionExpiry(
    row.last_activity_at,
    row.absolute_expires_at,
    now,
  );
  if (nextIdle.getTime() !== row.expires_at.getTime()) {
    await appPool.query(
      `UPDATE session SET expires_at = $2, last_activity_at = $3 WHERE id = $1`,
      [row.id, nextIdle, now],
    );
  }

  return {
    sessionId: row.id,
    tenantId: row.tenant_id as TenantId,
    userId: row.user_id,
    csrfToken: row.csrf_token,
  };
}

export function assertWriteCsrf(request: FastifyRequest, session: IamSession): void {
  const header =
    (request.headers[CSRF_HEADER] as string | undefined) ??
    (request.headers[CSRF_HEADER.toLowerCase()] as string | undefined);
  assertCsrfMatch(session.csrfToken, header);
}

export async function createSessionForUser(
  tenantId: TenantId,
  userId: string,
): Promise<{ sessionId: string; csrfToken: string }> {
  const sessionId = uuidv7();
  const csrfToken = randomBytes(32).toString("hex");
  const now = new Date();
  const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_MS);
  const expiresAt = nextSessionExpiry(now, absoluteExpiresAt, now);

  await appPool.query(
    `INSERT INTO session (id, tenant_id, user_id, expires_at, absolute_expires_at, last_activity_at, csrf_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [sessionId, tenantId, userId, expiresAt, absoluteExpiresAt, now, csrfToken],
  );

  return { sessionId, csrfToken };
}

export function setSessionCookies(
  reply: FastifyReply,
  sessionId: string,
  csrfToken: string,
): void {
  const cookieOpts = {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
  };
  reply.setCookie(SESSION_COOKIE, sessionId, cookieOpts);
  reply.setCookie(CSRF_COOKIE, csrfToken, {
    path: "/",
    httpOnly: false,
    secure: true,
    sameSite: "lax",
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await appPool.query(`UPDATE session SET revoked_at = now() WHERE id = $1`, [sessionId]);
}
