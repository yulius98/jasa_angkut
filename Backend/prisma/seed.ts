import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { UserRole } from '../src/generated/prisma/enums.js';

// Seed admin pertama. Aman dijalankan berulang (idempotent).
// Kredensial diambil dari env dengan default untuk pengembangan lokal.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Super Admin';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@jasa-antar.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: ADMIN_NAME,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      passwordHash,
    },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: '081000000000',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: user.id },
    update: { tier: 'super_admin' },
    create: { userId: user.id, tier: 'super_admin' },
  });

  // Pastikan admin TIDAK punya profil customer.
  await prisma.customerProfile.deleteMany({ where: { userId: user.id } });

  console.log(`[seed] SUPER_ADMIN siap: ${user.email}`);
  console.log('[seed] JANGAN lupa mengganti password default untuk production.');
}

main()
  .catch((err) => {
    console.error('[seed] gagal:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });