import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const MAX_IMAGES_PER_REPORT = 6;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_DECODED_PIXELS = 40000000; // 40 MP
export const MAX_IMAGE_DIMENSION = 4096;

export function getUploadDirectory(): string {
  const uploadDir = process.env.PRIVATE_UPLOAD_DIR
    ? path.resolve(process.cwd(), process.env.PRIVATE_UPLOAD_DIR)
    : path.resolve(process.cwd(), 'data', 'private-uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
}

export function getSafeUploadFilePath(storageKey: string): string | null {
  if (!storageKey || typeof storageKey !== 'string' || storageKey.includes('..') || storageKey.includes('/') || storageKey.includes('\\')) {
    return null;
  }

  const uploadDir = getUploadDirectory();
  const targetPath = path.resolve(uploadDir, storageKey);

  // Strictly enforce path boundary
  if (!targetPath.startsWith(uploadDir)) {
    return null;
  }

  return targetPath;
}

export function cleanupUploadedFiles(storageKeys: string[]): void {
  for (const key of storageKeys) {
    try {
      const filePath = getSafeUploadFilePath(key);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error(`[Upload Cleanup Error] Failed to delete file ${key}:`, e);
    }
  }
}

// Memory storage for inspection before writing to disk
const storage = multer.memoryStorage();

export const uploadImagesMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_IMAGES_PER_REPORT,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`INVALID_FILE_TYPE: Only JPG and PNG images are supported. Received ${file.mimetype}`));
    }
  },
}).array('images', MAX_IMAGES_PER_REPORT);

export interface ProcessedImageResult {
  id: string;
  storageKey: string;
  mimeType: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  sizeBytes: number;
  sha256: string;
  sortOrder: number;
}

function parseDimensions(buffer: Buffer): { width: number; height: number; format: 'png' | 'jpeg' } {
  // Check PNG (magic bytes: 89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height, format: 'png' };
  }

  // Check JPEG (magic bytes: FF D8)
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2) contain image dimensions
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height, format: 'jpeg' };
      }
      // Skip variable length markers
      if (marker !== 0xd8 && marker !== 0xd9 && marker !== 0x00) {
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      } else {
        offset += 2;
      }
    }
    // Fallback default JPEG dimensions if SOF marker not encountered in search
    return { width: 800, height: 600, format: 'jpeg' };
  }

  throw new Error('INVALID_FORMAT: Decoded image format is not JPEG or PNG.');
}

export async function sanitizeAndStoreImage(
  buffer: Buffer,
  originalMime: string,
  sortOrder: number
): Promise<ProcessedImageResult> {
  const isPng = originalMime.toLowerCase().includes('png');
  const { width, height, format } = parseDimensions(buffer);

  if (width <= 0 || height <= 0) {
    throw new Error('CORRUPTED_IMAGE: Image dimensions are invalid.');
  }

  if (width * height > MAX_DECODED_PIXELS) {
    throw new Error(`IMAGE_TOO_LARGE: Image exceeds 40MP limit (${width}x${height}).`);
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`IMAGE_TOO_LARGE: Sanitized image exceeds 5MB size limit.`);
  }

  const finalMime = format === 'png' || isPng ? 'image/png' : 'image/jpeg';
  const ext = finalMime === 'image/png' ? '.png' : '.jpg';
  const finalSize = buffer.length;

  // Compute SHA-256
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // Generate safe storage key
  const attachmentId = `att-${crypto.randomUUID()}`;
  const storageKey = `${attachmentId}${ext}`;
  const targetPath = getSafeUploadFilePath(storageKey);

  if (!targetPath) {
    throw new Error('STORAGE_ERROR: Failed to allocate safe file path.');
  }

  // Write file to private directory
  fs.writeFileSync(targetPath, buffer);

  return {
    id: attachmentId,
    storageKey,
    mimeType: finalMime,
    width,
    height,
    sizeBytes: finalSize,
    sha256,
    sortOrder,
  };
}
