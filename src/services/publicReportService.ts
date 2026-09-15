import { ReportItem, PublicPublishedResponse } from '../types/report';
import { SectionKey } from '../theme/tokens';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  mapSupabasePublicReportToItem,
  SupabasePublicReportRPC,
} from './supabasePublicReportMapper';
import { PublicEvidenceService } from './publicEvidenceService';
import { PublicResponseService } from './publicResponseService';
import {
  HarassmentAgeGroup,
  HarassmentAbuserRelationship,
  HarassmentReportingFor,
} from '../data/harassmentClassification';

export interface PublicReportFilters {
  segment?: SectionKey | 'all';
  subcategory?: string;
  district?: string;
  search?: string;
  sort?: string;
  limit?: number;
  visitorLat?: number | null;
  visitorLng?: number | null;
  affectedPersonAgeGroup?: HarassmentAgeGroup | 'all';
  allegedAbuserRelationship?: HarassmentAbuserRelationship | 'all';
  reportingFor?: HarassmentReportingFor | 'all';
}

export interface HomeFeedParams {
  visitorLat?: number | null;
  visitorLng?: number | null;
  filter?: 'all' | 'latest' | 'popular' | 'most_shared';
  district?: string;
}

// In-flight request deduplication map to prevent redundant concurrent network bursts
const inFlightRequests = new Map<string, Promise<any>>();

function fetchWithDeduplication<T>(key: string, fetcher: () => PromiseLike<T>): Promise<T> {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }
  const promise = Promise.resolve(fetcher()).finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

interface PublicHarassmentClassificationRow {
  id: string;
  affectedPersonAgeGroup?: HarassmentAgeGroup | null;
  allegedAbuserRelationship?: HarassmentAbuserRelationship | null;
  reportingFor?: HarassmentReportingFor | null;
}

async function enrichHarassmentClassifications(list: ReportItem[]): Promise<ReportItem[]> {
  if (!isSupabaseConfigured() || !supabase || !list.some((report) => report.segment === 'harassment')) {
    return list;
  }

  try {
    const { data, error } = await fetchWithDeduplication('rpc:get_public_harassment_classifications', () =>
      supabase!.rpc('get_public_harassment_classifications')
    );
    if (error) {
      console.warn('[PublicReportService] Classification enrichment error:', error);
      return list;
    }
    if (!Array.isArray(data)) return list;

    const byId = new Map(
      (data as PublicHarassmentClassificationRow[]).map((row) => [row.id.toUpperCase(), row])
    );

    return list.map((report) => {
      const row = byId.get(report.id.toUpperCase());
      if (!row) return report;
      return {
        ...report,
        affectedPersonAgeGroup: row.affectedPersonAgeGroup || undefined,
        allegedAbuserRelationship: row.allegedAbuserRelationship || undefined,
        reportingFor: row.reportingFor || undefined,
      };
    });
  } catch (error) {
    console.warn('[PublicReportService] Classification enrichment failed:', error);
    return list;
  }
}

