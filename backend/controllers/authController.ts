import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminRepository } from '../repositories/AdminRepository';
import { JWT_SECRET, AuthenticatedAdminRequest } from '../middleware/auth';

export const AuthController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Email and password are required.',
            messageBn: 'ইমেইল এবং পাসওয়ার্ড আবশ্যক।',
          },
        });
      }

      const admin = AdminRepository.findByEmail(email);
      if (!admin) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email address or password.',
            messageBn: 'ভুল ইমেইল অথবা পাসওয়ার্ড প্রদান করা হয়েছে।',
          },
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, admin.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email address or password.',
            messageBn: 'ভুল ইমেইল অথবা পাসওয়ার্ড প্রদান করা হয়েছে।',
          },
        });
      }

      await AdminRepository.updateLastLogin(admin.id);

      // Generate JWT Token (valid for 24 hours)
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const isProd = process.env.NODE_ENV === 'production';

      // Set HTTP-only cookie for secure browser session support
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (err: any) {
      console.error('[Admin Login Error]', err);
      return res.status(500).json({
        error: {
          code: 'LOGIN_FAILED',
          message: 'An error occurred during administrator login.',
        },
      });
    }
  },

  async me(req: AuthenticatedAdminRequest, res: Response) {
    if (!req.adminUser) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated.',
        },
      });
    }

    return res.json({
      success: true,
      user: req.adminUser,
    });
  },

  async logout(req: Request, res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
    });
    return res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  },
};
