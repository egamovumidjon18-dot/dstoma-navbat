import React, { useState } from 'react';
import { Clinic, Doctor, Service, QueueItem, Patient } from '../types';
import { TRANSLATIONS, Language } from '../translations';
import { 
  User, 
  Phone, 
  FileText, 
  Ticket, 
  Star, 
  Calendar, 
  RefreshCw, 
  Bell, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  ArrowLeft, 
  LogIn, 
  PlusCircle, 
  Check, 
  ChevronDown, 
  ShieldAlert, 
  ThumbsUp,
  UserPlus2,
  Play,
  Pause,
  Activity,
  Zap,
  ShieldCheck,
  Award
} from 'lucide-react';

interface ClientDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  selectedClinic: Clinic | null;
  onSelectClinic: (clinic: Clinic) => void;
  onAddQueue: (newQueue: QueueItem) => void;
  onCancelQueue: (id: string) => void;
  onUpdateDoctorRating: (doctorId: string, rating: number) => void;
  setActiveTab?: (tab: 'bemor' | 'shifokor' | 'boshliq' | 'kod') => void;
  language: Language;
}

export default function ClientDashboard({
  clinics,
  doctors,
  services,
  queues,
  selectedClinic,
  onSelectClinic,
  onAddQueue,
  onCancelQueue,
  onUpdateDoctorRating,
  setActiveTab,
  language
}: ClientDashboardProps) {

  // Translation Helper for ClientDashboard
  const t = (text: string) => {
    if (!language) return text;
    
    // Check global translations
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof typeof TRANSLATIONS['uz']];
    }

    const dict: Record<string, { ru: string; en: string }> = {
      "tanlangan filial": { ru: "Выбранный филиал", en: "Selected Branch" },
      "faol filial monito'rlari": { ru: "Мониторинг активного филиала", en: "Active Branch Monitoring" },
      "klinika tanlanmadi": { ru: "Филиал не выбран", en: "Clinic not selected" },
      "klinika filialini belgilang": { ru: "Выберите филиал клиники", en: "Select Clinic Branch" },
      "xizmatlarni, diagnostik tahlillarni va navbat olish panellarini faollashtirish uchun yuqoridagi xaritani ishlating.": {
        ru: "Используйте карту выше для активации услуг, диагностики и записи в очередь.",
        en: "Use the map above to activate services, dental diagnostics, and booking panels."
      },
      "aloqa filiali tanlanmagan": { ru: "Филиал не выбран для связи", en: "No Connected Branch Selected" },
      "registratsiya qilish yoki kabinetga kirish uchun avval tepadan klinika filialini tanlang.": { ru: "Пожалуйста, сначала выберите филиал клиники сверху, чтобы зарегистрироваться или войти.", en: "Please select a clinic branch from above first to register or log in." },
      "avval klinika filialini tanlashingiz lozim.": { ru: "Вы должны сначала выбрать филиал клиники.", en: "You must select a clinic branch first." },
      "yangi bemor ro'yxatdan o'tish": { ru: "Регистрация нового пациента", en: "New Patient Registration" },
      "bemor shaxsiy kabinetga kirish": { ru: "Вход в личный кабинет пациента", en: "Patient Personal Cabinet Login" },
      "bemor kabineti": { ru: "Личный кабинет", en: "Patient Cabinet" },
      "bizning shifokorlar": { ru: "Наши врачи", en: "Our Doctors" },
      "navbatingizga tayyor": { ru: "Готов к приему", en: "Ready for queue" },
      "ta baho": { ru: "оценок", en: "ratings" },
      "tibbiy xizmatlar narxnomasi": { ru: "Прайс-лист медицинских услуг", en: "Medical Services Price List" },
      "eng hamyonbop tish davolash va jarrohlik litsenziyalangan tibbiy muolajalari": { ru: "Самые доступные лицензированные стоматологические процедуры и операции", en: "Most affordable licensed dental treatments and surgeries" },
      "iltimos, yulduzcha (*) qo'yilgan barcha majburiy maydonlarni to'ldiring!": { ru: "Пожалуйста, заполните все обязательные поля, отмеченные звездочкой (*)", en: "Please fill all required fields marked with an asterisk (*)" },
      "muvaffaqiyatli ro'yxatdan o'tdingiz!": { ru: "Успешно зарегистрированы!", en: "Registered successfully!" },
      "iltimos, pasport seriyasi va parolingizni kiriting": { ru: "Пожалуйста, введите серию паспорта и пароль", en: "Please enter your passport serial and password" },
      "kabinetga muvaffaqiyatli kirdingiz!": { ru: "Успешно вошли в кабинет!", en: "Logged in successfully to cabinet!" },
      "kabinetdan chiqdingiz": { ru: "Вышли из кабинета", en: "Logged out of cabinet" },
      "telegram id muvaffaqiyatli saqlandi! t.me/dstoma_bot muloqotga tayyor.": { ru: "Telegram ID сохранен! t.me/dstoma_bot готов к отправке уведомлений.", en: "Telegram ID saved! t.me/dstoma_bot is ready for communication." },
      "iltimos, shifokor va xizmat turini tanlang!": { ru: "Пожалуйста, выберите Врача и Тип услуги!", en: "Please select Doctor and Service type!" },
      "navbatingiz olindi! elektron chipta raqamingiz:": { ru: "Очередь занята! Номер вашего электронного билета:", en: "Queue booked successfully! Your electronic ticket number:" },
      "navbat bekor qilindi": { ru: "Очередь отменена", en: "Queue cancelled" },
      "baho berganingiz uchun rahmat! ❤️": { ru: "Спасибо за вашу оценку! ❤️", en: "Thank you for rating! ❤️" },
      "asosiy kabinet": { ru: "Главный кабинет", en: "Main Cabinet" },
      "orqaga": { ru: "Назад", en: "Back" },
      "pasport seriyasi": { ru: "Серия паспорта", en: "Passport Series" },
      "parol": { ru: "Пароль", en: "Password" },
      "tizimga kirish": { ru: "Войти в систему", en: "Log In" },
      "xizmat": { ru: "Услуга", en: "Service" },
      "mijoz app": { ru: "Клиентское приложение", en: "Client App" },
      "tibbiy ko'rik zallari & navigatsiya": { ru: "Медицинские залы и навигация", en: "Medical Rooms & Navigation" },
      "klinika shifokorlari": { ru: "Врачи клиники", en: "Clinic Doctors" },
      "muolajalar": { ru: "Процедуры", en: "Procedures" },
      "filiallar ro'yxati (geolokatsiya)": { ru: "Список филиалов (Геолокация)", en: "Branches List (Geolocation)" },
      "sizga eng yaqin litsenziyalangan stomatologik filialni qidiring, tanlang va bir zumda smart chipta oling.": { ru: "Ищите, выбирайте ближайший лицензированный стоматологический филиал и мгновенно получайте смарт-билет.", en: "Search, choose the closest licensed dental branch, and secure high-priority queue tickets on the fly." },
      "karta ko'rinishi": { ru: "Просмотр карты", en: "Map View" },
      "klinika bemorlar oqimi & yuklamasi": { ru: "Поток пациентов и загрузка клиники", en: "Clinic Patient Flow & Allocation Load" },
      "bo'limlar kesimida real-vaqtdagi kutish yuklamasi integratsiyasi.": { ru: "Интеграция загрузки ожидания по отделениям в реальном времени.", en: "Real-time department-based queueing queue allocation analytics." },
      "konsultatsiya og'zi": { ru: "Консультация полости рта", en: "Oral Consultation Room" },
      "tish diagnostik rentgen": { ru: "Рентген-диагностика зубов", en: "3D Dental X-Ray & Imaging" },
      "og'iz gigiyenasi xonasi": { ru: "Кабинет гигиены рта", en: "Oral Hygiene & Cleaning Room" },
      "jarrohlik & implantatsiya": { ru: "Хирургия и имплантация", en: "Jaw Surgery & Dental Implants" },
      "markaziy tish diagnostikasi & telemetriya": { ru: "Центральная диагностика зубов и телеметрия", en: "Central Dental diagnostics & Telemetry" },
      "bemor ma'lumotlari": { ru: "Данные пациента", en: "Patient Personal Details" },
      "boshqa bo'lim": { ru: "Другое отделение", en: "Other department" },
      "ism sharfingiz": { ru: "Ваше имя и фамилия", en: "Your Full Name" },
      "telefon raqamingiz": { ru: "Номер телефона", en: "Your Phone Number" },
      "tug'ilgan sanangiz": { ru: "Дата рождения", en: "Date of Birth" },
      "qon guruhi": { ru: "Группа крови", en: "Blood Group" },
      "allergiyalar (agar bo'lsa)": { ru: "Аллергии (если есть)", en: "Allergies (if any)" },
      "surunkali kasalliklar": { ru: "Хронические заболевания", en: "Chronic diseases" },
      "infeksion kasalliklar mavjudmi?": { ru: "Есть ли инфекционные заболевания?", en: "Are infectious diseases present?" },
      "ro'yxatdan o'tish": { ru: "Зарегистрироваться", en: "Register Profile" },
      "profilingizga kirish": { ru: "Войти в свой кабинет", en: "Enter Patient Profile" },
      "bemor shaxsiy kabinet": { ru: "Личный кабинет пациента", en: "Patient Personal Cabinet" },
      "onlayn navbat olish": { ru: "Онлайн-запись в очередь", en: "Online Queue Ticket Booking" },
      "shifokorni tanlang": { ru: "Выберите врача", en: "Select Doctor" },
      "xizmat turini tanlang": { ru: "Выберите тип услуги", en: "Select Medical Service Type" },
      "elektron chiptani band qilish": { ru: "Забронировать смарт-билет", en: "Book Smart Queue Ticket" },
      "telegram bot orqali xabar olish (ixtiyoriy)": { ru: "Уведомления через Telegram бот (опционально)", en: "Get Queue Notifications via Telegram Bot" },
      "faol navbatingiz": { ru: "Ваша активная очередь", en: "Your Active Queue Ticket" },
      "chipta raqami": { ru: "Номер билета", en: "Ticket Number" },
      "shifokor": { ru: "Врач", en: "Doctor" },
      "qabul holati": { ru: "Статус приема", en: "Admission Status" },
      "navbatingiz kelganda sizga telegram va ekran orqali xabar beriladi. qabulga kechikmang.": { ru: "Вы будете уведомлены через Telegram при приближении очереди. Не опаздывайте.", en: "You will be notified via Telegram once your turn is close. Please do not be late." },
      "bemor tarixi va tahlillar arxivi": { ru: "История посещений и архив аналитики", en: "Admissions History & Analytics Archive" },
      "tish holati tahlili": { ru: "Анализ состояния зуба", en: "Dental Tooth Metric Analysis" },
      "tish": { ru: "Зуб", en: "Tooth" },
      "diagnostika": { ru: "Диагностика", en: "Diagnostics" },
      "plomba holati: yaxshi": { ru: "Состояние пломбы: отличное", en: "Finishing health: Excellent" },
      "karies xavfi: yo'q": { ru: "Риск кариеса: отсутствует", en: "Caries risk: None" },
      "emaldagi jarohatlar: aniqlanmadi": { ru: "Повреждения эмали: не обнаружены", en: "Enamel damage: Not detected" },
      "tish ildizi: sog'lom": { ru: "Корень зуба: здоровый", en: "Tooth root: 100% Healthy" },
      "avvalgi tashriflar tarixi": { ru: "История предыдущих визитов", en: "Past Admissions History logs" },
      "hech qanday oldingi tashriflar tarixi mavjud emas.": { ru: "История предыдущих визитов пуста.", en: "No previous dental visits history detected." },
      "baho: v": { ru: "Оценка:", en: "Rating:" },
      "shifokor qabuli xizmatiga baho bering": { ru: "Оцените качество обслуживания врача", en: "Rate doctor's treatment service quality" }
    };

    const cleanText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    if (dict[cleanText]) {
      if (language === 'ru') return dict[cleanText].ru;
      if (language === 'en') return dict[cleanText].en;
    }
    
    // Fallback key lookup
    if (dict[text]) {
      if (language === 'ru') return dict[text].ru;
      if (language === 'en') return dict[text].en;
    }

    return text;
  };
  
  // Local list of patients to allow lookup during login
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'pat_test_2',
      clinicId: 'samarqand',
      fullName: 'Test Bemor 2',
      passportSerial: 'AA1234567',
      phone: '+998 (90) 123-45-67',
      birthDate: '1998-05-12',
      password: '123456',
      bloodGroup: 'II+',
      allergies: "Yo'q",
      chronicDiseases: "Mavjud emas (Sog'lom)",
      hasInfection: false,
      telegramChatId: '57896431'
    }
  ]);

  // Simulated initial user starts at null so they must log in or register
  const [currentUser, setCurrentUser] = useState<Patient | null>(null);

  // Screen control state matching user screenshots
  // 'home' -> Screenshot 1 (Main page with buttons, Shifokorlar & Xizmatlar listas)
  // 'register' -> Screenshot 2 (Bemor ma'lumotlari)
  // 'login' -> Let the user type their passport and password
  // 'cabinet' -> Screenshot 3 (Bemor Kabineti / Profilingizga kirish)
  const [activeSubView, setActiveSubView] = useState<'home' | 'register' | 'login' | 'cabinet'>('home');

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998901234567');
  const [passport, setPassport] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('1998-05-12');
  const [bloodGroup, setBloodGroup] = useState('II+');
  const [allergies, setAllergies] = useState("Yo'q");
  const [chronicDiseases, setChronicDiseases] = useState("Sog'lom");
  const [hasInfection, setHasInfection] = useState<boolean>(false);

  // Cabinet Specific States
  const [telegramIdInput, setTelegramIdInput] = useState('57896431');
  const [bookingDoctorId, setBookingDoctorId] = useState('doc_sm_1');
  const [bookingServiceId, setBookingServiceId] = useState('srv_sm_1');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  // --- FUTURISTIC 3D DENTAL SCANNER METRIC STATES ---
  const [selectedTooth, setSelectedTooth] = useState<number>(24);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerTick, setScannerTick] = useState<number>(0);

  // Auto-scan Tooth sweeping loop
  React.useEffect(() => {
    let timer: any;
    if (isScanning) {
      timer = setInterval(() => {
        setScannerTick(prev => prev + 1);
        setSelectedTooth(currentTooth => {
          let next = currentTooth + 1;
          if (next > 32) return 18;
          return next;
        });
      }, 1200);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Prepopulated queue entries matching screenshots
  const [myQueues, setMyQueues] = useState<QueueItem[]>([
    {
      id: 'q_pre_1',
      clinicId: 'samarqand',
      patientName: 'Test Bemor 2',
      patientPhone: '+998 (90) 123-45-67',
      doctorId: 'doc_sm_1',
      serviceId: 'srv_sm_3',
      number: 102,
      status: 'completed',
      rating: 5,
      createdAt: '2026-06-03T11:20:00Z'
    },
    {
      id: 'q_pre_2',
      clinicId: 'samarqand',
      patientName: 'Test Bemor 2',
      patientPhone: '+998 (90) 123-45-67',
      doctorId: 'doc_sm_2',
      serviceId: 'srv_sm_1',
      number: 105,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ]);

  // Sync myQueues statuses and ratings with main parent queues in real time
  React.useEffect(() => {
    setMyQueues((prevMyQueues) => {
      const updated = prevMyQueues.map((myQ) => {
        const masterQ = queues.find((q) => q.id === myQ.id);
        if (masterQ) {
          return { ...myQ, status: masterQ.status, rating: masterQ.rating || myQ.rating };
        }
        return myQ;
      });

      // Also append any new master queue item that belongs to this user if it's not already in local myQueues!
      if (currentUser) {
        queues.forEach((q) => {
          if (
            (q.patientPhone === currentUser.phone || q.patientName === currentUser.fullName) &&
            !updated.some((item) => item.id === q.id)
          ) {
            updated.unshift(q);
          }
        });
      }
      return updated;
    });
  }, [queues, currentUser]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !passport || !password) {
      showToast("Iltimos, yulduzcha (*) qo'yilgan barcha majburiy maydonlarni to'ldiring!", "error");
      return;
    }
    const newPatient: Patient = {
      id: 'pat_' + Math.random().toString(36).substr(2, 9),
      clinicId: selectedClinic?.id || 'samarqand',
      fullName,
      passportSerial: passport.toUpperCase(),
      phone,
      birthDate,
      password,
      bloodGroup,
      allergies,
      chronicDiseases,
      hasInfection,
      telegramChatId: telegramIdInput
    };
    setPatients(prev => [...prev, newPatient]);
    setCurrentUser(newPatient);
    showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
    setActiveSubView('cabinet');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport || !password) {
      showToast("Iltimos, pasport seriyasi va parolingizni kiriting", "error");
      return;
    }

    const cleanedPassport = passport.trim().toUpperCase();
    const cleanedPassword = password.trim();

    // Look up in patients first
    const foundPatient = patients.find(
      p => p.passportSerial.toUpperCase() === cleanedPassport && p.password === cleanedPassword
    );

    if (foundPatient) {
      setCurrentUser(foundPatient);
      setTelegramIdInput(foundPatient.telegramChatId || '');
      showToast("Kabinetga muvaffaqiyatli kirdingiz!");
      setActiveSubView('cabinet');
    } else {
      // If credential mismatch on test demo user
      if (cleanedPassport === 'AA1234567') {
        showToast("Demo kodi uchun parol noto'g'ri kiritildi!", "error");
      } else {
        // Create dynamic new patient for ease of evaluation & maximum support
        const defaultDynamic: Patient = {
          id: 'pat_test_dynamic_' + Math.random().toString(36).substr(2, 5),
          clinicId: selectedClinic?.id || 'samarqand',
          fullName: 'Bemor ' + cleanedPassport,
          passportSerial: cleanedPassport,
          phone: '+998 (90) 123-45-67',
          birthDate: '1998-05-12',
          password: cleanedPassword,
          bloodGroup: 'II+',
          allergies: "Yo'q",
          chronicDiseases: "Sog'lom",
          hasInfection: false,
          telegramChatId: '57896431'
        };
        setPatients(prev => [...prev, defaultDynamic]);
        setCurrentUser(defaultDynamic);
        showToast("Kabinetga muvaffaqiyatli kirdingiz!");
        setActiveSubView('cabinet');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast("Kabinetdan chiqdingiz");
    setActiveSubView('home');
  };

  const handleSaveTelegram = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, telegramChatId: telegramIdInput });
      showToast("Telegram ID muvaffaqiyatli saqlandi! t.me/dstoma_bot muloqotga tayyor.");
    }
  };

  const handleBookQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctorId || !bookingServiceId) {
      showToast("Iltimos, Shifokor va Xizmat turini tanlang!", "error");
      return;
    }

    const doc = doctors.find(d => d.id === bookingDoctorId);
    const srv = services.find(s => s.id === bookingServiceId);

    const ticketNo = queues.length + myQueues.length + 107;

    const newQueue: QueueItem = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      clinicId: selectedClinic?.id || 'samarqand',
      patientName: currentUser?.fullName || 'Mehmon',
      patientPhone: currentUser?.phone || phone,
      doctorId: bookingDoctorId,
      serviceId: bookingServiceId,
      number: ticketNo,
      status: 'pending',
      createdAt: new Date().toISOString(),
      telegramChatId: currentUser?.telegramChatId || telegramIdInput || undefined
    };

    // Add locally
    setMyQueues([newQueue, ...myQueues]);
    onAddQueue(newQueue);
    showToast(`Navbatingiz olindi! Elektron chipta raqamingiz: #${ticketNo}`);
  };

  const handleCancelLocalQueue = (id: string) => {
    setMyQueues(myQueues.map(q => q.id === id ? { ...q, status: 'cancelled' } : q));
    onCancelQueue(id);
    showToast("Navbat bekor qilindi", "error");
  };

  const handleRatingLocalQueue = (id: string, rating: number) => {
    setMyQueues(myQueues.map(q => q.id === id ? { ...q, rating } : q));
    const item = myQueues.find(q => q.id === id);
    if (item) {
      onUpdateDoctorRating(item.doctorId, rating);
    }
    showToast("Baho berganingiz uchun rahmat! ❤️");
  };

  // Filter lists based on selected clinic
  const clinicDoctors = doctors.filter(d => d.clinicId === selectedClinic?.id);
  const clinicServices = services.filter(s => s.clinicId === selectedClinic?.id);

  return (
    <div className="space-y-6 font-sans">
      {/* ----------------- ACTION HUB CONTROL CARD (PREMIUM DARK GLASS DESIGN) ----------------- */}
      <div className="bg-[#0b1022]/85 rounded-3xl p-6 border border-[#203254]/80 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          <div className="text-left space-y-1">
            {selectedClinic ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] text-[10px] font-black uppercase tracking-wider">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> {t("Faol filial monito'rlari")}
                </span>
                <h2 className="text-md font-black text-white tracking-wider flex items-center gap-2 uppercase">
                  {selectedClinic.name}
                </h2>
                <span className="text-xs text-slate-400 font-bold leading-normal block">
                  📍 {selectedClinic.address} | 📞 {selectedClinic.phone}
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase tracking-widest">
                  ⚠️ {t("Aloqa filiali tanlanmagan")}
                </span>
                <h2 className="text-base font-black text-white tracking-tight">{t("Klinika filialini belgilang")}</h2>
                <p className="text-xs text-slate-400 font-semibold leading-normal">
                  {t("Xizmatlarni, diagnostik tahlillarni va navbat olish panellarini faollashtirish uchun yuqoridagi xaritani ishlating.")}
                </p>
              </>
            )}
          </div>

          {/* Dual Action CTA Buttons styled exactly in luxurious cyber gradients */}
          <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
            {/* 1. Register new Patient (Emerald dark luxury) */}
            <button
              onClick={() => {
                if (!selectedClinic) {
                  showToast("Iltimos, avval interaktiv xaritadan kerakli klinika filialini bosing.", "error");
                  return;
                }
                setActiveSubView('register');
              }}
              disabled={!selectedClinic}
              className={`px-6 py-3 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer ${
                selectedClinic
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-95'
                  : 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed opacity-40'
              }`}
            >
              <UserPlus2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              {t("Yangi bemor Ro'yxatdan o'tish")}
            </button>

            {/* 2. Patient Cabinet (Indigo luxury glass tab) */}
            <button
              onClick={() => {
                if (!selectedClinic) {
                  showToast("Iltimos, avval interaktiv xaritadan kerakli klinika filialini bosing.", "error");
                  return;
                }
                if (currentUser) {
                  setActiveSubView('cabinet');
                } else {
                  setPassport('');
                  setPassword('');
                  setActiveSubView('login');
                }
              }}
              disabled={!selectedClinic}
              className={`px-6 py-3 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer ${
                selectedClinic
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 active:scale-95'
                  : 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed opacity-40'
              }`}
            >
              <LogIn className="w-4 h-4 text-cyan-200" />
              {t("bemor Shaxsiy kabinetga kirish")}
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- CLIENT DASHBOARD WORKSPACE ----------------- */}
      {activeSubView === 'home' && (
        selectedClinic ? (
          <div className="space-y-6">

            {/* upper layout: Left Bemorlar Oqimi flow, Right 3D Dental diagnostics */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

              {/* COL 1: BEMORLAR OQIMI TRAFFIC DEPARTMENTS MONITOR (7 cols on large, full on small) */}
              <div className="xl:col-span-5 bg-[#0b1022]/85 border border-[#1d2d4c]/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between text-left select-none">
                <div className="space-y-1 mb-4 z-10 relative">
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 text-[9px] font-black rounded font-mono uppercase tracking-widest">
                    Department Metrics
                  </span>
                  <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase font-display">
                    {t("Klinika Bemorlar Oqimi & yuklamasi")}
                  </h3>
                  <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                    {t("Bo'limlar kesimida real-vaqtdagi kutish yuklamasi integratsiyasi.")}
                  </p>
                </div>

                {/* Connected high-tech flow pathways nodes */}
                <div className="relative flex-1 py-4 flex flex-col justify-around gap-4 z-10">
                  {/* Department Node 1 */}
                  <div className="flex items-center justify-between p-3.5 bg-[#0e162d]/90 border border-[#233555]/50 rounded-2xl hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-7.5 h-7.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                        ID1
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Konsultatsiya o'g'zi</h4>
                        <span className="text-[9px] font-mono text-slate-450 font-semibold uppercase">Primary Checkup Room</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-400 font-mono block">93 bemor</span>
                      <span className="text-[8.5px] font-mono text-slate-500 block uppercase">Load: Normal</span>
                    </div>
                  </div>

                  {/* Department Node 2 */}
                  <div className="flex items-center justify-between p-3.5 bg-[#0e162d]/90 border border-[#233555]/50 rounded-2xl hover:border-pink-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-7.5 h-7.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center font-bold text-xs">
                        ID2
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Tish Plombalash & Ortodontiya</h4>
                        <span className="text-[9px] font-mono text-slate-450 font-semibold uppercase">Restoration Hall</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-pink-400 font-mono block">105 bemor</span>
                      <span className="text-[8.5px] font-mono text-slate-400 block uppercase font-bold text-amber-500">Load: Peak</span>
                    </div>
                  </div>

                  {/* Department Node 3 */}
                  <div className="flex items-center justify-between p-3.5 bg-[#0e162d]/90 border border-[#233555]/50 rounded-2xl hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-7.5 h-7.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs">
                        ID3
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Jarrohlik & Implantatsiya</h4>
                        <span className="text-[9px] font-mono text-slate-450 font-semibold uppercase">Surgical Theatre</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-cyan-400 font-mono block">70 bemor</span>
                      <span className="text-[8.5px] font-mono text-slate-500 block uppercase">Load: Light</span>
                    </div>
                  </div>
                </div>

                {/* Mini ECG Heartbeat telemetry monitor showing continuous stream */}
                <div className="mt-4 pt-4 border-t border-[#1d2d4c]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-mono font-bold text-slate-400">PATIENT TRAFFIC BEAT: 72 BPM</span>
                  </div>
                  <span className="text-[9px] text-[#29d] font-bold font-mono">FLOW LEVEL: 98.4% SAFE</span>
                </div>
              </div>

              {/* COL 2: HIGH-TECH REAL-TIME 3D DENTAL ANATOMICAL ANALYZER (7 cols on large) */}
              <div className="xl:col-span-7 bg-[#0b1022]/85 border border-[#1d2d4c]/80 rounded-3xl p-6 relative overflow-hidden text-left flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start justify-between border-b border-[#233256]/40 pb-3 mb-4 select-none">
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/30 text-[9px] font-black rounded font-mono uppercase tracking-wider">
                      🧪 AI-Diagnostic System
                    </span>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-display mt-0.5">
                      Markaziy Tish Diagnostikasi & Telemetriya
                    </h3>
                  </div>

                  {/* Mode badge indicator */}
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-[#233256]/70 text-[9px] font-mono font-bold text-emerald-400 uppercase">
                    <Zap className={`w-3.5 h-3.5 ${isScanning ? 'animate-flicker text-[#fb1]' : 'text-emerald-400'}`} />
                    <span>{isScanning ? 'Scanning...' : 'Manual Select'}</span>
                  </div>
                </div>

                {/* Core Jaw Render Layout with teeth buttons arranged in customized arch curve */}
                <div className="flex flex-col lg:flex-row items-center gap-6 justify-between flex-1 relative min-h-[170px]">
                  
                  {/* Left Jaw representation */}
                  <div className="flex flex-col items-center justify-center relative w-[180px] h-[160px] select-none bg-slate-950/40 p-3 rounded-2xl border border-[#203254]/40">
                    <span className="text-[8px] font-black text-slate-500 absolute top-2 uppercase font-mono">Mandibular Arch (Jaw)</span>

                    {/* Symmetrical tooth hexagons looping in curve path layout */}
                    <div className="relative w-full h-[100px] mt-4">
                      {[18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32].map((toothNum, index) => {
                        // Calculate coordinates in a beautiful arc
                        const angleStep = Math.PI / 14; 
                        const startAngle = Math.PI; 
                        const angle = startAngle + index * angleStep;
                        
                        // Circle formula for coordinates
                        const rx = 68; // x radius
                        const ry = 42; // y radius
                        const px = 84 + rx * Math.cos(angle);
                        const py = 15 + ry * Math.sin(angle);

                        const isCurrentlyActive = selectedTooth === toothNum;

                        return (
                          <button
                            key={toothNum}
                            type="button"
                            onClick={() => { setSelectedTooth(toothNum); setIsScanning(false); }}
                            className={`absolute w-6.5 h-6.5 text-[9.5px] font-mono font-black rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              isCurrentlyActive 
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 border-emerald-400 scale-120 z-20 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                                : 'bg-[#0f172a] hover:bg-slate-800 text-slate-350 border-slate-700/60 hover:border-[#10b981]/50 hover:scale-110'
                            }`}
                            style={{ left: `${px}px`, top: `${py}px` }}
                            title={`Tish #${toothNum}`}
                          >
                            {toothNum}
                          </button>
                        );
                      })}

                      {/* Diagnostic status sweep line animation across the teeth card */}
                      {isScanning && (
                        <div className="absolute inset-x-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-laser-scanning opacity-80" />
                      )}
                    </div>

                    <span className="text-[7.5px] font-bold text-[#e11] absolute bottom-2 tracking-widest uppercase">3D CAD WIREFRAME</span>
                  </div>

                  {/* Right Telemetry Information output panel */}
                  <div className="flex-1 bg-slate-950/80 border border-[#21355c]/60 rounded-2xl p-4.5 font-mono text-[10.5px] text-slate-300 space-y-2.5 max-w-full lg:max-w-xs select-all">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest">Tooth telemetry analysis</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 text-[8.5px] font-bold">NODE: #{selectedTooth}</span>
                    </div>

                    {/* Data output entries based on selected Tooth index */}
                    <div className="space-y-1 text-xs">
                      <p><strong className="text-slate-405">Tish indeksi:</strong> <span className="text-white">#{selectedTooth} mandibular</span></p>
                      
                      <p>
                        <strong className="text-slate-405">Enamel Abrasion:</strong>{' '}
                        <span className="text-white">
                          {selectedTooth === 19 ? '18% spot indent' : selectedTooth === 28 ? '12% normal' : selectedTooth === 30 ? '30% impacted' : '3% perfect condition'}
                        </span>
                      </p>

                      <p>
                        <strong className="text-slate-450">Tavsiya muolaja:</strong>{' '}
                        <span className={selectedTooth === 19 ? 'text-rose-400' : selectedTooth === 28 ? 'text-amber-400 animate-pulse' : selectedTooth === 30 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {selectedTooth === 19 
                            ? 'Composite Plomba' 
                            : selectedTooth === 28 
                            ? 'Ultrasonic Cleaning' 
                            : selectedTooth === 30 
                            ? 'Surgerical Extraction' 
                            : 'Muntazam gigiyena (Sog\'lom)'}
                        </span>
                      </p>

                      <p>
                        <strong className="text-slate-450">Health Factor:</strong>{' '}
                        <span className={selectedTooth === 19 ? 'text-pink-400 font-bold' : selectedTooth === 30 ? 'text-[#f43] font-black' : 'text-emerald-400'}>
                          {selectedTooth === 19 ? 'Fair (72%)' : selectedTooth === 30 ? 'Critical (40%)' : 'Excellent (98%)'}
                        </span>
                      </p>
                    </div>

                    <div className="pt-1 select-none flex items-center gap-1.5 text-slate-450 text-[9px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sinxronizatsiya statusi: Faol</span>
                    </div>
                  </div>
                </div>

                {/* Sweep Control toolbar */}
                <div className="mt-4 pt-4 border-t border-[#1d2d4c]/60 flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        let prev = selectedTooth - 1;
                        if (prev < 18) prev = 32;
                        setSelectedTooth(prev);
                        setIsScanning(false);
                      }}
                      className="p-1 px-3 bg-[#0a1122] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-black rounded-lg active:scale-95 transition-all text-center cursor-pointer"
                    >
                      ◀
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsScanning(!isScanning)}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        isScanning 
                          ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                          : 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/25'
                      }`}
                    >
                      {isScanning ? <Pause className="w-3 h-3 text-rose-400 fill-current" /> : <Play className="w-3 h-3 text-[#10b981] fill-current" />}
                      <span>{isScanning ? "Scan to'xtatish" : "Auto-Diagnostika"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        let next = selectedTooth + 1;
                        if (next > 32) next = 18;
                        setSelectedTooth(next);
                        setIsScanning(false);
                      }}
                      className="p-1 px-3 bg-[#0a1122] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-black rounded-lg active:scale-95 transition-all text-center cursor-pointer"
                    >
                      ▶
                    </button>
                  </div>

                  <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest">
                    Telemetry Tick: {scannerTick}
                  </span>
                </div>
              </div>
            </div>

            {/* ---------------- MIDDLE SECTION: FLOATING PATIENT STREAM RIBBON COVEYOR ---------------- */}
            <div className="bg-[#0b1022]/85 border border-[#1d2d4c]/85 rounded-3xl p-5 select-none text-left overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-3.5 border-b border-[#1b2a47]/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8.5px] font-black rounded font-mono uppercase tracking-widest">
                    LIVE DISPATCH RIVER
                  </span>
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-display">
                    Klinika Elektron Navbatining Oqim daryosi (Real-Time Queue Flow)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase">Live Stream Streaming info</span>
                </div>
              </div>

              {/* Scrolling Ribbon Track Container */}
              <div className="w-full relative py-2 overflow-hidden flex items-center">
                {/* Custom glowing conveyor list */}
                <div className="flex items-center gap-4.5 animate-marquee-river whitespace-nowrap min-w-full">
                  {/* Map loops of patient queue elements so customers see visual representations */}
                  {queues.length > 0 ? (
                    queues.map((item, idx) => {
                      const isCallingState = item.status === 'calling' || item.status === 'in_progress';
                      return (
                        <div
                          key={item.id + '_' + idx}
                          className={`inline-flex items-center gap-3 px-4 py-2 bg-[#0e162d]/95 rounded-2xl border transition-all hover:scale-105 shrink-0 ${
                            isCallingState 
                              ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.15)] animate-pulse' 
                              : 'border-[#223555]/60'
                          }`}
                        >
                          <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-black text-[11px] ${
                            isCallingState ? 'bg-emerald-500 text-slate-950' : 'bg-[#182648] text-cyan-400'
                          }`}>
                            #{item.number}
                          </div>
                          <div>
                            <div className="text-[11px] font-black text-white leading-none mb-1 uppercase tracking-wide">
                              {item.patientName.replace(/@/, '')}
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">
                              {item.status === 'completed'
                                ? '✔ Tugagan'
                                : isCallingState
                                ? '🫵 QABULDA'
                                : '⏳ Kutmoqda'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Beautiful custom mock queues fallback to ensure outstanding aesthetic look
                    [
                      { name: 'Maftunaxon Sobirova', number: '102', status: 'completed' },
                      { name: 'Kaori Shinoda', number: '105', status: 'calling' },
                      { name: 'Alexandru Petrof', number: '108', status: 'pending' },
                      { name: 'Akbar Salimov Uzbek', number: '110', status: 'pending' },
                      { name: 'Dilrabo Qodirova', number: '113', status: 'pending' },
                      { name: 'Jasur Bekto\'raev', number: '117', status: 'pending' }
                    ].map((mockp, idx) => (
                      <div
                        key={idx}
                        className={`inline-flex items-center gap-3.5 px-4 py-2.5 bg-[#0e162d]/90 rounded-2xl border transition-all hover:scale-105 shrink-0 ${
                          mockp.status === 'calling' ? 'border-emerald-500 bg-emerald-500/5 animate-pulse' : 'border-[#223555]/60'
                        }`}
                      >
                        <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-black text-[11px] ${
                          mockp.status === 'calling' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                        }`}>
                          #{mockp.number}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white leading-none mb-1 uppercase tracking-wider">{mockp.name}</p>
                          <p className={`text-[8px] font-black uppercase font-mono ${mockp.status === 'calling' ? 'text-emerald-400' : 'text-slate-450'}`}>
                            {mockp.status === 'calling' ? '🫵 QABULDA' : '⏳ Kutmoqda'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Info guideline indicator banner */}
              <p className="text-[9.5px] font-semibold text-slate-550 leading-normal border-t border-[#1b2a47]/20 pt-2 flex items-center gap-1">
                <span className="text-emerald-500 font-black">⚙️ Sinxronizatsiya:</span> Yangi olingan har qanday smart elektron chipta ushbu conveyor lentalarga real-vaqtda qo'shilib oqadi.
              </p>
            </div>

            {/* ---------------- LOWER SECTION: OUR DENTISTS GRID + PRICING LISTS ---------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Doctors Grid Segment (Premium Theme) */}
              <div className="bg-[#0b1022]/85 rounded-3xl p-6 border border-[#1d2d4c]/80 relative overflow-hidden text-left select-none">
                <div className="flex items-center justify-between mb-5 border-b border-[#1b2a47]/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👩‍⚕️</span>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                      Bizning Stomatologlar
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded flex items-center gap-1 hover:scale-105 transition-transform">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Barchasi Online
                  </span>
                </div>
      
                <div className="divide-y divide-slate-805/40 font-sans">
                  {clinicDoctors.map((doc) => (
                    <div key={doc.id} className="py-4 flex items-center justify-between first:pt-1 last:pb-1 group hover:bg-[#111c3a]/30 transition-all rounded-xl px-2.5 -mx-2.5">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <img 
                            src={doc.image} 
                            alt={doc.name} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + doc.name;
                            }}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 shrink-0 shadow-md transition-transform group-hover:scale-105"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0b1022] rounded-full"></span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wide">{doc.name}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold block">{doc.specialty}</span>
                        </div>
                      </div>
      
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center text-amber-500 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 fill-current ${i < Math.floor(doc.rating) ? 'text-amber-400' : 'text-slate-800'}`} />
                          ))}
                          <span className="ml-1.5 text-slate-100 font-extrabold text-[11px] font-mono">{doc.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-semibold font-mono">({doc.ratingCount} ta baho)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
      
              {/* Pricing Grid Segment (Premium Theme) */}
              <div className="bg-[#0b1022]/85 rounded-3xl p-6 border border-[#1d2d4c]/80 relative overflow-hidden text-left select-none">
                <div className="flex items-center justify-between mb-5 border-b border-[#1b2a47]/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                      Tibbiy Xizmatlar Narxlari
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-bold rounded">
                    Litsenziyalangan Kafolat
                  </span>
                </div>
      
                <div className="divide-y divide-slate-805/40 font-sans">
                  {clinicServices.map((srv) => (
                    <div key={srv.id} className="py-4 flex items-center justify-between first:pt-1 last:pb-1 group hover:bg-[#111c3a]/30 transition-all rounded-xl px-2.5 -mx-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-[11px] font-display">
                          TX
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wide">{srv.name}</span>
                      </div>
                      <div className="px-3.5 py-1.5 bg-[#0e162d] text-emerald-400 rounded-full text-xs font-black font-mono border border-emerald-500/25 shadow-md">
                        {srv.price.toLocaleString('uz-UZ')} so'm
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Segment when there is no selected clinic yet, prompt them clearly */
          <div className="bg-[#0b1022]/80 border border-[#203254]/80 rounded-3xl p-10 text-center space-y-4 max-w-2xl mx-auto py-12 animate-fade-in shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 text-yellow-500 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-lg">
              📍
            </div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest font-sans">
              Klinika Filiali Tanlanmagan
            </h3>
            <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto leading-relaxed">
              Klinikamiz tarkibini, ko'rsatiladigan tibbiy xizmatlar ro'yxatini va narxlarini ko'rish hamda onlayn chipta olish uchun yuqoridagi O'zbekiston neon xaritasidan kerakli filialni tanlang.
            </p>
          </div>
        )
      )}


      {/* ---------------- VIEW 2: REGISTER PATIENT FORM (SCREENSHOT 2) ---------------- */}
      {activeSubView === 'register' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-100 overflow-hidden animate-fade-in text-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-100 text-center relative">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2">
              <UserPlus2 className="w-5 h-5 text-indigo-650" />
              Bemor Ma'lumotlari
            </h2>
            <p className="text-[10px] text-slate-450 font-semibold mt-1">Iltimos, elektron kartangizni ochish uchun formulani to'ldiring</p>
          </div>

          {/* Body Form */}
          <form onSubmit={handleRegister} className="p-6 md:p-8 space-y-5">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                Ism va familiya *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Umidjon Egamov"
                className="w-full bg-slate-50/70 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Passport & Birthdate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Pasport seriyasi va raqami *
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={passport}
                  onChange={(e) => setPassport(e.target.value.toUpperCase())}
                  placeholder="AA1234567"
                  className="w-full bg-slate-50/70 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all uppercase font-mono tracking-widest placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Tug'ilgan sana *
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-50/70 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone & Password Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Telefon raqam *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 (90) 123-45-67"
                  className="w-full bg-slate-50/70 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Parol *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Xavfsiz parol kiriting"
                  className="w-full bg-slate-50/70 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Blood group & Allergies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Qon guruhi
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-50/70 text-xs font-semibold text-slate-850 border border-slate-200 rounded-xl px-3 py-3 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                >
                  <option value="Noma'lum">Tanlang (Noma'lum)</option>
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
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Allergiyalar
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Masalan: Penitsillin guruhiga"
                  className="w-full bg-slate-50/70 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Chronic diseases */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                Surunkali kasalliklar
              </label>
              <textarea
                value={chronicDiseases}
                onChange={(e) => setChronicDiseases(e.target.value)}
                placeholder="Yurak, Qon bosimi, qandli diabet yoki boshqa jiddiy muammolar haqida..."
                className="w-full bg-slate-50/70 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-3 h-20 resize-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Red Alert warning Box matching Screenshot 2 */}
            <div className="bg-rose-50/50 border border-rose-200/60 p-4.5 rounded-2xl flex items-start gap-3.5">
              <input
                type="checkbox"
                id="has-infection-chk"
                checked={hasInfection}
                onChange={(e) => setHasInfection(e.target.checked)}
                className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-5 h-5 cursor-pointer mt-0.5 shrink-0 transition-transform active:scale-90"
              />
              <label htmlFor="has-infection-chk" className="text-xs font-extrabold text-rose-900 leading-tight cursor-pointer select-none">
                DIQQAT: Jiddiy yuqumli kasalliklar mavjud bo'lsa belgilang.
                <span className="block font-normal text-[10px] text-rose-600 mt-1 leading-relaxed">
                  Gepatit, OIV yoki boshqa asbob-uskunalar daxlsizligiga bevosita ta'sir qiladigan kasalliklar mavjud bo'lsa, shifokor uchun buni belgilashingiz qat'iyan tavsiya etiladi.
                </span>
              </label>
            </div>

            {/* Submit Action Buttons exactly formatted as Screenshot 2 */}
            <div className="flex items-center gap-3.5 pt-4">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-100/50 cursor-pointer transition-all text-center"
              >
                Muvaffaqiyatli Ro'yxatdan o'tish
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSubView('home')}
                className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-2xl cursor-pointer transition-all"
              >
                Orqaga
              </button>
            </div>
          </form>
        </div>
      )}


      {/* ---------------- VIEW 1.5: LOGIN PATIENT FORM ---------------- */}
      {activeSubView === 'login' && (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-100 overflow-hidden animate-fade-in text-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-100 text-center">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5 text-cyan-600" />
              Bemor Kabinetiga Kirish
            </h2>
            <p className="text-[10px] text-slate-450 font-semibold mt-1">
              Shaxsiy tibbiy kartangizga kirish uchun pasport va parolingizni kiriting
            </p>
          </div>

          {/* Body Form */}
          <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-5">
            {/* Passport Serial */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                Pasport seriyasi va raqami *
              </label>
              <input
                type="text"
                required
                maxLength={9}
                value={passport}
                onChange={(e) => setPassport(e.target.value.toUpperCase())}
                placeholder="AA1234567"
                className="w-full bg-slate-50/70 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/25 focus:outline-none transition-all uppercase font-mono tracking-widest placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Demo uchun pasport: <span className="font-bold font-mono">AA1234567</span>
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                Parol *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50/70 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/25 focus:outline-none transition-all placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Demo parol: <span className="font-bold font-mono">123456</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3.5 pt-4">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-650 hover:from-cyan-400 hover:to-blue-550 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-cyan-950/20 cursor-pointer transition-all text-center"
              >
                Tizimga kirish
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSubView('home')}
                className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-2xl cursor-pointer transition-all"
              >
                Orqaga
              </button>
            </div>

            {/* Link to Register */}
            <div className="text-center pt-2">
              <p className="text-[11px] font-semibold text-slate-500">
                Klinikada shaxsiy kartangiz yo'qmi?{" "}
                <button
                  type="button"
                  onClick={() => setActiveSubView('register')}
                  className="text-cyan-600 font-extrabold hover:underline"
                >
                  Yangi bemor ro'yxatdan o'tish
                </button>
              </p>
            </div>
          </form>
        </div>
      )}


      {/* ---------------- VIEW 3: PATIENT CABINET (SCREENSHOT 3) ---------------- */}
      {activeSubView === 'cabinet' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Header Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-gradient-to-tr from-indigo-550 to-indigo-700 text-white rounded-2xl shadow-md">
                  <LogIn className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest font-sans">
                    Bemor Shaxsiy Kabineti
                  </h2>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">Elektron navbat tizimi va shaxsiy tibbiy ma'lumomlar terminali</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setActiveSubView('home')}
              className="px-5 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-2xl cursor-pointer transition-all active:scale-95 flex items-center gap-2 shadow-xs w-max"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" /> Bosh Sahifaga Qaytish
            </button>
          </div>

          {/* New 3-Column Premium Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stat Card 1 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_15px_40px_rgba(15,23,42,0.04)] transition-all flex items-center gap-4 group">
              <div className="w-12 h-12 bg-indigo-50/70 text-indigo-650 rounded-2xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                ⏳
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Navbat Holati</span>
                <span className="text-xs font-black text-slate-850 mt-1 block">
                  {(() => {
                    const activeQueue = myQueues.find(q => q.status === 'pending' || q.status === 'calling' || q.status === 'in_progress');
                    if (activeQueue) {
                      const isWaiting = activeQueue.status === 'pending';
                      return (
                        <span className={`${isWaiting ? 'text-amber-650 animate-pulse' : 'text-blue-600 font-bold'} flex items-center gap-1.5`}>
                          Chipta #{activeQueue.number} ({isWaiting ? 'Kutmoqda' : 'Xizmat ko\'rsatilmoqda 🦷'})
                        </span>
                      );
                    }
                    return <span className="text-slate-400 font-bold">Navbatingiz mavjud emas</span>;
                  })()}
                </span>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_15px_40px_rgba(15,23,42,0.04)] transition-all flex items-center gap-4 group">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                ✅
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Elektron Karta</span>
                <span className="text-xs font-black text-emerald-600 mt-1 block">
                  Faol & Tasdiqlangan
                </span>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)] hover:shadow-[0_15px_40px_rgba(15,23,42,0.04)] transition-all flex items-center gap-4 group">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                ⭐
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Bemor Maqomi</span>
                <span className="text-xs font-black text-purple-600 mt-1 block">
                  Premium Bemor
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
            
            {/* Left Column (Profile & Bot setting) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile card with Name of patient */}
              <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] transition-all">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-750 to-purple-700 text-white p-6 rounded-2xl flex flex-col gap-1 items-center text-center relative overflow-hidden shadow-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                  <div className="w-16 h-16 bg-white/95 text-indigo-750 rounded-full flex items-center justify-center font-black text-2xl select-none shadow-md border-2 border-white/20">
                    {currentUser?.fullName.split(' ')[0][0] || 'T'}
                  </div>
                  <h4 className="text-[9px] uppercase font-black tracking-[0.25em] text-indigo-200 mt-4 font-sans">Tibbiy Elektron Karta</h4>
                  <p className="text-sm font-black text-white mt-1 leading-snug">
                    {currentUser?.fullName || 'Test Bemor 2'}
                  </p>
                  <span className="mt-2 px-3 py-1 bg-white/15 text-white/90 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono">
                    ID: {currentUser?.passportSerial?.slice(0, 4) || 'AA12'}**
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-xs font-semibold text-slate-650">
                  <div className="flex justify-between py-1.5 border-b border-slate-55">
                    <span className="text-slate-400">Pasport seriyasi:</span>
                    <span className="font-mono text-slate-900 font-bold">{currentUser?.passportSerial || 'AA1234567'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-55 bg-indigo-50/20 px-2 rounded-lg">
                    <span className="text-slate-400 font-bold">Kabinat paroli:</span>
                    <span className="font-mono text-indigo-700 font-black text-xs select-all bg-white px-2 py-0.5 rounded border border-indigo-100">
                      {currentUser?.password || 'parol (12345)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-55">
                    <span className="text-slate-400">Telefon raqami:</span>
                    <span className="text-slate-900 font-bold">{currentUser?.phone || '+998401234567'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-55">
                    <span className="text-slate-400">Qon guruhi:</span>
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 font-black rounded-full text-[11px]">{currentUser?.bloodGroup || 'II+'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-55">
                    <span className="text-slate-400">Tug'ilgan sana:</span>
                    <span className="text-slate-800 font-bold font-mono">{currentUser?.birthDate || '12.05.1998'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-55">
                    <span className="text-slate-400">Ro'yxatdan o'tgan:</span>
                    <span className="text-slate-800">23.05.2026</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-55">
                    <span className="text-slate-400">Tashriflar soni:</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 rounded-full font-mono font-black text-slate-800">{currentUser?.fullName === 'Test Bemor 2' ? 4 : 1} ta</span>
                  </div>
                </div>
              </div>

              {/* Bot settings container card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] transition-all">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-2xl">🤖</span>
                  <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest">
                    Telegram Bot Xizmati
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Navbat holatini telegram orqali tekshirish uchun: <a href="https://t.me/dstoma_bot" target="_blank" rel="noreferrer" className="text-indigo-650 font-bold underline hover:text-indigo-850">@dstoma_bot</a> ga o'tib, <code className="bg-slate-100 px-1 py-0.5 font-bold font-mono text-[10px] rounded text-indigo-600">/start</code> yozing va Chat ID ni kiriting.
                </p>

                <div className="space-y-2.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Telegram Chat ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={telegramIdInput}
                      onChange={(e) => setTelegramIdInput(e.target.value)}
                      placeholder="Masalan: 57896431"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
                    />
                    <button
                      onClick={handleSaveTelegram}
                      className="px-4 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-xs text-white rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-250/20 active:scale-95 text-center"
                    >
                      Ulash
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (Online booking + queues list) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Online queue booking container form */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(15,23,42,0.04)] transition-all">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider leading-none">
                        Tezkor Navbat Olish
                      </h3>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Hozir navbat yo'nalishlarida bo'sh joylar talaygina!
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[9px] font-black tracking-widest uppercase rounded-lg">E-TICKET</span>
                </div>

                <form onSubmit={handleBookQueue} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5">
                      Shifokorni tanlang *
                    </label>
                    <select
                      value={bookingDoctorId}
                      onChange={(e) => setBookingDoctorId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                    >
                      {clinicDoctors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.specialty} (★ {d.rating})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5">
                      Xizmat turini tanlang *
                    </label>
                    <select
                      value={bookingServiceId}
                      onChange={(e) => setBookingServiceId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                    >
                      {clinicServices.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.price.toLocaleString('uz-UZ')} so'm
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Infection safety Warning banner inside cabinet */}
                  <div className="md:col-span-2 flex items-center gap-3.5 py-4 px-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
                    <input
                      type="checkbox"
                      id="infect-safety"
                      checked={hasInfection}
                      onChange={(e) => setHasInfection(e.target.checked)}
                      className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-5 h-5 transition-all"
                    />
                    <label htmlFor="infect-safety" className="text-[11px] font-extrabold text-rose-900 cursor-pointer flex items-center gap-2 select-none md:leading-normal">
                      <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                      <span>DIQQAT: Jiddiy yuqumli kasalliklar mavjud bo'lsa shifokorni xabardor qiling (belgilang).</span>
                    </label>
                  </div>

                  <div className="md:col-span-2 pt-1">
                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white text-xs font-black rounded-2xl shadow-lg shadow-amber-500/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Ticket className="w-4.5 h-4.5 text-amber-100" />
                      NAVBAТGA TURISH (OLISH)
                    </button>
                  </div>
                </form>
              </div>

              {/* Table Column of My Bookings */}
              <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(15,23,42,0.04)] transition-all">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
                      Mening Navbatlarim
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full font-mono">
                    Joriy {myQueues.length} ta tahlil
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs text-left mb-6">
                  <table className="w-full min-w-[550px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px]">
                        <th className="px-4 py-3.5 font-bold text-center">Raqam</th>
                        <th className="px-4 py-3.5 font-bold">Shifokor</th>
                        <th className="px-4 py-3.5 font-bold">Xizmat</th>
                        <th className="px-4 py-3.5 font-bold text-center">Sana</th>
                        <th className="px-4 py-3.5 font-bold text-center">Holati</th>
                        <th className="px-4 py-3.5 font-bold text-center">Baho berish</th>
                        <th className="px-4 py-3.5 font-bold text-center">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {myQueues.map((item) => {
                        const doc = doctors.find(d => d.id === item.doctorId);
                        const srv = services.find(s => s.id === item.serviceId);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="px-4 py-4 text-center">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-full font-mono text-xs">
                                #{item.number}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-bold text-slate-800">
                              {doc?.name || 'Dr. Umidjon'}
                            </td>
                            <td className="px-4 py-4 text-slate-650 font-semibold">
                              {srv?.name || 'Konsultatsiya'}
                            </td>
                            <td className="px-4 py-4 text-slate-500 font-mono text-center">
                              Bugun
                            </td>
                            <td className="px-4 py-4 text-center">
                              {item.status === 'completed' ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full text-[10px] inline-flex items-center gap-1 border border-emerald-200/50">
                                  ✔ Tugagan
                                </span>
                              ) : item.status === 'cancelled' ? (
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-400 font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                                  ✕ Bekor qilingan
                                </span>
                              ) : item.status === 'in_progress' || item.status === 'calling' ? (
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px] inline-flex items-center gap-1 border border-blue-200 animate-pulse">
                                  缾 Shifokor qabulida
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-full text-[10px] inline-flex items-center gap-1 border border-amber-250/55">
                                  ⏳ Kutmoqda
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {item.status === 'completed' && !item.rating && (
                                <div className="flex items-center justify-center gap-0.5">
                                  {[1,2,3,4,5].map(st => (
                                    <button
                                      key={st}
                                      onClick={() => handleRatingLocalQueue(item.id, st)}
                                      className="text-slate-200 hover:text-amber-400 hover:scale-115 text-lg transition-transform focus:outline-none cursor-pointer"
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              )}
                              {item.rating ? (
                                <div className="text-amber-400 font-black text-center tracking-wide text-xs">
                                  {'★'.repeat(item.rating)}
                                </div>
                              ) : item.status !== 'completed' ? (
                                <span className="text-slate-300">-</span>
                              ) : null}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {item.status === 'pending' || item.status === 'in_progress' || item.status === 'calling' ? (
                                <button
                                  onClick={() => handleCancelLocalQueue(item.id)}
                                  className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer"
                                >
                                  Bekor qilish
                                </button>
                              ) : <span className="text-slate-300">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Patient logout bottom card element */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-slate-800"
                  >
                    Kabinetdan chiqish
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ----------------- FOOTER (SCREENSHOT 1) ----------------- */}
      <footer className="pt-8 border-t border-slate-200 mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs text-slate-400 font-semibold select-none pb-4">
          <p>© 2025-2026 DStoma Queue. Barcha huquqlar himoyalangan.</p>
          <p className="flex items-center gap-1.5 text-slate-500">
            Sizning sog'lig'ingiz biz uchun muhim ❤️
          </p>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
            <span>Avtomatik yangilanmoqda 3 soniya</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
