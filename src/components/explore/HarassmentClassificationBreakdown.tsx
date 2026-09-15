import React, { useMemo } from 'react';
import { ReportItem } from '../../types/report';
import {
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
  BilingualOption,
} from '../../data/harassmentClassification';
import { toBanglaDigits } from '../../utils/formatters';

export interface HarassmentClassificationBreakdownProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
}

interface BreakdownColumnProps {
  title: string;
  options: BilingualOption<string>[];
  values: Array<string | undefined>;
  language: 'bn' | 'en';
}

const BreakdownColumn: React.FC<BreakdownColumnProps> = ({ title, options, values, language }) => {
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

  return (
    <div className="rounded-xl border border-ui-stroke-subtle bg-ui-surface p-4 space-y-3">
      <h3 className="text-[14px] font-bold text-ui-content-primary">{title}</h3>
      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.value} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-ui-content-secondary min-w-0">{row.label}</span>
              <span className="font-bold text-ui-content-primary shrink-0">
                {language === 'bn' ? toBanglaDigits(row.count) : row.count}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ui-content-muted">
          {language === 'bn' ? 'এই ফিল্টারে পর্যাপ্ত তথ্য নেই।' : 'No classified reports in this view.'}
        </p>
      )}
    </div>
  );
};

export const HarassmentClassificationBreakdown: React.FC<HarassmentClassificationBreakdownProps> = ({
  reports,
  language,
}) => {
  const harassmentReports = reports.filter((report) => report.segment === 'harassment');

  if (harassmentReports.length === 0) return null;

  return (
    <section aria-labelledby="harassment-breakdown-heading" className="space-y-3">
      <div className="space-y-0.5">
        <h2 id="harassment-breakdown-heading" className="text-[17px] font-bold text-ui-content-primary">
          {language === 'bn' ? 'হয়রানি ও নির্যাতন: প্রেক্ষাপট বিশ্লেষণ' : 'Harassment & abuse context'}
        </h2>
        <p className="text-[13px] text-ui-content-muted">
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
        />
        <BreakdownColumn
          title={language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক' : 'Relationship with alleged abuser'}
          options={HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS}
          values={harassmentReports.map((report) => report.allegedAbuserRelationship)}
          language={language}
        />
        <BreakdownColumn
          title={language === 'bn' ? 'কার জন্য প্রতিবেদন' : 'Reporting for'}
          options={HARASSMENT_REPORTING_FOR_OPTIONS}
          values={harassmentReports.map((report) => report.reportingFor)}
          language={language}
        />
      </div>
    </section>
  );
};
