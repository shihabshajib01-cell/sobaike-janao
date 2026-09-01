import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, X, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { MEDIA_UPLOAD_CONFIG } from '../../config/mediaConfig';
import { compressImageToWebP, generateStableImageId } from '../../services/imageCompressionService';

export interface AttachedImagePreview {
  file: File;
  previewUrl: string;
  id: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  isCompressing?: boolean;
  compressionError?: { bn: string; en: string } | null;
}

interface ImageAttachmentPickerProps {
  images: AttachedImagePreview[];
  onChange: (images: AttachedImagePreview[]) => void;
  language: 'bn' | 'en';
  maxImages?: number;
  maxFileSizeMB?: number;
  maxTotalSizeMB?: number;
}

export const ImageAttachmentPicker: React.FC<ImageAttachmentPickerProps> = ({
  images,
  onChange,
  language,
  maxImages = MEDIA_UPLOAD_CONFIG.maxImages,
  maxFileSizeMB = MEDIA_UPLOAD_CONFIG.maxFileSizeMB,
  maxTotalSizeMB = MEDIA_UPLOAD_CONFIG.maxTotalSizeMB,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ bn: string; en: string } | null>(null);

  // Keep a ref to latest images to avoid stale closures during asynchronous compression
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Cleanup object URLs when component completely unmounts
  useEffect(() => {
    return () => {
      // Clean up previews on unmount
      imagesRef.current.forEach((img) => {
        if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, []);

  const validateAndAddFiles = async (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(incomingFiles);
    const allowedExtensions = MEDIA_UPLOAD_CONFIG.allowedExtensions;
    const allowedMimes: readonly string[] = MEDIA_UPLOAD_CONFIG.allowedMimeTypes;

    if (imagesRef.current.length + fileArray.length > maxImages) {
      setErrorMessage({
        bn: `আপনি সর্বোচ্চ ${maxImages}টি ছবি যুক্ত করতে পারেন।`,
        en: `You can upload a maximum of ${maxImages} images.`,
      });
      return;
    }

    const validNewItems: {
      file: File;
      id: string;
      tempPreviewUrl: string;
    }[] = [];

    let currentTotalBytes = imagesRef.current.reduce((sum, img) => sum + img.originalSize, 0);

    for (const file of fileArray) {
      const fileNameLower = file.name.toLowerCase();
      const hasValidExt = allowedExtensions.some((ext) => fileNameLower.endsWith(ext));
      const hasValidMime = allowedMimes.includes(file.type);

      if (!hasValidExt || !hasValidMime) {
        setErrorMessage({
          bn: `"${file.name}" গ্রহণযোগ্য নয়। শুধুমাত্র JPG বা PNG ছবি গ্রহণযোগ্য।`,
          en: `"${file.name}" is not supported. Only JPG or PNG images are allowed.`,
        });
        return;
      }

      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setErrorMessage({
          bn: `"${file.name}" ফাইলের আকার ${maxFileSizeMB} মেগাবাইটের বেশি।`,
          en: `"${file.name}" exceeds the ${maxFileSizeMB}MB individual size limit.`,
        });
        return;
      }

      currentTotalBytes += file.size;
      if (currentTotalBytes > maxTotalSizeMB * 1024 * 1024) {
        setErrorMessage({
          bn: `সকল ছবি মিলিয়ে মোট আকার ${maxTotalSizeMB} মেগাবাইটের বেশি হতে পারবে না।`,
          en: `Total upload size exceeds the ${maxTotalSizeMB}MB limit.`,
        });
        return;
      }

      // Check if duplicate file by name and size
      const isDuplicate = imagesRef.current.some(
        (img) => img.originalName === file.name && img.originalSize === file.size
      );

      if (isDuplicate) {
        setErrorMessage({
          bn: 'এই ছবিটি ইতিমধ্যে সংযুক্ত আছে।',
          en: 'This image is already attached.',
        });
        return;
      }

      const stableId = generateStableImageId();
      const tempPreviewUrl = URL.createObjectURL(file);

      validNewItems.push({
        file,
        id: stableId,
        tempPreviewUrl,
      });
    }

    if (validNewItems.length === 0) return;

    // 1. Immediately insert placeholders in compressing state for instant responsive UI
    const placeholders: AttachedImagePreview[] = validNewItems.map((item) => ({
      file: item.file,
      previewUrl: item.tempPreviewUrl,
      id: item.id,
      originalName: item.file.name,
      originalSize: item.file.size,
      compressedSize: 0,
      width: 0,
      height: 0,
      isCompressing: true,
      compressionError: null,
    }));

    const updatedWithPlaceholders = [...imagesRef.current, ...placeholders];
    onChange(updatedWithPlaceholders);

    // 2. Compress each image sequentially or with controlled concurrency
    for (const item of validNewItems) {
      try {
        const compressed = await compressImageToWebP(item.file, item.id);

        // Revoke temporary raw file preview URL
        URL.revokeObjectURL(item.tempPreviewUrl);

        // Update the item with true compressed WebP result
        const currentList = imagesRef.current;
        const nextList = currentList.map((img) => {
          if (img.id === item.id) {
            return {
              file: compressed.file,
              previewUrl: compressed.previewUrl,
              id: compressed.id,
              originalName: compressed.originalName,
              originalSize: compressed.originalSize,
              compressedSize: compressed.compressedSize,
              width: compressed.width,
              height: compressed.height,
              isCompressing: false,
              compressionError: null,
            };
          }
          return img;
        });
        onChange(nextList);
      } catch (err: any) {
        const compressionErr =
          err && err.bn && err.en
            ? err
            : {
                bn: 'এই ছবিটি প্রস্তুত করা যায়নি। ছবিটি সরিয়ে অন্য একটি ছবি চেষ্টা করুন।',
                en: 'This image could not be prepared. Please remove it and try another image.',
              };

        const currentList = imagesRef.current;
        const nextList = currentList.map((img) => {
          if (img.id === item.id) {
            return {
              ...img,
              isCompressing: false,
              compressionError: compressionErr,
            };
          }
          return img;
        });
        onChange(nextList);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (idToRemove: string) => {
    const target = images.find((img) => img.id === idToRemove);
    if (target && target.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(images.filter((img) => img.id !== idToRemove));
    setErrorMessage(null);
  };

  const handleMoveImage = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
  };

  const hasAnyCompressing = images.some((img) => img.isCompressing);

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-[14px] text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-[22px]">{language === 'bn' ? errorMessage.bn : errorMessage.en}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {images.length < maxImages && (
        <div
          role="button"
          tabIndex={0}
          aria-label={language === 'bn' ? 'সহায়ক ছবি সংযুক্ত করুন' : 'Attach supporting images'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] ${
            isDragging
              ? 'border-emerald-600 bg-emerald-500/10'
              : 'border-subtle bg-surface-subtle hover:bg-surface hover:border-strong'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                validateAndAddFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <div className="w-12 h-12 rounded-2xl bg-surface border border-subtle flex items-center justify-center shadow-2xs text-secondary">
            <UploadCloud className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] font-semibold text-primary">
              {language === 'bn' ? 'সহায়ক ছবি সংযুক্ত করুন' : 'Attach supporting images'}
            </p>
            <p className="text-[14px] text-secondary">
              {language === 'bn'
                ? `ঐচ্ছিক · সর্বোচ্চ ${maxImages}টি JPG বা PNG ছবি (প্রতি ছবি ৫MB, মোট ২৫MB)`
                : `Optional · Up to ${maxImages} JPG or PNG images (5MB each, 25MB total)`}
            </p>
          </div>
        </div>
      )}

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[14px] font-semibold text-primary">
            <span className="flex items-center gap-2">
              <span>
                {language === 'bn'
                  ? `সংযুক্ত প্রমাণাদি (${images.length}/${maxImages})`
                  : `Attached Evidence (${images.length}/${maxImages})`}
              </span>
              {hasAnyCompressing && (
                <span className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {language === 'bn' ? 'ছবি প্রস্তুত করা হচ্ছে…' : 'Preparing…'}
                </span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, index) => {
              return (
                <div
                  key={img.id}
                  className={`relative group rounded-xl overflow-hidden border bg-surface flex flex-col justify-between shadow-2xs transition-all ${
                    img.compressionError
                      ? 'border-rose-500/50 bg-rose-500/5'
                      : 'border-subtle hover:border-strong'
                  }`}
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-surface-subtle flex items-center justify-center">
                    {img.previewUrl ? (
                      <img
                        src={img.previewUrl}
                        alt={`Selected ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          img.isCompressing ? 'opacity-40 blur-[1px]' : 'opacity-100'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-subtle text-muted">
                        <UploadCloud className="w-8 h-8 opacity-40" />
                      </div>
                    )}

                    {/* Order indicator */}
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/75 text-white text-[12px] font-bold tracking-wide">
                      #{index + 1}
                    </div>

                    {/* Preparing Spinner Overlay */}
                    {img.isCompressing && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 text-white text-center p-3">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                        <span className="text-[13px] font-semibold">
                          {language === 'bn' ? 'ছবি প্রস্তুত করা হচ্ছে…' : 'Preparing image…'}
                        </span>
                      </div>
                    )}

                    {/* Error Overlay if any */}
                    {img.compressionError && !img.isCompressing && (
                      <div className="absolute inset-0 bg-rose-950/80 p-3 flex flex-col items-center justify-center text-center text-rose-200 gap-1">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                        <span className="text-[12px] leading-tight">
                          {language === 'bn' ? img.compressionError.bn : img.compressionError.en}
                        </span>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(img.id);
                      }}
                      aria-label={language === 'bn' ? `ছবি ${index + 1} মুছুন` : `Remove image ${index + 1}`}
                      className="absolute top-2 right-2 min-w-[44px] min-h-[44px] rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* File info bar & Reorder controls */}
                  <div className="p-2.5 bg-surface border-t border-subtle flex items-center justify-between gap-2">
                    <div className="truncate text-[13px] text-primary flex-1 min-w-0">
                      <p className="truncate font-medium" title={img.file.name}>
                        {img.originalName || img.file.name}
                      </p>
                    </div>

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0 || img.isCompressing}
                        onClick={() => handleMoveImage(index, 'prev')}
                        aria-label={language === 'bn' ? 'পূর্বে সরান' : 'Move previous'}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-subtle bg-surface-subtle hover:bg-surface text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1 || img.isCompressing}
                        onClick={() => handleMoveImage(index, 'next')}
                        aria-label={language === 'bn' ? 'পরে সরান' : 'Move next'}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-subtle bg-surface-subtle hover:bg-surface text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
