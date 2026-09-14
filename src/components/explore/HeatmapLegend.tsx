import React from 'react';

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
      className={`bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle rounded-xl p-2.5 shadow-2xs flex flex-col gap-1.5 text-[12px] max-w-[200px] select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-ui-content-primary text-[11px] uppercase tracking-wider">
          {language === 'bn' ? 'প্রতিবেদনের ঘনত্ব' : 'Report concentration'}
        </span>
      </div>

      {/* Continuous Gradient Bar */}
      <div
        aria-hidden="true"
        className="h-2.5 w-full rounded-full border border-ui-stroke-subtle/50"
        style={{
          background:
            'linear-gradient(to right, #2563EB 0%, #06B6D4 30%, #10B981 55%, #F59E0B 80%, #EF4444 100%)',
        }}
      />

      {/* Range Labels */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-ui-content-secondary px-0.5">
        <span>{language === 'bn' ? 'কম' : 'Low'}</span>
        <span>{language === 'bn' ? 'বেশি' : 'High'}</span>
      </div>

      {/* Map Interpretation Note */}
      <div className="text-[10px] text-ui-content-muted leading-tight pt-1.5 border-t border-ui-stroke-subtle/60 mt-0.5">
        {language === 'bn'
          ? 'রঙ একই এলাকায় প্রতিবেদনের ঘনত্ব বোঝায়—ঘটনার তীব্রতা বা সত্যতা নয়।'
          : 'Color shows concentration of reports—not severity or truthfulness.'}
      </div>
    </div>
  );
};

export default HeatmapLegend;
