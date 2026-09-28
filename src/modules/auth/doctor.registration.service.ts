import bcrypt from 'bcrypt';
import User from '../users/user.model';
import Otp from './otp.model';
import DoctorProfile from '../users/doctor.profile.model';
import { sendOtpEmail } from '../../utils/email.utils';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTempToken,
  verifyTempToken,
} from '../../utils/jwt.utils';
import { config } from '../../config/env';
import { AuthResponse } from './auth.types';

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── STEP 1: Initiate doctor registration ───────────────────────────────────
export const initiateDoctorRegistration = async (data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<{ message: string; email: string }> => {
  const { name, email, phone, password } = data;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser && existingUser.isVerified) {
    throw new Error('Email is already registered');
  }

  if (existingUser && !existingUser.isVerified) {
    await User.deleteOne({ _id: existingUser._id });
  }

  // Create user (password hashed automatically by pre-save hook)
  await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    role: 'doctor',
    isVerified: false,
    isActive: false, // remains false until admin approval
  });

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + config.otpExpiresMinutes * 60 * 1000);

  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otpCode, salt);

  await Otp.deleteMany({ email: email.toLowerCase() });
  await Otp.create({
    email: email.toLowerCase(),
    otp: hashedOtp,
    expiresAt,
    attempts: 0,
  });

  await sendOtpEmail(email, otpCode, name);

  return {
    message: `OTP sent to ${email}. Please verify your email to continue.`,
    email,
  };
};

// ─── STEP 2: Verify OTP ───────────────────────────────────────────────────────
export const verifyDoctorOtp = async (data: {
  email: string;
  otp: string;
}): Promise<{ tempToken: string; message: string }> => {
  const { email, otp } = data;

  const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
  if (!otpRecord) {
    throw new Error('OTP not found or already expired. Please request a new one.');
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new Error('OTP has expired. Please request a new one.');
  }

  const MAX_ATTEMPTS = 5;
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new Error(`Invalid OTP. ${MAX_ATTEMPTS - otpRecord.attempts} attempts remaining.`);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('User not found. Please restart registration.');
  }

  user.isVerified = true;
  await user.save();
  await Otp.deleteOne({ _id: otpRecord._id });

  const tempToken = generateTempToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    tempToken,
    message: 'Email verified successfully. Please provide professional details.',
  };
};

// ─── STEP 2b: Resend OTP ──────────────────────────────────────────────────────
export const resendDoctorOtp = async (
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

// ─── STEP 3: Complete Doctor Profile (Pending Admin Approval) ───────────────
export const completeDoctorProfile = async (
  tempToken: string,
  profileData: {
    specialty?: string;
    qualification?: string;
    experienceYears?: number;
    consultationFee?: number;
    hospitalClinic?: string;
    documents?: {
      medicalLicense?: string;
      nidPassport?: string;
      degreeCertificate?: string;
      profilePhoto?: string;
    };
  }
): Promise<{ message: string }> => {
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

  // Create or Update Doctor Profile with pending status
  await DoctorProfile.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      specialty: profileData.specialty,
      qualification: profileData.qualification,
      experienceYears: profileData.experienceYears,
      consultationFee: profileData.consultationFee,
      hospitalClinic: profileData.hospitalClinic,
      documents: profileData.documents,
      status: 'pending',
      isProfileComplete: true,
    },
    { upsert: true, new: true }
  );

  // NOTE: user.isActive remains FALSE. Admin will set it to TRUE upon approval.

  return {
    message: 'Profile submitted successfully! Your account is pending admin approval. You can login once approved.',
  };
};
