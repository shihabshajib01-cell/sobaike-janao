import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  placeholderBn?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  id = 'global-search-input',
  value,
  defaultValue = '',
  placeholder = 'অভিযোগ বা এলাকা খুঁজুন... (Search reports or areas)',
  onChange,
  onSearch,
  onClear,
  className = '',
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(currentValue);
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search
        className="absolute left-3.5 w-4 h-4 text-muted pointer-events-none shrink-0"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        role="searchbox"
        aria-label="Search"
        autoFocus={autoFocus}
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full text-[16px] leading-[24px] min-h-[44px] bg-surface-subtle hover:bg-surface focus:bg-surface text-primary placeholder:text-muted rounded-xl pl-10 pr-9 py-2 border border-subtle hover:border-theme focus:border-[var(--ui-accent)] focus:ring-1 focus:ring-[var(--ui-focus)] transition-all outline-none"
      />
      {currentValue.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 p-1.5 rounded-full text-muted hover:text-primary hover:bg-surface-elevated focus:outline-none transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
