import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
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
  reportId,
  onSubmitAnother,
  onClose,
  language,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(reportId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 text-center py-2 text-primary">
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h3 className="text-[22px] md:text-[24px] font-bold text-primary">
          {language === 'bn' ? 'অভিযোগ সফলভাবে জমা হয়েছে!' : 'Complaint Submitted Successfully!'}
        </h3>
        <p className="text-[14px] md:text-[16px] text-secondary max-w-lg mx-auto leading-relaxed">
          {language === 'bn'
            ? 'আপনার অভিযোগ মডারেশন পর্যালোচনার জন্য জমা হয়েছে। দায়িত্বশীল পর্যালোচনার পর পরবর্তী পদক্ষেপ গ্রহণ করা হবে।'
            : 'Your complaint has been submitted for moderation review. Further steps will follow standard moderation review.'}
        </p>
      </div>

      {/* Security Credentials Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-surface border border-subtle max-w-lg mx-auto space-y-4 text-left shadow-2xs">
        {/* Report ID */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-subtle">
          <div>
            <span className="text-[14px] font-bold uppercase tracking-wider text-muted">
              {language === 'bn' ? 'প্রতিবেদন আইডি (Report ID)' : 'Report ID'}
            </span>
            <p className="text-[18px] font-mono font-bold text-primary mt-0.5">{reportId}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyId}
            leftIcon={copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            className="min-h-[44px] text-[14px]"
          >
            {copiedId ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied') : language === 'bn' ? 'কপি' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-2 max-w-lg mx-auto">
        <Button
          id="completion-submit-another-btn"
          type="button"
          variant="primary"
          size="lg"
          onClick={onSubmitAnother}
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="w-full md:w-auto min-h-[44px] text-[16px] px-6"
        >
          {language === 'bn' ? 'আরেকটি অভিযোগ দিন' : 'Submit Another Complaint'}
        </Button>

        <Button
          id="completion-return-home-btn"
          type="button"
          variant="outline"
          size="lg"
          onClick={onClose}
          className="w-full md:w-auto min-h-[44px] text-[16px] px-6"
        >
          {language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Return to Home'}
        </Button>
      </div>
    </div>
  );
};