export const PublicReportService = {
  /**
   * Fetch all published reports matching optional criteria.
   * Queries the sanitized RPC `get_public_published_reports`.
   * Returns an empty array if no reports are published in the database.
   * Exposes a recoverable error state if the service is unavailable.
   */
  async getAll(filters?: PublicReportFilters): Promise<ReportItem[]> {
    let list: ReportItem[] = [];

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Public reports service is currently unavailable.');
    } else {
      const { data, error } = await fetchWithDeduplication('rpc:get_public_published_reports', () =>
        supabase!.rpc('get_public_published_reports')
      );
      if (error) {
        console.warn('[PublicReportService.getAll] Supabase RPC error:', error);
        throw new Error(error.message || 'Failed to load public reports from server.');
      } else if (data && Array.isArray(data)) {
        list = data.map((raw: SupabasePublicReportRPC) => mapSupabasePublicReportToItem(raw));
      }
    }

    list = await enrichHarassmentClassifications(list);

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
    if (filters?.affectedPersonAgeGroup && filters.affectedPersonAgeGroup !== 'all') {
      list = list.filter((report) => report.affectedPersonAgeGroup === filters.affectedPersonAgeGroup);
    }
    if (filters?.allegedAbuserRelationship && filters.allegedAbuserRelationship !== 'all') {
      list = list.filter((report) => report.allegedAbuserRelationship === filters.allegedAbuserRelationship);
    }
    if (filters?.reportingFor && filters.reportingFor !== 'all') {
      list = list.filter((report) => report.reportingFor === filters.reportingFor);
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

    // Batch enrich published reports with evidence images (single RPC call for all visible items)
    if (isSupabaseConfigured() && supabase) {
      const reportIds = list.map((r) => r.id);
      if (reportIds.length > 0) {
        try {
          const evidenceMap = await PublicEvidenceService.getPublishedEvidenceForReports(reportIds);
          for (const report of list) {
            const reportImages =
              evidenceMap[report.id.toUpperCase()] || evidenceMap[report.id] || [];
            report.images = reportImages;
            report.media = {
              type:
                reportImages.length === 0
                  ? 'none'
                  : reportImages.length === 1
                  ? 'single'
                  : 'gallery',
              images: reportImages,
            };
            if (reportImages.length > 0) {
              report.trustIndicators.evidenceCount = reportImages.length;
            }
          }
        } catch (evErr) {
          console.warn('[PublicReportService.getAll] Evidence enrichment error:', evErr);
        }
      }
    }

    return list;
  },

  /**
   * Fetch ranked Home feed reports from the shadow-ranking RPC `get_public_home_feed`.
   * The backend returns the complete eligible report set already sorted in the shadow.
   * Responses contain NO incident coordinates, NO visitor coordinates, and NO derived distance.
   */
  async getHomeFeed(params?: HomeFeedParams): Promise<ReportItem[]> {
    let list: ReportItem[] = [];

    if (!isSupabaseConfigured() || !supabase) {
      // Reuse the fail-closed published-report path when Supabase is unavailable.
      list = await this.getAll();
    } else {
      const dedupKey = `rpc:get_public_home_feed:${params?.visitorLat ?? 'null'}:${params?.visitorLng ?? 'null'}:${params?.filter || 'all'}:${params?.district || 'all'}`;
      const { data, error } = await fetchWithDeduplication(dedupKey, () =>
        supabase!.rpc('get_public_home_feed', {
          p_visitor_lat: params?.visitorLat ?? null,
          p_visitor_lng: params?.visitorLng ?? null,
          p_filter: params?.filter || 'all',
          p_district: params?.district || 'all',
        })
      );

      if (error) {
        console.warn('[PublicReportService.getHomeFeed] RPC error:', error);
        throw error;
      } else if (data && Array.isArray(data)) {
        list = data.map((raw: SupabasePublicReportRPC) => mapSupabasePublicReportToItem(raw));
      }
    }

    list = await enrichHarassmentClassifications(list);

    // Batch enrich published reports with evidence images (single RPC call for all visible items)
    if (isSupabaseConfigured() && supabase) {
      const reportIds = list.map((r) => r.id);
      if (reportIds.length > 0) {
        try {
          const evidenceMap = await PublicEvidenceService.getPublishedEvidenceForReports(reportIds);
          for (const report of list) {
            const reportImages =
              evidenceMap[report.id.toUpperCase()] || evidenceMap[report.id] || [];
            report.images = reportImages;
            report.media = {
              type:
                reportImages.length === 0
                  ? 'none'
                  : reportImages.length === 1
                  ? 'single'
                  : 'gallery',
              images: reportImages,
            };
            if (reportImages.length > 0) {
              report.trustIndicators.evidenceCount = reportImages.length;
            }
          }
        } catch (evErr) {
          console.warn('[PublicReportService.getHomeFeed] Evidence enrichment error:', evErr);
        }
      }
    }

    return list;
  },

  /**
   * Fetch a single published report and any published subject responses by ID.
   * Queries the sanitized RPC `get_public_published_report`.
   */
  async getById(
    id: string
  ): Promise<{
    report: ReportItem;
    responses: PublicPublishedResponse[];
    responseLoadError: boolean;
  } | null> {
    const cleanId = id.trim().toUpperCase();

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Public reports service is currently unavailable.');
    }

    const { data, error } = await fetchWithDeduplication(`rpc:get_public_published_report:${cleanId}`, () =>
      supabase!.rpc('get_public_published_report', {
        p_report_id: cleanId,
      })
    );

    if (error) {
      console.warn('[PublicReportService.getById] Supabase RPC error:', error);
      throw new Error(error.message || 'Failed to fetch report from server.');
    }

    if (data) {
      let report = mapSupabasePublicReportToItem(data as SupabasePublicReportRPC);
      report = (await enrichHarassmentClassifications([report]))[0] || report;

      try {
        const evidenceMap = await PublicEvidenceService.getPublishedEvidenceForReports([cleanId]);
        const reportImages =
          evidenceMap[cleanId] || evidenceMap[report.id.toUpperCase()] || evidenceMap[report.id] || [];
        report.images = reportImages;
        report.media = {
          type:
            reportImages.length === 0
              ? 'none'
              : reportImages.length === 1
              ? 'single'
              : 'gallery',
          images: reportImages,
        };
        if (reportImages.length > 0) {
          report.trustIndicators.evidenceCount = reportImages.length;
        }
      } catch (evErr) {
        console.warn('[PublicReportService.getById] Evidence enrichment error:', evErr);
      }

      let responses: PublicPublishedResponse[] = [];
      let responseLoadError = false;

      try {
        responses = await PublicResponseService.getPublishedForReport(cleanId);
      } catch (respErr) {
        console.warn('[PublicReportService.getById] Published responses load error:', respErr);
        responseLoadError = true;
        responses = [];
      }

      return {
        report,
        responses,
        responseLoadError,
      };
    }

    return null;
  },

  /**
   * Fetch published reports filtered by section/segment.
   * If visitor coordinates are provided, uses the shadow-ranked backend path.
   * Otherwise preserves default chronological ordering.
   */
  async getBySegment(
    segment: SectionKey,
    filters?: Omit<PublicReportFilters, 'segment'>
  ): Promise<ReportItem[]> {
    if (filters?.visitorLat != null && filters?.visitorLng != null) {
      const ranked = await this.getHomeFeed({
        visitorLat: filters.visitorLat,
        visitorLng: filters.visitorLng,
        district: filters.district || 'all',
      });
      let result = ranked.filter((r) => r.segment === segment);
      if (filters.subcategory && filters.subcategory !== 'all') {
        result = result.filter((r) => r.subcategoryId === filters.subcategory);
      }
      if (filters.affectedPersonAgeGroup && filters.affectedPersonAgeGroup !== 'all') {
        result = result.filter((r) => r.affectedPersonAgeGroup === filters.affectedPersonAgeGroup);
      }
      if (filters.allegedAbuserRelationship && filters.allegedAbuserRelationship !== 'all') {
        result = result.filter((r) => r.allegedAbuserRelationship === filters.allegedAbuserRelationship);
      }
      if (filters.reportingFor && filters.reportingFor !== 'all') {
        result = result.filter((r) => r.reportingFor === filters.reportingFor);
      }
      if (filters.limit && filters.limit > 0) {
        result = result.slice(0, filters.limit);
      }
      return result;
    }
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
