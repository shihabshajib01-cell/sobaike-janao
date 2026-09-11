import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  id?: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  id,
  title = 'তথ্য লোড করা যায়নি',
  message = 'অনুগ্রহ করে আবার চেষ্টা করুন।',
  onRetry,
  retryLabel = 'আবার চেষ্টা করুন',
  className = '',
}) => {
  return (
    <div
      id={id}
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center bg-ui-error-bg border border-ui-error-border rounded-2xl max-w-md mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-ui-error-border/30 flex items-center justify-center text-ui-error-text mb-4 shrink-0">
        <AlertCircle className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="text-[18px] font-bold text-ui-content-primary mb-1.5">{title}</h3>
      <p className="text-[14px] leading-[22px] text-ui-content-secondary max-w-xs mb-5">{message}</p>
      {onRetry && (
        <Button
          size="md"
          variant="outline"
          leftIcon={<RotateCcw className="w-4 h-4" />}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
