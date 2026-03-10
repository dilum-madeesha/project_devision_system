import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@projectdivision.com',
      epfNumber: 1001,
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      division: 'Project',
      role: 'ADMIN',
      privilege: 10,
      isActive: true,
      lastLogin: null
    }
  });

  // Create manager user
  const managerPassword = await hash('Manager123!', 12);
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@projectdivision.com',
      epfNumber: 1002,
      password: managerPassword,
      firstName: 'Project',
      lastName: 'Manager',
      division: 'Project',
      role: 'MANAGER',
      privilege: 7,
      isActive: true,
      lastLogin: null
    }
  });

  // Create supervisor user
  const supervisorPassword = await hash('Supervisor123!', 12);
  const supervisor = await prisma.user.upsert({
    where: { username: 'supervisor' },
    update: {},
    create: {
      username: 'supervisor',
      email: 'supervisor@projectdivision.com',
      epfNumber: 1003,
      password: supervisorPassword,
      firstName: 'Site',
      lastName: 'Supervisor',
      division: 'Project',
      role: 'SUPERVISOR',
      privilege: 5,
      isActive: true,
      lastLogin: null
    }
  });

  // Create worker user
  const workerPassword = await hash('Worker123!', 12);
  const worker = await prisma.user.upsert({
    where: { username: 'worker' },
    update: {},
    create: {
      username: 'worker',
      email: 'worker@projectdivision.com',
      epfNumber: 1004,
      password: workerPassword,
      firstName: 'Field',
      lastName: 'Worker',
      division: 'Project',
      role: 'WORKER',
      privilege: 1,
      isActive: true,
      lastLogin: null
    }
  });

  // Create 5 jobs
  const jobs = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.job.create({
        data: {
          jobNumber: `JOB-2025-${i + 1}`,
          title: `Job Title ${i + 1}`,
          description: `Job description for job ${i + 1}`,
          status: 'ONGOING',
          startDate: new Date(),
          reqDepartment: 'Electrical Engineering',
          reqDate: new Date(),
          projectCode: `PCODE-${i + 1}`,
          assignOfficer: `Officer ${i + 1}`,
          createdById: manager.id
        }
      })
    )
  );

  // Create 10 labors
  await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.labor.create({
        data: {
          epfNumber: 2000 + i,
          firstName: `LaborFN${i + 1}`,
          lastName: `LaborLN${i + 1}`,
          division: 'Project',
          trade: 'Mason',
          payGrade: 's2',
          dayPay: 2500,
          otPay: 300,
          isActive: true,
          createdById: manager.id
        }
      })
    )
  );

  console.log('✅ Database seeded successfully');
  console.log('👤 Admin user:', { username: 'admin', password: 'Admin123!' });
  console.log('👤 Manager user:', { username: 'manager', password: 'Manager123!' });
  console.log('👤 Supervisor user:', { username: 'supervisor', password: 'Supervisor123!' });
  console.log('👤 Worker user:', { username: 'worker', password: 'Worker123!' });
  console.log('📦 Jobs created:', jobs.length);
  console.log('👷‍♂️ Labors created:', 10);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
