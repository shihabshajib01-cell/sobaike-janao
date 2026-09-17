import React, { useEffect, useMemo, useState } from 'react';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import { SectionKey } from '../../theme/tokens';
import { PartyDetailFilter, UtilityDetailFilter } from '../../utils/categoryFilterHelpers';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';

export interface CategoryFilterSubcategory {
  id: string;
  nameBn: string;
  nameEn: string;
}

export interface CategoryFilterValue {
  subcategoryId: string;
  divisionId: string;
  districtId: string;
  extra: string;
}

export interface CategoryFilterSheetProps {
  isOpen: boolean;
  section: SectionKey;
  language: 'bn' | 'en';
  subcategories: CategoryFilterSubcategory[];
  value: CategoryFilterValue;
  onClose: () => void;
  onApply: (next: CategoryFilterValue) => void;
}

const PARTY_FILTER_SECTIONS: SectionKey[] = [
  'extortion',
  'rickshaw',
  'public_safety',
  'road_transport',
  'illegal_occupation',
];

const getPartyFilterLabel = (section: SectionKey, isBn: boolean) => {
  const labels: Partial<Record<SectionKey, [string, string]>> = {
    extortion: ['অভিযুক্ত পক্ষের তথ্য', 'Accused party details'],
    rickshaw: ['অপারেটরের তথ্য', 'Operator details'],
    public_safety: ['সন্দেহভাজন/পক্ষের তথ্য', 'Suspect / party details'],
    road_transport: ['সংশ্লিষ্ট পক্ষের তথ্য', 'Related party details'],
    illegal_occupation: ['দখলকারী পক্ষের তথ্য', 'Occupying party details'],
  };
  const value = labels[section] || ['পক্ষের তথ্য', 'Party details'];
  return isBn ? value[0] : value[1];
};

