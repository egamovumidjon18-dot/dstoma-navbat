import React, { useState } from 'react';
import { Clinic, Doctor, Service, QueueItem, Patient } from '../types';
import { User, Phone, FileText, Lock, Ticket, Star, Calendar, RefreshCw, Bell, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

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
  onUpdateDoctorRating
}: ClientDashboardProps) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<Patient | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [passport, setPassport] = useState('');
  const [password, setPassword] = useState('');
  
  // Booking States
  const [bookingDoctorId, setBookingDoctorId] = useState('');
  const [bookingServiceId, setBookingServiceId] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Telegram mock state
  const [telegramNotificationEnabled, setTelegramNotificationEnabled] = useState(true);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !passport || !password) {
      showToast("Iltimos, barcha maydonlarni to'ldiring", "error");
      return;
    }
    const newPatient: Patient = {
      id: 'pat_' + Math.random().toString(36).substr(2, 9),
      clinicId: selectedClinic?.id || 'samarqand',
      fullName,
      passportSerial: passport.toUpperCase(),
      phone,
      telegramChatId: telegramNotificationEnabled ? '@dstoma_queue_bot' : undefined
    };
    setCurrentUser(newPatient);
    setIsRegistering(false);
    showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport || !password) {
      showToast("Iltimos, pasport va parolingizni kiriting", "error");
      return;
    }
    // Simulate user login
    const patient: Patient = {
      id: 'pat_simulated',
      clinicId: selectedClinic?.id || 'samarqand',
      fullName: 'O\'ktam Shodiyev',
      passportSerial: passport.toUpperCase(),
      phone: '+998 (90) 555-44-33',
      telegramChatId: '@dstoma_queue_bot'
    };
    setCurrentUser(patient);
    showToast("Kabinetga muvaffaqiyatli kirdingiz!");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPassport('');
    setPassword('');
    showToast("Kabinetdan chiqdingiz");
  };

  // Get active items in current clinic
  const clinicDoctors = doctors.filter((d) => d.clinicId === (selectedClinic?.id || 'samarqand'));
  const clinicServices = services.filter((s) => s.clinicId === (selectedClinic?.id || 'samarqand'));
  const myClinicQueues = queues.filter((q) => q.clinicId === (selectedClinic?.id || 'samarqand') && q.patientPhone === (currentUser?.phone || '+998 (90) 555-44-33'));

  const handleBookQueue = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClinic) {
      showToast("Avval xaritadan yoki ro'yxatdan birorta klinikani tanlang", "error");
      return;
    }
    if (!bookingDoctorId || !bookingServiceId) {
      showToast("Shifokor va Xizmat turini tanlashingiz shart", "error");
      return;
    }

    // Determine Queue Ticket Number
    const sameClinicQueues = queues.filter((q) => q.clinicId === selectedClinic.id);
    const maxNum = sameClinicQueues.reduce((max, item) => (item.number > max ? item.number : max), selectedClinic.id === 'samarqand' ? 100 : selectedClinic.id === 'buxoro' ? 200 : 300);
    const ticketNo = maxNum + 1;

    // Patient info
    const pName = currentUser ? currentUser.fullName : 'Guest Patient';
    const pPhone = currentUser ? currentUser.phone : '+998 (90) 555-44-33';

    const newQueue: QueueItem = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      clinicId: selectedClinic.id,
      patientName: pName,
      patientPhone: pPhone,
      doctorId: bookingDoctorId,
      serviceId: bookingServiceId,
      number: ticketNo,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onAddQueue(newQueue);
    showToast(`Navbatingiz muvaffaqiyatli olindi! Navbat raqamingiz: #${ticketNo}`);
    
    // reset form fields
    setBookingDoctorId('');
    setBookingServiceId('');
  };

  // Get service price and details
  const getServiceInfo = (sId: string) => services.find((s) => s.id === sId);
  const getDoctorInfo = (dId: string) => doctors.find((d) => d.id === dId);

  return (
    <div id="patient-dashboard-root" className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl transition-all animate-bounce ${
          toastMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold font-sans">{toastMsg.text}</span>
        </div>
      )}

      {/* Main Clinic Header Selector */}
      <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_right,rgba(6,182,212,0.4),transparent_50%)]"></div>
        
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">FAOL MULTI-TENANT BILAN ISHLASH</span>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-1">
            <span className="text-2xl">{selectedClinic?.logo || '🦷'}</span> 
            {selectedClinic ? selectedClinic.name : 'Stomatologiya klinikasini tanlang'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed flex items-center gap-1">
            <span>Subdomen:</span> 
            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono rounded text-[11px]">
              {selectedClinic ? `${selectedClinic.subdomain}.dstoma.uz` : 'samarqand.dstoma.uz'}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          {clinics.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectClinic(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedClinic?.id === c.id
                  ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {c.name.split(' ')[1] || c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Register/Auth & Book Queue Form */}
        <div className="md:col-span-7 space-y-6">
                  {/* USER CABINET SECTION */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            {currentUser ? (
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {currentUser.fullName.split(' ')[0][0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tizimga kirgan bemor</h4>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">{currentUser.fullName}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{currentUser.phone} | Pasport: <strong>{currentUser.passportSerial}</strong></p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 border border-slate-200 hover:border-rose-200 text-rose-600 hover:bg-rose-50/40 rounded-lg text-[11px] font-bold transition-all"
                >
                  Chiqish
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <User className="text-cyan-600 w-4.5 h-4.5" /> Bemor Shaxsiy Kabineti
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Navbat barcha ma'lumotlarni saqlab boradi. O'z navbatlaringiz tarixini va uchrashuvlarni boshqarish uchun tizimga kiring yoki ro'yxatdan o'ting.
                </p>

                {isRegistering ? (
                  /* REGISTRATION FORM */
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block">To'liq ism-sharifingiz <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400"><User className="w-4 h-4" /></span>
                          <input
                            type="text"
                            required
                            className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full pl-9 pr-3 py-2 text-xs font-semibold"
                            placeholder="Masalan: Umidjon Egamov"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block font-sans">Telefon raqamingiz <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400"><Phone className="w-4 h-4" /></span>
                          <input
                            type="text"
                            required
                            className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full pl-9 pr-3 py-2 text-xs font-semibold"
                            placeholder="+998 (93) 123-45-67"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Pasport seriyasi va raqami <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400"><FileText className="w-4 h-4" /></span>
                          <input
                            type="text"
                            required
                            maxLength={9}
                            className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full pl-9 pr-3 py-2 text-xs font-semibold font-mono placeholder:font-sans"
                            placeholder="Masalan: AA1234567"
                            value={passport}
                            onChange={(e) => setPassport(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Parol kiriting <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></span>
                          <input
                            type="password"
                            required
                            className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full pl-9 pr-3 py-2 text-xs font-semibold"
                            placeholder="🔒 Kamida 6 ta belgi"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1 bg-slate-50 px-2.5 rounded border border-slate-200">
                      <input
                        type="checkbox"
                        id="tg-notify"
                        checked={telegramNotificationEnabled}
                        onChange={(e) => setTelegramNotificationEnabled(e.target.checked)}
                        className="rounded border-slate-350 text-cyan-600 focus:ring-cyan-500"
                      />
                      <label htmlFor="tg-notify" className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
                        <Bell className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        Telegram bot orqali bildirishnoma olish (@dstoma_bot)
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRegistering(false)}
                        className="text-xs text-cyan-600 hover:underline font-bold"
                      >
                        Menda allaqachon hisob bor
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Ro'yxatdan O'tish
                      </button>
                    </div>
                  </form>
                ) : (
                  /* LOGIN FORM */
                  <form onSubmit={handleLogin} className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Pasport seriyasi (Tizimga kirish uchun)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400"><FileText className="w-4 h-4" /></span>
                          <input
                            type="text"
                            required
                            className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full pl-9 pr-3 py-2 text-xs font-semibold"
                            placeholder="AA1234567"
                            value={passport}
                            onChange={(e) => setPassport(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Paroliuz</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></span>
                          <input
                            type="password"
                            required
                            className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full pl-9 pr-3 py-2 text-xs font-semibold"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setIsRegistering(true)}
                        className="text-xs text-cyan-600 hover:underline font-bold"
                      >
                        Yangi hisob ochish (Ro'yxatdan o'tish)
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Kirish
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ONLINE QUEUE BOOKING FORM */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Ticket className="text-cyan-600 w-4.5 h-4.5" /> Onlayn Navbatga Yozilish
            </h3>
            {selectedClinic?.subscriptionStatus === 'suspended' ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
                <div className="p-3 bg-rose-105 bg-rose-100 text-rose-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Ushbu filial bloklangan holatda!</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Yillik/oylik ijara to'lovi amalga oshirilmaganligi sababli, <strong>{selectedClinic.name}</strong> onlayn elektron navbat tizimi vaqtincha va'da berilgan limitlar bo'yicha cheklangan.
                </p>
                <div className="text-[10px] text-rose-700 bg-rose-100/60 px-2.5 py-1.5 rounded-lg inline-block font-sans font-semibold">
                  Iltimos, klinika rahbariyatiga dastur litsenziyasini yangilash haqida eslatib o'ting.
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Yo'nalishingiz va shifokorni tanlab "Navbat olish" tugmasini bosing. Sizga elektron chipta raqami beriladi.
                </p>

                <form onSubmit={handleBookQueue} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Shifokor tanlang <span className="text-rose-500">*</span></label>
                    <select
                      required
                      value={bookingDoctorId}
                      onChange={(e) => setBookingDoctorId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full px-3 py-2 text-xs font-medium text-slate-700"
                    >
                      <option value="">-- Shifokorlarni tanlang --</option>
                      {clinicDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} - {doc.specialty} ({doc.status === 'idle' ? '🟢 Bo\'sh' : doc.status === 'busy' ? '🔴 Band' : '🟡 Yo\'q'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Klinika taqdim etadigan xizmat <span className="text-rose-500">*</span></label>
                    <select
                      required
                      value={bookingServiceId}
                      onChange={(e) => setBookingServiceId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full px-3 py-2 text-xs font-medium text-slate-700"
                    >
                      <option value="">-- Xizmat turini tanlang --</option>
                      {clinicServices.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} - {srv.price.toLocaleString('uz-UZ')} UZS
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Warnings and details */}
                  <div className="bg-cyan-50 border border-cyan-150 p-3.5 rounded-xl text-[11px] text-cyan-700 leading-snug space-y-1">
                    <p className="font-bold flex items-center gap-1 text-cyan-800">
                      <Sparkles className="w-3.5 h-3.5" /> Muhim ma'lumot:
                    </p>
                    <p>Ushbu chipta faol {selectedClinic?.name || 'klinika'} uchun amal qiladi.</p>
                    <p>Filialga borgach, chiptani PWA mobil ilovangiz orqali yoki shaxsiy kabinetda ko'rsatishingiz kifoya.</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-2.5 text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Let's Queue! Navbat Olish
                  </button>
                </form>
              </>
            )}
          </div>

        </div>

        {/* Right Column: Active Queue Tickets & Interactive Ticket Counter */}
        <div className="md:col-span-5 space-y-6">
          
          {/* USER'S PERSONAL ACTIVE TICKETS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Calendar className="text-cyan-600 w-4.5 h-4.5" /> Faol Chiptalaringiz
            </h3>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Kabinetga kirsangiz, barcha navbatlaringiz real-vaqtda shu yerda ko'rinadi (Har 10 soniyada avto-yangilanadi).
            </p>

            <div className="space-y-4">
              {myClinicQueues.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Hozirda hech qanday faol navbatingiz yo'q.</p>
                </div>
              ) : (
                myClinicQueues.map((item) => {
                  const doc = getDoctorInfo(item.doctorId);
                  const srv = getServiceInfo(item.serviceId);
                  
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border relative overflow-hidden bg-white ${
                        item.status === 'calling'
                          ? 'border-emerald-200 ring-2 ring-emerald-500/20'
                          : item.status === 'completed'
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Status indicator banner */}
                      <div className={`px-3 py-1 font-sans text-[10px] font-bold text-white flex justify-between items-center ${
                          item.status === 'calling'
                            ? 'bg-emerald-500 animate-pulse'
                            : item.status === 'completed'
                            ? 'bg-slate-400'
                            : 'bg-cyan-600'
                        }`}
                      >
                        <span>{item.status === 'calling' ? '🔊 SIZNI CHAQIRISHYAPTI' : item.status === 'completed' ? '✓ TUGATILGAN' : 'KUTILMOQDA'}</span>
                        <span className="font-mono">{new Date(item.createdAt).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>

                      <div className="p-4 flex gap-3">
                        <div className="p-3 bg-slate-100 text-slate-800 border border-slate-200 font-mono font-extrabold text-lg rounded-xl flex flex-col items-center justify-center h-14 w-14 shrink-0">
                          <span className="text-[9px] uppercase text-slate-400 tracking-wider">No</span>
                          {item.number}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-400">Shifokor:</h4>
                          <h3 className="text-xs font-bold text-slate-800 leading-tight mb-1">{doc?.name || 'Stomatolog'}</h3>
                          <p className="text-[11px] text-slate-500 leading-snug">{srv?.name || 'Klinika xizmati'}</p>
                          <p className="text-xs font-extrabold text-cyan-600 mt-1">{srv?.price.toLocaleString('uz-UZ')} UZS</p>
                        </div>
                      </div>

                      {/* Doctor rating mechanism inside queue */}
                      {item.status === 'completed' && !item.rating && (
                        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 flex flex-col gap-1.5">
                          <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                            ⭐️ Shifokorni baholang:
                          </p>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => onUpdateDoctorRating(item.id, star)}
                                className="text-xl text-amber-400 hover:scale-125 hover:text-amber-500 transition-all focus:outline-none"
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.status === 'completed' && item.rating && (
                        <div className="px-4 py-2 bg-slate-100 text-[10px] text-slate-400 font-bold border-t border-slate-200 flex items-center gap-1">
                          Siz qoldirgan baho: {Array.from({ length: item.rating }).map((_, i) => '★')} ({item.rating} / 5)
                        </div>
                      )}

                      {/* Cancel feature */}
                      {item.status === 'pending' && (
                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                          <button
                            onClick={() => {
                              onCancelQueue(item.id);
                              showToast("Navbatingiz muvaffaqiyatli bekor qilindi", "error");
                            }}
                            className="text-[10px] text-rose-600 hover:underline font-extrabold focus:outline-none"
                          >
                            Navbatni bekor qilish ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TELEGRAM NOTIFICATION SYSTEM PREVIEW */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-slate-100 border-l border-slate-200/50 flex items-center justify-center">
              <span className="text-5xl opacity-40">🤖</span>
            </div>
            
            <div className="relative z-10 pr-12">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Telegram Telegram Integration</span>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping"></span> 
                Smart Telegram Bot hamroh
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-1 max-w-xs">
                Sizning navbatingizga <strong>2 kishi</strong> qolganda @dstoma_bot sizga avtomatik xabar yuboradi:
              </p>
              
              <div className="bg-white p-3 rounded-xl border border-slate-200 mt-3 text-xs leading-normal font-mono text-slate-600 shadow-sm">
                <span className="text-sky-500 font-bold">@dstoma_bot:</span> Diqqat! Hurmatli {currentUser ? currentUser.fullName : 'Siz'}, {selectedClinic?.name || 'klinika'}dagi {bookingDoctorId ? getDoctorInfo(bookingDoctorId)?.name : 'Umidjon Egamov'} navbatingizga oz fursat qoldi!
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
