import { Router } from 'express';
import * as authController from './auth.controller';
import * as patientRegController from './patient.registration.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

// ─── General Auth Routes ──────────────────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

// ─── Patient Multi-Step Registration ─────────────────────────────────────────
// Step 1: Submit basic info → sends OTP to email
router.post('/patient/initiate', patientRegController.initiateRegistration);

// Step 2: Verify OTP → returns temp token
router.post('/patient/verify-otp', patientRegController.verifyOtp);

// Step 2b: Resend OTP
router.post('/patient/resend-otp', patientRegController.resendOtp);

// Step 3: Complete profile (requires temp token in Authorization header)
router.post('/patient/complete-profile', patientRegController.completeProfile);

export default router;

