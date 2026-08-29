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
  title = 'তথ্য লোড করতে সমস্যা হয়েছে',
  message = 'দয়া করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন অথবা পুনরায় চেষ্টা করুন।',
  onRetry,
  retryLabel = 'পুনরায় চেষ্টা করুন (Retry)',
  className = '',
}) => {
  return (
    <div
      id={id}
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center bg-red-50/60 dark:bg-[#2B1416]/50 border border-red-200 dark:border-[#6B252A] rounded-2xl max-w-md mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-[#3E1A1E] flex items-center justify-center text-red-600 dark:text-[#FCA5A5] mb-4 shrink-0">
        <AlertCircle className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="text-[18px] font-bold text-primary mb-1.5">{title}</h3>
      <p className="text-[14px] leading-[22px] text-secondary max-w-xs mb-5">{message}</p>
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
