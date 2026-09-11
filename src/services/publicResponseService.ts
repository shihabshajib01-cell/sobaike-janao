import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PublicPublishedResponse, PublicResponseType, PublicSubjectResponderType } from '../types/report';

/**
 * Feature gate: Controls whether the frontend connects to the public published response RPC.
 * Production connection enabled following verified backend deployment.
 */
export const PUBLIC_RESPONSE_DISPLAY_CONNECTED = true;

export const PublicResponseService = {
  /**
   * Fetch published responses for a published report.
   * Calls the security-definer public read RPC `get_public_published_responses`.
   * When `PUBLIC_RESPONSE_DISPLAY_CONNECTED` is false, safely returns an empty array
   * without initiating network requests.
   */
  async getPublishedForReport(reportId: string): Promise<PublicPublishedResponse[]> {
    // A. Feature gate check: safely returns empty array while disconnected
    if (!PUBLIC_RESPONSE_DISPLAY_CONNECTED) {
      return [];
    }

    // B. Clean and validate report ID
    const cleanId = (reportId || '').toUpperCase().trim();
    if (!cleanId) {
      return [];
    }

    // C. Supabase configuration check
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    // D. Call authoritative public read RPC
    const { data, error } = await supabase.rpc('get_public_published_responses', {
      p_report_id: cleanId,
    });

    // E. On RPC error, throw real error
    if (error) {
      throw new Error(error.message || 'Failed to fetch published responses from server.');
    }

    // F. Validate data contract
    if (data === null) {
      return [];
    }

    if (!Array.isArray(data)) {
      throw new Error('Invalid response contract: expected array of responses.');
    }

    // G. Map to typed PublicPublishedResponse
    return data.map((item: any): PublicPublishedResponse => {
      const responseType: PublicResponseType =
        item.responseType === 'subject_response' ? 'subject_response' : 'citizen_information';

      const responderType: PublicSubjectResponderType | null =
        responseType === 'subject_response' &&
        ['mentioned_person', 'organization_rep', 'legal_rep'].includes(item.responderType)
          ? (item.responderType as PublicSubjectResponderType)
          : null;

      return {
        id: String(item.id || ''),
        responseType,
        content: String(item.content || ''),
        incidentDate: item.incidentDate ? String(item.incidentDate) : null,
        publishedAt: item.publishedAt ? String(item.publishedAt) : null,
        responderType,
        responderName: responseType === 'subject_response' && item.responderName ? String(item.responderName) : null,
        designation: responseType === 'subject_response' && item.designation ? String(item.designation) : null,
        organizationName: responseType === 'subject_response' && item.organizationName ? String(item.organizationName) : null,
      };
    });
  },
};
