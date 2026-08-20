import React, { useState, useMemo, useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import PatientProfile from "./PatientProfile";
import DentalChart from "./DentalChart";
import TreatmentPlan, { TreatmentItem } from "./TreatmentPlan";
import XRayCenter, { XRay } from "./XRayCenter";
import TreatmentHistory from "./TreatmentHistory";
import PhotoGallery from "./PhotoGallery";
import Statistics from "./Statistics";
import Prescriptions from "./Prescriptions";
import SettingsView from "./Settings";
import { LanguageSwitcher } from "./LanguageSwitcher";
import InstallAppBanner from "./InstallAppBanner";
import ProcedureCatalog from "./ProcedureCatalog";
import { Clinic, Doctor, Service, QueueItem, Patient, DoctorClinicLink, Reminder } from "../types";
import { decodeLegacyEntities } from "../utils/textFormat";
import { TRANSLATIONS, Language, translateMedicalText } from "../translations";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Play,
  TrendingUp,
  Users,
  Star,
  Award,
  DollarSign,
  Clock,
  ShieldAlert,
  Lock,
  Building,
  ArrowLeft,
  User,
  Settings,
  CircleDot,
  UserCheck2,
  CalendarCheck2,
  Sparkles,
  Brain,
  Info,
  Search,
  ChevronDown,
  FolderOpen,
  Home,
  List,
  Activity,
  FileText,
  Image as ImageIcon,
  History,
  Bell,
  BarChart2,
  PenTool,
  LogOut,
  Menu,
  Send,
  Wallet,
  CheckCircle2,
  CheckCircle,
  Trash2,
  MoreVertical,
  MessageSquare,
  Plus,
  Tag,
  UserCheck,
  Calendar,
  CreditCard,
  Eye,
  Edit2,
  FileDown,
  UserPlus,
  MoreHorizontal,
  AlertCircle,
  CalendarClock,
  Package,
  ClipboardCheck,
} from "lucide-react";
import MaterialsInventory from "./MaterialsInventory";

interface DoctorDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  patients: Patient[];
  doctorClinicLinks?: DoctorClinicLink[];
  activeDoctorClinicId?: string | null;
  setActiveDoctorClinicId?: (clinicId: string) => void;
  onUpdateQueueStatus: (
    id: string,
    newStatus: QueueItem["status"],
    serviceId?: string,
    medicalNotes?: string,
    appointmentDate?: string,
    appointmentTime?: string,
    opts?: { silent?: boolean }
  ) => void;
  selectedClinic: Clinic | null;
  setActiveTab?: (
    tab: "bemor" | "shifokor" | "boshliq" | "kod" | "superadmin",
  ) => void;
  currentUser?: {
    type: "superadmin" | "director" | "doctor";
    id?: string;
    clinicId?: string;
    name?: string;
  } | null;
  language: Language;
  setLanguage?: (l: Language) => void;
  onRequestPremiumUpgrade?: (clinicId: string) => void;
  staffToken?: string | null;
  onAddQueue?: (q: QueueItem) => void;
  onDeleteQueue?: (id: string) => void;
  onPatientUpserted?: (p: Patient) => void;
  onLogout?: () => void;
  onUpdateDoctorDetails?: (doctorId: string, updates: Partial<Doctor>) => Promise<boolean>;
}

// How far past its slot time an appointment may still be auto-called. Past this
// it's treated as a no-show the doctor should handle deliberately, rather than
// the system telling someone who already went home to come in.
const AUTO_QUEUE_GRACE_MINUTES = 120;

type DoctorDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
// Sidebar ids are not display text — the page heading used to print the raw id,
// which meant it never translated. Map each id to the same label the sidebar shows.
const VIEW_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  navbatlar: "Navbatlar",
  rejalashtirilgan: "Rejalashtirilgan",
  bemorlar: "Bemorlar",
  eslatmalar: "Eslatmalar",
  muolajalar: "Muolajalar",
  materiallar: "Material va Anjomlar",
  statistika: "Statistika",
  sozlamalar: "Sozlamalar",
};

