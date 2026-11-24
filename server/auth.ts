import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { readStore } from './store.ts';
import type { UserAccount } from './types.ts';

export interface AuthenticatedRequest extends Request {
  authUser?: UserAccount;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const effectiveSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, effectiveSalt, 120000, 64, 'sha512').toString('hex');
  return { hash: derived, salt: effectiveSalt };
}

export function verifyPassword(password: string, user: UserAccount): boolean {
  const candidate = crypto
    .pbkdf2Sync(password, user.passwordSalt, 120000, 64, 'sha512')
    .toString('hex');
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(user.passwordHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getSigningSecret(): string {
  return process.env.SESSION_SECRET || readStore().sessionSecret;
}

export function signSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Date.now() + SESSION_TTL_MS,
    }),
    'utf-8',
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      sub?: string;
      exp?: number;
    };
    if (!decoded.sub || !decoded.exp || decoded.exp < Date.now()) {
      return null;
    }
    return decoded.sub;
  } catch {
    return null;
  }
}

export function sanitizeUser(user: UserAccount) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    emergencyVetContact: user.emergencyVetContact,
    notificationsEnabled: user.notificationsEnabled,
    medicationReminders: user.medicationReminders,
    vaccinationReminders: user.vaccinationReminders,
    appointmentReminders: user.appointmentReminders,
    createdAt: user.createdAt,
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (typeof req.headers.cookie === 'string') {
    const match = req.headers.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('pawheal_session='));
    if (match) {
      token = decodeURIComponent(match.slice('pawheal_session='.length));
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    return;
  }

  const userId = verifySessionToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    return;
  }

  const user = readStore().users.find((u) => u.id === userId);
  if (!user) {
    res.status(401).json({ error: 'Account not found. Please sign in again.' });
    return;
  }

  req.authUser = user;
  next();
}
