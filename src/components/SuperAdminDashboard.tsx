import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Clinic, Doctor, QueueItem, SaaSPayment, Advertisement } from '../types';
import { TRANSLATIONS, Language } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../utils/imageCompressor';
import { LanguageSwitcher } from './LanguageSwitcher';
import { 
  Building, 
  Plus, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  DollarSign, 
  Activity, 
  ShieldAlert, 
  Eye,
  EyeOff,
  Users,
  Crown,
  KeyRound,
  Shield,
  Save,
  Search,
  Globe,
  Inbox,
  Trash2,
  Pencil,
  Megaphone,
  Send,
  Bot,
  LayoutDashboard,
  Layers,
  ChevronRight
} from 'lucide-react';

interface SuperAdminDashboardProps {
  clinics: Clinic[];
  queues: QueueItem[];
  doctors: Doctor[];
  onAddClinic: (newClinic: Clinic) => Promise<boolean>;
  onAddDoctor?: (newDoctor: Doctor) => Promise<boolean>;
  onToggleSubscription: (clinicId: string) => void;
  onUpdateClinicCreds?: (clinicId: string, login: string, pass: string) => Promise<boolean>;
  onUpdateDoctorCreds?: (doctorId: string, login: string, pass: string) => Promise<boolean>;
  onUpdateDoctorDetails?: (doctorId: string, updates: Partial<Doctor>) => Promise<boolean>;
  onDeleteClinic?: (clinicId: string) => void;
  onDeleteDoctor?: (doctorId: string) => void;
  language: Language;
  setLanguage?: (l: Language) => void;

  // Custom added billing variables
  saasPayments?: SaaSPayment[];
  onApproveSaaSPayment?: (id: string) => void;
  onUpdateClinicDetails?: (updatedClinic: Clinic) => void;
  
  // Custom superadmin credentials
  superadminLogin?: string;
  superadminPassword?: string;
  superadminToken?: string | null;
  onUpdateSuperadminCreds?: (currentPass: string, newLogin: string, newPass: string) => Promise<boolean>;
  onMockSendPayment?: (clinicId: string) => void;
  // Lets the superadmin open any Director/Doctor panel using their own superadmin
  // session — no need to know that clinic's/doctor's actual password.
  onAdminImpersonate?: (role: 'director' | 'doctor', id: string) => void;
}

// Sidebar navigation sections for the SuperAdmin dashboard — groups the previously
// long single-scroll page into tabs (mirrors the SETTINGS_SECTIONS pattern used in
// Settings.tsx). Each id maps to a case in the JSX below via `activeSection`.
const SUPERADMIN_SECTIONS = [
  { id: 'overview', label: "Umumiy ko'rinish", icon: LayoutDashboard },
  { id: 'onboarding', label: 'Yangi klinika', icon: Plus },
  { id: 'clinics', label: 'Klinikalar', icon: Building },
  { id: 'group-report', label: 'Guruh hisoboti', icon: Layers },
  { id: 'doctors', label: 'Shifokorlar', icon: Users },
  { id: 'ads', label: 'Reklama', icon: Megaphone },
  { id: 'telegram', label: 'Telegram bot', icon: Bot },
  { id: 'security', label: 'Xavfsizlik', icon: Shield },
  { id: 'audit', label: 'Audit jurnali', icon: ShieldAlert },
];

