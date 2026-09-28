import { Router } from 'express';
import * as authController from './auth.controller';
import * as patientRegController from './patient.registration.controller';
import * as doctorRegController from './doctor.registration.controller';
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
router.post('/patient/initiate', patientRegController.initiateRegistration);
router.post('/patient/verify-otp', patientRegController.verifyOtp);
router.post('/patient/resend-otp', patientRegController.resendOtp);
router.post('/patient/complete-profile', patientRegController.completeProfile);

// ─── Doctor Multi-Step Registration ──────────────────────────────────────────
router.post('/doctor/initiate', doctorRegController.initiateRegistration);
router.post('/doctor/verify-otp', doctorRegController.verifyOtp);
router.post('/doctor/resend-otp', doctorRegController.resendOtp);
router.post('/doctor/complete-profile', doctorRegController.completeProfile);

export default router;

