import React from 'react';
import { ArrowLeft, Compass } from 'lucide-react';
import { COMING_SOON_SERVICES, ComingSoonServiceKey } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { AppIcon } from '../components/ui/AppIcon';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

export interface ComingSoonPageProps {
  serviceKey: ComingSoonServiceKey;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ serviceKey }) => {
  const { language, navigateTo } = useApp();
  const service = COMING_SOON_SERVICES[serviceKey];

  return (
    <PublicPageContainer id={`coming-soon-${serviceKey}-page`}>
      <div className="max-w-[640px] mx-auto py-10 md:py-16 px-4 text-center space-y-6">
        {/* Service Icon */}
        <div
          id={`coming-soon-icon-${serviceKey}`}
          className="w-16 h-16 mx-auto rounded-2xl bg-surface-subtle border border-subtle text-secondary flex items-center justify-center shadow-xs"
        >
          <AppIcon name={service.iconName} size="xl" strokeWidth={2} className="text-secondary" />
        </div>

        {/* Coming Soon Status Pill */}
        <div className="flex justify-center">
          <span
            id={`coming-soon-badge-${serviceKey}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[13px] font-semibold bg-surface-subtle border border-subtle text-secondary shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{language === 'bn' ? service.badgeBn : service.badgeEn}</span>
          </span>
        </div>

        {/* Service Title & Explanation */}
        <div className="space-y-3">
          <h1
            id={`coming-soon-title-${serviceKey}`}
            className="text-[26px] sm:text-[30px] font-extrabold text-primary tracking-tight leading-snug"
          >
            {language === 'bn' ? service.nameBn : service.nameEn}
          </h1>

          <p
            id={`coming-soon-description-${serviceKey}`}
            className="text-[16px] leading-[1.6] text-secondary max-w-[480px] mx-auto"
          >
            {language === 'bn' ? service.descriptionBn : service.descriptionEn}
          </p>
        </div>

        {/* Informative Notice Box */}
        <div className="bg-surface border border-subtle rounded-2xl p-4 sm:p-5 text-left max-w-[520px] mx-auto shadow-2xs space-y-2">
          <p className="text-[14px] font-semibold text-primary">
            {language === 'bn' ? 'সেবা প্রস্তুতি সংক্রান্ত তথ্য' : 'Service Status Information'}
          </p>
          <p className="text-[13.5px] leading-relaxed text-secondary">
            {language === 'bn'
              ? 'নাগরিক সুরক্ষা ও সঠিক যাচাইকরণ নিশ্চিত করতে এই বিভাগের কাঠামো উন্নয়ন পর্যায়ে রয়েছে। প্ল্যাটফর্মে উন্মুক্ত হলে নিয়মিত অভিযোগ দাখিল ও সার্বজনীন সতর্কতা প্রদর্শন সক্রিয় হবে।'
              : 'The verification framework for this category is currently under development. Structured civilian documentation and public safety alerts will be available upon launch.'}
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            id={`coming-soon-home-btn-${serviceKey}`}
            variant="primary"
            size="lg"
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigateTo('/')}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {language === 'bn' ? 'মূলপাতায় ফিরে যান' : 'Back to Home'}
          </Button>

          <Button
            id={`coming-soon-explore-btn-${serviceKey}`}
            variant="secondary"
            size="lg"
            leftIcon={<Compass className="w-5 h-5" />}
            onClick={() => navigateTo('/explore')}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {language === 'bn' ? 'সক্রিয় সেবাসমূহ দেখুন' : 'Explore Active Services'}
          </Button>
        </div>
      </div>
    </PublicPageContainer>
  );
};
