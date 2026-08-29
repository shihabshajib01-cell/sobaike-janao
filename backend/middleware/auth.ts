import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AdminRepository } from '../repositories/AdminRepository';

export interface AuthenticatedAdminRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Security] JWT_SECRET environment variable is required in production.');
  }
  // Ephemeral development fallback (not hardcoded in code)
  return (global as any).__DEV_JWT_SECRET__ || ((global as any).__DEV_JWT_SECRET__ = crypto.randomBytes(32).toString('hex'));
}

export const JWT_SECRET = getJwtSecret();

export function verifyAdminAuth(req: AuthenticatedAdminRequest, res: Response, next: NextFunction) {
  try {
    // Check HTTP-only cookie first, fallback to header if needed
    let token: string | undefined = undefined;

    if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Admin authentication is required to access this resource.',
        },
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const admin = AdminRepository.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid session or administrator account not found.',
        },
      });
    }

    req.adminUser = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED_OR_INVALID',
        message: 'Authentication session expired or invalid. Please log in again.',
      },
    });
  }
}
