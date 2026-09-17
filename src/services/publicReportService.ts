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

export interface PublicEngagementCounts {
  viewCount: number;
  shareCount: number;
}

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

async function enrichEvidence(list: ReportItem[], logScope: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  const reportIds = list.map((r) => r.id);
  if (reportIds.length === 0) return;

  try {
    const evidenceMap = await PublicEvidenceService.getPublishedEvidenceForReports(reportIds);
    for (const report of list) {
      const reportImages = evidenceMap[report.id.toUpperCase()] || evidenceMap[report.id] || [];
      report.images = reportImages;
      report.media = {
        type: reportImages.length === 0 ? 'none' : reportImages.length === 1 ? 'single' : 'gallery',
        images: reportImages,
      };
      if (reportImages.length > 0) {
        report.trustIndicators.evidenceCount = reportImages.length;
      }
    }
  } catch (error) {
    console.warn(`[PublicReportService.${logScope}] Evidence enrichment error:`, error);
  }
}

function normalizeEngagementCounts(data: unknown): PublicEngagementCounts | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as { viewCount?: unknown; shareCount?: unknown };
  const viewCount = Number(raw.viewCount);
  const shareCount = Number(raw.shareCount);
  if (!Number.isFinite(viewCount) || !Number.isFinite(shareCount)) return null;
  return {
    viewCount: Math.max(0, viewCount),
    shareCount: Math.max(0, shareCount),
  };
}

export const PublicReportService = {
  async getAll(filters?: PublicReportFilters): Promise<ReportItem[]> {
    let list: ReportItem[] = [];

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Public reports service is currently unavailable.');
    }

    const { data, error } = await fetchWithDeduplication('rpc:get_public_published_reports_with_engagement', () =>
      supabase!.rpc('get_public_published_reports_with_engagement')
    );
    if (error) {
      console.warn('[PublicReportService.getAll] Supabase RPC error:', error);
      throw new Error(error.message || 'Failed to load public reports from server.');
    }
    if (data && Array.isArray(data)) {
      list = data.map((raw: SupabasePublicReportRPC) => mapSupabasePublicReportToItem(raw));
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

    await enrichEvidence(list, 'getAll');
    return list;
  },

  async getHomeFeed(params?: HomeFeedParams): Promise<ReportItem[]> {
    let list: ReportItem[] = [];

    if (!isSupabaseConfigured() || !supabase) {
      list = await this.getAll();
    } else {
      const dedupKey = `rpc:get_public_home_feed_with_engagement:${params?.visitorLat ?? 'null'}:${params?.visitorLng ?? 'null'}:${params?.filter || 'all'}:${params?.district || 'all'}`;
      const { data, error } = await fetchWithDeduplication(dedupKey, () =>
        supabase!.rpc('get_public_home_feed_with_engagement', {
          p_visitor_lat: params?.visitorLat ?? null,
          p_visitor_lng: params?.visitorLng ?? null,
          p_filter: params?.filter || 'all',
          p_district: params?.district || 'all',
        })
      );

      if (error) {
        console.warn('[PublicReportService.getHomeFeed] RPC error:', error);
        throw error;
      }
      if (data && Array.isArray(data)) {
        list = data.map((raw: SupabasePublicReportRPC) => mapSupabasePublicReportToItem(raw));
      }
    }

    list = await enrichHarassmentClassifications(list);
    await enrichEvidence(list, 'getHomeFeed');
    return list;
  },

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

    const { data, error } = await fetchWithDeduplication(`rpc:get_public_published_report_with_engagement:${cleanId}`, () =>
      supabase!.rpc('get_public_published_report_with_engagement', {
        p_report_id: cleanId,
      })
    );

    if (error) {
      console.warn('[PublicReportService.getById] Supabase RPC error:', error);
      throw new Error(error.message || 'Failed to fetch report from server.');
    }

    if (!data) return null;

    let report = mapSupabasePublicReportToItem(data as SupabasePublicReportRPC);
    report = (await enrichHarassmentClassifications([report]))[0] || report;
    await enrichEvidence([report], 'getById');

    // Phase 1 definition: each successful published detail open is a view.
    // Engagement failure must never block the report detail journey.
    try {
      const counts = await this.trackView(cleanId);
      if (counts) {
        report.viewCount = counts.viewCount;
        report.shareCount = counts.shareCount;
      }
    } catch (engagementError) {
      console.warn('[PublicReportService.getById] View tracking failed:', engagementError);
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
  },

  async trackView(id: string): Promise<PublicEngagementCounts | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return null;

    const { data, error } = await supabase.rpc('track_public_report_view', {
      p_report_id: cleanId,
    });
    if (error) throw error;
    return normalizeEngagementCounts(data);
  },

  async trackShare(id: string): Promise<PublicEngagementCounts | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return null;

    const { data, error } = await supabase.rpc('track_public_report_share', {
      p_report_id: cleanId,
    });
    if (error) throw error;
    return normalizeEngagementCounts(data);
  },

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

  async getByLocation(locationQuery: string): Promise<ReportItem[]> {
    const all = await this.getAll();
    const clean = locationQuery.toLowerCase().trim();
    return all.filter((r) => {
      const distEn = (r.districtEn || '').toLowerCase();
      const distBn = (r.districtBn || '').toLowerCase();
      const locEn = (r.locationEn || '').toLowerCase();
      const locBn = (r.locationBn || '').toLowerCase();

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

  async getBySubject(subjectName: string): Promise<ReportItem[]> {
    const all = await this.getAll();
    const clean = subjectName.toLowerCase().trim();
    return all.filter((r) => {
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

  async getRelatedReports(reportId: string, relatedIds: string[] = []): Promise<ReportItem[]> {
    if (!relatedIds || relatedIds.length === 0) {
      return [];
    }
    const all = await this.getAll();
    return all.filter((r) => r.id !== reportId && relatedIds.includes(r.id));
  },
};
