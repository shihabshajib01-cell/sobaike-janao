import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import avroPhonetic from '../../vendor/avro-phonetic/avroPhonetic';

type AppLanguage = 'bn' | 'en';

interface BanglaPhoneticContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  language: AppLanguage;
}

interface BanglaPhoneticProviderProps {
  language: AppLanguage;
  children: React.ReactNode;
}

interface PhoneticCommit {
  rawValue: string;
  convertedValue: string;
  rawCaret: number;
  convertedCaret: number;
}

export interface BanglaPhoneticInputController {
  enabled: boolean;
  labelAction: React.ReactNode;
  handleChange: <T extends HTMLInputElement | HTMLTextAreaElement>(
    event: React.ChangeEvent<T>,
    onChange?: React.ChangeEventHandler<T>,
    maxLength?: number
  ) => void;
  handleCompositionStart: <T extends HTMLInputElement | HTMLTextAreaElement>(
    event: React.CompositionEvent<T>,
    onCompositionStart?: React.CompositionEventHandler<T>
  ) => void;
  handleCompositionEnd: <T extends HTMLInputElement | HTMLTextAreaElement>(
    event: React.CompositionEvent<T>,
    onCompositionEnd?: React.CompositionEventHandler<T>
  ) => void;
}

const STORAGE_KEY = 'sobaike-janao:report-bangla-phonetic';
const BanglaPhoneticContext = createContext<BanglaPhoneticContextValue | null>(null);

const readInitialState = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const BanglaPhoneticProvider: React.FC<BanglaPhoneticProviderProps> = ({
  language,
  children,
}) => {
  const [enabled, setEnabledState] = useState<boolean>(readInitialState);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);

    try {
      window.sessionStorage.setItem(STORAGE_KEY, nextEnabled ? '1' : '0');
    } catch {
      // The feature still works if browser storage is unavailable.
    }
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      language,
    }),
    [enabled, language, setEnabled]
  );

  return (
    <BanglaPhoneticContext.Provider value={value}>
      {children}
    </BanglaPhoneticContext.Provider>
  );
};

const isCommitCharacter = (character: string): boolean =>
  /[\s,.!?;:।]/u.test(character);

const getCurrentChunkStart = (value: string, end: number): number => {
  let index = end - 1;

  while (index >= 0 && !/\s/u.test(value[index])) {
    index -= 1;
  }

  return index + 1;
};

const convertCommittedWord = (
  value: string,
  caret: number,
  maxLength?: number
): { value: string; caret: number } | null => {
  if (caret <= 0 || caret > value.length) return null;

  const commitIndex = caret - 1;
  const commitCharacter = value[commitIndex];
  if (!isCommitCharacter(commitCharacter)) return null;

  const beforeCommit = value.slice(0, commitIndex);
  const wordMatch = beforeCommit.match(/[A-Za-z]+$/u);
  if (!wordMatch) return null;

  const romanWord = wordMatch[0];
  const wordStart = commitIndex - romanWord.length;
  const chunkStart = getCurrentChunkStart(beforeCommit, commitIndex);
  const currentChunk = beforeCommit.slice(chunkStart);

  // Leave URLs, email addresses, paths, handles and mixed technical tokens alone.
  if (/[.@/:\\]/u.test(currentChunk) || /\d/u.test(currentChunk)) return null;

  const convertedWord = String(avroPhonetic.parse(romanWord));
  if (
    !convertedWord ||
    convertedWord === romanWord ||
    !/[\u0980-\u09FF]/u.test(convertedWord)
  ) {
    return null;
  }

  const convertedValue =
    value.slice(0, wordStart) +
    convertedWord +
    value.slice(commitIndex);

  if (maxLength !== undefined && convertedValue.length > maxLength) {
    return null;
  }

  return {
    value: convertedValue,
    caret: wordStart + convertedWord.length + 1,
  };
};

const removeCharacterAt = (value: string, index: number): string =>
  value.slice(0, index) + value.slice(index + 1);

const scheduleCaret = (
  element: HTMLInputElement | HTMLTextAreaElement,
  caret: number
) => {
  window.requestAnimationFrame(() => {
    if (document.activeElement !== element) return;
    element.setSelectionRange(caret, caret);
  });
};

