// The single authority for every money calculation in DStoma.
//
// This module is deliberately PURE — it imports nothing but types (no firebase,
// no react). server.ts imports it too, and esbuild bundles it in, so the client
// and the server literally cannot disagree about what a patient owes.
//
// Two things are worth knowing before changing anything here:
//
// 1. Balances are DERIVED, never stored. A receipt's status can flip
//    (confirmed -> rejected) after the fact, so a cached `amountPaid` would be
//    wrong the moment that happens. savePaymentReceipt also merges without a
//    transaction while Vercel runs several instances, so a stored counter would
//    drift. Confirmed receipts are already an immutable money-in log; deriving
//    from them is both free and always right.
//
// 2. Everything degrades gracefully on legacy data. A treatment with no charge
//    doc, a charge with no stages, a receipt with no amount or no allocations —
//    each has a defined fallback below, so nothing needs backfilling for
//    per-patient numbers to be correct.

import type {
  PaymentAllocation,
  PaymentReceipt,
  StageTemplate,
  TreatmentCharge,
  TreatmentStage,
} from '../types';

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

// Every money value in the system is a whole UZS integer. Rounding happens once,
// at the percentage step — a fractional so'm must never exist downstream.
export const round0 = (n: unknown): number => Math.round(Number(n) || 0);
const clamp0 = (n: number): number => (n > 0 ? n : 0);
const clampPercent = (n: unknown): number => {
  const v = Number(n) || 0;
  if (v <= 0) return 0;
  return v >= 100 ? 100 : v;
};

// ---------------------------------------------------------------------------
// Minimal shapes
// ---------------------------------------------------------------------------

// The clinical half of a treatment, as stored in Firestore under
// patients/{id}/treatmentPlans. Declared structurally rather than imported from
// TreatmentPlan.tsx so this module stays free of component imports.
export interface PlanItemLike {
  id: string;
  toothId?: string;
  treatment?: string;
  price?: number;
  status?: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  doctorName?: string;
  createdAt?: string;
}

export type ChargeLike = Pick<
  TreatmentCharge,
  'listPrice' | 'discountPercent' | 'discountAmount'
> &
  Partial<TreatmentCharge>;

// ---------------------------------------------------------------------------
// Price
// ---------------------------------------------------------------------------

/**
 * Price actually owed for a treatment after both discount kinds.
 * Percentage applies first, then the fixed sum; the result is clamped at zero so
 * an over-generous discount can never produce a negative price (and therefore
 * never a negative debt that would silently cancel out another treatment).
 */
export function effectivePrice(charge: ChargeLike | null | undefined): number {
  if (!charge) return 0;
  const list = round0(charge.listPrice);
  const afterPercent = round0(list * (1 - clampPercent(charge.discountPercent) / 100));
  return clamp0(afterPercent - clamp0(round0(charge.discountAmount)));
}

/** How much money the discount took off, in whole UZS. */
export function discountValue(charge: ChargeLike | null | undefined): number {
  if (!charge) return 0;
  return clamp0(round0(charge.listPrice) - effectivePrice(charge));
}

// ---------------------------------------------------------------------------
// Legacy fallbacks
// ---------------------------------------------------------------------------

/**
 * A treatment that predates the charge ledger behaves exactly like an
 * undiscounted, single-stage charge at its plan price. This is what makes the
 * whole feature correct on day one with no backfill.
 */
export function virtualCharge(
  item: PlanItemLike,
  ctx?: { clinicId?: string; patientId?: string; doctorId?: string; patientName?: string },
): TreatmentCharge {
  const now = item.createdAt || new Date().toISOString();
  return {
    id: item.id,
    clinicId: ctx?.clinicId || '',
    patientId: ctx?.patientId || '',
    doctorId: ctx?.doctorId || '',
    patientName: ctx?.patientName,
    treatmentName: item.treatment,
    toothId: item.toothId,
    listPrice: round0(item.price),
    status: item.status === 'Cancelled' ? 'void' : 'open',
    createdAt: now,
    updatedAt: now,
    createdBy: '',
  };
}

/** The real charge for a plan item when one exists, else the virtual one. */
export function resolveCharge(
  item: PlanItemLike,
  charges: TreatmentCharge[] | Map<string, TreatmentCharge>,
  ctx?: Parameters<typeof virtualCharge>[1],
): TreatmentCharge {
  const found =
    charges instanceof Map ? charges.get(item.id) : charges.find((c) => c.id === item.id);
  if (!found) return virtualCharge(item, ctx);
  // A cancelled plan item voids its charge even if the charge doc wasn't updated
  // — the clinical record is authoritative about whether the work is happening.
  if (item.status === 'Cancelled' && found.status !== 'void') {
    return { ...found, status: 'void' };
  }
  return found;
}

/**
 * A charge always has at least one stage to bill against. A charge with no
 * explicit stages behaves as a single stage covering the whole effective price,
 * which keeps every downstream caller free of "does this have stages?" branches.
 */
