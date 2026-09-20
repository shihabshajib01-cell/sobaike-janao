import React, { useMemo } from 'react';
import { ReportItem } from '../../types/report';
import {
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
  BilingualOption,
  HarassmentAgeGroup,
  HarassmentAbuserRelationship,
  HarassmentReportingFor,
} from '../../data/harassmentClassification';
import { toBanglaDigits } from '../../utils/formatters';

export interface HarassmentClassificationBreakdownProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
  activeAgeGroup?: HarassmentAgeGroup | 'all';
  activeAbuserRelationship?: HarassmentAbuserRelationship | 'all';
  activeReportingFor?: HarassmentReportingFor | 'all';
  onSelectAgeGroup?: (value: HarassmentAgeGroup) => void;
  onSelectAbuserRelationship?: (value: HarassmentAbuserRelationship) => void;
  onSelectReportingFor?: (value: HarassmentReportingFor) => void;
}

interface BreakdownColumnProps<T extends string> {
  title: string;
  options: BilingualOption<T>[];
  values: Array<string | undefined>;
  language: 'bn' | 'en';
  activeValue?: T | 'all';
  onSelectValue?: (value: T) => void;
}

const BreakdownColumn = <T extends string,>({
  title,
  options,
  values,
  language,
  activeValue = 'all',
  onSelectValue,
}: BreakdownColumnProps<T>) => {
  const rows = useMemo(() => {
    return options
      .map((option) => ({
        value: option.value,
        label: language === 'bn' ? option.labelBn : option.labelEn,
        count: values.filter((value) => value === option.value).length,
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [options, values, language]);

  const totalClassified = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-4 space-y-3">
      <h3 className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">{title}</h3>
      {rows.length > 0 ? (
        <ul className="space-y-1.5">
          {rows.map((row) => {
            const percentage =
              totalClassified > 0 ? Math.round((row.count / totalClassified) * 100) : 0;
            const displayCount =
              language === 'bn' ? toBanglaDigits(row.count) : row.count;
            const displayPercent =
              language === 'bn' ? toBanglaDigits(percentage) : percentage;
            const isActive = activeValue === row.value;

            return (
              <li key={row.value}>
                <button
                  type="button"
                  onClick={onSelectValue ? () => onSelectValue(row.value) : undefined}
                  aria-pressed={isActive}
                  className={`w-full min-h-[44px] text-left rounded-[var(--radius-badge-md)] px-2 py-1.5 -mx-2 space-y-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                    onSelectValue ? 'cursor-pointer hover:bg-ui-surface-hover' : ''
                  } ${isActive ? 'bg-ui-selected-bg text-ui-selected-text' : ''}`}
                >
                  <span className="flex items-center justify-between gap-3 type-compact">
                    <span className="text-ui-content-secondary min-w-0">{row.label}</span>
                    <span className="font-[var(--font-weight-bold)] text-ui-content-primary shrink-0">
                      {displayCount} <span className="text-ui-content-muted font-[var(--font-weight-medium)]">({displayPercent}%)</span>
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="block w-full h-1.5 rounded-[var(--radius-pill)] bg-ui-surface-subtle overflow-hidden"
                  >
                    <span
                      className="block h-full rounded-[var(--radius-pill)] bg-ui-accent transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="type-compact text-ui-content-muted">
          {language === 'bn' ? 'এই ফিল্টারে পর্যাপ্ত তথ্য নেই।' : 'No classified reports in this view.'}
        </p>
      )}
    </div>
  );
};

export const HarassmentClassificationBreakdown: React.FC<HarassmentClassificationBreakdownProps> = ({
  reports,
  language,
  activeAgeGroup = 'all',
  activeAbuserRelationship = 'all',
  activeReportingFor = 'all',
  onSelectAgeGroup,
  onSelectAbuserRelationship,
  onSelectReportingFor,
}) => {
  const harassmentReports = reports.filter((report) => report.segment === 'harassment');

  if (harassmentReports.length === 0) return null;

  return (
    <section aria-labelledby="harassment-breakdown-heading" className="space-y-3">
      <div className="space-y-0.5">
        <h2 id="harassment-breakdown-heading" className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
          {language === 'bn' ? 'হয়রানি ও নির্যাতন: প্রেক্ষাপট বিশ্লেষণ' : 'Harassment & abuse context'}
        </h2>
        <p className="type-compact text-ui-content-muted">
          {language === 'bn'
            ? 'শুধু প্রকাশিত প্রতিবেদনের বিস্তৃত শ্রেণিভিত্তিক তথ্য দেখানো হচ্ছে; কোনো ব্যক্তির সুনির্দিষ্ট বয়স বা পরিচয় নয়।'
            : 'Broad classifications from published reports only; exact age and victim identity are not shown.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <BreakdownColumn
          title={language === 'bn' ? 'বয়সের গ্রুপ' : 'Age group'}
          options={HARASSMENT_AGE_GROUP_OPTIONS}
          values={harassmentReports.map((report) => report.affectedPersonAgeGroup)}
          language={language}
          activeValue={activeAgeGroup}
          onSelectValue={onSelectAgeGroup}
        />
        <BreakdownColumn
          title={language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক' : 'Relationship with alleged abuser'}
          options={HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS}
          values={harassmentReports.map((report) => report.allegedAbuserRelationship)}
          language={language}
          activeValue={activeAbuserRelationship}
          onSelectValue={onSelectAbuserRelationship}
        />
        <BreakdownColumn
          title={language === 'bn' ? 'কার জন্য প্রতিবেদন' : 'Reporting for'}
          options={HARASSMENT_REPORTING_FOR_OPTIONS}
          values={harassmentReports.map((report) => report.reportingFor)}
          language={language}
          activeValue={activeReportingFor}
          onSelectValue={onSelectReportingFor}
        />
      </div>
    </section>
  );
};
