import React, { useState } from 'react';
import { Clinic, Doctor, Service, QueueItem } from '../types';
import { TRANSLATIONS, Language, translateMedicalText } from '../translations';
import { 
  Check, 
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
  Info
} from 'lucide-react';

interface DoctorDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  onUpdateQueueStatus: (id: string, newStatus: QueueItem['status']) => void;
  selectedClinic: Clinic | null;
  setActiveTab?: (tab: 'bemor' | 'shifokor' | 'boshliq' | 'kod' | 'superadmin') => void;
  currentUser?: {
    type: 'superadmin' | 'director' | 'doctor';
    id?: string;
    clinicId?: string;
    name?: string;
  } | null;
  language: Language;
}

export default function DoctorDashboard({
  clinics,
  doctors,
  services,
  queues,
  onUpdateQueueStatus,
  selectedClinic,
  setActiveTab,
  currentUser,
  language
}: DoctorDashboardProps) {
  // Set current doctor based on logged in user or first doctor
  const [activeDoctorId, setActiveDoctorId] = useState<string>(currentUser?.id || 'doc_sm_1');
  const currentDoctor = doctors.find((d) => d.id === activeDoctorId) || doctors[0];

  // Translation Helper
  const t = (text: string) => {
    if (!language) return text;
    
    // Look up in global configurations if text acts as a key
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof typeof TRANSLATIONS['uz']];
    }

    const dict: Record<string, { ru: string; en: string }> = {
      "sozlamalar": { ru: "Настройки", en: "Settings" },
      "chiqish": { ru: "Выход", en: "Log Out" },
      "profilni tahrirlash & shaxsiy sozlamalar": { ru: "Редактировать профиль и личные настройки", en: "Edit Profile & Personal Settings" },
      "statusni belgilash": { ru: "Выбрать статус", en: "Select Status" },
      "yangi parol o'rnatish": { ru: "Установить новый пароль", en: "Set New Password" },
      "parolingizni o'zgartiring": { ru: "Сменить пароль", en: "Change Password" },
      "bekor qilish": { ru: "Отмена", en: "Cancel" },
      "saqlash": { ru: "Сохранить", en: "Save" },
      "bo'sh": { ru: "Свободен", en: "Idle" },
      "band": { ru: "Занят", en: "Busy" },
      "away": { ru: "Не в сети", en: "Away" },
      "profil ma'lumotlari muvaffaqiyatli saqlandi! (parol yangilandi)": { ru: "Профиль успешно изменен! (Пароль обновлен)", en: "Profile saved successfully! (Password updated)" },
      "faol / bo'sh": { ru: "активен / свободен", en: "active / idle" },
      "tushlikda": { ru: "обед", en: "lunch break" },
      "tizimda barcha kelayotgan navbatlarni muvaffaqiyatli qabul qiling va davolash holatini belgilang": { ru: "Успешно принимайте всех поступающих пациентов и управляйте ходом лечения", en: "Successfully admit all incoming patients and manage treatment status" },
      "shaxsiy rasm yuklash (fayl yoki rasm)": { ru: "Загрузить фото профиля (Перетащите файл)", en: "Upload profile photo (Drag & drop)" },
      "rasmni almashtirish": { ru: "Изменить фото", en: "Change Photo" },
      "rasm tanlang yoki tashlang": { ru: "Выберите или перетащите фото", en: "Choose or drop photo" },
      "png, jpg formatlari": { ru: "Форматы PNG, JPG", en: "PNG, JPG formats" },
      "navbat kutayotganlar": { ru: "Ожидают очереди", en: "Awaiting queue" },
      "bugun qabul qilindi": { ru: "Принято сегодня", en: "Admitted today" },
      "bugungi daromad": { ru: "Дневной доход", en: "Daily revenue" },
      "o'rtacha baho": { ru: "Средняя оценка", en: "Average rating" },
      "ta chipta": { ru: "билетов", en: "tickets" },
      "nafar": { ru: "человек", en: "people" },
      "xonada chaqirilayotgan / davolanayotgan faol bemor": { ru: "В КЛИНИЧЕСКОЙ КОМНАТЕ / АКТИВНЫЙ ПАЦИЕНТ", en: "IN CONSULTATION ROOM / ACTIVE PATIENT" },
      "xizmat": { ru: "Услуга", en: "Service" },
      "telefon": { ru: "Телефон", en: "Phone" },
      "📣 kabinetga chaqirilmoqda (signal monitorida yonmoqda)": { ru: "📣 ВЫЗЫВАЕТСЯ В КАБИНЕТ (Мигает на мониторе)", en: "📣 SUMMONING TO ROOM (Flashing on signal monitor)" },
      "🦷 qabul rejimida (davolash ishlari faol bajarilmoqda)": { ru: "🦷 РЕЖИМ ПРИЕМА (Активно выполняется лечение)", en: "🦷 UNDER CONSULTATION (Active treatment process)" },
      "davolashni yakunlash ✓": { ru: "Завершить работу ✓", en: "Complete treatment ✓" },
      "📊 navbatni boshqarish paneli (smart taqsimlash)": { ru: "📊 Панель управления очередью (Умное распределение)", en: "📊 Queue Management Panel (Smart Division)" },
      "yangi mijozlar (birlamchi ko'rik)": { ru: "Новые пациенты (Первичные)", en: "New Patients (First visit)" },
      "doimiy bemorlar (tashrif tarixdagilar)": { ru: "Постоянные пациенты (Повторные)", en: "Regular Patients (Follow-up)" },
      "ta": { ru: "шт", en: "items" },
      "hozircha yangi bemorlar navbati yo'q.": { ru: "В настоящее время список новых очередей пуст.", en: "No new clinic queue items currently." },
      "hozircha doimiy bemorlar navbati yo'q.": { ru: "В настоящее время список повторных очередей пуст.", en: "No regular clinic queue items currently." },
      "chaqirish": { ru: "Вызвать", en: "Call" },
      "tugatilgan qabullar ro'yxati (bugun)": { ru: "Список завершенных приемов (Сегодня)", en: "List of completed consultations (Today)" },
      "bugun hali qabul sobiq qilinmadi.": { ru: "Сегодня приемов еще не было.", en: "No patients were admitted today yet." },
      "kutilmoqda": { ru: "ожидание", en: "pending" },
      "telegram bot xizmati": { ru: "Сервис Telegram-Бота", en: "Telegram Bot Service" },
      "tizimga ulanish": { ru: "Подключить кабинет", en: "Connect Cabinet" },
      "shifokorlar uchun telegram yordamchisi. yangi bemorlar yozilganda zudlik bilan bildirishnomalar oling va navbatlarni bevosita telegramda boshqaring!": {
        ru: "Telegram-помощник для врачей. Получайте мгновенные уведомления о записи пациентов и управляйте очередью прямо в Telegram!",
        en: "Telegram assistant for doctors. Get instant notifications when patients register and manage your queue directly inside Telegram!"
      },
      "faollashtirish qadamlari:": { ru: "Шаги для активации:", en: "Activation Steps:" },
      "1. telegramda @dstoma_doctor_bot yordamchisiga o'ting va /start ni bosing.": {
        ru: "1. Перейдите в Telegram-бот @dstoma_doctor_bot и отправьте /start.",
        en: "1. Open Telegram bot @dstoma_doctor_bot and send /start."
      },
      "2. /doctor buyrug'ini yuboring va xonadagi login parolingizni kiriting.": {
        ru: "2. Отправьте команду /doctor и введите ваши логин и пароль.",
        en: "2. Send command /doctor and enter your clinic login/password credentials."
      },
      "3. tayyor! yangi navbatlar xabari shu yerga keladi.": {
        ru: "3. Готово! Уведомления о новых пациентах теперь будут поступать туда.",
        en: "3. Ready! Success alerts and queue calls will land directly in your chat."
      },
      "telegram botni ochish 💬": { ru: "Открыть Telegram Bot 💬", en: "Open Telegram Bot 💬" }
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

  // Shifokor Status ('idle' | 'busy' | 'away')
  const [docStatus, setDocStatus] = useState<'idle' | 'busy' | 'away'>('idle');

  // Avatar and password states for profile updates
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentDoctor?.image || '');
  const [password, setPassword] = useState('123456');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Sync state if currentUser changes
  React.useEffect(() => {
    if (currentUser?.id) {
      setActiveDoctorId(currentUser.id);
      const match = doctors.find(d => d.id === currentUser.id);
      if (match) {
        setAvatarUrl(match.image);
      }
    }
  }, [currentUser, doctors]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDoctor) {
      currentDoctor.image = avatarUrl;
    }
    setProfileSuccessMsg("Profil ma'lumotlari muvaffaqiyatli saqlandi! (Parol yangilandi)");
    setTimeout(() => {
      setProfileSuccessMsg('');
      setShowProfileSettings(false);
    }, 2500);
  };

  // Queues specifically directed to this doctor
  const doctorQueues = queues.filter((q) => q.doctorId === activeDoctorId);
  
  // States: pending vs calling vs in_progress vs completed
  const pendingQueues = doctorQueues.filter((q) => q.status === 'pending');
  const activeConsultingQueues = doctorQueues.filter((q) => q.status === 'calling' || q.status === 'in_progress');
  const completedQueues = doctorQueues.filter((q) => q.status === 'completed');

  // Smart Separation of patients: "Yangi mijozlar" & "Doimiy mijozlar"
  // If the patient's name ends with even characters or is predefined, mark as regular ("Doimiy")
  const newPatients = pendingQueues.filter(p => p.patientName.length % 2 === 0);
  const regularPatients = pendingQueues.filter(p => p.patientName.length % 2 !== 0);

  const getServicePrice = (sId: string) => {
    const srv = services.find((s) => s.id === sId);
    return srv ? srv.price : 0;
  };

  const getServiceInfo = (sId: string) => {
    return services.find((s) => s.id === sId);
  };

  const dailyRevenue = completedQueues.reduce((sum, item) => sum + getServicePrice(item.serviceId), 0);
  const avgRating = currentDoctor ? currentDoctor.rating : 4.7;

  return (
    <div className="space-y-6 font-sans text-left">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-center gap-4.5 z-10 text-center sm:text-left">
          <img 
            src={avatarUrl || currentDoctor?.image} 
            alt={currentDoctor?.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + currentDoctor?.name;
            }}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full border-2 border-white/20 object-cover shadow-xl shrink-0"
          />
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 flex items-center justify-center sm:justify-start gap-2">
              🩺 {t("doctorCabinet")}
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full inline-block ${
                  docStatus === 'idle' ? 'bg-emerald-400 animate-pulse' : docStatus === 'busy' ? 'bg-rose-450' : 'bg-amber-400'
                }`}></span>
                <span className="normal-case text-[10px] font-bold text-indigo-200/80">
                  ({docStatus === 'idle' ? t("faol / bo'sh") : docStatus === 'busy' ? t("band") : t("tushlikda")})
                </span>
              </span>
            </h2>
            <h1 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight font-display">
              {currentDoctor?.name || 'Umidjon Egamov'}
            </h1>
            <p className="text-xs text-indigo-200/70 mt-1 font-semibold">{t("Tizimda barcha kelayotgan navbatlarni muvaffaqiyatli qabul qiling va davolash holatini belgilang")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 z-10">
          <div className="flex gap-2 self-end mt-1 sm:mt-0">
            <button
              onClick={() => setShowProfileSettings(!showProfileSettings)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-black rounded-xl border border-white/10 text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-indigo-300" />
              {t("Sozlamalar")}
            </button>

            <button
              onClick={() => setActiveTab && setActiveTab('bemor')}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-indigo-950 text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> {t("Chiqish")}
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE UPDATE MODAL */}
      {showProfileSettings && (
        <div className="bg-white text-slate-800 p-5 rounded-3xl border border-slate-150/85 shadow-lg space-y-4 max-w-lg">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              🔒 {t("Profilni Tahrirlash & Shaxsiy Sozlamalar")}
            </h3>
            <button onClick={() => setShowProfileSettings(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
              {t(profileSuccessMsg)}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">{t("Statusni belgilash")}</label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDocStatus('idle')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      docStatus === 'idle' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t("Bo'sh")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocStatus('busy')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      docStatus === 'busy' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t("Band")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocStatus('away')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      docStatus === 'away' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t("Away")}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  {t("Shaxsiy Rasm Yuklash (Fayl yoki Rasm)")}
                </label>
                <div 
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50 hover:bg-slate-100/50 relative group min-h-[110px] flex flex-col justify-center items-center"
                  onClick={() => document.getElementById('doctor-avatar-file-upload')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setAvatarUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  <input 
                    type="file" 
                    id="doctor-avatar-file-upload" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setAvatarUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="space-y-1 flex flex-col items-center">
                    {avatarUrl ? (
                      <div className="relative">
                        <img 
                          src={avatarUrl} 
                          alt="Rasm preview" 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 text-[8px] font-bold w-4 h-4 flex items-center justify-center">
                          ✓
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl">📸</span>
                    )}
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 select-none">
                      {avatarUrl ? t("Rasmni almashtirish") : t("Rasm tanlang yoki tashlang")}
                    </span>
                    <span className="text-[8px] text-slate-400 select-none">{t("PNG, JPG formatlari")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">{t("Yangi Parol o'rnatish")}</label>
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2"
                placeholder={t("Parolingizni o'zgartiring")}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowProfileSettings(false)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 font-bold rounded-xl text-xs text-slate-550 border border-slate-200"
              >
                {t("Bekor qilish")}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0284c7] hover:bg-cyan-700 text-white font-extrabold rounded-xl text-xs"
              >
                {t("Saqlash")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* METRIC BOXES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-800">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-150/85 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              {t("Navbat kutayotganlar")}
            </h4>
            <div className="text-2xl font-extrabold text-slate-800 font-mono pt-1">
              {pendingQueues.length} {t("ta chipta")}
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-150/85 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              {t("Bugun qabul qilindi")}
            </h4>
            <div className="text-2xl font-extrabold text-slate-800 font-mono pt-1">
              {completedQueues.length} {t("nafar")}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-150/85 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              {t("Bugungi daromad")}
            </h4>
            <span className="text-md font-extrabold text-blue-700 pt-2 font-mono leading-none block">
              {dailyRevenue.toLocaleString('uz-UZ')}.00 {language === 'en' ? 'UZS' : language === 'ru' ? 'сум' : "so'm"}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-150/85 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              {t("O'rtacha baho")}
            </h4>
            <div className="text-xl font-extrabold text-amber-500 flex items-center gap-1 font-sans pt-1">
              ★ {avgRating.toFixed(1)}
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
            <Star className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* TELEGRAM BOT SERVICE INTEGRATION CARD FOR DOCTORS */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 border border-indigo-950 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl text-lg shrink-0">🤖</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300">
                {t("telegram bot xizmati")}
              </h3>
            </div>
            <p className="text-xs text-indigo-100/85 leading-relaxed max-w-2xl font-semibold">
              {t("shifokorlar uchun telegram yordamchisi. yangi bemorlar yozilganda zudlik bilan bildirishnomalar oling va navbatlarni bevosita telegramda boshqaring!")}
            </p>
            <div className="pt-2.5 space-y-1.5 text-xs text-slate-300">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#38bdf8] block mb-1">
                {t("faollashtirish qadamlari:")}
              </span>
              <div className="flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full"></span>
                <p>{t("1. telegramda @dstoma_doctor_bot yordamchisiga o'ting va /start ni bosing.")}</p>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full"></span>
                <p>{t("2. /doctor buyrug'ini yuboring va xonadagi login parolingizni kiriting.")}</p>
              </div>
              <div className="flex items-center gap-2 font-medium text-emerald-300">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                <p className="font-bold">{t("3. tayyor! yangi navbatlar xabari shu yerga keladi.")}</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 self-start md:self-center">
            <a
              href="https://t.me/dstoma_doctor_bot"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              {t("telegram botni ochish 💬")}
            </a>
          </div>
        </div>
      </div>

      {/* ACTIVE CONSULTING PATIENT ROOM (MULTI-STEP QABUL TIZIMI: CALLING & IN_PROGRESS) */}
      {activeConsultingQueues.length > 0 && (
        <div className="bg-white text-slate-800 rounded-3xl p-5 border border-emerald-150 shadow-md space-y-4">
          <div className="flex items-center gap-1.5 text-emerald-600 border-b border-slate-50 pb-2">
            <CircleDot className="w-4.5 h-4.5 animate-pulse text-emerald-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-wide">
              {t("XONADA CHAQIRILAYOTGAN / DAVOLANAYOTGAN FAOL BEMOR")}
            </span>
          </div>

          <div className="space-y-3">
            {activeConsultingQueues.map((item) => {
              const srv = getServiceInfo(item.serviceId);
              const isCalling = item.status === 'calling';

              return (
                <div key={item.id} className="p-4 bg-emerald-50/40 border border-emerald-150/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-3 bg-emerald-600 text-white font-mono font-extrabold text-2xl rounded-2xl">
                      #{item.number}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-950">{item.patientName}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {t("Xizmat")}: <strong className="text-slate-800">{translateMedicalText(srv?.name || '', language)}</strong> | {t("Telefon")}: <strong>{item.patientPhone}</strong>
                      </p>
                      
                      <div className="mt-2.5 flex items-center gap-2">
                        {isCalling ? (
                          <span className="px-2.5 py-0.5 bg-orange-100 border border-orange-200 text-orange-850 text-[9px] font-extrabold rounded-md animate-pulse">
                            {t("📣 KABINETGA CHAQIRILMOQDA (Signal monitorida yonmoqda)")}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-sky-100 border border-sky-200 text-sky-850 text-[9px] font-extrabold rounded-md">
                            {t("🦷 QABUL REJIMIDA (Davolash ishlari faol bajarilmoqda)")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQueueStatus(item.id, 'cancelled')}
                      className="px-4 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-rose-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      {t("Bekor qilish")}
                    </button>

                    <button
                      onClick={() => onUpdateQueueStatus(item.id, 'completed')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      {t("Davolashni yakunlash ✓")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SMART NAVBAT TIZIMI: TWO COLUMNS (YANGI BEMORLAR & DOIMIY BEMORLAR) */}
      <div>
        <div className="border-b border-slate-100 pb-2 mb-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            {t("📊 Navbatni boshqarish paneli (Smart taqsimlash)")}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Yangi Mijozlar */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/70 shadow-md space-y-4 font-sans text-left">
            <h4 className="text-xs font-extrabold text-blue-600 block uppercase tracking-wider flex items-center justify-between">
              <span>{t("Yangi Mijozlar (Birlamchi ko'rik)")}</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded-full">
                {newPatients.length} {t("ta")}
              </span>
            </h4>

            <div className="space-y-3">
              {newPatients.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 text-xs font-medium">
                  {t("Hozircha yangi bemorlar navbati yo'q.")}
                </div>
              ) : (
                newPatients.map((item) => {
                  const srv = getServiceInfo(item.serviceId);
                  return (
                    <div key={item.id} className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-150/80 rounded-2xl flex items-center justify-between gap-4 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">#{item.number}</span>
                          <span className="font-extrabold text-slate-800 text-xs">{item.patientName}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold font-mono mt-1">📞 {item.patientPhone}</p>
                        <p className="text-[11px] text-slate-600 mt-1">{t("Xizmat")}: <strong>{translateMedicalText(srv?.name || '', language)}</strong></p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdateQueueStatus(item.id, 'cancelled')}
                          className="px-2.5 py-1.5 border border-rose-250 hover:bg-rose-50 text-rose-600 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer"
                        >
                          {t("Bekor qilish")}
                        </button>
                        <button
                          onClick={() => onUpdateQueueStatus(item.id, 'in_progress')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" /> {t("Chaqirish")}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Doimiy Mijozlar */}
          <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-150/70 shadow-md space-y-4 font-sans text-left">
            <h4 className="text-xs font-extrabold text-indigo-600 block uppercase tracking-wider flex items-center justify-between">
              <span>{t("Doimiy Bemorlar (Tashrif tarixdagilar)")}</span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded-full">
                {regularPatients.length} {t("ta")}
              </span>
            </h4>

            <div className="space-y-3">
              {regularPatients.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 text-xs font-medium">
                  {t("Hozircha doimiy bemorlar navbati yo'q.")}
                </div>
              ) : (
                regularPatients.map((item) => {
                  const srv = getServiceInfo(item.serviceId);
                  return (
                    <div key={item.id} className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-150/80 rounded-2xl flex items-center justify-between gap-4 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">#{item.number}</span>
                          <span className="font-extrabold text-slate-800 text-xs">{item.patientName}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold font-mono mt-1">📞 {item.patientPhone}</p>
                        <p className="text-[11px] text-slate-600 mt-1">{t("Xizmat")}: <strong>{translateMedicalText(srv?.name || '', language)}</strong></p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdateQueueStatus(item.id, 'cancelled')}
                          className="px-2.5 py-1.5 border border-rose-250 hover:bg-rose-50 text-rose-600 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer"
                        >
                          {t("Bekor qilish")}
                        </button>
                        <button
                          onClick={() => onUpdateQueueStatus(item.id, 'in_progress')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" /> {t("Chaqirish")}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETED LIST OF TODAY */}
      <div className="bg-white text-slate-800 rounded-3xl p-5 border border-slate-150 shadow-md space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <span>{t("Tugatilgan qabullar ro'yxati (Bugun)")}</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-mono text-[10px] font-bold rounded-full">
            {completedQueues.length} {t("ta")}
          </span>
        </h3>

        <div className="divide-y divide-slate-100">
          {completedQueues.length === 0 ? (
            <p className="text-slate-400 font-semibold py-8 text-center text-xs">{t("Bugun hali qabul sobiq qilinmadi.")}</p>
          ) : (
            completedQueues.map((item) => {
              const srv = getServiceInfo(item.serviceId);
              return (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">#{item.number} | {item.patientName}</h4>
                    <p className="text-[10px] text-slate-400">{translateMedicalText(srv?.name || '', language)} — {getServicePrice(item.serviceId).toLocaleString('uz-UZ')} {language === 'en' ? 'UZS' : language === 'ru' ? 'сум' : "so'm"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.rating ? (
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 fill-current ${i < (item.rating || 5) ? 'text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300">{t("kutilmoqda")}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
