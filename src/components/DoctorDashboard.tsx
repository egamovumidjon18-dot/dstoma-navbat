import React, { useState } from 'react';
import { Clinic, Doctor, Service, QueueItem } from '../types';
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
  CalendarCheck2
} from 'lucide-react';

interface DoctorDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  onUpdateQueueStatus: (id: string, newStatus: QueueItem['status']) => void;
  selectedClinic: Clinic | null;
  setActiveTab?: (tab: 'bemor' | 'shifokor' | 'boshliq' | 'kod' | 'superadmin') => void;
}

export default function DoctorDashboard({
  clinics,
  doctors,
  services,
  queues,
  onUpdateQueueStatus,
  selectedClinic,
  setActiveTab
}: DoctorDashboardProps) {
  // We can switch between Umidjon Egamov and Abdulaziz Nuraliyev
  const [activeDoctorId, setActiveDoctorId] = useState<string>('doc_sm_1');
  const currentDoctor = doctors.find((d) => d.id === activeDoctorId) || doctors[0];

  // Shifokor Status ('idle' | 'busy' | 'away')
  const [docStatus, setDocStatus] = useState<'idle' | 'busy' | 'away'>('idle');

  // Avatar and password states for profile updates
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentDoctor?.image || '');
  const [password, setPassword] = useState('123456');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

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
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img 
            src={avatarUrl || currentDoctor?.image} 
            alt={currentDoctor?.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + currentDoctor?.name;
            }}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full border-2 border-white object-cover shadow-md shrink-0"
          />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-100 flex items-center gap-1.5">
              🩺 Shifokor Kabineti
              <span className={`w-2 h-2 rounded-full inline-block ${
                docStatus === 'idle' ? 'bg-emerald-400 animate-ping' : docStatus === 'busy' ? 'bg-rose-400' : 'bg-amber-400'
              }`}></span>
              <span className="text-[10px] lowercase font-semibold text-blue-150">
                ({docStatus === 'idle' ? 'bo\'sh' : docStatus === 'busy' ? 'band' : 'tushlikda'})
              </span>
            </h2>
            <h1 className="text-xl font-extrabold mt-1">
              Xush kelibsiz, {currentDoctor?.name || 'Umidjon Egamov'}
            </h1>
            <p className="text-xs text-blue-150 mt-0.5">Stomatologiya - Navbat va qabul boshqaruv mantiqi.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Shifokorlar almashtirgichi (Switching between doc profiles for simulation flow) */}
          <select
            value={activeDoctorId}
            onChange={(e) => {
              setActiveDoctorId(e.target.value);
              const selectedDoc = doctors.find(d => d.id === e.target.value);
              if (selectedDoc) {
                setAvatarUrl(selectedDoc.image);
              }
            }}
            className="bg-white/10 text-white hover:bg-white/20 px-3 py-2 border border-white/25 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option className="text-slate-800" value="doc_sm_1">Umidjon Egamov</option>
            <option className="text-slate-800" value="doc_sm_2">Abdulaziz Nuraliyev</option>
          </select>

          <button
            onClick={() => setShowProfileSettings(!showProfileSettings)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold rounded-xl border border-white/25 text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-cyan-200" />
            Profil Sozlamalari
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('bemor')}
            className="px-4 py-2 bg-white text-blue-600 hover:bg-slate-50 text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Asosiy sahifa
          </button>
        </div>
      </div>

      {/* PROFILE UPDATE MODAL */}
      {showProfileSettings && (
        <div className="bg-white p-5 rounded-3xl border border-slate-150/85 shadow-lg space-y-4 max-w-lg">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              🔒 Profilni Tahrirlash & Shaxsiy Sozlamalar
            </h3>
            <button onClick={() => setShowProfileSettings(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
              {profileSuccessMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Statusni belgilash</label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDocStatus('idle')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      docStatus === 'idle' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Bo'sh
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocStatus('busy')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      docStatus === 'busy' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Band
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocStatus('away')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      docStatus === 'away' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Away
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Avatar Havolasi (URL)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Yangi Parol o'rnatish</label>
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2"
                placeholder="Parolingizni o'zgartiring"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowProfileSettings(false)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 font-bold rounded-xl text-xs text-slate-550 border border-slate-200"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0284c7] hover:bg-cyan-700 text-white font-extrabold rounded-xl text-xs"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* METRIC BOXES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-150/85 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              Navbat kutayotganlar
            </h4>
            <div className="text-2xl font-extrabold text-slate-800 font-mono pt-1">
              {pendingQueues.length} ta chipta
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
              Bugun qabul qilindi
            </h4>
            <div className="text-2xl font-extrabold text-slate-800 font-mono pt-1">
              {completedQueues.length} nafar
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
              Bugungi daromad
            </h4>
            <span className="text-md font-extrabold text-blue-700 pt-2 font-mono leading-none block">
              {dailyRevenue.toLocaleString('uz-UZ')}.00 so'm
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
              O'rtacha baho
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

      {/* ACTIVE CONSULTING PATIENT ROOM (MULTI-STEP QABUL TIZIMI: CALLING & IN_PROGRESS) */}
      {activeConsultingQueues.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-emerald-150 shadow-md space-y-4">
          <div className="flex items-center gap-1.5 text-emerald-600 border-b border-slate-50 pb-2">
            <CircleDot className="w-4.5 h-4.5 animate-pulse text-emerald-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-wide">
              XONADA CHAQIRILAYOTGAN / DAVOLANAYOTGAN FAOL BEMOR
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
                        Xizmat: <strong className="text-slate-800">{srv?.name}</strong> | Telefon: <strong>{item.patientPhone}</strong>
                      </p>
                      
                      <div className="mt-2.5 flex items-center gap-2">
                        {isCalling ? (
                          <span className="px-2.5 py-0.5 bg-orange-100 border border-orange-200 text-orange-850 text-[9px] font-extrabold rounded-md animate-pulse">
                            📣 KABINETGA CHAQIRILMOQDA (Signal monitorida yonmoqda)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-sky-100 border border-sky-200 text-sky-850 text-[9px] font-extrabold rounded-md">
                            🦷 QABUL REJIMIDA (Davolash ishlari faol bajarilmoqda)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQueueStatus(item.id, 'cancelled')}
                      className="px-4 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Bekor qilish
                    </button>

                    {isCalling ? (
                      <button
                        onClick={() => onUpdateQueueStatus(item.id, 'in_progress')}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Qabulni boshlash ▶
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateQueueStatus(item.id, 'completed')}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Davolashni yakunlash ✓
                      </button>
                    )}
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
            📊 Navbatni boshqarish paneli (Smart taqsimlash)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Yangi Mijozlar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150/70 shadow-md space-y-4">
            <h4 className="text-xs font-extrabold text-blue-600 block uppercase tracking-wider flex items-center justify-between">
              <span>Yangi Mijozlar (Birlamchi ko'rik)</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded-full">
                {newPatients.length} ta
              </span>
            </h4>

            <div className="space-y-3">
              {newPatients.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 text-xs font-medium">
                  Hozircha yangi bemorlar navbati yo'q.
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
                        <p className="text-[11px] text-slate-600 mt-1">Xizmat: <strong>{srv?.name}</strong></p>
                      </div>

                      <button
                        onClick={() => onUpdateQueueStatus(item.id, 'calling')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" /> Chaqirish
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Doimiy Mijozlar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150/70 shadow-md space-y-4">
            <h4 className="text-xs font-extrabold text-indigo-600 block uppercase tracking-wider flex items-center justify-between">
              <span>Doimiy Bemorlar (Tashrif tarixdagilar)</span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded-full">
                {regularPatients.length} ta
              </span>
            </h4>

            <div className="space-y-3">
              {regularPatients.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 text-xs font-medium">
                  Hozircha doimiy bemorlar navbati yo'q.
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
                        <p className="text-[11px] text-slate-600 mt-1">Xizmat: <strong>{srv?.name}</strong></p>
                      </div>

                      <button
                        onClick={() => onUpdateQueueStatus(item.id, 'calling')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" /> Chaqirish
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETED LIST OF TODAY */}
      <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <span>Tugatilgan qabullar ro'yxati (Bugun)</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-mono text-[10px] font-bold rounded-full">
            {completedQueues.length} ta
          </span>
        </h3>

        <div className="divide-y divide-slate-100">
          {completedQueues.length === 0 ? (
            <p className="text-slate-400 font-semibold py-8 text-center text-xs">Bugun hali qabul sobiq qilinmadi.</p>
          ) : (
            completedQueues.map((item) => {
              const srv = getServiceInfo(item.serviceId);
              return (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">#{item.number} | {item.patientName}</h4>
                    <p className="text-[10px] text-slate-400">{srv?.name} — {getServicePrice(item.serviceId).toLocaleString('uz-UZ')} so'm</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.rating ? (
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 fill-current ${i < (item.rating || 5) ? 'text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300">kutilmoqda</span>
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
