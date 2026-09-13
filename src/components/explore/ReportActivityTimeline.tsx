import React, { useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { toBanglaDigits } from '../../utils/formatters';

export interface ReportActivityTimelineProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
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

      const year = d.getFullYear();
      const month = d.getMonth();
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
    const anchorYear = latestDate.getFullYear();
    const anchorMonth = latestDate.getMonth();

    const sequence: MonthBucket[] = [];
    const countMap = new Map<string, number>();

    for (let offset = 5; offset >= 0; offset--) {
      const targetDate = new Date(anchorYear, anchorMonth - offset, 1);
      const year = targetDate.getFullYear();
      const monthIndex = targetDate.getMonth();
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
        <h2 className="text-[16px] sm:text-[18px] font-bold text-ui-content-primary">
          {language === 'bn' ? 'সময় অনুযায়ী প্রতিবেদন' : 'Reports over time'}
        </h2>
        <span className="text-[12px] sm:text-[13px] text-ui-content-muted font-normal">
          {language === 'bn'
            ? 'সর্বশেষ প্রকাশিত প্রতিবেদনের মাস পর্যন্ত ৬ মাস'
            : 'Six months ending with the latest published report'}
        </span>
      </div>

      {hasNoValidDates ? (
        /* Neutral empty state for when reports have no valid publication dates */
        <div
          id="activity-timeline-no-data"
          className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-6 text-center text-[13px] sm:text-[14px] text-ui-content-muted"
        >
          {language === 'bn'
            ? 'বর্তমান প্রতিবেদনগুলোর জন্য নির্ভরযোগ্য প্রকাশের তারিখ পাওয়া যায়নি।'
            : 'No valid publication-date data is available for these reports.'}
        </div>
      ) : (
        /* Accessible 6-month Timeline Column Chart Card */
        <div
          id="activity-timeline-card"
          className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-4 sm:p-5 space-y-4"
        >
          {summaryText && (
            <p className="text-[12.5px] sm:text-[13px] text-ui-content-secondary font-medium">
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
            className="w-full pt-2"
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
                  <div
                    key={m.key}
                    id={`timeline-col-${m.key}`}
                    role="listitem"
                    aria-label={accessibleText}
                    className="flex flex-col items-center min-w-0"
                  >
                    {/* Numeric count above bar */}
                    <span
                      className="text-[11px] sm:text-[12px] font-semibold text-ui-content-primary mb-1.5 tabular-nums text-center select-none"
                      aria-hidden="true"
                    >
                      {displayCount}
                    </span>
                    <span className="sr-only">{accessibleText}</span>

                    {/* Column Track & Bar */}
                    <div
                      role="presentation"
                      aria-hidden="true"
                      className="w-full max-w-[32px] sm:max-w-[48px] h-24 sm:h-28 bg-ui-surface-subtle rounded-md flex flex-col justify-end p-0.5 border border-ui-stroke-subtle/50"
                    >
                      {isZero ? (
                        <div className="w-full h-1 bg-ui-stroke-subtle rounded-sm" />
                      ) : (
                        <div
                          className="w-full bg-ui-accent rounded-t-sm transition-all duration-300 min-h-[4px]"
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        />
                      )}
                    </div>

                    {/* Month & Year Labels */}
                    <div
                      className="flex flex-col items-center mt-2 text-center select-none"
                      aria-hidden="true"
                    >
                      <span className="text-[11px] sm:text-[12.5px] font-medium text-ui-content-primary leading-tight truncate">
                        {shortLabel}
                      </span>
                      <span className="text-[9.5px] sm:text-[10.5px] text-ui-content-muted leading-tight mt-0.5">
                        {yearLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Coverage note if any reports lack valid publication dates */}
      {hasUnmappedDates && (
        <p className="text-[11.5px] sm:text-[12px] text-ui-content-muted/90 pt-0.5">
          {language === 'bn'
            ? 'বৈধ প্রকাশের তারিখ থাকা প্রতিবেদনগুলোর ভিত্তিতে সময়ভিত্তিক বিশ্লেষণ দেখানো হয়েছে।'
            : 'Activity analysis includes reports with valid publication dates.'}
        </p>
      )}
    </section>
  );
};
