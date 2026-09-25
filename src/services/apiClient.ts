import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ReporterSubmissionContext, isValidReporterCoordinates } from './types';
import { VisitorSessionService } from './visitorSessionService';

export interface ApiError {
  code: string;
  message: string;
  messageBn?: string;
  field?: string;
}

const invokePublicWriteGateway = async (body: Record<string, unknown>) => {
  if (!supabase) {
    return {
      data: null,
      error: { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase client is not configured.' },
    };
  }

  const result = await supabase.functions.invoke('public-write-gateway', { body });
  if (result.error) {
    return {
      data: null,
      error: { code: 'PUBLIC_WRITE_GATEWAY_ERROR', message: result.error.message || 'Public write gateway failed.' },
    };
  }

  if (!result.data?.success) {
    return {
      data: null,
      error: {
        code: result.data?.code || 'PUBLIC_WRITE_REJECTED',
        message: result.data?.error || 'Public write request was rejected.',
      },
    };
  }

  return { data: result.data.result, error: null };
};

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
      const error: ApiError = {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Supabase client is not configured.',
        messageBn: 'ডাটাবেজ সংযোগ কনফিগার করা নেই।',
      };
      throw error;
    }

    const { data, error } = await invokePublicWriteGateway({
      action: 'response',
      reportId,
      responseType: 'citizen_information',
      payload: {
        description: payload.description,
        incidentDate: payload.incidentDate,
        contactConsent: payload.contactConsent,
        contactInfo: payload.contactConsent ? payload.contactInfo : undefined,
      },
      visitorId: VisitorSessionService.getVisitorId(),
      sessionId: VisitorSessionService.getSessionId(),
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
      const error: ApiError = {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Supabase client is not configured.',
        messageBn: 'ডাটাবেজ সংযোগ কনফিগার করা নেই।',
      };
      throw error;
    }

    let { data, error } = await invokePublicWriteGateway({
      action: 'response',
      reportId,
      responseType: 'subject_response',
      payload,
      visitorId: VisitorSessionService.getVisitorId(),
      sessionId: VisitorSessionService.getSessionId(),
    });

    // Backward compatibility: if the database has not applied allow_subject_response_without_responder_type.sql yet,
    // and returns INVALID_RESPONDER_TYPE when responderType is omitted, retry once with legacy default 'mentioned_person'
    if (error && error.message?.includes('INVALID_RESPONDER_TYPE') && !payload.responderType) {
      const fallbackPayload = { ...payload, responderType: 'mentioned_person' as const };
      const retryResult = await invokePublicWriteGateway({
        action: 'response',
        reportId,
        responseType: 'subject_response',
        payload: fallbackPayload,
        visitorId: VisitorSessionService.getVisitorId(),
        sessionId: VisitorSessionService.getSessionId(),
      });
      if (!retryResult.error) {
        data = retryResult.data;
        error = null;
      }
    }

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
      const unavailableError: ApiError = {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Submission service is currently unavailable. Please keep this report open and try again later.',
        messageBn: 'অভিযোগ জমা দেওয়ার সেবা এই মুহূর্তে সাময়িকভাবে অনুপলব্ধ। এই প্রতিবেদনটি খোলা রেখে কিছুক্ষণ পর আবার চেষ্টা করুন।',
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

    // Step 1: Submit complaint through the classification-aware wrapper.
    // The existing authoritative submission function remains intact underneath this wrapper.
    const enrichedPayload = {
      ...payload,
      reporterContext,
    };

    const submissionRpc =
      payload?.formEngineMode === 'schema'
        ? 'submit_public_configured_complaint'
        : payload?.segment === 'harassment' && payload?.subcategoryId === 'sexual-harassment'
        ? 'submit_public_complaint_v3'
        : 'submit_public_complaint_v2';

    const { data, error } = await invokePublicWriteGateway({
      action: 'complaint',
      submissionRpc,
      payload: enrichedPayload,
      clientSubmissionId,
      reporterContext,
    });

    if (error) {
      const isOutdatedSchema =
        error.code === 'PGRST202' ||
        error.message?.includes('function') ||
        error.message?.includes('schema cache');
      const apiError: ApiError = {
        code: isOutdatedSchema ? 'OUTDATED_SERVER_SCHEMA' : (error.code || 'RPC_ERROR'),
        message: isOutdatedSchema
          ? 'Submission service is undergoing updates. Please keep this report open and try again in a few moments.'
          : (error.message || 'Supabase submission failed.'),
        messageBn: isOutdatedSchema
          ? 'সার্ভার হালনাগাদ হচ্ছে। এই প্রতিবেদনটি খোলা রেখে অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
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

    // Evidence is never written directly from the browser. The Edge upload
    // boundary validates the WebP container, strips metadata/unknown chunks,
    // replaces the device filename, uploads privately, and registers evidence.
    if (hasImages && images) {
      for (const file of images) {
        const form = new FormData();
        form.append('clientSubmissionId', clientSubmissionId);
        form.append('file', file, 'evidence.webp');

        const { data: evidenceData, error: evidenceError } = await supabase.functions.invoke(
          'public-evidence-upload',
          { body: form }
        );

        if (evidenceError || evidenceData?.success !== true) {
          const apiError: ApiError = {
            code:
              evidenceData?.code ||
              (evidenceError ? 'EVIDENCE_UPLOAD_FAILED' : 'EVIDENCE_REGISTRATION_FAILED'),
            message:
              evidenceData?.error ||
              evidenceError?.message ||
              'Evidence could not be sanitized and registered.',
            messageBn:
              'আপনার অভিযোগ সংরক্ষিত হয়েছে, তবে ছবিটি নিরাপদভাবে প্রস্তুত ও সংরক্ষণ করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
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