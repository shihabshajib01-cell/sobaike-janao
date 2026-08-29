import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { PublicReportImage } from '../../types/report';
import { ImageViewer } from './ImageViewer';
import { getResponsiveImageAttrs, MediaCellLayout } from '../../utils/imageUtils';

interface ReportMediaGridProps {
  images: PublicReportImage[];
  language: 'bn' | 'en';
  isCompact?: boolean; // For feed cards
}

export const ReportMediaGrid: React.FC<ReportMediaGridProps> = ({
  images,
  language,
  isCompact = false,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  if (!images || images.length === 0) return null;

  // Ensure images are sorted by sortOrder
  const sortedImages = [...images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const count = sortedImages.length;

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveImageIndex(index);
  };

  // Render a single image cell with safe fallback and responsive srcset/sizes
  const renderCell = (
    img: PublicReportImage,
    index: number,
    className: string,
    layout: MediaCellLayout = 'single',
    overlayCount?: number
  ) => {
    const isBroken = brokenImages[img.id];
    const imageAttrs = getResponsiveImageAttrs(img.url, {
      isCompact,
      layout,
      customSrcSet: img.srcSet,
      customSizes: img.sizes,
    });

    return (
      <div
        key={img.id}
        onClick={(e) => handleImageClick(e, index)}
        className={`relative overflow-hidden bg-surface-subtle cursor-pointer select-none group transition-opacity hover:opacity-95 ${className}`}
      >
        {isBroken ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-muted bg-surface-subtle text-center space-y-1">
            <ImageOff className="w-5 h-5 text-muted stroke-[1.5]" />
            <span className="text-[14px]">
              {language === 'bn' ? 'ছবিটি দেখানো যাচ্ছে না' : 'Image unavailable'}
            </span>
          </div>
        ) : (
          <img
            src={imageAttrs.src}
            srcSet={imageAttrs.srcSet}
            sizes={imageAttrs.sizes}
            alt={
              language === 'bn'
                ? `প্রতিবেদনের সহায়ক ছবি ${index + 1}`
                : `Supporting image ${index + 1} for this report`
            }
            loading={imageAttrs.loading}
            decoding={imageAttrs.decoding}
            onError={() => handleImageError(img.id)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        )}

        {/* +N Overlay for 5+ images on the 4th cell */}
        {overlayCount && overlayCount > 0 ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white">
            <span className="text-[20px] md:text-[24px] font-bold tracking-tight">
              +{overlayCount}
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-2 select-none" onClick={(e) => e.stopPropagation()}>
      {!isCompact && (
        <div className="flex items-center justify-between text-[14px] text-secondary font-medium">
          <span className="font-semibold text-primary">
            {language === 'bn' ? 'সহায়ক ছবি' : 'Supporting images'} ({count})
          </span>
          <span className="text-muted">
            {language === 'bn' ? 'বড় করে দেখতে ট্যাপ করুন' : 'Click/tap to expand'}
          </span>
        </div>
      )}

      {/* Media container: Outer radius 12px, Internal gap 4px */}
      <div className="rounded-[12px] overflow-hidden border border-subtle bg-surface-subtle">
        {/* 1 Image: Full width frame */}
        {count === 1 && (
          <div className={`w-full ${isCompact ? 'h-[170px] sm:h-[210px] md:h-[340px]' : 'h-[220px] md:h-[340px]'}`}>
            {renderCell(sortedImages[0], 0, 'w-full h-full', 'single')}
          </div>
        )}

        {/* 2 Images: 2 Equal columns */}
        {count === 2 && (
          <div className={`grid grid-cols-2 gap-[4px] ${isCompact ? 'h-[130px] sm:h-[160px] md:h-[280px]' : 'h-[180px] md:h-[280px]'}`}>
            {renderCell(sortedImages[0], 0, 'w-full h-full', 'half')}
            {renderCell(sortedImages[1], 1, 'w-full h-full', 'half')}
          </div>
        )}

        {/* 3 Images: Large first image (2/3 width) + 2 stacked right (1/3 width) on desktop/tablet, or stacked on mobile */}
        {count === 3 && (
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-[4px] ${isCompact ? 'h-[200px] sm:h-[240px] md:h-[300px]' : 'h-[300px] md:h-[300px]'}`}>
            <div className={`md:col-span-2 ${isCompact ? 'h-[120px] sm:h-[150px] md:h-full' : 'h-[180px] md:h-full'}`}>
              {renderCell(sortedImages[0], 0, 'w-full h-full', 'two-thirds')}
            </div>
            <div className={`grid grid-cols-2 md:grid-cols-1 gap-[4px] ${isCompact ? 'h-[80px] sm:h-[90px] md:h-full' : 'h-[120px] md:h-full'}`}>
              {renderCell(sortedImages[1], 1, 'w-full h-full', 'one-third')}
              {renderCell(sortedImages[2], 2, 'w-full h-full', 'one-third')}
            </div>
          </div>
        )}

        {/* 4 Images: 2x2 Equal grid */}
        {count === 4 && (
          <div className={`grid grid-cols-2 gap-[4px] ${isCompact ? 'h-[170px] sm:h-[200px] md:h-[340px]' : 'h-[240px] md:h-[340px]'}`}>
            {renderCell(sortedImages[0], 0, 'w-full h-full', 'half')}
            {renderCell(sortedImages[1], 1, 'w-full h-full', 'half')}
            {renderCell(sortedImages[2], 2, 'w-full h-full', 'half')}
            {renderCell(sortedImages[3], 3, 'w-full h-full', 'half')}
          </div>
        )}

        {/* 5 or 6 Images: 4 visible cells with +N on the 4th cell */}
        {count >= 5 && (
          <div className={`grid grid-cols-2 gap-[4px] ${isCompact ? 'h-[170px] sm:h-[200px] md:h-[340px]' : 'h-[240px] md:h-[340px]'}`}>
            {renderCell(sortedImages[0], 0, 'w-full h-full', 'half')}
            {renderCell(sortedImages[1], 1, 'w-full h-full', 'half')}
            {renderCell(sortedImages[2], 2, 'w-full h-full', 'half')}
            {renderCell(sortedImages[3], 3, 'w-full h-full', 'half', count - 3)}
          </div>
        )}
      </div>

      {/* Lightbox / Fullscreen Viewer */}
      {activeImageIndex !== null && (
        <ImageViewer
          images={sortedImages}
          initialIndex={activeImageIndex}
          isOpen={true}
          onClose={() => setActiveImageIndex(null)}
          language={language}
        />
      )}
    </div>
  );
};
