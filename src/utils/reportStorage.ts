import { DraftReport } from '../services/types';
import {
  DraftRepository,
  INITIAL_DRAFT,
} from '../services/draftRepository';

export type { DraftReport };
export { INITIAL_DRAFT };

/**
 * Draft-only storage utility.
 * In accordance with Phase 8 architecture, localStorage is strictly permitted ONLY
 * for unsaved client-side report drafts and harmless UI preferences.
 * All submitted reports, status checks, responses, and moderation states reside
 * strictly in the backend SQLite database.
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
