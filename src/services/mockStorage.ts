import { SubmittedReport } from './types';
import { PublicPublishedResponse } from '../types/report';

const MOCK_REPORTS_STORAGE_KEY = 'sobaike-janao-mock-reports';
const MOCK_RESPONSES_STORAGE_KEY = 'sobaike-janao-mock-responses';

// In-memory fallbacks
let inMemoryReports: SubmittedReport[] = [];
let inMemoryResponses: Record<string, PublicPublishedResponse[]> = {};

export const mockStorage = {
  getMockReports(): SubmittedReport[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(MOCK_REPORTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch {
      // Fall through to in-memory
    }
    return inMemoryReports;
  },

  addMockReport(report: SubmittedReport): void {
    inMemoryReports = [report, ...inMemoryReports];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const existing = this.getMockReports();
        const updated = [report, ...existing.filter((r) => r.id !== report.id)];
        window.localStorage.setItem(MOCK_REPORTS_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      // Ignore localStorage errors
    }
  },

  getMockResponses(reportId: string): PublicPublishedResponse[] {
    const cleanId = reportId.trim().toUpperCase();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(MOCK_RESPONSES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed[cleanId])) {
            return parsed[cleanId];
          }
        }
      }
    } catch {
      // Fall through to in-memory
    }
    return inMemoryResponses[cleanId] || [];
  },

  addMockResponse(reportId: string, response: PublicPublishedResponse): void {
    const cleanId = reportId.trim().toUpperCase();
    const existingMem = inMemoryResponses[cleanId] || [];
    inMemoryResponses[cleanId] = [response, ...existingMem];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(MOCK_RESPONSES_STORAGE_KEY);
        const map: Record<string, PublicPublishedResponse[]> = stored ? JSON.parse(stored) : {};
        const existing = Array.isArray(map[cleanId]) ? map[cleanId] : [];
        map[cleanId] = [response, ...existing];
        window.localStorage.setItem(MOCK_RESPONSES_STORAGE_KEY, JSON.stringify(map));
      }
    } catch {
      // Ignore localStorage errors
    }
  },
};
