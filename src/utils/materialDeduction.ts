import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';

// Consumable stock is deducted from the warehouse automatically when a doctor
// finishes a procedure, using the per-service "recipe" configured in the
// Muolajalar (ProcedureCatalog) tab. Materials live entirely in Firestore
// (clinics/{clinicId}/materials) with no REST layer, so this runs client-side
// alongside the queue-status PATCH rather than on the server.

export interface RecipeItem {
  materialId: string;
  qty: number;
}

export interface ServiceRecipe {
  serviceId: string;
  items: RecipeItem[];
}

export const recipesPath = (clinicId: string) => `clinics/${clinicId}/serviceMaterials`;
export const materialsPath = (clinicId: string) => `clinics/${clinicId}/materials`;
export const usagePath = (clinicId: string) => `clinics/${clinicId}/materialUsage`;

export async function loadServiceRecipes(clinicId: string): Promise<Record<string, RecipeItem[]>> {
  try {
    const snap = await getDocs(collection(db, recipesPath(clinicId)));
    const out: Record<string, RecipeItem[]> = {};
    snap.forEach((d) => {
      const data = d.data() as ServiceRecipe;
      out[d.id] = Array.isArray(data?.items) ? data.items : [];
    });
    return out;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, recipesPath(clinicId));
    return {};
  }
}

export async function saveServiceRecipe(clinicId: string, serviceId: string, items: RecipeItem[]) {
  try {
    await setDoc(doc(db, recipesPath(clinicId), serviceId), { serviceId, items });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${recipesPath(clinicId)}/${serviceId}`);
    throw error;
  }
}

/**
 * Decrements warehouse stock for every material in the finished procedure's recipe.
 *
 * Idempotent: the first successful run writes clinics/{clinicId}/materialUsage/{queueId},
 * and any later call for the same queue sees that marker and returns without touching
 * stock. That marker doubles as the audit trail of what a given appointment consumed.
 *
 * Deliberately fails soft — a missing recipe, a deleted material, or an offline write
 * must never block the doctor from marking the appointment completed.
 */
export async function deductMaterialsForQueue(params: {
  clinicId?: string;
  queueId?: string;
  serviceId?: string;
  doctorId?: string;
}): Promise<{ deducted: boolean; reason?: string }> {
  const { clinicId, queueId, serviceId, doctorId } = params;
  if (!clinicId || !queueId || !serviceId) {
    return { deducted: false, reason: 'missing-params' };
  }

  try {
    const usageRef = doc(db, usagePath(clinicId), queueId);
    const existing = await getDoc(usageRef);
    if (existing.exists()) return { deducted: false, reason: 'already-deducted' };

    const recipeSnap = await getDoc(doc(db, recipesPath(clinicId), serviceId));
    const items: RecipeItem[] = recipeSnap.exists()
      ? ((recipeSnap.data() as ServiceRecipe)?.items || [])
      : [];
    if (items.length === 0) return { deducted: false, reason: 'no-recipe' };

    const applied: Array<{ materialId: string; name: string; qty: number; unit: string }> = [];
    for (const item of items) {
      if (!item?.materialId || !(item.qty > 0)) continue;
      const matRef = doc(db, materialsPath(clinicId), item.materialId);
      const matSnap = await getDoc(matRef);
      if (!matSnap.exists()) {
        console.warn('[materialDeduction] material no longer exists, skipped:', item.materialId);
        continue;
      }
      const mat = matSnap.data() as { name?: string; quantity?: number; unit?: string };
      const current = Number(mat.quantity) || 0;
      // Clamped at zero: stock going negative would misreport the warehouse as
      // owing supplies rather than simply being empty.
      await updateDoc(matRef, { quantity: Math.max(0, current - item.qty) });
      applied.push({
        materialId: item.materialId,
        name: mat.name || item.materialId,
        qty: item.qty,
        unit: mat.unit || '',
      });
    }

    await setDoc(usageRef, {
      queueId,
      serviceId,
      doctorId: doctorId || null,
      items: applied,
      deductedAt: new Date().toISOString(),
    });

    return { deducted: applied.length > 0 };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, usagePath(clinicId));
    return { deducted: false, reason: 'error' };
  }
}
