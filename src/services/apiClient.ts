import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ReporterSubmissionContext, isValidReporterCoordinates } from './types';


export interface ApiError {
  code: string;
  message: string;
  messageBn?: string;
  field?: string;
}

class ApiClient {
  async submitSubjectResponse(_reportId: string, _payload: any): Promise<{ success: boolean; message: string; messageBn: string; responseId: string }> {
    const error: ApiError = {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Subject response submission is temporarily unavailable. Please contact the administration directly.',
      messageBn: 'প্রতিউত্তর জমা দেওয়ার সেবা বর্তমানে সাময়িকভাবে অনুপলব্ধ। অনুগ্রহ করে সরাসরি কর্তৃপক্ষের সাথে যোগাযোগ করুন।',
    };
    throw error;
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
      const isMockAllowed = Boolean(
        import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_MODE === 'true'
      );
      if (isMockAllowed) {
        console.warn('[ApiClient] Supabase not configured — operating in explicit local dev mock mode');
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const mockReportId = `SJ-${new Date().getFullYear()}-${randomNum}`;
        return {
          success: true,
          reportId: mockReportId,
          message: 'Report submitted successfully (local mock dev mode).',
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
