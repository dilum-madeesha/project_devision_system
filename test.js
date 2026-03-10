import prisma from './src/config/database.js';

const test = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected!');
    await prisma.$disconnect();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
};

test();
