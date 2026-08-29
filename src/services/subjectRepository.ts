import { PublicReportService } from './publicReportService';

export interface SubjectEntity {
  id: string;
  name: string;
  nameBn: string;
  nameEn: string;
  type: 'individual' | 'business' | 'group' | 'location';
  organization?: string;
  districts: string[];
  reportCount: number;
  reportIds: string[];
  responseCount: number;
  responseStatus: 'no_response' | 'response_published';
}

export const SubjectRepository = {
  /**
   * Aggregates subject entities dynamically from backend published reports.
   */
  async getAll(): Promise<SubjectEntity[]> {
    try {
      const reports = await PublicReportService.getAll();
      const subjectMap = new Map<string, SubjectEntity>();

      reports.forEach((rep) => {
        let rawSubject = rep.reportedSubject || rep.reportedSubjectEn || rep.reportedSubjectBn;
        if (!rawSubject && rep.organization) {
          rawSubject = rep.organization;
        }
        if (!rawSubject) return;

        // Never group or aggregate withheld entities
        const lower = rawSubject.toLowerCase().trim();
        if (
          lower.includes('পরিচয় গোপন') ||
          lower.includes('subject withheld') ||
          lower.includes('withheld') ||
          rep.reportedSubjectBn === 'পরিচয় গোপন' ||
          rep.reportedSubjectEn === 'Subject withheld'
        ) {
          return;
        }

        const normKey = rawSubject.trim().toLowerCase();
        const nameBn = rep.reportedSubjectBn || rep.reportedSubject || rawSubject;
        const nameEn = rep.reportedSubjectEn || rep.reportedSubject || rawSubject;

        const existing = subjectMap.get(normKey);
        if (existing) {
          existing.reportCount += 1;
          if (!existing.reportIds.includes(rep.id)) existing.reportIds.push(rep.id);
          if (rep.districtEn && !existing.districts.includes(rep.districtEn)) {
            existing.districts.push(rep.districtEn);
          }
        } else {
          const id = normKey.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
          const entity: SubjectEntity = {
            id: id || `sub-${Date.now()}`,
            name: nameEn,
            nameBn,
            nameEn,
            type: rep.subjectType || 'individual',
            organization: rep.organization,
            districts: rep.districtEn ? [rep.districtEn] : [],
            reportCount: 1,
            reportIds: [rep.id],
            responseCount: rep.response ? 1 : 0,
            responseStatus: rep.response ? 'response_published' : 'no_response',
          };
          subjectMap.set(normKey, entity);
        }
      });

      return Array.from(subjectMap.values());
    } catch (err) {
      console.error('[SubjectRepository.getAll error]', err);
      return [];
    }
  },

  async getById(id: string): Promise<SubjectEntity | null> {
    const all = await this.getAll();
    const clean = id.toLowerCase().trim();
    return all.find((s) => s.id === clean || s.nameEn.toLowerCase() === clean) || null;
  },
};
