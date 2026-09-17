import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';

export interface MobileCategoryFilterPortalProps {
  onOpen: () => void;
  language: 'bn' | 'en';
}

export const MobileCategoryFilterPortal: React.FC<MobileCategoryFilterPortalProps> = ({
  onOpen,
  language,
}) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById('mobile-category-location-slot'));
  }, []);

  if (!target) return null;

  return createPortal(
    <button
      id="mobile-category-filter-btn"
      type="button"
      onClick={onOpen}
      aria-label={language === 'bn' ? 'ফিল্টার খুলুন' : 'Open filters'}
      aria-haspopup="dialog"
      className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary transition-colors hover:bg-ui-surface-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
    >
      <Filter className="h-5 w-5" aria-hidden="true" />
    </button>,
    target
  );
};
