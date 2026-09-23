import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { config } from '../../config/env';

const setTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Basic Validation
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
      return;
    }
    
    // Check password length
    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    const { authData, refreshToken } = await authService.registerService(req.body);

    setTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: authData,
    });
  } catch (error: any) {
    if (error.message === 'Email is already registered' || error.message === 'Admin registration is not allowed publicly') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const { authData, refreshToken } = await authService.loginService({ email, password });

    setTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: authData,
    });
  } catch (error: any) {
    if (error.message === 'Invalid credentials' || error.message === 'Account is deactivated') {
      res.status(401).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Attempt to get refresh token from cookies, fallback to body
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      res.status(401).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    const { authData, refreshToken: newRefreshToken } = await authService.refreshTokenService(token);

    setTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: authData,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // req.user is set by auth middleware
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await authService.logoutService(req.user.id);
    }

    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
