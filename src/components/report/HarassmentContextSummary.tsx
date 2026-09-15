import React from 'react';
import { ReportItem } from '../../types/report';
import {
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
  getBilingualOptionLabel,
} from '../../data/harassmentClassification';

export interface HarassmentContextSummaryProps {
  report: ReportItem;
  language: 'bn' | 'en';
}

export const HarassmentContextSummary: React.FC<HarassmentContextSummaryProps> = ({
  report,
  language,
}) => {
  if (
    report.segment !== 'harassment' ||
    (!report.affectedPersonAgeGroup && !report.allegedAbuserRelationship && !report.reportingFor)
  ) {
    return null;
  }

  const rows = [
    report.affectedPersonAgeGroup
      ? {
          label: language === 'bn' ? 'প্রভাবিত ব্যক্তির বয়স' : "Affected person's age group",
          value: getBilingualOptionLabel(
            HARASSMENT_AGE_GROUP_OPTIONS,
            report.affectedPersonAgeGroup,
            language
          ),
        }
      : null,
    report.allegedAbuserRelationship
      ? {
          label: language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক' : 'Relationship with alleged abuser',
          value: getBilingualOptionLabel(
            HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
            report.allegedAbuserRelationship,
            language
          ),
        }
      : null,
    report.reportingFor
      ? {
          label: language === 'bn' ? 'কার জন্য প্রতিবেদন' : 'Reporting for',
          value: getBilingualOptionLabel(
            HARASSMENT_REPORTING_FOR_OPTIONS,
            report.reportingFor,
            language
          ),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (rows.length === 0) return null;

  return (
    <section
      aria-labelledby="harassment-context-heading"
      className="bg-ui-surface border border-ui-stroke-subtle rounded-xl p-4 sm:p-5 space-y-3"
    >
      <h2 id="harassment-context-heading" className="text-[16px] font-bold text-ui-content-primary">
        {language === 'bn' ? 'ঘটনার প্রেক্ষাপট' : 'Incident context'}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle p-3">
            <dt className="text-[12px] font-semibold text-ui-content-muted">{row.label}</dt>
            <dd className="mt-1 text-[14px] font-semibold text-ui-content-primary">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
