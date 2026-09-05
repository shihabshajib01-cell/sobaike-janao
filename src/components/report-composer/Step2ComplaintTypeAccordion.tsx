import React, { useMemo } from 'react';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { SubcategoryOption } from '../../data/reportOptions';
import { useTaxonomy } from '../../services/taxonomyService';

export interface Step2ComplaintTypeAccordionProps {
  segment: SectionKey;
  selectedSubcategoryId: string;
  onSelectSubcategory: (subcategoryId: string, option: SubcategoryOption) => void;
  onBack?: () => void;
  onNext?: () => void;
  language: 'bn' | 'en';
}

export const Step2ComplaintTypeAccordion: React.FC<Step2ComplaintTypeAccordionProps> = ({
  segment,
  selectedSubcategoryId,
  onSelectSubcategory,
  language,
}) => {
  const { getSubcategories, getSegment } = useTaxonomy();
  const allSubcategories = useMemo(() => getSubcategories(segment), [segment, getSubcategories]);
  const segmentInfo = getSegment(segment);

  const headerTitle = language === 'bn' ? (segmentInfo?.nameBn || SECTIONS[segment].nameBn) : (segmentInfo?.nameEn || SECTIONS[segment].nameEn);
  const helperText =
    language === 'bn'
      ? 'আপনার সমস্যার সাথে মিল আছে এমন ধরন নির্বাচন করুন।'
      : 'Select the type that matches your issue.';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Minimal Header: Title + Short Helper Text */}
      <div className="space-y-1 text-left">
        <h3 className="text-[18px] sm:text-[20px] md:text-[22px] font-bold text-primary leading-tight">
          {headerTitle}
        </h3>
        <p className="text-[13px] sm:text-[14px] md:text-[15px] leading-normal text-secondary">
          {helperText}
        </p>
      </div>

      {/* 2. Direct Compact Complaint Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {allSubcategories.map((item) => {
          const isSelected = selectedSubcategoryId === item.id;
          const itemName = language === 'bn' ? item.nameBn : item.nameEn;
          const itemDesc = language === 'bn' ? item.descriptionBn : item.descriptionEn;

          return (
            <div
              key={item.id}
              id={`subcategory-option-${item.id}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelectSubcategory(item.id, item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSubcategory(item.id, item);
                }
              }}
              className={`p-3 sm:p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-1.5 min-h-[68px] sm:min-h-[76px] focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] select-none ${
                allSubcategories.length === 1 ? 'sm:col-span-2' : ''
              } ${
                isSelected
                  ? 'border-2 border-accent bg-accent-soft shadow-2xs'
                  : 'border-subtle bg-surface hover:bg-surface-elevated hover:border-strong'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <h4 className="text-[14.5px] sm:text-[15.5px] font-semibold text-primary leading-snug">
                  {itemName}
                </h4>

                {/* Radio Selection Visual Indicator */}
                <div
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent text-inverse'
                      : 'border-subtle bg-surface text-transparent'
                  }`}
                >
                  {isSelected ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : null}
                </div>
              </div>

              {itemDesc && (
                <p className="text-[12px] sm:text-[13px] leading-[1.4] text-secondary font-normal">
                  {itemDesc}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


