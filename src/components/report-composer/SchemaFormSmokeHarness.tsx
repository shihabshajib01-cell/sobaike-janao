import React, { useRef, useState } from 'react';
import { ConfiguredFieldsHandle, ConfiguredFieldsSection } from './ConfiguredFieldsSection';
import { INITIAL_REPORT_FORM } from '../../services/reportFormState';
import { ReportFormData } from '../../services/types';
import { PublicReportingField, PublicReportingForm } from '../../services/reportingFormConfig';
import { Button } from '../ui/Button';
import { AttachedImagePreview } from '../media/ImageAttachmentPicker';

const field = (
  fieldKey: string,
  fieldType: PublicReportingField['fieldType'],
  sortOrder: number,
  overrides: Partial<PublicReportingField> = {}
): PublicReportingField => ({
  fieldKey,
  fieldType,
  storageMode: 'custom_json',
  storageKey: fieldKey,
  labelEn: `Schema ${fieldKey}`,
  labelBn: `স্কিমা ${fieldKey}`,
  required: true,
  active: true,
  sortOrder,
  options: [],
  validation: {},
  config: {},
  ...overrides,
});

const SCHEMA_SMOKE_FORM: PublicReportingForm = {
  subcategoryId: '__schema-smoke',
  schemaId: '__schema-smoke',
  version: 1,
  engineMode: 'schema',
  fields: [
    field('smoke_text', 'text', 1, {
      validation: { minLength: 3, maxLength: 50 },
      placeholderEn: 'Enter text',
      placeholderBn: 'টেক্সট লিখুন',
    }),
    field('smoke_textarea', 'textarea', 2, {
      validation: { minLength: 5, maxLength: 200 },
    }),
    field('smoke_select', 'select', 3, {
      options: [
        { value: 'one', labelEn: 'One', labelBn: 'এক' },
        { value: 'two', labelEn: 'Two', labelBn: 'দুই' },
      ],
    }),
    field('smoke_radio', 'radio', 4, {
      options: [
        { value: 'yes', labelEn: 'Yes', labelBn: 'হ্যাঁ' },
        { value: 'no', labelEn: 'No', labelBn: 'না' },
      ],
    }),
    field('smoke_checkbox', 'checkbox', 5),
    field('smoke_multiselect', 'multiselect', 6, {
      options: [
        { value: 'one', labelEn: 'One', labelBn: 'এক' },
        { value: 'two', labelEn: 'Two', labelBn: 'দুই' },
      ],
    }),
    field('smoke_date', 'date', 7, {
      validation: { min: '2026-01-01', max: '2026-12-31' },
    }),
    field('smoke_time', 'time', 8, {
      validation: { min: '08:00', max: '18:00' },
    }),
    field('smoke_month', 'month', 9, {
      validation: { min: '2026-01', max: '2026-12' },
    }),
    field('smoke_number', 'number', 10, {
      validation: { min: 1, max: 10 },
    }),
    field('smoke_phone', 'phone', 11),
    field('smoke_email', 'email', 12),
    field('smoke_url', 'url', 13),
    field('smoke_location', 'location', 14, {
      storageMode: 'system_block',
      storageKey: 'location',
    }),
    field('smoke_subject', 'subject_party', 15, {
      storageMode: 'system_block',
      storageKey: 'subject_party',
    }),
    field('smoke_evidence', 'evidence', 16, {
      storageMode: 'system_block',
      storageKey: 'evidence',
    }),
    field('smoke_privacy', 'privacy', 17, {
      storageMode: 'system_block',
      storageKey: 'privacy',
    }),
  ],
};

const buildInitialData = (): ReportFormData => ({
  ...INITIAL_REPORT_FORM,
  segment: 'public_safety',
  currentStep: 3,
  subcategoryId: '__schema-smoke',
  formSchemaVersion: 1,
  formEngineMode: 'schema',
  customFieldAnswers: {},
});

const buildValidData = (): ReportFormData => ({
  ...buildInitialData(),
  reportedSubject: 'Schema smoke subject',
  evidenceDescription: 'Schema smoke supporting information',
  location: {
    ...INITIAL_REPORT_FORM.location,
    division: 'Dhaka',
    district: 'Dhaka',
  },
  customFieldAnswers: {
    smoke_text: 'Valid schema text',
    smoke_textarea: 'Valid schema textarea value',
    smoke_select: 'one',
    smoke_radio: 'yes',
    smoke_checkbox: true,
    smoke_multiselect: ['one'],
    smoke_date: '2026-06-15',
    smoke_time: '12:30',
    smoke_month: '2026-06',
    smoke_number: '5',
    smoke_phone: '+8801712345678',
    smoke_email: 'schema@example.com',
    smoke_url: 'https://example.com/schema-smoke',
  },
});

export const SchemaFormSmokeHarness: React.FC = () => {
  const sectionRef = useRef<ConfiguredFieldsHandle>(null);
  const [formData, setFormData] = useState<ReportFormData>(() => buildInitialData());
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [pendingImages, setPendingImages] = useState<AttachedImagePreview[]>([]);

  const updateFormData = (updates: Partial<ReportFormData>) => {
    setFormData((current) => ({ ...current, ...updates }));
    setValidationState('idle');
  };

  const validate = () => {
    setValidationState(sectionRef.current?.validateAndProceed() ? 'valid' : 'invalid');
  };

  return (
    <div id="schema-form-smoke" className="mx-auto w-full max-w-3xl p-4 md:p-6 space-y-5">
      <div className="space-y-1">
        <h1 className="type-h1 text-role-on-surface">Schema form runtime smoke</h1>
        <p className="type-body text-role-on-surface-muted">
          CI-only fixture for the Admin-driven public schema engine.
        </p>
      </div>

      <ConfiguredFieldsSection
        ref={sectionRef}
        form={SCHEMA_SMOKE_FORM}
        language="en"
        formData={formData}
        pendingImages={pendingImages}
        onPendingImagesChange={setPendingImages}
        onUpdateFormData={updateFormData}
      />

      <div className="flex flex-wrap gap-3">
        <Button id="schema-smoke-validate" type="button" variant="primary" onClick={validate}>
          Validate fixture
        </Button>
        <Button
          id="schema-smoke-load-valid"
          type="button"
          variant="outline"
          onClick={() => {
            setFormData(buildValidData());
            setPendingImages([]);
            setValidationState('idle');
          }}
        >
          Load valid fixture
        </Button>
      </div>

      <p
        id="schema-smoke-status"
        role="status"
        aria-live="polite"
        data-schema-valid={validationState === 'valid' ? 'true' : validationState === 'invalid' ? 'false' : 'idle'}
        className="type-helper text-role-on-surface-muted"
      >
        {validationState === 'valid'
          ? 'Schema fixture valid'
          : validationState === 'invalid'
            ? 'Schema fixture invalid'
            : 'Schema fixture ready'}
      </p>
    </div>
  );
};

export default SchemaFormSmokeHarness;
