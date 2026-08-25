import React, { useMemo, useState } from 'react';
import { Wallet, CreditCard, TrendingDown, Tag, Layers, Users, ChevronRight } from 'lucide-react';
import type { PaymentReceipt, TreatmentCharge } from '../types';
import {
  clinicBillingSummary,
  effectivePrice,
  discountValue,
  normalizeStages,
  type ClinicPatientBalance,
} from '../utils/treatmentBilling';
import { Language } from '../translations';
import { createTranslator, Dict } from '../utils/translate';

const FINANCE_TRANSLATIONS: Dict = {
  "moliya": { ru: "Финансы", en: "Finance", kk: "Қаржы", ky: "Каржы", tg: "Молия", tk: "Maliýe" },
  "jami hisoblangan": { ru: "Всего начислено", en: "Total charged", kk: "Барлығы есептелген", ky: "Жалпы эсептелген", tg: "Ҳамагӣ ҳисоб шуд", tk: "Jemi hasaplanan" },
  "chegirma": { ru: "Скидка", en: "Discount", kk: "Жеңілдік", ky: "Арзандатуу", tg: "Тахфиф", tk: "Arzanlaşyk" },
  "to'langan": { ru: "Оплачено", en: "Paid", kk: "Төленген", ky: "Төлөнгөн", tg: "Пардохтшуда", tk: "Tölenen" },
  "qarz": { ru: "Долг", en: "Debt", kk: "Қарыз", ky: "Карыз", tg: "Қарз", tk: "Bergi" },
  "qarzdorlar": { ru: "Должники", en: "Debtors", kk: "Қарыздарлар", ky: "Карызкорлор", tg: "Қарздорон", tk: "Bergililer" },
  "to'langanlar": { ru: "Оплатившие", en: "Paid up", kk: "Төлегендер", ky: "Төлөгөндөр", tg: "Пардохткардагон", tk: "Tölänler" },
  "chegirmalar": { ru: "Скидки", en: "Discounts", kk: "Жеңілдіктер", ky: "Арзандатуулар", tg: "Тахфифҳо", tk: "Arzanlaşyklar" },
  "bosqichlar": { ru: "Этапы", en: "Stages", kk: "Кезеңдер", ky: "Этаптар", tg: "Марҳилаҳо", tk: "Tapgyrlar" },
  "bemor": { ru: "Пациент", en: "Patient", kk: "Пациент", ky: "Бейтап", tg: "Бемор", tk: "Näsag" },
  "muolaja": { ru: "Процедура", en: "Treatment", kk: "Емдеу", ky: "Дарылоо", tg: "Муолиҷа", tk: "Bejergi" },
  "jami": { ru: "Всего", en: "Total", kk: "Барлығы", ky: "Бардыгы", tg: "Ҳамагӣ", tk: "Jemi" },
  "so'm": { ru: "сум", en: "UZS", kk: "сом", ky: "сом", tg: "сӯм", tk: "som" },
  "hozircha ma'lumot yo'q": { ru: "Пока нет данных", en: "No data yet", kk: "Әзірге дерек жоқ", ky: "Азырынча маалымат жок", tg: "Ҳоло маълумот нест", tk: "Heniz maglumat ýok" },
  "bosqich": { ru: "Этап", en: "Stage", kk: "Кезең", ky: "Этап", tg: "Марҳила", tk: "Tapgyr" },
  "sana": { ru: "Дата", en: "Date", kk: "Күні", ky: "Күнү", tg: "Сана", tk: "Sene" },
  "holat": { ru: "Статус", en: "Status", kk: "Күйі", ky: "Абалы", tg: "Ҳолат", tk: "Ýagdaý" },
  "rejalashtirilgan": { ru: "Запланировано", en: "Planned", kk: "Жоспарланған", ky: "Пландаштырылган", tg: "Ба нақша гирифташуда", tk: "Meýilleşdirilen" },
  "jarayonda": { ru: "В процессе", en: "In progress", kk: "Орындалуда", ky: "Аткарылууда", tg: "Дар ҷараён", tk: "Dowam edýär" },
  "bajarildi": { ru: "Выполнено", en: "Completed", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷро шуд", tk: "Ýerine ýetirildi" },
  "o'tkazib yuborildi": { ru: "Пропущено", en: "Skipped", kk: "Өткізіп жіберілді", ky: "Өткөрүлүп жиберилди", tg: "Гузаронида шуд", tk: "Geçirildi" },
};

interface FinanceCenterProps {
  charges: TreatmentCharge[];
  receipts: PaymentReceipt[];
  patientNameById?: (patientId: string) => string | undefined;
  onSelectPatient?: (patientId: string) => void;
  language?: Language;
}

type Tab = 'debtors' | 'paid' | 'discounts' | 'stages';

const money = (n: number) => n.toLocaleString();

export default function FinanceCenter({
  charges, receipts, patientNameById, onSelectPatient, language,
}: FinanceCenterProps) {
  const t = createTranslator(language, FINANCE_TRANSLATIONS);
  const [tab, setTab] = useState<Tab>('debtors');

  const summary = useMemo(() => clinicBillingSummary(charges, receipts), [charges, receipts]);

  const nameOf = (entry: ClinicPatientBalance) =>
    patientNameById?.(entry.patientId) || entry.patientName || entry.patientId;

  const rows = useMemo(() => Array.from(summary.byPatient.values()), [summary]);
  const debtors = useMemo(() => rows.filter(r => r.debt > 0).sort((a, b) => b.debt - a.debt), [rows]);
  const paidUp = useMemo(() => rows.filter(r => r.debt <= 0 && r.paid > 0).sort((a, b) => b.paid - a.paid), [rows]);
  const discounted = useMemo(
    () => charges.filter(c => c.status !== 'void' && discountValue(c) > 0)
      .sort((a, b) => discountValue(b) - discountValue(a)),
    [charges]
  );
  const staged = useMemo(
    () => charges.filter(c => c.status !== 'void' && (c.stages?.length || 0) > 1),
    [charges]
  );

  const cards = [
    { label: t("jami hisoblangan"), value: summary.total, icon: Wallet, color: 'bg-slate-800' },
    { label: t("chegirma"), value: summary.discount, icon: Tag, color: 'bg-violet-600' },
    { label: t("to'langan"), value: summary.paid, icon: CreditCard, color: 'bg-emerald-600' },
    { label: t("qarz"), value: summary.debt, icon: TrendingDown, color: 'bg-rose-600' },
  ];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'debtors', label: t("qarzdorlar"), count: debtors.length },
    { id: 'paid', label: t("to'langanlar"), count: paidUp.length },
    { id: 'discounts', label: t("chegirmalar"), count: discounted.length },
    { id: 'stages', label: t("bosqichlar"), count: staged.length },
  ];

  const Empty = () => (
    <div className="py-12 text-center text-slate-400 text-sm font-medium">{t("hozircha ma'lumot yo'q")}</div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl text-white ${color}`}><Icon className="w-4 h-4" /></div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 leading-tight">{label}</span>
            </div>
            <p className="text-xl font-black text-slate-900 break-all">{money(value)}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t("so'm")}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-100">
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-3 text-xs font-black whitespace-nowrap transition-colors border-b-2 ${
                tab === id ? 'text-emerald-600 border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {label} <span className="ml-1 opacity-60">({count})</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {tab === 'debtors' && (debtors.length === 0 ? <Empty /> : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-black uppercase tracking-wider">{t("bemor")}</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-right">{t("jami")}</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-right">{t("to'langan")}</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-right">{t("qarz")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {debtors.map(entry => (
                  <tr
                    key={entry.patientId}
                    onClick={() => onSelectPatient?.(entry.patientId)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800">{nameOf(entry)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{money(entry.total)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{money(entry.paid)}</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-rose-600">{money(entry.debt)}</td>
                    <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          {tab === 'paid' && (paidUp.length === 0 ? <Empty /> : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-black uppercase tracking-wider">{t("bemor")}</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-right">{t("jami")}</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-right">{t("to'langan")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paidUp.map(entry => (
                  <tr
                    key={entry.patientId}
                    onClick={() => onSelectPatient?.(entry.patientId)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800">{nameOf(entry)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{money(entry.total)}</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-600">{money(entry.paid)}</td>
                    <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          {tab === 'discounts' && (discounted.length === 0 ? <Empty /> : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-black uppercase tracking-wider">{t("bemor")}</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider">{t("muolaja")}</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-right">{t("jami")}</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-right">{t("chegirma")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {discounted.map(charge => (
                  <tr
                    key={charge.id}
                    onClick={() => onSelectPatient?.(charge.patientId)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {patientNameById?.(charge.patientId) || charge.patientName || charge.patientId}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {charge.treatmentName || '—'}
                      {charge.discountReason && <span className="text-slate-400"> · {charge.discountReason}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{money(charge.listPrice)}</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-violet-600">
                      −{money(discountValue(charge))}
                      {!!charge.discountPercent && <span className="text-slate-400 font-normal"> ({charge.discountPercent}%)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          {tab === 'stages' && (staged.length === 0 ? <Empty /> : (
            <div className="divide-y divide-slate-50">
              {staged.map(charge => {
                const stages = normalizeStages(charge);
                const balance = summary.byPatient.get(charge.patientId)?.ledger.items.get(charge.id);
                return (
                  <div key={charge.id} className="p-4">
                    <div
                      onClick={() => onSelectPatient?.(charge.patientId)}
                      className="flex items-center justify-between mb-2.5 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-sm truncate">
                          {patientNameById?.(charge.patientId) || charge.patientName || charge.patientId}
                        </p>
                        <p className="text-[11px] text-slate-500 font-semibold truncate">{charge.treatmentName || '—'}</p>
                      </div>
                      <span className="text-xs font-mono font-black text-slate-700 shrink-0 ml-3">
                        {money(effectivePrice(charge))} {t("so'm")}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {stages.map((stage, i) => {
                        const sb = balance?.stages.find(s => s.stageId === stage.id);
                        return (
                          <div key={stage.id} className="flex items-center gap-2 text-[11px] bg-slate-50 rounded-lg px-3 py-2">
                            <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-700 truncate flex-1">
                              {stage.name || `${i + 1}-${t("bosqich")}`}
                            </span>
                            {stage.plannedDate && <span className="text-slate-400 shrink-0">{stage.plannedDate}</span>}
                            <span className="font-mono text-slate-600 shrink-0">{money(stage.amount)}</span>
                            {sb && (
                              <span className={`font-mono font-bold shrink-0 ${sb.debt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {sb.debt > 0 ? `−${money(sb.debt)}` : '✓'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