export const CategoryFilterSheet: React.FC<CategoryFilterSheetProps> = ({
  isOpen,
  section,
  language,
  subcategories,
  value,
  onClose,
  onApply,
}) => {
  const isBn = language === 'bn';
  const [draftSubcategoryId, setDraftSubcategoryId] = useState(value.subcategoryId);
  const [draftDivisionId, setDraftDivisionId] = useState(value.divisionId);
  const [draftDistrictId, setDraftDistrictId] = useState(value.districtId);
  const [draftExtra, setDraftExtra] = useState(value.extra);

  useEffect(() => {
    if (!isOpen) return;
    setDraftSubcategoryId(value.subcategoryId);
    setDraftDivisionId(value.divisionId);
    setDraftDistrictId(value.districtId);
    setDraftExtra(value.extra);
  }, [isOpen, value.subcategoryId, value.divisionId, value.districtId, value.extra]);

  const districtOptions = useMemo(
    () =>
      BANGLADESH_DISTRICTS.filter(
        (district) => draftDivisionId === 'all' || district.divisionId === draftDivisionId
      ),
    [draftDivisionId]
  );

  const handleDivisionChange = (divisionId: string) => {
    setDraftDivisionId(divisionId);
    if (draftDistrictId === 'all') return;

    const selectedDistrict = BANGLADESH_DISTRICTS.find(
      (district) => district.id === draftDistrictId
    );
    if (!selectedDistrict || (divisionId !== 'all' && selectedDistrict.divisionId !== divisionId)) {
      setDraftDistrictId('all');
    }
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setDraftSubcategoryId(subcategoryId);
    setDraftExtra('all');
  };

  const resetDraft = () => {
    setDraftSubcategoryId('all');
    setDraftDivisionId('all');
    setDraftDistrictId('all');
    setDraftExtra('all');
  };

  const showsPartyFilter = PARTY_FILTER_SECTIONS.includes(section);
  const showsUtilityTimeFilter =
    section === 'load_shedding' &&
    (draftSubcategoryId === 'load-shedding-outage' || draftSubcategoryId === 'gas-shortage');
  const showsUtilityBillFilter =
    section === 'load_shedding' && draftSubcategoryId === 'excess-electricity-bill';

  const partyFilterOptions: Array<{ value: PartyDetailFilter; label: string }> = [
    { value: 'all', label: isBn ? 'সকল প্রতিবেদন' : 'All reports' },
    { value: 'named', label: isBn ? 'নাম/পরিচয় উল্লেখ আছে' : 'Named person / party' },
    { value: 'organization', label: isBn ? 'প্রতিষ্ঠান/সংস্থার তথ্য আছে' : 'Organization / institution' },
    { value: 'unspecified', label: isBn ? 'পক্ষের তথ্য উল্লেখ নেই' : 'No party specified' },
  ];

  const utilityTimeOptions: Array<{ value: UtilityDetailFilter; label: string }> = [
    { value: 'all', label: isBn ? 'সকল সময়' : 'Any time' },
    { value: 'morning', label: isBn ? 'সকাল (৬টা–১২টা)' : 'Morning (6am–12pm)' },
    { value: 'afternoon', label: isBn ? 'দুপুর (১২টা–৫টা)' : 'Afternoon (12pm–5pm)' },
    { value: 'evening', label: isBn ? 'সন্ধ্যা (৫টা–৯টা)' : 'Evening (5pm–9pm)' },
    { value: 'night', label: isBn ? 'রাত (৯টা–৬টা)' : 'Night (9pm–6am)' },
  ];

  const utilityBillOptions: Array<{ value: UtilityDetailFilter; label: string }> = [
    { value: 'all', label: isBn ? 'সকল বিল' : 'All bills' },
    { value: 'bill-positive', label: isBn ? 'আগের বিলের চেয়ে বেশি' : 'Higher than previous bill' },
    { value: 'bill-25', label: isBn ? '২৫% বা বেশি বৃদ্ধি' : '25%+ increase' },
    { value: 'bill-50', label: isBn ? '৫০% বা বেশি বৃদ্ধি' : '50%+ increase' },
    { value: 'bill-100', label: isBn ? '১০০% বা বেশি বৃদ্ধি' : '100%+ increase' },
  ];

  return (
    <Modal
      id={`${section}-category-filter-sheet`}
      isOpen={isOpen}
      onClose={onClose}
      title={isBn ? 'ফিল্টার' : 'Filter'}
      maxWidth="lg"
      mobilePresentation="sheet"
      footer={
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 w-full">
          <Button
            id={`${section}-filter-reset-btn`}
            type="button"
            variant="outline"
            onClick={resetDraft}
          >
            {isBn ? 'ফিল্টার মুছুন' : 'Clear filters'}
          </Button>
          <Button
            id={`${section}-filter-apply-btn`}
            type="button"
            fullWidth
            onClick={() =>
              onApply({
                subcategoryId: draftSubcategoryId,
                divisionId: draftDivisionId,
                districtId: draftDistrictId,
                extra: draftExtra,
              })
            }
          >
            {isBn ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {subcategories.length > 1 && (
          <Select
            id={`${section}-filter-subcategory`}
            label={isBn ? 'অভিযোগের ধরন' : 'Complaint type'}
            value={draftSubcategoryId}
            onChange={(event) => handleSubcategoryChange(event.target.value)}
            options={subcategories.map((subcategory) => ({
              value: subcategory.id,
              label: isBn ? subcategory.nameBn : subcategory.nameEn,
            }))}
          />
        )}

        <Select
          id={`${section}-filter-division`}
          label={isBn ? 'বিভাগ' : 'Division'}
          value={draftDivisionId}
          onChange={(event) => handleDivisionChange(event.target.value)}
          options={[
            { value: 'all', label: isBn ? 'সকল বিভাগ' : 'All divisions' },
            ...DIVISIONS.map((division) => ({
              value: division.id,
              label: isBn ? division.nameBn : division.nameEn,
            })),
          ]}
        />

        <SearchableSelect
          id={`${section}-filter-district`}
          label={isBn ? 'জেলা' : 'District'}
          value={draftDistrictId}
          onChange={setDraftDistrictId}
          placeholder={isBn ? 'সকল জেলা' : 'All districts'}
          searchPlaceholder={isBn ? 'জেলা খুঁজুন...' : 'Search districts...'}
          noResultsText={isBn ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}
          options={[
            { value: 'all', label: isBn ? 'সকল জেলা' : 'All districts' },
            ...districtOptions.map((district) => ({
              value: district.id,
              label: isBn ? district.nameBn : district.nameEn,
              keywords: [district.nameBn, district.nameEn],
            })),
          ]}
        />

        {showsPartyFilter && (
          <Select
            id={`${section}-filter-party-detail`}
            label={getPartyFilterLabel(section, isBn)}
            value={draftExtra}
            onChange={(event) => setDraftExtra(event.target.value)}
            options={partyFilterOptions}
          />
        )}

        {showsUtilityTimeFilter && (
          <Select
            id={`${section}-filter-incident-time`}
            label={isBn ? 'ঘটনার সময়' : 'Incident time'}
            value={draftExtra}
            onChange={(event) => setDraftExtra(event.target.value)}
            options={utilityTimeOptions}
          />
        )}

        {showsUtilityBillFilter && (
          <Select
            id={`${section}-filter-bill-increase`}
            label={isBn ? 'বিল বৃদ্ধির হার' : 'Bill increase'}
            value={draftExtra}
            onChange={(event) => setDraftExtra(event.target.value)}
            options={utilityBillOptions}
          />
        )}
      </div>
    </Modal>
  );
};
