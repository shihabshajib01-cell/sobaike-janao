import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { ReviewSection } from './ReviewSection';
import {
  MobJusticeDetails,
  MOB_JUSTICE_TRIGGER_OPTIONS,
  MOB_JUSTICE_SPREAD_OPTIONS,
  MOB_JUSTICE_OUTCOME_OPTIONS,
  MOB_JUSTICE_ONGOING_OPTIONS,
  getMobJusticeOptionLabel,
} from '../../data/mobJusticeOptions';

export interface MobJusticeReviewSummaryProps {
  details: MobJusticeDetails;
  language: 'bn' | 'en';
  onEdit: () => void;
}

const ReviewValue: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[var(--type-fixed-12)] font-[var(--font-weight-semibold)] text-ui-content-muted">{label}</p>
    <p className="text-[var(--type-fixed-135)] sm:text-[var(--type-fixed-14)] font-[var(--font-weight-medium)] text-ui-content-primary leading-relaxed">{value}</p>
  </div>
);

export const MobJusticeReviewSummary: React.FC<MobJusticeReviewSummaryProps> = ({
  details,
  language,
  onEdit,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isBn = language === 'bn';

  return (
    <ReviewSection
      id="review-mob-justice-details"
      isOpen={isOpen}
      onToggle={() => setIsOpen((open) => !open)}
      title={isBn ? 'মব সহিংসতার বিস্তারিত' : 'Mob Justice Details'}
      summary={getMobJusticeOptionLabel(MOB_JUSTICE_OUTCOME_OPTIONS, details.outcome, language)}
      icon={<Users className="w-4 h-4" />}
      onEdit={onEdit}
      editLabel={isBn ? 'সম্পাদনা' : 'Edit'}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <ReviewValue
          label={isBn ? 'ঘটনার কারণ / অভিযোগ' : 'Trigger / allegation'}
          value={getMobJusticeOptionLabel(MOB_JUSTICE_TRIGGER_OPTIONS, details.trigger, language)}
        />
        <ReviewValue
          label={isBn ? 'অভিযোগ বা ডাক ছড়ানোর মাধ্যম' : 'How the accusation / call spread'}
          value={getMobJusticeOptionLabel(MOB_JUSTICE_SPREAD_OPTIONS, details.spread, language)}
        />
        <ReviewValue
          label={isBn ? 'ঘটনার ফলাফল' : 'Incident outcome'}
          value={getMobJusticeOptionLabel(MOB_JUSTICE_OUTCOME_OPTIONS, details.outcome, language)}
        />
        <ReviewValue
          label={isBn ? 'বর্তমান অবস্থা' : 'Current status'}
          value={getMobJusticeOptionLabel(MOB_JUSTICE_ONGOING_OPTIONS, details.ongoingStatus, language)}
        />
        <ReviewValue
          label={isBn ? 'লক্ষ্য হওয়া ব্যক্তির সংখ্যা' : 'People targeted'}
          value={details.targetedCount === '' ? (isBn ? 'তথ্য দেওয়া হয়নি' : 'Not provided') : details.targetedCount}
        />
      </div>
    </ReviewSection>
  );
};