export function normalizeStages(charge: ChargeLike): TreatmentStage[] {
  const effective = effectivePrice(charge);
  const stages = charge.stages;
  if (!stages || stages.length === 0) {
    return [
      {
        id: `${charge.id || 'item'}__single`,
        name: charge.treatmentName || '',
        order: 0,
        amount: effective,
        status: 'planned',
      },
    ];
  }
  return [...stages].sort((a, b) => (a.order || 0) - (b.order || 0));
}

// ---------------------------------------------------------------------------
// Stage splitting
// ---------------------------------------------------------------------------

/**
 * Split an effective price across a template's stages using largest-remainder,
 * so the parts always add back up to exactly the total — never total ± 1 so'm,
 * which the server-side stage-sum validation would otherwise reject.
 */
export function stagesFromTemplate(template: StageTemplate, effective: number): TreatmentStage[] {
  const defs = template?.stages?.length ? template.stages : [{ name: '', sharePercent: 100 }];
  const total = round0(effective);
  const shareSum = defs.reduce((s, d) => s + (Number(d.sharePercent) || 0), 0) || 100;

  const exact = defs.map((d) => (total * (Number(d.sharePercent) || 0)) / shareSum);
  const floors = exact.map((v) => Math.floor(v));
  let remainder = total - floors.reduce((s, v) => s + v, 0);

  // Hand the leftover so'm to the stages with the largest fractional parts.
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    floors[order[k].i] += 1;
  }

  return defs.map((d, i) => ({
    id: `stage_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
    name: d.name,
    order: i,
    amount: floors[i],
    status: 'planned' as const,
  }));
}

/** Stable key for looking up a stage template by procedure name. */
export function normalizeProcedureKey(name: string): string {
  return (name || '')
    .toLowerCase()
    // Collapse "(1 ta ildiz kanali)" style variants: those catalog entries differ
    // only in price, and templates are percentage-based, so one template serves all.
    .replace(/\([^)]*\)/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '');
}

// ---------------------------------------------------------------------------
// Allocation
// ---------------------------------------------------------------------------

export interface StageBalance {
  stageId: string;
  name: string;
  order: number;
  amount: number;
  paid: number;
  debt: number;
  status: TreatmentStage['status'];
  plannedDate?: string;
}

export interface ItemBalance {
  itemId: string;
  listPrice: number;
  discount: number;
  total: number; // effective price
  paid: number;
  debt: number;
  stages: StageBalance[];
}

export interface BillingLedger {
  items: Map<string, ItemBalance>;
  total: number; // sum of effective prices
  discount: number;
  paid: number; // confirmed money applied to treatments
  pending: number; // unconfirmed receipts — never counted as paid
  debt: number;
  credit: number; // confirmed money beyond what is owed (advance payment)
}

const isConfirmed = (r: PaymentReceipt) => r.status === 'confirmed';
// Legacy Telegram receipts carry a photo but no amount. Counting them as zero
// matches how the existing payments tab already sums them (`r.amount || 0`).
const receiptAmount = (r: PaymentReceipt) => clamp0(round0(r.amount));

/**
 * Work out what has been paid against what is owed, in one deterministic pass.
 *
 * 1. Explicit allocations from confirmed receipts are applied first, each capped
 *    at its target stage's remaining balance.
 * 2. Whatever is left over — unallocated payments, over-cap excess, and every
 *    legacy receipt that predates allocations entirely — spills FIFO across the
 *    remaining balances in treatment order. This step is why old data reads
 *    correctly from the moment this ships, with no migration.
 * 3. Anything still left once everything is settled is credit. Debt is floored
 *    at zero and never goes negative.
 * 4. Unconfirmed receipts are tracked separately and never folded into `paid`.
 */
export function allocatePayments(
  charges: ChargeLike[],
  receipts: PaymentReceipt[],
): BillingLedger {
  const billable = charges
    .filter((c) => c.status !== 'void')
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));

  const items = new Map<string, ItemBalance>();
  for (const charge of billable) {
    const stages = normalizeStages(charge);
    items.set(String(charge.id), {
      itemId: String(charge.id),
      listPrice: round0(charge.listPrice),
      discount: discountValue(charge),
      total: effectivePrice(charge),
      paid: 0,
      debt: effectivePrice(charge),
      stages: stages.map((s) => ({
        stageId: s.id,
        name: s.name,
        order: s.order,
        amount: round0(s.amount),
        paid: 0,
        debt: round0(s.amount),
        status: s.status,
        plannedDate: s.plannedDate,
      })),
    });
  }

  const applyTo = (item: ItemBalance, stage: StageBalance, amount: number): number => {
    const applied = Math.min(amount, stage.debt);
    if (applied <= 0) return 0;
    stage.paid += applied;
    stage.debt -= applied;
    item.paid += applied;
    item.debt -= applied;
    return applied;
  };

  const confirmed = receipts.filter(isConfirmed);
  let residual = 0;

  // Pass 1 — explicit allocations.
  for (const receipt of confirmed) {
    const total = receiptAmount(receipt);
    const allocations: PaymentAllocation[] = Array.isArray(receipt.allocations)
      ? receipt.allocations
      : [];
    let allocatedHere = 0;

    for (const allocation of allocations) {
      const item = items.get(String(allocation.treatmentItemId));
      const want = clamp0(round0(allocation.amount));
      if (want <= 0) continue;
      if (!item) {
        // Names a treatment we don't have (deleted, or another clinic's) —
        // fold it back into the pool rather than dropping the money.
        allocatedHere += want;
        residual += want;
        continue;
      }
      const targets = allocation.stageId
        ? item.stages.filter((s) => s.stageId === allocation.stageId)
        : item.stages;
      let left = want;
      for (const stage of targets) {
        if (left <= 0) break;
        left -= applyTo(item, stage, left);
      }
      allocatedHere += want;
      // Over-cap excess falls through to the residual pool, never silently lost.
      residual += left;
    }

    residual += clamp0(total - allocatedHere);
  }

  // Pass 2 — FIFO spill of everything unallocated.
  for (const item of items.values()) {
    if (residual <= 0) break;
    for (const stage of item.stages) {
      if (residual <= 0) break;
      residual -= applyTo(item, stage, residual);
    }
  }

  let total = 0;
  let discount = 0;
  let paid = 0;
  let debt = 0;
  for (const item of items.values()) {
    total += item.total;
    discount += item.discount;
    paid += item.paid;
    debt += clamp0(item.debt);
  }

  const pending = receipts
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + receiptAmount(r), 0);

  return { items, total, discount, paid, pending, debt, credit: clamp0(residual) };
}

/** Balance for one treatment, or a zeroed shell when it isn't billable. */
export function itemBalance(itemId: string, ledger: BillingLedger): ItemBalance {
  return (
    ledger.items.get(String(itemId)) || {
      itemId: String(itemId),
      listPrice: 0,
      discount: 0,
      total: 0,
      paid: 0,
      debt: 0,
      stages: [],
    }
  );
}

export interface PatientBalance {
  total: number;
  discount: number;
  paid: number;
  pending: number;
  debt: number;
  credit: number;
  ledger: BillingLedger;
}

/**
 * The headline numbers for one patient. Pass the plan items straight from
 * Firestore plus whatever charges and receipts are loaded — missing charges
 * resolve to virtual ones, so this is correct even before the ledger exists.
 */
export function patientBalance(
  items: PlanItemLike[],
  charges: TreatmentCharge[],
  receipts: PaymentReceipt[],
  ctx?: Parameters<typeof virtualCharge>[1],
): PatientBalance {
  const resolved = items.map((item) => resolveCharge(item, charges, ctx));
  const ledger = allocatePayments(resolved, receipts);
  return {
    total: ledger.total,
    discount: ledger.discount,
    paid: ledger.paid,
    pending: ledger.pending,
    debt: ledger.debt,
    credit: ledger.credit,
    ledger,
  };
}

export interface ClinicPatientBalance extends PatientBalance {
  patientId: string;
  patientName?: string;
}

export interface ClinicBillingSummary {
  total: number;
  discount: number;
  paid: number;
  pending: number;
  debt: number;
  byPatient: Map<string, ClinicPatientBalance>;
}

/**
 * Clinic-wide roll-up, grouped by patient. Works off charges alone (no Firestore
 * reads), which is exactly why the ledger is a flat server collection carrying
 * clinicId/patientId rather than a per-patient subcollection.
 */
export function clinicBillingSummary(
  charges: TreatmentCharge[],
  receipts: PaymentReceipt[],
): ClinicBillingSummary {
  const chargesByPatient = new Map<string, TreatmentCharge[]>();
  for (const charge of charges) {
    const key = String(charge.patientId || '');
    if (!key) continue;
    const list = chargesByPatient.get(key);
    if (list) list.push(charge);
    else chargesByPatient.set(key, [charge]);
  }

  const receiptsByPatient = new Map<string, PaymentReceipt[]>();
  for (const receipt of receipts) {
    const key = String(receipt.patientId || '');
    if (!key) continue;
    const list = receiptsByPatient.get(key);
    if (list) list.push(receipt);
    else receiptsByPatient.set(key, [receipt]);
  }

  const byPatient = new Map<string, ClinicPatientBalance>();
  let total = 0;
  let discount = 0;
  let paid = 0;
  let pending = 0;
  let debt = 0;

  for (const [patientId, patientCharges] of chargesByPatient) {
    const ledger = allocatePayments(patientCharges, receiptsByPatient.get(patientId) || []);
    const entry: ClinicPatientBalance = {
      patientId,
      patientName: patientCharges.find((c) => c.patientName)?.patientName,
      total: ledger.total,
      discount: ledger.discount,
      paid: ledger.paid,
      pending: ledger.pending,
      debt: ledger.debt,
      credit: ledger.credit,
      ledger,
    };
    byPatient.set(patientId, entry);
    total += entry.total;
    discount += entry.discount;
    paid += entry.paid;
    pending += entry.pending;
    debt += entry.debt;
  }

  return { total, discount, paid, pending, debt, byPatient };
}