export const BanglaPhoneticToggle: React.FC<{ id: string }> = ({ id }) => {
  const context = useContext(BanglaPhoneticContext);
  if (!context) return null;

  const label = context.language === 'bn' ? 'বাংলা' : 'Bangla';

  return (
    <div className="inline-flex shrink-0 items-center gap-1.5">
      <span className="type-helper text-role-on-surface-muted">{label}</span>
      <button
        id={`${id}-bangla-phonetic-toggle`}
        type="button"
        role="switch"
        aria-checked={context.enabled}
        aria-label={
          context.language === 'bn'
            ? 'বাংলা ফনেটিক টাইপিং চালু বা বন্ধ করুন'
            : 'Toggle Bangla phonetic typing'
        }
        title={
          context.language === 'bn'
            ? 'ইংরেজি অক্ষরে লিখে Space চাপলে বাংলা হবে'
            : 'Type phonetically in English letters and press Space to convert to Bangla'
        }
        onClick={() => context.setEnabled(!context.enabled)}
        className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-pill)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          className={`relative inline-flex h-6 w-11 rounded-[var(--radius-pill)] border transition-colors duration-200 ease-in-out ${
            context.enabled
              ? 'border-ui-action-bg bg-ui-action-bg'
              : 'border-ui-stroke-subtle bg-ui-surface-subtle'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-[var(--radius-pill)] bg-ui-action-text shadow-[var(--elevation-xs)] transition duration-200 ease-in-out ${
              context.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </span>
      </button>
    </div>
  );
};

export const useBanglaPhoneticInput = (
  id: string,
  eligible: boolean
): BanglaPhoneticInputController | null => {
  const context = useContext(BanglaPhoneticContext);
  const lastCommitRef = useRef<PhoneticCommit | null>(null);
  const isComposingRef = useRef(false);

  const enabled = Boolean(context && eligible && context.enabled);

  useEffect(() => {
    if (!enabled) {
      lastCommitRef.current = null;
    }
  }, [enabled]);

  if (!context || !eligible) return null;

  const handleChange = <T extends HTMLInputElement | HTMLTextAreaElement>(
    event: React.ChangeEvent<T>,
    onChange?: React.ChangeEventHandler<T>,
    maxLength?: number
  ) => {
    const element = event.currentTarget;
    let nextValue = element.value;
    let nextCaret = element.selectionStart ?? nextValue.length;

    if (!context.enabled || isComposingRef.current || event.nativeEvent.isComposing) {
      lastCommitRef.current = null;
      onChange?.(event);
      return;
    }

    const previousCommit = lastCommitRef.current;
    if (previousCommit) {
      const delimiterIndex = previousCommit.convertedCaret - 1;
      const expectedAfterBackspace = removeCharacterAt(
        previousCommit.convertedValue,
        delimiterIndex
      );

      if (
        nextValue === expectedAfterBackspace &&
        nextCaret === delimiterIndex
      ) {
        const rawDelimiterIndex = previousCommit.rawCaret - 1;
        const restoredRomanValue = removeCharacterAt(
          previousCommit.rawValue,
          rawDelimiterIndex
        );
        const restoredCaret = rawDelimiterIndex;

        element.value = restoredRomanValue;
        nextValue = restoredRomanValue;
        nextCaret = restoredCaret;
        lastCommitRef.current = null;
        onChange?.(event);
        scheduleCaret(element, restoredCaret);
        return;
      }
    }

    const conversion = convertCommittedWord(nextValue, nextCaret, maxLength);
    if (conversion) {
      const rawValue = nextValue;
      const rawCaret = nextCaret;

      element.value = conversion.value;
      nextValue = conversion.value;
      nextCaret = conversion.caret;

      lastCommitRef.current = {
        rawValue,
        convertedValue: conversion.value,
        rawCaret,
        convertedCaret: conversion.caret,
      };

      onChange?.(event);
      scheduleCaret(element, conversion.caret);
      return;
    }

    lastCommitRef.current = null;
    onChange?.(event);
  };

  const handleCompositionStart = <T extends HTMLInputElement | HTMLTextAreaElement>(
    event: React.CompositionEvent<T>,
    onCompositionStart?: React.CompositionEventHandler<T>
  ) => {
    isComposingRef.current = true;
    lastCommitRef.current = null;
    onCompositionStart?.(event);
  };

  const handleCompositionEnd = <T extends HTMLInputElement | HTMLTextAreaElement>(
    event: React.CompositionEvent<T>,
    onCompositionEnd?: React.CompositionEventHandler<T>
  ) => {
    isComposingRef.current = false;
    onCompositionEnd?.(event);
  };

  return {
    enabled,
    labelAction: <BanglaPhoneticToggle id={id} />,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
  };
};

export default BanglaPhoneticProvider;
