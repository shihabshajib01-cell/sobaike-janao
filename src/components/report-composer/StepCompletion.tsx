import React from 'react';
import {
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface StepCompletionProps {
  reportId: string;
  onSubmitAnother: () => void;
  onClose: () => void;
  language: 'bn' | 'en';
}

export const StepCompletion: React.FC<StepCompletionProps> = ({
  onSubmitAnother,
  onClose,
  language,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-6 text-center py-2 text-ui-content-primary"
    >
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-full bg-ui-success-bg text-ui-success-text border border-ui-success-border flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h3 className="text-[22px] md:text-[24px] font-bold text-ui-content-primary">
          {language === 'bn' ? 'প্রতিবেদন জমা হয়েছে' : 'Report submitted'}
        </h3>
        <p className="text-[14px] md:text-[16px] text-ui-content-secondary max-w-lg mx-auto leading-relaxed">
          {language === 'bn'
            ? 'আপনার প্রতিবেদন পর্যালোচনার জন্য জমা হয়েছে।'
            : 'Your report has been submitted for review.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-2 max-w-lg mx-auto">
        <Button
          id="completion-submit-another-btn"
          type="button"
          variant="primary"
          size="lg"
          onClick={onSubmitAnother}
          leftIcon={<PlusCircle className="w-4 h-4" aria-hidden="true" />}
          className="w-full md:w-auto min-h-[44px] text-[16px] px-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          {language === 'bn' ? 'আরেকটি প্রতিবেদন জমা দিন' : 'Submit another report'}
        </Button>

        <Button
          id="completion-return-home-btn"
          type="button"
          variant="outline"
          size="lg"
          onClick={onClose}
          className="w-full md:w-auto min-h-[44px] text-[16px] px-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          {language === 'bn' ? 'হোমে ফিরে যান' : 'Return to home'}
        </Button>
      </div>
    </div>
  );
};
