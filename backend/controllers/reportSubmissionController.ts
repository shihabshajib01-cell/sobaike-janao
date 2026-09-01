import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ReportSubmissionRepository } from '../repositories/ReportSubmissionRepository';
import { ReportAttachmentRepository } from '../repositories/ReportAttachmentRepository';
import { ClarificationRepository } from '../repositories/ClarificationRepository';
import { ModerationRepository } from '../repositories/ModerationRepository';
import { validateReportSubmission, validateLifecycleTransition } from '../validation/validator';
import { DbReportSubmission } from '../types';
import { StatusHistoryEntry } from '../../src/services/types';
import {
  sanitizeAndStoreImage,
  cleanupUploadedFiles,
  MAX_IMAGES_PER_REPORT,
  MAX_TOTAL_SIZE_BYTES,
  ProcessedImageResult,
} from '../middleware/imageUpload';

// Short-lived in-memory response cache (max 5 minutes) for immediate retry with plain PIN display
interface IdempotentRecord {
  reportId: string;
  pin: string;
  response: any;
  timestamp: number;
}
const idempotencyCache = new Map<string, IdempotentRecord>();

// Periodically clean up in-memory cache older than 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [key, record] of idempotencyCache.entries()) {
    if (record.timestamp < cutoff) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 1000);

function generateUniqueReportId(): string {
  const year = new Date().getFullYear();
  let attempts = 0;
  while (attempts < 100) {
    const randomNum = crypto.randomInt(100000, 1000000);
    const candidate = `SJ-${year}-${randomNum}`;
    const exists = ReportSubmissionRepository.getById(candidate);
    if (!exists) return candidate;
    attempts++;
  }
  return `SJ-${year}-${crypto.randomInt(100000, 1000000)}`;
}

