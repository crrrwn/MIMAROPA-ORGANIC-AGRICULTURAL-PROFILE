import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'systemLogs';

/**
 * Log a system action to Firestore. Call this after login, register, form create/update/delete, etc.
 * @param {Object} params
 * @param {string} params.action - e.g. 'login', 'logout', 'register', 'individual_create', 'individual_update', 'fca_create', 'fca_update', 'form_delete'
 * @param {string} [params.userId] - Firebase Auth UID
 * @param {string} [params.userEmail] - User email
 * @param {string} [params.role] - 'admin' | 'encoder'
 * @param {string} [params.province] - Province (for encoder)
 * @param {Object} [params.details] - Extra info (e.g. form type, document id)
 */
export async function logAction({ action, userId = null, userEmail = null, role = null, province = null, details = null }) {
  try {
    await addDoc(collection(db, COLLECTION), {
      action,
      userId: userId ?? null,
      userEmail: userEmail ?? null,
      role: role ?? null,
      province: province ?? null,
      details: details ?? null,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('[systemLogs] Failed to write log:', err);
  }
}
