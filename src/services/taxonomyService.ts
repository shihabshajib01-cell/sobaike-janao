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
  iconKey?: string;
  themeKey?: string;
  sortOrder?: number;
}

const sectionKeys = Object.keys(SECTIONS) as SectionKey[];

const DYNAMIC_THEME_PALETTES: Record<
  string,
  {
    primary: string;
    hover: string;
    bg: string;
    border: string;
    text: string;
    filledText: string;
  }
> = {
  sky: {
    primary: 'var(--ui-accent)',
    hover: 'var(--ui-action-hover)',
    bg: 'var(--ui-accent-soft)',
    border: 'var(--ui-accent-border)',
    text: 'var(--ui-content-primary)',
    filledText: 'var(--ui-content-inverse)',
  },
  indigo: {
    primary: 'var(--ui-action-bg)',
    hover: 'var(--ui-action-hover)',
    bg: 'var(--ui-accent-soft)',
    border: 'var(--ui-accent-border)',
    text: 'var(--ui-content-primary)',
    filledText: 'var(--ui-action-text)',
  },
  emerald: {
    primary: 'var(--ui-success-text)',
    hover: 'var(--ui-success-text)',
    bg: 'var(--ui-success-bg)',
    border: 'var(--ui-success-border)',
    text: 'var(--ui-success-text)',
    filledText: 'var(--ui-content-inverse)',
  },
  amber: {
    primary: 'var(--ui-warning-text)',
    hover: 'var(--ui-warning-text)',
    bg: 'var(--ui-warning-bg)',
    border: 'var(--ui-warning-border)',
    text: 'var(--ui-warning-text)',
    filledText: 'var(--ui-content-primary)',
  },
  rose: {
    primary: 'var(--ui-error-text)',
    hover: 'var(--ui-error-text)',
    bg: 'var(--ui-error-bg)',
    border: 'var(--ui-error-border)',
    text: 'var(--ui-error-text)',
    filledText: 'var(--ui-content-inverse)',
  },
  violet: {
    primary: 'var(--ui-accent)',
    hover: 'var(--ui-action-hover)',
    bg: 'var(--ui-accent-soft)',
    border: 'var(--ui-accent-border)',
    text: 'var(--ui-content-primary)',
    filledText: 'var(--ui-content-inverse)',
  },
  slate: {
    primary: 'var(--ui-content-secondary)',
    hover: 'var(--ui-content-primary)',
    bg: 'var(--ui-surface-subtle)',
    border: 'var(--ui-stroke-subtle)',
    text: 'var(--ui-content-primary)',
    filledText: 'var(--ui-content-inverse)',
  },
};

const getDynamicPalette = (themeKey?: string) =>
  DYNAMIC_THEME_PALETTES[themeKey || 'sky'] || DYNAMIC_THEME_PALETTES.sky;

const buildDynamicFallback = (
  id: string,
  row?: Partial<SupabaseSegmentRow>
): SegmentTaxonomyItem => {
  const palette = getDynamicPalette(row?.theme_key);
  return {
    key: id as SectionKey,
    id,
    slug: row?.slug ? `/category/${row.slug}` : `/category/${id.replace(/_/g, '-')}`,
    nameBn: row?.name_bn || id,
    nameEn: row?.name_en || id,
    shortNameBn: row?.short_name_bn || row?.name_bn || id,
    shortNameEn: row?.short_name_en || row?.name_en || id,
    descriptionBn: row?.description_bn || '',
    descriptionEn: row?.description_en || '',
    primaryColor: palette.primary,
    hoverColor: palette.hover,
    bgColor: palette.bg,
    borderColor: palette.border,
    textColor: palette.text,
    colors: {
      primary: palette.primary,
      hover: palette.hover,
      lightBg: palette.bg,
      bgLight: palette.bg,
      border: palette.border,
      text: palette.text,
      textSafe: palette.text,
      filledText: palette.filledText,
    },
    iconKey: row?.icon_key || 'shield',
    themeKey: row?.theme_key || 'sky',
    sortOrder: typeof row?.sort_order === 'number' ? row.sort_order : undefined,
  };
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
          const fallback =
            SECTIONS[key] ||
            buildDynamicFallback(row.id, row);

          nextSegments[row.id] = {
            ...fallback,
            key,
            id: row.id,
            slug: row.slug ? `/category/${row.slug}` : fallback.slug,
            nameBn: row.name_bn || fallback.nameBn,
            nameEn: row.name_en || fallback.nameEn,
            shortNameBn: row.short_name_bn || row.name_bn || fallback.shortNameBn,
            shortNameEn: row.short_name_en || row.name_en || fallback.shortNameEn,
            descriptionBn: row.description_bn || fallback.descriptionBn,
            descriptionEn: row.description_en || fallback.descriptionEn,
            iconKey: row.icon_key || fallback.iconKey,
            themeKey: row.theme_key || fallback.themeKey,
            ...(SECTIONS[key]
              ? {}
              : {
                  primaryColor: getDynamicPalette(row.theme_key).primary,
                  hoverColor: getDynamicPalette(row.theme_key).hover,
                  bgColor: getDynamicPalette(row.theme_key).bg,
                  borderColor: getDynamicPalette(row.theme_key).border,
                  textColor: getDynamicPalette(row.theme_key).text,
                  colors: {
                    primary: getDynamicPalette(row.theme_key).primary,
                    hover: getDynamicPalette(row.theme_key).hover,
                    lightBg: getDynamicPalette(row.theme_key).bg,
                    bgLight: getDynamicPalette(row.theme_key).bg,
                    border: getDynamicPalette(row.theme_key).border,
                    text: getDynamicPalette(row.theme_key).text,
                    textSafe: getDynamicPalette(row.theme_key).text,
                    filledText: getDynamicPalette(row.theme_key).filledText,
                  },
                }),
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
        Object.keys(cachedSegments).forEach((sec) => {
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

  getSegment(key: string): SegmentTaxonomyItem {
    return (
      cachedSegments[key] ||
      (SECTIONS[key as SectionKey]
        ? { ...SECTIONS[key as SectionKey], id: key }
        : buildDynamicFallback(key))
    );
  },

  getSubcategories(segment: string): SubcategoryOption[] {
    return (
      cachedSubcategories[segment] ||
      SEGMENT_SUBCATEGORIES[segment as SectionKey] ||
      []
    );
  },

  getFeedSubcategories(segment: string): SubcategoryOption[] {
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
    getSubcategories: (segment: string) => TaxonomyService.getSubcategories(segment),
    getFeedSubcategories: (segment: string) => TaxonomyService.getFeedSubcategories(segment),
    getSegment: (key: string) => TaxonomyService.getSegment(key),
    refreshTaxonomy: () => TaxonomyService.fetchTaxonomy(),
  };
}
