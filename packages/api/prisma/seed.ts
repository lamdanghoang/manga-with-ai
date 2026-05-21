import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { walletAddress: '0x0000000000000000000000000000000000000001' },
    update: {},
    create: {
      walletAddress: '0x0000000000000000000000000000000000000001',
      displayName: 'Test User',
    },
  });
  console.log('Seeded user:', user.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
