import React, { useState } from 'react';
import {
  Edit2,
  Shield,
  FileText,
  MapPin,
  Paperclip,
  Lock,
  Calendar,
} from 'lucide-react';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { DraftReport } from '../../services/types';
import { AttachedImagePreview } from '../media/ImageAttachmentPicker';
import { SEGMENT_SUBCATEGORIES } from '../../data/reportOptions';

export interface Step4ReviewProps {
  segment: SectionKey;
  formData: DraftReport;
  pendingImages: AttachedImagePreview[];
  onEditStep: (step: number, sectionKey?: 'narrative' | 'location' | 'identity' | 'attachments') => void;
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
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
    (s) => s.id === formData.subcategoryId
  );

  return (
    <div className="space-y-6 text-left">
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
      <div className="space-y-1.5">
        <h3 className="text-[20px] md:text-[22px] font-bold text-primary">
          {language === 'bn' ? '৪. তথ্যের পর্যালোচনা ও চূড়ান্ত জমা' : '4. Review & Submit'}
        </h3>
        <p className="text-[14px] md:text-[16px] leading-relaxed text-secondary">
          {language === 'bn'
            ? 'প্রতিবেদন জমা দেওয়ার পূর্বে প্রদত্ত তথ্যগুলো ভালো করে দেখে নিন। প্রয়োজনে যেকোনো বিভাগ সম্পাদনা করতে পারেন।'
            : 'Review all provided details before final submission. You can jump back to edit any section.'}
        </p>
      </div>

      {/* Review Cards Grid */}
      <div className="space-y-4">
        {/* Card 1: Service & Subcategory */}
        <div className="p-4 md:p-5 rounded-2xl bg-surface border border-subtle space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-muted">
              <span>{language === 'bn' ? 'সেবা ও ধরন' : 'Service & Type'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline cursor-pointer min-h-[44px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'পরিবর্তন করুন' : 'Edit'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-subtle border border-subtle">
              <span className="text-[14px] text-muted block mb-0.5">
                {language === 'bn' ? 'বিভাগ / সেবা' : 'Service Domain'}
              </span>
              <p className="text-[16px] font-bold text-primary">
                {language === 'bn' ? SECTIONS[segment].nameBn : SECTIONS[segment].nameEn}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-subtle">
              <span className="text-[14px] text-muted block mb-0.5">
                {language === 'bn' ? 'অভিযোগের ধরন' : 'Complaint Type'}
              </span>
              <p className="text-[16px] font-bold text-primary">
                {language === 'bn'
                  ? currentSubcategoryOption?.nameBn || formData.subcategoryId
                  : currentSubcategoryOption?.nameEn || formData.subcategoryId}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: What Happened & Timeline */}
        <div className="p-4 md:p-5 rounded-2xl bg-surface border border-subtle space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <FileText className="w-4 h-4 text-primary" />
              <span>{language === 'bn' ? '১. ঘটনার বিবরণ ও সময়কাল' : '1. What Happened & Timeline'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3, 'narrative')}
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline cursor-pointer min-h-[44px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          </div>

          <div className="space-y-2 text-[14px]">
            <div>
              <span className="text-muted block text-[14px]">{language === 'bn' ? 'শিরোনাম:' : 'Headline:'}</span>
              <p className="font-bold text-primary text-[16px]">{formData.title || '-'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle border border-subtle">
              <span className="text-muted block mb-1 text-[14px]">{language === 'bn' ? 'বিবরণ:' : 'Description:'}</span>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap text-[15px]">
                {formData.description || '-'}
              </p>
            </div>

            <div className="flex items-center gap-4 text-secondary flex-wrap pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
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
        <div className="p-4 md:p-5 rounded-2xl bg-surface border border-subtle space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{language === 'bn' ? '২. লোকেশন' : '2. Location'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3, 'location')}
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline cursor-pointer min-h-[44px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-subtle text-[15px]">
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
              <p className="text-secondary text-[14px] mt-0.5">
                {language === 'bn' ? 'রাস্তা: ' : 'Road: '}
                {formData.location.road}
                {formData.location.landmark ? ` (${formData.location.landmark})` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Card 4: Identity & Privacy */}
        <div className="p-4 md:p-5 rounded-2xl bg-surface border border-subtle space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <Shield className="w-4 h-4 text-primary" />
              <span>{language === 'bn' ? '৩. পরিচয় ও গোপনীয়তা' : '3. Identity & Privacy'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3, 'identity')}
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline cursor-pointer min-h-[44px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-subtle text-[14px] space-y-1">
            <div className="flex items-center gap-2 font-bold text-primary">
              <Lock className="w-4 h-4" />
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
              <p className="text-secondary pt-1">
                {language === 'bn' ? 'যোগাযোগের তথ্য: ' : 'Contact: '}
                <span className="font-mono">{formData.adminContact}</span>
                {formData.adminName && ` (${formData.adminName})`}
              </p>
            )}
          </div>
        </div>

        {/* Card 5: Attachments */}
        <div className="p-4 md:p-5 rounded-2xl bg-surface border border-subtle space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <Paperclip className="w-4 h-4 text-primary" />
              <span>{language === 'bn' ? '৪. সংযুক্তি' : '4. Attachments'}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3, 'attachments')}
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline cursor-pointer min-h-[44px] py-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          </div>

          <div className="text-[14px] text-secondary">
            {pendingImages.length > 0 ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-primary">
                  {pendingImages.length} {language === 'bn' ? 'টি ছবি সংযুক্ত' : 'images attached'}
                </span>
                <div className="flex gap-2">
                  {pendingImages.slice(0, 4).map((img, idx) => (
                    <img
                      key={idx}
                      src={img.previewUrl}
                      alt="attachment preview"
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 rounded-lg object-cover border border-subtle"
                    />
                  ))}
                  {pendingImages.length > 4 && (
                    <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-subtle flex items-center justify-center font-bold text-primary text-[14px]">
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

      {/* Responsible Moderation Terms Notice */}
      <div className="p-4 rounded-2xl bg-surface-subtle border border-subtle space-y-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            id="checkbox-terms-agree"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-5 h-5 rounded text-accent focus:ring-accent accent-[var(--ui-accent)] mt-0.5 shrink-0 cursor-pointer min-h-[20px] min-w-[20px]"
          />
          <div className="space-y-1">
            <span className="text-[15px] font-bold text-primary">
              {language === 'bn'
                ? 'আমি নিশ্চিত করছি যে প্রদত্ত তথ্যসমূহ আমার জানামতে সত্য ও বাস্তব ঘটনার ভিত্তিতে প্রদত্ত।'
                : 'I confirm that the details provided are accurate to the best of my knowledge.'}
            </span>
            <p className="text-[14px] text-muted leading-relaxed">
              {language === 'bn'
                ? 'প্ল্যাটফর্মের দায়িত্বশীল ব্যবহারের অংশ হিসেবে কোনো অসত্য বা উদ্দেশ্যপ্রণোদিত অপপ্রচার গ্রহণযোগ্য নয়। জমা দেওয়ার পর প্রতিবেদনটি মডারেশন পর্যালোচনায় যাবে।'
                : 'As part of responsible platform moderation, false reports are prohibited. Submitted reports enter the private moderation queue.'}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};
