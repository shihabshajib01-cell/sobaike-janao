import { apiClient } from './apiClient';
import { ReportItem } from '../types/report';
import { SectionKey } from '../theme/tokens';
import { MOCK_REPORTS } from '../data/mockReports';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  mapSupabasePublicReportToItem,
  SupabasePublicReportRPC,
} from './supabasePublicReportMapper';

export interface PublicReportFilters {
  segment?: SectionKey | 'all';
  subcategory?: string;
  district?: string;
  search?: string;
  sort?: string;
  limit?: number;
}

export const PublicReportService = {
  /**
   * Fetch all published reports matching optional criteria.
   * When Supabase is configured, queries the sanitized RPC `get_public_published_reports`.
   * When Supabase is not configured, uses local MOCK_REPORTS.
   */
  async getAll(filters?: PublicReportFilters): Promise<ReportItem[]> {
    if (isSupabaseConfigured()) {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const { data, error } = await supabase.rpc('get_public_published_reports');
      if (error) {
        console.error('[PublicReportService.getAll] Supabase RPC error:', error);
        throw error;
      }

      if (!data || !Array.isArray(data)) {
        return [];
      }

      let list: ReportItem[] = data.map((raw: SupabasePublicReportRPC) =>
        mapSupabasePublicReportToItem(raw)
      );

      if (filters?.segment && filters.segment !== 'all') {
        list = list.filter((r) => r.segment === filters.segment);
      }
      if (filters?.subcategory && filters.subcategory !== 'all') {
        list = list.filter((r) => r.subcategoryId === filters.subcategory);
      }
      if (filters?.district && filters.district !== 'all') {
        const dist = filters.district.toLowerCase().trim();
        list = list.filter((r) => {
          const dEn = (r.districtEn || '').toLowerCase();
          const dBn = (r.districtBn || '').toLowerCase();
          return dEn.includes(dist) || dBn.includes(dist);
        });
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter((r) => {
          const titleEn = (r.titleEn || '').toLowerCase();
          const titleBn = (r.titleBn || '').toLowerCase();
          const descEn = (r.shortDescriptionEn || r.fullDescriptionEn || '').toLowerCase();
          const descBn = (r.shortDescriptionBn || r.fullDescriptionBn || '').toLowerCase();
          const locEn = (r.locationEn || '').toLowerCase();
          const locBn = (r.locationBn || '').toLowerCase();
          const subjEn = (r.reportedSubjectEn || r.reportedSubject || '').toLowerCase();
          const subjBn = (r.reportedSubjectBn || r.reportedSubject || '').toLowerCase();
          const org = (r.organization || '').toLowerCase();
          return (
            titleEn.includes(q) ||
            titleBn.includes(q) ||
            descEn.includes(q) ||
            descBn.includes(q) ||
            locEn.includes(q) ||
            locBn.includes(q) ||
            subjEn.includes(q) ||
            subjBn.includes(q) ||
            org.includes(q)
          );
        });
      }

      if (filters?.limit && filters.limit > 0) {
        list = list.slice(0, filters.limit);
      }

      return list;
    }

    // Local / Dev Fallback with MOCK_REPORTS when Supabase is not configured
    let list = [...MOCK_REPORTS];
    if (filters?.segment && filters.segment !== 'all') {
      list = list.filter((r) => r.segment === filters.segment);
    }
    if (filters?.subcategory && filters.subcategory !== 'all') {
      list = list.filter((r) => r.subcategoryId === filters.subcategory);
    }
    if (filters?.district && filters.district !== 'all') {
      const dist = filters.district.toLowerCase().trim();
      list = list.filter((r) => {
        const dEn = (r.districtEn || '').toLowerCase();
        const dBn = (r.districtBn || '').toLowerCase();
        return dEn.includes(dist) || dBn.includes(dist);
      });
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((r) => {
        const titleEn = (r.titleEn || '').toLowerCase();
        const titleBn = (r.titleBn || '').toLowerCase();
        const descEn = (r.shortDescriptionEn || r.fullDescriptionEn || '').toLowerCase();
        const descBn = (r.shortDescriptionBn || r.fullDescriptionBn || '').toLowerCase();
        const locEn = (r.locationEn || '').toLowerCase();
        const locBn = (r.locationBn || '').toLowerCase();
        const subjEn = (r.reportedSubjectEn || r.reportedSubject || '').toLowerCase();
        const subjBn = (r.reportedSubjectBn || r.reportedSubject || '').toLowerCase();
        return (
          titleEn.includes(q) ||
          titleBn.includes(q) ||
          descEn.includes(q) ||
          descBn.includes(q) ||
          locEn.includes(q) ||
          locBn.includes(q) ||
          subjEn.includes(q) ||
          subjBn.includes(q)
        );
      });
    }

    if (filters?.limit && filters.limit > 0) {
      list = list.slice(0, filters.limit);
    }

    return list;
  },

  /**
   * Fetch a single published report and any published subject responses by ID.
   * When Supabase is configured, queries the sanitized RPC `get_public_published_report`.
   */
  async getById(id: string): Promise<{ report: ReportItem; responses: any[] } | null> {
    const cleanId = id.trim().toUpperCase();

    if (isSupabaseConfigured()) {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const { data, error } = await supabase.rpc('get_public_published_report', {
        p_report_id: cleanId,
      });

      if (error) {
        console.error('[PublicReportService.getById] Supabase RPC error:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      const report = mapSupabasePublicReportToItem(data as SupabasePublicReportRPC);
      return {
        report,
        responses: [],
      };
    }

    // Local / Dev Fallback when Supabase is not configured
    try {
      const res = await apiClient.getPublicReportById(cleanId);
      if (res && res.success && res.report) {
        return {
          report: res.report,
          responses: res.responses || [],
        };
      }
    } catch {
      // Fallback to MOCK_REPORTS
    }

    const found = MOCK_REPORTS.find(
      (r) => r.id.toUpperCase() === cleanId || r.id.toLowerCase() === id.toLowerCase().trim()
    );
    if (found) {
      return { report: found, responses: [] };
    }
    return null;
  },

  /**
   * Fetch published reports filtered by section/segment.
   */
  async getBySegment(
    segment: SectionKey,
    filters?: Omit<PublicReportFilters, 'segment'>
  ): Promise<ReportItem[]> {
    return this.getAll({ ...filters, segment });
  },

  /**
   * Search published reports by keyword and optional segment/district filters.
   */
  async search(
    query: string,
    filters?: { segment?: SectionKey | 'all'; district?: string }
  ): Promise<ReportItem[]> {
    const trimmed = query.trim();
    return this.getAll({
      segment: filters?.segment,
      district: filters?.district,
      search: trimmed || undefined,
    });
  },

  /**
   * Fetch map-safe published reports with approved coordinates only.
   */
  async getMapReports(segment?: SectionKey | 'all'): Promise<ReportItem[]> {
    let list: ReportItem[] = [];
    try {
      const res = await apiClient.getPublicMap(segment);
      if (res && res.reports && res.reports.length > 0) {
        list = res.reports;
      }
    } catch {
      // Fallback
    }

    if (list.length === 0) {
      list = MOCK_REPORTS.filter((r) => (segment && segment !== 'all' ? r.segment === segment : true));
    }

    // Safety guard: Must have valid numeric coordinates and not be withheld location
    return list.filter((r) => {
      const distEn = (r.districtEn || '').toLowerCase().trim();
      const distBn = (r.districtBn || '').toLowerCase().trim();
      const locEn = (r.locationEn || '').toLowerCase().trim();
      const locBn = (r.locationBn || '').toLowerCase().trim();

      if (
        !r.districtEn ||
        distEn.includes('withheld') ||
        distEn.includes('গোপন') ||
        distBn.includes('গোপন') ||
        locEn.includes('withheld') ||
        locBn.includes('গোপন')
      ) {
        return false;
      }

      return (
        r.coordinates &&
        typeof r.coordinates.lat === 'number' &&
        typeof r.coordinates.lng === 'number' &&
        !isNaN(r.coordinates.lat) &&
        !isNaN(r.coordinates.lng)
      );
    });
  },

  /**
   * Fetch published reports associated with a specific location / district name.
   */
  async getByLocation(locationQuery: string): Promise<ReportItem[]> {
    const all = await this.getAll();
    const clean = locationQuery.toLowerCase().trim();
    return all.filter((r) => {
      const distEn = (r.districtEn || '').toLowerCase();
      const distBn = (r.districtBn || '').toLowerCase();
      const locEn = (r.locationEn || '').toLowerCase();
      const locBn = (r.locationBn || '').toLowerCase();

      // Guard: withheld location reports must never appear in named location feeds
      if (
        !r.districtEn ||
        distEn.includes('withheld') ||
        distBn.includes('গোপন') ||
        locEn.includes('withheld') ||
        locBn.includes('গোপন')
      ) {
        return false;
      }

      return (
        distEn.includes(clean) ||
        distBn.includes(clean) ||
        locEn.includes(clean) ||
        locBn.includes(clean)
      );
    });
  },

  /**
   * Fetch published reports where a specific subject is publicly identified.
   */
  async getBySubject(subjectName: string): Promise<ReportItem[]> {
    const all = await this.getAll();
    const clean = subjectName.toLowerCase().trim();
    return all.filter((r) => {
      // Guard: withheld subjects must never appear in named subject feeds
      if (
        !r.reportedSubject ||
        r.reportedSubjectBn === 'পরিচয় গোপন' ||
        r.reportedSubjectEn === 'Subject withheld'
      ) {
        return false;
      }

      const sBn = (r.reportedSubjectBn || r.reportedSubject || '').toLowerCase();
      const sEn = (r.reportedSubjectEn || r.reportedSubject || '').toLowerCase();
      const org = (r.organization || '').toLowerCase();

      return sBn.includes(clean) || sEn.includes(clean) || org.includes(clean);
    });
  },

  /**
   * Fetch related published reports for a given report ID.
   */
  async getRelatedReports(reportId: string, relatedIds: string[] = []): Promise<ReportItem[]> {
    if (!relatedIds || relatedIds.length === 0) {
      return [];
    }
    const all = await this.getAll();
    return all.filter((r) => r.id !== reportId && relatedIds.includes(r.id));
  },
};
