import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SectionKey, SECTIONS } from '../theme/tokens';
import { SubcategoryOption, SEGMENT_SUBCATEGORIES } from '../data/reportOptions';
import { SUBCATEGORIES } from '../data/categories';
import { useState, useEffect } from 'react';

export interface SupabaseSegmentRow {
  id: string;
  name_bn: string;
  name_en: string;
  active?: boolean;
  sort_order?: number;
  [key: string]: any;
}

export interface SupabaseSubcategoryRow {
  id: string;
  segment_id: string;
  name_bn: string;
  name_en: string;
  description_bn?: string;
  description_en?: string;
  category_group?: 'violence' | 'relationship_scam' | 'digital_intimate' | 'general';
  is_sensitive?: boolean;
  active?: boolean;
  sort_order?: number;
  [key: string]: any;
}

export interface SegmentTaxonomyItem {
  key: SectionKey;
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  shortNameBn: string;
  shortNameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  primaryColor: string;
  hoverColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  colors: typeof SECTIONS.harassment.colors;
  sortOrder?: number;
}

// In-memory cache initialized with robust local fallbacks
let cachedSegments: Record<string, SegmentTaxonomyItem> = {
  harassment: { ...SECTIONS.harassment, id: 'harassment' },
  rickshaw: { ...SECTIONS.rickshaw, id: 'rickshaw' },
  extortion: { ...SECTIONS.extortion, id: 'extortion' },
};

let cachedSubcategories: Record<string, SubcategoryOption[]> = {
  harassment: [...SEGMENT_SUBCATEGORIES.harassment],
  rickshaw: [...SEGMENT_SUBCATEGORIES.rickshaw],
  extortion: [...SEGMENT_SUBCATEGORIES.extortion],
};

let isFetched = false;
let isFetching = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('[TaxonomyService] Listener error:', e);
    }
  });
}

