import { Router } from 'express';
import { ReportSubmissionController } from '../controllers/reportSubmissionController';
import { trackPinLimiter, submissionLimiter } from '../middleware/rateLimiter';
import { uploadImagesMiddleware } from '../middleware/imageUpload';

export const reportRoutes = Router();

// Submit report (supports JSON and multipart/form-data with attached images)
reportRoutes.post('/', submissionLimiter, uploadImagesMiddleware, ReportSubmissionController.submitReport);

// Track report by ID + PIN
reportRoutes.post('/track', trackPinLimiter, ReportSubmissionController.trackReport);

// Submit additional clarification
reportRoutes.post('/:id/additional-info', trackPinLimiter, ReportSubmissionController.submitAdditionalInfo);
