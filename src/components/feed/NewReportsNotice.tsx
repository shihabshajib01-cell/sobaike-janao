import React from 'react';
import { ArrowUp, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface NewReportsNoticeProps {
  count: number;
  language: 'en' | 'bn';
  isRefreshing?: boolean;
  onRefresh: () => void;
}

export const NewReportsNotice: React.FC<NewReportsNoticeProps> = ({
  count,
  language,
  isRefreshing = false,
  onRefresh,
}) => {
  if (count <= 0) return null;

  const formattedCount = new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US').format(count);
  const label =
    language === 'bn'
      ? `${formattedCount}টি নতুন প্রতিবেদন — রিফ্রেশ করুন`
      : `${formattedCount} new ${count === 1 ? 'report' : 'reports'} — refresh`;

  return (
    <div
      className="sticky top-20 z-30 h-0 flex justify-center pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <Button
        id="home-new-reports-notice"
        type="button"
        variant="primary"
        size="sm"
        isLoading={isRefreshing}
        onClick={onRefresh}
        className="pointer-events-auto ui-radius-pill gap-2 px-4 ui-elevation-selected"
        leftIcon={
          isRefreshing ? (
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
          )
        }
        aria-label={label}
      >
        {label}
      </Button>
    </div>
  );
};
