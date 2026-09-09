import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ReporterSubmissionContext, isValidReporterCoordinates } from './types';
import { mockStorage } from './mockStorage';


export interface ApiError {
  code: string;
  message: string;
  messageBn?: string;
  field?: string;
}

class ApiClient {
  // --- Public Response APIs ---
  async submitCitizenResponse(
    reportId: string,
    payload: {
      description: string;
      incidentDate?: string;
      contactConsent: boolean;
      contactInfo?: string;
    }
  ): Promise<{ success: boolean; message: string; messageBn: string; responseId: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      const isMockAllowed =
        !isSupabaseConfigured() ||
        import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

      if (!isMockAllowed) {
        const error: ApiError = {
          code: 'SUPABASE_NOT_CONFIGURED',
          message: 'Supabase client is not configured.',
          messageBn: 'ডাটাবেজ সংযোগ কনফিগার করা নেই।',
        };
        throw error;
      }
      const respId = `SR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      mockStorage.addMockResponse(reportId, {
        id: respId,
        responseType: 'citizen_information',
        content: payload.description,
        incidentDate: payload.incidentDate || null,
        publishedAt: new Date().toISOString(),
        responderType: null,
        responderName: null,
        designation: null,
        organizationName: null,
      });
      return {
        success: true,
        responseId: respId,
        message: 'Mock response submitted successfully.',
        messageBn: 'আপনার তথ্য সফলভাবে জমা হয়েছে (মক মোড)।',
      };
    }

    const { data, error } = await supabase.rpc('submit_public_response', {
      p_report_id: reportId,
      p_response_type: 'citizen_information',
      p_payload: {
        description: payload.description,
        incidentDate: payload.incidentDate,
        contactConsent: payload.contactConsent,
        contactInfo: payload.contactConsent ? payload.contactInfo : undefined,
      },
    });

    if (error) {
      const isNotPublished = error.message?.includes('INVALID_REPORT_STATUS');
      const isNotFound = error.message?.includes('REPORT_NOT_FOUND');
      const apiError: ApiError = {
        code: error.code || 'RPC_ERROR',
        message: error.message || 'Response submission failed.',
        messageBn: isNotPublished
          ? 'শুধুমাত্র প্রকাশিত প্রতিবেদনের বিপরীতে তথ্য বা প্রতিক্রিয়া জমা দেওয়া যায়।'
          : isNotFound
          ? 'রেফারেন্স করা প্রতিবেদনটি খুঁজে পাওয়া যায়নি।'
          : 'তথ্য জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
      };
      throw apiError;
    }

    return {
      success: true,
      responseId: data?.responseId || '',
      message: data?.message || 'Response submitted successfully.',
      messageBn: 'আপনার তথ্য সফলভাবে জমা হয়েছে এবং পর্যালোচনার জন্য অপেক্ষমাণ।',
    };
  }

  async submitSubjectResponse(
    reportId: string,
    payload: {
      responderType?: 'mentioned_person' | 'organization_rep' | 'legal_rep';
      responderName: string;
      designation?: string;
      organizationName?: string;
      contactEmailOrPhone: string;
      officialStatement: string;
      supportingDocumentsNote?: string;
      requestCorrectionOrRemoval?: boolean;
      correctionDetails?: string;
    }
  ): Promise<{ success: boolean; message: string; messageBn: string; responseId: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      const isMockAllowed =
        !isSupabaseConfigured() ||
        import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

      if (!isMockAllowed) {
        const error: ApiError = {
          code: 'SUPABASE_NOT_CONFIGURED',
          message: 'Supabase client is not configured.',
          messageBn: 'ডাটাবেজ সংযোগ কনফিগার করা নেই।',
        };
        throw error;
      }
      const respId = `SR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      mockStorage.addMockResponse(reportId, {
        id: respId,
        responseType: 'subject_response',
        content: payload.officialStatement,
        incidentDate: null,
        publishedAt: new Date().toISOString(),
        responderType: payload.responderType || 'mentioned_person',
        responderName: payload.responderName,
        designation: payload.designation || null,
        organizationName: payload.organizationName || null,
      });
      return {
        success: true,
        responseId: respId,
        message: 'Mock subject response submitted successfully.',
        messageBn: 'প্রতিউত্তর সফলভাবে জমা হয়েছে (মক মোড)।',
      };
    }

    const { data, error } = await supabase.rpc('submit_public_response', {
      p_report_id: reportId,
      p_response_type: 'subject_response',
      p_payload: payload,
    });

