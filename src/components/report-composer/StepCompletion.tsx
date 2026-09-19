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
      className="space-y-4 text-center text-ui-content-primary"
    >
      {/* Success Badge */}
      <div className="w-12 h-12 rounded-[var(--radius-pill)] bg-ui-success-bg text-ui-success-text border border-ui-success-border flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
          {language === 'bn' ? 'প্রতিবেদন জমা হয়েছে' : 'Report submitted'}
        </h3>
        <p className="type-body text-ui-content-secondary max-w-md mx-auto">
          {language === 'bn'
            ? 'আপনার প্রতিবেদন পর্যালোচনার জন্য জমা হয়েছে।'
            : 'Your report has been submitted for review.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1 max-w-md mx-auto">
        <Button
          id="completion-submit-another-btn"
          type="button"
          variant="primary"
          size="md"
          onClick={onSubmitAnother}
          leftIcon={<PlusCircle className="w-4 h-4" aria-hidden="true" />}
          className="w-full sm:w-auto min-h-[44px] type-label px-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          {language === 'bn' ? 'আরেকটি প্রতিবেদন জমা দিন' : 'Submit another report'}
        </Button>

        <Button
          id="completion-return-home-btn"
          type="button"
          variant="outline"
          size="md"
          onClick={onClose}
          className="w-full sm:w-auto min-h-[44px] type-label px-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          {language === 'bn' ? 'হোমে ফিরে যান' : 'Return to home'}
        </Button>
      </div>
    </div>
  );
};
