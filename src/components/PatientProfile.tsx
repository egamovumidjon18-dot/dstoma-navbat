import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { Patient, PaymentReceipt, Reminder, TreatmentCharge } from "../types";
import { patientBalance, itemBalance, type PlanItemLike } from "../utils/treatmentBilling";
import { fetchTreatmentCharges } from "../utils/treatmentCharges";
import { useHistoryLayer } from "../hooks/useHistoryLayer";
import { decodeLegacyEntities } from "../utils/textFormat";
import { getApiUrl } from "../services/api";
import { TRANSLATIONS, Language } from "../translations";
import DentalChart from "./DentalChart";
import TreatmentPlan from "./TreatmentPlan";
import XRayCenter from "./XRayCenter";
import TreatmentHistory from "./TreatmentHistory";
import PhotoGallery from "./PhotoGallery";
import Prescriptions from "./Prescriptions";
import AIAssistantWidget from "./AIAssistantWidget";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Edit2,
  Trash2,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  CreditCard,
  Bell,
  Activity,
  Check,
  Send,
  Plus,
  History,
  X,
  Wallet,
} from "lucide-react";

interface PatientProfileProps {
  patientId: number | string;
  patient?: Patient;
  onBack: () => void;
  doctorId?: string;
  staffToken?: string | null;
  language?: Language;
}

type PatientProfileDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
const PATIENT_PROFILE_TRANSLATIONS: Record<string, PatientProfileDictEntry> = {
  "so'rov telegram orqali yuborildi.": { ru: "Запрос отправлен через Telegram.", en: "Request sent via Telegram.", kk: "Сұрау Telegram арқылы жіберілді.", ky: "Суроо Telegram аркылуу жөнөтүлдү.", tg: "Дархост тавассути Telegram фиристода шуд.", tk: "Isleg Telegram arkaly iberildi." },
  "naqd qabul qildim": { ru: "Принял наличными", en: "Received in cash", kk: "Қолма-қол қабылдадым", ky: "Накталай кабыл алдым", tg: "Нақдина қабул кардам", tk: "Nagt kabul etdim" },
  "naqd to'lov qabul qilindi.": { ru: "Наличный платёж принят.", en: "Cash payment recorded.", kk: "Қолма-қол төлем қабылданды.", ky: "Накталай төлөм кабыл алынды.", tg: "Пардохти нақдӣ қабул шуд.", tk: "Nagt töleg kabul edildi." },
  "summa (so'm)": { ru: "Сумма (сум)", en: "Amount (UZS)", kk: "Сома (сом)", ky: "Сумма (сом)", tg: "Маблағ (сӯм)", tk: "Möçber (sim)" },
  naqd: { ru: "наличные", en: "cash", kk: "қолма-қол", ky: "накталай", tg: "нақдина", tk: "nagt" },
  karta: { ru: "карта", en: "card", kk: "карта", ky: "карта", tg: "корт", tk: "kart" },
  jami: { ru: "Всего", en: "Total", kk: "Барлығы", ky: "Бардыгы", tg: "Ҳамагӣ", tk: "Jemi" },
  chegirma: { ru: "Скидка", en: "Discount", kk: "Жеңілдік", ky: "Арзандатуу", tg: "Тахфиф", tk: "Arzanlaşyk" },
  "to'langan": { ru: "Оплачено", en: "Paid", kk: "Төленген", ky: "Төлөнгөн", tg: "Пардохтшуда", tk: "Tölenen" },
  tasdiqlanmagan: { ru: "Не подтверждено", en: "Unconfirmed", kk: "Расталмаған", ky: "Тастыкталбаган", tg: "Тасдиқнашуда", tk: "Tassyklanmadyk" },
  "ortiqcha to'lov": { ru: "Переплата", en: "Overpaid", kk: "Артық төлем", ky: "Ашык төлөм", tg: "Пардохти изофа", tk: "Artykmaç töleg" },
  "qarzdorlik yo'q": { ru: "Задолженности нет", en: "No debt", kk: "Қарыз жоқ", ky: "Карыз жок", tg: "Қарз нест", tk: "Bergi ýok" },
  qarz: { ru: "Долг", en: "Debt", kk: "Қарыз", ky: "Карыз", tg: "Қарз", tk: "Bergi" },
  "muolajalar bo'yicha": { ru: "По процедурам", en: "By treatment", kk: "Емдеу бойынша", ky: "Дарылоо боюнча", tg: "Аз рӯи муолиҷа", tk: "Bejergi boýunça" },
  "qarz uchun eslatma": { ru: "Напоминание о долге", en: "Debt reminder", kk: "Қарыз туралы еске салу", ky: "Карыз жөнүндө эскертүү", tg: "Ёдоварӣ дар бораи қарз", tk: "Bergi barada duýduryş" },
  "to'lash uchun qoldi": { ru: "Осталось оплатить", en: "Remaining to pay", kk: "Төлеуге қалды", ky: "Төлөөгө калды", tg: "Барои пардохт монд", tk: "Tölemäge galdy" },
  "noma'lum bemor": { ru: "Неизвестный пациент", en: "Unknown patient", kk: "Белгісіз пациент", ky: "Белгисиз бейтап", tg: "Бемори номаълум", tk: "Näbelli näsag" },
  faol: { ru: "Активен", en: "Active", kk: "Белсенді", ky: "Активдүү", tg: "Фаъол", tk: "Işjeň" },
  yangi: { ru: "Новый", en: "New", kk: "Жаңа", ky: "Жаңы", tg: "Нав", tk: "Täze" },
  tahrirlash: { ru: "Редактировать", en: "Edit", kk: "Өңдеу", ky: "Түзөтүү", tg: "Таҳрир", tk: "Üýtgetmek" },
  "telegram xabar": { ru: "Сообщение в Telegram", en: "Telegram message", kk: "Telegram хабары", ky: "Telegram билдирүүсү", tg: "Паёми Telegram", tk: "Telegram habary" },
  yosh: { ru: "лет", en: "years old", kk: "жаста", ky: "жашта", tg: "сола", tk: "ýaşynda" },
  "tug'ilgan sana kiritilmagan": { ru: "Дата рождения не указана", en: "Birth date not entered", kk: "Туған күні енгізілмеген", ky: "Туулган күнү киргизилген эмес", tg: "Санаи таваллуд ворид нашудааст", tk: "Doglan senesi girizilmedi" },
  telefon: { ru: "Телефон", en: "Phone", kk: "Телефон", ky: "Телефон", tg: "Телефон", tk: "Telefon" },
  "pasport seriyasi": { ru: "Серия паспорта", en: "Passport series", kk: "Төлқұжат сериясы", ky: "Паспорт сериясы", tg: "Силсилаи шиноснома", tk: "Pasport seriýasy" },
  "oxirgi shifokor": { ru: "Последний врач", en: "Last doctor", kk: "Соңғы дәрігер", ky: "Акыркы дарыгер", tg: "Духтури охирин", tk: "Soňky lukman" },
  "moliyaviy holat": { ru: "Финансовое состояние", en: "Financial status", kk: "Қаржылық жағдай", ky: "Каржылык абал", tg: "Ҳолати молиявӣ", tk: "Maliýe ýagdaýy" },
  "joriy qarzdorlik": { ru: "Текущая задолженность", en: "Current debt", kk: "Ағымдағы қарыз", ky: "Учурдагы карыз", tg: "Қарзи ҷорӣ", tk: "Häzirki bergi" },
  "so'm": { ru: "сум", en: "UZS", kk: "сом", ky: "сом", tg: "сӯм", tk: "sim" },
  "yuborilmoqda...": { ru: "Отправляется...", en: "Sending...", kk: "Жіберілуде...", ky: "Жөнөтүлүүдө...", tg: "Фиристода мешавад...", tk: "Iberilýär..." },
  "to'lov so'rovini yuborish": { ru: "Отправить запрос на оплату", en: "Send payment request", kk: "Төлем сұрауын жіберу", ky: "Төлөм суроосун жөнөтүү", tg: "Фиристодани дархости пардохт", tk: "Töleg islegini ibermek" },
  "✅ so'rov telegram orqali yuborildi.": { ru: "✅ Запрос отправлен через Telegram.", en: "✅ Request sent via Telegram.", kk: "✅ Сұрау Telegram арқылы жіберілді.", ky: "✅ Суроо Telegram аркылуу жөнөтүлдү.", tg: "✅ Дархост тавассути Telegram фиристода шуд.", tk: "✅ Isleg Telegram arkaly iberildi." },
  "yuborib bo'lmadi.": { ru: "Не удалось отправить.", en: "Failed to send.", kk: "Жіберу мүмкін болмады.", ky: "Жөнөтүү мүмкүн болгон жок.", tg: "Фиристода нашуд.", tk: "Iberip bolmady." },
  "umumiy ma'lumot": { ru: "Общая информация", en: "General info", kk: "Жалпы ақпарат", ky: "Жалпы маалымат", tg: "Маълумоти умумӣ", tk: "Umumy maglumat" },
  "davolash rejasi": { ru: "План лечения", en: "Treatment plan", kk: "Емдеу жоспары", ky: "Дарылоо планы", tg: "Нақшаи муолиҷа", tk: "Bejergi meýilnamasy" },
  "muolaja tarixi": { ru: "История лечения", en: "Treatment history", kk: "Емдеу тарихы", ky: "Дарылоо тарыхы", tg: "Таърихи муолиҷа", tk: "Bejergi taryhy" },
  rentgenlar: { ru: "Рентгены", en: "X-rays", kk: "Рентгендер", ky: "Рентгендер", tg: "Рентгенҳо", tk: "Rentgenler" },
  "foto galereya": { ru: "Фотогалерея", en: "Photo gallery", kk: "Фотогалерея", ky: "Фотогалерея", tg: "Галереяи расмҳо", tk: "Surat galereýasy" },
  retseptlar: { ru: "Рецепты", en: "Prescriptions", kk: "Рецепттер", ky: "Рецепттер", tg: "Рецептҳо", tk: "Reseptler" },
  "to'lovlar": { ru: "Платежи", en: "Payments", kk: "Төлемдер", ky: "Төлөмдөр", tg: "Пардохтҳо", tk: "Tölegler" },
  eslatmalar: { ru: "Напоминания", en: "Reminders", kk: "Ескертулер", ky: "Эскертүүлөр", tg: "Ёдоварӣ", tk: "Duýduryşlar" },
  "shaxsiy ma'lumotlar": { ru: "Личные данные", en: "Personal information", kk: "Жеке деректер", ky: "Жеке маалымат", tg: "Маълумоти шахсӣ", tk: "Şahsy maglumatlar" },
  "to'liq ism": { ru: "Полное имя", en: "Full name", kk: "Толық аты", ky: "Толук аты", tg: "Номи пурра", tk: "Doly ady" },
  "qon guruhi": { ru: "Группа крови", en: "Blood group", kk: "Қан тобы", ky: "Кан тобу", tg: "Гурӯҳи хун", tk: "Gan topary" },
  "infeksiya holati": { ru: "Статус инфекции", en: "Infection status", kk: "Инфекция мәртебесі", ky: "Инфекция абалы", tg: "Ҳолати сироят", tk: "Ýokanç ýagdaýy" },
  bor: { ru: "Есть", en: "Yes", kk: "Бар", ky: "Бар", tg: "Ҳаст", tk: "Bar" },
  "yo'q": { ru: "Нет", en: "None", kk: "Жоқ", ky: "Жок", tg: "Нест", tk: "Ýok" },
  "tibbiy anamnez": { ru: "Медицинский анамнез", en: "Medical history", kk: "Медициналық анамнез", ky: "Медициналык анамнез", tg: "Анамнези тиббӣ", tk: "Lukmançylyk anamnezi" },
  allergiya: { ru: "Аллергия", en: "Allergy", kk: "Аллергия", ky: "Аллергия", tg: "Аллергия", tk: "Allergiýa" },
  diqqat: { ru: "Внимание", en: "Attention", kk: "Назар аударыңыз", ky: "Көңүл буруңуз", tg: "Диққат", tk: "Üns beriň" },
  "surunkali kasalliklar": { ru: "Хронические заболевания", en: "Chronic diseases", kk: "Созылмалы аурулар", ky: "Уланма ооруулар", tg: "Бемориҳои музмин", tk: "Dowamly keseller" },
  "allergiya yoki surunkali kasalliklar haqida ma'lumot kiritilmagan.": { ru: "Информация об аллергии или хронических заболеваниях не указана.", en: "No information about allergies or chronic diseases entered.", kk: "Аллергия немесе созылмалы аурулар туралы ақпарат енгізілмеген.", ky: "Аллергия же уланма ооруулар тууралуу маалымат киргизилген эмес.", tg: "Маълумот дар бораи аллергия ё бемориҳои музмин ворид нашудааст.", tk: "Allergiýa ýa-da dowamly keseller barada maglumat girizilmedi." },
  "to'lov cheklari": { ru: "Чеки об оплате", en: "Payment receipts", kk: "Төлем чектері", ky: "Төлөм чектери", tg: "Чекҳои пардохт", tk: "Töleg çekleri" },
  "bemor telegram bot orqali yuborgan to'lov cheklari — tasdiqlash yoki rad etish shu yerda.": { ru: "Чеки об оплате, отправленные пациентом через Telegram-бот — подтверждение или отклонение здесь.", en: "Payment receipts sent by the patient via the Telegram bot — confirm or reject here.", kk: "Пациент Telegram бот арқылы жіберген төлем чектері — растау немесе қабылдамау осында.", ky: "Бейтап Telegram бот аркылуу жөнөткөн төлөм чектери — ырастоо же четке кагуу ушул жерде.", tg: "Чекҳои пардохте, ки бемор тавассути боти Telegram фиристодааст — тасдиқ ё рад дар ин ҷо.", tk: "Näsagyň Telegram bot arkaly iberen töleg çekleri — tassyklamak ýa-da ret etmek şu ýerde." },
  "yuklanmoqda...": { ru: "Загружается...", en: "Loading...", kk: "Жүктелуде...", ky: "Жүктөлүүдө...", tg: "Бор карда мешавад...", tk: "Ýüklenýär..." },
  "hozircha birorta ham to'lov cheki yuborilmagan.": { ru: "Пока не отправлено ни одного чека об оплате.", en: "No payment receipts submitted yet.", kk: "Әзірге бірде-бір төлем чегі жіберілмеген.", ky: "Азырынча бир дагы төлөм чеги жөнөтүлгөн эмес.", tg: "Ҳанӯз ягон чеки пардохт фиристода нашудааст.", tk: "Heniz hiç bir töleg çeki iberilmedi." },
  tasdiqlash: { ru: "Подтвердить", en: "Confirm", kk: "Растау", ky: "Ырастоо", tg: "Тасдиқ кардан", tk: "Tassyklamak" },
  "rad etish": { ru: "Отклонить", en: "Reject", kk: "Қабылдамау", ky: "Четке кагуу", tg: "Рад кардан", tk: "Ret etmek" },
  tasdiqlangan: { ru: "Подтверждено", en: "Confirmed", kk: "Расталды", ky: "Ырасталды", tg: "Тасдиқшуда", tk: "Tassyklandy" },
  "rad etilgan": { ru: "Отклонено", en: "Rejected", kk: "Қабылданбады", ky: "Четке кагылды", tg: "Радшуда", tk: "Ret edildi" },
  "yangi eslatma qo'shish": { ru: "Добавить новое напоминание", en: "Add new reminder", kk: "Жаңа ескерту қосу", ky: "Жаңы эскертүү кошуу", tg: "Илова кардани ёдоварии нав", tk: "Täze duýduryş goşmak" },
  "masalan: ertaga qabulga kelishini eslating": { ru: "Например: Напомнить прийти на прием завтра", en: "E.g.: Remind to come for appointment tomorrow", kk: "Мысалы: Ертең қабылдауға келуін еске салыңыз", ky: "Мисалы: Эртең кабылдоого келерин эскертиңиз", tg: "Масалан: Фардо омадани ба қабулро ёдовар шавед", tk: "Mysal: Ertir kabula gelmegini ýatladyň" },
  "qo'shish": { ru: "Добавить", en: "Add", kk: "Қосу", ky: "Кошуу", tg: "Илова кардан", tk: "Goşmak" },
  "eslatmalar ro'yxati": { ru: "Список напоминаний", en: "Reminders list", kk: "Ескертулер тізімі", ky: "Эскертүүлөр тизмеси", tg: "Рӯйхати ёдоварӣ", tk: "Duýduryşlar sanawy" },
  "hozircha eslatma qo'shilmagan.": { ru: "Пока не добавлено ни одного напоминания.", en: "No reminders added yet.", kk: "Әзірге бірде-бір ескерту қосылмаған.", ky: "Азырынча бир дагы эскертүү кошулган эмес.", tg: "Ҳанӯз ягон ёдоварӣ илова нашудааст.", tk: "Heniz hiç bir duýduryş goşulmady." },
  "sana:": { ru: "Дата:", en: "Date:", kk: "Күні:", ky: "Күнү:", tg: "Сана:", tk: "Sene:" },
  "yuborildi:": { ru: "Отправлено:", en: "Sent:", kk: "Жіберілді:", ky: "Жөнөтүлдү:", tg: "Фиристода шуд:", tk: "Iberildi:" },
  bajarilgan: { ru: "Выполнено", en: "Done", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷрошуда", tk: "Ýerine ýetirildi" },
  kutilmoqda: { ru: "Ожидает", en: "Pending", kk: "Күтілуде", ky: "Күтүлүүдө", tg: "Интизор", tk: "Garaşylýar" },
  yuborish: { ru: "Отправить", en: "Send", kk: "Жіберу", ky: "Жөнөтүү", tg: "Фиристодан", tk: "Ibermek" },
  bajarildi: { ru: "Выполнено", en: "Done", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷро шуд", tk: "Ýerine ýetirildi" },
};

export default function PatientProfile({
  patientId,
  patient: rawPatient,
  onBack,
  doctorId,
  staffToken,
  language,
}: PatientProfileProps) {
  const localLang: keyof PatientProfileDictEntry | null =
    (language === "ru" || language === "en" || language === "kk" || language === "ky" || language === "tg" || language === "tk")
      ? language
      : null;

  const t = (text: string): string => {
    if (!language) return text;
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof (typeof TRANSLATIONS)["uz"]];
    }
    const cleanText = text.trim().toLowerCase().replace(/\s+/g, " ");
    const entry = PATIENT_PROFILE_TRANSLATIONS[cleanText] || PATIENT_PROFILE_TRANSLATIONS[text];
    if (entry) {
      if (localLang) return entry[localLang];
      const idx = text.search(/[a-zA-Zʻʼ'’]/);
      if (idx === -1) return text;
      return text.slice(0, idx) + text.charAt(idx).toUpperCase() + text.slice(idx + 1);
    }
    return text;
  };
  const [activeTab, setActiveTab] = useState("general");
  const [planItems, setPlanItems] = useState<PlanItemLike[]>([]);
  const [charges, setCharges] = useState<TreatmentCharge[]>([]);
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [paymentRequestMsg, setPaymentRequestMsg] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [recordingCash, setRecordingCash] = useState(false);
  const [cashMsg, setCashMsg] = useState<string | null>(null);

  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptActionId, setReceiptActionId] = useState<string | null>(null);
  const [viewerReceipt, setViewerReceipt] = useState<PaymentReceipt | null>(null);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminderDueDate, setReminderDueDate] = useState("");
  const [reminderActionId, setReminderActionId] = useState<string | null>(null);
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  const authHeaders = staffToken ? { Authorization: `Bearer ${staffToken}` } : {};

  const fetchReceipts = () => {
    setReceiptsLoading(true);
    fetch(`${getApiUrl()}/api/payment-receipts?patientId=${encodeURIComponent(String(patientId))}`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReceipts(Array.isArray(data) ? data : []))
      .catch(() => setReceipts([]))
      .finally(() => setReceiptsLoading(false));
  };

  const fetchReminders = () => {
    setRemindersLoading(true);
    fetch(`${getApiUrl()}/api/reminders?patientId=${encodeURIComponent(String(patientId))}`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReminders(Array.isArray(data) ? data : []))
      .catch(() => setReminders([]))
      .finally(() => setRemindersLoading(false));
  };

  useEffect(() => {
    if (activeTab === "payments") fetchReceipts();
    if (activeTab === "reminders") fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, patientId]);

  const handleResolveReceipt = async (id: string, status: "confirmed" | "rejected") => {
    setReceiptActionId(id);
    try {
      const res = await fetch(`${getApiUrl()}/api/payment-receipts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("failed");
      setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setViewerReceipt(null);
    } catch {
      // best-effort UI, silently ignore
    } finally {
      setReceiptActionId(null);
    }
  };

  const handleRequestPayment = async () => {
    if (!doctorId) return;
    setRequestingPayment(true);
    setPaymentRequestMsg(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/request-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ patientId, doctorId, amount: totalDebt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "failed");
      setPaymentRequestMsg(`✅ ${t("so'rov telegram orqali yuborildi.")}`);
    } catch (err: any) {
      setPaymentRequestMsg(`⚠️ ${err.message === 'failed' ? t("yuborib bo'lmadi.") : err.message}`);
    } finally {
      setRequestingPayment(false);
      setTimeout(() => setPaymentRequestMsg(null), 5000);
    }
  };

  const handleRecordCashPayment = async () => {
    const amount = Number(cashAmount);
    if (!doctorId || !patient?.clinicId || !(amount > 0)) return;
    setRecordingCash(true);
    setCashMsg(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/payment-receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          clinicId: patient.clinicId,
          doctorId,
          patientId,
          patientName: patient?.fullName,
          amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "failed");
      setReceipts((prev) => [data, ...prev]);
      setCashMsg(`✅ ${t("naqd to'lov qabul qilindi.")}`);
      setCashAmount("");
    } catch (err: any) {
      setCashMsg(`⚠️ ${t("yuborib bo'lmadi.")}`);
    } finally {
      setRecordingCash(false);
      setTimeout(() => setCashMsg(null), 5000);
    }
  };

  const handleAddReminder = async () => {
    if (!doctorId || !reminderText.trim() || !patient?.clinicId) return;
    setIsAddingReminder(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          clinicId: patient.clinicId,
          doctorId,
          patientId,
          text: reminderText.trim(),
          dueDate: reminderDueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const created = await res.json();
      setReminders((prev) => [created, ...prev]);
      setReminderText("");
      setReminderDueDate("");
    } catch {
      // best-effort
    } finally {
      setIsAddingReminder(false);
    }
  };

  const handleReminderAction = async (id: string, status: "sent" | "done") => {
    setReminderActionId(id);
    try {
      const res = await fetch(`${getApiUrl()}/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("failed");
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch {
      // best-effort
    } finally {
      setReminderActionId(null);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await fetch(`${getApiUrl()}/api/reminders/${id}`, { method: "DELETE", headers: authHeaders });
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // best-effort
    }
  };

  const patient = rawPatient
    ? {
        ...rawPatient,
        fullName: decodeLegacyEntities(rawPatient.fullName),
        phone: decodeLegacyEntities(rawPatient.phone),
        passportSerial: decodeLegacyEntities(rawPatient.passportSerial),
        bloodGroup: decodeLegacyEntities(rawPatient.bloodGroup),
        allergies: decodeLegacyEntities(rawPatient.allergies),
        chronicDiseases: decodeLegacyEntities(rawPatient.chronicDiseases),
      }
    : undefined;

  const visitCount = patient?.clinicVisits?.length || 0;
  const age = (() => {
    if (!patient?.birthDate) return null;
    const dob = new Date(patient.birthDate);
    if (isNaN(dob.getTime())) return null;
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  })();
  const lastVisit = patient?.clinicVisits?.length
    ? [...patient.clinicVisits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const [showEditModal, setShowEditModal] = useState(false);

  // Back and Escape close these instead of leaving the patient card.
  useHistoryLayer(showEditModal, () => setShowEditModal(false), 'patient-edit');
  useHistoryLayer(!!viewerReceipt, () => setViewerReceipt(null), 'receipt-viewer');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "", phone: "", birthDate: "", bloodGroup: "", allergies: "", chronicDiseases: "", hasInfection: false,
  });

  const openEditModal = () => {
    setEditForm({
      fullName: patient?.fullName || "",
      phone: patient?.phone || "",
      birthDate: patient?.birthDate || "",
      bloodGroup: patient?.bloodGroup || "",
      allergies: patient?.allergies || "",
      chronicDiseases: patient?.chronicDiseases || "",
      hasInfection: !!patient?.hasInfection,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!patient || !editForm.fullName.trim()) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          id: patientId,
          clinicId: patient.clinicId,
          fullName: editForm.fullName.trim(),
          phone: editForm.phone.trim(),
          birthDate: editForm.birthDate || undefined,
          bloodGroup: editForm.bloodGroup || undefined,
          allergies: editForm.allergies.trim() || undefined,
          chronicDiseases: editForm.chronicDiseases.trim() || undefined,
          hasInfection: editForm.hasInfection,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setShowEditModal(false);
    } catch {
      alert(t("yuborib bo'lmadi."));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSendTelegramMessage = async () => {
    if (!patient?.telegramChatId) {
      alert("Bemor Telegram botga ulanmagan.");
      return;
    }
    const text = window.prompt("Bemorga yuboriladigan xabar matnini kiriting:");
    if (!text || !text.trim()) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/telegram/bulk-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatIds: [patient.telegramChatId], text: text.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.sent > 0) {
        alert("Xabar yuborildi.");
      } else {
        alert(t("yuborib bo'lmadi."));
      }
    } catch {
      alert(t("yuborib bo'lmadi."));
    }
  };

  // Live treatment plan for this patient. Kept as raw items (rather than a
  // pre-summed number) so the billing util can reconcile them against payments.
  useEffect(() => {
    if (!patientId) return;
    const unsub = onSnapshot(
      collection(db, `patients/${patientId}/treatmentPlans`),
      (snapshot) => {
        const items: PlanItemLike[] = [];
        snapshot.forEach(d => items.push({ id: d.id, ...(d.data() as any) }));
        setPlanItems(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `patients/${patientId}/treatmentPlans`);
      }
    );
    return () => unsub();
  }, [patientId]);

  // charges/receipts used to only load once the staff member clicked into the
  // "to'lovlar" tab (fetchReceipts was gated on activeTab === "payments", and
  // nothing ever called setCharges at all) — so `balance`/`totalDebt` below,
  // which the cash-payment box prefills from, silently used undiscounted list
  // prices and zero payments until then. Both now load as soon as the profile
  // opens, same as planItems.
  useEffect(() => {
    if (!patientId || !staffToken) return;
    let active = true;
    fetchTreatmentCharges({ patientId: String(patientId) }, staffToken)
      .then((data) => { if (active) setCharges(data); });
    fetch(`${getApiUrl()}/api/payment-receipts?patientId=${encodeURIComponent(String(patientId))}`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (active) setReceipts(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setReceipts([]); });
    return () => { active = false; };
  }, [patientId, staffToken]);

  // Every money figure on this screen comes from one place. Crucially this nets
  // confirmed payments off the plan total — the old code summed plan prices only,
  // so a patient who had paid in full still showed their whole plan as debt.
  const balance = useMemo(
    () => patientBalance(planItems, charges, receipts, {
      clinicId: patient?.clinicId,
      patientId: String(patientId),
      doctorId,
      patientName: patient?.fullName,
    }),
    [planItems, charges, receipts, patientId, patient?.clinicId, patient?.fullName, doctorId]
  );
  const totalDebt = balance.debt;

  // Prefill the cash box with what's actually outstanding, so the common case
  // (patient settles their balance) is one click.
  useEffect(() => {
    if (totalDebt > 0 && !cashAmount) setCashAmount(String(totalDebt));
  }, [totalDebt]);

  const tabs = [
    { id: "general", label: t("umumiy ma'lumot"), icon: User },
    { id: "chart", label: "Dental Chart", icon: Activity },
    { id: "plan", label: t("davolash rejasi"), icon: FileText },
    { id: "history", label: t("muolaja tarixi"), icon: History },
    { id: "xray", label: t("rentgenlar"), icon: ImageIcon },
    { id: "photos", label: t("foto galereya"), icon: ImageIcon },
    { id: "prescriptions", label: t("retseptlar"), icon: FileText },
    { id: "payments", label: t("to'lovlar"), icon: CreditCard },
    { id: "reminders", label: t("eslatmalar"), icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {patient?.fullName || t("noma'lum bemor")}
              </h2>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${visitCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {visitCount > 0 ? t("faol") : t("yangi")}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID: #{patientId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openEditModal}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-4 h-4" /> {t("tahrirlash")}
          </button>
          <button
            onClick={handleSendTelegramMessage}
            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> {t("telegram xabar")}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar Info */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
            <img
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${patientId}`}
              className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 border-4 border-slate-50"
            />
            <h3 className="font-bold text-slate-800 text-lg">{patient?.fullName || t("noma'lum bemor")}</h3>
            <p className="text-sm text-slate-500 mb-4">
              {age !== null ? `${age} ${t("yosh")}` : ""}{patient?.birthDate ? ` (${patient.birthDate})` : (age === null ? t("tug'ilgan sana kiritilmagan") : "")}
            </p>

            <div className="flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t("telefon")}
                  </p>
                  <p className="font-mono text-slate-700 font-medium">
                    {patient?.phone || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t("pasport seriyasi")}
                  </p>
                  <p className="text-slate-700 font-medium">{patient?.passportSerial || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t("oxirgi shifokor")}
                  </p>
                  <p className="text-slate-700 font-medium">
                    {lastVisit?.doctorName || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h4 className="font-bold text-slate-800 text-sm mb-4">
              {t("moliyaviy holat")}
            </h4>
            {/* Breakdown first, then the headline. A patient who owes nothing gets
                a green card, not a red "0" — the old version framed every patient
                as a debtor regardless of what they had paid. */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">{t("jami")}</span>
                <span className="font-bold text-slate-700">{balance.total.toLocaleString()}</span>
              </div>
              {balance.discount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{t("chegirma")}</span>
                  <span className="font-bold text-violet-600">−{balance.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">{t("to'langan")}</span>
                <span className="font-bold text-emerald-600">{balance.paid.toLocaleString()}</span>
              </div>
              {balance.pending > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{t("tasdiqlanmagan")}</span>
                  <span className="font-bold text-amber-600">{balance.pending.toLocaleString()}</span>
                </div>
              )}
              {balance.credit > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{t("ortiqcha to'lov")}</span>
                  <span className="font-bold text-sky-600">+{balance.credit.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className={`border rounded-2xl p-4 text-center ${totalDebt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${totalDebt > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                {totalDebt > 0 ? t("joriy qarzdorlik") : t("qarzdorlik yo'q")}
              </p>
              <p className={`text-2xl font-black ${totalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {totalDebt > 0 ? totalDebt.toLocaleString() : "0"}{" "}
                <span className={`text-xs font-bold ${totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{t("so'm")}</span>
              </p>
              <button
                onClick={handleRequestPayment}
                disabled={requestingPayment || !doctorId || totalDebt <= 0}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl mt-3 transition-colors shadow-md shadow-rose-500/20"
              >
                {requestingPayment ? t("yuborilmoqda...") : t("to'lov so'rovini yuborish")}
              </button>
              {paymentRequestMsg && (
                <p className="text-[10px] font-bold text-rose-600 mt-2">{paymentRequestMsg}</p>
              )}
              <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${totalDebt > 0 ? 'border-rose-100' : 'border-emerald-100'}`}>
                <input
                  type="number"
                  min="1"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder={t("summa (so'm)")}
                  className="w-24 min-w-0 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={handleRecordCashPayment}
                  disabled={recordingCash || !doctorId || !(Number(cashAmount) > 0)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-emerald-500/20"
                >
                  {recordingCash ? t("yuborilmoqda...") : `💵 ${t("naqd qabul qildim")}`}
                </button>
              </div>
              {cashMsg && (
                <p className="text-[10px] font-bold text-emerald-600 mt-2">{cashMsg}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Content */}
        {/* Scales with the viewport instead of a fixed 500/700px, which either
            cramped tall content or left a wide band of empty page below the
            card on a larger monitor. min-h keeps it usable on short mobile
            viewports; max-h keeps it from growing absurdly tall on 4K screens. */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[70vh] min-h-[520px] max-h-[880px]">
          <div className="flex overflow-x-auto border-b border-slate-100 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-emerald-500 text-emerald-600 bg-emerald-50/30"
                    : "border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className={`flex-1 flex flex-col overflow-y-auto bg-slate-50/30 ${activeTab === "chart" ? "p-0" : "p-6"}`}>
            {activeTab === "general" && (
              <div className="space-y-6">
                <AIAssistantWidget patientId={patientId} patient={patient} />
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-500" /> {t("shaxsiy ma'lumotlar")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        {t("to'liq ism")}
                      </p>
                      <p className="text-slate-800 font-medium">
                        {patient?.fullName || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        {t("qon guruhi")}
                      </p>
                      <p className="text-slate-800 font-medium">{patient?.bloodGroup || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        {t("pasport seriyasi")}
                      </p>
                      <p className="text-slate-800 font-medium">
                        {patient?.passportSerial || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        {t("infeksiya holati")}
                      </p>
                      <p className="text-slate-800 font-medium">{patient?.hasInfection ? t("bor") : t("yo'q")}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> {t("tibbiy anamnez")}
                  </h4>
                  <div className="space-y-3">
                    {patient?.allergies ? (
                      <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-rose-500" />
                          <div>
                            <p className="text-xs font-bold text-rose-700">
                              {t("allergiya")}
                            </p>
                            <p className="text-[10px] text-rose-600 font-medium">
                              {patient.allergies}
                            </p>
                          </div>
                        </div>
                        <span className="bg-rose-200 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {t("diqqat")}
                        </span>
                      </div>
                    ) : null}
                    {patient?.chronicDiseases ? (
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-xs font-bold text-amber-700">
                              {t("surunkali kasalliklar")}
                            </p>
                            <p className="text-[10px] text-amber-600 font-medium">
                              {patient.chronicDiseases}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {!patient?.allergies && !patient?.chronicDiseases ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 leading-snug">
                          {t("allergiya yoki surunkali kasalliklar haqida ma'lumot kiritilmagan.")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chart" && (
              <div className="flex-1 flex flex-col h-full w-full">
                <DentalChart
                  patientId={patientId.toString()}
                  language={language}
                  clinicId={patient?.clinicId}
                  doctorId={doctorId}
                  patientName={patient?.fullName}
                  staffToken={staffToken}
                />
              </div>
            )}

            {activeTab === "plan" && (
              // min-h-full, not h-full: the plan can be arbitrarily long (one
              // row per treatment), and pinning it to exactly the tab height
              // made everything past the fold unreachable instead of scrolling.
              <div className="min-h-full">
                <TreatmentPlan patientId={patientId.toString()}
                  language={language}
                  clinicId={patient?.clinicId}
                  doctorId={doctorId}
                  patientName={patient?.fullName}
                  staffToken={staffToken}
                />
              </div>
            )}

            {activeTab === "xray" && (
              <div className="h-full">
                <XRayCenter patientId={patientId.toString()} clinicId={patient?.clinicId} patientName={patient?.fullName}
                  language={language}
                />
              </div>
            )}
            
            {activeTab === "history" && (
              <div className="h-full">
                <TreatmentHistory patientId={patientId.toString()} patientName={patient?.fullName}
                  language={language}
                  staffToken={staffToken}
                />
              </div>
            )}
            
            {activeTab === "photos" && (
              <div className="h-full">
                <PhotoGallery patientId={patientId.toString()} patientName={patient?.fullName}
                  language={language}
                />
              </div>
            )}
            
            {activeTab === "prescriptions" && (
              <div className="h-full">
                <Prescriptions
                  patientId={patientId.toString()}
                  patientName={patient?.fullName}
                  patientTelegramChatId={patient?.telegramChatId}
                  language={language}
                />
              </div>
            )}
            
            {activeTab === "payments" && (
              <div className="space-y-4">
                {/* Same numbers as the sidebar card and Davolash rejasi tab —
                    one balance, shown everywhere, never a second computation. */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" /> {t("moliyaviy holat")}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("jami")}</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{balance.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">{t("chegirma")}</p>
                      <p className="text-sm font-black text-violet-700 mt-0.5">{balance.discount.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">{t("to'langan")}</p>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">{balance.paid.toLocaleString()}</p>
                    </div>
                    <div className={`rounded-xl p-3 border ${totalDebt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${totalDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{t("qarz")}</p>
                      <p className={`text-sm font-black mt-0.5 ${totalDebt > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{totalDebt.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Per-treatment breakdown, so "why do they owe X" is answerable
                    from this same tab instead of hopping to Davolash rejasi. */}
                {planItems.filter((i) => i.status !== 'Cancelled').length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" /> {t("muolajalar bo'yicha")}
                    </h4>
                    <div className="space-y-2">
                      {planItems.filter((i) => i.status !== 'Cancelled').map((item) => {
                        const b = itemBalance(item.id, balance.ledger);
                        return (
                          <div key={item.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{item.treatment}</p>
                              <p className="text-[10px] text-slate-400">
                                {(b.listPrice || item.price).toLocaleString()} {t("so'm")}
                                {b.discount > 0 && <span className="text-violet-500"> · −{b.discount.toLocaleString()}</span>}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-bold text-emerald-600">{b.paid.toLocaleString()}</p>
                              <p className={`text-[10px] font-bold ${b.debt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{b.debt.toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" /> {t("to'lov cheklari")}
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">{t("bemor telegram bot orqali yuborgan to'lov cheklari — tasdiqlash yoki rad etish shu yerda.")}</p>
                  {receiptsLoading ? (
                    <p className="text-xs text-slate-400">{t("yuklanmoqda...")}</p>
                  ) : receipts.length === 0 ? (
                    <p className="text-xs text-slate-400">{t("hozircha birorta ham to'lov cheki yuborilmagan.")}</p>
                  ) : (
                    <div className="space-y-3">
                      {receipts.map((r) => (
                        <div key={r.id} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3">
                          {r.imageData ? (
                            <button type="button" onClick={() => setViewerReceipt(r)} className="shrink-0">
                              <img src={r.imageData} alt="Chek" className="w-14 h-14 rounded-lg object-cover border border-slate-200 hover:opacity-80 transition-opacity" />
                            </button>
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0">💵</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700">
                              {r.paymentMethod === 'cash' ? `💵 ${t("naqd")}` : `💳 ${t("karta")}`}
                              {typeof r.amount === 'number' ? ` · ${r.amount.toLocaleString()} ${t("so'm")}` : ''}
                            </p>
                            <p className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString("uz-UZ")}</p>
                          </div>
                          {r.status === "pending" ? (
                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleResolveReceipt(r.id, "confirmed")}
                                disabled={receiptActionId === r.id}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                ✓ {t("tasdiqlash")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResolveReceipt(r.id, "rejected")}
                                disabled={receiptActionId === r.id}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-500 rounded-lg text-xs font-bold transition-colors"
                              >
                                ✕ {t("rad etish")}
                              </button>
                            </div>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase shrink-0 ${r.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                              {r.status === "confirmed" ? t("tasdiqlangan") : t("rad etilgan")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {viewerReceipt && (
                  <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setViewerReceipt(null)}>
                    <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => setViewerReceipt(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
                        <X className="w-6 h-6" />
                      </button>
                      <img src={viewerReceipt.imageData} alt="Chek" className="w-full rounded-2xl border border-slate-700" />
                      {viewerReceipt.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => handleResolveReceipt(viewerReceipt.id, "confirmed")}
                            disabled={receiptActionId === viewerReceipt.id}
                            className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors"
                          >
                            ✓ {t("tasdiqlash")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveReceipt(viewerReceipt.id, "rejected")}
                            disabled={receiptActionId === viewerReceipt.id}
                            className="flex-1 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 rounded-xl font-bold text-sm transition-colors"
                          >
                            ✕ {t("rad etish")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reminders" && (
              <div className="space-y-4">
                {/* So a doctor following up on reminders sees the debt without
                    switching tabs, and can turn it into a reminder in one click. */}
                <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 flex-wrap ${totalDebt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center gap-2.5">
                    <Wallet className={`w-4 h-4 shrink-0 ${totalDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${totalDebt > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {totalDebt > 0 ? t("joriy qarzdorlik") : t("qarzdorlik yo'q")}
                      </p>
                      {totalDebt > 0 && (
                        <p className="text-sm font-black text-rose-700">{totalDebt.toLocaleString()} {t("so'm")}</p>
                      )}
                    </div>
                  </div>
                  {totalDebt > 0 && (
                    <button
                      type="button"
                      onClick={() => setReminderText(`${t("to'lash uchun qoldi")}: ${totalDebt.toLocaleString()} ${t("so'm")}`)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" /> {t("qarz uchun eslatma")}
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-500" /> {t("yangi eslatma qo'shish")}
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={reminderText}
                      onChange={(e) => setReminderText(e.target.value)}
                      placeholder={t("masalan: ertaga qabulga kelishini eslating")}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors text-slate-800"
                    />
                    <input
                      type="date"
                      value={reminderDueDate}
                      onChange={(e) => setReminderDueDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors text-slate-800"
                    />
                    <button
                      onClick={handleAddReminder}
                      disabled={isAddingReminder || !reminderText.trim() || !doctorId}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-1.5 justify-center shrink-0"
                    >
                      <Plus className="w-4 h-4" /> {t("qo'shish")}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-base mb-4">{t("eslatmalar ro'yxati")}</h4>
                  {remindersLoading ? (
                    <p className="text-xs text-slate-400">{t("yuklanmoqda...")}</p>
                  ) : reminders.length === 0 ? (
                    <p className="text-xs text-slate-400">{t("hozircha eslatma qo'shilmagan.")}</p>
                  ) : (
                    <div className="space-y-3">
                      {reminders.map((r) => (
                        <div key={r.id} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 font-medium">{r.text}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {r.dueDate ? `${t("sana:")} ${r.dueDate} · ` : ""}
                              {r.status === "sent" ? `${t("yuborildi:")} ${r.sentAt ? new Date(r.sentAt).toLocaleString("uz-UZ") : ""}` : r.status === "done" ? t("bajarilgan") : t("kutilmoqda")}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {r.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleReminderAction(r.id, "sent")}
                                disabled={reminderActionId === r.id}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" /> {t("yuborish")}
                              </button>
                            )}
                            {r.status !== "done" && (
                              <button
                                type="button"
                                onClick={() => handleReminderAction(r.id, "done")}
                                disabled={reminderActionId === r.id}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> {t("bajarildi")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteReminder(r.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg text-xs font-bold transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800">{t("tahrirlash")}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("to'liq ism")}</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("telefon")}</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Tug'ilgan sana</label>
                  <input
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("qon guruhi")}</label>
                  <select
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                  >
                    <option value="">—</option>
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
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Allergiyalar</label>
                <input
                  type="text"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Surunkali kasalliklar</label>
                <textarea
                  value={editForm.chronicDiseases}
                  onChange={(e) => setEditForm({ ...editForm, chronicDiseases: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium bg-white text-slate-800 h-16 resize-none"
                />
              </div>
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="edit-has-infection"
                  checked={editForm.hasInfection}
                  onChange={(e) => setEditForm({ ...editForm, hasInfection: e.target.checked })}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer mt-0.5 shrink-0"
                />
                <label htmlFor="edit-has-infection" className="text-xs font-bold text-rose-900 leading-tight cursor-pointer select-none">
                  Jiddiy yuqumli kasallik mavjud
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editForm.fullName.trim() || isSavingEdit}
                className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md shadow-blue-500/20"
              >
                {isSavingEdit ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
