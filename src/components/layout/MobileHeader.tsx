import React from 'react';
import { Menu, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileHeader: React.FC = () => {
  const { navigateTo, language, setIsTabletMenuOpen } = useApp();

  return (
    <header
      id="mobile-header"
      className="md:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle pt-safe"
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-full">
        {/* Left: Menu Button to open navigation drawer */}
        <button
          id="mobile-header-menu-btn"
          type="button"
          onClick={() => setIsTabletMenuOpen(true)}
          aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open navigation menu'}
          className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary flex items-center justify-center cursor-pointer transition-colors hover:bg-ui-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shrink-0"
        >
          <Menu className="w-5 h-5 text-ui-content-primary" aria-hidden="true" />
        </button>

        {/* Right: Search Button navigating to /search */}
        <button
          id="mobile-header-search-btn"
          type="button"
          onClick={() => navigateTo('/search')}
          aria-label={language === 'bn' ? 'অনুসন্ধান করুন' : 'Search reports'}
          className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary flex items-center justify-center cursor-pointer transition-colors hover:bg-ui-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shrink-0"
        >
          <Search className="w-5 h-5 text-ui-content-primary" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

