import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ApiError {
  code: string;
  message: string;
  messageBn?: string;
  field?: string;
}

class ApiClient {
  async submitSubjectResponse(_reportId: string, _payload: any): Promise<{ success: boolean; message: string; messageBn: string; responseId: string }> {
    const apiError: ApiError = {
      code: 'FEATURE_NOT_CONNECTED',
      message: 'Response submission is temporarily unavailable.',
      messageBn: 'প্রতিউত্তর জমা দেওয়ার সেবা বর্তমানে উপলভ্য নয়।',
    };
    throw apiError;
  }

  // --- Report Submission APIs ---
  async submitReport(payload: any, images?: File[], idempotencyKey?: string) {
    if (!isSupabaseConfigured() || !supabase) {
      const apiError: ApiError = {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Report submission is currently unavailable.',
        messageBn: 'প্রতিবেদন জমা দেওয়ার সেবা বর্তমানে উপলভ্য নয়।',
      };
      throw apiError;
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

    // Step 1: Submit complaint via RPC
    const { data, error } = await supabase.rpc('submit_public_complaint', {
      p_payload: payload,
      p_client_submission_id: clientSubmissionId,
    });

    if (error) {
      const errorMsg = error.message || 'Supabase submission failed.';
      const apiError: ApiError = {
        code: error.code || 'RPC_ERROR',
        message: errorMsg,
        messageBn: 'প্রতিবেদন জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
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
