import { Request, Response, NextFunction } from 'express';

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[API Error]', err);

  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = err.message || 'An unexpected error occurred processing your request.';
  const errorMessageBn = err.messageBn || 'অনুরোধটি সম্পন্ন করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।';

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: errorMessage,
      messageBn: errorMessageBn,
      field: err.field,
    },
  });
}
