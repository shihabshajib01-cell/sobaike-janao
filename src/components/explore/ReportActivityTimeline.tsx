import React, { useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { toBanglaDigits } from '../../utils/formatters';

export interface ReportActivityTimelineProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
  activeMonthKey?: string | null;
  onSelectMonth?: (monthKey: string) => void;
}

interface MonthBucket {
  key: string; // YYYY-MM
  year: number;
  monthIndex: number; // 0..11
  labelBn: string;
  labelEn: string;
  fullLabelBn: string;
  fullLabelEn: string;
  yearDisplayBn: string;
  yearDisplayEn: string;
  count: number;
}

const BANGLA_MONTH_SHORT = [
  'জানু',
  'ফেব',
  'মার্চ',
  'এপ্রি',
  'মে',
  'জুন',
  'জুল',
  'আগ',
  'সেপ',
  'অক্টো',
  'নভে',
  'ডিসে',
];

const BANGLA_MONTH_FULL = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const ENGLISH_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const ENGLISH_MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const ReportActivityTimeline: React.FC<ReportActivityTimelineProps> = ({
  reports,
  language,
  activeMonthKey = null,
  onSelectMonth,
}) => {
  const totalReports = reports.length;

  const {
    months,
    maxMonthlyCount,
    validDatedReportCount,
    summaryText,
  } = useMemo(() => {
    if (totalReports === 0) {
      return {
        months: [],
        maxMonthlyCount: 0,
        validDatedReportCount: 0,
        summaryText: null,
      };
    }

    let validCount = 0;
    let latestTimestamp = -Infinity;
    const validReportKeys: string[] = [];

    // 1. Process valid dates only from publishedAt
    reports.forEach((rep) => {
      if (!rep.publishedAt || typeof rep.publishedAt !== 'string') {
        return;
      }
      const d = new Date(rep.publishedAt);
      const time = d.getTime();
      if (isNaN(time)) {
        return;
      }

      validCount += 1;
      if (time > latestTimestamp) {
        latestTimestamp = time;
      }

      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      validReportKeys.push(key);
    });

    if (validCount === 0) {
      return {
        months: [],
        maxMonthlyCount: 0,
        validDatedReportCount: 0,
        summaryText: null,
      };
    }

    // 2. Determine anchor month and build 6 consecutive calendar months
    const latestDate = new Date(latestTimestamp);
    const anchorYear = latestDate.getUTCFullYear();
    const anchorMonth = latestDate.getUTCMonth();

    const sequence: MonthBucket[] = [];
    const countMap = new Map<string, number>();

    for (let offset = 5; offset >= 0; offset--) {
      const targetDate = new Date(Date.UTC(anchorYear, anchorMonth - offset, 1));
      const year = targetDate.getUTCFullYear();
      const monthIndex = targetDate.getUTCMonth();
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      sequence.push({
        key,
        year,
        monthIndex,
        labelBn: BANGLA_MONTH_SHORT[monthIndex],
        labelEn: ENGLISH_MONTH_SHORT[monthIndex],
        fullLabelBn: BANGLA_MONTH_FULL[monthIndex],
        fullLabelEn: ENGLISH_MONTH_FULL[monthIndex],
        yearDisplayBn: toBanglaDigits(year),
        yearDisplayEn: String(year),
        count: 0,
      });

      countMap.set(key, 0);
    }

    // 3. Count reports per month in the 6-month sequence
    validReportKeys.forEach((key) => {
      if (countMap.has(key)) {
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    });

    sequence.forEach((m) => {
      m.count = countMap.get(m.key) || 0;
    });

    const maxCount = Math.max(...sequence.map((m) => m.count));

    // 4. Optional factual summary
    let summary: string | null = null;
    if (maxCount > 0) {
      const topMonths = sequence.filter((m) => m.count === maxCount);
      if (topMonths.length === 1) {
        const top = topMonths[0];
        const monthDisplay =
          language === 'bn'
            ? `${top.fullLabelBn} ${top.yearDisplayBn}`
            : `${top.fullLabelEn} ${top.yearDisplayEn}`;
        summary =
          language === 'bn'
            ? `সবচেয়ে বেশি প্রতিবেদন প্রকাশিত হয়েছে: ${monthDisplay}`
            : `Most active publication month: ${monthDisplay}`;
      } else {
        summary =
          language === 'bn'
            ? 'একাধিক মাসে সর্বোচ্চ সংখ্যক প্রতিবেদন প্রকাশিত হয়েছে।'
            : 'Multiple months share the highest publication count.';
      }
    }

    return {
      months: sequence,
      maxMonthlyCount: maxCount,
      validDatedReportCount: validCount,
      summaryText: summary,
    };
  }, [reports, totalReports, language]);

  // If filtered reports is 0, return null per specification
  if (totalReports === 0) {
    return null;
  }

  const hasNoValidDates = validDatedReportCount === 0;
  const hasUnmappedDates =
    validDatedReportCount > 0 && validDatedReportCount < totalReports;

  return (
    <section
      id="explore-report-activity-timeline"
      aria-label={
        language === 'bn' ? 'সময় অনুযায়ী প্রতিবেদন' : 'Reports over time'
      }
      className="space-y-4 mb-2"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
        <h2 className="type-h4 font-[var(--font-weight-bold)] text-ui-content-primary">
          {language === 'bn' ? 'সময় অনুযায়ী প্রতিবেদন' : 'Reports over time'}
        </h2>
        <span className="type-compact text-ui-content-secondary font-[var(--font-weight-regular)]">
          {onSelectMonth
            ? language === 'bn'
              ? 'মাস চাপলে ওই সময়ের প্রতিবেদন দেখাবে'
              : 'Select a month to filter reports'
            : language === 'bn'
              ? 'সর্বশেষ প্রকাশিত প্রতিবেদনের মাস পর্যন্ত ৬ মাস'
              : 'Six months ending with the latest published report'}
        </span>
      </div>

      {hasNoValidDates ? (
        /* Neutral empty state for when reports have no valid publication dates */
        <div
          id="activity-timeline-no-data"
          className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-6 text-center type-compact text-ui-content-secondary shadow-[var(--elevation-2xs)]"
        >
          {language === 'bn'
            ? 'বর্তমান প্রতিবেদনগুলোর জন্য নির্ভরযোগ্য প্রকাশের তারিখ পাওয়া যায়নি।'
            : 'No valid publication-date data is available for these reports.'}
        </div>
      ) : (
        /* Accessible 6-month Timeline Column Chart Card */
        <div
          id="activity-timeline-card"
          className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-3.5 sm:p-4 space-y-3.5 shadow-[var(--elevation-2xs)]"
        >
          {summaryText && (
            <p className="type-compact text-ui-content-secondary font-[var(--font-weight-medium)]">
              {summaryText}
            </p>
          )}

          <div
            role="region"
            aria-label={
              language === 'bn'
                ? 'গত ৬ মাসের প্রতিবেদন কার্যক্রম চার্ট'
                : 'Six-month report activity chart'
            }
            className="w-full pt-1"
          >
            <div
              role="list"
              className="grid grid-cols-6 gap-1.5 sm:gap-3 items-end"
            >
              {months.map((m) => {
                const heightPercent =
                  maxMonthlyCount > 0
                    ? Math.round((m.count / maxMonthlyCount) * 100)
                    : 0;
                const isZero = m.count === 0;
                const displayCount =
                  language === 'bn' ? toBanglaDigits(m.count) : m.count;
                const shortLabel = language === 'bn' ? m.labelBn : m.labelEn;
                const fullLabel =
                  language === 'bn' ? m.fullLabelBn : m.fullLabelEn;
                const yearLabel =
                  language === 'bn'
                    ? `’${toBanglaDigits(String(m.year).slice(2))}`
                    : `’${String(m.year).slice(2)}`;
                const accessibleText =
                  language === 'bn'
                    ? `${fullLabel} ${m.yearDisplayBn}: ${toBanglaDigits(m.count)}টি প্রতিবেদন`
                    : `${fullLabel} ${m.yearDisplayEn}: ${m.count} ${m.count === 1 ? 'report' : 'reports'}`;

                return (
                  <button
                    key={m.key}
                    id={`timeline-col-${m.key}`}
                    type="button"
                    role="listitem"
                    aria-label={accessibleText}
                    aria-pressed={activeMonthKey === m.key}
                    onClick={onSelectMonth ? () => onSelectMonth(m.key) : undefined}
                    disabled={!onSelectMonth}
                    className={`flex flex-col items-center min-w-0 rounded-[var(--radius-badge-md)] px-1 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                      onSelectMonth ? 'cursor-pointer hover:bg-ui-surface-subtle/70' : ''
                    } ${activeMonthKey === m.key ? 'bg-ui-surface-subtle' : ''}`}
                  >
                    {/* Numeric count above bar */}
                    <span
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary mb-1.5 tabular-nums text-center select-none"
                      aria-hidden="true"
                    >
                      {displayCount}
                    </span>
                    <span className="sr-only">{accessibleText}</span>

                    {/* Column Track & Bar */}
                    <div
                      role="presentation"
                      aria-hidden="true"
                      className="w-full max-w-[32px] sm:max-w-[44px] h-20 sm:h-24 bg-ui-surface-subtle rounded-[var(--radius-badge-sm)] flex flex-col justify-end p-0.5 border border-ui-stroke-subtle/50"
                    >
                      {isZero ? (
                        <div className="w-full h-1 bg-ui-stroke-subtle rounded-[var(--radius-compact)]" />
                      ) : (
                        <div
                          className="w-full bg-ui-accent rounded-t-sm transition-all duration-300 min-h-[4px]"
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        />
                      )}
                    </div>

                    {/* Month & Year Labels */}
                    <div
                      className="flex flex-col items-center mt-1.5 text-center select-none"
                      aria-hidden="true"
                    >
                      <span className="type-compact font-[var(--font-weight-medium)] text-ui-content-primary leading-tight truncate">
                        {shortLabel}
                      </span>
                      <span className="type-compact text-ui-content-secondary leading-tight mt-0.5">
                        {yearLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Coverage note if any reports lack valid publication dates */}
      {hasUnmappedDates && (
        <p className="type-compact text-ui-content-secondary pt-0.5">
          {language === 'bn'
            ? 'বৈধ প্রকাশের তারিখ থাকা প্রতিবেদনগুলোর ভিত্তিতে সময়ভিত্তিক বিশ্লেষণ দেখানো হয়েছে।'
            : 'Activity analysis includes reports with valid publication dates.'}
        </p>
      )}
    </section>
  );
};
