import React, { useState } from 'react';
import { useApp, RoutePath } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { SearchInput } from '../ui/SearchInput';
import { CategoryBadge } from '../ui/CategoryBadge';
import { Button } from '../ui/Button';
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
          <p className="type-compact font-[var(--font-weight-bold)] text-ui-content-muted uppercase tracking-wider">
            {language === 'bn' ? 'বিভাগ' : 'Categories'}
          </p>
          <div className="flex flex-wrap gap-2">
            {quickCategories.map((key) => {
              const sec = SECTIONS[key];
              return (
                <Button
                  key={key}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectSection(sec.slug as RoutePath)}
                  className="p-0"
                >
                  <CategoryBadge section={key} language={language} size="md" />
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

