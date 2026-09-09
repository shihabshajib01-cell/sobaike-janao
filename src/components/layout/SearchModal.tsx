import React, { useState } from 'react';
import { Layers } from 'lucide-react';
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
      title={language === 'bn' ? 'অনুসন্ধান করুন' : 'Search Sobaike Janao'}
      description={
        language === 'bn'
          ? 'বিভাগ বা তথ্যের বিবরণ দিয়ে অনুসন্ধান করুন'
          : 'Search by category or keywords'
      }
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
              ? 'কী খুঁজতে চান? (উদাঃ হয়রানি, চার্জিং, চাঁদা)'
              : 'What are you searching for? (e.g. Harassment, Charging, Extortion)'
          }
          onSearch={() => {
            setIsSearchModalOpen(false);
            navigateTo('/search');
          }}
        />

        {/* Quick Category Filters */}
        <div className="space-y-2.5">
          <p className="text-[14px] font-bold text-ui-content-muted uppercase tracking-wider">
            {language === 'bn' ? 'প্রধান ৩টি বিভাগ' : 'Main 3 Categories'}
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

        {/* Category guidance note */}
        <div className="p-3.5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle text-[14px] text-ui-content-secondary flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-ui-content-muted shrink-0 mt-0.5" />
          <span>
            {language === 'bn'
              ? 'নির্দিষ্ট তথ্য ও অভিযোগ দেখতে যেকোনো একটি বিভাগে সরাসরি প্রবেশ করুন।'
              : 'Select any of the 3 primary sections to explore public reports.'}
          </span>
        </div>
      </div>
    </Modal>
  );
};

