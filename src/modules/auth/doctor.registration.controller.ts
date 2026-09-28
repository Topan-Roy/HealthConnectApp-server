import { Request, Response, NextFunction } from 'express';
import * as doctorRegService from './doctor.registration.service';

// ─── POST /api/v1/auth/doctor/initiate ──────────────────────────────────────
export const initiateRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format' });
      return;
    }

    const result = await doctorRegService.initiateDoctorRegistration({
      name,
      email,
      phone,
      password,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: { email: result.email },
    });
  } catch (error: any) {
    if (error.message === 'Email is already registered') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

// ─── POST /api/v1/auth/doctor/verify-otp ────────────────────────────────────
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are required' });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      res.status(400).json({ success: false, message: 'OTP must be a 6-digit number' });
      return;
    }

    const result = await doctorRegService.verifyDoctorOtp({ email, otp });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        tempToken: result.tempToken,
        nextStep: 'complete-profile',
      },
    });
  } catch (error: any) {
    const clientErrors = [
      'OTP not found',
      'OTP has expired',
      'Too many failed attempts',
      'User not found',
      'Invalid OTP',
    ];

    if (clientErrors.some((msg) => error.message?.startsWith(msg))) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    next(error);
  }
};

// ─── POST /api/v1/auth/doctor/resend-otp ────────────────────────────────────
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const result = await doctorRegService.resendDoctorOtp(email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    if (
      error.message === 'No registration found for this email. Please start registration again.' ||
      error.message === 'Email is already verified.'
    ) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

// ─── POST /api/v1/auth/doctor/complete-profile ──────────────────────────────
export const completeProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Temp token is required. Please verify your email first.',
      });
      return;
    }

    const tempToken = authHeader.split(' ')[1];

    const result = await doctorRegService.completeDoctorProfile(tempToken, req.body);

    res.status(201).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (
      error.message === 'Invalid or expired session. Please verify your email again.' ||
      error.message === 'User not found.' ||
      error.message === 'Email not verified. Please complete OTP verification first.'
    ) {
      res.status(401).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};
