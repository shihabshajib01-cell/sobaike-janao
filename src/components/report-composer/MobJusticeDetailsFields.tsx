import React from 'react';
import { Users } from 'lucide-react';
import { Accordion } from '../ui/Accordion';
import { Select } from '../ui/Select';
import {
  MobJusticeDetails,
  MobJusticeValidationErrors,
  MOB_JUSTICE_TRIGGER_OPTIONS,
  MOB_JUSTICE_SPREAD_OPTIONS,
  MOB_JUSTICE_OUTCOME_OPTIONS,
  MOB_JUSTICE_ONGOING_OPTIONS,
} from '../../data/mobJusticeOptions';

export interface MobJusticeDetailsFieldsProps {
  value: MobJusticeDetails;
  errors?: MobJusticeValidationErrors;
  onChange: (value: MobJusticeDetails) => void;
  language: 'bn' | 'en';
}

export const MobJusticeDetailsFields: React.FC<MobJusticeDetailsFieldsProps> = ({
  value,
  errors = {},
  onChange,
  language,
}) => {
  const mapOptions = (options: Array<{ value: string; labelBn: string; labelEn: string }>) =>
    options.map((option) => ({
      value: option.value,
      label: language === 'bn' ? option.labelBn : option.labelEn,
    }));

  return (
    <Accordion
      id="composer-section-mob-justice"
      isOpen
      collapsible={false}
      onToggle={() => {}}
      title={language === 'bn' ? 'মব সহিংসতার বিস্তারিত' : 'Mob Justice Details'}
      icon={<Users className="w-5 h-5" />}
      hasError={Boolean(errors.trigger || errors.outcome || errors.targetedCount || errors.ongoingStatus)}
    >
      <div className="space-y-4 pt-1 text-left">
        <p className="text-[var(--type-fixed-13)] sm:text-[var(--type-fixed-14)] leading-relaxed text-ui-content-secondary">
          {language === 'bn'
            ? 'ঘটনাটি কীভাবে শুরু হয়েছিল এবং কী ফলাফল হয়েছে—জানা তথ্য দিন। নিশ্চিত না হলে প্রযোজ্য ক্ষেত্রে “জানা নেই” নির্বাচন করুন।'
            : 'Add what is known about how the incident started and what happened. Choose “Unknown” where the information is not known.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="mob-justice-trigger"
            label={language === 'bn' ? 'ঘটনাটি কী কারণে শুরু হয়েছিল?' : 'What triggered the mob incident?'}
            required
            value={value.trigger}
            onChange={(event) =>
              onChange({ ...value, trigger: event.target.value as MobJusticeDetails['trigger'] })
            }
            options={mapOptions(MOB_JUSTICE_TRIGGER_OPTIONS)}
            placeholder={language === 'bn' ? 'কারণ / অভিযোগ নির্বাচন করুন' : 'Select trigger / allegation'}
            error={errors.trigger}
          />

          <Select
            id="mob-justice-spread"
            label={language === 'bn' ? 'অভিযোগ বা ডাক কীভাবে ছড়িয়েছিল?' : 'How did the accusation or call spread?'}
            value={value.spread}
            onChange={(event) =>
              onChange({ ...value, spread: event.target.value as MobJusticeDetails['spread'] })
            }
            options={mapOptions(MOB_JUSTICE_SPREAD_OPTIONS)}
            placeholder={language === 'bn' ? 'জানা থাকলে নির্বাচন করুন' : 'Select if known'}
            helperText={language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
          />

          <Select
            id="mob-justice-outcome"
            label={language === 'bn' ? 'ঘটনার ফলাফল কী ছিল?' : 'What was the incident outcome?'}
            required
            value={value.outcome}
            onChange={(event) =>
              onChange({ ...value, outcome: event.target.value as MobJusticeDetails['outcome'] })
            }
            options={mapOptions(MOB_JUSTICE_OUTCOME_OPTIONS)}
            placeholder={language === 'bn' ? 'ফলাফল নির্বাচন করুন' : 'Select outcome'}
            error={errors.outcome}
          />

          <Select
            id="mob-justice-ongoing-status"
            label={language === 'bn' ? 'ঘটনাটি কি এখনো চলছে?' : 'Is the incident still ongoing?'}
            required
            value={value.ongoingStatus}
            onChange={(event) =>
              onChange({ ...value, ongoingStatus: event.target.value as MobJusticeDetails['ongoingStatus'] })
            }
            options={mapOptions(MOB_JUSTICE_ONGOING_OPTIONS)}
            placeholder={language === 'bn' ? 'অবস্থা নির্বাচন করুন' : 'Select current status'}
            error={errors.ongoingStatus}
          />
        </div>

        <div className="max-w-sm">
          <label htmlFor="mob-justice-targeted-count" className="block type-label text-ui-content-primary mb-1.5">
            {language === 'bn' ? 'কতজন ব্যক্তি মবের লক্ষ্য হয়েছেন?' : 'How many people were targeted?'}
          </label>
          <input
            id="mob-justice-targeted-count"
            type="number"
            min={1}
            max={9999}
            step={1}
            inputMode="numeric"
            value={value.targetedCount}
            onChange={(event) => {
              const rawValue = event.target.value;
              onChange({
                ...value,
                targetedCount: rawValue === '' ? '' : Number(rawValue),
              });
            }}
            aria-invalid={Boolean(errors.targetedCount)}
            aria-describedby={errors.targetedCount ? 'mob-justice-targeted-count-error' : 'mob-justice-targeted-count-helper'}
            className={`w-full min-h-[44px] bg-ui-surface text-ui-content-primary ui-border-default ui-radius-control px-3 py-2 transition-colors focus:outline-none focus:ring-2 ${
              errors.targetedCount
                ? 'border-ui-validation-border focus:ring-ui-validation-focus focus:border-ui-validation-focus'
                : 'border-ui-stroke-default hover:border-ui-stroke-strong focus:ring-ui-focus'
            }`}
            placeholder={language === 'bn' ? 'যেমন: ১' : 'e.g. 1'}
          />
          {errors.targetedCount ? (
            <p id="mob-justice-targeted-count-error" role="alert" className="mt-1.5 type-helper text-ui-validation-text font-[var(--font-weight-medium)]">
              {errors.targetedCount}
            </p>
          ) : (
            <p id="mob-justice-targeted-count-helper" className="mt-1.5 type-helper text-ui-content-muted">
              {language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
            </p>
          )}
        </div>
      </div>
    </Accordion>
  );
};