    if (error) {
      const isNotPublished = error.message?.includes('INVALID_REPORT_STATUS');
      const isNotFound = error.message?.includes('REPORT_NOT_FOUND');
      const apiError: ApiError = {
        code: error.code || 'RPC_ERROR',
        message: error.message || 'Subject response submission failed.',
        messageBn: isNotPublished
          ? 'শুধুমাত্র প্রকাশিত প্রতিবেদনের বিপরীতে প্রতিউত্তর জমা দেওয়া যায়।'
          : isNotFound
          ? 'রেফারেন্স করা প্রতিবেদনটি খুঁজে পাওয়া যায়নি।'
          : 'প্রতিউত্তর জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
      };
      throw apiError;
    }

    return {
      success: true,
      responseId: data?.responseId || '',
      message: data?.message || 'Subject response submitted successfully.',
      messageBn: 'আপনার প্রতিউত্তর সফলভাবে জমা হয়েছে এবং পর্যালোচনার জন্য অপেক্ষমাণ।',
    };
  }

  // --- Report Submission APIs ---
  async submitReport(
    payload: any,
    images?: File[],
    idempotencyKey?: string,
    reporterContext?: ReporterSubmissionContext
  ) {
    // Fail-closed validation: ensure valid reporter device location context exists
    if (
      !reporterContext ||
      !isValidReporterCoordinates(
        reporterContext.latitude,
        reporterContext.longitude,
        reporterContext.accuracy_meters
      )
    ) {
      const locError: ApiError = {
        code: 'REPORTER_LOCATION_REQUIRED',
        message:
          'Valid device location is required for complaint submission for platform safety and spam prevention.',
        messageBn:
          'প্ল্যাটফর্মের নিরাপত্তা ও স্প্যাম প্রতিরোধের স্বার্থে অভিযোগ জমা দিতে ডিভাইসের অবস্থান আবশ্যক।',
      };
      throw locError;
    }

    if (!isSupabaseConfigured() || !supabase) {
      const isMockAllowed =
        !isSupabaseConfigured() ||
        import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

      if (isMockAllowed) {
        console.warn('[ApiClient] Supabase not configured — operating in local mock mode');
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const mockReportId = `SJ-${new Date().getFullYear()}-${randomNum}`;
        const mockReport = {
          id: mockReportId,
          segment: payload.segment || 'harassment',
          subcategoryId: payload.subcategoryId || 'other',
          subcategoryBn: payload.subcategoryBn || payload.subcategoryId || '',
          subcategoryEn: payload.subcategoryEn || payload.subcategoryId || '',
          title: payload.title || `অভিযোগ #${mockReportId}`,
          reportedSubject: payload.reportedSubject || 'অজ্ঞাত',
          subjectType: payload.subjectType || 'individual',
          organization: payload.organization,
          incidentDate: payload.incidentDate || new Date().toISOString().split('T')[0],
          incidentTime: payload.incidentTime,
          description: payload.description || '',
          location: payload.location,
          hasSupportingInfo: Boolean(images && images.length > 0),
          status: 'submitted',
          statusBn: 'জমা হয়েছে / পর্যালোচনার অপেক্ষায়',
          statusEn: 'Submitted / Awaiting Review',
          createdAt: new Date().toISOString(),
          publicVersion: {
            titleBn: payload.title || `অভিযোগ #${mockReportId}`,
            titleEn: payload.title || `Complaint #${mockReportId}`,
            shortDescriptionBn: (payload.description || '').slice(0, 120),
            shortDescriptionEn: (payload.description || '').slice(0, 120),
            fullDescriptionBn: payload.description || '',
            fullDescriptionEn: payload.description || '',
            reportedSubjectBn: payload.reportedSubject,
            reportedSubjectEn: payload.reportedSubject,
            locationBn: payload.location?.formattedAddress || 'অবস্থান গোপন',
            locationEn: payload.location?.formattedAddress || 'Location withheld',
            districtBn: payload.location?.district || '',
            districtEn: payload.location?.district || '',
            areaBn: payload.location?.area || '',
            areaEn: payload.location?.area || '',
            incidentDateBn: payload.incidentDate || '',
            incidentDateEn: payload.incidentDate || '',
            evidenceSummaryBn: [],
            evidenceSummaryEn: [],
            sensitiveSettings: {
              reporterIdentity: 'hidden',
              locationPrivacy: 'public',
              subjectNamePrivacy: 'public',
              organizationPrivacy: 'public',
              evidencePrivacy: 'public',
            },
          },
        };
        mockStorage.addMockReport(mockReport as any);

        return {
          success: true,
          reportId: mockReportId,
          message: 'Report submitted successfully (local mock mode).',
          report: {
            id: mockReportId,
            ...payload,
            createdAt: new Date().toISOString(),
          },
        };
      }

      const unavailableError: ApiError = {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Submission service is currently unavailable. Your draft is preserved. Please try again later.',
        messageBn: 'অভিযোগ জমা দেওয়ার সেবা এই মুহূর্তে সাময়িকভাবে অনুপলব্ধ। আপনার খসড়াটি সংরক্ষিত রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
      };
      throw unavailableError;
    }

    const clientSubmissionId = idempotencyKey?.trim();
    if (!clientSubmissionId) {
      const idError: ApiError = {
        code: 'MISSING_CLIENT_SUBMISSION_ID',
        message: 'Client submission identifier is required.',
        messageBn: 'ক্লায়েন্ট সাবমিশন আইডি আবশ্যক।',
      };
      throw idError;
    }

    const hasImages = Array.isArray(images) && images.length > 0;

    // Step 1: Submit complaint via authoritative 3-argument RPC with safe reporter context
    const enrichedPayload = {
      ...payload,
      reporterContext,
    };

    const result = await supabase.rpc('submit_public_complaint', {
      p_payload: enrichedPayload,
      p_client_submission_id: clientSubmissionId,
      p_reporter_context: reporterContext,
    });

    const { data, error } = result;

    if (error) {
      const isOutdatedSchema =
        error.code === 'PGRST202' ||
        error.message?.includes('function') ||
        error.message?.includes('schema cache');
      const apiError: ApiError = {
        code: isOutdatedSchema ? 'OUTDATED_SERVER_SCHEMA' : (error.code || 'RPC_ERROR'),
        message: isOutdatedSchema
          ? 'Submission service is undergoing updates. Your draft is preserved, please try again in a few moments.'
          : (error.message || 'Supabase submission failed.'),
        messageBn: isOutdatedSchema
          ? 'সার্ভার হালনাগাদ হচ্ছে। আপনার খসড়াটি সংরক্ষিত রয়েছে, অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : 'প্রতিবেদন জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
      };
      throw apiError;
    }

    if (!data || !data.success) {
      const failureMsg = data?.message || 'Submission was rejected by the server.';
      const apiError: ApiError = {
        code: data?.code || 'SUBMISSION_REJECTED',
        message: failureMsg,
        messageBn: 'প্রতিবেদনটি গ্রহণ করা যায়নি।',
      };
      throw apiError;
    }

    const reportId = data.reportId as string;

    // Step 2 & 3: If images are attached, upload to private Supabase bucket and register evidence
    if (hasImages && images) {
      for (const file of images) {
        const storagePath = `public-submissions/${clientSubmissionId}/${file.name}`;

        // Upload to private complaint-evidence bucket
        const { error: uploadError } = await supabase.storage
          .from('complaint-evidence')
          .upload(storagePath, file, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          const isDuplicate =
            uploadError.message?.toLowerCase().includes('already exists') ||
            uploadError.message?.toLowerCase().includes('duplicate') ||
            (uploadError as any).statusCode === '409' ||
            (uploadError as any).status === 409;

          if (!isDuplicate) {
            const apiError: ApiError = {
              code: 'EVIDENCE_UPLOAD_FAILED',
              message: `Failed to upload image "${file.name}". ${uploadError.message}`,
              messageBn:
                'আপনার অভিযোগ সংরক্ষিত হয়েছে, তবে এক বা একাধিক ছবি আপলোড করা যায়নি। জমা সম্পন্ন করতে আবার চেষ্টা করুন।',
            };
            throw apiError;
          }
        }

        // Register evidence with Supabase RPC
        const { error: regError } = await supabase.rpc('register_public_complaint_evidence', {
          p_client_submission_id: clientSubmissionId,
          p_storage_path: storagePath,
          p_file_name: file.name,
          p_file_size_bytes: file.size,
          p_caption: null,
        });

        if (regError) {
          const apiError: ApiError = {
            code: regError.code || 'EVIDENCE_REGISTRATION_FAILED',
            message: `Failed to register image "${file.name}". ${regError.message}`,
            messageBn:
              'আপনার অভিযোগ সংরক্ষিত হয়েছে, তবে ছবির নিবন্ধন সম্পন্ন হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
          };
          throw apiError;
        }
      }
    }

    return {
      success: true,
      reportId,
      message: data.message || 'Report submitted successfully.',
      report: data.report,
    };
  }
}

export const apiClient = new ApiClient();
