import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { TokenPayload } from '../modules/auth/auth.types';

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtAccessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
};

/**
 * Temp token: issued after OTP verification, used to authorize profile completion.
 * Short-lived (30 minutes). Contains email + userId.
 */
export const generateTempToken = (payload: { userId: string; email: string; role: string }): string => {
  return jwt.sign(payload, config.jwtTempSecret, { expiresIn: '30m' });
};

export const verifyTempToken = (token: string): { userId: string; email: string; role: string } => {
  return jwt.verify(token, config.jwtTempSecret) as { userId: string; email: string; role: string };
};

