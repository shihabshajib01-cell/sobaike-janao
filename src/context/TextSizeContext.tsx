import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type TextSizePreference = 'smaller' | 'default' | 'larger';

export interface TextSizeContextType {
  textSize: TextSizePreference;
  setTextSize: (preference: TextSizePreference) => void;
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

export const TEXT_SIZE_STORAGE_KEY = 'sobaike-janao-text-size';

const isTextSizePreference = (value: string | null): value is TextSizePreference =>
  value === 'smaller' || value === 'default' || value === 'larger';

export function getStoredTextSizePreference(): TextSizePreference {
  if (typeof window === 'undefined') return 'default';

  try {
    const stored = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    return isTextSizePreference(stored) ? stored : 'default';
  } catch {
    return 'default';
  }
}

export function applyTextSizePreference(preference: TextSizePreference): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-text-size', preference);
}

export function applyStoredTextSizePreference(): void {
  applyTextSizePreference(getStoredTextSizePreference());
}

export const TextSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSizeState] = useState<TextSizePreference>(getStoredTextSizePreference);

  useEffect(() => {
    applyTextSizePreference(textSize);
  }, [textSize]);

  const setTextSize = useCallback((preference: TextSizePreference) => {
    setTextSizeState(preference);
    applyTextSizePreference(preference);

    try {
      window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, preference);
    } catch {
      // Keep the in-session preference even when persistent storage is unavailable.
    }
  }, []);

  const value = useMemo<TextSizeContextType>(
    () => ({ textSize, setTextSize }),
    [setTextSize, textSize]
  );

  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
};

export const useTextSize = (): TextSizeContextType => {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
};
