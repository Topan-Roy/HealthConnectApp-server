import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes';

const router = Router();

// API Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'HealthConnect API is running'
  });
});

// Mount Auth routes
router.use('/auth', authRoutes);

export default router;
