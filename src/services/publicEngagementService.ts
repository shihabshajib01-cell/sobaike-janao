
export interface PublicEngagementCounts {
  viewCount: number;
  shareCount: number;
}

interface PublicEngagementRow extends PublicEngagementCounts {
  id: string;
}

const ZERO_COUNTS: PublicEngagementCounts = { viewCount: 0, shareCount: 0 };
let countsCache: Map<string, PublicEngagementCounts> | null = null;
let countsRequest: Promise<Map<string, PublicEngagementCounts>> | null = null;

const normalizeId = (id: string) => id.trim().toUpperCase();

const toCounts = (value: unknown): PublicEngagementCounts => {
  if (!value || typeof value !== 'object') return ZERO_COUNTS;
  const raw = value as Partial<PublicEngagementCounts>;
  return {
    viewCount: Math.max(0, Number(raw.viewCount) || 0),
    shareCount: Math.max(0, Number(raw.shareCount) || 0),
  };
};

const updateCachedCounts = (reportId: string, counts: PublicEngagementCounts) => {
  if (!countsCache) countsCache = new Map();
  countsCache.set(normalizeId(reportId), counts);
};

export const PublicEngagementService = {
  async getAllCounts(): Promise<Map<string, PublicEngagementCounts>> {
    if (countsCache) return countsCache;
    if (countsRequest) return countsRequest;

    countsRequest = (async () => {
      const { isSupabaseConfigured, supabase } = await import('../lib/supabase');
      if (!isSupabaseConfigured() || !supabase) return new Map();
      try {
        const { data, error } = await supabase!.rpc('get_public_report_engagement_counts');
        if (error) throw error;

        const next = new Map<string, PublicEngagementCounts>();
        if (Array.isArray(data)) {
          for (const raw of data as PublicEngagementRow[]) {
            if (!raw?.id) continue;
            next.set(normalizeId(raw.id), toCounts(raw));
          }
        }
        countsCache = next;
        return next;
      } catch (error) {
        console.warn('[PublicEngagementService.getAllCounts] Failed:', error);
        return new Map();
      } finally {
        countsRequest = null;
      }
    })();

    return countsRequest;
  },

  async getCounts(reportId: string): Promise<PublicEngagementCounts> {
    const all = await this.getAllCounts();
    return all.get(normalizeId(reportId)) || ZERO_COUNTS;
  },

  async trackView(reportId: string): Promise<PublicEngagementCounts | null> {
    const { isSupabaseConfigured, supabase } = await import('../lib/supabase');
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data, error } = await supabase.rpc('track_public_report_view', {
        p_report_id: normalizeId(reportId),
      });
      if (error) throw error;
      if (!data) return null;
      const counts = toCounts(data);
      updateCachedCounts(reportId, counts);
      return counts;
    } catch (error) {
      console.warn('[PublicEngagementService.trackView] Failed:', error);
      return null;
    }
  },

  async trackShare(reportId: string): Promise<PublicEngagementCounts | null> {
    const { isSupabaseConfigured, supabase } = await import('../lib/supabase');
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data, error } = await supabase.rpc('track_public_report_share', {
        p_report_id: normalizeId(reportId),
      });
      if (error) throw error;
      if (!data) return null;
      const counts = toCounts(data);
      updateCachedCounts(reportId, counts);
      return counts;
    } catch (error) {
      console.warn('[PublicEngagementService.trackShare] Failed:', error);
      return null;
    }
  },

  clearCache() {
    countsCache = null;
    countsRequest = null;
  },
};
