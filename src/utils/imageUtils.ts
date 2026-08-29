/**
 * Image optimization utilities for responsive loading and performance
 */

export interface ResponsiveImageAttrs {
  src: string;
  srcSet?: string;
  sizes?: string;
  loading: 'lazy' | 'eager';
  decoding: 'async' | 'auto' | 'sync';
}

export type MediaCellLayout = 'single' | 'half' | 'two-thirds' | 'one-third' | 'quarter';

/**
 * Builds responsive srcSet for Unsplash and CDN image URLs.
 */
export const buildImageSrcSet = (
  url: string,
  widths: number[] = [320, 480, 640, 800, 1024, 1200]
): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;

  // Optimized handling for Unsplash images
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const origin = urlObj.origin;
      const base = `${origin}${pathname}`;

      return widths
        .map((w) => {
          const quality = w <= 480 ? 75 : 80;
          return `${base}?auto=format&fit=crop&w=${w}&q=${quality} ${w}w`;
        })
        .join(', ');
    } catch {
      // Fallback if URL parsing fails
      const baseUrl = url.split('?')[0];
      return widths
        .map((w) => `${baseUrl}?auto=format&fit=crop&w=${w}&q=80 ${w}w`)
        .join(', ');
    }
  }

  return undefined;
};

/**
 * Computes modern responsive sizes attribute tailored to feed card and detail grid layouts.
 */
export const computeResponsiveSizes = (
  isCompact: boolean,
  layout: MediaCellLayout = 'single'
): string => {
  if (isCompact) {
    switch (layout) {
      case 'half':
      case 'quarter':
        return '(max-width: 480px) 46vw, (max-width: 768px) 48vw, (max-width: 1024px) 240px, 320px';
      case 'one-third':
        return '(max-width: 480px) 46vw, (max-width: 768px) 32vw, 180px';
      case 'two-thirds':
        return '(max-width: 480px) 92vw, (max-width: 768px) 64vw, 360px';
      case 'single':
      default:
        return '(max-width: 480px) 94vw, (max-width: 768px) 92vw, (max-width: 1024px) 520px, 680px';
    }
  }

  // Detail Page layout (Max width 720px container)
  switch (layout) {
    case 'half':
    case 'quarter':
      return '(max-width: 640px) 48vw, 350px';
    case 'one-third':
      return '(max-width: 640px) 48vw, 240px';
    case 'two-thirds':
      return '(max-width: 640px) 100vw, 480px';
    case 'single':
    default:
      return '(max-width: 640px) 100vw, (max-width: 1024px) 720px, 720px';
  }
};

/**
 * Returns optimized image attributes with loading="lazy", responsive srcSet, and sizes.
 */
export const getResponsiveImageAttrs = (
  url: string,
  options: {
    isCompact?: boolean;
    layout?: MediaCellLayout;
    customSrcSet?: string;
    customSizes?: string;
  } = {}
): ResponsiveImageAttrs => {
  const isCompact = options.isCompact ?? true;
  const layout = options.layout ?? 'single';

  const srcSet = options.customSrcSet || buildImageSrcSet(url);
  const sizes = options.customSizes || computeResponsiveSizes(isCompact, layout);

  return {
    src: url,
    srcSet,
    sizes,
    loading: 'lazy',
    decoding: 'async',
  };
};
