import { ReportStatus } from '../../src/services/types';
import { SectionKey } from '../../src/theme/tokens';

export interface ValidationError {
  field?: string;
  code: string;
  message: string;
}

export function validateReportSubmission(body: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body) {
    return { isValid: false, errors: [{ code: 'MISSING_BODY', message: 'Request payload is required.' }] };
  }

  const validSegments: SectionKey[] = ['harassment', 'rickshaw', 'extortion'];
  if (!body.segment || !validSegments.includes(body.segment)) {
    errors.push({ field: 'segment', code: 'INVALID_SEGMENT', message: 'Valid segment is required.' });
  }

  if (!body.subcategoryId || typeof body.subcategoryId !== 'string') {
    errors.push({ field: 'subcategoryId', code: 'REQUIRED_FIELD', message: 'Subcategory is required.' });
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
    errors.push({ field: 'title', code: 'REQUIRED_FIELD', message: 'Title is required (at least 3 characters).' });
  }

  if (!body.description || typeof body.description !== 'string' || body.description.trim().length < 10) {
    errors.push({ field: 'description', code: 'REQUIRED_FIELD', message: 'Description is required (at least 10 characters).' });
  }

  if (!body.incidentDate || typeof body.incidentDate !== 'string') {
    errors.push({ field: 'incidentDate', code: 'REQUIRED_FIELD', message: 'Incident date is required.' });
  }

  if (!body.location || typeof body.location !== 'object') {
    errors.push({ field: 'location', code: 'REQUIRED_FIELD', message: 'Structured location is required.' });
  } else {
    if (!body.location.district || typeof body.location.district !== 'string') {
      errors.push({ field: 'location.district', code: 'REQUIRED_FIELD', message: 'Location district is required.' });
    }
  }

  const validPrivacyChoices = ['anonymous', 'admin_only', 'public_identity'];
  if (!body.privacyChoice || !validPrivacyChoices.includes(body.privacyChoice)) {
    errors.push({ field: 'privacyChoice', code: 'INVALID_PRIVACY', message: 'Valid reporter privacy choice is required.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLifecycleTransition(
  from: ReportStatus,
  to: ReportStatus,
  hasReporterResponse = false
): { allowed: boolean; code?: string; message?: string } {
  if (from === to) {
    return { allowed: true };
  }

  switch (from) {
    case 'submitted':
      if (to === 'under_review' || to === 'more_info_needed' || to === 'not_published') {
        return { allowed: true };
      }
      return {
        allowed: false,
        code: 'INVALID_TRANSITION',
        message: `Cannot transition directly from 'submitted' to '${to}'. Review must be started first.`,
      };

    case 'under_review':
      if (to === 'approved' || to === 'more_info_needed' || to === 'not_published') {
        return { allowed: true };
      }
      return {
        allowed: false,
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from 'under_review' to '${to}'. Must be approved before publishing.`,
      };

    case 'more_info_needed':
      if (to === 'not_published') {
        return { allowed: true };
      }
      if (to === 'under_review') {
        if (!hasReporterResponse) {
          return {
            allowed: false,
            code: 'RESPONSE_REQUIRED',
            message: 'Cannot resume review until the reporter provides the requested clarification.',
          };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from 'more_info_needed' directly to '${to}'.`,
      };

    case 'approved':
      if (to === 'published' || to === 'under_review' || to === 'not_published') {
        return { allowed: true };
      }
      return {
        allowed: false,
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from 'approved' to '${to}'.`,
      };

    case 'published':
      if (to === 'not_published') {
        return { allowed: true };
      }
      return {
        allowed: false,
        code: 'ALREADY_PUBLISHED',
        message: `Report is already published. Use unpublish if modification is required.`,
      };

    case 'not_published':
      if (to === 'under_review') {
        return { allowed: true }; // Reopen
      }
      return {
        allowed: false,
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from 'not_published' to '${to}'. Reopen review first.`,
      };

    default:
      return {
        allowed: false,
        code: 'UNKNOWN_STATUS',
        message: 'Invalid report status.',
      };
  }
}

export function validatePublicVersionData(pv: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!pv || typeof pv !== 'object') {
    return { isValid: false, errors: [{ code: 'MISSING_DATA', message: 'Public Version data is required.' }] };
  }

  if (!pv.titleBn || typeof pv.titleBn !== 'string' || !pv.titleBn.trim()) {
    errors.push({ field: 'titleBn', code: 'REQUIRED_FIELD', message: 'Public Bengali title is required.' });
  }

  if (!pv.titleEn || typeof pv.titleEn !== 'string' || !pv.titleEn.trim()) {
    errors.push({ field: 'titleEn', code: 'REQUIRED_FIELD', message: 'Public English title is required.' });
  }

  if (!pv.fullDescriptionBn || typeof pv.fullDescriptionBn !== 'string' || !pv.fullDescriptionBn.trim()) {
    errors.push({ field: 'fullDescriptionBn', code: 'REQUIRED_FIELD', message: 'Public Bengali description is required.' });
  }

  if (!pv.fullDescriptionEn || typeof pv.fullDescriptionEn !== 'string' || !pv.fullDescriptionEn.trim()) {
    errors.push({ field: 'fullDescriptionEn', code: 'REQUIRED_FIELD', message: 'Public English description is required.' });
  }

  const locPrivacy = pv.sensitiveSettings?.locationPrivacy || pv.locationVisibility || 'hidden';

  if (locPrivacy === 'public') {
    if (!pv.districtBn || !pv.districtEn) {
      errors.push({ field: 'district', code: 'REQUIRED_FIELD', message: 'Public district information is required when location is public.' });
    }
    if (!pv.locationBn || !pv.locationEn) {
      errors.push({ field: 'location', code: 'REQUIRED_FIELD', message: 'Public location text is required when location is public.' });
    }
  } else if (locPrivacy === 'generalized') {
    if (!pv.districtBn || !pv.districtEn) {
      errors.push({ field: 'district', code: 'REQUIRED_FIELD', message: 'District is required for generalized public location.' });
    }
  }
  // When locPrivacy === 'hidden', districtBn and districtEn are NOT required.

  return {
    isValid: errors.length === 0,
    errors,
  };
}
