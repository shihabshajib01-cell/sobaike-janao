/**
 * Utilities for formatting numbers, dates, and Bangla digits
 */

export const toBanglaDigits = (num: number | string): string => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
};

export const formatReportCount = (count: number, language: 'bn' | 'en'): string => {
  if (language === 'bn') {
    return `${toBanglaDigits(count)}টি`;
  }
  return `${count} ${count === 1 ? 'report' : 'reports'}`;
};

export const formatRankNumber = (rank: number, language: 'bn' | 'en'): string => {
  if (language === 'bn') {
    return `${toBanglaDigits(rank)}`;
  }
  return `${rank}`;
};

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const formatBillingMonth = (monthStr?: string, language: 'bn' | 'en' = 'en'): string => {
  if (!monthStr) return '-';
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      if (language === 'bn') {
        return `${BANGLA_MONTHS[monthIndex]} ${toBanglaDigits(year)}`;
      }
      return `${ENGLISH_MONTHS[monthIndex]} ${year}`;
    }
  }
  return monthStr;
};
