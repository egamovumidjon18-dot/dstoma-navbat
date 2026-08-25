import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../services/firebase';
import {
  FileText, Plus, Check, Clock, XCircle, PlayCircle,
  Download, Send, Sparkles, User, Calendar, Trash2, Search
} from 'lucide-react';
import { Language } from '../translations';
import { createTranslator, Dict } from '../utils/translate';
import { getApiUrl } from '../services/api';
import type { PaymentReceipt, TreatmentCharge } from '../types';
import { patientBalance, itemBalance, effectivePrice } from '../utils/treatmentBilling';
import { saveTreatmentCharge as saveTreatmentChargeApi, voidTreatmentCharge } from '../utils/treatmentCharges';

const PLAN_TRANSLATIONS: Dict = {
  "bemor tarixiga asoslanib, avval muammoli tishlardagi kariesni davolash, so'ngra implant o'rnatish bosqichiga o'tish tavsiya etiladi. davolash davomiyligi taxminan 3-4 hafta.": { ru: "На основе истории пациента рекомендуется сначала вылечить кариес в проблемных зубах, затем перейти к этапу установки имплантов. Продолжительность лечения примерно 3-4 недели.", en: "Based on the patient's history, it is recommended to first treat caries in the problem teeth, then move on to implant placement. Treatment duration is approximately 3-4 weeks.", kk: "Пациенттің тарихына сүйене отырып, алдымен проблемалы тістердегі кариесті емдеу, содан кейін имплант орнату кезеңіне өту ұсынылады. Емдеу ұзақтығы шамамен 3-4 апта.", ky: "Бейтаптын тарыхына таянып, адегенде көйгөйлүү тиштердеги кариести дарылоо, андан кийин имплант орнотуу этабына өтүү сунушталат. Дарылоо узактыгы болжол менен 3-4 жума.", tg: "Дар асоси таърихи бемор тавсия дода мешавад, ки аввал кариесро дар дандонҳои мушкилдор табобат кунед, сипас ба марҳилаи гузоштани имплант гузаред. Давомнокии табобат тахминан 3-4 ҳафта.", tk: "Näsagyň taryhyna esaslanyp, ilki kynçylykly dişlerdäki kariesi bejermek, soňra implant oturtmak tapgyryna geçmek maslahat berilýär. Bejergi dowamlylygy takmynan 3-4 hepde." },

  "davolash rejasi": { ru: "План лечения", en: "Treatment plan", kk: "Емдеу жоспары", ky: "Дарылоо планы", tg: "Нақшаи муолиҷа", tk: "Bejergi meýilnamasy" },
  "yangi muolaja": { ru: "Новая процедура", en: "New procedure", kk: "Жаңа процедура", ky: "Жаңы процедура", tg: "Муолиҷаи нав", tk: "Täze prosedura" },
  "so'm": { ru: "сум", en: "UZS", kk: "сом", ky: "сом", tg: "сӯм", tk: "som" },
  "chegirma:": { ru: "Скидка:", en: "Discount:", kk: "Жеңілдік:", ky: "Арзандатуу:", tg: "Тахфиф:", tk: "Arzanlaşyk:" },
  "to'langan:": { ru: "Оплачено:", en: "Paid:", kk: "Төленген:", ky: "Төлөнгөн:", tg: "Пардохтшуда:", tk: "Tölenen:" },
  "tasdiqlanmagan:": { ru: "Не подтверждено:", en: "Unconfirmed:", kk: "Расталмаған:", ky: "Тастыкталбаган:", tg: "Тасдиқнашуда:", tk: "Tassyklanmadyk:" },
  "qarz:": { ru: "Долг:", en: "Debt:", kk: "Қарыз:", ky: "Карыз:", tg: "Қарз:", tk: "Bergi:" },

  "bemorning kompleks davolash bosqichlari": { ru: "Этапы комплексного лечения пациента", en: "Stages of the patient's comprehensive treatment", kk: "Пациентті кешенді емдеу кезеңдері", ky: "Бейтапты комплекстүү дарылоо этаптары", tg: "Марҳилаҳои табобати комплексии бемор", tk: "Näsagyň toplumlaýyn bejergi tapgyrlary" },
  "telegram orqali yuborish": { ru: "Отправить через Telegram", en: "Send via Telegram", kk: "Telegram арқылы жіберу", ky: "Telegram аркылуу жөнөтүү", tg: "Фиристодан тавассути Telegram", tk: "Telegram arkaly ibermek" },
  "chop etish / pdf": { ru: "Печать / PDF", en: "Print / PDF", kk: "Басып шығару / PDF", ky: "Басып чыгаруу / PDF", tg: "Чоп / PDF", tk: "Çap etmek / PDF" },
  "umumiy progress": { ru: "Общий прогресс", en: "Overall progress", kk: "Жалпы прогресс", ky: "Жалпы прогресс", tg: "Пешрафти умумӣ", tk: "Umumy progres" },
  "moliyaviy hisobot": { ru: "Финансовый отчет", en: "Financial summary", kk: "Қаржылық есеп", ky: "Каржылык отчет", tg: "Ҳисоботи молиявӣ", tk: "Maliýe hasabaty" },
  "umumiy summa:": { ru: "Общая сумма:", en: "Total amount:", kk: "Жалпы сома:", ky: "Жалпы сумма:", tg: "Маблағи умумӣ:", tk: "Umumy jemi:" },
  "bajarilgan muolajalar:": { ru: "Выполненные процедуры:", en: "Completed procedures:", kk: "Орындалған процедуралар:", ky: "Аткарылган процедуралар:", tg: "Муолиҷаҳои иҷрошуда:", tk: "Ýerine ýetirilen proseduralar:" },
  "qolgan summa:": { ru: "Оставшаяся сумма:", en: "Remaining amount:", kk: "Қалған сома:", ky: "Калган сумма:", tg: "Маблағи боқимонда:", tk: "Galan jemi:" },
  "ai tavsiyasi": { ru: "Рекомендация AI", en: "AI recommendation", kk: "AI ұсынысы", ky: "AI сунушу", tg: "Тавсияи AI", tk: "AI maslahaty" },
  "tish": { ru: "Зуб", en: "Tooth", kk: "Тіс", ky: "Тиш", tg: "Дандон", tk: "Diş" },
  "muolaja": { ru: "Процедура", en: "Procedure", kk: "Процедура", ky: "Процедура", tg: "Муолиҷа", tk: "Prosedura" },
  "narx": { ru: "Цена", en: "Price", kk: "Бағасы", ky: "Баасы", tg: "Нарх", tk: "Bahasy" },
  "shifokor": { ru: "Врач", en: "Doctor", kk: "Дәрігер", ky: "Дарыгер", tg: "Духтур", tk: "Lukman" },
  "sana": { ru: "Дата", en: "Date", kk: "Күні", ky: "Күнү", tg: "Сана", tk: "Sene" },
  "holat": { ru: "Статус", en: "Status", kk: "Күйі", ky: "Абалы", tg: "Ҳолат", tk: "Ýagdaý" },
  "amal": { ru: "Действие", en: "Action", kk: "Әрекет", ky: "Аракет", tg: "Амал", tk: "Amal" },
  "rejalashtirilgan": { ru: "Запланировано", en: "Planned", kk: "Жоспарланған", ky: "Пландаштырылган", tg: "Ба нақша гирифташуда", tk: "Meýilleşdirilen" },
  "jarayonda": { ru: "В процессе", en: "In progress", kk: "Үрдісте", ky: "Процессте", tg: "Дар ҷараён", tk: "Dowam edýär" },
  "bajarildi": { ru: "Выполнено", en: "Completed", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷро шуд", tk: "Ýerine ýetirildi" },
  "bekor qilindi": { ru: "Отменено", en: "Cancelled", kk: "Болдырылмады", ky: "Жокко чыгарылды", tg: "Бекор карда шуд", tk: "Ýatyryldy" },
  "o'chirish": { ru: "Удалить", en: "Delete", kk: "Жою", ky: "Өчүрүү", tg: "Нест кардан", tk: "Pozmak" },
  "yangi muolaja qo'shish": { ru: "Добавить новую процедуру", en: "Add new procedure", kk: "Жаңа процедура қосу", ky: "Жаңы процедура кошуу", tg: "Иловаи муолиҷаи нав", tk: "Täze prosedura goşmak" },
  "tish raqami (fdi)": { ru: "Номер зуба (FDI)", en: "Tooth number (FDI)", kk: "Тіс нөмірі (FDI)", ky: "Тиш номери (FDI)", tg: "Рақами дандон (FDI)", tk: "Diş belgisi (FDI)" },
  "masalan: 36": { ru: "Например: 36", en: "For example: 36", kk: "Мысалы: 36", ky: "Мисалы: 36", tg: "Масалан: 36", tk: "Meselem: 36" },
  "holati": { ru: "Статус", en: "Status", kk: "Күйі", ky: "Абалы", tg: "Ҳолат", tk: "Ýagdaý" },
  "muolaja katalogi": { ru: "Каталог процедур", en: "Procedure catalog", kk: "Процедуралар каталогы", ky: "Процедуралар каталогу", tg: "Феҳристи муолиҷаҳо", tk: "Prosedura kataology" },
  "katalogdan qidirish...": { ru: "Поиск в каталоге...", en: "Search the catalog...", kk: "Каталогтан іздеу...", ky: "Каталогдон издөө...", tg: "Ҷустуҷӯ дар феҳрист...", tk: "Katalogdan gözle..." },
  "katalogda xizmat topilmadi": { ru: "Услуга в каталоге не найдена", en: "No service found in the catalog", kk: "Каталогтан қызмет табылмады", ky: "Каталогдон кызмат табылган жок", tg: "Хизмат дар феҳрист ёфт нашуд", tk: "Katalogda hyzmat tapylmady" },
  "muolaja nomi (maxsus)": { ru: "Название процедуры (особое)", en: "Procedure name (custom)", kk: "Процедура атауы (арнайы)", ky: "Процедура аты (өзгөчө)", tg: "Номи муолиҷа (махсус)", tk: "Prosedura ady (ýörite)" },
  "kanal tozalash va plomba": { ru: "Чистка канала и пломба", en: "Root canal cleaning and filling", kk: "Арнаны тазалау және пломба", ky: "Каналды тазалоо жана пломба", tg: "Тозакунии канал ва пломба", tk: "Kanal arassalamak we plomba" },
  "narxi (so'm)": { ru: "Цена (сум)", en: "Price (UZS)", kk: "Бағасы (сум)", ky: "Баасы (сум)", tg: "Нарх (сӯм)", tk: "Bahasy (som)" },
  "chegirma": { ru: "Скидка", en: "Discount", kk: "Жеңілдік", ky: "Арзандатуу", tg: "Тахфиф", tk: "Arzanlaşyk" },
  "yakuniy narx": { ru: "Итоговая цена", en: "Final price", kk: "Соңғы баға", ky: "Акыркы баа", tg: "Нархи ниҳоӣ", tk: "Jemleýji baha" },
  "foiz (%)": { ru: "Процент (%)", en: "Percent (%)", kk: "Пайыз (%)", ky: "Пайыз (%)", tg: "Фоиз (%)", tk: "Göterim (%)" },
  "summa (so'm)": { ru: "Сумма (сум)", en: "Amount (UZS)", kk: "Сома (сом)", ky: "Сумма (сом)", tg: "Маблағ (сӯм)", tk: "Möçber (som)" },
  "chegirma sababi": { ru: "Причина скидки", en: "Discount reason", kk: "Жеңілдік себебі", ky: "Арзандатуу себеби", tg: "Сабаби тахфиф", tk: "Arzanlaşyk sebäbi" },
  "to'langan · qarz": { ru: "Оплачено · Долг", en: "Paid · Debt", kk: "Төленген · Қарыз", ky: "Төлөнгөн · Карыз", tg: "Пардохт · Қарз", tk: "Tölenen · Bergi" },
  "hisob-kitob sinxronlanmagan": { ru: "Расчёт не синхронизирован", en: "Billing not synced", kk: "Есеп синхрондалмаған", ky: "Эсеп синхрондалган эмес", tg: "Ҳисоб ҳамоҳанг нашуд", tk: "Hasap sinhronlaşdyrylmady" },
};


import { STANDARD_SERVICES_CATALOG } from './DirectorDashboard';

export interface TreatmentItem {
  id: string;
  toothId: string;
  treatment: string;
  price: number;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  doctorName: string;
  createdAt: string;
}

interface TreatmentPlanProps {
  patientId: string;
  language?: Language;
  clinicId?: string;
  doctorId?: string;
  patientName?: string;
  staffToken?: string | null;
}

export default function TreatmentPlan({ patientId, language, clinicId, doctorId, patientName, staffToken }: TreatmentPlanProps) {
  const t = createTranslator(language, PLAN_TRANSLATIONS);
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [charges, setCharges] = useState<TreatmentCharge[]>([]);
  const [unsyncedIds, setUnsyncedIds] = useState<Set<string>>(new Set());
  const [newDiscountPercent, setNewDiscountPercent] = useState(0);
  const [newDiscountAmount, setNewDiscountAmount] = useState(0);
  const [newDiscountReason, setNewDiscountReason] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState(0);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [newItem, setNewItem] = useState<Partial<TreatmentItem>>({
    toothId: '',
    treatment: '',
    price: 0,
    status: 'Planned',
    doctorName: 'Dr. Karimov'
  });

  useEffect(() => {
    if (!patientId) return;
    const unsub = onSnapshot(
      collection(db, `patients/${patientId}/treatmentPlans`),
      (snapshot) => {
        const data: TreatmentItem[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as TreatmentItem);
        });
        // Sort by createdAt desc
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `patients/${patientId}/treatmentPlans`);
      }
    );
    return () => unsub();
  }, [patientId]);

  const handleSave = async () => {
    if (!newItem.treatment) return;
    try {
      const id = Date.now().toString();
      const listPrice = Number(newItem.price) || 0;
      const item: TreatmentItem = {
        id,
        toothId: newItem.toothId || '-',
        treatment: newItem.treatment,
        // The plan doc stores the LIST price; the discount lives on the charge,
        // which is authoritative for money once it exists.
        price: listPrice,
        status: newItem.status as any || 'Planned',
        doctorName: newItem.doctorName || "Dr. Noma'lum",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, `patients/${patientId}/treatmentPlans`, id), item);

      if (clinicId && doctorId && staffToken) {
        const saved = await saveTreatmentChargeApi({
          id,
          clinicId, patientId, doctorId, patientName,
          treatmentName: item.treatment,
          toothId: item.toothId,
          listPrice,
          discountPercent: Number(newDiscountPercent) || 0,
          discountAmount: Number(newDiscountAmount) || 0,
          discountReason: newDiscountReason || undefined,
        }, staffToken);
        if (saved) setCharges(prev => [...prev.filter(c => c.id !== saved.id), saved]);
        // A failed charge write leaves the treatment recorded but unbilled, so
        // flag it rather than letting it disappear silently.
        else setUnsyncedIds(prev => new Set(prev).add(id));
      }

      setShowAdd(false);
      setNewItem({ toothId: '', treatment: '', price: 0, status: 'Planned', doctorName: 'Dr. Karimov' });
      setNewDiscountPercent(0);
      setNewDiscountAmount(0);
      setNewDiscountReason('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/treatmentPlans`);
    }
  };

  /** Retry a charge that failed to save when its treatment was created. */
  const retryChargeSync = async (item: TreatmentItem) => {
    if (!clinicId || !doctorId || !staffToken) return;
    const saved = await saveTreatmentChargeApi({
      id: item.id,
      clinicId, patientId, doctorId, patientName,
      treatmentName: item.treatment,
      toothId: item.toothId,
      listPrice: Number(item.price) || 0,
    }, staffToken);
    if (saved) {
      setCharges(prev => [...prev.filter(c => c.id !== saved.id), saved]);
      setUnsyncedIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
    }
  };

  const handleUpdateStatus = async (id: string, status: TreatmentItem['status']) => {
    try {
      await updateDoc(doc(db, `patients/${patientId}/treatmentPlans`, id), { status });
      // A cancelled treatment stops being owed.
      if (status === 'Cancelled' && staffToken) {
        await voidTreatmentCharge(id, staffToken);
        setCharges(prev => prev.map(c => c.id === id ? { ...c, status: 'void' } : c));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/treatmentPlans`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, `patients/${patientId}/treatmentPlans`, id));
      // Without this the deleted work keeps counting toward the patient's debt.
      if (staffToken) {
        await voidTreatmentCharge(id, staffToken);
        setCharges(prev => prev.map(c => c.id === id ? { ...c, status: 'void' } : c));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/treatmentPlans`);
    }
  };

  // Payments and charges for this patient. Both degrade gracefully: without a
  // staff token (or before the ledger exists) these stay empty and every
  // treatment simply reads as fully outstanding at its plan price.
  useEffect(() => {
    if (!patientId || !staffToken) return;
    let active = true;
    const headers = { Authorization: `Bearer ${staffToken}` };
    const q = encodeURIComponent(String(patientId));
    fetch(`${getApiUrl()}/api/payment-receipts?patientId=${q}`, { headers })
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (active) setReceipts(Array.isArray(d) ? d : []); })
      .catch(() => { if (active) setReceipts([]); });
    fetch(`${getApiUrl()}/api/treatment-charges?patientId=${q}`, { headers })
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (active) setCharges(Array.isArray(d) ? d : []); })
      .catch(() => { if (active) setCharges([]); });
    return () => { active = false; };
  }, [patientId, staffToken]);

  const activeItems = items.filter(i => i.status !== 'Cancelled');
  // All money comes from the shared billing util — the old code treated
  // "procedure completed" as "money received", which is a different thing.
  const balance = useMemo(
    () => patientBalance(items, charges, receipts, { clinicId, patientId, doctorId, patientName }),
    [items, charges, receipts, clinicId, patientId, doctorId, patientName]
  );
  const totalCost = balance.total;
  const paidCost = balance.paid;
  const progressPercent = activeItems.length > 0
    ? Math.round((activeItems.filter(i => i.status === 'Completed').length / activeItems.length) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'In Progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Planned': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Cancelled': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const handleTelegramShare = () => {
    const lines = items.map(i => {
      const b = itemBalance(i.id, balance.ledger);
      const price = (b.total || i.price).toLocaleString();
      const owed = b.debt > 0 ? ` — qarz ${b.debt.toLocaleString()} so'm` : ' — to\'langan';
      return `🦷 Tish ${i.toothId}: ${i.treatment} - ${price} so'm [${i.status}]${owed}`;
    });
    const discountLine = balance.discount > 0 ? `\n🏷 *Chegirma:* ${balance.discount.toLocaleString()} so'm` : '';
    const text = `*Davolash Rejasi*\n\n${lines.join('\n')}\n\n💰 *Umumiy summa:* ${totalCost.toLocaleString()} so'm${discountLine}\n✅ *To'langan:* ${paidCost.toLocaleString()} so'm\n⏳ *Qarz:* ${balance.debt.toLocaleString()} so'm`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent('DStoma Klinikasi')}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#020712] rounded-3xl p-6 text-slate-300 font-sans border border-slate-800" id="treatment-plan-container">
      
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 print:hidden">
        <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                {t("Davolash rejasi")}
              </h3>
              <p className="text-sm text-slate-500">{t("Bemorning kompleks davolash bosqichlari")}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleTelegramShare} className="p-2 bg-[#111827] hover:bg-[#1f2937] text-indigo-400 rounded-lg border border-slate-800 transition-colors tooltip" title={t("Telegram orqali yuborish")}>
                <Send className="w-4 h-4" />
              </button>
              <button onClick={handlePrint} className="p-2 bg-[#111827] hover:bg-[#1f2937] text-rose-400 rounded-lg border border-slate-800 transition-colors tooltip" title={t("Chop etish / PDF")}>
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" /> {t("Yangi muolaja")}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2 flex justify-between items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Umumiy progress")}</span>
            <span className="text-2xl font-black text-white">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full bg-[#111827] rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
               <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="w-full lg:w-[350px] bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t("Moliyaviy hisobot")}</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{t("Umumiy summa:")}</span>
                <span className="text-lg font-bold text-white">{totalCost.toLocaleString()} {t("so'm")}</span>
              </div>
              {balance.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{t("Chegirma:")}</span>
                  <span className="text-lg font-bold text-violet-400">−{balance.discount.toLocaleString()} {t("so'm")}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{t("To'langan:")}</span>
                <span className="text-lg font-bold text-emerald-400">{paidCost.toLocaleString()} {t("so'm")}</span>
              </div>
              {balance.pending > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{t("Tasdiqlanmagan:")}</span>
                  <span className="text-lg font-bold text-amber-300">{balance.pending.toLocaleString()} {t("so'm")}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-sm text-slate-400">{t("Qarz:")}</span>
            <span className={`text-xl font-black ${balance.debt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{balance.debt.toLocaleString()} {t("so'm")}</span>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-6 flex items-start gap-4">
        <div className="p-3 bg-indigo-500/20 rounded-xl">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-300 mb-1">{t("AI Tavsiyasi")}</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            {t("Bemor tarixiga asoslanib, avval muammoli tishlardagi kariesni davolash, so'ngra implant o'rnatish bosqichiga o'tish tavsiya etiladi. Davolash davomiyligi taxminan 3-4 hafta.")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#111827] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Tish")}</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Muolaja")}</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Narx")}</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Chegirma")}</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("To'langan · Qarz")}</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Shifokor")}</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Sana")}</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">{t("Holat")}</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">{t("Amal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.length > 0 ? items.map((item) => {
                const b = itemBalance(item.id, balance.ledger);
                const unsynced = unsyncedIds.has(item.id);
                return (
                <tr key={item.id} className="hover:bg-[#111827]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 font-bold text-xs">
                      {item.toothId}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {item.treatment}
                    {unsynced && (
                      <button
                        onClick={() => retryChargeSync(item)}
                        title={t("Hisob-kitob sinxronlanmagan")}
                        className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold"
                      >
                        ⚠ {t("Hisob-kitob sinxronlanmagan")}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-300">{(b.listPrice || item.price).toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-violet-400">
                    {b.discount > 0 ? `−${b.discount.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <span className="text-emerald-400">{b.paid.toLocaleString()}</span>
                    <span className="text-slate-600"> · </span>
                    <span className={b.debt > 0 ? 'text-amber-400' : 'text-slate-500'}>{b.debt.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-4 h-4" /> {item.doctorName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                        className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border outline-none transition-all ${getStatusColor(item.status)}`}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                      >
                        <option value="Planned" className="bg-[#111827] text-amber-400">{t("Rejalashtirilgan")}</option>
                        <option value="In Progress" className="bg-[#111827] text-blue-400">{t("Jarayonda")}</option>
                        <option value="Completed" className="bg-[#111827] text-emerald-400">{t("Bajarildi")}</option>
                        <option value="Cancelled" className="bg-[#111827] text-rose-400">{t("Bekor qilindi")}</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title={t("O'chirish")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    Muolaja rejasi hozircha bo'sh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{t("Yangi muolaja qo'shish")}</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Tish raqami (FDI)")}</label>
                  <input 
                    type="text" 
                    placeholder={t("Masalan: 36")}
                    value={newItem.toothId}
                    onChange={e => setNewItem({...newItem, toothId: e.target.value})}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Holati")}</label>
                  <select 
                    value={newItem.status}
                    onChange={e => setNewItem({...newItem, status: e.target.value as any})}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="Planned">{t("Rejalashtirilgan")}</option>
                    <option value="In Progress">{t("Jarayonda")}</option>
                    <option value="Completed">{t("Bajarildi")}</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-400">{t("Muolaja Katalogi")}</label>
                </div>
                <div className="bg-[#111827] border border-slate-700 rounded-xl p-3">
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder={t("Katalogdan qidirish...")}
                      value={catalogSearchQuery}
                      onChange={(e) => setCatalogSearchQuery(e.target.value)}
                      className="w-full bg-[#1f2937] border border-slate-700 text-xs font-bold text-slate-100 rounded-lg pl-8 pr-3 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {!catalogSearchQuery && (
                    <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-700 mb-2">
                      {STANDARD_SERVICES_CATALOG.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCatalogCategory(idx)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                            selectedCatalogCategory === idx
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-[#1f2937] border-slate-700 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          {cat.categoryNameUz}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {(() => {
                      const results: { name: string; price: number; category: string }[] = [];
                      STANDARD_SERVICES_CATALOG.forEach(cat => {
                        cat.items.forEach(itm => {
                          const matchesSearch = !catalogSearchQuery || itm.name.toLowerCase().includes(catalogSearchQuery.toLowerCase());
                          const matchesCategory = catalogSearchQuery || STANDARD_SERVICES_CATALOG.indexOf(cat) === selectedCatalogCategory;
                          if (matchesSearch && matchesCategory) {
                            results.push({ ...itm, category: cat.categoryNameUz });
                          }
                        });
                      });

                      if (results.length === 0) {
                        return <div className="py-4 text-center text-xs font-bold text-slate-500">{t("Katalogda xizmat topilmadi")}</div>;
                      }

                      return results.map((item, idX) => (
                        <button
                          key={idX}
                          type="button"
                          onClick={() => setNewItem({...newItem, treatment: item.name, price: item.price})}
                          className={`text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 ${
                            newItem.treatment === item.name
                              ? 'bg-[#1e2f50] border-emerald-500'
                              : 'bg-[#1f2937] border-slate-700 hover:border-emerald-500/50'
                          }`}
                        >
                          <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">{item.category}</span>
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-bold text-slate-100">{item.name}</span>
                            <span className="text-xs font-black text-emerald-400">{item.price.toLocaleString()} {t("so'm")}</span>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Muolaja nomi (Maxsus)")}</label>
                <input 
                  type="text" 
                  placeholder={t("Kanal tozalash va plomba")}
                  value={newItem.treatment}
                  onChange={e => setNewItem({...newItem, treatment: e.target.value})}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Narxi (so'm)")}</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newItem.price || ''}
                  onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Both discount kinds: a percentage, and a flat sum applied after
                  it. Previously the percentage was multiplied into the price and
                  then thrown away, so nothing could report on it later. */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300">{t("Chegirma")}</span>
                  <span className="text-xs font-black text-emerald-400">
                    {t("Yakuniy narx")}: {effectivePrice({
                      listPrice: Number(newItem.price) || 0,
                      discountPercent: Number(newDiscountPercent) || 0,
                      discountAmount: Number(newDiscountAmount) || 0,
                    }).toLocaleString()} {t("so'm")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{t("Foiz (%)")}</label>
                    <input
                      type="number" min="0" max="100" placeholder="0"
                      value={newDiscountPercent || ''}
                      onChange={e => setNewDiscountPercent(Number(e.target.value))}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{t("Summa (so'm)")}</label>
                    <input
                      type="number" min="0" placeholder="0"
                      value={newDiscountAmount || ''}
                      onChange={e => setNewDiscountAmount(Number(e.target.value))}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
                {(newDiscountPercent > 0 || newDiscountAmount > 0) && (
                  <input
                    type="text"
                    placeholder={t("Chegirma sababi")}
                    value={newDiscountReason}
                    onChange={e => setNewDiscountReason(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Shifokor")}</label>
                <input 
                  type="text" 
                  value={newItem.doctorName}
                  onChange={e => setNewItem({...newItem, doctorName: e.target.value})}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  disabled={!newItem.treatment}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