const DOCTOR_TRANSLATIONS: Record<string, DoctorDictEntry> = {
  "bemor qo'shildi": { ru: "Пациент добавлен", en: "Patient added", kk: "Пациент қосылды", ky: "Бейтап кошулду", tg: "Бемор илова шуд", tk: "Näsag goşuldy" },
  "bemor topilmadi. yangi bemor uchun \"yangi bemor qo'shish\" tugmasidan foydalaning.": { ru: "Пациент не найден. Для нового пациента используйте кнопку «Добавить пациента».", en: "Patient not found. Use the \"Add patient\" button for a new patient.", kk: "Пациент табылмады. Жаңа пациент үшін «Пациент қосу» түймесін пайдаланыңыз.", ky: "Бейтап табылган жок. Жаңы бейтап үчүн \"Бемор кошуу\" баскычын колдонуңуз.", tg: "Бемор ёфт нашуд. Барои бемори нав тугмаи «Иловаи бемор»-ро истифода баред.", tk: "Näsag tapylmady. Täze näsag üçin \"Näsag goşmak\" düwmesini ulanyň." },
  "boshqa bemorni tanlash": { ru: "Выбрать другого пациента", en: "Choose a different patient", kk: "Басқа пациентті таңдау", ky: "Башка бейтапты тандоо", tg: "Интихоби бемори дигар", tk: "Başga näsagy saýlamak" },
  "login sifatida bemorning to'liq ismi, parol esa tizim tomonidan avtomatik yaratiladi — saqlagach ko'rsatiladi.": {
    ru: "Логином будет полное имя пациента, а пароль система создаст автоматически — он появится после сохранения.",
    en: "The patient's full name will be the login, and the system generates the password automatically — shown after saving.",
    kk: "Логин ретінде пациенттің толық аты-жөні, ал құпия сөзді жүйе автоматты түрде жасайды — сақтағаннан кейін көрсетіледі.",
    ky: "Логин катары бейтаптын толук аты-жөнү, ал сыр сөздү система автоматтык түрдө түзөт — сактагандан кийин көрсөтүлөт.",
    tg: "Ҳамчун логин номи пурраи бемор истифода мешавад, парол бошад аз ҷониби низом ба таври худкор эҷод мешавад — пас аз захира нишон дода мешавад.",
    tk: "Login hökmünde näsagyň doly ady ulanylar, paroly bolsa ulgam awtomatik döreder — ýatda saklanandan soň görkeziler."
  },
  "qo'shimcha ma'lumot (ixtiyoriy)": { ru: "Дополнительная информация (необязательно)", en: "Additional information (optional)", kk: "Қосымша ақпарат (міндетті емес)", ky: "Кошумча маалымат (милдеттүү эмес)", tg: "Маълумоти иловагӣ (ихтиёрӣ)", tk: "Goşmaça maglumat (hökman däl)" },
  "bemor o'z kabinetiga kirishi uchun quyidagi login va parolni unga bering": { ru: "Дайте пациенту следующий логин и пароль для входа в его кабинет", en: "Give the patient the following login and password to access their cabinet", kk: "Пациентке кабинетіне кіру үшін мына логин мен парольді беріңіз", ky: "Бейтапка кабинетине кирүү үчүн мына логин жана паролду бериңиз", tg: "Ба бемор логин ва рамзи зерин барои воридшавӣ ба кабинети худ диҳед", tk: "Näsaga öz kabinetine girmek üçin şu login we paroly beriň" },
  "login": { ru: "Логин", en: "Login", kk: "Логин", ky: "Логин", tg: "Логин", tk: "Login" },
  "tushunarli": { ru: "Понятно", en: "Got it", kk: "Түсінікті", ky: "Түшүнүктүү", tg: "Фаҳмо", tk: "Düşnükli" },
  "bu navbatni o'chirmoqchimisiz?": { ru: "Удалить эту запись?", en: "Delete this appointment?", kk: "Осы жазбаны жоясыз ба?", ky: "Бул жазууну өчүрөсүзбү?", tg: "Ин навбатро нест мекунед?", tk: "Bu ýazgyny pozmakçymy?" },
  "bu yakunlangan tashrif o'chiriladi va kunlik hisobot/daromaddan ham chiqarib tashlanadi. davom etilsinmi?": { ru: "Этот завершённый визит будет удалён и исключён из дневного отчёта/дохода. Продолжить?", en: "This completed visit will be deleted and removed from the daily report/revenue too. Continue?", kk: "Бұл аяқталған тәшриф жойылады және күнделікті есеп/табыстан да алынып тасталады. Жалғастырасыз ба?", ky: "Бул аяктаган ташриф өчүрүлөт жана күндөлүк отчет/кирешеден да алынып салынат. Улантылсынбы?", tg: "Ин ташрифи анҷомёфта нест карда мешавад ва аз ҳисобот/даромади рӯзона низ хориҷ мешавад. Идома дода шавад?", tk: "Bu tamamlanan ideg pozular we gündelik hasabat/girdejiden hem aýrylar. Dowam etdirilsinmi?" },

  "rejalashtirilgan": { ru: "Запланировано", en: "Scheduled", kk: "Жоспарланған", ky: "Пландаштырылган", tg: "Ба нақша гирифташуда", tk: "Meýilleşdirilen" },
  "o'chirish": { ru: "Удалить", en: "Delete", kk: "Жою", ky: "Өчүрүү", tg: "Нест кардан", tk: "Pozmak" },

  "stomatolog-ortoped": { ru: "Стоматолог-ортопед", en: "Prosthodontist", kk: "Стоматолог-ортопед", ky: "Стоматолог-ортопед", tg: "Дандонпизишки ортопед", tk: "Stomatolog-ortoped" },
  "kabinetga kirish uchun": { ru: "для входа в кабинет", en: "to sign in to the cabinet", kk: "кабинетке кіру үшін", ky: "кабинетке кирүү үчүн", tg: "барои воридшавӣ ба кабинет", tk: "kabinete girmek üçin" },
  "masalan: penitsillin guruhiga": { ru: "Например: на группу пенициллина", en: "For example: to the penicillin group", kk: "Мысалы: пенициллин тобына", ky: "Мисалы: пенициллин тобуна", tg: "Масалан: ба гурӯҳи пенитсиллин", tk: "Meselem: penisillin toparyna" },
  "yurak, qon bosimi, qandli diabet va h.k.": { ru: "Сердце, давление, сахарный диабет и т.д.", en: "Heart, blood pressure, diabetes, etc.", kk: "Жүрек, қан қысымы, қант диабеті және т.б.", ky: "Жүрөк, кан басымы, кант диабети ж.б.", tg: "Дил, фишори хун, диабети қанд ва ғ.", tk: "Ýürek, gan basyşy, süýji diabet we ş.m." },
  "tanlang (noma'lum)": { ru: "Выберите (неизвестно)", en: "Select (unknown)", kk: "Таңдаңыз (белгісіз)", ky: "Тандаңыз (белгисиз)", tg: "Интихоб кунед (номаълум)", tk: "Saýlaň (näbelli)" },
  sozlamalar: { ru: "Настройки", en: "Settings", kk: "Баптаулар", ky: "Жөндөөлөр", tg: "Танзимот", tk: "Sazlamalar" },
  chiqish: { ru: "Выход", en: "Log Out", kk: "Шығу", ky: "Чыгуу", tg: "Баромадан", tk: "Çykmak" },
  dashboard: { ru: "Панель управления", en: "Dashboard", kk: "Басқару тақтасы", ky: "Башкаруу панели", tg: "Тахтаи идоракунӣ", tk: "Dolandyryş paneli" },
  navbatlar: { ru: "Очереди", en: "Queues", kk: "Кезектер", ky: "Кезектер", tg: "Навбатҳо", tk: "Nobatlar" },
  bemorlar: { ru: "Пациенты", en: "Patients", kk: "Пациенттер", ky: "Бейтаптар", tg: "Беморон", tk: "Näsaglar" },
  "material va anjomlar": { ru: "Материалы и оборудование", en: "Materials & Equipment", kk: "Материалдар мен жабдықтар", ky: "Материалдар жана жабдыктар", tg: "Маводу таҷҳизот", tk: "Serişdeler we enjamlar" },
  statistika: { ru: "Статистика", en: "Statistics", kk: "Статистика", ky: "Статистика", tg: "Омор", tk: "Statistika" },
  onlayn: { ru: "Онлайн", en: "Online", kk: "Онлайн", ky: "Онлайн", tg: "Онлайн", tk: "Onlaýn" },
  vaqt: { ru: "Время", en: "Time", kk: "Уақыт", ky: "Убакыт", tg: "Вақт", tk: "Wagt" },
  bemor: { ru: "Пациент", en: "Patient", kk: "Пациент", ky: "Бейтап", tg: "Бемор", tk: "Näsag" },
  allergiya: { ru: "Аллергия", en: "Allergy", kk: "Аллергия", ky: "Аллергия", tg: "Аллергия", tk: "Allergiýa" },
  kasalliklar: { ru: "Заболевания", en: "Diseases", kk: "Аурулар", ky: "Оорулар", tg: "Бемориҳо", tk: "Keseller" },
  shikoyat: { ru: "Жалоба", en: "Complaint", kk: "Шағым", ky: "Арыз", tg: "Шикоят", tk: "Şikaýat" },
  tish: { ru: "Зуб", en: "Tooth", kk: "Тіс", ky: "Тиш", tg: "Дандон", tk: "Diş" },
  muolaja: { ru: "Процедура", en: "Treatment", kk: "Емдеу", ky: "Дарылоо", tg: "Муолиҷа", tk: "Bejergi" },
  "bekor qilindi": { ru: "Отменено", en: "Cancelled", kk: "Бас тартылды", ky: "Жокко чыгарылды", tg: "Бекор карда шуд", tk: "Ýatyryldy" },
  jarayonda: { ru: "В процессе", en: "In progress", kk: "Барысында", ky: "Жүрүшүндө", tg: "Дар ҷараён", tk: "Dowamynda" },
  kutmoqda: { ru: "Ожидает", en: "Waiting", kk: "Күтуде", ky: "Күтүүдө", tg: "Интизор аст", tk: "Garaşylýar" },
  "sana bo'yicha": { ru: "По дате", en: "By date", kk: "Күні бойынша", ky: "Күнү боюнча", tg: "Аз рӯи сана", tk: "Sene boýunça" },
  barchasi: { ru: "Все", en: "All", kk: "Барлығы", ky: "Баары", tg: "Ҳама", tk: "Ählisi" },
  "eslatma yaratildi": { ru: "Напоминание создано", en: "Reminder created", kk: "Ескерту жасалды", ky: "Эскертүү түзүлдү", tg: "Ёдоварӣ сохта шуд", tk: "Duýduryş döredildi" },
  "holati bo'yicha": { ru: "По статусу", en: "By status", kk: "Мәртебесі бойынша", ky: "Абалы боюнча", tg: "Аз рӯи ҳолат", tk: "Ýagdaýy boýunça" },
  belgilangan: { ru: "Запланировано", en: "Scheduled", kk: "Белгіленген", ky: "Белгиленген", tg: "Таъиншуда", tk: "Bellenen" },
  qabulda: { ru: "На приеме", en: "In consultation", kk: "Қабылдауда", ky: "Кабылдоодо", tg: "Дар қабул", tk: "Kabulda" },
  yakunlangan: { ru: "Завершено", en: "Completed", kk: "Аяқталды", ky: "Аяктады", tg: "Анҷомёфта", tk: "Tamamlanan" },
  holati: { ru: "Статус", en: "Status", kk: "Мәртебесі", ky: "Абалы", tg: "Ҳолат", tk: "Ýagdaýy" },
  faol: { ru: "Активен", en: "Active", kk: "Белсенді", ky: "Активдүү", tg: "Фаъол", tk: "Işjeň" },
  qarzdor: { ru: "Должник", en: "Debtor", kk: "Қарызданушы", ky: "Карызкор", tg: "Қарздор", tk: "Bergili" },
  arxiv: { ru: "Архив", en: "Archive", kk: "Мұрағат", ky: "Архив", tg: "Бойгонӣ", tk: "Arhiw" },
  qarzdorlar: { ru: "Должники", en: "Debtors", kk: "Қарыздарлар", ky: "Карызкорлор", tg: "Қарздорон", tk: "Bergililer" },
  "qarzi yo'qlar": { ru: "Без долгов", en: "No debt", kk: "Қарызы жоқтар", ky: "Карызы жоктор", tg: "Бидуни қарз", tk: "Bergisi ýoklar" },
  "iltimos, dental chart ko'rish uchun bemorni tanlang": { ru: "Пожалуйста, выберите пациента для просмотра дентальной карты", en: "Please select a patient to view the dental chart", kk: "Өтінеміз, дентал картаны көру үшін пациентті таңдаңыз", ky: "Сураныч, дентал картаны көрүү үчүн бейтапты тандаңыз", tg: "Лутфан, барои дидани харитаи дандон беморро интихоб кунед", tk: "Haýyş, dental kartany görmek üçin näsagy saýlaň" },
  "bemorlar ro'yxatiga o'tish": { ru: "Перейти к списку пациентов", en: "Go to patients list", kk: "Пациенттер тізіміне өту", ky: "Бейтаптар тизмесине өтүү", tg: "Гузаштан ба рӯйхати беморон", tk: "Näsaglar sanawyna geçmek" },
  "iltimos, davolash rejasini ko'rish uchun bemorni tanlang": { ru: "Пожалуйста, выберите пациента для просмотра плана лечения", en: "Please select a patient to view the treatment plan", kk: "Өтінеміз, емдеу жоспарын көру үшін пациентті таңдаңыз", ky: "Сураныч, дарылоо планын көрүү үчүн бейтапты тандаңыз", tg: "Лутфан, барои дидани нақшаи муолиҷа беморро интихоб кунед", tk: "Haýyş, bejergi meýilnamasyny görmek üçin näsagy saýlaň" },
  "iltimos, rentgenlarni ko'rish uchun bemorni tanlang": { ru: "Пожалуйста, выберите пациента для просмотра рентгенов", en: "Please select a patient to view X-rays", kk: "Өтінеміз, рентгендерді көру үшін пациентті таңдаңыз", ky: "Сураныч, рентгендерди көрүү үчүн бейтапты тандаңыз", tg: "Лутфан, барои дидани рентгенҳо беморро интихоб кунед", tk: "Haýyş, rentgenleri görmek üçin näsagy saýlaň" },
  "iltimos, muolaja tarixini ko'rish uchun bemorni tanlang": { ru: "Пожалуйста, выберите пациента для просмотра истории лечения", en: "Please select a patient to view treatment history", kk: "Өтінеміз, емдеу тарихын көру үшін пациентті таңдаңыз", ky: "Сураныч, дарылоо тарыхын көрүү үчүн бейтапты тандаңыз", tg: "Лутфан, барои дидани таърихи муолиҷа беморро интихоб кунед", tk: "Haýyş, bejergi taryhyny görmek üçin näsagy saýlaň" },
  "iltimos, foto galereyani ko'rish uchun bemorni tanlang": { ru: "Пожалуйста, выберите пациента для просмотра фотогалереи", en: "Please select a patient to view the photo gallery", kk: "Өтінеміз, фотогалереяны көру үшін пациентті таңдаңыз", ky: "Сураныч, фотогалереяны көрүү үчүн бейтапты тандаңыз", tg: "Лутфан, барои дидани галереяи расмҳо беморро интихоб кунед", tk: "Haýyş, surat galereýasyny görmek üçin näsagy saýlaň" },
  "iltimos, retseptlarni ko'rish uchun bemorni tanlang": { ru: "Пожалуйста, выберите пациента для просмотра рецептов", en: "Please select a patient to view prescriptions", kk: "Өтінеміз, рецепттерді көру үшін пациентті таңдаңыз", ky: "Сураныч, рецепттерди көрүү үчүн бейтапты тандаңыз", tg: "Лутфан, барои дидани рецептҳо беморро интихоб кунед", tk: "Haýyş, resepti görmek üçin näsagy saýlaň" },
  "qabul kuni": { ru: "День приема", en: "Appointment day", kk: "Қабылдау күні", ky: "Кабылдоо күнү", tg: "Рӯзи қабул", tk: "Kabul güni" },
  "qabul vaqti": { ru: "Время приема", en: "Appointment time", kk: "Қабылдау уақыты", ky: "Кабылдоо убактысы", tg: "Вақти қабул", tk: "Kabul wagty" },
  "qon guruhi": { ru: "Группа крови", en: "Blood group", kk: "Қан тобы", ky: "Кан тобу", tg: "Гурӯҳи хун", tk: "Gan topary" },
  infeksiya: { ru: "Инфекция", en: "Infection", kk: "Инфекция", ky: "Инфекция", tg: "Сироят", tk: "Ýokanç" },
  "surunkali kasalliklar": { ru: "Хронические заболевания", en: "Chronic diseases", kk: "Созылмалы аурулар", ky: "Уланма ооруулар", tg: "Бемориҳои музмин", tk: "Dowamly keseller" },
  parol: { ru: "Пароль", en: "Password", kk: "Құпия сөз", ky: "Сыр сөз", tg: "Парол", tk: "Parol" },
  allergiyalar: { ru: "Аллергии", en: "Allergies", kk: "Аллергиялар", ky: "Аллергиялар", tg: "Аллергияҳо", tk: "Allergiýalar" },
  "jiddiy yuqumli kasallik mavjud": { ru: "Есть серьёзное инфекционное заболевание", en: "Has a serious infectious disease", kk: "Ауыр жұқпалы ауру бар", ky: "Оор жугуштуу оору бар", tg: "Бемории вазнини сироятӣ дорад", tk: "Agyr ýokanç keseli bar" },
  "hozircha rejalashtirilgan qabullar yo'q": { ru: "Пока нет запланированных приёмов", en: "No scheduled appointments yet", kk: "Әзірге жоспарланған қабылдаулар жоқ", ky: "Азырынча пландаштырылган кабылдоолор жок", tg: "Ҳанӯз қабулҳои банақшагирифташуда нест", tk: "Heniz meýilleşdirilen kabullar ýok" },
  "oldingi hafta": { ru: "Предыдущая неделя", en: "Previous week", kk: "Алдыңғы апта", ky: "Мурунку жума", tg: "Ҳафтаи гузашта", tk: "Öňki hepde" },
  "keyingi hafta": { ru: "Следующая неделя", en: "Next week", kk: "Келесі апта", ky: "Кийинки жума", tg: "Ҳафтаи оянда", tk: "Indiki hepde" },
  "bu hafta": { ru: "Эта неделя", en: "This week", kk: "Осы апта", ky: "Ушул жума", tg: "Ҳамин ҳафта", tk: "Şu hepde" },
  yakshanba: { ru: "Воскресенье", en: "Sunday", kk: "Жексенбі", ky: "Жекшемби", tg: "Якшанбе", tk: "Ýekşenbe" },
  dushanba: { ru: "Понедельник", en: "Monday", kk: "Дүйсенбі", ky: "Дүйшөмбү", tg: "Душанбе", tk: "Duşenbe" },
  seshanba: { ru: "Вторник", en: "Tuesday", kk: "Сейсенбі", ky: "Шейшемби", tg: "Сешанбе", tk: "Sişenbe" },
  chorshanba: { ru: "Среда", en: "Wednesday", kk: "Сәрсенбі", ky: "Шаршемби", tg: "Чоршанбе", tk: "Çarşenbe" },
  payshanba: { ru: "Четверг", en: "Thursday", kk: "Бейсенбі", ky: "Бейшемби", tg: "Панҷшанбе", tk: "Penşenbe" },
  juma: { ru: "Пятница", en: "Friday", kk: "Жұма", ky: "Жума", tg: "Ҷумъа", tk: "Anna" },
  shanba: { ru: "Суббота", en: "Saturday", kk: "Сенбі", ky: "Ишемби", tg: "Шанбе", tk: "Şenbe" },
  "yangi bandlash": { ru: "Новая запись", en: "New booking", kk: "Жаңа жазылу", ky: "Жаңы жазылуу", tg: "Сабти нав", tk: "Täze bellik" },
  "bemorni qidirish": { ru: "Поиск пациента", en: "Search patient", kk: "Пациентті іздеу", ky: "Бейтапты издөө", tg: "Ҷустуҷӯи бемор", tk: "Näsagy gözlemek" },
  "ism yoki telefon bo'yicha qidiring...": { ru: "Искать по имени или телефону...", en: "Search by name or phone...", kk: "Аты немесе телефоны бойынша іздеу...", ky: "Аты же телефону боюнча издөө...", tg: "Ҷустуҷӯ бо ном ё телефон...", tk: "Ady ýa-da telefony boýunça gözlemek..." },
  "muolajani qidiring...": { ru: "Искать процедуру...", en: "Search treatments...", kk: "Емдеу процедурасын іздеу...", ky: "Дарылоо процедурасын издөө...", tg: "Ҷустуҷӯи муолиҷа...", tk: "Bejergini gözlemek..." },
  "muolaja topilmadi": { ru: "Процедура не найдена", en: "No treatment found", kk: "Процедура табылмады", ky: "Процедура табылган жок", tg: "Муолиҷа ёфт нашуд", tk: "Bejergi tapylmady" },
  "boshqa muolaja tanlash": { ru: "Выбрать другую процедуру", en: "Choose a different treatment", kk: "Басқа процедураны таңдау", ky: "Башка процедураны тандоо", tg: "Муолиҷаи дигар интихоб кардан", tk: "Başga bejergini saýlamak" },
  "bemorni bandlash": { ru: "Записать пациента", en: "Book patient", kk: "Пациентті жазу", ky: "Бейтапты жазуу", tg: "Сабти бемор", tk: "Näsagy bellemek" },
  "kelgusi sana va vaqtga yozish": { ru: "Записать на будущую дату и время", en: "Book for a future date and time", kk: "Болашақ күн мен уақытқа жазу", ky: "Келечектеги күн жана убакытка жазуу", tg: "Ба санаи оянда сабт кардан", tk: "Geljekki sene we wagta ýazmak" },
  "jadval sozlamalari": { ru: "Настройки расписания", en: "Schedule settings", kk: "Кесте баптаулары", ky: "Кесте жөндөөлөрү", tg: "Танзимоти ҷадвал", tk: "Tertip sazlamalary" },
  bandlash: { ru: "Записать", en: "Book", kk: "Жазу", ky: "Жазуу", tg: "Сабт кардан", tk: "Bellemek" },
  tushlik: { ru: "Обед", en: "Lunch", kk: "Түскі ас", ky: "Түшкү тамак", tg: "Хӯроки нисфирӯзӣ", tk: "Günortanlyk" },
  "ish boshlanishi": { ru: "Начало работы", en: "Work start", kk: "Жұмыс басталуы", ky: "Иш башталышы", tg: "Оғози кор", tk: "Iş başlangyjy" },
  "ish tugashi": { ru: "Конец работы", en: "Work end", kk: "Жұмыс аяқталуы", ky: "Иш аякталышы", tg: "Поёни кор", tk: "Iş tamamlanyşy" },
  "vaqt oralig'i": { ru: "Интервал времени", en: "Time interval", kk: "Уақыт аралығы", ky: "Убакыт аралыгы", tg: "Фосилаи вақт", tk: "Wagt aralygy" },
  "tushlik vaqtini belgilash": { ru: "Указать время обеда", en: "Set lunch time", kk: "Түскі ас уақытын белгілеу", ky: "Түшкү тамак убактысын белгилөө", tg: "Вақти хӯроки нисфирӯзиро таъин кардан", tk: "Günortanlyk wagtyny bellemek" },
  "tushlik boshlanishi": { ru: "Начало обеда", en: "Lunch start", kk: "Түскі ас басталуы", ky: "Түшкү тамак башталышы", tg: "Оғози хӯрок", tk: "Günortanlyk başlangyjy" },
  "tushlik tugashi": { ru: "Конец обеда", en: "Lunch end", kk: "Түскі ас аяқталуы", ky: "Түшкү тамак аякталышы", tg: "Поёни хӯрок", tk: "Günortanlyk tamamlanyşy" },
  "avtomatik navbat": { ru: "Автоматическая очередь", en: "Automatic queue", kk: "Автоматты кезек", ky: "Автоматтык кезек", tg: "Навбати худкор", tk: "Awtomatik nobat" },
  "belgilangan vaqt kelganda navbatdagi bemor avtomatik chaqiriladi": { ru: "Когда наступает назначенное время, следующий пациент вызывается автоматически", en: "When the scheduled time arrives, the next patient is called automatically", kk: "Белгіленген уақыт келгенде, кезектегі пациент автоматты түрде шақырылады", ky: "Белгиленген убакыт келгенде, кезектеги бейтап автоматтык түрдө чакырылат", tg: "Ҳангоми расидани вақти таъиншуда, бемори навбатӣ худкор даъват мешавад", tk: "Bellenen wagt gelende, nobatdaky näsag awtomatik çagyrylýar" },
  Muolajalar: { ru: "Процедуры", en: "Procedures", kk: "Емшаралар", ky: "Процедуралар", tg: "Муолиҷаҳо", tk: "Bejergiler" },
  "biriktirilmagan bemorlar": { ru: "Непривязанные пациенты", en: "Unassigned patients", kk: "Тіркелмеген пациенттер", ky: "Бекитилбеген бейтаптар", tg: "Беморони новобаста", tk: "Berkidilmedik näsaglar" },
  "o'zimga biriktirish": { ru: "Привязать к себе", en: "Assign to me", kk: "Өзіме тіркеу", ky: "Өзүмө бекитүү", tg: "Ба худам вобаста кардан", tk: "Özüme berkitmek" },
  "bu bemorlar hali hech bir shifokorga biriktirilmagan": { ru: "Эти пациенты еще не привязаны ни к одному врачу", en: "These patients are not yet assigned to any doctor", kk: "Бұл пациенттер әлі ешбір дәрігерге тіркелмеген", ky: "Бул бейтаптар али эч бир дарыгерге бекитилген эмес", tg: "Ин беморон ҳанӯз ба ҳеҷ табибе вобаста нашудаанд", tk: "Bu näsaglar heniz hiç bir lukmana berkidilmedik" },
  "shu bilan birga qabulga ham yozish": { ru: "Одновременно записать на приём", en: "Also book an appointment", kk: "Сонымен қатар қабылдауға да жазу", ky: "Ошону менен кабылдоого да жазуу", tg: "Ҳамзамон ба қабул низ сабт кардан", tk: "Şol bilen bile kabula-da ýazmak" },
  "tashriflar tarixi": { ru: "История посещений", en: "Visit history", kk: "Келу тарихы", ky: "Келүү тарыхы", tg: "Таърихи ташрифҳо", tk: "Gelen-gidenler taryhy" },
  "hali tashrif qayd etilmagan.": { ru: "Визиты еще не зарегистрированы.", en: "No visits recorded yet.", kk: "Әзірге келу тіркелмеген.", ky: "Азырынча келүү катталган эмес.", tg: "Ҳанӯз ягон ташриф сабт нашудааст.", tk: "Heniz gelen-gideniň ýazgysy ýok." },
  "yangi bemor qo'shish": { ru: "Добавить нового пациента", en: "Add new patient", kk: "Жаңа пациент қосу", ky: "Жаңы бейтап кошуу", tg: "Илова кардани бемори нав", tk: "Täze näsag goşmak" },
  "pasport seriyasi": { ru: "Серия паспорта", en: "Passport series", kk: "Төлқұжат сериясы", ky: "Паспорт сериясы", tg: "Силсилаи шиноснома", tk: "Pasport seriýasy" },
  "bemor qidirish...": { ru: "Поиск пациента...", en: "Search patient...", kk: "Пациент іздеу...", ky: "Бейтап издөө...", tg: "Ҷустуҷӯи бемор...", tk: "Näsag gözlemek..." },
  "bemor ismi, tel yoki navbat raqami...": { ru: "Имя пациента, телефон или номер очереди...", en: "Patient name, phone, or queue number...", kk: "Пациент аты, телефоны немесе кезек нөмірі...", ky: "Бейтап аты, телефону же кезек номери...", tg: "Номи бемор, телефон ё рақами навбат...", tk: "Näsagyň ady, telefon ýa-da nobat belgisi..." },
  "ism, telefon yoki id bo'yicha qidirish...": { ru: "Поиск по имени, телефону или ID...", en: "Search by name, phone, or ID...", kk: "Аты, телефоны немесе ID бойынша іздеу...", ky: "Аты, телефону же ID боюнча издөө...", tg: "Ҷустуҷӯ бо ном, телефон ё ID...", tk: "Ady, telefony ýa-da ID boýunça gözlemek..." },
  "telefon raqami yoki pasport seriyasi...": { ru: "Номер телефона или серия паспорта...", en: "Phone number or passport series...", kk: "Телефон нөмірі немесе төлқұжат сериясы...", ky: "Телефон номери же паспорт сериясы...", tg: "Рақами телефон ё силсилаи шиноснома...", tk: "Telefon belgisi ýa-da pasport seriýasy..." },
  "ism familiya": { ru: "Имя Фамилия", en: "Full Name", kk: "Аты-жөні", ky: "Аты-жөнү", tg: "Ному насаб", tk: "Ady familiýasy" },
  "faol klinikani tanlang": { ru: "Выберите активную клинику", en: "Select active clinic", kk: "Белсенді клиниканы таңдаңыз", ky: "Активдүү клиниканы тандаңыз", tg: "Клиникаи фаъолро интихоб кунед", tk: "Işjeň klinikany saýlaň" },
  "muolaja va vaqt belgilash": { ru: "Указать процедуру и время", en: "Set treatment and time", kk: "Емдеу мен уақытты белгілеу", ky: "Дарылоо жана убакытты белгилөө", tg: "Таъини муолиҷа ва вақт", tk: "Bejergini we wagty bellemek" },
  "qabulni boshlash": { ru: "Начать прием", en: "Start consultation", kk: "Қабылдауды бастау", ky: "Кабылдоону баштоо", tg: "Оғози қабул", tk: "Kabuly başlamak" },
  yakunlash: { ru: "Завершить", en: "Finish", kk: "Аяқтау", ky: "Аяктоо", tg: "Ба итмом расонидан", tk: "Tamamlamak" },
  "bugungi bemorlar": { ru: "Пациенты сегодня", en: "Today's patients", kk: "Бүгінгі пациенттер", ky: "Бүгүнкү бейтаптар", tg: "Беморони имрӯза", tk: "Şu günki näsaglar" },
  yangi: { ru: "новых", en: "new", kk: "жаңа", ky: "жаңы", tg: "нав", tk: "täze" },
  "hozir qabulda": { ru: "Сейчас на приеме", en: "Currently in consultation", kk: "Қазір қабылдауда", ky: "Азыр кабылдоодо", tg: "Ҳозир дар қабул", tk: "Häzir kabulda" },
  "qabul davom etmoqda": { ru: "Прием продолжается", en: "Consultation in progress", kk: "Қабылдау жалғасуда", ky: "Кабылдоо уланууда", tg: "Қабул идома дорад", tk: "Kabul dowam edýär" },
  "bugungi tushum": { ru: "Доход сегодня", en: "Today's revenue", kk: "Бүгінгі табыс", ky: "Бүгүнкү киреше", tg: "Даромади имрӯза", tk: "Şu günki girdeji" },
  kutilayotgan: { ru: "Ожидающие", en: "Pending", kk: "Күтілуде", ky: "Күтүлүүдө", tg: "Интизор", tk: "Garaşylýan" },
  navbatda: { ru: "в очереди", en: "in queue", kk: "кезекте", ky: "кезекте", tg: "дар навбат", tk: "nobatda" },
  "tugatilgan qabul": { ru: "Завершенный прием", en: "Completed consultation", kk: "Аяқталған қабылдау", ky: "Аяктаган кабылдоо", tg: "Қабули анҷомёфта", tk: "Tamamlanan kabul" },
  bugun: { ru: "сегодня", en: "today", kk: "бүгін", ky: "бүгүн", tg: "имрӯз", tk: "şu gün" },
  "o'rtacha qabul vaqti": { ru: "Среднее время приема", en: "Average consultation time", kk: "Орташа қабылдау уақыты", ky: "Орточо кабылдоо убактысы", tg: "Вақти миёнаи қабул", tk: "Ortaça kabul wagty" },
  daqiqa: { ru: "минут", en: "minutes", kk: "минут", ky: "мүнөт", tg: "дақиқа", tk: "minut" },
  "bugungi navbatlar": { ru: "Очереди сегодня", en: "Today's queues", kk: "Бүгінгі кезектер", ky: "Бүгүнкү кезектер", tg: "Навбатҳои имрӯза", tk: "Şu günki nobatlar" },
  "barcha navbatlar": { ru: "Все очереди", en: "All queues", kk: "Барлық кезектер", ky: "Бардык кезектер", tg: "Ҳамаи навбатҳо", tk: "Ähli nobatlar" },
  "hozircha navbatda bemorlar yo'q": { ru: "В очереди пока нет пациентов", en: "No patients in queue yet", kk: "Қазіргі уақытта кезекте пациенттер жоқ", ky: "Азыркы учурда кезекте бейтаптар жок", tg: "Дар навбат ҳанӯз бемор нест", tk: "Nobatda heniz näsag ýok" },
  "ko'rik": { ru: "Осмотр", en: "Checkup", kk: "Қарау", ky: "Кароо", tg: "Муоина", tk: "Gözden geçiriş" },
  "ushbu filtrga mos navbat topilmadi": { ru: "Очередь по этому фильтру не найдена", en: "No queue matches this filter", kk: "Осы сүзгіге сәйкес кезек табылмады", ky: "Бул фильтрге дал келген кезек табылган жок", tg: "Бо ин филтр навбат ёфт нашуд", tk: "Bu süzgüje laýyk nobat tapylmady" },
  tozalash: { ru: "Очистить", en: "Clear", kk: "Тазалау", ky: "Тазалоо", tg: "Тоза кардан", tk: "Arassalamak" },
  "doimiy tishlar": { ru: "Постоянные зубы", en: "Permanent teeth", kk: "Тұрақты тістер", ky: "Туруктуу тиштер", tg: "Дандонҳои доимӣ", tk: "Hemişelik dişler" },
  "sut tishlar": { ru: "Молочные зубы", en: "Baby teeth", kk: "Сүт тістер", ky: "Сүт тиштер", tg: "Дандонҳои ширӣ", tk: "Süýt dişleri" },
  "sog'lom": { ru: "Здоровый", en: "Healthy", kk: "Дені сау", ky: "Соо", tg: "Солим", tk: "Sagdyn" },
  karies: { ru: "Кариес", en: "Caries", kk: "Кариес", ky: "Кариес", tg: "Кариес", tk: "Kariýes" },
  pulpit: { ru: "Пульпит", en: "Pulpitis", kk: "Пульпит", ky: "Пульпит", tg: "Пульпит", tk: "Pulpit" },
  "kanal davolangan": { ru: "Канал вылечен", en: "Root canal treated", kk: "Канал емделген", ky: "Канал дарыланган", tg: "Каналаш муолиҷашуда", tk: "Kanal bejerilen" },
  plomba: { ru: "Пломба", en: "Filling", kk: "Пломба", ky: "Пломба", tg: "Пломба", tk: "Plomba" },
  koronka: { ru: "Коронка", en: "Crown", kk: "Коронка", ky: "Коронка", tg: "Тоҷ", tk: "Koronka" },
  implant: { ru: "Имплант", en: "Implant", kk: "Имплант", ky: "Имплант", tg: "Имплант", tk: "Implant" },
  "olib tashlangan": { ru: "Удален", en: "Removed", kk: "Алынып тасталған", ky: "Алынып салынган", tg: "Хориҷшуда", tk: "Aýrylan" },
  "bemor kartasi": { ru: "Карта пациента", en: "Patient card", kk: "Пациент картасы", ky: "Бейтап картасы", tg: "Харитаи бемор", tk: "Näsag kartasy" },
  "hozirda qabulda faol bemor yo'q": { ru: "Сейчас нет пациента на приеме", en: "No active patient in consultation now", kk: "Қазір қабылдауда белсенді пациент жоқ", ky: "Азыр кабылдоодо активдүү бейтап жок", tg: "Ҳозир беморе дар қабул нест", tk: "Häzir kabulda işjeň näsag ýok" },
  "davolash rejasi": { ru: "План лечения", en: "Treatment plan", kk: "Емдеу жоспары", ky: "Дарылоо планы", tg: "Нақшаи муолиҷа", tk: "Bejergi meýilnamasy" },
  "yangi reja": { ru: "Новый план", en: "New plan", kk: "Жаңа жоспар", ky: "Жаңы план", tg: "Нақшаи нав", tk: "Täze meýilnama" },
  "narx (so'm)": { ru: "Цена (сум)", en: "Price (UZS)", kk: "Баға (сом)", ky: "Баа (сом)", tg: "Нарх (сӯм)", tk: "Baha (sim)" },
  menda: { ru: "У меня", en: "Mine", kk: "Менде", ky: "Менде", tg: "Дар назди ман", tk: "Mende" },
  "shifokorlar bo'yicha": { ru: "По врачам", en: "By doctors", kk: "Дәрігерлер бойынша", ky: "Дарыгерлер боюнча", tg: "Аз рӯи духтурон", tk: "Lukmanlar boýunça" },
  "sana oralig'i:": { ru: "Диапазон дат:", en: "Date range:", kk: "Күн аралығы:", ky: "Күн диапазону:", tg: "Диапазони сана:", tk: "Sene aralygy:" },
  "eslatma turi:": { ru: "Тип напоминания:", en: "Reminder type:", kk: "Ескерту түрі:", ky: "Эскертүү түрү:", tg: "Навъи ёдоварӣ:", tk: "Duýduryş görnüşi:" },
  "eslatma qo'shish": { ru: "Добавить напоминание", en: "Add reminder", kk: "Ескерту қосу", ky: "Эскертүү кошуу", tg: "Илова кардани ёдоварӣ", tk: "Duýduryş goşmak" },
  "muddati o'tgan": { ru: "Просрочено", en: "Overdue", kk: "Мерзімі өтті", ky: "Мөөнөтү өттү", tg: "Мӯҳлат гузашт", tk: "Möhleti geçen" },
  "eslatma tafsilotlari": { ru: "Детали напоминания", en: "Reminder details", kk: "Ескерту мәліметтері", ky: "Эскертүү тафсилаттары", tg: "Тафсилоти ёдоварӣ", tk: "Duýduryş jikme-jikligi" },
  "eslatma turi": { ru: "Тип напоминания", en: "Reminder type", kk: "Ескерту түрі", ky: "Эскертүү түрү", tg: "Навъи ёдоварӣ", tk: "Duýduryş görnüşi" },
  "eslatma sanasi": { ru: "Дата напоминания", en: "Reminder date", kk: "Ескерту күні", ky: "Эскертүү күнү", tg: "Санаи ёдоварӣ", tk: "Duýduryş senesi" },
  vaqti: { ru: "Время", en: "Time", kk: "Уақыты", ky: "Убактысы", tg: "Вақташ", tk: "Wagty" },
  "eslatma matni": { ru: "Текст напоминания", en: "Reminder text", kk: "Ескерту мәтіні", ky: "Эскертүү тексти", tg: "Матни ёдоварӣ", tk: "Duýduryş teksti" },
  "eslatmalar": { ru: "Напоминания", en: "Reminders", kk: "Ескертулер", ky: "Эскертүүлөр", tg: "Ёдовариҳо", tk: "Duýduryşlar" },
  "masalan: implant nazorati uchun qabulga kelish": { ru: "например: явиться на контроль импланта", en: "e.g.: come in for an implant check-up", kk: "мысалы: имплант бақылауына келу", ky: "мисалы: имплант көзөмөлүнө келүү", tg: "масалан: барои назорати имплант омадан", tk: "meselem: implant barlagyna gelmek" },
  "yuborildi": { ru: "Отправлено", en: "Sent", kk: "Жіберілді", ky: "Жөнөтүлдү", tg: "Фиристода шуд", tk: "Iberildi" },
  "bajarildi": { ru: "Выполнено", en: "Done", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷро шуд", tk: "Ýerine ýetirildi" },
  "telegram orqali yuborish": { ru: "Отправить через Telegram", en: "Send via Telegram", kk: "Telegram арқылы жіберу", ky: "Telegram аркылуу жөнөтүү", tg: "Тавассути Telegram фиристодан", tk: "Telegram arkaly ibermek" },
  "hozircha eslatmalar yo'q": { ru: "Пока нет напоминаний", en: "No reminders yet", kk: "Әзірге ескертулер жоқ", ky: "Азырынча эскертүүлөр жок", tg: "Ҳоло ёдоварӣ нест", tk: "Häzirlikçe duýduryş ýok" },
  "eslatma tanlanmagan": { ru: "Напоминание не выбрано", en: "No reminder selected", kk: "Ескерту таңдалмаған", ky: "Эскертүү тандалган жок", tg: "Ёдоварӣ интихоб нашудааст", tk: "Duýduryş saýlanmady" },
  "noma'lum bemor": { ru: "Неизвестный пациент", en: "Unknown patient", kk: "Белгісіз пациент", ky: "Белгисиз бейтап", tg: "Бемори номаълум", tk: "Näbelli näsag" },
  "muddat (ixtiyoriy)": { ru: "Срок (необязательно)", en: "Due date (optional)", kk: "Мерзім (міндетті емес)", ky: "Мөөнөт (милдеттүү эмес)", tg: "Мӯҳлат (ихтиёрӣ)", tk: "Möhlet (hökmany däl)" },
  "yuklanmoqda...": { ru: "Загружается...", en: "Loading...", kk: "Жүктелуде...", ky: "Жүктөлүүдө...", tg: "Бор мешавад...", tk: "Ýüklenýär..." },
  "xatolik yuz berdi": { ru: "Произошла ошибка", en: "An error occurred", kk: "Қате орын алды", ky: "Ката кетти", tg: "Хатогӣ рӯй дод", tk: "Ýalňyşlyk ýüze çykdy" },
  "eslatmani o'chirishni tasdiqlaysizmi?": { ru: "Подтверждаете удаление напоминания?", en: "Confirm deleting this reminder?", kk: "Ескертуді өшіруді растайсыз ба?", ky: "Эскертүүнү өчүрүүнү ырастайсызбы?", tg: "Нест кардани ёдовариро тасдиқ мекунед?", tk: "Duýduryşy pozmagy tassyklaýarsyňyzmy?" },
  shifokor: { ru: "Врач", en: "Doctor", kk: "Дәрігер", ky: "Дарыгер", tg: "Духтур", tk: "Lukman" },
  "eslatma tarixi": { ru: "История напоминаний", en: "Reminder history", kk: "Ескертулер тарихы", ky: "Эскертүүлөр тарыхы", tg: "Таърихи ёдоварӣ", tk: "Duýduryş taryhy" },
  "bemorga telegram orqali eslatildi": { ru: "Пациенту напомнили через Telegram", en: "Patient reminded via Telegram", kk: "Пациентке Telegram арқылы еске салынды", ky: "Бейтапка Telegram аркылуу эскертилди", tg: "Ба бемор тавассути Telegram ёдоварӣ шуд", tk: "Näsaga Telegram arkaly duýduryldy" },
  tahrirlash: { ru: "Редактировать", en: "Edit", kk: "Өңдеу", ky: "Түзөтүү", tg: "Таҳрир", tk: "Üýtgetmek" },
  "bajarildi deb belgilash": { ru: "Отметить как выполнено", en: "Mark as done", kk: "Орындалды деп белгілеу", ky: "Аткарылды деп белгилөө", tg: "Иҷрошуда қайд кардан", tk: "Ýerine ýetirildi diýip bellemek" },
  "qabul qilinganlar": { ru: "Принятые", en: "Admitted", kk: "Қабылданғандар", ky: "Кабылдангандар", tg: "Қабулшудагон", tk: "Kabul edilenler" },
  kutilayotganlar: { ru: "Ожидающие", en: "Pending", kk: "Күтушілер", ky: "Күтүүчүлөр", tg: "Интизоршавандагон", tk: "Garaşýanlar" },
  kechiktirilganlar: { ru: "Задержанные", en: "Delayed", kk: "Кешіктірілгендер", ky: "Кечиктирилгендер", tg: "Дертамондашудагон", tk: "Gijikdirilenler" },
  "bekor qilinganlar": { ru: "Отмененные", en: "Cancelled", kk: "Бас тартылғандар", ky: "Жокко чыгарылгандар", tg: "Бекоршудагон", tk: "Ýatyrylanlar" },
  "navbat raqami": { ru: "Номер очереди", en: "Queue number", kk: "Кезек нөмірі", ky: "Кезек номери", tg: "Рақами навбат", tk: "Nobat belgisi" },
  amallar: { ru: "Действия", en: "Actions", kk: "Әрекеттер", ky: "Аракеттер", tg: "Амалҳо", tk: "Hereketler" },
  "muolaja va vaqt": { ru: "Процедура и время", en: "Treatment and time", kk: "Емдеу мен уақыт", ky: "Дарылоо жана убакыт", tg: "Муолиҷа ва вақт", tk: "Bejergi we wagt" },
  "to'liq ko'rish": { ru: "Смотреть полностью", en: "View in full", kk: "Толық көру", ky: "Толук көрүү", tg: "Пурра дидан", tk: "Doly görmek" },
  "allergiya:": { ru: "Аллергия:", en: "Allergy:", kk: "Аллергия:", ky: "Аллергия:", tg: "Аллергия:", tk: "Allergiýa:" },
  "kasalliklar:": { ru: "Заболевания:", en: "Diseases:", kk: "Аурулар:", ky: "Оорулар:", tg: "Бемориҳо:", tk: "Keseller:" },
  "shikoyat:": { ru: "Жалоба:", en: "Complaint:", kk: "Шағым:", ky: "Арыз:", tg: "Шикоят:", tk: "Şikaýat:" },
  "yo'q": { ru: "Нет", en: "None", kk: "Жоқ", ky: "Жок", tg: "Нест", tk: "Ýok" },
  bor: { ru: "Есть", en: "Yes", kk: "Бар", ky: "Бар", tg: "Ҳаст", tk: "Bar" },
  yuklash: { ru: "Загрузить", en: "Upload", kk: "Жүктеу", ky: "Жүктөө", tg: "Бор кардан", tk: "Ýüklemek" },
  "ushbu bemor uchun rentgen yuklanmagan": { ru: "Для этого пациента рентген не загружен", en: "No X-rays uploaded for this patient", kk: "Бұл пациент үшін рентген жүктелмеген", ky: "Бул бейтап үчүн рентген жүктөлгөн эмес", tg: "Барои ин бемор рентген бор карда нашудааст", tk: "Bu näsag üçin rentgen ýüklenmedi" },
  "faol bemor tanlanmagan": { ru: "Активный пациент не выбран", en: "No active patient selected", kk: "Белсенді пациент таңдалмаған", ky: "Активдүү бейтап тандалган эмес", tg: "Бемори фаъол интихоб нашудааст", tk: "Işjeň näsag saýlanmady" },
  "barcha bemorlar": { ru: "Все пациенты", en: "All patients", kk: "Барлық пациенттер", ky: "Бардык бейтаптар", tg: "Ҳамаи беморон", tk: "Ähli näsaglar" },
  "faol bemorlar": { ru: "Активные пациенты", en: "Active patients", kk: "Белсенді пациенттер", ky: "Активдүү бейтаптар", tg: "Беморони фаъол", tk: "Işjeň näsaglar" },
  "bugun tashrif buyuradi": { ru: "Посетят сегодня", en: "Visiting today", kk: "Бүгін келеді", ky: "Бүгүн келишет", tg: "Имрӯз ташриф меоранд", tk: "Şu gün gelýär" },
  "jami tashriflar": { ru: "Всего визитов", en: "Total visits", kk: "Барлық тәшрифтер", ky: "Бардык келүүлөр", tg: "Ҳамаи ташрифҳо", tk: "Jemi gelen-gidenler" },
  "umumiy tushum": { ru: "Общий доход", en: "Total revenue", kk: "Жалпы табыс", ky: "Жалпы киреше", tg: "Даромади умумӣ", tk: "Umumy girdeji" },
  "bemorlar ro'yxati": { ru: "Список пациентов", en: "Patients list", kk: "Пациенттер тізімі", ky: "Бейтаптар тизмеси", tg: "Рӯйхати беморон", tk: "Näsaglar sanawy" },
  filter: { ru: "Фильтр", en: "Filter", kk: "Сүзгі", ky: "Чыпка", tg: "Филтр", tk: "Süzgüç" },
  "🌐 boshqa klinikadan qidirish": { ru: "🌐 Поиск из другой клиники", en: "🌐 Search from another clinic", kk: "🌐 Басқа клиникадан іздеу", ky: "🌐 Башка клиникадан издөө", tg: "🌐 Ҷустуҷӯ аз клиникаи дигар", tk: "🌐 Başga klinikadan gözlemek" },
  "boshqa klinikadan": { ru: "из другой клиники", en: "from another clinic", kk: "басқа клиникадан", ky: "башка клиникадан", tg: "аз клиникаи дигар", tk: "başga klinikadan" },
  "yangi bemor": { ru: "Новый пациент", en: "New patient", kk: "Жаңа пациент", ky: "Жаңы бейтап", tg: "Бемори нав", tk: "Täze näsag" },
  "mavjud bemor": { ru: "Существующий пациент", en: "Existing patient", kk: "Қолданыстағы пациент", ky: "Учурдагы бейтап", tg: "Бемори мавҷуда", tk: "Bar bolan näsag" },
  "qidirilmoqda...": { ru: "Идет поиск...", en: "Searching...", kk: "Ізделуде...", ky: "Изделүүдө...", tg: "Ҷустуҷӯ дар ҷараён...", tk: "Gözlenilýär..." },
  qidirish: { ru: "Поиск", en: "Search", kk: "Іздеу", ky: "Издөө", tg: "Ҷустуҷӯ", tk: "Gözlemek" },
  "hech qanday klinikada bunday bemor topilmadi.": { ru: "Такой пациент не найден ни в одной клинике.", en: "No such patient found in any clinic.", kk: "Бұндай пациент ешбір клиникада табылмады.", ky: "Мындай бейтап эч бир клиникада табылган жок.", tg: "Чунин бемор дар ягон клиника ёфт нашуд.", tk: "Şeýle näsag hiç bir klinikada tapylmady." },
  "ta tashrif →": { ru: "визитов →", en: "visits →", kk: "тәшриф →", ky: "келүү →", tg: "ташриф →", tk: "gelen-giden →" },
  "tug'ilgan sana": { ru: "Дата рождения", en: "Date of birth", kk: "Туған күні", ky: "Туулган күнү", tg: "Санаи таваллуд", tk: "Doglan senesi" },
  "oxirgi tashrif": { ru: "Последний визит", en: "Last visit", kk: "Соңғы тәшриф", ky: "Акыркы келүү", tg: "Ташрифи охирин", tk: "Soňky gelen-gideni" },
  "tashriflar soni": { ru: "Количество визитов", en: "Number of visits", kk: "Тәшриф саны", ky: "Келүүлөр саны", tg: "Шумораи ташрифҳо", tk: "Gelen-gidenler sany" },
  qarzdorlik: { ru: "Задолженность", en: "Debt", kk: "Қарыз", ky: "Карыз", tg: "Қарз", tk: "Bergi" },
  "bemorlar topilmadi": { ru: "Пациенты не найдены", en: "No patients found", kk: "Пациенттер табылмады", ky: "Бейтаптар табылган жок", tg: "Беморон ёфт нашуданд", tk: "Näsaglar tapylmady" },
  filterlar: { ru: "Фильтры", en: "Filters", kk: "Сүзгілер", ky: "Чыпкалар", tg: "Филтрҳо", tk: "Süzgüçler" },
  "ro'yxatdan o'tgan sana": { ru: "Дата регистрации", en: "Registration date", kk: "Тіркелген күн", ky: "Катталган күн", tg: "Санаи бақайдгирӣ", tk: "Hasaba durlan senesi" },
  "tezkor amallar": { ru: "Быстрые действия", en: "Quick actions", kk: "Жылдам әрекеттер", ky: "Ыкчам аракеттер", tg: "Амалҳои зуд", tk: "Çalt hereketler" },
  "bemor ma'lumotlarini kiriting": { ru: "Введите данные пациента", en: "Enter patient details", kk: "Пациент деректерін енгізіңіз", ky: "Бейтап маалыматтарын киргизиңиз", tg: "Маълумоти беморро ворид кунед", tk: "Näsagyň maglumatlaryny giriziň" },
  "bemor kartasini ochish": { ru: "Открыть карту пациента", en: "Open patient card", kk: "Пациент картасын ашу", ky: "Бейтап картасын ачуу", tg: "Кушодани харитаи бемор", tk: "Näsag kartasyny açmak" },
  "mavjud bemorni tanlang": { ru: "Выберите существующего пациента", en: "Select existing patient", kk: "Бар пациентті таңдаңыз", ky: "Бар болгон бейтапты тандаңыз", tg: "Бемори мавҷударо интихоб кунед", tk: "Bar bolan näsagy saýlaň" },
  "excel'ga eksport qilish": { ru: "Экспортировать в Excel", en: "Export to Excel", kk: "Excel-ге экспорттау", ky: "Excel'ге экспорттоо", tg: "Содирот ба Excel", tk: "Excel-e eksport etmek" },
  "barcha bemorlarni yuklab oling": { ru: "Скачать всех пациентов", en: "Download all patients", kk: "Барлық пациенттерді жүктеп алыңыз", ky: "Бардык бейтаптарды жүктөп алыңыз", tg: "Ҳамаи беморонро бор кунед", tk: "Ähli näsaglary ýükläň" },
  "yuborilmoqda...": { ru: "Отправляется...", en: "Sending...", kk: "Жіберілуде...", ky: "Жөнөтүлүүдө...", tg: "Фиристода мешавад...", tk: "Iberilýär..." },
  "telegram'ga xabar yuborish": { ru: "Отправить сообщение в Telegram", en: "Send Telegram message", kk: "Telegram-ға хабар жіберу", ky: "Telegram'га билдирүү жөнөтүү", tg: "Фиристодани хабар ба Telegram", tk: "Telegram-a habar ibermek" },
  "ulangan barcha bemorlarga xabar": { ru: "Сообщение всем подключенным пациентам", en: "Message to all connected patients", kk: "Қосылған барлық пациенттерге хабар", ky: "Туташкан бардык бейтаптарга билдирүү", tg: "Хабар ба ҳамаи беморони пайвастшуда", tk: "Birikdirilen ähli näsaglara habar" },
  "ma'lumot": { ru: "Информация", en: "Info", kk: "Ақпарат", ky: "Маалымат", tg: "Маълумот", tk: "Maglumat" },
  "o'rtacha tashrif soni": { ru: "Среднее количество визитов", en: "Average visit count", kk: "Орташа тәшриф саны", ky: "Орточо келүү саны", tg: "Шумораи миёнаи ташрифҳо", tk: "Ortaça gelen-gideni sany" },
  marta: { ru: "раз", en: "times", kk: "рет", ky: "жолу", tg: "маротиба", tk: "gezek" },
  "eng ko'p tashrif buyurgan bemor": { ru: "Пациент с наибольшим числом визитов", en: "Patient with most visits", kk: "Ең көп тәшриф жасаған пациент", ky: "Эң көп келген бейтап", tg: "Бемор бо бештарин ташриф", tk: "Iň köp gelen-giden näsag" },
  "o'rtacha muolaja narxi": { ru: "Средняя цена процедуры", en: "Average treatment price", kk: "Орташа емдеу бағасы", ky: "Орточо дарылоо баасы", tg: "Нархи миёнаи муолиҷа", tk: "Ortaça bejergi bahasy" },
  "jami diagnozlar": { ru: "Всего диагнозов", en: "Total diagnoses", kk: "Барлық диагноздар", ky: "Бардык диагноздор", tg: "Ҳамаи ташхисҳо", tk: "Jemi diagnozlar" },
  "qabulni rejalashtirish": { ru: "Запланировать прием", en: "Schedule consultation", kk: "Қабылдауды жоспарлау", ky: "Кабылдоону пландаштыруу", tg: "Банақшагирии қабул", tk: "Kabuly meýilleşdirmek" },
  "muolaja / xizmat": { ru: "Процедура / Услуга", en: "Treatment / Service", kk: "Емдеу / Қызмет", ky: "Дарылоо / Кызмат", tg: "Муолиҷа / Хизмат", tk: "Bejergi / Hyzmat" },
  "— muolajani tanlang —": { ru: "— Выберите процедуру —", en: "— Select treatment —", kk: "— Емдеуді таңдаңыз —", ky: "— Дарылоону тандаңыз —", tg: "— Муолиҷаро интихоб кунед —", tk: "— Bejergini saýlaň —" },
  tasdiqlash: { ru: "Подтвердить", en: "Confirm", kk: "Растау", ky: "Ырастоо", tg: "Тасдиқ кардан", tk: "Tassyklamak" },
  "ma'lumot yo'q": { ru: "Нет данных", en: "No data", kk: "Деректер жоқ", ky: "Маалымат жок", tg: "Маълумот нест", tk: "Maglumat ýok" },
  "qo'shilmoqda...": { ru: "Добавляется...", en: "Adding...", kk: "Қосылуда...", ky: "Кошулууда...", tg: "Илова карда мешавад...", tk: "Goşulýar..." },
  "ushbu klinikaga qo'shish": { ru: "Добавить в эту клинику", en: "Add to this clinic", kk: "Осы клиникаға қосу", ky: "Ушул клиникага кошуу", tg: "Илова кардан ба ин клиника", tk: "Şu klinika goşmak" },
  "to'liq ism *": { ru: "Полное имя *", en: "Full name *", kk: "Толық аты *", ky: "Толук аты *", tg: "Номи пурра *", tk: "Doly ady *" },
  "saqlanmoqda...": { ru: "Сохраняется...", en: "Saving...", kk: "Сақталуда...", ky: "Сакталууда...", tg: "Захира карда мешавад...", tk: "Ýatda saklanýar..." },
  "ushbu bemor uchun davolash rejasi kiritilmagan": { ru: "Для этого пациента план лечения не составлен", en: "No treatment plan entered for this patient", kk: "Бұл пациент үшін емдеу жоспары енгізілмеген", ky: "Бул бейтап үчүн дарылоо планы киргизилген эмес", tg: "Барои ин бемор нақшаи муолиҷа ворид нашудааст", tk: "Bu näsag üçin bejergi meýilnamasy girizilmedi" },
  "jami:": { ru: "Итого:", en: "Total:", kk: "Барлығы:", ky: "Баары:", tg: "Ҷамъ:", tk: "Jemi:" },
  "to'liq rejani ko'rish": { ru: "Смотреть план полностью", en: "View full plan", kk: "Толық жоспарды көру", ky: "Толук планды көрүү", tg: "Пурра дидани нақша", tk: "Doly meýilnamany görmek" },
  "barcha eslatmalar": { ru: "Все напоминания", en: "All reminders", kk: "Барлық ескертулер", ky: "Бардык эскертүүлөр", tg: "Ҳамаи ёдоварӣ", tk: "Ähli duýduryşlar" },
  "7 kun ichida": { ru: "В течение 7 дней", en: "Within 7 days", kk: "7 күн ішінде", ky: "7 күн ичинде", tg: "Дар давоми 7 рӯз", tk: "7 günüň dowamynda" },
  "30 kun ichida": { ru: "В течение 30 дней", en: "Within 30 days", kk: "30 күн ішінде", ky: "30 күн ичинде", tg: "Дар давоми 30 рӯз", tk: "30 günüň dowamynda" },
  "klinika rejimi": { ru: "Режим клиники", en: "Clinic mode", kk: "Клиника режимі", ky: "Клиника режими", tg: "Реҷаи клиника", tk: "Klinika rejimi" },
  rentgenlar: { ru: "Рентгены", en: "X-rays", kk: "Рентгендер", ky: "Рентгендер", tg: "Рентгенҳо", tk: "Rentgenler" },
  "profilni tahrirlash & shaxsiy sozlamalar": {
    ru: "Редактировать профиль и личные настройки",
    en: "Edit Profile & Personal Settings",
    kk: "Профильди өңдеу және жеке баптаулар",
    ky: "Профилди түзөтүү жана жеке жөндөөлөр",
    tg: "Таҳрири профил ва танзимоти шахсӣ",
    tk: "Profili üýtgetmek we şahsy sazlamalar",
  },
  "statusni belgilash": { ru: "Выбрать статус", en: "Select Status", kk: "Мәртебені белгілеу", ky: "Статусту белгилөө", tg: "Таъини ҳолат", tk: "Statusy bellemek" },
  "yangi parol o'rnatish": {
    ru: "Установить новый пароль",
    en: "Set New Password",
    kk: "Жаңа құпия сөз орнату",
    ky: "Жаңы сырсөз коюу",
    tg: "Гузоштани пароли нав",
    tk: "Täze parol goýmak",
  },
  "parolingizni o'zgartiring": {
    ru: "Сменить пароль",
    en: "Change Password",
    kk: "Құпия сөзіңізді өзгертіңіз",
    ky: "Сырсөзүңүздү өзгөртүңүз",
    tg: "Пароли худро тағйир диҳед",
    tk: "Parolyňyzy üýtgediň",
  },
  "bekor qilish": { ru: "Отмена", en: "Cancel", kk: "Бас тарту", ky: "Жокко чыгаруу", tg: "Бекор кардан", tk: "Ýatyrmak" },
  saqlash: { ru: "Сохранить", en: "Save", kk: "Сақтау", ky: "Сактоо", tg: "Захира кардан", tk: "Ýatda saklamak" },
  "bo'sh": { ru: "Свободен", en: "Idle", kk: "Бос", ky: "Бош", tg: "Холӣ", tk: "Boş" },
  band: { ru: "Занят", en: "Busy", kk: "Бос емес", ky: "Бош эмес", tg: "Машғул", tk: "Meşgul" },
  away: { ru: "Не в сети", en: "Away", kk: "Желіде емес", ky: "Тармакта эмес", tg: "Офлайн", tk: "Oflaýn" },
  "profil ma'lumotlari muvaffaqiyatli saqlandi! (parol yangilandi)": {
    ru: "Профиль успешно изменен! (Пароль обновлен)",
    en: "Profile saved successfully! (Password updated)",
    kk: "Профиль деректері сәтті сақталды! (Құпия сөз жаңартылды)",
    ky: "Профиль маалыматтары ийгиликтүү сакталды! (Сырсөз жаңыланды)",
    tg: "Маълумоти профил бомуваффақият захира шуд! (Парол нав шуд)",
    tk: "Profil maglumatlary üstünlikli ýatda saklandy! (Parol täzelendi)",
  },
  "faol / bo'sh": { ru: "активен / свободен", en: "active / idle", kk: "белсенді / бос", ky: "активдүү / бош", tg: "фаъол / холӣ", tk: "işjeň / boş" },
  tushlikda: { ru: "обед", en: "lunch break", kk: "түскі аста", ky: "түшкү тамакта", tg: "дар вақти хӯроки нисфирӯзӣ", tk: "günortan naharynda" },
  "tizimda barcha kelayotgan navbatlarni muvaffaqiyatli qabul qiling va davolash holatini belgilang":
    {
      ru: "Успешно принимайте всех поступающих пациентов и управляйте ходом лечения",
      en: "Successfully admit all incoming patients and manage treatment status",
      kk: "Тізімдегі барлық келетін кезектерді сәтті қабылдаңыз және емдеу жағдайын белгілеңіз",
      ky: "Тизимдеги бардык келе жаткан кезектерди ийгиликтүү кабыл алыңыз жана дарылоо абалын белгилеңиз",
      tg: "Ҳамаи навбатҳои ояндаро дар низом бомуваффақият қабул кунед ва ҳолати муолиҷаро таъин кунед",
      tk: "Ulgamdaky ähli gelýän nobatlary üstünlikli kabul ediň we bejergi ýagdaýyny belläň",
    },
  "shaxsiy rasm yuklash (fayl yoki rasm)": {
    ru: "Загрузить фото профиля (Перетащите файл)",
    en: "Upload profile photo (Drag & drop)",
    kk: "Жеке сурет жүктеу (файл немесе сурет)",
    ky: "Жеке сүрөт жүктөө (файл же сүрөт)",
    tg: "Боркунии сурати шахсӣ (файл ё расм)",
    tk: "Şahsy surat ýüklemek (faýl ýa-da surat)",
  },
  "rasmni almashtirish": { ru: "Изменить фото", en: "Change Photo", kk: "Суретті алмастыру", ky: "Сүрөттү алмаштыруу", tg: "Иваз кардани расм", tk: "Suraty çalyşmak" },
  "rasm tanlang yoki tashlang": {
    ru: "Выберите или перетащите фото",
    en: "Choose or drop photo",
    kk: "Суретті таңдаңыз немесе тастаңыз",
    ky: "Сүрөттү тандаңыз же таштаңыз",
    tg: "Расмро интихоб кунед ё партоед",
    tk: "Suraty saýlaň ýa-da taşlaň",
  },
  "png, jpg formatlari": { ru: "Форматы PNG, JPG", en: "PNG, JPG formats", kk: "PNG, JPG форматтары", ky: "PNG, JPG форматтары", tg: "Форматҳои PNG, JPG", tk: "PNG, JPG formatlary" },
  "navbat kutayotganlar": { ru: "Ожидают очереди", en: "Awaiting queue", kk: "Кезек күтушілер", ky: "Кезек күтүүчүлөр", tg: "Дар навбат интизорон", tk: "Nobata garaşýanlar" },
  "bugun qabul qilindi": { ru: "Принято сегодня", en: "Admitted today", kk: "Бүгін қабылданды", ky: "Бүгүн кабылданды", tg: "Имрӯз қабул шуд", tk: "Şu gün kabul edildi" },
  "bugungi daromad": { ru: "Дневной доход", en: "Daily revenue", kk: "Бүгінгі табыс", ky: "Бүгүнкү киреше", tg: "Даромади имрӯза", tk: "Şu günki girdeji" },
  "o'rtacha baho": { ru: "Средняя оценка", en: "Average rating", kk: "Орташа баға", ky: "Орточо баа", tg: "Баҳои миёна", tk: "Ortaça baha" },
  "ta chipta": { ru: "билетов", en: "tickets", kk: "билет", ky: "билет", tg: "чипта", tk: "petek" },
  nafar: { ru: "человек", en: "people", kk: "адам", ky: "адам", tg: "нафар", tk: "adam" },
  "xonada chaqirilayotgan / davolanayotgan faol bemor": {
    ru: "В КЛИНИЧЕСКОЙ КОМНАТЕ / АКТИВНЫЙ ПАЦИЕНТ",
    en: "IN CONSULTATION ROOM / ACTIVE PATIENT",
    kk: "БӨЛМЕГЕ ШАҚЫРЫЛУДА / БЕЛСЕНДІ ПАЦИЕНТ",
    ky: "БӨЛМӨГӨ ЧАКЫРЫЛУУДА / АКТИВДҮҮ БЕЙТАП",
    tg: "ДАР ХОНА ДАЪВАТ КАРДА МЕШАВАД / БЕМОРИ ФАЪОЛ",
    tk: "OTAGA ÇAGYRYLÝAR / IŞJEŇ NÄSAG",
  },
  xizmat: { ru: "Услуга", en: "Service", kk: "Қызмет", ky: "Кызмат", tg: "Хизмат", tk: "Hyzmat" },
  telefon: { ru: "Телефон", en: "Phone", kk: "Телефон", ky: "Телефон", tg: "Телефон", tk: "Telefon" },
  "📣 kabinetga chaqirilmoqda (signal monitorida yonmoqda)": {
    ru: "📣 ВЫЗЫВАЕТСЯ В КАБИНЕТ (Мигает на мониторе)",
    en: "📣 SUMMONING TO ROOM (Flashing on signal monitor)",
    kk: "📣 КАБИНЕТКЕ ШАҚЫРЫЛУДА (Мониторда жыпылықтайды)",
    ky: "📣 КАБИНЕТКЕ ЧАКЫРЫЛУУДА (Монитордо жанып турат)",
    tg: "📣 БА КАБИНЕТ ДАЪВАТ КАРДА МЕШАВАД (Дар монитор чашмак мезанад)",
    tk: "📣 KABINETE ÇAGYRYLÝAR (Monitorda ýanýar)",
  },
  "🦷 qabul rejimida (davolash ishlari faol bajarilmoqda)": {
    ru: "🦷 РЕЖИМ ПРИЕМА (Активно выполняется лечение)",
    en: "🦷 UNDER CONSULTATION (Active treatment process)",
    kk: "🦷 ҚАБЫЛДАУ РЕЖИМІНДЕ (Емдеу белсенді орындалуда)",
    ky: "🦷 КАБЫЛДОО РЕЖИМИНДЕ (Дарылоо активдүү аткарылууда)",
    tg: "🦷 ДАР РЕЖИМИ ҚАБУЛ (Муолиҷа фаъолона иҷро мешавад)",
    tk: "🦷 KABUL REJIMINDE (Bejergi işjeň amala aşyrylýar)",
  },
  "davolashni yakunlash ✓": {
    ru: "Завершить работу ✓",
    en: "Complete treatment ✓",
    kk: "Емдеуді аяқтау ✓",
    ky: "Дарылоону аяктоо ✓",
    tg: "Ба итмом расонидани муолиҷа ✓",
    tk: "Bejergini tamamlamak ✓",
  },
  "📊 navbatni boshqarish paneli (smart taqsimlash)": {
    ru: "📊 Панель управления очередью (Умное распределение)",
    en: "📊 Queue Management Panel (Smart Division)",
    kk: "📊 Кезекті басқару панелі (Ақылды бөлу)",
    ky: "📊 Кезекти башкаруу панели (Акылдуу бөлүштүрүү)",
    tg: "📊 Панели идоракунии навбат (Тақсимоти оқилона)",
    tk: "📊 Nobat dolandyryş paneli (Akylly bölüşdirmek)",
  },
  "yangi mijozlar (birlamchi ko'rik)": {
    ru: "Новые пациенты (Первичные)",
    en: "New Patients (First visit)",
    kk: "Жаңа пациенттер (Алғашқы қарау)",
    ky: "Жаңы бейтаптар (Алгачкы кароо)",
    tg: "Беморони нав (Муоинаи аввалин)",
    tk: "Täze näsaglar (Ilkinji gözden geçiriş)",
  },
  "doimiy bemorlar (tashrif tarixdagilar)": {
    ru: "Постоянные пациенты (Повторные)",
    en: "Regular Patients (Follow-up)",
    kk: "Тұрақты пациенттер (Қайталама)",
    ky: "Туруктуу бейтаптар (Кайталануучу)",
    tg: "Беморони доимӣ (Такрорӣ)",
    tk: "Hemişelik näsaglar (Gaýtalanýan)",
  },
  ta: { ru: "шт", en: "items", kk: "дана", ky: "даана", tg: "дона", tk: "sany" },
  "hozircha yangi bemorlar navbati yo'q.": {
    ru: "В настоящее время список новых очередей пуст.",
    en: "No new clinic queue items currently.",
    kk: "Қазіргі уақытта жаңа кезек тізімі жоқ.",
    ky: "Азыркы учурда жаңы кезек тизмеси жок.",
    tg: "Дар айни замон рӯйхати навбати нав нест.",
    tk: "Häzirlikçe täze nobat sanawy ýok.",
  },
  "hozircha doimiy bemorlar navbati yo'q.": {
    ru: "В настоящее время список повторных очередей пуст.",
    en: "No regular clinic queue items currently.",
    kk: "Қазіргі уақытта тұрақты кезек тізімі жоқ.",
    ky: "Азыркы учурда туруктуу кезек тизмеси жок.",
    tg: "Дар айни замон рӯйхати навбати доимӣ нест.",
    tk: "Häzirlikçe hemişelik nobat sanawy ýok.",
  },
  chaqirish: { ru: "Вызвать", en: "Call", kk: "Шақыру", ky: "Чакыруу", tg: "Даъват кардан", tk: "Çagyrmak" },
  "tugatilgan qabullar ro'yxati (bugun)": {
    ru: "Список завершенных приемов (Сегодня)",
    en: "List of completed consultations (Today)",
    kk: "Аяқталған қабылдаулар тізімі (Бүгін)",
    ky: "Аяктаган кабылдоолор тизмеси (Бүгүн)",
    tg: "Рӯйхати қабулҳои анҷомёфта (Имрӯз)",
    tk: "Tamamlanan kabullaryň sanawy (Şu gün)",
  },
  "bugun hali qabul sobiq qilinmadi.": {
    ru: "Сегодня приемов еще не было.",
    en: "No patients were admitted today yet.",
    kk: "Бүгін әлі қабылдау болған жоқ.",
    ky: "Бүгүн азырынча кабылдоо болгон жок.",
    tg: "Имрӯз ҳанӯз қабул сурат нагирифтааст.",
    tk: "Şu gün heniz kabul bolmady.",
  },
  kutilmoqda: { ru: "ожидание", en: "pending", kk: "күтілуде", ky: "күтүлүүдө", tg: "интизор", tk: "garaşylýar" },
  "telegram bot xizmati": {
    ru: "Сервис Telegram-Бота",
    en: "Telegram Bot Service",
    kk: "Telegram бот қызметі",
    ky: "Telegram бот кызматы",
    tg: "Хизмати боти Telegram",
    tk: "Telegram bot hyzmaty",
  },
  "tizimga ulanish": { ru: "Подключить кабинет", en: "Connect Cabinet", kk: "Кабинетті қосу", ky: "Кабинетти туташтыруу", tg: "Пайваст кардани кабинет", tk: "Kabineti birikdirmek" },
  "shifokorlar uchun telegram yordamchisi. yangi bemorlar yozilganda zudlik bilan bildirishnomalar oling va navbatlarni bevosita telegramda boshqaring!":
    {
      ru: "Telegram-помощник для врачей. Получайте мгновенные уведомления о записи пациентов и управляйте очередью прямо в Telegram!",
      en: "Telegram assistant for doctors. Get instant notifications when patients register and manage your queue directly inside Telegram!",
      kk: "Дәрігерлер үшін Telegram көмекшісі. Жаңа пациенттер жазылғанда дереу хабарландыру алыңыз және кезектерді тікелей Telegram-да басқарыңыз!",
      ky: "Дарыгерлер үчүн Telegram жардамчысы. Жаңы бейтаптар жазылганда дароо билдирүү алыңыз жана кезектерди түз Telegram-да башкарыңыз!",
      tg: "Ёрдамчии Telegram барои духтурон. Ҳангоми сабти беморони нав фавран огоҳинома гиред ва навбатҳоро мустақим дар Telegram идора кунед!",
      tk: "Lukmanlar üçin Telegram kömekçisi. Täze näsaglar ýazylanda derrew habarnama alyň we nobatlary göni Telegram-da dolandyryň!",
    },
  "faollashtirish qadamlari:": {
    ru: "Шаги для активации:",
    en: "Activation Steps:",
    kk: "Белсендіру қадамдары:",
    ky: "Активдештирүү кадамдары:",
    tg: "Қадамҳои фаъолсозӣ:",
    tk: "Işjeňleşdirmek ädimleri:",
  },
  "1. telegramda @dstoma_doctor_bot yordamchisiga o'ting va /start ni bosing.":
    {
      ru: "1. Перейдите в Telegram-бот @dstoma_doctor_bot и отправьте /start.",
      en: "1. Open Telegram bot @dstoma_doctor_bot and send /start.",
      kk: "1. Telegram-да @dstoma_doctor_bot көмекшісіне өтіп, /start басыңыз.",
      ky: "1. Telegram-да @dstoma_doctor_bot жардамчысына өтүп, /start басыңыз.",
      tg: "1. Дар Telegram ба ёрдамчии @dstoma_doctor_bot гузаред ва /start-ро пахш кунед.",
      tk: "1. Telegram-da @dstoma_doctor_bot kömekçisine geçiň we /start basyň.",
    },
  "2. /doctor buyrug'ini yuboring va xonadagi login parolingizni kiriting.":
    {
      ru: "2. Отправьте команду /doctor и введите ваши логин и пароль.",
      en: "2. Send command /doctor and enter your clinic login/password credentials.",
      kk: "2. /doctor команданы жіберіп, логин мен құпия сөзіңізді енгізіңіз.",
      ky: "2. /doctor буйругун жөнөтүп, логин жана сырсөзүңүздү киргизиңиз.",
      tg: "2. Фармони /doctor-ро фиристед ва логин ва пароли худро ворид кунед.",
      tk: "2. /doctor buýrugyny iberiň we login-parolyňyzy giriziň.",
    },
  "3. tayyor! yangi navbatlar xabari shu yerga keladi.": {
    ru: "3. Готово! Уведомления о новых пациентах теперь будут поступать туда.",
    en: "3. Ready! Success alerts and queue calls will land directly in your chat.",
    kk: "3. Дайын! Жаңа кезектер туралы хабарлар осы жерге келеді.",
    ky: "3. Даяр! Жаңы кезектер тууралуу билдирүүлөр ушул жерге келет.",
    tg: "3. Тайёр! Огоҳиномаҳои навбати нав ба ин ҷо мерасанд.",
    tk: "3. Taýýar! Täze nobatlar barada habarlar şu ýere geler.",
  },
  "telegram botni ochish 💬": {
    ru: "Открыть Telegram Bot 💬",
    en: "Open Telegram Bot 💬",
    kk: "Telegram Bot ашу 💬",
    ky: "Telegram Bot ачуу 💬",
    tg: "Кушодани Telegram Bot 💬",
    tk: "Telegram Bot açmak 💬",
  },
};

export default function DoctorDashboard({
  clinics,
  doctors,
  queues,
  patients,
  services,
  doctorClinicLinks = [],
  activeDoctorClinicId,
  setActiveDoctorClinicId,
  currentUser,
  language,
  setLanguage,
  onUpdateQueueStatus,
  selectedClinic,
  setActiveTab,
  onRequestPremiumUpgrade,
  staffToken,
  onAddQueue,
  onDeleteQueue,
  onPatientUpserted,
  onLogout,
  onUpdateDoctorDetails
}: DoctorDashboardProps) {
  // Translation Helper
  const localLang: keyof DoctorDictEntry | null =
    (language === "ru" || language === "en" || language === "kk" || language === "ky" || language === "tg" || language === "tk")
      ? language
      : null;

  // POST /api/patients only lets an already-existing record be edited by someone
  // who can prove they're allowed to — staff of that clinic, the patient
  // themselves, or the superadmin. Every doctor-side patient write has to carry
  // the staff session token or the server rejects it.
  const staffAuthHeaders = (): Record<string, string> =>
    staffToken ? { Authorization: `Bearer ${staffToken}` } : {};

  const t = (text: string) => {
    if (!language) return text;

    // Look up in global configurations if text acts as a key
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof (typeof TRANSLATIONS)["uz"]];
    }

    const cleanText = text.trim().toLowerCase().replace(/\s+/g, " ");
    const entry = DOCTOR_TRANSLATIONS[cleanText] || DOCTOR_TRANSLATIONS[text];
    if (entry) {
      if (localLang) return entry[localLang];
      // uz (or an unsupported language) — dict keys are stored lowercase for
      // matching, so restore the sentence-case convention used everywhere else
      // in the app (capitalize the first letter only; skip any leading emoji).
      const idx = text.search(/[a-zA-Zʻʼ'’]/);
      if (idx === -1) return text;
      return text.slice(0, idx) + text.charAt(idx).toUpperCase() + text.slice(idx + 1);
    }

    return text;
  };

  const currentDoctor = doctors.find((d) => d.id === currentUser?.id);

  // Clinics this doctor is currently affiliated with (their home clinic + any active links)
  const myActiveLinks = doctorClinicLinks.filter((l) => l.doctorId === currentDoctor?.id && l.status === "active");
  const myClinicIds = Array.from(
    new Set([currentDoctor?.clinicId, ...myActiveLinks.map((l) => l.clinicId)].filter(Boolean) as string[])
  );
  // Which clinic this doctor is currently working in — switchable when they have more than one
  const effectiveClinicId =
    activeDoctorClinicId && myClinicIds.includes(activeDoctorClinicId)
      ? activeDoctorClinicId
      : currentDoctor?.clinicId || selectedClinic?.id || null;
  const effectiveClinic = clinics.find((c) => c.id === effectiveClinicId) || selectedClinic;

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [activeDoctorId, setActiveDoctorId] = useState(currentDoctor?.id || "");
  const [patientListSearch, setPatientListSearch] = useState("");
  const patientSearchInputRef = useRef<HTMLInputElement>(null);
  const [showQuickAddPatient, setShowQuickAddPatient] = useState(false);
  const [quickAddPatient, setQuickAddPatient] = useState({
    fullName: "", phone: "", passportSerial: "", birthDate: "",
    bloodGroup: "", allergies: "", chronicDiseases: "", hasInfection: false,
    bookAppointment: true, serviceId: "",
    appointmentDate: new Date().toISOString().split('T')[0], appointmentTime: "09:00",
  });
  const [isSavingQuickAddPatient, setIsSavingQuickAddPatient] = useState(false);
  // Shown once, right after a doctor-added patient is saved — loginCode only
  // ever appears in that one server response, and the doctor is the one who
  // has to relay it (plus the password) to the patient, since the patient
  // isn't the one filling out this form.
  const [justAddedPatientCreds, setJustAddedPatientCreds] = useState<{ loginCode: string; password: string } | null>(null);
  const [isSendingBulkTelegram, setIsSendingBulkTelegram] = useState(false);
  const [showCrossClinicSearch, setShowCrossClinicSearch] = useState(false);
  const [crossClinicQuery, setCrossClinicQuery] = useState("");
  const [crossClinicResults, setCrossClinicResults] = useState<Patient[]>([]);
  const [crossClinicSearching, setCrossClinicSearching] = useState(false);
  const [crossClinicSearched, setCrossClinicSearched] = useState(false);
  const [crossClinicViewPatient, setCrossClinicViewPatient] = useState<Patient | null>(null);
  const [isAddingCrossClinicVisit, setIsAddingCrossClinicVisit] = useState(false);
  const [queueListRange, setQueueListRange] = useState<'today' | 'all'>('today');
  const [queueListSearch, setQueueListSearch] = useState('');
  const [queueListStatusFilter, setQueueListStatusFilter] = useState('');

  // Real patient roster for the "Bemorlar" tab, scoped to the active clinic. A patient
  // "belongs" here if they have a recorded visit at this clinic, or (for freshly
  // registered patients with no visits yet) if this is their home clinic — OR if this
  // doctor personally registered them (primaryDoctorId), so a doctor's own patients
  // keep showing up even after the doctor switches to a different clinic.
  const clinicPatients = useMemo(() => {
    if (!effectiveClinicId) return patients;
    return patients.filter((p) => {
      if (p.primaryDoctorId === currentDoctor?.id) return true;
      const visits = p.clinicVisits || [];
      if (visits.length === 0) return p.clinicId === effectiveClinicId;
      return visits.some((v) => (v.clinicId || p.clinicId) === effectiveClinicId);
    });
  }, [patients, effectiveClinicId, currentDoctor?.id]);

  // The "Bemorlar" tab itself is scoped tighter than clinicPatients above: only
  // patients this doctor is currently treating (primaryDoctorId), not every patient
  // who's ever visited the clinic. primaryDoctorId is kept in sync automatically
  // whenever a patient books a new queue (see POST /api/queues in server.ts), so
  // this naturally updates the moment a patient switches to a different doctor.
  // clinicPatients itself stays clinic-wide — it still backs Statistics, bulk
  // Telegram messaging, and resolving a patient from any clinic queue, which all
  // legitimately need the full clinic roster.
  // Strictly this doctor's own patients. Patients with no primaryDoctorId yet
  // (self-registered via the Telegram bot / ClientDashboard, neither of which
  // sets it) are deliberately NOT mixed in here — they'd otherwise appear in
  // every doctor's list and inflate everyone's counts. They become a doctor's
  // patient the moment that doctor books them ("Yangi bandlash" searches the
  // full clinic roster and sets primaryDoctorId on save).
  //
  // This is also the single source of truth for every patient number shown to
  // the doctor — the "Bemorlar" list, its stat cards, and the Statistika tab
  // all read from it, so they can't disagree with each other.
  const myPatients = useMemo(
    () => clinicPatients.filter((p) => p.primaryDoctorId === currentDoctor?.id),
    [clinicPatients, currentDoctor?.id]
  );
  const filteredClinicPatients = useMemo(() => {
    const q = patientListSearch.trim().toLowerCase();
    if (!q) return myPatients;
    return myPatients.filter(
      (p) =>
        (p.fullName || "").toLowerCase().includes(q) ||
        (p.phone || "").includes(q) ||
        (p.id || "").toLowerCase().includes(q)
    );
  }, [myPatients, patientListSearch]);
  const patientStats = useMemo(() => {
    const total = myPatients.length;
    const active = myPatients.filter((p) => (p.clinicVisits?.length || 0) > 0).length;
    const totalVisits = myPatients.reduce((sum, p) => sum + (p.clinicVisits?.length || 0), 0);
    const totalRevenue = myPatients.reduce(
      (sum, p) => sum + (p.clinicVisits || []).reduce((s, v) => s + (v.price || 0), 0),
      0
    );
    const todayStr = new Date().toISOString().slice(0, 10);
    const clinicQueues = effectiveClinicId ? queues.filter((q) => q.clinicId === effectiveClinicId) : queues;
    const todayVisits = clinicQueues.filter((q) => q.appointmentDate === todayStr).length;
    return {
      total,
      active,
      activePct: total > 0 ? ((active / total) * 100).toFixed(1) : "0.0",
      totalVisits,
      totalRevenue,
      todayVisits,
    };
  }, [myPatients, queues, effectiveClinicId]);

  // Resolve a queue entry to a real patient record (queues only store name/phone, not a patient ID)
  const resolvePatientIdFromQueue = (q: QueueItem): string | null => {
    const normalizedQueuePhone = (q.patientPhone || "").replace(/\D/g, "");
    const match =
      clinicPatients.find(
        (p) => normalizedQueuePhone && p.phone && p.phone.replace(/\D/g, "") === normalizedQueuePhone
      ) || clinicPatients.find((p) => p.fullName === q.patientName);
    return match ? match.id : null;
  };

  const handleQuickAddPatient = async () => {
    if (!quickAddPatient.fullName.trim() || !effectiveClinicId) return;
    setIsSavingQuickAddPatient(true);
    // Always system-generated — the doctor hands both login and password to
    // the patient right after creation, so there's nothing for them to type
    // or remember here. Login is the patient's own name (see useNameAsLogin
    // below); the password just needs to exist, not be memorable.
    const passwordToUse = Math.random().toString(36).slice(2, 8);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...staffAuthHeaders() },
        body: JSON.stringify({
          clinicId: effectiveClinicId,
          fullName: quickAddPatient.fullName.trim(),
          phone: quickAddPatient.phone.trim() || undefined,
          passportSerial: quickAddPatient.passportSerial.trim() || undefined,
          birthDate: quickAddPatient.birthDate || undefined,
          password: passwordToUse,
          useNameAsLogin: true,
          bloodGroup: quickAddPatient.bloodGroup || undefined,
          allergies: quickAddPatient.allergies.trim() || undefined,
          chronicDiseases: quickAddPatient.chronicDiseases.trim() || undefined,
          hasInfection: quickAddPatient.hasInfection,
          primaryDoctorId: currentDoctor?.id,
        }),
      });
      if (res.ok) {
        const savedPatient = await res.json();
        // Reflect the new patient in shared state right away — the 4s background
        // poll would otherwise leave the doctor staring at an unchanged list.
        onPatientUpserted?.({ ...savedPatient, primaryDoctorId: savedPatient.primaryDoctorId || currentDoctor?.id });
        if (quickAddPatient.bookAppointment && quickAddPatient.appointmentDate && quickAddPatient.appointmentTime && onAddQueue) {
          onAddQueue({
            id: 'q_' + Math.random().toString(36).substr(2, 9),
            clinicId: effectiveClinicId,
            patientId: savedPatient.id,
            doctorId: currentDoctor?.id || activeDoctorId,
            serviceId: quickAddPatient.serviceId,
            patientName: savedPatient.fullName || quickAddPatient.fullName.trim(),
            patientPhone: savedPatient.phone || quickAddPatient.phone.trim(),
            passportSerial: savedPatient.passportSerial || quickAddPatient.passportSerial.trim(),
            number: 0,
            status: 'scheduled',
            appointmentDate: quickAddPatient.appointmentDate,
            appointmentTime: quickAddPatient.appointmentTime,
            createdAt: new Date().toISOString(),
          });
        }
        setQuickAddPatient({
          fullName: "", phone: "", passportSerial: "", birthDate: "",
          bloodGroup: "", allergies: "", chronicDiseases: "", hasInfection: false,
          bookAppointment: true, serviceId: "",
          appointmentDate: new Date().toISOString().split('T')[0], appointmentTime: "09:00",
        });
        setShowQuickAddPatient(false);
        if (savedPatient.loginCode) {
          setJustAddedPatientCreds({ loginCode: savedPatient.loginCode, password: passwordToUse });
        }
      }
    } catch (err) {
      console.warn("[DoctorDashboard] Failed to add patient:", err);
    } finally {
      setIsSavingQuickAddPatient(false);
    }
  };

  // Books a patient (existing, picked from search, or a brand-new name/phone
  // typed directly — POST /api/queues accepts free-text patient info, no
  // pre-existing Patient record required) for a specific future date/time,
  // creating the queue as already 'scheduled' rather than 'pending'.
  const handleNewBooking = async () => {
    if (!newBookingName.trim() || !newBookingDate || !newBookingTime || !effectiveClinicId || !onAddQueue) return;
    setIsSavingNewBooking(true);
    try {
      if (editingQueueId) {
        // Editing only touches service/date/time — the patient is already tied
        // to this queue entry, and renaming them here would silently detach
        // from their real Patient record instead of actually renaming it.
        onUpdateQueueStatus(editingQueueId, editingQueueStatus, newBookingServiceId, undefined, newBookingDate, newBookingTime);
        setShowNewBookingModal(false);
        setEditingQueueId(null);
        return;
      }

      // Two ways to fill in who this slot is for: pick an existing Patient
      // record (mode 'existing', the only option this modal used to have),
      // or register one on the spot (mode 'new') — same creation call
      // "Yangi bemor qo'shish" uses, so there's still only one code path
      // that actually creates a Patient record.
      let patientId = newBookingSelectedPatientId;
      let patientCreds: { loginCode: string; password: string } | null = null;
      if (newBookingMode === 'new') {
        if (!effectiveClinicId) return;
        const passwordToUse = Math.random().toString(36).slice(2, 8);
        const res = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...staffAuthHeaders() },
          body: JSON.stringify({
            clinicId: effectiveClinicId,
            fullName: newBookingName.trim(),
            phone: newBookingPhone.trim() || undefined,
            password: passwordToUse,
            useNameAsLogin: true,
            primaryDoctorId: currentDoctor?.id,
          }),
        });
        if (!res.ok) return;
        const savedPatient = await res.json();
        patientId = savedPatient.id;
        onPatientUpserted?.({ ...savedPatient, primaryDoctorId: savedPatient.primaryDoctorId || currentDoctor?.id });
        if (savedPatient.loginCode) patientCreds = { loginCode: savedPatient.loginCode, password: passwordToUse };
      } else if (!newBookingSelectedPatientId) {
        // Belt-and-braces: the submit button is already disabled in this case.
        return;
      }

      const newQueue: QueueItem = {
        id: 'q_' + Math.random().toString(36).substr(2, 9),
        clinicId: effectiveClinicId,
        patientId: patientId || undefined,
        doctorId: currentDoctor?.id || activeDoctorId,
        serviceId: newBookingServiceId,
        patientName: newBookingName.trim(),
        patientPhone: newBookingPhone.trim(),
        number: 0,
        status: 'scheduled',
        appointmentDate: newBookingDate,
        appointmentTime: newBookingTime,
        createdAt: new Date().toISOString(),
      };
      onAddQueue(newQueue);
      setShowNewBookingModal(false);
      setNewBookingMode('existing');
      setNewBookingQuery('');
      setNewBookingName('');
      setNewBookingPhone('');
      setNewBookingSelectedPatientId(null);
      setNewBookingServiceId('');
      setNewBookingDate(new Date().toISOString().split('T')[0]);
      setNewBookingTime('09:00');
      if (patientCreds) setJustAddedPatientCreds(patientCreds);
    } finally {
      setIsSavingNewBooking(false);
    }
  };

  // Warehouse stock for the procedure's material recipe is drawn down by the
  // server on the status -> completed transition (see
  // deductMaterialsForCompletedQueue in server.ts), so that completing from the
  // Telegram bot or any other surface deducts identically. Nothing extra to do
  // here beyond the status change itself.
  const handleCompleteQueue = (q: QueueItem) => {
    if (q?.id) onUpdateQueueStatus(q.id, "completed");
  };

  const handleExportPatientsCsv = () => {
    const header = ["Ism", "Telefon", "Tug'ilgan sana", "Pasport", "Tashriflar soni"];
    const rows = filteredClinicPatients.map((p) => [
      decodeLegacyEntities(p.fullName) || "",
      decodeLegacyEntities(p.phone) || "",
      p.birthDate || "",
      decodeLegacyEntities(p.passportSerial) || "",
      String((p.clinicVisits || []).length),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bemorlar_${effectiveClinicId || "klinika"}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkTelegramMessage = async () => {
    const text = window.prompt("Barcha Telegram ulangan bemorlarga yuboriladigan xabar matnini kiriting:");
    if (!text || !text.trim()) return;
    const recipients = clinicPatients.filter((p) => p.telegramChatId);
    if (recipients.length === 0) {
      window.alert("Telegram ulangan bemorlar topilmadi.");
      return;
    }
    setIsSendingBulkTelegram(true);
    try {
      const res = await fetch('/api/telegram/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatIds: recipients.map((p) => p.telegramChatId), text: text.trim() }),
      });
      const data = await res.json();
      window.alert(data.ok ? `${data.sent} / ${data.total} bemorga xabar yuborildi.` : `Xatolik: ${data.error || 'Nomalum xato'}`);
    } catch (e: any) {
      window.alert(`Xatolik: ${e.message}`);
    } finally {
      setIsSendingBulkTelegram(false);
    }
  };

  // Cross-clinic patient lookup: a patient's real medical history follows them
  // regardless of which clinic they registered at (searched by phone or passport).
  const handleCrossClinicSearch = async () => {
    const q = crossClinicQuery.trim();
    if (!q) return;
    setCrossClinicSearching(true);
    setCrossClinicSearched(false);
    try {
      const digits = q.replace(/\D/g, "");
      const params = digits.length >= 7 ? `phone=${encodeURIComponent(digits)}` : `passport=${encodeURIComponent(q)}`;
      const res = await fetch(`/api/patients/search?${params}`);
      const data = res.ok ? await res.json() : [];
      setCrossClinicResults(data);
    } catch (err) {
      console.warn("[DoctorDashboard] Cross-clinic search failed:", err);
      setCrossClinicResults([]);
    } finally {
      setCrossClinicSearching(false);
      setCrossClinicSearched(true);
    }
  };

  const handleAddVisitToThisClinic = async (patient: Patient) => {
    if (!effectiveClinicId) return;
    setIsAddingCrossClinicVisit(true);
    try {
      const newVisit = {
        id: "visit_" + Math.random().toString(36).slice(2, 10),
        date: new Date().toISOString(),
        doctorId: currentDoctor?.id || "",
        doctorName: currentDoctor?.name || "",
        serviceId: "",
        serviceName: "Boshqa klinikadan qabul qilindi",
        clinicId: effectiveClinicId,
      };
      const updatedPatient = {
        ...patient,
        clinicVisits: [...(patient.clinicVisits || []), newVisit],
      };
      await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...staffAuthHeaders() },
        body: JSON.stringify(updatedPatient),
      });
      setCrossClinicViewPatient(null);
      setShowCrossClinicSearch(false);
      setSelectedPatientId(patient.id);
      setActiveView("bemorlar");
    } catch (err) {
      console.warn("[DoctorDashboard] Failed to add cross-clinic visit:", err);
    } finally {
      setIsAddingCrossClinicVisit(false);
    }
  };

  // Avatar (real profile picture, synced from currentDoctor below) — actual
  // profile editing/password change lives in the real SettingsView component
  // (see the "sozlamalar" tab), not here.
  const [avatarUrl, setAvatarUrl] = useState(currentDoctor?.image || "");

  // "Rejalashtirilgan" week-table navigation: 0 = the current ISO week
  // (Monday-Sunday), negative/positive shifts by whole weeks.
  const [scheduleWeekOffset, setScheduleWeekOffset] = useState(0);

  const [scheduleModal, setScheduleModal] = useState<{isOpen: boolean, queueId: string | null}>({isOpen: false, queueId: null});
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleServiceId, setScheduleServiceId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // The sidebar used to be a normal flex child at all widths — on a 320-375px
  // phone even the "collapsed" 80px state ate a chunk of the screen, and the
  // "expanded" 280px state left almost nothing for content. Below md (768px)
  // it now renders as an off-canvas drawer instead (same pattern PatientPanel
  // already uses). Tracked in JS rather than relying purely on Tailwind's
  // responsive variants for the transform — this project's Tailwind v4 setup
  // doesn't reliably apply md:-prefixed transform utilities (see PatientPanel).
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => setIsDesktopViewport(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // "Yangi bandlash" — book a patient (existing or new) for a chosen future
  // date/time directly, without needing an already-existing queue ticket first
  // (unlike scheduleModal above, which only reschedules an existing one). Reused
  // identically from the Rejalashtirilgan tab, the Navbatlar tab, and the
  // Bemorlar tab's quick actions — one shared modal/state, three entry points.
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [newBookingQuery, setNewBookingQuery] = useState('');
  const [newBookingName, setNewBookingName] = useState('');
  const [newBookingPhone, setNewBookingPhone] = useState('');
  // "Yangi bandlash" books an existing patient — it must not also be a second
  // way to create one. Set only by picking a search result; name/phone are
  // read-only until then, so there's no free-text path left that could
  // silently upsert a new Patient record (that's "Yangi bemor qo'shish"'s job
  // alone now).
  const [newBookingSelectedPatientId, setNewBookingSelectedPatientId] = useState<string | null>(null);
  // "existing" searches/picks a real Patient record (the default). "new"
  // registers one on the spot — added so clicking an empty Rejalashtirilgan
  // slot for a walk-in/first-time caller doesn't force a detour through
  // "Yangi bemor qo'shish" and back. Only relevant outside edit mode.
  const [newBookingMode, setNewBookingMode] = useState<'existing' | 'new'>('existing');
  const [newBookingServiceId, setNewBookingServiceId] = useState('');
  const [newBookingServiceQuery, setNewBookingServiceQuery] = useState('');
  const [newBookingDate, setNewBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBookingTime, setNewBookingTime] = useState('09:00');
  const [isSavingNewBooking, setIsSavingNewBooking] = useState(false);
  // True when the modal was opened by clicking a specific empty slot in the
  // Rejalashtirilgan grid — date/time are then shown read-only instead of
  // editable, since the whole point of the grid is to stop free-typed times.
  const [newBookingSlotLocked, setNewBookingSlotLocked] = useState(false);
  // Set when the same modal was opened to edit an existing slot instead of
  // creating a new one — patient identity stays fixed (that's the Patient
  // record, not this modal's job); only service/date/time are re-submitted
  // through onUpdateQueueStatus rather than onAddQueue.
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [editingQueueStatus, setEditingQueueStatus] = useState<QueueItem['status']>('scheduled');

  // Doctor-editable weekly working-hours used to generate the Rejalashtirilgan
  // time-slot grid. Falls back to a clinic-typical default when the doctor
  // hasn't customized it yet.
  const DEFAULT_WORKING_HOURS = { startTime: '08:00', endTime: '18:00', slotMinutes: 60, lunchStart: '13:00', lunchEnd: '14:00', autoQueue: true };
  const [showScheduleSettingsModal, setShowScheduleSettingsModal] = useState(false);
  const [scheduleSettingsStart, setScheduleSettingsStart] = useState(DEFAULT_WORKING_HOURS.startTime);
  const [scheduleSettingsEnd, setScheduleSettingsEnd] = useState(DEFAULT_WORKING_HOURS.endTime);
  const [scheduleSettingsInterval, setScheduleSettingsInterval] = useState(DEFAULT_WORKING_HOURS.slotMinutes);
  const [scheduleSettingsLunchEnabled, setScheduleSettingsLunchEnabled] = useState(true);
  const [scheduleSettingsLunchStart, setScheduleSettingsLunchStart] = useState(DEFAULT_WORKING_HOURS.lunchStart);
  const [scheduleSettingsLunchEnd, setScheduleSettingsLunchEnd] = useState(DEFAULT_WORKING_HOURS.lunchEnd);
  const [scheduleSettingsAutoQueue, setScheduleSettingsAutoQueue] = useState(true);
  const [isSavingScheduleSettings, setIsSavingScheduleSettings] = useState(false);
  // Searches the WHOLE clinic roster, not just this doctor's own patients: booking
  // is itself the mechanism that assigns a patient to a doctor (POST /api/queues
  // sets primaryDoctorId), so restricting the search to patients you already own
  // was a catch-22 — you couldn't book anyone new, and nobody new could become
  // yours. Only name/phone are exposed here, never medical history.
  const newBookingSearchResults = useMemo(() => {
    const q = newBookingQuery.trim().toLowerCase();
    if (!q) return [];
    // Digits-only comparison so "+998 90 123" matches a stored "+998901234567";
    // guarded because "".includes("") is true and would match every patient.
    const qDigits = q.replace(/\D/g, "");
    return clinicPatients
      .filter((p) => {
        const name = (decodeLegacyEntities(p.fullName) || "").toLowerCase();
        const phoneDigits = (p.phone || "").replace(/\D/g, "");
        return name.includes(q) || (qDigits.length > 0 && phoneDigits.includes(qDigits));
      })
      .slice(0, 8);
  }, [clinicPatients, newBookingQuery]);

  // Doctor's active working-hours (their own saved value, or the clinic-typical
  // default) — drives both the Rejalashtirilgan time-slot grid and the header
  // "Yangi bandlash" button's slot picker.
  const doctorWorkingHours = currentDoctor?.workingHours || DEFAULT_WORKING_HOURS;

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const minutesToTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  // Fixed list of "HH:MM" slots from startTime up to (not including) endTime,
  // stepped by slotMinutes — e.g. 08:00,09:00,...,17:00 for the default hours.
  const scheduleSlots = useMemo(() => {
    const startMin = timeToMinutes(doctorWorkingHours.startTime);
    const endMin = timeToMinutes(doctorWorkingHours.endTime);
    const step = doctorWorkingHours.slotMinutes || 60;
    const slots: string[] = [];
    for (let m = startMin; m < endMin; m += step) slots.push(minutesToTime(m));
    return slots;
  }, [doctorWorkingHours.startTime, doctorWorkingHours.endTime, doctorWorkingHours.slotMinutes]);

  const isLunchSlot = (slotTime: string) => {
    if (!doctorWorkingHours.lunchStart || !doctorWorkingHours.lunchEnd) return false;
    const m = timeToMinutes(slotTime);
    return m >= timeToMinutes(doctorWorkingHours.lunchStart) && m < timeToMinutes(doctorWorkingHours.lunchEnd);
  };

  // A queue item belongs to a slot if its appointmentTime falls anywhere within
  // [slot, nextSlot) — a range match, not exact equality, so appointments
  // booked before this feature existed (arbitrary times) still land in the
  // right cell instead of disappearing from the grid.
  const getQueueSlot = (appointmentTime?: string) => {
    if (!appointmentTime || scheduleSlots.length === 0) return null;
    const m = timeToMinutes(appointmentTime);
    // Clamp to the first slot instead of returning null for times before the
    // working day starts — otherwise a legacy appointment booked outside the
    // doctor's current hours would silently vanish from the grid entirely.
    if (m < timeToMinutes(scheduleSlots[0])) return scheduleSlots[0];
    let match: string = scheduleSlots[0];
    for (const slot of scheduleSlots) {
      if (m >= timeToMinutes(slot)) match = slot;
      else break;
    }
    return match;
  };

  // Opens the booking modal either "locked" to a specific grid slot (date/time
  // pre-set and shown read-only) or "unlocked" for the standalone header
  // button (date still pickable, time restricted to a dropdown of real slots).
  const openNewBookingModal = (locked: boolean, date?: string, time?: string) => {
    setEditingQueueId(null);
    setNewBookingSlotLocked(locked);
    setNewBookingMode('existing');
    setNewBookingQuery('');
    setNewBookingName('');
    setNewBookingPhone('');
    setNewBookingSelectedPatientId(null);
    setNewBookingServiceId('');
    setNewBookingServiceQuery('');
    setNewBookingDate(date || new Date().toISOString().split('T')[0]);
    setNewBookingTime(time || scheduleSlots.find((s) => !isLunchSlot(s)) || '09:00');
    setShowNewBookingModal(true);
  };

  // Reuses the same modal for an existing slot — locked (like a grid-opened
  // booking) since the point is to change service/date/time, not re-type a
  // patient who's already attached to this queue entry.
  const openEditQueueModal = (q: QueueItem) => {
    setEditingQueueId(q.id!);
    setEditingQueueStatus(q.status);
    // Unlocked, not locked: locked mode makes date/time read-only static text
    // (used for the grid's "book this exact slot" flow) — editing an existing
    // appointment needs date/time to stay changeable, that's the whole point.
    setNewBookingSlotLocked(false);
    setNewBookingMode('existing');
    setNewBookingQuery('');
    setNewBookingName(q.patientName || '');
    setNewBookingPhone(q.patientPhone || '');
    setNewBookingServiceId(q.serviceId || '');
    setNewBookingServiceQuery('');
    setNewBookingDate(q.appointmentDate || new Date().toISOString().split('T')[0]);
    setNewBookingTime(q.appointmentTime || scheduleSlots.find((s) => !isLunchSlot(s)) || '09:00');
    setShowNewBookingModal(true);
  };

  const openScheduleSettingsModal = () => {
    setScheduleSettingsStart(doctorWorkingHours.startTime);
    setScheduleSettingsEnd(doctorWorkingHours.endTime);
    setScheduleSettingsInterval(doctorWorkingHours.slotMinutes);
    setScheduleSettingsLunchEnabled(!!(doctorWorkingHours.lunchStart && doctorWorkingHours.lunchEnd));
    setScheduleSettingsLunchStart(doctorWorkingHours.lunchStart || DEFAULT_WORKING_HOURS.lunchStart);
    setScheduleSettingsLunchEnd(doctorWorkingHours.lunchEnd || DEFAULT_WORKING_HOURS.lunchEnd);
    setScheduleSettingsAutoQueue(doctorWorkingHours.autoQueue !== false);
    setShowScheduleSettingsModal(true);
  };

  const runSaveScheduleSettings = async () => {
    if (!currentDoctor?.id || !onUpdateDoctorDetails) return;
    setIsSavingScheduleSettings(true);
    try {
      const ok = await onUpdateDoctorDetails(currentDoctor.id, {
        workingHours: {
          startTime: scheduleSettingsStart,
          endTime: scheduleSettingsEnd,
          slotMinutes: scheduleSettingsInterval,
          lunchStart: scheduleSettingsLunchEnabled ? scheduleSettingsLunchStart : undefined,
          lunchEnd: scheduleSettingsLunchEnabled ? scheduleSettingsLunchEnd : undefined,
          autoQueue: scheduleSettingsAutoQueue,
        },
      });
      if (ok) setShowScheduleSettingsModal(false);
    } finally {
      setIsSavingScheduleSettings(false);
    }
  };


  // Sync state if currentUser changes
  React.useEffect(() => {
    if (currentUser?.id) {
      setActiveDoctorId(currentUser.id);
      const match = doctors.find((d) => d.id === currentUser.id);
      if (match) {
        setAvatarUrl(match.image);
      }
    }
  }, [currentUser, doctors]);

  // Real per-patient reminders (Reminder type — doctor-authored notes with an
  // optional dueDate, manually "sent" to the patient over Telegram; no background
  // scheduler exists, matching the /api/reminders backend this already reuses
  // from Statistics.tsx's real Reminders tab).
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [reminderScopeTab, setReminderScopeTab] = useState<'barchasi' | 'menda'>('menda');
  const [reminderStatusFilter, setReminderStatusFilter] = useState('');
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newReminderPatientQuery, setNewReminderPatientQuery] = useState('');
  const [newReminderPatientId, setNewReminderPatientId] = useState('');
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderDueDate, setNewReminderDueDate] = useState('');
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [reminderActionId, setReminderActionId] = useState<string | null>(null);

  const fetchReminders = React.useCallback(() => {
    if (!effectiveClinicId) return;
    setRemindersLoading(true);
    fetch(`/api/reminders?clinicId=${encodeURIComponent(effectiveClinicId)}`, {
      headers: staffToken ? { Authorization: `Bearer ${staffToken}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReminders(Array.isArray(data) ? data : []))
      .catch((err) => console.warn("[DoctorDashboard] Failed to load reminders:", err))
      .finally(() => setRemindersLoading(false));
  }, [effectiveClinicId, staffToken]);

  React.useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const newReminderPatientResults = useMemo(() => {
    const q = newReminderPatientQuery.trim().toLowerCase();
    if (!q) return [];
    return myPatients
      .filter((p) => (p.fullName || "").toLowerCase().includes(q) || (p.phone || "").includes(q))
      .slice(0, 6);
  }, [myPatients, newReminderPatientQuery]);

  const handleAddReminder = async () => {
    if (!newReminderPatientId || !newReminderText.trim() || !effectiveClinicId || !currentDoctor?.id) return;
    setIsSavingReminder(true);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { Authorization: `Bearer ${staffToken}` } : {}),
        },
        body: JSON.stringify({
          clinicId: effectiveClinicId,
          doctorId: currentDoctor.id,
          patientId: newReminderPatientId,
          text: newReminderText.trim(),
          dueDate: newReminderDueDate || undefined,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setReminders((prev) => [saved, ...prev]);
        setShowAddReminderModal(false);
        setNewReminderPatientQuery('');
        setNewReminderPatientId('');
        setNewReminderText('');
        setNewReminderDueDate('');
      }
    } catch (err) {
      console.warn("[DoctorDashboard] Failed to add reminder:", err);
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleReminderStatusChange = async (id: string, status: 'sent' | 'done') => {
    setReminderActionId(id);
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { Authorization: `Bearer ${staffToken}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status, sentAt: status === 'sent' ? new Date().toISOString() : r.sentAt } : r)));
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || t("xatolik yuz berdi"));
      }
    } catch (err) {
      console.warn("[DoctorDashboard] Failed to update reminder:", err);
    } finally {
      setReminderActionId(null);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm(t("eslatmani o'chirishni tasdiqlaysizmi?"))) return;
    setReminderActionId(id);
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
        headers: staffToken ? { Authorization: `Bearer ${staffToken}` } : {},
      });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        if (selectedReminderId === id) setSelectedReminderId(null);
      }
    } catch (err) {
      console.warn("[DoctorDashboard] Failed to delete reminder:", err);
    } finally {
      setReminderActionId(null);
    }
  };

  // Queues specifically directed to this doctor
  const doctorQueues = queues.filter(
    (q) => q.doctorId === activeDoctorId && (!effectiveClinicId || q.clinicId === effectiveClinicId)
  );

  // States: pending vs calling vs in_progress vs completed
  const pendingQueues = doctorQueues.filter((q) => q.status === "pending");
  const activeConsultingQueues = doctorQueues.filter(
    (q) => q.status === "calling" || q.status === "in_progress",
  );
  const completedQueues = doctorQueues.filter((q) => q.status === "completed");
  const cancelledQueues = doctorQueues.filter((q) => q.status === "cancelled");
  const scheduledQueues = doctorQueues.filter((q) => q.status === "scheduled");
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueScheduledQueues = scheduledQueues.filter(
    (q) => q.appointmentDate && q.appointmentDate < todayStr,
  );

  // Auto-queue: once a scheduled appointment's slot time arrives, advance it on
  // its own so the doctor doesn't have to start every appointment by hand.
  // Only ever advances to 'calling' (which the server turns into the patient's
  // "your turn" Telegram notice) — never straight to 'in_progress', because a
  // doctor running late with the previous patient would otherwise get the next
  // one recorded as "in treatment" while they're still in the waiting room,
  // corrupting visit history and the daily revenue rollup.
  //
  // Runs client-side while the panel is open — this app has no server-side job
  // runner.
  //
  // Everything the tick reads is held in a ref rather than in the dependency
  // array: doctorQueues is a fresh array every render and onUpdateQueueStatus
  // isn't memoised, so depending on them directly tore the interval down and
  // rebuilt it on every render, meaning the 60s timer never actually elapsed
  // and the tick effectively ran on every render instead.
  const autoQueueRef = useRef({ doctorQueues, onUpdateQueueStatus });
  autoQueueRef.current = { doctorQueues, onUpdateQueueStatus };
  const autoQueueEnabled = doctorWorkingHours.autoQueue !== false;

  useEffect(() => {
    if (!autoQueueEnabled || !activeDoctorId) return;

    const tick = () => {
      const { doctorQueues: queueSnapshot, onUpdateQueueStatus: updateStatus } = autoQueueRef.current;

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const todaysQueues = queueSnapshot.filter((q) => (q.appointmentDate || q.createdAt?.slice(0, 10)) === today);

      // Never call a second patient while one is already being seen. Scoped to
      // today: an appointment abandoned in 'in_progress' weeks ago would
      // otherwise disable auto-queue permanently, silently and with no hint.
      if (todaysQueues.some((q) => q.status === "calling" || q.status === "in_progress")) return;

      const next = todaysQueues
        .filter(
          (q) =>
            q.status === "scheduled" &&
            q.appointmentDate === today &&
            q.appointmentTime &&
            // Due, but not stale. Without an upper bound the earliest still-
            // 'scheduled' slot wins, so a morning no-show left untouched would
            // get called hours later — telling a patient who went home that the
            // doctor is waiting, and then blocking the guard above for the rest
            // of the day so the person actually in the chair is never called.
            timeToMinutes(q.appointmentTime) <= nowMinutes &&
            nowMinutes - timeToMinutes(q.appointmentTime) <= AUTO_QUEUE_GRACE_MINUTES,
        )
        .sort((a, b) => (a.appointmentTime || "").localeCompare(b.appointmentTime || ""))[0];

      if (next?.id) updateStatus(next.id, "calling", undefined, undefined, undefined, undefined, { silent: true });
    };

    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [autoQueueEnabled, activeDoctorId]);

  // Dashboard tab's "BUGUNGI ..." (today's) cards must reflect only today's
  // activity — doctorQueues/pendingQueues/completedQueues above are all-time
  // totals used by the Navbatlar tab's "Barcha navbatlar" summary, so a
  // separate today-scoped subset is needed here instead of reusing them.
  const todayDoctorQueues = doctorQueues.filter(
    (q) => (q.appointmentDate || q.createdAt?.slice(0, 10)) === todayStr,
  );
  const todayPendingQueues = todayDoctorQueues.filter((q) => q.status === "pending");
  const todayActiveConsultingQueues = todayDoctorQueues.filter(
    (q) => q.status === "calling" || q.status === "in_progress",
  );
  const todayCompletedQueues = todayDoctorQueues.filter((q) => q.status === "completed");
  const todayNewPatients = todayPendingQueues.filter((q) => {
    const priorVisits = queues.filter(
      (other) => other.patientName === q.patientName && other.status === "completed",
    );
    return priorVisits.length === 0;
  });

  // "Eslatmalar" tab: real per-patient reminders, scoped either to this doctor's
  // own patients or the whole clinic, filtered by status, with real due-date-based
  // summary counts (no fabricated numbers).
  const scopedReminders = reminders.filter((r) => reminderScopeTab === 'barchasi' || r.doctorId === currentDoctor?.id);
  const filteredReminders = scopedReminders
    .filter((r) => !reminderStatusFilter || r.status === reminderStatusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const in7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const in30DaysStr = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const reminderStats = {
    total: scopedReminders.length,
    today: scopedReminders.filter((r) => r.dueDate === todayStr).length,
    in7Days: scopedReminders.filter((r) => r.dueDate && r.dueDate >= todayStr && r.dueDate <= in7DaysStr).length,
    in30Days: scopedReminders.filter((r) => r.dueDate && r.dueDate >= todayStr && r.dueDate <= in30DaysStr).length,
    overdue: scopedReminders.filter((r) => r.dueDate && r.dueDate < todayStr && r.status !== 'done').length,
  };
  const selectedReminder = filteredReminders.find((r) => r.id === selectedReminderId) || filteredReminders[0] || null;
  const selectedReminderPatient = selectedReminder ? clinicPatients.find((p) => p.id === selectedReminder.patientId) || null : null;

  // "Rejalashtirilgan" tab: a real Monday-Sunday weekly schedule table (not just
  // a chronological agenda) — every scheduled appointment is placed under its
  // actual weekday column for the currently-viewed week, sorted by time within
  // the day. Navigable via scheduleWeekOffset (0 = this week).
  const WEEKDAY_NAMES_UZ = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  const scheduleWeekDays = (() => {
    const now = new Date();
    const jsDay = now.getDay(); // 0=Sun..6=Sat
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + scheduleWeekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { date: dateStr, dateObj: d, weekday: WEEKDAY_NAMES_UZ[d.getDay()] };
    });
  })();
  // Everything with an appointmentDate stays on the weekly table regardless of
  // status — a completed or cancelled visit is still part of that day's real
  // history, not something that should vanish once the doctor finishes it.
  const scheduleWeekGrid = scheduleWeekDays.map((day) => ({
    ...day,
    items: doctorQueues
      .filter((q) => q.appointmentDate === day.date)
      .sort((a, b) => (a.appointmentTime || "").localeCompare(b.appointmentTime || "")),
  }));
  const formatDdMm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  const scheduleWeekLabel = `${formatDdMm(scheduleWeekDays[0].dateObj)} — ${formatDdMm(scheduleWeekDays[6].dateObj)}.${scheduleWeekDays[6].dateObj.getFullYear()}`;

  const visibleQueues = doctorQueues
    .filter((q) => queueListRange === 'all' || (q.appointmentDate || q.createdAt.slice(0, 10)) === todayStr)
    .filter((q) => !queueListStatusFilter || q.status === queueListStatusFilter)
    .filter((q) => {
      const query = queueListSearch.trim().toLowerCase();
      if (!query) return true;
      return (
        q.patientName.toLowerCase().includes(query) ||
        (q.patientPhone || '').includes(query) ||
        String(q.number || '').includes(query)
      );
    });

  // The patient currently being called/consulted, resolved to a real patient record
  // (used by the "Bemor kartasi" widget instead of a hardcoded sample patient)
  const activeConsultQueue = activeConsultingQueues[0] || null;
  const activeConsultPatient = activeConsultQueue
    ? clinicPatients.find((p) => p.id === resolvePatientIdFromQueue(activeConsultQueue)) || null
    : null;

  // Real treatment plan for the active consult patient (mirrors TreatmentPlan.tsx's data source)
  const [activePatientPlanItems, setActivePatientPlanItems] = useState<TreatmentItem[]>([]);
  useEffect(() => {
    if (!activeConsultPatient?.id) {
      setActivePatientPlanItems([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, `patients/${activeConsultPatient.id}/treatmentPlans`),
      (snapshot) => {
        const data: TreatmentItem[] = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as TreatmentItem));
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivePatientPlanItems(data);
      },
      () => setActivePatientPlanItems([])
    );
    return () => unsub();
  }, [activeConsultPatient?.id]);

  // Real X-rays for the active consult patient (mirrors XRayCenter.tsx's data source)
  const [activePatientXrays, setActivePatientXrays] = useState<XRay[]>([]);
  useEffect(() => {
    if (!activeConsultPatient?.id) {
      setActivePatientXrays([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, `patients/${activeConsultPatient.id}/xrays`),
      (snapshot) => {
        const data: XRay[] = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as XRay));
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivePatientXrays(data);
      },
      () => setActivePatientXrays([])
    );
    return () => unsub();
  }, [activeConsultPatient?.id]);

  // Smart Separation of patients: "Yangi mijozlar" & "Doimiy mijozlar"
  const newPatients = pendingQueues.filter(q => {
    const priorVisits = queues.filter(
      other => other.patientName === q.patientName && other.status === "completed"
    );
    return priorVisits.length === 0;
  });
  const regularPatients = pendingQueues.filter(q => {
    const priorVisits = queues.filter(
      other => other.patientName === q.patientName && other.status === "completed"
    );
    return priorVisits.length > 0;
  });

  const getServicePrice = (sId: string) => {
    const srv = services.find((s) => s.id === sId);
    return srv ? srv.price : 0;
  };

  const getServiceInfo = (sId: string) => {
    return services.find((s) => s.id === sId);
  };

  const dailyRevenue = todayCompletedQueues.reduce(
    (sum, item) => sum + getServicePrice(item.serviceId),
    0,
  );
  const avgRating = currentDoctor ? currentDoctor.rating : 4.7;

  // On mobile the drawer is either fully open or fully closed — no point
  // opening it into the icon-only "collapsed" state, so its content always
  // renders expanded there regardless of the desktop collapse toggle.
  const sidebarExpanded = isDesktopViewport ? isSidebarOpen : true;

  const SidebarItem = ({ icon: Icon, label, id, badge }: any) => {
    const isActive = activeView === id;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveView(id);
          setIsSidebarOpen(false);
          setIsMobileNavOpen(false);
        }}
        className={`w-full flex items-center ${sidebarExpanded ? 'justify-between px-4' : 'justify-center px-0'} py-3 rounded-xl transition-all ${
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
            : "text-slate-300 hover:bg-[#1a2b56] hover:text-white"
        }`}
        title={!sidebarExpanded ? label : ""}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 shrink-0" />
          {sidebarExpanded && <span className="font-semibold text-sm">{label}</span>}
        </div>
        {badge && sidebarExpanded && (
          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans overflow-hidden">
      {/* Mobile-only backdrop, tap to close the drawer */}
      {isMobileNavOpen && !isDesktopViewport && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
      {/* SIDEBAR — normal in-flow flex child on desktop (collapsible 80px/280px,
          as before); an off-canvas drawer below md, since even the "collapsed"
          80px state left too little room for content on a 320-375px phone. */}
      <div
        className={`${isDesktopViewport ? (isSidebarOpen ? 'w-[280px]' : 'w-[80px]') : 'w-[280px]'} transition-all duration-300 ease-in-out bg-[#101b33] text-white flex flex-col shrink-0 h-full overflow-y-auto custom-scrollbar cursor-pointer group z-40`}
        style={{
          position: isDesktopViewport ? 'static' : 'fixed',
          top: 0, bottom: 0, left: 0,
          transform: isDesktopViewport || isMobileNavOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        onClick={() => !isSidebarOpen && isDesktopViewport && setIsSidebarOpen(true)}
      >
        {/* Profile Card */}
        <div className={`p-6 ${!sidebarExpanded ? 'px-2 flex flex-col items-center' : ''}`}>
          <div className={`flex items-center ${sidebarExpanded ? 'gap-3 mb-8' : 'justify-center mb-8'}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white shrink-0"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                fill="currentColor"
              />
              <path
                d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                fill="currentColor"
              />
            </svg>
            {sidebarExpanded && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-bold text-lg leading-tight tracking-tight">
                  DStoma
                </h1>
                <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase">
                  Navbati
                </p>
              </div>
            )}
          </div>
          <div className={`flex items-center ${sidebarExpanded ? 'gap-3' : 'justify-center'}`}>
            <img
              src={avatarUrl || currentDoctor?.image}
              alt={currentDoctor?.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://api.dicebear.com/7.x/adventurer/svg?seed=" +
                  currentDoctor?.name;
              }}
            />
            {sidebarExpanded && (
              <div className="overflow-hidden whitespace-nowrap">
                <h2 className="font-bold text-[13px] leading-tight text-white mb-0.5 truncate max-w-[150px]">
                  {currentDoctor?.name || "Dr. Asilbek Xolmirzayev"}
                </h2>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {t("Stomatolog-ortoped")}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {t("onlayn")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className={`flex-1 px-4 py-2 space-y-1 ${!sidebarExpanded ? 'px-2' : ''}`}>
          <SidebarItem icon={Home} label={t("Dashboard")} id="dashboard" />
          <SidebarItem icon={List} label={t("Navbatlar")} id="navbatlar" />
          <SidebarItem icon={CalendarClock} label={t("Rejalashtirilgan")} id="rejalashtirilgan" />
          <SidebarItem icon={Users} label={t("Bemorlar")} id="bemorlar" />
          <SidebarItem icon={Bell} label={t("Eslatmalar")} id="eslatmalar" />
          <SidebarItem icon={ClipboardCheck} label={t("Muolajalar")} id="muolajalar" />
          <SidebarItem icon={Package} label={t("Material va Anjomlar")} id="materiallar" />
          <SidebarItem icon={BarChart2} label={t("Statistika")} id="statistika" />
          <SidebarItem icon={Settings} label={t("sozlamalar")} id="sozlamalar" />
        </div>

        {/* Footer Area */}
        <div className={`p-4 mt-auto space-y-2 ${!sidebarExpanded ? 'px-2' : ''}`}>
          {sidebarExpanded && (
            <div className="bg-[#17254d] p-3 rounded-xl border border-white/5 relative">
              <span className="text-[10px] text-slate-400 block mb-1 font-semibold">
                {t("klinika rejimi")}
              </span>
              <div className="flex items-center justify-between text-white text-xs font-semibold cursor-pointer">
                <span>Smile Dentistry</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout ? onLogout() : (setActiveTab && setActiveTab("bemor"));
            }}
            className={`w-full flex items-center ${sidebarExpanded ? 'gap-3 px-3' : 'justify-center px-0'} py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer rounded-xl`}
            title={!sidebarExpanded ? t("chiqish") : ""}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarExpanded && <span className="text-sm font-semibold">{t("chiqish")}</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <div className="bg-white h-[72px] border-b border-slate-200 shrink-0 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-xl text-slate-800 capitalize tracking-tight flex items-center gap-2">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer hidden md:block"
              >
                <Menu className="w-5 h-5 text-slate-400" />
              </button>
              {VIEW_TITLES[activeView] ? t(VIEW_TITLES[activeView]) : activeView.replace("_", " ")}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {myClinicIds.length > 1 && (
              <select
                value={effectiveClinicId || ""}
                onChange={(e) => setActiveDoctorClinicId?.(e.target.value)}
                className="hidden md:block bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full py-2 px-4 outline-none cursor-pointer"
                title={t("faol klinikani tanlang")}
              >
                {myClinicIds.map((cid) => {
                  const c = clinics.find((cl) => cl.id === cid);
                  return (
                    <option key={cid} value={cid}>
                      {c?.name || cid}
                    </option>
                  );
                })}
              </select>
            )}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder={t("bemor qidirish...")}
                className="w-64 bg-slate-100 border border-transparent focus:border-blue-500/30 rounded-full py-2 pl-4 pr-10 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-700"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-2.5" />
            </div>
            {setLanguage && <LanguageSwitcher language={language} setLanguage={setLanguage} variant="light" />}
            <button
              onClick={() => setActiveView("eslatmalar")}
              className="relative p-2.5 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              title={t("barcha eslatmalar")}
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-100"></span>
            </button>
            <button
              onClick={handleBulkTelegramMessage}
              disabled={isSendingBulkTelegram}
              className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-full transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
              title={t("telegram'ga xabar yuborish")}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={`flex-1 relative ${
          activeView === "dental_chart" ? "overflow-hidden p-0" : "overflow-y-auto"
        } ${
          (activeView === "bemorlar" && selectedPatientId)
            ? "p-0" 
            : activeView !== "dental_chart" ? "p-6 md:p-8" : ""
        }`}>
          {activeView === "dashboard" && (
            <div className="space-y-6">
              <InstallAppBanner />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Top Cards */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {t("bugungi bemorlar")}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-800">
                      {todayDoctorQueues.length}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-500 mb-1">
                      +{todayNewPatients.length} {t("yangi")}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {t("hozir qabulda")}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col">
                    <span className="text-3xl font-black text-slate-800">
                      {todayActiveConsultingQueues.length}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {t("qabul davom etmoqda")}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {t("bugungi tushum")}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col">
                    <span className="text-2xl font-black text-slate-800">
                      {dailyRevenue.toLocaleString('uz-UZ').replace(/,/g, ' ')} <span className="text-sm">so'm</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {t("kutilayotgan")}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col">
                    <span className="text-3xl font-black text-slate-800">
                      {todayPendingQueues.length}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {t("navbatda")}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {t("tugatilgan qabul")}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col">
                    <span className="text-3xl font-black text-slate-800">
                      {todayCompletedQueues.length}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {t("bugun")}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {t("o'rtacha qabul vaqti")}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-black text-slate-800">
                      28
                    </span>
                    <span className="text-xs font-semibold text-slate-500 mb-1">
                      {t("daqiqa")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Layout rows */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bugungi Navbatlar */}
                <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-base">
                      {t("bugungi navbatlar")}
                    </h3>
                    <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors">
                      {t("barcha navbatlar")}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="font-medium pb-2">#</th>
                          <th className="font-medium pb-2">{t("vaqt")}</th>
                          <th className="font-medium pb-2">{t("bemor")}</th>
                          <th className="font-medium pb-2">{t("xizmat")}</th>
                          <th className="font-medium pb-2 text-right">
                            {t("holati")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {todayDoctorQueues.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                              {t("hozircha navbatda bemorlar yo'q")}
                            </td>
                          </tr>
                        ) : (
                          todayDoctorQueues.map((q, idx) => (
                            <tr key={q.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { const pid = resolvePatientIdFromQueue(q); if (pid) { setActiveView('bemorlar'); setSelectedPatientId(pid); } }}>
                              <td className="py-3 font-medium text-slate-500">{idx + 1}</td>
                              <td className="py-3 text-slate-500 font-medium">
                                {q.appointmentTime || (q.createdAt ? new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                              </td>
                              <td className="py-3 font-semibold text-slate-800">
                                {q.patientName}
                                <br />
                                <span className="text-[9px] text-slate-400 font-normal">
                                  {q.patientPhone}
                                </span>
                              </td>
                              <td className="py-3 text-slate-500 font-medium">
                                {services.find((s: any) => s.id === q.serviceId)?.name || t("ko'rik")}
                              </td>
                              <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                    q.status === 'in_progress' ? 'text-blue-600 bg-blue-50' :
                                    q.status === 'scheduled' ? 'text-purple-600 bg-purple-50' :
                                    q.status === 'completed' ? 'text-emerald-600 bg-emerald-50' :
                                    q.status === 'cancelled' ? 'text-rose-600 bg-rose-50' :
                                    'text-amber-600 bg-amber-50'
                                  }`}>
                                    {q.status === 'in_progress' ? 'Qabulda' :
                                     q.status === 'scheduled' ? 'Belgilangan' :
                                     q.status === 'completed' ? 'Yakunlangan' :
                                     q.status === 'cancelled' ? 'Bekor qilindi' : 'Kutmoqda'}
                                  </span>
                                  {q.status === 'pending' || q.status === 'scheduled' ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setScheduleServiceId(q.serviceId || '');
                                          setScheduleDate(q.appointmentDate || new Date().toISOString().split('T')[0]);
                                          setScheduleTime(q.appointmentTime || '09:00');
                                          setScheduleModal({ isOpen: true, queueId: q.id! });
                                        }}
                                        className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors tooltip"
                                        title={t("muolaja va vaqt belgilash")}
                                      >
                                        <CalendarClock className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => onUpdateQueueStatus(q.id!, 'in_progress')}
                                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors tooltip"
                                        title={t("qabulni boshlash")}
                                      >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                      </button>
                                    </>
                                  ) : q.status === 'in_progress' ? (
                                    <button 
                                      onClick={() => handleCompleteQueue(q)}
                                      className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors tooltip"
                                      title={t("yakunlash")}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>


                {/* Bemor Kartasi & Davolash Rejasi */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Bemor Kartasi */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 relative">
                    <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-slate-800 text-base mb-4">
                      {t("bemor kartasi")}
                    </h3>
                    {activeConsultQueue ? (
                      <>
                        <div className="flex items-center gap-3 mb-5">
                          <img
                            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${activeConsultPatient?.id || activeConsultQueue.id}`}
                            className="w-14 h-14 rounded-full bg-slate-100"
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              {decodeLegacyEntities(activeConsultPatient?.fullName) || activeConsultQueue.patientName}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              {activeConsultPatient?.birthDate || ""}
                            </p>
                            <p className="text-xs font-mono text-slate-600 mt-0.5 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {decodeLegacyEntities(activeConsultPatient?.phone) || activeConsultQueue.patientPhone || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-6">
                          <button className="flex-1 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center transition-colors">
                            <Phone className="w-4 h-4" />
                          </button>
                          <button className="flex-1 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center transition-colors">
                            <Send className="w-4 h-4" />
                          </button>
                          <button className="flex-1 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center transition-colors">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 text-[11px]">
                          <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span className="text-slate-500">{t("allergiya")}</span>
                            <span className="font-medium text-slate-800">
                              {decodeLegacyEntities(activeConsultPatient?.allergies) || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span className="text-slate-500">{t("kasalliklar")}</span>
                            <span className="font-medium text-slate-800">
                              {decodeLegacyEntities(activeConsultPatient?.chronicDiseases) || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t("shikoyat")}</span>
                            <span className="font-medium text-slate-800 text-right w-3/5">
                              {activeConsultQueue.complaint || "—"}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        {t("hozirda qabulda faol bemor yo'q")}
                      </p>
                    )}
                  </div>

                  {/* Davolash Rejasi */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800 text-base">
                        {t("davolash rejasi")}
                      </h3>
                      <button className="text-blue-600 flex items-center gap-1 text-[10px] font-bold hover:bg-blue-50 px-2 py-1 rounded">
                        <Plus className="w-3 h-3" /> {t("yangi reja")}
                      </button>
                    </div>
                    {activePatientPlanItems.length > 0 ? (
                      <>
                        <table className="w-full text-left text-[10px]">
                          <thead className="text-slate-400 border-b border-slate-50">
                            <tr>
                              <th className="pb-2 font-medium">{t("tish")}</th>
                              <th className="pb-2 font-medium">{t("muolaja")}</th>
                              <th className="pb-2 font-medium text-right">
                                {t("narx (so'm)")}
                              </th>
                              <th className="pb-2 font-medium text-right">
                                {t("holati")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium">
                            {activePatientPlanItems.map((item) => (
                              <tr key={item.id}>
                                <td className="py-2.5">{item.toothId}</td>
                                <td className="py-2.5 text-slate-800">
                                  {item.treatment}
                                </td>
                                <td className="py-2.5 text-right text-slate-800">
                                  {item.price.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-right">
                                  {item.status === "Completed" ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                                  ) : item.status === "Cancelled" ? (
                                    <span className="text-rose-500 font-bold">{t("bekor qilindi")}</span>
                                  ) : item.status === "In Progress" ? (
                                    <span className="text-blue-500 font-bold">{t("jarayonda")}</span>
                                  ) : (
                                    <span className="text-amber-500 font-bold">{t("kutmoqda")}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t border-slate-100">
                            <tr>
                              <td
                                colSpan={2}
                                className="pt-3 font-bold text-right text-slate-800 text-xs"
                              >
                                {t("jami:")}
                              </td>
                              <td
                                colSpan={2}
                                className="pt-3 font-bold text-right text-slate-800 text-xs"
                              >
                                {activePatientPlanItems
                                  .filter((i) => i.status !== "Cancelled")
                                  .reduce((sum, i) => sum + (i.price || 0), 0)
                                  .toLocaleString()}{" "}
                                so'm
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        <button
                          onClick={() => { setActiveView("bemorlar"); if (activeConsultPatient) setSelectedPatientId(activeConsultPatient.id); }}
                          className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          {t("to'liq rejani ko'rish")}
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        {activeConsultPatient ? t("ushbu bemor uchun davolash rejasi kiritilmagan") : t("faol bemor tanlanmagan")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "eslatmalar" && (
            <div className="space-y-6">
              {/* Real summary cards (counts derived from actual Reminder records) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{t("barcha eslatmalar")}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">{reminderStats.total}</span>
                      <span className="text-[10px] font-bold text-slate-400">{t("ta")}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{t("bugun")}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">{reminderStats.today}</span>
                      <span className="text-[10px] font-bold text-slate-400">{t("ta")}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                    <CalendarCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{t("7 kun ichida")}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">{reminderStats.in7Days}</span>
                      <span className="text-[10px] font-bold text-slate-400">{t("ta")}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                    <CalendarCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{t("30 kun ichida")}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">{reminderStats.in30Days}</span>
                      <span className="text-[10px] font-bold text-slate-400">{t("ta")}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{t("muddati o'tgan")}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">{reminderStats.overdue}</span>
                      <span className="text-[10px] font-bold text-slate-400">{t("ta")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: real reminder list */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReminderScopeTab('menda')}
                        className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-colors ${reminderScopeTab === 'menda' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {t("menda")}
                      </button>
                      <button
                        onClick={() => setReminderScopeTab('barchasi')}
                        className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-colors ${reminderScopeTab === 'barchasi' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {t("barchasi")}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={reminderStatusFilter}
                        onChange={(e) => setReminderStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none font-semibold"
                      >
                        <option value="">{t("barchasi")}</option>
                        <option value="pending">{t("kutilmoqda")}</option>
                        <option value="sent">{t("yuborildi")}</option>
                        <option value="done">{t("bajarildi")}</option>
                      </select>
                      <button
                        onClick={() => setShowAddReminderModal(true)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-md shadow-blue-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" /> {t("eslatma qo'shish")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {remindersLoading && reminders.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-10">{t("yuklanmoqda...")}</p>
                    ) : filteredReminders.length === 0 ? (
                      <div className="text-center py-10">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs text-slate-400">{t("hozircha eslatmalar yo'q")}</p>
                      </div>
                    ) : (
                      filteredReminders.map((r) => {
                        const pat = clinicPatients.find((p) => p.id === r.patientId);
                        const isOverdue = !!(r.dueDate && r.dueDate < todayStr && r.status !== 'done');
                        const isSelected = selectedReminder?.id === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => setSelectedReminderId(r.id)}
                            className={`border rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${isSelected ? 'border-blue-300 bg-blue-50/30' : isOverdue ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                          >
                            <div className="flex items-center gap-3 w-1/3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">
                                {(decodeLegacyEntities(pat?.fullName) || "?").trim().charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate">
                                  {decodeLegacyEntities(pat?.fullName) || t("noma'lum bemor")}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                                  <Phone className="inline w-3 h-3 mr-1" />
                                  {decodeLegacyEntities(pat?.phone) || "—"}
                                </p>
                              </div>
                            </div>
                            <div className="w-1/3 min-w-0">
                              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{r.text}</p>
                            </div>
                            <div className="w-1/6">
                              {r.dueDate ? (
                                <>
                                  <p className={`text-xs font-bold flex items-center gap-1.5 mb-1 ${isOverdue ? 'text-rose-500' : 'text-slate-800'}`}>
                                    <CalendarCheck2 className="w-3.5 h-3.5" /> {r.dueDate === todayStr ? t("bugun") : r.dueDate}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400">
                                    {WEEKDAY_NAMES_UZ[new Date(r.dueDate).getDay()]}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-slate-300">—</p>
                              )}
                            </div>
                            <div className="w-1/6 text-right">
                              {isOverdue ? (
                                <span className="inline-block bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                  {t("muddati o'tgan")}
                                </span>
                              ) : r.status === 'done' ? (
                                <span className="inline-block bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                  {t("bajarildi")}
                                </span>
                              ) : r.status === 'sent' ? (
                                <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                  {t("yuborildi")}
                                </span>
                              ) : (
                                <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                  {t("kutilmoqda")}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: details for the selected reminder */}
                <div className="w-full lg:w-[350px] shrink-0 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 text-base">{t("eslatma tafsilotlari")}</h3>
                  </div>

                  {!selectedReminder ? (
                    <p className="text-xs text-slate-400 text-center py-10">{t("eslatma tanlanmagan")}</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shrink-0">
                          {(decodeLegacyEntities(selectedReminderPatient?.fullName) || "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                            {decodeLegacyEntities(selectedReminderPatient?.fullName) || t("noma'lum bemor")}
                          </h4>
                          <p className="text-xs font-mono text-slate-600 font-medium flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {decodeLegacyEntities(selectedReminderPatient?.phone) || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs font-medium text-slate-600 border-b border-slate-100 pb-6 mb-6">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="flex items-center gap-2 text-slate-400">
                            <CalendarCheck2 className="w-4 h-4" /> {t("eslatma sanasi")}
                          </span>
                          <span className="text-slate-800 text-right">{selectedReminder.dueDate || "—"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="flex items-center gap-2 text-slate-400">
                            <CheckCircle className="w-4 h-4" /> {t("holati")}
                          </span>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedReminder.status === 'done' ? 'bg-emerald-50 text-emerald-600' : selectedReminder.status === 'sent' ? 'bg-blue-50 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>
                              {selectedReminder.status === 'done' ? t("bajarildi") : selectedReminder.status === 'sent' ? t("yuborildi") : t("kutilmoqda")}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 pt-2">
                          <span className="flex items-center gap-2 text-slate-400 mb-1">
                            <FileText className="w-4 h-4" /> {t("eslatma matni")}
                          </span>
                          <p className="text-slate-800 leading-snug">{selectedReminder.text}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <span className="flex items-center gap-2 text-slate-400">
                            <User className="w-4 h-4" /> {t("shifokor")}
                          </span>
                          <span className="text-slate-800 text-right">
                            {doctors.find((d) => d.id === selectedReminder.doctorId)?.name || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-bold text-slate-800 text-xs mb-4">{t("eslatma tarixi")}</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shrink-0 shadow-sm">
                              <Check className="w-3 h-3" />
                            </div>
                            <div className="flex-1 p-3 rounded border border-slate-100 bg-slate-50 text-[10px] font-medium text-slate-800 shadow-sm flex flex-col gap-1">
                              <span className="text-slate-400">{new Date(selectedReminder.createdAt).toLocaleString()}</span>
                              <span className="font-bold">{t("eslatma yaratildi")}</span>
                            </div>
                          </div>
                          {selectedReminder.sentAt && (
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white shrink-0 shadow-sm">
                                <Send className="w-3 h-3" />
                              </div>
                              <div className="flex-1 p-3 rounded border border-slate-100 bg-slate-50 text-[10px] font-medium text-slate-800 shadow-sm flex flex-col gap-1">
                                <span className="text-slate-400">{new Date(selectedReminder.sentAt).toLocaleString()}</span>
                                <span className="font-bold">{t("bemorga telegram orqali eslatildi")}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto space-y-3">
                        {selectedReminder.status === 'pending' && (
                          <button
                            onClick={() => handleReminderStatusChange(selectedReminder.id, 'sent')}
                            disabled={reminderActionId === selectedReminder.id}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-4 h-4" /> {t("telegram orqali yuborish")}
                          </button>
                        )}
                        {selectedReminder.status !== 'done' && (
                          <button
                            onClick={() => handleReminderStatusChange(selectedReminder.id, 'done')}
                            disabled={reminderActionId === selectedReminder.id}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" /> {t("bajarildi deb belgilash")}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReminder(selectedReminder.id)}
                          disabled={reminderActionId === selectedReminder.id}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> {t("o'chirish")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Add-reminder modal */}
              {showAddReminderModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-500" />
                        {t("eslatma qo'shish")}
                      </h3>
                      <button
                        onClick={() => setShowAddReminderModal(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("bemorni qidirish")} *</label>
                        <input
                          type="text"
                          value={newReminderPatientQuery}
                          onChange={(e) => {
                            setNewReminderPatientQuery(e.target.value);
                            setNewReminderPatientId('');
                          }}
                          placeholder={t("ism yoki telefon bo'yicha qidiring...")}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                        />
                        {!newReminderPatientId && newReminderPatientResults.length > 0 && (
                          <div className="mt-1.5 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                            {newReminderPatientResults.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setNewReminderPatientId(p.id);
                                  setNewReminderPatientQuery(decodeLegacyEntities(p.fullName) || '');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
                              >
                                <p className="text-xs font-bold text-slate-800">{decodeLegacyEntities(p.fullName)}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{decodeLegacyEntities(p.phone)}</p>
                              </button>
                            ))}
                          </div>
                        )}
                        {newReminderPatientId && (
                          <p className="mt-1.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {newReminderPatientQuery}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("eslatma matni")} *</label>
                        <textarea
                          value={newReminderText}
                          onChange={(e) => setNewReminderText(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800 h-20 resize-none"
                          placeholder={t("masalan: implant nazorati uchun qabulga kelish")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("muddat (ixtiyoriy)")}</label>
                        <input
                          type="date"
                          value={newReminderDueDate}
                          onChange={(e) => setNewReminderDueDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
                      <button
                        onClick={() => setShowAddReminderModal(false)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        {t("bekor qilish")}
                      </button>
                      <button
                        onClick={handleAddReminder}
                        disabled={!newReminderPatientId || !newReminderText.trim() || isSavingReminder}
                        className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-md shadow-blue-500/20"
                      >
                        {isSavingReminder ? t("saqlanmoqda...") : t("saqlash")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "navbatlar" && (
            <div className="space-y-6">
              {/* Navbatlar Top Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">
                      {t("barcha navbatlar")}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {doctorQueues.length}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {t("ta")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">
                      {t("qabul qilinganlar")}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {completedQueues.length}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {t("ta")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">
                      {t("kutilayotganlar")}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {pendingQueues.length}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {t("ta")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                    <CalendarCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">
                      {t("kechiktirilganlar")}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {overdueScheduledQueues.length}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {t("ta")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                    <X className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">
                      {t("bekor qilinganlar")}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {cancelledQueues.length}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {t("ta")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navbatlar Main Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQueueListRange('today')}
                      className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-colors ${queueListRange === 'today' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {t("bugun")}
                    </button>
                    <button
                      onClick={() => setQueueListRange('all')}
                      className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-colors ${queueListRange === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {t("barcha navbatlar")}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={queueListSearch}
                        onChange={(e) => setQueueListSearch(e.target.value)}
                        placeholder={t("bemor ismi, tel yoki navbat raqami...")}
                        className="w-64 bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-xs outline-none text-slate-800"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2" />
                    </div>
                    <select
                      value={queueListStatusFilter}
                      onChange={(e) => setQueueListStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none font-semibold"
                    >
                      <option value="">{t("holati bo'yicha")}</option>
                      <option value="pending">{t("kutmoqda")}</option>
                      <option value="scheduled">{t("belgilangan")}</option>
                      <option value="in_progress">{t("qabulda")}</option>
                      <option value="completed">{t("yakunlangan")}</option>
                      <option value="cancelled">{t("bekor qilindi")}</option>
                    </select>
                    <button
                      onClick={() => openNewBookingModal(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t("yangi bandlash")}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                      <tr>
                        <th className="font-semibold py-2.5 px-3 rounded-l-lg">
                          #
                        </th>
                        <th className="font-semibold py-2.5 px-2">{t("vaqt")}</th>
                        <th className="font-semibold py-2.5 px-2">{t("bemor")}</th>
                        <th className="font-semibold py-2.5 px-2">{t("xizmat")}</th>
                        <th className="font-semibold py-2.5 px-2">{t("holati")}</th>
                        <th className="font-semibold py-2.5 px-2">
                          {t("navbat raqami")}
                        </th>
                        <th className="font-semibold py-2.5 px-3 text-right rounded-r-lg">
                          {t("amallar")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {visibleQueues.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                            {doctorQueues.length === 0 ? t("hozircha navbatda bemorlar yo'q") : t("ushbu filtrga mos navbat topilmadi")}
                          </td>
                        </tr>
                      ) : (
                        visibleQueues.map((q, idx) => (
                          <tr key={q.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { const pid = resolvePatientIdFromQueue(q); if (pid) { setActiveView('bemorlar'); setSelectedPatientId(pid); } }}>
                            <td className="py-3 px-3 font-medium">{idx + 1}</td>
                            <td className="py-3 px-2 text-slate-500 font-medium">
                              {q.appointmentTime || (q.createdAt ? new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                  {q.patientName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{q.patientName}</p>
                                  <p className="text-[9px] text-slate-400 font-mono">{q.patientPhone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-slate-600 font-medium">
                              {services.find((s: any) => s.id === q.serviceId)?.name || t("ko'rik")}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase ${
                                q.status === 'in_progress' ? 'text-blue-600 bg-blue-100' :
                                q.status === 'scheduled' ? 'text-purple-600 bg-purple-100' :
                                q.status === 'completed' ? 'text-emerald-600 bg-emerald-100' :
                                q.status === 'cancelled' ? 'text-rose-600 bg-rose-100' :
                                'text-amber-600 bg-amber-100'
                              }`}>
                                {q.status === 'in_progress' ? t("qabulda") :
                                 q.status === 'scheduled' ? t("belgilangan") :
                                 q.status === 'completed' ? t("yakunlangan") :
                                 q.status === 'cancelled' ? t("bekor qilindi") : t("kutmoqda")}
                              </span>
                            </td>
                            <td className="py-3 px-2 font-mono font-bold text-slate-700">
                              {q.number ? `A-${q.number.toString().padStart(3, '0')}` : '---'}
                            </td>
                            <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {q.status === 'pending' || q.status === 'scheduled' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setScheduleServiceId(q.serviceId || '');
                                        setScheduleDate(q.appointmentDate || new Date().toISOString().split('T')[0]);
                                        setScheduleTime(q.appointmentTime || '09:00');
                                        setScheduleModal({ isOpen: true, queueId: q.id! });
                                      }}
                                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold rounded-lg transition-colors"
                                    >
                                      {t("muolaja va vaqt")}
                                    </button>
                                    <button 
                                      onClick={() => onUpdateQueueStatus(q.id!, 'in_progress')}
                                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg transition-colors"
                                    >
                                      {t("qabulni boshlash")}
                                    </button>
                                  </>
                                ) : q.status === 'in_progress' ? (
                                  <button 
                                    onClick={() => handleCompleteQueue(q)}
                                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                  >
                                    <Check className="w-3 h-3" /> {t("yakunlash")}
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selected Patient Data (Bemor kartasi, Dental Chart, Rentgenlar) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-base">
                      {t("bemor kartasi")}
                    </h3>
                    <button
                      onClick={() => { setActiveView("bemorlar"); if (activeConsultPatient) setSelectedPatientId(activeConsultPatient.id); }}
                      disabled={!activeConsultPatient}
                      className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <User className="w-3 h-3" /> {t("to'liq ko'rish")}
                    </button>
                  </div>
                  {activeConsultPatient ? (
                    <>
                      <div className="flex items-center gap-3 mb-5">
                        <img
                          src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${activeConsultPatient.id}`}
                          className="w-14 h-14 rounded-full bg-slate-100"
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {decodeLegacyEntities(activeConsultPatient.fullName)}
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            {activeConsultPatient.birthDate || ""}
                          </p>
                          <p className="text-xs font-mono text-slate-600 mt-0.5 font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {decodeLegacyEntities(activeConsultPatient.phone) || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                          <span className="text-slate-500 font-medium">
                            {t("allergiya:")}
                          </span>
                          <span className="font-bold text-slate-800">{decodeLegacyEntities(activeConsultPatient.allergies) || t("yo'q")}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                          <span className="text-slate-500 font-medium">
                            {t("kasalliklar:")}
                          </span>
                          <span className="font-bold text-slate-800">{decodeLegacyEntities(activeConsultPatient.chronicDiseases) || t("yo'q")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">
                            {t("shikoyat:")}
                          </span>
                          <span className="font-bold text-slate-800 text-right w-3/5">
                            {activeConsultQueue?.complaint || "—"}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      {t("hozirda qabulda faol bemor yo'q")}
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-base">
                      {t("rentgenlar")}
                    </h3>
                    <button
                      onClick={() => { setActiveView("bemorlar"); if (activeConsultPatient) setSelectedPatientId(activeConsultPatient.id); }}
                      disabled={!activeConsultPatient}
                      className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" /> {t("yuklash")}
                    </button>
                  </div>
                  {activePatientXrays.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {activePatientXrays.slice(0, 4).map((xray) => (
                        <div key={xray.id} className="relative group cursor-pointer aspect-video bg-slate-900 rounded-xl overflow-hidden">
                          {xray.url ? (
                            <img src={xray.url} className="absolute inset-0 w-full h-full object-cover" alt={xray.type} />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                            <p className="text-[10px] font-bold">{xray.type}</p>
                            <p className="text-[8px] text-white/70">{new Date(xray.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      {activeConsultPatient ? t("ushbu bemor uchun rentgen yuklanmagan") : t("faol bemor tanlanmagan")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === "rejalashtirilgan" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide">{t("rejalashtirilgan")}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setQuickAddPatient({
                        fullName: "", phone: "", passportSerial: "", birthDate: "",
                        bloodGroup: "", allergies: "", chronicDiseases: "", hasInfection: false,
                        bookAppointment: true, serviceId: "",
                        appointmentDate: new Date().toISOString().split('T')[0], appointmentTime: "09:00",
                      });
                      setShowQuickAddPatient(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> {t("yangi bemor qo'shish")}
                  </button>
                  <button
                    onClick={openScheduleSettingsModal}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors"
                  >
                    ⚙ {t("jadval sozlamalari")}
                  </button>
                  <button
                    onClick={() => openNewBookingModal(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-purple-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t("yangi bandlash")}
                  </button>
                </div>
              </div>

              {overdueScheduledQueues.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <h3 className="text-xs font-black text-rose-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <CalendarCheck2 className="w-4 h-4" /> {t("kechiktirilganlar")} ({overdueScheduledQueues.length})
                  </h3>
                  <div className="space-y-2">
                    {overdueScheduledQueues.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => { const pid = resolvePatientIdFromQueue(q); if (pid) { setActiveView('bemorlar'); setSelectedPatientId(pid); } }}
                        className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 cursor-pointer hover:bg-rose-50/50 transition-colors border border-rose-100"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{q.patientName}</p>
                          <p className="text-[10px] text-rose-500 font-bold">{q.appointmentDate} {q.appointmentTime}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdateQueueStatus(q.id!, 'in_progress'); }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg transition-colors"
                        >
                          {t("qabulni boshlash")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Week navigator */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScheduleWeekOffset((v) => v - 1)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                    title={t("oldingi hafta")}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setScheduleWeekOffset(0)}
                    disabled={scheduleWeekOffset === 0}
                    className="px-3 py-2 text-xs font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    {t("bu hafta")}
                  </button>
                  <button
                    onClick={() => setScheduleWeekOffset((v) => v + 1)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                    title={t("keyingi hafta")}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm font-black text-slate-700">{scheduleWeekLabel}</span>
              </div>

              {/* Weekly schedule table: time-slot rows (from the doctor's
                  working hours) x weekday columns. Clicking an empty, non-lunch
                  cell books directly into that exact slot — the grid itself is
                  now the primary booking interface, no free-typed times. */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr>
                      <th className="w-16 px-1 py-3 border-b border-r border-slate-100 bg-slate-50 sticky left-0 z-10"></th>
                      {scheduleWeekGrid.map((day) => {
                        const isToday = day.date === todayStr;
                        return (
                          <th
                            key={day.date}
                            className={`px-3 py-3 border-b border-r border-slate-100 last:border-r-0 text-center ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}
                          >
                            <p className="text-[10px] font-black uppercase tracking-wide">{t(day.weekday.toLowerCase())}</p>
                            <p className="text-sm font-black">{formatDdMm(day.dateObj)}</p>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleSlots.map((slot) => {
                      const lunch = isLunchSlot(slot);
                      return (
                        <tr key={slot}>
                          <td className="w-16 px-1 py-2 border-b border-r border-slate-100 bg-slate-50/60 text-[10px] font-black text-slate-500 text-center align-top sticky left-0 z-10">
                            {slot}
                          </td>
                          {scheduleWeekGrid.map((day) => {
                            const isWeekend = day.dateObj.getDay() === 0 || day.dateObj.getDay() === 6;
                            const items = day.items.filter((q) => getQueueSlot(q.appointmentTime) === slot);
                            return (
                              <td
                                key={day.date}
                                className={`p-1.5 border-b border-r border-slate-100 last:border-r-0 align-top ${isWeekend ? 'bg-slate-50/40' : ''}`}
                              >
                                {lunch ? (
                                  <div className="min-h-[52px] flex items-center justify-center bg-slate-50 rounded-lg">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-wide">{t("tushlik")}</span>
                                  </div>
                                ) : items.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => openNewBookingModal(true, day.date, slot)}
                                    className="w-full min-h-[52px] flex items-center justify-center border border-dashed border-purple-200 text-purple-400 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50 rounded-lg transition-colors"
                                    title={t("bandlash")}
                                  >
                                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                                  </button>
                                ) : (
                                  <div className="space-y-1.5">
                                    {items.map((q) => {
                                      const isDone = q.status === 'completed';
                                      const isCancelled = q.status === 'cancelled';
                                      const isActive = q.status === 'calling' || q.status === 'in_progress';
                                      const cardClasses = isDone
                                        ? 'bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-100'
                                        : isCancelled
                                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 opacity-60'
                                        : isActive
                                        ? 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-100'
                                        : 'bg-blue-50/60 hover:bg-blue-100/70 border-blue-100';
                                      const timeClasses = isDone ? 'text-emerald-700' : isCancelled ? 'text-slate-400' : isActive ? 'text-amber-700' : 'text-blue-700';
                                      return (
                                        <div
                                          key={q.id}
                                          onClick={() => { const pid = resolvePatientIdFromQueue(q); if (pid) { setActiveView('bemorlar'); setSelectedPatientId(pid); } }}
                                          className={`border rounded-xl p-2 cursor-pointer transition-colors ${cardClasses}`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <p className={`text-[11px] font-black ${timeClasses}`}>{q.appointmentTime || '--:--'}</p>
                                            {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                                            {isCancelled && <span className="text-[9px] font-black text-slate-400 uppercase shrink-0">{t("bekor qilindi")}</span>}
                                            <div className="flex items-center gap-0.5 shrink-0">
                                              {/* Editing the date/time/service of a completed or already
                                                  in-progress visit doesn't make sense — only a not-yet-started
                                                  slot is safe to reschedule here. */}
                                              {q.status === 'scheduled' && (
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); openEditQueueModal(q); }}
                                                  className="p-0.5 text-slate-500 hover:text-blue-600 transition-colors"
                                                  title={t("tahrirlash")}
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                              {/* Deleting removes only this booking ticket, not the patient's
                                                  actual visit record (Patient.clinicVisits, written separately
                                                  on completion). A completed ticket is also what that day's
                                                  revenue/report totals were counted from, so deleting one shrinks
                                                  those retroactively — allowed, but warned about specifically. */}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const msg = isDone
                                                    ? t("bu yakunlangan tashrif o'chiriladi va kunlik hisobot/daromaddan ham chiqarib tashlanadi. davom etilsinmi?")
                                                    : t("bu navbatni o'chirmoqchimisiz?");
                                                  if (window.confirm(msg)) onDeleteQueue?.(q.id!);
                                                }}
                                                className="p-0.5 text-slate-500 hover:text-rose-600 transition-colors"
                                                title={t("o'chirish")}
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                          <p className={`text-xs font-bold truncate ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{q.patientName}</p>
                                          <p className="text-[10px] text-slate-400 font-mono truncate">{q.patientPhone}</p>
                                          {/* A consultation can only be started once its day has
                                              arrived — offering it on a future column is how
                                              tomorrow's appointments ended up stuck "in consultation". */}
                                          {q.status === 'scheduled' && day.date <= todayStr && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); onUpdateQueueStatus(q.id!, 'in_progress'); }}
                                              className="mt-1.5 w-full py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-600 font-bold text-[10px] rounded-lg transition-colors border border-blue-200"
                                            >
                                              {t("qabulni boshlash")}
                                            </button>
                                          )}
                                          {/* Finishing has to be reachable from the same place it was
                                              started, otherwise a consultation opened here stays
                                              "in consultation" forever and the slot never frees up. */}
                                          {isActive && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleCompleteQueue(q); }}
                                              className="mt-1.5 w-full py-1 bg-amber-100 hover:bg-emerald-600 hover:text-white text-amber-700 font-bold text-[10px] rounded-lg transition-colors"
                                              title={t("davolashni yakunlash ✓")}
                                            >
                                              {t("qabulda")} · {t("yakunlash")}
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === "bemorlar" &&
            (selectedPatientId ? (
              <PatientProfile
                patientId={selectedPatientId}
                patient={clinicPatients.find((p) => p.id === selectedPatientId)}
                onBack={() => setSelectedPatientId(null)}
                doctorId={currentDoctor?.id}
                staffToken={staffToken}
                language={language}
              />
            ) : (
              <div className="space-y-6">
                {/* A separate "Biriktirilmagan bemorlar" box used to sit here listing
                    every patient with no primaryDoctorId. It confused more than it
                    helped: its count (clinic-wide) never matched the doctor's own
                    patient count right below it. Unassigned patients are still fully
                    reachable — "Yangi bandlash" searches the whole clinic roster, and
                    booking a patient assigns them to that doctor automatically. */}

                {/* Top Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">
                        {t("barcha bemorlar")}
                      </p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-800 leading-none">
                          {patientStats.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">
                        {t("faol bemorlar")}
                      </p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-800 leading-none">
                          {patientStats.active.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {patientStats.activePct}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
                      <CalendarClock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">
                        {t("bugun tashrif buyuradi")}
                      </p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-800 leading-none">
                          {patientStats.todayVisits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">
                        {t("jami tashriflar")}
                      </p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-800 leading-none">
                          {patientStats.totalVisits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">
                        {t("umumiy tushum")}
                      </p>
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-black text-slate-800 leading-none">
                          {patientStats.totalRevenue.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          so'm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col xl:flex-row gap-6">
                  {/* Table Area */}
                  <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {t("bemorlar ro'yxati")}
                        </h3>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                          {filteredClinicPatients.length.toLocaleString()} bemor
                        </span>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72">
                          <input
                            ref={patientSearchInputRef}
                            type="text"
                            value={patientListSearch}
                            onChange={(e) => setPatientListSearch(e.target.value)}
                            placeholder={t("ism, telefon yoki id bo'yicha qidirish...")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs outline-none focus:border-emerald-500/50 transition-colors text-slate-800"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                        </div>
                        <button
                          onClick={() => setShowCrossClinicSearch((v) => !v)}
                          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-lg transition-colors border ${showCrossClinicSearch ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"}`}
                        >
                          {t("🌐 boshqa klinikadan qidirish")}
                        </button>
                        <button
                          onClick={() => setShowQuickAddPatient(true)}
                          className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-md shadow-emerald-500/20"
                        >
                          <Plus className="w-4 h-4" /> {t("yangi bemor")}
                        </button>
                      </div>
                    </div>

                    {showCrossClinicSearch ? (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={crossClinicQuery}
                            onChange={(e) => setCrossClinicQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCrossClinicSearch()}
                            placeholder={t("telefon raqami yoki pasport seriyasi...")}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none focus:border-indigo-500 transition-colors text-slate-800"
                          />
                          <button
                            onClick={handleCrossClinicSearch}
                            disabled={!crossClinicQuery.trim() || crossClinicSearching}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors"
                          >
                            {crossClinicSearching ? t("qidirilmoqda...") : t("qidirish")}
                          </button>
                        </div>

                        {crossClinicSearched && crossClinicResults.length === 0 && (
                          <p className="text-sm text-slate-400 text-center py-8">
                            {t("hech qanday klinikada bunday bemor topilmadi.")}
                          </p>
                        )}

                        {crossClinicResults.length > 0 && (
                          <div className="space-y-2">
                            {crossClinicResults.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => setCrossClinicViewPatient(p)}
                                className="w-full text-left flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl transition-colors"
                              >
                                <div>
                                  <p className="font-bold text-slate-800 text-sm">{decodeLegacyEntities(p.fullName)}</p>
                                  <p className="text-xs text-slate-500 font-mono">{decodeLegacyEntities(p.phone)}</p>
                                </div>
                                <span className="text-xs text-indigo-600 font-bold">
                                  {(p.clinicVisits || []).length} {t("ta tashrif →")}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                    <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                          <tr>
                            <th className="font-semibold py-3 px-4 rounded-l-lg">
                              #
                            </th>
                            <th className="font-semibold py-3 px-3">{t("bemor")}</th>
                            <th className="font-semibold py-3 px-3">{t("telefon")}</th>
                            <th className="font-semibold py-3 px-3">
                              {t("tug'ilgan sana")}
                            </th>
                            <th className="font-semibold py-3 px-3">
                              {t("oxirgi tashrif")}
                            </th>
                            <th className="font-semibold py-3 px-3 text-center">
                              {t("tashriflar soni")}
                            </th>
                            <th className="font-semibold py-3 px-3 text-right">
                              {t("qarzdorlik")}
                            </th>
                            <th className="font-semibold py-3 px-3 text-center">
                              {t("holati")}
                            </th>
                            <th className="font-semibold py-3 px-4 text-right rounded-r-lg">
                              {t("amallar")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredClinicPatients.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                                {t("bemorlar topilmadi")}
                              </td>
                            </tr>
                          ) : (
                            filteredClinicPatients.map((patient, index) => {
                              const visits = patient.clinicVisits || [];
                              const lastVisit = visits
                                .slice()
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                              const fullName = decodeLegacyEntities(patient.fullName);
                              const phone = decodeLegacyEntities(patient.phone);
                              const currentClinicId = lastVisit?.clinicId || patient.clinicId;
                              const isFollowingDoctor = patient.primaryDoctorId === currentDoctor?.id && currentClinicId !== effectiveClinicId;
                              return (
                                <tr
                                  key={patient.id}
                                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                  onClick={() => setSelectedPatientId(patient.id)}
                                >
                                  <td className="py-3 px-4 font-medium text-slate-500">
                                    {index + 1}
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${patient.id}`}
                                        className="w-8 h-8 rounded-full bg-slate-100"
                                        alt={fullName}
                                      />
                                      <div>
                                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                          {fullName}
                                          {isFollowingDoctor && (
                                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap">
                                              🔁 {t("boshqa klinikadan")}
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-[9px] text-slate-400 font-mono">
                                          ID: #{patient.id}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px] font-medium">
                                    {phone || "—"}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">
                                    {patient.birthDate || "—"}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">
                                    {lastVisit ? lastVisit.date.slice(0, 10) : "—"}
                                  </td>
                                  <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                                    {visits.length}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <span className="font-bold text-slate-400">—</span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span
                                      className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase ${visits.length > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                                    >
                                      {visits.length > 0 ? t("faol") : t("yangi")}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPatientId(patient.id);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        {filteredClinicPatients.length} / {filteredClinicPatients.length} bemor
                      </span>
                      <div className="flex items-center gap-2">
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                          1
                        </button>
                      </div>
                    </div>
                    </>
                    )}
                  </div>

                  {/* Right Sidebar */}
                  <div className="w-full xl:w-[320px] shrink-0 space-y-6">
                    {/* Filters Panel */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-800 text-base">
                          {t("filterlar")}
                        </h3>
                        <button className="text-[11px] font-bold text-slate-400 hover:text-slate-600">
                          {t("tozalash")}
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                            {t("holati")}
                          </label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500/50 transition-colors font-medium">
                            <option>{t("barchasi")}</option>
                            <option>{t("faol")}</option>
                            <option>{t("qarzdor")}</option>
                            <option>{t("arxiv")}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                            {t("qarzdorlik")}
                          </label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500/50 transition-colors font-medium">
                            <option>{t("barchasi")}</option>
                            <option>{t("qarzdorlar")}</option>
                            <option>{t("qarzi yo'qlar")}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                            {t("shifokor")}
                          </label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500/50 transition-colors font-medium">
                            <option>{t("barchasi")}</option>
                            <option>Dr. Asilbek Xolmirzayev</option>
                            <option>Dr. Shohrux Rahmonov</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                            {t("ro'yxatdan o'tgan sana")}
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder="dd.mm.yyyy"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-[11px] font-mono outline-none text-slate-800"
                              />
                              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                            </div>
                            <span className="text-slate-400">-</span>
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder="dd.mm.yyyy"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-[11px] font-mono outline-none text-slate-800"
                              />
                              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                            </div>
                          </div>
                        </div>
                        <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-emerald-500/20 mt-2">
                          {t("qidirish")}
                        </button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                      <h3 className="font-bold text-slate-800 text-base mb-4">
                        {t("tezkor amallar")}
                      </h3>
                      <div className="space-y-2">
                        <button onClick={() => setShowQuickAddPatient(true)} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">
                              {t("yangi bemor qo'shish")}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              {t("bemor ma'lumotlarini kiriting")}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setActiveView("bemorlar");
                            patientSearchInputRef.current?.focus();
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                        >
                          <div className="p-2 bg-amber-50 text-amber-500 rounded-lg group-hover:bg-amber-100 transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">
                              {t("bemor kartasini ochish")}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              {t("mavjud bemorni tanlang")}
                            </p>
                          </div>
                        </button>
                        <button onClick={() => openNewBookingModal(false)} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <CalendarClock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">
                              {t("bemorni bandlash")}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              {t("kelgusi sana va vaqtga yozish")}
                            </p>
                          </div>
                        </button>
                        <button onClick={handleExportPatientsCsv} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <FileDown className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">
                              {t("excel'ga eksport qilish")}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              {t("barcha bemorlarni yuklab oling")}
                            </p>
                          </div>
                        </button>
                        <button onClick={handleBulkTelegramMessage} disabled={isSendingBulkTelegram} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group disabled:opacity-50">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <Send className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">
                              {isSendingBulkTelegram ? t("yuborilmoqda...") : t("telegram'ga xabar yuborish")}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              {t("ulangan barcha bemorlarga xabar")}
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                      <h3 className="font-bold text-slate-800 text-base mb-4">
                        {t("ma'lumot")}
                      </h3>
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">
                            {t("o'rtacha tashrif soni")}
                          </span>
                          <span className="font-bold text-slate-800">
                            {patientStats.total > 0 ? (patientStats.totalVisits / patientStats.total).toFixed(1) : "0"} {t("marta")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">
                            {t("eng ko'p tashrif buyurgan bemor")}
                          </span>
                          <span className="font-bold text-slate-800">
                            {clinicPatients.length > 0 ? Math.max(0, ...clinicPatients.map((p) => (p.clinicVisits || []).length)) : 0} {t("marta")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">
                            {t("o'rtacha muolaja narxi")}
                          </span>
                          <span className="font-bold text-slate-800">
                            {patientStats.totalVisits > 0 ? Math.round(patientStats.totalRevenue / patientStats.totalVisits).toLocaleString() : 0} so'm
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">
                            {t("jami diagnozlar")}
                          </span>
                          <span className="font-bold text-slate-800">
                            {clinicPatients.reduce((sum, p) => sum + (p.diagnoses?.length || 0), 0)} {t("ta")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {activeView === "dental_chart" && (
            selectedPatientId ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
                <DentalChart patientId={selectedPatientId} doctorName={currentDoctor?.name} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                 <p>{t("iltimos, dental chart ko'rish uchun bemorni tanlang")}</p>
                 <button onClick={() => setActiveView("bemorlar")} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">{t("bemorlar ro'yxatiga o'tish")}</button>
              </div>
            )
          )}

          {activeView === "davolash_rejasi" && (
            selectedPatientId ? (
              <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <TreatmentPlan patientId={selectedPatientId}
                  language={language}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                 <p>{t("iltimos, davolash rejasini ko'rish uchun bemorni tanlang")}</p>
                 <button onClick={() => setActiveView("bemorlar")} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">{t("bemorlar ro'yxatiga o'tish")}</button>
              </div>
            )
          )}

          {activeView === "rentgenlar" && (
            selectedPatientId ? (
              <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <XRayCenter patientId={selectedPatientId} clinicId={effectiveClinicId} patientName={clinicPatients.find((p) => p.id === selectedPatientId)?.fullName} doctorName={currentDoctor?.name} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                 <p>{t("iltimos, rentgenlarni ko'rish uchun bemorni tanlang")}</p>
                 <button onClick={() => setActiveView("bemorlar")} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">{t("bemorlar ro'yxatiga o'tish")}</button>
              </div>
            )
          )}

          {activeView === "muolaja_tarixi" && (
            selectedPatientId ? (
              <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <TreatmentHistory patientId={selectedPatientId} patientName={clinicPatients.find((p) => p.id === selectedPatientId)?.fullName} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                 <p>{t("iltimos, muolaja tarixini ko'rish uchun bemorni tanlang")}</p>
                 <button onClick={() => setActiveView("bemorlar")} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">{t("bemorlar ro'yxatiga o'tish")}</button>
              </div>
            )
          )}

          {activeView === "foto_galereya" && (
            selectedPatientId ? (
              <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <PhotoGallery patientId={selectedPatientId} patientName={clinicPatients.find((p) => p.id === selectedPatientId)?.fullName} doctorName={currentDoctor?.name} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                 <p>{t("iltimos, foto galereyani ko'rish uchun bemorni tanlang")}</p>
                 <button onClick={() => setActiveView("bemorlar")} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">{t("bemorlar ro'yxatiga o'tish")}</button>
              </div>
            )
          )}

          {activeView === "statistika" && (
            <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              {/* Scoped to this doctor, not the clinic: passing the clinic-wide
                  roster here made "Jami bemorlar" report a different number than
                  the doctor's own "Barcha bemorlar" card two tabs over. The
                  director's Statistics stays clinic-wide, which is correct there. */}
              <Statistics queues={doctorQueues} services={services} doctors={doctors} patients={myPatients} clinicId={effectiveClinicId} staffToken={staffToken} language={language} />
            </div>
          )}

          {activeView === "retseptlar" && (
            selectedPatientId ? (
              <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <Prescriptions
                  patientId={selectedPatientId}
                  patientName={clinicPatients.find((p) => p.id === selectedPatientId)?.fullName}
                  doctorName={currentDoctor?.name}
                  patientTelegramChatId={clinicPatients.find((p) => p.id === selectedPatientId)?.telegramChatId}
                  language={language}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                 <p>{t("iltimos, retseptlarni ko'rish uchun bemorni tanlang")}</p>
                 <button onClick={() => setActiveView("bemorlar")} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">{t("bemorlar ro'yxatiga o'tish")}</button>
              </div>
            )
          )}

          {activeView === "sozlamalar" && (
            <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <SettingsView
                doctor={currentDoctor}
                clinic={effectiveClinic}
                clinicPatients={clinicPatients}
                clinicQueues={doctorQueues}
                allClinics={clinics}
                onRequestPremiumUpgrade={onRequestPremiumUpgrade}
                staffToken={staffToken}
                language={language}
              />
            </div>
          )}

          {activeView === "muolajalar" && (
            <ProcedureCatalog clinicId={effectiveClinicId || undefined} services={services}
                  language={language}
                />
          )}

          {activeView === "materiallar" && (
            <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <MaterialsInventory clinicId={effectiveClinicId || undefined} language={language} />
            </div>
          )}
        </div>
      </div>

      {showNewBookingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-purple-500" />
                {editingQueueId ? t("tahrirlash") : t("yangi bandlash")}
              </h3>
              <button
                onClick={() => setShowNewBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
              {/* Two ways to fill in the patient: pick an existing record
                  (search-only, name/phone read-only) or register a brand-new
                  one right here (editable name/phone, same creation call
                  "Yangi bemor qo'shish" uses). Editing an existing queue entry
                  skips this — the patient is already fixed. */}
              {!editingQueueId && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                  {([
                    { mode: 'existing' as const, label: t("mavjud bemor") },
                    { mode: 'new' as const, label: t("yangi bemor") },
                  ]).map(({ mode, label }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setNewBookingMode(mode);
                        setNewBookingSelectedPatientId(null);
                        setNewBookingQuery('');
                        setNewBookingName('');
                        setNewBookingPhone('');
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                        newBookingMode === mode
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {!editingQueueId && newBookingMode === 'existing' && !newBookingSelectedPatientId && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("bemorni qidirish")} *</label>
                <input
                  type="text"
                  value={newBookingQuery}
                  onChange={(e) => setNewBookingQuery(e.target.value)}
                  placeholder={t("ism yoki telefon bo'yicha qidiring...")}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                />
                {newBookingSearchResults.length > 0 && (
                  <div className="mt-1.5 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                    {newBookingSearchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setNewBookingName(decodeLegacyEntities(p.fullName) || '');
                          setNewBookingPhone(decodeLegacyEntities(p.phone) || '');
                          setNewBookingSelectedPatientId(p.id!);
                          setNewBookingQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-xs font-bold text-slate-800">{decodeLegacyEntities(p.fullName)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{decodeLegacyEntities(p.phone)}</p>
                      </button>
                    ))}
                  </div>
                )}
                {newBookingQuery.trim() && newBookingSearchResults.length === 0 && (
                  <p className="mt-1.5 text-[11px] text-slate-400 font-medium">
                    {t("bemor topilmadi. \"yangi bemor\" bo'limiga o'ting.")}
                  </p>
                )}
              </div>
              )}
              {(editingQueueId || (newBookingMode === 'existing' && newBookingSelectedPatientId)) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("to'liq ism *")}</label>
                  <input
                    type="text"
                    value={newBookingName}
                    readOnly
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium text-slate-800 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("telefon")}</label>
                  <input
                    type="text"
                    value={newBookingPhone}
                    readOnly
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium text-slate-800 bg-slate-50"
                  />
                </div>
                {!editingQueueId && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewBookingSelectedPatientId(null);
                      setNewBookingName('');
                      setNewBookingPhone('');
                    }}
                    className="col-span-2 text-xs font-bold text-purple-600 hover:underline text-left"
                  >
                    {t("boshqa bemorni tanlash")}
                  </button>
                )}
              </div>
              )}
              {!editingQueueId && newBookingMode === 'new' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("to'liq ism *")}</label>
                  <input
                    type="text"
                    value={newBookingName}
                    onChange={(e) => setNewBookingName(e.target.value)}
                    placeholder={t("ism familiya")}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("telefon")}</label>
                  <input
                    type="text"
                    value={newBookingPhone}
                    onChange={(e) => setNewBookingPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                  />
                </div>
                <p className="col-span-2 text-[11px] text-slate-400 font-medium">
                  {t("login sifatida bemorning to'liq ismi, parol esa tizim tomonidan avtomatik yaratiladi — saqlagach ko'rsatiladi.")}
                </p>
              </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500">{t("muolaja / xizmat")}</label>
                  {newBookingServiceId && (
                    <button
                      type="button"
                      onClick={() => setNewBookingServiceId('')}
                      className="text-[11px] font-bold text-purple-600 hover:underline"
                    >
                      {t("boshqa muolaja tanlash")}
                    </button>
                  )}
                </div>
                {(() => {
                  const clinicServices = services.filter((s: any) => !effectiveClinicId || s.clinicId === effectiveClinicId);
                  const selectedService = clinicServices.find((s: any) => s.id === newBookingServiceId);
                  if (selectedService) {
                    return (
                      <div className="flex items-center justify-between gap-3 border-2 border-purple-500 bg-purple-50 rounded-xl px-3 py-2.5">
                        <span className="text-sm font-bold text-slate-800 truncate">{selectedService.name}</span>
                        <span className="text-xs font-black text-purple-700 shrink-0">{Number(selectedService.price).toLocaleString()} so'm</span>
                      </div>
                    );
                  }
                  const q = newBookingServiceQuery.trim().toLowerCase();
                  const filteredServices = q
                    ? clinicServices.filter((s: any) => (s.name || '').toLowerCase().includes(q))
                    : clinicServices;
                  return (
                    <>
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={newBookingServiceQuery}
                          onChange={(e) => setNewBookingServiceQuery(e.target.value)}
                          placeholder={t("muolajani qidiring...")}
                          className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                        />
                      </div>
                      {filteredServices.length === 0 ? (
                        <p className="text-[11px] text-slate-400 font-medium px-1">{t("muolaja topilmadi")}</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                          {filteredServices.map((s: any) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setNewBookingServiceId(s.id); setNewBookingServiceQuery(''); }}
                              className="text-left border border-slate-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl px-3 py-2.5 transition-colors"
                            >
                              <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{s.name}</p>
                              <p className="text-[11px] font-black text-purple-600 mt-1">{Number(s.price).toLocaleString()} so'm</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("qabul kuni")}</label>
                  {newBookingSlotLocked ? (
                    <p className="w-full border border-slate-100 bg-slate-50 rounded-xl px-3 py-2 text-sm font-bold text-slate-700">
                      {newBookingDate.split('-').slice(1).reverse().join('.')}
                    </p>
                  ) : (
                    <input
                      type="date"
                      value={newBookingDate}
                      onChange={(e) => setNewBookingDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("qabul vaqti")}</label>
                  {newBookingSlotLocked ? (
                    <p className="w-full border border-slate-100 bg-slate-50 rounded-xl px-3 py-2 text-sm font-bold text-slate-700">
                      {newBookingTime}
                    </p>
                  ) : (
                    <select
                      value={newBookingTime}
                      onChange={(e) => setNewBookingTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                    >
                      {scheduleSlots.filter((s) => !isLunchSlot(s)).map((s) => (
                        <option key={s} value={s} className="text-slate-800">{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowNewBookingModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {t("bekor qilish")}
              </button>
              <button
                onClick={handleNewBooking}
                disabled={!newBookingName.trim() || !newBookingDate || !newBookingTime || isSavingNewBooking || (!editingQueueId && newBookingMode === 'existing' && !newBookingSelectedPatientId)}
                className="px-4 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-md shadow-purple-500/20"
              >
                {editingQueueId ? t("saqlash") : t("tasdiqlash")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                ⚙ {t("jadval sozlamalari")}
              </h3>
              <button
                onClick={() => setShowScheduleSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("ish boshlanishi")}</label>
                  <input
                    type="time"
                    value={scheduleSettingsStart}
                    onChange={(e) => setScheduleSettingsStart(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("ish tugashi")}</label>
                  <input
                    type="time"
                    value={scheduleSettingsEnd}
                    onChange={(e) => setScheduleSettingsEnd(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("vaqt oralig'i")}</label>
                <select
                  value={scheduleSettingsInterval}
                  onChange={(e) => setScheduleSettingsInterval(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                >
                  <option value={15}>15 {t("daqiqa")}</option>
                  <option value={30}>30 {t("daqiqa")}</option>
                  <option value={45}>45 {t("daqiqa")}</option>
                  <option value={60}>60 {t("daqiqa")}</option>
                </select>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleSettingsAutoQueue}
                    onChange={(e) => setScheduleSettingsAutoQueue(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 mt-0.5"
                  />
                  <span>
                    <span className="text-xs font-bold text-slate-600 block">{t("avtomatik navbat")}</span>
                    <span className="text-[11px] text-slate-400 font-semibold leading-snug block mt-0.5">
                      {t("belgilangan vaqt kelganda navbatdagi bemor avtomatik chaqiriladi")}
                    </span>
                  </span>
                </label>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleSettingsLunchEnabled}
                    onChange={(e) => setScheduleSettingsLunchEnabled(e.target.checked)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span className="text-xs font-bold text-slate-600">{t("tushlik vaqtini belgilash")}</span>
                </label>
                {scheduleSettingsLunchEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("tushlik boshlanishi")}</label>
                      <input
                        type="time"
                        value={scheduleSettingsLunchStart}
                        onChange={(e) => setScheduleSettingsLunchStart(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("tushlik tugashi")}</label>
                      <input
                        type="time"
                        value={scheduleSettingsLunchEnd}
                        onChange={(e) => setScheduleSettingsLunchEnd(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowScheduleSettingsModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {t("bekor qilish")}
              </button>
              <button
                onClick={runSaveScheduleSettings}
                disabled={isSavingScheduleSettings || scheduleSettingsStart >= scheduleSettingsEnd}
                className="px-4 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-md shadow-purple-500/20"
              >
                {isSavingScheduleSettings ? t("saqlanmoqda...") : t("saqlash")}
              </button>
            </div>
          </div>
        </div>
      )}

      {scheduleModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-purple-500" />
                {t("qabulni rejalashtirish")}
              </h3>
              <button
                onClick={() => setScheduleModal({isOpen: false, queueId: null})}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("muolaja / xizmat")}</label>
                <select
                  value={scheduleServiceId}
                  onChange={(e) => setScheduleServiceId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                >
                  <option value="" className="text-slate-800">{t("— muolajani tanlang —")}</option>
                  {services.filter((s: any) => !effectiveClinicId || s.clinicId === effectiveClinicId).map((s: any) => (
                    <option key={s.id} value={s.id} className="text-slate-800">{s.name} — {Number(s.price).toLocaleString()} so'm</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("qabul kuni")}</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("qabul vaqti")}</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setScheduleModal({isOpen: false, queueId: null})}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {t("bekor qilish")}
              </button>
              <button
                onClick={() => {
                  if (scheduleModal.queueId) {
                    onUpdateQueueStatus(scheduleModal.queueId, 'scheduled', scheduleServiceId, undefined, scheduleDate, scheduleTime);
                  }
                  setScheduleModal({isOpen: false, queueId: null});
                }}
                disabled={!scheduleServiceId}
                className="px-4 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-md shadow-purple-500/20"
              >
                {t("tasdiqlash")}
              </button>
            </div>
          </div>
        </div>
      )}

      {crossClinicViewPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">{decodeLegacyEntities(crossClinicViewPatient.fullName)}</h3>
                <p className="text-xs text-slate-500 font-mono">{decodeLegacyEntities(crossClinicViewPatient.phone)}</p>
              </div>
              <button onClick={() => setCrossClinicViewPatient(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{t("qon guruhi")}</p>
                <p className="font-bold text-slate-800">{decodeLegacyEntities(crossClinicViewPatient.bloodGroup) || "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{t("infeksiya")}</p>
                <p className="font-bold text-slate-800">{crossClinicViewPatient.hasInfection ? t("bor") : t("yo'q")}</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-3 col-span-2">
                <p className="text-[10px] text-rose-400 font-bold uppercase mb-1">{t("allergiya")}</p>
                <p className="font-bold text-rose-700">{decodeLegacyEntities(crossClinicViewPatient.allergies) || t("ma'lumot yo'q")}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 col-span-2">
                <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">{t("surunkali kasalliklar")}</p>
                <p className="font-bold text-amber-700">{decodeLegacyEntities(crossClinicViewPatient.chronicDiseases) || t("ma'lumot yo'q")}</p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t("tashriflar tarixi")}</h4>
            <div className="space-y-2 mb-5">
              {(crossClinicViewPatient.clinicVisits || []).length === 0 ? (
                <p className="text-xs text-slate-400">{t("hali tashrif qayd etilmagan.")}</p>
              ) : (
                [...(crossClinicViewPatient.clinicVisits || [])]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((v) => {
                    const visitClinicId = v.clinicId || crossClinicViewPatient.clinicId;
                    const visitClinicName = clinics.find((c) => c.id === visitClinicId)?.name || visitClinicId;
                    return (
                      <div key={v.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{v.serviceName || "—"}</p>
                          <p className="text-slate-400">{visitClinicName} · {v.doctorName}</p>
                        </div>
                        <span className="text-slate-500 font-mono">{new Date(v.date).toLocaleDateString()}</span>
                      </div>
                    );
                  })
              )}
            </div>

            <button
              onClick={() => handleAddVisitToThisClinic(crossClinicViewPatient)}
              disabled={isAddingCrossClinicVisit}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors"
            >
              {isAddingCrossClinicVisit ? t("qo'shilmoqda...") : t("ushbu klinikaga qo'shish")}
            </button>
          </div>
        </div>
      )}

      {showQuickAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800">{t("yangi bemor qo'shish")}</h3>
              <button onClick={() => setShowQuickAddPatient(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("to'liq ism *")}</label>
                <input
                  type="text"
                  value={quickAddPatient.fullName}
                  onChange={(e) => setQuickAddPatient({ ...quickAddPatient, fullName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium bg-white text-slate-800"
                  placeholder={t("ism familiya")}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("telefon")}</label>
                <input
                  type="text"
                  value={quickAddPatient.phone}
                  onChange={(e) => setQuickAddPatient({ ...quickAddPatient, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium bg-white text-slate-800"
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {t("login sifatida bemorning to'liq ismi, parol esa tizim tomonidan avtomatik yaratiladi — saqlagach ko'rsatiladi.")}
              </p>

              {/* Everything below used to be required up front. Passport,
                  birth date, and medical background are now filled in later
                  by the patient (or the doctor) from their own cabinet — a
                  doctor adding a patient mid-appointment shouldn't be blocked
                  on details they may not have on hand yet. */}
              <details className="group">
                <summary className="text-xs font-bold text-emerald-600 cursor-pointer select-none list-none flex items-center gap-1">
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                  {t("Qo'shimcha ma'lumot (ixtiyoriy)")}
                </summary>
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("pasport seriyasi")}</label>
                    <input
                      type="text"
                      value={quickAddPatient.passportSerial}
                      onChange={(e) => setQuickAddPatient({ ...quickAddPatient, passportSerial: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium bg-white text-slate-800"
                      placeholder="AD1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("tug'ilgan sana")}</label>
                    <input
                      type="date"
                      value={quickAddPatient.birthDate}
                      onChange={(e) => setQuickAddPatient({ ...quickAddPatient, birthDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("qon guruhi")}</label>
                    <select
                      value={quickAddPatient.bloodGroup}
                      onChange={(e) => setQuickAddPatient({ ...quickAddPatient, bloodGroup: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium bg-white text-slate-800"
                    >
                      <option value="">{t("tanlang (noma'lum)")}</option>
                      <option value="I+">I (O) Rh+</option>
                      <option value="I-">I (O) Rh-</option>
                      <option value="II+">II (A) Rh+</option>
                      <option value="II-">II (A) Rh-</option>
                      <option value="III+">III (B) Rh+</option>
                      <option value="III-">III (B) Rh-</option>
                      <option value="IV+">IV (AB) Rh+</option>
                      <option value="IV-">IV (AB) Rh-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("allergiyalar")}</label>
                    <input
                      type="text"
                      value={quickAddPatient.allergies}
                      onChange={(e) => setQuickAddPatient({ ...quickAddPatient, allergies: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium bg-white text-slate-800"
                      placeholder={t("masalan: penitsillin guruhiga")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("surunkali kasalliklar")}</label>
                    <textarea
                      value={quickAddPatient.chronicDiseases}
                      onChange={(e) => setQuickAddPatient({ ...quickAddPatient, chronicDiseases: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 font-medium bg-white text-slate-800 h-16 resize-none"
                      placeholder={t("yurak, qon bosimi, qandli diabet va h.k.")}
                    />
                  </div>
                </div>
              </details>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="quick-add-has-infection"
                  checked={quickAddPatient.hasInfection}
                  onChange={(e) => setQuickAddPatient({ ...quickAddPatient, hasInfection: e.target.checked })}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer mt-0.5 shrink-0"
                />
                <label htmlFor="quick-add-has-infection" className="text-xs font-bold text-rose-900 leading-tight cursor-pointer select-none">
                  {t("jiddiy yuqumli kasallik mavjud")}
                </label>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="quick-add-book-appointment"
                    checked={quickAddPatient.bookAppointment}
                    onChange={(e) => setQuickAddPatient({ ...quickAddPatient, bookAppointment: e.target.checked })}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer mt-0.5 shrink-0"
                  />
                  <label htmlFor="quick-add-book-appointment" className="text-xs font-bold text-purple-900 leading-tight cursor-pointer select-none">
                    {t("shu bilan birga qabulga ham yozish")}
                  </label>
                </div>
                {quickAddPatient.bookAppointment && (
                  <div className="mt-3 space-y-2.5">
                    <select
                      value={quickAddPatient.serviceId}
                      onChange={(e) => setQuickAddPatient({ ...quickAddPatient, serviceId: e.target.value })}
                      className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                    >
                      <option value="" className="text-slate-800">{t("— muolajani tanlang —")}</option>
                      {services.filter((s: any) => !effectiveClinicId || s.clinicId === effectiveClinicId).map((s: any) => (
                        <option key={s.id} value={s.id} className="text-slate-800">{s.name} — {Number(s.price).toLocaleString()} so'm</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="date"
                        value={quickAddPatient.appointmentDate}
                        onChange={(e) => setQuickAddPatient({ ...quickAddPatient, appointmentDate: e.target.value })}
                        className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                      />
                      <input
                        type="time"
                        value={quickAddPatient.appointmentTime}
                        onChange={(e) => setQuickAddPatient({ ...quickAddPatient, appointmentTime: e.target.value })}
                        className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 font-medium bg-white text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowQuickAddPatient(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {t("bekor qilish")}
              </button>
              <button
                onClick={handleQuickAddPatient}
                disabled={!quickAddPatient.fullName.trim() || isSavingQuickAddPatient || (quickAddPatient.bookAppointment && (!quickAddPatient.appointmentDate || !quickAddPatient.appointmentTime))}
                className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md shadow-emerald-500/20"
              >
                {isSavingQuickAddPatient ? t("saqlanmoqda...") : t("saqlash")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shown once, right after a doctor-added patient is saved. The patient
          isn't the one who filled this form in, so the doctor is who has to
          write down / relay the login code and password afterward. */}
      {justAddedPatientCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1.5">{t("Bemor qo'shildi")}</h3>
            <p className="text-xs text-slate-500 font-semibold mb-4">
              {t("Bemor o'z kabinetiga kirishi uchun quyidagi login va parolni unga bering")}:
            </p>
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 mb-5 space-y-2">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t("Login")}</p>
                {/* Name-based logins (doctor quick-add) read naturally; the
                    legacy 6-digit codes (self-registration) still benefit
                    from the wider spacing, so it only kicks in for those. */}
                <p className={`text-xl font-black text-slate-900 ${/^\d+$/.test(justAddedPatientCreds.loginCode) ? 'tracking-[0.2em] font-mono' : ''}`}>
                  {justAddedPatientCreds.loginCode}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t("Parol")}</p>
                <p className="text-xl font-black text-slate-900 tracking-[0.2em] font-mono">{justAddedPatientCreds.password}</p>
              </div>
            </div>
            <button
              onClick={() => setJustAddedPatientCreds(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all"
            >
              {t("Tushunarli")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
