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

  const sectionStyles = {
    background: `var(--sec-${segment}-bg)`,
    border: `var(--sec-${segment}-primary)`,
    primary: `var(--sec-${segment}-primary)`,
  };

  const selectAndFocus = (index: number) => {
    const next = allSubcategories[index];
    if (!next) return;
    onSelectSubcategory(next.id, next);
    window.requestAnimationFrame(() => {
      document.getElementById(`subcategory-option-${next.id}`)?.focus();
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Minimal Header: Title + Short Helper Text */}
      <div className="space-y-1 text-left">
        <h3 className="type-h3 font-[var(--font-weight-semibold)] text-ui-content-primary">
          {headerTitle}
        </h3>
        <p className="type-body text-ui-content-secondary">
          {helperText}
        </p>
      </div>

      {/* 2. Direct Compact Complaint Category Cards */}
      <div
        role="radiogroup"
        aria-label={helperText}
        className={`grid gap-2.5 sm:gap-3 ${
          isSingleOption ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {allSubcategories.map((item, index) => {
          const isSelected = selectedSubcategoryId === item.id;
          const itemName = language === 'bn' ? item.nameBn : item.nameEn;
          const itemDesc = language === 'bn' ? item.descriptionBn : item.descriptionEn;

          return (
            <div
              key={item.id}
              id={`subcategory-option-${item.id}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!selectedSubcategoryId && index === 0) ? 0 : -1}
              onClick={() => onSelectSubcategory(item.id, item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSubcategory(item.id, item);
                  return;
                }
                if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
                e.preventDefault();
                if (e.key === 'Home') return selectAndFocus(0);
                if (e.key === 'End') return selectAndFocus(allSubcategories.length - 1);
                const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = (index + delta + allSubcategories.length) % allSubcategories.length;
                selectAndFocus(nextIndex);
              }}
              className={`report-composer-card p-3 sm:p-3.5 ui-radius-control ui-border-default text-left cursor-pointer transition-colors flex flex-col justify-between gap-1.5 min-h-[68px] sm:min-h-[76px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus select-none ${
                isSingleOption ? 'col-span-full w-full' : ''
              } ${
                isSelected
                  ? 'ui-elevation-selected'
                  : 'border-ui-stroke-default bg-ui-surface'
              }`}
              style={{
                backgroundColor: isSelected ? sectionStyles.background : undefined,
                borderColor: isSelected ? sectionStyles.border : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2.5">
                <h4 className="type-h4 text-ui-content-primary">
                  {itemName}
                </h4>

                {/* Radio Selection Visual Indicator */}
                <div
                  className={`w-5 h-5 rounded-[var(--radius-pill)] flex items-center justify-center ui-border-default shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-ui-surface'
                      : 'border-ui-stroke-default bg-ui-surface'
                  }`}
                  style={{
                    borderColor: isSelected ? sectionStyles.primary : undefined,
                  }}
                >
                  {isSelected ? (
                    <div
                      className="w-2 h-2 rounded-[var(--radius-pill)]"
                      style={{ backgroundColor: sectionStyles.primary }}
                    />
                  ) : null}
                </div>
              </div>

              {itemDesc && (
                <p className="type-helper text-ui-content-secondary">
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


