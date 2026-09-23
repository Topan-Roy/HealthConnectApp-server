import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/db';

const startServer = async () => {
  // Connect to MongoDB
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`HealthConnect Server is running in ${config.env} mode on port ${config.port}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
};

startServer();
