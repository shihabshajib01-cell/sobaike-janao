export type InterfaceLanguage = 'bn' | 'en';

const localeFor = (language: InterfaceLanguage) =>
  language === 'bn' ? 'bn-BD' : 'en';

export function sortByLocalizedName<T extends { nameBn: string; nameEn: string }>(
  items: readonly T[],
  language: InterfaceLanguage
): T[] {
  const locale = localeFor(language);
  return [...items].sort((a, b) =>
    (language === 'bn' ? a.nameBn : a.nameEn).localeCompare(
      language === 'bn' ? b.nameBn : b.nameEn,
      locale,
      { sensitivity: 'base' }
    )
  );
}

export function sortOptionsByLabel<T extends { label: string }>(
  options: readonly T[],
  language: InterfaceLanguage
): T[] {
  const locale = localeFor(language);
  return [...options].sort((a, b) =>
    a.label.localeCompare(b.label, locale, { sensitivity: 'base' })
  );
}
