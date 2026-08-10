import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';

// Per-procedure consumable "recipes": which warehouse materials a service uses
// and how much of each. Materials live entirely in Firestore
// (clinics/{clinicId}/materials) with no REST layer, so recipes sit alongside
// them rather than behind an endpoint.
//
// Reading recipes is done with a live onSnapshot in ProcedureCatalog; this
// module owns the paths and the write path so the shape stays in one place.
//
// The actual stock deduction deliberately does NOT live here — it runs on the
// server as part of the status -> completed transition
// (deductMaterialsForCompletedQueue in server.ts), so that finishing an
// appointment from the Telegram bot, the dashboard, or a direct PATCH all
// consume stock identically.

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

// Collapses duplicate rows so the same material picked twice is stored — and
// therefore later deducted — once, with the amounts summed.
export function normalizeRecipeItems(items: RecipeItem[]): RecipeItem[] {
  const merged = new Map<string, number>();
  for (const item of items) {
    if (!item?.materialId || !(Number(item.qty) > 0)) continue;
    merged.set(item.materialId, (merged.get(item.materialId) || 0) + Number(item.qty));
  }
  return Array.from(merged, ([materialId, qty]) => ({ materialId, qty }));
}

export async function saveServiceRecipe(clinicId: string, serviceId: string, items: RecipeItem[]) {
  try {
    await setDoc(doc(db, recipesPath(clinicId), serviceId), {
      serviceId,
      items: normalizeRecipeItems(items),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${recipesPath(clinicId)}/${serviceId}`);
    throw error;
  }
}
