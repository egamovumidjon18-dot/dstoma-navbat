import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clinic, Doctor, Service, QueueItem, SaaSPayment, DoctorClinicLink, Patient } from '../types';
import { decodeLegacyEntities } from '../utils/textFormat';
import { TRANSLATIONS, Language, translateMedicalText } from '../translations';
import MaterialsInventory from './MaterialsInventory';
import VisitsJournal, { visitDateKey } from './VisitsJournal';
import { toDateKey } from '../utils/doctorSchedule';
import { 
  Users, 
  DollarSign, 
  Clock, 
  Plus, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Search,
  ArrowLeft,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  LogOut
} from 'lucide-react';
import Statistics from './Statistics';
import { LanguageSwitcher } from './LanguageSwitcher';
import InstallAppBanner from './InstallAppBanner';

interface DirectorDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  patients?: Patient[];
  onDeletePatient?: (patientId: string) => void;
  setActiveTab?: (tab: 'bemor' | 'shifokor' | 'boshliq' | 'kod' | 'superadmin') => void;
  onAddDoctor?: (newDoc: Doctor) => void | Promise<boolean>;
  onDeleteDoctor?: (doctorId: string) => void;
  doctorClinicLinks?: DoctorClinicLink[];
  onSaveDoctorClinicLink?: (link: DoctorClinicLink) => void;
  onDeleteDoctorClinicLink?: (linkId: string) => void;
  onUpdateService?: (updatedService: Service) => void;
  onAddService?: (newService: Service) => void | Promise<boolean>;
  onDeleteService?: (serviceId: string) => void;
  onCancelQueue?: (id: string) => void;
  onLogout?: () => void;
  clinicId?: string;
  onSimulatePayment?: (clinicId: string) => void;
  saasPayments?: SaaSPayment[];
  language: Language;
  setLanguage?: (l: Language) => void;
  // Required by the authenticated report/billing endpoints. Without it the
  // Statistics payments tab silently returns empty for directors.
  staffToken?: string | null;
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
  patients = [],
  onDeletePatient,
  setActiveTab,
  onAddDoctor,
  onDeleteDoctor,
  doctorClinicLinks = [],
  onSaveDoctorClinicLink,
  onUpdateService,
  onAddService,
  onDeleteService,
  onCancelQueue,
  onLogout,
  clinicId,
  onSimulatePayment,
  saasPayments = [],
  language,
  setLanguage,
  staffToken
}: DirectorDashboardProps) {
  
  // Translation Helper
  const t = (text: string) => {
    if (!language) return text;
    
    // Look up in global configurations if text acts as a key
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof typeof TRANSLATIONS['uz']];
    }

    type LocalDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
    const dict: Record<string, LocalDictEntry> = {
      "boshqaruv markazi": { ru: "Центр управления", en: "Control Center", kk: "Басқару орталығы", ky: "Башкаруу борбору", tg: "Маркази идоракунӣ", tk: "Dolandyryş merkezi" },
      "chipta": { ru: "Талон", en: "Ticket", kk: "Талон", ky: "Талон", tg: "Чипта", tk: "Bilet" },
      "klinika havolasi": { ru: "Ссылка на клинику", en: "Clinic link", kk: "Клиника сілтемесі", ky: "Клиника шилтемеси", tg: "Пайванди клиника", tk: "Klinika salgysy" },
      "uzs": { ru: "UZS", en: "UZS", kk: "UZS", ky: "UZS", tg: "UZS", tk: "UZS" },
      "⚠️ oylik to'lov muddati bo'yicha eslatma": { ru: "⚠️ Напоминание о сроке ежемесячной оплаты", en: "⚠️ Monthly payment due reminder", kk: "⚠️ Айлық төлем мерзімі туралы еске салу", ky: "⚠️ Айлык төлөм мөөнөтү тууралуу эскертүү", tg: "⚠️ Ёдоварӣ дар бораи мӯҳлати пардохти моҳона", tk: "⚠️ Aýlyk töleg möhleti barada ýatlatma" },
      "👑 boshliq paneli": { ru: "👑 Панель директора", en: "👑 Director Panel", kk: "👑 Басшы панелі", ky: "👑 Жетекчи панели", tg: "👑 Панели роҳбар", tk: "👑 Ýolbaşçy paneli" },
      "asosiy kabinet": { ru: "Главный кабинет", en: "Main Cabinet", kk: "Негізгі кабинет", ky: "Негизги кабинет", tg: "Кабинети асосӣ", tk: "Esasy kabinet" },
      "bemor qidirish": { ru: "Поиск пациентов", en: "Search Patients", kk: "Пациент іздеу", ky: "Бейтап издөө", tg: "Ҷустуҷӯи бемор", tk: "Näsag gözlemek" },
      "bemorlarni qidirish": { ru: "Поиск пациентов", en: "Search Patients", kk: "Пациенттерді іздеу", ky: "Бейтаптарды издөө", tg: "Ҷустуҷӯи беморон", tk: "Näsaglary gözlemek" },
      "ism yoki telefon raqam bo'yicha...": { ru: "По имени или номеру телефона...", en: "By name or phone number...", kk: "Аты немесе телефон нөмірі бойынша...", ky: "Аты же телефон номери боюнча...", tg: "Бо ном ё рақами телефон...", tk: "Ady ýa-da telefon belgisi boýunça..." },
      "ism yoki telefon raqamini yozing...": { ru: "Введите имя или номер телефона...", en: "Write name or phone number...", kk: "Атын немесе телефон нөмірін жазыңыз...", ky: "Атын же телефон номерин жазыңыз...", tg: "Ном ё рақами телефонро нависед...", tk: "Ady ýa-da telefon belgisini ýazyň..." },
      "birorta ham bemor topilmadi.": { ru: "Пациенты не найдены.", en: "No patients found.", kk: "Пациенттер табылмады.", ky: "Бейтаптар табылган жок.", tg: "Ягон бемор ёфт нашуд.", tk: "Hiç bir näsag tapylmady." },
      "yopish": { ru: "Закрыть", en: "Close", kk: "Жабу", ky: "Жабуу", tg: "Пӯшидан", tk: "Ýapmak" },
      "bugun": { ru: "Сегодня", en: "Today", kk: "Бүгін", ky: "Бүгүн", tg: "Имрӯз", tk: "Şu gün" },
      "kunlik": { ru: "Ежедневный", en: "Daily", kk: "Күнделікті", ky: "Күндөлүк", tg: "Рӯзона", tk: "Gündelik" },
      "hisobotlar": { ru: "Отчеты", en: "Reports", kk: "Есептер", ky: "Отчеттор", tg: "Ҳисоботҳо", tk: "Hasabatlar" },
      "haftalik": { ru: "Еженедельно", en: "Weekly", kk: "Апта сайын", ky: "Жума сайын", tg: "Ҳафтагӣ", tk: "Hepdelik" },
      "oylik": { ru: "Ежемесячно", en: "Monthly", kk: "Ай сайын", ky: "Ай сайын", tg: "Моҳона", tk: "Aýlyk" },
      "yillik": { ru: "Ежегодно", en: "Yearly", kk: "Жыл сайын", ky: "Жыл сайын", tg: "Солона", tk: "Ýyllyk" },
      "haftalik hisobot": { ru: "Еженедельный отчет", en: "Weekly report", kk: "Апталық есеп", ky: "Жумалык отчет", tg: "Ҳисоботи ҳафтагӣ", tk: "Hepdelik hasabat" },
      "shifokorlar kpi": { ru: "KPI Врачей", en: "Doctors KPI", kk: "Дәрігерлер KPI", ky: "Дарыгерлер KPI", tg: "KPI-и духтурон", tk: "Lukmanlaryň KPI" },
      "⚙ tibbiy xizmatlar & narxlar": { ru: "⚙ Медицинские Услуги и Цены", en: "⚙ Medical Services & Prices", kk: "⚙ Медициналық қызметтер және бағалар", ky: "⚙ Медициналык кызматтар жана баалар", tg: "⚙ Хизматрасониҳои тиббӣ ва нархҳо", tk: "⚙ Lukmançylyk hyzmatlary we bahalar" },
      "💳 obuna monitoringi & to'lovlar": { ru: "💳 Мониторинг Подписки и Платежи", en: "💳 Subscription Monitoring & Payments", kk: "💳 Жазылым мониторингі және төлемдер", ky: "💳 Жазылуу мониторинги жана төлөмдөр", tg: "💳 Мониторинги обуна ва пардохтҳо", tk: "💳 Abuna monitoringi we töleg" },
      "bugun qabul qilingan": { ru: "Принято сегодня", en: "Admitted Today", kk: "Бүгін қабылданды", ky: "Бүгүн кабылданды", tg: "Имрӯз қабул шуд", tk: "Şu gün kabul edildi" },
      "bugun joriy daromad": { ru: "Текущий доход сегодня", en: "Today's generated revenue", kk: "Бүгінгі ағымдағы табыс", ky: "Бүгүнкү учурдагы киреше", tg: "Даромади ҷории имрӯза", tk: "Şu günki häzirki girdeji" },
      "so'm": { ru: "сум", en: "UZS", kk: "сом", ky: "сом", tg: "сӯм", tk: "sim" },
      "hozir kutayotgan": { ru: "Сейчас ожидает", en: "Currently waiting", kk: "Қазір күтуде", ky: "Азыр күтүүдө", tg: "Ҳозир дар интизорӣ", tk: "Häzir garaşylýar" },
      "jami ro'yxatdagi bemorlar": { ru: "Всего зарегистрировано пациентов", en: "Total registered patients", kk: "Барлығы тіркелген пациенттер", ky: "Бардыгы катталган бейтаптар", tg: "Ҳамаи беморони сабтшуда", tk: "Jemi hasaba alnan näsaglar" },
      "kishi": { ru: "чел", en: "people", kk: "адам", ky: "адам", tg: "нафар", tk: "adam" },
      "ta": { ru: "шт", en: "items", kk: "дана", ky: "даана", tg: "дона", tk: "sany" },
      "shifokorlar bugungi ko'rsatkichlari": { ru: "Показатели врачей сегодня", en: "Doctors' metrics today", kk: "Дәрігерлердің бүгінгі көрсеткіштері", ky: "Дарыгерлердин бүгүнкү көрсөткүчтөрү", tg: "Нишондиҳандаҳои имрӯзаи духтурон", tk: "Lukmanlaryň şu günki görkezijileri" },
      "shifokor": { ru: "Врач", en: "Doctor", kk: "Дәрігер", ky: "Дарыгер", tg: "Духтур", tk: "Lukman" },
      "qabul bo'limi": { ru: "Очередь", en: "Queue", kk: "Кезек", ky: "Кезек", tg: "Навбат", tk: "Nobat" },
      "bugungi qabul": { ru: "Сегодня принято", en: "Today's admissions", kk: "Бүгінгі қабылдаулар", ky: "Бүгүнкү кабылдоолор", tg: "Қабулҳои имрӯза", tk: "Şu günki kabullar" },
      "bugungi tushum": { ru: "Доход сегодня", en: "Today's revenue", kk: "Бүгінгі табыс", ky: "Бүгүнкү киреше", tg: "Даромади имрӯза", tk: "Şu günki girdeji" },
      "faoliyat": { ru: "Активность", en: "Activity", kk: "Белсенділік", ky: "Активдүүлүк", tg: "Фаъолият", tk: "Işjeňlik" },
      "qarash": { ru: "Просмотр", en: "View", kk: "Қарау", ky: "Көрүү", tg: "Дидан", tk: "Görmek" },
      "boshliq paneli": { ru: "Панель Директора", en: "Director's Panel", kk: "Директор Панелі", ky: "Директор Панели", tg: "Файли Директор", tk: "Direktor Paneli" },
      "oylik to'lov muddati bo'yicha eslatma": { ru: "Напоминание по оплате подписки", en: "Subscription Payment Notification", kk: "Жазылым төлемі туралы ескерту", ky: "Жазылуу төлөмү тууралуу эскертүү", tg: "Огоҳинома оид ба пардохти обуна", tk: "Abuna töleg möhleti barada duýduryş" },
      "to'lov & obuna analitikasi": { ru: "Оплата и аналитика подписки", en: "Payment & Subscription", kk: "Төлем және жазылым аналитикасы", ky: "Төлөм жана жазылуу аналитикасы", tg: "Пардохт ва таҳлили обуна", tk: "Töleg we abuna analitikasy" },
      "to'xtatilgan ❌": { ru: "Остановлено ❌", en: "Suspended ❌", kk: "Тоқтатылды ❌", ky: "Токтотулду ❌", tg: "Боздошта шуд ❌", tk: "Togtadyldy ❌" },
      "1 haftalik bepul trial (sinov) muddatida 🎁": { ru: "В течение 1-недельного бесплатного ознакомительного периода 🎁", en: "Under a 1-week free trial promotion period 🎁", kk: "1 апталық тегін сынақ мерзімінде 🎁", ky: "1 жумалык акысыз сыноо мөөнөтүндө 🎁", tg: "Дар мӯҳлати 1 ҳафтаи озмоишии ройгон 🎁", tk: "1 hepdelik mugt synag möhletinde 🎁" },
      "faol ✅": { ru: "Активно ✅", en: "Active ✅", kk: "Белсенді ✅", ky: "Активдүү ✅", tg: "Фаъол ✅", tk: "Işjeň ✅" },
      "belgilanmagan": { ru: "не определено", en: "undefined", kk: "белгіленбеген", ky: "белгиленген эмес", tg: "муайян нашудааст", tk: "kesgitlenmedik" },
      "kechikkan!": { ru: "Просрочено!", en: "Overdue!", kk: "Кешіктірілді!", ky: "Кечиктирилди!", tg: "Дер монд!", tk: "Giç galdy!" },
      "kun qoldi": { ru: "дн осталось", en: "days left", kk: "күн қалды", ky: "күн калды", tg: "рӯз монд", tk: "gün galdy" },
      "iltimos, shifokor ismini to'liq kiriting!": { ru: "Пожалуйста, введите полное имя врача!", en: "Please enter the doctor's full name!", kk: "Өтінеміз, дәрігердің толық атын енгізіңіз!", ky: "Сураныч, дарыгердин толук атын киргизиңиз!", tg: "Лутфан, номи пурраи духтурро ворид кунед!", tk: "Haýyş, lukmanyň doly adyny giriziň!" },
      "yangi shifokor profili muvaffaqiyatli saqlandi va qabulga tayyor!": { ru: "Новый профиль врача успешно сохранен и готов к приему!", en: "New doctor profile has been saved and is ready for queue admissions!", kk: "Жаңа дәрігер профилі сәтті сақталды және қабылдауға дайын!", ky: "Жаңы дарыгер профили ийгиликтүү сакталды жана кабылдоого даяр!", tg: "Профили нави духтур бомуваффақият захира шуд ва ба қабул тайёр аст!", tk: "Täze lukman profili üstünlikli ýatda saklandy we kabula taýýar!" },
      "iltimos xizmat parametrlari to'g'riligini tekshiring!": { ru: "Пожалуйста, проверьте параметры услуги!", en: "Please check service parameters!", kk: "Өтінеміз, қызмет параметрлерін тексеріңіз!", ky: "Сураныч, кызмат параметрлерин текшериңиз!", tg: "Лутфан, параметрҳои хизматро тафтиш кунед!", tk: "Haýyş, hyzmat parametrlerini barlaň!" },
      "tibbiy xizmat narxi va nomi muvaffaqiyatli tahrirlandi!": { ru: "Цена и наименование медицинских услуг успешно изменены!", en: "Medical service name and rate updated!", kk: "Медициналық қызмет бағасы мен атауы сәтті өзгертілді!", ky: "Медициналык кызмат баасы жана аталышы ийгиликтүү өзгөртүлдү!", tg: "Нарх ва номи хизмати тиббӣ бомуваффақият тағйир ёфт!", tk: "Lukmançylyk hyzmatynyň bahasy we ady üstünlikli üýtgedildi!" },
      "3 kun oldin": { ru: "3 дня назад", en: "3 days ago", kk: "3 күн бұрын", ky: "3 күн мурун", tg: "3 рӯз пеш", tk: "3 gün öň" },
      "5 kun oldin": { ru: "5 дней назад", en: "5 days ago", kk: "5 күн бұрын", ky: "5 күн мурун", tg: "5 рӯз пеш", tk: "5 gün öň" },
      "2 hafta oldin": { ru: "2 недели назад", en: "2 weeks ago", kk: "2 апта бұрын", ky: "2 жума мурун", tg: "2 ҳафта пеш", tk: "2 hepde öň" },
      "Erkak": { ru: "Мужчина", en: "Male", kk: "Ер адам", ky: "Эркек", tg: "Мард", tk: "Erkek" },
      "Ayol": { ru: "Женщина", en: "Female", kk: "Әйел", ky: "Аял", tg: "Зан", tk: "Zenan" },
      "Samarqand Filiali Boshqaruv Markazi": { ru: "Центр Управления Самаркандским Филиалом", en: "Samarkand Branch Management HQ", kk: "Самарқанд Филиалы Басқару Орталығы", ky: "Самарканд Филиалын Башкаруу Борбору", tg: "Маркази Идоракунии Филиали Самарқанд", tk: "Samarkant Şahamçasynyň Dolandyryş Merkezi" },
      "Sizga bog'langan klinika tarmog'ini masofadan analitika va biznes mantiqi yordamida boshqaring.": { ru: "Управляйте филиалом вашей клиники с помощью удаленной аналитики и бизнес-логики.", en: "Manage your linked clinic branch ecosystem with remote analytical intelligence.", kk: "Сізге байланысты клиника желісін аналитика мен қызмет бағалары арқылы басқарыңыз.", ky: "Сизге байланыштуу клиника тармагын аналитика жана кызмат баалары менен башкарыңыз.", tg: "Шабакаи клиникаи ба шумо алоқамандро бо ёрии таҳлил ва нархномаи хизматрасонӣ идора кунед.", tk: "Size baglanyşykly klinika ulgamyny analitika we hyzmat bahalary bilen dolandyryň." },
      "obuna": { ru: "подписка", en: "subscription", kk: "жазылым", ky: "жазылуу", tg: "обуна", tk: "abuna" },
      "sozlamalar": { ru: "настройки", en: "settings", kk: "баптаулар", ky: "жөндөөлөр", tg: "танзимот", tk: "sazlamalar" },
      "shifokorlar": { ru: "врачи", en: "doctors", kk: "дәрігерлер", ky: "дарыгерлер", tg: "духтурон", tk: "lukmanlar" },
      "Obuna statusi": { ru: "Статус подписки", en: "Subscription status", kk: "Жазылым мәртебесі", ky: "Жазылуу абалы", tg: "Ҳолати обуна", tk: "Abuna ýagdaýy" },
      "sizning obuna statusingiz filial uchun": { ru: "Ваш статус подписки филиала", en: "Your subscription status for", kk: "Сіздің филиал үшін жазылым мәртебеңіз", ky: "Сиздин филиал үчүн жазылуу абалыңыз", tg: "Ҳолати обунаи филиали шумо", tk: "Şahamça üçin abuna ýagdaýyňyz" },
      "to'g'ridan-to'g'ri to'lov muddati:": { ru: "Срок прямой оплаты:", en: "Direct due date of payment:", kk: "Тікелей төлем мерзімі:", ky: "Түз төлөм мөөнөтү:", tg: "Мӯҳлати пардохти мустақим:", tk: "Göni töleg möhleti:" },
      "oylik obuna narxi:": { ru: "Ежемесячная стоимость подписки:", en: "Monthly subscription cost:", kk: "Айлық жазылым бағасы:", ky: "Айлык жазылуу баасы:", tg: "Нархи обунаи моҳона:", tk: "Aýlyk abuna bahasy:" },
      "filial: samarqand": { ru: "Филиал: Самарканд", en: "Branch: Samarkand", kk: "Филиал: Самарқанд", ky: "Филиал: Самарканд", tg: "Филиал: Самарқанд", tk: "Şahamça: Samarkant" },
      "kabinet": { ru: "Кабинет", en: "Cabinet", kk: "Кабинет", ky: "Кабинет", tg: "Кабинет", tk: "Kabinet" },
      "o'chirish": { ru: "Удалить", en: "Delete", kk: "Жою", ky: "Өчүрүү", tg: "Нест кардан", tk: "Pozmak" },
      "🏥 standart tibbiy xizmatlar katalogi (tezkor tanlash)": { ru: "🏥 Каталог Стандартных Медицинских Услуг (Быстрый выбор)", en: "🏥 Standard Medical Services Catalog (Quick add)", kk: "🏥 Стандартты Медициналық Қызметтер Каталогы (Жылдам таңдау)", ky: "🏥 Стандарттуу Медициналык Кызматтар Каталогу (Тез тандоо)", tg: "🏥 Каталоги Хизматрасониҳои Стандартии Тиббӣ (Интихоби зуд)", tk: "🏥 Standart Lukmançylyk Hyzmatlary Katalogy (Çalt saýlaw)" },
      "xizmatlarni qo'shish (narxini kiritish shart emas)": { ru: "Добавление услуг (Можно настроить свою цену)", en: "Add services (Customize price dynamically)", kk: "Қызметтерді қосу (Бағасын енгізу міндетті емес)", ky: "Кызматтарды кошуу (Баасын киргизүү милдеттүү эмес)", tg: "Илова кардани хизматҳо (Ворид кардани нарх ҳатмӣ нест)", tk: "Hyzmatlary goşmak (Baha girizmek hökman däl)" },
      "katalogdan qidirish...": { ru: "Поиск по каталогу...", en: "Search catalog...", kk: "Каталог бойынша іздеу...", ky: "Каталог боюнча издөө...", tg: "Ҷустуҷӯ дар каталог...", tk: "Katalogdan gözlemek..." },
      "katalogda bunday nomli xizmat topilmadi 🔍": { ru: "Услуга с таким названием не найдена в каталоге 🔍", en: "No matching catalog services found 🔍", kk: "Каталогтан бұндай атаумен қызмет табылмады 🔍", ky: "Каталогдон мындай аталыштагы кызмат табылган жок 🔍", tg: "Хизмате бо чунин ном дар каталог ёфт нашуд 🔍", tk: "Katalogdan şeýle atly hyzmat tapylmady 🔍" },
      "amaldagi narx:": { ru: "Текущая цена:", en: "Current price:", kk: "Ағымдағы баға:", ky: "Учурдагы баа:", tg: "Нархи ҷорӣ:", tk: "Häzirki baha:" },
      "klinikada faol": { ru: "Активна в клинике", en: "Active in clinic", kk: "Клиникада белсенді", ky: "Клиникада активдүү", tg: "Дар клиника фаъол", tk: "Klinikada işjeň" },
      "tavsiya etilgan:": { ru: "Рекомендуемая:", en: "Recommended:", kk: "Ұсынылады:", ky: "Сунушталат:", tg: "Тавсия дода мешавад:", tk: "Maslahat berilýär:" },
      "narx": { ru: "Цена", en: "Price", kk: "Баға", ky: "Баа", tg: "Нарх", tk: "Baha" },
      "qo'shish": { ru: "Добавить", en: "Add", kk: "Қосу", ky: "Кошуу", tg: "Илова кардан", tk: "Goşmak" },
      "katalogdan tashqari maxsus noyob xizmat qo'shish": { ru: "Добавить индивидуальную услугу вне каталога", en: "Add custom medical service outside catalog", kk: "Каталогтан тыс арнайы бірегей қызмет қосу", ky: "Каталогдон тышкары атайын кызмат кошуу", tg: "Илова кардани хизмати махсуси берун аз каталог", tk: "Katalogdan daşary ýörite hyzmat goşmak" },
      "xizmat nomi (masalan: maxsus implantatsiyadan keyingi terapiya)": { ru: "Название услуги (Например: Особая послеимплантационная терапия)", en: "Service Name (e.g., Special post-implant therapeutics)", kk: "Қызмет атауы (Мысалы: Арнайы имплантациядан кейінгі терапия)", ky: "Кызмат аталышы (Мисалы: Атайын имплантациядан кийинки терапия)", tg: "Номи хизмат (Масалан: Терапияи махсуси баъдиимплантатсионӣ)", tk: "Hyzmatyň ady (Mysal: Implantasiýadan soňky ýörite terapiýa)" },
      "masalan: maxsus muolaja": { ru: "Например: Особая процедура", en: "e.g. Special procedure", kk: "Мысалы: Арнайы процедура", ky: "Мисалы: Атайын процедура", tg: "Масалан: Муолиҷаи махсус", tk: "Mysal: Ýörite bejergi" },
      "narxi (uzs)": { ru: "Цена (UZS)", en: "Price (UZS)", kk: "Бағасы (UZS)", ky: "Баасы (UZS)", tg: "Нарх (UZS)", tk: "Bahasy (UZS)" },
      "bekor": { ru: "Отмена", en: "Cancel", kk: "Бас тарту", ky: "Жокко чыгаруу", tg: "Бекор кардан", tk: "Ýatyrmak" },
      "saqlash✓": { ru: "Сохранить✓", en: "Save✓", kk: "Сақтау✓", ky: "Сактоо✓", tg: "Захира кардан✓", tk: "Ýatda saklamak✓" },
      "📝 xizmat narxini va nomini o'zgartirish oynasi": { ru: "📝 Окно редактирования названия и цены услуги", en: "📝 Modify Service Name and Price Window", kk: "📝 Қызмет атауы мен бағасын өзгерту терезесі", ky: "📝 Кызмат аталышы жана баасын өзгөртүү терезеси", tg: "📝 Равзанаи тағйири ном ва нархи хизмат", tk: "📝 Hyzmatyň adyny we bahasyny üýtgetmek äpişgesi" },
      "xizmat nomi": { ru: "Название услуги", en: "Service Name", kk: "Қызмет атауы", ky: "Кызмат аталышы", tg: "Номи хизмат", tk: "Hyzmatyň ady" },
      "bekor qilish": { ru: "Отмена", en: "Cancel", kk: "Бас тарту", ky: "Жокко чыгаруу", tg: "Бекор кардан", tk: "Ýatyrmak" },
      "yangilash✓": { ru: "Обновить✓", en: "Update✓", kk: "Жаңарту✓", ky: "Жаңылоо✓", tg: "Навсозӣ✓", tk: "Täzelemek✓" },
      "klinikaga qo'shilgan xizmatlar ichidan qidirish...": { ru: "Поиск среди добавленных услуг клиники...", en: "Search inside added services...", kk: "Клиникаға қосылған қызметтер ішінен іздеу...", ky: "Клиникага кошулган кызматтардын ичинен издөө...", tg: "Ҷустуҷӯ дар байни хизматҳои иловашуда...", tk: "Klinika goşulan hyzmatlaryň içinden gözlemek..." },
      "tahrirlash": { ru: "Редактир.", en: "Edit", kk: "Өңдеу", ky: "Түзөтүү", tg: "Таҳрир", tk: "Üýtgetmek" },
      "siz klinika uchun birorta ham xizmat kiritmagansiz": { ru: "Вы еще не добавили ни одной услуги для клиники", en: "No services added to the clinic yet", kk: "Сіз клиника үшін әлі бірде-бір қызмет қоспадыңыз", ky: "Сиз клиника үчүн азырынча бир дагы кызмат кошпоптурсуз", tg: "Шумо ҳанӯз ягон хизмат барои клиника ворид накардаед", tk: "Siz klinika üçin heniz hiç hili hyzmat goşmadyňyz" },
      "tepadan xizmat nomini izlang yoki qatorni bosib xizmat qo'shib oling.": { ru: "Найдите услугу сверху или нажмите на строку, чтобы добавить услугу.", en: "Search from Top or add a new custom service row.", kk: "Жоғарыдан қызмет атауын іздеңіз немесе жолды басып қызмет қосыңыз.", ky: "Жогорудан кызмат аталышын издеңиз же катарды басып кызмат кошуңуз.", tg: "Аз боло номи хизматро ҷустуҷӯ кунед ё бо пахш кардани сатр хизмат илова кунед.", tk: "Ýokardan hyzmat adyny gözläň ýa-da hatara basyp hyzmat goşuň." },
      "oylik obuna va litsenziya nazorati": { ru: "Ежемесячный Контроль Лицензий и Подписок", en: "Monthly SaaS License & Subscription Gate", kk: "Айлық Лицензиялар мен Жазылымдарды Бақылау", ky: "Айлык Лицензиялар менен Жазылууларды Көзөмөлдөө", tg: "Назорати Моҳонаи Литсензия ва Обуна", tk: "Aýlyk Lisenziýa we Abuna Gözegçiligi" },
      "klinikangizning saas va ijra mantiqi bo'yicha to'lov ko'rsatkichlari": { ru: "Метрики платежей и финансовый статус по аренде вашей клиники", en: "Active tenant subscription financials and rental payment parameters", kk: "Клиникаңыздың SaaS және жалдау логикасы бойынша төлем көрсеткіштері", ky: "Клиникаңыздын SaaS жана ижара логикасы боюнча төлөм көрсөткүчтөрү", tg: "Нишондиҳандаҳои пардохт оид ба SaaS ва мантиқи иҷораи клиникаи шумо", tk: "Klinikaňyzyň SaaS we kärende aňlatmasy boýunça töleg görkezijileri" },
      "to'xtatilgan": { ru: "Блокирован", en: "Suspended", kk: "Тоқтатылған", ky: "Токтотулган", tg: "Боздошта шуда", tk: "Togtadylan" },
      "sinov muddati": { ru: "Пробный период", en: "Trial Phase", kk: "Сынақ мерзімі", ky: "Сыноо мөөнөтү", tg: "Давраи озмоишӣ", tk: "Synag möhleti" },
      "faol": { ru: "Активен", en: "Active", kk: "Белсенді", ky: "Активдүү", tg: "Фаъол", tk: "Işjeň" },
      "navbatdagi to'lov sanasi": { ru: "Дата следующего платежа", en: "Next Payment Due date", kk: "Келесі төлем күні", ky: "Кийинки төлөм күнү", tg: "Санаи пардохти навбатӣ", tk: "Indiki töleg senesi" },
      "mavjud emas": { ru: "Нет данных", en: "N/A", kk: "Деректер жоқ", ky: "Маалымат жок", tg: "Маълумот нест", tk: "Maglumat ýok" },
      "muddati o'tgan! iltimos to'lashni amalga oshiring.": { ru: "Просрочено! Пожалуйста, произведите оплату.", en: "Overdue penalty! Please wire the subscription fee.", kk: "Мерзімі өтті! Төлемді жүзеге асырыңыз.", ky: "Мөөнөтү өттү! Төлөмдү жүзөгө ашырыңыз.", tg: "Мӯҳлат гузашт! Лутфан пардохтро анҷом диҳед.", tk: "Möhleti geçdi! Haýyş, töleg ediň." },
      "oylik abonent to'lovi": { ru: "Ежемесячная абонентская плата", en: "Monthly SaaS recurring price", kk: "Айлық абоненттік төлем", ky: "Айлык абоненттик төлөм", tg: "Пардохти обунавии моҳона", tk: "Aýlyk abonent töleg" },
      "yillik litsenziya imtiyozlari qo'llanilgan.": { ru: "Применены льготы годовой лицензии.", en: "Annual tier corporate loyalty discount applied.", kk: "Жылдық лицензия жеңілдіктері қолданылды.", ky: "Жылдык лицензия жеңилдиктери колдонулду.", tg: "Имтиёзҳои литсензияи солона татбиқ шуданд.", tk: "Ýyllyk lisenziýa ýeňillikleri ulanyldy." },
      "klinika subdomeni": { ru: "Субдомен клиники", en: "Clinic Subdomain", kk: "Клиника субдомені", ky: "Клиника субдомени", tg: "Субдомени клиника", tk: "Klinika subdomeni" },
      "xarita integratsiyasi faollashtirilgan.": { ru: "Интеграция с картами включена.", en: "Google Maps routing systems active.", kk: "Карта интеграциясы белсендірілген.", ky: "Карта интеграциясы иштетилген.", tg: "Интегратсияи харита фаъол шудааст.", tk: "Karta integrasiýasy işjeňleşdirildi." },
      "to'lovni amalga oshirish": { ru: "Произвести платеж", en: "Wire / Submit recurring fee", kk: "Төлемді жүзеге асыру", ky: "Төлөмдү жүзөгө ашыруу", tg: "Анҷом додани пардохт", tk: "Tölegi amala aşyrmak" },
      "tasdiqlanish kutilmoqda": { ru: "Ожидает подтверждения", en: "Pending admin validation", kk: "Растауды күтуде", ky: "Ырастоону күтүүдө", tg: "Дар интизори тасдиқ", tk: "Tassyklama garaşylýar" },
      "summa:": { ru: "Сумма:", en: "Amount:", kk: "Сома:", ky: "Сумма:", tg: "Маблағ:", tk: "Möçber:" },
      "yuborilgan sana:": { ru: "Дата подачи:", en: "Submission date:", kk: "Жіберілген күні:", ky: "Жөнөтүлгөн күнү:", tg: "Санаи ирсол:", tk: "Iberilen senesi:" },
      "oylik to'lovni yuborish": { ru: "Отправить ежемесячный платеж", en: "Defray Monthly SaaS Renewal", kk: "Айлық төлемді жіберу", ky: "Айлык төлөмдү жөнөтүү", tg: "Фиристодани пардохти моҳона", tk: "Aýlyk tölegi ibermek" },
      "to'lovlar tarixi monitoringi (filial bo'yicha)": { ru: "Мониторинг истории платежей по филиалу", en: "Saas Invoicing & Clearance Ledger history", kk: "Филиал бойынша төлемдер тарихы мониторингі", ky: "Филиал боюнча төлөмдөр тарыхынын мониторинги", tg: "Мониторинги таърихи пардохтҳо (аз рӯи филиал)", tk: "Şahamça boýunça töleg taryhy monitoringi" },
      "barcha kvitansiyalar": { ru: "Все квитанции", en: "All Receipts", kk: "Барлық түбіртектер", ky: "Бардык квитанциялар", tg: "Ҳамаи квитансияҳо", tk: "Ähli kwitansiýalar" },
      "kvitansiya id": { ru: "ID Квитанции", en: "Receipt ID", kk: "Түбіртек ID", ky: "Квитанция ID", tg: "ID квитансия", tk: "Kwitansiýa ID" },
      "muddati": { ru: "Срок действия", en: "Due Date", kk: "Мерзімі", ky: "Мөөнөтү", tg: "Мӯҳлат", tk: "Möhleti" },
      "summa (uzs)": { ru: "Сумма (UZS)", en: "Amount (UZS)", kk: "Сома (UZS)", ky: "Сумма (UZS)", tg: "Маблағ (UZS)", tk: "Möçber (UZS)" },
      "to'langan sana": { ru: "Дата оплаты", en: "Settlement Date", kk: "Төлеу күні", ky: "Төлөм күнү", tg: "Санаи пардохт", tk: "Töleg senesi" },
      "hozircha birorta ham to'lov hujjatlari topilmadi.": { ru: "Платежные документы на текущий момент отсутствуют.", en: "No invoicing records or past transactions exist for this tenant.", kk: "Қазіргі уақытта бірде-бір төлем құжаттары табылмады.", ky: "Азырынча бир дагы төлөм документтери табылган жок.", tg: "Ҳоло ягон ҳуҷҷати пардохт ёфт нашуд.", tk: "Häzirlikçe hiç hili töleg resminamasy tapylmady." },
      "tasdiqlangan": { ru: "Одобрено", en: "Settled", kk: "Расталды", ky: "Ырасталды", tg: "Тасдиқшуда", tk: "Tassyklandy" },
      "kutilmoqda": { ru: "Ожидает", en: "Pending", kk: "Күтуде", ky: "Күтүүдө", tg: "Дар интизор", tk: "Garaşylýar" },
      "to'lanmagan": { ru: "Не уплачено", en: "Unpaid", kk: "Төленбеген", ky: "Төлөнгөн эмес", tg: "Пардохтнашуда", tk: "Tölenmedik" },
      "barcha huquqlar himoyalangan.": { ru: "Все права защищены.", en: "All rights reserved.", kk: "Барлық құқықтар қорғалған.", ky: "Бардык укуктар корголгон.", tg: "Ҳамаи ҳуқуқҳо ҳифз шудаанд.", tk: "Ähli hukuklar goralýar." },
      "klinika hisoboti avtomatik tarzda shakllanadi.": { ru: "Отчеты клиники генерируются автоматически.", en: "Clinical ledger statements dynamically assembled.", kk: "Клиника есебі автоматты түрде қалыптасады.", ky: "Клиника отчету автоматтык түрдө түзүлөт.", tg: "Ҳисоботи клиника ба таври худкор ташкил мешавад.", tk: "Klinika hasabaty awtomatiki düzülýär." },
      "shifokorni o'chirish": { ru: "Удалить врача", en: "Delete Doctor", kk: "Дәрігерді жою", ky: "Дарыгерди өчүрүү", tg: "Нест кардани духтур", tk: "Lukmany pozmak" },
      "xizmatni o'chirish": { ru: "Удалить услугу", en: "Delete Service", kk: "Қызметті жою", ky: "Кызматты өчүрүү", tg: "Нест кардани хизмат", tk: "Hyzmaty pozmak" },
      "siz bu yerdan oylik to'lov so'rovini superadmin paneliga jo'natishingiz mumkin. superadmin to'lovni tasdiqlagandan so'ng, tizimingiz muddati uzaytiriladi.": { ru: "Здесь вы можете отправить запрос на подтверждение платежа в панель суперадминистратора. После одобрения срок действия платформы продлится.", en: "Submit a payment clearance ticket directly to the superadmin desk. Once validated, your SaaS tenant license lease terms will extend accordingly.", kk: "Мұнда сіз айлық төлем сұрауын суперәкімші панеліне жібере аласыз. Суперәкімші төлемді растағаннан кейін, жүйеңіздің мерзімі ұзартылады.", ky: "Бул жерден сиз айлык төлөм суроосун суперадмин панелине жөнөтө аласыз. Суперадмин төлөмдү ырастагандан кийин, тутумуңуздун мөөнөтү узартылат.", tg: "Аз ин ҷо шумо метавонед дархости пардохти моҳонаро ба панели суперадмин фиристед. Пас аз тасдиқи пардохт аз ҷониби суперадмин, мӯҳлати низоми шумо дароз карда мешавад.", tk: "Bu ýerden aýlyk töleg islegini superadmin paneline iberip bilersiňiz. Superadmin tölegi tassyklandan soň, ulgamyňyzyň möhleti uzaldylar." },
      "har qanday ro'yxatdan o'tgan yangi klinika uchun 1 haftalik mutlaqo bepul sinov litsenziyasi avtomatik tarzda taqdim etilgan!": { ru: "Для каждой новой зарегистрированной клиники автоматически предоставляется 1 неделя бесплатного триал-периода!", en: "A 7-day complimentary developer/tester sandbox evaluation lease is provisioned for every newly deployed clinic!", kk: "Тіркелген әрбір жаңа клиника үшін 1 апталық толықтай тегін сынақ лицензиясы автоматты түрде беріледі!", ky: "Катталган ар бир жаңы клиника үчүн 1 жумалык таптакыр акысыз сыноо лицензиясы автоматтык түрдө берилет!", tg: "Барои ҳар як клиникаи нави сабтшуда литсензияи 1 ҳафтаи комилан ройгони озмоишӣ ба таври худкор пешниҳод мешавад!", tk: "Hasaba alnan her bir täze klinika üçin 1 hepdelik mugt synag lisenziýasy awtomatiki berilýär!" }
    };

    const localLang: keyof LocalDictEntry | null =
      (language === 'ru' || language === 'en' || language === 'kk' || language === 'ky' || language === 'tg' || language === 'tk')
        ? language
        : null;

    const cleanText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    if (localLang && dict[cleanText]) {
      return dict[cleanText][localLang];
    }

    if (localLang && dict[text]) {
      return dict[text][localLang];
    }
    return text;
  };

  // Tab-specific view model: 'bugun', 'hisobot', 'shifokorlar', 'sozlamalar', 'obuna'
  const [activeSubTab, setActiveSubTab] = useState<'bugun' | 'qabullar' | 'hisobot' | 'shifokorlar' | 'materiallar' | 'sozlamalar' | 'obuna'>('bugun');
  const [reportPeriod, setReportPeriod] = useState<'kunlik' | 'haftalik' | 'oylik' | 'yillik'>('haftalik');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [linkEditDoctor, setLinkEditDoctor] = useState<Doctor | null>(null);
  const [linkEditType, setLinkEditType] = useState<'rental' | 'revenue_share' | 'independent'>('revenue_share');
  const [linkEditPercent, setLinkEditPercent] = useState('50');
  const [linkEditRent, setLinkEditRent] = useState('0');

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

  const [openServiceCategory, setOpenServiceCategory] = useState<string>("Diagnostika");
  const [addedServicesSearchTerm, setAddedServicesSearchTerm] = useState('');

  // Pre-defined catalog selection & search states
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<number>(0);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [customCatalogPrices, setCustomCatalogPrices] = useState<Record<string, number>>({});

  // Filter lists based on Samarqand clinic (the default CEO location)
  const currentClinicId = clinicId || 'samarqand';
  const clinicDoctors = doctors.filter(d => d.clinicId === currentClinicId);
  const clinicServices = services.filter(s => s.clinicId === currentClinicId);
  // 'AA1234567' is the PLACEHOLDER shown in the passport input's example text
  // (see PatientPanel's "AA1234567" placeholder) — a hardcoded filter matching
  // that exact value doesn't hide demo data, it hides any real patient who
  // happened to type it in, or has a passport that genuinely reads that way.
  const clinicQueues = queues.filter(q => q.clinicId === currentClinicId);

  // Filter queues by status. Date-scoped to today: an abandoned ticket from
  // weeks ago that nobody ever marked completed/cancelled used to count
  // forever, so this KPI (and each doctor's "active" count) only ever grew —
  // a doctor's own view showed "2 kutmoqda" while this showed "37".
  // toISOString() is UTC, so between midnight and 05:00 in Tashkent it names
  // yesterday — every "Bugun" figure on this panel was a day behind all night.
  const todayStr = toDateKey();
  // ...and it asked when the ticket was *written*, not when the patient was
  // seen. An appointment booked a fortnight ahead counted on its booking day
  // and never on the day it happened. visitDateKey is the one reading of that,
  // shared with the Qabullar jurnali so the two cannot disagree.
  const isToday = (q: QueueItem) => visitDateKey(q) === todayStr;
  const pendingQueues = clinicQueues.filter(q => q.status === 'pending' && isToday(q));
  const callingQueues = clinicQueues.filter(q => (q.status === 'calling' || q.status === 'in_progress') && isToday(q));
  // All-time completed, across every tab. Every "Bugun/Bugungi" (Today) label in
  // this file used to read straight from this — meaning "today's revenue",
  // "today's admissions", and each doctor's "today" card were silently showing
  // the clinic's entire history instead. completedQueuesToday below (filtered by
  // createdAt, the only timestamp a QueueItem carries — same convention the
  // server's own daily report snapshot uses) is what those actually need.
  const completedQueuesAllTime = clinicQueues.filter(q => q.status === 'completed');
  const completedQueuesToday = completedQueuesAllTime.filter(isToday);

  // Calculations for KPI Cards
  const totalCompletedToday = completedQueuesToday.length;
  const currentWaitingCount = pendingQueues.length + callingQueues.length;

  const getServicePrice = (id: string) => {
    return services.find(s => s.id === id)?.price || 0;
  };

  // List price × completed visits — a forecast, not money actually taken (a
  // discounted or partially-paid visit still counts at full price). Statistics
  // computes the exact same number and is honest about what it is; this KPI
  // card used to call it "Bugun joriy daromad" ("today's current revenue"),
  // which reads as real income. Label fixed below to match.
  const todayRevenue = completedQueuesToday.reduce((sum, q) => sum + getServicePrice(q.serviceId), 0);

  // Doctor-clinic business relationship for this clinic (rental vs revenue-share); no
  // link record found means "legacy full-visibility relationship", same as before links existed.
  const getDoctorLink = (docId: string) =>
    doctorClinicLinks.find(l => l.doctorId === docId && l.clinicId === currentClinicId && l.status === 'active') || null;

  // Calculations per doctor for today's grid
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const getDocTodayStats = (docId: string) => {
    const docCompleted = completedQueuesToday.filter(q => q.doctorId === docId);
    const docCompletedWeek = completedQueuesAllTime.filter(
      (q) => q.doctorId === docId && q.createdAt && new Date(q.createdAt) >= weekAgo
    );
    const docActive = pendingQueues.filter(q => q.doctorId === docId).length + callingQueues.filter(q => q.doctorId === docId).length;
    const docRevenue = docCompleted.reduce((sum, q) => sum + getServicePrice(q.serviceId), 0);
    return {
      completedCount: docCompleted.length,
      completedThisWeek: docCompletedWeek.length,
      activeCount: docActive,
      revenue: docRevenue
    };
  };

  // Search filter for patients. patientName/patientPhone are NOT guaranteed to
  // be present on every queue object: GET /api/queues strips them (publicQueueView)
  // for any caller it can't identify, so a request that arrives without a valid
  // session token yields queue rows with those fields missing. Calling
  // .toLowerCase() on them unguarded threw a TypeError during render, which the
  // ErrorBoundary turned into a full-page "Xatolik yuz berdi" — the entire
  // director panel went down rather than just this one search box misbehaving.
  const searchResults = clinicQueues.filter(q =>
    (q.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.patientPhone || '').includes(searchQuery)
  );

  // Handler for adding doctor
  const handleCreateDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) {
      setDocFeedbackMsg("Iltimos, shifokor ismini to'liq kiriting!");
      return;
    }

    const newDocObj: Doctor = {
      // 'doc_sm_' + count reused an id the moment any earlier doctor was
      // deleted (count drops, the next create lands on the same id again) —
      // two doctors then shared one id and their stats/schedules merged.
      id: 'doc_' + Math.random().toString(36).substr(2, 9),
      clinicId: currentClinicId,
      name: newDocName,
      specialty: newDocSpecialty,
      rating: 5.0,
      ratingCount: 0,
      image: newDocAvatar,
      status: 'idle'
    };

    if (onAddDoctor) {
      // This used to fire-and-forget: the form cleared and showed "saqlandi"
      // immediately, even if the server rejected the write.
      const result = await onAddDoctor(newDocObj);
      if (result === false) {
        setDocFeedbackMsg("Shifokorni saqlab bo'lmadi. Qayta urinib ko'ring.");
        return;
      }
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
  const handleCreateServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice || Number(newServicePrice) <= 0) {
      setSrvFeedbackMsg("Iltimos, xizmat nomi va narxini to'g'ri kiriting!");
      return;
    }

    const newSrvObj: Service = {
      id: 'srv_' + Math.random().toString(36).substr(2, 9),
      clinicId: currentClinicId,
      name: newServiceName,
      price: Number(newServicePrice)
    };

    if (onAddService) {
      // This used to fire-and-forget: the form cleared and showed "saqlandi"
      // immediately, even if the server rejected the write.
      const result = await onAddService(newSrvObj);
      if (result === false) {
        setSrvFeedbackMsg("Xizmatni saqlab bo'lmadi. Qayta urinib ko'ring.");
        return;
      }
    } else {
      services.push(newSrvObj);
    }

    setNewServiceName('');
    setNewServicePrice('');
    setShowAddServiceForm(false);
    setSrvFeedbackMsg("Yangi tibbiy xizmat muvaffaqiyatli saqlandi va ro'yxatga kiritildi!");
    setTimeout(() => setSrvFeedbackMsg(''), 3000);
  };

  // Patient database arrays — sourced directly from the real Patient
  // collection (the same one Statistics/patients prop uses below), not
  // derived from queue tickets. The old version built this list by merging
  // clinicQueues, deduped by phone: a registered patient who'd never taken a
  // queue ticket (e.g. Telegram self-registration, or a doctor quick-add with
  // no booking yet) was invisible here, and patients sharing a blank phone
  // silently collapsed into one row — so this count could disagree with the
  // Hisobotlar tab's Statistics component, which already reads real patients.
  const clinicPatientsList = patients.filter(p => p.clinicId === currentClinicId);
  const directoryPatients = clinicPatientsList.map(p => {
    const age = (() => {
      if (!p.birthDate) return null;
      const dob = new Date(p.birthDate);
      if (isNaN(dob.getTime())) return null;
      return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    })();
    const sortedVisits = p.clinicVisits?.length
      ? [...p.clinicVisits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];
    return {
      id: p.id,
      fullName: decodeLegacyEntities(p.fullName) || "Noma'lum",
      phone: p.phone || '—',
      passport: decodeLegacyEntities(p.passportSerial) || '—',
      age,
      lastVisit: sortedVisits.length ? new Date(sortedVisits[0].date).toLocaleDateString() : '—',
      visitsCount: p.clinicVisits?.length || 0,
      referredBy: decodeLegacyEntities(p.referredBy) || '—',
    };
  });

  const totalRegisteredPatientsCount = directoryPatients.length;

  const getServiceCategory = (name: string): string => {
    const n = name.toLowerCase();
    
    if (n.includes('diagnostika') || n.includes('konsultatsiya') || n.includes('rentgen') || n.includes('snimka') || n.includes('kt')) return 'Diagnostika';
    if (n.includes('oqartirish') || n.includes('zoom') || n.includes('bleaching')) return 'Tishlarni oqartirish';
    if (n.includes('vinir') || n.includes('komponir') || n.includes('lyuminir')) return 'Vinirlar';
    if (n.includes('implant') || n.includes('all-on-4') || n.includes('mega gen') || n.includes('osstem')) return 'Implantatsiya';
    if (n.includes('protez') || n.includes('koronka') || n.includes('metallokera') || n.includes('sirqoniy') || n.includes('plastmassa')) return 'Protezlash';
    if (n.includes('breket') || n.includes('plastinka') || n.includes('elayner') || n.includes('reteyner')) return 'Ortodontiya';
    if (n.includes('bolalar') || n.includes('sut tish') || n.includes('karies s')) return 'Bolalar stomatologiyasi';
    if (n.includes('olish') || n.includes('xirurg') || n.includes('operasiya') || n.includes('operatsiya') || n.includes('rezeksiya') || n.includes('kista') || n.includes('sinus')) return 'Xirurgiya';
    if (n.includes('tosh') || n.includes('tozalash') || n.includes('gigiyena') || n.includes('polirovka') || n.includes('ftor') || n.includes('air flow')) return 'Profilaktika';
    if (n.includes('karies') || n.includes('plomba') || n.includes('pulpit') || n.includes('abssess') || n.includes('davolash')) return 'Terapevtik stomatologiya';
    
    return 'Boshqa xizmatlar';
  };

  const groupServicesByCategory = () => {
    const filtered = clinicServices.filter(s => 
      s.name.toLowerCase().includes((addedServicesSearchTerm || '').toLowerCase())
    );
    
    const categories: Record<string, typeof clinicServices> = {};
    
    filtered.forEach(s => {
      const cat = getServiceCategory(s.name);
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s);
    });

    return { categories };
  };

  const groupedAddedServices = groupServicesByCategory();
  const sortedAddedCategories = [
    "Diagnostika", "Terapevtik stomatologiya", "Tishlarni oqartirish", 
    "Vinirlar", "Xirurgiya", "Protezlash", "Ortodontiya", 
    "Bolalar stomatologiyasi", "Implantatsiya", "Profilaktika", "Boshqa xizmatlar"
  ].filter(c => groupedAddedServices.categories[c] && groupedAddedServices.categories[c].length > 0);

  const myClinic = clinics.find(c => c.id === currentClinicId);
  const clinicNameStr = myClinic ? myClinic.name : "Samarqand Filiali";

  // Calculate subscription alert conditions
  const isTrial = myClinic?.subscriptionStatus === 'trial';
  const isSuspended = myClinic?.subscriptionStatus === 'suspended';
  // No fallback to a made-up 30 — that silently told a clinic with no payment
  // date on file "30 kun qoldi" right next to a "belgilanmagan" label for the
  // very same field, and suppressed the warning banner (30 >= 7) for exactly
  // the case that most needs one: nobody has set a payment date at all.
  const daysDiff = myClinic?.nextPaymentDate
    ? Math.floor((new Date(myClinic.nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const showWarning = isTrial || isSuspended || daysDiff === null || daysDiff < 7;

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
          <p className="text-xs text-indigo-200/75 mt-1 font-semibold leading-relaxed">{t("Sizga bog'langan klinika tarmog'ini masofadan analitika va biznes mantiqi yordamida boshqaring.")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          {setLanguage && <LanguageSwitcher language={language} setLanguage={setLanguage} variant="dark" />}
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
              {language === 'uz' ? 'Sizning' : t("sizning obuna statusingiz filial uchun")} <strong>{clinicNameStr}</strong>: <span className="font-bold underline text-amber-900">{isSuspended ? t("To'xtatilgan ❌") : isTrial ? t("1 haftalik bepul trial (sinov) muddatida 🎁") : t("Faol ✅")}</span>.
              &nbsp;{t("To'g'ridan-to'g'ri to'lov muddati:")} <strong className="font-mono text-amber-900">{myClinic?.nextPaymentDate || t("belgilanmagan")}</strong> {daysDiff === null ? '' : daysDiff <= 0 ? `(${t("Kechikkan!")})` : `(${daysDiff} ${t("kun qoldi")})`}.
              &nbsp;{t("Oylik obuna narxi:")} <strong className="text-indigo-900 font-mono">{myClinic?.rentalPrice ? `${myClinic.rentalPrice.toLocaleString('uz-UZ')} ${t("so'm")}` : t("belgilanmagan")}</strong>.
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                <Search className="text-blue-500 w-4 h-4" /> {t("Bemorlarni qidirish")}
              </h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-600">
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
                      <span className="block text-[10px] text-slate-400">{t('Filial: Samarqand')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
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
          onClick={() => setActiveSubTab('qabullar')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'qabullar'
              ? 'text-blue-600 border-b-2 border-blue-600 font-black'
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          {t("Qabullar")}
        </button>
        <button
          onClick={() => setActiveSubTab('hisobot')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'hisobot' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          {t("Hisobotlar")}
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
          onClick={() => setActiveSubTab('materiallar')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'materiallar'
              ? 'text-blue-600 border-b-2 border-blue-600 font-black'
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          {t("Materiallar")}
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
        <div 
          onClick={() => {
            setActiveSubTab('bugun');
            setSelectedPatientTab('yangi');
            setTimeout(() => document.getElementById('bemorlar-baza')?.scrollIntoView({ behavior: 'smooth' }), 50);
          }}
          className="bg-[#0b1226]/90 rounded-2xl p-4.5 border border-[#1e2f50] shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-pointer"
        >
          <div>
            <span className="text-[11px] text-slate-500 font-extrabold block uppercase tracking-widest mb-1.5 group-hover:text-emerald-400 transition-colors">
              {t("Bugun qabul qilingan")}
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {totalCompletedToday} {t("kishi")}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => { setActiveSubTab('hisobot'); setReportPeriod('kunlik'); }}
          className="bg-[#0b1226]/90 rounded-2xl p-4.5 border border-[#1e2f50] shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-pointer"
        >
          <div>
            <span className="text-[11px] text-slate-500 font-extrabold block uppercase tracking-widest mb-1.5 group-hover:text-emerald-400 transition-colors">
              {t("Bugungi potentsial tushum")}
            </span>
            <div className="text-base font-black text-emerald-400 font-mono flex items-baseline gap-1 mt-2">
              {todayRevenue.toLocaleString('uz-UZ')} <span className="text-[10px] text-emerald-500/50 uppercase">{t("UZS")}</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => {
            setActiveSubTab('bugun');
            setSelectedPatientTab('yangi');
            setTimeout(() => document.getElementById('bemorlar-baza')?.scrollIntoView({ behavior: 'smooth' }), 50);
          }}
          className="bg-[#0b1226]/90 rounded-2xl p-4.5 border border-[#1e2f50] shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-between group hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <div>
            <span className="text-[11px] text-slate-500 font-extrabold block uppercase tracking-widest mb-1.5 group-hover:text-amber-400 transition-colors">
              {t("Hozir kutayotgan")}
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {currentWaitingCount} {t("kishi")}
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => { 
            setActiveSubTab('bugun');
            setSelectedPatientTab('jami'); 
            setTimeout(() => document.getElementById('bemorlar-baza')?.scrollIntoView({ behavior: 'smooth' }), 50);
          }}
          className="bg-[#0b1226]/90 rounded-2xl p-4.5 border border-[#1e2f50] shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-between group hover:border-indigo-500/30 transition-all cursor-pointer"
        >
          <div>
            <span className="text-[11px] text-slate-500 font-extrabold block uppercase tracking-widest mb-1.5 group-hover:text-indigo-400 transition-colors">
              {t("Jami ro'yxatdagi bemorlar")}
            </span>
            <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
              {totalRegisteredPatientsCount} {t("ta")}
            </div>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 group-hover:scale-110 transition-transform group-hover:rotate-12">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* -------------------- TAB 1: BUGUN VIEW (SCREENSHOT 5) -------------------- */}
      {activeSubTab === 'bugun' && (
        <div className="space-y-6">
          <InstallAppBanner />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Shifokorlar bugungi hisoboti (Tab 1 left part) */}
            <div className="lg:col-span-8 bg-white text-slate-800 rounded-3xl p-5 border border-slate-100/80 shadow-md">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">
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
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {clinicDoctors.map((doc) => {
                      const stats = getDocTodayStats(doc.id);
                      const link = getDoctorLink(doc.id);
                      const isRental = link?.relationshipType === 'rental';
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/30">
                          <td className="px-4 py-3.5 flex items-center gap-3">
                            <img src={doc.image} alt={doc.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100 animate-fade-in" referrerPolicy="no-referrer" />
                            <div>
                              <strong className="text-slate-800 flex items-center gap-1.5 text-xs">
                                {doc.name}
                                {link?.relationshipType === 'independent' && (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                                    🏠 Mustaqil
                                  </span>
                                )}
                              </strong>
                              <span className="text-[10px] text-slate-400 font-semibold">{doc.specialty}</span>
                            </div>
                          </td>
                          {isRental ? (
                            <td colSpan={2} className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                                🔒 Ijara · {link?.rentPaymentStatus === 'paid' ? "To'langan" : 'To\'lanmagan'}
                              </span>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3.5 text-center font-mono">
                                {stats.completedCount} kishi / <span className="text-amber-600 font-bold">{stats.activeCount} kutmoqda</span>
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-blue-700">
                                {stats.revenue.toLocaleString('uz-UZ')}.00 so'm
                                {link?.relationshipType === 'revenue_share' && (
                                  <div className="text-[10px] text-emerald-600 font-bold">
                                    Klinika ulushi: {Math.round(stats.revenue * (100 - (link.doctorRevenueSharePercent ?? 50)) / 100).toLocaleString('uz-UZ')} so'm
                                  </div>
                                )}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3.5 text-center text-amber-400 font-sans font-bold">
                            {/* A brand-new doctor is created with rating: 5.0 as a
                                placeholder default and no reviews yet — showing it
                                unconditionally read as a genuine 5-star record. */}
                            {doc.ratingCount ? `★ ${doc.rating.toFixed(1)}` : <span className="text-slate-300 font-normal">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2.5">
                              <button
                                onClick={() => setActiveTab && setActiveTab('shifokor')}
                                className="text-blue-500 hover:text-blue-600 font-extrabold underline cursor-pointer text-[11px]"
                              >
                                {t("Kabinet")}
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => {
                                  setLinkEditDoctor(doc);
                                  setLinkEditType(link?.relationshipType || 'revenue_share');
                                  setLinkEditPercent(String(link?.doctorRevenueSharePercent ?? 50));
                                  setLinkEditRent(String(link?.monthlyRentFee ?? 0));
                                }}
                                className="text-indigo-500 hover:text-indigo-600 font-extrabold underline cursor-pointer text-[11px]"
                              >
                                🤝 Bog'lanish
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => setDoctorToDelete(doc)}
                                className="text-rose-600 hover:text-rose-800 font-extrabold underline cursor-pointer text-[11px] flex items-center gap-0.5"
                              >
                                🗑️ {t("O'chirish")}
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
            <div className="lg:col-span-4 bg-white text-slate-800 rounded-[2rem] p-5 lg:p-6 border border-slate-100/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col h-full max-h-[650px] relative overflow-hidden group/catalog">
              {/* Decorative backgrounds */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-50/50 via-sky-50/30 to-transparent rounded-bl-full pointer-events-none -mr-8 -mt-8 transition-transform duration-700 group-hover/catalog:scale-110" />
              
              <div className="flex items-center justify-between mb-5 border-b border-indigo-50/60 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-xl shadow-lg shadow-sky-500/20 -rotate-3 transition-transform duration-500 group-hover/catalog:rotate-0">
                    <span className="text-xl rotate-3 transition-transform duration-500 group-hover/catalog:-rotate-3 drop-shadow-sm">📋</span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">
                      Katalog
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                      Bugungi mashhur xizmatlar
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-y-auto pr-2 pb-2 space-y-4 flex-1 relative z-10">
                {(() => {
                  // Pre-calculate call counts and sort
                  const servicesWithCounts = clinicServices.map(srv => {
                    const callCount = completedQueuesToday.filter(q => q.serviceId === srv.id).length;
                    return { ...srv, callCount };
                  }).sort((a,b) => b.callCount - a.callCount); // Most popular first

                  // Group by category
                  const popularCategories: Record<string, typeof servicesWithCounts> = {};
                  servicesWithCounts.forEach(s => {
                    const cat = getServiceCategory(s.name);
                    if (!popularCategories[cat]) popularCategories[cat] = [];
                    popularCategories[cat].push(s);
                  });

                  // Only show categories that have items, sorted by category with highest call counts
                  const sortedCats = Object.keys(popularCategories).sort((a,b) => {
                    return popularCategories[b][0].callCount - popularCategories[a][0].callCount;
                  });

                  if (sortedCats.length === 0) {
                    return (
                      <div className="text-center py-10 text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Xizmatlar mavjud emas
                      </div>
                    );
                  }

                  return sortedCats.map(cat => (
                    <div key={cat} className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all duration-300">
                      <div className="bg-white border-b border-slate-100 p-3 flex items-center gap-3">
                        <span className="text-base flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 shadow-sm border border-slate-100">
                          {cat === "Diagnostika" && "🔬"}
                          {cat === "Terapevtik stomatologiya" && "🦷"}
                          {cat === "Tishlarni oqartirish" && "✨"}
                          {cat === "Vinirlar" && "💎"}
                          {cat === "Xirurgiya" && "🩸"}
                          {cat === "Protezlash" && "🦿"}
                          {cat === "Ortodontiya" && "⚙️"}
                          {cat === "Bolalar stomatologiyasi" && "🧸"}
                          {cat === "Implantatsiya" && "🔩"}
                          {cat === "Profilaktika" && "🧼"}
                          {cat === "Boshqa xizmatlar" && "📌"}
                        </span>
                        <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex-1 leading-snug">{translateMedicalText(cat, language)}</h4>
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-inner">
                          {popularCategories[cat].length}
                        </span>
                      </div>
                      <div className="p-2.5 grid grid-cols-1 gap-2">
                        {popularCategories[cat].map(srv => (
                          <div key={srv.id} className="flex flex-col gap-1.5 p-3 bg-white rounded-[14px] border border-slate-100 hover:border-sky-200 hover:shadow-[0_4px_15px_-5px_rgba(14,165,233,0.15)] transition-all duration-300 group">
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-bold text-xs text-slate-700 leading-snug group-hover:text-sky-600 transition-colors pt-0.5">
                                {translateMedicalText(srv.name, language)}
                              </span>
                              <span className={`font-mono px-2 py-1 rounded-lg flex-shrink-0 text-[10px] font-black ${srv.callCount > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                {srv.callCount} ta
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {srv.id.split('_').pop()}</span>
                              <span className="font-black text-indigo-600 text-[11px] font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
                                {srv.price.toLocaleString('uz-UZ')} UZS
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>

          {/* Full width: bugungi barcha navbatlar list */}
          {/* BEMORLAR TAHLILI - YANGI VS JAMI ALOHIDA (CREATIVE TABBED LAYOUT) */}
          <div id="bemorlar-baza" className="bg-white text-slate-800 rounded-3xl p-6 border border-slate-100/80 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9]">👥 Bemorlar Ma'lumot BAZASI</span>
                <h3 className="text-base font-black text-slate-800 mt-1">
                  Yangi va Jami Ro'yxatdan O'tganlar Tafsiloti
                </h3>
              </div>

              {/* Toggle controls with premium style */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 select-none">
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
                    🗄️ Jami Ro'yxatbaza ({directoryPatients.length} kishi)
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Qaytish
                </button>
                <button
                  type="button"
                  onClick={() => onLogout && onLogout()}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/50 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Chiqish
                </button>
              </div>
            </div>

            {/* Render selected sub-section */}
            {selectedPatientTab === 'yangi' ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-xs text-amber-800 leading-relaxed">
                  💡 <strong>Bugun Navbatda Turgan Yangi Bemorlar:</strong> Ushbu ro'yxat bugun elektron chipta orqali yoki shaxsan kelib navbat olgan va klinikani ziyorat qilayotgan bemorlarni ko'rsatadi. Bu ma'lumotlar real-vaqt rejimida avtomatik ravishda yangilanadi.
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-extrabold border-b border-slate-100">
                        <th className="px-4 py-3"># Chipta</th>
                        <th className="px-4 py-3">F.I.SH Ismi</th>
                        <th className="px-4 py-3">Aloqa raqami</th>
                        <th className="px-4 py-3">Biriktirilgan Shifokor</th>
                        <th className="px-4 py-3">Xizmat va Yo'nalish</th>
                        <th className="px-4 py-3">Holati</th>
                        <th className="px-4 py-3 text-right">Reyting/Baho</th>
                        <th className="px-4 py-3 text-center">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {clinicQueues.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">Bugun birorta ham yangi chipta olingani yo'q.</td>
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
                                {/* This table lists every ticket the clinic has ever had, not
                                    just today's — the badge used to say "Bugun Yangi" on every
                                    row regardless of age. */}
                                {isToday(item) && (
                                  <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/55 inline-block">Bugun Yangi</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-mono">
                                {item.patientPhone}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {doc?.name || 'Nevizual/Boshqa'}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
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
                                {item.rating ? '★'.repeat(item.rating) : <span className="text-slate-300 font-normal font-mono text-[10px]">-</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    if (window.confirm("Ushbu navbatni bekor qilmoqchimisiz?")) {
                                      onCancelQueue && onCancelQueue(item.id);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded shrink-0 text-[10px] font-extrabold uppercase transition-all"
                                  title="Navbatni bekor qilish"
                                >
                                  Bekor qilish
                                </button>
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
                <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl text-xs text-sky-800 leading-relaxed flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    💡 <strong>Klinika Passport Bemorlar BAZASI (CRM):</strong> Quyida klinika terminali, telefon va mobil ilova orqali bugungacha ro'yxatdan o'tgan barcha tarixiy va faol bemorlar bazasining sinxron tahlili keltirilgan.
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold text-[10.5px] rounded-lg">
                    Jami ma'lumotlar hajmi: {totalRegisteredPatientsCount} ta bemor
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-extrabold border-b border-slate-100">
                        <th className="px-4 py-3">Bemor F.I.SH</th>
                        <th className="px-4 py-3">ID / Passport</th>
                        <th className="px-4 py-3">Aloqa raqami</th>
                        <th className="px-4 py-3 text-center">Yosh</th>
                        <th className="px-4 py-3 text-center font-mono">Tashriflar</th>
                        <th className="px-4 py-3">Kim tavsiya qildi</th>
                        <th className="px-4 py-3 text-right font-sans">Oxirgi qabul</th>
                        <th className="px-4 py-3 text-center">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {directoryPatients.map((pt) => (
                        <tr key={pt.id} className="hover:bg-slate-50/20 transition-all">
                          <td className="px-4 py-3">
                            <span className="text-slate-800 font-extrabold block">{pt.fullName}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[10.5px] text-slate-400">
                            {pt.passport}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">
                            {pt.phone}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 font-mono">
                            {pt.age !== null ? `${pt.age} yosh` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 font-mono font-bold">
                            {pt.visitsCount} marta
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[11px]">
                            {pt.referredBy}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-blue-600 text-[10.5px]">
                            {pt.lastVisit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (pt.id && window.confirm(`${pt.fullName} tizimdan o'chirilsinmi?`)) {
                                  onDeletePatient?.(pt.id);
                                }
                              }}
                              disabled={!pt.id}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed text-rose-600 border border-rose-200 rounded shrink-0 text-[10px] font-extrabold uppercase transition-all"
                              title={pt.id ? "Tizimdan o'chirish" : "Ro'yxatdan o'tmagan (faqat navbat)"}
                            >
                              O'chirish
                            </button>
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


      {/* -------------------- TAB 2: HISOBOT VIEW -------------------- */}
      {activeSubTab === 'hisobot' && (
        <div className="h-full min-h-[600px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <Statistics
            queues={clinicQueues}
            services={clinicServices}
            doctors={clinicDoctors}
            patients={clinicPatientsList}
            clinicId={currentClinicId}
            clinicName={clinicNameStr}
            language={language}
            staffToken={staffToken}
            initialTimeRange={
              reportPeriod === 'kunlik' ? 'daily' : reportPeriod === 'oylik' ? 'monthly' : reportPeriod === 'yillik' ? 'yearly' : 'weekly'
            }
          />
        </div>
      )}


      {/* -------------------- QABULLAR: who saw whom, and when --------------- */}
      {/* Built on the queue records the panel already holds — GET /api/queues
          returns this clinic's rows in full for a director session, so there is
          nothing new to fetch and nothing that can fall out of step with the
          KPI cards, which now read the same visitDateKey. */}
      {activeSubTab === 'qabullar' && (
        <div className="h-[calc(100vh-16rem)] min-h-[560px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <VisitsJournal
            queues={clinicQueues}
            doctors={clinicDoctors}
            services={clinicServices}
            patients={clinicPatientsList}
            clinicId={currentClinicId}
            clinicName={clinicNameStr}
            staffToken={staffToken}
            language={language}
          />
        </div>
      )}

      {/* -------------------- MATERIALLAR: every doctor's stock at once ------ */}
      {/* Each doctor keeps their own shelf; the director's copy of the same
          screen adds them all up and says whose is whose. Stock with no owner
          is the clinic's shared supply — which is what all of it was before
          shelves were split per doctor. */}
      {activeSubTab === 'materiallar' && (
        <div className="h-full min-h-[600px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <MaterialsInventory
            clinicId={currentClinicId}
            aggregate
            doctorNameById={(id) => clinicDoctors.find((d: any) => d.id === id)?.name}
            language={language}
          />
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
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mutaxassisligi / Mutaxassislik Yo'nalishi</label>
                    <select
                      value={newDocSpecialty}
                      onChange={(e) => setNewDocSpecialty(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 focus:border-cyan-500"
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
              const link = getDoctorLink(doc.id);
              const isRental = link?.relationshipType === 'rental';
              return (
                <div key={doc.id} className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-md">
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-4 mb-4">
                    <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2 border-blue-500 shadow-sm" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                        {doc.name}
                        {link?.relationshipType === 'independent' && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                            🏠 Mustaqil
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold">{doc.specialty}</p>

                      <div className="flex items-center text-amber-500 text-xs mt-1.5 gap-1 font-bold">
                        {doc.ratingCount ? (
                          <span>★ {doc.rating.toFixed(1)}</span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                        <span className="text-slate-400 text-[10px] font-normal font-mono">({doc.ratingCount || 0} sharhlar)</span>
                      </div>
                    </div>
                  </div>

                  {isRental ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center mb-4">
                      <span className="text-xs font-bold text-slate-400">
                        🔒 Ijara shartnomasi · {link?.rentPaymentStatus === 'paid' ? "to'langan" : "to'lanmagan"}
                      </span>
                    </div>
                  ) : (
                    /* Numeric Grid (Screenshot 9 detail) */
                    <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Bugun</span>
                        <strong className="text-xs font-bold text-slate-700 font-mono">{todayStats.completedCount} kishi</strong>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Haftalik</span>
                        <strong className="text-xs font-bold text-slate-700 font-mono">{todayStats.completedThisWeek} kishi</strong>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Erkinligi</span>
                        <strong className="text-xs font-bold text-emerald-600 font-sans">Faol ({doc.status === 'idle' ? 'bo\'sh' : doc.status === 'busy' ? 'band' : 'tushlikda'})</strong>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {/* Used to hardcode "🟢 Qabulga tayyor" regardless of doc.status —
                        a doctor who was busy or at lunch still showed as ready. */}
                    <span className="text-[10px] text-slate-400 font-bold">
                      Status:{doc.status === 'idle' ? '🟢 Qabulga tayyor' : doc.status === 'busy' ? '🔴 Band' : '🟡 Tushlikda'}
                    </span>
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
        <div className="bg-[#0b1226]/90 border border-[#1e2f50] shadow-[0_15px_40px_rgba(0,0,0,0.15)] relative overflow-hidden rounded-3xl p-5 md:p-6 space-y-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[#132039] pb-4 flex-wrap gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#111a33] border border-[#1e2f50] text-emerald-400 rounded-xl">🔧</span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">
                ⚙ Tibbiy Xizmatlar Katalogi va Narxlar Tahriri
              </h3>
            </div>
            
            <button
              onClick={() => setShowAddServiceForm(!showAddServiceForm)}
              className="px-4.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              ➕ {showAddServiceForm ? "Yopish" : "Yangi Xizmat Qo'shish"}
            </button>
          </div>

          {srvFeedbackMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl animate-fade-in relative z-10">
              {srvFeedbackMsg}
            </div>
          )}

          {/* 1. Standard Dental Services Catalog Selector Section */}
          <div className="bg-[#0d1428] border border-[#1e2f50] rounded-3xl p-5 space-y-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2f50] pb-4 flex-wrap">
              <div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                  {t("🏥 Standart Tibbiy Xizmatlar Katalogi (Tezkor tanlash)")}
                </span>
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest mt-2 block">
                  {t("Xizmatlarni qo'shish (Narxini kiritish shart emas)")}
                </h4>
              </div>

              {/* Catalog Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("Katalogdan qidirish...")}
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  className="bg-[#111a33] border border-[#263b65] text-xs font-bold text-slate-100 rounded-xl pl-8 pr-3.5 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full sm:w-56 transition-all placeholder-slate-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            {/* Catalog Categories Grid / Selector Tabs */}
            {!catalogSearchQuery && (
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[#172545]">
                {STANDARD_SERVICES_CATALOG.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCatalogCategory(idx)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      selectedCatalogCategory === idx
                        ? 'bg-emerald-500 border-emerald-500 text-slate-900 shadow-md shadow-emerald-500/20'
                        : 'bg-[#111a33] border-[#1e2f50] hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    {language === 'uz' ? cat.categoryNameUz : language === 'ru' ? cat.categoryNameRu : cat.categoryNameEn}
                  </button>
                ))}
              </div>
            )}

            {/* Listed catalog items inside selected category or matching query */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1 customize-scrollbar pt-2">
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
                    <div className="col-span-full py-8 text-center text-xs text-slate-500 font-bold">
                      {t("Katalogda bunday nomli xizmat topilmadi 🔍")}
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
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isActive 
                          ? 'bg-[#152445] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                          : 'bg-[#101830] border-[#1b2a4e] hover:border-emerald-500/30'
                      }`}
                    >
                      <div>
                        <span className="text-[8px] font-mono font-black text-emerald-500/70 uppercase tracking-widest block mb-1.5">
                          {item.category}
                        </span>
                        <h5 className="text-[12px] font-bold text-slate-100 leading-snug">
                          {item.name}
                        </h5>
                      </div>
                      
                      {isActive ? (
                        <div className="flex flex-col gap-1 w-full border-t border-[#1e2f50] pt-3 mt-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              {t("Amaldagi narx:")}
                            </span>
                            <span className="text-xs font-black text-emerald-400 font-mono">
                              {activePrice?.toLocaleString('uz-UZ')} <span className="text-[8px] uppercase">UZS</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-end mt-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase flex items-center gap-1 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {t("Klinikada faol")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 w-full border-t border-[#1e2f50] pt-3 mt-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              {t("Tavsiya etilgan:")}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              {item.price.toLocaleString('uz-UZ')} <span className="text-[8px] uppercase">UZS</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 justify-between mt-1">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={customPrice}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setCustomCatalogPrices(prev => ({ ...prev, [item.name]: val }));
                                }}
                                className="w-full bg-[#111a33] border border-[#263b65] focus:border-emerald-500 text-xs font-black text-emerald-400 rounded-xl pl-2 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center font-mono"
                                placeholder={t("Narx")}
                              />
                              <span className="absolute right-2.5 top-2.5 text-[7px] text-slate-500 font-bold uppercase">UZS</span>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                const newSrv: Service = {
                                  id: `srv_${currentClinicId}_std_${Date.now()}_${idX}_${Math.floor(Math.random() * 100)}`,
                                  clinicId: currentClinicId,
                                  name: item.name,
                                  price: customPrice
                                };
                                if (onAddService) {
                                  // This used to show the success toast unconditionally,
                                  // even when the server rejected the write.
                                  const result = await onAddService(newSrv);
                                  if (result === false) {
                                    setSrvFeedbackMsg("Xizmatni saqlab bo'lmadi. Qayta urinib ko'ring.");
                                    setTimeout(() => setSrvFeedbackMsg(''), 4000);
                                    return;
                                  }
                                  const srvAddedTpl: Record<string, string> = { uz: `"${item.name}" yangi narx bilan qo'shildi!`, ru: `"${item.name}" добавлена с новой ценой!`, en: `"${item.name}" standard service added with customized price!`, kk: `"${item.name}" жаңа бағамен қосылды!`, ky: `"${item.name}" жаңы баа менен кошулду!`, tg: `"${item.name}" бо нархи нав илова шуд!`, tk: `"${item.name}" täze baha bilen goşuldy!` };
                                  setSrvFeedbackMsg(srvAddedTpl[language] || srvAddedTpl.en);
                                  setTimeout(() => setSrvFeedbackMsg(''), 4000);
                                }
                              }}
                              className="px-3 py-2 bg-[#172545] hover:bg-emerald-500 hover:text-slate-900 border border-[#263b65] hover:border-emerald-400 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
                            >
                              ➕ {t("Qo'shish")}
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
            <div className="bg-[#0a1020] border border-emerald-500/30 rounded-2xl p-5 space-y-4 animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.1)] relative z-10 w-full col-span-full">
              <div className="flex items-center gap-2 border-b border-[#1e2f50] pb-3">
                <span className="text-emerald-400 text-sm">✨</span>
                <strong className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  {t("Katalogdan Tashqari Maxsus Noyob Xizmat Qo'shish")}
                </strong>
              </div>

              <form onSubmit={handleCreateServiceSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pt-2">
                <div className="col-span-1 sm:col-span-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                    {t("Xizmat nomi (Masalan: Maxsus implantatsiyadan keyingi terapiya)")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("Masalan: Maxsus muolaja")}
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full bg-[#111a33] border border-[#263b65] focus:border-emerald-500 text-xs font-black text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-500 transition-all"
                  />
                </div>

                <div className="col-span-1 sm:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{t("Narxi (UZS)")}</label>
                  <input
                    type="number"
                    required
                    placeholder="Masalan: 350000"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full bg-[#111a33] border border-[#263b65] focus:border-emerald-500 text-xs font-black text-emerald-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono placeholder-emerald-500/30 transition-all"
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
                    className="w-full py-3 bg-[#172545] border border-[#263b65] hover:bg-[#1e2f50] text-[#a0b0d0] text-xs font-black rounded-xl cursor-pointer transition-all"
                  >
                    {t("Bekor")}
                  </button>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 border border-emerald-400 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                  >
                    {t("Saqlash✓")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Inline Edit Form Container */}
          {editingServiceId && (
            <div className="bg-[#0a1020] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.08)] relative z-10 w-full mt-4">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-[#1e2f50] pb-2">
                {t("📝 Xizmat narxini va nomini o'zgartirish oynasi")}
              </h4>

              <form onSubmit={handleUpdateServiceSubmit} className="flex flex-col sm:flex-row items-end gap-3 pt-1">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{t("Xizmat nomi")}</label>
                  <input
                    type="text"
                    required
                    value={editingServiceName}
                    onChange={(e) => setEditingServiceName(e.target.value)}
                    className="w-full bg-[#111a33] border border-[#263b65] focus:border-amber-500 text-xs font-bold text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{t("Narxi (UZS)")}</label>
                  <input
                    type="number"
                    required
                    value={editingServicePrice}
                    onChange={(e) => setEditingServicePrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#111a33] border border-[#263b65] focus:border-amber-500 text-xs font-bold text-amber-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingServiceId(null)}
                    className="px-4 py-3 bg-[#172545] border border-[#263b65] hover:bg-[#1e2f50] text-[#a0b0d0] text-xs font-bold rounded-xl transition-all"
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 border border-amber-400 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                  >
                    {t("Yangilash✓")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Added Services Search Input */}
          <div className="relative mt-8 mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#4a5f8a]" />
            </div>
            <input
              type="text"
              className="w-full bg-[#111a33] border border-[#263b65] focus:border-emerald-500 text-sm font-bold text-slate-100 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder-[#4a5f8a]"
              placeholder={t("Klinikaga qo'shilgan xizmatlar ichidan qidirish...")}
              value={addedServicesSearchTerm}
              onChange={(e) => setAddedServicesSearchTerm(e.target.value)}
            />
          </div>

          {/* List of services in a categorized accordion list */}
          {sortedAddedCategories.length > 0 ? (
            <div className="border border-[#1e2f50] rounded-2xl overflow-hidden bg-[#0a1020] shadow-xl shadow-[#0b1226]/50 divide-y divide-[#1e2f50]">
              {sortedAddedCategories.map(cat => (
                <div key={cat} className="bg-[#0a1020]">
                  <button 
                    onClick={(e) => { e.preventDefault(); setOpenServiceCategory(openServiceCategory === cat ? "" : cat); }}
                    className="w-full flex items-center justify-between p-5 bg-[#0d1428] hover:bg-[#152445] transition-colors cursor-pointer"
                    type="button"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-xl flex items-center justify-center w-8 text-slate-300">
                        {cat === "Diagnostika" && "🔬"}
                        {cat === "Terapevtik stomatologiya" && "🦷"}
                        {cat === "Tishlarni oqartirish" && "✨"}
                        {cat === "Vinirlar" && "💎"}
                        {cat === "Xirurgiya" && "🩸"}
                        {cat === "Protezlash" && "🦿"}
                        {cat === "Ortodontiya" && "⚙️"}
                        {cat === "Bolalar stomatologiyasi" && "🧸"}
                        {cat === "Implantatsiya" && "🔩"}
                        {cat === "Profilaktika" && "🧼"}
                        {cat === "Boshqa xizmatlar" && "📌"}
                      </span>
                      <span className="text-sm font-black uppercase tracking-widest text-slate-100 text-left">
                        {translateMedicalText(cat, language)}
                      </span>
                      <span className="bg-[#1e2f50] text-[#a0b0d0] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#263b65] ml-1 shadow-inner">
                        {groupedAddedServices.categories[cat].length}
                      </span>
                    </div>
                    {openServiceCategory === cat ? <ChevronUp className="w-5 h-5 text-[#a0b0d0] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#4a5f8a] shrink-0" />}
                  </button>

                  <AnimatePresence>
                    {(openServiceCategory === cat || addedServicesSearchTerm) && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#0d1428] flex flex-col"
                      >
                        <div className="p-3 grid grid-cols-1 gap-3 border-t border-[#1e2f50]">
                          {groupedAddedServices.categories[cat].map(srv => (
                            <div 
                              key={srv.id} 
                              className="border border-[#1e2f50] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group relative bg-[#0a1020] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
                            >
                              <div>
                                <h5 className="text-[14px] font-bold mb-1.5 leading-snug transition-colors pr-6 text-slate-100 group-hover:text-emerald-400">
                                  {translateMedicalText(srv.name, language)}
                                </h5>
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shadow-inner inline-block">
                                    {srv.price.toLocaleString('uz-UZ')} <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">UZS</span>
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                                    ID: {srv.id}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center justify-end gap-2">
                                <button
                                  onClick={() => startEditingService(srv)}
                                  className="px-4 py-2 border border-[#263b65] hover:border-amber-400/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
                                >
                                  {t("Tahrirlash")}
                                </button>
                                <button
                                  onClick={() => setServiceToDelete(srv)}
                                  className="px-4 py-2 border border-[#263b65] hover:border-rose-400/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
                                >
                                  {t("O'chirish")}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#a0b0d0] border border-[#1e2f50] rounded-2xl bg-[#0d1428] shadow-lg shadow-[#0b1226]/50">
              <span className="text-4xl block mb-4">🏥</span>
              <p className="font-bold text-sm tracking-wide">
                {t("Siz klinika uchun birorta ham xizmat kiritmagansiz")}
              </p>
              <p className="text-xs text-[#4a5f8a] mt-2 max-w-sm mx-auto">
                {t("Tepadan xizmat nomini izlang yoki qatorni bosib xizmat qo'shib oling.")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 5: BILLING AND LICENSE SUBSCRIPTION MONITORING -------------------- */}
      {activeSubTab === 'obuna' && (
        <div className="space-y-6">
          {/* Main Info Box */}
          <div className="bg-white text-slate-800 rounded-3xl p-6 border border-slate-100/80 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">💳</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                    {t("Oylik Obuna va Litsenziya Nazorati")}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-none mt-1">
                    {t("Klinikangizning SaaS va ijra mantiqi bo'yicha to'lov ko'rsatkichlari")}
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
                Status: {isSuspended ? t("To'xtatilgan") : isTrial ? t("Sinov muddati") : t("Faol")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Card 1 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {t("Navbatdagi to'lov sanasi")}
                </span>
                <strong className="text-lg text-slate-800 font-semibold block mt-1.5 font-mono">
                  {myClinic?.nextPaymentDate || t("Mavjud emas")}
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  {daysDiff === null
                    ? t("To'lov sanasi belgilanmagan.")
                    : daysDiff <= 0
                    ? t("Muddati o'tgan! Iltimos to'lashni amalga oshiring.")
                    : (() => {
                        const daysLeftTpl: Record<string, string> = {
                          uz: `SaaS xizmatingiz tugashiga ${daysDiff} kun qoldi.`,
                          ru: `До окончания SaaS подписки осталось ${daysDiff} дней.`,
                          en: `${daysDiff} calendar days remaining in your active session.`,
                          kk: `SaaS қызметіңіздің аяқталуына ${daysDiff} күн қалды.`,
                          ky: `SaaS кызматыңыздын бүтүшүнө ${daysDiff} күн калды.`,
                          tg: `То анҷоми хизмати SaaS-и шумо ${daysDiff} рӯз монд.`,
                          tk: `SaaS hyzmatyňyzyň gutarmagyna ${daysDiff} gün galdy.`
                        };
                        return daysLeftTpl[language] || daysLeftTpl.en;
                      })()}
                </span>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {t("Oylik abonent to'lovi")}
                </span>
                <strong className="text-lg text-indigo-700 font-semibold block mt-1.5 font-mono">
                  {/* This used to fall back to a hardcoded 1,500,000 so'm whenever
                      rentalPrice wasn't actually set, presenting a fabricated fee
                      as the clinic's real subscription price. */}
                  {myClinic?.rentalPrice ? `${myClinic.rentalPrice.toLocaleString('uz-UZ')} ${t("so'm")}` : t("belgilanmagan")}
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  {t("Yillik litsenziya imtiyozlari qo'llanilgan.")}
                </span>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  {t("Klinika havolasi")}
                </span>
                <strong className="text-lg text-emerald-700 font-semibold block mt-1.5 font-mono break-all">
                  {window.location.origin}/?clinic={myClinic?.subdomain || currentClinicId}
                </strong>
                <span className="text-xs text-slate-400 font-semibold mt-1 block">
                  {t("Xarita integratsiyasi faollashtirilgan.")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-slate-800">
            {/* Interactive Billing Form */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-100/80 shadow-md">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 block">
                💳 {t("To'lovni amalga oshirish")}
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
                          {t("Tasdiqlanish kutilmoqda")}
                        </strong>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          {(() => {
                            const invId = pendingApprovalInvoice.id;
                            const pendingInvoiceTpl: Record<string, string> = {
                              uz: `Klinika hisobidan yuborilgan to'lov so'rovi (kod: ${invId}) superadmin tasdig'ini kutmoqda. Superadmin uni tasdiqlashi bilan daromadga qo'shiladi va obuna uzaytiriladi!`,
                              ru: `Запрос на проведение платежа (код: ${invId}) ожидает одобрения суперадминистратора. Как только он одобрит, подписка автоматически продлится!`,
                              en: `Rental payment proposal (inv-id: ${invId}) is waiting for manual SaaS owner verification. Once approved, your validity extends instantly!`,
                              kk: `Клиника есебінен жіберілген төлем сұрауы (код: ${invId}) суперәкімші растауын күтуде. Суперәкімші растаған соң, жазылым ұзартылады!`,
                              ky: `Клиника эсебинен жөнөтүлгөн төлөм суроосу (код: ${invId}) суперадминдин ырастоосун күтүүдө. Суперадмин ырастагандан кийин, жазылуу узартылат!`,
                              tg: `Дархости пардохти аз ҳисоби клиника фиристодашуда (код: ${invId}) тасдиқи суперадминро интизор аст. Пас аз тасдиқ, обуна дароз карда мешавад!`,
                              tk: `Klinika hasabyndan iberilen töleg islegi (kod: ${invId}) superadminiň tassyklamasyna garaşylýar. Superadmin tassyklandan soň, abuna uzaldylar!`
                            };
                            return pendingInvoiceTpl[language] || pendingInvoiceTpl.en;
                          })()}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left space-y-1">
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>{t("Summa:")}</span>
                          <span className="font-bold font-mono text-slate-800">{pendingApprovalInvoice.amount.toLocaleString()} UZS</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>{t("Yuborilgan sana:")}</span>
                          <span className="font-medium font-mono text-slate-700">{pendingApprovalInvoice.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-normal">
                      {t("Siz bu yerdan oylik to'lov so'rovini superadmin paneliga jo'natishingiz mumkin. Superadmin to'lovni tasdiqlagandan so'ng, tizimingiz muddati uzaytiriladi.")}
                    </p>

                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center gap-3">
                      <span className="text-lg">💡</span>
                      <p className="text-[11px] text-blue-800 leading-tight">
                        <strong>Trial:</strong> {t("Har qanday ro'yxatdan o'tgan yangi klinika uchun 1 haftalik mutlaqo bepul sinov litsenziyasi avtomatik tarzda taqdim etilgan!")}
                      </p>
                    </div>

                    <button
                      onClick={() => onSimulatePayment && onSimulatePayment(currentClinicId)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-97 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>💳 {t("Oylik To'lovni Yuborish")}</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Invoices History Table */}
            <div className="lg:col-span-8 bg-white text-slate-800 rounded-3xl p-5 border border-slate-100/80 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  📜 {t("To'lovlar tarixi monitoringi (Filial bo'yicha)")}
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">
                  {t("Barcha kvitansiyalar")}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-black tracking-wider uppercase text-[10px]">
                      <th className="py-2.5">{t("Kvitansiya ID")}</th>
                      <th className="py-2.5">{t("Muddati")}</th>
                      <th className="py-2.5 text-right">{t("Summa (UZS)")}</th>
                      <th className="py-2.5">{t("To'langan sana")}</th>
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
                              {t("Hozircha birorta ham to'lov hujjatlari topilmadi.")}
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
                              {pay.status === 'confirmed' ? t("Tasdiqlangan") : pay.status === 'pending_approval' ? t("Kutilmoqda") : t("To'lanmagan")}
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
          <p>© 2025-2026 DStoma Clinic Boss Panel. {t("Barcha huquqlar himoyalangan.")}</p>
          <div className="flex items-center gap-1.5 text-slate-500">
            {t("Klinika hisoboti avtomatik tarzda shakllanadi.")}
          </div>
        </div>
      </footer>

      {/* DOCTOR-CLINIC RELATIONSHIP MODAL */}
      {linkEditDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                {linkEditDoctor.name} — Klinika bilan bog'lanish
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Ushbu shifokorning klinika bilan biznes kelishuvi turini belgilang</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setLinkEditType('revenue_share')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${linkEditType === 'revenue_share' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
              >
                Ulush (foiz)
              </button>
              <button
                onClick={() => setLinkEditType('rental')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${linkEditType === 'rental' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
              >
                Ijara
              </button>
              <button
                onClick={() => setLinkEditType('independent')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${linkEditType === 'independent' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
              >
                Mustaqil
              </button>
            </div>

            {linkEditType === 'revenue_share' ? (
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Shifokorning ulushi (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={linkEditPercent}
                  onChange={(e) => setLinkEditPercent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Klinikaning ulushi: {Math.max(0, 100 - (Number(linkEditPercent) || 0))}%
                </p>
              </div>
            ) : linkEditType === 'rental' ? (
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Oylik ijara to'lovi (so'm)</label>
                <input
                  type="number"
                  min={0}
                  value={linkEditRent}
                  onChange={(e) => setLinkEditRent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  Ijara modelida bu shifokorning daromadi va bemorlar soni Boshliq panelida ko'rsatilmaydi — to'liq maxfiy qoladi.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                <p className="text-[11px] text-emerald-700 font-semibold leading-snug">
                  🏠 Bu klinika ushbu shifokorning shaxsiy klinikasi — butun daromad unga tegishli, ulush yoki ijara yo'q.
                </p>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setLinkEditDoctor(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  const existing = getDoctorLink(linkEditDoctor.id);
                  const now = new Date().toISOString();
                  onSaveDoctorClinicLink?.({
                    id: `${linkEditDoctor.id}_${currentClinicId}`,
                    doctorId: linkEditDoctor.id,
                    clinicId: currentClinicId,
                    relationshipType: linkEditType,
                    doctorRevenueSharePercent: linkEditType === 'revenue_share' ? Number(linkEditPercent) || 0 : undefined,
                    monthlyRentFee: linkEditType === 'rental' ? Number(linkEditRent) || 0 : undefined,
                    rentPaymentStatus: existing?.rentPaymentStatus || 'unpaid',
                    status: 'active',
                    createdAt: existing?.createdAt || now,
                    updatedAt: now,
                  });
                  setLinkEditDoctor(null);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DOCTOR CONFIRMATION MODAL */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-3xl">👨‍⚕️</span>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {t("Shifokorni o'chirish")}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {(() => {
                const nm = doctorToDelete.name;
                const confirmTpl: Record<string, string> = {
                  uz: `"${nm}" shifokorini o'chirishni tasdiqlaysizmi?`,
                  ru: `Вы действительно хотите удалить врача "${nm}"?`,
                  en: `Are you sure you want to delete doctor "${nm}"?`,
                  kk: `"${nm}" дәрігерін жоюды растайсыз ба?`,
                  ky: `"${nm}" дарыгерин өчүрүүнү ырастайсызбы?`,
                  tg: `Оё нест кардани духтур "${nm}"-ро тасдиқ мекунед?`,
                  tk: `"${nm}" lukmanyny pozmagy tassyklaýarsyňyzmy?`
                };
                return confirmTpl[language] || confirmTpl.en;
              })()}
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => setDoctorToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                {t("Bekor qilish")}
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
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-3xl">⚙️</span>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {t("Xizmatni o'chirish")}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {(() => {
                const nm = serviceToDelete.name;
                const confirmTpl: Record<string, string> = {
                  uz: `Haqiqatdan ham "${nm}" xizmatini o'chirmoqchimisiz?`,
                  ru: `Вы действительно хотите удалить услугу "${nm}"?`,
                  en: `Are you sure you want to delete "${nm}"?`,
                  kk: `Шынымен "${nm}" қызметін жойғыңыз келе ме?`,
                  ky: `Чын эле "${nm}" кызматын өчүрүүнү каалайсызбы?`,
                  tg: `Оё дар ҳақиқат мехоҳед хизмати "${nm}"-ро нест кунед?`,
                  tk: `Hakykatdan-da "${nm}" hyzmatyny pozmak isleýärsiňizmi?`
                };
                return confirmTpl[language] || confirmTpl.en;
              })()}
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                {t("Bekor qilish")}
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
