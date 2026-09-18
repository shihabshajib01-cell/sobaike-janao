import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { FormField } from './FormField';
import { formFieldIds } from './formSystem';

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
  clearLabel?: string;
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
  clearLabel,
  className = '',
}) => {
  const generatedId = useId();
  const controlId = id || `searchable-select-${generatedId.replace(/:/g, '')}`;
  const listboxId = `${controlId}-listbox`;
  const { helperId, errorId, labelId } = formFieldIds(controlId);
  const describedBy = [helperText ? helperId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const selected = options.find((option) => option.value === value);
  const resolvedAccessibleLabel = label
    ? undefined
    : selected
      ? `${placeholder}: ${selected.label}`
      : placeholder;
  const resolvedClearLabel =
    clearLabel ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'bn'
      ? 'নির্বাচন মুছুন'
      : 'Clear selection');

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

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === 'undefined') return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edge = 8;
    const gap = 6;
    const spaceBelow = viewportHeight - rect.bottom - gap - edge;
    const spaceAbove = rect.top - gap - edge;
    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(96, openAbove ? spaceAbove : spaceBelow);
    const width = Math.min(rect.width, viewportWidth - edge * 2);
    const left = Math.min(Math.max(edge, rect.left), Math.max(edge, viewportWidth - width - edge));

    setPanelStyle({
      position: 'fixed',
      left,
      width,
      maxHeight: Math.min(340, availableHeight),
      ...(openAbove
        ? { bottom: viewportHeight - rect.top + gap, top: 'auto' }
        : { top: rect.bottom + gap, bottom: 'auto' }),
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(-1);
  }, []);

  const open = useCallback(() => {
    if (disabled) return;
    setQuery('');
    setActiveIndex(options.findIndex((option) => !option.disabled));
    updatePosition();
    setIsOpen(true);
  }, [disabled, options, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const clickedTrigger = rootRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };

    const handleViewportChange = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [close, isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const firstEnabledIndex = filteredOptions.findIndex((option) => !option.disabled);
    setActiveIndex(firstEnabledIndex);
  }, [filteredOptions, isOpen]);

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    close();
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const moveActive = (direction: 1 | -1) => {
    if (filteredOptions.length === 0) return;

    let next = activeIndex;
    for (let i = 0; i < filteredOptions.length; i += 1) {
      next = (next + direction + filteredOptions.length) % filteredOptions.length;
      if (!filteredOptions[next]?.disabled) {
        setActiveIndex(next);
        document
          .getElementById(`${listboxId}-option-${next}`)
          ?.scrollIntoView({ block: 'nearest' });
        return;
      }
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const activeOption = filteredOptions[activeIndex];
      if (activeOption && !activeOption.disabled) selectValue(activeOption.value);
    } else if (event.key === 'Tab') {
      close();
    }
  };

  const dropdown =
    isOpen && !disabled && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="z-[1000] flex flex-col overflow-hidden rounded-[var(--radius-control)] border border-role-outline bg-role-surface shadow-[var(--elevation-xl)]"
          >
            <div className="shrink-0 p-2 border-b border-role-outline-subtle bg-role-surface">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-role-on-surface-muted pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  aria-controls={listboxId}
                  aria-activedescendant={
                    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
                  }
                  className="w-full min-h-[44px] rounded-[var(--radius-badge-md)] border border-role-outline bg-role-surface pl-9 pr-3 text-role-on-surface placeholder:text-role-on-surface-muted focus:outline-none focus:ring-2 focus:ring-role-focus"
                />
              </div>
            </div>

            <div
              id={listboxId}
              role="listbox"
              className="min-h-0 flex-1 overflow-y-auto p-1.5 overscroll-contain"
            >
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-4 type-compact text-role-on-surface-muted text-center">
                  {noResultsText}
                </p>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      id={`${listboxId}-option-${index}`}
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                      onClick={() => selectValue(option.value)}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-[var(--radius-badge-md)] flex items-center justify-between gap-3 text-left type-compact text-role-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive ? 'bg-role-surface-subtle' : 'hover:bg-role-surface-subtle'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 text-role-secondary" aria-hidden="true" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <FormField
      id={controlId}
      label={label}
      helperText={helperText}
      error={error}
      required={required}
      className={className}
    >
      <div ref={rootRef} className="relative w-full">
        <button
          ref={triggerRef}
          id={controlId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={label ? `${labelId} ${controlId}` : undefined}
          aria-label={resolvedAccessibleLabel}
          aria-required={required || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={disabled}
          onClick={() => (isOpen ? close() : open())}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
              if (!isOpen) {
                event.preventDefault();
                open();
              }
            }
          }}
          className={`w-full min-h-[44px] bg-role-surface text-left ui-border-default ui-radius-control px-3.5 ${clearable && value && !disabled ? 'pr-16' : 'pr-10'} type-body transition-colors focus:outline-none focus:ring-2 disabled:bg-role-surface-subtle disabled:text-role-on-surface-muted disabled:cursor-not-allowed ${
            error
              ? 'border-role-validation-outline focus:ring-role-validation-focus focus:border-role-validation-focus'
              : 'border-role-outline hover:border-role-outline-strong focus:ring-role-focus'
          }`}
        >
          <span className={selected ? 'text-role-on-surface' : 'text-role-on-surface-muted'}>
            {selected?.label || placeholder}
          </span>
        </button>

        <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
          {clearable && value && !disabled ? (
            <button
              type="button"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[var(--radius-badge-md)] text-role-on-surface-muted hover:text-role-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus"
              aria-label={resolvedClearLabel}
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
                setQuery('');
              }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : null}
          <ChevronDown
            className={`w-4 h-4 text-role-on-surface-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {dropdown}
    </FormField>
  );
};
