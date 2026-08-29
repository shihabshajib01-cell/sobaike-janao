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
