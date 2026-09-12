import React, { useState } from 'react';
import { useApp, RoutePath } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { SearchInput } from '../ui/SearchInput';
import { CategoryBadge } from '../ui/CategoryBadge';
import { SECTIONS, SectionKey } from '../../theme/tokens';

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, setIsSearchModalOpen, navigateTo, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const quickCategories: SectionKey[] = ['harassment', 'rickshaw', 'extortion'];

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
          <p className="text-[14px] font-bold text-ui-content-muted uppercase tracking-wider">
            {language === 'bn' ? 'বিভাগ' : 'Categories'}
          </p>
          <div className="flex flex-wrap gap-2">
            {quickCategories.map((key) => {
              const sec = SECTIONS[key];
              return (
                <button
                  key={key}
                  onClick={() => handleSelectSection(sec.slug as RoutePath)}
                  className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-xl min-h-[44px] flex items-center"
                >
                  <CategoryBadge section={key} language={language} size="md" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

