/**
 * Centralized Media Upload Configuration
 * Defines upload boundaries, limits, allowed extensions, and file sizes across the application.
 */

export const MEDIA_UPLOAD_CONFIG = {
  maxImages: 6,
  maxFileSizeMB: 5,
  maxTotalSizeMB: 25,
  allowedExtensions: ['.jpg', '.jpeg', '.png'],
  allowedMimeTypes: ['image/jpeg', 'image/png'],
} as const;

export type MediaUploadConfig = typeof MEDIA_UPLOAD_CONFIG;
