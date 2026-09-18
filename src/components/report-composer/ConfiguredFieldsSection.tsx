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

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,25}$/;

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidPhone = (value: string): boolean => {
  if (!PHONE_PATTERN.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

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

        if (field.fieldType === 'evidence' || field.fieldType === 'privacy') {
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
          !EMAIL_PATTERN.test(value.trim())
        ) {
          next[field.fieldKey] =
            language === 'bn'
              ? 'সঠিক ইমেইল ঠিকানা লিখুন।'
              : 'Enter a valid email address.';
        }

        if (
          field.fieldType === 'url' &&
          typeof value === 'string' &&
          !isValidHttpUrl(value.trim())
        ) {
          next[field.fieldKey] =
            language === 'bn'
              ? 'http:// অথবা https:// সহ সঠিক URL লিখুন।'
              : 'Enter a valid URL beginning with http:// or https://.';
        }

        if (
          field.fieldType === 'phone' &&
          typeof value === 'string' &&
          !isValidPhone(value.trim())
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

    const commonInputClass =
      'w-full min-h-[44px] rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-body text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus';

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
                className="space-y-4 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface p-4 md:p-5"
              >
                <div className="space-y-1">
                  <h3 id={fieldLabelId} className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
                    {label}
                    {field.required ? ' *' : ''}
                  </h3>
                  {helper && (
                    <p id={fieldHelperId} className="type-compact text-ui-content-secondary">
                      {helper}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="configured-location-division"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn' ? 'বিভাগ' : 'Division'} *
                    </label>
                    <select
                      id="configured-location-division"
                      aria-required="true"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                      value={divisionId}
                      onChange={(event) => {
                        const division = DIVISIONS.find(
                          (item) => item.id === event.target.value
                        );
                        onUpdateFormData({
                          location: {
                            ...formData.location,
                            division: division?.nameEn || '',
                            district: '',
                            upazilaOrThana: '',
                          },
                        });
                      }}
                      className={commonInputClass}
                    >
                      <option value="">
                        {language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                      </option>
                      {DIVISIONS.map((division) => (
                        <option key={division.id} value={division.id}>
                          {language === 'bn'
                            ? division.nameBn
                            : division.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="configured-location-district"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn' ? 'জেলা' : 'District'} *
                    </label>
                    <select
                      id="configured-location-district"
                      aria-required="true"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                      value={districtId}
                      disabled={!divisionId}
                      onChange={(event) => {
                        const district = BANGLADESH_DISTRICTS.find(
                          (item) => item.id === event.target.value
                        );
                        onUpdateFormData({
                          location: {
                            ...formData.location,
                            district: district?.nameEn || '',
                            upazilaOrThana: '',
                          },
                        });
                      }}
                      className={commonInputClass}
                    >
                      <option value="">
                        {language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                      </option>
                      {districtOptions.map((district) => (
                        <option key={district.id} value={district.id}>
                          {language === 'bn'
                            ? district.nameBn
                            : district.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="configured-location-upazila"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn'
                        ? 'থানা / উপজেলা'
                        : 'Thana / Upazila'}
                    </label>
                    <select
                      id="configured-location-upazila"
                      value={selectedUpazila?.id || ''}
                      disabled={!districtId}
                      onChange={(event) => {
                        const item = upazilaOptions.find(
                          (option) => option.id === event.target.value
                        );
                        onUpdateFormData({
                          location: {
                            ...formData.location,
                            upazilaOrThana: item?.nameEn || '',
                          },
                        });
                      }}
                      className={commonInputClass}
                    >
                      <option value="">
                        {language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                      </option>
                      {upazilaOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {language === 'bn' ? item.nameBn : item.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="configured-location-area"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn' ? 'এলাকা' : 'Area'}
                    </label>
                    <input
                      id="configured-location-area"
                      value={formData.location?.area || ''}
                      onChange={(event) =>
                        onUpdateFormData({
                          location: {
                            ...formData.location,
                            area: event.target.value,
                          },
                        })
                      }
                      className={commonInputClass}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="configured-location-address"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn' ? 'ঠিকানা / ল্যান্ডমার্ক' : 'Address / Landmark'}
                    </label>
                    <input
                      id="configured-location-address"
                      value={formData.location?.formattedAddress || ''}
                      onChange={(event) =>
                        onUpdateFormData({
                          location: {
                            ...formData.location,
                            formattedAddress: event.target.value,
                          },
                        })
                      }
                      className={commonInputClass}
                    />
                  </div>
                </div>
                {error && (
                  <p id={fieldErrorId} role="alert" className="type-compact text-ui-error-text">
                    {error}
                  </p>
                )}
              </div>
            );
          }

          if (field.fieldType === 'evidence') {
            return (
              <div
                key={field.fieldKey}
                id={`configured-field-${field.fieldKey}`}
                className="space-y-4 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface p-4 md:p-5"
              >
                <div className="space-y-1">
                  <h3 className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
                    {label}
                  </h3>
                  {helper && (
                    <p className="type-compact text-ui-content-secondary">
                      {helper}
                    </p>
                  )}
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
                  }}
                  language={language}
                />
                <div className="space-y-1.5">
                  <label
                    htmlFor="configured-evidence-description"
                    className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                  >
                    {language === 'bn'
                      ? 'সহায়ক তথ্যের বিবরণ'
                      : 'Supporting information notes'}
                  </label>
                  <textarea
                    id="configured-evidence-description"
                    rows={3}
                    value={formData.evidenceDescription || ''}
                    onChange={(event) =>
                      onUpdateFormData({
                        evidenceDescription: event.target.value,
                        hasSupportingInfo:
                          pendingImages.length > 0 ||
                          Boolean(event.target.value.trim()),
                      })
                    }
                    className={`${commonInputClass} resize-y`}
                  />
                </div>
              </div>
            );
          }

          if (field.fieldType === 'privacy') {
            return (
              <div
                key={field.fieldKey}
                id={`configured-field-${field.fieldKey}`}
                className="space-y-4 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface p-4 md:p-5"
              >
                <h3 className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
                  {label}
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    {
                      value: 'anonymous',
                      en: 'Anonymous',
                      bn: 'নাম প্রকাশ নয়',
                    },
                    {
                      value: 'admin_only',
                      en: 'Admin only',
                      bn: 'শুধু অ্যাডমিন',
                    },
                    {
                      value: 'public_identity',
                      en: 'Public identity',
                      bn: 'পাবলিক পরিচয়',
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-compact text-ui-content-primary"
                    >
                      <input
                        type="radio"
                        name="configured-privacy-choice"
                        value={option.value}
                        checked={
                          (formData.privacyChoice || 'anonymous') === option.value
                        }
                        onChange={() =>
                          onUpdateFormData({
                            privacyChoice: option.value as
                              | 'anonymous'
                              | 'admin_only'
                              | 'public_identity',
                          })
                        }
                      />
                      {language === 'bn' ? option.bn : option.en}
                    </label>
                  ))}
                </div>

                {(formData.privacyChoice === 'admin_only' ||
                  formData.privacyChoice === 'public_identity') && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="configured-admin-name"
                        className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                      >
                        {language === 'bn' ? 'নাম' : 'Name'}
                      </label>
                      <input
                        id="configured-admin-name"
                        value={formData.adminName || ''}
                        onChange={(event) =>
                          onUpdateFormData({ adminName: event.target.value })
                        }
                        className={commonInputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="configured-admin-contact"
                        className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                      >
                        {language === 'bn' ? 'যোগাযোগ' : 'Contact'}
                      </label>
                      <input
                        id="configured-admin-contact"
                        value={formData.adminContact || ''}
                        onChange={(event) =>
                          onUpdateFormData({ adminContact: event.target.value })
                        }
                        className={commonInputClass}
                      />
                    </div>
                  </div>
                )}
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
                className="space-y-4 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface p-4 md:p-5"
              >
                <h3 id={fieldLabelId} className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
                  {label}
                  {field.required ? ' *' : ''}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="configured-party-type"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn' ? 'ধরন' : 'Type'}
                    </label>
                    <select
                      id="configured-party-type"
                      value={formData.subjectType || 'unknown'}
                      onChange={(event) =>
                        onUpdateFormData({
                          subjectType: event.target.value as ReportFormData['subjectType'],
                        })
                      }
                      className={commonInputClass}
                    >
                      <option value="unknown">
                        {language === 'bn' ? 'অনির্দিষ্ট' : 'Not specified'}
                      </option>
                      <option value="individual">
                        {language === 'bn' ? 'ব্যক্তি' : 'Individual'}
                      </option>
                      <option value="business">
                        {language === 'bn' ? 'ব্যবসা' : 'Business'}
                      </option>
                      <option value="group">
                        {language === 'bn' ? 'গোষ্ঠী' : 'Group'}
                      </option>
                      <option value="organization">
                        {language === 'bn' ? 'প্রতিষ্ঠান' : 'Organization'}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="configured-party-name"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn' ? 'নাম' : 'Name'}
                    </label>
                    <input
                      id="configured-party-name"
                      aria-required={field.required || undefined}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? fieldErrorId : undefined}
                      value={formData.reportedSubject || ''}
                      onChange={(event) =>
                        onUpdateFormData({ reportedSubject: event.target.value })
                      }
                      className={commonInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="configured-party-role"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn' ? 'পদ / ভূমিকা' : 'Role / designation'}
                    </label>
                    <input
                      id="configured-party-role"
                      value={formData.roleOrDesignation || ''}
                      onChange={(event) =>
                        onUpdateFormData({
                          roleOrDesignation: event.target.value,
                        })
                      }
                      className={commonInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="configured-party-org"
                      className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                    >
                      {language === 'bn' ? 'প্রতিষ্ঠান' : 'Organization'}
                    </label>
                    <input
                      id="configured-party-org"
                      aria-required={field.required || undefined}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? fieldErrorId : undefined}
                      value={formData.organization || ''}
                      onChange={(event) =>
                        onUpdateFormData({ organization: event.target.value })
                      }
                      className={commonInputClass}
                    />
                  </div>
                </div>
                {error && (
                  <p id={fieldErrorId} role="alert" className="type-compact text-ui-error-text">
                    {error}
                  </p>
                )}
              </div>
            );
          }

          const fullWidth =
            field.fieldType === 'textarea' || field.fieldType === 'multiselect';

          return (
            <div
              key={field.fieldKey}
              id={`configured-field-${field.fieldKey}`}
              className={`space-y-1.5 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface p-4 md:p-5 ${
                fullWidth ? '' : ''
              }`}
            >
              {field.fieldType === 'radio' || field.fieldType === 'multiselect' ? (
                <p
                  id={fieldLabelId}
                  className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                >
                  {label}
                  {field.required ? ' *' : ''}
                </p>
              ) : (
                <label
                  id={fieldLabelId}
                  htmlFor={fieldControlId}
                  className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
                >
                  {label}
                  {field.required ? ' *' : ''}
                </label>
              )}

              {field.fieldType === 'textarea' ? (
                <textarea
                  id={fieldControlId}
                  rows={5}
                  value={String(value ?? '')}
                  aria-required={field.required || undefined}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                  placeholder={placeholder}
                  onChange={(event) => setValue(field, event.target.value)}
                  className={`${commonInputClass} resize-y`}
                />
              ) : field.fieldType === 'select' ? (
                <select
                  id={fieldControlId}
                  value={String(value ?? '')}
                  aria-required={field.required || undefined}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                  onChange={(event) => setValue(field, event.target.value)}
                  className={commonInputClass}
                >
                  <option value="">
                    {language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                  </option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {language === 'bn' ? option.labelBn : option.labelEn}
                    </option>
                  ))}
                </select>
              ) : field.fieldType === 'radio' ? (
                <div
                  role="radiogroup"
                  aria-labelledby={fieldLabelId}
                  aria-required={field.required || undefined}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                  className="flex flex-wrap gap-2"
                >
                  {field.options.map((option) => (
                    <label
                      key={option.value}
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-compact text-ui-content-primary"
                    >
                      <input
                        type="radio"
                        name={`configured-${field.fieldKey}`}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => setValue(field, option.value)}
                      />
                      {language === 'bn' ? option.labelBn : option.labelEn}
                    </label>
                  ))}
                </div>
              ) : field.fieldType === 'checkbox' ? (
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-compact text-ui-content-primary">
                  <input
                    id={fieldControlId}
                    type="checkbox"
                    checked={Boolean(value)}
                    aria-required={field.required || undefined}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                    onChange={(event) => setValue(field, event.target.checked)}
                  />
                  {helper || label}
                </label>
              ) : field.fieldType === 'multiselect' ? (
                <div
                  role="group"
                  aria-labelledby={fieldLabelId}
                  aria-required={field.required || undefined}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {field.options.map((option) => {
                    const selected = Array.isArray(value)
                      ? value.includes(option.value)
                      : false;
                    return (
                      <label
                        key={option.value}
                        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-compact text-ui-content-primary"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => {
                            const current = Array.isArray(value)
                              ? [...value]
                              : [];
                            const next = event.target.checked
                              ? [...current, option.value]
                              : current.filter((item) => item !== option.value);
                            setValue(field, next);
                          }}
                        />
                        {language === 'bn' ? option.labelBn : option.labelEn}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  id={fieldControlId}
                  aria-required={field.required || undefined}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? fieldErrorId : helper ? fieldHelperId : undefined}
                  type={
                    field.fieldType === 'currency' ||
                    field.fieldType === 'number'
                      ? 'number'
                      : field.fieldType === 'phone'
                        ? 'tel'
                        : field.fieldType === 'url'
                          ? 'url'
                          : field.fieldType === 'email'
                            ? 'email'
                            : field.fieldType
                  }
                  value={String(value ?? '')}
                  placeholder={placeholder}
                  min={
                    field.validation?.min !== undefined
                      ? Number(field.validation.min)
                      : undefined
                  }
                  max={
                    field.validation?.max !== undefined
                      ? Number(field.validation.max)
                      : undefined
                  }
                  maxLength={
                    field.validation?.maxLength !== undefined
                      ? Number(field.validation.maxLength)
                      : undefined
                  }
                  onChange={(event) => setValue(field, event.target.value)}
                  className={commonInputClass}
                />
              )}

              {field.fieldType !== 'checkbox' && helper && (
                <p id={fieldHelperId} className="type-compact text-ui-content-muted">{helper}</p>
              )}
              {error && (
                <p id={fieldErrorId} role="alert" className="type-compact text-ui-error-text">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </section>
    );
  }
);

ConfiguredFieldsSection.displayName = 'ConfiguredFieldsSection';

export default ConfiguredFieldsSection;
