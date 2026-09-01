/**
 * Centralized Media Upload & Local Compression Configuration
 * Defines upload boundaries, limits, allowed extensions, and compression thresholds.
 */

export const MEDIA_UPLOAD_CONFIG = {
  // Input Validation Limits
  maxImages: 6,
  maxFileSizeMB: 5,
  maxTotalSizeMB: 25,
  allowedExtensions: ['.jpg', '.jpeg', '.png'],
  allowedMimeTypes: ['image/jpeg', 'image/png'],

  // Compression Output Targets & Boundaries
  targetCompressedBytes: 120 * 1024, // 120 KB ideal target
  preferredFloorBytes: 30 * 1024,    // 30 KB preferred lower bound for normal detail
  hardCompressedBytes: 256 * 1024,   // 256 KB hard limit imposed by Supabase Storage bucket policy

  // Dimensional Boundaries
  startingMaxDimension: 1600,        // Max long edge for first pass
  midMaxDimensions: [1400, 1200, 1024],
  minimumSafeDimension: 1024,        // Preferred floor dimension
  fallbackMaxDimension: 900,         // Final emergency attempt dimension

  // Quality Ladders
  startingQuality: 0.82,
  qualitySteps: [0.82, 0.76, 0.70, 0.65, 0.60],
  normalMinimumQuality: 0.60,
  fallbackQuality: 0.55,             // Emergency floor quality for pathological images

  // Concurrency Limit
  compressionConcurrency: 2,

  // Output format
  outputMimeType: 'image/webp' as const,
  outputExtension: '.webp',
  storageBucket: 'complaint-evidence',
} as const;

export type MediaUploadConfig = typeof MEDIA_UPLOAD_CONFIG;

