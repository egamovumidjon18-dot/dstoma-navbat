import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search, Download, Star } from 'lucide-react';
import { QueueItem, Doctor, Service, Patient, PaymentReceipt, TreatmentCharge } from '../types';
import { createTranslator } from '../utils/translate';
import { Language, translateMedicalText } from '../translations';
import { decodeLegacyEntities } from '../utils/textFormat';
import { fetchTreatmentCharges } from '../utils/treatmentCharges';
import { getApiUrl } from '../services/api';
import { toDateKey } from '../utils/doctorSchedule';

const JOURNAL_TRANSLATIONS = {
  "qabullar jurnali": { ru: "Журнал приёмов", en: "Visits journal", kk: "Қабылдаулар журналы", ky: "Кабыл алуулар журналы", tg: "Журнали қабулҳо", tk: "Kabullar žurnaly" },
  "qaysi shifokor qaysi bemorni qachon qabul qilgan": { ru: "Какой врач когда принял какого пациента", en: "Which doctor saw which patient, and when", kk: "Қай дәрігер қай пациентті қашан қабылдады", ky: "Кайсы дарыгер кайсы бейтапты качан кабыл алган", tg: "Кадом духтур кадом беморро кай қабул кардааст", tk: "Haýsy lukman haýsy näsagy haçan kabul etdi" },
  bugun: { ru: "Сегодня", en: "Today", kk: "Бүгін", ky: "Бүгүн", tg: "Имрӯз", tk: "Şu gün" },
  hafta: { ru: "Неделя", en: "Week", kk: "Апта", ky: "Жума", tg: "Ҳафта", tk: "Hepde" },
  oy: { ru: "Месяц", en: "Month", kk: "Ай", ky: "Ай", tg: "Моҳ", tk: "Aý" },
  hammasi: { ru: "Всё время", en: "All time", kk: "Барлық уақыт", ky: "Бардык убакыт", tg: "Ҳама вақт", tk: "Ähli wagt" },
  oraliq: { ru: "Период", en: "Range", kk: "Аралық", ky: "Аралык", tg: "Фосила", tk: "Aralyk" },
  "barcha shifokorlar": { ru: "Все врачи", en: "All doctors", kk: "Барлық дәрігерлер", ky: "Бардык дарыгерлер", tg: "Ҳамаи духтурон", tk: "Ähli lukmanlar" },
  "barcha holatlar": { ru: "Все статусы", en: "All statuses", kk: "Барлық күйлер", ky: "Бардык абалдар", tg: "Ҳамаи ҳолатҳо", tk: "Ähli ýagdaýlar" },
  "bemor ismi yoki telefoni...": { ru: "Имя или телефон пациента...", en: "Patient name or phone...", kk: "Пациенттің аты немесе телефоны...", ky: "Бейтаптын аты же телефону...", tg: "Ном ё телефони бемор...", tk: "Näsagyň ady ýa-da telefony..." },
  bemor: { ru: "Пациент", en: "Patient", kk: "Пациент", ky: "Бейтап", tg: "Бемор", tk: "Näsag" },
  shifokor: { ru: "Врач", en: "Doctor", kk: "Дәрігер", ky: "Дарыгер", tg: "Духтур", tk: "Lukman" },
  muolaja: { ru: "Процедура", en: "Treatment", kk: "Процедура", ky: "Процедура", tg: "Муолиҷа", tk: "Bejergi" },
  holat: { ru: "Статус", en: "Status", kk: "Күйі", ky: "Абалы", tg: "Ҳолат", tk: "Ýagdaý" },
  vaqt: { ru: "Время", en: "Time", kk: "Уақыт", ky: "Убакыт", tg: "Вақт", tk: "Wagt" },
  narxi: { ru: "Цена", en: "Price", kk: "Бағасы", ky: "Баасы", tg: "Нарх", tk: "Bahasy" },
  "to'langan": { ru: "Оплачено", en: "Paid", kk: "Төленген", ky: "Төлөнгөн", tg: "Пардохтшуда", tk: "Tölenen" },
  "qabullar topilmadi": { ru: "Приёмы не найдены", en: "No visits found", kk: "Қабылдаулар табылмады", ky: "Кабыл алуулар табылган жок", tg: "Қабулҳо ёфт нашуданд", tk: "Kabullar tapylmady" },
  "ta qabul": { ru: "приёмов", en: "visits", kk: "қабылдау", ky: "кабыл алуу", tg: "қабул", tk: "kabul" },
  "csv yuklab olish": { ru: "Скачать CSV", en: "Download CSV", kk: "CSV жүктеу", ky: "CSV жүктөө", tg: "Боргирии CSV", tk: "CSV ýükle" },
  yakunlangan: { ru: "Завершён", en: "Completed", kk: "Аяқталды", ky: "Аяктады", tg: "Анҷомёфта", tk: "Tamamlandy" },
  rejalashtirilgan: { ru: "Запланирован", en: "Scheduled", kk: "Жоспарланған", ky: "Пландаштырылган", tg: "Ба нақша гирифташуда", tk: "Meýilleşdirilen" },
  kutilmoqda: { ru: "В ожидании", en: "Waiting", kk: "Күтуде", ky: "Күтүүдө", tg: "Дар интизор", tk: "Garaşylýar" },
  chaqirilmoqda: { ru: "Вызывается", en: "Calling", kk: "Шақырылуда", ky: "Чакырылууда", tg: "Даъват шуда истодааст", tk: "Çagyrylýar" },
  qabulda: { ru: "На приёме", en: "In progress", kk: "Қабылдауда", ky: "Кабылдоодо", tg: "Дар қабул", tk: "Kabulda" },
  "bekor qilingan": { ru: "Отменён", en: "Cancelled", kk: "Болдырылмады", ky: "Жокко чыгарылды", tg: "Бекор карда шуд", tk: "Ýatyryldy" },
  shikoyat: { ru: "Жалоба", en: "Complaint", kk: "Шағым", ky: "Арыз", tg: "Шикоят", tk: "Şikaýat" },
  "tibbiy izoh": { ru: "Медицинская заметка", en: "Medical note", kk: "Медициналық жазба", ky: "Медициналык жазуу", tg: "Қайди тиббӣ", tk: "Lukmançylyk belligi" },
  baho: { ru: "Оценка", en: "Rating", kk: "Бағасы", ky: "Баасы", tg: "Баҳо", tk: "Baha" },
  "bandlangan sana": { ru: "Дата записи", en: "Booked on", kk: "Жазылу күні", ky: "Жазылуу күнү", tg: "Санаи сабт", tk: "Ýazgy senesi" },
  "shifokorlar bo'yicha": { ru: "По врачам", en: "By doctor", kk: "Дәрігерлер бойынша", ky: "Дарыгерлер боюнча", tg: "Аз рӯи духтурон", tk: "Lukmanlar boýunça" },
  "yopish": { ru: "Закрыть", en: "Close", kk: "Жабу", ky: "Жабуу", tg: "Пӯшидан", tk: "Ýapmak" },
  "so'm": { ru: "сум", en: "UZS", kk: "сом", ky: "сом", tg: "сӯм", tk: "som" },
  "dan": { ru: "с", en: "from", kk: "бастап", ky: "баштап", tg: "аз", tk: "-dan" },
  "gacha": { ru: "по", en: "to", kk: "дейін", ky: "чейин", tg: "то", tk: "çenli" },
};

