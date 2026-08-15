import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Package, Plus, Search, Filter, AlertTriangle, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Check, X } from 'lucide-react';
import { Language } from '../translations';
import { createTranslator, Dict } from '../utils/translate';

const MATERIALS_TRANSLATIONS: Dict = {
  "materiallar ombori": { ru: "Склад материалов", en: "Materials warehouse", kk: "Материалдар қоймасы", ky: "Материалдар кампасы", tg: "Анбори маводҳо", tk: "Materiallar ammary" },
  "yangi material": { ru: "Новый материал", en: "New material", kk: "Жаңа материал", ky: "Жаңы материал", tg: "Маводи нав", tk: "Täze material" },
  "ta": { ru: "шт", en: "pcs", kk: "дана", ky: "даана", tg: "дона", tk: "sany" },
  "norma": { ru: "Норма", en: "Norm", kk: "Норма", ky: "Норма", tg: "Меъёр", tk: "Norma" },

  "klinikadagi barcha sarflanadigan materiallar va anjomlar hisobi": { ru: "Учет всех расходных материалов и инструментов клиники", en: "Inventory of all clinic consumables and supplies", kk: "Клиникадағы барлық шығын материалдары мен құралдардың есебі", ky: "Клиникадагы бардык сарптоо материалдары жана шаймандардын эсеби", tg: "Ҳисоби ҳамаи маводҳои сарфшаванда ва таҷҳизоти клиника", tk: "Klinikadaky ähli sarp materiallaryň we enjamlaryň hasaby" },
  "jami turlar": { ru: "Всего видов", en: "Total types", kk: "Барлық түрлері", ky: "Бардык түрлөрү", tg: "Ҳамаи навъҳо", tk: "Jemi görnüşler" },
  "ombor qiymati": { ru: "Стоимость склада", en: "Warehouse value", kk: "Қойма құны", ky: "Кампа наркы", tg: "Арзиши анбор", tk: "Ammar bahasy" },
  "tugayotganlar": { ru: "Заканчиваются", en: "Running low", kk: "Аяқталып жатқандар", ky: "Түгөнүп жаткандар", tg: "Ба охир расида", tk: "Gutarýanlar" },
  "kategoriyalarni tahrirlash": { ru: "Редактировать категории", en: "Edit categories", kk: "Санаттарды өңдеу", ky: "Категорияларды түзөтүү", tg: "Таҳрири категорияҳо", tk: "Kategoriýalary redaktirlemek" },
  "material nomini qidiring...": { ru: "Поиск по названию материала...", en: "Search material name...", kk: "Материал атауын іздеу...", ky: "Материал атын издөө...", tg: "Ҷустуҷӯи номи мавод...", tk: "Material adyny gözle..." },
  "material nomi": { ru: "Название материала", en: "Material name", kk: "Материал атауы", ky: "Материал аты", tg: "Номи мавод", tk: "Material ady" },
  "kategoriya": { ru: "Категория", en: "Category", kk: "Санат", ky: "Категория", tg: "Категория", tk: "Kategoriýa" },
  "qoldiq": { ru: "Остаток", en: "Remaining", kk: "Қалдық", ky: "Калдык", tg: "Боқимонда", tk: "Galyndy" },
  "narxi": { ru: "Цена", en: "Price", kk: "Бағасы", ky: "Баасы", tg: "Нарх", tk: "Bahasy" },
  "oxirgi kirim": { ru: "Последнее поступление", en: "Last restock", kk: "Соңғы түсім", ky: "Акыркы киреше", tg: "Воридоти охирин", tk: "Soňky giriş" },
  "amallar": { ru: "Действия", en: "Actions", kk: "Әрекеттер", ky: "Аракеттер", tg: "Амалҳо", tk: "Amallar" },
  "tugamoqda!": { ru: "Заканчивается!", en: "Running low!", kk: "Аяқталып жатыр!", ky: "Түгөнүп жатат!", tg: "Ба охир мерасад!", tk: "Gutarýar!" },
  "ishlatish": { ru: "Использовать", en: "Use", kk: "Пайдалану", ky: "Колдонуу", tg: "Истифода", tk: "Ulanmak" },
  "kirim (omborga qo'shish)": { ru: "Поступление (добавить на склад)", en: "Restock (add to warehouse)", kk: "Түсім (қоймаға қосу)", ky: "Киреше (кампага кошуу)", tg: "Воридот (ба анбор илова)", tk: "Giriş (ammara goşmak)" },
  "tahrirlash": { ru: "Редактировать", en: "Edit", kk: "Өңдеу", ky: "Түзөтүү", tg: "Таҳрир", tk: "Redaktirlemek" },
  "o'chirish": { ru: "Удалить", en: "Delete", kk: "Жою", ky: "Өчүрүү", tg: "Нест кардан", tk: "Pozmak" },
  "yangi material qo'shish": { ru: "Добавить новый материал", en: "Add new material", kk: "Жаңа материал қосу", ky: "Жаңы материал кошуу", tg: "Иловаи маводи нав", tk: "Täze material goşmak" },
  "nomi": { ru: "Название", en: "Name", kk: "Атауы", ky: "Аты", tg: "Ном", tk: "Ady" },
  "masalan: filtek ultimate": { ru: "Например: Filtek Ultimate", en: "For example: Filtek Ultimate", kk: "Мысалы: Filtek Ultimate", ky: "Мисалы: Filtek Ultimate", tg: "Масалан: Filtek Ultimate", tk: "Meselem: Filtek Ultimate" },
  "o'lchov birligi": { ru: "Единица измерения", en: "Unit of measure", kk: "Өлшем бірлігі", ky: "Өлчөө бирдиги", tg: "Воҳиди ченак", tk: "Ölçeg birligi" },
  "dona": { ru: "Штука", en: "Piece", kk: "Дана", ky: "Даана", tg: "Дона", tk: "Sany" },
  "quti": { ru: "Коробка", en: "Box", kk: "Қорап", ky: "Куту", tg: "Қуттӣ", tk: "Guty" },
  "shprits": { ru: "Шприц", en: "Syringe", kk: "Шприц", ky: "Шприц", tg: "Шприц", tk: "Şpris" },
  "kapsula/ml": { ru: "Капсула/мл", en: "Capsule/ml", kk: "Капсула/мл", ky: "Капсула/мл", tg: "Капсула/мл", tk: "Kapsula/ml" },
  "gramm (gr)": { ru: "Грамм (г)", en: "Gram (g)", kk: "Грамм (г)", ky: "Грамм (г)", tg: "Грамм (г)", tk: "Gram (g)" },
  "milligramm (mg)": { ru: "Миллиграмм (мг)", en: "Milligram (mg)", kk: "Миллиграмм (мг)", ky: "Миллиграмм (мг)", tg: "Миллиграмм (мг)", tk: "Milligram (mg)" },
  "kilogramm (kg)": { ru: "Килограмм (кг)", en: "Kilogram (kg)", kk: "Килограмм (кг)", ky: "Килограмм (кг)", tg: "Килограмм (кг)", tk: "Kilogram (kg)" },
  "boshlang'ich miqdor": { ru: "Начальное количество", en: "Initial quantity", kk: "Бастапқы мөлшер", ky: "Баштапкы саны", tg: "Миқдори ибтидоӣ", tk: "Başlangyç mukdar" },
  "minimal limit (tugash)": { ru: "Минимальный лимит (окончание)", en: "Minimum limit (low stock)", kk: "Минималды шек (аяқталу)", ky: "Минималдуу чек (түгөнүү)", tg: "Ҳадди ақалл (тамомшавӣ)", tk: "Iň pes çäk (gutarmak)" },
  "narxi (birlik uchun, uzs)": { ru: "Цена (за единицу, UZS)", en: "Price (per unit, UZS)", kk: "Бағасы (бірлік үшін, UZS)", ky: "Баасы (бирдик үчүн, UZS)", tg: "Нарх (барои як воҳид, UZS)", tk: "Bahasy (birlik üçin, UZS)" },
  "material ishlatish": { ru: "Использование материала", en: "Use material", kk: "Материалды пайдалану", ky: "Материалды колдонуу", tg: "Истифодаи мавод", tk: "Material ulanmak" },
  "omborga qo'shish": { ru: "Добавить на склад", en: "Add to warehouse", kk: "Қоймаға қосу", ky: "Кампага кошуу", tg: "Ба анбор илова кардан", tk: "Ammara goşmak" },
  "materialni tahrirlash": { ru: "Редактировать материал", en: "Edit material", kk: "Материалды өңдеу", ky: "Материалды түзөтүү", tg: "Таҳрири мавод", tk: "Materialy redaktirlemek" },
  "qoldiq miqdor": { ru: "Остаток количества", en: "Remaining quantity", kk: "Қалдық мөлшері", ky: "Калдык саны", tg: "Миқдори боқимонда", tk: "Galyndy mukdary" },
  "kategoriyalar": { ru: "Категории", en: "Categories", kk: "Санаттар", ky: "Категориялар", tg: "Категорияҳо", tk: "Kategoriýalar" },
  "yangi kategoriya qo'shish": { ru: "Добавить новую категорию", en: "Add new category", kk: "Жаңа санат қосу", ky: "Жаңы категория кошуу", tg: "Иловаи категорияи нав", tk: "Täze kategoriýa goşmak" },
  "kategoriya nomi": { ru: "Название категории", en: "Category name", kk: "Санат атауы", ky: "Категория аты", tg: "Номи категория", tk: "Kategoriýa ady" },
  "barcha": { ru: "Все", en: "All", kk: "Барлығы", ky: "Баары", tg: "Ҳама", tk: "Ählisi" },
  "miqdor": { ru: "Количество", en: "Quantity", kk: "Мөлшері", ky: "Саны", tg: "Миқдор", tk: "Mukdar" },
  "plombalar": { ru: "Пломбы", en: "Fillings", kk: "Пломбалар", ky: "Пломбалар", tg: "Пломбаҳо", tk: "Plombalar" },
  "anestetiklar": { ru: "Анестетики", en: "Anesthetics", kk: "Анестетиктер", ky: "Анестетиктер", tg: "Анестетикҳо", tk: "Anestetikler" },
  "endodontiya": { ru: "Эндодонтия", en: "Endodontics", kk: "Эндодонтия", ky: "Эндодонтия", tg: "Эндодонтия", tk: "Endodontiýa" },
  "jarrohlik": { ru: "Хирургия", en: "Surgery", kk: "Хирургия", ky: "Хирургия", tg: "Ҷарроҳӣ", tk: "Hirurgiýa" },
  "ortopediya": { ru: "Ортопедия", en: "Orthopedics", kk: "Ортопедия", ky: "Ортопедия", tg: "Ортопедия", tk: "Ortopediýa" },
  "boshqa": { ru: "Другое", en: "Other", kk: "Басқа", ky: "Башка", tg: "Дигар", tk: "Beýleki" },
};

interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  price: number;
  lastRestock: string;
}

const DEFAULT_CATEGORIES = ['Plombalar', 'Anestetiklar', 'Endodontiya', 'Jarrohlik', 'Ortopediya', 'Boshqa'];

export default function MaterialsInventory({ clinicId, language }: { clinicId?: string; language?: Language }) {
  const t = createTranslator(language, MATERIALS_TRANSLATIONS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeCategory, setActiveCategory] = useState('Barcha');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState<Material | null>(null);
  const [showRestockModal, setShowRestockModal] = useState<Material | null>(null);
  const [showEditModal, setShowEditModal] = useState<Material | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [actionQuantity, setActionQuantity] = useState<string>('');

  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: '', category: 'Plombalar', quantity: 0, unit: 'dona', minQuantity: 0, price: 0
  });

  useEffect(() => {
    if (!clinicId) return;
    const unsub = onSnapshot(
      collection(db, `clinics/${clinicId}/materials`),
      (snapshot) => {
        const data: Material[] = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as Material));
        data.sort((a, b) => a.name.localeCompare(b.name));
        setMaterials(data);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `clinics/${clinicId}/materials`)
    );
    return () => unsub();
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId) return;
    const unsub = onSnapshot(
      doc(db, `clinics/${clinicId}/settings/materialCategories`),
      (snap) => {
        const list = snap.exists() ? (snap.data().list as string[]) : null;
        setCategories(list && list.length > 0 ? list : DEFAULT_CATEGORIES);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `clinics/${clinicId}/settings/materialCategories`)
    );
    return () => unsub();
  }, [clinicId]);

  const saveCategories = async (next: string[]) => {
    setCategories(next);
    if (!clinicId) return;
    try {
      await setDoc(doc(db, `clinics/${clinicId}/settings/materialCategories`), { list: next });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `clinics/${clinicId}/settings/materialCategories`);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesCategory = activeCategory === 'Barcha' || m.category === activeCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockMaterials = materials.filter(m => m.quantity <= m.minQuantity);
  const totalValue = materials.reduce((sum, m) => sum + (m.quantity * m.price), 0);

  const updateMaterialDoc = async (id: string, patch: Partial<Material>) => {
    if (!clinicId) return;
    try {
      await updateDoc(doc(db, `clinics/${clinicId}/materials`, id), patch);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `clinics/${clinicId}/materials/${id}`);
    }
  };

  const handleUseMaterial = () => {
    if (!showUseModal || !actionQuantity || Number(actionQuantity) <= 0) return;
    updateMaterialDoc(showUseModal.id, { quantity: Math.max(0, showUseModal.quantity - Number(actionQuantity)) });
    setShowUseModal(null);
    setActionQuantity('');
  };

  const handleRestockMaterial = () => {
    if (!showRestockModal || !actionQuantity || Number(actionQuantity) <= 0) return;
    updateMaterialDoc(showRestockModal.id, {
      quantity: showRestockModal.quantity + Number(actionQuantity),
      lastRestock: new Date().toISOString().split('T')[0],
    });
    setShowRestockModal(null);
    setActionQuantity('');
  };

  const handleEditMaterial = () => {
    if (!showEditModal || !newMaterial.name) return;
    updateMaterialDoc(showEditModal.id, {
      name: newMaterial.name!,
      category: newMaterial.category!,
      quantity: Number(newMaterial.quantity) || 0,
      unit: newMaterial.unit!,
      minQuantity: Number(newMaterial.minQuantity) || 0,
      price: Number(newMaterial.price) || 0,
    });
    setShowEditModal(null);
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !clinicId) return;

    const id = Date.now().toString();
    const material: Material = {
      id,
      name: newMaterial.name,
      category: newMaterial.category || 'Boshqa',
      quantity: Number(newMaterial.quantity) || 0,
      unit: newMaterial.unit || 'dona',
      minQuantity: Number(newMaterial.minQuantity) || 0,
      price: Number(newMaterial.price) || 0,
      lastRestock: new Date().toISOString().split('T')[0]
    };

    try {
      await setDoc(doc(db, `clinics/${clinicId}/materials`, id), material);
      setShowAddModal(false);
      setNewMaterial({ name: '', category: 'Plombalar', quantity: 0, unit: 'dona', minQuantity: 0, price: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `clinics/${clinicId}/materials/${id}`);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!clinicId) return;
    try {
      await deleteDoc(doc(db, `clinics/${clinicId}/materials`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `clinics/${clinicId}/materials/${id}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 sm:px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Package className="w-7 h-7 text-blue-500" /> {t("Materiallar ombori")}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{t("Klinikadagi barcha sarflanadigan materiallar va anjomlar hisobi")}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> {t("Yangi material")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-500 mb-1">{t("Jami Turlar")}</div>
              <div className="text-2xl font-black text-slate-800">{materials.length} {t("ta")}</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <ArrowUpRight className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-500 mb-1">{t("Ombor Qiymati")}</div>
              <div className="text-2xl font-black text-slate-800">{totalValue.toLocaleString()} UZS</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${lowStockMaterials.length > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-500 mb-1">{t("Tugayotganlar")}</div>
              <div className="text-2xl font-black text-slate-800">{lowStockMaterials.length} {t("ta")}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 shrink-0 max-w-2xl">
            {['Barcha', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {t(cat)}
              </button>
            ))}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors ml-1 border border-transparent hover:border-slate-200"
              title={t("Kategoriyalarni tahrirlash")}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder={t("Material nomini qidiring...")} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 transition-colors text-slate-800"
            />
          </div>
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">{t("Material Nomi")}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">{t("Kategoriya")}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">{t("Qoldiq")}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">{t("Narxi")}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">{t("Oxirgi kirim")}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">{t("Amallar")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map(material => (
                <tr key={material.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {material.quantity <= material.minQuantity && (
                        <span className="w-2 h-2 rounded-full bg-red-500" title={t("Tugamoqda!")}></span>
                      )}
                      {material.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                      {t(material.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-black ${material.quantity <= material.minQuantity ? 'text-red-600' : 'text-slate-800'}`}>
                        {material.quantity}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{t(material.unit)}</span>
                    </div>
                    {material.quantity <= material.minQuantity && (
                      <div className="text-[10px] font-bold text-red-500 mt-0.5">{t("Norma")}: {material.minQuantity} {t("ta")}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{material.price.toLocaleString()} UZS</div>
                    <div className="text-[10px] font-medium text-slate-400">/{t(material.unit)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-500">{new Date(material.lastRestock).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        title={t("Ishlatish")}
                        onClick={() => { setShowUseModal(material); setActionQuantity(''); }}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <ArrowDownRight className="w-4 h-4" />
                      </button>
                      <button 
                        title={t("Kirim (Omborga qo'shish)")}
                        onClick={() => { setShowRestockModal(material); setActionQuantity(''); }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <button 
                        title={t("Tahrirlash")}
                        onClick={() => { setShowEditModal(material); setNewMaterial(material); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        title={t("O'chirish")}
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/50">
                    Materiallar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">{t("Yangi Material Qo'shish")}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Nomi")}</label>
                <input 
                  type="text" 
                  value={newMaterial.name}
                  onChange={e => setNewMaterial({...newMaterial, name: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  placeholder={t("Masalan: Filtek Ultimate")}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Kategoriya")}</label>
                  <select 
                    value={newMaterial.category}
                    onChange={e => setNewMaterial({...newMaterial, category: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("O'lchov Birligi")}</label>
                  <select 
                    value={newMaterial.unit}
                    onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="dona">{t("Dona")}</option>
                    <option value="quti">{t("Quti")}</option>
                    <option value="shprits">{t("Shprits")}</option>
                    <option value="ml">{t("Kapsula/ml")}</option>
                    <option value="gr">{t("Gramm (gr)")}</option>
                    <option value="mg">{t("Milligramm (mg)")}</option>
                    <option value="kg">{t("Kilogramm (kg)")}</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Boshlang'ich Miqdor")}</label>
                  <input 
                    type="number" 
                    value={newMaterial.quantity || ''}
                    onChange={e => setNewMaterial({...newMaterial, quantity: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Minimal Limit (Tugash)")}</label>
                  <input 
                    type="number" 
                    value={newMaterial.minQuantity || ''}
                    onChange={e => setNewMaterial({...newMaterial, minQuantity: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Narxi (Birlik uchun, UZS)")}</label>
                <input 
                  type="number" 
                  value={newMaterial.price || ''}
                  onChange={e => setNewMaterial({...newMaterial, price: Number(e.target.value)})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={handleAddMaterial}
                disabled={!newMaterial.name}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Use Modal */}
      {showUseModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">{t("Material ishlatish")}</h3>
              <button onClick={() => setShowUseModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                &times;
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-4">
                <strong className="text-slate-800">{showUseModal.name}</strong> dan qancha ishlatildi? (Joriy qoldiq: {showUseModal.quantity} {showUseModal.unit})
              </p>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">Miqdor ({showUseModal.unit})</label>
                <input 
                  type="number" 
                  value={actionQuantity}
                  onChange={e => setActionQuantity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-orange-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowUseModal(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                Bekor qilish
              </button>
              <button onClick={handleUseMaterial} disabled={!actionQuantity || Number(actionQuantity) <= 0 || Number(actionQuantity) > showUseModal.quantity} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20">
                {t("Ishlatish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">{t("Omborga qo'shish")}</h3>
              <button onClick={() => setShowRestockModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                &times;
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-4">
                <strong className="text-slate-800">{showRestockModal.name}</strong> dan qancha keldi?
              </p>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">Miqdor ({showRestockModal.unit})</label>
                <input 
                  type="number" 
                  value={actionQuantity}
                  onChange={e => setActionQuantity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowRestockModal(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                Bekor qilish
              </button>
              <button onClick={handleRestockMaterial} disabled={!actionQuantity || Number(actionQuantity) <= 0} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20">
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">{t("Materialni tahrirlash")}</h3>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Nomi")}</label>
                <input 
                  type="text" 
                  value={newMaterial.name || ''}
                  onChange={e => setNewMaterial({...newMaterial, name: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  placeholder={t("Masalan: Filtek Ultimate")}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Kategoriya")}</label>
                  <select 
                    value={newMaterial.category || (categories.length > 0 ? categories[0] : 'Plombalar')}
                    onChange={e => setNewMaterial({...newMaterial, category: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("O'lchov Birligi")}</label>
                  <select 
                    value={newMaterial.unit || 'dona'}
                    onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="dona">{t("Dona")}</option>
                    <option value="quti">{t("Quti")}</option>
                    <option value="shprits">{t("Shprits")}</option>
                    <option value="ml">{t("Kapsula/ml")}</option>
                    <option value="gr">{t("Gramm (gr)")}</option>
                    <option value="mg">{t("Milligramm (mg)")}</option>
                    <option value="kg">{t("Kilogramm (kg)")}</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Qoldiq Miqdor")}</label>
                  <input 
                    type="number" 
                    value={newMaterial.quantity !== undefined ? newMaterial.quantity : ''}
                    onChange={e => setNewMaterial({...newMaterial, quantity: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Minimal Limit (Tugash)")}</label>
                  <input 
                    type="number" 
                    value={newMaterial.minQuantity !== undefined ? newMaterial.minQuantity : ''}
                    onChange={e => setNewMaterial({...newMaterial, minQuantity: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Narxi (Birlik uchun, UZS)")}</label>
                <input 
                  type="number" 
                  value={newMaterial.price !== undefined ? newMaterial.price : ''}
                  onChange={e => setNewMaterial({...newMaterial, price: Number(e.target.value)})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowEditModal(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={handleEditMaterial}
                disabled={!newMaterial.name}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-lg font-black text-slate-800">{t("Kategoriyalar")}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                &times;
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-3 mb-6">
                {categories.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {editingCategory === cat ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingCategoryName.trim()) {
                              const renamed = editingCategoryName.trim();
                              const newCats = [...categories];
                              newCats[index] = renamed;
                              saveCategories(newCats);
                              if (activeCategory === cat) setActiveCategory(renamed);

                              // Update materials with old category to new category
                              materials.filter(m => m.category === cat).forEach(m => updateMaterialDoc(m.id, { category: renamed }));

                              setEditingCategory(null);
                            } else if (e.key === 'Escape') {
                              setEditingCategory(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (editingCategoryName.trim()) {
                              const renamed = editingCategoryName.trim();
                              const newCats = [...categories];
                              newCats[index] = renamed;
                              saveCategories(newCats);
                              if (activeCategory === cat) setActiveCategory(renamed);
                              materials.filter(m => m.category === cat).forEach(m => updateMaterialDoc(m.id, { category: renamed }));
                              setEditingCategory(null);
                            }
                          }}
                          className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700">{t(cat)}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditingCategoryName(cat);
                            }}
                            className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const newCats = categories.filter(c => c !== cat);
                              saveCategories(newCats);
                              if (activeCategory === cat) setActiveCategory('Barcha');
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Yangi kategoriya qo'shish")}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                    placeholder={t("Kategoriya nomi")}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCategoryName.trim()) {
                        saveCategories([...categories, newCategoryName.trim()]);
                        setNewCategoryName('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newCategoryName.trim()) {
                        saveCategories([...categories, newCategoryName.trim()]);
                        setNewCategoryName('');
                      }
                    }}
                    disabled={!newCategoryName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
