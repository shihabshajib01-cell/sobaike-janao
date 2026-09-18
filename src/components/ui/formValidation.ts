export const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const PHONE_PATTERN = /^\+?[0-9 ()-]{7,25}$/;

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

export const isValidPhone = (value: string) => {
  const trimmed = value.trim();
  if (!PHONE_PATTERN.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export const isValidEmailOrPhone = (value: string) =>
  isValidEmail(value) || isValidPhone(value);

export const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isMonthAfter = (later: string, earlier: string) =>
  Boolean(later && earlier && later > earlier);
