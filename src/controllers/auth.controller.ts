import type { Request, Response } from "express";
import * as argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";
import { signAccessToken, generateRefreshToken, hashToken } from "../lib/tokens.js";

const REFRESH_COOKIE = "refreshToken";

// httpOnly: JavaScript in the browser can't read it (blocks theft via XSS)
// secure:   only sent over HTTPS in production
// sameSite: "lax" blocks the cookie on cross-site POSTs (basic CSRF protection)
// path:     the browser only sends it to /auth/* routes
const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/auth",
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: config.refreshTokenDays * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
}

export const register = async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !email.includes("@") ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    res.status(400).json({ error: "A valid email and a password of at least 8 characters are required" });
    return;
  }

  // fullName is optional, but if it's sent it must be a reasonable string
  if (fullName !== undefined && (typeof fullName !== "string" || fullName.trim().length > 100)) {
    res.status(400).json({ error: "Full name must be text of at most 100 characters" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFullName = typeof fullName === "string" && fullName.trim() ? fullName.trim() : null;

  if (!normalizedFullName) {
    res.status(409).json({ error: "Full name is required" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash, fullName: normalizedFullName },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(201).json({ user });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  // Same message for "no such user" and "wrong password" so attackers can't tell which emails exist
  if (!user || !user.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Small cleanup: remove this user's expired refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  const refresh = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { tokenHash: refresh.tokenHash, userId: user.id, expiresAt: refresh.expiresAt },
  });

  setRefreshCookie(res, refresh.token);
  res.json({
    accessToken: signAccessToken(user.id),
    user: { id: user.id, email: user.email, role: user.role },
  });
}

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (typeof token !== "string") {
    res.status(401).json({ error: "Missing refresh token" });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  // Not found = invalid, already used (rotated), or logged out
  if (!stored || stored.expiresAt < new Date()) {
    clearRefreshCookie(res);
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  // Rotation: delete the old token and create a new one in a single transaction
  const next = generateRefreshToken();
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.create({
      data: {
        tokenHash: next.tokenHash,
        userId: stored.userId,
        expiresAt: next.expiresAt
      },
    }),
  ]);

  setRefreshCookie(res, next.token);
  res.json({ accessToken: signAccessToken(stored.userId) });
}

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (typeof token === "string") {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  clearRefreshCookie(res);
  res.status(204).send();
}

// Example of a protected handler: requireAuth has already put the user id in res.locals
export const me = async (_req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: res.locals.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
}