import React from 'react';
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
      <div className="w-full max-w-[640px] mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 mx-auto ui-radius-card bg-ui-accent-soft text-ui-content-primary flex items-center justify-center">
          <PlusCircle className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="type-h1 text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদন জমা দিন' : 'Submit a report'}
          </h1>
          <p className="type-body text-ui-content-muted max-w-[480px] mx-auto">
            {language === 'bn'
              ? 'প্রতিবেদন ফরম খোলা হচ্ছে। স্বয়ংক্রিয়ভাবে না খুললে নিচের বোতামে চাপ দিন।'
              : 'Opening report form. If it did not open automatically, use the button below.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            id="reopen-composer-cta"
            variant="primary"
            size="lg"
            leftIcon={<PlusCircle className="w-5 h-5" aria-hidden="true" />}
            onClick={() => {
              openReportComposer();
            }}
            className="w-full sm:w-auto"
          >
            {language === 'bn' ? 'প্রতিবেদন ফরম খুলুন' : 'Open report form'}
          </Button>

          <Button
            id="back-to-home-cta"
            variant="secondary"
            size="lg"
            leftIcon={<ArrowLeft className="w-5 h-5" aria-hidden="true" />}
            onClick={() => navigateTo('/')}
            className="w-full sm:w-auto"
          >
            {language === 'bn' ? 'মূল পাতায় ফিরুন' : 'Back to home'}
          </Button>
        </div>
      </div>
    </PublicPageContainer>
  );
};
