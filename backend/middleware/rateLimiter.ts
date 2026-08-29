import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

const memoryStore = new Map<string, AttemptRecord>();

// Cleanup stale keys every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of memoryStore.entries()) {
    if (val.blockedUntil && val.blockedUntil < now) {
      memoryStore.delete(key);
    } else if (now - val.firstAttemptTime > 60 * 60 * 1000) {
      memoryStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function createRateLimiter(options: {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  keyGenerator?: (req: Request) => string;
  errorMessageBn: string;
  errorMessageEn: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const customKey = options.keyGenerator ? options.keyGenerator(req) : '';
    const rateLimitKey = `${ip}:${customKey}`;

    const now = Date.now();
    const record = memoryStore.get(rateLimitKey);

    if (record) {
      // Check if actively blocked
      if (record.blockedUntil && record.blockedUntil > now) {
        const remainingSec = Math.ceil((record.blockedUntil - now) / 1000);
        return res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: `${options.errorMessageEn} Please try again in ${remainingSec} seconds.`,
            messageBn: `${options.errorMessageBn} অনুগ্রহ করে ${remainingSec} সেকেন্ড পর পুনরায় চেষ্টা করুন।`,
            retryAfterSeconds: remainingSec,
          },
        });
      }

      // If outside time window, reset
      if (now - record.firstAttemptTime > options.windowMs) {
        memoryStore.set(rateLimitKey, {
          count: 1,
          firstAttemptTime: now,
        });
        return next();
      }

      // Inside window, increment
      record.count += 1;

      if (record.count > options.maxAttempts) {
        record.blockedUntil = now + options.blockDurationMs;
        const remainingSec = Math.ceil(options.blockDurationMs / 1000);
        return res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: `${options.errorMessageEn} Please try again in ${remainingSec} seconds.`,
            messageBn: `${options.errorMessageBn} অনুগ্রহ করে ${remainingSec} সেকেন্ড পর পুনরায় চেষ্টা করুন।`,
            retryAfterSeconds: remainingSec,
          },
        });
      }
    } else {
      memoryStore.set(rateLimitKey, {
        count: 1,
        firstAttemptTime: now,
      });
    }

    next();
  };
}

// Track Report limiter (neutral message)
export const trackPinLimiter = createRateLimiter({
  maxAttempts: 10,
  windowMs: 10 * 60 * 1000,
  blockDurationMs: 5 * 60 * 1000,
  keyGenerator: (req) => `track:${req.body?.id || req.body?.reportId || 'anon'}`,
  errorMessageBn: 'অতিরিক্ত অনুসন্ধান চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।',
  errorMessageEn: 'Too many tracking attempts. Please try again later.',
});

// Admin Login limiter (max 8 attempts per 15 minutes, block for 15 minutes)
export const loginLimiter = createRateLimiter({
  maxAttempts: 8,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
  keyGenerator: (req) => `login:${req.body?.email || 'anon'}`,
  errorMessageBn: 'অতিরিক্ত ব্যর্থ লগইন প্রচেষ্টা। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।',
  errorMessageEn: 'Too many failed login attempts.',
});

// Report Submission limiter (max 20 submissions per hour per IP)
export const submissionLimiter = createRateLimiter({
  maxAttempts: 20,
  windowMs: 60 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
  keyGenerator: () => 'submit',
  errorMessageBn: 'অতিরিক্ত প্রতিবেদন জমা দেওয়ার অনুরোধ করা হয়েছে।',
  errorMessageEn: 'Too many report submissions from this network.',
});

// Subject Response submission limiter
export const responseLimiter = createRateLimiter({
  maxAttempts: 10,
  windowMs: 30 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
  keyGenerator: (req) => `resp:${req.params?.id || 'anon'}`,
  errorMessageBn: 'অতিরিক্ত প্রাতিষ্ঠানিক বক্তব্য জমা দেওয়ার অনুরোধ করা হয়েছে।',
  errorMessageEn: 'Too many response submissions from this network.',
});
