import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { ClipboardList, Search, Plus, Trash2, Package, Check, X, Edit2, AlertTriangle } from 'lucide-react';
import { Language } from '../translations';
import { createTranslator, Dict } from '../utils/translate';

const CATALOG_TRANSLATIONS: Dict = {
  "har bir muolaja uchun sarflanadigan materiallarni kiriting. qabul yakunlangach, shu muolajaga biriktirilgan materiallar ombordan avtomatik ravishda kamayadi. miqdor har bir materialning o'z o'lchov birligida (dona, gr, ml va h.k.) kiritiladi.": { ru: "Укажите расходные материалы для каждой процедуры. После завершения приема привязанные к процедуре материалы автоматически списываются со склада. Количество указывается в собственной единице измерения материала (шт, г, мл и т.д.).", en: "Set the consumables for each procedure. When a consultation is completed, the materials linked to that procedure are automatically deducted from the warehouse. Quantity is entered in each material's own unit (pcs, g, ml, etc.).", kk: "Әр процедура үшін шығын материалдарын енгізіңіз. Қабылдау аяқталған соң, процедураға байланған материалдар қоймадан автоматты түрде шегеріледі. Мөлшер материалдың өз өлшем бірлігінде енгізіледі (дана, г, мл, т.б.).", ky: "Ар бир процедура үчүн сарптоо материалдарын киргизиңиз. Кабылдоо аяктагандан кийин, процедурага байланган материалдар кампадан автоматтык түрдө кемийт. Саны материалдын өз өлчөө бирдигинде киргизилет (даана, г, мл ж.б.).", tg: "Барои ҳар муолиҷа маводҳои сарфшавандаро ворид кунед. Пас аз анҷоми қабул, маводҳои ба ин муолиҷа вобаста аз анбор худкор кам мешаванд. Миқдор дар воҳиди ченаки худи мавод ворид мешавад (дона, г, мл ва ғ.).", tk: "Her prosedura üçin sarp materiallary giriziň. Kabul tamamlanandan soň, şu procedura baglanan materiallar ammardan awtomatik azalýar. Mukdar her materialyň öz ölçeg birliginde girizilýär (sany, g, ml we ş.m.)." },

  "klinika tanlanmagan": { ru: "Клиника не выбрана", en: "No clinic selected", kk: "Клиника таңдалмаған", ky: "Клиника тандалган жок", tg: "Клиника интихоб нашудааст", tk: "Klinika saýlanmady" },
  "jami muolajalar": { ru: "Всего процедур", en: "Total procedures", kk: "Барлық процедуралар", ky: "Бардык процедуралар", tg: "Ҳамаи муолиҷаҳо", tk: "Jemi proseduralar" },
  "sarf materiali kiritilgan": { ru: "С заданными расходниками", en: "With consumables defined", kk: "Шығын материалы енгізілген", ky: "Сарптоо материалы киргизилген", tg: "Бо маводи сарфшаванда", tk: "Sarp materialy girizilen" },
  "omborda materiallar": { ru: "Материалов на складе", en: "Materials in warehouse", kk: "Қоймадағы материалдар", ky: "Кампадагы материалдар", tg: "Маводҳо дар анбор", tk: "Ammardaky materiallar" },
  "muolaja nomi bo'yicha qidiring...": { ru: "Поиск по названию процедуры...", en: "Search by procedure name...", kk: "Процедура атауы бойынша іздеу...", ky: "Процедура аты боюнча издөө...", tg: "Ҷустуҷӯ аз рӯи номи муолиҷа...", tk: "Prosedura ady boýunça gözleg..." },
  "faqat materiali borlari": { ru: "Только с материалами", en: "Only those with materials", kk: "Тек материалы барлары", ky: "Материалы барлар гана", tg: "Танҳо онҳое ки мавод доранд", tk: "Diňe materialy barlar" },
  "muolaja topilmadi": { ru: "Процедуры не найдены", en: "No procedures found", kk: "Процедуралар табылмады", ky: "Процедуралар табылган жок", tg: "Муолиҷа ёфт нашуд", tk: "Prosedura tapylmady" },
  "material": { ru: "Материал", en: "Material", kk: "Материал", ky: "Материал", tg: "Мавод", tk: "Material" },
  "o'chirish": { ru: "Удалить", en: "Delete", kk: "Жою", ky: "Өчүрүү", tg: "Нест кардан", tk: "Pozmak" },
};