const STATUS_KEY: Record<QueueItem['status'], string> = {
  completed: 'yakunlangan',
  scheduled: 'rejalashtirilgan',
  pending: 'kutilmoqda',
  calling: 'chaqirilmoqda',
  in_progress: 'qabulda',
  cancelled: 'bekor qilingan',
};

const STATUS_STYLE: Record<QueueItem['status'], string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  calling: 'bg-violet-50 text-violet-700 border-violet-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
};

/**
 * When a visit actually happened, as the clinic means it.
 *
 * `createdAt` is when the ticket was *written*, which for an appointment booked
 * a fortnight ahead is the booking date, not the visit. The appointment slot is
 * the answer wherever there is one; a walk-in has none, and there `createdAt`
 * is the moment the patient turned up, so it is right after all.
 */
export function visitDateKey(q: QueueItem): string {
  if (q.appointmentDate) return q.appointmentDate;
  return q.createdAt ? toDateKey(new Date(q.createdAt)) : '';
}

function visitTime(q: QueueItem): string {
  if (q.appointmentTime) return q.appointmentTime;
  if (!q.createdAt) return '';
  const d = new Date(q.createdAt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface VisitsJournalProps {
  queues: QueueItem[];
  doctors: Doctor[];
  services: Service[];
  patients: Patient[];
  clinicId?: string;
  clinicName?: string;
  staffToken?: string | null;
  language?: Language;
}

export default function VisitsJournal({
  queues,
  doctors,
  services,
  patients,
  clinicId,
  clinicName,
  staffToken,
  language,
}: VisitsJournalProps) {
  const t = createTranslator(language, JOURNAL_TRANSLATIONS as any);
  const money = (n: number) => n.toLocaleString('uz-UZ').replace(/,/g, ' ');

  const [range, setRange] = useState<'bugun' | 'hafta' | 'oy' | 'hammasi' | 'oraliq'>('hafta');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | QueueItem['status']>('all');
  const [search, setSearch] = useState('');
  const [openRow, setOpenRow] = useState<string | null>(null);

  // The money side. Receipts carry the queueId of the visit they were taken at,
  // so "what did this visit bring in" is answerable exactly rather than
  // estimated; charges carry the stage booked against that same visit, which is
  // what it was actually worth after any discount.
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [charges, setCharges] = useState<TreatmentCharge[]>([]);
  useEffect(() => {
    if (!clinicId || !staffToken) return;
    let active = true;
    fetch(`${getApiUrl()}/api/payment-receipts?clinicId=${encodeURIComponent(clinicId)}`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (active) setReceipts(Array.isArray(d) ? d : []); })
      .catch(() => { if (active) setReceipts([]); });
    fetchTreatmentCharges({ clinicId }, staffToken).then((d) => { if (active) setCharges(d); });
    return () => { active = false; };
  }, [clinicId, staffToken]);

  const doctorName = (id: string) =>
    decodeLegacyEntities(doctors.find((d) => d.id === id)?.name) || '—';
  const serviceName = (id?: string) => {
    const raw = services.find((s) => s.id === id)?.name;
    return raw ? translateMedicalText(raw, language || 'uz') : '—';
  };

  // Paid per visit, straight off the receipts that name it.
  const paidByQueue = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of receipts) {
      if (!r.queueId || r.status !== 'confirmed') continue;
      map.set(r.queueId, (map.get(r.queueId) || 0) + (Number(r.amount) || 0));
    }
    return map;
  }, [receipts]);

  // What the visit is worth: the stage booked against it when the treatment was
  // split into stages, otherwise the whole (discounted) charge, otherwise the
  // service's list price — the same fallback the KPI cards use.
  const priceByQueue = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of charges) {
      const stages = c.stages || [];
      if (stages.length > 0) {
        for (const st of stages) {
          if (st.queueId) map.set(st.queueId, (map.get(st.queueId) || 0) + (Number(st.amount) || 0));
        }
      }
    }
    return map;
  }, [charges]);

  const rows = useMemo(() => {
    const today = toDateKey();
    let from = '';
    if (range === 'bugun') from = today;
    else if (range === 'hafta' || range === 'oy') {
      const d = new Date();
      d.setDate(d.getDate() - (range === 'hafta' ? 7 : 30));
      from = toDateKey(d);
    } else if (range === 'oraliq') from = fromDate;
    const to = range === 'oraliq' ? toDate : range === 'hammasi' ? '' : today;

    const needle = search.trim().toLowerCase();

    return queues
      .map((q) => {
        const dateKey = visitDateKey(q);
        return {
          q,
          dateKey,
          time: visitTime(q),
          doctor: doctorName(q.doctorId),
          patient: decodeLegacyEntities(q.patientName) || '—',
          // Older queue rows were written before patientPhone existed; the
          // patient record still has it, so the journal is not left with a
          // blank where a phone number plainly exists.
          phone: q.patientPhone || (q.patientId ? patients.find((p) => p.id === q.patientId)?.phone || '' : ''),
          service: serviceName(q.serviceId),
          price: priceByQueue.get(q.id) ?? (services.find((s) => s.id === q.serviceId)?.price || 0),
          paid: paidByQueue.get(q.id) || 0,
        };
      })
      .filter((r) => {
        if (!r.dateKey) return false;
        if (from && r.dateKey < from) return false;
        if (to && r.dateKey > to) return false;
        if (doctorFilter !== 'all' && r.q.doctorId !== doctorFilter) return false;
        if (statusFilter !== 'all' && r.q.status !== statusFilter) return false;
        if (needle) {
          const hay = `${r.patient} ${r.phone} ${r.service} ${r.doctor}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.dateKey + b.time).localeCompare(a.dateKey + a.time));
  }, [queues, doctors, services, patients, range, fromDate, toDate, doctorFilter, statusFilter, search, priceByQueue, paidByQueue, language]);

  // Day headers: "kim qachon" reads far better grouped by day than as a flat
  // list, and the per-day count is the number a director actually asks for.
  const days = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = map.get(r.dateKey);
      if (list) list.push(r);
      else map.set(r.dateKey, [r]);
    }
    return Array.from(map.entries());
  }, [rows]);

  // Per-doctor roll-up over exactly the rows on screen, so the strip and the
  // table can never describe different sets of visits.
  const byDoctor = useMemo(() => {
    const map = new Map<string, { id: string; name: string; total: number; done: number; paid: number }>();
    for (const r of rows) {
      const row = map.get(r.q.doctorId) || { id: r.q.doctorId, name: r.doctor, total: 0, done: 0, paid: 0 };
      row.total += 1;
      if (r.q.status === 'completed') row.done += 1;
      row.paid += r.paid;
      map.set(r.q.doctorId, row);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rows]);

  const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0);

  const exportCsv = () => {
    const header = ['Sana', 'Vaqt', 'Shifokor', 'Bemor', 'Telefon', 'Muolaja', 'Holat', 'Narxi', "To'langan"];
    const body = rows.map((r) => [
      r.dateKey, r.time, r.doctor, r.patient, r.phone, r.service,
      t(STATUS_KEY[r.q.status]), String(r.price), String(r.paid),
    ]);
    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qabullar_${clinicName || clinicId || 'klinika'}_${toDateKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rangeButtons: { id: typeof range; label: string }[] = [
    { id: 'bugun', label: t('bugun') },
    { id: 'hafta', label: t('hafta') },
    { id: 'oy', label: t('oy') },
    { id: 'hammasi', label: t('hammasi') },
    { id: 'oraliq', label: t('oraliq') },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-5 border-b border-slate-100 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              {t('qabullar jurnali')}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {t('qaysi shifokor qaysi bemorni qachon qabul qilgan')}
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 text-xs font-black transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('csv yuklab olish')}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {rangeButtons.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setRange(b.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                  range === b.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {range === 'oraliq' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium bg-white text-slate-800 outline-none focus:border-blue-500"
              />
              <span className="text-[11px] font-bold text-slate-400">—</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium bg-white text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          )}

          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold bg-white text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">{t('barcha shifokorlar')}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{decodeLegacyEntities(d.name)}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold bg-white text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">{t('barcha holatlar')}</option>
            {(Object.keys(STATUS_KEY) as QueueItem['status'][]).map((st) => (
              <option key={st} value={st}>{t(STATUS_KEY[st])}</option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('bemor ismi yoki telefoni...')}
              className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium bg-white text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Who saw how many, over exactly the period on screen. Tapping one
            narrows the table to that doctor rather than making the director
            scan for their rows. */}
        {byDoctor.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              {t("shifokorlar bo'yicha")} · {rows.length} {t('ta qabul')} · {money(totalPaid)} {t("so'm")}
            </p>
            <div className="flex flex-wrap gap-2">
              {byDoctor.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDoctorFilter(doctorFilter === d.id ? 'all' : d.id)}
                  className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                    doctorFilter === d.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <p className="text-[11px] font-black text-slate-700 truncate max-w-[170px]">{d.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {d.total} {t('ta qabul')} · {d.done} {t('yakunlangan').toLowerCase()}
                    {d.paid > 0 && <span className="text-emerald-600"> · {money(d.paid)}</span>}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm font-semibold text-slate-400">{t('qabullar topilmadi')}</p>
        ) : (
          days.map(([day, list]) => (
            <div key={day}>
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-slate-50 border-y border-slate-100 px-5 py-2">
                <span className="text-xs font-black text-slate-700">
                  {day.split('-').reverse().join('.')}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {list.length} {t('ta qabul')}
                </span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {list.map((r) => (
                    <React.Fragment key={r.q.id}>
                      <tr
                        onClick={() => setOpenRow(openRow === r.q.id ? null : r.q.id)}
                        className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="pl-5 pr-2 py-2.5 w-[62px] align-top">
                          <span className="text-xs font-black text-slate-700 font-mono">{r.time || '—'}</span>
                        </td>
                        <td className="px-2 py-2.5">
                          <p className="font-bold text-slate-800 truncate">{r.patient}</p>
                          {r.phone && <p className="text-[11px] text-slate-400 font-medium">{r.phone}</p>}
                        </td>
                        <td className="px-2 py-2.5 hidden md:table-cell">
                          <p className="text-xs font-bold text-slate-600 truncate">{r.doctor}</p>
                        </td>
                        <td className="px-2 py-2.5 hidden lg:table-cell">
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[220px]">{r.service}</p>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-block whitespace-nowrap text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.q.status]}`}>
                            {t(STATUS_KEY[r.q.status])}
                          </span>
                        </td>
                        <td className="pr-5 pl-2 py-2.5 text-right whitespace-nowrap">
                          {r.price > 0 && (
                            <p className="text-xs font-bold text-slate-600">{money(r.price)}</p>
                          )}
                          {r.paid > 0 && (
                            <p className="text-[11px] font-black text-emerald-600">+{money(r.paid)}</p>
                          )}
                        </td>
                      </tr>
                      {openRow === r.q.id && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="px-5 py-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <Detail label={t('shifokor')} value={r.doctor} />
                              <Detail label={t('muolaja')} value={r.service} />
                              <Detail
                                label={t('bandlangan sana')}
                                value={r.q.createdAt ? new Date(r.q.createdAt).toLocaleString('uz-UZ') : '—'}
                              />
                              <Detail
                                label={t("to'langan")}
                                value={`${money(r.paid)} ${t("so'm")}`}
                              />
                              {r.q.complaint && <Detail label={t('shikoyat')} value={r.q.complaint} wide />}
                              {r.q.medicalNotes && <Detail label={t('tibbiy izoh')} value={r.q.medicalNotes} wide />}
                              {typeof r.q.rating === 'number' && (
                                <div className="min-w-0">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('baho')}</p>
                                  <p className="flex items-center gap-1 text-sm font-bold text-amber-500">
                                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {r.q.rating}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-700 break-words">{value}</p>
    </div>
  );
}
