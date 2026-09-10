import crypto from 'crypto';
import { User, UserRole } from './types';
import { prisma } from './prisma';

const configuredSecret = process.env.SATSA_SECRET_KEY;
if (!configuredSecret && process.env.NODE_ENV === 'production') {
  throw new Error('SATSA_SECRET_KEY is required in production.');
}
const SECRET = configuredSecret || 'satsa_supervisory_jwt_secret_key_demo_2026_sih';
export const REFRESH_COOKIE = 'satsa_refresh_token';
const ACCESS_TOKEN_HOURS = 1 / 4;
const REFRESH_TOKEN_DAYS = 7;

export function hashPassword(password: string, salt: string = 'satsa_salt_2026'): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  return hashPassword(password) === storedHash;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
}

export type ServerPermission =
  | 'review_decision'
  | 'submit_clarification'
  | 'upload_evidence'
  | 'generate_report'
  | 'view_reports'
  | 'access_audit_logs'
  | 'load_scenario'
  | 'access_analytics';

export const ROLE_PERMISSIONS: Record<UserRole, ServerPermission[]> = {
  'Lead Examiner': [
    'review_decision',
    'upload_evidence',
    'generate_report',
    'view_reports',
    'access_audit_logs',
    'load_scenario',
    'access_analytics'
  ],
  'SOC Supervisor': [
    'submit_clarification',
    'upload_evidence',
    'access_audit_logs',
    'access_analytics'
  ],
  Auditor: [
    'access_audit_logs',
    'access_analytics',
    'view_reports'
  ]
};

export function canUserAccess(role: UserRole | undefined, permission: ServerPermission): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export function signToken(payload: Omit<JWTPayload, 'exp'>, expiresInHours: number = ACCESS_TOKEN_HOURS): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenFromRequest(req: { headers: { cookie?: string } }): string | null {
  const cookies = req.headers.cookie?.split(';').map(cookie => cookie.trim()) || [];
  const refreshCookie = cookies.find(cookie => cookie.startsWith(`${REFRESH_COOKIE}=`));
  return refreshCookie ? decodeURIComponent(refreshCookie.slice(REFRESH_COOKIE.length + 1)) : null;
}

export function setRefreshCookie(res: { setHeader: (name: string, value: string) => void }, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${REFRESH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/api/auth; SameSite=Strict; Max-Age=${REFRESH_TOKEN_DAYS * 24 * 60 * 60}${secure}`);
}

export function clearRefreshCookie(res: { setHeader: (name: string, value: string) => void }): void {
  res.setHeader('Set-Cookie', `${REFRESH_COOKIE}=; HttpOnly; Path=/api/auth; SameSite=Strict; Max-Age=0`);
}

export async function createRefreshSession(userId: string, req: { ip?: string; headers: { 'user-agent'?: string | string[] } }): Promise<string> {
  const token = crypto.randomBytes(32).toString('base64url');
  await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent']
    }
  });
  return token;
}

export async function rotateRefreshSession(token: string, req: { ip?: string; headers: { 'user-agent'?: string | string[] } }): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'passwordHash'> } | null> {
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    include: { user: { include: { organization: true } } }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) return null;

  const nextToken = crypto.randomBytes(32).toString('base64url');
  const nextHash = hashRefreshToken(nextToken);
  await prisma.$transaction([
    prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
    prisma.refreshSession.create({
      data: {
        userId: session.userId,
        tokenHash: nextHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent']
      }
    })
  ]);

  const user: Omit<User, 'passwordHash'> = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: roleLabel(session.user.role),
    organization: session.user.organization.name,
    createdAt: session.user.createdAt.toISOString()
  };
  return {
    accessToken: signToken({ userId: user.id, email: user.email, name: user.name, role: user.role }),
    refreshToken: nextToken,
    user
  };
}

export async function revokeRefreshSession(token: string): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: { tokenHash: hashRefreshToken(token), revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export function roleLabel(role: string): UserRole {
  return role.split('_').map(word => word[0] + word.slice(1).toLowerCase()).join(' ') as UserRole;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload: JWTPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const PRESET_USERS: User[] = [
  {
    id: 'USR-001',
    email: 'examiner@satsa.gov.in',
    name: 'Dr. Arunima Sen',
    role: 'Lead Examiner',
    passwordHash: hashPassword('examiner123'),
    organization: 'National Supervisory Audit Bureau',
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'USR-002',
    email: 'supervisor@soc.internal',
    name: 'Rajeev Menon',
    role: 'SOC Supervisor',
    passwordHash: hashPassword('supervisor123'),
    organization: 'Critical Sector Central SOC',
    createdAt: '2026-01-20T10:30:00Z'
  },
  {
    id: 'USR-003',
    email: 'auditor@cert.gov.in',
    name: 'Sunita Rao',
    role: 'Auditor',
    passwordHash: hashPassword('auditor123'),
    organization: 'CERT-In Supervisory Review Group',
    createdAt: '2026-02-01T11:15:00Z'
  },
];
