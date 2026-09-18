import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicReportImage } from '../../types/report';
import { getResponsiveImageAttrs } from '../../utils/imageUtils';
import { useDialogLifecycle } from '../ui/useDialogLifecycle';

interface ImageViewerProps {
  images: PublicReportImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  language: 'bn' | 'en';
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  language,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const viewerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useDialogLifecycle({
    id: 'image-viewer',
    isOpen,
    onClose,
    containerRef: viewerRef,
    initialFocusRef: closeButtonRef,
    onArrowLeft: images.length > 1 ? handlePrev : undefined,
    onArrowRight: images.length > 1 ? handleNext : undefined,
  });

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  // Mobile Swipe Handlers (Pointer / Touch)
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
    const threshold = 40; // minimum distance in px to qualify as a swipe

    if (diff > threshold) {
      // Swipe left -> Next image
      handleNext();
    } else if (diff < -threshold) {
      // Swipe right -> Prev image
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const toBanglaNum = (n: number) => {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n.toString().split('').map((d) => digits[parseInt(d, 10)] || d).join('');
  };

  return (
    <div
      ref={viewerRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={language === 'bn' ? 'ছবির পূর্ণরূপ' : 'Image viewer'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ui-media-overlay-max backdrop-blur-sm select-none"
      onClick={onClose}
    >
      {/* Top Bar: Counter + Close Button */}
      <div
        className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-ui-media-gradient to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-ui-media-viewer-text type-compact font-[var(--font-weight-medium)] tracking-wide">
          <span>
            {language === 'bn'
              ? `ছবি ${toBanglaNum(currentIndex + 1)} / ${toBanglaNum(images.length)}`
              : `Image ${currentIndex + 1} of ${images.length}`}
          </span>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={language === 'bn' ? 'ছবি দেখা বন্ধ করুন' : 'Close image viewer'}
          className="min-w-[44px] min-h-[44px] rounded-[var(--radius-pill)] bg-ui-media-viewer-chip hover:bg-ui-media-viewer-chip-hover text-ui-media-viewer-text flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-media-viewer-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ui-media-viewer-bg"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Stage with Swipe */}
      <div
        className="relative w-full h-full max-w-[90vw] max-h-[85vh] flex items-center justify-center touch-pan-y"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handleTouchStart}
        onPointerMove={handleTouchMove}
        onPointerUp={handleTouchEnd}
      >
        <img
          src={currentImage.url}
          alt={
            language === 'bn'
              ? `প্রতিবেদনের সহায়ক ছবি ${toBanglaNum(currentIndex + 1)}`
              : `Supporting image ${currentIndex + 1} for this report`
          }
          className="max-w-full max-h-[80vh] object-contain rounded-[var(--radius-card)] md:rounded-[var(--radius-modal)] ui-radius-modal shadow-[var(--elevation-2xl)] pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Left/Right Navigation Controls */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label={language === 'bn' ? 'পূর্ববর্তী ছবি' : 'Previous image'}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-[var(--radius-pill)] bg-ui-media-overlay-strong hover:bg-ui-media-overlay-max text-ui-media-viewer-text border border-ui-media-viewer-border-strong flex items-center justify-center cursor-pointer transition-all shadow-[var(--elevation-md)] z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-media-viewer-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ui-media-viewer-bg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label={language === 'bn' ? 'পরবর্তী ছবি' : 'Next image'}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-[var(--radius-pill)] bg-ui-media-overlay-strong hover:bg-ui-media-overlay-max text-ui-media-viewer-text border border-ui-media-viewer-border-strong flex items-center justify-center cursor-pointer transition-all shadow-[var(--elevation-md)] z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-media-viewer-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ui-media-viewer-bg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom Thumbnails */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-2 p-2 overflow-x-auto z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 p-1.5 rounded-[var(--radius-control)] bg-ui-media-overlay-strong border border-ui-media-viewer-border backdrop-blur-md">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={
                  language === 'bn'
                    ? `ছবি ${toBanglaNum(idx + 1)} দেখুন`
                    : `Go to image ${idx + 1}`
                }
                className={`w-12 h-12 rounded-[var(--radius-badge-md)] overflow-hidden border-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-media-viewer-focus ${
                  idx === currentIndex
                    ? 'border-ui-accent scale-105 opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img
                  src={img.url}
                  srcSet={img.srcSet || getResponsiveImageAttrs(img.url, { isCompact: true }).srcSet}
                  sizes="48px"
                  alt={
                    language === 'bn'
                      ? `ছোট ছবি ${toBanglaNum(idx + 1)}`
                      : `Thumbnail ${idx + 1}`
                  }
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
