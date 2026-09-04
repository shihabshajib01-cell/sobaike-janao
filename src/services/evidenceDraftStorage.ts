/**
 * Browser-side IndexedDB persistent storage for temporary complaint evidence.
 * Preserves pending compressed image blobs across browser refreshes, modal close/reopen,
 * and network interruptions, ensuring evidence is never silently dropped after partial submission failure.
 */

import { AttachedImagePreview } from '../components/media/ImageAttachmentPicker';

const DB_NAME = 'sobaike_evidence_store_v1';
const STORE_NAME = 'pending_evidence';
const DB_VERSION = 1;

interface StoredEvidenceRecord {
  id: string; // Compound primary key: `${clientSubmissionId}::${imageId}`
  clientSubmissionId: string;
  imageId: string;
  blob: Blob;
  fileName: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  mimeType: string;
  order: number;
  createdAt: number;
}

function isIndexedDbSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbSupported()) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by_submission_id', 'clientSubmissionId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    } catch (err) {
      reject(err);
    }
  });
}

export const EvidenceDraftStorage = {
  /**
   * Persists pending evidence images for a specific complaint submission ID.
   */
  async savePendingEvidence(
    clientSubmissionId: string,
    items: AttachedImagePreview[]
  ): Promise<void> {
    if (!clientSubmissionId || !isIndexedDbSupported()) return;

    try {
      const db = await openDb();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('by_submission_id');

        // First remove any existing stored items for this clientSubmissionId that are no longer in items
        const currentItemIds = new Set(items.map((it) => it.id));
        const range = IDBKeyRange.only(clientSubmissionId);
        const cursorRequest = index.openCursor(range);

        cursorRequest.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const record = cursor.value as StoredEvidenceRecord;
            if (!currentItemIds.has(record.imageId)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            // After cleanup, save all current items
            items.forEach((item, order) => {
              if (item.isCompressing || item.compressionError) return;

              const record: StoredEvidenceRecord = {
                id: `${clientSubmissionId}::${item.id}`,
                clientSubmissionId,
                imageId: item.id,
                blob: item.file,
                fileName: item.file.name,
                originalName: item.originalName,
                originalSize: item.originalSize,
                compressedSize: item.compressedSize || item.file.size,
                width: item.width || 0,
                height: item.height || 0,
                mimeType: item.file.type || 'image/webp',
                order,
                createdAt: Date.now(),
              };

              store.put(record);
            });
          }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('Transaction error'));
      });
    } catch (err) {
      console.warn('EvidenceDraftStorage: Failed to persist evidence in IndexedDB:', err);
    }
  },

  /**
   * Retrieves and reconstructs pending evidence images for a specific submission ID.
   */
  async getPendingEvidence(clientSubmissionId: string): Promise<AttachedImagePreview[]> {
    if (!clientSubmissionId || !isIndexedDbSupported()) return [];

    try {
      const db = await openDb();
      return new Promise<AttachedImagePreview[]>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('by_submission_id');
        const range = IDBKeyRange.only(clientSubmissionId);
        const request = index.getAll(range);

        request.onsuccess = () => {
          const records: StoredEvidenceRecord[] = request.result || [];
          // Sort records by preserved order
          records.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          const restored: AttachedImagePreview[] = records.map((rec) => {
            const file = new File([rec.blob], rec.fileName || rec.originalName, {
              type: rec.mimeType || 'image/webp',
            });
            const previewUrl = URL.createObjectURL(file);

            return {
              file,
              previewUrl,
              id: rec.imageId,
              originalName: rec.originalName,
              originalSize: rec.originalSize,
              compressedSize: rec.compressedSize,
              width: rec.width,
              height: rec.height,
              isCompressing: false,
              compressionError: null,
            };
          });

          resolve(restored);
        };

        request.onerror = () => reject(request.error || new Error('Failed to retrieve evidence'));
      });
    } catch (err) {
      console.warn('EvidenceDraftStorage: Failed to retrieve evidence from IndexedDB:', err);
      return [];
    }
  },

  /**
   * Deletes all stored evidence records for a given submission ID.
   */
  async deletePendingEvidence(clientSubmissionId: string): Promise<void> {
    if (!clientSubmissionId || !isIndexedDbSupported()) return;

    try {
      const db = await openDb();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('by_submission_id');
        const range = IDBKeyRange.only(clientSubmissionId);
        const cursorRequest = index.openCursor(range);

        cursorRequest.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('Delete transaction error'));
      });
    } catch (err) {
      console.warn('EvidenceDraftStorage: Failed to delete evidence from IndexedDB:', err);
    }
  },

  /**
   * Wipes all stored temporary evidence across all drafts.
   */
  async clearAllEvidence(): Promise<void> {
    if (!isIndexedDbSupported()) return;

    try {
      const db = await openDb();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('EvidenceDraftStorage: Failed to clear IndexedDB:', err);
    }
  },

  /**
   * Safely revokes in-memory object URLs to prevent browser memory leaks.
   */
  revokePreviewUrls(images: AttachedImagePreview[]): void {
    if (!images || !Array.isArray(images)) return;
    images.forEach((img) => {
      if (img.previewUrl && typeof img.previewUrl === 'string' && img.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(img.previewUrl);
        } catch {
          // ignore
        }
      }
    });
  },
};
