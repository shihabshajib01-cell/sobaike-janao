import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type PublicFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'month'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'multiselect'
  | 'phone'
  | 'email'
  | 'url'
  | 'location'
  | 'subject_party'
  | 'evidence'
  | 'privacy'
  | 'mob_justice_details';

export interface PublicFieldOption {
  value: string;
  labelEn: string;
  labelBn: string;
}

export interface PublicReportingField {
  fieldKey: string;
  fieldType: PublicFieldType;
  storageMode: 'core_column' | 'custom_json' | 'system_block';
  storageKey: string;
  labelEn: string;
  labelBn: string;
  helperEn?: string;
  helperBn?: string;
  placeholderEn?: string;
  placeholderBn?: string;
  required: boolean;
  active: boolean;
  sortOrder: number;
  options: PublicFieldOption[];
  validation: Record<string, any>;
  config: Record<string, any>;
}

export interface PublicReportingForm {
  subcategoryId: string;
  schemaId: string;
  version: number;
  engineMode: 'legacy' | 'schema';
  fields: PublicReportingField[];
}

export interface PublicCategoryConfig {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  shortNameEn: string;
  shortNameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  iconKey: string;
  themeKey: string;
  sortOrder: number;
}

export interface PublicSubcategoryConfig {
  id: string;
  segmentId: string;
  nameEn: string;
  nameBn: string;
  descriptionEn?: string;
  descriptionBn?: string;
  categoryGroup?: string | null;
  isSensitive?: boolean;
  sortOrder: number;
}

export interface PublicReportingConfiguration {
  segments: PublicCategoryConfig[];
  subcategories: PublicSubcategoryConfig[];
  forms: PublicReportingForm[];
}

let cached: PublicReportingConfiguration | null = null;
let pending: Promise<PublicReportingConfiguration> | null = null;

const emptyConfig = (): PublicReportingConfiguration => ({
  segments: [],
  subcategories: [],
  forms: [],
});

const normalize = (data: any): PublicReportingConfiguration => ({
  segments: Array.isArray(data?.segments) ? data.segments : [],
  subcategories: Array.isArray(data?.subcategories) ? data.subcategories : [],
  forms: Array.isArray(data?.forms)
    ? data.forms.map((form: any) => ({
        subcategoryId: String(form.subcategoryId || ''),
        schemaId: String(form.schemaId || ''),
        version: Number(form.version || 0),
        engineMode: form.engineMode === 'schema' ? 'schema' : 'legacy',
        fields: Array.isArray(form.fields)
          ? form.fields.map((field: any) => ({
              ...field,
              options: Array.isArray(field.options) ? field.options : [],
              validation:
                field.validation && typeof field.validation === 'object' ? field.validation : {},
              config: field.config && typeof field.config === 'object' ? field.config : {},
              active: field.active !== false,
              required: Boolean(field.required),
              sortOrder: Number(field.sortOrder || 0),
            }))
          : [],
      }))
    : [],
});

export const PublicReportingConfigService = {
  async fetch(force = false): Promise<PublicReportingConfiguration> {
    if (!force && cached) return cached;
    if (!force && pending) return pending;

    pending = (async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return cached || emptyConfig();
      }

      const { data, error } = await supabase.rpc('get_public_reporting_configuration');
      if (error) {
        console.warn('[ReportingConfig] Failed to load configuration:', error.message);
        return cached || emptyConfig();
      }

      cached = normalize(data);
      return cached;
    })();

    try {
      return await pending;
    } finally {
      pending = null;
    }
  },

  invalidate(): void {
    cached = null;
  },

  getCached(): PublicReportingConfiguration {
    return cached || emptyConfig();
  },

  getForm(subcategoryId: string): PublicReportingForm | null {
    return (
      cached?.forms.find((form) => form.subcategoryId === subcategoryId) || null
    );
  },
};

export function useReportingFormConfig(subcategoryId: string) {
  const [form, setForm] = useState<PublicReportingForm | null>(() =>
    subcategoryId ? PublicReportingConfigService.getForm(subcategoryId) : null
  );
  const [loading, setLoading] = useState(Boolean(subcategoryId && !cached));

  useEffect(() => {
    let cancelled = false;

    if (!subcategoryId) {
      setForm(null);
      setLoading(false);
      return;
    }

    const existing = PublicReportingConfigService.getForm(subcategoryId);
    if (existing) {
      setForm(existing);
      setLoading(false);
    }

    PublicReportingConfigService.fetch()
      .then(() => {
        if (!cancelled) {
          setForm(PublicReportingConfigService.getForm(subcategoryId));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subcategoryId]);

  return { form, loading };
}
