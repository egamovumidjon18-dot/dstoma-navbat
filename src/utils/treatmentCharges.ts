// Client-side access to the treatment charge ledger.
//
// Kept separate from treatmentBilling.ts on purpose: that module must stay pure
// (types only) so server.ts can import it, whereas this one talks to the API.

import { getApiUrl } from '../services/api';
import type { TreatmentCharge, TreatmentStage } from '../types';

const authHeaders = (staffToken?: string | null): Record<string, string> =>
  staffToken ? { Authorization: `Bearer ${staffToken}` } : {};

export async function fetchTreatmentCharges(
  params: { clinicId?: string; patientId?: string; doctorId?: string },
  staffToken?: string | null,
): Promise<TreatmentCharge[]> {
  if (!staffToken) return [];
  const query = new URLSearchParams();
  if (params.clinicId) query.set('clinicId', params.clinicId);
  if (params.patientId) query.set('patientId', params.patientId);
  if (params.doctorId) query.set('doctorId', params.doctorId);
  try {
    const res = await fetch(`${getApiUrl()}/api/treatment-charges?${query}`, {
      headers: authHeaders(staffToken),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export interface SaveChargeInput {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  patientName?: string;
  treatmentName?: string;
  toothId?: string;
  serviceId?: string;
  listPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  discountReason?: string;
  stages?: TreatmentStage[];
  status?: 'open' | 'void';
}

/**
 * Create or update a treatment's money record.
 *
 * Returns null on failure rather than throwing: the clinical record (the
 * Firestore plan item) is always written first and is what the doctor actually
 * sees, so a billing hiccup must never lose the treatment itself. Callers
 * surface the failure so it can be retried.
 */
export async function saveTreatmentCharge(
  input: SaveChargeInput,
  staffToken?: string | null,
): Promise<TreatmentCharge | null> {
  if (!staffToken || !input.clinicId || !input.doctorId || !input.patientId) return null;
  try {
    const res = await fetch(`${getApiUrl()}/api/treatment-charges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(staffToken) },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function patchTreatmentCharge(
  id: string,
  patch: Partial<SaveChargeInput>,
  staffToken?: string | null,
): Promise<TreatmentCharge | null> {
  if (!staffToken) return null;
  try {
    const res = await fetch(`${getApiUrl()}/api/treatment-charges/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(staffToken) },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Mark a charge as no longer owed, when its treatment is deleted or cancelled. */
export async function voidTreatmentCharge(id: string, staffToken?: string | null): Promise<void> {
  await patchTreatmentCharge(id, { status: 'void' }, staffToken);
}
