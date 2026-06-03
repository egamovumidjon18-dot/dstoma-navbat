import React, { useState } from 'react';
import { Clinic, Doctor, Service, QueueItem, Patient } from '../types';
import { 
  User, 
  Phone, 
  FileText, 
  Lock, 
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
  UserPlus2
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
  setActiveTab
}: ClientDashboardProps) {
  
  // Simulated initial user to match Screenshot 3
  const [currentUser, setCurrentUser] = useState<Patient | null>({
    id: 'pat_test_2',
    clinicId: 'samarqand',
    fullName: 'Test Bemor 2',
    passportSerial: 'AA1234567',
    phone: '+998 (90) 123-45-67',
    birthDate: '1998-05-12',
    bloodGroup: 'II+',
    allergies: "Yo'q",
    chronicDiseases: "Mavjud emas (Sog'lom)",
    hasInfection: false,
    telegramChatId: '87654321'
  });

  // Screen control state matching user screenshots
  // 'home' -> Screenshot 1 (Main page with buttons, Shifokorlar & Xizmatlar listas)
  // 'register' -> Screenshot 2 (Bemor ma'lumotlari)
  // 'cabinet' -> Screenshot 3 (Bemor Kabineti / Profilingizga kirish)
  const [activeSubView, setActiveSubView] = useState<'home' | 'register' | 'cabinet'>('home');

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998901234567');
  const [passport, setPassport] = useState('AA1234567');
  const [password, setPassword] = useState('123456');
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
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

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
    const fallbackPatient: Patient = {
      id: 'pat_test_2',
      clinicId: selectedClinic?.id || 'samarqand',
      fullName: 'Test Bemor 2',
      passportSerial: passport.toUpperCase(),
      phone: '+998 (90) 123-45-67',
      birthDate: '1998-05-12',
      bloodGroup: 'II+',
      allergies: "Yo'q",
      chronicDiseases: "Sog'lom",
      hasInfection: false,
      telegramChatId: '57896431'
    };
    setCurrentUser(fallbackPatient);
    showToast("Kabinetga muvaffaqiyatli kirdingiz!");
    setActiveSubView('cabinet');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast("Kabinetdan chiqdingiz");
    setActiveSubView('home');
  };

  const handleSaveTelegram = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, telegramChatId: telegramIdInput });
      showToast("Telegram ID muvaffaqiyatli saqlandi! t.me/distonia_bot muloqotga tayyor.");
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
      createdAt: new Date().toISOString()
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

  // Filter lists based on selected clinic (default: Samarqand matching screenshots)
  const clinicDoctors = doctors.filter(d => d.clinicId === (selectedClinic?.id || 'samarqand'));
  const clinicServices = services.filter(s => s.clinicId === (selectedClinic?.id || 'samarqand'));

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert popups */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl transition-all border ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`p-1 rounded-full ${toastMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">{toastMsg.text}</span>
        </div>
      )}

      {/* ----------------- BANNER HEADER (SCREENSHOT 1 & ALL) ----------------- */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl pt-8 pb-10 px-6 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10 pointer-events-none"></div>
        {/* Subtle Decorative Circle */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-blue-400/20 blur-xl"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-cyan-400/10 blur-2xl"></div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl filter drop-shadow">🦷</span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight select-none">
              DStoma Queue
            </h1>
          </div>
          
          <p className="text-sm md:text-base text-blue-100 font-medium select-none">
            Stomatologiya klinikasi navbatlarini boshqarish tizimi
          </p>

          {/* Quick Pillar buttons exactly aligned to Screenshot 1 */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
            {/* Language Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold rounded-full border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer text-white"
              >
                🇺🇿 uz O'zbek
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-100 py-1 text-xs font-bold z-50">
                  <button onClick={() => setIsLanguageOpen(false)} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2">🇺🇿 O'zbek</button>
                  <button onClick={() => setIsLanguageOpen(false)} className="w-full text-left px-3 py-2 hover:bg-slate-50 opacity-60">🇷🇺 Русский</button>
                  <button onClick={() => setIsLanguageOpen(false)} className="w-full text-left px-3 py-2 hover:bg-slate-50 opacity-60">🇺🇸 English</button>
                </div>
              )}
            </div>

            {/* Register Trigger button (Purple) */}
            <button
              onClick={() => setActiveSubView('register')}
              className="px-5 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] active:scale-95 text-xs font-bold rounded-full shadow-lg hover:shadow-purple-500/20 text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus2 className="w-4 h-4" />
              Yangi bemor ro'yxatdan o'tish
            </button>

            {/* Patient Cabinet Trigger button (Light Blue) */}
            <button
              onClick={() => {
                if (currentUser) {
                  setActiveSubView('cabinet');
                } else {
                  setActiveSubView('cabinet'); // Default loads Mock User cabinet
                  showToast("Test Bemor 2 kabinetiga kirdingiz!");
                }
              }}
              className="px-5 py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-95 text-xs font-bold rounded-full shadow-lg hover:shadow-sky-500/20 text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              Bemor kabineti
            </button>

            {/* Staff Entry button (Transparent white outline) */}
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold rounded-full border border-white/30 text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              Xodimlar kirishi
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- SUB-VIEW CONTAINER ----------------- */}

      {/* MODAL / DROPDOWN FOR STAFF ACCESS */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 text-center uppercase tracking-wide">
              🔒 Tizim xodimlari bo'limi
            </h3>
            <p className="text-xs text-slate-500 text-center">
              Tizimga kim sifatida kirmoqchisiz? Tanlang:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsStaffModalOpen(false);
                  if (setActiveTab) setActiveTab('shifokor');
                }}
                className="w-full py-3 bg-blue-50 text-blue-700 hover:bg-blue-100/80 rounded-2xl text-xs font-extrabold transition-all text-center block"
              >
                🩺 Shifokor Kabineti (Umidjon E.)
              </button>
              <button
                onClick={() => {
                  setIsStaffModalOpen(false);
                  if (setActiveTab) setActiveTab('boshliq');
                }}
                className="w-full py-3 bg-violet-50 text-violet-750 hover:bg-violet-100/85 text-violet-700 rounded-2xl text-xs font-extrabold transition-all text-center block"
              >
                👑 Boshliq Paneli (Boshqaruv markazi)
              </button>
            </div>
            <button
              onClick={() => setIsStaffModalOpen(false)}
              className="w-full py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all text-center"
            >
              Orqaga qaytish
            </button>
          </div>
        </div>
      )}


      {/* ---------------- VIEW 1: HOME PAGE (SCREENSHOT 1) ---------------- */}
      {activeSubView === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Our Doctors */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150/60 shadow-md">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
              <span className="text-xl">👥</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Bizning Shifokorlar
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {clinicDoctors.map((doc) => (
                <div key={doc.id} className="py-4 flex items-center justify-between first:pt-1 last:pb-1">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={doc.image} 
                      alt={doc.name} 
                      onError={(e) => {
                        // fallback if unsplash image fails to load in preview
                        (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + doc.name;
                      }}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shrink-0 shadow-sm"
                    />
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">{doc.name}</h4>
                      <p className="text-xs text-slate-400 font-semibold">{doc.specialty}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center text-amber-500 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < Math.floor(doc.rating) ? 'text-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="ml-1 text-slate-800 font-bold">{doc.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium font-mono">({doc.ratingCount} baho)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Services Pricing list */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150/60 shadow-md">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
              <span className="text-xl">📋</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Xizmatlar Narxnomasi
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {clinicServices.map((srv) => (
                <div key={srv.id} className="py-3.5 flex items-center justify-between first:pt-1 last:pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-500 shrink-0">🦷</span>
                    <span className="text-xs font-bold text-slate-700">{srv.name}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full text-xs font-extrabold font-mono border border-blue-100">
                    {srv.price.toLocaleString('uz-UZ')}.00 so'm
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ---------------- VIEW 2: REGISTER PATIENT FORM (SCREENSHOT 2) ---------------- */}
      {activeSubView === 'register' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-150 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-100 text-center">
            <h2 className="text-md font-bold text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2">
              <UserPlus2 className="w-5 h-5 text-blue-600" />
              Bemor ma'lumotlari
            </h2>
          </div>

          {/* Body Form */}
          <form onSubmit={handleRegister} className="p-6 space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Ism va familiya *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ismingiz va familiyangizni kiriting"
                className="w-full bg-slate-50 text-xs font-medium text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* Passport & Birthdate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Pasport seriyasi va raqami *
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={passport}
                  onChange={(e) => setPassport(e.target.value.toUpperCase())}
                  placeholder="AA1234567"
                  className="w-full bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-all uppercase font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Tug'ilgan sana *
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone & Password Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Telefon raqam *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Parol *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni yozing"
                  className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Blood group & Allergies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Qon guruhi
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
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
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Allergiyalar
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Dorilar yoki tarkibga allergiya"
                  className="w-full bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Chronic diseases */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Surunkali kasalliklar
              </label>
              <textarea
                value={chronicDiseases}
                onChange={(e) => setChronicDiseases(e.target.value)}
                placeholder="Yurak, Qon bosimi yoki boshqa surunkali kasalliklar haqida"
                className="w-full bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 h-16 resize-none focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* Red Alert warning Box matching Screenshot 2 */}
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="has-infection-chk"
                checked={hasInfection}
                onChange={(e) => setHasInfection(e.target.checked)}
                className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4.5 h-4.5 cursor-pointer mt-0.5 shrink-0"
              />
              <label htmlFor="has-infection-chk" className="text-xs font-extrabold text-rose-800 leading-tight cursor-pointer select-none">
                DIQQAT: Yuqumli kasalliklar mavjud bo'lsa belgilang.
                <span className="block font-normal text-[10px] text-rose-600 mt-1">
                  Gepatit, OIV yoki boshqa stomatologik qurollar orqali yuqishi mumkin bo'lgan jiddiy kasalliklar mavjud bo'lsa, shifokor uchun buni belgilashingiz zarur.
                </span>
              </label>
            </div>

            {/* Submit Action Buttons exactly formatted as Screenshot 2 */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-md cursor-pointer transition-all text-center"
              >
                Ro'yxatdan o'tish
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSubView('home')}
                className="px-5 py-3 border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-500 text-xs font-extrabold rounded-2xl cursor-pointer transition-all"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      )}


      {/* ---------------- VIEW 3: PATIENT CABINET (SCREENSHOT 3) ---------------- */}
      {activeSubView === 'cabinet' && (
        <div className="space-y-6">
          {/* Header Title */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-md font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <LogIn className="w-5 h-5 text-blue-600" />
              Profilingizga kirish / Bemor Kabineti
            </h2>
            <button
              onClick={() => setActiveSubView('home')}
              className="text-xs font-bold text-slate-500 hover:text-slate-850 flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Hand: Registration detail & Telegram Bot side blocks */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile card with Name of paciente */}
              <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex flex-col gap-1 items-center text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg select-none shadow-sm shadow-blue-500/20">
                    {currentUser?.fullName.split(' ')[0][0] || 'T'}
                  </div>
                  <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-blue-600 mt-2">Bemor Shaxsiy Profili</h4>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5 leading-snug">
                    Xush kelibsiz, {currentUser?.fullName || 'Test Bemor 2'}!
                  </p>
                </div>

                <div className="mt-4 space-y-2.5 text-xs font-semibold text-slate-650">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Pasport seriyasi:</span>
                    <span className="font-mono text-slate-800">{currentUser?.passportSerial || 'AA1234567'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Telefon:</span>
                    <span className="text-slate-800">{currentUser?.phone || '+998901234567'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Qon guruhi:</span>
                    <span className="text-slate-800 font-extrabold text-rose-600">{currentUser?.bloodGroup || 'II+'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Ro'yxatdan o'tgan:</span>
                    <span className="text-slate-800">23.05.2026</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Tashriflar soni:</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full font-mono font-extrabold text-slate-800">{currentUser?.fullName === 'Test Bemor 2' ? 4 : 1} Ta</span>
                  </div>
                </div>
              </div>

              {/* Bot settings container card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🤖</span>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Telegram Bot sozlamalari
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal mb-3">
                  Botdan ID raqamingizni olib va quyidagi maydonga yozing. Qanday olish mumkin: <a href="https://t.me/distonia_bot" target="_blank" rel="noreferrer" className="text-blue-500 font-serif lowercase italic underline hover:text-blue-600">@distonia_bot</a> ga o'ting va <code className="bg-slate-100 px-1 py-0.5 font-bold font-mono text-[10px] rounded text-emerald-600">/start</code> yozing.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Telegram ID raqamingizni kiriting
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={telegramIdInput}
                      onChange={(e) => setTelegramIdInput(e.target.value)}
                      placeholder="Telegram chat ID kiriting"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-extrabold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1"
                    />
                    <button
                      onClick={handleSaveTelegram}
                      className="px-3 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white rounded-xl transition-all cursor-pointer"
                    >
                      Saqlash
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Hand: Online queue booking & booking list columns */}
            <div className="lg:col-span-8 space-y-6 font-sans">
              
              {/* Online queue booking container form */}
              <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                  <span className="text-2xl">⏳</span>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider leading-none">
                      Onlayn navbatga yozilish
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Shoshiling, hozir navbat kutayotganlar kam!</p>
                  </div>
                </div>

                <form onSubmit={handleBookQueue} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-650 block mb-1">
                      Shifokorni tanlang
                    </label>
                    <select
                      value={bookingDoctorId}
                      onChange={(e) => setBookingDoctorId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                    >
                      {clinicDoctors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.specialty} (★{d.rating})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-655 block mb-1">
                      Xizmat turini tanlang
                    </label>
                    <select
                      value={bookingServiceId}
                      onChange={(e) => setBookingServiceId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                    >
                      {clinicServices.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.price.toLocaleString('uz-UZ')} so'm
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Infection safety Warning banner inside cabinet */}
                  <div className="md:col-span-2 flex items-center gap-2 py-2 px-3 bg-rose-50/75 border border-rose-100 rounded-xl">
                    <input
                      type="checkbox"
                      id="infect-safety"
                      checked={hasInfection}
                      onChange={(e) => setHasInfection(e.target.checked)}
                      className="rounded border-rose-300 text-rose-500 focus:ring-rose-400 cursor-pointer"
                    />
                    <label htmlFor="infect-safety" className="text-[11px] font-bold text-rose-800 cursor-pointer flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> DIQQAT: Yuqumli kasalliklar (gepatit, oiv) mavjud bo'lsa belgilang.
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Ticket className="w-4 h-4 text-white" />
                      NAVBAТGA TURISH
                    </button>
                  </div>
                </form>
              </div>

              {/* Table Column of My Bookings */}
              <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📅</span>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    Mening navbatlarim
                  </h3>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner text-left">
                  <table className="w-full min-w-[500px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px]">
                        <th className="px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">Shifokor</th>
                        <th className="px-4 py-3 font-semibold">Xizmat</th>
                        <th className="px-4 py-3 font-semibold">Sana</th>
                        <th className="px-4 py-3 font-semibold">Holati</th>
                        <th className="px-4 py-3 font-semibold">Baho</th>
                        <th className="px-4 py-3 font-semibold">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {myQueues.map((item, idx) => {
                        const doc = doctors.find(d => d.id === item.doctorId);
                        const srv = services.find(s => s.id === item.serviceId);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/30">
                            <td className="px-4 py-3.5 font-bold text-slate-500 font-mono">
                              #{item.number}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-800">
                              {doc?.name || 'Dr. Umidjon'}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              {srv?.name || 'Konsultatsiya'}
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 font-mono">
                              Bugun
                            </td>
                            <td className="px-4 py-3.5">
                              {item.status === 'completed' ? (
                                <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-[10px] inline-flex items-center gap-1">
                                  ✔ Tugagan
                                </span>
                              ) : item.status === 'cancelled' ? (
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-400 font-bold rounded-lg text-[10px] inline-flex items-center gap-1">
                                  ✕ Bekor qilingan
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-lg text-[10px] inline-flex items-center gap-1">
                                  ⏳ Kutmoqda
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {item.status === 'completed' && !item.rating && (
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(st => (
                                    <button
                                      key={st}
                                      onClick={() => handleRatingLocalQueue(item.id, st)}
                                      className="text-slate-200 hover:text-amber-400 text-lg"
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              )}
                              {item.rating ? (
                                <div className="text-amber-400 font-bold font-sans">
                                  {'★'.repeat(item.rating)}
                                </div>
                              ) : item.status !== 'completed' ? (
                                <span className="text-slate-300">-</span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {item.status === 'pending' ? (
                                <button
                                  onClick={() => handleCancelLocalQueue(item.id)}
                                  className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[10px] rounded-lg transition-all"
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

                {/* Patient logout exactly at bottom right as Screenshot 3 */}
                <div className="flex justify-end pt-5">
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
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
