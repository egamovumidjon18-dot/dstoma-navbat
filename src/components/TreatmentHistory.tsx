import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../services/firebase';
import { TreatmentItem } from './TreatmentPlan';
import { getApiUrl } from '../services/api';
import type { PaymentReceipt, TreatmentCharge } from '../types';
import { patientBalance, itemBalance } from '../utils/treatmentBilling';
import { exportTreatmentListPdf, exportTreatmentRecordPdf } from '../utils/pdfExport';
import {
  History, Calendar, User, FileText, Download, Filter,
  Search, Clock, LayoutList, List, AlertTriangle, Activity,
  ChevronRight, ImageIcon, Camera, Link as LinkIcon, Check
} from 'lucide-react';
import { Language } from '../translations';
import { createTranslator, Dict } from '../utils/translate';

const HISTORY_TRANSLATIONS: Dict = {
  "muolaja tarixi": { ru: "История лечения", en: "Treatment history", kk: "Емдеу тарихы", ky: "Дарылоо тарыхы", tg: "Таърихи муолиҷа", tk: "Bejergi taryhy" },
  "taymlayn": { ru: "Таймлайн", en: "Timeline", kk: "Таймлайн", ky: "Таймлайн", tg: "Хатти вақт", tk: "Wagt çyzgysy" },
  "jadval": { ru: "Таблица", en: "Table", kk: "Кесте", ky: "Таблица", tg: "Ҷадвал", tk: "Tablisa" },
  "pdf yuklash": { ru: "Скачать PDF", en: "Download PDF", kk: "PDF жүктеу", ky: "PDF жүктөө", tg: "Боргирии PDF", tk: "PDF ýükle" },

  "bemorning to'liq davolash tarixi va arxivi": { ru: "Полная история лечения и архив пациента", en: "Patient's full treatment history and archive", kk: "Пациенттің толық емдеу тарихы мен мұрағаты", ky: "Бейтаптын толук дарылоо тарыхы жана архиви", tg: "Таърихи пурраи табобат ва бойгонии бемор", tk: "Näsagyň doly bejergi taryhy we arhiwi" },
  "muolaja yoki tish raqamini izlash...": { ru: "Поиск по процедуре или номеру зуба...", en: "Search by procedure or tooth number...", kk: "Процедура немесе тіс нөмірі бойынша іздеу...", ky: "Процедура же тиш номери боюнча издөө...", tg: "Ҷустуҷӯ аз рӯи муолиҷа ё рақами дандон...", tk: "Prosedura ýa-da diş belgisi boýunça gözleg..." },
  "barcha shifokorlar": { ru: "Все врачи", en: "All doctors", kk: "Барлық дәрігерлер", ky: "Бардык дарыгерлер", tg: "Ҳамаи духтурон", tk: "Ähli lukmanlar" },
  "muolaja tarixi topilmadi yoki hali shakllanmagan.": { ru: "История процедур не найдена или еще не сформирована.", en: "No treatment history found, or none recorded yet.", kk: "Процедура тарихы табылмады немесе әлі қалыптаспаған.", ky: "Процедура тарыхы табылган жок же азырынча түзүлгөн эмес.", tg: "Таърихи муолиҷа ёфт нашуд ё ҳанӯз ташаккул наёфтааст.", tk: "Prosedura taryhy tapylmady ýa-da heniz emele gelmedi." },
  "bajarildi": { ru: "Выполнено", en: "Completed", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷро шуд", tk: "Ýerine ýetirildi" },
  "tish:": { ru: "Зуб:", en: "Tooth:", kk: "Тіс:", ky: "Тиш:", tg: "Дандон:", tk: "Diş:" },
  "sana": { ru: "Дата", en: "Date", kk: "Күні", ky: "Күнү", tg: "Сана", tk: "Sene" },
  "tish": { ru: "Зуб", en: "Tooth", kk: "Тіс", ky: "Тиш", tg: "Дандон", tk: "Diş" },
  "muolaja turi": { ru: "Тип процедуры", en: "Procedure type", kk: "Процедура түрі", ky: "Процедура түрү", tg: "Навъи муолиҷа", tk: "Prosedura görnüşi" },
  "shifokor": { ru: "Врач", en: "Doctor", kk: "Дәрігер", ky: "Дарыгер", tg: "Духтур", tk: "Lukman" },
  "narx": { ru: "Цена", en: "Price", kk: "Бағасы", ky: "Баасы", tg: "Нарх", tk: "Bahasy" },
  "amal": { ru: "Действие", en: "Action", kk: "Әрекет", ky: "Аракет", tg: "Амал", tk: "Amal" },
  "tish raqami": { ru: "Номер зуба", en: "Tooth number", kk: "Тіс нөмірі", ky: "Тиш номери", tg: "Рақами дандон", tk: "Diş belgisi" },
  "takroriy muolaja ogohlantirishi": { ru: "Предупреждение о повторной процедуре", en: "Repeat procedure warning", kk: "Қайталанатын процедура туралы ескерту", ky: "Кайталануучу процедура эскертүүсү", tg: "Огоҳии муолиҷаи такрорӣ", tk: "Gaýtalanýan prosedura duýduryşy" },
  "bog'langan rentgen": { ru: "Связанный рентген", en: "Linked X-ray", kk: "Байланысты рентген", ky: "Байланышкан рентген", tg: "Рентгени алоқаманд", tk: "Baglanyşykly rentgen" },
  "dental chart": { ru: "Зубная карта", en: "Dental chart", kk: "Тіс картасы", ky: "Тиш картасы", tg: "Харитаи дандон", tk: "Diş kartasy" },
  "foto galereya": { ru: "Фотогалерея", en: "Photo gallery", kk: "Фотогалерея", ky: "Фотогалерея", tg: "Галереяи аксҳо", tk: "Foto galereýa" },
  "xizmat narxi": { ru: "Стоимость услуги", en: "Service price", kk: "Қызмет құны", ky: "Кызмат наркы", tg: "Арзиши хизмат", tk: "Hyzmat bahasy" },
  "materiallar": { ru: "Материалы", en: "Materials", kk: "Материалдар", ky: "Материалдар", tg: "Маводҳо", tk: "Materiallar" },
  "chegirma": { ru: "Скидка", en: "Discount", kk: "Жеңілдік", ky: "Арзандатуу", tg: "Тахфиф", tk: "Arzanladyş" },
  "jami to'langan:": { ru: "Всего оплачено:", en: "Total paid:", kk: "Барлығы төленді:", ky: "Жалпы төлөндү:", tg: "Ҳамагӣ пардохта шуд:", tk: "Jemi tölendi:" },
  "to'lash uchun": { ru: "К оплате", en: "Payable", kk: "Төлеуге", ky: "Төлөөгө", tg: "Барои пардохт", tk: "Tölemek üçin" },
  "qarz": { ru: "Долг", en: "Debt", kk: "Қарыз", ky: "Карыз", tg: "Қарз", tk: "Bergi" },
};



export default function TreatmentHistory({ patientId, patientName, language, staffToken }: { patientId: string; patientName?: string; language?: Language; staffToken?: string | null }) {
  const t = createTranslator(language, HISTORY_TRANSLATIONS);
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [charges, setCharges] = useState<TreatmentCharge[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('All');
  
  const [selectedRecord, setSelectedRecord] = useState<TreatmentItem | null>(null);

  useEffect(() => {
    if (!patientId) return;
    const unsub = onSnapshot(
      collection(db, `patients/${patientId}/treatmentPlans`),
      (snapshot) => {
        const data: TreatmentItem[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as TreatmentItem);
        });
        
        // Filter only completed or history-relevant items, sort by date
        const history = data.filter(i => i.status === 'Completed').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(history);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `patients/${patientId}/treatmentPlans`)
    );
    return () => unsub();
  }, [patientId]);

  // Charges and payments so the receipt panel can show the real discount and the
  // real amount paid, instead of the hardcoded zeros it used to print.
  useEffect(() => {
    if (!patientId || !staffToken) return;
    let active = true;
    const headers = { Authorization: `Bearer ${staffToken}` };
    const q = encodeURIComponent(patientId);
    fetch(`${getApiUrl()}/api/treatment-charges?patientId=${q}`, { headers })
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (active) setCharges(Array.isArray(d) ? d : []); })
      .catch(() => { if (active) setCharges([]); });
    fetch(`${getApiUrl()}/api/payment-receipts?patientId=${q}`, { headers })
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (active) setReceipts(Array.isArray(d) ? d : []); })
      .catch(() => { if (active) setReceipts([]); });
    return () => { active = false; };
  }, [patientId, staffToken]);

  const billing = useMemo(
    () => patientBalance(items, charges, receipts, { patientId }),
    [items, charges, receipts, patientId]
  );
  const selectedBalance = selectedRecord ? itemBalance(selectedRecord.id, billing.ledger) : null;

  const doctors = Array.from(new Set(items.map(i => i.doctorName)));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.treatment.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.toothId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDoctor = filterDoctor === 'All' || item.doctorName === filterDoctor;
    return matchesSearch && matchesDoctor;
  });

  // Warning system for repeated treatments on the same tooth within 6 months
  const checkWarnings = (toothId: string, currentItemDate: string) => {
    if (!toothId || toothId === '-') return false;
    const currentDate = new Date(currentItemDate).getTime();
    const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
    
    return items.some(item => 
      item.toothId === toothId && 
      item.id !== selectedRecord?.id &&
      new Date(item.createdAt).getTime() < currentDate &&
      (currentDate - new Date(item.createdAt).getTime()) < sixMonthsMs
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#020712] rounded-3xl p-6 text-slate-300 font-sans border border-slate-800">
      
      {!selectedRecord ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" /> {t("Muolaja tarixi")}
              </h3>
              <p className="text-sm text-slate-500">{t("Bemorning to'liq davolash tarixi va arxivi")}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-[#0a0f1d] rounded-xl border border-slate-800 p-1">
                <button 
                  onClick={() => setViewMode('timeline')}
                  className={`p-2 flex items-center gap-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'timeline' ? 'bg-[#111827] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Clock className="w-4 h-4" /> {t("Taymlayn")}
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-2 flex items-center gap-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'table' ? 'bg-[#111827] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <LayoutList className="w-4 h-4" /> {t("Jadval")}
                </button>
              </div>

              <div className="h-8 w-px bg-slate-800 hidden md:block"></div>

              <button
                onClick={() => exportTreatmentListPdf(patientName, filteredItems)}
                disabled={filteredItems.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white border border-slate-800 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> {t("PDF Yuklash")}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 bg-[#0a0f1d] p-4 rounded-2xl border border-slate-800">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder={t("Muolaja yoki tish raqamini izlash...")} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
            <div className="min-w-[150px] relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select 
                value={filterDoctor}
                onChange={e => setFilterDoctor(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none transition-colors appearance-none"
              >
                <option value="All">{t("Barcha shifokorlar")}</option>
                {doctors.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-[#0a0f1d] rounded-2xl border border-dashed border-slate-800 p-8">
                <History className="w-12 h-12 mb-4 text-slate-700" />
                <p>{t("Muolaja tarixi topilmadi yoki hali shakllanmagan.")}</p>
              </div>
            ) : viewMode === 'timeline' ? (
              <div className="relative pl-6 md:pl-8 py-4 space-y-8 before:absolute before:inset-0 before:ml-[2.25rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                {filteredItems.map((item, index) => {
                  const hasWarning = checkWarnings(item.toothId, item.createdAt);
                  return (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Marker */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#020712] bg-[#0a0f1d] text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                        {hasWarning ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <Check className="w-4 h-4 text-emerald-500" />}
                      </div>
                      
                      {/* Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-[#0a0f1d] p-5 rounded-2xl border border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer" onClick={() => setSelectedRecord(item)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{t("Bajarildi")}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-2">{item.treatment}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1.5 bg-[#111827] px-2 py-1 rounded-lg">
                            <span className="text-emerald-500 font-bold">{t("Tish:")}</span>
                            <span className="text-white font-mono">{item.toothId}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" /> {item.doctorName}
                          </div>
                        </div>
                        {hasWarning && (
                          <div className="mt-3 text-xs text-amber-400 flex items-center gap-1.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> O'tgan 6 oy ichida ushbu tishda muolaja qilingan.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#111827] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Sana")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Tish")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Muolaja turi")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Shifokor")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("Narx")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">{t("Amal")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-[#111827]/50 transition-colors cursor-pointer" onClick={() => setSelectedRecord(item)}>
                        <td className="px-6 py-4 text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 font-bold text-xs">
                            {item.toothId}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-white">
                          {item.treatment}
                          {checkWarnings(item.toothId, item.createdAt) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline-block ml-2" />}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{item.doctorName}</td>
                        <td className="px-6 py-4 font-mono text-slate-300">{item.price.toLocaleString()} so'm</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-emerald-500 hover:text-emerald-400 text-sm font-bold flex items-center justify-end gap-1 w-full">
                            Batafsil <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Detail View */
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setSelectedRecord(null)}
              className="p-2 hover:bg-[#111827] rounded-xl transition-colors border border-transparent hover:border-slate-800"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Muolaja tafsilotlari
              </h3>
              <p className="text-sm text-slate-500">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
                Bajarilgan
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Info */}
            <div className="flex-1 space-y-6">
              <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Muolaja turi")}</span>
                    <p className="text-lg font-bold text-white">{selectedRecord.treatment}</p>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Shifokor")}</span>
                    <p className="text-base text-slate-300 flex items-center gap-2"><User className="w-4 h-4" /> {selectedRecord.doctorName}</p>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Tish raqami")}</span>
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#111827] border border-slate-700 text-emerald-400 font-bold text-lg shadow-inner">
                      {selectedRecord.toothId}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Narx")}</span>
                    <p className="text-lg font-mono text-emerald-400 font-bold">{selectedRecord.price.toLocaleString()} so'm</p>
                  </div>
                </div>

                {checkWarnings(selectedRecord.toothId, selectedRecord.createdAt) && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <h5 className="text-sm font-bold text-amber-400 mb-1">{t("Takroriy muolaja ogohlantirishi")}</h5>
                      <p className="text-xs text-amber-500/80">
                        Ushbu tishda so'nggi 6 oy ichida boshqa muolajalar ham bajarilgan. Bu holat tishning surunkali muammosini ko'rsatishi mumkin.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Linked Data Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><ImageIcon className="w-4 h-4" /></div>
                      <h5 className="font-bold text-white text-sm">{t("Bog'langan Rentgen")}</h5>
                    </div>
                    <LinkIcon className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500">Ushbu sana bo'yicha 1 ta OPG rentgen tasviri topildi.</p>
                </div>

                <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Activity className="w-4 h-4" /></div>
                      <h5 className="font-bold text-white text-sm">{t("Dental Chart")}</h5>
                    </div>
                    <LinkIcon className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500">Tish holati: {selectedRecord.treatment.includes('Plomba') ? 'Plomba qilingan' : 'Kanal davolangan'}</p>
                </div>

                <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><Camera className="w-4 h-4" /></div>
                      <h5 className="font-bold text-white text-sm">{t("Foto Galereya")}</h5>
                    </div>
                    <LinkIcon className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500">Jarayon davomida olingan 2 ta fotosurat.</p>
                </div>
              </div>
            </div>

            {/* Receipt Summary */}
            <div className="w-full lg:w-[350px]">
              <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 sticky top-6">
                 <h4 className="font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                   <FileText className="w-4 h-4 text-emerald-500" /> Kvitansiya
                 </h4>
                 
                 <div className="space-y-4 mb-6">
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-400">{t("Xizmat narxi")}</span>
                     <span className="text-white font-mono">{(selectedBalance?.listPrice || selectedRecord.price).toLocaleString()}</span>
                   </div>
                   {!!selectedBalance?.discount && (
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-400">{t("Chegirma")}</span>
                       <span className="text-violet-400 font-mono">−{selectedBalance.discount.toLocaleString()}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-400">{t("To'lash uchun")}</span>
                     <span className="text-white font-mono">{(selectedBalance?.total ?? selectedRecord.price).toLocaleString()}</span>
                   </div>
                 </div>

                 <div className="border-t border-slate-800 pt-4 mb-8 space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="font-bold text-slate-300">{t("Jami to'langan:")}</span>
                     <span className="font-black text-xl text-emerald-400 font-mono">{(selectedBalance?.paid ?? 0).toLocaleString()} so'm</span>
                   </div>
                   {!!selectedBalance?.debt && (
                     <div className="flex justify-between items-center">
                       <span className="font-bold text-slate-300">{t("Qarz")}</span>
                       <span className="font-black text-lg text-amber-400 font-mono">{selectedBalance.debt.toLocaleString()} so'm</span>
                     </div>
                   )}
                 </div>

                 <button
                   onClick={() => exportTreatmentRecordPdf(patientName, selectedRecord)}
                   className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                 >
                   <Download className="w-4 h-4" /> {t("PDF Yuklash")}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
