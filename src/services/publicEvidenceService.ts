import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PublicReportImage } from '../types/report';

export interface PublishedEvidenceRPCResult {
  report_id: string;
  evidence_id: string;
  storage_path: string;
  mime_type?: string;
  media_type?: string;
  caption?: string | null;
  created_at?: string;
}

// In-memory cache for temporary private storage signed URLs (TTL 240s vs 300s server TTL)
const signedUrlCache = new Map<string, { signedUrl: string; expiresAt: number }>();
const CACHE_TTL_MS = 240 * 1000;
const SIGNED_URL_EXPIRY_SECONDS = 300;

export const PublicEvidenceService = {
  /**
   * Fetch published evidence metadata for one or more published reports and generate temporary signed URLs.
   * Only returns evidence for complaints that are currently in 'published' state.
   */
  async getPublishedEvidenceForReports(
    reportIds: string[]
  ): Promise<Record<string, PublicReportImage[]>> {
    const result: Record<string, PublicReportImage[]> = {};

    if (!reportIds || reportIds.length === 0) {
      return result;
    }

    if (!isSupabaseConfigured() || !supabase) {
      return result;
    }

    // Clean and deduplicate IDs
    const cleanIds = Array.from(
      new Set(reportIds.map((id) => (id || '').trim().toUpperCase()).filter(Boolean))
    );

    if (cleanIds.length === 0) {
      return result;
    }

    try {
      // 1. Fetch published evidence metadata via sanitized RPC
      const { data, error } = await supabase.rpc('get_public_published_report_evidence', {
        p_report_ids: cleanIds,
      });

      if (error) {
        console.warn('[PublicEvidenceService] RPC error fetching published evidence:', error);
        return result;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        return result;
      }

      const rows = data as PublishedEvidenceRPCResult[];

      // Filter valid image records
      const validRows = rows.filter((row) => {
        if (!row.report_id || !row.evidence_id || !row.storage_path) return false;
        if (row.media_type && row.media_type !== 'image') return false;
        return true;
      });

      if (validRows.length === 0) {
        return result;
      }

      // 2. Resolve signed URLs using memory cache where valid
      const now = Date.now();
      const pathsToSign: string[] = [];
      const signedUrlMap: Record<string, string> = {};

      for (const row of validRows) {
        const cached = signedUrlCache.get(row.storage_path);
        if (cached && cached.expiresAt > now) {
          signedUrlMap[row.storage_path] = cached.signedUrl;
        } else if (!pathsToSign.includes(row.storage_path)) {
          pathsToSign.push(row.storage_path);
        }
      }

      // 3. Batch generate signed URLs for uncached paths
      if (pathsToSign.length > 0) {
        try {
          const { data: signData, error: signError } = await supabase.storage
            .from('complaint-evidence')
            .createSignedUrls(pathsToSign, SIGNED_URL_EXPIRY_SECONDS);

          if (signError) {
            console.warn('[PublicEvidenceService] Storage signed URL batch error:', signError);
          } else if (signData && Array.isArray(signData)) {
            for (const item of signData) {
              if (item && item.path && item.signedUrl && !item.error) {
                signedUrlMap[item.path] = item.signedUrl;
                signedUrlCache.set(item.path, {
                  signedUrl: item.signedUrl,
                  expiresAt: now + CACHE_TTL_MS,
                });
              }
            }
          }
        } catch (storageErr) {
          console.warn('[PublicEvidenceService] Exception generating signed URLs:', storageErr);
        }
      }

      // 4. Group by report_id preserving created_at order
      // First sort validRows by created_at ASC
      const sortedRows = [...validRows].sort((a, b) => {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tA - tB;
      });

      for (const row of sortedRows) {
        const url = signedUrlMap[row.storage_path];
        if (!url) {
          // Skip items without valid signed URLs
          continue;
        }

        const repId = row.report_id.toUpperCase();
        if (!result[repId]) {
          result[repId] = [];
        }

        const mime: 'image/jpeg' | 'image/png' | 'image/webp' =
          row.mime_type === 'image/jpeg' || row.mime_type === 'image/png' || row.mime_type === 'image/webp'
            ? row.mime_type
            : 'image/webp';

        result[repId].push({
          id: row.evidence_id,
          url,
          mimeType: mime,
          sortOrder: result[repId].length,
        });
      }

      return result;
    } catch (err) {
      console.warn('[PublicEvidenceService] Unexpected error in getPublishedEvidenceForReports:', err);
      return result;
    }
  },
};
