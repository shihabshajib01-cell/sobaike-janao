import React, { useState } from 'react';
import { useApp, RoutePath } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { SearchInput } from '../ui/SearchInput';
import { CategoryBadge } from '../ui/CategoryBadge';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, setIsSearchModalOpen, navigateTo, language } = useApp();
  const { segments } = useTaxonomy();
  const [searchQuery, setSearchQuery] = useState('');

  const quickCategories = Object.values(segments)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, 3);

  const handleSelectSection = (path: RoutePath) => {
    setIsSearchModalOpen(false);
    navigateTo(path);
  };

  return (
    <Modal
      id="global-search-modal"
      isOpen={isSearchModalOpen}
      onClose={() => setIsSearchModalOpen(false)}
      title={language === 'bn' ? 'অনুসন্ধান' : 'Search'}
      maxWidth="md"
      language={language}
    >
      <div className="space-y-5">
        <SearchInput
          id="modal-search-input"
          autoFocus
          value={searchQuery}
          onChange={setSearchQuery}
          language={language}
          placeholder={
            language === 'bn'
              ? 'প্রতিবেদন বা এলাকা খুঁজুন...'
              : 'Search reports or areas...'
          }
          onSearch={() => {
            setIsSearchModalOpen(false);
            navigateTo('/search');
          }}
        />

        {/* Quick Category Filters */}
        <div className="space-y-2.5">
          <p className="type-compact font-[var(--font-weight-bold)] text-ui-content-muted uppercase tracking-wider">
            {language === 'bn' ? 'বিভাগ' : 'Categories'}
          </p>
          <div className="flex flex-wrap gap-2">
            {quickCategories.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleSelectSection(sec.slug as RoutePath)}
                className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-[var(--radius-control)] min-h-[44px] flex items-center"
              >
                <CategoryBadge
                  section={sec.id as SectionKey}
                  language={language}
                  size="md"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

