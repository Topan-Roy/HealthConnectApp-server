import User from '../users/user.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.utils';
import { AuthResponse } from './auth.types';

export const registerService = async (userData: any): Promise<{ authData: AuthResponse, refreshToken: string }> => {
  const { name, email, phone, password, role } = userData;

  // Enforce role restrictions
  if (role === 'admin') {
    throw new Error('Admin registration is not allowed publicly');
  }

  // Check if email exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email is already registered');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'patient',
  });

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  return {
    authData: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      accessToken,
    },
    refreshToken,
  };
};

export const loginService = async (credentials: any): Promise<{ authData: AuthResponse, refreshToken: string }> => {
  const { email, password } = credentials;

  // Find user and select password
  const user = await User.findOne({ email }).select('+password +isActive');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if active
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  return {
    authData: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      accessToken,
    },
    refreshToken,
  };
};

export const refreshTokenService = async (token: string): Promise<{ authData: AuthResponse, refreshToken: string }> => {
  if (!token) {
    throw new Error('Refresh token is required');
  }

  // Verify token
  let decoded: any;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new Error('Invalid refresh token');
  }

  // Find user
  const user = await User.findById(decoded.userId).select('+refreshToken +isActive');
  if (!user || user.refreshToken !== token) {
    throw new Error('Invalid refresh token');
  }

  // Check if active
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Generate new tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });

  // Update refresh token
  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    authData: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      accessToken,
    },
    refreshToken: newRefreshToken,
  };
};

export const logoutService = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }
};
