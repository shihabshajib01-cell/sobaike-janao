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

const getSeedFallbackReports = (): ReportItem[] => {
  return SEED_SUBMITTED_REPORTS.map((r): ReportItem => {
    const pv = r.publicVersion || {
      titleBn: r.title,
      titleEn: r.title,
      shortDescriptionBn: r.description,
      shortDescriptionEn: r.description,
      fullDescriptionBn: r.description,
      fullDescriptionEn: r.description,
      reportedSubjectBn: r.reportedSubject,
      reportedSubjectEn: r.reportedSubject,
      organization: r.organization,
      locationBn: r.location?.formattedAddress || 'ঢাকা',
      locationEn: r.location?.formattedAddress || 'Dhaka',
      districtBn: 'ঢাকা',
      districtEn: 'Dhaka',
      areaBn: r.location?.area || '',
      areaEn: r.location?.area || '',
      incidentDateBn: r.incidentDate || '',
      incidentDateEn: r.incidentDate || '',
      evidenceSummaryBn: r.evidenceTypes || [],
      evidenceSummaryEn: r.evidenceTypes || [],
      isHighUrgency: false,
    };

    return {
      id: r.id,
      segment: r.segment as SectionKey,
      subcategoryId: r.subcategoryId,
      subcategoryBn: r.subcategoryBn || r.subcategoryId,
      subcategoryEn: r.subcategoryEn || r.subcategoryId,
      titleBn: pv.titleBn || r.title,
      titleEn: pv.titleEn || r.title,
      shortDescriptionBn: pv.shortDescriptionBn || r.description,
      shortDescriptionEn: pv.shortDescriptionEn || r.description,
      fullDescriptionBn: pv.fullDescriptionBn || r.description,
      fullDescriptionEn: pv.fullDescriptionEn || r.description,
      reportedSubject: pv.reportedSubjectBn || r.reportedSubject,
      reportedSubjectBn: pv.reportedSubjectBn || r.reportedSubject,
      reportedSubjectEn: pv.reportedSubjectEn || r.reportedSubject,
      subjectType: (r.subjectType === 'organization' ? 'business' : r.subjectType) as 'individual' | 'business' | 'group' | 'location' | undefined,
      organization: pv.organization || r.organization,
      locationBn: pv.locationBn || 'ঢাকা',
      locationEn: pv.locationEn || 'Dhaka',
      districtBn: pv.districtBn || 'ঢাকা',
      districtEn: pv.districtEn || 'Dhaka',
      areaBn: pv.areaBn || '',
      areaEn: pv.areaEn || '',
      incidentDateBn: pv.incidentDateBn || '২২ ফেব্রুয়ারি ২০২৬',
      incidentDateEn: pv.incidentDateEn || '22 Feb 2026',
      publishedDateBn: '২৩ ফেব্রুয়ারি ২০২৬',
      publishedDateEn: '23 Feb 2026',
      publishedAt: r.createdAt || '2026-02-23T09:30:00.000Z',
      evidenceSummaryBn: pv.evidenceSummaryBn || [],
      evidenceSummaryEn: pv.evidenceSummaryEn || [],
      status: 'published',
      statusBn: 'প্রকাশিত',
      statusEn: 'Published',
      isHighUrgency: Boolean(pv.isHighUrgency),
      coordinates:
        r.location?.lat !== undefined && r.location?.lng !== undefined
          ? { lat: r.location.lat, lng: r.location.lng }
          : undefined,
      trustIndicators: {
        evidenceSubmitted: Boolean(r.hasSupportingInfo),
        multipleReports: false,
        updateAvailable: false,
        responseReceived: false,
        evidenceCount: r.evidenceTypes?.length || 0,
        hasOfficialResponse: false,
        hasRelatedReports: false,
      },
      images: [],
      media: {
        type: 'none',
        images: [],
      },
      updates: [],
      relatedReportIds: [],
    };
  });
};

export const PublicReportService = {
  /**
   * Fetch all published reports matching optional criteria.
   * Queries the sanitized RPC `get_public_published_reports` with in-memory seed fallback.
   */
  async getAll(filters?: PublicReportFilters): Promise<ReportItem[]> {
    let list: ReportItem[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_public_published_reports');
        if (!error && Array.isArray(data) && data.length > 0) {
          list = data.map((raw: SupabasePublicReportRPC) =>
            mapSupabasePublicReportToItem(raw)
          );
        } else {
          list = getSeedFallbackReports();
        }
      } catch (err) {
        console.warn('[PublicReportService.getAll] Supabase error, using fallback seed data:', err);
        list = getSeedFallbackReports();
      }
    } else {
      list = getSeedFallbackReports();
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

    return list;
  },

  /**
   * Fetch a single published report and any published subject responses by ID.
   * Queries the sanitized RPC `get_public_published_report`.
   */
  async getById(id: string): Promise<{ report: ReportItem; responses: any[] } | null> {
    const cleanId = id.trim().toUpperCase();

    if (!isSupabaseConfigured() || !supabase) {
      const all = getSeedFallbackReports();
      const match = all.find((r) => r.id.toUpperCase() === cleanId);
      return match ? { report: match, responses: [] } : null;
    }

    try {
      const { data, error } = await supabase.rpc('get_public_published_report', {
        p_report_id: cleanId,
      });

      if (error || !data) {
        const all = getSeedFallbackReports();
        const match = all.find((r) => r.id.toUpperCase() === cleanId);
        return match ? { report: match, responses: [] } : null;
      }

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
    } catch (err) {
      console.warn('[PublicReportService.getById] Supabase RPC error, checking seed data:', err);
      const all = getSeedFallbackReports();
      const match = all.find((r) => r.id.toUpperCase() === cleanId);
      return match ? { report: match, responses: [] } : null;
    }
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
