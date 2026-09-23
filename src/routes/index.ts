import { Router, Request, Response } from 'express';

const router = Router();

// API Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'HealthConnect API is running'
  });
});

export default router;
