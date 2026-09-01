import { MEDIA_UPLOAD_CONFIG } from '../config/mediaConfig';

export interface CompressedEvidenceImage {
  file: File;
  previewUrl: string;
  id: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  compressionRatio: number;
}

export interface CompressionError {
  bn: string;
  en: string;
}

/**
 * Generates a stable unique identifier for the image
 */
export function generateStableImageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitizes base filename to produce a safe storage-ready filename.
 */
export function sanitizeBaseFileName(originalName: string): string {
  const withoutExt = originalName.replace(/\.[^/.]+$/, '');
  const clean = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return clean || 'evidence';
}

/**
 * Calculates scaled dimensions preserving aspect ratio without upscaling.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: 800, height: 600 };
  }

  const currentMax = Math.max(origWidth, origHeight);
  if (currentMax <= maxDimension) {
    return { width: origWidth, height: origHeight };
  }

  const scale = maxDimension / currentMax;
  return {
    width: Math.max(1, Math.round(origWidth * scale)),
    height: Math.max(1, Math.round(origHeight * scale)),
  };
}

/**
 * Loads an image file into an ImageBitmap or HTMLImageElement safely.
 */
async function loadImageSource(file: File): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  // Try createImageBitmap first (handles orientation in modern browsers)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as any);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => {
          try {
            bitmap.close();
          } catch {}
        },
      };
    } catch {
      // Fall back to standard HTMLImageElement
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => {
          URL.revokeObjectURL(objectUrl);
        },
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to decode image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Draws image to canvas and exports as WebP Blob.
 */
async function renderCanvasToWebP(
  source: ImageBitmap | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number
): Promise<Blob> {
  // Check if OffscreenCanvas with convertToBlob is supported
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const offscreen = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
        return await offscreen.convertToBlob({
          type: MEDIA_UPLOAD_CONFIG.outputMimeType,
          quality,
        });
      }
    } catch {
      // Fallback to standard DOM canvas
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // Clean up canvas references
        canvas.width = 0;
        canvas.height = 0;
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode canvas as WebP'));
        }
      },
      MEDIA_UPLOAD_CONFIG.outputMimeType,
      quality
    );
  });
}

/**
 * Aggressively compresses a single JPG/PNG image locally in-browser to WebP.
 *
 * Adaptive Strategy:
 * 1. Start at max long edge: 1600 px, quality: 0.82
 * 2. If > 120 KB: step quality down: [0.82, 0.76, 0.70, 0.65, 0.60]
 * 3. If still > 180 KB at quality 0.60: step dimensions down: [1400, 1200, 1024] at quality 0.60
 * 4. If still > 256 KB hard limit: emergency pass at 900 px and quality 0.55
 * 5. If STILL > 256 KB: reject image with EN/BN error
 */
