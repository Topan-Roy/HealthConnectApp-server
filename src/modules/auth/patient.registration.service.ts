import bcrypt from 'bcrypt';
import User from '../users/user.model';
import Otp from './otp.model';
import PatientProfile from '../users/patient.profile.model';
import { sendOtpEmail } from '../../utils/email.utils';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTempToken,
  verifyTempToken,
} from '../../utils/jwt.utils';
import { config } from '../../config/env';
import { AuthResponse } from './auth.types';

// ─── Helper: generate a 6-digit numeric OTP ──────────────────────────────────
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── STEP 1: Initiate patient registration ───────────────────────────────────
/**
 * Accepts basic account info, creates a PENDING user record, sends OTP to email.
 * Does NOT issue access/refresh tokens yet — only after OTP is verified.
 */
export const initiatePatientRegistration = async (data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<{ message: string; email: string }> => {
  const { name, email, phone, password } = data;

  // Check if email already fully registered
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser && existingUser.isVerified) {
    throw new Error('Email is already registered');
  }

  // If a pending (unverified) user exists, delete it so we can re-create fresh
  if (existingUser && !existingUser.isVerified) {
    await User.deleteOne({ _id: existingUser._id });
  }

  // Hash password before saving
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user with isVerified = false (not confirmed yet)
  await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role: 'patient',
    isVerified: false,
    isActive: false, // becomes true after email verify + profile complete
  });

  // Generate OTP
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + config.otpExpiresMinutes * 60 * 1000);

  // Hash OTP before storing
  const salt2 = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otpCode, salt2);

  // Remove any old OTP for this email, then save new
  await Otp.deleteMany({ email: email.toLowerCase() });
  await Otp.create({
    email: email.toLowerCase(),
    otp: hashedOtp,
    expiresAt,
    attempts: 0,
  });

  // Send OTP email
  await sendOtpEmail(email, otpCode, name);

  return {
    message: `OTP sent to ${email}. Please verify your email to continue.`,
    email,
  };
};

// ─── STEP 2: Verify OTP ───────────────────────────────────────────────────────
/**
 * Verifies the 6-digit OTP entered by the user.
 * On success: marks user as verified, returns a short-lived temp token
 * that authorises profile completion (Step 3+).
 */
export const verifyPatientOtp = async (data: {
  email: string;
  otp: string;
}): Promise<{ tempToken: string; message: string }> => {
  const { email, otp } = data;

  // Find OTP record
  const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
  if (!otpRecord) {
    throw new Error('OTP not found or already expired. Please request a new one.');
  }

  // Check expiry
  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Track failed attempts (max 5)
  const MAX_ATTEMPTS = 5;
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  // Verify OTP
  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new Error(`Invalid OTP. ${MAX_ATTEMPTS - otpRecord.attempts} attempts remaining.`);
  }

  // OTP correct — find the user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('User not found. Please restart registration.');
  }

  // Mark email as verified
  user.isVerified = true;
  await user.save();

  // Delete OTP record
  await Otp.deleteOne({ _id: otpRecord._id });

  // Issue temp token (valid 30 min) for profile completion
  const tempToken = generateTempToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    tempToken,
    message: 'Email verified successfully. Please complete your profile.',
  };
};

// ─── STEP 2b: Resend OTP ──────────────────────────────────────────────────────
export const resendPatientOtp = async (
  email: string
): Promise<{ message: string }> => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('No registration found for this email. Please start registration again.');
  }
  if (user.isVerified) {
    throw new Error('Email is already verified.');
  }

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + config.otpExpiresMinutes * 60 * 1000);

  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otpCode, salt);

  await Otp.deleteMany({ email: email.toLowerCase() });
  await Otp.create({ email: email.toLowerCase(), otp: hashedOtp, expiresAt, attempts: 0 });

  await sendOtpEmail(email, otpCode, user.name);

  return { message: `OTP resent to ${email}.` };
};

// ─── STEP 3: Complete patient profile ────────────────────────────────────────
/**
 * Called after OTP verification with a valid temp token.
 * Saves all profile data and activates the account.
 * Returns full auth tokens.
 */
export const completePatientProfile = async (
  tempToken: string,
  profileData: {
    // Personal info
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';

    // Profile photo
    profilePhotoUrl?: string;

    // Health info
    bloodGroup?: string;
    height?: number;
    weight?: number;
    allergies?: string;
    existingConditions?: string;

    // Emergency contact
    emergencyContactName?: string;
    emergencyContactRelationship?: string;
    emergencyContactPhone?: string;

    // Address
    division?: string;
    district?: string;
    area?: string;
    fullAddress?: string;
  }
): Promise<{ authData: AuthResponse; refreshToken: string }> => {
  // Verify temp token
  let decoded: { userId: string; email: string; role: string };
  try {
    decoded = verifyTempToken(tempToken);
  } catch {
    throw new Error('Invalid or expired session. Please verify your email again.');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new Error('User not found.');
  }
  if (!user.isVerified) {
    throw new Error('Email not verified. Please complete OTP verification first.');
  }

  // Upsert patient profile
  await PatientProfile.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
      gender: profileData.gender,
      profilePhotoUrl: profileData.profilePhotoUrl,
      healthInfo: {
        bloodGroup: profileData.bloodGroup,
        height: profileData.height,
        weight: profileData.weight,
        allergies: profileData.allergies,
        existingConditions: profileData.existingConditions,
      },
      emergencyContact: {
        name: profileData.emergencyContactName,
        relationship: profileData.emergencyContactRelationship,
        phone: profileData.emergencyContactPhone,
      },
      address: {
        division: profileData.division,
        district: profileData.district,
        area: profileData.area,
        fullAddress: profileData.fullAddress,
      },
      isProfileComplete: true,
    },
    { upsert: true, new: true }
  );

  // Activate account
  user.isActive = true;
  await user.save();

  // Issue full auth tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

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
