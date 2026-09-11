import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
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

  const isSingleOption = allSubcategories.length === 1;

  const headerTitle = language === 'bn' ? (segmentInfo?.nameBn || SECTIONS[segment].nameBn) : (segmentInfo?.nameEn || SECTIONS[segment].nameEn);
  const helperText =
    language === 'bn'
      ? 'অভিযোগের ধরন নির্বাচন করুন।'
      : 'Select a complaint type.';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Minimal Header: Title + Short Helper Text */}
      <div className="space-y-1 text-left">
        <h3 className="text-[18px] sm:text-[20px] md:text-[22px] font-bold text-ui-content-primary leading-tight">
          {headerTitle}
        </h3>
        <p className="text-[13px] sm:text-[14px] md:text-[15px] leading-normal text-ui-content-secondary">
          {helperText}
        </p>
      </div>

      {/* 2. Direct Compact Complaint Category Cards */}
      <div
        className={`grid gap-2.5 sm:gap-3 ${
          isSingleOption ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
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
              className={`p-3 sm:p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-1.5 min-h-[68px] sm:min-h-[76px] focus:outline-none focus:ring-2 focus:ring-ui-focus select-none ${
                isSingleOption ? 'col-span-full w-full' : ''
              } ${
                isSelected
                  ? 'border-2 border-ui-accent bg-ui-accent-soft shadow-2xs'
                  : 'border-ui-stroke-subtle bg-ui-surface'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <h4 className="text-[14.5px] sm:text-[15.5px] font-semibold text-ui-content-primary leading-snug">
                  {itemName}
                </h4>

                {/* Radio Selection Visual Indicator */}
                <div
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'border-ui-accent bg-ui-accent text-ui-content-inverse'
                      : 'border-ui-stroke-subtle bg-ui-surface text-transparent'
                  }`}
                >
                  {isSelected ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-ui-content-inverse" />
                  ) : null}
                </div>
              </div>

              {itemDesc && (
                <p className="text-[12px] sm:text-[13px] leading-[1.4] text-ui-content-secondary font-normal">
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


