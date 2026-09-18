import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SectionKey, SECTIONS } from '../theme/tokens';
import { SubcategoryOption, SEGMENT_SUBCATEGORIES } from '../data/reportOptions';
import { useState, useEffect } from 'react';

export interface SupabaseSegmentRow {
  id: string;
  name_bn: string;
  name_en: string;
  active?: boolean;
  sort_order?: number;
  slug?: string;
  short_name_bn?: string;
  short_name_en?: string;
  description_bn?: string;
  description_en?: string;
  icon_key?: string;
  theme_key?: string;
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
  iconKey?: string;
  themeKey?: string;
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

const sectionKeys = Object.keys(SECTIONS) as SectionKey[];

const THEME_SECTION_FALLBACKS: Record<string, SectionKey> = {
  sky: 'road_transport',
  indigo: 'public_safety',
  emerald: 'rickshaw',
  amber: 'illegal_occupation',
  rose: 'harassment',
  violet: 'extortion',
  slate: 'load_shedding',
};

// In-memory cache initialized from the unified local section registry. This keeps
// local fallbacks and backend taxonomy aligned without duplicating a hard-coded list.
let cachedSegments: Record<string, SegmentTaxonomyItem> = Object.fromEntries(
  sectionKeys.map((key) => [key, { ...SECTIONS[key], id: key }])
) as Record<string, SegmentTaxonomyItem>;

let cachedSubcategories: Record<string, SubcategoryOption[]> = Object.fromEntries(
  sectionKeys.map((key) => [key, [...(SEGMENT_SUBCATEGORIES[key] || [])]])
);

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

      if (data && Array.isArray(data)) {
        const nextSegments: Record<string, SegmentTaxonomyItem> = {};

        data.forEach((row: SupabaseSegmentRow) => {
          const key = row.id as SectionKey;
          const themeFallbackKey =
            THEME_SECTION_FALLBACKS[row.theme_key || ''] || 'road_transport';
          const fallback = SECTIONS[key] || SECTIONS[themeFallbackKey];

          nextSegments[row.id] = {
            ...fallback,
            key,
            id: row.id,
            iconKey: row.icon_key || 'shield',
            themeKey: row.theme_key || 'sky',
            slug: row.slug ? `/category/${row.slug}` : fallback.slug,
            nameBn: row.name_bn || fallback.nameBn,
            nameEn: row.name_en || fallback.nameEn,
            shortNameBn: row.short_name_bn || row.name_bn || fallback.shortNameBn,
            shortNameEn: row.short_name_en || row.name_en || fallback.shortNameEn,
            descriptionBn: row.description_bn || fallback.descriptionBn,
            descriptionEn: row.description_en || fallback.descriptionEn,
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

      if (data && Array.isArray(data)) {
        const nextSubcategories: Record<string, SubcategoryOption[]> = {};

        // Successful backend reads stay authoritative for every known active section.
        sectionKeys.forEach((sec) => {
          nextSubcategories[sec] = [];
        });

        data.forEach((row: SupabaseSubcategoryRow) => {
          const segKey = row.segment_id;
          if (!nextSubcategories[segKey]) {
            nextSubcategories[segKey] = [];
          }

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

        cachedSubcategories = nextSubcategories;
      }
    } catch (err) {
      console.warn('[TaxonomyService] Failed to query subcategories:', err);
    }

    return cachedSubcategories;
  },

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

  getSegments(): Record<string, SegmentTaxonomyItem> {
    return cachedSegments;
  },

  getSegment(key: SectionKey): SegmentTaxonomyItem {
    return (
      cachedSegments[key] ||
      ({ ...SECTIONS[key], id: key } as SegmentTaxonomyItem)
    );
  },

  getSubcategories(segment: SectionKey): SubcategoryOption[] {
    return cachedSubcategories[segment] || SEGMENT_SUBCATEGORIES[segment] || [];
  },

  getFeedSubcategories(segment: SectionKey): SubcategoryOption[] {
    const list = this.getSubcategories(segment);
    const allOption: SubcategoryOption = {
      id: 'all',
      nameBn: 'সকল রিপোর্ট',
      nameEn: 'All Reports',
    };
    return [allOption, ...list];
  },

  getAllSubcategories(): Record<string, SubcategoryOption[]> {
    return cachedSubcategories;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

if (typeof window !== 'undefined' && !isFetched) {
  TaxonomyService.fetchTaxonomy().catch(() => {});
}

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
