import React, { useState } from 'react';
import {
  Shield,
  FileText,
  MapPin,
  Paperclip,
  Lock,
  Calendar,
  Users,
  Info,
  Layers,
} from 'lucide-react';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { DraftReport, isMeaningfulMentionedParty } from '../../services/types';
import { AttachedImagePreview } from '../media/ImageAttachmentPicker';
import { SEGMENT_SUBCATEGORIES } from '../../data/reportOptions';
import {
  getReportSubjectConfig,
  getSubjectOptionLabel,
} from '../../data/reportSubjectOptions';
import { ReviewSection } from './ReviewSection';

export interface Step4ReviewProps {
  segment: SectionKey;
  formData: DraftReport;
  pendingImages: AttachedImagePreview[];
  onEditStep: (
    step: number,
    sectionKey?: 'narrative' | 'location' | 'identity' | 'parties' | 'attachments'
  ) => void;
  onBack?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  language: 'bn' | 'en';
}

export const Step4Review: React.FC<Step4ReviewProps> = ({
  segment,
  formData,
  pendingImages,
  onEditStep,
  language,
}) => {
  const isRickshawChargingStation =
    segment === 'rickshaw' &&
    (formData.subcategoryId === 'charging-station-location' || !formData.subcategoryId);

  const hasRickshawOperatorData = Boolean(
    formData.reportedSubject?.trim() ||
    formData.organization?.trim() ||
    formData.roleOrDesignation?.trim() ||
    formData.publicProfileHandle?.trim() ||
    formData.identifyingDescription?.trim()
  );

  const hasExtortionPrimaryPartyData = Boolean(
    formData.reportedSubject?.trim() ||
    formData.roleOrDesignation?.trim() ||
    formData.organization?.trim() ||
    formData.publicProfileHandle?.trim() ||
    formData.identifyingDescription?.trim()
  );

  const meaningfulMentionedParties = (formData.mentionedParties || []).filter(isMeaningfulMentionedParty);

  const hasExtortionPartyData =
    hasExtortionPrimaryPartyData || meaningfulMentionedParties.length > 0;

  const showsPartySection =
    (segment === 'extortion' && hasExtortionPartyData) ||
    (segment === 'rickshaw' && hasRickshawOperatorData);
  const showsIdentitySection = segment === 'harassment';

  const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
    (s) => s.id === formData.subcategoryId
  );

  const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);

  // Conditional: hide frequency for Illegal Charging Station reports
  const hideFrequency =
    segment === 'rickshaw' && formData.subcategoryId === 'charging-station-location';

  // Independent Collapsible State - What Happened (incident) is expanded by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    service_type: false,
    incident: true,
    location: false,
    identity_target: false,
    attachments: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const editLabel = language === 'bn' ? 'সম্পাদনা' : 'Edit';

  // Computed Summaries for Collapsed states
  const serviceTypeSummary = `${
    SECTIONS[segment] ? (language === 'bn' ? SECTIONS[segment].nameBn : SECTIONS[segment].nameEn) : ''
  } · ${
    currentSubcategoryOption
      ? language === 'bn'
        ? currentSubcategoryOption.nameBn
        : currentSubcategoryOption.nameEn
      : formData.subcategoryId
  }`;

  const incidentSummary = hideFrequency
    ? `${formData.incidentDate || '-'}`
    : `${formData.incidentDate || '-'} · ${
        formData.frequency === 'repeated'
          ? language === 'bn'
            ? 'নিয়মিত'
            : 'Repeated'
          : language === 'bn'
          ? 'এককালীন'
          : 'One-time'
      }`;

  const locationSummary =
    [
      formData.location?.area || (formData.location?.formattedAddress ? formData.location.formattedAddress.split(',')[0].trim() : ''),
      formData.location?.district,
      formData.location?.division,
    ]
      .filter(Boolean)
      .join(', ') || (language === 'bn' ? 'অবস্থান নির্দিষ্ট নেই' : 'Unspecified location');

  const identitySummary =
    formData.privacyChoice === 'anonymous'
      ? language === 'bn'
        ? 'সম্পূর্ণ অজ্ঞাতনামা'
        : 'Completely Anonymous'
      : formData.privacyChoice === 'admin_only'
      ? language === 'bn'
        ? 'মডারেটরের জন্য সংরক্ষিত'
        : 'Admin Follow-up Only'
      : language === 'bn'
      ? 'অনুমোদিত হলে প্রকাশ্য পরিচয়'
      : 'Public Identity';

  const targetSummary = isRickshawChargingStation
    ? (
        formData.reportedSubject?.trim() ||
        formData.organization?.trim() ||
        formData.roleOrDesignation?.trim() ||
        formData.publicProfileHandle?.trim() ||
        (language === 'bn' ? 'তথ্য যোগ করা হয়েছে' : 'Information added')
      )
    : segment === 'extortion'
    ? (
        formData.reportedSubject?.trim() ||
        formData.organization?.trim() ||
        formData.roleOrDesignation?.trim() ||
        formData.publicProfileHandle?.trim() ||
        (meaningfulMentionedParties.length > 0
          ? (language === 'bn'
              ? `${meaningfulMentionedParties.length === 1 ? '১টি' : meaningfulMentionedParties.length} অতিরিক্ত পক্ষের তথ্য`
              : `${meaningfulMentionedParties.length} additional ${meaningfulMentionedParties.length === 1 ? 'party' : 'parties'} added`)
          : (language === 'bn' ? 'তথ্য যোগ করা হয়েছে' : 'Information added'))
      )
    : (
        formData.reportedSubject ||
        formData.organization ||
        (formData.subjectType === 'unknown'
          ? language === 'bn'
            ? 'অজ্ঞাত / নির্দিষ্ট নেই'
            : 'Unknown / Not specified'
          : getSubjectOptionLabel(segment, formData.subcategoryId, formData.subjectType, language))
      );

  const hasMissingEvidence =
    pendingImages.length === 0 &&
    Boolean(formData.pendingEvidenceRecovery && formData.pendingEvidenceRecovery.expectedCount > 0);

  const attachmentsSummary = hasMissingEvidence
    ? language === 'bn'
      ? 'পুনরায় সংযুক্তি আবশ্যক'
      : 'Reattachment required'
    : pendingImages.length > 0
    ? language === 'bn'
      ? `${pendingImages.length} টি ছবি সংযুক্ত`
      : `${pendingImages.length} images attached`
    : language === 'bn'
    ? 'কোনো ছবি সংযুক্ত নেই'
    : 'No attachments';

  return (
    <div className="space-y-4 md:space-y-5 text-left">
      {/* Honeypot hidden input for anti-bot protection */}
      <div className="hidden" aria-hidden="true">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={(formData as any).website || ''}
          onChange={() => {}}
        />
      </div>

      {/* Clean Step Header without redundant explanations */}
      <div className="text-left">
        <h3 className="text-[18px] sm:text-[20px] md:text-[22px] font-bold text-primary">
          {language === 'bn' ? 'তথ্য যাচাই করুন' : 'Review your report'}
        </h3>
      </div>

      {/* Review Cards Grid - Independently Collapsible */}
      <div className="space-y-3 sm:space-y-3.5">
        {/* Section 1: Service & Type */}
        <ReviewSection
          id="review-section-service"
          isOpen={openSections.service_type}
          onToggle={() => toggleSection('service_type')}
          title={language === 'bn' ? 'সেবা ও ধরন' : 'Service & Type'}
          summary={serviceTypeSummary}
          icon={<Layers className="w-4 h-4" />}
          onEdit={() => onEditStep(1)}
          editLabel={editLabel}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-subtle">
              <span className="text-[12px] text-muted block mb-0.5">
                {language === 'bn' ? 'বিভাগ / সেবা' : 'Service Domain'}
              </span>
              <p className="text-[14.5px] font-bold text-primary">
                {language === 'bn' ? SECTIONS[segment].nameBn : SECTIONS[segment].nameEn}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-subtle border border-subtle">
              <span className="text-[12px] text-muted block mb-0.5">
                {language === 'bn' ? 'অভিযোগের ধরন' : 'Complaint Type'}
              </span>
              <p className="text-[14.5px] font-bold text-primary">
                {language === 'bn'
                  ? currentSubcategoryOption?.nameBn || formData.subcategoryId
                  : currentSubcategoryOption?.nameEn || formData.subcategoryId}
              </p>
            </div>
          </div>
        </ReviewSection>

        {/* Section 2: 1. What Happened & Timeline (Default Expanded) */}
        <ReviewSection
          id="review-section-incident"
          isOpen={openSections.incident}
          onToggle={() => toggleSection('incident')}
          title={language === 'bn' ? '১. ঘটনার বিবরণ ও সময়কাল' : '1. What Happened & Timeline'}
          summary={incidentSummary}
          icon={<FileText className="w-4 h-4" />}
          onEdit={() => onEditStep(3, 'narrative')}
          editLabel={editLabel}
        >
          <div className="space-y-2.5 text-[13px] pt-0.5">
            <div>
              <span className="text-muted block text-[12px]">{language === 'bn' ? 'শিরোনাম:' : 'Headline:'}</span>
              <p className="font-bold text-primary text-[15px]">{formData.title || '-'}</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-subtle">
              <span className="text-muted block mb-1 text-[12px]">{language === 'bn' ? 'বিবরণ:' : 'Description:'}</span>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap text-[14px]">
                {formData.description || '-'}
              </p>
            </div>

            <div className="flex items-center gap-3.5 text-secondary flex-wrap pt-0.5 text-[13px]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>
                  {language === 'bn' ? 'তারিখ: ' : 'Date: '}
                  <strong>{formData.incidentDate || '-'}</strong>
                </span>
              </div>

              {formData.incidentTime && (
                <div>
                  <span>
                    {language === 'bn' ? 'সময়: ' : 'Time: '}
                    <strong>{formData.incidentTime}</strong>
                  </span>
                </div>
              )}

              {!hideFrequency && (
                <div>
                  <span>
                    {language === 'bn' ? 'পুনরাবৃত্তি: ' : 'Frequency: '}
                    <strong>
                      {formData.frequency === 'repeated'
                        ? language === 'bn'
                          ? 'নিয়মিত / একাধিকবার'
                          : 'Repeated'
                        : language === 'bn'
                        ? 'এককালীন'
                        : 'One-time'}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </ReviewSection>

        {/* Section 3: 2. Location */}
        <ReviewSection
          id="review-section-location"
          isOpen={openSections.location}
          onToggle={() => toggleSection('location')}
          title={language === 'bn' ? '২. লোকেশন' : '2. Location'}
          summary={locationSummary}
          icon={<MapPin className="w-4 h-4" />}
          onEdit={() => onEditStep(3, 'location')}
          editLabel={editLabel}
        >
          <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[14px] pt-1 space-y-1.5">
            <p className="font-semibold text-primary">
              {[
                formData.location?.area,
                formData.location?.upazilaOrThana,
                formData.location?.district,
                formData.location?.division,
              ]
                .filter(Boolean)
                .join(', ') || (language === 'bn' ? 'অবস্থান নির্দিষ্ট নেই' : 'Unspecified location')}
            </p>
            {formData.location?.formattedAddress && (
              <p className="text-secondary text-[13px]">
                {language === 'bn' ? 'ঠিকানা: ' : 'Address: '}
                <span className="text-primary font-medium">{formData.location.formattedAddress}</span>
              </p>
            )}
            {formData.location?.road && (
              <p className="text-secondary text-[13px]">
                {language === 'bn' ? 'রাস্তা / লেন: ' : 'Road / Lane: '}
                <span className="text-primary font-medium">{formData.location.road}</span>
                {formData.location.landmark ? ` (${formData.location.landmark})` : ''}
              </p>
            )}
            {formData.location?.lat !== undefined && formData.location?.lng !== undefined && (
              <div className="flex items-center gap-1.5 text-[12px] text-accent font-medium pt-0.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {language === 'bn' ? 'ম্যাপে স্থান চিহ্নিত' : 'Location pinned on map'}
                </span>
              </div>
            )}
          </div>
        </ReviewSection>

        {/* Section 4 (HARASSMENT): 3. Identity & Privacy */}
        {showsIdentitySection && (
          <ReviewSection
            id="review-section-identity"
            isOpen={openSections.identity_target}
            onToggle={() => toggleSection('identity_target')}
            title={language === 'bn' ? '৩. পরিচয় ও গোপনীয়তা' : '3. Identity & Privacy'}
            summary={identitySummary}
            icon={<Shield className="w-4 h-4" />}
            onEdit={() => onEditStep(3, 'identity')}
            editLabel={editLabel}
          >
            <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[13px] space-y-1 pt-1">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {formData.privacyChoice === 'anonymous'
                    ? language === 'bn'
                      ? 'সম্পূর্ণ অজ্ঞাতনামা (Anonymous)'
                      : 'Completely Anonymous'
                    : formData.privacyChoice === 'admin_only'
                    ? language === 'bn'
                      ? 'মডারেটরের জন্য সংরক্ষিত (Admin Only)'
                      : 'Admin Follow-up Only'
                    : language === 'bn'
                    ? 'অনুমোদিত হলে প্রকাশ্য পরিচয় (Public)'
                    : 'Public Identity (If Approved)'}
                </span>
              </div>

              {formData.privacyChoice !== 'anonymous' && formData.adminContact && (
                <p className="text-secondary pt-0.5">
                  {language === 'bn' ? 'যোগাযোগের তথ্য: ' : 'Contact: '}
                  <span className="font-mono">{formData.adminContact}</span>
                  {formData.adminName && ` (${formData.adminName})`}
                </p>
              )}
            </div>
          </ReviewSection>
        )}

        {/* Section 4 (RICKSHAW & EXTORTION): 3. Contextual Target Details */}
        {showsPartySection && (
          <ReviewSection
            id="review-section-parties"
            isOpen={openSections.identity_target}
            onToggle={() => toggleSection('identity_target')}
            title={
              language === 'bn'
                ? isRickshawChargingStation
                  ? '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য (ঐচ্ছিক)'
                  : segment === 'extortion'
                  ? '৩. চাঁদা দাবিকারীর তথ্য (ঐচ্ছিক)'
                  : subjectConfig?.sectionTitleBn || '৩. সংশ্লিষ্ট পক্ষ'
                : isRickshawChargingStation
                  ? '3. Charging Station / Operator Information (Optional)'
                  : segment === 'extortion'
                  ? '3. Extortion Party Information (Optional)'
                  : subjectConfig?.sectionTitleEn || '3. Target Details'
            }
            summary={targetSummary}
            icon={<Users className="w-4 h-4" />}
            onEdit={() => onEditStep(3, 'parties')}
            editLabel={editLabel}
          >
            {segment === 'rickshaw' ? (
              <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[13px] space-y-2 pt-1">
                {/* Name / Known Identity (ONLY when value exists) */}
                {(formData.reportedSubject?.trim() || formData.organization?.trim()) && (
                  <div>
                    <span className="text-secondary font-medium">
                      {language === 'bn' ? 'নাম / পরিচিতি: ' : 'Name / Known Identity: '}
                    </span>
                    <span className="text-primary font-bold">
                      {formData.reportedSubject?.trim() || formData.organization?.trim()}
                    </span>
                  </div>
                )}

                {/* Role / Responsibility (ONLY when value exists) */}
                {formData.roleOrDesignation?.trim() && (
                  <div className="pt-0.5">
                    <span className="text-secondary font-medium">
                      {language === 'bn' ? 'ভূমিকা / দায়িত্ব: ' : 'Role / Responsibility: '}
                    </span>
                    <span className="text-primary font-medium">
                      {formData.roleOrDesignation.trim()}
                    </span>
                  </div>
                )}

                {/* Phone / Contact (ONLY when value exists) */}
                {formData.publicProfileHandle?.trim() && (
                  <div className="pt-0.5">
                    <span className="text-secondary font-medium">
                      {language === 'bn' ? 'ফোন / যোগাযোগ: ' : 'Phone / Contact: '}
                    </span>
                    <span className="text-primary font-mono font-medium">
                      {formData.publicProfileHandle.trim()}
                    </span>
                  </div>
                )}

                {/* Other Identifying Details (ONLY when value exists) */}
                {formData.identifyingDescription?.trim() && (
                  <div className="pt-1 border-t border-subtle/50">
                    <span className="text-secondary font-medium block mb-0.5">
                      {language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য: ' : 'Other Identifying Details: '}
                    </span>
                    <p className="text-primary italic whitespace-pre-wrap">
                      {formData.identifyingDescription.trim()}
                    </p>
                  </div>
                )}
              </div>
            ) : segment === 'extortion' ? (
              <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[13px] space-y-2.5 pt-1">
                {/* Primary Extortion Party (only if primary data exists) */}
                {hasExtortionPrimaryPartyData && (
                  <div className="space-y-1.5">
                    {/* Name / Known Identity */}
                    {formData.reportedSubject?.trim() && (
                      <div>
                        <span className="text-secondary font-medium">
                          {language === 'bn' ? 'নাম / পরিচিতি: ' : 'Name / Known Identity: '}
                        </span>
                        <span className="text-primary font-bold">
                          {formData.reportedSubject.trim()}
                        </span>
                      </div>
                    )}

                    {/* Role / Designation */}
                    {formData.roleOrDesignation?.trim() && (
                      <div className="pt-0.5">
                        <span className="text-secondary font-medium">
                          {language === 'bn' ? 'ভূমিকা / পদবি: ' : 'Role / Designation: '}
                        </span>
                        <span className="text-primary font-medium">
                          {formData.roleOrDesignation.trim()}
                        </span>
                      </div>
                    )}

                    {/* Group / Organization / Association */}
                    {formData.organization?.trim() && (
                      <div className="pt-0.5">
                        <span className="text-secondary font-medium">
                          {language === 'bn' ? 'দল / সংগঠন / সমিতি: ' : 'Group / Organization / Association: '}
                        </span>
                        <span className="text-primary font-medium">
                          {formData.organization.trim()}
                        </span>
                      </div>
                    )}

                    {/* Phone / Contact */}
                    {formData.publicProfileHandle?.trim() && (
                      <div className="pt-0.5">
                        <span className="text-secondary font-medium">
                          {language === 'bn' ? 'ফোন / যোগাযোগ: ' : 'Phone / Contact: '}
                        </span>
                        <span className="text-primary font-mono font-medium">
                          {formData.publicProfileHandle.trim()}
                        </span>
                      </div>
                    )}

                    {/* Other Identifying Details */}
                    {formData.identifyingDescription?.trim() && (
                      <div className="pt-1 border-t border-subtle/50">
                        <span className="text-secondary font-medium block mb-0.5">
                          {language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য: ' : 'Other Identifying Details: '}
                        </span>
                        <p className="text-primary italic whitespace-pre-wrap">
                          {formData.identifyingDescription.trim()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Mentioned Parties */}
                {meaningfulMentionedParties.length > 0 && (
                  <div className={`space-y-2 text-[13px] ${hasExtortionPrimaryPartyData ? 'pt-2 border-t border-subtle/50' : ''}`}>
                    <span className="font-bold text-primary block">
                      {language === 'bn'
                        ? `অতিরিক্ত পক্ষ (${meaningfulMentionedParties.length}টি):`
                        : `Additional Parties (${meaningfulMentionedParties.length}):`}
                    </span>
                    <div className="space-y-2">
                      {meaningfulMentionedParties.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="p-2.5 rounded-lg bg-surface border border-subtle text-secondary space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">
                              {p.name?.trim() || (language === 'bn' ? `পক্ষ #${idx + 2}` : `Party #${idx + 2}`)}
                            </span>
                          </div>
                          {p.roleOrDesignation?.trim() && (
                            <p>
                              <span className="font-medium text-secondary">{language === 'bn' ? 'ভূমিকা / পদবি: ' : 'Role: '}</span>
                              <span className="text-primary font-medium">{p.roleOrDesignation.trim()}</span>
                            </p>
                          )}
                          {p.organization?.trim() && (
                            <p>
                              <span className="font-medium text-secondary">{language === 'bn' ? 'দল / সমিতি: ' : 'Group / Org: '}</span>
                              <span className="text-primary font-medium">{p.organization.trim()}</span>
                            </p>
                          )}
                          {(p.phoneOrContact?.trim() || p.publicProfileHandle?.trim()) && (
                            <p>
                              <span className="font-medium text-secondary">{language === 'bn' ? 'ফোন / যোগাযোগ: ' : 'Contact: '}</span>
                              <span className="text-primary font-mono font-medium">{(p.phoneOrContact || p.publicProfileHandle || '').trim()}</span>
                            </p>
                          )}
                          {p.identifyingDescription?.trim() && (
                            <div className="pt-0.5">
                              <span className="font-medium text-secondary block mb-0.5">{language === 'bn' ? 'অন্যান্য বিবরণ: ' : 'Other Details: '}</span>
                              <p className="text-primary italic whitespace-pre-wrap">{p.identifyingDescription.trim()}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[13px] space-y-2 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-muted block text-[12px]">
                      {language === 'bn' ? 'ধরন ও নাম:' : 'Type & Name:'}
                    </span>
                    <p className="font-bold text-primary text-[14.5px]">
                      {formData.reportedSubject ||
                        formData.organization ||
                        (formData.subjectType === 'unknown'
                          ? language === 'bn'
                            ? 'অজ্ঞাত / নির্দিষ্ট নেই'
                            : 'Unknown / Not specified'
                          : language === 'bn'
                          ? 'নির্দিষ্ট নাম উল্লেখ নেই'
                          : 'Unspecified name')}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-surface border border-subtle text-[12px] font-semibold text-secondary">
                    {getSubjectOptionLabel(segment, formData.subcategoryId, formData.subjectType, language)}
                  </span>
                </div>

                {(formData.roleOrDesignation || (formData.organization && formData.organization !== formData.reportedSubject)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-subtle/50 text-[13px] text-secondary">
                    {formData.roleOrDesignation && (
                      <p>
                        <strong>{language === 'bn' ? 'ভূমিকা/পদবি: ' : 'Role/Designation: '}</strong>
                        {formData.roleOrDesignation}
                      </p>
                    )}
                    {formData.organization && formData.organization !== formData.reportedSubject && (
                      <p>
                        <strong>{language === 'bn' ? 'প্রতিষ্ঠান/সমিতি: ' : 'Organization: '}</strong>
                        {formData.organization}
                      </p>
                    )}
                  </div>
                )}

                {formData.publicProfileHandle && (
                  <p className="text-[13px] text-secondary pt-0.5">
                    <strong>{language === 'bn' ? 'যোগাযোগ: ' : 'Contact: '}</strong>
                    <span className="font-mono">{formData.publicProfileHandle}</span>
                  </p>
                )}

                {formData.identifyingDescription && (
                  <div className="pt-1 text-[13px] text-secondary">
                    <strong>{language === 'bn' ? 'শনাক্তকরণ বিবরণ: ' : 'Identifying Description: '}</strong>
                    <p className="italic text-muted">{formData.identifyingDescription}</p>
                  </div>
                )}

                {formData.mentionedParties && formData.mentionedParties.length > 0 && (
                  <div className="pt-2 border-t border-subtle/50 text-[13px]">
                    <span className="font-bold text-primary block mb-1">
                      {language === 'bn'
                        ? `অতিরিক্ত পক্ষ (${formData.mentionedParties.length} জন):`
                        : `Additional Parties (${formData.mentionedParties.length}):`}
                    </span>
                    <div className="space-y-1">
                      {formData.mentionedParties.map((p, idx) => (
                        <p key={p.id || idx} className="text-secondary">
                          • {p.name || (language === 'bn' ? 'পক্ষ' : 'Party')}
                          {p.roleOrDesignation ? ` (${p.roleOrDesignation})` : ''}
                          {p.organization ? ` - ${p.organization}` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ReviewSection>
        )}

        {/* Section 5: 4. Attachments */}
        <ReviewSection
          id="review-section-attachments"
          isOpen={openSections.attachments}
          onToggle={() => toggleSection('attachments')}
          title={language === 'bn' ? '৪. সংযুক্তি' : '4. Attachments'}
          summary={attachmentsSummary}
          icon={<Paperclip className="w-4 h-4" />}
          onEdit={() => onEditStep(3, 'attachments')}
          editLabel={editLabel}
        >
          <div className="text-[13px] text-secondary pt-1">
            {hasMissingEvidence ? (
              <div
                id="review-missing-evidence-alert"
                className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-2 text-[13px]"
              >
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {language === 'bn'
                        ? 'পূর্বে সংযুক্ত ছবিগুলো পুনরায় যুক্ত করা প্রয়োজন'
                        : 'Previously attached images must be reattached'}
                    </p>
                    <p className="text-[12.5px] opacity-90 leading-relaxed">
                      {language === 'bn'
                        ? `আপনার সংরক্ষিত খসড়ায় ${formData.pendingEvidenceRecovery?.expectedCount}টি ছবি সংযুক্ত ছিল। ব্রাউজার রিফ্রেশের কারণে ফাইলগুলো পুনরায় নির্বাচন করতে ৩ নং ধাপে ফিরে যান।`
                        : `Your saved draft included ${formData.pendingEvidenceRecovery?.expectedCount} image(s). Please return to Step 3 to reattach your files before submitting.`}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onEditStep(3, 'attachments')}
                    className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    {language === 'bn'
                      ? '৩ নং ধাপে সংযুক্তি যোগ করুন →'
                      : 'Reattach in Step 3 →'}
                  </button>
                </div>
              </div>
            ) : pendingImages.length > 0 ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-primary">
                  {pendingImages.length} {language === 'bn' ? 'টি ছবি সংযুক্ত' : 'images attached'}
                </span>
                <div className="flex gap-1.5">
                  {pendingImages.slice(0, 4).map((img, idx) => (
                    <img
                      key={idx}
                      src={img.previewUrl}
                      alt="attachment preview"
                      loading="lazy"
                      decoding="async"
                      className="w-9 h-9 rounded-lg object-cover border border-subtle"
                    />
                  ))}
                  {pendingImages.length > 4 && (
                    <div className="w-9 h-9 rounded-lg bg-surface-subtle border border-subtle flex items-center justify-center font-bold text-primary text-[13px]">
                      +{pendingImages.length - 4}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p>{language === 'bn' ? 'কোনো ছবি সংযুক্ত নেই।' : 'No attachments.'}</p>
            )}
          </div>
        </ReviewSection>
      </div>

      {/* Responsible Moderation Notice for All Reports */}
      <div className="p-3.5 rounded-2xl bg-surface-subtle border border-subtle flex items-start gap-2.5 text-[13px] text-secondary">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {language === 'bn'
            ? 'জমা দেওয়ার পর প্রতিবেদনটি মডারেশন পর্যালোচনার জন্য গৃহীত হবে। দায়িত্বশীল ব্যবহারের স্বার্থে অসত্য বা উদ্দেশ্যপ্রণোদিত তথ্য প্রদান থেকে বিরত থাকুন।'
            : 'Submitted reports will be queued for moderation review. Please ensure all details are factual and responsibly reported.'}
        </p>
      </div>
    </div>
  );
};
