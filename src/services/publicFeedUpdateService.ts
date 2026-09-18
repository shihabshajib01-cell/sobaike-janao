
export interface PublicFeedUpdateState {
  newCount: number;
  newestPublishedAt: string | null;
  checkedAt: string;
}

interface PublicFeedUpdateParams {
  since?: string | null;
  district?: string;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export const PublicFeedUpdateService = {
  async getState(params?: PublicFeedUpdateParams): Promise<PublicFeedUpdateState> {
    const { isSupabaseConfigured, supabase } = await import('../lib/supabase');
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Public feed update service is currently unavailable.');
    }

    const { data, error } = await supabase.rpc('get_public_feed_update_state', {
      p_since: params?.since ?? null,
      p_district: params?.district || 'all',
    });

    if (error) {
      console.warn('[PublicFeedUpdateService] Update-state RPC error:', error);
      throw error;
    }

    const payload =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};

    const parsedCount = Number(payload.newCount ?? 0);
    const newestPublishedAt = readString(payload.newestPublishedAt);
    const checkedAt = readString(payload.checkedAt) || new Date().toISOString();

    return {
      newCount: Number.isFinite(parsedCount) ? Math.max(0, Math.floor(parsedCount)) : 0,
      newestPublishedAt,
      checkedAt,
    };
  },
};
