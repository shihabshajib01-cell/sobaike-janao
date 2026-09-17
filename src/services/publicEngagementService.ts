import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface PublicEngagementCounts {
  viewCount: number;
  shareCount: number;
}

interface PublicEngagementRow extends PublicEngagementCounts {
  id: string;
}

const EMPTY_COUNTS: PublicEngagementCounts = { viewCount: 0, shareCount: 0 };
const CACHE_TTL_MS = 15_000;

let cachedCounts = new Map<string, PublicEngagementCounts>();
let cacheExpiresAt = 0;
let countsRequest: Promise<Map<string, PublicEngagementCounts>> | null = null;

const normalizeCounts = (value: unknown): PublicEngagementCounts => {
  const row = (value || {}) as Partial<PublicEngagementCounts>;
  return {
    viewCount: Math.max(0, Number(row.viewCount) || 0),
    shareCount: Math.max(0, Number(row.shareCount) || 0),
  };
};

const updateCache = (reportId: string, counts: PublicEngagementCounts) => {
  cachedCounts.set(reportId.trim().toUpperCase(), counts);
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
};

async function loadAllCounts(): Promise<Map<string, PublicEngagementCounts>> {
  if (!isSupabaseConfigured() || !supabase) return new Map();

  if (Date.now() < cacheExpiresAt && cachedCounts.size > 0) {
    return cachedCounts;
  }

  if (countsRequest) return countsRequest;

  countsRequest = (async () => {
    const { data, error } = await supabase!.rpc('get_public_report_engagement_counts');
    if (error) {
      console.warn('[PublicEngagementService] Failed to load engagement counts:', error);
      return cachedCounts;
    }

    const next = new Map<string, PublicEngagementCounts>();
    if (Array.isArray(data)) {
      (data as PublicEngagementRow[]).forEach((row) => {
        if (!row?.id) return;
        next.set(row.id.trim().toUpperCase(), normalizeCounts(row));
      });
    }

    cachedCounts = next;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return cachedCounts;
  })().finally(() => {
    countsRequest = null;
  });

  return countsRequest;
}

export const PublicEngagementService = {
  async getCounts(reportId: string): Promise<PublicEngagementCounts> {
    const cleanId = reportId.trim().toUpperCase();
    if (!cleanId) return EMPTY_COUNTS;
    const allCounts = await loadAllCounts();
    return allCounts.get(cleanId) || EMPTY_COUNTS;
  },

  async trackView(reportId: string): Promise<PublicEngagementCounts | null> {
    const cleanId = reportId.trim().toUpperCase();
    if (!cleanId || !isSupabaseConfigured() || !supabase) return null;

    const { data, error } = await supabase.rpc('track_public_report_view', {
      p_report_id: cleanId,
    });
    if (error) {
      console.warn('[PublicEngagementService] Failed to track report view:', error);
      return null;
    }
    if (!data) return null;

    const counts = normalizeCounts(data);
    updateCache(cleanId, counts);
    return counts;
  },

  async trackShare(reportId: string): Promise<PublicEngagementCounts | null> {
    const cleanId = reportId.trim().toUpperCase();
    if (!cleanId || !isSupabaseConfigured() || !supabase) return null;

    const { data, error } = await supabase.rpc('track_public_report_share', {
      p_report_id: cleanId,
    });
    if (error) {
      console.warn('[PublicEngagementService] Failed to track report share:', error);
      return null;
    }
    if (!data) return null;

    const counts = normalizeCounts(data);
    updateCache(cleanId, counts);
    return counts;
  },
};
