import { Request, Response, NextFunction } from 'express';
import * as patientRegService from './patient.registration.service';
import { config } from '../../config/env';

const setTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── POST /api/v1/auth/patient/initiate ──────────────────────────────────────
/**
 * Step 1: Accept basic account info → send OTP to email
 *
 * Body: { name, email, password, phone? }
 */
export const initiateRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format' });
      return;
    }

    const result = await patientRegService.initiatePatientRegistration({
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

// ─── POST /api/v1/auth/patient/verify-otp ────────────────────────────────────
/**
 * Step 2: Verify OTP → return temp token for profile completion
 *
 * Body: { email, otp }
 */
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

    const result = await patientRegService.verifyPatientOtp({ email, otp });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        tempToken: result.tempToken,
        // Guides the client to move to Step 3
        nextStep: 'complete-profile',
      },
    });
  } catch (error: any) {
    const clientErrors = [
      'OTP not found or already expired. Please request a new one.',
      'OTP has expired. Please request a new one.',
      'Too many failed attempts. Please request a new OTP.',
      'User not found. Please restart registration.',
    ];

    if (clientErrors.some((msg) => error.message?.startsWith(msg.slice(0, 20)))) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    if (error.message?.startsWith('Invalid OTP')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    next(error);
  }
};

// ─── POST /api/v1/auth/patient/resend-otp ────────────────────────────────────
/**
 * Resend OTP to email
 *
 * Body: { email }
 */
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

    const result = await patientRegService.resendPatientOtp(email);

    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    const clientErrors = [
      'No registration found for this email. Please start registration again.',
      'Email is already verified.',
    ];
    if (clientErrors.includes(error.message)) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

// ─── POST /api/v1/auth/patient/complete-profile ───────────────────────────────
/**
 * Step 3: Complete patient profile → account fully activated
 *
 * Header: Authorization: Bearer <tempToken>
 * Body:   { dateOfBirth?, gender?, profilePhotoUrl?, bloodGroup?, height?,
 *           weight?, allergies?, existingConditions?,
 *           emergencyContactName?, emergencyContactRelationship?, emergencyContactPhone?,
 *           division?, district?, area?, fullAddress? }
 */
export const completeProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract temp token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Temp token is required. Please verify your email first.',
      });
      return;
    }

    const tempToken = authHeader.split(' ')[1];

    const { authData, refreshToken } = await patientRegService.completePatientProfile(
      tempToken,
      req.body
    );

    setTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration complete! Welcome to HealthConnect 🎉',
      data: authData,
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
