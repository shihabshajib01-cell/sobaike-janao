import React from 'react';
import {
  Edit2,
  Shield,
  FileText,
  MapPin,
  Paperclip,
  Lock,
  Calendar,
  Users,
  Info,
} from 'lucide-react';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { DraftReport } from '../../services/types';
import { AttachedImagePreview } from '../media/ImageAttachmentPicker';
import { SEGMENT_SUBCATEGORIES } from '../../data/reportOptions';
import {
  getReportSubjectConfig,
  getSubjectOptionLabel,
} from '../../data/reportSubjectOptions';

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
  const showsPartySection = segment === 'rickshaw' || segment === 'extortion';
  const showsIdentitySection = segment === 'harassment';

  const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
    (s) => s.id === formData.subcategoryId
  );

  const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);

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

      {/* Step Header */}
      <div className="space-y-1">
        <h3 className="text-[18px] sm:text-[20px] md:text-[22px] font-bold text-primary">
          {language === 'bn' ? '৪. তথ্যের পর্যালোচনা ও চূড়ান্ত জমা' : '4. Review & Submit'}
        </h3>
        <p className="text-[13px] sm:text-[14px] leading-relaxed text-secondary">
          {language === 'bn'
            ? 'প্রতিবেদন জমা দেওয়ার পূর্বে প্রদত্ত তথ্যগুলো দেখে নিন। প্রয়োজনে সম্পাদনা করতে পারেন।'
            : 'Review provided details before submission. You can jump back to edit any section.'}
        </p>
      </div>

      {/* Review Cards Grid */}
      <div className="space-y-3 sm:space-y-3.5">
        {/* Card 1: Service & Subcategory */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-muted">
              <span>{language === 'bn' ? 'সেবা ও ধরন' : 'Service & Type'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[38px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'পরিবর্তন করুন' : 'Edit'}</span>
            </button>
          </div>

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
        </div>

        {/* Card 2: What Happened & Timeline */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <FileText className="w-4 h-4 text-primary" />
              <span>{language === 'bn' ? '১. ঘটনার বিবরণ ও সময়কাল' : '1. What Happened & Timeline'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3, 'narrative')}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[38px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          </div>

          <div className="space-y-2 text-[13px]">
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
            </div>
          </div>
        </div>

        {/* Card 3: Location */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{language === 'bn' ? '২. লোকেশন' : '2. Location'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3, 'location')}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[38px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[14px]">
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
            {formData.location?.road && (
              <p className="text-secondary text-[13px] mt-0.5">
                {language === 'bn' ? 'রাস্তা: ' : 'Road: '}
                {formData.location.road}
                {formData.location.landmark ? ` (${formData.location.landmark})` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Card 4 (HARASSMENT): Identity & Privacy */}
        {showsIdentitySection && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
                <Shield className="w-4 h-4 text-primary" />
                <span>{language === 'bn' ? '৩. পরিচয় ও গোপনীয়তা' : '3. Identity & Privacy'}</span>
              </div>
              <button
                type="button"
                onClick={() => onEditStep(3, 'identity')}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[38px] py-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[13px] space-y-1">
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
          </div>
        )}

        {/* Card 4 (RICKSHAW & EXTORTION): Contextual Target Details */}
        {showsPartySection && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
                <Users className="w-4 h-4 text-primary" />
                <span>
                  {language === 'bn'
                    ? subjectConfig?.sectionTitleBn || '৩. সংশ্লিষ্ট পক্ষ'
                    : subjectConfig?.sectionTitleEn || '3. Target Details'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditStep(3, 'parties')}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[38px] py-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-subtle text-[13px] space-y-2">
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
          </div>
        )}

        {/* Card 5: Attachments */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <Paperclip className="w-4 h-4 text-primary" />
              <span>{language === 'bn' ? '৪. সংযুক্তি' : '4. Attachments'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3, 'attachments')}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[38px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          </div>

          <div className="text-[13px] text-secondary">
            {pendingImages.length > 0 ? (
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
        </div>
      </div>

      {/* Responsible Moderation Notice */}
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
