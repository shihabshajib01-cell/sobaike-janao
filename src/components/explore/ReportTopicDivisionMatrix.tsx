import React, { useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { toBanglaDigits } from '../../utils/formatters';
import { CategoryIcon } from '../branding/CategoryIcon';

export interface ReportTopicDivisionMatrixProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
  activeCategory?: SectionKey | 'all';
  activeDivision?: string;
  onSelectCell?: (category: SectionKey, division: string) => void;
}

const CATEGORY_KEYS = Object.keys(SECTIONS) as SectionKey[];

export const ReportTopicDivisionMatrix: React.FC<ReportTopicDivisionMatrixProps> = ({
  reports,
  language,
  activeCategory = 'all',
  activeDivision = 'all',
  onSelectCell,
}) => {
  const { rows, visibleDivisions, recognizedCount } = useMemo(() => {
    const divisionTotals = new Map<string, number>();
    const matrix = new Map<string, number>();
    let recognized = 0;

    reports.forEach((report) => {
      if (!CATEGORY_KEYS.includes(report.segment as SectionKey)) return;

      const districtEn = (report.districtEn || '').toLowerCase().trim();
      const districtBn = (report.districtBn || '').trim();
      if (!districtEn && !districtBn) return;

      const district = BANGLADESH_DISTRICTS.find(
        (item) =>
          item.nameEn.toLowerCase() === districtEn ||
          item.nameBn === districtBn ||
          item.id === districtEn
      );
      if (!district) return;

      recognized += 1;
      divisionTotals.set(
        district.divisionId,
        (divisionTotals.get(district.divisionId) || 0) + 1
      );

      const key = `${report.segment}::${district.divisionId}`;
      matrix.set(key, (matrix.get(key) || 0) + 1);
    });

    const divisions = DIVISIONS
      .filter((division) => (divisionTotals.get(division.id) || 0) > 0)
      .sort((a, b) => {
        const countDiff =
          (divisionTotals.get(b.id) || 0) - (divisionTotals.get(a.id) || 0);
        if (countDiff !== 0) return countDiff;
        return a.nameEn.localeCompare(b.nameEn);
      });

    const categoryRows = CATEGORY_KEYS.map((category) => {
      const cells = divisions.map((division) => ({
        division,
        count: matrix.get(`${category}::${division.id}`) || 0,
      }));
      return {
        category,
        total: cells.reduce((sum, cell) => sum + cell.count, 0),
        cells,
      };
    })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);

    return {
      rows: categoryRows,
      visibleDivisions: divisions,
      recognizedCount: recognized,
    };
  }, [reports]);

  if (recognizedCount === 0 || visibleDivisions.length === 0 || rows.length === 0) {
    return null;
  }

  return (
    <section
      id="explore-topic-division-matrix"
      aria-labelledby="topic-division-matrix-heading"
      className="space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <div>
          <h2
            id="topic-division-matrix-heading"
            className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary"
          >
            {language === 'bn' ? 'বিষয় × বিভাগ তুলনা' : 'Topic × division comparison'}
          </h2>
          <p className="type-compact text-ui-content-secondary mt-0.5">
            {language === 'bn'
              ? 'বর্তমান নির্বাচনে কোন বিষয়ে কোন বিভাগে কত প্রতিবেদন আছে।'
              : 'Compare the current report selection across topics and divisions.'}
          </p>
        </div>
        {onSelectCell && (
          <span className="type-compact text-ui-content-muted">
            {language === 'bn' ? 'ঘর চাপলে দুই ফিল্টারই প্রয়োগ হবে' : 'Select a cell to apply both filters'}
          </span>
        )}
      </div>

      <div className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-2 sm:p-4 shadow-[var(--elevation-2xs)] overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-separate border-spacing-0">
          <caption className="sr-only">
            {language === 'bn'
              ? 'ক্যাটাগরি ও বিভাগ অনুযায়ী প্রকাশিত প্রতিবেদনের সংখ্যা'
              : 'Published report counts by category and division'}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="bg-ui-surface w-[132px] min-w-[132px] max-w-[132px] md:sticky md:left-0 md:z-20 md:w-[176px] md:min-w-[176px] md:max-w-[176px] text-left px-2 py-2 type-compact font-[var(--font-weight-bold)] text-ui-content-primary md:border-r md:border-ui-stroke-subtle"
              >
                {language === 'bn' ? 'বিষয়' : 'Topic'}
              </th>
              {visibleDivisions.map((division) => (
                <th
                  key={division.id}
                  scope="col"
                  className="min-w-[72px] max-w-[88px] px-1 py-2 text-center type-compact font-[var(--font-weight-semibold)] text-ui-content-secondary"
                >
                  {language === 'bn' ? division.nameBn : division.nameEn}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const category = SECTIONS[row.category];
              const categoryLabel =
                language === 'bn' ? category.shortNameBn : category.shortNameEn;

              return (
                <tr key={row.category}>
                  <th
                    scope="row"
                    className="bg-ui-surface w-[132px] min-w-[132px] max-w-[132px] md:sticky md:left-0 md:z-20 md:w-[176px] md:min-w-[176px] md:max-w-[176px] px-2 py-1.5 text-left md:border-r md:border-ui-stroke-subtle"
                  >
                    <span className="flex min-w-0 items-center gap-2 type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">
                      <span className="shrink-0">
                        <CategoryIcon section={row.category} size="xs" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{categoryLabel}</span>
                    </span>
                  </th>
                  {row.cells.map(({ division, count }) => {
                    const divisionLabel =
                      language === 'bn' ? division.nameBn : division.nameEn;
                    const active =
                      activeCategory === row.category &&
                      activeDivision.toLowerCase() === division.nameEn.toLowerCase();
                    const displayCount =
                      language === 'bn' ? toBanglaDigits(count) : count;

                    return (
                      <td key={division.id} className="p-1 text-center">
                        <button
                          type="button"
                          disabled={count === 0 || !onSelectCell}
                          aria-pressed={active}
                          onClick={() => onSelectCell?.(row.category, division.nameEn)}
                          aria-label={
                            language === 'bn'
                              ? `${categoryLabel}, ${divisionLabel} বিভাগ: ${toBanglaDigits(count)}টি প্রতিবেদন`
                              : `${categoryLabel}, ${divisionLabel} Division: ${count} reports`
                          }
                          className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-[var(--radius-badge-md)] border type-compact font-[var(--font-weight-bold)] tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                            count > 0
                              ? 'cursor-pointer border-ui-stroke-subtle hover:border-ui-stroke-strong'
                              : 'cursor-default border-transparent text-ui-content-muted'
                          } ${
                            active
                              ? 'ring-2 ring-ui-selected-border bg-ui-selected-bg text-ui-selected-text border-ui-selected-border'
                              : count > 0
                                ? 'bg-ui-surface-subtle/80 text-ui-content-primary'
                                : 'bg-ui-page'
                          }`}
                          style={
                            count > 0 && !active
                              ? {
                                  borderColor: `var(--sec-${row.category}-border)`,
                                  backgroundColor: `var(--sec-${row.category}-bg)`,
                                  color: `var(--sec-${row.category}-text)`,
                                }
                              : undefined
                          }
                        >
                          {displayCount}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {recognizedCount < reports.length && (
        <p className="type-compact text-ui-content-secondary">
          {language === 'bn'
            ? 'জেলা শনাক্ত করা গেছে এমন প্রতিবেদনগুলোর ভিত্তিতে এই তুলনা দেখানো হয়েছে।'
            : 'This comparison includes reports with recognized district data.'}
        </p>
      )}
    </section>
  );
};
