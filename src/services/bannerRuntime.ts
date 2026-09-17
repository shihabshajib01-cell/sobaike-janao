import { CANONICAL_BANNER_CONTENT, CategoryBannerContent } from '../data/bannerContent';
import { supabase } from '../lib/supabase';
import { SectionKey } from '../theme/tokens';

export interface ManagedBannerContent extends CategoryBannerContent {
  showOnHome: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface PublicBannerRow {
  category_key?: unknown;
  content?: unknown;
}

const SECTION_KEYS: SectionKey[] = [
  'harassment',
  'extortion',
  'public_safety',
  'road_transport',
  'load_shedding',
  'illegal_occupation',
  'rickshaw',
];

const STRING_FIELDS: Array<keyof CategoryBannerContent> = [
  'titleBn',
  'titleEn',
  'mobileDescriptionBn',
  'mobileDescriptionEn',
  'tabletDescriptionBn',
  'tabletDescriptionEn',
  'desktopDescriptionBn',
  'desktopDescriptionEn',
  'illustrationSrc',
  'primaryCtaBn',
  'primaryCtaEn',
];

const isSectionKey = (value: unknown): value is SectionKey =>
  typeof value === 'string' && SECTION_KEYS.includes(value as SectionKey);

const parseContent = (
  section: SectionKey,
  value: unknown
): ManagedBannerContent | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  for (const field of STRING_FIELDS) {
    if (typeof raw[field] !== 'string' || !String(raw[field]).trim()) {
      return null;
    }
  }

  if (typeof raw.showOnHome !== 'boolean' || typeof raw.isActive !== 'boolean') {
    return null;
  }

  const sortOrder = Number(raw.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > 99) {
    return null;
  }

  return {
    section,
    titleBn: String(raw.titleBn).trim(),
    titleEn: String(raw.titleEn).trim(),
    mobileDescriptionBn: String(raw.mobileDescriptionBn).trim(),
    mobileDescriptionEn: String(raw.mobileDescriptionEn).trim(),
    tabletDescriptionBn: String(raw.tabletDescriptionBn).trim(),
    tabletDescriptionEn: String(raw.tabletDescriptionEn).trim(),
    desktopDescriptionBn: String(raw.desktopDescriptionBn).trim(),
    desktopDescriptionEn: String(raw.desktopDescriptionEn).trim(),
    illustrationSrc: String(raw.illustrationSrc).trim(),
    primaryCtaBn: String(raw.primaryCtaBn).trim(),
    primaryCtaEn: String(raw.primaryCtaEn).trim(),
    showOnHome: raw.showOnHome,
    isActive: raw.isActive,
    sortOrder,
  };
};

/**
 * Hydrates the existing canonical in-memory banner content before React mounts.
 * If the public RPC is unavailable or returns an invalid/incomplete contract,
 * the application keeps the exact code-backed banners as a fail-safe fallback.
 */
export const hydratePublishedBannerContent = async (): Promise<void> => {
  if (!supabase) return;

  try {
    const { data, error } = await supabase.rpc('get_public_site_banners');
    if (error || !Array.isArray(data)) {
      throw error || new Error('Invalid banner response');
    }

    const parsed = new Map<SectionKey, ManagedBannerContent>();

    for (const row of data as PublicBannerRow[]) {
      if (!isSectionKey(row.category_key)) continue;
      const content = parseContent(row.category_key, row.content);
      if (content) parsed.set(row.category_key, content);
    }

    // All seven canonical categories must be present before remote content is trusted.
    if (parsed.size !== SECTION_KEYS.length) {
      throw new Error('Incomplete banner contract');
    }

    for (const section of SECTION_KEYS) {
      const remote = parsed.get(section);
      if (!remote) continue;

      // Keep the existing object identity so all current banner consumers remain unchanged.
      Object.assign(CANONICAL_BANNER_CONTENT[section], {
        titleBn: remote.titleBn,
        titleEn: remote.titleEn,
        mobileDescriptionBn: remote.mobileDescriptionBn,
        mobileDescriptionEn: remote.mobileDescriptionEn,
        tabletDescriptionBn: remote.tabletDescriptionBn,
        tabletDescriptionEn: remote.tabletDescriptionEn,
        desktopDescriptionBn: remote.desktopDescriptionBn,
        desktopDescriptionEn: remote.desktopDescriptionEn,
        illustrationSrc: remote.illustrationSrc,
        primaryCtaBn: remote.primaryCtaBn,
        primaryCtaEn: remote.primaryCtaEn,
      });
    }
  } catch (error) {
    console.warn('[Banner CMS] Using code-backed banner fallback:', error);
  }
};
