import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { loginLimiter } from '../middleware/rateLimiter';
import { verifyAdminAuth } from '../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/login', loginLimiter, AuthController.login);
authRoutes.get('/me', verifyAdminAuth, AuthController.me);
authRoutes.post('/logout', AuthController.logout);
