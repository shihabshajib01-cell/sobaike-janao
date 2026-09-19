import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReportItem } from '../../types/report';
import { ReportCard } from './ReportCard';

export interface VirtualizedReportFeedProps {
  reports: ReportItem[];
  pageSize?: number;
  className?: string;
}

interface VirtualizedReportPageProps {
  reports: ReportItem[];
  pageIndex: number;
}

const VIRTUAL_PAGE_ROOT_MARGIN = '1800px 0px';

const VirtualizedReportPage: React.FC<VirtualizedReportPageProps> = React.memo(
  ({ reports, pageIndex }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const measuredHeightRef = useRef(0);
    const [isMounted, setIsMounted] = useState(true);
    const [placeholderHeight, setPlaceholderHeight] = useState<number | null>(null);

    useEffect(() => {
      const node = containerRef.current;
      if (!node || typeof IntersectionObserver === 'undefined') {
        setIsMounted(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;

          if (entry.isIntersecting) {
            setIsMounted(true);
          } else if (measuredHeightRef.current > 0) {
            setIsMounted(false);
          }
        },
        {
          root: null,
          rootMargin: VIRTUAL_PAGE_ROOT_MARGIN,
          threshold: 0,
        }
      );

      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
      if (!isMounted) return;

      const node = containerRef.current;
      if (!node) return;

      const measure = () => {
        const bounds = node.getBoundingClientRect();
        const nextHeight = Math.max(1, Math.ceil(bounds.height));
        const previousHeight = measuredHeightRef.current;

        if (nextHeight === previousHeight) return;

        if (
          previousHeight > 0 &&
          bounds.bottom < 0 &&
          typeof window !== 'undefined'
        ) {
          const delta = nextHeight - previousHeight;
          if (Math.abs(delta) > 1) {
            window.scrollBy({
              top: delta,
              left: 0,
              behavior: 'instant' as ScrollBehavior,
            });
          }
        }

        measuredHeightRef.current = nextHeight;
        setPlaceholderHeight(nextHeight);
      };

      measure();

      if (typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
      }

      const resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }, [isMounted, reports]);

    return (
      <div
        ref={containerRef}
        data-virtualized-report-page={pageIndex}
        data-mounted={isMounted ? 'true' : 'false'}
        className="home-feed-virtual-page"
        style={
          !isMounted && placeholderHeight
            ? { height: `${placeholderHeight}px` }
            : undefined
        }
      >
        {isMounted && (
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    );
  },
  (previous, next) =>
    previous.pageIndex === next.pageIndex &&
    previous.reports.length === next.reports.length &&
    previous.reports.every((report, index) => report === next.reports[index])
);

VirtualizedReportPage.displayName = 'VirtualizedReportPage';

export const VirtualizedReportFeed: React.FC<VirtualizedReportFeedProps> = ({
  reports,
  pageSize = 10,
  className = '',
}) => {
  const pages = useMemo(() => {
    const nextPages: ReportItem[][] = [];
    for (let index = 0; index < reports.length; index += pageSize) {
      nextPages.push(reports.slice(index, index + pageSize));
    }
    return nextPages;
  }, [reports, pageSize]);

  return (
    <div
      id="home-virtualized-feed"
      data-loaded-count={reports.length}
      data-page-size={pageSize}
      className={`space-y-3 ${className}`.trim()}
    >
      {pages.map((pageReports, pageIndex) => (
        <VirtualizedReportPage
          key={pageReports[0]?.id || `page-${pageIndex}`}
          reports={pageReports}
          pageIndex={pageIndex}
        />
      ))}
    </div>
  );
};
