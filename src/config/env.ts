import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
  mongoUri: string;
  clientUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtTempSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPass: string;
  emailFrom: string;
  otpExpiresMinutes: number;
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
  jwtTempSecret: process.env.JWT_TEMP_SECRET || 'fallback_temp_secret',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: parseInt(process.env.EMAIL_PORT || '587', 10),
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'HealthConnect <noreply@healthconnect.com>',
  otpExpiresMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10),
};

// Validate essential config
if (!config.mongoUri) {
  console.error('MONGODB_URI is not defined in the environment variables');
  process.exit(1);
}

