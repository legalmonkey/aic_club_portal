// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const departments = [
    { id: 'dept-tech', name: 'Technical' },
    { id: 'dept-vmed', name: 'Visual Media' },
    { id: 'dept-crtv', name: 'Creative' },
    { id: 'dept-outr', name: 'Outreach' },
    { id: 'dept-ops', name: 'Operations' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: {
        id: dept.id,
        name: dept.name,
      },
    });
  }

  // Seed initial Super Administrator
  await prisma.user.upsert({
    where: { email: 'admin@vitstudent.ac.in' },
    update: {},
    create: {
      name: 'AIC Super Administrator',
      email: 'admin@vitstudent.ac.in',
      role: 'super_admin',
    },
  });

  console.log('Successfully seeded departments and initial Super Administrator into live Supabase PostgreSQL database.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
