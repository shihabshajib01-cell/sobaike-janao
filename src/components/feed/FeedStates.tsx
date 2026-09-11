import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { ReportCardSkeleton, ReportFeedSkeleton } from '../ui/LoadingSkeleton';

export const FeedSkeletonCard: React.FC<{ hasMediaPreview?: boolean }> = ({ hasMediaPreview }) => {
  return <ReportCardSkeleton hasMediaPreview={hasMediaPreview} />;
};

export interface FeedLoadingProps {
  count?: number;
  id?: string;
  ariaLabel?: string;
}

export const FeedLoading: React.FC<FeedLoadingProps> = ({
  count = 3,
  id = 'feed-loading-container',
  ariaLabel = 'Loading reports...',
}) => {
  return <ReportFeedSkeleton count={count} id={id} ariaLabel={ariaLabel} />;
};

export interface FeedErrorProps {
  titleBn?: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  onRetry?: () => void;
  language?: 'bn' | 'en';
}

export const FeedError: React.FC<FeedErrorProps> = ({
  titleBn = 'প্রতিবেদন লোড করা যায়নি',
  titleEn = "Couldn't load reports",
  descriptionBn = 'অনুগ্রহ করে আবার চেষ্টা করুন।',
  descriptionEn = 'Please try again.',
  onRetry,
  language = 'bn',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-ui-surface border border-ui-stroke-subtle rounded-2xl max-w-md mx-auto my-6 space-y-3">
      <div className="w-12 h-12 rounded-full bg-ui-error-bg border border-ui-error-border flex items-center justify-center text-ui-error-text">
        <AlertCircle className="w-6 h-6 stroke-[1.5]" />
      </div>
      <div>
        <h3 className="text-[18px] font-bold text-ui-content-primary">
          {language === 'bn' ? titleBn : titleEn}
        </h3>
        <p className="text-[14px] leading-[22px] text-ui-content-secondary max-w-xs mt-1">
          {language === 'bn' ? descriptionBn : descriptionEn}
        </p>
      </div>
      {onRetry && (
        <Button
          size="md"
          variant="outline"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={onRetry}
          className="min-h-[44px]"
        >
          {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
        </Button>
      )}
    </div>
  );
};
