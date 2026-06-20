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
  onDeleteService?: (serviceId: string) => void;
  clinicId?: string;
  onSimulatePayment?: (clinicId: string) => void;
  saasPayments?: SaaSPayment[];
  language: Language;
}

interface CatalogItem {
  name: string;
  price: number;
}

interface CatalogCategory {
  categoryNameUz: string;
  categoryNameEn: string;
  categoryNameRu: string;
  items: CatalogItem[];
}

export const STANDARD_SERVICES_CATALOG: CatalogCategory[] = [
  {
    categoryNameUz: "Tishlar diagnostikasi",
    categoryNameEn: "Teeth Diagnostics",
    categoryNameRu: "Диагностика зубов",
    items: [
      { name: "Tish rentgeni", price: 25000 }
    ]
  },
  {
    categoryNameUz: "Terapevtik stomatologiya",
    categoryNameEn: "Therapeutic Dentistry",
    categoryNameRu: "Терапевтическая стоматология",
    items: [
      { name: "Kariesni davolash", price: 300000 },
      { name: "Pulpitni davolash (1 ta ildiz kanali)", price: 180000 },
      { name: "Pulpitni davolash (2 ta ildiz kanali)", price: 220000 },
      { name: "Pulpitni davolash (3 ta ildiz kanali)", price: 250000 },
      { name: "Kompozit plomba", price: 230000 },
      { name: "Nurli (svetovaya) plomba", price: 300000 },
      { name: "Shloionomerli sement", price: 200000 },
      { name: "«Unisem» sementi", price: 150000 },
      { name: "Tishlarni o'stirish (badiiy restavratsiya)", price: 500000 },
      { name: "Stomatitni davolash", price: 100000 },
      { name: "Otok (yiring haydash/drenaj)", price: 100000 },
      { name: "Pulposeptin", price: 120000 },
      { name: "Kalsiy saqlovchi pasta", price: 120000 },
      { name: "3 ta kanalni qayta ochish (Re ENDO)", price: 500000 },
      { name: "1 ta kanalni qayta ochish (Re ENDO)", price: 250000 },
      { name: "Kanaldan asbob siniqlarini olib tashlash (bitta kanal)", price: 500000 }
    ]
  },
  {
    categoryNameUz: "Tishlarni oqartirish",
    categoryNameEn: "Teeth Whitening",
    categoryNameRu: "Отбеливание зубов",
    items: [
      { name: "Zoom 4 oqartirish tizimi", price: 5000000 },
      { name: "Amazing White oqartirish tizimi", price: 3250000 },
      { name: "Kanal ichini oqartirish", price: 500000 },
      { name: "Opalescence oqartirish tizimi", price: 2000000 }
    ]
  },
  {
    categoryNameUz: "Vinirlar turlari",
    categoryNameEn: "Veneers",
    categoryNameRu: "Виды виниров",
    items: [
      { name: "Keramik vinir o'rnatish", price: 3500000 },
      { name: "Kompozit vinir o'rnatish", price: 1500000 },
      { name: "Tsirkoniy vinir o'rnatish", price: 2500000 },
      { name: "E-max vinir o'rnatish", price: 3500000 }
    ]
  },
  {
    categoryNameUz: "Xirurgik stomatologiya",
    categoryNameEn: "Surgical Dentistry",
    categoryNameRu: "Хирургическая стоматология",
    items: [
      { name: "Tish olish", price: 200000 },
      { name: "Aqlli tishni olish", price: 450000 },
      { name: "Retenirlangan 8-tishni (chiqmagan aqlli tishni) olish", price: 650000 },
      { name: "Tish kistasi va granulomasini olish", price: 1800000 },
      { name: "Loskutli operatsiyalar", price: 1500000 },
      { name: "Sinus-lifting", price: 2800000 },
      { name: "Murakkab tish olish", price: 725000 },
      { name: "Tish milk kapshonini kesish", price: 275000 },
      { name: "Vestibuloplastika", price: 750000 },
      { name: "Implant tishni olib tashlash", price: 1000000 },
      { name: "Tish ildizini olish", price: 200000 },
      { name: "Tish ildizi uchini rezeksiya qilish", price: 1325000 },
      { name: "Og'iz bo'shlig'i abssessini davolash", price: 350000 }
    ]
  },
  {
    categoryNameUz: "Tishlarni protezlash",
    categoryNameEn: "Teeth Prosthesis",
    categoryNameRu: "Протезирование зубов",
    items: [
      { name: "Shtamplangan tish g'ilofi (koronka) o'rnatish", price: 300000 },
      { name: "Byugel protezini o'rnatish", price: 4600000 },
      { name: "Ko'chmaydigan protez o'rnatish", price: 3150000 },
      { name: "Mikroprotezlash", price: 590000 },
      { name: "Neylon protez o'rnatish", price: 2320000 },
      { name: "Akril protez o'rnatish", price: 1750000 },
      { name: "T-kristall protez o'rnatish", price: 3000000 },
      { name: "Kvadroti protez o'rnatish", price: 1800000 },
      { name: "Teleskopik protez", price: 6500000 },
      { name: "Metallo-keramika koronka", price: 500000 },
      { name: "Professional metallo-keramika koronka", price: 700000 },
      { name: "Tsirkoniy dioksidli koronka", price: 1450000 },
      { name: "Plastmassa koronka o'rnatish", price: 150000 }
    ]
  },
  {
    categoryNameUz: "Ortodontiya",
    categoryNameEn: "Orthodontics",
    categoryNameRu: "Ортодонтия",
    items: [
      { name: "Tish plastinkalarini o'rnatish", price: 1200000 },
      { name: "Reteynerlar o'rnatish", price: 500000 },
      { name: "Metall breketlar o'rnatish", price: 2800000 },
      { name: "Keramik breketlar o'rnatish", price: 4000000 },
      { name: "Sapfir breketlar o'rnatish", price: 4500000 },
      { name: "Samoliguratsiyalanuvchi (o'zi qulflanadigan) breketlar", price: 5200000 },
      { name: "Damon breketlarini o'rnatish", price: 9000000 }
    ]
  },
  {
    categoryNameUz: "Bolalar stomatologiya bo‘limi",
    categoryNameEn: "Pediatric Dentistry",
    categoryNameRu: "Детская стоматология",
    items: [
      { name: "Bolalar tishini olish", price: 200000 },
      { name: "Bolalar tishini plomba qilish", price: 330000 },
      { name: "Bolalar tishi fissuralarini germetizatsiya qilish", price: 200000 },
      { name: "Bolalarga breket o'rnatish", price: 2000000 },
      { name: "Bolalarda pulpitni davolash", price: 230000 }
    ]
  },
  {
    categoryNameUz: "Implantatsiya",
    categoryNameEn: "Teeth Implantology",
    categoryNameRu: "Имплантация",
    items: [
      { name: "Mini-implant o'rnatish", price: 1000000 },
      { name: "Implant ustiga koronka qo'yish", price: 2650000 },
      { name: "Bir lahzali (bir vaqtdagi) implantatsiya", price: 4225000 },
      { name: "Bir bosqichli tish implantatsiyasi", price: 5000000 },
      { name: "Alpha Bio implanti o'rnatish", price: 4000000 },
      { name: "Osstem implanti o'rnatish", price: 3300000 },
      { name: "MegaGen implanti o'rnatish", price: 3250000 }
    ]
  },
  {
    categoryNameUz: "Profilaktik gigiyena",
    categoryNameEn: "Preventive Hygiene",
    categoryNameRu: "Профилактическая гигиена",
    items: [
      { name: "Tish toshlarini olib tashlash (bitta jag')", price: 200000 },
      { name: "Fissuralarni germetizatsiya qilish (bitta tish)", price: 175000 },
      { name: "Tishlarni silliqlash (polirovka)", price: 100000 },
      { name: "Air Flow yordamida tishlarni tozalash (bitta jag')", price: 250000 },
      { name: "Ftorlash (ftor lak bilan qoplash)", price: 100000 },
      { name: "Har ikkala jag'ning umumiy profilaktik gigiyenasi", price: 600000 }
    ]
  }
];

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
  onDeleteService,
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
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

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

  // Pre-defined catalog selection & search states
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<number>(0);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [customCatalogPrices, setCustomCatalogPrices] = useState<Record<string, number>>({});

  // Filter lists based on Samarqand clinic (the default CEO location)
  const currentClinicId = clinicId || 'samarqand';
  const clinicDoctors = doctors.filter(d => d.clinicId === currentClinicId);
  const clinicServices = services.filter(s => s.clinicId === currentClinicId);
  const clinicQueues = queues.filter(q => q.clinicId === currentClinicId);

  // Filter queues by status
  const pendingQueues = clinicQueues.filter(q => q.status === 'pending');
  const callingQueues = clinicQueues.filter(q => q.status === 'calling' || q.status === 'in_progress');
  const completedQueues = clinicQueues.filter(q => q.status === 'completed');

  // Weekly historical table data dynamically calculated
  const getDailyStats = () => {
    const reportList = [];
    const today = new Date();
    // Generate data for the last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isToday = i === 0;
      
      const dayNameUz = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'][d.getDay()];
      const dayNameRu = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][d.getDay()];
      const dayNameEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
      
      let dayName = language === 'ru' ? dayNameRu : language === 'en' ? dayNameEn : dayNameUz;
      if (isToday) {
         dayName = language === 'ru' ? 'Сегодня' : language === 'en' ? 'Today' : 'Bugun';
      }

      const dateStr = d.toLocaleDateString('ru-RU');
      
      // Filter completed queues for this specific day
      const dayQueues = clinicQueues.filter(q => {
        if (q.status !== 'completed') return false;
        // fallback to today if createdAt doesn't exist, though it should
        const qDate = q.createdAt ? new Date(q.createdAt) : new Date();
        return qDate.getDate() === d.getDate() && qDate.getMonth() === d.getMonth() && qDate.getFullYear() === d.getFullYear();
      });

      const getPrice = (id: string) => {
        return services.find(s => s.id === id)?.price || 0;
      };

      const patientsCount = dayQueues.length;
      const revenue = dayQueues.reduce((sum, q) => sum + getPrice(q.serviceId), 0);
      const avgRating = dayQueues.filter(q => q.rating).length > 0 
        ? dayQueues.reduce((sum, q) => sum + (q.rating || 5), 0) / dayQueues.filter(q => q.rating).length 
        : 5.0;

      reportList.push({ dayName, dateStr, patientsCount, revenue, avgRating });
    }
    return reportList;
  };

  const weeklyReportData = getDailyStats();
  const weeklyTotalRevenue = weeklyReportData.reduce((sum, d) => sum + d.revenue, 0);
  const weeklyTotalPatients = weeklyReportData.reduce((sum, d) => sum + d.patientsCount, 0);

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
          <div className="bg-white text-slate-800 rounded-3xl p-5 max-w-lg w-full border border-slate-100 shadow-2xl space-y-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-800">
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
            <div className="lg:col-span-8 bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/80 shadow-md">
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
                                onClick={() => setDoctorToDelete(doc)}
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
            <div className="lg:col-span-4 bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/80 shadow-md">
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
          <div className="bg-white text-slate-800 rounded-3xl p-6 border border-slate-150/80 shadow-lg space-y-6">
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
          <div className="lg:col-span-5 bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/80 shadow-md">
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
            <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Kunlik daromad grafigi (so'm)
                </h4>
                <span className="text-[11px] bg-blue-50 text-blue-800 font-mono font-extrabold px-2 py-0.5 rounded-full">
                  Haftalik jami: {weeklyTotalRevenue.toLocaleString('uz-UZ')} UZS
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
                    const maxRevenue = Math.max(...weeklyReportData.map(d => d.revenue), 1000000);
                    const points = weeklyReportData.map((d, index) => {
                      const x = 40 + index * 70;
                      // ensure y doesn't break if maxRevenue is 0
                      const yOffset = maxRevenue > 0 ? (d.revenue / maxRevenue) * 105 : 0;
                      const y = 130 - yOffset;
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
                  {weeklyReportData.map((d, idx) => (
                    <span key={idx}>{language === 'uz' ? d.dayName.substring(0, 3) : language === 'ru' ? d.dayName.substring(0, 2) : d.dayName.substring(0, 3)}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: Kunlik bemorlar count line chart */}
            <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Kunlik tashrif buyurgan bemorlar soni
                </h4>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-mono font-extrabold px-2 py-0.5 rounded-full">
                  Haftalik jami: {weeklyTotalPatients} bemor
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
                    const maxPatients = Math.max(...weeklyReportData.map(d => d.patientsCount), 5);
                    const points = weeklyReportData.map((d, index) => {
                      const x = 40 + index * 70;
                      const yOffset = maxPatients > 0 ? (d.patientsCount / maxPatients) * 105 : 0;
                      const y = 130 - yOffset;
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
                  {weeklyReportData.map((d, idx) => (
                    <span key={idx}>{language === 'uz' ? d.dayName.substring(0, 3) : language === 'ru' ? d.dayName.substring(0, 2) : d.dayName.substring(0, 3)}</span>
                  ))}
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
        <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/80 shadow-md space-y-6">
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

          {/* 1. Standard Dental Services Catalog Selector Section */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
              <div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-700 font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-lg border border-indigo-200">
                  {language === 'uz' ? "🏥 Standart Tibbiy Xizmatlar Katalogi (Tezkor tanlash)" : language === 'ru' ? "🏥 Каталог Стандартных Медицинских Услуг (Быстрый выбор)" : "🏥 Standard Medical Services Catalog (Quick add)"}
                </span>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mt-1.5">
                  {language === 'uz' ? "Xizmatlarni bir marta bosish orqali qo'shish (Narxini kiritish shart emas)" : language === 'ru' ? "Добавление услуг в один клик (Можно настроить свою цену)" : "Add services with a single click (Customize price dynamically)"}
                </h4>
              </div>

              {/* Catalog Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'uz' ? "Katalogdan qidirish..." : language === 'ru' ? "Поиск по каталогу..." : "Search catalog..."}
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  className="bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl pl-8 pr-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-56"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Catalog Categories Grid / Selector Tabs */}
            {!catalogSearchQuery && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {STANDARD_SERVICES_CATALOG.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCatalogCategory(idx)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      selectedCatalogCategory === idx
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {language === 'uz' ? cat.categoryNameUz : language === 'ru' ? cat.categoryNameRu : cat.categoryNameEn}
                  </button>
                ))}
              </div>
            )}

            {/* Listed catalog items inside selected category or matching query */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1 customize-scrollbar">
              {(() => {
                const results: { name: string; price: number; category: string }[] = [];
                STANDARD_SERVICES_CATALOG.forEach(cat => {
                  const categoryName = language === 'uz' ? cat.categoryNameUz : language === 'ru' ? cat.categoryNameRu : cat.categoryNameEn;
                  cat.items.forEach(itm => {
                    const matchesSearch = !catalogSearchQuery || itm.name.toLowerCase().includes(catalogSearchQuery.toLowerCase());
                    const matchesCategory = catalogSearchQuery || STANDARD_SERVICES_CATALOG.indexOf(cat) === selectedCatalogCategory;
                    if (matchesSearch && matchesCategory) {
                      results.push({ ...itm, category: categoryName });
                    }
                  });
                });

                if (results.length === 0) {
                  return (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 font-bold">
                      {language === 'uz' ? "Katalogda bunday nomli xizmat topilmadi 🔍" : language === 'ru' ? "Услуга с таким названием не найдена в каталоге 🔍" : "No matching catalog services found 🔍"}
                    </div>
                  );
                }

                return results.map((item, idX) => {
                  const isActive = clinicServices.some(s => s.name.toLowerCase() === item.name.toLowerCase());
                  const activePrice = clinicServices.find(s => s.name.toLowerCase() === item.name.toLowerCase())?.price;
                  const customPrice = customCatalogPrices[item.name] !== undefined ? customCatalogPrices[item.name] : item.price;
                  return (
                    <div 
                      key={idX} 
                      className={`p-4 rounded-3xl border transition-all flex flex-col justify-between gap-3 bg-white ${
                        isActive 
                          ? 'border-emerald-200 bg-emerald-50/10 shadow-xs' 
                          : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <span className="text-[8px] font-mono font-black text-indigo-500 uppercase tracking-widest block mb-1">
                          {item.category}
                        </span>
                        <h5 className="text-[12px] font-black text-slate-800 leading-snug">
                          {item.name}
                        </h5>
                      </div>
                      
                      {isActive ? (
                        <div className="flex flex-col gap-1 w-full border-t border-slate-100 pt-2.5 mt-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {language === 'uz' ? "Amaldagi narx:" : language === 'ru' ? "Текущая цена:" : "Current price:"}
                            </span>
                            <span className="text-xs font-black text-emerald-700 font-mono">
                              {activePrice?.toLocaleString('uz-UZ')} {language === 'uz' ? "so'm" : language === 'ru' ? "сум" : "UZS"}
                            </span>
                          </div>
                          <div className="flex items-center justify-end mt-1">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100/60 text-emerald-800 text-[8px] font-black uppercase flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {language === 'uz' ? "Klinikada faol" : language === 'ru' ? "Активна в клинике" : "Active in clinic"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 w-full border-t border-slate-100 pt-2.5 mt-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {language === 'uz' ? "Tavsiya etilgan:" : language === 'ru' ? "Рекомендуемая:" : "Recommended:"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 font-mono">
                              {item.price.toLocaleString('uz-UZ')} {language === 'uz' ? "so'm" : language === 'ru' ? "сум" : "UZS"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 justify-between">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={customPrice}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setCustomCatalogPrices(prev => ({ ...prev, [item.name]: val }));
                                }}
                                className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-xs font-black text-slate-800 rounded-xl pl-2 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-mono"
                                placeholder={language === 'uz' ? "Narx" : language === 'ru' ? "Цена" : "Price"}
                              />
                              <span className="absolute right-2 top-2 text-[8px] text-slate-400 font-bold uppercase">{language === 'uz' ? "so'm" : language === 'ru' ? "сум" : "UZS"}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const newSrv: Service = {
                                  id: `srv_${currentClinicId}_std_${Date.now()}_${idX}_${Math.floor(Math.random() * 100)}`,
                                  clinicId: currentClinicId,
                                  name: item.name,
                                  price: customPrice
                                };
                                if (onAddService) {
                                  onAddService(newSrv);
                                  setSrvFeedbackMsg(language === 'uz' ? `"${item.name}" yangi narx bilan qo'shildi!` : language === 'ru' ? `"${item.name}" добавлена с новой ценой!` : `"${item.name}" standard service added with customized price!`);
                                  setTimeout(() => setSrvFeedbackMsg(''), 4000);
                                }
                              }}
                              className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-xs"
                            >
                              ➕ {language === 'uz' ? "Qo'shish" : language === 'ru' ? "Добавить" : "Add"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* New Service Creation Form Section (Manual Custom Input fallback if they have unique local service) */}
          {showAddServiceForm && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100 rounded-2xl p-5 space-y-4 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 border-b border-indigo-50 pb-2">
                <span className="text-indigo-600 text-sm">✨</span>
                <strong className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {language === 'uz' ? "Katalogdan Tashqari Maxsus Noyob Xizmat Qo'shish" : language === 'ru' ? "Добавить индивидуальную услугу вне каталога" : "Add custom medical service outside catalog"}
                </strong>
              </div>

              <form onSubmit={handleCreateServiceSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="col-span-1 sm:col-span-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    {language === 'uz' ? "Xizmat nomi (Masalan: Maxsus implantatsiyadan keyingi terapiya)" : language === 'ru' ? "Название услуги (Например: Особая послеимплантационная терапия)" : "Service Name (e.g., Special post-implant therapeutics)"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'uz' ? "Masalan: Maxsus muolaja" : language === 'ru' ? "Например: Особая процедура" : "e.g. Special procedure"}
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-black text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-1 sm:col-span-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">{language === 'uz' ? "Narxi (UZS)" : language === 'ru' ? "Цена (UZS)" : "Price (UZS)"}</label>
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
                    {language === 'uz' ? "Bekor qilish" : language === 'ru' ? "Отмена" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {language === 'uz' ? "Saqlash✓" : language === 'ru' ? "Сохранить✓" : "Save✓"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Inline Edit Form Container */}
          {editingServiceId && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {language === 'uz' ? "📝 Xizmat narxini va nomini o'zgartirish oynas" : language === 'ru' ? "📝 Окно редактирования названия и цены услуги" : "📝 Modify Service Name and Price Window"}
              </h4>

              <form onSubmit={handleUpdateServiceSubmit} className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">{language === 'uz' ? "Xizmat nomi" : language === 'ru' ? "Название услуги" : "Service Name"}</label>
                  <input
                    type="text"
                    required
                    value={editingServiceName}
                    onChange={(e) => setEditingServiceName(e.target.value)}
                    className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">{language === 'uz' ? "Narxi (UZS)" : language === 'ru' ? "Цена (UZS)" : "Price (UZS)"}</label>
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
                    {language === 'uz' ? "Bekor qilish" : language === 'ru' ? "Отмена" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#0284c7] hover:bg-cyan-700 text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0"
                  >
                    {language === 'uz' ? "Yangilash✓" : language === 'ru' ? "Обновить✓" : "Update✓"}
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
                    {myClinic?.name || currentClinicId} | ID: {srv.id}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                  <span className="text-xs font-extrabold font-mono text-cyan-650 bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-100">
                    {srv.price.toLocaleString('uz-UZ')} {language === 'uz' ? "so'm" : language === 'ru' ? "сум" : "UZS"}
                  </span>

                  <button
                    onClick={() => startEditingService(srv)}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0"
                  >
                    {language === 'uz' ? "Tahrirlash" : language === 'ru' ? "Редактировать" : "Edit"}
                  </button>

                  <button
                    onClick={() => setServiceToDelete(srv)}
                    className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0"
                  >
                    {language === 'uz' ? "O'chirish" : language === 'ru' ? "Удалить" : "Delete"}
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
          <div className="bg-white text-slate-800 rounded-3xl p-6 border border-slate-150/80 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">💳</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                    {language === 'uz' ? "Oylik Obuna va Litsenziya Nazorati" : language === 'ru' ? "Ежемесячный Контроль Лицензий и Подписок" : "Monthly SaaS License & Subscription Gate"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-none mt-1">
                    {language === 'uz' ? "Klinikangizning SaaS va ijra mantiqi bo'yicha to'lov ko'rsatkichlari" : language === 'ru' ? "Метрики платежей и финансовый статус по аренде вашей клиники" : "Active tenant subscription financials and rental payment parameters"}
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
                Status: {isSuspended ? (language === 'uz' ? "To'xtatilgan" : language === 'ru' ? "Блокирован" : "Suspended") : isTrial ? (language === 'uz' ? "Sinov muddati" : language === 'ru' ? "Пробный период" : "Trial Phase") : (language === 'uz' ? "Faol" : language === 'ru' ? "Активен" : "Active")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Card 1 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {language === 'uz' ? "Navbatdagi to'lov sanasi" : language === 'ru' ? "Дата следующего платежа" : "Next Payment Due date"}
                </span>
                <strong className="text-lg text-slate-800 font-semibold block mt-1.5 font-mono">
                  {myClinic?.nextPaymentDate || (language === 'uz' ? "Mavjud emas" : language === 'ru' ? "Нет данных" : "N/A")}
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  {daysDiff <= 0 
                    ? (language === 'uz' ? "Muddati o'tgan! Iltimos to'lashni amalga oshiring." : language === 'ru' ? "Просрочено! Пожалуйста, произведите оплату." : "Overdue penalty! Please wire the subscription fee.") 
                    : language === 'uz' 
                    ? `SaaS xizmatingiz tugashiga ${daysDiff} kun qoldi.` 
                    : language === 'ru' 
                    ? `До окончания SaaS подписки осталось ${daysDiff} дней.` 
                    : `${daysDiff} calendar days remaining in your active session.`}
                </span>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {language === 'uz' ? "Oylik abonent to'lovi" : language === 'ru' ? "Ежемесячная абонентская плата" : "Monthly SaaS recurring price"}
                </span>
                <strong className="text-lg text-indigo-750 font-semibold block mt-1.5 font-mono">
                  {(myClinic?.rentalPrice || 1500000).toLocaleString('uz-UZ')} {language === 'uz' ? "so'm" : language === 'ru' ? "сум" : "UZS"}
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  {language === 'uz' ? "Yillik litsenziya imtiyozlari qo'llanilgan." : language === 'ru' ? "Применены льготы годовой лицензии." : "Annual tier corporate loyalty discount applied."}
                </span>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {language === 'uz' ? "Klinika Subdomeni" : language === 'ru' ? "Субдомен клиники" : "Clinic Subdomain"}
                </span>
                <strong className="text-lg text-emerald-700 font-semibold block mt-1.5 font-mono">
                  {myClinic?.subdomain || currentClinicId}.dstoma-navbat-lk2p.vercel.app
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  {language === 'uz' ? "Xarita integratsiyasi faollashtirilgan." : language === 'ru' ? "Интеграция с картами включена." : "Google Maps routing systems active."}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-slate-800">
            {/* Interactive Billing Form */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 block">
                💳 {language === 'uz' ? "To'lovni amalga oshirish" : language === 'ru' ? "Произвести платеж" : "Wire / Submit recurring fee"}
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
                        <strong className="text-xs text-slate-800 block">
                          {language === 'uz' ? "Tasdiqlanish kutilmoqda" : language === 'ru' ? "Ожидает подтверждения" : "Pending admin validation"}
                        </strong>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          {language === 'uz' 
                            ? `Klinika hisobidan yuborilgan to'lov so'rovi (kod: ${pendingApprovalInvoice.id}) superadmin tasdig'ini kutmoqda. Superadmin uni tasdiqlashi bilan daromadga qo'shiladi va obuna uzaytiriladi!` 
                            : language === 'ru' 
                            ? `Запрос на проведение платежа (код: ${pendingApprovalInvoice.id}) ожидает одобрения суперадминистратора. Как только он одобрит, подписка автоматически продлится!` 
                            : `Rental payment proposal (inv-id: ${pendingApprovalInvoice.id}) is waiting for manual SaaS owner verification. Once approved, your validity extends instantly!`
                          }
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left space-y-1">
                        <div className="text-[10px] text-slate-405 flex justify-between">
                          <span>{language === 'uz' ? "Summa:" : language === 'ru' ? "Сумма:" : "Amount:"}</span> 
                          <span className="font-bold font-mono text-slate-800">{pendingApprovalInvoice.amount.toLocaleString()} UZS</span>
                        </div>
                        <div className="text-[10px] text-slate-405 flex justify-between">
                          <span>{language === 'uz' ? "Yuborilgan sana:" : language === 'ru' ? "Дата подачи:" : "Submission date:"}</span> 
                          <span className="font-medium font-mono text-slate-700">{pendingApprovalInvoice.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-normal">
                      {language === 'uz' 
                        ? "Siz bu yerdan oylik to'lov so'rovini superadmin paneliga jo'natishingiz mumkin. Superadmin to'lovni tasdiqlagandan so'ng, tizimingiz muddati uzaytiriladi." 
                        : language === 'ru' 
                        ? "Здесь вы можете отправить запрос на подтверждение платежа в панель суперадминистратора. После одобрения срок действия платформы продлится." 
                        : "Submit a payment clearance ticket directly to the superadmin desk. Once validated, your SaaS tenant license lease terms will extend accordingly."}
                    </p>

                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center gap-3">
                      <span className="text-lg">💡</span>
                      <p className="text-[11px] text-blue-800 leading-tight">
                        <strong>Trial:</strong> {language === 'uz' ? "Har qanday ro'yxatdan o'tgan yangi klinika uchun 1 haftalik mutlaqo bepul sinov litsenziyasi avtomatik tarzda taqdim etilgan!" : language === 'ru' ? "Для каждой новой зарегистрированной клиники автоматически предоставляется 1 неделя бесплатного триал-периода!" : "A 7-day complimentary developer/tester sandbox evaluation lease is provisioned for every newly deployed clinic!"}
                      </p>
                    </div>

                    <button
                      onClick={() => onSimulatePayment && onSimulatePayment(currentClinicId)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-97 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>💳 {language === 'uz' ? "Oylik To'lovni Yuborish" : language === 'ru' ? "Отправить ежемесячный платеж" : "Defray Monthly SaaS Renewal"}</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Invoices History Table */}
            <div className="lg:col-span-8 bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/80 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  📜 {language === 'uz' ? "To'lovlar tarixi monitoringi (Filial bo'yicha)" : language === 'ru' ? "Мониторинг истории платежей по филиалу" : "Saas Invoicing & Clearance Ledger history"}
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">
                  {language === 'uz' ? "Barcha kvitansiyalar" : language === 'ru' ? "Все квитанции" : "All Receipts"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-420 font-black tracking-wider uppercase text-[10px]">
                      <th className="py-2.5">{language === 'uz' ? "Kvitansiya ID" : language === 'ru' ? "ID Квитанции" : "Receipt ID"}</th>
                      <th className="py-2.5">{language === 'uz' ? "Muddati" : language === 'ru' ? "Срок действия" : "Due Date"}</th>
                      <th className="py-2.5 text-right">{language === 'uz' ? "Summa (UZS)" : language === 'ru' ? "Сумма (UZS)" : "Amount (UZS)"}</th>
                      <th className="py-2.5">{language === 'uz' ? "To'langan sana" : language === 'ru' ? "Дата оплаты" : "Settlement Date"}</th>
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
                              {language === 'uz' ? "Hozircha birorta ham to'lov hujjatlari topilmadi." : language === 'ru' ? "Платежные документы на текущий момент отсутствуют." : "No invoicing records or past transactions exist for this tenant."}
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
                              {pay.status === 'confirmed' ? (language === 'uz' ? "Tasdiqlangan" : language === 'ru' ? "Одобрено" : "Settled") : pay.status === 'pending_approval' ? (language === 'uz' ? "Kutilmoqda" : language === 'ru' ? "Ожидает" : "Pending") : (language === 'uz' ? "To'lanmagan" : language === 'ru' ? "Не уплачено" : "Unpaid")}
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
          <p>© 2025-2026 DStoma Clinic Boss Panel. {language === 'uz' ? "Barcha huquqlar himoyalangan." : language === 'ru' ? "Все права защищены." : "All rights reserved."}</p>
          <div className="flex items-center gap-1.5 text-slate-500">
            {language === 'uz' ? "Klinika hisoboti avtomatik tarzda shakllanadi." : language === 'ru' ? "Отчеты клиники генерируются автоматически." : "Clinical ledger statements dynamically assembled."}
          </div>
        </div>
      </footer>

      {/* DELETE DOCTOR CONFIRMATION MODAL */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-3xl">👨‍⚕️</span>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {language === 'uz' ? "Shifokorni o'chirish" : language === 'ru' ? "Удалить врача" : "Delete Doctor"}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {language === 'uz'
                ? `"${doctorToDelete.name}" shifokorini o'chirishni tasdiqlaysizmi?`
                : language === 'ru'
                ? `Вы действительно хотите удалить врача "${doctorToDelete.name}"?`
                : `Are you sure you want to delete doctor "${doctorToDelete.name}"?`
              }
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => setDoctorToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                {language === 'uz' ? "Bekor qilish" : language === 'ru' ? "Отмена" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  onDeleteDoctor?.(doctorToDelete.id);
                  setDoctorToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                {t("O'chirish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SERVICE CONFIRMATION MODAL */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-3xl">⚙️</span>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {language === 'uz' ? "Xizmatni o'chirish" : language === 'ru' ? "Удалить услугу" : "Delete Service"}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {language === 'uz'
                ? `Haqiqatdan ham "${serviceToDelete.name}" xizmatini o'chirmoqchimisiz?`
                : language === 'ru'
                ? `Вы действительно хотите удалить услугу "${serviceToDelete.name}"?`
                : `Are you sure you want to delete "${serviceToDelete.name}"?`
              }
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                {language === 'uz' ? "Bekor qilish" : language === 'ru' ? "Отмена" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  if (onDeleteService) onDeleteService(serviceToDelete.id);
                  else {
                    const idx = services.findIndex(s => s.id === serviceToDelete.id);
                    if (idx > -1) services.splice(idx, 1);
                  }
                  setServiceToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                 {t("O'chirish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
