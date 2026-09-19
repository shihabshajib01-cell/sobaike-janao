import { useSyncExternalStore } from 'react';
import { CANONICAL_BANNER_CONTENT, CategoryBannerContent } from '../data/bannerContent';
import { SectionKey } from '../theme/tokens';

export interface RuntimeBannerContent {
  section: string;
  titleBn: string;
  titleEn: string;
  mobileDescriptionBn: string;
  mobileDescriptionEn: string;
  tabletDescriptionBn: string;
  tabletDescriptionEn: string;
  desktopDescriptionBn: string;
  desktopDescriptionEn: string;
  illustrationSrc: string;
  primaryCtaBn: string;
  primaryCtaEn: string;
}

export interface ManagedBannerContent extends RuntimeBannerContent {
  showOnHome: boolean;
  showHomeCta: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PublishedBannerSettings {
  showOnHome: boolean;
  showHomeCta: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface PublicBannerRow {
  category_key?: unknown;
  content?: unknown;
}

const BANNER_BOOTSTRAP_TIMEOUT_MS = 2500;

const STRING_FIELDS: Array<keyof Omit<RuntimeBannerContent, 'section'>> = [
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

const runtimeContent = new Map<string, RuntimeBannerContent>();
const publishedSettings = new Map<string, PublishedBannerSettings>();
let publishedBannerVersion = 0;
const publishedBannerListeners = new Set<() => void>();

const notifyPublishedBannerListeners = () => {
  publishedBannerVersion += 1;
  publishedBannerListeners.forEach((listener) => listener());
};

export const subscribePublishedBannerContent = (listener: () => void): (() => void) => {
  publishedBannerListeners.add(listener);
  return () => publishedBannerListeners.delete(listener);
};

export const usePublishedBannerRuntime = (): number =>
  useSyncExternalStore(
    subscribePublishedBannerContent,
    () => publishedBannerVersion,
    () => publishedBannerVersion
  );

const parseContent = (
  section: string,
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
    // Home CTA is intentionally opt-in. Missing/legacy CMS data stays hidden.
    showHomeCta: raw.showHomeCta === true,
    isActive: raw.isActive,
    sortOrder,
  };
};

const loadPublishedRows = async (): Promise<PublicBannerRow[]> => {
  const { supabase } = await import('../lib/supabase');
  if (!supabase) return [];

  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error('Banner CMS bootstrap timed out')),
      BANNER_BOOTSTRAP_TIMEOUT_MS
    );
  });

  try {
    const result = await Promise.race([
      supabase.rpc('get_public_site_banners'),
      timeout,
    ]);

    if (result.error || !Array.isArray(result.data)) {
      throw result.error || new Error('Invalid banner response');
    }

    return result.data as PublicBannerRow[];
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
};

export const getPublishedBannerSettings = (
  section: string
): PublishedBannerSettings | null => publishedSettings.get(section) ?? null;

export const getRuntimeBannerContent = (
  section: string
): RuntimeBannerContent | null => {
  const remote = runtimeContent.get(section);
  if (remote) return remote;

  const canonical = CANONICAL_BANNER_CONTENT[section as SectionKey] as
    | CategoryBannerContent
    | undefined;

  return canonical ? { ...canonical, section } : null;
};

export const getRuntimeBannerEntries = (): Array<[
  string,
  RuntimeBannerContent,
  PublishedBannerSettings
]> =>
  Array.from(runtimeContent.entries())
    .map(([key, value]) => {
      const settings = publishedSettings.get(key);
      return settings
        ? ([key, value, settings] as [string, RuntimeBannerContent, PublishedBannerSettings])
        : null;
    })
    .filter(
      (entry): entry is [string, RuntimeBannerContent, PublishedBannerSettings] =>
        entry !== null
    );

/**
 * Hydrates published banner content before React mounts.
 * Existing code-backed banners remain fallback-compatible and any new published
 * category banner is added to the runtime registry.
 */
export const hydratePublishedBannerContent = async (): Promise<void> => {
  try {
    const rows = await loadPublishedRows();
    const parsed = new Map<string, ManagedBannerContent>();

    for (const row of rows) {
      if (typeof row.category_key !== 'string' || !row.category_key.trim()) continue;
      const content = parseContent(row.category_key, row.content);
      if (content) parsed.set(row.category_key, content);
    }

    if (parsed.size === 0) {
      throw new Error('Empty banner contract');
    }

    runtimeContent.clear();
    publishedSettings.clear();

    for (const [section, remote] of parsed.entries()) {
      const banner: RuntimeBannerContent = {
        section,
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
      };

      runtimeContent.set(section, banner);
      publishedSettings.set(section, {
        showOnHome: remote.showOnHome,
        showHomeCta: remote.showHomeCta,
        isActive: remote.isActive,
        sortOrder: remote.sortOrder,
      });

      const canonical = CANONICAL_BANNER_CONTENT[section as SectionKey] as
        | CategoryBannerContent
        | undefined;
      if (canonical) Object.assign(canonical, banner);
    }

    notifyPublishedBannerListeners();
  } catch (error) {
    runtimeContent.clear();
    publishedSettings.clear();
    console.warn('[Banner CMS] Using code-backed banner fallback:', error);
  }
};
