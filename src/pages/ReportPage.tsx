import React, { useEffect } from 'react';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { SectionKey } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

export interface ReportPageProps {
  initialSegment?: SectionKey | null;
}

export const ReportPage: React.FC<ReportPageProps> = () => {
  const { language, openReportComposer, navigateTo } = useApp();

  return (
    <PublicPageContainer id="report-page-launcher">
      <div className="max-w-[640px] mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--ui-accent-soft)] text-primary flex items-center justify-center">
          <PlusCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[24px] font-bold text-primary">
            {language === 'bn' ? 'অভিযোগ বা ঘটনা জানান' : 'Report an Incident'}
          </h1>
          <p className="text-[16px] text-muted max-w-[480px] mx-auto">
            {language === 'bn'
              ? 'রিপোর্ট কম্পোজার খোলা হচ্ছে। আপনি যদি এটি না দেখতে পান, নিচের বোতামে ক্লিক করুন।'
              : 'Opening Report Composer. If it did not open automatically, click the button below.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            id="reopen-composer-cta"
            variant="primary"
            size="lg"
            leftIcon={<PlusCircle className="w-5 h-5" />}
            onClick={() => {
              openReportComposer();
            }}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {language === 'bn' ? 'কম্পোজার খুলুন' : 'Open Composer'}
          </Button>

          <Button
            id="back-to-home-cta"
            variant="secondary"
            size="lg"
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigateTo('/')}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {language === 'bn' ? 'মূলপাতায় ফিরে যান' : 'Back to Home'}
          </Button>
        </div>
      </div>
    </PublicPageContainer>
  );
};
