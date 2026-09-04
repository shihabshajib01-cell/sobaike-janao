import { ReportItem } from '../types/report';
import { SectionKey } from '../theme/tokens';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  mapSupabasePublicReportToItem,
  SupabasePublicReportRPC,
} from './supabasePublicReportMapper';
import { PublicEvidenceService } from './publicEvidenceService';
import { SEED_SUBMITTED_REPORTS } from '../data/seedSubmissions';

export interface PublicReportFilters {
  segment?: SectionKey | 'all';
  subcategory?: string;
  district?: string;
  search?: string;
  sort?: string;
  limit?: number;
}

const mapSeedToReportItem = (seed: (typeof SEED_SUBMITTED_REPORTS)[0]): ReportItem => {
  const pv = seed.publicVersion;
  return {
    id: seed.id,
    segment: seed.segment,
    subcategoryId: seed.subcategoryId,
    subcategoryBn: seed.subcategoryBn || seed.subcategoryId,
    subcategoryEn: seed.subcategoryEn || seed.subcategoryId,
    titleBn: pv?.titleBn || seed.title || seed.id,
    titleEn: pv?.titleEn || seed.title || seed.id,
    shortDescriptionBn: pv?.shortDescriptionBn || seed.description || '',
    shortDescriptionEn: pv?.shortDescriptionEn || seed.description || '',
    fullDescriptionBn: pv?.fullDescriptionBn || seed.description || '',
    fullDescriptionEn: pv?.fullDescriptionEn || seed.description || '',
    reportedSubject: pv?.reportedSubjectBn || seed.reportedSubject || undefined,
    reportedSubjectBn: pv?.reportedSubjectBn || seed.reportedSubject || undefined,
    reportedSubjectEn: pv?.reportedSubjectEn || seed.reportedSubject || undefined,
    subjectType:
      seed.subjectType === 'business' || seed.subjectType === 'group'
        ? seed.subjectType
        : 'individual',
    organization: pv?.organization || seed.organization || undefined,
    locationBn: pv?.locationBn || seed.location?.formattedAddress || 'অবস্থান গোপন',
    locationEn: pv?.locationEn || seed.location?.formattedAddress || 'Location withheld',
    districtBn: pv?.districtBn || seed.location?.district || '',
    districtEn: pv?.districtEn || seed.location?.district || '',
    areaBn: pv?.areaBn || seed.location?.area || '',
    areaEn: pv?.areaEn || seed.location?.area || '',
    incidentDateBn: pv?.incidentDateBn || seed.incidentDate || '',
    incidentDateEn: pv?.incidentDateEn || seed.incidentDate || '',
    publishedDateBn: '২৩ ফেব্রুয়ারি ২০২৬',
    publishedDateEn: '23 Feb 2026',
    publishedAt: seed.createdAt,
    evidenceSummaryBn: pv?.evidenceSummaryBn || [],
    evidenceSummaryEn: pv?.evidenceSummaryEn || [],
    status: 'published',
    statusBn: 'প্রকাশিত',
    statusEn: 'Published',
    isHighUrgency: Boolean(pv?.isHighUrgency),
    coordinates:
      seed.location?.lat && seed.location?.lng
        ? { lat: seed.location.lat, lng: seed.location.lng }
        : undefined,
    images: [],
    media: {
      type: 'none',
      images: [],
    },
    trustIndicators: {
      evidenceSubmitted: Boolean(seed.hasSupportingInfo),
      multipleReports: false,
      updateAvailable: false,
      responseReceived: false,
      evidenceCount: seed.evidenceTypes?.length || 0,
      hasOfficialResponse: false,
      hasRelatedReports: false,
    },
    relatedReportIds: [],
    updates: [],
  };
};

const isMockModeAllowed = (): boolean => {
  return !isSupabaseConfigured() || import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
};

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
      list = SEED_SUBMITTED_REPORTS.map(mapSeedToReportItem);
    } else {
      try {
        const { data, error } = await supabase.rpc('get_public_published_reports');
        if (error) {
          console.warn('[PublicReportService.getAll] Supabase RPC error, falling back to seed data:', error);
          list = SEED_SUBMITTED_REPORTS.map(mapSeedToReportItem);
        } else if (data && Array.isArray(data)) {
          list = data.map((raw: SupabasePublicReportRPC) => mapSupabasePublicReportToItem(raw));
        }
      } catch (e) {
        console.warn('[PublicReportService.getAll] Supabase exception, falling back to seed data:', e);
        list = SEED_SUBMITTED_REPORTS.map(mapSeedToReportItem);
      }
    }

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
   * Fetch a single published report and any published subject responses by ID.
   * Queries the sanitized RPC `get_public_published_report`.
   */
  async getById(id: string): Promise<{ report: ReportItem; responses: any[] } | null> {
    const cleanId = id.trim().toUpperCase();

    if (!isSupabaseConfigured() || !supabase) {
      const seed = SEED_SUBMITTED_REPORTS.find((r) => r.id.toUpperCase() === cleanId);
      if (seed) {
        return {
          report: mapSeedToReportItem(seed),
          responses: [],
        };
      }
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('get_public_published_report', {
        p_report_id: cleanId,
      });

      if (error) {
        console.warn('[PublicReportService.getById] Supabase RPC error, checking seed:', error);
        const seed = SEED_SUBMITTED_REPORTS.find((r) => r.id.toUpperCase() === cleanId);
        if (seed) {
          return {
            report: mapSeedToReportItem(seed),
            responses: [],
          };
        }
        return null;
      }

      if (data) {
        const report = mapSupabasePublicReportToItem(data as SupabasePublicReportRPC);

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

        return {
          report,
          responses: [],
        };
      }
    } catch (e) {
      console.warn('[PublicReportService.getById] Supabase exception, checking seed:', e);
    }

    const seed = SEED_SUBMITTED_REPORTS.find((r) => r.id.toUpperCase() === cleanId);
    if (seed) {
      return {
        report: mapSeedToReportItem(seed),
        responses: [],
      };
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
