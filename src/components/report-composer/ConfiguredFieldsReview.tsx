import React from 'react';
import { PublicReportingForm } from '../../services/reportingFormConfig';

interface ConfiguredFieldsReviewProps {
  form: PublicReportingForm | null;
  language: 'bn' | 'en';
  answers: Record<string, unknown>;
  onEdit: () => void;
}

const formatValue = (
  field: NonNullable<PublicReportingForm>['fields'][number],
  value: unknown,
  language: 'bn' | 'en'
): string => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        const option = field.options.find((item) => item.value === entry);
        return option
          ? language === 'bn'
            ? option.labelBn
            : option.labelEn
          : String(entry);
      })
      .join(', ');
  }

  if (typeof value === 'boolean') {
    return value
      ? language === 'bn'
        ? 'হ্যাঁ'
        : 'Yes'
      : language === 'bn'
        ? 'না'
        : 'No';
  }

  const option = field.options.find((item) => item.value === String(value ?? ''));
  if (option) {
    return language === 'bn' ? option.labelBn : option.labelEn;
  }

  return String(value ?? '');
};

export const ConfiguredFieldsReview: React.FC<ConfiguredFieldsReviewProps> = ({
  form,
  language,
  answers,
  onEdit,
}) => {
  const fields =
    form?.engineMode === 'schema'
      ? form.fields
          .filter(
            (field) =>
              field.active &&
              field.storageMode === 'custom_json' &&
              answers[field.storageKey] !== undefined &&
              answers[field.storageKey] !== null &&
              String(answers[field.storageKey]).trim() !== ''
          )
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [];

  if (fields.length === 0) return null;

  return (
    <section className="rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
          {language === 'bn' ? 'অতিরিক্ত তথ্য' : 'Additional information'}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-[36px] rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 type-compact font-[var(--font-weight-semibold)] text-ui-content-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
        </button>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.fieldKey}
            className={
              field.fieldType === 'textarea' || field.fieldType === 'multiselect'
                ? 'rounded-[var(--radius-control)] bg-ui-surface-subtle p-3 sm:col-span-2'
                : 'rounded-[var(--radius-control)] bg-ui-surface-subtle p-3'
            }
          >
            <dt className="type-compact text-ui-content-muted">
              {language === 'bn' ? field.labelBn : field.labelEn}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">
              {formatValue(field, answers[field.storageKey], language)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default ConfiguredFieldsReview;
