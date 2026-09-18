import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import {
  PublicReportingField,
  PublicReportingForm,
} from '../../services/reportingFormConfig';
import { ReportFormData } from '../../services/types';
import {
  AttachedImagePreview,
  ImageAttachmentPicker,
} from '../media/ImageAttachmentPicker';
import {
  BANGLADESH_DISTRICTS,
  DIVISIONS,
  getDistrictByStoredName,
  getDistrictsByDivision,
  getDivisionByStoredName,
} from '../../data/districts';
import {
  getUpazilaByStoredName,
  getUpazilasByDistrict,
} from '../../data/upazilas';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { TextField } from '../ui/TextField';
import { TextAreaField } from '../ui/TextAreaField';
import { DateField } from '../ui/DateField';
import { TimeField } from '../ui/TimeField';
import { MonthField } from '../ui/MonthField';
import { RadioGroup } from '../ui/RadioGroup';
import { isValidEmail, isValidHttpUrl, isValidPhone } from '../ui/formValidation';
import { NumberField } from '../ui/NumberField';

export interface ConfiguredFieldsHandle {
  validateAndProceed: () => boolean;
}

interface ConfiguredFieldsSectionProps {
  form: PublicReportingForm | null;
  language: 'bn' | 'en';
  formData: ReportFormData;
  pendingImages: AttachedImagePreview[];
  onPendingImagesChange: (images: AttachedImagePreview[]) => void;
  onUpdateFormData: (updates: Partial<ReportFormData>) => void;
}

const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'boolean') return false;
  return String(value).trim() === '';
};

const getLabel = (field: PublicReportingField, language: 'bn' | 'en') =>
  language === 'bn' ? field.labelBn : field.labelEn;

export const ConfiguredFieldsSection = forwardRef<
  ConfiguredFieldsHandle,
  ConfiguredFieldsSectionProps