export default function SuperAdminDashboard({
  clinics,
  queues,
  doctors,
  onAddClinic,
  onAddDoctor,
  onToggleSubscription,
  onUpdateClinicCreds,
  onUpdateDoctorCreds,
  onUpdateDoctorDetails,
  onDeleteClinic,
  onDeleteDoctor,
  language,
  setLanguage,
  saasPayments = [],
  onApproveSaaSPayment,
  onUpdateClinicDetails,
  superadminLogin = '',
  superadminPassword = '',
  superadminToken = null,
  onUpdateSuperadminCreds,
  onAdminImpersonate
}: SuperAdminDashboardProps) {

  const t = (key: keyof typeof TRANSLATIONS['uz']) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['uz'][key] || String(key);
  };

  // Local text-keyed translation helper for strings not in the global TRANSLATIONS dictionary
  // (mirrors the same pattern used in ClientDashboard.tsx / DirectorDashboard.tsx).
  type LocalDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
  const localDict: Record<string, LocalDictEntry> = {
    "hisob ma'lumotlari nusxalandi!": { ru: "Учетные данные скопированы!", en: "Credentials copied successfully!", kk: "Есептік деректер көшірілді!", ky: "Каттоо маалыматтары көчүрүлдү!", tg: "Маълумоти ҳисоб нусхабардорӣ шуд!", tk: "Hasap maglumatlary göçürildi!" },
    "nusxalandi!": { ru: "Скопировано!", en: "Copied!", kk: "Көшірілді!", ky: "Көчүрүлдү!", tg: "Нусха бардошта шуд!", tk: "Göçürildi!" },
    "iltimos, barcha majburiy maydonlarni to'ldiring!": { ru: "Пожалуйста, заполните все обязательные поля!", en: "Please fill in all required fields!", kk: "Өтінеміз, барлық міндетті өрістерді толтырыңыз!", ky: "Сураныч, бардык милдеттүү талааларды толтуруңуз!", tg: "Лутфан, ҳамаи майдонҳои ҳатмиро пур кунед!", tk: "Haýyş, ähli hökmany meýdanlary dolduryň!" },
    "ushbu subdomen bilan ro'yxatdan o'tilgan!": { ru: "Этот субдомен уже зарегистрирован!", en: "This subdomain is already registered!", kk: "Бұл субдомен бұрын тіркелген!", ky: "Бул субдомен мурунтан катталган!", tg: "Ин субдомен аллакай сабт шудааст!", tk: "Bu subdomen eýýäm hasaba alnan!" },
    "yangi filial tarmoqqa muvaffaqiyatli qo'shildi!": { ru: "Новый филиал успешно добавлен в сеть!", en: "New clinic onboarded successfully!", kk: "Жаңа филиал желіге сәтті қосылды!", ky: "Жаңы филиал тармакка ийгиликтүү кошулду!", tg: "Филиали нав ба шабака бомуваффақият илова шуд!", tk: "Täze şahamça ulgama üstünlikli goşuldy!" },
    "login va parol bo'sh bo'lishi mumkin emas!": { ru: "Логин и пароль не могут быть пустыми!", en: "Login and password cannot be empty!", kk: "Логин мен құпия сөз бос болмауы керек!", ky: "Логин жана сырсөз бош болбошу керек!", tg: "Логин ва парол наметавонанд холӣ бошанд!", tk: "Login we parol boş bolup bilmez!" },
    "klinika hisob ma'lumotlari yangilandi!": { ru: "Учетные данные клиники обновлены!", en: "Clinic credentials updated successfully!", kk: "Клиника есептік деректері жаңартылды!", ky: "Клиника каттоо маалыматтары жаңыланды!", tg: "Маълумоти ҳисоби клиника нав шуд!", tk: "Klinikanyň hasap maglumatlary täzelendi!" },
    "shifokor hisob ma'lumotlari yangilandi!": { ru: "Учетные данные врача обновлены!", en: "Doctor credentials updated successfully!", kk: "Дәрігердің есептік деректері жаңартылды!", ky: "Дарыгердин каттоо маалыматтары жаңыланды!", tg: "Маълумоти ҳисоби духтур нав шуд!", tk: "Lukmanyň hasap maglumatlary täzelendi!" },
    "majburiy maydonlarni to'ldiring!": { ru: "Заполните обязательные поля!", en: "Please fill required fields!", kk: "Міндетті өрістерді толтырыңыз!", ky: "Милдеттүү талааларды толтуруңуз!", tg: "Майдонҳои ҳатмиро пур кунед!", tk: "Hökmany meýdanlary dolduryň!" },
    "yangi shifokor muvaffaqiyatli qo'shildi!": { ru: "Новый врач успешно добавлен!", en: "New doctor added successfully!", kk: "Жаңа дәрігер сәтті қосылды!", ky: "Жаңы дарыгер ийгиликтүү кошулду!", tg: "Духтури нав бомуваффақият илова шуд!", tk: "Täze lukman üstünlikli goşuldy!" },
    "📈 kelgusi davr rejalashtirish kalkulyatori": { ru: "📈 Калькулятор Планирования Будущих Периодов", en: "📈 Future Planning Forecast Calculator", kk: "📈 Болашақ Кезеңді Жоспарлау Калькуляторы", ky: "📈 Келечек Мезгилди Пландаштыруу Калькулятору", tg: "📈 Ҳисобкунаки Банақшагирии Давраи Оянда", tk: "📈 Geljekki Döwri Meýilleşdirmek Hasaplaýjysy" },
    "yangi kutilayotgan filiallar soni:": { ru: "Количество новых филиалов:", en: "Number of new branches:", kk: "Жаңа күтілетін филиалдар саны:", ky: "Жаңы күтүлгөн филиалдардын саны:", tg: "Шумораи филиалҳои нави интизоршаванда:", tk: "Garaşylýan täze şahamçalaryň sany:" },
    "oylik tarmoq to'lovi (xar bitta):": { ru: "Ежемесячный платеж (за каждый):", en: "Monthly fee (per clinic):", kk: "Айлық желі төлемі (әрқайсысы):", ky: "Айлык тармак төлөмү (ар бири):", tg: "Пардохти моҳонаи шабака (ҳар кадом):", tk: "Aýlyk ulgam töleg (her biri):" },
    "prognoz natijasi": { ru: "РЕЗУЛЬТАТ ПРОГНОЗА", en: "FORECAST ACCUMULATION", kk: "БОЛЖАМ НӘТИЖЕСІ", ky: "БОЛЖОЛ НАТЫЙЖАСЫ", tg: "НАТИҶАИ ПЕШБИНӢ", tk: "CAKLAMA NETIJESI" },
    "o'chirish": { ru: "Удалить", en: "Delete", kk: "Жою", ky: "Өчүрүү", tg: "Нест кардан", tk: "Pozmak" },
    "tahrirlash": { ru: "Редактир.", en: "Edit", kk: "Өңдеу", ky: "Түзөтүү", tg: "Таҳрир", tk: "Üýtgetmek" },
    "ma'lumotlarini tahrirlash": { ru: "Изменить данные", en: "Edit details", kk: "Деректерін өңдеу", ky: "Маалыматтарын түзөтүү", tg: "Таҳрири маълумот", tk: "Maglumatlary üýtgetmek" },
    "diqqat!": { ru: "Внимание!", en: "Warning!", kk: "Назар аударыңыз!", ky: "Көңүл буруңуз!", tg: "Диққат!", tk: "Üns beriň!" },
    "bekor qilish": { ru: "Отмена", en: "Cancel", kk: "Бас тарту", ky: "Жокко чыгаруу", tg: "Бекор кардан", tk: "Ýatyrmak" },
    "klinika o'chirib tashlandi!": { ru: "Клиника полностью удалена!", en: "Clinic successfully purged!", kk: "Клиника толығымен жойылды!", ky: "Клиника толугу менен өчүрүлдү!", tg: "Клиника пурра нест карда шуд!", tk: "Klinika doly pozuldy!" },
    "shifokorni o'chirish": { ru: "Удалить врача", en: "Delete Doctor", kk: "Дәрігерді жою", ky: "Дарыгерди өчүрүү", tg: "Нест кардани духтур", tk: "Lukmany pozmak" },
    "shifokor o'chirildi!": { ru: "Врач успешно удален!", en: "Doctor successfully removed!", kk: "Дәрігер сәтті жойылды!", ky: "Дарыгер ийгиликтүү өчүрүлдү!", tg: "Духтур бомуваффақият нест шуд!", tk: "Lukman üstünlikli pozuldy!" },
    "yangi shifokor qo'shish": { ru: "Добавить нового врача", en: "Add New Doctor", kk: "Жаңа дәрігер қосу", ky: "Жаңы дарыгер кошуу", tg: "Илова кардани духтури нав", tk: "Täze lukman goşmak" },
    "qo'shish": { ru: "Добавить", en: "Add", kk: "Қосу", ky: "Кошуу", tg: "Илова кардан", tk: "Goşmak" },
    "shifokorni tahrirlash": { ru: "Редактировать врача", en: "Edit Doctor", kk: "Дәрігерді өңдеу", ky: "Дарыгерди түзөтүү", tg: "Таҳрири духтур", tk: "Lukmany üýtgetmek" },
    "shifokor ma'lumotlari yangilandi!": { ru: "Данные врача обновлены!", en: "Doctor details updated!", kk: "Дәрігер деректері жаңартылды!", ky: "Дарыгердин маалыматтары жаңыланды!", tg: "Маълумоти духтур нав шуд!", tk: "Lukmanyň maglumatlary täzelendi!" },
    "saqlash": { ru: "Сохранить", en: "Save", kk: "Сақтау", ky: "Сактоо", tg: "Захира кардан", tk: "Ýatda saklamak" }
  };
  const localLang: keyof LocalDictEntry | null =
    (language === 'ru' || language === 'en' || language === 'kk' || language === 'ky' || language === 'tg' || language === 'tk')
      ? language
      : null;
  const tL = (text: string): string => {
    const clean = text.trim().toLowerCase().replace(/\s+/g, ' ');
    if (localLang && localDict[clean]) return localDict[clean][localLang];
    return text;
  };

  // /api/clinics and /api/doctors never include passwords (security). This component
  // fetches the real values separately, using the superadmin session token, purely for
  // its own "view/copy credentials" feature.
  const [credentialPasswords, setCredentialPasswords] = useState<{ clinics: Record<string, string>; doctors: Record<string, string> }>({ clinics: {}, doctors: {} });
  React.useEffect(() => {
    if (!superadminToken) return;
    fetch('/api/admin/credentials', { headers: { Authorization: `Bearer ${superadminToken}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const clinicMap: Record<string, string> = {};
        (data.clinics || []).forEach((c: any) => { if (c.password) clinicMap[c.id] = c.password; });
        const doctorMap: Record<string, string> = {};
        (data.doctors || []).forEach((d: any) => { if (d.password) doctorMap[d.id] = d.password; });
        setCredentialPasswords({ clinics: clinicMap, doctors: doctorMap });
      })
      .catch(err => console.warn('Could not load credential details', err));
  }, [superadminToken, clinics.length, doctors.length]);

  // Local States for creating clinic
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicSubdomain, setNewClinicSubdomain] = useState('');
  const [newClinicAddress, setNewClinicAddress] = useState('');
  const [newClinicPhone, setNewClinicPhone] = useState('+998901234567');
  const [newClinicFee, setNewClinicFee] = useState<number>(1500000);
  const [newClinicOwner, setNewClinicOwner] = useState('');
  const [newClinicMapLink, setNewClinicMapLink] = useState('');
  const [newClinicLat, setNewClinicLat] = useState<number | ''>(41.311081);
  const [newClinicLng, setNewClinicLng] = useState<number | ''>(69.240562);

  // Editing credentials state
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [clinicLoginVal, setClinicLoginVal] = useState('');
  const [clinicPassVal, setClinicPassVal] = useState('');

  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [doctorLoginVal, setDoctorLoginVal] = useState('');
  const [doctorPassVal, setDoctorPassVal] = useState('');

  const [searchDoctorTerm, setSearchDoctorTerm] = useState('');
  const [searchClinicTerm, setSearchClinicTerm] = useState('');

  // Local States for Clinic Details editing and Superadmin Self-Credentials Management
  const [clinicToEdit, setClinicToEdit] = useState<Clinic | null>(null);
  const [currentSuperadminPass, setCurrentSuperadminPass] = useState('');
  const [newSuperadminLogin, setNewSuperadminLogin] = useState(superadminLogin);
  const [newSuperadminPass, setNewSuperadminPass] = useState(superadminPassword);

  // SaaS Calculator Interactive Simulation inputs
  const [simAddedClinics, setSimAddedClinics] = useState(3);
  const [simPricePerClinic, setSimPricePerClinic] = useState(1500000);

  // Telegram Bot Token Setting state — loaded from the server (superadmin-only),
  // never from localStorage (bot tokens must never touch the browser's storage).
  const [telegramToken, setTelegramToken] = useState('');
  const [doctorTelegramToken, setDoctorTelegramToken] = useState('');
  useEffect(() => {
    if (!superadminToken) return;
    fetch('/api/telegram-config', { headers: { Authorization: `Bearer ${superadminToken}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        if (data.token) setTelegramToken(data.token);
        if (data.doctorToken) setDoctorTelegramToken(data.doctorToken);
      })
      .catch(err => console.warn('Could not load Telegram config', err));
  }, [superadminToken]);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [fetchingDebug, setFetchingDebug] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  // Doctor Details Management State
  const [doctorToEditDetails, setDoctorToEditDetails] = useState<Doctor | null>(null);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [newDoctorClinicId, setNewDoctorClinicId] = useState('');

  // Advertising — superadmin-exclusive placement of ads shown to patients on the
  // web app (home / patient panel / queue screen) and via the Telegram bot.
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showAddAdForm, setShowAddAdForm] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdBody, setNewAdBody] = useState('');
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [newAdLinkUrl, setNewAdLinkUrl] = useState('');
  const [newAdPlacements, setNewAdPlacements] = useState<string[]>(['web_home']);
  const [newAdTelegramEnabled, setNewAdTelegramEnabled] = useState(true);
  const [newAdClinicId, setNewAdClinicId] = useState('');
  const [broadcastingAdId, setBroadcastingAdId] = useState<string | null>(null);
  const adImageInputRef = useRef<HTMLInputElement>(null);

  const fetchAds = () => {
    if (!superadminToken) return;
    fetch('/api/admin/ads', { headers: { Authorization: `Bearer ${superadminToken}` } })
      .then(res => res.ok ? res.json() : [])
      .then(setAds)
      .catch(err => console.warn('Could not load ads', err));
  };

  useEffect(() => { fetchAds(); }, [superadminToken]);

  const handleCreateAd = async () => {
    if (!newAdTitle.trim() || newAdPlacements.length === 0) {
      triggerToast("Sarlavha va kamida bitta joylashuv talab qilinadi!");
      return;
    }
    const newAd: Advertisement = {
      id: 'ad_' + Math.random().toString(36).substr(2, 9),
      title: newAdTitle.trim(),
      body: newAdBody.trim() || undefined,
      imageUrl: newAdImageUrl || undefined,
      linkUrl: newAdLinkUrl.trim() || undefined,
      placements: newAdPlacements as Advertisement['placements'],
      telegramEnabled: newAdTelegramEnabled,
      status: 'active',
      createdAt: new Date().toISOString(),
      clinicId: newAdClinicId || undefined,
    };
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {}) },
        body: JSON.stringify(newAd),
      });
      // This used to report success unconditionally — the form cleared and a
      // green toast appeared even on a rejected/failed request, so a director
      // could see "reklama yaratildi" for an ad that was never actually saved.
      if (!res.ok) throw new Error(`Server rad etdi (${res.status})`);
      setAds(prev => [newAd, ...prev]);
      addLog(`Yangi reklama yaratildi: ${newAd.title}`, 'success');
      triggerToast("Reklama muvaffaqiyatli yaratildi! 📢");
      setNewAdTitle(''); setNewAdBody(''); setNewAdImageUrl(''); setNewAdLinkUrl('');
      setNewAdPlacements(['web_home']); setNewAdTelegramEnabled(true); setNewAdClinicId('');
      setShowAddAdForm(false);
    } catch (e: any) {
      triggerToast("Reklama yaratishda xatolik: " + e.message);
    }
  };

  const handleToggleAdStatus = async (ad: Advertisement) => {
    const updated: Advertisement = { ...ad, status: ad.status === 'active' ? 'paused' : 'active' };
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {}) },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`Server rad etdi (${res.status})`);
      setAds(prev => prev.map(a => a.id === ad.id ? updated : a));
      addLog(`Reklama holati o'zgartirildi: ${ad.title} — ${updated.status}`, 'info');
    } catch (e: any) {
      // The status shown on screen must not silently drift from the server's —
      // this used to flip it locally even when the write failed.
      triggerToast("Xatolik: " + e.message);
    }
  };

  const handleDeleteAd = async (ad: Advertisement) => {
    // Every other delete in this panel confirms first; this one didn't.
    if (!window.confirm(`"${ad.title}" reklamasini o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: 'DELETE',
        headers: superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {},
      });
      if (!res.ok) throw new Error(`Server rad etdi (${res.status})`);
      setAds(prev => prev.filter(a => a.id !== ad.id));
      addLog(`Reklama o'chirildi: ${ad.title}`, 'warn');
      triggerToast("Reklama o'chirildi.");
    } catch (e: any) {
      // Removing it from the list here would be a lie if the server rejected
      // the delete — it stays in the list on failure now.
      triggerToast("Xatolik: " + e.message);
    }
  };

  const handleBroadcastAd = async (ad: Advertisement) => {
    setBroadcastingAdId(ad.id);
    try {
      // A blank ad.clinicId reaches every patient in every clinic with a linked
      // Telegram chat, and this send can't be recalled — so a dry run gets the
      // real recipient count and confirmation happens BEFORE anything is sent,
      // not after the fact.
      const dryRunRes = await fetch(`/api/ads/${ad.id}/broadcast?dryRun=1`, {
        method: 'POST',
        headers: superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {},
      });
      if (!dryRunRes.ok) {
        triggerToast("Qabul qiluvchilar sonini aniqlab bo'lmadi.");
        return;
      }
      const dryRunData = await dryRunRes.json();
      const scope = ad.clinicId ? "shu klinikadagi" : "BARCHA klinikalardagi";
      const confirmed = window.confirm(
        `${dryRunData.total} ta ${scope} bemorga Telegram orqali "${ad.title}" reklamasi yuboriladi. Bu amalni ortga qaytarib bo'lmaydi. Davom etasizmi?`
      );
      if (!confirmed) return;

      const res = await fetch(`/api/ads/${ad.id}/broadcast`, {
        method: 'POST',
        headers: superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {},
      });
      const data = await res.json();
      if (data.ok) {
        addLog(`Reklama Telegram orqali yuborildi: ${ad.title} (${data.sent}/${data.total} bemorga)`, 'success');
        triggerToast(`Yuborildi: ${data.sent}/${data.total} bemorga! 📤`);
      } else {
        triggerToast("Xatolik: " + (data.error || 'Nomalum xato'));
      }
    } catch (e: any) {
      triggerToast("Xatolik: " + e.message);
    } finally {
      setBroadcastingAdId(null);
    }
  };

  const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800);
      setNewAdImageUrl(compressed);
    } catch (err) {
      console.warn('Ad image compression failed', err);
    }
  };

  const fetchDebugLogsFunc = async () => {
    setFetchingDebug(true);
    try {
      const res = await fetch('/api/telegram-debug-logs', { headers: superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {} });
      if (res.ok) {
        const data = await res.json();
        setDebugLogs(data.logs || []);
        addLog(`Telegram Webhook qabul loglari yangilandi (${(data.logs || []).length} ta).`, 'info');
      }
    } catch (err: any) {
      addLog(`Loglarni yuklashda xatolik: ${err.message || err}`, 'warn');
    } finally {
      setFetchingDebug(false);
    }
  };

  const checkWebhookStatusFunc = async (activeToken: string) => {
    if (!activeToken) return;
    setCheckingStatus(true);
    try {
      const cleanToken = activeToken.trim();
      const tgUrl = `https://api.telegram.org/bot${cleanToken}/getWebhookInfo`;
      const res = await fetch(tgUrl);
      if (res.ok) {
        const data = await res.json();
        setWebhookStatus(data);
        addLog(`Telegram Webhook holati olindi: ${data.ok ? 'Tayyor' : 'Muammo'}`, 'success');
      } else {
        triggerToast(`Telegram Api error: ${res.status}`);
      }
    } catch (err: any) {
      addLog(`Telegram ulanish xatosi: ${err.message || err}`, 'warn');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Generated credentials storage
  const [generatedCreds, setGeneratedCreds] = useState<{
    clinicName: string;
    subdomain: string;
    ownerName: string;
    login: string;
    pass: string;
  } | null>(null);

  // Passwords are hashed (irreversibly) the moment they're saved server-side — see
  // server.ts hashPassword/isHashedPassword. So the ONLY moment we ever know a real,
  // human-readable password is right when WE generate/set it on this client, before
  // the next /api/admin/credentials fetch overwrites it with the hash. This map keeps
  // that plaintext around for the rest of the browser session (never sent anywhere,
  // never persisted) so the credentials list can still show/copy it correctly instead
  // of a useless "scrypt:..." string.
  const [justSetPasswords, setJustSetPasswords] = useState<Record<string, string>>({});
  // Only a leftover pre-migration hash (saved before doctor/clinic credentials moved to
  // reversible encryption) is unrecoverable — the server already decrypts everything
  // else back to plaintext in /api/admin/credentials, so this is now the rare case,
  // not the default. Those accounts just need one "Kalitni qayta tiklash" to fix.
  const isHashedPw = (pw: any): boolean => typeof pw === 'string' && pw.startsWith('scrypt:');
  // One-time "reveal" dialog for a freshly created/reset doctor or clinic login —
  // mirrors the existing generatedCreds card but generic enough for both entity types
  // and for password-reset (not just first creation).
  const [justSetCredential, setJustSetCredential] = useState<{ label: string; login: string; pass: string } | null>(null);

  // Passwords are masked with dots by default and only shown in plaintext once the
  // SuperAdmin clicks the eye icon for that specific row — a simple show/hide toggle
  // rather than the credential being permanently hidden.
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const toggleRevealed = (id: string) => setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));

  // What to show in the credentials list: our own remembered plaintext if we have
  // it, otherwise whatever the server returned. A leftover pre-migration hash is
  // shown as a friendly placeholder instead of raw gibberish; everything else is
  // masked with dots until the eye icon is toggled on for that row.
  const getDisplayPassword = (id: string, source: Record<string, string>): string => {
    const known = justSetPasswords[id] || source[id];
    if (!known) return superadminToken ? '...' : "Ko'rish uchun qayta kiring";
    if (isHashedPw(known)) return '🔒 Yashiringan (qayta tiklang)';
    if (!revealedIds[id]) return '•'.repeat(Math.min(Math.max(known.length, 6), 10));
    return known;
  };
  // Returns null when there's nothing safe to copy (i.e. all we have is a leftover
  // pre-migration hash) — callers should prompt a password reset instead.
  const getCopyablePassword = (id: string, source: Record<string, string>): string | null => {
    const known = justSetPasswords[id] || source[id];
    if (!known || isHashedPw(known)) return null;
    return known;
  };

  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Real system operations log — persisted server-side (Firestore "auditLogs"), so
  // it survives page reloads and server restarts, not just the current session.
  const [opsLogs, setOpsLogs] = useState<Array<{ id: string; time: string; text: string; type: 'success' | 'warn' | 'info' }>>([]);

  useEffect(() => {
    if (!superadminToken) return;
    fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${superadminToken}` } })
      .then(res => res.ok ? res.json() : [])
      .then((logs: any[]) => {
        setOpsLogs(logs.slice(0, 6).map(l => ({
          id: l.id,
          time: new Date(l.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          text: l.text,
          type: l.type,
        })));
      })
      .catch(err => console.warn('Could not load audit logs', err));
  }, [superadminToken]);

  const addLog = (text: string, type: 'success' | 'info' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setOpsLogs(prev => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 5)]);
    if (superadminToken) {
      fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superadminToken}` },
        body: JSON.stringify({ text, type }),
      }).catch(err => console.warn('Could not persist audit log', err));
    }
  };

  // Real billing notifications — derived from actual clinics/saasPayments data,
  // not a simulated inbox. Surfaces what actually needs the owner's attention.
  const billingNotifications = useMemo(() => {
    const now = Date.now();
    const items: Array<{ id: string; kind: 'warn' | 'danger' | 'info'; text: string; time: string }> = [];

    saasPayments.filter(p => p.status === 'pending_approval').forEach(p => {
      items.push({
        id: `pending_${p.id}`,
        kind: 'info',
        text: `${p.clinicName}: to'lov tasdiqlash kutilmoqda — ${p.amount.toLocaleString('uz-UZ')} so'm`,
        time: p.dueDate,
      });
    });

    saasPayments.filter(p => p.status === 'unpaid' && new Date(p.dueDate).getTime() < now).forEach(p => {
      items.push({
        id: `overdue_${p.id}`,
        kind: 'danger',
        text: `${p.clinicName}: to'lov muddati o'tgan (${p.dueDate}) — ${p.amount.toLocaleString('uz-UZ')} so'm`,
        time: p.dueDate,
      });
    });

    clinics.filter(c => c.subscriptionStatus === 'suspended').forEach(c => {
      items.push({
        id: `suspended_${c.id}`,
        kind: 'warn',
        text: `${c.name}: obuna to'xtatilgan`,
        time: c.nextPaymentDate || '',
      });
    });

    return items.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  }, [saasPayments, clinics]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = () => {
    if (!generatedCreds) return;
    const shareText = `Klinika: ${generatedCreds.clinicName}\nHavola: ${window.location.origin}/?clinic=${generatedCreds.subdomain}\nDirekor: ${generatedCreds.ownerName}\n\nLogin: ${generatedCreds.login}\nParol: ${generatedCreds.pass}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    triggerToast(tL("Hisob ma'lumotlari nusxalandi!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGeneric = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(tL("Nusxalandi!"));
  };

  // SaaS calculations
  const totalClinics = clinics.length;
  const activeClinicsCount = clinics.filter(c => c.subscriptionStatus === 'active' || c.subscriptionStatus === 'trial').length;
  const currentMRR = clinics
    .filter(c => c.subscriptionStatus === 'active')
    .reduce((sum, c) => sum + (c.rentalPrice || 1500000), 0);

  // "Guruh hisoboti" — one real owner running several branches, linked by a
  // SuperAdmin-typed groupId (see Clinic.groupId in types.ts). Same reduce
  // shape as currentMRR above, just bucketed by group instead of subscription
  // status. Clinics with no groupId (the default for every existing clinic)
  // simply never appear here — nothing else in the app reads this field.
  const clinicGroups = useMemo(() => {
    const byGroup = new Map<string, Clinic[]>();
    for (const c of clinics) {
      if (!c.groupId) continue;
      const list = byGroup.get(c.groupId);
      if (list) list.push(c);
      else byGroup.set(c.groupId, [c]);
    }
    return Array.from(byGroup.entries()).map(([groupId, groupClinics]) => {
      const clinicIds = new Set(groupClinics.map(c => c.id));
      const groupQueues = queues.filter(q => clinicIds.has(q.clinicId));
      const completedQueues = groupQueues.filter(q => q.status === 'completed');
      return {
        groupId,
        clinics: groupClinics,
        totalRentalPrice: groupClinics.reduce((sum, c) => sum + (c.rentalPrice || 1500000), 0),
        totalActivePatients: groupClinics.reduce((sum, c) => sum + (c.activePatients || 0), 0),
        totalDoctors: doctors.filter(d => clinicIds.has(d.clinicId)).length,
        totalCompletedVisits: completedQueues.length,
      };
    });
  }, [clinics, queues, doctors]);

  const [patientsCount, setPatientsCount] = React.useState(0);

  // GET /api/patients is superadmin/staff-scoped — this fetched it with no
  // Authorization header, so it got a 401 body, `data.length` was undefined,
  // and the count silently sat at 0. Same omission as the main polling effect
  // in useAppState. Also drops the 4-second interval: the full patient list is
  // one of the heaviest payloads in the app and this only needs a count, so
  // re-pulling it 15x a minute was pure waste — 60s matches how often the rest
  // of the slow-moving data refreshes.
  React.useEffect(() => {
    if (!superadminToken) return;
    let active = true;
    const fetchPatients = () => {
      fetch('/api/patients', { headers: { Authorization: `Bearer ${superadminToken}` } })
        .then(r => (r.ok ? r.json() : []))
        .then(data => { if (active) setPatientsCount(Array.isArray(data) ? data.length : 0); })
        .catch(e => console.warn(e));
    };
    fetchPatients();
    const interval = setInterval(fetchPatients, 60000);
    return () => { active = false; clearInterval(interval); };
  }, [superadminToken]);

  const totalPatients = patientsCount + queues.length;

  const handleCreateClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newClinicSubdomain || !newClinicOwner) {
      triggerToast(tL("Iltimos, barcha majburiy maydonlarni to'ldiring!"));
      return;
    }

    const cleanSubdomain = newClinicSubdomain.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const exists = clinics.some(c => c.subdomain === cleanSubdomain);
    if (exists) {
      triggerToast(tL("Ushbu subdomen bilan ro'yxatdan o'tilgan!"));
      return;
    }

    const generatedLogin = `ceo_${cleanSubdomain}`;
    const generatedPass = `Stoma${Math.floor(100000 + Math.random() * 900000)}`;

    const newClinicId = cleanSubdomain;
    const initialClinic: Clinic = {
      id: newClinicId,
      name: newClinicName,
      subdomain: cleanSubdomain,
      address: newClinicAddress || "Kiritilmagan",
      phone: newClinicPhone,
      lat: Number(newClinicLat) || 41.311081,
      lng: Number(newClinicLng) || 69.240562,
      logo: '🦷',
      rating: 5.0,
      activePatients: 0,
      mapLink: newClinicMapLink.trim() || `https://www.google.com/maps?q=${encodeURIComponent(newClinicName + ', ' + (newClinicAddress || "O'zbekiston"))}`,
      rentalPrice: newClinicFee,
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subscriptionStatus: 'active',
      ownerName: newClinicOwner,
      login: generatedLogin,
      password: generatedPass
    };

    // This used to fire-and-forget and show the generated login/password
    // immediately regardless of outcome — if the server rejected the write, the
    // owner was handed credentials for a clinic that would vanish on the next
    // poll sync, with no error shown anywhere.
    const created = await onAddClinic(initialClinic);
    if (!created) {
      triggerToast(tL("Klinika saqlanmadi. Qayta urinib ko'ring."));
      return;
    }
    addLog(`New clinic "${newClinicName}" onboarded under tenant [${cleanSubdomain}]`, 'success');

    setGeneratedCreds({
      clinicName: newClinicName,
      subdomain: cleanSubdomain,
      ownerName: newClinicOwner,
      login: generatedLogin,
      pass: generatedPass
    });
    // Remember the real plaintext for this clinic — server.ts hashes it irreversibly
    // on save, so this is the only place we'll ever see it again.
    setJustSetPasswords(prev => ({ ...prev, [newClinicId]: generatedPass }));

    // Reset fields
    setNewClinicName('');
    setNewClinicSubdomain('');
    setNewClinicAddress('');
    setNewClinicOwner('');
    setNewClinicMapLink('');
    triggerToast(tL("Yangi filial tarmoqqa muvaffaqiyatli qo'shildi!"));
  };

  const handleUpdateClinicCredsClick = (clinic: Clinic) => {
    setEditingClinicId(clinic.id);
    setClinicLoginVal(clinic.login || `ceo_${clinic.subdomain}`);
    // If the stored password is already hashed, we can never recover the original —
    // leave the field blank so the director MUST set a brand-new password instead of
    // accidentally re-saving the hash string itself (which would double-hash it and
    // permanently lock the clinic out).
    const known = justSetPasswords[clinic.id] || credentialPasswords.clinics[clinic.id] || '';
    setClinicPassVal(isHashedPw(known) ? '' : known);
  };

  const handleSaveClinicCredsSubmit = async (clinicId: string) => {
    if (!clinicLoginVal || !clinicPassVal) {
      triggerToast(tL("Login va parol bo'sh bo'lishi mumkin emas!"));
      return;
    }
    if (!onUpdateClinicCreds) {
      triggerToast("Callback not tied yet in parent component");
      return;
    }
    const ok = await onUpdateClinicCreds(clinicId, clinicLoginVal, clinicPassVal);
    if (!ok) {
      triggerToast("Saqlash muvaffaqiyatsiz tugadi — internet aloqasini tekshirib, qayta urinib ko'ring.");
      return;
    }
    addLog(`Clinic ID [${clinicId}] credentials modified: ${clinicLoginVal}`, 'info');
    setJustSetPasswords(prev => ({ ...prev, [clinicId]: clinicPassVal }));
    setEditingClinicId(null);
    const clinic = clinics.find(c => c.id === clinicId);
    setJustSetCredential({ label: `Klinika: ${clinic?.name || clinicLoginVal}`, login: clinicLoginVal, pass: clinicPassVal });
    triggerToast(tL("Klinika hisob ma'lumotlari yangilandi!"));
  };

  const handleUpdateDoctorCredsClick = (doctor: Doctor) => {
    setEditingDoctorId(doctor.id);
    setDoctorLoginVal(doctor.login || doctor.name.toLowerCase().replace(/\s+/g, ''));
    // Same rationale as handleUpdateClinicCredsClick: never prefill with a hash.
    const known = justSetPasswords[doctor.id] || credentialPasswords.doctors[doctor.id] || '';
    setDoctorPassVal(isHashedPw(known) ? '' : known);
  };

  const handleSaveDoctorCredsSubmit = async (docId: string) => {
    if (!doctorLoginVal || !doctorPassVal) {
      triggerToast(tL("Login va parol bo'sh bo'lishi mumkin emas!"));
      return;
    }
    if (!onUpdateDoctorCreds) {
      triggerToast("Callback not tied yet in parent component");
      return;
    }
    const ok = await onUpdateDoctorCreds(docId, doctorLoginVal, doctorPassVal);
    if (!ok) {
      triggerToast("Saqlash muvaffaqiyatsiz tugadi — internet aloqasini tekshirib, qayta urinib ko'ring.");
      return;
    }
    addLog(`Doctor ID [${docId}] credentials modified: ${doctorLoginVal}`, 'info');
    setJustSetPasswords(prev => ({ ...prev, [docId]: doctorPassVal }));
    setEditingDoctorId(null);
    const doc = doctors.find(d => d.id === docId);
    setJustSetCredential({ label: `Shifokor: ${doc?.name || doctorLoginVal}`, login: doctorLoginVal, pass: doctorPassVal });
    triggerToast(tL("Shifokor hisob ma'lumotlari yangilandi!"));
  };

  const handleCreateDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newDoctorSpecialty || !newDoctorClinicId) {
      triggerToast(tL("Majburiy maydonlarni to'ldiring!"));
      return;
    }
    const login = newDoctorName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const pass = `Doc${Math.floor(1000 + Math.random() * 9000)}`;
    const newDocId = 'doc_' + Math.random().toString(36).substr(2, 9);
    const newDoc: Doctor = {
      id: newDocId,
      name: newDoctorName,
      specialty: newDoctorSpecialty,
      status: "idle",
      clinicId: newDoctorClinicId,
      image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + newDoctorName,
      rating: 5,
      ratingCount: 0,
      login,
      password: pass
    };
    if (onAddDoctor) {
      const ok = await onAddDoctor(newDoc);
      if (!ok) {
        triggerToast("Shifokorni saqlab bo'lmadi — internet aloqasini tekshirib, qayta urinib ko'ring.");
        return;
      }
      setJustSetPasswords(prev => ({ ...prev, [newDocId]: pass }));
      setJustSetCredential({ label: `Shifokor: ${newDoctorName}`, login, pass });
      setShowAddDoctorModal(false);
      setNewDoctorName('');
      setNewDoctorSpecialty('');
      setNewDoctorClinicId('');
      triggerToast(tL("Yangi shifokor muvaffaqiyatli qo'shildi!"));
    }
  };

  const filteredDoctors = (doctors || []).filter(doc => 
    doc && (
      (doc.name || '').toLowerCase().includes((searchDoctorTerm || '').toLowerCase()) || 
      (doc.specialty || '').toLowerCase().includes((searchDoctorTerm || '').toLowerCase()) ||
      (doc.login && doc.login.toLowerCase().includes((searchDoctorTerm || '').toLowerCase()))
    )
  );

  const filteredClinics = (clinics || []).filter(c =>
    c && (
      (c.name || '').toLowerCase().includes((searchClinicTerm || '').toLowerCase()) ||
      (c.ownerName || '').toLowerCase().includes((searchClinicTerm || '').toLowerCase())
    )
  );

  // Sidebar tab state — controls which section's JSX renders in the main content area.
  const [activeSection, setActiveSection] = useState('overview');

  // One-off data maintenance: assign primaryDoctorId to patients who never got one
  // (self-registration doesn't set it), based on whichever doctor they most recently
  // booked with. Safe to re-run — the endpoint skips patients already pointing at
  // the right doctor.
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const runPrimaryDoctorBackfill = async () => {
    if (!superadminToken) {
      setBackfillResult("Superadmin sessiyasi topilmadi — qayta kiring.");
      return;
    }
    setIsBackfilling(true);
    setBackfillResult(null);
    try {
      // Preview first — this writes to every patient missing a primaryDoctorId,
      // and the panel had no way to say how many that would be before running it.
      const dryRunRes = await fetch('/api/admin/backfill-primary-doctor?dryRun=1', {
        method: 'POST',
        headers: { Authorization: `Bearer ${superadminToken}` },
      });
      const dryRunData = await dryRunRes.json();
      if (!dryRunRes.ok || !dryRunData.ok) {
        setBackfillResult(`⚠️ ${dryRunData.error || 'Amal bajarilmadi.'}`);
        return;
      }
      if (dryRunData.updated === 0) {
        setBackfillResult(`✅ Barcha bemorlar allaqachon to'g'ri shifokorga biriktirilgan (${dryRunData.totalPatients} ta tekshirildi).`);
        return;
      }
      if (!window.confirm(`${dryRunData.updated} ta bemor (jami ${dryRunData.totalPatients} tadan) shifokorga biriktiriladi. Davom etasizmi?`)) {
        return;
      }
      const res = await fetch('/api/admin/backfill-primary-doctor', {
        method: 'POST',
        headers: { Authorization: `Bearer ${superadminToken}` },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setBackfillResult(`✅ ${data.updated} ta bemor biriktirildi (jami ${data.totalPatients} ta bemor tekshirildi).`);
        addLog(`Bemorlar shifokorlarga biriktirildi: ${data.updated} ta yangilandi`, 'success');
      } else {
        setBackfillResult(`⚠️ ${data.error || 'Amal bajarilmadi.'}`);
      }
    } catch (err: any) {
      setBackfillResult(`⚠️ Tarmoq xatosi: ${err?.message || 'noma\'lum'}`);
    } finally {
      setIsBackfilling(false);
    }
  };

  // One-off cleanup: removes a fixed, hand-verified list of queue/patient
  // records created during this app's own development/testing (e.g. "SYNC
  // BOOKING TEST"). Matched by exact id server-side, never by name — can't
  // accidentally touch a real patient. Safe to re-run.
  const [isCleaningTestData, setIsCleaningTestData] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const runTestDataCleanup = async () => {
    if (!superadminToken) {
      setCleanupResult("Superadmin sessiyasi topilmadi — qayta kiring.");
      return;
    }
    // Deletes by a fixed, hand-verified exact-id list (server-side), so this
    // can't touch a real patient — but a delete is still a delete.
    if (!window.confirm("Test navbatlari va bemorlarini o'chirishni tasdiqlaysizmi?")) return;
    setIsCleaningTestData(true);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/admin/cleanup-test-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${superadminToken}` },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCleanupResult(`✅ ${data.deletedQueues} ta test navbat va ${data.deletedPatients} ta test bemor o'chirildi.`);
        addLog(`Test ma'lumotlar tozalandi: ${data.deletedQueues} navbat, ${data.deletedPatients} bemor`, 'success');
      } else {
        setCleanupResult(`⚠️ ${data.error || 'Amal bajarilmadi.'}`);
      }
    } catch (err: any) {
      setCleanupResult(`⚠️ Tarmoq xatosi: ${err?.message || 'noma\'lum'}`);
    } finally {
      setIsCleaningTestData(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 border border-cyan-500 text-cyan-200 px-5 py-4 rounded-2xl shadow-xl transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold font-mono">{toastMsg}</span>
        </div>
      )}

      {/* HEADER BANNER WITH GRADIENT AND CROWN ACCENT — page identity, always shown above the tabs */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 pointer-events-none opacity-20 bg-[radial-gradient(circle,rgba(6,182,212,0.25),transparent_70%)]"></div>
        <div className="absolute left-1/3 top-1/2 w-40 h-40 pointer-events-none opacity-10 bg-[radial-gradient(circle,rgba(99,102,241,0.2),transparent_70%)]"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-amber-400 rounded-2xl border border-slate-800 shadow-md flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-500 fill-amber-500/20 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-[#06b6d4] bg-cyan-950 px-2 py-0.5 rounded-md border border-cyan-900/40">
                  {t('clinicOwner')}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold mt-1 tracking-tight">
                {t('superadminHeader')}
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-medium">
                {t('superadminSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {setLanguage && <LanguageSwitcher language={language} setLanguage={setLanguage} variant="dark" />}
            <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#06b6d4]" />
              <span className="text-[11px] font-bold text-slate-300 font-mono">DSTOMA NETWORK CENTRAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABBED SHELL: left sidebar nav + right main content area (mirrors Settings.tsx) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 bg-white border border-slate-100 rounded-3xl shadow-md shrink-0 lg:sticky lg:top-4 overflow-hidden">
          <div className="p-4 space-y-1">
            {SUPERADMIN_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeSection === section.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <section.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{section.label}</span>
                {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto shrink-0 opacity-60" />}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-6">

      {activeSection === 'overview' && (
        <div className="space-y-6">
      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-800">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none">
              {t('totalClinics')}
            </span>
            <div className="text-2xl font-black text-slate-800 font-mono mt-2">
              {activeClinicsCount} <span className="text-xs font-normal text-slate-400">/ {totalClinics}</span>
            </div>
          </div>
          <div className="p-3 bg-cyan-50 text-[#06b6d4] rounded-xl shadow-xs">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-100/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none">
              {t('mrr')}
            </span>
            <div className="text-base font-extrabold text-[#0284c7] font-mono mt-2 flex items-center gap-1">
              <span>{currentMRR.toLocaleString('uz-UZ')}</span>
              <span className="text-[10px] text-slate-500 font-bold font-sans">so'm/oy</span>
            </div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-100/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none">
              {t('totalDoctors')}
            </span>
            <div className="text-2xl font-black text-slate-800 font-mono mt-2">
              {doctors.length} <span className="text-xs font-normal text-slate-400">nafar</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-100/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none">
              {t('totalPatients')}
            </span>
            <div className="text-2xl font-black text-slate-800 font-mono mt-2">
              {totalPatients} <span className="text-xs font-normal text-slate-400">chipta</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>
        </div>
      )}

      {activeSection === 'onboarding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 pointer-events-none opacity-20 bg-[radial-gradient(circle,rgba(99,102,241,0.1),transparent_70%)]"></div>
            
            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
              <span className="text-xl">🏢</span>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {t('onboardNewClinic')}
              </h3>
            </div>

            <form onSubmit={handleCreateClinicSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                  {t('clanName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  placeholder="Masalan: DStoma Toshkent"
                  className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                    {t('subdomain')} *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-cyan-500">
                    <span className="text-[9px] text-slate-400 font-black font-mono shrink-0">{window.location.host}/?clinic=</span>
                    <input
                      type="text"
                      required
                      value={newClinicSubdomain}
                      onChange={(e) => setNewClinicSubdomain(e.target.value.toLowerCase())}
                      placeholder="toshkent"
                      className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                    {t('ceoName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClinicOwner}
                    onChange={(e) => setNewClinicOwner(e.target.value)}
                    placeholder="Aziz Alimov"
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                    {t('licenceFee')} *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    <input
                      type="number"
                      required
                      value={newClinicFee}
                      onChange={(e) => setNewClinicFee(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none font-mono"
                    />
                    <span className="text-[9px] text-slate-400 font-extrabold shrink-0">S/M</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                    {t('phone')}
                  </label>
                  <input
                    type="text"
                    value={newClinicPhone}
                    onChange={(e) => setNewClinicPhone(e.target.value)}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                  📍 {t('address')} & Xaritadagi Manzil Linki (Google yoki Yandex Maps Link)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newClinicAddress}
                    onChange={(e) => setNewClinicAddress(e.target.value)}
                    placeholder="Masalan: Yunusobod, Toshkent shahri"
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                  />
                  <input
                    type="url"
                    value={newClinicMapLink}
                    onChange={(e) => setNewClinicMapLink(e.target.value)}
                    placeholder="Masalan: https://www.google.com/maps?q=41.311,69.24"
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none font-mono placeholder:text-slate-400"
                  />
                  <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                    ℹ️ Istalgan Google Maps, Yandex Maps yoki OpenStreetMap havolasini kiriting. Ushbu havola mijoz xaritasida navigatsiya tugmasi bilan bog'lanib, to'liq integratsiyani amalga oshiradi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                    Latitude (Kenglik) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newClinicLat}
                    onChange={(e) => setNewClinicLat(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Masalan: 41.311081"
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                    Longitude (Uzunlik) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newClinicLng}
                    onChange={(e) => setNewClinicLng(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Masalan: 69.240562"
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black rounded-2xl shadow-lg transition-all text-center flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                {t('generateAcc')}
              </button>
            </form>
          </div>

          {/* GENERATED CREDENTIALS COMPONENT */}
          <AnimatePresence>
            {generatedCreds && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 pointer-events-none opacity-25 bg-[radial-gradient(circle,rgba(6,182,212,0.15),transparent_70%)]"></div>
                
                <div className="flex items-center justify-between border-b border-rose-950/40 pb-2.5">
                  <span className="text-[10px] font-extrabold text-cyan-400 tracking-widest uppercase flex items-center gap-1.5 font-mono">
                    🔓 {t('accDetails')}
                  </span>
                  <button 
                    onClick={() => setGeneratedCreds(null)}
                    className="text-slate-500 hover:text-slate-300 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                      {t('ownerProvisionNotice')}
                    </p>
                    <div className="font-mono text-[11px] space-y-1.5 text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-900 select-all">
                      <p><span className="text-slate-500">Filial:</span> {generatedCreds.clinicName}</p>
                      <p><span className="text-slate-500">Havola:</span> {window.location.origin}/?clinic={generatedCreds.subdomain}</p>
                      <p><span className="text-slate-500">Director:</span> {generatedCreds.ownerName}</p>
                      <hr className="border-slate-800/60 my-2" />
                      <p className="text-cyan-400 font-bold"><span className="text-slate-500">Login:</span> {generatedCreds.login}</p>
                      <p className="text-emerald-400 font-bold"><span className="text-slate-500">Parol:</span> {generatedCreds.pass}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Nusxalandi!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> {t('copyCredsBtn')}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      )}

      {activeSection === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">
          {/* SYSTEM LOGS — real actions taken this session */}
          <div className="bg-slate-900 text-slate-300 p-4.5 rounded-3xl border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#06b6d4] font-mono">
                ⚡ SYSTEM ACCESS LOGS (AUDIT)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="space-y-2">
              {opsLogs.length === 0 ? (
                <p className="text-[10px] font-mono text-slate-600 py-2">Ushbu sessiyada hali hech qanday amal bajarilmagan.</p>
              ) : (
                opsLogs.map(log => (
                  <div key={log.id} className="text-[10px] font-mono flex items-start gap-1.5">
                    <span className="text-slate-500">[{log.time}]</span>
                    <span className={`${
                      log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-cyan-400'
                    }`}>•</span>
                    <span className="text-slate-400">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">
          {/* SAAS PREMIUM FINANCIAL FORECAST CALCULATOR */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  Muvaffaqiyatli SaaS Moliyaviy Prognostika
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">Litsenziyalar va oylik tushumlarning aniq tahlili</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Actual Financial Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase block tracking-wider">Haqiqiy MRR (Oylik)</span>
                  <strong className="text-sm font-black text-slate-800 font-mono">
                    {currentMRR.toLocaleString('uz-UZ')} UZS
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase block tracking-wider">Mo'ljaldagi ARR (Yillik)</span>
                  <strong className="text-sm font-black text-indigo-600 font-mono">
                    {(currentMRR * 12).toLocaleString('uz-UZ')} UZS
                  </strong>
                </div>
              </div>

              {/* Trials conversion potential */}
              <div className="text-xs bg-cyan-50/50 border border-cyan-100 p-3 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-cyan-800 uppercase tracking-wider block">Sinov (Trial) bosqichidagi potentsial convert</span>
                  <p className="text-[11px] font-bold text-slate-700">
                    {clinics.filter(c => c.subscriptionStatus === 'trial').length} ta klinika faol sinovda
                  </p>
                </div>
                <strong className="text-xs font-bold text-cyan-700 font-mono">
                  +{clinics.filter(c => c.subscriptionStatus === 'trial').reduce((sum, c) => sum + (c.rentalPrice || 1200000), 0).toLocaleString('uz-UZ')} s/oy
                </strong>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">
                  {tL('📈 Kelgusi Davr Rejalashtirish Kalkulyatori')}
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">
                      {tL('Yangi kutilayotgan filiallar soni:')}
                    </span>
                    <span className="text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded">{simAddedClinics} ta</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={simAddedClinics}
                    onChange={(e) => setSimAddedClinics(parseInt(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">
                      {tL('Oylik tarmoq to\'lovi (xar bitta):')}
                    </span>
                    <span className="text-cyan-600 font-mono bg-cyan-50 px-2 py-0.5 rounded">
                      {simPricePerClinic.toLocaleString('uz-UZ')} UZS
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max="5000000"
                    step="100000"
                    value={simPricePerClinic}
                    onChange={(e) => setSimPricePerClinic(parseInt(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Forecast calculations box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#06b6d4] block">
                  {tL('PROGNOZ NATIJASI')}
                </span>
                
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 text-xs">
                  <span className="text-slate-300 font-medium">Rejalashtirilayotgan Qo'shimcha MRR:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    +{(simAddedClinics * simPricePerClinic).toLocaleString('uz-UZ')} so'm
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-300 font-medium">Kutilayotgan Jami MRR (Kelajakda):</span>
                  <span className="font-extrabold text-white font-mono">
                    {(currentMRR + (simAddedClinics * simPricePerClinic)).toLocaleString('uz-UZ')} so'm/oy
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Kutilayotgan Jami ARR (Yillik):</span>
                  <span className="font-black text-cyan-400 font-mono">
                    {((currentMRR + (simAddedClinics * simPricePerClinic)) * 12).toLocaleString('uz-UZ')} so'm/yil
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 1. SaaS OYLIK TO'LOVLARNI TASDIQLASH BOARD (USER REQUESTED) ==================== */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">💵</span>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                     Oylik Obunalar va Haqiqiy Daromad
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                    Tasdiqlangandan so'ng daromadga qo'shiladigan SaaS oqimi
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 text-[9px] font-black bg-indigo-50 text-indigo-600 rounded-md uppercase font-mono tracking-wider">
                SaaS Real Revenue
              </span>
            </div>

            {/* Earnings display box */}
            {(() => {
              const confirmedTotal = saasPayments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
              const pendingPayments = saasPayments.filter(p => p.status === 'pending_approval');
              
              return (
                <div className="space-y-4 font-sans">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider block">
                        JAMI TASDIQLANGAN HAQIQIY DAROMAD
                      </span>
                      <strong className="text-xl font-black text-emerald-950 font-mono block mt-1">
                        {confirmedTotal.toLocaleString('uz-UZ')} so'm
                      </strong>
                      <span className="text-[10px] text-slate-500 mt-1 block font-semibold">
                        Faqat rasman to'langan va siz tasdiqlagan obunalar yig'indisi.
                      </span>
                    </div>
                    <div className="text-3xl">💰</div>
                  </div>

                  {/* Pending approvals section */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                      <span>⏱️ Tasdiqlanish kutilayotgan oylik to'lovlar</span>
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] rounded font-bold font-mono">
                        {pendingPayments.length} ta faol so'rov
                      </span>
                    </h4>

                    {pendingPayments.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center font-medium bg-slate-50 border border-slate-100 rounded-xl">
                        Kutilayotgan yangi oylik to'lov so'rovlari mavjud emas.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {pendingPayments.map(pay => {
                          const associatedClinic = clinics.find(c => c.id === pay.clinicId);
                          return (
                            <div 
                              key={pay.id} 
                              className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-800">
                                    {associatedClinic ? associatedClinic.name : "Noma'lum Klinika"}
                                  </span>
                                  <span className={`text-[9px] font-normal uppercase font-mono tracking-wider ${pay.paymentType === 'premium_upgrade' ? 'text-amber-600 font-black' : 'text-slate-400'}`}>
                                    {pay.paymentType === 'premium_upgrade' ? '🤖 Premium AI so\'rovi' : 'Oylik obuna'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-600 mt-1 font-semibold">
                                  {pay.paymentType === 'premium_upgrade' ? 'So\'ralgan to\'lov' : 'Ijara'}: <strong className="font-mono text-indigo-950">{pay.amount.toLocaleString()} UZS</strong> | Yuborildi: <strong className="font-mono text-slate-700">{pay.dueDate}</strong>
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  if (onApproveSaaSPayment) {
                                    onApproveSaaSPayment(pay.id);
                                    addLog(
                                      pay.paymentType === 'premium_upgrade'
                                        ? `Premium AI so'rovi tasdiqlandi: ${associatedClinic?.name || 'Klinika'}`
                                        : `Oylik to'lov tasdiqlandi: ${associatedClinic?.name || 'Klinika'} - ${pay.amount.toLocaleString()} UZS`,
                                      'success'
                                    );
                                    triggerToast(`To'lov muvaffaqiyatli tasdiqlandi${pay.paymentType === 'premium_upgrade' ? ' — AI Yordamchi faollashtirildi! 🤖' : ' va hisob-kitob daromadiga qo\'shildi! ✓'}`);
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
                              >
                                Tasdiqlash ✓
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        </div>
      )}

      {activeSection === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">
          {/* ==================== 1. DATA MAINTENANCE ==================== */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">🧩</span>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Ma'lumotlar bazasi xizmati
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                    Bemorlarni davolovchi shifokorlariga biriktirish
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              O'zi ro'yxatdan o'tgan bemorlarga davolovchi shifokor avtomatik biriktirilmaydi.
              Bu tugma har bir shunday bemorni <strong>oxirgi marta navbat olgan shifokoriga</strong> biriktiradi.
              Xavfsiz: allaqachon to'g'ri biriktirilgan bemorlar o'zgarmaydi, istalgan vaqtda qayta bosish mumkin.
            </p>

            <button
              type="button"
              onClick={runPrimaryDoctorBackfill}
              disabled={isBackfilling}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md transition-all"
            >
              {isBackfilling ? 'Bajarilmoqda...' : 'Bemorlarni shifokorlarga biriktirish'}
            </button>

            {backfillResult && (
              <p className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3">
                {backfillResult}
              </p>
            )}
          </div>

          {/* ==================== 1B. TEST DATA CLEANUP ==================== */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">🧹</span>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Test ma'lumotlarni tozalash
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                    Tekshiruv vaqtida yaratilgan soxta yozuvlarni o'chirish
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Dastur tekshiruvi paytida yaratilgan 5 ta soxta navbat va 2 ta soxta bemor yozuvini
              (masalan "SYNC BOOKING TEST", "Bot Test Patient") o'chiradi. Aniq belgilangan
              yozuvlargagina tegadi — haqiqiy bemorlarga hech qachon ta'sir qilmaydi.
              Istalgan vaqtda qayta bosish mumkin (allaqachon o'chirilganlar o'tkazib yuboriladi).
            </p>

            <button
              type="button"
              onClick={runTestDataCleanup}
              disabled={isCleaningTestData}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md transition-all"
            >
              {isCleaningTestData ? 'Bajarilmoqda...' : 'Test ma\'lumotlarni tozalash'}
            </button>

            {cleanupResult && (
              <p className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3">
                {cleanupResult}
              </p>
            )}
          </div>

          {/* ==================== 2. SUPERADMIN PASSWORD UPDATE FORM ==================== */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">🛡️</span>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Superadmin Parol Sozlamalari
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                    Superadmin panelga kirish login/parolini o'zgartirish
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Yangi login/parolni kiritib saqlang. Ular faqat shu qurilmada saqlanadi — hech qanday pochtaga avtomatik xabar yuborilmaydi.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (onUpdateSuperadminCreds) {
                const success = await onUpdateSuperadminCreds(currentSuperadminPass, newSuperadminLogin, newSuperadminPass);
                if (success) {
                  addLog(`Superadmin login/paroli o'zgartirildi`, 'success');
                  triggerToast("Yangi hisob ma'lumotlari saqlandi ✅");
                  setCurrentSuperadminPass('');
                } else {
                  addLog(`Superadmin paroli xato kiritildi`, 'warn');
                  triggerToast("Joriy parol xato! Parol o'zgartirilmadi ❌");
                }
              }
            }} className="space-y-4 pt-2">
              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">JORIY PAROL *</label>
                <input
                  type="password"
                  required
                  value={currentSuperadminPass}
                  onChange={(e) => setCurrentSuperadminPass(e.target.value)}
                  className="w-full bg-slate-50 text-xs font-black font-mono text-slate-800 border border-slate-200 rounded-lg px-3 py-2.5 focus:border-[#0284c7] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">YANGI LOGIN *</label>
                  <input
                    type="text"
                    required
                    value={newSuperadminLogin}
                    onChange={(e) => setNewSuperadminLogin(e.target.value)}
                    className="w-full bg-slate-50 text-xs font-black font-mono text-slate-800 border border-slate-200 rounded-lg px-3 py-2.5 focus:border-[#0284c7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">YANGI PAROL *</label>
                  <input
                    type="password"
                    required
                    placeholder="Kamida 6 xonali"
                    value={newSuperadminPass}
                    onChange={(e) => setNewSuperadminPass(e.target.value)}
                    className="w-full bg-slate-50 text-xs font-black font-mono text-slate-800 border border-slate-200 rounded-lg px-3 py-2.5 focus:border-[#0284c7] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-97 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Malumotlarni O'zgartirish</span>
              </button>
            </form>
          </div>
        </div>
        </div>
      )}

      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">
          {/* ==================== 3. BILLING NOTIFICATIONS — real data from clinics/saasPayments ==================== */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-600 rounded-lg text-white font-black text-[9px] uppercase font-mono px-1.5">
                  BILLING
                </span>
                <span className="text-[10px] font-black text-slate-400 tracking-wider font-mono">
                  E'TIBOR TALAB QILADIGAN HOLATLAR
                </span>
              </div>
              <Inbox className="w-4 h-4 text-[#ef4444]" />
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              To'lov tasdiqlash kutayotgan, muddati o'tgan yoki obunasi to'xtatilgan klinikalar shu yerda ko'rinadi:
            </p>

            <div className="space-y-2 mt-3 select-none">
              {billingNotifications.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs font-mono">
                  Hozircha e'tibor talab qiladigan holat yo'q
                </div>
              ) : (
                billingNotifications.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold font-mono ${
                        item.kind === 'danger' ? 'text-[#f87171]' : item.kind === 'warn' ? 'text-amber-400' : 'text-cyan-400'
                      }`}>
                        {item.kind === 'danger' ? '⚠ Muddati o\'tgan' : item.kind === 'warn' ? '⏸ To\'xtatilgan' : 'ℹ Tasdiqlash kerak'}
                      </span>
                      <span className="text-slate-500 font-mono">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {activeSection === 'ads' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">
          {/* ==================== ADVERTISING MANAGEMENT (SUPERADMIN-EXCLUSIVE) ==================== */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Megaphone className="w-4 h-4" /></span>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Reklama Boshqaruvi
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                    Bemorlarga dastur va Telegram orqali ko'rsatiladigan reklamalar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAdForm(v => !v)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {showAddAdForm ? 'Bekor qilish' : 'Yangi reklama'}
              </button>
            </div>

            {showAddAdForm && (
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
                <input
                  type="text"
                  placeholder="Sarlavha *"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-purple-400"
                />
                <textarea
                  placeholder="Matn (ixtiyoriy)"
                  value={newAdBody}
                  onChange={(e) => setNewAdBody(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-purple-400"
                />
                <input
                  type="text"
                  placeholder="Havola (ixtiyoriy, masalan https://...)"
                  value={newAdLinkUrl}
                  onChange={(e) => setNewAdLinkUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-purple-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adImageInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    🖼️ Rasm yuklash
                  </button>
                  <input ref={adImageInputRef} type="file" accept="image/*" onChange={handleAdImageUpload} className="hidden" />
                  {newAdImageUrl && <img src={newAdImageUrl} alt="preview" className="h-10 w-10 object-cover rounded-lg border border-slate-200" />}
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Qayerda ko'rinsin?</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'web_home', label: 'Bosh sahifa banneri' },
                      { id: 'web_patient_panel', label: 'Bemor kabineti' },
                      { id: 'web_queue_screen', label: 'Navbat kutish ekrani' },
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAdPlacements.includes(opt.id)}
                          onChange={(e) => setNewAdPlacements(prev => e.target.checked ? [...prev, opt.id] : prev.filter(p => p !== opt.id))}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={newAdTelegramEnabled} onChange={(e) => setNewAdTelegramEnabled(e.target.checked)} />
                  Telegram navbat xabarlariga ham qo'shilsin
                </label>

                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Maqsadli klinika</label>
                  <select
                    value={newAdClinicId}
                    onChange={(e) => setNewAdClinicId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-purple-400"
                  >
                    <option value="">Barcha klinikalar (platforma bo'ylab)</option>
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <button
                  onClick={handleCreateAd}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-97 cursor-pointer"
                >
                  Reklamani yaratish
                </button>
              </div>
            )}

            <div className="space-y-2">
              {ads.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center font-medium bg-slate-50 border border-slate-100 rounded-xl">
                  Hozircha reklama yaratilmagan.
                </p>
              ) : (
                ads.map(ad => (
                  <div key={ad.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800">{ad.title}</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${ad.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {ad.status === 'active' ? 'Faol' : "To'xtatilgan"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {ad.placements.join(', ')}{ad.telegramEnabled ? ' + Telegram' : ''}
                          {ad.clinicId && ` · ${clinics.find(c => c.id === ad.clinicId)?.name || ad.clinicId}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ad.telegramEnabled && (
                        <button
                          onClick={() => handleBroadcastAd(ad)}
                          disabled={broadcastingAdId === ad.id}
                          title="Telegram orqali darhol yuborish"
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black flex items-center gap-1 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" /> {broadcastingAdId === ad.id ? '...' : 'Yuborish'}
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleAdStatus(ad)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black"
                      >
                        {ad.status === 'active' ? "To'xtatish" : 'Faollashtirish'}
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {activeSection === 'telegram' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">
          {/* ==================== TELEGRAM BOT CONFIGURATION (USER INTEGRATION) ==================== */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-blue-50 text-[#2563eb] rounded-lg">🤖</span>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Telegram Bot Sozlamalari
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                    @dstoma_bot integratsiya tizimi va token boshqaruvi
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest rounded text-center">
                TELEGRAM ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Bemorlar navbat olganda yoki shifokor qabulga chaqirganda real vaqtda telegram xabarini yuborish uchun <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-[10px]">@dstoma_bot</code> API tokenini integratsiya qiling.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const srvRes = await fetch('/api/telegram-config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {}) },
                  body: JSON.stringify({ token: telegramToken, doctorToken: doctorTelegramToken })
                });
                if (srvRes.ok) {
                  addLog("Telegram Bot Token(lar) server tizimida muvaffaqiyatli saqlandi! ⚡", 'success');
                  triggerToast("Telegram Bot Token(lar) muvaffaqiyatli saqlandi! ⚡");
                } else {
                  triggerToast("Xatolik: token saqlanmadi");
                }
              } catch (srvErr: any) {
                triggerToast("Xatolik: " + srvErr.message);
              }
            }} className="space-y-3.5 pt-1">
              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">BEMOR BOTI TOKENI *</label>
                <input
                  type="password"
                  placeholder="7514931393:AAFFZJ-fFf9hV4gA-S..."
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="w-full bg-slate-50 text-xs font-mono text-slate-800 border border-slate-200 rounded-lg px-3 py-2.5 focus:border-[#0284c7] focus:outline-none placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">SHIFOKOR BOTI TOKENI</label>
                <input
                  type="password"
                  placeholder="7514931393:AAFFZJ-fFf9hV4gA-S..."
                  value={doctorTelegramToken}
                  onChange={(e) => setDoctorTelegramToken(e.target.value)}
                  className="w-full bg-slate-50 text-xs font-mono text-slate-800 border border-slate-200 rounded-lg px-3 py-2.5 focus:border-[#0284c7] focus:outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-sm uppercase cursor-pointer"
              >
                Saqlash ✓
              </button>
              <p className="text-[9px] text-slate-400 font-semibold">
                Tokenlar faqat serverda saqlanadi — brauzer xotirasiga hech qachon yozilmaydi.
              </p>
            </form>

            {/* Vercel Webhook Setup Section */}
            <div className="bg-[#f0f9ff] rounded-2xl p-4 border border-blue-100 space-y-3">
              <strong className="text-[10px] uppercase font-black tracking-widest text-blue-600 block">🧭 Vercel (Serverless) Webhook Sozlash</strong>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                Agarda platformangiz Vercel serverless tizimida bo'lsa, Telegram bot yangiliklarni qabul qilishi uchun unga saytning webhook manzilini yuklash kerak:
              </p>
              <button
                type="button"
                onClick={async () => {
                  const activeToken = telegramToken;
                  if (!activeToken) {
                    triggerToast("Iltimos, avval Telegram API tokenini yuqorida saqlang!");
                    return;
                  }
                  triggerToast("Webhook Telegram serverida ro'yxatdan o'tkazilmoqda...");
                  
                  // Clean token to avoid whitespace issues
                  const cleanToken = activeToken.trim();
                  const domain = window.location.origin;
                  const webhookUrl = `${domain}/api/telegram-webhook?token=${encodeURIComponent(cleanToken)}`;

                  try {
                    addLog(`Telegram API orqali bevosita webhook o'rnatilmoqda: ${webhookUrl}`, 'info');
                    
                    // Direct CORS-friendly request from browser to Telegram API to establish immediate hookup
                    const tgDirectUrl = `https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
                    const directRes = await fetch(tgDirectUrl);
                    
                    if (directRes.ok) {
                      const directData = await directRes.json();
                      if (directData.ok) {
                        triggerToast("Webhook muvaffaqiyatli bog'landi! Telegram bot faollashdi. 🎉✅");
                        addLog(`Telegram Webhook muvaffaqiyatli bog'landi (Brauzer orqali): ${webhookUrl}`, 'success');
                        return; // Done! Direct path succeeded
                      } else {
                        addLog(`Brauzer orqali sozlab bo'lmadi: ${directData.description || "noma'lum xato"}. Server-side sinab ko'rilmoqda...`, 'warn');
                      }
                    } else {
                      addLog(`Brauzer orqali sozlashda xato statusi: ${directRes.status}. Server-side sinab ko'rilmoqda...`, 'warn');
                    }
                  } catch (clientErr: any) {
                    addLog(`Brauzer orqali bog'lanishda xato: ${clientErr.message || clientErr}. Server-side sinab ko'rilmoqda...`, 'warn');
                  }

                  // Server-side fallback path
                  try {
                    const response = await fetch(`/api/telegram-webhook-setup?domain=${encodeURIComponent(domain)}&token=${encodeURIComponent(cleanToken)}`, {
                      headers: superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {}
                    });
                    
                    if (!response.ok) {
                      const text = await response.text();
                      let errMsg = `Server xatosi (Status ${response.status}): `;
                      try {
                        const errJson = JSON.parse(text);
                        errMsg += errJson.error || response.statusText;
                      } catch {
                        errMsg += text.substring(0, 100) || response.statusText;
                      }
                      triggerToast(errMsg);
                      addLog(`Webhook-ni sozlash xatosi (${response.status}): ${text.substring(0, 200)}`, 'warn');
                      return;
                    }

                    const data = await response.json();
                    if (data.ok) {
                      triggerToast("Webhook muvaffaqiyatli bog'landi! Telegram bot faollashdi. 🎉✅");
                      addLog(`Telegram Webhook muvaffaqiyatli bog'landi: ${data.webhook_url}`, 'success');
                      setTimeout(() => checkWebhookStatusFunc(cleanToken), 1000);
                    } else {
                      triggerToast(`Xatolik: ${data.error || 'Webhook sozlanmadi'}`);
                    }
                  } catch (err: any) {
                    triggerToast(`Bog'lanishda xatolik yuz berdi: ${err.message || err}`);
                  }
                }}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-sm shrink-0 uppercase cursor-pointer"
              >
                Telegram Webhook-ni Avtomatik Sozlash ⚡
              </button>

              {/* Webhook Status Diagnostic Area */}
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">🔍 Webhook Diagnostikasi</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={fetchDebugLogsFunc}
                      type="button"
                      disabled={fetchingDebug}
                      className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-[9px] font-black transition cursor-pointer"
                    >
                      {fetchingDebug ? "Yuklanmoqda..." : "Kiruvchi Loglar 📜"}
                    </button>
                    <button
                      onClick={async () => {
                        const activeToken = telegramToken;
                        if (!activeToken) {
                          triggerToast("Iltimos, avval token-ni kiriting va saqlang!");
                          return;
                        }
                        await checkWebhookStatusFunc(activeToken.trim());
                      }}
                      type="button"
                      disabled={checkingStatus}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[9px] font-bold text-slate-700 transition cursor-pointer"
                    >
                      {checkingStatus ? "Tekshirilmoqda..." : "Holatni Yangilash 🔄"}
                    </button>
                  </div>
                </div>

                {webhookStatus ? (
                  <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-slate-100 font-mono text-slate-700 leading-normal">
                    <div className="flex justify-between border-b pb-1 font-sans font-bold">
                      <span>Telegram Holati:</span>
                      <span className={webhookStatus.ok ? "text-green-600" : "text-rose-600"}>
                        {webhookStatus.ok ? "Ulangan 🟢" : "Muammo bor 🔴"}
                      </span>
                    </div>
                    {webhookStatus.result ? (
                      <>
                        <div className="break-all font-semibold"><span className="text-slate-400">Webhook URL:</span> <span className="text-blue-600">{webhookStatus.result.url || "O'RNATILMAGAN ❌"}</span></div>
                        <div><span className="text-slate-400">Kutilayotgan xabarlar (Pending):</span> <span className="font-bold text-amber-600">{webhookStatus.result.pending_update_count} ta</span></div>
                        {webhookStatus.result.last_error_message ? (
                          <div className="bg-rose-50 text-rose-600 p-1.5 rounded border border-rose-100 mt-1 font-sans text-[10px]">
                            <div className="font-bold flex items-center gap-1">⚠️ Telegram xabar yubora olmadi:</div>
                            <div className="mt-0.5 whitespace-pre-wrap leading-relaxed break-words font-mono text-[9px] font-semibold">{webhookStatus.result.last_error_message}</div>
                            {webhookStatus.result.last_error_date && (
                              <div className="text-[8px] text-rose-400 mt-1">Sana: {new Date(webhookStatus.result.last_error_date * 1000).toLocaleString('uz-UZ')}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-green-600 font-sans font-bold text-[9px] flex items-center gap-1 mt-1">✅ Hech qanday xatolik qayd etilmagan (Telegram muvaffaqiyatli bog'landi).</div>
                        )}
                      </>
                    ) : (
                      <div className="text-rose-500 font-bold">{webhookStatus.description || "Tafsilotlar olinmadi"}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-400 font-semibold italic text-center">So'nggi diagnostika ma'lumotlarini olish uchun "Holatni Yangilash" tugmasini bosing</p>
                )}

                {/* Webhook live incoming stream logs */}
                {debugLogs.length > 0 ? (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <strong className="text-[9px] text-[#4f46e5] font-extrabold uppercase tracking-wide block">📥 Serverga kelgan so'nggi Telegram so'rovlari:</strong>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {debugLogs.map((log: any, idx: number) => (
                        <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 font-mono text-[9px] space-y-1">
                          <div className="flex justify-between items-center text-[8px] text-slate-400 font-sans">
                            <span>{new Date(log.timestamp).toLocaleTimeString('uz-UZ')}</span>
                            <span className={`px-1 rounded font-bold uppercase ${log.success ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"}`}>
                              {log.success ? "Muvaffaqiyatli" : "Xato"}
                            </span>
                          </div>
                          {log.error && (
                            <div className="text-rose-600 font-sans font-bold text-[9px] bg-rose-50 p-1 rounded">
                              ⚠️ Muammo: {log.error}
                            </div>
                          )}
                          {log.tokenProcessed && (
                            <div className="text-[8px] text-slate-400">
                              <span className="font-bold font-sans">Ishlatilgan Token:</span> {log.tokenProcessed}
                            </div>
                          )}
                          {log.body ? (
                            <div className="bg-slate-50 p-1 rounded overflow-x-auto text-[8px] leading-relaxed select-text text-slate-600 max-w-full whitespace-pre-wrap break-all">
                              <span className="font-bold font-sans text-slate-400">Payload:</span> {JSON.stringify(log.body, null, 1)}
                            </div>
                          ) : (
                            <div className="text-slate-400">[Bo'sh tana / Body empty]</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-1 text-center">
                    <button
                      onClick={fetchDebugLogsFunc}
                      type="button"
                      className="text-[9px] text-indigo-600 font-bold hover:underline"
                    >
                      📥 Serverdagi kiruvchi so'rovlar logini yuklash
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                Faol Vercel Webhook havolasi: <code className="bg-white/80 px-1 border border-slate-100 rounded font-mono text-[9px] text-[#2563eb]">{window.location.origin}/api/telegram-webhook?token={telegramToken ? telegramToken.slice(0, 15) + "..." : "TOKEN"}</code>
              </p>
            </div>

            {/* Test Notification Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <strong className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">⚡ Bot Integratsiyasini Test Qilish</strong>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID raqam (masalan, 57896431)"
                  id="test_telegram_chat_id"
                  className="flex-1 bg-white text-xs font-bold font-mono text-slate-800 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const testIdInput = (document.getElementById('test_telegram_chat_id') as HTMLInputElement)?.value || '';
                    if (!testIdInput) {
                      triggerToast("Iltimos, avval test o'tkazish uchun Telegram Chat ID kiriting!");
                      return;
                    }
                    triggerToast("Test xabari Telegramga jo'natilmoqda...");
                    
                    try {
                      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          chat_id: testIdInput.trim(),
                          text: `<b>👋 Salom!</b> Integratsiya testdan muvaffaqiyatli o'tdi.\n📍 <b>DStoma</b> queue platforması sozlangan va ishlashga tayyor!`,
                          parse_mode: 'HTML'
                        })
                      });
                      
                      if (response.ok) {
                        triggerToast("Muvaffaqiyatli yuborildi! @dstoma_bot ni tekshiring. ✅");
                        addLog(`Telegram integratsiyasi muvaffaqiyatli test qilindi. Chat ID: ${testIdInput}`, 'success');
                      } else {
                        const err = await response.json();
                        triggerToast(`Xatolik: ${err.description || 'Noma\'lum xato'}`);
                      }
                    } catch (err: any) {
                      triggerToast("Telegramga bog'lanishda xatolik yuz berdi!");
                    }
                  }}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] tracking-wide rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  Test Xabar Yuborish ➔
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                Test yuborishdan oldin Telegramda <a href="https://t.me/dstoma_bot" target="_blank" rel="noreferrer" className="text-cyan-600 underline font-extrabold">@dstoma_bot</a> botiga o'tib <code className="bg-white px-1 border border-slate-200 rounded font-mono text-[9px] font-bold text-slate-700">/start</code> bosilganiga ishonch hosil qiling.
              </p>
            </div>
          </div>
        </div>
        </div>
      )}

      {activeSection === 'clinics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">

          {/* SECTION 1: CLINIC CREDENTIALS & LICENSING BILLING BOX */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  {t('billingPanel')}
                </h3>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Klinika qidirish..."
                  value={searchClinicTerm}
                  onChange={(e) => setSearchClinicTerm(e.target.value)}
                  className="bg-slate-50 text-[11px] border border-slate-200 rounded-lg pl-7 pr-3 py-1 text-slate-700 font-medium focus:outline-none focus:border-cyan-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              {t('ownerProvisionNotice')} Siz birgina tugma orqali har bir stomatologiya klinikasining kirish hisobini, login va parolini o'zgartirishingiz hamda daxlsiz qulflash amallarini bajarishingiz mumkin.
            </p>

            <div className="space-y-4 mt-3">
              {filteredClinics.map((clinic) => {
                const subStatus = clinic.subscriptionStatus || 'active';
                const fee = clinic.rentalPrice || 1500000;
                const isEditing = editingClinicId === clinic.id;

                return (
                  <div 
                    key={clinic.id} 
                    className="p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-2xl flex flex-col gap-4 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{clinic.logo || '🦷'}</span>
                          <h4 className="text-xs font-black text-slate-800 leading-none">{clinic.name}</h4>
                          <span className="px-1.5 py-0.5 bg-cyan-900/10 text-cyan-800 text-[10px] font-bold rounded-md font-mono">
                            {window.location.host}/?clinic={clinic.subdomain}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                          Rahbar/CEO: <span className="text-slate-700">{clinic.ownerName || "Kiritilmagan"}</span> | Oylik litsenziya: <span className="text-slate-800 font-mono font-bold">{fee.toLocaleString('uz-UZ')} so'm</span>
                        </p>
                      </div>

                      {/* flex-wrap: this row can hold edit/delete buttons, a status
                          badge, and an activate/block button at once — on a narrow
                          phone that's more than fits one line, so it now wraps to a
                          second line instead of pushing the rightmost button (delete)
                          off the edge of the screen. */}
                      <div className="flex items-center flex-wrap gap-2 shrink-0">
                        <button
                          onClick={() => setClinicToEdit(clinic)}
                          className="p-1 px-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded text-[10px] font-bold shadow-sm transition-all"
                          title="Tahrirlash"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setClinicToDelete(clinic)}
                          className="p-1 px-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded text-[10px] font-bold shadow-sm transition-all"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full tracking-wide ${
                          subStatus === 'active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : subStatus === 'trial' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {subStatus === 'active' ? t('statusActive') : subStatus === 'trial' ? t('statusTrial') : t('statusSuspended')}
                        </span>

                        <button
                          onClick={() => onToggleSubscription(clinic.id)}
                          className={`px-3 py-1 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all ${
                            subStatus === 'suspended'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {subStatus === 'suspended' ? t('activateBtn') : t('blockBtn')}
                        </button>
                      </div>
                    </div>

                    {/* Interactive Credentials View & Editing for Clinics */}
                    <div className="bg-white p-3 rounded-xl border border-slate-100/80">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest font-mono flex items-center gap-1">
                              <KeyRound className="w-3.5 h-3.5 text-indigo-500" /> Tahrirlash: {clinic.name}
                            </span>
                            <button 
                              onClick={() => setEditingClinicId(null)}
                              className="text-slate-400 hover:text-slate-600 text-xs"
                            >
                              Bekor qilish
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black text-slate-500 block mb-1">LOGIN</label>
                              <input
                                type="text"
                                value={clinicLoginVal}
                                onChange={(e) => setClinicLoginVal(e.target.value)}
                                className="w-full bg-slate-50 text-[11px] font-bold font-mono text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-[#06b6d4] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-500 block mb-1">YANGI PAROL</label>
                              <input
                                type="text"
                                value={clinicPassVal}
                                onChange={(e) => setClinicPassVal(e.target.value)}
                                placeholder="Xavfsizlik uchun yangi parol kiriting"
                                className="w-full bg-slate-50 text-[11px] font-bold font-mono text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-[#06b6d4] focus:outline-none"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-1.5 pot-2">
                            <button
                              onClick={() => {
                                const defaultLog = `ceo_${clinic.subdomain}`;
                                const defaultPass = `Stoma${Math.floor(100000 + Math.random() * 900000)}`;
                                setClinicLoginVal(defaultLog);
                                setClinicPassVal(defaultPass);
                              }}
                              className="p-1 px-2.5 text-[9px] bg-slate-100 text-slate-600 font-bold rounded-md hover:bg-slate-200"
                              title="Tizim tomonidan tasodifiy hisob ma'lumotlarini o'rnatish"
                            >
                              Tasodifiy generatsiya
                            </button>
                            <button
                              onClick={() => handleSaveClinicCredsSubmit(clinic.id)}
                              className="p-1 px-3 text-[9px] bg-slate-900 hover:bg-slate-800 text-white font-black rounded-md flex items-center gap-1 active:scale-95"
                            >
                              <Save className="w-3 h-3 text-cyan-400" /> {t('saveCredChange')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono">{t('customLogin')}:</span>
                              <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono text-[11px] select-all">
                                {clinic.login || `ceo_${clinic.subdomain}`}
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono">{t('customPass')}:</span>
                              <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono text-[11px] select-all">
                                {getDisplayPassword(clinic.id, credentialPasswords.clinics)}
                              </code>
                              <button
                                type="button"
                                onClick={() => toggleRevealed(clinic.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 hover:bg-slate-100"
                                title={revealedIds[clinic.id] ? "Parolni yashirish" : "Parolni ko'rsatish"}
                              >
                                {revealedIds[clinic.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => setClinicToEdit(clinic)}
                              className="px-2.5 py-1 text-indigo-600 hover:text-indigo-800 rounded bg-indigo-50 hover:bg-indigo-100 text-[10px] font-black cursor-pointer flex items-center gap-1"
                              title="Klinika ma'lumotlarini o'zgartirish"
                            >
                              ⚙️ Tahrirlash
                            </button>
                            <button
                              onClick={() => {
                                const pw = getCopyablePassword(clinic.id, credentialPasswords.clinics);
                                if (!pw) {
                                  triggerToast("Parol xavfsizlik uchun yashiringan — avval \"Kalitni qayta tiklash\" orqali yangi parol o'rnating.");
                                  return;
                                }
                                handleCopyGeneric(`Login: ${clinic.login || `ceo_${clinic.subdomain}`} | Parol: ${pw}`);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 hover:bg-slate-100"
                              title="Nusxalash"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateClinicCredsClick(clinic)}
                              className="p-1 text-cyan-600 hover:text-cyan-800 rounded bg-cyan-50 hover:bg-cyan-100 text-[10px] font-black"
                            >
                              {t('resetCreds')}
                            </button>
                            {onAdminImpersonate && (
                              <button
                                onClick={() => onAdminImpersonate('director', clinic.id)}
                                className="px-2.5 py-1 text-violet-600 hover:text-violet-800 rounded bg-violet-50 hover:bg-violet-100 text-[10px] font-black cursor-pointer flex items-center gap-1"
                                title="O'z parolisiz Direktor panelga kirish"
                              >
                                👑 Direktor sifatida kirish
                              </button>
                            )}
                            <button
                              onClick={() => setClinicToDelete(clinic)}
                              className="px-2.5 py-1 text-rose-600 hover:text-rose-800 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-black cursor-pointer flex items-center gap-1"
                              title="Klinikani butunlay o'chirish"
                            >
                              🗑️ {tL("O'chirish")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}

      {activeSection === 'group-report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-xs">
            <h3 className="text-sm font-black text-slate-800 mb-1">Guruh hisoboti</h3>
            <p className="text-xs text-slate-400 mb-4">
              Bir egaga tegishli bir nechta filial "Klinikalar" bo'limida bir xil "Guruh nomi" bilan belgilansa, shu yerda jamlangan holda ko'rinadi.
            </p>
            {clinicGroups.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                Hozircha hech qanday klinika guruhga biriktirilmagan. "Klinikalar" bo'limida bir klinikani tahrirlab, "Guruh nomi" maydonini to'ldiring.
              </p>
            ) : (
              <div className="space-y-4">
                {clinicGroups.map((g) => (
                  <div key={g.groupId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-600" /> {g.groupId}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">{g.clinics.length} ta filial</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase block">Oylik to'lov (jami)</span>
                        <strong className="text-sm font-black text-slate-800 font-mono">{g.totalRentalPrice.toLocaleString('uz-UZ')} so'm</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase block">Faol bemorlar</span>
                        <strong className="text-sm font-black text-slate-800 font-mono">{g.totalActivePatients}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase block">Shifokorlar</span>
                        <strong className="text-sm font-black text-slate-800 font-mono">{g.totalDoctors}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase block">Bajarilgan qabullar</span>
                        <strong className="text-sm font-black text-slate-800 font-mono">{g.totalCompletedVisits}</strong>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.clinics.map((c) => (
                        <span key={c.id} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'doctors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 space-y-6">
          {/* SECTION 2: DOCTOR CREDENTIALS HUB (EXPLICITLY GIVEN BY OWNER) */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👨‍⚕</span>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  {t('doctorCredsTitle')}
                </h2>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Shifokor qidirish..."
                    value={searchDoctorTerm}
                    onChange={(e) => setSearchDoctorTerm(e.target.value)}
                    className="bg-slate-50 text-[11px] border border-slate-200 rounded-lg pl-7 pr-3 py-1 text-slate-700 font-medium focus:outline-none focus:border-cyan-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
                </div>
                <button
                  onClick={() => setShowAddDoctorModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Qo'shish
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Shifokorlarning shaxsiy kabinetga kirish hisoblari hamda ularning parollari mutlaqo ushbu bo'limda belgilanadi. Shifokorlar o'zlarining kabinetiga joriy login-parollar orqali kirib navbatlarni boshqara oladilar.
            </p>

            <div className="divide-y divide-slate-100">
              {filteredDoctors.map((doc) => {
                const isEditingDoc = editingDoctorId === doc.id;
                return (
                  <div key={doc.id} className="py-4.5 flex flex-col gap-3">
                    {/* This row never stacked on mobile — with a long doctor name and
                        the status dot/text plus edit/delete buttons all fighting for
                        one line, the delete button ran off the right edge of narrow
                        phone screens. Stacks below sm: now, matching the clinic list
                        row above. */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                      <div className="flex items-center gap-3">
                        <img
                          src={doc.image} 
                          alt={doc.name} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + doc.name;
                          }}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-800 leading-tight">{doc.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            Specialty: <span className="text-slate-600">{doc.specialty}</span> | Filial: <span className="text-[#06b6d4] font-mono text-[9px] font-black uppercase bg-cyan-950/10 px-1.5 py-0.5 rounded">{doc.clinicId}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          doc.status === 'idle' ? 'bg-emerald-500' : doc.status === 'busy' ? 'bg-rose-500' : 'bg-amber-400'
                        }`} title={`Hozirgi holat: ${doc.status}`}></span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold capitalize select-none mr-2">
                          {doc.status}
                        </span>
                        <button
                          onClick={() => setDoctorToEditDetails(doc)}
                          className="p-1 px-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded text-[10px] font-bold shadow-sm transition-all"
                          title="Tahrirlash"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDoctorToDelete(doc)}
                          className="p-1 px-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded text-[10px] font-bold shadow-sm transition-all"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Credentials status or Edit form for specific Doctor */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {isEditingDoc ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                            <span className="text-[9px] font-black text-indigo-700 tracking-wider uppercase font-mono flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-indigo-500" /> Tahrirlash: {doc.name}
                            </span>
                            <button onClick={() => setEditingDoctorId(null)} className="text-slate-400 hover:text-slate-600 text-[10px]">
                              Bekor qilish
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black text-slate-500 block mb-0.5">LOGIN</label>
                              <input
                                type="text"
                                value={doctorLoginVal}
                                onChange={(e) => setDoctorLoginVal(e.target.value)}
                                className="w-full bg-white text-[11px] font-bold font-mono text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 focus:border-[#06b6d4] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-500 block mb-0.5">YANGI PAROL</label>
                              <input
                                type="text"
                                value={doctorPassVal}
                                onChange={(e) => setDoctorPassVal(e.target.value)}
                                placeholder="Xavfsizlik uchun yangi parol kiriting"
                                className="w-full bg-white text-[11px] font-bold font-mono text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 focus:border-[#06b6d4] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-1 px-1 mt-1">
                            <button
                              onClick={() => {
                                const defaultLog = (doc.name || 'Doc').split(' ')[0].toLowerCase() + Math.floor(10 + Math.random() * 90);
                                const defaultPass = `Doc${Math.floor(1000 + Math.random() * 9000)}`;
                                setDoctorLoginVal(defaultLog);
                                setDoctorPassVal(defaultPass);
                              }}
                              className="text-[9px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-white border border-slate-200"
                            >
                              Avto-generatsiya
                            </button>
                            <button
                              onClick={() => handleSaveDoctorCredsSubmit(doc.id)}
                              className="text-[9px] font-black text-white px-3 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded flex items-center gap-1"
                            >
                              <Save className="w-3 h-3 text-cyan-400" /> Saqlash
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono">{t('customLogin')}:</span>
                              <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono text-[11px] select-all">
                                {doc.login || (doc.name || 'Doc').split(' ')[0].toLowerCase()}
                              </code>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono">{t('customPass')}:</span>
                              <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono text-[11px] select-all">
                                {getDisplayPassword(doc.id, credentialPasswords.doctors)}
                              </code>
                              <button
                                type="button"
                                onClick={() => toggleRevealed(doc.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 hover:bg-slate-100"
                                title={revealedIds[doc.id] ? "Parolni yashirish" : "Parolni ko'rsatish"}
                              >
                                {revealedIds[doc.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const pw = getCopyablePassword(doc.id, credentialPasswords.doctors);
                                if (!pw) {
                                  triggerToast("Parol xavfsizlik uchun yashiringan — avval \"Kalitni qayta tiklash\" orqali yangi parol o'rnating.");
                                  return;
                                }
                                handleCopyGeneric(`Shifokor: ${doc.name} | Login: ${doc.login || (doc.name || 'Doc').split(' ')[0].toLowerCase()} | Password: ${pw}`);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 bg-white border border-slate-100 rounded"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDoctorToEditDetails(doc)}
                              className="p-1 px-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded text-[10px] font-black cursor-pointer transition-colors"
                              title="Ism, mutaxassislik va filialni o'zgartirish (parol bu yerda emas)"
                            >
                              {tL("Ma'lumotlarini tahrirlash")}
                            </button>
                            <button
                              onClick={() => handleUpdateDoctorCredsClick(doc)}
                              className="p-1 px-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-[10px] font-black rounded"
                              title="Login va parolni o'zgartirish shu yerda"
                            >
                              {t('resetCreds')}
                            </button>
                            {onAdminImpersonate && (
                              <button
                                onClick={() => onAdminImpersonate('doctor', doc.id)}
                                className="p-1 px-2.5 text-violet-600 hover:text-violet-800 rounded bg-violet-50 hover:bg-violet-100 text-[10px] font-black cursor-pointer"
                                title="O'z parolisiz Shifokor panelga kirish"
                              >
                                👑 Shifokor sifatida kirish
                              </button>
                            )}
                            <button
                              onClick={() => setDoctorToDelete(doc)}
                              className="px-2.5 py-1 text-rose-600 hover:text-rose-800 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-black cursor-pointer flex items-center gap-1 animate-fade-in"
                              title="Shifokorni butunlay o'chirish"
                            >
                              🗑️ {tL("O'chirish")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}

        </div>
      </div>

      {/* ONE-TIME CREDENTIAL REVEAL — shown right after creating a doctor or resetting
          a doctor/clinic password. This is the ONLY moment the real password is ever
          visible again, since it's hashed irreversibly the instant it's saved. */}
      {justSetCredential && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto overflow-x-hidden space-y-4 relative">
            <div className="absolute right-0 top-0 w-32 h-32 pointer-events-none opacity-25 bg-[radial-gradient(circle,rgba(6,182,212,0.15),transparent_70%)]"></div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-[10px] font-extrabold text-cyan-400 tracking-widest uppercase flex items-center gap-1.5 font-mono">
                🔓 Hisob ma'lumotlari
              </span>
              <button onClick={() => setJustSetCredential(null)} className="text-slate-500 hover:text-slate-300 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-[11px] text-amber-300 font-semibold leading-snug">
                ⚠️ Bu login-parolni tegishli shaxsga yetkazing. Keyinroq ham ro'yxatdagi 👁 belgisini bosib qayta ko'rishingiz mumkin.
              </p>
            </div>
            <div className="font-mono text-[11px] space-y-1.5 text-slate-200 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 select-all">
              <p className="text-slate-400">{justSetCredential.label}</p>
              <hr className="border-slate-800/60 my-2" />
              <p className="text-cyan-400 font-bold"><span className="text-slate-500">Login:</span> {justSetCredential.login}</p>
              <p className="text-emerald-400 font-bold"><span className="text-slate-500">Parol:</span> {justSetCredential.pass}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Login: ${justSetCredential.login}\nParol: ${justSetCredential.pass}`);
                triggerToast(tL("Nusxalandi!"));
              }}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Copy className="w-4 h-4" /> Nusxalash
            </button>
          </div>
        </div>
      )}

      {/* DETAILED CLINIC EDITING MODAL (USER REQUIREMENT) */}
      {clinicToEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-4 font-sans text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                📝 Klinika Tafsilotlarini Tahrirlash
              </h3>
              <button 
                onClick={() => setClinicToEdit(null)} 
                className="text-slate-400 hover:text-slate-600 text-sm font-black cursor-pointer"
              >
                ✖
              </button>
            </div>

            {/* Editor Form fields */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateClinicDetails) {
                onUpdateClinicDetails(clinicToEdit);
              }
              addLog(`Klinika o'zgartirildi: ${clinicToEdit.name}`, 'success');
              triggerToast("Klinika ma'lumotlari yangilandi!");
              setClinicToEdit(null);
            }} className="space-y-3.5">
              
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  Klinika Nomi *
                </label>
                <input
                  type="text"
                  required
                  value={clinicToEdit.name}
                  onChange={(e) => setClinicToEdit({ ...clinicToEdit, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Subdomen (subdomain) *
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicToEdit.subdomain}
                    onChange={(e) => setClinicToEdit({ ...clinicToEdit, subdomain: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Rahbar (CEO) ismi *
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicToEdit.ownerName || ""}
                    onChange={(e) => setClinicToEdit({ ...clinicToEdit, ownerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Telefon raqami
                  </label>
                  <input
                    type="text"
                    value={clinicToEdit.phone || ""}
                    onChange={(e) => setClinicToEdit({ ...clinicToEdit, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Oylik Ijara summasi (UZS) *
                  </label>
                  <input
                    type="number"
                    required
                    value={clinicToEdit.rentalPrice || 1500000}
                    onChange={(e) => setClinicToEdit({ ...clinicToEdit, rentalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  Klinika Manzili (Xaritaga ulanish linki) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: https://google.com/maps/..."
                  value={clinicToEdit.mapLink || ""}
                  onChange={(e) => setClinicToEdit({ ...clinicToEdit, mapLink: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-800 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  Guruh nomi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Ismoilov filiallari"
                  value={clinicToEdit.groupId || ""}
                  onChange={(e) => setClinicToEdit({ ...clinicToEdit, groupId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bir egaga tegishli bir nechta filialga BIR XIL nom bering — "Guruh hisoboti" bo'limida jamlanib ko'rsatiladi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Latitude (Kenglik) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={clinicToEdit.lat || ""}
                    onChange={(e) => setClinicToEdit({ ...clinicToEdit, lat: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Longitude (Uzunlik) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={clinicToEdit.lng || ""}
                    onChange={(e) => setClinicToEdit({ ...clinicToEdit, lng: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Navbatdagi to'lov muddati
                  </label>
                  <input
                    type="date"
                    value={clinicToEdit.nextPaymentDate || ""}
                    onChange={(e) => setClinicToEdit({ ...clinicToEdit, nextPaymentDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Klinika Logotipi (Emoji)
                  </label>
                  <input
                    type="text"
                    value={clinicToEdit.logo || "🦷"}
                    onChange={(e) => setClinicToEdit({ ...clinicToEdit, logo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  Obuna darajasi
                </label>
                <select
                  value={clinicToEdit.subscriptionTier || 'basic'}
                  onChange={(e) => setClinicToEdit({ ...clinicToEdit, subscriptionTier: e.target.value as 'basic' | 'premium' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="basic">Basic (AI'siz)</option>
                  <option value="premium">Premium (AI Yordamchi bilan)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setClinicToEdit(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0284c7] hover:bg-cyan-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <Save className="w-4 h-4 text-cyan-200" /> Saqlash ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CLINIC CONFIRMATION MODAL */}
      {clinicToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {tL("Diqqat!")}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {(() => {
                const nm = clinicToDelete.name;
                const tpl: Record<string, string> = {
                  // This used to promise a cascade delete of doctors and queues that
                  // the server never actually performed — the clinic record vanished
                  // but its doctors, queues, patients and services stayed in the
                  // database as orphaned records. Doctors can no longer log in to a
                  // deleted clinic (blocked server-side), but their data is not erased.
                  uz: `"${nm}" klinikasini o'chirishni tasdiqlaysizmi? Klinika ro'yxatdan olib tashlanadi va uning shifokorlari endi tizimga kira olmaydi — lekin shifokorlar, navbatlar va bemorlar ma'lumotlari bazada saqlanib qoladi (o'chirilmaydi).`,
                  ru: `Удалить клинику "${nm}"? Клиника будет убрана из списка, и её врачи больше не смогут войти в систему — но данные врачей, очередей и пациентов останутся в базе (не удаляются).`,
                  en: `Delete "${nm}" clinic? The clinic will be removed and its doctors will no longer be able to log in — but the clinic's doctors, queues and patient records are NOT deleted and remain in the database.`,
                  kk: `"${nm}" клиникасын өшіресізбе? Клиника тізімнен алынады, оның дәрігерлері енді жүйеге кіре алмайды — бірақ дәрігерлер, кезектер және науқастар деректері дерекқорда қалады (өшірілмейді).`,
                  ky: `"${nm}" клиникасын өчүрөсүзбү? Клиника тизмеден алынат, анын дарыгерлери эми тутумга кире алышпайт — бирок дарыгерлер, кезектер жана бейтаптар маалыматы дерекканада калат (өчүрүлбөйт).`,
                  tg: `Клиникаи "${nm}"-ро нест мекунед? Клиника аз рӯйхат хориҷ мешавад ва духтуронаш дигар ба система дохил шуда наметавонанд — аммо маълумоти духтурон, навбатҳо ва беморон дар пойгоҳи додаҳо мемонад (нест намешавад).`,
                  tk: `"${nm}" klinikasyny pozmagy tassyklaýarsyňyzmy? Klinika sanawdan aýrylar we onuň lukmanlary indi ulgama girip bilmezler — emma lukmanlar, nobatlar we näsag maglumatlary bazada galar (pozulmaýar).`
                };
                return tpl[language] || tpl.en;
              })()}
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => setClinicToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                {tL("Bekor qilish")}
              </button>
              <button
                onClick={() => {
                  onDeleteClinic?.(clinicToDelete.id);
                  addLog(`Clinic "${clinicToDelete.name}" has been permanently purged.`, 'warn');
                  triggerToast(tL("Klinika o'chirib tashlandi!"));
                  setClinicToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                {tL("O'chirish")}
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
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {tL("Shifokorni o'chirish")}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {(() => {
                const nm = doctorToDelete.name;
                const tpl: Record<string, string> = {
                  uz: `"${nm}" shifokor profilini o'chirishni tasdiqlaysizmi?`,
                  ru: `Вы действительно хотите удалить профиль врача "${nm}"?`,
                  en: `Are you sure you want to completely delete "${nm}" doctor profile?`,
                  kk: `"${nm}" дәрігер профилін жоюды растайсыз ба?`,
                  ky: `"${nm}" дарыгер профилин өчүрүүнү ырастайсызбы?`,
                  tg: `Оё нест кардани профили духтур "${nm}"-ро тасдиқ мекунед?`,
                  tk: `"${nm}" lukman profilini pozmagy tassyklaýarsyňyzmy?`
                };
                return tpl[language] || tpl.en;
              })()}
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => setDoctorToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
              >
                {tL("Bekor qilish")}
              </button>
              <button
                onClick={() => {
                  onDeleteDoctor?.(doctorToDelete.id);
                  addLog(`Doctor "${doctorToDelete.name}" credentials have been deleted.`, 'warn');
                  triggerToast(tL("Shifokor o'chirildi!"));
                  setDoctorToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                {tL("O'chirish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-center border-b border-slate-100 pb-2">
              {tL("Yangi Shifokor Qo'shish")}
            </h3>
            <form onSubmit={handleCreateDoctorSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Ism Familiya *
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Mutaxassislik *
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorSpecialty}
                  placeholder="masalan: Stomatolog-Terapevt"
                  onChange={(e) => setNewDoctorSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Klinika / Filial *
                </label>
                <select
                  required
                  value={newDoctorClinicId}
                  onChange={(e) => setNewDoctorClinicId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>Klinikani tanlang</option>
                  {clinics.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
                >
                  {tL("Bekor qilish")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                >
                  {tL("Qo'shish")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR DETAILS MODAL */}
      {doctorToEditDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-center border-b border-slate-100 pb-2">
              {tL("Shifokorni Tahrirlash")}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (onUpdateDoctorDetails) {
                const ok = await onUpdateDoctorDetails(doctorToEditDetails.id, {
                  name: doctorToEditDetails.name,
                  specialty: doctorToEditDetails.specialty,
                  clinicId: doctorToEditDetails.clinicId
                });
                if (!ok) {
                  triggerToast("Saqlash muvaffaqiyatsiz tugadi — internet aloqasini tekshirib, qayta urinib ko'ring.");
                  return;
                }
                triggerToast(tL("Shifokor ma'lumotlari yangilandi!"));
              }
              setDoctorToEditDetails(null);
            }} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Ism Familiya *
                </label>
                <input
                  type="text"
                  required
                  value={doctorToEditDetails.name}
                  onChange={(e) => setDoctorToEditDetails({ ...doctorToEditDetails, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Mutaxassislik *
                </label>
                <input
                  type="text"
                  required
                  value={doctorToEditDetails.specialty}
                  onChange={(e) => setDoctorToEditDetails({ ...doctorToEditDetails, specialty: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Klinika / Filial *
                </label>
                <select
                  required
                  value={doctorToEditDetails.clinicId}
                  onChange={(e) => setDoctorToEditDetails({ ...doctorToEditDetails, clinicId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>Klinikani tanlang</option>
                  {clinics.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDoctorToEditDetails(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer"
                >
                  {tL("Bekor qilish")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                >
                  {tL("Saqlash")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
