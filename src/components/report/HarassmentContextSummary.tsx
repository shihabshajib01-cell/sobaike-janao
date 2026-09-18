import React from 'react';
import { ReportItem } from '../../types/report';
import {
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
  getBilingualOptionLabel,
} from '../../data/harassmentClassification';
import {
  SEXUAL_HARASSMENT_AGE_GROUP_OPTIONS,
  SEXUAL_HARASSMENT_CONTEXT_OPTIONS,
  SEXUAL_HARASSMENT_FREQUENCY_OPTIONS,
  SEXUAL_HARASSMENT_RELATIONSHIP_OPTIONS,
  SEXUAL_HARASSMENT_TYPE_OPTIONS,
  getSexualHarassmentOptionLabel,
} from '../../data/sexualHarassmentOptions';

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
    (!report.affectedPersonAgeGroup &&
      !report.allegedAbuserRelationship &&
      !report.reportingFor &&
      !report.sexualHarassmentType &&
      !report.sexualHarassmentContext &&
      !report.sexualHarassmentInstitution &&
      !report.reporterName)
  ) {
    return null;
  }

  const rows = [
    report.affectedPersonAgeGroup
      ? {
          label: language === 'bn' ? 'প্রভাবিত ব্যক্তির বয়স' : "Affected person's age group",
          value: getBilingualOptionLabel(
            report.subcategoryId === 'sexual-harassment'
              ? SEXUAL_HARASSMENT_AGE_GROUP_OPTIONS
              : HARASSMENT_AGE_GROUP_OPTIONS,
            report.affectedPersonAgeGroup,
            language
          ),
        }
      : null,
    report.allegedAbuserRelationship
      ? {
          label: language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক' : 'Relationship with alleged abuser',
          value: getBilingualOptionLabel(
            report.subcategoryId === 'sexual-harassment'
              ? SEXUAL_HARASSMENT_RELATIONSHIP_OPTIONS
              : HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
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
    report.subcategoryId === 'sexual-harassment' && report.sexualHarassmentType
      ? {
          label: language === 'bn' ? 'হয়রানির ধরন' : 'Type of harassment',
          value: getSexualHarassmentOptionLabel(
            SEXUAL_HARASSMENT_TYPE_OPTIONS,
            report.sexualHarassmentType,
            language
          ),
        }
      : null,
    report.subcategoryId === 'sexual-harassment' && report.sexualHarassmentContext
      ? {
          label: language === 'bn' ? 'ঘটনার প্রেক্ষাপট' : 'Incident context',
          value: getSexualHarassmentOptionLabel(
            SEXUAL_HARASSMENT_CONTEXT_OPTIONS,
            report.sexualHarassmentContext,
            language
          ),
        }
      : null,
    report.subcategoryId === 'sexual-harassment' && report.frequency
      ? {
          label: language === 'bn' ? 'পুনরাবৃত্তি' : 'Frequency',
          value: getSexualHarassmentOptionLabel(
            SEXUAL_HARASSMENT_FREQUENCY_OPTIONS,
            report.frequency,
            language
          ),
        }
      : null,
    report.subcategoryId === 'sexual-harassment' && report.sexualHarassmentInstitution
      ? {
          label: language === 'bn' ? 'প্রতিষ্ঠান / সংস্থা' : 'Institution / organization',
          value: report.sexualHarassmentInstitution,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section
      aria-labelledby="harassment-context-heading"
      className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-4 sm:p-5 space-y-3"
    >
      <h2 id="harassment-context-heading" className="type-label font-[var(--font-weight-bold)] text-ui-content-primary">
        {language === 'bn' ? 'ঘটনার প্রেক্ষাপট' : 'Incident context'}
      </h2>
      {rows.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-[var(--radius-badge-md)] bg-ui-surface-subtle border border-ui-stroke-subtle p-3">
              <dt className="type-compact font-[var(--font-weight-semibold)] text-ui-content-muted">{row.label}</dt>
              <dd className="mt-1 type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {report.reporterName && (
        <div className="pt-3 border-t border-ui-stroke-subtle space-y-1">
          <p className="type-compact font-[var(--font-weight-semibold)] text-ui-content-muted">
            {language === 'bn' ? 'প্রকাশ্য প্রতিবেদকের নাম' : 'Public reporter name'}
          </p>
          <p className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">{report.reporterName}</p>
          <p className="type-compact leading-relaxed text-ui-content-secondary">
            {language === 'bn'
              ? 'প্রতিবেদক প্রকাশ্য পরিচয়ের অনুরোধ ও সম্মতি দেওয়ায় শুধু নামটি দেখানো হচ্ছে; যোগাযোগের তথ্য ব্যক্তিগত থাকে।'
              : 'Only the reporter name is shown because public identity was requested and confirmed; contact information remains private.'}
          </p>
        </div>
      )}
    </section>
  );
};