>(
  (
    {
      form,
      language,
      formData,
      pendingImages,
      onPendingImagesChange,
      onUpdateFormData,
    },
    ref
  ) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fields = useMemo(
      () =>
        form?.engineMode === 'schema'
          ? [...form.fields]
              .filter((field) => field.active)
              .sort((a, b) => a.sortOrder - b.sortOrder)
          : [],
      [form]
    );

    const customAnswers = formData.customFieldAnswers || {};

    const readValue = (field: PublicReportingField): unknown => {
      if (field.storageMode === 'custom_json') {
        return customAnswers[field.storageKey];
      }
      if (field.storageMode === 'core_column') {
        return (formData as unknown as Record<string, unknown>)[field.storageKey];
      }
      return undefined;
    };

    const setValue = (field: PublicReportingField, value: unknown) => {
      if (field.storageMode === 'custom_json') {
        onUpdateFormData({
          customFieldAnswers: {
            ...customAnswers,
            [field.storageKey]: value,
          },
        });
      } else if (field.storageMode === 'core_column') {
        onUpdateFormData({
          [field.storageKey]: value,
        } as Partial<ReportFormData>);
      }

      if (errors[field.fieldKey]) {
        setErrors((current) => ({ ...current, [field.fieldKey]: '' }));
      }
    };

    const validate = (): boolean => {
      const next: Record<string, string> = {};

      for (const field of fields) {
        if (field.fieldType === 'mob_justice_details') continue;

        if (field.fieldType === 'location') {
          if (
            field.required &&
            (!formData.location?.division?.trim() ||
              !formData.location?.district?.trim())
          ) {
            next[field.fieldKey] =
              language === 'bn'
                ? 'বিভাগ ও জেলা নির্বাচন করুন।'
                : 'Select division and district.';
          }
          continue;
        }

        if (field.fieldType === 'evidence') {
          if (
            field.required &&
            pendingImages.length === 0 &&
            !formData.evidenceDescription?.trim()
          ) {
            next[field.fieldKey] =
              language === 'bn'
                ? 'কমপক্ষে একটি ছবি বা সহায়ক তথ্যের বিবরণ দিন।'
                : 'Attach at least one image or add supporting information notes.';
          }
          continue;
        }

        if (field.fieldType === 'privacy') {
          if (field.required && !formData.privacyChoice) {
            next[field.fieldKey] =
              language === 'bn' ? 'গোপনীয়তার একটি অপশন নির্বাচন করুন।' : 'Select a privacy option.';
          }
          continue;
        }

        if (field.fieldType === 'subject_party') {
          if (
            field.required &&
            !formData.reportedSubject?.trim() &&
            !formData.organization?.trim()
          ) {
            next[field.fieldKey] =
              language === 'bn'
                ? 'একজন ব্যক্তি বা প্রতিষ্ঠানের তথ্য দিন।'
                : 'Provide a person or organization.';
          }
          continue;
        }

        const value = readValue(field);

        if (
          field.required &&
          field.fieldType === 'checkbox' &&
          value !== true
        ) {
          next[field.fieldKey] =
            language === 'bn'
              ? 'চালিয়ে যেতে এই অপশনটি নির্বাচন করুন।'
              : 'Select this option to continue.';
          continue;
        }

        if (field.required && isEmpty(value)) {
          next[field.fieldKey] =
            language === 'bn' ? 'এই তথ্যটি আবশ্যক।' : 'This field is required.';
          continue;
        }

        if (isEmpty(value)) continue;

        const minLength = Number(field.validation?.minLength || 0);
        const maxLength = Number(field.validation?.maxLength || 0);

        if (
          minLength > 0 &&
          typeof value === 'string' &&
          value.trim().length < minLength
        ) {
          next[field.fieldKey] =
            language === 'bn'
              ? `কমপক্ষে ${minLength} অক্ষর লিখুন।`
              : `Use at least ${minLength} characters.`;
        }

        if (
          maxLength > 0 &&
          typeof value === 'string' &&
          value.length > maxLength
        ) {
          next[field.fieldKey] =
            language === 'bn'
              ? `সর্বোচ্চ ${maxLength} অক্ষর লিখুন।`
              : `Use at most ${maxLength} characters.`;
        }

        if (
          field.fieldType === 'email' &&
          typeof value === 'string' &&
          !isValidEmail(value)
        ) {
          next[field.fieldKey] =
            language === 'bn'
              ? 'সঠিক ইমেইল ঠিকানা লিখুন।'
              : 'Enter a valid email address.';
        }

        if (
          field.fieldType === 'url' &&
          typeof value === 'string' &&
          !isValidHttpUrl(value)
        ) {
          next[field.fieldKey] =
            language === 'bn'
              ? 'http:// অথবা https:// সহ সঠিক URL লিখুন।'
              : 'Enter a valid URL beginning with http:// or https://.';
        }

        if (
          field.fieldType === 'phone' &&
          typeof value === 'string' &&
          !isValidPhone(value)
        ) {
          next[field.fieldKey] =
            language === 'bn'
              ? '৭–১৫ সংখ্যার সঠিক ফোন নম্বর লিখুন।'
              : 'Enter a valid phone number containing 7–15 digits.';
        }

        if (field.fieldType === 'number' || field.fieldType === 'currency') {
          const numberValue = Number(value);
          if (!Number.isFinite(numberValue)) {
            next[field.fieldKey] =
              language === 'bn'
                ? 'সঠিক সংখ্যা লিখুন।'
                : 'Enter a valid number.';
            continue;
          }
          if (
            field.validation?.min !== undefined &&
            numberValue < Number(field.validation.min)
          ) {
            next[field.fieldKey] =
              language === 'bn'
                ? `সর্বনিম্ন মান ${field.validation.min}।`
                : `Minimum value is ${field.validation.min}.`;
          }
          if (
            field.validation?.max !== undefined &&
            numberValue > Number(field.validation.max)
          ) {
            next[field.fieldKey] =
              language === 'bn'
                ? `সর্বোচ্চ মান ${field.validation.max}।`
                : `Maximum value is ${field.validation.max}.`;
          }
        }

        if (
          (field.fieldType === 'date' ||
            field.fieldType === 'time' ||
            field.fieldType === 'month') &&
          typeof value === 'string'
        ) {
          const minValue =
            field.validation?.min !== undefined ? String(field.validation.min) : '';
          const maxValue =
            field.validation?.max !== undefined ? String(field.validation.max) : '';
          if (minValue && value < minValue) {
            next[field.fieldKey] =
              language === 'bn'
                ? `সর্বনিম্ন অনুমোদিত মান ${minValue}।`
                : `Earliest allowed value is ${minValue}.`;
          }
          if (maxValue && value > maxValue) {
            next[field.fieldKey] =
              language === 'bn'
                ? `সর্বোচ্চ অনুমোদিত মান ${maxValue}।`
                : `Latest allowed value is ${maxValue}.`;
          }
        }
      }

      setErrors(next);
      const firstKey = Object.keys(next)[0];
      if (firstKey) {
        window.requestAnimationFrame(() => {
          const section = document.getElementById(`configured-field-${firstKey}`);
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const directControl = document.getElementById(`configured-input-${firstKey}`) as HTMLElement | null;
          const fallbackControl = section?.querySelector<HTMLElement>(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          (directControl || fallbackControl)?.focus({ preventScroll: true });
        });
      }
      return Object.keys(next).length === 0;
    };

    useImperativeHandle(ref, () => ({ validateAndProceed: validate }));

    if (fields.length === 0) return null;

    const selectedDivision = getDivisionByStoredName(formData.location?.division);
    const divisionId = selectedDivision?.id || '';
    const districtOptions = divisionId
      ? getDistrictsByDivision(divisionId)
      : BANGLADESH_DISTRICTS;
    const selectedDistrict = getDistrictByStoredName(formData.location?.district);
    const districtId = selectedDistrict?.id || '';
    const upazilaOptions = districtId ? getUpazilasByDistrict(districtId) : [];
    const selectedUpazila = getUpazilaByStoredName(
      formData.location?.upazilaOrThana,
      districtId
    );

    return (
      <section
        id="composer-section-configured-fields"
        className="space-y-4 text-left"
      >
        {fields.map((field) => {
          const value = readValue(field);
          const label = getLabel(field, language);
          const helper = language === 'bn' ? field.helperBn : field.helperEn;
          const placeholder =
            language === 'bn' ? field.placeholderBn : field.placeholderEn;
          const error = errors[field.fieldKey];
          const fieldControlId = `configured-input-${field.fieldKey}`;
          const fieldLabelId = `${fieldControlId}-label`;
          const fieldHelperId = `${fieldControlId}-helper`;
          const fieldErrorId = `${fieldControlId}-error`;

          if (field.fieldType === 'mob_justice_details') return null;

          if (field.fieldType === 'location') {
            return (
              <div
                key={field.fieldKey}
                id={`configured-field-${field.fieldKey}`}
                role="group"
                aria-labelledby={fieldLabelId}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                className="space-y-4 rounded-[var(--radius-card)] border border-role-outline-subtle bg-role-surface p-4 md:p-5"
              >
                <div className="space-y-1">
                  <h3 id={fieldLabelId} className="type-h3 font-[var(--font-weight-bold)] text-role-on-surface">
                    {label}
                    {field.required ? ' *' : ''}
                  </h3>
                  {helper ? (
                    <p id={fieldHelperId} className="type-helper text-role-on-surface-muted">
                      {helper}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    id="configured-location-division"
                    label={language === 'bn' ? 'বিভাগ' : 'Division'}
                    required={field.required}
                    value={divisionId}
                    onChange={(event) => {
                      const division = DIVISIONS.find((item) => item.id === event.target.value);
                      onUpdateFormData({
                        location: {
                          ...formData.location,
                          division: division?.nameEn || '',
                          district: '',
                          upazilaOrThana: '',
                        },
                      });
                      if (error) setErrors((current) => ({ ...current, [field.fieldKey]: '' }));
                    }}
                    placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                    options={DIVISIONS.map((division) => ({
                      value: division.id,
                      label: language === 'bn' ? division.nameBn : division.nameEn,
                    }))}
                  />

                  <Select
                    id="configured-location-district"
                    label={language === 'bn' ? 'জেলা' : 'District'}
                    required={field.required}
                    value={districtId}
                    disabled={!divisionId}
                    onChange={(event) => {
                      const district = BANGLADESH_DISTRICTS.find((item) => item.id === event.target.value);
                      onUpdateFormData({
                        location: {
                          ...formData.location,
                          district: district?.nameEn || '',
                          upazilaOrThana: '',
                        },
                      });
                      if (error) setErrors((current) => ({ ...current, [field.fieldKey]: '' }));
                    }}
                    placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                    options={districtOptions.map((district) => ({
                      value: district.id,
                      label: language === 'bn' ? district.nameBn : district.nameEn,
                    }))}
                  />

                  <Select
                    id="configured-location-upazila"
                    label={language === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'}
                    value={selectedUpazila?.id || ''}
                    disabled={!districtId}
                    onChange={(event) => {
                      const item = upazilaOptions.find((option) => option.id === event.target.value);
                      onUpdateFormData({
                        location: {
                          ...formData.location,
                          upazilaOrThana: item?.nameEn || '',
                        },
                      });
                    }}
                    placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                    options={upazilaOptions.map((item) => ({
                      value: item.id,
                      label: language === 'bn' ? item.nameBn : item.nameEn,
                    }))}
                  />

                  <TextField
                    id="configured-location-area"
                    type="text"
                    label={language === 'bn' ? 'এলাকা' : 'Area'}
                    value={formData.location?.area || ''}
                    onChange={(event) =>
                      onUpdateFormData({
                        location: {
                          ...formData.location,
                          area: event.target.value,
                        },
                      })
                    }
                  />

                  <TextField
                    id="configured-location-address"
                    type="text"
                    fieldClassName="sm:col-span-2"
                    label={language === 'bn' ? 'ঠিকানা / ল্যান্ডমার্ক' : 'Address / Landmark'}
                    value={formData.location?.formattedAddress || ''}
                    onChange={(event) =>
                      onUpdateFormData({
                        location: {
                          ...formData.location,
                          formattedAddress: event.target.value,
                        },
                      })
                    }
                  />
                </div>

                {error ? (
                  <p id={fieldErrorId} role="alert" className="type-helper text-role-validation">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          }

          if (field.fieldType === 'evidence') {
            return (
              <div
                key={field.fieldKey}
                id={`configured-field-${field.fieldKey}`}
                className="space-y-4 rounded-[var(--radius-card)] border border-role-outline-subtle bg-role-surface p-4 md:p-5"
              >
                <div className="space-y-1">
                  <h3 className="type-h3 font-[var(--font-weight-bold)] text-role-on-surface">
                    {label}
                    {field.required ? ' *' : ''}
                  </h3>
                  {helper ? (
                    <p className="type-helper text-role-on-surface-muted">{helper}</p>
                  ) : null}
                </div>

                <ImageAttachmentPicker
                  images={pendingImages}
                  onChange={(images) => {
                    onPendingImagesChange(images);
                    onUpdateFormData({
                      hasSupportingInfo:
                        images.length > 0 ||
                        Boolean(formData.evidenceDescription?.trim()),
                    });
                    if (error && (images.length > 0 || formData.evidenceDescription?.trim())) {
                      setErrors((current) => ({ ...current, [field.fieldKey]: '' }));
                    }
                  }}
                  language={language}
                />

                <TextAreaField
                  id="configured-evidence-description"
                  rows={3}
                  label={
                    language === 'bn'
                      ? 'সহায়ক তথ্যের বিবরণ'
                      : 'Supporting information notes'
                  }
                  value={formData.evidenceDescription || ''}
                  onChange={(event) => {
                    onUpdateFormData({
                      evidenceDescription: event.target.value,
                      hasSupportingInfo:
                        pendingImages.length > 0 ||
                        Boolean(event.target.value.trim()),
                    });
                    if (error && (pendingImages.length > 0 || event.target.value.trim())) {
                      setErrors((current) => ({ ...current, [field.fieldKey]: '' }));
                    }
                  }}
                />

                {error ? (
                  <p id={fieldErrorId} role="alert" className="type-helper text-role-validation">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          }

          if (field.fieldType === 'privacy') {
            const privacyValue = formData.privacyChoice || 'anonymous';
            return (
              <div
                key={field.fieldKey}
                id={`configured-field-${field.fieldKey}`}
                className="space-y-4 rounded-[var(--radius-card)] border border-role-outline-subtle bg-role-surface p-4 md:p-5"
              >
                <RadioGroup
                  id={fieldControlId}
                  label={label}
                  required={field.required}
                  helperText={helper}
                  error={error}
                  value={privacyValue}
                  onChange={(next) => {
                    onUpdateFormData({
                      privacyChoice: next as
                        | 'anonymous'
                        | 'admin_only'
                        | 'public_identity',
                    });
                    if (error) setErrors((current) => ({ ...current, [field.fieldKey]: '' }));
                  }}
                  options={[
                    {
                      value: 'anonymous',
                      label: language === 'bn' ? 'নাম প্রকাশ নয়' : 'Anonymous',
                    },
                    {
                      value: 'admin_only',
                      label: language === 'bn' ? 'শুধু অ্যাডমিন' : 'Admin only',
                    },
                    {
                      value: 'public_identity',
                      label: language === 'bn' ? 'পাবলিক পরিচয়' : 'Public identity',
                    },
                  ]}
                />

                {(privacyValue === 'admin_only' || privacyValue === 'public_identity') ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      id="configured-admin-name"
                      type="text"
                      label={language === 'bn' ? 'নাম' : 'Name'}
                      value={formData.adminName || ''}
                      onChange={(event) =>
                        onUpdateFormData({ adminName: event.target.value })
                      }
                      autoComplete="name"
                    />
                    <TextField
                      id="configured-admin-contact"
                      type="text"
                      label={language === 'bn' ? 'যোগাযোগ' : 'Contact'}
                      value={formData.adminContact || ''}
                      onChange={(event) =>
                        onUpdateFormData({ adminContact: event.target.value })
                      }
                      placeholder={
                        language === 'bn'
                          ? 'ইমেইল বা ফোন নম্বর'
                          : 'Email address or phone number'
                      }
                    />
                  </div>
                ) : null}
              </div>
            );
          }

          if (field.fieldType === 'subject_party') {
            return (
              <div
                key={field.fieldKey}
                id={`configured-field-${field.fieldKey}`}
                role="group"
                aria-labelledby={fieldLabelId}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? fieldErrorId : undefined}
                className="space-y-4 rounded-[var(--radius-card)] border border-role-outline-subtle bg-role-surface p-4 md:p-5"
              >
                <h3 id={fieldLabelId} className="type-h3 font-[var(--font-weight-bold)] text-role-on-surface">
                  {label}
                  {field.required ? ' *' : ''}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    id="configured-party-type"
                    label={language === 'bn' ? 'ধরন' : 'Type'}
                    value={formData.subjectType || 'unknown'}
                    onChange={(event) =>
                      onUpdateFormData({
                        subjectType: event.target.value as ReportFormData['subjectType'],
                      })
                    }
                    options={[
                      { value: 'unknown', label: language === 'bn' ? 'অনির্দিষ্ট' : 'Not specified' },
                      { value: 'individual', label: language === 'bn' ? 'ব্যক্তি' : 'Individual' },
                      { value: 'business', label: language === 'bn' ? 'ব্যবসা' : 'Business' },
                      { value: 'group', label: language === 'bn' ? 'গোষ্ঠী' : 'Group' },
                      { value: 'organization', label: language === 'bn' ? 'প্রতিষ্ঠান' : 'Organization' },
                    ]}
                  />
                  <TextField
                    id="configured-party-name"
                    type="text"
                    label={language === 'bn' ? 'নাম' : 'Name'}
                    value={formData.reportedSubject || ''}
                    onChange={(event) => {
                      onUpdateFormData({ reportedSubject: event.target.value });
                      if (error && (event.target.value.trim() || formData.organization?.trim())) {
                        setErrors((current) => ({ ...current, [field.fieldKey]: '' }));
                      }
                    }}
                  />
                  <TextField
                    id="configured-party-role"
                    type="text"
                    label={language === 'bn' ? 'পদ / ভূমিকা' : 'Role / designation'}
                    value={formData.roleOrDesignation || ''}
                    onChange={(event) =>
                      onUpdateFormData({ roleOrDesignation: event.target.value })
                    }
                  />
                  <TextField
                    id="configured-party-org"
                    type="text"
                    label={language === 'bn' ? 'প্রতিষ্ঠান' : 'Organization'}
                    value={formData.organization || ''}
                    onChange={(event) => {
                      onUpdateFormData({ organization: event.target.value });
                      if (error && (event.target.value.trim() || formData.reportedSubject?.trim())) {
                        setErrors((current) => ({ ...current, [field.fieldKey]: '' }));
                      }
                    }}
                  />
                </div>

                {error ? (
                  <p id={fieldErrorId} role="alert" className="type-helper text-role-validation">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          }

          const cardClass =
            'rounded-[var(--radius-card)] border border-role-outline-subtle bg-role-surface p-4 md:p-5';

          if (field.fieldType === 'textarea') {
            return (
              <div key={field.fieldKey} id={`configured-field-${field.fieldKey}`} className={cardClass}>
                <TextAreaField
                  id={fieldControlId}
                  rows={5}
                  label={label}
                  required={field.required}
                  helperText={helper}
                  error={error}
                  value={String(value ?? '')}
                  placeholder={placeholder}
                  minLength={
                    field.validation?.minLength !== undefined
                      ? Number(field.validation.minLength)
                      : undefined
                  }
                  maxLength={
                    field.validation?.maxLength !== undefined
                      ? Number(field.validation.maxLength)
                      : undefined
                  }
                  onChange={(event) => setValue(field, event.target.value)}
                />
              </div>
            );
          }

          if (field.fieldType === 'select') {
            return (
              <div key={field.fieldKey} id={`configured-field-${field.fieldKey}`} className={cardClass}>
                <Select
                  id={fieldControlId}
                  label={label}
                  required={field.required}
                  helperText={helper}
                  error={error}
                  value={String(value ?? '')}
                  onChange={(event) => setValue(field, event.target.value)}
                  placeholder={placeholder || (language === 'bn' ? 'নির্বাচন করুন' : 'Select')}
                  options={field.options.map((option) => ({
                    value: option.value,
                    label: language === 'bn' ? option.labelBn : option.labelEn,
                  }))}
                />
              </div>
            );
          }

          if (field.fieldType === 'radio') {
            return (
              <div key={field.fieldKey} id={`configured-field-${field.fieldKey}`} className={cardClass}>
                <RadioGroup
                  id={fieldControlId}
                  label={label}
                  required={field.required}
                  helperText={helper}
                  error={error}
                  value={String(value ?? '')}
                  onChange={(next) => setValue(field, next)}
                  options={field.options.map((option) => ({
                    value: option.value,
                    label: language === 'bn' ? option.labelBn : option.labelEn,
                  }))}
                />
              </div>
            );
          }

          if (field.fieldType === 'checkbox') {
            return (
              <div
                key={field.fieldKey}
                id={`configured-field-${field.fieldKey}`}
                className={`${cardClass} space-y-1.5`}
              >
                <Checkbox
                  id={fieldControlId}
                  checked={Boolean(value)}
                  required={field.required}
                  aria-required={field.required || undefined}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                  onChange={(event) => setValue(field, event.target.checked)}
                  label={
                    <>
                      {label}
                      {field.required ? (
                        <span className="text-role-validation ml-1" aria-hidden="true">*</span>
                      ) : null}
                    </>
                  }
                  description={!error ? helper : undefined}
                  descriptionId={!error && helper ? fieldHelperId : undefined}
                />
                {error ? (
                  <p id={fieldErrorId} role="alert" className="type-helper text-role-validation">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          }

          if (field.fieldType === 'multiselect') {
            return (
              <div
                key={field.fieldKey}
                id={`configured-field-${field.fieldKey}`}
                className={`${cardClass} space-y-2`}
              >
                <p id={fieldLabelId} className="type-label text-role-on-surface">
                  {label}
                  {field.required ? (
                    <span className="text-role-validation ml-1" aria-hidden="true">*</span>
                  ) : null}
                </p>
                <div
                  role="group"
                  aria-labelledby={fieldLabelId}
                  aria-required={field.required || undefined}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {field.options.map((option) => {
                    const selected = Array.isArray(value) ? value.includes(option.value) : false;
                    return (
                      <Checkbox
                        key={option.value}
                        id={`${fieldControlId}-${option.value}`}
                        checked={selected}
                        onChange={(event) => {
                          const current = Array.isArray(value) ? [...value] : [];
                          const next = event.target.checked
                            ? [...current, option.value]
                            : current.filter((item) => item !== option.value);
                          setValue(field, next);
                        }}
                        label={language === 'bn' ? option.labelBn : option.labelEn}
                        labelClassName="type-body text-role-on-surface"
                      />
                    );
                  })}
                </div>
                {error ? (
                  <p id={fieldErrorId} role="alert" className="type-helper text-role-validation">
                    {error}
                  </p>
                ) : helper ? (
                  <p id={fieldHelperId} className="type-helper text-role-on-surface-muted">{helper}</p>
                ) : null}
              </div>
            );
          }

          if (field.fieldType === 'date') {
            return (
              <div key={field.fieldKey} id={`configured-field-${field.fieldKey}`} className={cardClass}>
                <DateField
                  id={fieldControlId}
                  language={language}
                  label={label}
                  required={field.required}
                  helperText={helper}
                  error={error}
                  value={String(value ?? '')}
                  min={field.validation?.min !== undefined ? String(field.validation.min) : undefined}
                  max={field.validation?.max !== undefined ? String(field.validation.max) : undefined}
                  onChange={(event) => setValue(field, event.target.value)}
                />
              </div>
            );
          }

          if (field.fieldType === 'time') {
            return (
              <div key={field.fieldKey} id={`configured-field-${field.fieldKey}`} className={cardClass}>
                <TimeField
                  id={fieldControlId}
                  language={language}
                  label={label}
                  required={field.required}
                  helperText={helper}
                  error={error}
                  value={String(value ?? '')}
                  min={field.validation?.min !== undefined ? String(field.validation.min) : undefined}
                  max={field.validation?.max !== undefined ? String(field.validation.max) : undefined}
                  onChange={(event) => setValue(field, event.target.value)}
                />
              </div>
            );
          }

          if (field.fieldType === 'month') {
            return (
              <div key={field.fieldKey} id={`configured-field-${field.fieldKey}`} className={cardClass}>
                <MonthField
                  id={fieldControlId}
                  language={language}
                  label={label}
                  required={field.required}
                  helperText={helper}
                  error={error}
                  value={String(value ?? '')}
                  min={field.validation?.min !== undefined ? String(field.validation.min) : undefined}
                  max={field.validation?.max !== undefined ? String(field.validation.max) : undefined}
                  onChange={(event) => setValue(field, event.target.value)}
                />
              </div>
            );
          }

          if (field.fieldType === 'number' || field.fieldType === 'currency') {
            return (
              <div key={field.fieldKey} id={`configured-field-${field.fieldKey}`} className={cardClass}>
                <NumberField
                  id={fieldControlId}
                  label={label}
                  required={field.required}
                  helperText={helper}
                  error={error}
                  value={String(value ?? '')}
                  placeholder={placeholder}
                  min={field.validation?.min !== undefined ? Number(field.validation.min) : undefined}
                  max={field.validation?.max !== undefined ? Number(field.validation.max) : undefined}
                  onChange={(event) => setValue(field, event.target.value)}
                />
              </div>
            );
          }

          const inputType =
            field.fieldType === 'phone'
              ? 'tel'
              : field.fieldType === 'url'
                ? 'url'
                : field.fieldType === 'email'
                  ? 'email'
                  : 'text';

          return (
            <div key={field.fieldKey} id={`configured-field-${field.fieldKey}`} className={cardClass}>
              <TextField
                id={fieldControlId}
                type={inputType}
                label={label}
                required={field.required}
                helperText={helper}
                error={error}
                value={String(value ?? '')}
                placeholder={placeholder}
                minLength={
                  field.validation?.minLength !== undefined
                    ? Number(field.validation.minLength)
                    : undefined
                }
                maxLength={
                  field.validation?.maxLength !== undefined
                    ? Number(field.validation.maxLength)
                    : undefined
                }
                inputMode={
                  field.fieldType === 'phone'
                    ? 'tel'
                    : field.fieldType === 'email'
                      ? 'email'
                      : field.fieldType === 'url'
                        ? 'url'
                        : undefined
                }
                onChange={(event) => setValue(field, event.target.value)}
              />
            </div>
          );
        })}
      </section>
    );
  }
);

ConfiguredFieldsSection.displayName = 'ConfiguredFieldsSection';

export default ConfiguredFieldsSection;
