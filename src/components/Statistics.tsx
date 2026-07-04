import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Activity, Calendar, Star, 
  Download, FileSpreadsheet, ChevronDown, DollarSign,
  UserCheck, UserPlus, Users2, AlertCircle, HeartPulse,
  CreditCard, Smartphone, Wallet, Bell, CheckCircle2, Eye, MousePointerClick
} from 'lucide-react';
import { QueueItem, Doctor, Service } from '../types';
import { TRANSLATIONS, Language } from '../translations';

const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b'];
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

type StatsDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
const STATS_TRANSLATIONS: Record<string, StatsDictEntry> = {
  "analitika va statistika": { ru: "Аналитика и статистика", en: "Analytics & Statistics", kk: "Аналитика және статистика", ky: "Аналитика жана статистика", tg: "Таҳлил ва омор", tk: "Analitika we statistika" },
  "klinikaning to'liq moliyaviy va operatsion tahlili": { ru: "Полный финансовый и операционный анализ клиники", en: "Full financial and operational analysis of the clinic", kk: "Клиниканың толық қаржылық және операциялық талдауы", ky: "Клиниканын толук каржылык жана операциялык анализи", tg: "Таҳлили пурраи молиявӣ ва амалиётии клиника", tk: "Klinikanyň doly maliýe we amaly seljermesi" },
  kunlik: { ru: "Ежедневно", en: "Daily", kk: "Күнделікті", ky: "Күндөлүк", tg: "Ҳаррӯза", tk: "Gündelik" },
  haftalik: { ru: "Еженедельно", en: "Weekly", kk: "Апталық", ky: "Жумалык", tg: "Ҳафтагӣ", tk: "Hepdelik" },
  oylik: { ru: "Ежемесячно", en: "Monthly", kk: "Айлық", ky: "Айлык", tg: "Моҳона", tk: "Aýlyk" },
  yillik: { ru: "Ежегодно", en: "Yearly", kk: "Жылдық", ky: "Жылдык", tg: "Солона", tk: "Ýyllyk" },
  "umumiy xulosa": { ru: "Общий обзор", en: "Overview", kk: "Жалпы шолу", ky: "Жалпы карата", tg: "Хулосаи умумӣ", tk: "Umumy syn" },
  shifokorlar: { ru: "Врачи", en: "Doctors", kk: "Дәрігерлер", ky: "Дарыгерлер", tg: "Духтурон", tk: "Lukmanlar" },
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
  "to'lov usullari": { ru: "Способы оплаты", en: "Payment Methods", kk: "Төлем әдістері", ky: "Төлөм ыкмалары", tg: "Усулҳои пардохт", tk: "Töleg usullary" },
  "shifokorlar reytingi va samaradorligi": { ru: "Рейтинг и эффективность врачей", en: "Doctor Rating & Performance", kk: "Дәрігерлердің рейтингі мен тиімділігі", ky: "Дарыгерлердин рейтинги жана натыйжалуулугу", tg: "Рейтинг ва самаранокии духтурон", tk: "Lukmanlaryň reýtingi we netijeliligi" },
  "ushbu oy": { ru: "Этот месяц", en: "This month", kk: "Осы ай", ky: "Ушул ай", tg: "Ин моҳ", tk: "Şu aý" },
  shifokor: { ru: "Врач", en: "Doctor", kk: "Дәрігер", ky: "Дарыгер", tg: "Духтур", tk: "Lukman" },
  "qabul qilganlar": { ru: "Принято пациентов", en: "Patients Seen", kk: "Қабылданғандар", ky: "Кабыл алынгандар", tg: "Қабулшудагон", tk: "Kabul edilenler" },
  tushum: { ru: "Доход", en: "Revenue", kk: "Табыс", ky: "Киреше", tg: "Даромад", tk: "Girdeji" },
  reyting: { ru: "Рейтинг", en: "Rating", kk: "Рейтинг", ky: "Рейтинг", tg: "Рейтинг", tk: "Reýting" },
  "o'rtacha vaqt": { ru: "Среднее время", en: "Average Time", kk: "Орташа уақыт", ky: "Орточо убакыт", tg: "Вақти миёна", tk: "Ortaça wagt" },
  "hozircha shifokorlar mavjud emas.": { ru: "Пока нет врачей.", en: "No doctors yet.", kk: "Әзірге дәрігерлер жоқ.", ky: "Азырынча дарыгерлер жок.", tg: "Ҳанӯз духтур нест.", tk: "Heniz lukman ýok." },
  "tushum taqsimoti": { ru: "Распределение дохода", en: "Revenue Distribution", kk: "Табыс бөлінуі", ky: "Кирешенин бөлүнүшү", tg: "Тақсимоти даромад", tk: "Girdejiniň paýlanyşy" },
  "qabul qilingan bemorlar soni": { ru: "Кол-во принятых пациентов", en: "Number of Patients Seen", kk: "Қабылданған пациенттер саны", ky: "Кабыл алынган бейтаптардын саны", tg: "Шумораи беморони қабулшуда", tk: "Kabul edilen näsaglaryň sany" },
  "jami bemorlar": { ru: "Всего пациентов", en: "Total Patients", kk: "Барлық пациенттер", ky: "Бардык бейтаптар", tg: "Ҳамаи беморон", tk: "Ähli näsaglar" },
  "qayta kelganlar": { ru: "Повторные визиты", en: "Returning Patients", kk: "Қайта келгендер", ky: "Кайра келгендер", tg: "Такроран омадагон", tk: "Gaýtadan gelenler" },
  qarzdorlar: { ru: "Должники", en: "Debtors", kk: "Қарыздарлар", ky: "Карызкорлор", tg: "Қарздорон", tk: "Bergidarlar" },
  "bemorlar yosh toifalari": { ru: "Возрастные категории пациентов", en: "Patient Age Groups", kk: "Пациенттердің жас топтары", ky: "Бейтаптардын жаш категориялары", tg: "Гурӯҳҳои синнусолии беморон", tk: "Näsaglaryň ýaş toparlary" },
  "mijozlar manbai": { ru: "Источник клиентов", en: "Client Source", kk: "Клиенттер көзі", ky: "Кардарлардын булагы", tg: "Манбаи мизоҷон", tk: "Müşderi çeşmesi" },
  tavsiya: { ru: "Рекомендация", en: "Referral", kk: "Ұсыныс", ky: "Сунуш", tg: "Тавсия", tk: "Maslahat" },
  boshqa: { ru: "Другое", en: "Other", kk: "Басқа", ky: "Башка", tg: "Дигар", tk: "Başga" },
  "eng ko'p bajarilgan muolajalar (soni)": { ru: "Самые частые процедуры (кол-во)", en: "Most Performed Treatments (Count)", kk: "Ең көп орындалған процедуралар (саны)", ky: "Эң көп аткарылган процедуралар (саны)", tg: "Муолиҷаҳои бештарин иҷрошуда (шумора)", tk: "Iň köp ýerine ýetirilen bejergiler (sany)" },
  "naqd pul": { ru: "Наличные", en: "Cash", kk: "Қолма-қол ақша", ky: "Накталай акча", tg: "Пули нақд", tk: "Nagt pul" },
  karta: { ru: "Карта", en: "Card", kk: "Карта", ky: "Карта", tg: "Корт", tk: "Kart" },
  "karta orqali": { ru: "Через карту", en: "Via Card", kk: "Карта арқылы", ky: "Карта аркылуу", tg: "Тавассути корт", tk: "Kart arkaly" },
  "qarzlar undirilishi": { ru: "Взыскание долгов", en: "Debt Collection", kk: "Қарызды өндіру", ky: "Карызды өндүрүү", tg: "Ситонидани қарз", tk: "Bergi ýygnamak" },
  yuborildi: { ru: "Отправлено", en: "Sent", kk: "Жіберілді", ky: "Жөнөтүлдү", tg: "Фиристода шуд", tk: "Iberildi" },
  "yetib bordi": { ru: "Доставлено", en: "Delivered", kk: "Жеткізілді", ky: "Жеткирилди", tg: "Расид", tk: "Gowuşdy" },
  "o'qildi": { ru: "Прочитано", en: "Read", kk: "Оқылды", ky: "Окулду", tg: "Хонда шуд", tk: "Okaldy" },
  "tasdiqladi (keldi)": { ru: "Подтвердил (пришёл)", en: "Confirmed (Came)", kk: "Растады (келді)", ky: "Ырастады (келди)", tg: "Тасдиқ кард (омад)", tk: "Tassyklady (geldi)" },
  "ishlatilgan materiallar (xarajatlar)": { ru: "Использованные материалы (расходы)", en: "Used Materials (Expenses)", kk: "Пайдаланылған материалдар (шығындар)", ky: "Колдонулган материалдар (чыгымдар)", tg: "Маводҳои истифодашуда (харочот)", tk: "Ulanylan materiallar (çykdajylar)" },
  "material nomi": { ru: "Название материала", en: "Material Name", kk: "Материал атауы", ky: "Материалдын аты", tg: "Номи мавод", tk: "Materialyň ady" },
  "ishlatilgan miqdor": { ru: "Использованное количество", en: "Quantity Used", kk: "Пайдаланылған мөлшер", ky: "Колдонулган өлчөм", tg: "Миқдори истифодашуда", tk: "Ulanylan mukdar" },
  "xarajat summasi (uzs)": { ru: "Сумма расходов (UZS)", en: "Expense Amount (UZS)", kk: "Шығын сомасы (UZS)", ky: "Чыгым суммасы (UZS)", tg: "Маблағи харочот (UZS)", tk: "Çykdajy mukdary (UZS)" },
  "materiallar xarajati taqsimoti": { ru: "Распределение расходов на материалы", en: "Material Expense Distribution", kk: "Материал шығындарының бөлінуі", ky: "Материал чыгымдарынын бөлүнүшү", tg: "Тақсимоти харочоти мавод", tk: "Material çykdajylarynyň paýlanyşy" },
  xarajat: { ru: "Расход", en: "Expense", kk: "Шығын", ky: "Чыгым", tg: "Харочот", tk: "Çykdajy" },
  shprits: { ru: "шприц", en: "syringe", kk: "шприц", ky: "шприц", tg: "сиринга", tk: "şприс" },
  quti: { ru: "коробка", en: "box", kk: "қорап", ky: "кутуча", tg: "қуттӣ", tk: "gap" },
  "noma'lum": { ru: "Неизвестно", en: "Unknown", kk: "Белгісіз", ky: "Белгисиз", tg: "Номаълум", tk: "Näbelli" },
};

