import React from 'react';
import { ArrowLeft, ArrowRight, Send, Loader2, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ReportComposerFooterProps {
  currentStep: number;
  totalSteps?: number;
  language: 'bn' | 'en';
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canContinue: boolean;
  canSubmit?: boolean;
  isSubmitting?: boolean;
  submittingText?: string;
}

export const ReportComposerFooter: React.FC<ReportComposerFooterProps> = ({
  currentStep,
  language,
  onClose,
  onBack,
  onNext,
  onSubmit,
  canContinue,
  canSubmit = true,
  isSubmitting = false,
  submittingText,
}) => {

  return (
    <div className="sticky bottom-0 z-20 bg-surface border-t border-subtle px-4 md:px-8 py-3.5 flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
      {/* Left-side action (Cancel or Back) */}
      {currentStep === 1 ? (
        <Button
          id="composer-footer-cancel-btn"
          type="button"
          variant="ghost"
          size="lg"
          onClick={onClose}
          leftIcon={<X className="w-4 h-4" />}
          className="min-h-[44px] text-[16px] text-muted hover:text-primary"
        >
          {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
        </Button>
      ) : (
        <Button
          id="composer-footer-back-btn"
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="min-h-[44px] text-[16px]"
        >
          {language === 'bn' ? 'পূর্ববর্তী' : 'Back'}
        </Button>
      )}

      {/* Right-side primary action (Continue / Review / Submit) */}
      {currentStep === 1 && (
        <Button
          id="composer-footer-step1-next-btn"
          type="button"
          variant="primary"
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="min-h-[44px] text-[16px] px-6"
        >
          {language === 'bn' ? 'পরবর্তী ধাপে যান' : 'Continue'}
        </Button>
      )}

      {currentStep === 2 && (
        <Button
          id="composer-footer-step2-next-btn"
          type="button"
          variant="primary"
          size="lg"
          disabled={!canContinue}
          onClick={onNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="min-h-[44px] text-[16px] px-6"
        >
          {language === 'bn' ? 'বিবরণ প্রদানে যান' : 'Continue to Details'}
        </Button>
      )}

      {currentStep === 3 && (
        <Button
          id="composer-footer-step3-review-btn"
          type="button"
          variant="primary"
          size="lg"
          onClick={onNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="min-h-[44px] text-[16px] px-6"
        >
          {language === 'bn' ? 'পর্যালোচনা ও জমা দিন' : 'Review & Submit'}
        </Button>
      )}

      {currentStep === 4 && (
        <Button
          id="composer-footer-step4-submit-btn"
          type="button"
          variant="primary"
          size="lg"
          disabled={isSubmitting || !canSubmit}
          onClick={onSubmit}
          leftIcon={
            isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )
          }
          className="min-h-[44px] text-[16px] px-6"
        >
          {isSubmitting
            ? submittingText ||
              (language === 'bn' ? 'প্রতিবেদন জমা হচ্ছে...' : 'Submitting...')
            : language === 'bn'
            ? 'প্রতিবেদন জমা দিন'
            : 'Submit Complaint'}

        </Button>
      )}
    </div>
  );
};
