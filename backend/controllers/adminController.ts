import { Request, Response } from 'express';
import fs from 'fs';
import { ReportSubmissionRepository } from '../repositories/ReportSubmissionRepository';
import { ReportAttachmentRepository } from '../repositories/ReportAttachmentRepository';
import { PublicReportRepository } from '../repositories/PublicReportRepository';
import { ClarificationRepository } from '../repositories/ClarificationRepository';
import { ResponseRepository } from '../repositories/ResponseRepository';
import { ModerationRepository } from '../repositories/ModerationRepository';
import { RelatedReportRepository } from '../repositories/RelatedReportRepository';
import { validateLifecycleTransition, validatePublicVersionData } from '../validation/validator';
import { AuthenticatedAdminRequest } from '../middleware/auth';
import { DbPublicReportVersion } from '../types';
import { getSafeUploadFilePath } from '../middleware/imageUpload';

export const AdminController = {
  async getOverview(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const allSubmissions = ReportSubmissionRepository.getAll();
      const allResponses = ResponseRepository.getAll();

      const counts = {
        total: allSubmissions.length,
        submitted: allSubmissions.filter((r) => r.status === 'submitted').length,
        underReview: allSubmissions.filter((r) => r.status === 'under_review').length,
        moreInfo: allSubmissions.filter((r) => r.status === 'more_info_needed').length,
        approved: allSubmissions.filter((r) => r.status === 'approved').length,
        published: allSubmissions.filter((r) => r.status === 'published').length,
        notPublished: allSubmissions.filter((r) => r.status === 'not_published').length,
        pendingResponses: allResponses.filter((r) => r.status === 'pending_editorial_review').length,
      };

      return res.json({ success: true, counts });
    } catch (err: any) {
      console.error('[Admin Overview Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to calculate overview.' } });
    }
  },

  async getReports(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { status, segment, search } = req.query;

      const submissions = ReportSubmissionRepository.getAll({
        status: typeof status === 'string' ? status : undefined,
        segment: typeof segment === 'string' ? segment : undefined,
        search: typeof search === 'string' ? search : undefined,
      });

      return res.json({
        success: true,
        count: submissions.length,
        reports: submissions.map((sub) => {
          const pv = PublicReportRepository.getByReportId(sub.id);
          const clar = ClarificationRepository.getByReportId(sub.id);
          return {
            id: sub.id,
            segment: sub.segment,
            subcategoryId: sub.subcategoryId,
            subcategoryBn: sub.subcategoryBn,
            subcategoryEn: sub.subcategoryEn,
            title: sub.title,
            reportedSubject: sub.reportedSubject,
            subjectType: sub.subjectType,
            organization: sub.organization,
            incidentDate: sub.incidentDate,
            location: sub.location,
            privacyChoice: sub.privacyChoice,
            status: sub.status,
            statusBn: sub.statusBn,
            statusEn: sub.statusEn,
            createdAt: sub.createdAt,
            hasPublicVersion: Boolean(pv),
            hasActiveClarification: Boolean(clar && !clar.resolvedAt),
          };
        }),
      });
    } catch (err: any) {
      console.error('[Admin Get Reports Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch queue reports.' } });
    }
  },

  async getReportDetail(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const submission = ReportSubmissionRepository.getById(id);

      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report submission not found.' } });
      }

      const publicVersion = PublicReportRepository.getByReportId(submission.id);
      const activeClarification = ClarificationRepository.getByReportId(submission.id);
      const moderationEvents = ModerationRepository.getEventsByReportId(submission.id);
      const responses = ResponseRepository.getAll({ reportId: submission.id });
      const relatedReports = RelatedReportRepository.getRelatedReportIds(submission.id);
      const rawAttachments = ReportAttachmentRepository.getByReportId(submission.id);

      const attachments = rawAttachments.map((att) => ({
        id: att.id,
        mimeType: att.mimeType,
        width: att.width,
        height: att.height,
        sizeBytes: att.sizeBytes,
        sortOrder: att.sortOrder,
        createdAt: att.createdAt,
        url: `/api/admin/attachments/${att.id}`,
      }));

      return res.json({
        success: true,
        report: submission,
        publicVersion,
        activeClarification,
        moderationEvents,
        responses,
        relatedReports,
        attachments,
      });
    } catch (err: any) {
      console.error('[Admin Report Detail Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch report detail.' } });
    }
  },

  async startReview(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const submission = ReportSubmissionRepository.getById(id);

      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      }

      const transition = validateLifecycleTransition(submission.status, 'under_review');
      if (!transition.allowed) {
        return res.status(400).json({ error: { code: transition.code, message: transition.message } });
      }

      const updated = await ReportSubmissionRepository.update(submission.id, {
        status: 'under_review',
        statusBn: 'পর্যালোচনাধীন',
        statusEn: 'Under Review',
      });

      await ModerationRepository.logEvent({
        reportId: submission.id,
        action: 'REVIEW_STARTED',
        actionBn: 'মডারেশন পর্যালোচনা শুরু হয়েছে',
        actionEn: 'Moderation review started',
        previousStatus: submission.status,
        newStatus: 'under_review',
        note: 'Editorial review commenced by administrator.',
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, report: updated });
    } catch (err: any) {
      console.error('[Start Review Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to start review.' } });
    }
  },

  async requestMoreInfo(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const { message, requestedFields } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          error: {
            code: 'MESSAGE_REQUIRED',
            message: 'Clarification message to reporter is required.',
          },
        });
      }

      const submission = ReportSubmissionRepository.getById(id);
      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      }

      const transition = validateLifecycleTransition(submission.status, 'more_info_needed');
      if (!transition.allowed) {
        return res.status(400).json({ error: { code: transition.code, message: transition.message } });
      }

      const now = new Date().toISOString();
      const clarId = `clar-${Date.now()}`;
      await ClarificationRepository.create({
        id: clarId,
        reportId: submission.id,
        message: message.trim(),
        requestedFields: requestedFields || [],
        createdAt: now,
      });

      const updated = await ReportSubmissionRepository.update(submission.id, {
        status: 'more_info_needed',
        statusBn: 'অতিরিক্ত তথ্য প্রয়োজন',
        statusEn: 'More Info Needed',
      });

      await ModerationRepository.logEvent({
        reportId: submission.id,
        action: 'MORE_INFO_REQUESTED',
        actionBn: 'অভিযোগকারীর কাছে অতিরিক্ত তথ্যের অনুরোধ করা হয়েছে',
        actionEn: 'Clarification requested from reporter',
        previousStatus: submission.status,
        newStatus: 'more_info_needed',
        note: message.trim(),
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, report: updated });
    } catch (err: any) {
      console.error('[Request More Info Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to request clarification.' } });
    }
  },

  async savePublicVersion(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const pvData = req.body;

      const submission = ReportSubmissionRepository.getById(id);
      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      }

      // Enforce reporter identity privacy consent
      let reporterIdentityVisibility = pvData.sensitiveSettings?.reporterIdentity || pvData.reporterIdentityVisibility || 'hidden';
      let publicReporterName: string | undefined = undefined;

      if (submission.privacyChoice !== 'public_identity') {
        // Enforce hidden if reporter chose anonymous or admin_only
        reporterIdentityVisibility = 'hidden';
        publicReporterName = undefined;
      } else if (reporterIdentityVisibility === 'public') {
        publicReporterName = pvData.publicReporterName?.trim();
      }

      const now = new Date().toISOString();
      const newPv: DbPublicReportVersion = {
        id: `pv-${submission.id}`,
        reportId: submission.id,
        titleBn: pvData.titleBn?.trim() || '',
        titleEn: pvData.titleEn?.trim() || '',
        shortDescriptionBn: pvData.shortDescriptionBn?.trim() || '',
        shortDescriptionEn: pvData.shortDescriptionEn?.trim() || '',
        fullDescriptionBn: pvData.fullDescriptionBn?.trim() || '',
        fullDescriptionEn: pvData.fullDescriptionEn?.trim() || '',
        subjectVisibility: pvData.sensitiveSettings?.subjectNamePrivacy || pvData.subjectVisibility || 'hidden',
        reportedSubjectBn: pvData.reportedSubjectBn?.trim() || undefined,
        reportedSubjectEn: pvData.reportedSubjectEn?.trim() || undefined,
        subjectType: pvData.subjectType || submission.subjectType || 'individual',
        organizationVisibility: pvData.sensitiveSettings?.organizationPrivacy || pvData.organizationVisibility || 'hidden',
        organization: pvData.organization?.trim() || undefined,
        locationVisibility: pvData.sensitiveSettings?.locationPrivacy || pvData.locationVisibility || 'hidden',
        locationBn: pvData.locationBn?.trim() || '',
        locationEn: pvData.locationEn?.trim() || '',
        districtBn: pvData.districtBn?.trim() || undefined,
        districtEn: pvData.districtEn?.trim() || undefined,
        areaBn: pvData.areaBn?.trim() || undefined,
        areaEn: pvData.areaEn?.trim() || undefined,
        approvedCoordinates: pvData.coordinates || pvData.approvedCoordinates || undefined,
        evidenceVisibility: pvData.sensitiveSettings?.evidencePrivacy || pvData.evidenceVisibility || 'hidden',
        evidenceSummaryBn: pvData.evidenceSummaryBn || [],
        evidenceSummaryEn: pvData.evidenceSummaryEn || [],
        reporterIdentityVisibility,
        publicReporterName,
        incidentDateBn: pvData.incidentDateBn?.trim() || '',
        incidentDateEn: pvData.incidentDateEn?.trim() || '',
        isHighUrgency: Boolean(pvData.isHighUrgency),
        publicAttachmentIds: Array.isArray(pvData.publicAttachmentIds) ? pvData.publicAttachmentIds : [],
        preparedAt: now,
        updatedAt: now,
      };

      const saved = await PublicReportRepository.saveOrUpdate(newPv);

      await ModerationRepository.logEvent({
        reportId: submission.id,
        action: 'PUBLIC_VERSION_SAVED',
        actionBn: 'সর্বজনীন সংস্করণ ড্রাফট সংরক্ষিত হয়েছে',
        actionEn: 'Public Version draft saved',
        note: 'Editorial draft updated.',
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, publicVersion: saved });
    } catch (err: any) {
      console.error('[Save Public Version Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to save Public Version.' } });
    }
  },

  async approveReport(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const submission = ReportSubmissionRepository.getById(id);

      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      }

      const transition = validateLifecycleTransition(submission.status, 'approved');
      if (!transition.allowed) {
        return res.status(400).json({ error: { code: transition.code, message: transition.message } });
      }

      const pv = PublicReportRepository.getByReportId(submission.id);
      if (!pv) {
        return res.status(400).json({
          error: {
            code: 'PUBLIC_VERSION_REQUIRED',
            message: 'A prepared Public Version is required before approval.',
          },
        });
      }

      const pvValidation = validatePublicVersionData(pv);
      if (!pvValidation.isValid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PUBLIC_VERSION',
            message: 'Public Version contains incomplete required fields.',
            errors: pvValidation.errors,
          },
        });
      }

      const now = new Date().toISOString();
      await PublicReportRepository.saveOrUpdate({
        ...pv,
        approvedAt: now,
        updatedAt: now,
      });

      const updated = await ReportSubmissionRepository.update(submission.id, {
        status: 'approved',
        statusBn: 'অনুমোদিত / প্রকাশের জন্য প্রস্তুত',
        statusEn: 'Approved for Publication',
      });

      await ModerationRepository.logEvent({
        reportId: submission.id,
        action: 'REPORT_APPROVED',
        actionBn: 'প্রতিবেদন প্রকাশের জন্য অনুমোদিত হয়েছে',
        actionEn: 'Report approved for public release',
        previousStatus: submission.status,
        newStatus: 'approved',
        note: 'Editorial review approved.',
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, report: updated });
    } catch (err: any) {
      console.error('[Approve Report Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to approve report.' } });
    }
  },

  async previewPublicVersion(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const submission = ReportSubmissionRepository.getById(id);

      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      }

      let pv = PublicReportRepository.getByReportId(submission.id);
      if (req.body && Object.keys(req.body).length > 0) {
        let reporterIdentityVisibility = req.body.sensitiveSettings?.reporterIdentity || req.body.reporterIdentityVisibility || 'hidden';
        let publicReporterName: string | undefined = undefined;

        if (submission.privacyChoice !== 'public_identity') {
          reporterIdentityVisibility = 'hidden';
          publicReporterName = undefined;
        } else if (reporterIdentityVisibility === 'public') {
          publicReporterName = req.body.publicReporterName?.trim();
        }

        pv = {
          id: `pv-${submission.id}`,
          reportId: submission.id,
          titleBn: req.body.titleBn?.trim() || '',
          titleEn: req.body.titleEn?.trim() || '',
          shortDescriptionBn: req.body.shortDescriptionBn?.trim() || '',
          shortDescriptionEn: req.body.shortDescriptionEn?.trim() || '',
          fullDescriptionBn: req.body.fullDescriptionBn?.trim() || '',
          fullDescriptionEn: req.body.fullDescriptionEn?.trim() || '',
          subjectVisibility: req.body.sensitiveSettings?.subjectNamePrivacy || req.body.subjectVisibility || 'hidden',
          reportedSubjectBn: req.body.reportedSubjectBn?.trim() || undefined,
          reportedSubjectEn: req.body.reportedSubjectEn?.trim() || undefined,
          subjectType: req.body.subjectType || submission.subjectType,
          organizationVisibility: req.body.sensitiveSettings?.organizationPrivacy || req.body.organizationVisibility || 'hidden',
          organization: req.body.organization?.trim() || undefined,
          locationVisibility: req.body.sensitiveSettings?.locationPrivacy || req.body.locationVisibility || 'hidden',
          locationBn: req.body.locationBn?.trim() || '',
          locationEn: req.body.locationEn?.trim() || '',
          districtBn: req.body.districtBn?.trim() || undefined,
          districtEn: req.body.districtEn?.trim() || undefined,
          areaBn: req.body.areaBn?.trim() || undefined,
          areaEn: req.body.areaEn?.trim() || undefined,
          approvedCoordinates: req.body.coordinates || req.body.approvedCoordinates || undefined,
          evidenceVisibility: req.body.sensitiveSettings?.evidencePrivacy || req.body.evidenceVisibility || 'hidden',
          evidenceSummaryBn: req.body.evidenceSummaryBn || [],
          evidenceSummaryEn: req.body.evidenceSummaryEn || [],
          reporterIdentityVisibility,
          publicReporterName,
          incidentDateBn: req.body.incidentDateBn?.trim() || '',
          incidentDateEn: req.body.incidentDateEn?.trim() || '',
          isHighUrgency: Boolean(req.body.isHighUrgency),
          publicAttachmentIds: Array.isArray(req.body.publicAttachmentIds) ? req.body.publicAttachmentIds : (pv?.publicAttachmentIds || []),
          preparedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      if (!pv) {
        return res.status(400).json({
          error: {
            code: 'NO_PUBLIC_DATA',
            message: 'No Public Version draft available to preview.',
          },
        });
      }

      const previewItem = PublicReportRepository.transformToPublicReportItem(submission, pv, []);

      return res.json({
        success: true,
        preview: previewItem,
      });
    } catch (err: any) {
      console.error('[Preview Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to generate preview.' } });
    }
  },

  async publishReport(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const submission = ReportSubmissionRepository.getById(id);

      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      }

      if (submission.status !== 'approved') {
        return res.status(400).json({
          error: {
            code: 'NOT_APPROVED',
            message: 'Only approved reports with a verified Public Version can be published.',
          },
        });
      }

      const pv = PublicReportRepository.getByReportId(submission.id);
      if (!pv) {
        return res.status(400).json({
          error: {
            code: 'PUBLIC_VERSION_MISSING',
            message: 'Prepared Public Version is missing.',
          },
        });
      }

      const now = new Date().toISOString();
      await PublicReportRepository.saveOrUpdate({
        ...pv,
        publishedAt: now,
        updatedAt: now,
      });

      const updated = await ReportSubmissionRepository.update(submission.id, {
        status: 'published',
        statusBn: 'প্রকাশিত প্রতিবেদন',
        statusEn: 'Published',
        publishedAt: now,
      });

      await ModerationRepository.logEvent({
        reportId: submission.id,
        action: 'REPORT_PUBLISHED',
        actionBn: 'প্রতিবেদন সর্বজনীন ফিডে প্রকাশিত হয়েছে',
        actionEn: 'Report published to public feed',
        previousStatus: 'approved',
        newStatus: 'published',
        note: 'Report released to public search and feed.',
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, report: updated });
    } catch (err: any) {
      console.error('[Publish Report Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to publish report.' } });
    }
  },

  async unpublishReport(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({
          error: {
            code: 'REASON_REQUIRED',
            message: 'Unpublish reason is required for moderation audit.',
            messageBn: 'প্রতিবেদনটি অপ্রকাশিত করার সুনির্দিষ্ট কারণ উল্লেখ করা আবশ্যক।',
          },
        });
      }

      const submission = ReportSubmissionRepository.getById(id);
      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      }

      if (submission.status !== 'published') {
        return res.status(400).json({
          error: {
            code: 'NOT_PUBLISHED',
            message: 'Only published reports can be unpublished.',
          },
        });
      }

      const updated = await ReportSubmissionRepository.update(submission.id, {
        status: 'not_published',
        statusBn: 'অপ্রকাশিত / বাতিল',
        statusEn: 'Not Published',
        unpublishReason: reason.trim(),
      });

      await ModerationRepository.logEvent({
        reportId: submission.id,
        action: 'REPORT_UNPUBLISHED',
        actionBn: `প্রতিবেদন অপ্রকাশিত করা হয়েছে (${reason.trim()})`,
        actionEn: `Report unpublished (${reason.trim()})`,
        previousStatus: 'published',
        newStatus: 'not_published',
        note: reason.trim(),
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, report: updated });
    } catch (err: any) {
      console.error('[Unpublish Report Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to unpublish report.' } });
    }
  },

  async linkRelatedReport(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const { targetReportId, relationshipType } = req.body;

      if (!targetReportId || !relationshipType) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Target report ID and relationship type are required.',
          },
        });
      }

      const repA = ReportSubmissionRepository.getById(id);
      const repB = ReportSubmissionRepository.getById(targetReportId);

      if (!repA || !repB) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'One or both reports were not found.' } });
      }

      await RelatedReportRepository.link(repA.id, repB.id, relationshipType);

      await ModerationRepository.logEvent({
        reportId: repA.id,
        action: 'RELATED_REPORT_LINKED',
        actionBn: `সম্পর্কিত প্রতিবেদন লিংক করা হয়েছে (${repB.id})`,
        actionEn: `Linked related report (${repB.id})`,
        note: `Type: ${relationshipType}`,
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, message: 'Related reports linked successfully.' });
    } catch (err: any) {
      console.error('[Link Related Report Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to link reports.' } });
    }
  },

  async addUpdate(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const { titleBn, titleEn, contentBn, contentEn, dateBn, dateEn } = req.body;

      if (!titleBn || !contentBn) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Title and content in Bangla are required.',
          },
        });
      }

      const submission = ReportSubmissionRepository.getById(id);
      if (!submission) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found.' } });
      }

      await ModerationRepository.logEvent({
        reportId: submission.id,
        action: 'ADD_REPORT_UPDATE',
        actionBn: `প্রতিবেদনে নতুন তথ্য আপডেট যোগ করা হয়েছে (${titleBn})`,
        actionEn: `Added update to public report (${titleEn || titleBn})`,
        note: contentEn || contentBn,
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({
        success: true,
        update: {
          titleBn,
          titleEn: titleEn || titleBn,
          contentBn,
          contentEn: contentEn || contentBn,
          dateBn: dateBn || 'আজ',
          dateEn: dateEn || 'Today',
        },
      });
    } catch (err: any) {
      console.error('[Add Update Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to add update.' } });
    }
  },

  async getResponses(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { status, reportId } = req.query;
      const responses = ResponseRepository.getAll({
        status: typeof status === 'string' ? status : undefined,
        reportId: typeof reportId === 'string' ? reportId : undefined,
      });

      return res.json({ success: true, count: responses.length, responses });
    } catch (err: any) {
      console.error('[Admin Responses Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch responses.' } });
    }
  },

  async publishResponse(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const resp = ResponseRepository.getById(id);

      if (!resp) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Response record not found.' } });
      }

      const now = new Date().toISOString();
      const updated = await ResponseRepository.update(resp.id, {
        status: 'published',
        publishedAt: now,
      });

      await ModerationRepository.logEvent({
        reportId: resp.reportId,
        action: 'RESPONSE_PUBLISHED',
        actionBn: 'অভিযুক্ত/সংশ্লিষ্ট পক্ষের প্রাতিষ্ঠানিক জবাব প্রকাশিত হয়েছে',
        actionEn: 'Official subject response published',
        note: `Response by ${resp.responderName} published.`,
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, response: updated });
    } catch (err: any) {
      console.error('[Publish Response Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to publish response.' } });
    }
  },

  async rejectResponse(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const resp = ResponseRepository.getById(id);

      if (!resp) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Response record not found.' } });
      }

      const updated = await ResponseRepository.update(resp.id, {
        status: 'rejected',
        rejectionReason: reason || 'Did not meet verification standards',
      });

      await ModerationRepository.logEvent({
        reportId: resp.reportId,
        action: 'RESPONSE_REJECTED',
        actionBn: 'প্রাপ্ত বক্তব্য সম্পাদকীয় মানদণ্ডে প্রত্যাখ্যাত হয়েছে',
        actionEn: 'Subject response rejected by editorial review',
        note: reason || 'Editorial rejection',
        actor: req.adminUser?.name || 'Administrator',
      });

      return res.json({ success: true, response: updated });
    } catch (err: any) {
      console.error('[Reject Response Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to reject response.' } });
    }
  },

  async getAuditLogs(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { reportId } = req.query;
      let logs = ModerationRepository.getAllEvents();
      if (typeof reportId === 'string' && reportId.trim()) {
        logs = ModerationRepository.getEventsByReportId(reportId.trim());
      }
      return res.json({ success: true, count: logs.length, logs });
    } catch (err: any) {
      console.error('[Admin Audit Logs Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch audit logs.' } });
    }
  },

  async getAttachmentById(req: AuthenticatedAdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const attachment = ReportAttachmentRepository.getById(id);
      if (!attachment) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attachment not found.' } });
      }

      const filePath = getSafeUploadFilePath(attachment.storageKey);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'Attachment file not found on disk.' } });
      }

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      console.error('[Admin Get Attachment Error]', err);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to serve admin attachment.' } });
    }
  },
};