function generate6DigitPin(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export const ReportSubmissionController = {
  async submitReport(req: Request, res: Response) {
    const savedStorageKeys: string[] = [];
    let keyHash: string | undefined = undefined;

    try {
      // 1. Extract payload from multipart form-data or JSON body
      let rawBody = req.body;
      if (req.body && typeof req.body.payload === 'string') {
        try {
          rawBody = JSON.parse(req.body.payload);
        } catch (_parseErr) {
          return res.status(400).json({
            error: {
              code: 'INVALID_JSON_PAYLOAD',
              message: 'The submitted form payload could not be parsed as valid JSON.',
              messageBn: 'জমা দেওয়া তথ্য সঠিকভাবে পড়া যায়নি।',
            },
          });
        }
      }

      // 2. Honeypot check (hidden unclickable field) - Reject immediately if triggered
      if (rawBody.website || rawBody.honeypot || req.body.website || req.body.honeypot) {
        console.warn('[Spam Detection] Honeypot field triggered on report submission.');
        return res.status(400).json({
          error: {
            code: 'SUBMISSION_REJECTED',
            message: 'The submission could not be accepted.',
            messageBn: 'জমাটি গ্রহণ করা যায়নি।',
          },
        });
      }

      // 3. Idempotency double-click check & atomic claim
      const idempotencyKey =
        (req.headers['idempotency-key'] as string) ||
        rawBody.idempotencyKey ||
        rawBody.clientSubmissionId;

      if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim().length > 0) {
        keyHash = crypto.createHash('sha256').update(idempotencyKey.trim()).digest('hex');

        // Check in-memory cache for immediate client retry (includes full PIN for initial display)
        if (idempotencyCache.has(keyHash)) {
          const cached = idempotencyCache.get(keyHash)!;
          return res.status(200).json(cached.response);
        }

        // Attempt atomic idempotency claim in DB
        const claim = ReportSubmissionRepository.claimIdempotency(keyHash);
        if (!claim.success) {
          if (claim.status === 'completed' && claim.reportId) {
            return res.status(200).json({
              success: true,
              code: 'ALREADY_SUBMITTED',
              reportId: claim.reportId,
              message: 'This report has already been submitted.',
              messageBn: 'এই প্রতিবেদনটি ইতিমধ্যে জমা দেওয়া হয়েছে।',
            });
          }

          // In-progress or concurrent processing
          return res.status(409).json({
            error: {
              code: 'SUBMISSION_IN_PROGRESS',
              message: 'This submission is already being processed.',
              messageBn: 'এই জমাটি ইতিমধ্যে প্রক্রিয়াধীন রয়েছে।',
            },
          });
        }
      }

      // 4. Validate schema fields
      const validation = validateReportSubmission(rawBody);
      if (!validation.isValid) {
        if (keyHash) {
          ReportSubmissionRepository.markIdempotencyFailed(keyHash);
        }
        return res.status(400).json({
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Report submission contains invalid fields.',
            errors: validation.errors,
          },
        });
      }

      const body = rawBody;

      // 5. Validate & process attached image files if any
      const files = (req.files as Express.Multer.File[]) || [];

      if (files.length > MAX_IMAGES_PER_REPORT) {
        if (keyHash) {
          ReportSubmissionRepository.markIdempotencyFailed(keyHash);
        }
        return res.status(400).json({
          error: {
            code: 'TOO_MANY_IMAGES',
            message: `You can upload a maximum of ${MAX_IMAGES_PER_REPORT} images per report.`,
            messageBn: `প্রতিটি প্রতিবেদনে সর্বোচ্চ ${MAX_IMAGES_PER_REPORT}টি ছবি যুক্ত করা যাবে।`,
          },
        });
      }

      const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSizeBytes > MAX_TOTAL_SIZE_BYTES) {
        if (keyHash) {
          ReportSubmissionRepository.markIdempotencyFailed(keyHash);
        }
        return res.status(400).json({
          error: {
            code: 'TOTAL_SIZE_EXCEEDED',
            message: 'Total upload size of all images cannot exceed 25MB.',
            messageBn: 'সকল ছবি মিলিয়ে মোট আকার ২৫ মেগাবাইটের বেশি হতে পারবে না।',
          },
        });
      }

      // Process and sanitize each image with Sharp
      const processedImages: ProcessedImageResult[] = [];
      const seenHashes = new Set<string>();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const sanitized = await sanitizeAndStoreImage(file.buffer, file.mimetype, i);
          savedStorageKeys.push(sanitized.storageKey);

          if (seenHashes.has(sanitized.sha256)) {
            cleanupUploadedFiles(savedStorageKeys);
            if (keyHash) {
              ReportSubmissionRepository.markIdempotencyFailed(keyHash);
            }
            return res.status(400).json({
              error: {
                code: 'DUPLICATE_IMAGE_DETECTED',
                message: 'Duplicate images detected in submission. Please remove identical files.',
                messageBn: 'একই ছবি একাধিকবার প্রদান করা হয়েছে। অনুগ্রহ করে ডুপ্লিকেট ছবি বাদ দিন।',
              },
            });
          }

          seenHashes.add(sanitized.sha256);
          processedImages.push(sanitized);
        } catch (imgErr: any) {
          cleanupUploadedFiles(savedStorageKeys);
          if (keyHash) {
            ReportSubmissionRepository.markIdempotencyFailed(keyHash);
          }
          console.error(`[Image Processing Error on file ${i + 1}]`, imgErr);
          return res.status(400).json({
            error: {
              code: 'IMAGE_PROCESSING_FAILED',
              message: imgErr.message || 'Image verification failed. Only valid JPG and PNG files under 5MB are accepted.',
              messageBn: 'ছবি যাচাইকরণ ব্যর্থ হয়েছে। শুধুমাত্র ৫ মেগাবাইটের নিচের জেপিজি ও পিএনজি ছবি গ্রহণযোগ্য।',
            },
          });
        }
      }

      // 6. Generate Report ID and cryptographically secure PIN
      const reportId = generateUniqueReportId();
      const plainPin = generate6DigitPin();
      const pinHash = bcrypt.hashSync(plainPin, 10);

      const now = new Date();
      const dateBn = `${now.getDate()} ${
        ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][
          now.getMonth()
        ]
      } ${now.getFullYear()}`;
      const dateEn = `${now.getDate()} ${
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
          now.getMonth()
        ]
      } ${now.getFullYear()}`;

      const initialHistory: StatusHistoryEntry = {
        date: dateBn,
        status: 'submitted',
        statusBn: 'প্রতিবেদন গৃহীত হয়েছে',
        statusEn: 'Report Received',
        noteBn: 'প্রতিবেদনটি সফলভাবে জমা হয়েছে এবং সম্পাদকীয় পর্যালোচনার জন্য অপেক্ষমাণ।',
        noteEn: 'Report has been submitted for moderation review and queued for editorial review.',
      };

      const rawParties = Array.isArray(body.mentionedParties) ? body.mentionedParties : [];
      const primaryParty = rawParties[0];

      const newSubmission: DbReportSubmission = {
        internalId: `sub-int-${Date.now()}-${crypto.randomInt(100, 999)}`,
        id: reportId,
        pinHash,
        segment: body.segment,
        subcategoryId: body.subcategoryId,
        subcategoryBn: body.subcategoryBn || body.subcategoryId,
        subcategoryEn: body.subcategoryEn || body.subcategoryId,
        title: body.title.trim(),
        reportedSubject: primaryParty?.name?.trim() || body.reportedSubject?.trim() || '',
        mentionedParties: rawParties.length > 0 ? rawParties : (body.reportedSubject?.trim() ? [{
          id: 'party-1',
          name: body.reportedSubject.trim(),
          type: body.subjectType || 'individual',
          roleOrDesignation: body.roleOrDesignation?.trim(),
          organization: body.organization?.trim(),
          publicProfileHandle: body.publicProfileHandle?.trim(),
          identifyingDescription: body.identifyingDescription?.trim()
        }] : []),
        subjectType: primaryParty?.type || body.subjectType || 'individual',
        roleOrDesignation: primaryParty?.roleOrDesignation?.trim() || body.roleOrDesignation?.trim(),
        organization: primaryParty?.organization?.trim() || body.organization?.trim(),
        publicProfileHandle: primaryParty?.publicProfileHandle?.trim() || body.publicProfileHandle?.trim(),
        identifyingDescription: primaryParty?.identifyingDescription?.trim() || body.identifyingDescription?.trim(),
        incidentDate: body.incidentDate,
        incidentTime: body.incidentTime,
        frequency: body.frequency || 'one-time',
        relationshipContext: body.relationshipContext,
        intimateWhatHappened: body.intimateWhatHappened,
        intimatePlatform: body.intimatePlatform,
        description: body.description.trim(),
        location: body.location,
        hasSupportingInfo: Boolean(body.hasSupportingInfo) || processedImages.length > 0,
        evidenceTypes: body.evidenceTypes || [],
        evidenceDescription: body.evidenceDescription || '',
        privacyChoice: body.privacyChoice,
        adminContact: body.adminContact,
        publicationPreferences: body.publicationPreferences || {
          showSubjectName: false,
          showOrganization: false,
          showGeneralLocation: true,
          showDescription: true,
        },
        status: 'submitted',
        statusBn: 'জমা হয়েছে / পর্যালোচনার অপেক্ষায়',
        statusEn: 'Submitted / Awaiting Review',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const attachmentEntities = processedImages.map((img) => ({
        id: img.id,
        reportId,
        storageKey: img.storageKey,
        mimeType: img.mimeType,
        width: img.width,
        height: img.height,
        sizeBytes: img.sizeBytes,
        sha256: img.sha256,
        sortOrder: img.sortOrder,
        createdAt: now.toISOString(),
      }));

      // 7. Atomic DB Transaction: save report, attachments, moderation event, and idempotency status
      ReportSubmissionRepository.createAtomicSubmission({
        submission: newSubmission,
        attachments: attachmentEntities,
        moderationNote: `Initial submission in segment ${body.segment} with ${processedImages.length} image(s)`,
        idempotencyKeyHash: keyHash,
      });

      const responsePayload = {
        success: true,
        reportId,
        pin: plainPin,
        message: 'Report submitted successfully.',
        attachmentCount: processedImages.length,
        report: {
          id: reportId,
          segment: newSubmission.segment,
          subcategoryId: newSubmission.subcategoryId,
          title: newSubmission.title,
          status: newSubmission.status,
          statusBn: newSubmission.statusBn,
          statusEn: newSubmission.statusEn,
          createdAt: newSubmission.createdAt,
          history: [initialHistory],
        },
      };

      // Store in short-lived in-memory cache for immediate client retry
      if (keyHash) {
        idempotencyCache.set(keyHash, {
          reportId,
          pin: plainPin,
          response: responsePayload,
          timestamp: Date.now(),
        });
      }

      return res.status(201).json(responsePayload);
    } catch (err: any) {
      // Mark idempotency attempt as failed so user can retry safely
      if (typeof keyHash === 'string' && keyHash.length > 0) {
        try {
          ReportSubmissionRepository.markIdempotencyFailed(keyHash);
        } catch (_markErr) {
          // ignore cleanup error
        }
      }

      // Clean up newly written files if the database insertion failed
      if (savedStorageKeys.length > 0) {
        cleanupUploadedFiles(savedStorageKeys);
      }

      console.error('[Submit Report Error]', err);
      return res.status(500).json({
        error: {
          code: 'SUBMISSION_FAILED',
          message: 'An error occurred while saving your report. Please try again.',
          messageBn: 'প্রতিবেদনটি সংরক্ষণ করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        },
      });
    }
  },

  async trackReport(req: Request, res: Response) {
    try {
      const id = req.body.id || req.body.reportId;
      const pin = req.body.pin;

      if (!id || !pin) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Report ID and PIN are required to track a report.',
            messageBn: 'প্রতিবেদন ট্র্যাকিংয়ের জন্য রিপোর্ট আইডি এবং পিন প্রয়োজন।',
          },
        });
      }

      const submission = ReportSubmissionRepository.getById(id);
      if (!submission) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'No report found matching the provided Report ID and PIN combination.',
            messageBn: 'প্রদত্ত রিপোর্ট আইডি ও পিনের সমন্বয়ে কোনো প্রতিবেদন পাওয়া যায়নি।',
          },
        });
      }

      const isPinValid = bcrypt.compareSync(pin.toString().trim(), submission.pinHash);
      if (!isPinValid) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'No report found matching the provided Report ID and PIN combination.',
            messageBn: 'প্রদত্ত রিপোর্ট আইডি ও পিনের সমন্বয়ে কোনো প্রতিবেদন পাওয়া যায়নি।',
          },
        });
      }

      // Fetch active clarification if any
      const activeClarification = ClarificationRepository.getByReportId(submission.id);

      // Fetch moderation events for timeline
      const events = ModerationRepository.getEventsByReportId(submission.id);
      const history: StatusHistoryEntry[] = events.map((e) => {
        const d = new Date(e.createdAt);
        return {
          date: d.toLocaleDateString('bn-BD'),
          status: e.newStatus || submission.status,
          statusBn: e.actionBn || submission.statusBn,
          statusEn: e.actionEn || submission.statusEn,
          noteBn: e.note || e.actionBn,
          noteEn: e.note || e.actionEn,
        };
      });

      // Return ONLY reporter-safe information (never PIN hash, internal admin notes, etc.)
      return res.json({
        success: true,
        report: {
          id: submission.id,
          segment: submission.segment,
          subcategoryId: submission.subcategoryId,
          subcategoryBn: submission.subcategoryBn,
          subcategoryEn: submission.subcategoryEn,
          title: submission.title,
          reportedSubject: submission.reportedSubject,
          incidentDate: submission.incidentDate,
          status: submission.status,
          statusBn: submission.statusBn,
          statusEn: submission.statusEn,
          createdAt: submission.createdAt,
          history,
          activeClarification: activeClarification
            ? {
                id: activeClarification.id,
                reportId: activeClarification.reportId,
                message: activeClarification.message,
                requestedFields: activeClarification.requestedFields,
                createdAt: activeClarification.createdAt,
                reporterResponse: activeClarification.reporterResponse,
                resolvedAt: activeClarification.resolvedAt,
              }
            : undefined,
        },
      });
    } catch (err: any) {
      console.error('[Track Report Error]', err);
      return res.status(500).json({
        error: {
          code: 'TRACK_FAILED',
          message: 'An error occurred while retrieving tracking details.',
        },
      });
    }
  },

  async submitAdditionalInfo(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { pin, reporterResponse } = req.body;

      if (!id || !pin || !reporterResponse || typeof reporterResponse !== 'string' || !reporterResponse.trim()) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Report ID, valid PIN, and clarification response text are required.',
            messageBn: 'রিপোর্ট আইডি, পিন এবং স্পষ্টীকরণ বিবরণ প্রদান আবশ্যক।',
          },
        });
      }

      const submission = ReportSubmissionRepository.getById(id);
      if (!submission) {
        return res.status(404).json({
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Report not found.',
          },
        });
      }

      const isPinValid = bcrypt.compareSync(pin.toString().trim(), submission.pinHash);
      if (!isPinValid) {
        return res.status(401).json({
          error: {
            code: 'INVALID_PIN',
            message: 'Invalid PIN provided for this report.',
            messageBn: 'প্রতিবেদনের জন্য প্রদত্ত পিন সঠিক নয়।',
          },
        });
      }

      const clarification = ClarificationRepository.getByReportId(submission.id);
      if (!clarification) {
        return res.status(400).json({
          error: {
            code: 'NO_ACTIVE_CLARIFICATION',
            message: 'No pending clarification request exists for this report.',
            messageBn: 'এই প্রতিবেদনের জন্য কোনো অপেক্ষমাণ অতিরিক্ত তথ্যের অনুরোধ পাওয়া যায়নি।',
          },
        });
      }

      // Update clarification record
      const resolvedAt = new Date().toISOString();
      await ClarificationRepository.update(clarification.id, {
        reporterResponse: reporterResponse.trim(),
        respondedAt: resolvedAt,
        resolvedAt,
      });

      // Update status back to under_review
      const updatedSubmission = await ReportSubmissionRepository.update(submission.id, {
        status: 'under_review',
        statusBn: 'পর্যালোচনাধীন',
        statusEn: 'Under Review',
      });

      // Log moderation event
      await ModerationRepository.logEvent({
        reportId: submission.id,
        action: 'REPORTER_INFO_RECEIVED',
        actionBn: 'অভিযোগকারীর অতিরিক্ত তথ্য পাওয়া গেছে (পর্যালোচনা পুনরায় শুরু)',
        actionEn: 'Reporter clarification received (review resumed)',
        previousStatus: 'more_info_needed',
        newStatus: 'under_review',
        note: `Reporter response: ${reporterResponse.trim().slice(0, 100)}...`,
        actor: 'Citizen Reporter',
      });

      return res.json({
        success: true,
        message: 'Additional information recorded successfully. Moderation review will resume.',
        report: updatedSubmission,
      });
    } catch (err: any) {
      console.error('[Clarification Response Error]', err);
      return res.status(500).json({
        error: {
          code: 'UPDATE_FAILED',
          message: 'An error occurred while saving clarification response.',
        },
      });
    }
  },
};
