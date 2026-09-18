import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SectionKey, SECTIONS } from '../theme/tokens';
import { SubcategoryOption, SEGMENT_SUBCATEGORIES } from '../data/reportOptions';
import { useState, useEffect } from 'react';
import { PublicReportingConfigService } from './reportingFormConfig';

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

const THEME_PRIMARY: Record<string, string> = {
  sky: '#0284C7',
  indigo: '#4F46E5',
  emerald: '#059669',
  amber: '#D97706',
  rose: '#E11D48',
  violet: '#7C3AED',
  slate: '#64748B',
};

const buildDynamicTheme = (themeKey?: string) => {
  const primary = THEME_PRIMARY[themeKey || ''] || THEME_PRIMARY.sky;
  const background = `color-mix(in srgb, ${primary} 10%, var(--ui-surface))`;
  const border = `color-mix(in srgb, ${primary} 35%, var(--ui-surface))`;
  const text = `color-mix(in srgb, ${primary} 72%, var(--ui-content-primary))`;

  return {
    primaryColor: primary,
    hoverColor: primary,
    bgColor: background,
    borderColor: border,
    textColor: text,
    colors: {
      primary,
      hover: primary,
      lightBg: background,
      bgLight: background,
      border,
      text,
      textSafe: text,
      filledText: '#FFFFFF',
    },
  };
};

const applyRuntimeSectionCssVariables = (segment: SegmentTaxonomyItem) => {
  if (typeof document === 'undefined') return;

  const safeId = segment.id.replace(/[^a-z0-9_-]/gi, '');
  if (!safeId) return;

  const style = document.documentElement.style;
  style.setProperty(`--sec-${safeId}-primary`, segment.primaryColor);
  style.setProperty(`--sec-${safeId}-hover`, segment.hoverColor);
  style.setProperty(`--sec-${safeId}-bg`, segment.bgColor);
  style.setProperty(`--sec-${safeId}-border`, segment.borderColor);
  style.setProperty(`--sec-${safeId}-text`, segment.textColor);
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
let lastFetchedAt = 0;
const TAXONOMY_REFRESH_INTERVAL_MS = 60_000;
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
        .eq('config_status', 'published')
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('[TaxonomyService] Error fetching segments from Supabase:', error.message);
        return cachedSegments;
      }

      if (data && Array.isArray(data)) {
        const nextSegments: Record<string, SegmentTaxonomyItem> = {};

        data.forEach((row: SupabaseSegmentRow) => {
          const key = row.id as SectionKey;
          const legacy = SECTIONS[key];
          const dynamicTheme = buildDynamicTheme(row.theme_key);
          const hasManagedTheme = Boolean(
            row.theme_key && THEME_PRIMARY[row.theme_key]
          );
          const fallback = legacy
            ? hasManagedTheme
              ? {
                  ...legacy,
                  ...dynamicTheme,
                  colors: dynamicTheme.colors,
                }
              : legacy
            : {
                ...SECTIONS.public_safety,
                ...dynamicTheme,
                colors: dynamicTheme.colors,
              };

          const segment: SegmentTaxonomyItem = {
            ...fallback,
            key,
            id: row.id,
            iconKey: row.icon_key || 'shield',
            themeKey: row.theme_key || 'sky',
            slug: legacy
              ? legacy.slug
              : row.slug
                ? `/category/${row.slug}`
                : `/category/${row.id.replace(/_/g, '-')}`,
            nameBn: row.name_bn || fallback.nameBn,
            nameEn: row.name_en || fallback.nameEn,
            shortNameBn: row.short_name_bn || row.name_bn || fallback.shortNameBn,
            shortNameEn: row.short_name_en || row.name_en || fallback.shortNameEn,
            descriptionBn: row.description_bn || fallback.descriptionBn,
            descriptionEn: row.description_en || fallback.descriptionEn,
            sortOrder: typeof row.sort_order === 'number' ? row.sort_order : undefined,
          };

          nextSegments[row.id] = segment;
          applyRuntimeSectionCssVariables(segment);
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
        .eq('config_status', 'published')
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
      await Promise.all([
        this.fetchSegments(),
        this.fetchSubcategories(),
        // Taxonomy and form schemas are one public reporting contract. Refresh
        // them together so a newly published complaint type cannot appear
        // without its matching form configuration in a long-running session.
        PublicReportingConfigService.fetch(true),
      ]);
      isFetched = true;
      lastFetchedAt = Date.now();
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

if (typeof window !== 'undefined') {
  if (!isFetched) {
    TaxonomyService.fetchTaxonomy().catch(() => {});
  }

  const refreshIfStale = () => {
    if (
      !isFetching &&
      Date.now() - lastFetchedAt >= TAXONOMY_REFRESH_INTERVAL_MS
    ) {
      TaxonomyService.fetchTaxonomy().catch(() => {});
    }
  };

  window.addEventListener('focus', refreshIfStale);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshIfStale();
  });
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
