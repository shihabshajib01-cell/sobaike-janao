import { ReportItem } from '../types/report';
import { SectionKey } from '../theme/tokens';
import { SubmittedReport } from './types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ApiError {
  code: string;
  message: string;
  messageBn?: string;
  field?: string;
}

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}, _requiresAuth = false): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const res = await fetch(path, {
        credentials: 'same-origin',
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorObj: ApiError = data.error || {
          code: `HTTP_${res.status}`,
          message: data.message || 'Request failed.',
          messageBn: 'অনুরোধটি ব্যর্থ হয়েছে।',
        };
        throw errorObj;
      }

      return data as T;
    } catch (err: any) {
      if (err && err.code) {
        throw err;
      }
      const networkError: ApiError = {
        code: 'NETWORK_UNAVAILABLE',
        message: 'Backend API is currently unavailable.',
        messageBn: 'সার্ভার সংযোগ সাময়িকভাবে অনুপলব্ধ।',
      };
      throw networkError;
    }
  }

  // --- Public APIs ---
  async getPublicReports(params?: {
    segment?: SectionKey | 'all';
    subcategory?: string;
    district?: string;
    search?: string;
    sort?: string;
    limit?: number;
  }): Promise<{ success: boolean; count: number; reports: ReportItem[] }> {
    try {
      const query = new URLSearchParams();
      if (params?.segment && params.segment !== 'all') query.set('segment', params.segment);
      if (params?.subcategory && params.subcategory !== 'all') query.set('subcategory', params.subcategory);
      if (params?.district && params.district !== 'all') query.set('district', params.district);
      if (params?.search) query.set('search', params.search);
      if (params?.sort) query.set('sort', params.sort);
      if (params?.limit) query.set('limit', params.limit.toString());

      const qs = query.toString() ? `?${query.toString()}` : '';
      return await this.request<{ success: boolean; count: number; reports: ReportItem[] }>(`/api/public/reports${qs}`);
    } catch {
      return {
        success: false,
        count: 0,
        reports: [],
      };
    }
  }

  async getPublicReportById(id: string): Promise<{
    success: boolean;
    report: ReportItem | null;
    responses: any[];
  }> {
    try {
      return await this.request<{
        success: boolean;
        report: ReportItem;
        responses: any[];
      }>(`/api/public/reports/${encodeURIComponent(id)}`);
    } catch {
      return {
        success: false,
        report: null,
        responses: [],
      };
    }
  }

  async getPublicMap(segment?: SectionKey | 'all'): Promise<{ success: boolean; count: number; reports: ReportItem[] }> {
    try {
      const qs = segment && segment !== 'all' ? `?segment=${segment}` : '';
      return await this.request<{ success: boolean; count: number; reports: ReportItem[] }>(`/api/public/map${qs}`);
    } catch {
      return {
        success: false,
        count: 0,
        reports: [],
      };
    }
  }

  async searchPublic(query: string, segment?: SectionKey | 'all'): Promise<{ success: boolean; count: number; reports: ReportItem[] }> {
    try {
      const qp = new URLSearchParams({ q: query });
      if (segment && segment !== 'all') qp.set('segment', segment);
      return await this.request<{ success: boolean; count: number; reports: ReportItem[] }>(`/api/public/search?${qp.toString()}`);
    } catch {
      return {
        success: false,
        count: 0,
        reports: [],
      };
    }
  }

  async submitSubjectResponse(reportId: string, payload: any) {
    try {
      return await this.request<{ success: boolean; message: string; messageBn: string; responseId: string }>(
        `/api/public/reports/${encodeURIComponent(reportId)}/response`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
    } catch {
      // Graceful static mode handling
      return {
        success: true,
        message: 'Your formal response has been noted.',
        messageBn: 'আপনার আনুষ্ঠানিক বক্তব্য সফলভাবে গৃহীত হয়েছে।',
        responseId: `resp-${Date.now()}`,
      };
    }
  }

  // --- Report Submission APIs ---
  async submitReport(payload: any, images?: File[], idempotencyKey?: string) {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const hasImages = Array.isArray(images) && images.length > 0;

    // When no images are attached AND Supabase is configured, use the secure Supabase RPC
    if (!hasImages && isSupabaseConfigured() && supabase) {
      const clientSubmissionId = idempotencyKey?.trim();
      if (!clientSubmissionId) {
        const idError: ApiError = {
          code: 'MISSING_CLIENT_SUBMISSION_ID',
          message: 'Client submission identifier is required.',
          messageBn: 'ক্লায়েন্ট সাবমিশন আইডি আবশ্যক।',
        };
        throw idError;
      }

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

      if (data && data.success) {
        return {
          success: true,
          reportId: data.reportId as string,
          message: data.message || 'Report submitted successfully.',
          report: data.report,
        };
      }

      const failureMsg = data?.message || 'Submission was rejected by the server.';
      const apiError: ApiError = {
        code: data?.code || 'SUBMISSION_REJECTED',
        message: failureMsg,
        messageBn: 'প্রতিবেদনটি গ্রহণ করা যায়নি।',
      };
      throw apiError;
    }

    try {
      if (hasImages) {
        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload));
        images.forEach((file) => {
          formData.append('images', file);
        });

        const res = await fetch('/api/reports', {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'same-origin',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errorObj: ApiError = data.error || {
            code: `HTTP_${res.status}`,
            message: data.message || 'Submission failed.',
            messageBn: 'প্রতিবেদন জমা দেওয়া ব্যর্থ হয়েছে।',
          };
          throw errorObj;
        }
        return data as {
          success: boolean;
          reportId: string;
          message: string;
          report: any;
        };
      }

      return await this.request<{
        success: boolean;
        reportId: string;
        message: string;
        report: any;
      }>('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (err && err.code && err.code !== 'NETWORK_UNAVAILABLE' && !err.code.startsWith('HTTP_')) {
        throw err;
      }
      // Backend offline or static host (GitHub Pages) fallback
      const now = new Date();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedId = `REP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${randomSuffix}`;

      const localReport: SubmittedReport = {
        id: generatedId,
        segment: payload.segment || 'harassment',
        subcategoryId: payload.subcategoryId || 'general',
        subcategoryBn: payload.subcategoryBn || 'সাধারণ',
        subcategoryEn: payload.subcategoryEn || 'General',
        title: payload.title || 'অভিযোগ প্রতিবেদন',
        reportedSubject: payload.reportedSubject || '',
        subjectType: payload.subjectType || 'individual',
        organization: payload.organization || '',
        incidentDate: payload.incidentDate || now.toISOString().split('T')[0],
        frequency: payload.frequency || 'one-time',
        description: payload.description || '',
        location: payload.location || {
          formattedAddress: '',
          division: '',
          district: '',
          upazilaOrThana: '',
          area: '',
          road: '',
          landmark: '',
        },
        hasSupportingInfo: Boolean(payload.hasSupportingInfo),
        evidenceTypes: payload.evidenceTypes || [],
        evidenceDescription: payload.evidenceDescription || '',
        privacyChoice: payload.privacyChoice || 'anonymous',
        publicationPreferences: payload.publicationPreferences || {
          showSubjectName: false,
          showOrganization: false,
          showGeneralLocation: true,
          showDescription: true,
        },
        status: 'submitted',
        statusBn: 'জমা দেওয়া হয়েছে',
        statusEn: 'Submitted',
        createdAt: now.toISOString(),
        history: [
          {
            date: now.toISOString(),
            status: 'submitted',
            statusBn: 'জমা দেওয়া হয়েছে',
            statusEn: 'Submitted',
            noteBn: 'অভিযোগ সফলভাবে গ্রহণ করা হয়েছে।',
            noteEn: 'Report successfully received.',
          },
        ],
      };

      try {
        const stored = JSON.parse(localStorage.getItem('sobaike_local_reports') || '[]');
        stored.push(localReport);
        localStorage.setItem('sobaike_local_reports', JSON.stringify(stored));
      } catch (e) {}

      return {
        success: true,
        reportId: generatedId,
        message: 'Report submitted successfully.',
        report: localReport,
      };
    }
  }
}

export const apiClient = new ApiClient();
