import React, { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { getApiUrl } from '../services/api';
import type { TreatmentCharge } from '../types';
import { clinicBillingSummary, discountValue, type ClinicPatientBalance } from '../utils/treatmentBilling';
import { fetchTreatmentCharges } from '../utils/treatmentCharges';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Users, Activity, Star,
  Download, ChevronDown, DollarSign,
  UserCheck, UserPlus, Users2, HeartPulse,
  CheckCircle2, Clock, XCircle, Receipt, Package, AlertTriangle, X, ChevronRight,
  Wallet, CreditCard, Tag, TrendingDown
} from 'lucide-react';
import { QueueItem, Doctor, Service, Patient, PaymentReceipt, Reminder } from '../types';
import { decodeLegacyEntities } from '../utils/textFormat';
import { TRANSLATIONS, Language, translateMedicalText } from '../translations';
import { exportClinicReportPdf } from '../utils/pdfExport';

type StatsDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
const STATS_TRANSLATIONS: Record<string, StatsDictEntry> = {
  "analitika va statistika": { ru: "Аналитика и статистика", en: "Analytics & Statistics", kk: "Аналитика және статистика", ky: "Аналитика жана статистика", tg: "Таҳлил ва омор", tk: "Analitika we statistika" },
  "klinikaning to'liq moliyaviy va operatsion tahlili": { ru: "Полный финансовый и операционный анализ клиники", en: "Full financial and operational analysis of the clinic", kk: "Клиниканың толық қаржылық және операциялық талдауы", ky: "Клиниканын толук каржылык жана операциялык анализи", tg: "Таҳлили пурраи молиявӣ ва амалиётии клиника", tk: "Klinikanyň doly maliýe we amaly seljermesi" },
  kunlik: { ru: "Ежедневно", en: "Daily", kk: "Күнделікті", ky: "Күндөлүк", tg: "Ҳаррӯза", tk: "Gündelik" },
  haftalik: { ru: "Еженедельно", en: "Weekly", kk: "Апталық", ky: "Жумалык", tg: "Ҳафтагӣ", tk: "Hepdelik" },
  oylik: { ru: "Ежемесячно", en: "Monthly", kk: "Айлық", ky: "Айлык", tg: "Моҳона", tk: "Aýlyk" },
  yillik: { ru: "Ежегодно", en: "Yearly", kk: "Жылдық", ky: "Жылдык", tg: "Солона", tk: "Ýyllyk" },
  hafta: { ru: "Неделя", en: "Week", kk: "Апта", ky: "Жума", tg: "Ҳафта", tk: "Hepde" },
  "umumiy xulosa": { ru: "Общий обзор", en: "Overview", kk: "Жалпы шолу", ky: "Жалпы карата", tg: "Хулосаи умумӣ", tk: "Umumy syn" },
  bemorlar: { ru: "Пациенты", en: "Patients", kk: "Пациенттер", ky: "Бейтаптар", tg: "Беморон", tk: "Näsaglar" },
  muolajalar: { ru: "Процедуры", en: "Treatments", kk: "Емдеу процедуралары", ky: "Дарылоо процедуралары", tg: "Муолиҷаҳо", tk: "Bejergiler" },
  "to'lovlar": { ru: "Платежи", en: "Payments", kk: "Төлемдер", ky: "Төлөмдөр", tg: "Пардохтҳо", tk: "Tölegler" },
  eslatmalar: { ru: "Напоминания", en: "Reminders", kk: "Ескертулер", ky: "Эскертүүлөр", tg: "Ёдоварӣ", tk: "Duýduryşlar" },
  materiallar: { ru: "Материалы", en: "Materials", kk: "Материалдар", ky: "Материалдар", tg: "Маводҳо", tk: "Materiallar" },
  "jami tushum": { ru: "Общий доход", en: "Total Revenue", kk: "Жалпы табыс", ky: "Жалпы киреше", tg: "Даромади умумӣ", tk: "Umumy girdeji" },
  "yangi bemorlar": { ru: "Новые пациенты", en: "New Patients", kk: "Жаңа пациенттер", ky: "Жаңы бейтаптар", tg: "Беморони нав", tk: "Täze näsaglar" },
  "muolajalar soni": { ru: "Кол-во процедур", en: "Number of Treatments", kk: "Процедуралар саны", ky: "Процедуралар саны", tg: "Шумораи муолиҷаҳо", tk: "Bejergileriň sany" },
  "shifokorlar reytingi": { ru: "Рейтинг врачей", en: "Doctor Rating", kk: "Дәрігерлер рейтингі", ky: "Дарыгерлердин рейтинги", tg: "Рейтинги духтурон", tk: "Lukmanlaryň reýtingi" },
  "tushum dinamikasi": { ru: "Динамика дохода", en: "Revenue Dynamics", kk: "Табыс динамикасы", ky: "Кирешенин динамикасы", tg: "Динамикаи даромад", tk: "Girdejiniň dinamikasy" },
  batafsil: { ru: "Подробнее", en: "Details", kk: "Толығырақ", ky: "Кененирээк", tg: "Муфассал", tk: "Jikme-jik" },
  "ushbu oy": { ru: "Этот месяц", en: "This month", kk: "Осы ай", ky: "Ушул ай", tg: "Ин моҳ", tk: "Şu aý" },
  "hozircha ma'lumot yo'q": { ru: "Пока нет данных", en: "No data yet", kk: "Әзірге деректер жоқ", ky: "Азырынча маалымат жок", tg: "Ҳанӯз маълумот нест", tk: "Heniz maglumat ýok" },
  "bemorlar yosh toifalari": { ru: "Возрастные категории пациентов", en: "Patient Age Groups", kk: "Пациенттердің жас топтары", ky: "Бейтаптардын жаш категориялары", tg: "Гурӯҳҳои синнусолии беморон", tk: "Näsaglaryň ýaş toparlary" },
  "eng ko'p bajarilgan muolajalar (soni)": { ru: "Самые частые процедуры (кол-во)", en: "Most Performed Treatments (Count)", kk: "Ең көп орындалған процедуралар (саны)", ky: "Эң көп аткарылган процедуралар (саны)", tg: "Муолиҷаҳои бештарин иҷрошуда (шумора)", tk: "Iň köp ýerine ýetirilen bejergiler (sany)" },
  "jami bemorlar": { ru: "Всего пациентов", en: "Total Patients", kk: "Барлық пациенттер", ky: "Бардык бейтаптар", tg: "Ҳамаи беморон", tk: "Ähli näsaglar" },
  "qayta kelganlar": { ru: "Повторные визиты", en: "Returning Patients", kk: "Қайта келгендер", ky: "Кайра келгендер", tg: "Такроран омадагон", tk: "Gaýtadan gelenler" },
  "tasdiqlangan to'lovlar": { ru: "Подтверждённые платежи", en: "Confirmed Payments", kk: "Расталған төлемдер", ky: "Тастыкталган төлөмдөр", tg: "Пардохтҳои тасдиқшуда", tk: "Tassyklanan tölegler" },
  "naqd to'lovlar": { ru: "Наличные платежи", en: "Cash Payments", kk: "Қолма-қол төлемдер", ky: "Накталай төлөмдөр", tg: "Пардохтҳои нақдӣ", tk: "Nagt tölegler" },
  "yig'ilgan": { ru: "Собрано", en: "Collected", kk: "Жиналған", ky: "Чогултулган", tg: "Ҷамъоварда", tk: "Ýygnanan" },
  "ta qarzdor bemor": { ru: "пациентов-должников", en: "patients in debt", kk: "қарыздар пациент", ky: "карыздар бейтап", tg: "бемори қарздор", tk: "bergili näsag" },
  "qarzdorlik": { ru: "Задолженность", en: "Outstanding", kk: "Қарыз", ky: "Карыз", tg: "Қарз", tk: "Bergi" },
  "hisoblangan": { ru: "Начислено", en: "Charged", kk: "Есептелген", ky: "Эсептелген", tg: "Ҳисобшуда", tk: "Hasaplanan" },
  "chegirmalar": { ru: "Скидки", en: "Discounts", kk: "Жеңілдіктер", ky: "Арзандатуулар", tg: "Тахфифҳо", tk: "Arzanlaşyklar" },
  "potentsial tushum (narxnoma bo'yicha)": { ru: "Потенциальный доход (по прейскуранту)", en: "Potential revenue (list price)", kk: "Әлеуетті кіріс (прейскурант бойынша)", ky: "Потенциалдуу киреше (баа тизмеси боюнча)", tg: "Даромади эҳтимолӣ (аз рӯи нархнома)", tk: "Mümkin girdeji (baha sanawy boýunça)" },
  "karta orqali to'lovlar": { ru: "Платежи картой", en: "Card Payments", kk: "Карта арқылы төлемдер", ky: "Карта аркылуу төлөмдөр", tg: "Пардохт бо корт", tk: "Kart bilen tölegler" },
  kutilmoqda: { ru: "В ожидании", en: "Pending", kk: "Күтуде", ky: "Күтүүдө", tg: "Дар интизор", tk: "Garaşylýar" },
  "rad etilgan": { ru: "Отклонено", en: "Rejected", kk: "Қабылданбады", ky: "Четке кагылды", tg: "Рад карда шуд", tk: "Ret edildi" },
  "jami kvitansiyalar": { ru: "Всего чеков", en: "Total Receipts", kk: "Барлық чектер", ky: "Бардык чектер", tg: "Ҳамаи чекҳо", tk: "Ähli çekler" },
  yuborildi: { ru: "Отправлено", en: "Sent", kk: "Жіберілді", ky: "Жөнөтүлдү", tg: "Фиристода шуд", tk: "Iberildi" },
  bajarildi: { ru: "Выполнено", en: "Done", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷро шуд", tk: "Ýerine ýetirildi" },
  "ombor qiymati": { ru: "Стоимость склада", en: "Warehouse Value", kk: "Қойма құны", ky: "Кампанын баасы", tg: "Арзиши анбор", tk: "Ammaryň bahasy" },
  "kam qolgan materiallar": { ru: "Заканчивающиеся материалы", en: "Low Stock Materials", kk: "Аяқталып қалған материалдар", ky: "Түгөнүп бараткан материалдар", tg: "Маводҳои рӯ ба итмом", tk: "Gutarýan materiallar" },
  "batafsil ma'lumot uchun \"materiallar\" bo'limiga o'ting": { ru: "Подробности смотрите в разделе «Материалы»", en: "See the \"Materials\" section for details", kk: "Толығырақ «Материалдар» бөлімінде", ky: "Толук маалымат үчүн \"Материалдар\" бөлүмүнө өтүңүз", tg: "Барои маълумоти бештар ба бахши \"Маводҳо\" гузаред", tk: "Jikme-jik üçin \"Materiallar\" bölümine geçiň" },
  yopish: { ru: "Закрыть", en: "Close", kk: "Жабу", ky: "Жабуу", tg: "Пӯшидан", tk: "Ýapmak" },
  "ta tashrif": { ru: "визитов", en: "visits", kk: "рет келген", ky: "жолу келген", tg: "ташриф", tk: "gezek gelen" },
  ta: { ru: "шт.", en: "items", kk: "дана", ky: "даана", tg: "адад", tk: "sany" },
  "so'm": { ru: "сум", en: "UZS", kk: "сом", ky: "сом", tg: "сӯм", tk: "som" },
  "kartaga bosib batafsil ko'ring": { ru: "Нажмите на карточку для подробностей", en: "Tap a card to see the details behind it", kk: "Толығырақ көру үшін картаны басыңыз", ky: "Кененирээк көрүү үчүн картаны басыңыз", tg: "Барои тафсилот ба корт зер кунед", tk: "Jikme-jik üçin karta basyň" },
};

interface StatisticsProps {
  queues?: QueueItem[];
  services?: Service[];
  doctors?: Doctor[];
  patients?: Patient[];
  // The billing ledger, when the caller already holds it. DoctorDashboard passes
  // its own rows pre-scoped to that doctor's patients, so this page reports the
  // same debt its dashboard card does instead of the whole clinic's; omitting
  // both (DirectorDashboard) keeps the clinic-wide read below.
  charges?: TreatmentCharge[];
  receipts?: PaymentReceipt[];
  clinicId?: string;
  clinicName?: string;
  staffToken?: string | null;
  language?: Language;
  // Lets a caller land the patient directly on a specific granularity — e.g.
  // DirectorDashboard's "Bugun joriy daromad" KPI card jumps here wanting the
  // daily view, not whatever this component's own default happens to be.
  initialTimeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export default function Statistics({ queues = [], services = [], doctors = [], patients = [], charges: chargesProp, receipts: receiptsProp, clinicId, clinicName, staffToken, language, initialTimeRange }: StatisticsProps) {
  const localLang: keyof StatsDictEntry | null =
    (language === "ru" || language === "en" || language === "kk" || language === "ky" || language === "tg" || language === "tk")
      ? language
      : null;

  const t = (text: string): string => {
    if (!language) return text;
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof (typeof TRANSLATIONS)["uz"]];
    }
    const cleanText = text.trim().toLowerCase().replace(/\s+/g, " ");
    const entry = STATS_TRANSLATIONS[cleanText] || STATS_TRANSLATIONS[text];
    if (entry) {
      if (localLang) return entry[localLang];
      const idx = text.search(/[a-zA-Zʻʼ'’]/);
      if (idx === -1) return text;
      return text.slice(0, idx) + text.charAt(idx).toUpperCase() + text.slice(idx + 1);
    }
    return text;
  };

  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(initialTimeRange || 'weekly');
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'treatments' | 'payments' | 'reminders' | 'materials'>('overview');

  // Real payment receipts (bemor -> shifokor to'g'ridan-to'g'ri to'lovi, kvitansiya
  // orqali tasdiqlanadi) — no cash/card/click/payme method is ever recorded, so
  // this tab reports real confirmed/pending/rejected totals instead of a fabricated
  // payment-method breakdown.
  const [fetchedReceipts, setFetchedReceipts] = useState<PaymentReceipt[]>([]);
  useEffect(() => {
    if (!clinicId || receiptsProp) return;
    let active = true;
    fetch(`${getApiUrl()}/api/payment-receipts?clinicId=${encodeURIComponent(clinicId)}`, {
      headers: staffToken ? { Authorization: `Bearer ${staffToken}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (active) setFetchedReceipts(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setFetchedReceipts([]); });
    return () => { active = false; };
  }, [clinicId, staffToken, receiptsProp]);
  const receipts = receiptsProp ?? fetchedReceipts;

  // The billing ledger, so this page can report money actually owed and
  // collected rather than only list-price-times-completed-visits.
  const [fetchedCharges, setFetchedCharges] = useState<TreatmentCharge[]>([]);
  useEffect(() => {
    if (!clinicId || !staffToken || chargesProp) return;
    let active = true;
    fetchTreatmentCharges({ clinicId }, staffToken)
      .then((data) => { if (active) setFetchedCharges(data); });
    return () => { active = false; };
  }, [clinicId, staffToken, chargesProp]);
  const charges = chargesProp ?? fetchedCharges;

  const billing = useMemo(() => clinicBillingSummary(charges, receipts), [charges, receipts]);

  // Real reminders (only 3 real states exist: pending/sent/done — Telegram exposes
  // no delivery or read-receipt data, so a "delivered/read" funnel can't be built).
  const [reminders, setReminders] = useState<Reminder[]>([]);
  useEffect(() => {
    if (!clinicId) return;
    let active = true;
    fetch(`${getApiUrl()}/api/reminders?clinicId=${encodeURIComponent(clinicId)}`, {
      headers: staffToken ? { Authorization: `Bearer ${staffToken}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (active) setReminders(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setReminders([]); });
    return () => { active = false; };
  }, [clinicId, staffToken]);

  // Real current-stock materials value — mirrors the same Firestore collection and
  // calculation MaterialsInventory.tsx uses, just summarized (this tab shows a
  // snapshot, not a fabricated "expenses over time" chart, since no historical
  // consumption log exists to build one from).
  const [materialsValue, setMaterialsValue] = useState(0);
  // The running-low items themselves, not just how many — the stat card drills
  // down into this list so "kam qolgan materiallar: 3" can say *which* three.
  const [lowStockItems, setLowStockItems] = useState<
    { id: string; name: string; quantity: number; unit: string; minQuantity: number }[]
  >([]);
  const lowStockCount = lowStockItems.length;
  useEffect(() => {
    if (!clinicId) return;
    const unsub = onSnapshot(
      collection(db, `clinics/${clinicId}/materials`),
      (snapshot) => {
        let value = 0;
        const low: { id: string; name: string; quantity: number; unit: string; minQuantity: number }[] = [];
        snapshot.forEach((d) => {
          const m: any = d.data();
          value += (m.quantity || 0) * (m.price || 0);
          if ((m.quantity || 0) <= (m.minQuantity || 0)) {
            low.push({
              id: d.id,
              name: m.name || '—',
              quantity: m.quantity || 0,
              unit: m.unit || '',
              minQuantity: m.minQuantity || 0,
            });
          }
        });
        setMaterialsValue(value);
        setLowStockItems(low);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `clinics/${clinicId}/materials`)
    );
    return () => unsub();
  }, [clinicId]);

  // Compute dynamic stats
  const stats = useMemo(() => {
    const completedQueues = queues.filter(q => q.status === 'completed');

    const now = new Date();
    let startDate = new Date();
    if (timeRange === 'daily') startDate.setHours(0, 0, 0, 0);
    if (timeRange === 'weekly') startDate.setDate(now.getDate() - 7);
    if (timeRange === 'monthly') startDate.setMonth(now.getMonth() - 1);
    if (timeRange === 'yearly') startDate.setFullYear(now.getFullYear() - 1);

    const filteredQueues = completedQueues.filter(q => new Date(q.createdAt) >= startDate);

    const getServicePrice = (id: string) => services.find(s => s.id === id)?.price || 0;

    const totalRevenue = filteredQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0);
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(startDate);
    if (timeRange === 'daily') { prevStartDate.setDate(prevStartDate.getDate() - 1); prevEndDate.setDate(prevEndDate.getDate() - 1); prevEndDate.setHours(23, 59, 59, 999); }
    if (timeRange === 'weekly') { prevStartDate.setDate(prevStartDate.getDate() - 7); prevEndDate.setDate(prevEndDate.getDate() - 7); }
    if (timeRange === 'monthly') { prevStartDate.setMonth(prevStartDate.getMonth() - 1); prevEndDate.setMonth(prevEndDate.getMonth() - 1); }
    if (timeRange === 'yearly') { prevStartDate.setFullYear(prevStartDate.getFullYear() - 1); prevEndDate.setFullYear(prevEndDate.getFullYear() - 1); }

    const prevFilteredQueues = completedQueues.filter(q => {
      const d = new Date(q.createdAt);
      return d >= prevStartDate && d <= prevEndDate;
    });
    const prevRevenue = prevFilteredQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0);
    const revenueTrend = prevRevenue === 0 ? (totalRevenue > 0 ? 100 : 0) : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
    const visitTrend = prevFilteredQueues.length === 0 ? (filteredQueues.length > 0 ? 100 : 0) : Math.round(((filteredQueues.length - prevFilteredQueues.length) / prevFilteredQueues.length) * 100);

    // Real revenue chart — every bucket is a genuine sum over completedQueues, no
    // Math.random() filler (previously used for monthly/yearly views).
    const revenueData: { name: string; value: number }[] = [];
    if (timeRange === 'daily') {
      for (let i = 9; i <= 18; i++) {
        const hourQueues = filteredQueues.filter(q => new Date(q.createdAt).getHours() === i);
        revenueData.push({ name: `${i}:00`, value: hourQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0) });
      }
    } else if (timeRange === 'weekly') {
      const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i);
        const dayQueues = filteredQueues.filter(q => new Date(q.createdAt).getDate() === d.getDate() && new Date(q.createdAt).getMonth() === d.getMonth());
        revenueData.push({ name: days[d.getDay()], value: dayQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0) });
      }
    } else if (timeRange === 'monthly') {
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - i * 7);
        const weekStart = new Date(weekEnd); weekStart.setDate(weekEnd.getDate() - 7);
        const weekQueues = completedQueues.filter(q => {
          const d = new Date(q.createdAt);
          return d >= weekStart && d < weekEnd;
        });
        revenueData.push({ name: `${4 - i}-${t('hafta')}`, value: weekQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0) });
      }
    } else {
      const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now); d.setMonth(now.getMonth() - i);
        const monthQueues = completedQueues.filter(q => {
          const qd = new Date(q.createdAt);
          return qd.getFullYear() === d.getFullYear() && qd.getMonth() === d.getMonth();
        });
        revenueData.push({ name: months[d.getMonth()], value: monthQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0) });
      }
    }

    // Real treatment mix — no fake fallback rows when there's simply no history yet.
    const tCounts: Record<string, number> = {};
    filteredQueues.forEach(q => {
      const srvName = services.find(s => s.id === q.serviceId)?.name;
      if (srvName) tCounts[srvName] = (tCounts[srvName] || 0) + 1;
    });
    const treatmentsData = Object.entries(tCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

    // Real average doctor rating — only counts doctors with at least one real review,
    // matching the same honesty pattern used for clinic ratings elsewhere in the app.
    const ratedDoctors = doctors.filter(d => (d.ratingCount || 0) > 0);
    const avgDoctorRating = ratedDoctors.length > 0
      ? (ratedDoctors.reduce((sum, d) => sum + (d.rating || 0), 0) / ratedDoctors.length).toFixed(1)
      : null;

    // Per-doctor breakdown for the selected period — feeds the PDF report
    // export; reuses filteredQueues/getServicePrice so it can't disagree with
    // the totals above.
    const doctorBreakdown = doctors.map(d => {
      const docQueues = filteredQueues.filter(q => q.doctorId === d.id);
      return {
        name: d.name,
        visits: docQueues.length,
        revenue: docQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0),
        rating: d.rating || 0,
      };
    }).sort((a, b) => b.visits - a.visits);

    // Real new-vs-returning patient counts, derived from each patient's full queue
    // history (matched by normalized phone, the only join key QueueItem has) rather
    // than a stored "registered at" field, which doesn't exist on Patient.
    const normPhone = (p?: string) => (p || '').replace(/\D/g, '');
    const firstVisitByPhone = new Map<string, Date>();
    const visitCountByPhone = new Map<string, number>();
    queues.forEach(q => {
      const phone = normPhone(q.patientPhone);
      if (!phone) return;
      const d = new Date(q.createdAt);
      visitCountByPhone.set(phone, (visitCountByPhone.get(phone) || 0) + 1);
      const existing = firstVisitByPhone.get(phone);
      if (!existing || d < existing) firstVisitByPhone.set(phone, d);
    });
    const phonesInPeriod = new Set(filteredQueues.map(q => normPhone(q.patientPhone)).filter(Boolean));
    // The phone lists are kept alongside the counts so each stat card can drill
    // down into exactly the records it counted, rather than re-deriving them
    // slightly differently somewhere else and disagreeing with its own number.
    const newPatientPhones: string[] = [];
    const returningPatientPhones: string[] = [];
    phonesInPeriod.forEach(phone => {
      const firstVisit = firstVisitByPhone.get(phone);
      if (firstVisit && firstVisit >= startDate) newPatientPhones.push(phone);
      if ((visitCountByPhone.get(phone) || 0) >= 2) returningPatientPhones.push(phone);
    });
    const newPatientsInPeriod = newPatientPhones.length;
    const returningPatientsInPeriod = returningPatientPhones.length;

    // Real age groups, computed from Patient.birthDate — previously a fully
    // hardcoded chart with invented percentages.
    const ageBuckets = [
      { name: '0-12', min: 0, max: 12, value: 0 },
      { name: '13-18', min: 13, max: 18, value: 0 },
      { name: '19-35', min: 19, max: 35, value: 0 },
      { name: '36-50', min: 36, max: 50, value: 0 },
      { name: '50+', min: 51, max: 999, value: 0 },
    ];
    let patientsWithBirthDate = 0;
    patients.forEach(p => {
      if (!p.birthDate) return;
      const birth = new Date(p.birthDate);
      if (isNaN(birth.getTime())) return;
      const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const bucket = ageBuckets.find(b => age >= b.min && age <= b.max);
      if (bucket) { bucket.value++; patientsWithBirthDate++; }
    });

    return {
      visits: filteredQueues.length,
      visitTrend,
      revenue: totalRevenue,
      revenueTrend,
      revenueData,
      treatmentsData,
      avgDoctorRating,
      doctorBreakdown,
      newPatientsInPeriod,
      returningPatientsInPeriod,
      ageGroupData: ageBuckets,
      patientsWithBirthDate,
      // Backing records for the stat-card drill-downs.
      filteredQueues,
      newPatientPhones,
      returningPatientPhones,
      visitCountByPhone,
      getServicePrice,
    };
  }, [queues, services, doctors, patients, timeRange, language]);

  const receiptsInPeriod = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    if (timeRange === 'daily') startDate.setHours(0, 0, 0, 0);
    if (timeRange === 'weekly') startDate.setDate(now.getDate() - 7);
    if (timeRange === 'monthly') startDate.setMonth(now.getMonth() - 1);
    if (timeRange === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
    return receipts.filter(r => new Date(r.createdAt) >= startDate);
  }, [receipts, timeRange]);

  const remindersInPeriod = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    if (timeRange === 'daily') startDate.setHours(0, 0, 0, 0);
    if (timeRange === 'weekly') startDate.setDate(now.getDate() - 7);
    if (timeRange === 'monthly') startDate.setMonth(now.getMonth() - 1);
    if (timeRange === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
    return reminders.filter(r => new Date(r.createdAt) >= startDate);
  }, [reminders, timeRange]);

  // Each stat card can carry the records behind its number. When it does, the
  // card becomes clickable and opens them in a list — the number alone was a
  // dead end ("18 patients" told you nothing about *which* 18).
  type DrillRow = { id: string; primary: string; secondary?: string; meta?: string; badge?: string };
  const [drill, setDrill] = useState<{ title: string; rows: DrillRow[] } | null>(null);

  const StatCard = ({ title, value, subtitle, trend, icon: Icon, color, rows }: any) => {
    const clickable = Array.isArray(rows);
    return (
      <div
        onClick={clickable ? () => setDrill({ title, rows }) : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrill({ title, rows }); } } : undefined}
        className={`bg-white border border-slate-100 rounded-2xl p-5 transition-all relative overflow-hidden group shadow-sm ${
          clickable
            ? 'cursor-pointer hover:border-emerald-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.99]'
            : 'hover:border-slate-200 hover:shadow-md'
        }`}
      >
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ease-out ${color}`}></div>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          {typeof trend === 'number' && (
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <div>
          <h4 className="text-2xl font-black text-slate-800 mb-1 font-mono">{value}</h4>
          <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
            {title}
            {clickable && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            )}
          </p>
          {subtitle && (
            <p className="text-xs font-bold text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    );
  };

  // ---- Row builders for the drill-downs, all derived from the same numbers
  // the cards display, so a list can never contradict its own count. ----
  const money = (n: number) => `${n.toLocaleString()} ${t("so'm")}`;
  const dateOf = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '');
  const normPhoneOf = (p?: string) => (p || '').replace(/\D/g, '');

  const queueRows = (list: QueueItem[]): DrillRow[] =>
    [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((q) => ({
        id: q.id,
        primary: decodeLegacyEntities(q.patientName) || '—',
        secondary: decodeLegacyEntities(q.patientPhone) || '',
        meta: dateOf(q.createdAt),
        badge: services.find((s) => s.id === q.serviceId)?.name,
      }));

  const phoneRows = (phones: string[], withVisitCount = false): DrillRow[] =>
    phones.map((phone) => {
      const patient = patients.find((p) => normPhoneOf(p.phone) === phone);
      const queue = stats.filteredQueues.find((q) => normPhoneOf(q.patientPhone) === phone);
      return {
        id: phone,
        primary: decodeLegacyEntities(patient?.fullName || queue?.patientName || '') || '—',
        secondary: decodeLegacyEntities(patient?.phone || queue?.patientPhone || '') || '',
        meta: dateOf(queue?.createdAt),
        badge: withVisitCount
          ? `${stats.visitCountByPhone.get(phone) || 0} ${t('ta tashrif')}`
          : undefined,
      };
    });

  const patientRows = (): DrillRow[] =>
    [...patients]
      .sort((a, b) => (b.clinicVisits?.length || 0) - (a.clinicVisits?.length || 0))
      .map((p) => ({
        id: p.id,
        primary: decodeLegacyEntities(p.fullName) || '—',
        secondary: decodeLegacyEntities(p.phone) || '',
        badge: `${(p.clinicVisits || []).length} ${t('ta tashrif')}`,
      }));

  const doctorRows = (): DrillRow[] =>
    doctors
      .filter((d) => (d.ratingCount || 0) > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .map((d) => ({
        id: d.id,
        primary: decodeLegacyEntities(d.name) || '—',
        secondary: d.specialty || '',
        badge: `⭐ ${(d.rating || 0).toFixed(1)} (${d.ratingCount})`,
      }));

  const receiptRows = (list: PaymentReceipt[]): DrillRow[] =>
    [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => ({
        id: r.id,
        primary: decodeLegacyEntities(r.patientName || '') || '—',
        secondary: r.amount ? money(r.amount) : '',
        meta: dateOf(r.createdAt),
      }));

  const chargeRows = (list: TreatmentCharge[]): DrillRow[] =>
    [...list]
      .sort((a, b) => discountValue(b) - discountValue(a))
      .map((c) => ({
        id: c.id,
        primary: decodeLegacyEntities(c.patientName || '') || c.patientId || '—',
        secondary: `${c.treatmentName ? translateMedicalText(c.treatmentName, language || 'uz') : '—'} · −${money(discountValue(c))}`,
        meta: c.discountPercent ? `${c.discountPercent}%` : dateOf(c.createdAt),
      }));

  // One list behind both the "qarzdorlik" amount's debtor count and the rows the
  // card drills into, so the headline number and the table can never disagree.
  const debtors = (Array.from(billing.byPatient.values()) as ClinicPatientBalance[])
    .filter((entry) => entry.debt > 0)
    .sort((a, b) => b.debt - a.debt);

  const debtorRows = (): DrillRow[] =>
    debtors
      .map((entry) => ({
        id: entry.patientId,
        primary: decodeLegacyEntities(
          patients.find((p) => p.id === entry.patientId)?.fullName || entry.patientName || ''
        ) || entry.patientId,
        secondary: money(entry.debt),
        meta: `${money(entry.paid)} / ${money(entry.total)}`,
      }));

  const reminderRows = (list: Reminder[]): DrillRow[] =>
    [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => ({
        id: r.id,
        primary: r.text || '—',
        secondary: decodeLegacyEntities(patients.find((p) => p.id === r.patientId)?.fullName || '') || '',
        meta: r.dueDate || dateOf(r.createdAt),
      }));

  const lowStockRows = (): DrillRow[] =>
    lowStockItems.map((m) => ({
      id: m.id,
      primary: m.name,
      secondary: `${m.quantity} ${m.unit}`,
      badge: `min: ${m.minQuantity} ${m.unit}`,
    }));

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 text-sm font-semibold gap-2">
      <HeartPulse className="w-8 h-8 opacity-40" />
      {t("hozircha ma'lumot yo'q")}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-3xl p-6 text-slate-600 font-sans overflow-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" /> {t("analitika va statistika")}
          </h2>
          <p className="text-sm text-slate-500">{t("klinikaning to'liq moliyaviy va operatsion tahlili")}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5" /> {t("kartaga bosib batafsil ko'ring")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
            {['daily', 'weekly', 'monthly', 'yearly'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${timeRange === range ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {range === 'daily' ? t("kunlik") : range === 'weekly' ? t("haftalik") : range === 'monthly' ? t("oylik") : t("yillik")}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

          <button
            onClick={() => exportClinicReportPdf({
              clinicName: clinicName || clinicId || 'Klinika',
              periodLabel: t(timeRange === 'daily' ? 'kunlik' : timeRange === 'weekly' ? 'haftalik' : timeRange === 'monthly' ? 'oylik' : 'yillik'),
              revenue: stats.revenue,
              visits: stats.visits,
              newPatients: stats.newPatientsInPeriod,
              returningPatients: stats.returningPatientsInPeriod,
              avgDoctorRating: stats.avgDoctorRating,
              treatmentsData: stats.treatmentsData,
              doctorBreakdown: stats.doctorBreakdown,
            })}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'overview', label: t("umumiy xulosa") },
          { id: 'patients', label: t("bemorlar") },
          { id: 'treatments', label: t("muolajalar") },
          { id: 'payments', label: t("to'lovlar") },
          { id: 'reminders', label: t("eslatmalar") },
          { id: 'materials', label: t("materiallar") }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-emerald-600 border border-slate-200 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Money actually collected, and money still owed — these come from
                  the billing ledger. The old single "jami tushum" was list price
                  times completed visits, which is a forecast, not takings. */}
              <StatCard title={t("yig'ilgan")} value={money(billing.paid)} icon={DollarSign} color="bg-emerald-500" rows={receiptRows(receipts.filter(r => r.status === 'confirmed'))} />
              <StatCard title={t("qarzdorlik")} value={money(billing.debt)} subtitle={`${debtors.length} ${t("ta qarzdor bemor")}`} icon={TrendingDown} color="bg-rose-500" rows={debtorRows()} />
              <StatCard title={t("yangi bemorlar")} value={stats.newPatientsInPeriod} icon={Users} color="bg-blue-500" rows={phoneRows(stats.newPatientPhones)} />
              <StatCard title={t("muolajalar soni")} value={stats.visits} trend={stats.visitTrend} icon={Activity} color="bg-indigo-500" rows={queueRows(stats.filteredQueues)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard title={t("potentsial tushum (narxnoma bo'yicha)")} value={money(stats.revenue)} trend={stats.revenueTrend} icon={Receipt} color="bg-slate-600" rows={queueRows(stats.filteredQueues)} />
              <StatCard title={t("shifokorlar reytingi")} value={stats.avgDoctorRating ?? "—"} icon={Star} color="bg-amber-500" rows={doctorRows()} />
            </div>

            {/* Revenue chart */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">{t("tushum dinamikasi")}</h3>
                <button className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1">{t("batafsil")} <ChevronDown className="w-4 h-4" /></button>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title={t("jami bemorlar")} value={patients.length} icon={Users2} color="bg-indigo-500" rows={patientRows()} />
              <StatCard title={t("yangi bemorlar")} value={stats.newPatientsInPeriod} icon={UserPlus} color="bg-emerald-500" rows={phoneRows(stats.newPatientPhones)} />
              <StatCard title={t("qayta kelganlar")} value={stats.returningPatientsInPeriod} icon={UserCheck} color="bg-blue-500" rows={phoneRows(stats.returningPatientPhones, true)} />
            </div>

            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 mb-6">{t("bemorlar yosh toifalari")}</h3>
              {stats.patientsWithBirthDate === 0 ? (
                <EmptyState />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ageGroupData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc', opacity: 0.8 }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'treatments' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 mb-6">{t("eng ko'p bajarilgan muolajalar (soni)")}</h3>
              {stats.treatmentsData.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ height: Math.max(300, stats.treatmentsData.length * 44) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.treatmentsData} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" axisLine={false} tickLine={false} width={180} interval={0} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc', opacity: 0.8 }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t("tasdiqlangan to'lovlar")}
              value={`${(receiptsInPeriod.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + (r.amount || 0), 0) / 1000000).toFixed(1)}M`}
              icon={DollarSign}
              color="bg-emerald-500"
              rows={receiptRows(receiptsInPeriod.filter(r => r.status === 'confirmed'))}
            />
            <StatCard title={t("kutilmoqda")} value={receiptsInPeriod.filter(r => r.status === 'pending').length} icon={Clock} color="bg-amber-500" rows={receiptRows(receiptsInPeriod.filter(r => r.status === 'pending'))} />
            <StatCard title={t("rad etilgan")} value={receiptsInPeriod.filter(r => r.status === 'rejected').length} icon={XCircle} color="bg-rose-500" rows={receiptRows(receiptsInPeriod.filter(r => r.status === 'rejected'))} />
            <StatCard title={t("jami kvitansiyalar")} value={receiptsInPeriod.length} icon={Receipt} color="bg-indigo-500" rows={receiptRows(receiptsInPeriod)} />
          </div>
        )}

        {activeTab === 'payments' && (() => {
          const confirmed = receiptsInPeriod.filter(r => r.status === 'confirmed');
          const cash = confirmed.filter(r => r.paymentMethod === 'cash');
          // No paymentMethod recorded means it predates that field or came through
          // the Telegram card-receipt flow — treat as card for the breakdown.
          const card = confirmed.filter(r => r.paymentMethod !== 'cash');
          const discountedCharges = charges.filter(c => c.status !== 'void' && discountValue(c) > 0);
          return (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <StatCard
                title={t("naqd to'lovlar")}
                value={money(cash.reduce((sum, r) => sum + (r.amount || 0), 0))}
                icon={Wallet}
                color="bg-emerald-600"
                rows={receiptRows(cash)}
              />
              <StatCard
                title={t("karta orqali to'lovlar")}
                value={money(card.reduce((sum, r) => sum + (r.amount || 0), 0))}
                icon={CreditCard}
                color="bg-sky-600"
                rows={receiptRows(card)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <StatCard
                title={t("hisoblangan")}
                value={money(billing.total)}
                icon={Receipt}
                color="bg-slate-700"
              />
              <StatCard
                title={t("chegirmalar")}
                value={money(billing.discount)}
                icon={Tag}
                color="bg-violet-600"
                rows={chargeRows(discountedCharges)}
              />
              <StatCard
                title={t("qarzdorlik")}
                value={money(billing.debt)}
                subtitle={`${debtors.length} ${t("ta qarzdor bemor")}`}
                icon={TrendingDown}
                color="bg-rose-600"
                rows={debtorRows()}
              />
            </div>
            </>
          );
        })()}

        {activeTab === 'reminders' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title={t("kutilmoqda")} value={remindersInPeriod.filter(r => r.status === 'pending').length} icon={Clock} color="bg-amber-500" rows={reminderRows(remindersInPeriod.filter(r => r.status === 'pending'))} />
            <StatCard title={t("yuborildi")} value={remindersInPeriod.filter(r => r.status === 'sent').length} icon={CheckCircle2} color="bg-blue-500" rows={reminderRows(remindersInPeriod.filter(r => r.status === 'sent'))} />
            <StatCard title={t("bajarildi")} value={remindersInPeriod.filter(r => r.status === 'done').length} icon={CheckCircle2} color="bg-emerald-500" rows={reminderRows(remindersInPeriod.filter(r => r.status === 'done'))} />
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard title={t("ombor qiymati")} value={`${(materialsValue / 1000000).toFixed(1)}M`} icon={Package} color="bg-blue-500" />
              <StatCard title={t("kam qolgan materiallar")} value={lowStockCount} icon={AlertTriangle} color="bg-rose-500" rows={lowStockRows()} />
            </div>
            <p className="text-xs text-slate-400 text-center">{t("batafsil ma'lumot uchun \"materiallar\" bo'limiga o'ting")}</p>
          </div>
        )}
      </div>

      {/* Drill-down: the records behind whichever stat card was clicked. */}
      {drill && (
        <div
          className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setDrill(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 truncate">{drill.title}</h3>
                <p className="text-xs font-semibold text-slate-400">
                  {drill.rows.length} {t('ta')}
                </p>
              </div>
              <button
                onClick={() => setDrill(null)}
                aria-label={t('yopish')}
                className="p-2 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {drill.rows.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-1.5">
                  {drill.rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{row.primary}</p>
                        {row.secondary && (
                          <p className="text-[11px] text-slate-500 font-medium truncate">{row.secondary}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {row.badge && (
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 whitespace-nowrap">
                            {row.badge}
                          </span>
                        )}
                        {row.meta && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">{row.meta}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
