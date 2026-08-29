import React, { useRef, useState } from 'react';
import { UploadCloud, X, ArrowLeft, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { MEDIA_UPLOAD_CONFIG } from '../../config/mediaConfig';

export interface AttachedImagePreview {
  file: File;
  previewUrl: string;
  id: string;
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

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(incomingFiles);
    const allowedExtensions = MEDIA_UPLOAD_CONFIG.allowedExtensions;
    const allowedMimes: readonly string[] = MEDIA_UPLOAD_CONFIG.allowedMimeTypes;

    if (images.length + fileArray.length > maxImages) {
      setErrorMessage({
        bn: `আপনি সর্বোচ্চ ${maxImages}টি ছবি যুক্ত করতে পারেন।`,
        en: `You can upload a maximum of ${maxImages} images.`,
      });
      return;
    }

    const newPreviews: AttachedImagePreview[] = [];
    let currentTotalBytes = images.reduce((sum, img) => sum + img.file.size, 0);

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

      // Check if duplicate file by name, size, and lastModified
      const isDuplicate = images.some(
        (img) =>
          img.file.name === file.name &&
          img.file.size === file.size &&
          img.file.lastModified === file.lastModified
      );

      if (isDuplicate) {
        setErrorMessage({
          bn: 'এই ছবিটি ইতিমধ্যে সংযুক্ত আছে।',
          en: 'This image is already attached.',
        });
        return;
      }

      newPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file),
        id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `img-${crypto.randomUUID()}`
          : `img-${Date.now()}`,
      });
    }

    if (newPreviews.length > 0) {
      onChange([...images, ...newPreviews]);
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
    if (target) {
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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

      {/* Safety & Refresh Note */}
      <div className="flex items-start gap-2 text-[14px] leading-[22px] text-muted">
        <ShieldAlert className="w-4 h-4 text-muted shrink-0 mt-1" />
        <span>
          {language === 'bn'
            ? 'নিরাপত্তার কারণে পেজ রিফ্রেশ করলে সংযুক্ত ছবি পুনরায় নির্বাচন করতে হতে পারে।'
            : 'For privacy and security, attached images may need to be selected again after refreshing this page.'}
        </span>
      </div>

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[14px] font-semibold text-primary">
            <span>
              {language === 'bn'
                ? `সংযুক্ত ছবি (${images.length}/${maxImages})`
                : `Attached Images (${images.length}/${maxImages})`}
            </span>
            <span className="text-[14px] text-secondary font-normal">
              {formatFileSize(images.reduce((sum, img) => sum + img.file.size, 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden border border-subtle bg-surface flex flex-col justify-between shadow-2xs"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-surface-subtle">
                  <img
                    src={img.previewUrl}
                    alt={`Selected ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Order indicator */}
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/75 text-white text-[14px] font-bold">
                    #{index + 1}
                  </div>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(img.id);
                    }}
                    aria-label={language === 'bn' ? `ছবি ${index + 1} মুছুন` : `Remove image ${index + 1}`}
                    className="absolute top-2 right-2 min-w-[44px] min-h-[44px] rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* File info bar & Reorder controls */}
                <div className="p-2.5 bg-surface border-t border-subtle flex items-center justify-between gap-2">
                  <div className="truncate text-[14px] text-primary">
                    <p className="truncate font-medium">{img.file.name}</p>
                    <p className="text-secondary text-[14px]">{formatFileSize(img.file.size)}</p>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveImage(index, 'prev')}
                      aria-label={language === 'bn' ? 'পূর্বে সরান' : 'Move previous'}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-subtle bg-surface-subtle hover:bg-surface text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => handleMoveImage(index, 'next')}
                      aria-label={language === 'bn' ? 'পরে সরান' : 'Move next'}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-subtle bg-surface-subtle hover:bg-surface text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
