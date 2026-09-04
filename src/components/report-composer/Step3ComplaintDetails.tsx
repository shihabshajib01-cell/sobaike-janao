import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Shield,
  FileText,
  MapPin,
  Paperclip,
  ChevronDown,
  Lock,
  Info,
  Calendar,
  Clock,
  Repeat,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { DraftReport, ReportLocationData, MentionedParty, isValidIncidentCoordinates } from '../../services/types';
import {
  SEGMENT_SUBCATEGORIES,
  INTIMATE_WHAT_HAPPENED_OPTIONS,
  INTIMATE_PLATFORMS,
} from '../../data/reportOptions';
import {
  getReportSubjectConfig,
  SubjectTypeValue,
} from '../../data/reportSubjectOptions';
import {
  DIVISIONS,
  BANGLADESH_DISTRICTS,
  DivisionInfo,
  DistrictInfo,
} from '../../data/districts';
import { Accordion } from '../ui/Accordion';
import { Toggle } from '../ui/Toggle';
import { ImageAttachmentPicker, AttachedImagePreview } from '../media/ImageAttachmentPicker';
import { GoogleMapPicker } from '../location/GoogleMapPicker';

export interface Step3Handle {
  validateAndProceed: () => boolean;
}

export interface Step3ComplaintDetailsProps {
  segment: SectionKey;
  formData: DraftReport;
  pendingImages: AttachedImagePreview[];
  onPendingImagesChange: (images: AttachedImagePreview[]) => void;
  onUpdateFormData: (updates: Partial<DraftReport>) => void;
  onBack?: () => void;
  onNext?: () => void;
  initialOpenSection?: 'narrative' | 'location' | 'identity' | 'parties' | 'attachments';
  language: 'bn' | 'en';
}

