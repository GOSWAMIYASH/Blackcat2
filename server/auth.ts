import crypto from 'crypto';
import { User, UserRole } from './types';

const SECRET = process.env.SATSA_SECRET_KEY || 'satsa_supervisory_jwt_secret_key_demo_2026_sih';

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

export function signToken(payload: Omit<JWTPayload, 'exp'>, expiresInHours: number = 24): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
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
  {
    id: 'USR-004',
    email: 'reviewer@agency.gov',
    name: 'Kabir Das',
    role: 'Read-Only Reviewer',
    passwordHash: hashPassword('reviewer123'),
    organization: 'Independent Compliance Oversight',
    createdAt: '2026-02-10T14:00:00Z'
  }
];
