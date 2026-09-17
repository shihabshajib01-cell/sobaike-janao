import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';

export interface MobileCategoryFilterPortalProps {
  onOpen: () => void;
  language: 'bn' | 'en';
  renderMobile?: boolean;
  renderDesktop?: boolean;
}

const CategoryFilterButton: React.FC<{
  id: string;
  onOpen: () => void;
  language: 'bn' | 'en';
}> = ({ id, onOpen, language }) => (
  <button
    id={id}
    type="button"
    onClick={onOpen}
    aria-label={language === 'bn' ? 'ফিল্টার খুলুন' : 'Open filters'}
    aria-haspopup="dialog"
    className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary transition-colors hover:bg-ui-surface-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
  >
    <Filter className="h-5 w-5" aria-hidden="true" />
  </button>
);

export const MobileCategoryFilterPortal: React.FC<MobileCategoryFilterPortalProps> = ({
  onOpen,
  language,
  renderMobile = true,
  renderDesktop = true,
}) => {
  const [mobileTarget, setMobileTarget] = useState<HTMLElement | null>(null);
  const [desktopTarget, setDesktopTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMobileTarget(document.getElementById('mobile-category-location-slot'));
    setDesktopTarget(document.getElementById('desktop-category-filter-slot'));
  }, []);

  return (
    <>
      {renderMobile && mobileTarget
        ? createPortal(
            <CategoryFilterButton
              id="mobile-category-filter-btn"
              onOpen={onOpen}
              language={language}
            />,
            mobileTarget
          )
        : null}
      {renderDesktop && desktopTarget
        ? createPortal(
            <CategoryFilterButton
              id="desktop-category-filter-btn"
              onOpen={onOpen}
              language={language}
            />,
            desktopTarget
          )
        : null}
    </>
  );
};
