import { ReportItem } from '../types/report';
import { HARASSMENT_REPORTS } from './mockReports/harassmentReports';
import { RICKSHAW_REPORTS } from './mockReports/rickshawReports';
import { EXTORTION_REPORTS } from './mockReports/extortionReports';

/**
 * 35 Standardized Citizen Reports with Full Post Media Combination System Support:
 * - 40% (14 posts) Text-Only (media: { type: 'none', images: [] })
 * - 40% (14 posts) Single Image (media: { type: 'single', images: [img] })
 * - 20% (7 posts) Multi-Image Gallery (media: { type: 'gallery', images: [img1, img2, ...] } with 2, 3, 4, 5, 6 images)
 */
export const MOCK_REPORTS: ReportItem[] = [
  ...HARASSMENT_REPORTS,
  ...RICKSHAW_REPORTS,
  ...EXTORTION_REPORTS,
];