import { Service } from '../types';
import { RecipeItem, ServiceRecipe, recipesPath, materialsPath, saveServiceRecipe } from '../utils/materialDeduction';

interface DraftRow {
  materialId: string;
  qty: string;
}

interface MaterialLite {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

// The clinic's procedure list with, for each procedure, the consumable
// "recipe" — which warehouse materials it uses and how much. Completing an
// appointment with that service automatically subtracts those amounts from
// stock (see utils/materialDeduction.ts), which is the only thing that keeps
// the warehouse honest; before this, stock only ever moved by hand.
//
// The service list itself is read-only here: POST /api/services is restricted
// to director/superadmin, so a doctor curates recipes, not the price list.
export default function ProcedureCatalog({
  clinicId,
  services,
  language,
}: {
  clinicId?: string;
  services: Service[];
  language?: Language;
}) {
  const t = createTranslator(language, CATALOG_TRANSLATIONS);
  const [materials, setMaterials] = useState<MaterialLite[]>([]);
  const [recipes, setRecipes] = useState<Record<string, RecipeItem[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithRecipe, setOnlyWithRecipe] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  // qty is held as a string while editing so partial input survives: coercing
  // every keystroke through Number() rewrites "0." back to "0", which makes
  // fractional amounts (0.5 ml of anaesthetic) impossible to type at all.
  const [draftItems, setDraftItems] = useState<DraftRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!clinicId) return;
    const unsub = onSnapshot(
      collection(db, materialsPath(clinicId)),
      (snapshot) => {
        const data: MaterialLite[] = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...(d.data() as any) }));
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setMaterials(data);
      },
      (error) => handleFirestoreError(error, OperationType.GET, materialsPath(clinicId))
    );
    return () => unsub();
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId) return;
    const unsub = onSnapshot(
      collection(db, recipesPath(clinicId)),
      (snapshot) => {
        const next: Record<string, RecipeItem[]> = {};
        snapshot.forEach((d) => {
          const data = d.data() as ServiceRecipe;
          next[d.id] = Array.isArray(data?.items) ? data.items : [];
        });
        setRecipes(next);
      },
      (error) => handleFirestoreError(error, OperationType.GET, recipesPath(clinicId))
    );
    return () => unsub();
  }, [clinicId]);

  const clinicServices = useMemo(
    () => services.filter((s) => !clinicId || s.clinicId === clinicId),
    [services, clinicId]
  );

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clinicServices
      .filter((s) => (q ? (s.name || '').toLowerCase().includes(q) : true))
      .filter((s) => (onlyWithRecipe ? (recipes[s.id] || []).length > 0 : true))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [clinicServices, searchQuery, onlyWithRecipe, recipes]);

  const materialById = useMemo(() => {
    const map: Record<string, MaterialLite> = {};
    materials.forEach((m) => { map[m.id] = m; });
    return map;
  }, [materials]);

  const configuredCount = useMemo(
    () => clinicServices.filter((s) => (recipes[s.id] || []).length > 0).length,
    [clinicServices, recipes]
  );

  const openEditor = (service: Service) => {
    setEditingService(service);
    setDraftItems((recipes[service.id] || []).map((i) => ({ materialId: i.materialId, qty: String(i.qty) })));
  };

  const addDraftRow = () => {
    const firstUnused = materials.find((m) => !draftItems.some((i) => i.materialId === m.id));
    setDraftItems((prev) => [...prev, { materialId: firstUnused?.id || '', qty: '1' }]);
  };

  const updateDraftRow = (index: number, patch: Partial<DraftRow>) => {
    setDraftItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeDraftRow = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!clinicId || !editingService) return;
    setIsSaving(true);
    try {
      // Drop blank/zero rows so a half-filled row can never silently deduct nothing
      // (or worse, deduct against an empty materialId) at completion time.
      // saveServiceRecipe also merges duplicate materials, so the same material
      // picked on two rows is stored once instead of being deducted twice.
      const clean = draftItems
        .filter((i) => i.materialId && Number(i.qty) > 0)
        .map((i) => ({ materialId: i.materialId, qty: Number(i.qty) }));
      await saveServiceRecipe(clinicId, editingService.id, clean);
      setEditingService(null);
      setDraftItems([]);
    } catch {
      // saveServiceRecipe already reported it; keep the modal open so the doctor
      // sees their edits weren't lost and can retry.
    } finally {
      setIsSaving(false);
    }
  };

  if (!clinicId) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
        <p className="text-sm font-bold text-slate-400">{t("Klinika tanlanmagan")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{t("Jami muolajalar")}</p>
            <p className="text-2xl font-black text-slate-800">{clinicServices.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{t("Sarf materiali kiritilgan")}</p>
            <p className="text-2xl font-black text-slate-800">{configuredCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{t("Omborda materiallar")}</p>
            <p className="text-2xl font-black text-slate-800">{materials.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Package className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 font-semibold leading-relaxed">
          {t("Har bir muolaja uchun sarflanadigan materiallarni kiriting. Qabul yakunlangach, shu muolajaga biriktirilgan materiallar ombordan avtomatik ravishda kamayadi. Miqdor har bir materialning o'z o'lchov birligida (dona, gr, ml va h.k.) kiritiladi.")}
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Muolaja nomi bo'yicha qidiring...")}
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={onlyWithRecipe}
            onChange={(e) => setOnlyWithRecipe(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-xs font-bold text-slate-600">{t("Faqat materiali borlari")}</span>
        </label>
      </div>

      {/* Service list */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {filteredServices.length === 0 ? (
          <p className="p-8 text-center text-sm font-bold text-slate-400">{t("Muolaja topilmadi")}</p>
        ) : (
          filteredServices.map((service) => {
            const items = recipes[service.id] || [];
            return (
              <div key={service.id} className="p-4 flex items-start justify-between gap-4 flex-wrap hover:bg-slate-50/60 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{service.name}</p>
                  <p className="text-[11px] text-slate-400 font-semibold mb-2">
                    {Number(service.price).toLocaleString()} so'm
                  </p>
                  {items.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase tracking-wide">
                      <AlertTriangle className="w-3 h-3" /> Sarf materiali kiritilmagan
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => {
                        const mat = materialById[item.materialId];
                        const low = mat && mat.quantity < item.qty;
                        return (
                          <span
                            key={item.materialId}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              !mat
                                ? 'bg-rose-50 text-rose-500 border-rose-100'
                                : low
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-150'
                            }`}
                            title={!mat ? "Bu material ombordan o'chirilgan" : low ? 'Omborda yetarli emas' : ''}
                          >
                            {mat?.name || "O'chirilgan material"} · {item.qty} {mat?.unit || ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openEditor(service)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Materiallar
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Recipe editor */}
      {editingService && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 truncate">
                  <Package className="w-5 h-5 text-blue-500 shrink-0" />
                  Sarf materiallari
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">{editingService.name}</p>
              </div>
              <button
                onClick={() => { setEditingService(null); setDraftItems([]); }}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3 overflow-y-auto">
              {materials.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-6">
                  Omborda material yo'q. Avval "Material va Anjomlar" bo'limidan material qo'shing.
                </p>
              ) : draftItems.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-6">
                  Hali material qo'shilmagan
                </p>
              ) : (
                draftItems.map((item, index) => {
                  const mat = materialById[item.materialId];
                  return (
                    <div key={index} className="flex items-end gap-2">
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{t("Material")}</label>
                        <select
                          value={item.materialId}
                          onChange={(e) => updateDraftRow(index, { materialId: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                        >
                          <option value="">— tanlang —</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (omborda: {m.quantity} {m.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28 shrink-0">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                          Miqdor {mat?.unit ? `(${mat.unit})` : ''}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.qty}
                          onChange={(e) => updateDraftRow(index, { qty: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                        />
                      </div>
                      <button
                        onClick={() => removeDraftRow(index)}
                        className="p-2 mb-0.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        title={t("O'chirish")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}

              {materials.length > 0 && (
                <button
                  onClick={addDraftRow}
                  className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-500 hover:text-blue-600 font-bold text-xs rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Material qo'shish
                </button>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => { setEditingService(null); setDraftItems([]); }}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveRecipe}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-md shadow-blue-500/20"
              >
                {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