export async function compressImageToWebP(
  originalFile: File,
  presetId?: string
): Promise<CompressedEvidenceImage> {
  const stableId = presetId || generateStableImageId();
  const safeBaseName = sanitizeBaseFileName(originalFile.name);
  const webpFileName = `${safeBaseName}-${stableId}${MEDIA_UPLOAD_CONFIG.outputExtension}`;

  const { source, width: origWidth, height: origHeight, cleanup } = await loadImageSource(originalFile);

  try {
    let bestBlob: Blob | null = null;
    let finalWidth = origWidth;
    let finalHeight = origHeight;

    // Step 1: Initial compression at startingMaxDimension (1600px)
    let currentMaxDim = MEDIA_UPLOAD_CONFIG.startingMaxDimension;
    let dims = calculateTargetDimensions(origWidth, origHeight, currentMaxDim);
    finalWidth = dims.width;
    finalHeight = dims.height;

    // Try quality ladder: [0.82, 0.76, 0.70, 0.65, 0.60]
    for (const quality of MEDIA_UPLOAD_CONFIG.qualitySteps) {
      const blob = await renderCanvasToWebP(source, finalWidth, finalHeight, quality);
      bestBlob = blob;

      // If output is within ideal target (<= 120 KB), we're done!
      if (blob.size <= MEDIA_UPLOAD_CONFIG.targetCompressedBytes) {
        break;
      }
    }

    // Step 2: If still > 180 KB at lowest normal quality (0.60), step down dimensions
    if (bestBlob && bestBlob.size > 180 * 1024) {
      for (const nextDim of MEDIA_UPLOAD_CONFIG.midMaxDimensions) {
        if (Math.max(origWidth, origHeight) <= nextDim) {
          continue; // Don't downscale if original is already smaller
        }

        const smallerDims = calculateTargetDimensions(origWidth, origHeight, nextDim);
        const blob = await renderCanvasToWebP(
          source,
          smallerDims.width,
          smallerDims.height,
          MEDIA_UPLOAD_CONFIG.normalMinimumQuality
        );

        bestBlob = blob;
        finalWidth = smallerDims.width;
        finalHeight = smallerDims.height;

        // If reached <= 120 KB or under 180 KB, stop reducing dimensions
        if (blob.size <= MEDIA_UPLOAD_CONFIG.targetCompressedBytes || blob.size <= 150 * 1024) {
          break;
        }
      }
    }

    // Step 3: Hard limit check (<= 256 KB). If still > 256 KB, emergency pass
    if (bestBlob && bestBlob.size > MEDIA_UPLOAD_CONFIG.hardCompressedBytes) {
      const fallbackDims = calculateTargetDimensions(
        origWidth,
        origHeight,
        MEDIA_UPLOAD_CONFIG.fallbackMaxDimension
      );
      const emergencyBlob = await renderCanvasToWebP(
        source,
        fallbackDims.width,
        fallbackDims.height,
        MEDIA_UPLOAD_CONFIG.fallbackQuality
      );

      bestBlob = emergencyBlob;
      finalWidth = fallbackDims.width;
      finalHeight = fallbackDims.height;
    }

    // Step 4: Final validation against hard limit
    if (!bestBlob || bestBlob.size > MEDIA_UPLOAD_CONFIG.hardCompressedBytes) {
      const error: CompressionError = {
        bn: `"${originalFile.name}" ফাইলের আকার ২৫৬ KB এর নিচে নামানো সম্ভব হয়নি। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।`,
        en: `"${originalFile.name}" could not be compressed under the 256 KB storage limit. Please choose a different photo.`,
      };
      throw error;
    }

    // Wrap Blob into File with safe WebP filename
    const compressedWebpFile = new File([bestBlob], webpFileName, {
      type: MEDIA_UPLOAD_CONFIG.outputMimeType,
      lastModified: Date.now(),
    });

    const previewUrl = URL.createObjectURL(compressedWebpFile);
    const compressionRatio =
      originalFile.size > 0
        ? Math.round(((originalFile.size - compressedWebpFile.size) / originalFile.size) * 100)
        : 0;

    return {
      file: compressedWebpFile,
      previewUrl,
      id: stableId,
      originalName: originalFile.name,
      originalSize: originalFile.size,
      compressedSize: compressedWebpFile.size,
      width: finalWidth,
      height: finalHeight,
      compressionRatio,
    };
  } finally {
    cleanup();
  }
}

/**
 * Concurrently processes a queue of image files with a safe concurrency limit (1-2)
 * to avoid memory exhaustion on mobile devices.
 */
export async function compressMultipleImages(
  files: File[],
  onItemComplete?: (result: CompressedEvidenceImage, index: number) => void,
  onItemError?: (error: CompressionError, file: File, index: number) => void
): Promise<CompressedEvidenceImage[]> {
  const concurrency = MEDIA_UPLOAD_CONFIG.compressionConcurrency;
  const results: CompressedEvidenceImage[] = [];
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < files.length) {
      const index = currentIndex++;
      const file = files[index];
      try {
        const compressed = await compressImageToWebP(file);
        results.push(compressed);
        if (onItemComplete) {
          onItemComplete(compressed, index);
        }
      } catch (err: any) {
        const errorObj: CompressionError =
          err && err.bn && err.en
            ? err
            : {
                bn: `"${file.name}" প্রক্রিয়াকরণ ব্যর্থ হয়েছে।`,
                en: `Failed to compress "${file.name}".`,
              };
        if (onItemError) {
          onItemError(errorObj, file, index);
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
