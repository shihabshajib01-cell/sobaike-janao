import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  keywords?: string[];
}

export interface SearchableSelectProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  noResultsText = 'No matching options',
  helperText,
  error,
  required = false,
  disabled = false,
  clearable = false,
  className = '',
}) => {
  const generatedId = useId();
  const controlId = id || `searchable-select-${generatedId.replace(/:/g, '')}`;
  const listboxId = `${controlId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return options;
    return options.filter((option) => {
      const searchable = [option.label, option.value, ...(option.keywords || [])]
        .join(' ')
        .toLocaleLowerCase();
      return searchable.includes(normalized);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
    setQuery('');
  };

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className={`relative w-full text-left ${className}`}>
      {label && (
        <label id={`${controlId}-label`} className="block type-label text-ui-content-primary mb-1.5">
          {label}
          {required && (
            <span className="text-ui-validation-text ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <button
          id={controlId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={label ? `${controlId}-label ${controlId}` : undefined}
          aria-required={required || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${controlId}-error` : helperText ? `${controlId}-helper` : undefined}
          disabled={disabled}
          onClick={() => (isOpen ? setIsOpen(false) : open())}
          className={`w-full min-h-[44px] bg-ui-surface text-left ui-border-default ui-radius-control px-3.5 pr-10 transition-colors focus:outline-none focus:ring-2 disabled:bg-ui-surface-subtle disabled:text-ui-content-muted disabled:cursor-not-allowed ${
            error
              ? 'border-ui-validation-border focus:ring-ui-validation-focus focus:border-ui-validation-focus'
              : 'border-ui-stroke-default hover:border-ui-stroke-strong focus:ring-ui-focus'
          }`}
        >
          <span className={selected ? 'text-ui-content-primary' : 'text-ui-content-muted'}>
            {selected?.label || placeholder}
          </span>
        </button>

        <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
          {clearable && value && !disabled && (
            <button
              type="button"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-ui-content-muted hover:text-ui-content-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              aria-label="Clear selection"
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
                setQuery('');
              }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-ui-content-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[80] mt-1.5 w-full min-w-[220px] overflow-hidden rounded-xl border border-ui-stroke-default bg-ui-surface shadow-xl">
          <div className="p-2 border-b border-ui-stroke-subtle bg-ui-surface sticky top-0">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-content-muted pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full min-h-[42px] rounded-lg border border-ui-stroke-default bg-ui-surface pl-9 pr-3 text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus"
              />
            </div>
          </div>

          <div id={listboxId} role="listbox" className="max-h-64 overflow-y-auto p-1.5 overscroll-contain">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-4 text-[14px] text-ui-content-muted text-center">{noResultsText}</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => selectValue(option.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg flex items-center justify-between gap-3 text-left text-[14px] text-ui-content-primary hover:bg-ui-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-ui-accent" aria-hidden="true" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <p id={`${controlId}-error`} role="alert" className="mt-1.5 type-helper text-ui-validation-text font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${controlId}-helper`} className="mt-1.5 type-helper text-ui-content-muted">
          {helperText}
        </p>
      )}
    </div>
  );
};
