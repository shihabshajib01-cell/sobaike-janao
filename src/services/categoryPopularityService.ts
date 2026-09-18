import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { TaxonomyService } from './taxonomyService';

export interface CategoryPopularityMetric {
  segmentId: string;
  publishedPostCount: number;
  viewCount: number;
  shareCount: number;
  popularityScore: number;
  popularityRank: number;
}

interface CategoryPopularityRow {
  segment_id: string;
  published_post_count: number | string | null;
  view_count: number | string | null;
  share_count: number | string | null;
  popularity_score: number | string | null;
  popularity_rank: number | string | null;
}

let rankingCache: CategoryPopularityMetric[] | null = null;
let rankingRequest: Promise<CategoryPopularityMetric[]> | null = null;

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const normalizeRows = (rows: unknown): CategoryPopularityMetric[] => {
  if (!Array.isArray(rows)) return [];

  return (rows as CategoryPopularityRow[])
    .filter((row) => Boolean(row.segment_id))
    .map((row) => ({
      segmentId: row.segment_id,
      publishedPostCount: toNumber(row.published_post_count),
      viewCount: toNumber(row.view_count),
      shareCount: toNumber(row.share_count),
      popularityScore: toNumber(row.popularity_score),
      popularityRank: toNumber(row.popularity_rank),
    }))
    .sort((a, b) => a.popularityRank - b.popularityRank);
};

const currentTaxonomyOrder = (): string[] =>
  Object.values(TaxonomyService.getSegments())
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((segment) => segment.id);

const withFallbackOrder = (metrics: CategoryPopularityMetric[]): string[] => {
  const ranked = metrics.map((item) => item.segmentId);
  const rankedSet = new Set(ranked);
  return [
    ...ranked,
    ...currentTaxonomyOrder().filter((key) => !rankedSet.has(key)),
  ];
};

export const CategoryPopularityService = {
  async getRanking(): Promise<CategoryPopularityMetric[]> {
    if (rankingCache) return rankingCache;
    if (rankingRequest) return rankingRequest;
    if (!isSupabaseConfigured() || !supabase) return [];

    rankingRequest = (async () => {
      try {
        const { data, error } = await supabase!.rpc('get_public_category_popularity');
        if (error) throw error;
        rankingCache = normalizeRows(data);
        return rankingCache;
      } catch (error) {
        console.warn('[CategoryPopularityService.getRanking] Failed:', error);
        return [];
      } finally {
        rankingRequest = null;
      }
    })();

    return rankingRequest;
  },

  async getOrderedCategoryKeys(): Promise<string[]> {
    const metrics = await this.getRanking();
    return withFallbackOrder(metrics);
  },

  getFallbackOrder(): string[] {
    return currentTaxonomyOrder();
  },

  clearCache() {
    rankingCache = null;
    rankingRequest = null;
  },
};
