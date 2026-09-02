import { DraftReport } from '../services/types';
import {
  DraftRepository,
  INITIAL_DRAFT,
} from '../services/draftRepository';

export type { DraftReport };
export { INITIAL_DRAFT };

/**
 * Draft-only storage utility.
 * LocalStorage is used ONLY for unsaved client-side report drafts and harmless UI preferences.
 * Submitted reports and complaints are transmitted directly via Supabase.
 */
export const getDraft = (): DraftReport | null => {
  return DraftRepository.getDraft();
};

export const saveDraft = (draft: DraftReport): void => {
  DraftRepository.saveDraft(draft);
};

export const clearDraft = (): void => {
  DraftRepository.clearDraft();
};