export const TaxonomyService = {
  /**
   * Fetch active segments from Supabase with automatic fallback to local SECTIONS.
   */
  async fetchSegments(): Promise<Record<string, SegmentTaxonomyItem>> {
    if (!isSupabaseConfigured() || !supabase) {
      return cachedSegments;
    }

    try {
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('[TaxonomyService] Error fetching segments from Supabase:', error.message);
        return cachedSegments;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const nextSegments: Record<string, SegmentTaxonomyItem> = { ...cachedSegments };

        data.forEach((row: SupabaseSegmentRow) => {
          const key = row.id as SectionKey;
          const fallback = SECTIONS[key] || {
            key: row.id as SectionKey,
            slug: `/${row.id}`,
            nameBn: row.name_bn || row.id,
            nameEn: row.name_en || row.id,
            shortNameBn: row.name_bn || row.id,
            shortNameEn: row.name_en || row.id,
            descriptionBn: '',
            descriptionEn: '',
            primaryColor: '#3A7CA5',
            hoverColor: '#1B4D6B',
            bgColor: '#F0F3F9',
            borderColor: '#CCD5E8',
            textColor: '#1B4D6B',
            colors: {
              primary: '#3A7CA5',
              hover: '#1B4D6B',
              lightBg: '#F0F3F9',
              bgLight: '#F0F3F9',
              border: '#CCD5E8',
              text: '#1B4D6B',
              textSafe: '#1B4D6B',
              filledText: '#FFFFFF',
            },
          };

          nextSegments[row.id] = {
            ...fallback,
            id: row.id,
            nameBn: row.name_bn || fallback.nameBn,
            nameEn: row.name_en || fallback.nameEn,
            sortOrder: typeof row.sort_order === 'number' ? row.sort_order : undefined,
          };
        });

        cachedSegments = nextSegments;
      }
    } catch (err) {
      console.warn('[TaxonomyService] Failed to query segments:', err);
    }

    return cachedSegments;
  },

  /**
   * Fetch active subcategories from Supabase with automatic fallback to local SEGMENT_SUBCATEGORIES.
   */
  async fetchSubcategories(): Promise<Record<string, SubcategoryOption[]>> {
    if (!isSupabaseConfigured() || !supabase) {
      return cachedSubcategories;
    }

    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('[TaxonomyService] Error fetching subcategories from Supabase:', error.message);
        return cachedSubcategories;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const nextSubcategories: Record<string, SubcategoryOption[]> = {};

        // Initialize with empty arrays for known keys
        (['harassment', 'rickshaw', 'extortion'] as SectionKey[]).forEach((sec) => {
          nextSubcategories[sec] = [];
        });

        data.forEach((row: SupabaseSubcategoryRow) => {
          const segKey = row.segment_id;
          if (!nextSubcategories[segKey]) {
            nextSubcategories[segKey] = [];
          }

          // Check if local description or metadata exists for enrichment
          const localMatch = (SEGMENT_SUBCATEGORIES[segKey as SectionKey] || []).find(
            (s) => s.id === row.id
          );

          nextSubcategories[segKey].push({
            id: row.id,
            nameBn: row.name_bn || localMatch?.nameBn || row.id,
            nameEn: row.name_en || localMatch?.nameEn || row.id,
            descriptionBn: row.description_bn || localMatch?.descriptionBn,
            descriptionEn: row.description_en || localMatch?.descriptionEn,
            categoryGroup: row.category_group || localMatch?.categoryGroup,
            isSensitive: typeof row.is_sensitive === 'boolean' ? row.is_sensitive : localMatch?.isSensitive,
          });
        });

        // Ensure each known segment has at least fallback items if none returned from query
        (['harassment', 'rickshaw', 'extortion'] as SectionKey[]).forEach((sec) => {
          if (!nextSubcategories[sec] || nextSubcategories[sec].length === 0) {
            nextSubcategories[sec] = [...SEGMENT_SUBCATEGORIES[sec]];
          }
        });

        cachedSubcategories = nextSubcategories;
      }
    } catch (err) {
      console.warn('[TaxonomyService] Failed to query subcategories:', err);
    }

    return cachedSubcategories;
  },

  /**
   * Fetch all taxonomy data (both segments and subcategories) and notify subscribers.
   */
  async fetchTaxonomy(): Promise<{
    segments: Record<string, SegmentTaxonomyItem>;
    subcategories: Record<string, SubcategoryOption[]>;
  }> {
    if (isFetching) {
      return { segments: cachedSegments, subcategories: cachedSubcategories };
    }

    isFetching = true;
    try {
      await Promise.all([this.fetchSegments(), this.fetchSubcategories()]);
      isFetched = true;
      notifyListeners();
    } finally {
      isFetching = false;
    }

    return { segments: cachedSegments, subcategories: cachedSubcategories };
  },

  /**
   * Synchronous accessor for currently cached segments.
   */
  getSegments(): Record<string, SegmentTaxonomyItem> {
    return cachedSegments;
  },

  /**
   * Synchronous accessor for a specific segment.
   */
  getSegment(key: SectionKey): SegmentTaxonomyItem {
    return cachedSegments[key] || { ...SECTIONS[key], id: key };
  },

  /**
   * Synchronous accessor for currently cached subcategories for a given segment.
   */
  getSubcategories(segment: SectionKey): SubcategoryOption[] {
    return cachedSubcategories[segment] || SEGMENT_SUBCATEGORIES[segment] || [];
  },

  /**
   * Subcategories formatted for public feed filters (including the 'all' option).
   */
  getFeedSubcategories(segment: SectionKey): SubcategoryOption[] {
    const list = this.getSubcategories(segment);
    const allOption: SubcategoryOption = {
      id: 'all',
      nameBn: 'সকল রিপোর্ট',
      nameEn: 'All Reports',
    };
    return [allOption, ...list];
  },

  /**
   * Synchronous accessor for all cached subcategories across all segments.
   */
  getAllSubcategories(): Record<string, SubcategoryOption[]> {
    return cachedSubcategories;
  },

  /**
   * Subscribe to taxonomy updates.
   */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// Initiate background fetch on module load
if (typeof window !== 'undefined' && !isFetched) {
  TaxonomyService.fetchTaxonomy().catch(() => {});
}

/**
 * Custom React Hook to consume taxonomy data reactively.
 */
export function useTaxonomy() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = TaxonomyService.subscribe(() => {
      setTick((t) => t + 1);
    });

    if (!isFetched && !isFetching) {
      TaxonomyService.fetchTaxonomy().catch(() => {});
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    segments: TaxonomyService.getSegments(),
    subcategories: TaxonomyService.getAllSubcategories(),
    getSubcategories: (segment: SectionKey) => TaxonomyService.getSubcategories(segment),
    getFeedSubcategories: (segment: SectionKey) => TaxonomyService.getFeedSubcategories(segment),
    getSegment: (key: SectionKey) => TaxonomyService.getSegment(key),
    refreshTaxonomy: () => TaxonomyService.fetchTaxonomy(),
  };
}
