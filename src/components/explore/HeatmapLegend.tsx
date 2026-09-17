import React from 'react';
import { HEATMAP_TOKENS } from '../../theme/data-viz-tokens';

interface HeatmapLegendProps {
  language: 'bn' | 'en';
  className?: string;
}

export const HeatmapLegend: React.FC<HeatmapLegendProps> = ({
  language,
  className = '',
}) => {
  return (
    <div
      id="heatmap-legend"
      role="region"
      aria-label={language === 'bn' ? 'হিটম্যাপ নির্দেশিকা' : 'Heatmap legend'}
      className={`bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle rounded-xl p-2 sm:p-2.5 shadow-2xs flex flex-col gap-1 text-[11px] max-w-[170px] sm:max-w-[190px] select-none ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-ui-content-primary text-[10px] sm:text-[11px] uppercase tracking-wider">
          {language === 'bn' ? 'প্রতিবেদনের ঘনত্ব' : 'Report density'}
        </span>
      </div>

      <div
        aria-hidden="true"
        className="h-2 w-full rounded-full border border-ui-stroke-subtle/50"
        style={{ background: HEATMAP_TOKENS.cssGradient }}
      />

      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-ui-content-secondary px-0.5">
        <span>{language === 'bn' ? 'কম' : 'Low'}</span>
        <span>{language === 'bn' ? 'মাঝারি' : 'Medium'}</span>
        <span>{language === 'bn' ? 'বেশি' : 'High'}</span>
      </div>

      <p className="text-[9.5px] sm:text-[10px] leading-tight text-ui-content-muted pt-1 border-t border-ui-stroke-subtle/50">
        {language === 'bn'
          ? 'এটি প্রতিবেদনের ঘনত্ব দেখায়, তীব্রতা বা যাচাই নয়।'
          : 'Shows report concentration, not severity or verification.'}
      </p>
    </div>
  );
};

export default HeatmapLegend;
