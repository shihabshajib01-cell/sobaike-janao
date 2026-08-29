import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { verifyAdminAuth } from '../middleware/auth';

export const adminRoutes = Router();

// Protect ALL admin routes with real session/JWT validation
adminRoutes.use(verifyAdminAuth);

adminRoutes.get('/overview', AdminController.getOverview);
adminRoutes.get('/reports', AdminController.getReports);
adminRoutes.get('/reports/:id', AdminController.getReportDetail);
adminRoutes.get('/attachments/:id', AdminController.getAttachmentById);
adminRoutes.post('/reports/:id/start-review', AdminController.startReview);
adminRoutes.post('/reports/:id/request-info', AdminController.requestMoreInfo);
adminRoutes.post('/reports/:id/save-public-version', AdminController.savePublicVersion);
adminRoutes.post('/reports/:id/approve', AdminController.approveReport);
adminRoutes.post('/reports/:id/preview', AdminController.previewPublicVersion);
adminRoutes.post('/reports/:id/publish', AdminController.publishReport);
adminRoutes.post('/reports/:id/unpublish', AdminController.unpublishReport);
adminRoutes.post('/reports/:id/link-related', AdminController.linkRelatedReport);
adminRoutes.post('/reports/:id/add-update', AdminController.addUpdate);

// Responses queue
adminRoutes.get('/responses', AdminController.getResponses);
adminRoutes.post('/responses/:id/publish', AdminController.publishResponse);
adminRoutes.post('/responses/:id/reject', AdminController.rejectResponse);

// Audit logs
adminRoutes.get('/audit-logs', AdminController.getAuditLogs);
