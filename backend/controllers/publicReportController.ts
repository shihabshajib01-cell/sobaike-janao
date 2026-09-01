import { Request, Response } from 'express';
import fs from 'fs';
import { PublicReportRepository } from '../repositories/PublicReportRepository';
import { ResponseRepository } from '../repositories/ResponseRepository';
import { ReportAttachmentRepository } from '../repositories/ReportAttachmentRepository';
import { ReportSubmissionRepository } from '../repositories/ReportSubmissionRepository';
import { getSafeUploadFilePath } from '../middleware/imageUpload';
import { DbSubjectResponse } from '../types';

export const PublicReportController = {
  async getAttachmentById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const attachment = ReportAttachmentRepository.getById(id);
      if (!attachment) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Attachment not found.',
          },
        });
      }

      // Verify that the report is published AND evidence is public AND attachment is in publicAttachmentIds
      const submission = ReportSubmissionRepository.getById(attachment.reportId);
      if (!submission || submission.status !== 'published') {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Attachment not found.',
          },
        });
      }

      const publicVersion = PublicReportRepository.getByReportId(attachment.reportId);
      if (!publicVersion || publicVersion.evidenceVisibility !== 'public') {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Attachment not found.',
          },
        });
      }

      if (!publicVersion.publicAttachmentIds || !publicVersion.publicAttachmentIds.includes(attachment.id)) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Attachment not found.',
          },
        });
      }

      const filePath = getSafeUploadFilePath(attachment.storageKey);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Attachment not found.',
          },
        });
      }

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      console.error('[Public Get Attachment Error]', err);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to serve attachment.',
        },
      });
    }
  },
  async getReports(req: Request, res: Response) {
    try {
      const { segment, subcategory, district, search, sort, limit } = req.query;

      const reports = PublicReportRepository.getAllPublished({
        segment: typeof segment === 'string' ? segment : undefined,
        subcategory: typeof subcategory === 'string' ? subcategory : undefined,
        district: typeof district === 'string' ? district : undefined,
        search: typeof search === 'string' ? search : undefined,
        sort: typeof sort === 'string' ? sort : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      return res.json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (err: any) {
      console.error('[Public Get Reports Error]', err);
      return res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to load public reports.',
        },
      });
    }
  },

  async getReportById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const report = PublicReportRepository.getPublishedById(id);

      if (!report) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Public report not found or has been unpublished.',
            messageBn: 'প্রতিবেদনটি পাওয়া যায়নি অথবা বর্তমানে অপ্রকাশিত রয়েছে।',
          },
        });
      }

      // Fetch published responses for this report
      const responses = ResponseRepository.getPublishedByReportId(report.id);

      return res.json({
        success: true,
        report,
        responses: responses.map((r) => ({
          id: r.id,
          responderName: r.responderName,
          responderType: r.responderType,
          organizationName: r.organizationName,
          designation: r.designation,
          officialStatement: r.officialStatement,
          supportingDocumentsSummary: r.supportingDocumentsSummary,
          publishedAt: r.publishedAt,
        })),
      });
    } catch (err: any) {
      console.error('[Public Get Report Detail Error]', err);
      return res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to load public report detail.',
        },
      });
    }
  },

  async getMapReports(req: Request, res: Response) {
    try {
      const { segment } = req.query;
      const reports = PublicReportRepository.getMappableReports({
        segment: typeof segment === 'string' ? segment : undefined,
      });

      return res.json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (err: any) {
      console.error('[Public Map Reports Error]', err);
      return res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to load map data.',
        },
      });
    }
  },

  async searchReports(req: Request, res: Response) {
    try {
      const { q, segment } = req.query;
      const queryStr = typeof q === 'string' ? q : '';

      const reports = PublicReportRepository.getAllPublished({
        search: queryStr,
        segment: typeof segment === 'string' ? segment : undefined,
      });

      return res.json({
        success: true,
        query: queryStr,
        count: reports.length,
        reports,
      });
    } catch (err: any) {
      console.error('[Public Search Error]', err);
      return res.status(500).json({
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to execute search.',
        },
      });
    }
  },

  async submitSubjectResponse(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const body = req.body;

      if (!body.responderName || !body.contactEmailOrPhone || !body.officialStatement) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Responder name, contact email/phone, and a statement or clarification are required.',
            messageBn: 'উত্তরদাতার নাম, যোগাযোগের তথ্য এবং বক্তব্য বা স্পষ্টীকরণ আবশ্যক।',
          },
        });
      }

      // Ensure report exists and is published
      const report = PublicReportRepository.getPublishedById(id);
      if (!report) {
        return res.status(404).json({
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'The target report does not exist or is not currently published.',
            messageBn: 'উদ্দিষ্ট প্রতিবেদনটি খুঁজে পাওয়া যায়নি অথবা বর্তমানে অপ্রকাশিত রয়েছে।',
          },
        });
      }

      const now = new Date().toISOString();

      const newResponse: DbSubjectResponse = {
        id: `resp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        reportId: report.id,
        reportTitle: report.titleBn || report.titleEn,
        responderType: body.responderType || 'mentioned_person',
        responderName: body.responderName.trim(),
        contactEmailOrPhone: body.contactEmailOrPhone.trim(),
        contactInfo: body.contactInfo?.trim(),
        organizationName: body.organizationName?.trim(),
        designation: body.designation?.trim(),
        officialStatement: body.officialStatement.trim(),
        supportingDocumentsNote: body.supportingDocumentsNote?.trim(),
        supportingDocumentsSummary: body.supportingDocumentsSummary || [],
        requestCorrectionOrRemoval: Boolean(body.requestCorrectionOrRemoval),
        correctionDetails: body.correctionDetails?.trim(),
        status: 'pending_editorial_review',
        createdAt: now,
        updatedAt: now,
      };

      await ResponseRepository.create(newResponse);

      return res.status(201).json({
        success: true,
        message: 'Submitted for moderation review',
        messageBn: 'আপনার প্রাতিষ্ঠানিক বক্তব্যটি সফলভাবে জমা হয়েছে এবং সম্পাদকীয় পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।',
        responseId: newResponse.id,
      });
    } catch (err: any) {
      console.error('[Submit Response Error]', err);
      return res.status(500).json({
        error: {
          code: 'SUBMISSION_FAILED',
          message: 'Failed to submit response.',
        },
      });
    }
  },
};
