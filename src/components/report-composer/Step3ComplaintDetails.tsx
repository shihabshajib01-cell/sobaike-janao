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
  Edit2,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { DraftReport, ReportLocationData, MentionedParty } from '../../services/types';
import {
  SEGMENT_SUBCATEGORIES,
  INTIMATE_WHAT_HAPPENED_OPTIONS,
  INTIMATE_PLATFORMS,
} from '../../data/reportOptions';
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

    // Determine active subcategory option
    const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
      (s) => s.id === formData.subcategoryId
    );
    const isSensitiveSubcat = Boolean(currentSubcategoryOption?.isSensitive);
    const isDigitalHarassment =
      segment === 'harassment' && currentSubcategoryOption?.categoryGroup === 'digital_intimate';

    // Accordion visibility states - segment aware defaults
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

    // Toggle specific accordion - Mandatory/core sections stay expanded
    const toggleSection = (secKey: string) => {
      if (secKey === 'narrative' || secKey === 'location') {
        return;
      }
      if (showsPartySection && secKey === 'parties') {
        return;
      }
      setOpenSections((prev) => ({
        ...prev,
        [secKey]: !prev[secKey],
      }));
    };

    // Location Handlers
    const handleLocationChange = (locUpdates: Partial<DraftReport['location']>) => {
      onUpdateFormData({
        location: {
          formattedAddress: formData.location?.formattedAddress || '',
          division: formData.location?.division || '',
          district: formData.location?.district || '',
          upazilaOrThana: formData.location?.upazilaOrThana || '',
          area: formData.location?.area || '',
          road: formData.location?.road || '',
          landmark: formData.location?.landmark || '',
          ...locUpdates,
        },
      });
    };

    const handleToggleDetailedLocation = (enabled: boolean) => {
      if (!enabled) {
        onUpdateFormData({
          isDetailedLocation: false,
          location: {
            division: formData.location?.division || '',
            district: formData.location?.district || '',
            area: formData.location?.area || '',
            formattedAddress: formData.location?.formattedAddress || '',
            upazilaOrThana: '',
            road: '',
            landmark: '',
            lat: undefined,
            lng: undefined,
            placeId: undefined,
          },
        });
      } else {
        onUpdateFormData({ isDetailedLocation: true });
      }
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

    // Mentioned Parties Handlers (Rickshaw / Extortion only)
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

    // Title progressive disclosure toggle
    const [showTitleField, setShowTitleField] = useState<boolean>(false);

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

        // Keep all required/core sections open when errors exist
        setOpenSections((prev) => ({
          ...prev,
          narrative: true,
          location: true,
          identity: showsIdentitySection ? true : prev.identity,
          parties: showsPartySection ? true : prev.parties,
          attachments: prev.attachments || false,
        }));

        if (newErrors.title || newErrors.description || newErrors.incidentDate) {
          const elem = document.getElementById('composer-section-narrative');
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (newErrors.division || newErrors.district) {
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

    return (
      <div className="space-y-6">
        {/* Step Header */}
        <div className="space-y-1.5 text-left">
          <h3 className="text-[20px] md:text-[22px] font-bold text-primary">
            {language === 'bn' ? '৩. অভিযোগের বিস্তারিত বিবরণ' : '3. Complaint Details'}
          </h3>
          <p className="text-[14px] md:text-[16px] leading-relaxed text-secondary">
            {language === 'bn'
              ? 'ঘটনাটির সুষ্ঠু ও নিরপেক্ষ পর্যালোচনার জন্য নিচে দেওয়া বিভাগগুলোতে তথ্য প্রদান করুন।'
              : 'Provide the structured details below for responsible moderation review.'}
          </p>
        </div>

        {/* SECTION 1: What Happened & Timeline (ঘটনার বিবরণ ও সময়কাল) - ALWAYS OPEN */}
        <Accordion
          id="composer-section-narrative"
          isOpen={Boolean(openSections.narrative)}
          onToggle={() => toggleSection('narrative')}
          title={language === 'bn' ? '১. ঘটনার বিবরণ ও সময়কাল' : '1. What Happened & Timeline'}
          summary={
            formData.description
              ? formData.description.slice(0, 45) + (formData.description.length > 45 ? '...' : '')
              : language === 'bn'
              ? 'বিস্তারিত বিবরণ ও তারিখ'
              : 'Detailed description & date'
          }
          hasError={Boolean(errors.title || errors.description || errors.incidentDate)}
          icon={<FileText className="w-5 h-5" />}
        >
          <div className="space-y-4 pt-2 text-left">
            {/* Title / Headline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-semibold text-secondary">
                  {language === 'bn' ? 'অভিযোগের শিরোনাম:' : 'Complaint Headline:'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTitleField(!showTitleField)}
                  className="inline-flex items-center gap-1 text-[14px] text-primary hover:underline cursor-pointer py-0.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>
                    {showTitleField
                      ? language === 'bn'
                        ? 'শিরোনাম লুকান'
                        : 'Hide title'
                      : language === 'bn'
                      ? 'শিরোনাম সম্পাদনা করুন (ঐচ্ছিক)'
                      : 'Edit short title (optional)'}
                  </span>
                </button>
              </div>

              {showTitleField ? (
                <div className="space-y-1">
                  <input
                    id="complaint-title-input"
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => {
                      onUpdateFormData({ title: e.target.value });
                      if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    placeholder={
                      language === 'bn'
                        ? 'সংক্ষিপ্ত শিরোনাম'
                        : 'Short headline'
                    }
                    className={`w-full px-4 py-2.5 bg-surface border rounded-xl text-[16px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px] ${
                      errors.title ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                    }`}
                  />
                  {errors.title && <p className="text-[14px] text-red-500 mt-1 font-semibold">{errors.title}</p>}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[15px] font-semibold text-primary">
                  {formData.title || (language === 'bn' ? currentSubcategoryOption?.nameBn : currentSubcategoryOption?.nameEn) || 'Complaint'}
                </div>
              )}
            </div>

            {/* Incident Narrative */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="complaint-desc-input"
                  className="block text-[14px] font-bold text-primary"
                >
                  {language === 'bn' ? 'কী ঘটেছিল? (ঘটনার পূর্ণ বিবরণ) *' : 'What Happened? (Detailed Description) *'}
                </label>
                <span className="text-[14px] text-muted font-medium">
                  {(formData.description || '').length} {language === 'bn' ? 'অক্ষর' : 'chars'}
                </span>
              </div>
              <textarea
                id="complaint-desc-input"
                rows={5}
                value={formData.description || ''}
                onChange={(e) => {
                  onUpdateFormData({ description: e.target.value });
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                placeholder={
                  language === 'bn'
                    ? 'কী ঘটেছিল, কীভাবে ঘটনাটি ঘটেছে এবং এর প্রভাব কী ছিল তা স্পষ্ট করে লিখুন...'
                    : 'Explain what happened, how the incident occurred, and its impact...'
                }
                className={`w-full px-4 py-3 bg-surface border rounded-xl text-[16px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent leading-relaxed ${
                  errors.description ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                }`}
              />
              {errors.description && (
                <p className="text-[14px] text-red-500 mt-1 font-semibold">{errors.description}</p>
              )}
            </div>

            {/* Incident Date, Time & Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label
                  htmlFor="complaint-date-input"
                  className="block text-[14px] font-bold text-primary mb-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
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
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px] ${
                    errors.incidentDate ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                  }`}
                />
                {errors.incidentDate && (
                  <p className="text-[14px] text-red-500 mt-1 font-semibold">{errors.incidentDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="complaint-time-input"
                  className="block text-[14px] font-bold text-primary mb-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{language === 'bn' ? 'আনুমানিক সময় (ঐচ্ছিক)' : 'Approx Time (Optional)'}</span>
                  </div>
                </label>
                <input
                  id="complaint-time-input"
                  type="time"
                  value={formData.incidentTime || ''}
                  onChange={(e) => onUpdateFormData({ incidentTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="complaint-frequency-select"
                  className="block text-[14px] font-bold text-primary mb-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Repeat className="w-4 h-4 text-primary" />
                    <span>{language === 'bn' ? 'ঘটনার পুনরাবৃত্তি' : 'Incident Frequency'}</span>
                  </div>
                </label>
                <select
                  id="complaint-frequency-select"
                  value={formData.frequency || 'one-time'}
                  onChange={(e) =>
                    onUpdateFormData({ frequency: e.target.value as 'one-time' | 'repeated' })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[44px]"
                >
                  <option value="one-time">
                    {language === 'bn' ? 'এককালীন ঘটনা (One-time)' : 'One-time Incident'}
                  </option>
                  <option value="repeated">
                    {language === 'bn' ? 'একাধিকবার / নিয়মিত (Repeated)' : 'Repeated / Ongoing'}
                  </option>
                </select>
              </div>
            </div>

            {/* Conditional Digital Threat Questions if sensitive category (Harassment) */}
            {isSensitiveSubcat && (
              <div className="p-4 rounded-xl bg-surface-subtle border border-subtle space-y-3.5 mt-2">
                <h4 className="text-[14px] font-bold text-primary">
                  {language === 'bn' ? 'অনলাইন ও ব্ল্যাকমেইল সংক্রান্ত সুনির্দিষ্ট তথ্য' : 'Digital Threat & Evidence Details'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="intimate-action-select"
                      className="block text-[14px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'কী ঘটেছে বা হুমকি দেওয়া হচ্ছে?' : 'Threat Status / Action'}
                    </label>
                    <select
                      id="intimate-action-select"
                      value={formData.intimateWhatHappened || ''}
                      onChange={(e) => onUpdateFormData({ intimateWhatHappened: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[44px]"
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
                      className="block text-[14px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'কোন মাধ্যমে হুমকি বা অপপ্রচার হচ্ছে?' : 'Platform / Channel'}
                    </label>
                    <select
                      id="intimate-platform-select"
                      value={formData.intimatePlatform || ''}
                      onChange={(e) => onUpdateFormData({ intimatePlatform: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[44px]"
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

        {/* SECTION 2: Location (লোকেশন) - ALWAYS OPEN */}
        <Accordion
          id="composer-section-location"
          isOpen={Boolean(openSections.location)}
          onToggle={() => toggleSection('location')}
          title={language === 'bn' ? '২. লোকেশন' : '2. Location'}
          summary={
            formData.location?.district && formData.location?.area
              ? `${formData.location.district}, ${formData.location.area}`
              : formData.location?.district
              ? formData.location.district
              : language === 'bn'
              ? 'বিভাগ, জেলা ও এলাকা'
              : 'Division, district & area'
          }
          hasError={Boolean(errors.division || errors.district)}
          icon={<MapPin className="w-5 h-5" />}
        >
          <div className="space-y-4 pt-2 text-left">
            {/* Conditional Digital Harassment Location Helper */}
            {isDigitalHarassment && (
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-subtle text-[14px] text-secondary leading-relaxed">
                <p>
                  {language === 'bn'
                    ? 'অনলাইন বা ডিজিটাল ঘটনার ক্ষেত্রে প্রতিবেদনের সঙ্গে সবচেয়ে প্রাসঙ্গিক এলাকা নির্বাচন করুন। সুনির্দিষ্ট শারীরিক স্থান না থাকলে আপনার জানা প্রাসঙ্গিক এলাকা দিন।'
                    : 'For online or digital incidents, choose the area most relevant to the report. If there is no specific physical incident location, provide the most relevant area you know.'}
                </p>
              </div>
            )}

            {/* Simple Location Fields (Division, District, Area) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Division */}
              <div>
                <label
                  htmlFor="complaint-division-select"
                  className="block text-[14px] font-bold text-primary mb-1.5"
                >
                  {language === 'bn' ? 'বিভাগ *' : 'Division *'}
                </label>
                <select
                  id="complaint-division-select"
                  value={formData.location?.division || ''}
                  onChange={(e) => {
                    const divVal = e.target.value;
                    handleLocationChange({ division: divVal, district: '' });
                    if (errors.division) setErrors((prev) => ({ ...prev, division: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[44px] ${
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
                  <p className="text-[14px] text-red-500 mt-1 font-semibold">{errors.division}</p>
                )}
              </div>

              {/* District */}
              <div>
                <label
                  htmlFor="complaint-district-select"
                  className="block text-[14px] font-bold text-primary mb-1.5"
                >
                  {language === 'bn' ? 'জেলা *' : 'District *'}
                </label>
                {availableDistricts.length > 0 ? (
                  <select
                    id="complaint-district-select"
                    value={formData.location?.district || ''}
                    onChange={(e) => {
                      handleLocationChange({ district: e.target.value });
                      if (errors.district) setErrors((prev) => ({ ...prev, district: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[44px] ${
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
                      handleLocationChange({ district: e.target.value });
                      if (errors.district) setErrors((prev) => ({ ...prev, district: '' }));
                    }}
                    placeholder={language === 'bn' ? ' যেমন: ঢাকা / চট্টগ্রাম' : 'e.g. Dhaka, Chittagong'}
                    className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px] ${
                      errors.district ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                    }`}
                  />
                )}
                {errors.district && (
                  <p className="text-[14px] text-red-500 mt-1 font-semibold">{errors.district}</p>
                )}
              </div>

              {/* Area / Neighborhood */}
              <div>
                <label
                  htmlFor="complaint-area-input"
                  className="block text-[14px] font-bold text-primary mb-1.5"
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
                  onChange={(e) => handleLocationChange({ area: e.target.value })}
                  placeholder={language === 'bn' ? 'যেমন: মিরপুর ১০, আগ্রাবাদ' : 'e.g. Mirpur 10, Agrabad'}
                  className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                />
              </div>
            </div>

            {/* Detailed Location & Map Picker */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleToggleDetailedLocation(!formData.isDetailedLocation)}
                className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-primary hover:underline cursor-pointer py-1.5 min-h-[44px]"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    formData.isDetailedLocation ? 'rotate-180' : ''
                  }`}
                />
                <span>
                  {formData.isDetailedLocation
                    ? language === 'bn'
                      ? 'ম্যাপ ও বিশদ ঠিকানা লুকান'
                      : 'Hide detailed location & map'
                    : language === 'bn'
                    ? '+ বিস্তারিত ঠিকানা যোগ করুন'
                    : '+ Add detailed location'}
                </span>
              </button>

              {formData.isDetailedLocation && (
                <div className="space-y-4 pt-3 border-t border-subtle/60 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="complaint-thana-input"
                        className="block text-[14px] font-semibold text-secondary mb-1"
                      >
                        {language === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'}
                      </label>
                      <input
                        id="complaint-thana-input"
                        type="text"
                        value={formData.location?.upazilaOrThana || ''}
                        onChange={(e) => handleLocationChange({ upazilaOrThana: e.target.value })}
                        placeholder={language === 'bn' ? 'যেমন: মিরপুর মডেল থানা' : 'e.g. Mirpur Model'}
                        className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="complaint-road-input"
                        className="block text-[14px] font-semibold text-secondary mb-1"
                      >
                        {language === 'bn' ? 'রাস্তা / লেন' : 'Road / Lane'}
                      </label>
                      <input
                        id="complaint-road-input"
                        type="text"
                        value={formData.location?.road || ''}
                        onChange={(e) => handleLocationChange({ road: e.target.value })}
                        placeholder={language === 'bn' ? 'যেমন: রোড নং ৪, ব্লক বি' : 'e.g. Road 4, Block B'}
                        className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="complaint-landmark-input"
                        className="block text-[14px] font-semibold text-secondary mb-1"
                      >
                        {language === 'bn' ? 'নিকটবর্তী ল্যান্ডমার্ক' : 'Nearby Landmark'}
                      </label>
                      <input
                        id="complaint-landmark-input"
                        type="text"
                        value={formData.location?.landmark || ''}
                        onChange={(e) => handleLocationChange({ landmark: e.target.value })}
                        placeholder={language === 'bn' ? 'যেমন: মসজিদের পিছনে' : 'e.g. Behind central mosque'}
                        className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* Google Map Coordinate Picker */}
                  <div className="pt-2">
                    <label className="block text-[14px] font-bold text-primary mb-1.5">
                      {language === 'bn' ? 'ম্যাপে সুনির্দিষ্ট পয়েন্ট নির্বাচন' : 'Pick Coordinates on Map'}
                    </label>
                    <GoogleMapPicker
                      location={formData.location || { division: '', district: '', area: '', formattedAddress: '' }}
                      onChange={(loc: ReportLocationData) => handleLocationChange(loc)}
                      language={language}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Accordion>

        {/* SECTION 3 (HARASSMENT): Identity & Privacy (পরিচয় ও গোপনীয়তা) */}
        {showsIdentitySection && (
          <Accordion
            id="composer-section-identity"
            isOpen={Boolean(openSections.identity)}
            onToggle={() => toggleSection('identity')}
            title={language === 'bn' ? '৩. পরিচয় ও গোপনীয়তা' : '3. Identity & Privacy'}
            summary={
              formData.privacyChoice === 'anonymous'
                ? language === 'bn'
                  ? 'সম্পূর্ণ অজ্ঞাতনামা (Anonymous)'
                  : 'Anonymous (Default)'
                : formData.privacyChoice === 'admin_only'
                ? language === 'bn'
                  ? 'মডারেটরের জন্য সংরক্ষিত (Admin Only)'
                  : 'Admin Only'
                : language === 'bn'
                ? 'অনুমোদিত হলে প্রকাশ্য পরিচয় (Public)'
                : 'Public Identity (If Approved)'
            }
            hasError={Boolean(errors.adminContact || errors.adminName)}
            icon={<Shield className="w-5 h-5" />}
          >
            <div className="space-y-4 pt-2 text-left">
              {/* Primary Toggle: Keep Identity Private */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-subtle space-y-3">
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
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-primary">
                      <Lock className="w-4 h-4 text-primary" />
                      <span>
                        {language === 'bn'
                          ? 'মডারেটরের সাথে যোগাযোগের তথ্য'
                          : 'Moderator Follow-up Contact Information'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="reporter-admin-name"
                          className="block text-[14px] font-semibold text-primary mb-1"
                        >
                          {language === 'bn' ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (Optional)'}
                        </label>
                        <input
                          id="reporter-admin-name"
                          type="text"
                          value={formData.adminName || ''}
                          onChange={(e) => onUpdateFormData({ adminName: e.target.value })}
                          placeholder={language === 'bn' ? 'নাম' : 'Name'}
                          className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                        />
                        {errors.adminName && (
                          <p className="text-[14px] text-red-500 mt-1 font-semibold">{errors.adminName}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="reporter-admin-contact"
                          className="block text-[14px] font-semibold text-primary mb-1"
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
                          className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px] ${
                            errors.adminContact ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                          }`}
                        />
                        {errors.adminContact && (
                          <p className="text-[14px] text-red-500 mt-1 font-semibold">{errors.adminContact}</p>
                        )}
                      </div>
                    </div>

                    {/* Secondary Optional Toggle: Request Public Identity */}
                    <div className="pt-2">
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
              <div className="p-3.5 rounded-xl bg-surface border border-subtle flex items-start gap-2.5 text-[14px] text-secondary">
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

        {/* SECTION 3 (RICKSHAW & EXTORTION): Person or Organization (ব্যক্তি বা প্রতিষ্ঠানের তথ্য) */}
        {showsPartySection && (
          <Accordion
            id="composer-section-parties"
            isOpen={Boolean(openSections.parties)}
            onToggle={() => toggleSection('parties')}
            title={language === 'bn' ? '৩. ব্যক্তি বা প্রতিষ্ঠানের তথ্য' : '3. Person or Organization'}
            summary={
              formData.reportedSubject
                ? `${formData.reportedSubject}${formData.organization ? ` (${formData.organization})` : ''}`
                : language === 'bn'
                ? 'অভিযুক্ত বা সংশ্লিষ্ট ব্যক্তি/প্রতিষ্ঠানের বিবরণ'
                : 'Accused party or organization details'
            }
            icon={<Users className="w-5 h-5" />}
          >
            <div className="space-y-4 pt-2 text-left">
              {/* Subject Type Selection */}
              <div>
                <label className="block text-[14px] font-bold text-primary mb-2">
                  {language === 'bn'
                    ? 'অভিযোগ কার বিরুদ্ধে বা কার সাথে সংশ্লিষ্ট?'
                    : 'Who is this complaint regarding?'}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { id: 'individual', nameBn: 'ব্যক্তি / চালক', nameEn: 'Individual' },
                    { id: 'business', nameBn: 'দোকান / গ্যারেজ', nameEn: 'Business / Garage' },
                    { id: 'group', nameBn: 'দল / সিন্ডিকেট', nameEn: 'Group / Syndicate' },
                    { id: 'organization', nameBn: 'প্রতিষ্ঠান / কর্তৃপক্ষ', nameEn: 'Organization' },
                    { id: 'unknown', nameBn: 'অজ্ঞাত / নিশ্চিত নই', nameEn: 'Unknown' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        onUpdateFormData({
                          subjectType: st.id as 'individual' | 'business' | 'group' | 'organization' | 'unknown',
                        })
                      }
                      className={`px-3 py-2 rounded-xl text-[14px] font-semibold border transition-all text-center min-h-[44px] flex items-center justify-center cursor-pointer ${
                        (formData.subjectType || 'individual') === st.id
                          ? 'bg-accent text-accent-fg border-accent shadow-xs'
                          : 'bg-surface hover:bg-surface-subtle border-subtle text-secondary'
                      }`}
                    >
                      {language === 'bn' ? st.nameBn : st.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Subject Details */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-subtle space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Name or Identifier */}
                  <div>
                    <label
                      htmlFor="party-subject-name"
                      className="block text-[14px] font-bold text-primary mb-1"
                    >
                      {language === 'bn'
                        ? 'ব্যক্তি, প্রতিষ্ঠান বা শনাক্তকারী নাম (ঐচ্ছিক)'
                        : 'Name or Identifying Title (Optional)'}
                    </label>
                    <input
                      id="party-subject-name"
                      type="text"
                      value={formData.reportedSubject || ''}
                      onChange={(e) => onUpdateFormData({ reportedSubject: e.target.value })}
                      placeholder={
                        language === 'bn'
                          ? 'যেমন: গ্যারেজ মালিক, নির্দিষ্ট ব্যক্তি বা দোকানের নাম'
                          : 'e.g. Garage owner, specific person or shop name'
                      }
                      className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                    />
                  </div>

                  {/* Role or Vehicle Number / Designation */}
                  <div>
                    <label
                      htmlFor="party-role-designation"
                      className="block text-[14px] font-bold text-primary mb-1"
                    >
                      {language === 'bn'
                        ? 'পদবি, ভূমিকা বা গাড়ির নম্বর (ঐচ্ছিক)'
                        : 'Role, Vehicle No. or Designation (Optional)'}
                    </label>
                    <input
                      id="party-role-designation"
                      type="text"
                      value={formData.roleOrDesignation || ''}
                      onChange={(e) => onUpdateFormData({ roleOrDesignation: e.target.value })}
                      placeholder={
                        language === 'bn'
                          ? 'যেমন: ব্যাটারি রিকশা নং, লাইন চালক, গ্যারেজ ম্যানেজার'
                          : 'e.g. Rickshaw Plate No., Line In-charge'
                      }
                      className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Organization / Stand / Syndicate */}
                  <div>
                    <label
                      htmlFor="party-organization"
                      className="block text-[14px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn'
                        ? 'সংস্থা, সমিতি বা স্ট্যান্ডের নাম (ঐচ্ছিক)'
                        : 'Organization, Syndicate or Stand (Optional)'}
                    </label>
                    <input
                      id="party-organization"
                      type="text"
                      value={formData.organization || ''}
                      onChange={(e) => onUpdateFormData({ organization: e.target.value })}
                      placeholder={
                        language === 'bn'
                          ? 'যেমন: স্থানীয় রিকশা মালিক সমিতি, নির্দিষ্ট চার্জিং গ্যারেজ'
                          : 'e.g. Local Rickshaw Association, Charging Garage'
                      }
                      className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                    />
                  </div>

                  {/* Contact / Phone / Social Handle */}
                  <div>
                    <label
                      htmlFor="party-public-handle"
                      className="block text-[14px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn'
                        ? 'ফোন নম্বর বা যোগাযোগের পরিচিতি (ঐচ্ছিক)'
                        : 'Phone Number or Contact Info (Optional)'}
                    </label>
                    <input
                      id="party-public-handle"
                      type="text"
                      value={formData.publicProfileHandle || ''}
                      onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                      placeholder={language === 'bn' ? '০১৭xxxxxxxx বা অন্যান্য' : '017xxxxxxxx or other handle'}
                      className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Identifying Description */}
                <div>
                  <label
                    htmlFor="party-identifying-description"
                    className="block text-[14px] font-semibold text-secondary mb-1"
                  >
                    {language === 'bn'
                      ? 'শনাক্তকরণ বা অন্যান্য বিবরণ (ঐচ্ছিক)'
                      : 'Identifying Description or Details (Optional)'}
                  </label>
                  <textarea
                    id="party-identifying-description"
                    rows={2}
                    value={formData.identifyingDescription || ''}
                    onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? 'গাড়ির রঙ, বিশেষ স্টিকার, শারীরিক বৈশিষ্ট্য বা অবস্থানগত বিবরণ...'
                        : 'Vehicle color, stickers, physical description or location cues...'
                    }
                    className="w-full px-3.5 py-2.5 bg-surface border border-subtle rounded-xl text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent"
                  />
                </div>
              </div>

              {/* Additional Mentioned Parties */}
              {formData.mentionedParties && formData.mentionedParties.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-[14px] font-bold text-primary">
                    {language === 'bn' ? 'অতিরিক্ত সংশ্লিষ্ট পক্ষসমূহ' : 'Additional Mentioned Parties'}
                  </h4>
                  {formData.mentionedParties.map((party, pIdx) => (
                    <div
                      key={party.id || pIdx}
                      className="p-3.5 rounded-xl bg-surface border border-subtle space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold text-primary">
                          {language === 'bn' ? `পক্ষ #${pIdx + 2}` : `Party #${pIdx + 2}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalParty(party.id)}
                          className="inline-flex items-center gap-1 text-[13px] text-red-500 hover:underline cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={party.name || ''}
                          onChange={(e) => handleUpdateAdditionalParty(party.id, { name: e.target.value })}
                          placeholder={language === 'bn' ? 'নাম / পদবি' : 'Name / Title'}
                          className="w-full px-3 py-2 bg-surface border border-subtle rounded-lg text-[15px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                        />
                        <input
                          type="text"
                          value={party.roleOrDesignation || ''}
                          onChange={(e) =>
                            handleUpdateAdditionalParty(party.id, { roleOrDesignation: e.target.value })
                          }
                          placeholder={language === 'bn' ? 'ভূমিকা / পদবি' : 'Role / Designation'}
                          className="w-full px-3 py-2 bg-surface border border-subtle rounded-lg text-[15px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                        />
                        <input
                          type="text"
                          value={party.organization || ''}
                          onChange={(e) =>
                            handleUpdateAdditionalParty(party.id, { organization: e.target.value })
                          }
                          placeholder={language === 'bn' ? 'প্রতিষ্ঠান / সমিতি' : 'Organization'}
                          className="w-full px-3 py-2 bg-surface border border-subtle rounded-lg text-[15px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Additional Party Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddAdditionalParty}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-subtle text-[14px] font-semibold text-primary cursor-pointer transition-colors min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {language === 'bn'
                      ? '+ আরও ব্যক্তি বা প্রতিষ্ঠান যোগ করুন'
                      : '+ Add another person or organization'}
                  </span>
                </button>
              </div>
            </div>
          </Accordion>
        )}

        {/* SECTION 4: Attachments (সংযুক্তি - ঐচ্ছিক) */}
        <Accordion
          id="composer-section-attachments"
          isOpen={Boolean(openSections.attachments)}
          onToggle={() => toggleSection('attachments')}
          title={language === 'bn' ? '৪. সংযুক্তি' : '4. Attachments'}
          summary={
            pendingImages.length > 0
              ? `${pendingImages.length} ${language === 'bn' ? 'টি ছবি সংযুক্ত' : 'images attached'}`
              : language === 'bn'
              ? 'কোনো ছবি সংযুক্ত নেই'
              : 'No images attached'
          }
          badge={
            pendingImages.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent text-[14px] font-bold">
                {pendingImages.length}
              </span>
            ) : undefined
          }
          icon={<Paperclip className="w-5 h-5" />}
        >
          <div className="space-y-4 pt-2 text-left">
            <p className="text-[14px] text-secondary">
              {language === 'bn'
                ? 'অভিযোগ বুঝতে সহায়ক ছবি বা স্ক্রিনশট থাকলে সংযুক্ত করুন। এটি ঐচ্ছিক।'
                : 'Attach images or screenshots if they help explain the complaint. This is optional.'}
            </p>

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
