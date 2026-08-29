import { Router } from 'express';
import { PublicReportController } from '../controllers/publicReportController';
import { responseLimiter } from '../middleware/rateLimiter';

export const publicRoutes = Router();

publicRoutes.get('/reports', PublicReportController.getReports);
publicRoutes.get('/reports/:id', PublicReportController.getReportById);
publicRoutes.get('/attachments/:id', PublicReportController.getAttachmentById);
publicRoutes.get('/map', PublicReportController.getMapReports);
publicRoutes.get('/search', PublicReportController.searchReports);
publicRoutes.post('/reports/:id/response', responseLimiter, PublicReportController.submitSubjectResponse);
