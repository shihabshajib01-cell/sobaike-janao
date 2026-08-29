import { PublicReportService, PublicReportFilters } from './publicReportService';
import { ReportItem } from '../types/report';
import { SectionKey } from '../theme/tokens';

/**
 * @deprecated Use PublicReportService directly.
 * This adapter delegates all calls to the backend SQLite service.
 */
export const PublicReportRepository = {
  async getAll(filters?: PublicReportFilters): Promise<ReportItem[]> {
    return PublicReportService.getAll(filters);
  },

  async getById(id: string): Promise<ReportItem | null> {
    const res = await PublicReportService.getById(id);
    return res ? res.report : null;
  },

  async getBySegment(segment: SectionKey): Promise<ReportItem[]> {
    return PublicReportService.getBySegment(segment);
  },

  async getByDistrict(districtName: string): Promise<ReportItem[]> {
    return PublicReportService.getByLocation(districtName);
  },

  async getBySubject(subjectName: string): Promise<ReportItem[]> {
    return PublicReportService.getBySubject(subjectName);
  },

  async search(query: string, segment?: SectionKey | 'all', district?: string): Promise<ReportItem[]> {
    return PublicReportService.search(query, { segment, district });
  },
};
