import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

const sessions = new Map<string, { username: string; expiresAt: number }>();
const ttlMs = 1000 * 60 * 60 * 8;

export async function verifyLogin(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword =
    process.env.ADMIN_PASSWORD || "creatorstreamops-demo";
  const hash =
    process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync(expectedPassword, 10);
  return username === expectedUser && bcrypt.compare(password, hash);
}

export function createSession(username: string): string {
  const token = uuid();
  sessions.set(token, { username, expiresAt: Date.now() + ttlMs });
  return token;
}

export function destroySession(token?: string): void {
  if (token) sessions.delete(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.creatorstreamops_session;
  const session = token ? sessions.get(token) : undefined;
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: "Authentication required." });
  }
  return next();
}

export function safeCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: ttlMs,
  };
}
