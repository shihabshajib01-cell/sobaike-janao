import React from 'react';
import { Layers } from 'lucide-react';
import { PublicConfiguredReportField } from '../../services/publicReportService';

interface PublicConfiguredFieldsCardProps {
  fields: PublicConfiguredReportField[];
  language: 'bn' | 'en';
}

const formatValue = (value: unknown, language: 'bn' | 'en'): string => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
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
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
      .map((item) => String(item))
      .join(', ');
  }
  return String(value ?? '');
};

export const PublicConfiguredFieldsCard: React.FC<PublicConfiguredFieldsCardProps> = ({
  fields,
  language,
}) => {
  const visible = fields.filter((field) => formatValue(field.value, language).trim());
  if (visible.length === 0) return null;

  return (
    <section
      aria-labelledby="configured-report-fields-title"
      className="space-y-3 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface-subtle p-4"
    >
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-ui-content-secondary" aria-hidden="true" />
        <h2
          id="configured-report-fields-title"
          className="type-h4 text-ui-content-primary"
        >
          {language === 'bn' ? 'অতিরিক্ত প্রতিবেদন তথ্য' : 'Additional report information'}
        </h2>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        {visible.map((field) => (
          <div
            key={field.fieldKey}
            className={
              field.fieldType === 'textarea' || field.fieldType === 'multiselect'
                ? 'space-y-1 sm:col-span-2'
                : 'space-y-1'
            }
          >
            <dt className="type-meta text-ui-content-muted">
              {language === 'bn' ? field.labelBn : field.labelEn}
            </dt>
            <dd className="whitespace-pre-wrap type-body font-[var(--font-weight-medium)] text-ui-content-primary">
              {formatValue(field.value, language)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default PublicConfiguredFieldsCard;
