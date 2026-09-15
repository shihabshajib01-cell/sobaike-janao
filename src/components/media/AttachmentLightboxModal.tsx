import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { AttachedImagePreview } from './ImageAttachmentPicker';
import { toBanglaDigits } from '../../utils/formatters';

export interface AttachmentItem {
  id?: string;
  previewUrl?: string;
  url?: string;
  originalName?: string;
  name?: string;
  file?: File;
  originalSize?: number;
  compressedSize?: number;
  width?: number;
  height?: number;
  isCompressing?: boolean;
  compressionError?: { bn: string; en: string } | null;
  [key: string]: any;
}

export interface AttachmentLightboxModalProps {
  images: AttachmentItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  language: 'bn' | 'en';
}

/**
 * Format bytes into human-readable string (KB / MB)
 */
const formatFileSize = (bytes?: number, language: 'bn' | 'en' = 'en'): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) {
    const kb = Math.round(bytes / 1024);
    return language === 'bn' ? `${toBanglaDigits(kb)} KB` : `${kb} KB`;
  }
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return language === 'bn' ? `${toBanglaDigits(mb)} MB` : `${mb} MB`;
};

export const AttachmentLightboxModal: React.FC<AttachmentLightboxModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  language,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Sync index when initialIndex or isOpen changes
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 30);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [initialIndex, isOpen, images.length]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handlePrevRef = useRef(handlePrev);
  handlePrevRef.current = handlePrev;
  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;

  // Keyboard navigation & Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevRef.current();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextRef.current();
      } else if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
  const currentImage = images[safeIndex] || images[0];
  const imageUrl = currentImage.previewUrl || currentImage.url || '';
  const imageName = currentImage.originalName || currentImage.name || (currentImage.file && currentImage.file.name) || '';
  const imageSize = currentImage.compressedSize || currentImage.originalSize || (currentImage.file && currentImage.file.size);

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent | React.PointerEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchStartXRef.current = clientX;
    touchEndXRef.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.PointerEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchEndXRef.current = clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 40;

    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <div
      id="attachment-lightbox-modal"
      role="dialog"
      aria-modal="true"
      aria-label={language === 'bn' ? 'সংযুক্ত ছবির বিশদ রূপ' : 'Attachment image viewer'}
      className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-6 overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ui-media-viewer-backdrop backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card: Full screen on mobile, centered card on md+ */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl h-full md:h-auto max-h-none md:max-h-[92vh] flex flex-col rounded-none md:rounded-2xl md:rounded-[var(--radius-modal)] ui-radius-modal border-0 md:border border-ui-media-viewer-border bg-ui-media-viewer-bg text-ui-media-viewer-text shadow-2xl overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 pb-3.5 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] md:pt-3.5 border-b border-ui-media-viewer-border bg-ui-media-viewer-bg-elevated backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Image Counter Badge */}
            <p className="shrink-0 px-2.5 py-1 rounded-full bg-ui-media-viewer-chip text-ui-media-viewer-text text-[12px] sm:text-[13px] font-semibold tracking-wide">
              {language === 'bn'
                ? `ছবি ${toBanglaDigits(safeIndex + 1)} / ${toBanglaDigits(images.length)}`
                : `Image ${safeIndex + 1} of ${images.length}`}
            </p>

            {/* Filename & optional size */}
            <div className="min-w-0 truncate text-[13px] sm:text-[14px]">
              <p className="font-medium text-ui-media-viewer-text truncate inline-block max-w-[200px] sm:max-w-[320px] align-middle" title={imageName}>
                {imageName || (language === 'bn' ? 'সংযুক্ত ছবি' : 'Attached image')}
              </p>
              {imageSize ? (
                <p className="text-ui-media-viewer-muted text-[12px] ml-2 inline-block">
                  ({formatFileSize(imageSize, language)})
                </p>
              ) : null}
            </div>
          </div>

          {/* Close button with accessible 44x44px touch target */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={language === 'bn' ? 'ভিউয়ার বন্ধ করুন' : 'Close image viewer'}
            className="min-w-[44px] min-h-[44px] rounded-full bg-ui-media-viewer-chip hover:bg-ui-media-viewer-chip-hover text-ui-media-viewer-text flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-media-viewer-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ui-media-viewer-bg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Image Stage Preserving Aspect Ratio */}
        <div
          className="relative flex-1 min-h-[240px] max-h-none md:max-h-[calc(88vh-130px)] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-ui-media-viewer-stage overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handleTouchStart}
          onPointerMove={handleTouchMove}
          onPointerUp={handleTouchEnd}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={
                imageName ||
                (language === 'bn'
                  ? `সংযুক্ত ছবি ${toBanglaDigits(safeIndex + 1)}`
                  : `Attached image ${safeIndex + 1}`)
              }
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl transition-all duration-200 pointer-events-none select-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-ui-media-viewer-muted gap-2 p-6">
              <ZoomIn className="w-8 h-8 opacity-40" />
              <p className="text-[14px]">
                {language === 'bn' ? 'ছবিটি লোড করা যায়নি' : 'Image preview unavailable'}
              </p>
            </div>
          )}

          {/* Prev / Next Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label={language === 'bn' ? 'পূর্ববর্তী ছবি' : 'Previous image'}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full bg-ui-media-viewer-control hover:bg-ui-media-viewer-control-hover text-ui-media-viewer-text border border-ui-media-viewer-border flex items-center justify-center cursor-pointer transition-all shadow-lg z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-media-viewer-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ui-media-viewer-bg"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label={language === 'bn' ? 'পরবর্তী ছবি' : 'Next image'}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full bg-ui-media-viewer-control hover:bg-ui-media-viewer-control-hover text-ui-media-viewer-text border border-ui-media-viewer-border flex items-center justify-center cursor-pointer transition-all shadow-lg z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-media-viewer-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ui-media-viewer-bg"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Modal Footer: Thumbnail strip when multiple images */}
        {images.length > 1 && (
          <div className="px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] md:pb-2.5 bg-ui-media-viewer-bg-elevated border-t border-ui-media-viewer-border flex items-center justify-center gap-2 overflow-x-auto shrink-0">
            <div className="flex gap-2 p-1 rounded-xl bg-ui-media-viewer-strip border border-ui-media-viewer-border-soft">
              {images.map((img, idx) => {
                const thumbUrl = img.previewUrl || img.url || '';
                const isSelected = idx === safeIndex;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={
                      language === 'bn'
                        ? `ছবি ${toBanglaDigits(idx + 1)}-এ যান`
                        : `Go to image ${idx + 1}`
                    }
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-media-viewer-focus shrink-0 ${
                      isSelected
                        ? 'border-ui-success-border scale-105 opacity-100 ring-2 ring-ui-success-border'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-ui-media-viewer-control flex items-center justify-center text-[11px] text-ui-media-viewer-muted">
                        #{idx + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
