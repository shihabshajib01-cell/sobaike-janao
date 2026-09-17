import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface PublicEngagementCounts {
  viewCount: number;
  shareCount: number;
}

function normalizeCounts(data: unknown): PublicEngagementCounts | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as { viewCount?: unknown; shareCount?: unknown };
  const viewCount = Number(row.viewCount ?? 0);
  const shareCount = Number(row.shareCount ?? 0);
  return {
    viewCount: Number.isFinite(viewCount) ? viewCount : 0,
    shareCount: Number.isFinite(shareCount) ? shareCount : 0,
  };
}

async function track(
  rpcName: 'track_public_report_view' | 'track_public_report_share',
  reportId: string
): Promise<PublicEngagementCounts | null> {
  const cleanId = reportId.trim().toUpperCase();
  if (!cleanId || !isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase.rpc(rpcName, { p_report_id: cleanId });
    if (error) {
      console.warn(`[PublicEngagementService] ${rpcName} failed:`, error);
      return null;
    }
    return normalizeCounts(data);
  } catch (error) {
    console.warn(`[PublicEngagementService] ${rpcName} failed:`, error);
    return null;
  }
}

export const PublicEngagementService = {
  trackView(reportId: string) {
    return track('track_public_report_view', reportId);
  },
  trackShare(reportId: string) {
    return track('track_public_report_share', reportId);
  },
};
