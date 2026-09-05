import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, MapPin, X, AlertCircle } from 'lucide-react';
import {
  PlaceSuggestion,
  ResolvedPlaceResult,
  searchBangladeshPlaces,
  getPlaceDetails,
} from '../../services/googlePlacesService';

export interface AddressSearchInputProps {
  language: 'bn' | 'en';
  onPlaceSelected: (result: ResolvedPlaceResult) => void;
  biasCoords?: { lat: number; lng: number };
  initialValue?: string;
  disabled?: boolean;
}

export const AddressSearchInput: React.FC<AddressSearchInputProps> = ({
  language,
  onPlaceSelected,
  biasCoords,
  initialValue = '',
  disabled = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [hasError, setHasError] = useState(false);
  const [hasNoResults, setHasNoResults] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initialValue when it changes from outside (e.g. draft restore or selection)
  useEffect(() => {
    if (initialValue && !isOpen) {
      setQuery(initialValue);
    }
  }, [initialValue, isOpen]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Debounced search query
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const trimmed = searchQuery.trim();
      if (trimmed.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        setHasNoResults(false);
        setHasError(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      setHasNoResults(false);

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await searchBangladeshPlaces(trimmed, biasCoords);
          setSuggestions(results);
          setIsOpen(true);
          setActiveIndex(-1);
          setHasNoResults(results.length === 0);
        } catch (err) {
          console.warn('[AddressSearchInput] Search failed:', err);
          setSuggestions([]);
          setHasError(true);
          setIsOpen(true);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [biasCoords]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setQuery(newVal);
    performSearch(newVal);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setIsOpen(false);
    setQuery(suggestion.description);
    setIsResolving(true);

    try {
      const details = await getPlaceDetails(suggestion.placeId);
      if (details) {
        onPlaceSelected(details);
        if (details.formattedAddress) {
          setQuery(details.formattedAddress);
        }
      }
    } catch (err) {
      console.warn('[AddressSearchInput] Failed to get place details:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setHasNoResults(false);
    setHasError(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-left space-y-1">
      <label
        htmlFor="address-search-input"
        className="block text-[13px] font-bold text-primary"
      >
        {language === 'bn' ? 'ঠিকানা বা জায়গা খুঁজুন' : 'Search address or place'}
      </label>

      <div className="relative flex items-center">
        {/* Left Search / State Icon */}
        <div className="absolute left-3.5 flex items-center pointer-events-none text-secondary">
          {isLoading || isResolving ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-secondary" />
          )}
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          id="address-search-input"
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="address-suggestions-list"
          aria-activedescendant={
            activeIndex >= 0 ? `address-suggestion-${activeIndex}` : undefined
          }
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          disabled={disabled || isResolving}
          placeholder={
            language === 'bn'
              ? 'এলাকা, রাস্তা, প্রতিষ্ঠান বা পরিচিত জায়গার নাম লিখুন'
              : 'Type an area, road, place, or landmark'
          }
          className="w-full pl-10 pr-10 py-2.5 bg-surface border border-subtle rounded-xl text-[14px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface-subtle"
        />

        {/* Clear Button */}
        {query && !isResolving && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 text-secondary hover:text-primary rounded-full hover:bg-surface-hover cursor-pointer transition-colors"
            title={language === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
            aria-label={language === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          id="address-suggestions-list"
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl bg-surface border border-subtle shadow-lg py-1.5 focus:outline-none divide-y divide-subtle/40"
        >
          {suggestions.length > 0 &&
            suggestions.map((suggestion, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={suggestion.placeId}
                  id={`address-suggestion-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`flex items-start gap-2.5 px-3.5 py-2.5 cursor-pointer text-left transition-colors ${
                    isSelected ? 'bg-surface-hover text-accent' : 'hover:bg-surface-subtle text-primary'
                  }`}
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-primary truncate">
                      {suggestion.mainText}
                    </p>
                    {suggestion.secondaryText && (
                      <p className="text-[12px] text-secondary truncate">
                        {suggestion.secondaryText}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

          {hasNoResults && !isLoading && (
            <div className="px-3.5 py-3 text-center text-[13px] text-secondary">
              {language === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
            </div>
          )}

          {hasError && !isLoading && (
            <div className="flex items-center justify-center gap-1.5 px-3.5 py-3 text-center text-[13px] text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {language === 'bn'
                  ? 'অনুসন্ধানে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
                  : 'Search error. Please try again.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
