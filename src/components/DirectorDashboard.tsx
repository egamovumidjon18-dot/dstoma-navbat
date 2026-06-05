import React, { useState } from 'react';
import { Clinic, Doctor, Service, QueueItem, SaaSPayment } from '../types';
import { TRANSLATIONS, Language } from '../translations';
import { 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Star, 
  BarChart3, 
  Calendar, 
  Plus, 
  Award, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Building, 
  Search,
  ArrowLeft,
  HeartPulse,
  ChevronDown,
  Wrench,
  Sparkles
} from 'lucide-react';

interface DirectorDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  setActiveTab?: (tab: 'bemor' | 'shifokor' | 'boshliq' | 'kod' | 'superadmin') => void;
  onAddDoctor?: (newDoc: Doctor) => void;
  onDeleteDoctor?: (doctorId: string) => void;
  onUpdateService?: (updatedService: Service) => void;
  onAddService?: (newService: Service) => void;
  clinicId?: string;
  onSimulatePayment?: (clinicId: string) => void;
  saasPayments?: SaaSPayment[];
  language: Language;
}

export default function DirectorDashboard({
  clinics,
  doctors,
  services,
  queues,
  setActiveTab,
  onAddDoctor,
  onDeleteDoctor,
  onUpdateService,
  onAddService,
  clinicId,
  onSimulatePayment,
  saasPayments = [],
  language
}: DirectorDashboardProps) {
  
  // Translation Helper
  const t = (text: string) => {
    if (!language) return text;
    
    // Look up in global configurations if text acts as a key
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof typeof TRANSLATIONS['uz']];
    }

    const dict: Record<string, { ru: string; en: string }> = {
      "asosiy kabinet": { ru: "Главный кабинет", en: "Main Cabinet" },
      "bemor qidirish": { ru: "Поиск пациентов", en: "Search Patients" },
      "bemorlarni qidirish": { ru: "Поиск пациентов", en: "Search Patients" },
      "ism yoki telefon raqam bo'yicha...": { ru: "По имени или номеру телефона...", en: "By name or phone number..." },
      "ism yoki telefon raqamini yozing...": { ru: "Введите имя или номер телефона...", en: "Write name or phone number..." },
      "birorta ham bemor topilmadi.": { ru: "Пациенты не найдены.", en: "No patients found." },
      "yopish": { ru: "Закрыть", en: "Close" },
      "bugun": { ru: "Сегодня", en: "Today" },
      "haftalik hisobot": { ru: "Еженедельный отчет", en: "Weekly report" },
      "shifokorlar kpi": { ru: "KPI Врачей", en: "Doctors KPI" },
      "⚙ tibbiy xizmatlar & narxlar": { ru: "⚙ Медицинские Услуги и Цены", en: "⚙ Medical Services & Prices" },
      "💳 obuna monitoringi & to'lovlar": { ru: "💳 Мониторинг Подписки и Платежи", en: "💳 Subscription Monitoring & Payments" },
      "bugun qabul qilingan": { ru: "Принято сегодня", en: "Admitted Today" },
      "bugun joriy daromad": { ru: "Текущий доход сегодня", en: "Today's generated revenue" },
      "so'm": { ru: "сум", en: "UZS" },
      "hozir kutayotgan": { ru: "Сейчас ожидает", en: "Currently waiting" },
      "jami ro'yxatdagi bemorlar": { ru: "Всего зарегистрировано пациентов", en: "Total registered patients" },
      "kishi": { ru: "чел", en: "people" },
      "ta": { ru: "шт", en: "items" },
      "shifokorlar bugungi ko'rsatkichlari": { ru: "Показатели врачей сегодня", en: "Doctors' metrics today" },
      "shifokor": { ru: "Врач", en: "Doctor" },
      "qabul bo'limi": { ru: "Очередь", en: "Queue" },
      "bugungi qabul": { ru: "Сегодня принято", en: "Today's admissions" },
      "bugungi tushum": { ru: "Доход сегодня", en: "Today's revenue" },
      "faoliyat": { ru: "Активность", en: "Activity" },
      "qarash": { ru: "Просмотр", en: "View" },
      "boshliq paneli": { ru: "Панель Директора", en: "Director's Panel" },
      "oylik to'lov muddati bo'yicha eslatma": { ru: "Напоминание по оплате подписки", en: "Subscription Payment Notification" },
      "to'lov & obuna analitikasi": { ru: "Оплата и аналитика подписки", en: "Payment & Subscription" },
      "to'xtatilgan ❌": { ru: "Остановлено ❌", en: "Suspended ❌" },
      "1 haftalik bepul trial (sinov) muddatida 🎁": { ru: "В течение 1-недельного бесплатного ознакомительного периода 🎁", en: "Under a 1-week free trial promotion period 🎁" },
      "faol ✅": { ru: "Активно ✅", en: "Active ✅" },
      "belgilanmagan": { ru: "не определено", en: "undefined" },
      "kechikkan!": { ru: "Просрочено!", en: "Overdue!" },
      "kun qoldi": { ru: "дн осталось", en: "days left" },
      "iltimos, shifokor ismini to'liq kiriting!": { ru: "Пожалуйста, введите полное имя врача!", en: "Please enter the doctor's full name!" },
      "yangi shifokor profili muvaffaqiyatli saqlandi va qabulga tayyor!": { ru: "Новый профиль врача успешно сохранен и готов к приему!", en: "New doctor profile has been saved and is ready for queue admissions!" },
      "iltimos xizmat parametrlari to'g'riligini texshiring!": { ru: "Пожалуйста, проверьте параметры услуги!", en: "Please check service parameters!" },
      "tibbiy xizmat narxi va nomi muvaffaqiyatli tahrirlandi!": { ru: "Цена и наименование медицинских услуг успешно изменены!", en: "Medical service name and rate updated!" },
      "3 kun oldin": { ru: "3 дня назад", en: "3 days ago" },
      "5 kun oldin": { ru: "5 дней назад", en: "5 days ago" },
      "2 hafta oldin": { ru: "2 недели назад", en: "2 weeks ago" },
      "Erkak": { ru: "Мужчина", en: "Male" },
      "Ayol": { ru: "Женщина", en: "Female" },
      "Samarqand Filiali Boshqaruv Markazi": { ru: "Центр Управления Самаркандским Филиалом", en: "Samarkand Branch Management HQ" },
      "Sizga bog'langan klinika tarmog'ini masofadan analitika va biznes mantiqi yordamida boshqaring.": { ru: "Управляйте филиалом вашей клиники с помощью удаленной аналитики и бизнес-логики.", en: "Manage your linked clinic branch ecosystem with remote analytical intelligence." },
      "obuna": { ru: "подписка", en: "subscription" },
      "sozlamalar": { ru: "настройки", en: "settings" },
      "shifokorlar": { ru: "врачи", en: "doctors" },
      "haftalik": { ru: "еженедельно", en: "weekly" },
      "Obuna statusi": { ru: "Статус подписки", en: "Subscription status" }
    };

    const cleanText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    if (dict[cleanText]) {
      if (language === 'ru') return dict[cleanText].ru;
      if (language === 'en') return dict[cleanText].en;
    }

    if (dict[text]) {
      if (language === 'ru') return dict[text].ru;
      if (language === 'en') return dict[text].en;
    }
    return text;
  };

  // Tab-specific view model: 'bugun', 'haftalik', 'shifokorlar', 'sozlamalar', 'obuna'
  const [activeSubTab, setActiveSubTab] = useState<'bugun' | 'haftalik' | 'shifokorlar' | 'sozlamalar' | 'obuna'>('bugun');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Doctor Creation Form States
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('Stomatolog-ortoped');
  const [newDocAvatar, setNewDocAvatar] = useState('https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop');
  const [showAddDoctorForm, setShowAddDoctorForm] = useState(false);
  const [docFeedbackMsg, setDocFeedbackMsg] = useState('');

  // Editing services in grid
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceName, setEditingServiceName] = useState('');
  const [editingServicePrice, setEditingServicePrice] = useState<number>(0);
  const [srvFeedbackMsg, setSrvFeedbackMsg] = useState('');

  // Adding new medical service States
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number | ''>('');
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [selectedPatientTab, setSelectedPatientTab] = useState<'yangi' | 'jami'>('yangi');

  // Filter lists based on Samarqand clinic (the default CEO location)
  const currentClinicId = clinicId || 'samarqand';
  const clinicDoctors = doctors.filter(d => d.clinicId === currentClinicId);
  const clinicServices = services.filter(s => s.clinicId === currentClinicId);
  const clinicQueues = queues.filter(q => q.clinicId === currentClinicId);

  // Filter queues by status
  const pendingQueues = clinicQueues.filter(q => q.status === 'pending');
  const callingQueues = clinicQueues.filter(q => q.status === 'calling' || q.status === 'in_progress');
  const completedQueues = clinicQueues.filter(q => q.status === 'completed');

  // Weekly historical table data (Screenshot 7 & 8 detail)
  const weeklyReportData = [
    { dayName: 'Dushanba', dateStr: '27.05.2026', patientsCount: 5, revenue: 1100000, avgRating: 5.0 },
    { dayName: 'Seshanba', dateStr: '28.05.2026', patientsCount: 8, revenue: 2350000, avgRating: 4.8 },
    { dayName: 'Chorshanba', dateStr: '29.05.2026', patientsCount: 4, revenue: 900000, avgRating: 4.5 },
    { dayName: 'Payshanba', dateStr: '30.05.2026', patientsCount: 11, revenue: 3800000, avgRating: 4.9 },
    { dayName: 'Juma', dateStr: '31.05.2026', patientsCount: 7, revenue: 1850000, avgRating: 4.7 },
    { dayName: 'Shanba', dateStr: '01.06.2026', patientsCount: 13, revenue: 5200000, avgRating: 5.0 },
    { dayName: 'Yakshanba', dateStr: '02.06.2026', patientsCount: 2, revenue: 450000, avgRating: 4.0 }
  ];

  // Calculations for KPI Cards
  const totalCompletedToday = completedQueues.length;
  const currentWaitingCount = pendingQueues.length + callingQueues.length;
  
  const getServicePrice = (id: string) => {
    return services.find(s => s.id === id)?.price || 0;
  };

  const todayRevenue = completedQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId), 0);
  const totalRegisteredPatientsCount = 205 + queues.length; // From screenshot 5 'Jami ro'yxatdagi bemorlar' is 205

  // Calculations per doctor for today's grid
  const getDocTodayStats = (docId: string) => {
    const docCompleted = completedQueues.filter(q => q.doctorId === docId);
    const docActive = pendingQueues.filter(q => q.doctorId === docId).length + callingQueues.filter(q => q.doctorId === docId).length;
    const docRevenue = docCompleted.reduce((sum, q) => sum + getServicePrice(q.serviceId), 0);
    return {
      completedCount: docCompleted.length,
      activeCount: docActive,
      revenue: docRevenue
    };
  };

  // Search filter for patients
  const searchResults = clinicQueues.filter(q => 
    q.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.patientPhone.includes(searchQuery)
  );

  // Handler for adding doctor
  const handleCreateDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) {
      setDocFeedbackMsg("Iltimos, shifokor ismini to'liq kiriting!");
      return;
    }

    const newDocObj: Doctor = {
      id: 'doc_sm_' + (doctors.length + 1),
      clinicId: currentClinicId,
      name: newDocName,
      specialty: newDocSpecialty,
      rating: 5.0,
      ratingCount: 0,
      image: newDocAvatar,
      status: 'idle'
    };

    if (onAddDoctor) {
      onAddDoctor(newDocObj);
    } else {
      // Local addition fallback
      doctors.push(newDocObj);
    }

    setNewDocName('');
    setDocFeedbackMsg("Yangi shifokor profili muvaffaqiyatli saqlandi va qabulga tayyor!");
    setTimeout(() => {
      setDocFeedbackMsg('');
      setShowAddDoctorForm(false);
    }, 3000);
  };

  // Handler for editing service prices
  const startEditingService = (srv: Service) => {
    setEditingServiceId(srv.id);
    setEditingServiceName(srv.name);
    setEditingServicePrice(srv.price);
  };

  const handleUpdateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceId || !editingServiceName || editingServicePrice <= 0) {
      setSrvFeedbackMsg("Iltimos xizmat parametrlari to'g'riligini tekshiring!");
      return;
    }

    const updatedSrv: Service = {
      id: editingServiceId,
      clinicId: currentClinicId,
      name: editingServiceName,
      price: editingServicePrice
    };

    if (onUpdateService) {
      onUpdateService(updatedSrv);
    } else {
      // Offline fallback
      const idx = services.findIndex(s => s.id === editingServiceId);
      if (idx !== -1) {
        services[idx] = updatedSrv;
      }
    }

    setEditingServiceId(null);
    setSrvFeedbackMsg("Tibbiy xizmat narxi va nomi muvaffaqiyatli tahrirlandi!");
    setTimeout(() => setSrvFeedbackMsg(''), 3000);
  };

  // Handler for adding services
  const handleCreateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice || Number(newServicePrice) <= 0) {
      setSrvFeedbackMsg("Iltimos, xizmat nomi va narxini to'g'ri kiriting!");
      return;
    }

    const newSrvObj: Service = {
      id: 'srv_sm_' + (services.length + 1) + '_' + Math.floor(Math.random() * 100),
      clinicId: currentClinicId,
      name: newServiceName,
      price: Number(newServicePrice)
    };

    if (onAddService) {
      onAddService(newSrvObj);
    } else {
      services.push(newSrvObj);
    }

    setNewServiceName('');
    setNewServicePrice('');
    setShowAddServiceForm(false);
    setSrvFeedbackMsg("Yangi tibbiy xizmat muvaffaqiyatli saqlandi va ro'yxatga kiritildi!");
    setTimeout(() => setSrvFeedbackMsg(''), 3000);
  };

  // Patient database arrays
  const totalBazaPatients = [
    { fullName: 'Anvar Alimov', phone: '+998 (99) 441-23-45', passport: 'AA1234567', gender: 'Erkak', age: 34, lastVisit: 'Bugun', visitsCount: 4, source: 'PWA Ilova' },
    { fullName: 'Malika Sobirova', phone: '+998 (90) 789-11-22', passport: 'AB9876543', gender: 'Ayol', age: 28, lastVisit: 'Kecha', visitsCount: 2, source: 'CRM Operator' },
    { fullName: 'Jasur Bekmurodov', phone: '+998 (97) 124-55-66', passport: 'AC4561239', gender: 'Erkak', age: 41, lastVisit: 'Bugun', visitsCount: 7, source: 'PWA Ilova' },
    { fullName: 'Shahzod Yo\'ldoshev', phone: '+998 (93) 120-40-50', passport: 'AD3216549', gender: 'Erkak', age: 29, lastVisit: '2 kun oldin', visitsCount: 3, source: 'Tezkor Chipta' },
    { fullName: 'Sardor Qodirov', phone: '+998 (99) 850-60-70', passport: 'AE7894561', gender: 'Erkak', age: 36, lastVisit: '1 hafta oldin', visitsCount: 5, source: 'CRM Operator' },
    { fullName: 'Kamola Fayzullayeva', phone: '+998 (90) 250-10-30', passport: 'AF4567891', gender: 'Ayol', age: 22, lastVisit: '3 kun oldin', visitsCount: 1, source: 'PWA Ilova' },
    { fullName: 'Bekzod Abdullayev', phone: '+998 (94) 555-12-34', passport: 'AG1593572', gender: 'Erkak', age: 50, lastVisit: '5 kun oldin', visitsCount: 9, source: 'Tezkor Chipta' },
    { fullName: 'Umida Karimova', phone: '+998 (97) 444-99-88', passport: 'AH7531590', gender: 'Ayol', age: 31, lastVisit: '2 hafta oldin', visitsCount: 2, source: 'PWA Ilova' }
  ];

  // Merge current day queue tickets to construct dynamic list
  const dynamicQueuedPatients = clinicQueues.map(q => ({
    fullName: q.patientName,
    phone: q.patientPhone,
    passport: 'TS-' + q.number,
    gender: 'Mijoz App',
    age: 23 + (q.number % 30),
    lastVisit: 'Bugun',
    visitsCount: 1,
    source: 'Tizim Navbati'
  }));

  const uniquePhones = new Set<string>();
  const mergedPatients: typeof totalBazaPatients = [];

  dynamicQueuedPatients.forEach(p => {
    if (!uniquePhones.has(p.phone)) {
      uniquePhones.add(p.phone);
      mergedPatients.push(p);
    }
  });

  totalBazaPatients.forEach(p => {
    if (!uniquePhones.has(p.phone)) {
      uniquePhones.add(p.phone);
      mergedPatients.push(p);
    }
  });

  const myClinic = clinics.find(c => c.id === currentClinicId);
  const clinicNameStr = myClinic ? myClinic.name : "Samarqand Filiali";

  // Calculate subscription alert conditions
  const isTrial = myClinic?.subscriptionStatus === 'trial';
  const isSuspended = myClinic?.subscriptionStatus === 'suspended';
  const daysDiff = myClinic?.nextPaymentDate
    ? Math.floor((new Date(myClinic.nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  const showWarning = isTrial || isSuspended || daysDiff < 7;

  return (
    <div className="space-y-6 font-sans text-left">
      {/* ----------------- BANNER HEADER (SCREENSHOT 5) ----------------- */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="z-10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">{t("👑 Boshliq Paneli")}</h2>
          <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight font-display">
            {clinicNameStr === "Samarqand Filiali" ? t("Samarqand Filiali Boshqaruv Markazi") : `${clinicNameStr} ${t("Boshqaruv Markazi")}`} — {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </h1>
          <p className="text-xs text-indigo-205/75 mt-1 font-semibold leading-relaxed">{t("Sizga bog'langan klinika tarmog'ini masofadan analitika va biznes mantiqi yordamida boshqaring.")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          <button 
            onClick={() => setShowSearchModal(true)}
            className="px-5 py-3 bg-white/10 hover:bg-white/15 text-xs font-black rounded-xl border border-white/10 flex items-center gap-1.5 transition-all text-white cursor-pointer active:scale-95"
          >
            <Search className="w-4 h-4 text-indigo-300" /> {t("Bemor qidirish")}
          </button>
          
          <button
            onClick={() => setActiveTab && setActiveTab('bemor')}
            className="px-5 py-3 bg-white hover:bg-slate-50 text-indigo-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> {t("Asosiy kabinet")}
          </button>
        </div>
      </div>

      {/* DYNAMIC SUBSCRIPTION WARNING BAR (USER REQUIREMENT) */}
      {showWarning && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-100 border-l-4 border-amber-500 rounded-2xl p-4.5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
          <div>
            <h3 className="text-sm font-extrabold text-amber-800 flex items-center gap-1.5 uppercase tracking-wide">
              {t("⚠️ OYLIK TO'LOV MUDDATI BO'YICHA ESLATMA")}
            </h3>
            <p className="text-xs text-slate-700 mt-1">
              {language === 'uz' ? 'Sizning' : language === 'ru' ? 'Ваш статус подписки филиала' : 'Your subscription status for'} <strong>{clinicNameStr}</strong>: <span className="font-bold underline text-amber-900">{isSuspended ? t("To'xtatilgan ❌") : isTrial ? t("1 haftalik bepul trial (sinov) muddatida 🎁") : t("Faol ✅")}</span>.
              &nbsp;{language === 'uz' ? "To'g'ridan-to'g'ri to'lov muddati:" : language === 'ru' ? "Срок прямой оплаты:" : "Direct due date of payment:"} <strong className="font-mono text-amber-900">{myClinic?.nextPaymentDate || t("belgilanmagan")}</strong> {daysDiff <= 0 ? `(${t("Kechikkan!")})` : `(${daysDiff} ${t("kun qoldi")})`}.
              &nbsp;{language === 'uz' ? "Oylik obuna narxi:" : language === 'ru' ? "Ежемесячная стоимость подписки:" : "Monthly subscription cost:"} <strong className="text-indigo-900 font-mono">{(myClinic?.rentalPrice || 1500000).toLocaleString('uz-UZ')} {t("so'm")}</strong>.
            </p>
          </div>
          <div className="flex gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => setActiveSubTab('obuna')}
              className="px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-md active:scale-95 text-center flex-1 sm:flex-none"
            >
              {t("To'lov & Obuna Analitikasi")}
            </button>
          </div>
        </div>
      )}

      {/* SEARCH PATIENT MODAL POPUP */}
      {showSearchModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                <Search className="text-blue-500 w-4 h-4" /> {t("Bemorlarni qidirish")}
              </h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Ism yoki telefon raqam bo'yicha...")}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:border-blue-500 focus:outline-none"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {searchQuery === '' ? (
                <p className="text-[11px] text-slate-400 text-center py-4">{t("Ism yoki telefon raqamini yozing...")}</p>
              ) : searchResults.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">{t("Birorta ham bemor topilmadi.")}</p>
              ) : (
                searchResults.map(pt => (
                  <div key={pt.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-slate-800 block text-[11px]">{pt.patientName}</strong>
                      <span className="text-slate-400 font-mono text-[10px]">{pt.patientPhone}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-500 font-mono">{t("Chipta")} #{pt.number}</span>
                      <span className="block text-[10px] text-slate-400">{language === 'uz' ? 'Filial: Samarqand' : language === 'ru' ? 'Филиал: Самарканд' : 'Branch: Samarkand'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-755 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              {t("Yopish")}
            </button>
          </div>
        </div>
      )}

      {/* SUB-TABS INTERFACE (SCREENSHOT 5) */}
      <div className="flex border-b border-slate-200 gap-1 select-none overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('bugun')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'bugun' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          {t("Bugun")}
        </button>
        <button
          onClick={() => setActiveSubTab('haftalik')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'haftalik' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          {t("Haftalik hisobot")}
        </button>
        <button
          onClick={() => setActiveSubTab('shifokorlar')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'shifokorlar' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          {t("Shifokorlar KPI")}
        </button>
        <button
          onClick={() => setActiveSubTab('sozlamalar')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'sozlamalar' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          {t("⚙ Tibbiy Xizmatlar & Narxlar")}
        </button>
        <button
          onClick={() => setActiveSubTab('obuna')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'obuna' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          {t("💳 Obuna Monitoringi & To'lovlar")}
        </button>
      </div>

      {/* METRIC CARD DOCK (SCREENSHOT 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              {t("Bugun qabul qilingan")}
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {totalCompletedToday} {t("kishi")}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              {t("Bugun joriy daromad")}
            </span>
            <div className="text-md font-extrabold text-blue-700 font-mono mt-2">
              {todayRevenue.toLocaleString('uz-UZ')} {t("so'm")}
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              {t("Hozir kutayotgan")}
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {currentWaitingCount} {t("kishi")}
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              {t("Jami ro'yxatdagi bemorlar")}
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {totalRegisteredPatientsCount} {t("ta")}
            </div>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* -------------------- TAB 1: BUGUN VIEW (SCREENSHOT 5) -------------------- */}
      {activeSubTab === 'bugun' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Shifokorlar bugungi hisoboti (Tab 1 left part) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">
                🩺 Shifokorlar bugungi ko'rsatkichlari
              </h3>

              <div className="overflow-x-auto text-xs">
                <table className="w-full min-w-[500px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase font-extrabold">
                      <th className="px-4 py-2.5">Shifokor</th>
                      <th className="px-4 py-2.5 text-center">Bemorlar</th>
                      <th className="px-4 py-2.5 text-right">Bugungi daromad</th>
                      <th className="px-4 py-2.5 text-center">Reyting</th>
                      <th className="px-4 py-2.5 text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-705">
                    {clinicDoctors.map((doc) => {
                      const stats = getDocTodayStats(doc.id);
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/30">
                          <td className="px-4 py-3.5 flex items-center gap-3">
                            <img src={doc.image} alt={doc.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100 animate-fade-in" referrerPolicy="no-referrer" />
                            <div>
                              <strong className="text-slate-800 block text-xs">{doc.name}</strong>
                              <span className="text-[10px] text-slate-400 font-semibold">{doc.specialty}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono">
                            {stats.completedCount} kishi / <span className="text-amber-600 font-bold">{stats.activeCount} kutmoqda</span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-blue-700">
                            {stats.revenue.toLocaleString('uz-UZ')}.00 so'm
                          </td>
                          <td className="px-4 py-3.5 text-center text-amber-400 font-sans font-bold">
                            ★ {doc.rating.toFixed(1)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2.5">
                              <button
                                onClick={() => setActiveTab && setActiveTab('shifokor')}
                                className="text-blue-500 hover:text-blue-600 font-extrabold underline cursor-pointer text-[11px]"
                              >
                                {language === 'uz' ? "Kabinet" : language === 'ru' ? "Кабинет" : "Cabinet"}
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => {
                                  const confirmMsg = language === 'uz'
                                    ? `"${doc.name}" shifokorini o'chirishni tasdiqlaysizmi?`
                                    : language === 'ru'
                                    ? `Вы действительно хотите удалить врача "${doc.name}"?`
                                    : `Are you sure you want to delete doctor "${doc.name}"?`;
                                  if (window.confirm(confirmMsg)) {
                                    onDeleteDoctor?.(doc.id);
                                  }
                                }}
                                className="text-rose-650 hover:text-rose-800 font-extrabold underline cursor-pointer text-[11px] flex items-center gap-0.5"
                              >
                                🗑️ {language === 'uz' ? "O'chirish" : language === 'ru' ? "Удалить" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Xizmatlar (bugun) (Tab 1 right part) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">
                📋 Bugungi mashhur xizmatlar
              </h3>
              
              <div className="divide-y divide-slate-100">
                {clinicServices.map(srv => {
                  const callCount = completedQueues.filter(q => q.serviceId === srv.id).length;
                  return (
                    <div key={srv.id} className="py-3 flex items-center justify-between first:pt-1 last:pb-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#0284c7]">✔</span>
                        <span className="font-extrabold text-slate-700">{srv.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
                          {callCount} ta
                        </span>
                        <span className="font-extrabold text-slate-800 font-mono">
                          {srv.price.toLocaleString('uz-UZ')} UZS
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Full width: bugungi barcha navbatlar list */}
          {/* BEMORLAR TAHLILI - YANGI VS JAMI ALOHIDA (CREATIVE TABBED LAYOUT) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-150/80 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9]">👥 Bemorlar Ma'lumot BAZASI</span>
                <h3 className="text-md font-black text-slate-850 mt-1">
                  Yangi va Jami Ro'yxatdan O'tganlar Tafsiloti
                </h3>
              </div>

              {/* Toggle controls with premium style */}
              <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 self-start sm:self-center select-none">
                <button
                  type="button"
                  onClick={() => setSelectedPatientTab('yangi')}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedPatientTab === 'yangi'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  🌟 Yangi Ro'yxatdan O'tganlar ({clinicQueues.length} ta)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPatientTab('jami')}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedPatientTab === 'jami'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  🗄️ Jami Ro'yxatbaza ({mergedPatients.length} kishi)
                </button>
              </div>
            </div>

            {/* Render selected sub-section */}
            {selectedPatientTab === 'yangi' ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-xs text-amber-850 leading-relaxed">
                  💡 <strong>Bugun Navbatda Turgan Yangi Bemorlar:</strong> Ushbu ro'yxat bugun elektron chipta orqali yoki shaxsan kelib navbat olgan va klinikani ziyorat qilayotgan bemorlarni ko'rsatadi. Bu ma'lumotlar real-vaqt rejimida avtomatik ravishda yangilanadi.
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-405 text-[10px] uppercase font-extrabold border-b border-slate-100">
                        <th className="px-4 py-3"># Chipta</th>
                        <th className="px-4 py-3">F.I.SH Ismi</th>
                        <th className="px-4 py-3">Aloqa raqami</th>
                        <th className="px-4 py-3">Biriktirilgan Shifokor</th>
                        <th className="px-4 py-3">Xizmat va Yo'nalish</th>
                        <th className="px-4 py-3">Holati</th>
                        <th className="px-4 py-3 text-right">Reyting/Baho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {clinicQueues.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">Bugun birorta ham yangi chipta olingani yo'q.</td>
                        </tr>
                      ) : (
                        clinicQueues.map((item) => {
                          const doc = doctors.find(d => d.id === item.doctorId);
                          const srv = services.find(s => s.id === item.serviceId);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/20 transition-all">
                              <td className="px-4 py-3 font-bold font-mono text-indigo-600">
                                #{item.number}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-slate-800 font-bold block">{item.patientName}</span>
                                <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/55 inline-block">Bugun Yangi</span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-mono">
                                {item.patientPhone}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {doc?.name || 'Nevizual/Boshqa'}
                              </td>
                              <td className="px-4 py-3 text-slate-650">
                                {srv?.name || 'Ko\'rik'}
                              </td>
                              <td className="px-4 py-3">
                                {item.status === 'completed' ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-extrabold border border-emerald-100/50 inline-flex items-center gap-1">
                                    ✔ Davolangan
                                  </span>
                                ) : item.status === 'cancelled' ? (
                                  <span className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-lg text-[10px] font-extrabold border border-rose-100/50 inline-flex items-center gap-1">
                                    ✕ Bekor qilindi
                                  </span>
                                ) : item.status === 'in_progress' ? (
                                  <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-[10px] font-extrabold border border-blue-100/50 inline-flex items-center gap-1 animate-pulse font-sans">
                                    🦷 Qabulda ◀
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[10px] font-extrabold border border-amber-100/50 inline-flex items-center gap-1">
                                    ⏳ Kutmoqda
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-amber-400 text-xs">
                                {item.rating ? '★'.repeat(item.rating) : <span className="text-slate-350 font-normal font-mono text-[10px]">-</span>}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl text-xs text-sky-850 leading-relaxed flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    💡 <strong>Klinika Passport Bemorlar BAZASI (CRM):</strong> Quyida klinika terminali, telefon va mobil ilova orqali bugungacha ro'yxatdan o'tgan barcha tarixiy va faol bemorlar bazasining sinxron tahlili keltirilgan.
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold text-[10.5px] rounded-lg">
                    Jami ma'lumotlar hajmi: {205 + dynamicQueuedPatients.length} ta bemor
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-405 text-[10px] uppercase font-extrabold border-b border-slate-100">
                        <th className="px-4 py-3">Bemor F.I.SH</th>
                        <th className="px-4 py-3">ID / Passport</th>
                        <th className="px-4 py-3">Aloqa raqami</th>
                        <th className="px-4 py-3 text-center">Yosh</th>
                        <th className="px-4 py-3 text-center font-mono">Tashriflar</th>
                        <th className="px-4 py-3">Ro'yxat manbasi</th>
                        <th className="px-4 py-3 text-right font-sans">Oxirgi qabul</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {mergedPatients.map((pt, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition-all">
                          <td className="px-4 py-3">
                            <span className="text-slate-850 font-extrabold block">{pt.fullName}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[10.5px] text-slate-400">
                            {pt.passport}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">
                            {pt.phone}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-550 font-mono">
                            {pt.age} yosh
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 font-mono font-bold">
                            {pt.visitsCount} marta
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border border-slate-200/45">
                              {pt.source}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-blue-600 text-[10.5px]">
                            {pt.lastVisit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* -------------------- TAB 2: HAFTALIK HISOBOT VIEW (SCREENSHOT 6, 7, 8) -------------------- */}
      {activeSubTab === 'haftalik' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Kunlik tafsilot table (Screenshot 7 detail) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
            <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" /> Haftalik kunlik tafsilot
            </h3>

            <div className="overflow-x-auto text-[11px] font-semibold text-slate-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-extrabold border-b border-slate-100">
                    <th className="px-3 py-2">Kun</th>
                    <th className="px-3 py-2">Sana</th>
                    <th className="px-3 py-2 text-center">Bemorlar</th>
                    <th className="px-3 py-2 text-right">Daromad</th>
                    <th className="px-3 py-2 text-center">Baho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {weeklyReportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="px-3 py-3 font-bold text-slate-800">{item.dayName}</td>
                      <td className="px-3 py-3 font-mono text-slate-400">{item.dateStr}</td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-655">{item.patientsCount} kishi</td>
                      <td className="px-3 py-3 text-right font-mono text-cyan-600 font-extrabold">
                        {item.revenue.toLocaleString('uz-UZ')} so'm
                      </td>
                      <td className="px-3 py-3 text-center text-amber-500 font-bold">★ {item.avgRating.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side: Graph grids utilizing gorgeous SVG charts */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Chart 1: Kunlik daromad line chart */}
            <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Kunlik daromad grafigi (so'm)
                </h4>
                <span className="text-[11px] bg-blue-50 text-blue-800 font-mono font-extrabold px-2 py-0.5 rounded-full">
                  Haftalik jami: 15,650,000 UZS
                </span>
              </div>

              {/* Responsive Elegant SVG Chart */}
              <div className="h-44 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="500" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="77" x2="500" y2="77" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Gradient Area Shadow */}
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {(() => {
                    const maxRevenue = 5500000;
                    const points = weeklyReportData.map((d, index) => {
                      const x = 40 + index * 70;
                      const y = 130 - (d.revenue / maxRevenue) * 105;
                      return { x, y, day: d.dayName, val: d.revenue };
                    });
                    
                    const pathD = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');
                    const areaD = `${pathD} L ${points[points.length-1].x} 140 L ${points[0].x} 140 Z`;
                    
                    return (
                      <>
                        <path d={areaD} fill="url(#chart-grad)" />
                        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
                        {points.map((p, idx) => (
                          <g key={idx} className="group cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="5.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                            <g className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                              <rect x={p.x - 55} y={p.y - 32} width="110" height="22" rx="6" fill="#1e293b" />
                              <text x={p.x} y={p.y - 18} fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                                {p.val.toLocaleString()} UZS
                              </text>
                            </g>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Day labels at bottom */}
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-10 pt-1 select-none">
                  <span>Dush</span>
                  <span>Sesh</span>
                  <span>Chor</span>
                  <span>Pay</span>
                  <span>Jum</span>
                  <span>Shan</span>
                  <span>Yak</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Kunlik bemorlar count line chart */}
            <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Kunlik tashrif buyurgan bemorlar soni
                </h4>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-mono font-extrabold px-2 py-0.5 rounded-full">
                  Haftalik jami: 50 bemor
                </span>
              </div>

              {/* SVG Bemorlar Chart */}
              <div className="h-44 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="500" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="77" x2="500" y2="77" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Gradient Area Shadow (Green) */}
                  <defs>
                    <linearGradient id="chart-grad-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {(() => {
                    const maxPatients = 15;
                    const points = weeklyReportData.map((d, index) => {
                      const x = 40 + index * 70;
                      const y = 130 - (d.patientsCount / maxPatients) * 105;
                      return { x, y, day: d.dayName, val: d.patientsCount };
                    });
                    
                    const pathD = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');
                    const areaD = `${pathD} L ${points[points.length-1].x} 140 L ${points[0].x} 140 Z`;
                    
                    return (
                      <>
                        <path d={areaD} fill="url(#chart-grad-g)" />
                        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
                        {points.map((p, idx) => (
                          <g key={idx} className="group cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                            <g className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                              <rect x={p.x - 40} y={p.y - 32} width="80" height="22" rx="6" fill="#1e293b" />
                              <text x={p.x} y={p.y - 18} fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                                {p.val} bemor
                              </text>
                            </g>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Day labels at bottom */}
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-10 pt-1 select-none">
                  <span>Dush</span>
                  <span>Sesh</span>
                  <span>Chor</span>
                  <span>Pay</span>
                  <span>Jum</span>
                  <span>Shan</span>
                  <span>Yak</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* -------------------- TAB 3: SHIFOKORLAR VIEW & CREATE PROFILE (SCREENSHOT 9 COVERS) -------------------- */}
      {activeSubTab === 'shifokorlar' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">
              🧑‍⚕ Shifokorlar va Ularning Kunlik Analitikalari
            </h3>

            <button
              onClick={() => setShowAddDoctorForm(!showAddDoctorForm)}
              className="px-4 py-2 bg-[#0284c7] hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yangi Shifokor Profilini Yaratish
            </button>
          </div>

          {/* Feedback messages */}
          {docFeedbackMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-fade-in">
              {docFeedbackMsg}
            </div>
          )}

          {/* Onboarding New Doctor Form */}
          {showAddDoctorForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 max-w-2xl space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                🩺 Yangi Shifokor Qo'shish Shakli (CEO Onboarding)
              </h4>

              <form onSubmit={handleCreateDoctorSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">To'liq ismi-sharifi (F.I.SH) *</label>
                    <input
                      type="text"
                      required
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Masalan: Dr. Sardor Rustamov"
                      className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mutaxassisligi / Mutaxassislik Yo'nalishi</label>
                    <select
                      value={newDocSpecialty}
                      onChange={(e) => setNewDocSpecialty(e.target.value)}
                      className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 focus:border-cyan-500"
                    >
                      <option value="Stomatolog-ortoped">Stomatolog-ortoped</option>
                      <option value="Xirurg-Stomatolog">Xirurg-Stomatolog</option>
                      <option value="Bolalar Stomatologi">Bolalar Stomatologi</option>
                      <option value="Estetik Salomatlik Bo'yicha Ekspert">Estetik Salomatlik Eksperti</option>
                      <option value="Ortodont">Ortodont</option>
                      <option value="Terapevt-Stomatolog">Terapevt-Stomatolog</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddDoctorForm(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all"
                  >
                    Saqlash & Onboard
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Doctor KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinicDoctors.map((doc) => {
              const todayStats = getDocTodayStats(doc.id);
              return (
                <div key={doc.id} className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-4 mb-4">
                    <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2 border-blue-500 shadow-sm" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="text-md font-extrabold text-slate-800">{doc.name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{doc.specialty}</p>
                      
                      <div className="flex items-center text-amber-500 text-xs mt-1.5 gap-1 font-bold">
                        <span>★ {doc.rating.toFixed(1)}</span>
                        <span className="text-slate-400 text-[10px] font-normal font-mono">({doc.ratingCount || 12} sharhlar)</span>
                      </div>
                    </div>
                  </div>

                  {/* Numeric Grid (Screenshot 9 detail) */}
                  <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Bugun</span>
                      <strong className="text-xs font-bold text-slate-750 font-mono">{todayStats.completedCount} kishi</strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Haftalik</span>
                      <strong className="text-xs font-bold text-slate-750 font-mono">{todayStats.completedCount + 15} kishi</strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Erkinligi</span>
                      <strong className="text-xs font-bold text-emerald-600 font-sans">Faol ({doc.status === 'idle' ? 'bo\'sh' : doc.status === 'busy' ? 'band' : 'tushlikda'})</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-450 font-bold">Status:🟢 Qabulga tayyor</span>
                    <button
                      onClick={() => setActiveTab && setActiveTab('shifokor')}
                      className="text-blue-500 hover:text-blue-600 text-xs font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      Kabinetga o'tish <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* -------------------- TAB 4: EDIT SERVICES AND LICENSED PRICES -------------------- */}
      {activeSubTab === 'sozlamalar' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">🔧</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                ⚙ Tibbiy Xizmatlar Katalogi va Narxlar Tahriri
              </h3>
            </div>
            
            <button
              onClick={() => setShowAddServiceForm(!showAddServiceForm)}
              className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              ➕ {showAddServiceForm ? "Yopish" : "Yangi Xizmat Qo'shish"}
            </button>
          </div>

          {srvFeedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-2xl animate-fade-in">
              {srvFeedbackMsg}
            </div>
          )}

          {/* New Service Creation Form Section */}
          {showAddServiceForm && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100 rounded-2xl p-5 space-y-4 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 border-b border-indigo-50 pb-2">
                <span className="text-indigo-600 text-sm">✨</span>
                <strong className="text-xs font-black text-slate-800 uppercase tracking-wider">Samarqand Filialiga Yangi Tibbiy Xizmat Qo'shish</strong>
              </div>

              <form onSubmit={handleCreateServiceSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="col-span-1 sm:col-span-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Xizmat nomi (M-n: Metallokeramika toj kiygizish)</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Protezlash - Metallokeramika"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-black text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-1 sm:col-span-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Narxi (UZS)</label>
                  <input
                    type="number"
                    required
                    placeholder="Masalan: 350000"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-xs font-black text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="col-span-1 sm:col-span-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewServiceName('');
                      setNewServicePrice('');
                      setShowAddServiceForm(false);
                    }}
                    className="w-full py-2.5 bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Saqlash✓
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Inline Edit Form Container */}
          {editingServiceId && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                📝 Xizmat narxini va nomini o'zgartirish oynasi
              </h4>

              <form onSubmit={handleUpdateServiceSubmit} className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Xizmat nomi</label>
                  <input
                    type="text"
                    required
                    value={editingServiceName}
                    onChange={(e) => setEditingServiceName(e.target.value)}
                    className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Narxi (UZS)</label>
                  <input
                    type="number"
                    required
                    value={editingServicePrice}
                    onChange={(e) => setEditingServicePrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingServiceId(null)}
                    className="px-3.5 py-2.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#0284c7] hover:bg-cyan-700 text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0"
                  >
                    Yangilash✓
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of services in a table */}
          <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
            {clinicServices.map((srv) => (
              <div key={srv.id} className="p-3.5 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">{srv.name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Samarqand filiali | ID: {srv.id}
                  </span>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <span className="text-xs font-extrabold font-mono text-cyan-650 bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-100">
                    {srv.price.toLocaleString('uz-UZ')} so'm
                  </span>

                  <button
                    onClick={() => startEditingService(srv)}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0"
                  >
                    Tahrirlash/Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- TAB 5: BILLING AND LICENSE SUBSCRIPTION MONITORING -------------------- */}
      {activeSubTab === 'obuna' && (
        <div className="space-y-6">
          {/* Main Info Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-150/80 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">💳</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                    Oylik Obuna va Litsenziya Nazorati
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-none mt-1">
                    Klinikangizning SaaS va ijra mantiqi bo'yicha to'lov ko'rsatkichlari
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                isSuspended 
                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                  : isTrial 
                  ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                Status: {isSuspended ? "To'xtatilgan" : isTrial ? "Sinov Muddati" : "Faol"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Card 1 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  Navbatdagi to'lov sanasi
                </span>
                <strong className="text-lg text-slate-800 font-semibold block mt-1.5 font-mono">
                  {myClinic?.nextPaymentDate || "Mavjud emas"}
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  {daysDiff <= 0 
                    ? "Muddati o'tgan! Iltimos to'lashni amalga oshiring." 
                    : `SaaS xizmatingiz tugashiga ${daysDiff} kun qoldi.`}
                </span>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  Oylik abonent to'lovi
                </span>
                <strong className="text-lg text-indigo-750 font-semibold block mt-1.5 font-mono">
                  {(myClinic?.rentalPrice || 1500000).toLocaleString('uz-UZ')} so'm
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  Yillik litsenziya imtiyozlari qo'llanilgan.
                </span>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  Klinika Subdomeni
                </span>
                <strong className="text-lg text-emerald-700 font-semibold block mt-1.5 font-mono">
                  {myClinic?.subdomain || currentClinicId}.dstoma.uz
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  Xarita integratsiyasi faollashtirilgan.
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Interactive Billing Form */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 block">
                💳 To'lovni amalga oshirish
              </h4>
              
              {(() => {
                const pendingApprovalInvoice = saasPayments.find(p => p.clinicId === currentClinicId && p.status === 'pending_approval');
                
                if (pendingApprovalInvoice) {
                  return (
                    <div className="space-y-4 text-center py-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        ⏱️
                      </div>
                      <div className="space-y-1">
                        <strong className="text-xs text-slate-800 block">Tasdiqlanish kutilmoqda</strong>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Klinika hisobidan yuborilgan to'lov so'rovi (kod: <code className="font-mono bg-slate-50 px-1 py-0.5 rounded text-[10px]">{pendingApprovalInvoice.id}</code>) superadmin tasdig'ini kutmoqda. Superadmin uni tasdiqlashi bilan daromadga qo'shiladi va obuna uzaytiriladi!
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left space-y-1">
                        <div className="text-[10px] text-slate-405 flex justify-between">
                          <span>Summa:</span> 
                          <span className="font-bold font-mono text-slate-800">{pendingApprovalInvoice.amount.toLocaleString()} UZS</span>
                        </div>
                        <div className="text-[10px] text-slate-405 flex justify-between">
                          <span>Yuborilgan sana:</span> 
                          <span className="font-medium font-mono text-slate-700">{pendingApprovalInvoice.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-normal">
                      Siz bu yerdan oylik to'lov so'rovini superadmin paneliga jo'natishingiz mumkin. Superadmin to'lovni tasdiqlagandan so'ng, tizimingiz muddati uzaytiriladi.
                    </p>

                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center gap-3">
                      <span className="text-lg">💡</span>
                      <p className="text-[11px] text-blue-800 leading-tight">
                        <strong>Trial eslatmasi:</strong> Har qanday ro'yxatdan o'tgan yangi klinika uchun 1 haftalik mutlaqo bepul sinov litsenziyasi avtomatik tarzda taqdim etilgan!
                      </p>
                    </div>

                    <button
                      onClick={() => onSimulatePayment && onSimulatePayment(currentClinicId)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-97 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>💳 Oylik To'lovni Yuborish</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Invoices History Table */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  📜 To'lovlar tarixi monitoringi (Filial bo'yicha)
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">
                  Barcha kvitansiyalar
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-420 font-black tracking-wider uppercase text-[10px]">
                      <th className="py-2.5">Kvitansiya ID</th>
                      <th className="py-2.5">Muddati</th>
                      <th className="py-2.5 text-right">Summa (UZS)</th>
                      <th className="py-2.5">To'langan sana</th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const myPayments = saasPayments.filter(p => p.clinicId === currentClinicId);
                      if (myPayments.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold text-[11px]">
                              Hozircha birorta ham to'lov hujjatlari topilmadi.
                            </td>
                          </tr>
                        );
                      }

                      return myPayments.map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-mono font-bold text-slate-800 text-[11px]">{pay.id}</td>
                          <td className="py-3 text-slate-600 font-medium font-mono">{pay.dueDate}</td>
                          <td className="py-3 text-right font-bold text-slate-800 font-mono">
                            {pay.amount.toLocaleString()} UZS
                          </td>
                          <td className="py-3 font-mono text-slate-500">
                            {pay.paymentDate || "—"}
                          </td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                              pay.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : pay.status === 'pending_approval'
                                ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {pay.status === 'confirmed' ? "Tasdiqlangan" : pay.status === 'pending_approval' ? "Kutilmoqda" : "To'lanmagan"}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- FOOTER (SCREENSHOT 5) ----------------- */}
      <footer className="pt-8 border-t border-slate-200 mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs text-slate-400 font-semibold select-none pb-4">
          <p>© 2025-2026 DStoma Clinic Boss Panel. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-1.5 text-slate-500">
            Klinika hisoboti avtomatik tarzda shakllanadi.
          </div>
        </div>
      </footer>
    </div>
  );
}
