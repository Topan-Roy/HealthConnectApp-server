import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: config.env === 'development' ? message : 'Internal Server Error',
    ...(config.env === 'development' && { stack: err.stack })
  });
};
