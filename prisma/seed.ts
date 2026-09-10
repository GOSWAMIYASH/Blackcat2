import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '../generated/prisma/client';
import { hashPassword } from '../server/auth';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const users = [
  { email: 'examiner@satsa.gov.in', name: 'Dr. Arunima Sen', role: UserRole.LEAD_EXAMINER, password: 'examiner123' },
  { email: 'supervisor@soc.internal', name: 'Rajeev Menon', role: UserRole.SOC_SUPERVISOR, password: 'supervisor123' },
  { email: 'auditor@cert.gov.in', name: 'Sunita Rao', role: UserRole.AUDITOR, password: 'auditor123' }
];

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'satsa-development' },
    update: {},
    create: { name: 'SAT-SA Development Organization', slug: 'satsa-development' }
  });
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        organizationId: organization.id,
        isActive: true,
        passwordHash: hashPassword(user.password)
      },
      create: { email: user.email, name: user.name, role: user.role, organizationId: organization.id, passwordHash: hashPassword(user.password) }
    });
  }
}

main().finally(() => prisma.$disconnect());
