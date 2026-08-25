import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import type { StageTemplate } from '../types';
import { normalizeProcedureKey } from './treatmentBilling';

// A clinic's reusable stage breakdown for a kind of procedure — "Kanal davolash"
// is normally three visits, so the doctor shouldn't retype that split for every
// patient. Follows the serviceMaterials pattern exactly (see materialDeduction.ts):
// client-side Firestore, this module owns the path and the write shape, reads are
// a live onSnapshot in the component.
//
// Keyed by procedure NAME rather than serviceId, because the treatment picker
// uses the hardcoded STANDARD_SERVICES_CATALOG and plan items therefore carry no
// serviceId — a serviceId-keyed template would be unreachable from the very UI
// that needs it. Doctors also cannot write Service records (POST /api/services is
// director-only), so hanging templates off Service would lock them out.
//
// A forged template cannot move money: it only pre-fills a split, and the
// resulting per-stage amounts are re-validated server-side against the charge's
// listPrice before they are accepted.

export const stageTemplatesPath = (clinicId: string) => `clinics/${clinicId}/stageTemplates`;

export { normalizeProcedureKey };

/** Even shares, as a starting point for a brand-new template. */
export function evenShares(count: number): { name: string; sharePercent: number }[] {
  const n = Math.max(1, Math.floor(count));
  const base = Math.floor(100 / n);
  const shares = Array.from({ length: n }, () => base);
  let remainder = 100 - base * n;
  for (let i = 0; i < shares.length && remainder > 0; i++, remainder--) shares[i] += 1;
  return shares.map((sharePercent, i) => ({ name: `${i + 1}-bosqich`, sharePercent }));
}

export async function saveStageTemplate(
  clinicId: string,
  label: string,
  stages: { name: string; sharePercent: number }[],
  serviceId?: string,
): Promise<StageTemplate | null> {
  const procedureKey = normalizeProcedureKey(label);
  if (!clinicId || !procedureKey) return null;
  const clean = stages
    .filter(s => s && Number(s.sharePercent) > 0)
    .map((s, i) => ({ name: s.name?.trim() || `${i + 1}-bosqich`, sharePercent: Number(s.sharePercent) }));
  if (clean.length === 0) return null;

  const template: StageTemplate = {
    procedureKey,
    label,
    serviceId,
    stages: clean,
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, stageTemplatesPath(clinicId), procedureKey), template, { merge: true });
    return template;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, stageTemplatesPath(clinicId));
    return null;
  }
}

export async function deleteStageTemplate(clinicId: string, procedureKey: string): Promise<void> {
  try {
    await deleteDoc(doc(db, stageTemplatesPath(clinicId), procedureKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, stageTemplatesPath(clinicId));
  }
}

/** The template matching a procedure name, if the clinic has defined one. */
export function findTemplate(
  templates: StageTemplate[],
  procedureName: string,
): StageTemplate | undefined {
  const key = normalizeProcedureKey(procedureName);
  if (!key) return undefined;
  return templates.find(t => t.procedureKey === key);
}