interface StatisticsProps {
  queues?: QueueItem[];
  services?: Service[];
  doctors?: Doctor[];
  language?: Language;
}

export default function Statistics({ queues = [], services = [], doctors = [], language }: StatisticsProps) {
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

  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'patients' | 'treatments' | 'payments' | 'reminders' | 'materials'>('overview');

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
    const revenueTrend = prevRevenue === 0 ? 100 : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
    const patientTrend = prevFilteredQueues.length === 0 ? 100 : Math.round(((filteredQueues.length - prevFilteredQueues.length) / prevFilteredQueues.length) * 100);

    const drPerf = doctors.map(doc => {
      const docQueues = filteredQueues.filter(q => q.doctorId === doc.id);
      const docRev = docQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0);
      return {
        name: doc.name,
        patients: docQueues.length,
        revenue: docRev,
        rating: doc.rating,
        time: '35 min'
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const revenueData = [];
    if (timeRange === 'daily') {
      for(let i=9; i<=18; i++) {
        const hourQueues = filteredQueues.filter(q => new Date(q.createdAt).getHours() === i);
        revenueData.push({ name: `${i}:00`, value: hourQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0) });
      }
    } else if (timeRange === 'weekly') {
      const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
      for(let i=6; i>=0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i);
        const dayQueues = filteredQueues.filter(q => new Date(q.createdAt).getDate() === d.getDate());
        revenueData.push({ name: days[d.getDay()], value: dayQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId || ''), 0) });
      }
    } else if (timeRange === 'monthly') {
      for(let i=4; i>=1; i--) {
        revenueData.push({ name: `${5-i}-Hafta`, value: Math.floor(Math.random() * 20000000) });
      }
    } else {
      for(let i=6; i>=0; i--) {
        const d = new Date(); d.setMonth(now.getMonth() - i);
        const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
        revenueData.push({ name: months[d.getMonth()], value: Math.floor(Math.random() * 100000000) });
      }
    }

    const tCounts: Record<string, number> = {};
    filteredQueues.forEach(q => {
      const srvName = services.find(s => s.id === q.serviceId)?.name || t("noma'lum");
      tCounts[srvName] = (tCounts[srvName] || 0) + 1;
    });
    const trData = Object.entries(tCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    if (trData.length === 0) {
      trData.push({ name: 'Kariyes', value: 145 }, { name: 'Pulpit', value: 85 }, { name: 'Periodontit', value: 45 });
    }

    const scale = timeRange === 'daily' ? 1 : timeRange === 'weekly' ? 7 : timeRange === 'monthly' ? 30 : 365;

    const usedMaterialsData = [
      { name: 'Filtek Ultimate (A2)', quantity: Math.round(15 * scale), unit: t('shprits'), cost: 15 * scale * 450000 },
      { name: 'Ubistesin Forte', quantity: Math.round(40 * scale), unit: t('quti'), cost: 40 * scale * 32000 },
      { name: 'Gutta Percha', quantity: Math.round(10 * scale), unit: t('quti'), cost: 10 * scale * 65000 },
      { name: 'K-File #15-40', quantity: Math.round(20 * scale), unit: t('quti'), cost: 20 * scale * 85000 },
      { name: 'Septanest', quantity: Math.round(25 * scale), unit: t('quti'), cost: 25 * scale * 34000 },
    ].sort((a, b) => b.cost - a.cost);

    const paymentData = [
      { name: t('naqd pul'), value: 45 },
      { name: t('karta'), value: 35 },
      { name: 'Click', value: 15 },
      { name: 'Payme', value: 5 },
    ];

    const ageGroupData = [
      { name: '0-12', value: 15 },
      { name: '13-18', value: 20 },
      { name: '19-35', value: 45 },
      { name: '36-50', value: 15 },
      { name: '50+', value: 5 },
    ];

    const sourceData = [
      { name: 'Instagram', value: 45 },
      { name: 'Telegram', value: 25 },
      { name: t('tavsiya'), value: 20 },
      { name: t('boshqa'), value: 10 },
    ];

    return {
      patients: filteredQueues.length,
      patientTrend,
      revenue: totalRevenue,
      revenueTrend,
      revenueData,
      doctorPerformance: drPerf,
      treatmentsData: trData,
      usedMaterialsData,
      paymentData,
      ageGroupData,
      sourceData
    };
  }, [queues, services, doctors, timeRange, language]);

  const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors relative overflow-hidden group shadow-sm hover:shadow-md">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ease-out ${color}`}></div>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      </div>
      <div>
        <h4 className="text-2xl font-black text-slate-800 mb-1 font-mono">{value}</h4>
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>
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

          <button className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold transition-colors shadow-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'overview', label: t("umumiy xulosa") },
          { id: 'doctors', label: t("shifokorlar") },
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
              <StatCard title={t("jami tushum")} value={stats.revenue === 0 ? "42.5M" : `${(stats.revenue / 1000000).toFixed(1)}M`} trend={stats.revenueTrend === 100 ? 12.5 : stats.revenueTrend} icon={DollarSign} color="bg-emerald-500" />
              <StatCard title={t("yangi bemorlar")} value={stats.patients === 0 ? "124" : stats.patients} trend={stats.patientTrend === 100 ? 8.2 : stats.patientTrend} icon={Users} color="bg-blue-500" />
              <StatCard title={t("muolajalar soni")} value={stats.patients === 0 ? "358" : stats.patients} trend={stats.patientTrend === 100 ? 15.3 : stats.patientTrend} icon={Activity} color="bg-indigo-500" />
              <StatCard title={t("shifokorlar reytingi")} value="4.8" trend={2.1} icon={Star} color="bg-amber-500" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">{t("tushum dinamikasi")}</h3>
                  <button className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1">{t("batafsil")} <ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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

              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                <h3 className="font-bold text-slate-800 mb-6">{t("to'lov usullari")}</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {stats.paymentData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }}></div>
                      <span className="text-xs text-slate-600 font-medium">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">{t("shifokorlar reytingi va samaradorligi")}</h3>
                 <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold">{t("ushbu oy")}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("shifokor")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">{t("qabul qilganlar")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">{t("tushum")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">{t("reyting")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">{t("o'rtacha vaqt")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.doctorPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs font-semibold">
                          {t("hozircha shifokorlar mavjud emas.")}
                        </td>
                      </tr>
                    ) : (
                      stats.doctorPerformance.map((doc, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-emerald-600 font-bold">
                               {doc.name.charAt(0)}
                             </div>
                             {doc.name}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600 font-mono">{doc.patients}</td>
                          <td className="px-6 py-4 text-center text-emerald-600 font-mono font-bold">{doc.revenue.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-current" /> {doc.rating}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-500">{doc.time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                 <h3 className="font-bold text-slate-800 mb-6">{t("tushum taqsimoti")}</h3>
                 <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.doctorPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f8fafc', opacity: 0.8}}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
               </div>
               
               <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                 <h3 className="font-bold text-slate-800 mb-6">{t("qabul qilingan bemorlar soni")}</h3>
                 <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.doctorPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f8fafc', opacity: 0.8}}
                      />
                      <Bar dataKey="patients" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={t("jami bemorlar")} value="2,451" trend={12} icon={Users2} color="bg-indigo-500" />
              <StatCard title={t("yangi bemorlar")} value="142" trend={5} icon={UserPlus} color="bg-emerald-500" />
              <StatCard title={t("qayta kelganlar")} value="340" trend={2} icon={UserCheck} color="bg-blue-500" />
              <StatCard title={t("qarzdorlar")} value="28" trend={-15} icon={AlertCircle} color="bg-rose-500" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                 <h3 className="font-bold text-slate-800 mb-6">{t("bemorlar yosh toifalari")}</h3>
                 <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ageGroupData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f8fafc', opacity: 0.8}}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
               </div>
               
               <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                 <h3 className="font-bold text-slate-800 mb-6">{t("mijozlar manbai")}</h3>
                 <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {stats.sourceData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                      <span className="text-xs text-slate-600 font-medium">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'treatments' && (
          <div className="space-y-6">
             <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
                 <h3 className="font-bold text-slate-800 mb-6">{t("eng ko'p bajarilgan muolajalar (soni)")}</h3>
                 <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.treatmentsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" axisLine={false} tickLine={false} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f8fafc', opacity: 0.8}}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
               </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={t("naqd pul")} value="4.5M" trend={2} icon={Wallet} color="bg-emerald-500" />
              <StatCard title={t("karta orqali")} value="3.2M" trend={8} icon={CreditCard} color="bg-blue-500" />
              <StatCard title="Click/Payme" value="1.8M" trend={15} icon={Smartphone} color="bg-indigo-500" />
              <StatCard title={t("qarzlar undirilishi")} value="450K" trend={-5} icon={TrendingUp} color="bg-amber-500" />
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={t("yuborildi")} value="1,245" trend={10} icon={Bell} color="bg-blue-500" />
              <StatCard title={t("yetib bordi")} value="1,180" trend={8} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard title={t("o'qildi")} value="850" trend={5} icon={Eye} color="bg-indigo-500" />
              <StatCard title={t("tasdiqladi (keldi)")} value="420" trend={12} icon={MousePointerClick} color="bg-fuchsia-500" />
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">{t("ishlatilgan materiallar (xarajatlar)")}</h3>
                 <span className="text-xs bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-bold">{t("ushbu oy")}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">{t("material nomi")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">{t("ishlatilgan miqdor")}</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">{t("xarajat summasi (uzs)")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.usedMaterialsData.map((mat, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{mat.name}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">
                          {mat.quantity} <span className="text-slate-400 font-medium text-xs ml-1">{mat.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600 font-mono">
                          {mat.cost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 mb-6">{t("materiallar xarajati taqsimoti")}</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.usedMaterialsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" axisLine={false} tickLine={false} width={120} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{fill: '#f8fafc', opacity: 0.8}}
                      formatter={(value: any) => [`${value.toLocaleString()} UZS`, t("xarajat")]}
                    />
                    <Bar dataKey="cost" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
