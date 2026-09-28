import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';

const router = Router();

// API Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'HealthConnect API is running'
  });
});

// Mount Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
