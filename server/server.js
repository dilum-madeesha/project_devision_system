import app from './src/app.js';
import { PORT, NODE_ENV } from './src/config/environment.js';
import prisma from './src/config/database.js';
import dotenv from "dotenv";
dotenv.config();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      const isErrorObject = reason instanceof Error;
      const name = isErrorObject ? reason.name : typeof reason;
      const message = isErrorObject
        ? reason.message
        : (reason === undefined ? 'undefined rejection reason' : JSON.stringify(reason));

      console.log('UNHANDLED REJECTION!');
      console.log(name, message);

      if (NODE_ENV === 'development') {
        return;
      }

      console.log('Shutting down...');
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM RECEIVED. Shutting down gracefully');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Process terminated!');
      });
    });

  } catch (error) {
    console.log('Database connection failed!');
    console.log(error.message);
    process.exit(1);
  }
};

startServer();