export const Step3ComplaintDetails = forwardRef<Step3Handle, Step3ComplaintDetailsProps>(
  (
    {
      segment,
      formData,
      pendingImages,
      onPendingImagesChange,
      onUpdateFormData,
      initialOpenSection,
      language,
    },
    ref
  ) => {
    // Segment structure conditions
    const showsPartySection = segment === 'rickshaw' || segment === 'extortion';
    const showsIdentitySection = segment === 'harassment';

    // Determine active subcategory option & context
    const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
      (s) => s.id === formData.subcategoryId
    );
    const isDigitalHarassment =
      segment === 'harassment' &&
      (currentSubcategoryOption?.categoryGroup === 'digital_intimate' ||
        currentSubcategoryOption?.id === 'blackmail-coercion');

    // Contextual subject configuration for Rickshaw & Extortion
    const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);

    // Accordion visibility states - Core sections are open/non-collapsible
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
      narrative: true,
      location: true,
      identity: showsIdentitySection,
      parties: showsPartySection,
      attachments: initialOpenSection === 'attachments',
    }));

    // Auto-open specific accordion if requested (e.g. from Review edit link)
    useEffect(() => {
      if (initialOpenSection) {
        setOpenSections((prev) => ({
          ...prev,
          [initialOpenSection]: true,
        }));
        const elem = document.getElementById(`composer-section-${initialOpenSection}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, [initialOpenSection]);

    // Validation errors state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Progressive disclosure states
    const [showTitleField, setShowTitleField] = useState<boolean>(false);
    const [showIdentifyingDetails, setShowIdentifyingDetails] = useState<boolean>(false);

    // Toggle specific accordion (Only attachments is collapsible)
    const toggleSection = (secKey: string) => {
      if (secKey === 'narrative' || secKey === 'location') return;
      if (showsPartySection && secKey === 'parties') return;
      if (showsIdentitySection && secKey === 'identity') return;
      setOpenSections((prev) => ({
        ...prev,
        [secKey]: !prev[secKey],
      }));
    };

    // Location Handlers
    const handleManualLocationChange = (locUpdates: Partial<ReportLocationData>) => {
      // Check if user changed a geographic address field that invalidates the selected map point
      const isGeographicFieldChanged =
        ('division' in locUpdates && locUpdates.division !== formData.location?.division) ||
        ('district' in locUpdates && locUpdates.district !== formData.location?.district) ||
        ('area' in locUpdates && locUpdates.area !== formData.location?.area) ||
        ('upazilaOrThana' in locUpdates && locUpdates.upazilaOrThana !== formData.location?.upazilaOrThana) ||
        ('road' in locUpdates && locUpdates.road !== formData.location?.road) ||
        ('landmark' in locUpdates && locUpdates.landmark !== formData.location?.landmark);

      const hadValidCoords = isValidIncidentCoordinates(formData.location?.lat, formData.location?.lng);

      const updatedLoc: ReportLocationData = {
        formattedAddress: formData.location?.formattedAddress || '',
        division: formData.location?.division || '',
        district: formData.location?.district || '',
        upazilaOrThana: formData.location?.upazilaOrThana || '',
        area: formData.location?.area || '',
        road: formData.location?.road || '',
        landmark: formData.location?.landmark || '',
        lat: isGeographicFieldChanged ? undefined : formData.location?.lat,
        lng: isGeographicFieldChanged ? undefined : formData.location?.lng,
        placeId: isGeographicFieldChanged ? undefined : formData.location?.placeId,
        ...locUpdates,
      };

      // Construct formattedAddress from real entered values
      const parts = [
        updatedLoc.road,
        updatedLoc.area,
        updatedLoc.upazilaOrThana,
        updatedLoc.district,
        updatedLoc.division,
      ].filter((s) => Boolean(s && s.trim()));
      updatedLoc.formattedAddress = parts.join(', ');

      onUpdateFormData({ location: updatedLoc });

      if (locUpdates.division && errors.division) {
        setErrors((prev) => ({ ...prev, division: '' }));
      }
      if (locUpdates.district && errors.district) {
        setErrors((prev) => ({ ...prev, district: '' }));
      }
      if (isGeographicFieldChanged && hadValidCoords) {
        setErrors((prev) => ({
          ...prev,
          coordinates:
            language === 'bn'
              ? 'ঠিকানা পরিবর্তনের কারণে ম্যাপে পুনরায় ঘটনাস্থল নির্বাচন করুন।'
              : 'Address changed. Please re-select the incident location on the map.',
        }));
      }
    };

    const handleMapPointChange = (lat: number, lng: number) => {
      const updatedLoc: ReportLocationData = {
        formattedAddress: formData.location?.formattedAddress || '',
        division: formData.location?.division || '',
        district: formData.location?.district || '',
        upazilaOrThana: formData.location?.upazilaOrThana || '',
        area: formData.location?.area || '',
        road: formData.location?.road || '',
        landmark: formData.location?.landmark || '',
        lat,
        lng,
      };

      onUpdateFormData({ location: updatedLoc });

      if (errors.coordinates) {
        setErrors((prev) => ({ ...prev, coordinates: '' }));
      }
    };

    const handleToggleDetailedLocation = (enabled: boolean) => {
      onUpdateFormData({ isDetailedLocation: enabled });
    };

    // Privacy toggles (Harassment only)
    const isIdentityPrivate = formData.privacyChoice === 'anonymous';
    const isPublicIdentityRequested = formData.privacyChoice === 'public_identity';

    const handlePrimaryPrivacyToggle = (keepPrivate: boolean) => {
      if (keepPrivate) {
        onUpdateFormData({
          privacyChoice: 'anonymous',
          confirmPublicIdentity: false,
        });
      } else {
        onUpdateFormData({
          privacyChoice: 'admin_only',
          confirmPublicIdentity: false,
        });
      }
    };

    const handlePublicIdentityToggle = (requestPublic: boolean) => {
      if (requestPublic) {
        onUpdateFormData({
          privacyChoice: 'public_identity',
          confirmPublicIdentity: true,
        });
      } else {
        onUpdateFormData({
          privacyChoice: 'admin_only',
          confirmPublicIdentity: false,
        });
      }
    };

    // Mentioned Parties Handlers (Extortion only)
    const handleAddAdditionalParty = () => {
      const newParty: MentionedParty = {
        id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'individual',
        name: '',
        roleOrDesignation: '',
        organization: '',
        phoneOrContact: '',
        identifyingDescription: '',
      };
      const updated = [...(formData.mentionedParties || []), newParty];
      onUpdateFormData({ mentionedParties: updated });
    };

    const handleRemoveAdditionalParty = (id: string) => {
      const updated = (formData.mentionedParties || []).filter((p) => p.id !== id);
      onUpdateFormData({ mentionedParties: updated });
    };

    const handleUpdateAdditionalParty = (id: string, updates: Partial<MentionedParty>) => {
      const updated = (formData.mentionedParties || []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      onUpdateFormData({ mentionedParties: updated });
    };

    // Filter districts based on selected division
    const selectedDivisionObj = DIVISIONS.find(
      (d: DivisionInfo) => d.nameEn === formData.location?.division || d.nameBn === formData.location?.division
    );
    const availableDistricts = selectedDivisionObj
      ? BANGLADESH_DISTRICTS.filter((dst: DistrictInfo) => dst.divisionId === selectedDivisionObj.id)
      : [];

    // Validation & Progress Logic
    const validateAndProceed = (): boolean => {
      const newErrors: Record<string, string> = {};

      // Auto-populate title if empty before validating
      let effectiveTitle = formData.title?.trim();
      if (!effectiveTitle && currentSubcategoryOption) {
        effectiveTitle = language === 'bn' ? currentSubcategoryOption.nameBn : currentSubcategoryOption.nameEn;
        onUpdateFormData({ title: effectiveTitle });
      }

      if (!effectiveTitle) {
        newErrors.title =
          language === 'bn' ? 'শিরোনাম দেওয়া আবশ্যক' : 'A report headline is required';
      }

      if (!formData.description?.trim()) {
        newErrors.description =
          language === 'bn' ? 'ঘটনার বিবরণ দেওয়া আবশ্যক' : 'Incident description is required';
      } else if (formData.description.trim().length < 20) {
        newErrors.description =
          language === 'bn'
            ? 'বিবরণ অন্তত ২০ অক্ষরের হতে হবে'
            : 'Description must be at least 20 characters';
      } else if (formData.description.length > 2000) {
        newErrors.description =
          language === 'bn'
            ? 'বিবরণটি ২০০০ অক্ষরের মধ্যে সংক্ষিপ্ত করুন।'
            : 'Please shorten the description to 2,000 characters.';
      }

      if (!formData.incidentDate) {
        newErrors.incidentDate =
          language === 'bn' ? 'ঘটনার তারিখ নির্বাচন করুন' : 'Incident date is required';
      }

      if (!formData.location?.division) {
        newErrors.division =
          language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Division is required';
      }

      if (!formData.location?.district) {
        newErrors.district =
          language === 'bn' ? 'জেলা নির্বাচন করুন' : 'District is required';
      }

      if (!isValidIncidentCoordinates(formData.location?.lat, formData.location?.lng)) {
        newErrors.coordinates =
          language === 'bn'
            ? 'এগিয়ে যাওয়ার আগে ম্যাপে ঘটনাস্থল নির্বাচন করুন।'
            : 'Select the incident location on the map before continuing.';
      }

      // Harassment Identity Validation
      if (showsIdentitySection) {
        if (formData.privacyChoice === 'admin_only' && !formData.adminContact?.trim()) {
          newErrors.adminContact =
            language === 'bn'
              ? 'মডারেটরের সাথে যোগাযোগের নম্বর বা ইমেইল দিন'
              : 'Contact info is required for admin follow-up';
        }

        if (formData.privacyChoice === 'public_identity') {
          if (!formData.adminName?.trim()) {
            newErrors.adminName =
              language === 'bn' ? 'আপনার নাম উল্লেখ করুন' : 'Your name is required';
          }
          if (!formData.adminContact?.trim()) {
            newErrors.adminContact =
              language === 'bn' ? 'যোগাযোগের তথ্য দিন' : 'Contact info is required';
          }
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);

        if (newErrors.title || newErrors.description || newErrors.incidentDate) {
          const elem = document.getElementById('composer-section-narrative');
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (newErrors.division || newErrors.district || newErrors.coordinates) {
          const elem = document.getElementById('composer-section-location');
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (showsIdentitySection && (newErrors.adminContact || newErrors.adminName)) {
          const elem = document.getElementById('composer-section-identity');
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        return false;
      }

      setErrors({});
      return true;
    };

    useImperativeHandle(ref, () => ({
      validateAndProceed,
    }));

    // Check if extortion has primary party data
    const hasPrimaryPartyData = Boolean(
      formData.reportedSubject?.trim() ||
      formData.organization?.trim() ||
      formData.identifyingDescription?.trim() ||
      (formData.mentionedParties && formData.mentionedParties.length > 0)
    );

    return (
      <div className="space-y-4 md:space-y-5">
        {/* SECTION 1: What Happened & Timeline (ঘটনার বিবরণ ও সময়কাল) - NON-COLLAPSIBLE */}
        <Accordion
          id="composer-section-narrative"
          isOpen={true}
          collapsible={false}
          onToggle={() => {}}
          title={language === 'bn' ? '১. ঘটনার বিবরণ ও সময়কাল' : '1. What Happened & Timeline'}
          hasError={Boolean(errors.title || errors.description || errors.incidentDate)}
          icon={<FileText className="w-5 h-5" />}
        >
          <div className="space-y-4 pt-1 text-left">
            {/* Title / Headline: Compact with secondary action */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px] text-secondary">
                <span className="font-semibold text-primary truncate max-w-[70%]">
                  {formData.title || (language === 'bn' ? currentSubcategoryOption?.nameBn : currentSubcategoryOption?.nameEn) || (language === 'bn' ? 'অভিযোগ' : 'Complaint')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTitleField(!showTitleField)}
                  className="text-primary hover:underline cursor-pointer py-0.5 font-medium shrink-0 ml-2"
                >
                  {showTitleField
                    ? language === 'bn'
                      ? 'বাতিল'
                      : 'Cancel'
                    : language === 'bn'
                    ? 'শিরোনাম পরিবর্তন'
                    : 'Change title'}
                </button>
              </div>

              {showTitleField && (
                <div className="space-y-1 pt-1">
                  <input
                    id="complaint-title-input"
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => {
                      onUpdateFormData({ title: e.target.value });
                      if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    placeholder={
                      language === 'bn' ? 'সংক্ষিপ্ত শিরোনাম' : 'Short headline'
                    }
                    className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[15px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px] ${
                      errors.title ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-[13px] text-red-500 font-semibold">{errors.title}</p>
                  )}
                </div>
              )}
            </div>

            {/* Incident Narrative */}
            <div className="space-y-1">
              <label
                htmlFor="complaint-desc-input"
                className="block text-[14px] font-bold text-primary"
              >
                {language === 'bn' ? 'কী ঘটেছিল? *' : 'What happened? *'}
              </label>
              <textarea
                id="complaint-desc-input"
                rows={4}
                maxLength={2000}
                value={formData.description || ''}
                onChange={(e) => {
                  onUpdateFormData({ description: e.target.value });
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                placeholder={
                  language === 'bn'
                    ? 'ঘটনাটি সংক্ষেপে ও স্পষ্টভাবে লিখুন...'
                    : 'Describe the incident clearly...'
                }
                className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[15px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent leading-relaxed ${
                  errors.description ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                }`}
              />
              <div className="flex items-center justify-between gap-2">
                {errors.description ? (
                  <p className="text-[13px] text-red-500 font-semibold">{errors.description}</p>
                ) : (
                  <span />
                )}
                {(formData.description?.length || 0) >= 1600 && (
                  <span
                    className={`text-[12px] font-mono shrink-0 ml-auto ${
                      (formData.description?.length || 0) > 2000
                        ? 'text-red-500 font-bold'
                        : 'text-muted'
                    }`}
                  >
                    {formData.description?.length || 0} / 2000
                  </span>
                )}
              </div>
            </div>

            {/* Incident Date, Time & Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="complaint-date-input"
                  className="block text-[13px] font-bold text-primary mb-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{language === 'bn' ? 'ঘটনার তারিখ *' : 'Incident Date *'}</span>
                  </div>
                </label>
                <input
                  id="complaint-date-input"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.incidentDate || ''}
                  onChange={(e) => {
                    onUpdateFormData({ incidentDate: e.target.value });
                    if (errors.incidentDate) setErrors((prev) => ({ ...prev, incidentDate: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                    errors.incidentDate ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                  }`}
                />
                {errors.incidentDate && (
                  <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.incidentDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="complaint-time-input"
                  className="block text-[13px] font-bold text-primary mb-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-secondary" />
                    <span>{language === 'bn' ? 'সময় (ঐচ্ছিক)' : 'Time (Optional)'}</span>
                  </div>
                </label>
                <input
                  id="complaint-time-input"
                  type="time"
                  value={formData.incidentTime || ''}
                  onChange={(e) => onUpdateFormData({ incidentTime: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                />
              </div>

              <div>
                <label
                  htmlFor="complaint-frequency-select"
                  className="block text-[13px] font-bold text-primary mb-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-secondary" />
                    <span>{language === 'bn' ? 'পুনরাবৃত্তি' : 'Frequency'}</span>
                  </div>
                </label>
                <select
                  id="complaint-frequency-select"
                  value={formData.frequency || 'one-time'}
                  onChange={(e) =>
                    onUpdateFormData({ frequency: e.target.value as 'one-time' | 'repeated' })
                  }
                  className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[42px]"
                >
                  <option value="one-time">
                    {language === 'bn' ? 'এককালীন (One-time)' : 'One-time'}
                  </option>
                  <option value="repeated">
                    {language === 'bn' ? 'নিয়মিত / একাধিকবার' : 'Repeated / Ongoing'}
                  </option>
                </select>
              </div>
            </div>

            {/* Conditional Digital Threat Questions ONLY for Digital Harassment */}
            {isDigitalHarassment && (
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-subtle space-y-3 mt-2">
                <h4 className="text-[13px] font-bold text-primary">
                  {language === 'bn' ? 'অনলাইন ও ব্ল্যাকমেইল সংক্রান্ত সুনির্দিষ্ট তথ্য' : 'Digital Threat & Evidence Details'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="intimate-action-select"
                      className="block text-[13px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'কী ঘটেছে বা হুমকি দেওয়া হচ্ছে?' : 'Threat Status / Action'}
                    </label>
                    <select
                      id="intimate-action-select"
                      value={formData.intimateWhatHappened || ''}
                      onChange={(e) => onUpdateFormData({ intimateWhatHappened: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[42px]"
                    >
                      <option value="">{language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
                      {INTIMATE_WHAT_HAPPENED_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {language === 'bn' ? opt.nameBn : opt.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="intimate-platform-select"
                      className="block text-[13px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'কোন মাধ্যমে হুমকি বা অপপ্রচার হচ্ছে?' : 'Platform / Channel'}
                    </label>
                    <select
                      id="intimate-platform-select"
                      value={formData.intimatePlatform || ''}
                      onChange={(e) => onUpdateFormData({ intimatePlatform: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[42px]"
                    >
                      <option value="">{language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
                      {INTIMATE_PLATFORMS.map((plat) => (
                        <option key={plat.id} value={plat.id}>
                          {language === 'bn' ? plat.nameBn : plat.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Accordion>

        {/* SECTION 2: Location (লোকেশন) - NON-COLLAPSIBLE */}
        <Accordion
          id="composer-section-location"
          isOpen={true}
          collapsible={false}
          onToggle={() => {}}
          title={language === 'bn' ? '২. লোকেশন' : '2. Location'}
          hasError={Boolean(errors.division || errors.district || errors.coordinates)}
          icon={<MapPin className="w-5 h-5" />}
        >
          <div className="space-y-3.5 pt-1 text-left">
            {/* Single Short Sentence for Digital Harassment Location Helper */}
            {isDigitalHarassment && (
              <p className="text-[13px] text-secondary leading-normal">
                {language === 'bn'
                  ? 'অনলাইন বা ডিজিটাল ঘটনার ক্ষেত্রে প্রাসঙ্গিক এলাকা বা জেলা নির্বাচন করুন।'
                  : 'For online incidents, select the most relevant area or district.'}
              </p>
            )}

            {/* Simple Location Fields (Division, District, Area) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Division */}
              <div>
                <label
                  htmlFor="complaint-division-select"
                  className="block text-[13px] font-bold text-primary mb-1"
                >
                  {language === 'bn' ? 'বিভাগ *' : 'Division *'}
                </label>
                <select
                  id="complaint-division-select"
                  value={formData.location?.division || ''}
                  onChange={(e) => {
                    const divVal = e.target.value;
                    handleManualLocationChange({ division: divVal, district: '' });
                  }}
                  className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[42px] ${
                    errors.division ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                  }`}
                >
                  <option value="">{language === 'bn' ? '-- বিভাগ বেছে নিন --' : '-- Select Division --'}</option>
                  {DIVISIONS.map((div: DivisionInfo) => (
                    <option key={div.id} value={div.nameEn}>
                      {language === 'bn' ? div.nameBn : div.nameEn}
                    </option>
                  ))}
                </select>
                {errors.division && (
                  <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.division}</p>
                )}
              </div>

              {/* District */}
              <div>
                <label
                  htmlFor="complaint-district-select"
                  className="block text-[13px] font-bold text-primary mb-1"
                >
                  {language === 'bn' ? 'জেলা *' : 'District *'}
                </label>
                {availableDistricts.length > 0 ? (
                  <select
                    id="complaint-district-select"
                    value={formData.location?.district || ''}
                    onChange={(e) => {
                      handleManualLocationChange({ district: e.target.value });
                    }}
                    className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[42px] ${
                      errors.district ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                    }`}
                  >
                    <option value="">{language === 'bn' ? '-- জেলা বেছে নিন --' : '-- Select District --'}</option>
                    {availableDistricts.map((dst: DistrictInfo) => (
                      <option key={dst.id} value={dst.nameEn}>
                        {language === 'bn' ? dst.nameBn : dst.nameEn}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="complaint-district-input"
                    type="text"
                    value={formData.location?.district || ''}
                    onChange={(e) => {
                      handleManualLocationChange({ district: e.target.value });
                    }}
                    placeholder={language === 'bn' ? 'যেমন: ঢাকা / চট্টগ্রাম' : 'e.g. Dhaka, Chittagong'}
                    className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                      errors.district ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                    }`}
                  />
                )}
                {errors.district && (
                  <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.district}</p>
                )}
              </div>

              {/* Area / Neighborhood */}
              <div>
                <label
                  htmlFor="complaint-area-input"
                  className="block text-[13px] font-bold text-primary mb-1"
                >
                  {isDigitalHarassment
                    ? language === 'bn'
                      ? 'এলাকা / প্রাসঙ্গিক স্থান'
                      : 'Area / Relevant location'
                    : language === 'bn'
                    ? 'এলাকা / মহল্লা'
                    : 'Area / Neighborhood'}
                </label>
                <input
                  id="complaint-area-input"
                  type="text"
                  value={formData.location?.area || ''}
                  onChange={(e) => handleManualLocationChange({ area: e.target.value })}
                  placeholder={language === 'bn' ? 'যেমন: মিরপুর ১০, আগ্রাবাদ' : 'e.g. Mirpur 10, Agrabad'}
                  className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                />
              </div>
            </div>

            {/* Map Coordinate Picker - ALWAYS VISIBLE */}
            <div className="pt-2">
              <GoogleMapPicker
                location={
                  formData.location || {
                    division: '',
                    district: '',
                    area: '',
                    formattedAddress: '',
                    road: '',
                    landmark: '',
                    upazilaOrThana: '',
                  }
                }
                onMapPointChange={handleMapPointChange}
                language={language}
                error={errors.coordinates}
              />
            </div>

            {/* Optional Detailed Location Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleToggleDetailedLocation(!formData.isDetailedLocation)}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline cursor-pointer py-1"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    formData.isDetailedLocation ? 'rotate-180' : ''
                  }`}
                />
                <span>
                  {formData.isDetailedLocation
                    ? language === 'bn'
                      ? 'অতিরিক্ত ঠিকানার ঘরগুলো লুকান'
                      : 'Hide additional address fields'
                    : language === 'bn'
                    ? '+ বিস্তারিত ঠিকানা যোগ করুন (থানা, রাস্তা, ল্যান্ডমার্ক)'
                    : '+ Add detailed address (Thana, Road, Landmark)'}
                </span>
              </button>

              {formData.isDetailedLocation && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-subtle/60 mt-1.5">
                  <div>
                    <label
                      htmlFor="complaint-thana-input"
                      className="block text-[13px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'}
                    </label>
                    <input
                      id="complaint-thana-input"
                      type="text"
                      value={formData.location?.upazilaOrThana || ''}
                      onChange={(e) => handleManualLocationChange({ upazilaOrThana: e.target.value })}
                      placeholder={language === 'bn' ? 'যেমন: মিরপুর মডেল' : 'e.g. Mirpur Model'}
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="complaint-road-input"
                      className="block text-[13px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'রাস্তা / লেন' : 'Road / Lane'}
                    </label>
                    <input
                      id="complaint-road-input"
                      type="text"
                      value={formData.location?.road || ''}
                      onChange={(e) => handleManualLocationChange({ road: e.target.value })}
                      placeholder={language === 'bn' ? 'যেমন: রোড ৪, ব্লক বি' : 'e.g. Road 4, Block B'}
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="complaint-landmark-input"
                      className="block text-[13px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'নিকটবর্তী ল্যান্ডমার্ক' : 'Nearby Landmark'}
                    </label>
                    <input
                      id="complaint-landmark-input"
                      type="text"
                      value={formData.location?.landmark || ''}
                      onChange={(e) => handleManualLocationChange({ landmark: e.target.value })}
                      placeholder={language === 'bn' ? 'যেমন: মসজিদের পিছনে' : 'e.g. Behind mosque'}
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Accordion>

        {/* SECTION 3 (HARASSMENT): Identity & Privacy (পরিচয় ও গোপনীয়তা) - NON-COLLAPSIBLE */}
        {showsIdentitySection && (
          <Accordion
            id="composer-section-identity"
            isOpen={true}
            collapsible={false}
            onToggle={() => {}}
            title={language === 'bn' ? '৩. পরিচয় ও গোপনীয়তা' : '3. Identity & Privacy'}
            hasError={Boolean(errors.adminContact || errors.adminName)}
            icon={<Shield className="w-5 h-5" />}
          >
            <div className="space-y-3.5 pt-1 text-left">
              {/* Primary Toggle: Keep Identity Private */}
              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-subtle space-y-3">
                <Toggle
                  id="toggle-keep-identity-private"
                  checked={isIdentityPrivate}
                  onChange={(checked) => handlePrimaryPrivacyToggle(checked)}
                  label={
                    language === 'bn'
                      ? 'আমার পরিচয় ও যোগাযোগের তথ্য গোপন রাখুন'
                      : 'Keep my identity and contact information private'
                  }
                  description={
                    language === 'bn'
                      ? 'ডিফল্টভাবে আপনার পরিচয় ও যোগাযোগের তথ্য প্রকাশ করা হবে না।'
                      : 'Your identity and contact information are private by default.'
                  }
                  className="w-full"
                />

                {/* When Private is OFF -> Reveal Contact Fields */}
                {!isIdentityPrivate && (
                  <div className="pt-3 border-t border-subtle/70 space-y-3">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-primary">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {language === 'bn'
                          ? 'মডারেটরের সাথে যোগাযোগের তথ্য'
                          : 'Moderator Follow-up Contact Information'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="reporter-admin-name"
                          className="block text-[13px] font-semibold text-primary mb-1"
                        >
                          {language === 'bn' ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (Optional)'}
                        </label>
                        <input
                          id="reporter-admin-name"
                          type="text"
                          value={formData.adminName || ''}
                          onChange={(e) => onUpdateFormData({ adminName: e.target.value })}
                          placeholder={language === 'bn' ? 'নাম' : 'Name'}
                          className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                        />
                        {errors.adminName && (
                          <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.adminName}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="reporter-admin-contact"
                          className="block text-[13px] font-semibold text-primary mb-1"
                        >
                          {language === 'bn' ? 'মোবাইল নম্বর বা ইমেইল *' : 'Phone Number or Email *'}
                        </label>
                        <input
                          id="reporter-admin-contact"
                          type="text"
                          value={formData.adminContact || ''}
                          onChange={(e) => {
                            onUpdateFormData({ adminContact: e.target.value });
                            if (errors.adminContact)
                              setErrors((prev) => ({ ...prev, adminContact: '' }));
                          }}
                          placeholder={language === 'bn' ? '০১৭xxxxxxxx বা user@example.com' : '017xxxxxxxx or email'}
                          className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                            errors.adminContact ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                          }`}
                        />
                        {errors.adminContact && (
                          <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.adminContact}</p>
                        )}
                      </div>
                    </div>

                    {/* Secondary Optional Toggle: Request Public Identity */}
                    <div className="pt-1">
                      <Toggle
                        id="toggle-request-public-identity"
                        checked={isPublicIdentityRequested}
                        onChange={(checked) => handlePublicIdentityToggle(checked)}
                        label={
                          language === 'bn'
                            ? 'অনুমোদিত হলে আমার পরিচয় প্রকাশের অনুরোধ করছি'
                            : 'Request public identity if approved'
                        }
                        description={
                          language === 'bn'
                            ? 'অনুমোদিত হলে প্রকাশযোগ্য সংস্করণে আপনার নাম দেখানো হতে পারে।'
                            : 'If approved for public display, your name may appear in the public version.'
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Workflow Notice */}
              <div className="p-3 rounded-xl bg-surface border border-subtle flex items-start gap-2 text-[13px] text-secondary">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isIdentityPrivate
                    ? language === 'bn'
                      ? 'আপনার পরিচয় ও যোগাযোগের তথ্য প্রকাশযোগ্য সংস্করণে অন্তর্ভুক্ত হবে না।'
                      : 'Your identity and contact information will not be included in the public version.'
                    : language === 'bn'
                    ? 'আপনার যোগাযোগের তথ্য ব্যক্তিগত মডারেশন প্রক্রিয়ার মধ্যে থাকবে এবং স্বয়ংক্রিয়ভাবে প্রকাশ করা হবে না।'
                    : 'Your contact details remain within the private moderation workflow and are not automatically shown publicly.'}
                </p>
              </div>
            </div>
          </Accordion>
        )}

        {/* SECTION 3 (RICKSHAW & EXTORTION): Contextual Target / Party Info - NON-COLLAPSIBLE */}
        {showsPartySection && subjectConfig && (
          <Accordion
            id="composer-section-parties"
            isOpen={true}
            collapsible={false}
            onToggle={() => {}}
            title={language === 'bn' ? subjectConfig.sectionTitleBn : subjectConfig.sectionTitleEn}
            icon={<Users className="w-5 h-5" />}
          >
            <div className="space-y-4 pt-1 text-left">
              {/* Contextual Target Question & Choices */}
              <div>
                <label className="block text-[14px] font-bold text-primary mb-2">
                  {language === 'bn' ? subjectConfig.questionBn : subjectConfig.questionEn}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {subjectConfig.options.map((st) => {
                    const isSelected = (formData.subjectType || 'unknown') === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() =>
                          onUpdateFormData({
                            subjectType: st.value as SubjectTypeValue,
                          })
                        }
                        className={`px-2.5 py-2 rounded-xl text-[13px] sm:text-[14px] font-semibold border transition-all text-center min-h-[44px] flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-accent text-accent-fg border-accent shadow-xs'
                            : 'bg-surface hover:bg-surface-subtle border-subtle text-secondary'
                        }`}
                      >
                        {language === 'bn' ? st.labelBn : st.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contextual Fields based on selected Subject Type with Progressive Disclosure */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-subtle border border-subtle space-y-3">
                {/* 1. BUSINESS (Charging Station / Garage) */}
                {formData.subjectType === 'business' && (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="party-subject-name"
                        className="block text-[13px] font-bold text-primary mb-1"
                      >
                        {language === 'bn' ? 'স্টেশন / গ্যারেজের নাম (ঐচ্ছিক)' : 'Station / Garage Name (Optional)'}
                      </label>
                      <input
                        id="party-subject-name"
                        type="text"
                        value={formData.reportedSubject || ''}
                        onChange={(e) => onUpdateFormData({ reportedSubject: e.target.value })}
                        placeholder={
                          language === 'bn'
                            ? 'যেমন: সততা চার্জিং পয়েন্ট, ভাই ভাই গ্যারেজ'
                            : 'e.g. Satata Charging Point, Bhai Bhai Garage'
                        }
                        className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                      />
                    </div>

                    {/* Progressive Disclosure Toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowIdentifyingDetails(!showIdentifyingDetails)}
                        className="text-[13px] font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1 py-1"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIdentifyingDetails ? 'rotate-180' : ''}`} />
                        <span>
                          {showIdentifyingDetails
                            ? language === 'bn'
                              ? 'শনাক্তকারী তথ্য লুকান'
                              : 'Hide identifying details'
                            : language === 'bn'
                            ? '+ আরও শনাক্তকারী তথ্য'
                            : '+ Add identifying details'}
                        </span>
                      </button>

                      {showIdentifyingDetails && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-subtle/50 mt-1">
                          <div>
                            <label
                              htmlFor="party-contact"
                              className="block text-[13px] font-semibold text-secondary mb-1"
                            >
                              {language === 'bn' ? 'ফোন নম্বর বা যোগাযোগের তথ্য (ঐচ্ছিক)' : 'Phone Number or Contact Info (Optional)'}
                            </label>
                            <input
                              id="party-contact"
                              type="text"
                              value={formData.publicProfileHandle || ''}
                              onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                              placeholder={language === 'bn' ? '০১৭xxxxxxxx বা অন্যান্য' : '017xxxxxxxx or other'}
                              className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="party-identifying-desc"
                              className="block text-[13px] font-semibold text-secondary mb-1"
                            >
                              {language === 'bn' ? 'শনাক্তকরণ বা অবস্থানগত বিবরণ (ঐচ্ছিক)' : 'Identifying Description or Location Cues (Optional)'}
                            </label>
                            <input
                              id="party-identifying-desc"
                              type="text"
                              value={formData.identifyingDescription || ''}
                              onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                              placeholder={language === 'bn' ? 'অবস্থান সূত্র, সাইনবোর্ড বা বৈশিষ্ট্য...' : 'Location cues, signage or details...'}
                              className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. INDIVIDUAL */}
                {formData.subjectType === 'individual' && (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="party-subject-name"
                        className="block text-[13px] font-bold text-primary mb-1"
                      >
                        {language === 'bn' ? 'নাম বা পরিচিত নাম (ঐচ্ছিক)' : 'Name or Known Identity (Optional)'}
                      </label>
                      <input
                        id="party-subject-name"
                        type="text"
                        value={formData.reportedSubject || ''}
                        onChange={(e) => onUpdateFormData({ reportedSubject: e.target.value })}
                        placeholder={
                          language === 'bn'
                            ? 'যেমন: রহিম (লাইন ইনচার্জ), কাশেম'
                            : 'e.g. Rahim (Line In-charge), Kashem'
                        }
                        className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                      />
                    </div>

                    {/* Progressive Disclosure Toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowIdentifyingDetails(!showIdentifyingDetails)}
                        className="text-[13px] font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1 py-1"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIdentifyingDetails ? 'rotate-180' : ''}`} />
                        <span>
                          {showIdentifyingDetails
                            ? language === 'bn'
                              ? 'শনাক্তকারী তথ্য লুকান'
                              : 'Hide identifying details'
                            : language === 'bn'
                            ? '+ আরও শনাক্তকারী তথ্য'
                            : '+ Add identifying details'}
                        </span>
                      </button>

                      {showIdentifyingDetails && (
                        <div className="space-y-2.5 pt-2.5 border-t border-subtle/50 mt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="party-role"
                                className="block text-[13px] font-semibold text-secondary mb-1"
                              >
                                {formData.subcategoryId === 'transport-movement'
                                  ? language === 'bn'
                                    ? 'পদবি, ভূমিকা বা গাড়ির নম্বর (ঐচ্ছিক)'
                                    : 'Role, Vehicle No. or Designation (Optional)'
                                  : language === 'bn'
                                  ? 'পদবি বা ভূমিকা (ঐচ্ছিক)'
                                  : 'Role or Designation (Optional)'}
                              </label>
                              <input
                                id="party-role"
                                type="text"
                                value={formData.roleOrDesignation || ''}
                                onChange={(e) => onUpdateFormData({ roleOrDesignation: e.target.value })}
                                placeholder={language === 'bn' ? 'যেমন: লাইনম্যান, সুপারভাইজার' : 'e.g. Lineman, Supervisor'}
                                className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="party-contact"
                                className="block text-[13px] font-semibold text-secondary mb-1"
                              >
                                {language === 'bn' ? 'ফোন নম্বর বা যোগাযোগের তথ্য (ঐচ্ছিক)' : 'Phone Number or Contact Info (Optional)'}
                              </label>
                              <input
                                id="party-contact"
                                type="text"
                                value={formData.publicProfileHandle || ''}
                                onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                                placeholder={language === 'bn' ? '০১৭xxxxxxxx বা অন্যান্য' : '017xxxxxxxx or other'}
                                className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="party-identifying-desc"
                              className="block text-[13px] font-semibold text-secondary mb-1"
                            >
                              {language === 'bn' ? 'শারীরিক বা অন্যান্য শনাক্তকরণ বিবরণ (ঐচ্ছিক)' : 'Physical or Identifying Description (Optional)'}
                            </label>
                            <input
                              id="party-identifying-desc"
                              type="text"
                              value={formData.identifyingDescription || ''}
                              onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                              placeholder={language === 'bn' ? 'শারীরিক বৈশিষ্ট্য বা অন্যান্য তথ্য...' : 'Physical traits or details...'}
                              className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. GROUP / SYNDICATE */}
                {formData.subjectType === 'group' && (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="party-subject-name"
                        className="block text-[13px] font-bold text-primary mb-1"
                      >
                        {language === 'bn' ? 'দল / সিন্ডিকেটের নাম (ঐচ্ছিক)' : 'Group / Syndicate Name (Optional)'}
                      </label>
                      <input
                        id="party-subject-name"
                        type="text"
                        value={formData.reportedSubject || ''}
                        onChange={(e) => onUpdateFormData({ reportedSubject: e.target.value })}
                        placeholder={
                          language === 'bn'
                            ? 'যেমন: স্থানীয় অমুক গ্রুপ, সিন্ডিকেট'
                            : 'e.g. Local Group, Syndicate'
                        }
                        className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                      />
                    </div>

                    {/* Progressive Disclosure Toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowIdentifyingDetails(!showIdentifyingDetails)}
                        className="text-[13px] font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1 py-1"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIdentifyingDetails ? 'rotate-180' : ''}`} />
                        <span>
                          {showIdentifyingDetails
                            ? language === 'bn'
                              ? 'শনাক্তকারী তথ্য লুকান'
                              : 'Hide identifying details'
                            : language === 'bn'
                            ? '+ আরও শনাক্তকারী তথ্য'
                            : '+ Add identifying details'}
                        </span>
                      </button>

                      {showIdentifyingDetails && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-subtle/50 mt-1">
                          <div>
                            <label
                              htmlFor="party-contact"
                              className="block text-[13px] font-semibold text-secondary mb-1"
                            >
                              {language === 'bn' ? 'পরিচিত কোনো ব্যক্তির নাম বা যোগাযোগ (ঐচ্ছিক)' : 'Known Contact / Person (Optional)'}
                            </label>
                            <input
                              id="party-contact"
                              type="text"
                              value={formData.publicProfileHandle || ''}
                              onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                              placeholder={language === 'bn' ? 'নাম বা ফোন নম্বর' : 'Name or phone'}
                              className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="party-identifying-desc"
                              className="block text-[13px] font-semibold text-secondary mb-1"
                            >
                              {language === 'bn' ? 'সদস্যদের বিবরণ বা কার্যক্রমের ধরন (ঐচ্ছিক)' : 'Group Description or Activity Details (Optional)'}
                            </label>
                            <input
                              id="party-identifying-desc"
                              type="text"
                              value={formData.identifyingDescription || ''}
                              onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                              placeholder={language === 'bn' ? 'সদস্য সংখ্যা, ব্যবহৃত যানবাহন...' : 'Members count, vehicles used...'}
                              className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. ORGANIZATION */}
                {formData.subjectType === 'organization' && (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="party-org-name"
                        className="block text-[13px] font-bold text-primary mb-1"
                      >
                        {language === 'bn'
                          ? 'প্রতিষ্ঠান / সমিতি / কমিটির নাম (ঐচ্ছিক)'
                          : 'Organization / Association Name (Optional)'}
                      </label>
                      <input
                        id="party-org-name"
                        type="text"
                        value={formData.organization || formData.reportedSubject || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateFormData({
                            organization: val,
                            reportedSubject: val,
                          });
                        }}
                        placeholder={
                          language === 'bn'
                            ? 'যেমন: অমুক পরিবহন সমিতি, বাজার মালিক সমিতি'
                            : 'e.g. Transport Association, Market Committee'
                        }
                        className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                      />
                    </div>

                    {/* Progressive Disclosure Toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowIdentifyingDetails(!showIdentifyingDetails)}
                        className="text-[13px] font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1 py-1"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIdentifyingDetails ? 'rotate-180' : ''}`} />
                        <span>
                          {showIdentifyingDetails
                            ? language === 'bn'
                              ? 'শনাক্তকারী তথ্য লুকান'
                              : 'Hide identifying details'
                            : language === 'bn'
                            ? '+ আরও শনাক্তকারী তথ্য'
                            : '+ Add identifying details'}
                        </span>
                      </button>

                      {showIdentifyingDetails && (
                        <div className="space-y-2.5 pt-2.5 border-t border-subtle/50 mt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="party-role"
                                className="block text-[13px] font-semibold text-secondary mb-1"
                              >
                                {language === 'bn' ? 'দায়িত্বশীল ব্যক্তির নাম বা পদবি (ঐচ্ছিক)' : 'Responsible Person or Designation (Optional)'}
                              </label>
                              <input
                                id="party-role"
                                type="text"
                                value={formData.roleOrDesignation || ''}
                                onChange={(e) => onUpdateFormData({ roleOrDesignation: e.target.value })}
                                placeholder={language === 'bn' ? 'যেমন: সাধারণ সম্পাদক, ম্যানেজার' : 'e.g. Secretary, Manager'}
                                className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="party-contact"
                                className="block text-[13px] font-semibold text-secondary mb-1"
                              >
                                {language === 'bn' ? 'যোগাযোগ বা ফোন নম্বর (ঐচ্ছিক)' : 'Contact or Phone (Optional)'}
                              </label>
                              <input
                                id="party-contact"
                                type="text"
                                value={formData.publicProfileHandle || ''}
                                onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                                placeholder={language === 'bn' ? '০১৭xxxxxxxx বা অফিস নম্বর' : '017xxxxxxxx or office'}
                                className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="party-identifying-desc"
                              className="block text-[13px] font-semibold text-secondary mb-1"
                            >
                              {language === 'bn' ? 'অন্যান্য বিবরণ (ঐচ্ছিক)' : 'Other Details (Optional)'}
                            </label>
                            <input
                              id="party-identifying-desc"
                              type="text"
                              value={formData.identifyingDescription || ''}
                              onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                              placeholder={language === 'bn' ? 'অফিস বা ভবনের বিবরণ...' : 'Office or building details...'}
                              className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. UNKNOWN */}
                {formData.subjectType === 'unknown' && (
                  <div>
                    <label
                      htmlFor="party-unknown-desc"
                      className="block text-[13px] font-bold text-primary mb-1"
                    >
                      {language === 'bn' ? 'যা জানেন লিখুন (ঐচ্ছিক)' : 'Describe what you know (Optional)'}
                    </label>
                    <textarea
                      id="party-unknown-desc"
                      rows={2}
                      value={formData.identifyingDescription || ''}
                      onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                      placeholder={
                        language === 'bn'
                          ? 'শারীরিক বৈশিষ্ট্য, ফোন নম্বর, অনলাইন অ্যাকাউন্ট, গাড়ির বিবরণ বা কোনো সূত্র...'
                          : 'Appearance, phone number, online account, vehicle details, location clue...'
                      }
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Additional Mentioned Parties: Only for Extortion when primary party has data or parties exist */}
              {segment === 'extortion' && (
                <div className="space-y-3 pt-1">
                  {formData.mentionedParties && formData.mentionedParties.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[13px] font-bold text-primary">
                        {language === 'bn' ? 'অতিরিক্ত সংশ্লিষ্ট পক্ষসমূহ' : 'Additional Mentioned Parties'}
                      </h4>
                      {formData.mentionedParties.map((party, pIdx) => (
                        <div
                          key={party.id || pIdx}
                          className="p-3 rounded-xl bg-surface border border-subtle space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-primary">
                              {language === 'bn' ? `পক্ষ #${pIdx + 2}` : `Party #${pIdx + 2}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalParty(party.id)}
                              className="inline-flex items-center gap-1 text-[12px] text-red-500 hover:underline cursor-pointer p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={party.name || ''}
                              onChange={(e) => handleUpdateAdditionalParty(party.id, { name: e.target.value })}
                              placeholder={language === 'bn' ? 'নাম / পরিচিতি' : 'Name / Title'}
                              className="w-full px-2.5 py-1.5 bg-surface border border-subtle rounded-lg text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[38px]"
                            />
                            <input
                              type="text"
                              value={party.roleOrDesignation || ''}
                              onChange={(e) =>
                                handleUpdateAdditionalParty(party.id, { roleOrDesignation: e.target.value })
                              }
                              placeholder={language === 'bn' ? 'ভূমিকা / পদবি' : 'Role / Designation'}
                              className="w-full px-2.5 py-1.5 bg-surface border border-subtle rounded-lg text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[38px]"
                            />
                            <input
                              type="text"
                              value={party.organization || ''}
                              onChange={(e) =>
                                handleUpdateAdditionalParty(party.id, { organization: e.target.value })
                              }
                              placeholder={language === 'bn' ? 'প্রতিষ্ঠান / সমিতি' : 'Organization'}
                              className="w-full px-2.5 py-1.5 bg-surface border border-subtle rounded-lg text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[38px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Another Party Action - Only visible after primary party has info */}
                  {hasPrimaryPartyData && (
                    <div>
                      <button
                        type="button"
                        onClick={handleAddAdditionalParty}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-subtle text-[13px] font-semibold text-primary cursor-pointer transition-colors min-h-[38px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {language === 'bn'
                            ? '+ আরও একটি পক্ষ যোগ করুন'
                            : '+ Add another party'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Accordion>
        )}

        {/* SECTION 4: Attachments (সংযুক্তি - ঐচ্ছিক) - COLLAPSIBLE */}
        <Accordion
          id="composer-section-attachments"
          isOpen={Boolean(openSections.attachments)}
          collapsible={true}
          onToggle={() => toggleSection('attachments')}
          title={language === 'bn' ? '৪. সংযুক্তি (ঐচ্ছিক)' : '4. Attachments (Optional)'}
          summary={
            pendingImages.length > 0
              ? `${pendingImages.length} ${language === 'bn' ? 'টি ছবি সংযুক্ত' : 'images attached'}`
              : language === 'bn'
              ? 'কোনো ছবি সংযুক্ত নেই'
              : 'No images attached'
          }
          badge={
            pendingImages.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent text-[13px] font-bold">
                {pendingImages.length}
              </span>
            ) : undefined
          }
          icon={<Paperclip className="w-5 h-5" />}
        >
          <div className="space-y-3.5 pt-1 text-left">
            <p className="text-[13px] text-secondary">
              {language === 'bn'
                ? 'অভিযোগ বুঝতে সহায়ক ছবি বা স্ক্রিনশট থাকলে সংযুক্ত করুন। এটি সম্পূর্ণ ঐচ্ছিক।'
                : 'Attach images or screenshots if they help explain the complaint. This is completely optional.'}
            </p>

            {formData.pendingEvidenceRecovery &&
              formData.pendingEvidenceRecovery.expectedCount > 0 &&
              pendingImages.length === 0 && (
                <div
                  id="pending-evidence-recovery-warning"
                  className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-2 text-[13px]"
                >
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {language === 'bn'
                          ? 'পূর্বে সংযুক্ত প্রমাণাদি পুনরায় নির্বাচন করুন'
                          : 'Please reattach your previous evidence images'}
                      </p>
                      <p className="text-[12.5px] opacity-90 leading-relaxed">
                        {language === 'bn'
                          ? `আপনার সংরক্ষিত খসড়ায় ${formData.pendingEvidenceRecovery.expectedCount}টি ছবি সংযুক্ত ছিল। জমা সম্পন্ন করতে নিচের ফাইল পিকার থেকে ছবিগুলো পুনরায় নির্বাচন করুন। আপনি চাইলে খসড়া বাতিল করে নতুন অভিযোগও শুরু করতে পারেন।`
                          : `Your saved draft had ${formData.pendingEvidenceRecovery.expectedCount} image(s) attached. Please reattach the files below to complete your submission, or discard the draft to start a new complaint.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Image Attachment Picker - max 6 images */}
            <ImageAttachmentPicker
              images={pendingImages}
              onChange={(imgs) => {
                onPendingImagesChange(imgs);
                onUpdateFormData({
                  hasSupportingInfo: imgs.length > 0,
                });
              }}
              maxImages={6}
              language={language}
            />
          </div>
        </Accordion>
      </div>
    );
  }
);
