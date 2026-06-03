import React, { useState, useEffect } from 'react';
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
  Shield, 
  Lock, 
  Building 
} from 'lucide-react';

interface DoctorDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  onUpdateQueueStatus: (id: string, newStatus: QueueItem['status']) => void;
  selectedClinic: Clinic | null;
}

export default function DoctorDashboard({
  clinics,
  doctors,
  services,
  queues,
  onUpdateQueueStatus,
  selectedClinic
}: DoctorDashboardProps) {
  // Let the doctor choose which clinic workspace they are logging into
  const [localClinicId, setLocalClinicId] = useState<string>(selectedClinic?.id || 'samarqand');
  const [activeDoctorId, setActiveDoctorId] = useState<string>('');

  // Sync with prop if it changes
  useEffect(() => {
    if (selectedClinic) {
      setLocalClinicId(selectedClinic.id);
    }
  }, [selectedClinic]);

  // Find current clinic object from state (or props)
  const currentClinic = clinics.find(c => c.id === localClinicId) || clinics[0];

  // Get active doctors listed in selected clinic
  const clinicDoctors = doctors.filter((d) => d.clinicId === localClinicId);

  // Set default doctor on clinic change
  useEffect(() => {
    if (clinicDoctors.length > 0) {
      setActiveDoctorId(clinicDoctors[0].id);
    } else {
      setActiveDoctorId('');
    }
  }, [localClinicId, doctors]); // Run when clinic changes or doctor list updates

  const currentDoctor = doctors.find((d) => d.id === activeDoctorId);

  // Filter queues belonging to this doctor and clinic
  const doctorQueues = queues.filter(
    (q) => q.clinicId === localClinicId && q.doctorId === activeDoctorId
  );

  const pendingQueues = doctorQueues.filter((q) => q.status === 'pending');
  const callingQueues = doctorQueues.filter((q) => q.status === 'calling');
  const completedQueues = doctorQueues.filter((q) => q.status === 'completed');

  // Compute daily stats for this doctor
  const totalCompleted = completedQueues.length;
  
  const getServicePrice = (sId: string) => {
    const srv = services.find((s) => s.id === sId);
    return srv ? srv.price : 0;
  };

  const dailyRevenue = completedQueues.reduce((sum, item) => sum + getServicePrice(item.serviceId), 0);
  
  // Calculate specific average rating
  const ratedQueues = completedQueues.filter((q) => q.rating !== undefined);
  const avgRating =
    ratedQueues.length > 0
      ? ratedQueues.reduce((sum, q) => sum + (q.rating || 0), 0) / ratedQueues.length
      : currentDoctor?.rating || 4.7;

  return (
    <div id="doctor-dashboard-root" className="space-y-6">
      {/* 1. Selector banner for Multi-Tenant Clinic Workspace */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-100 text-cyan-600 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Shifokor Ishchi Kabineti (Tenant Portal)</h3>
            <p className="text-xs text-slate-500">
              Tanlangan klinika: <strong className="text-cyan-700">{currentClinic.name}</strong> 
              {currentClinic.ownerName && <span className="text-slate-400"> (Egasi: {currentClinic.ownerName})</span>}
            </p>
          </div>
        </div>

        {/* Double selector: Select Clinic first, then select Doctor */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Clinic Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider shrink-0">Filial:</label>
            <select
              value={localClinicId}
              onChange={(e) => setLocalClinicId(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-40"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider shrink-0">Shifokor:</label>
            <select
              value={activeDoctorId}
              onChange={(e) => setActiveDoctorId(e.target.value)}
              disabled={clinicDoctors.length === 0}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-48"
            >
              {clinicDoctors.length === 0 ? (
                <option>Xodimlar yo'q</option>
              ) : (
                clinicDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialty})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Check if selected Clinic is Locked/Suspended due to unsubmitted SaaS Rent */}
      {currentClinic.subscriptionStatus === 'suspended' ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-650 rounded-full flex items-center justify-center mx-auto shadow-inner border border-rose-100">
            <Lock className="w-8 h-8 text-rose-600" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            Dastur to'lovi amalga oshirilmagan!
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hurmatli shifokor, <strong className="text-slate-800">{currentClinic.name}</strong> klinikasining oylik dastur litsenziya ijara to'lovi muddati tugaganligi sababli, boshqaruv paneli vaqtinchalik muzlatilgan. 
          </p>
          <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-550 border border-slate-150 inline-block">
            Iltimos, klinika rahbari <strong>{currentClinic.ownerName}</strong> ga xabar bering yoki <strong>"Boss Dashboardi (Boshliq)"</strong> bo'limiga o'tib ijara litsenziyasini uzaytiring.
          </div>
        </div>
      ) : currentDoctor ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left Panel: Stats and Profile Detail */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Profile */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div className="relative w-23 h-23 mx-auto mb-3">
                <img
                  referrerPolicy="no-referrer"
                  src={currentDoctor.image}
                  alt={currentDoctor.name}
                  className="w-full h-full rounded-2xl object-cover border-2 border-cyan-500 shadow-sm"
                />
                <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                  currentDoctor.status === 'idle' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}></span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">{currentDoctor.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{currentDoctor.specialty}</p>

              <div className="grid grid-cols-2 gap-2 text-left pt-3.5 border-t border-slate-150">
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Status</span>
                  <span className="text-xs font-bold text-cyan-600">
                    {currentDoctor.status === 'idle' ? '🟢 Bo\'sh' : '🔴 Band'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Navbatlar</span>
                  <span className="text-xs font-bold text-slate-700">{completedQueues.length + pendingQueues.length} ta bugun</span>
                </div>
              </div>
            </div>

            {/* Daily Doctor Analytics */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Kunlik Ish Hisoboti</h3>
              
              <div className="space-y-4">
                {/* Patients Treated row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><Users className="w-4 h-4" /></div>
                    <span className="text-xs font-semibold text-slate-600">Qabul qilinganlar</span>
                  </div>
                  <strong className="text-slate-800 text-sm font-mono">{totalCompleted} kishi</strong>
                </div>

                {/* Patient Rating row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Star className="w-4 h-4" /></div>
                    <span className="text-xs font-semibold text-slate-600">O'rtacha reyting</span>
                  </div>
                  <strong className="text-slate-800 text-sm font-sans flex items-center gap-1">★ {avgRating.toFixed(1)}</strong>
                </div>

                {/* Day Profit row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-50 text-cyan-500 rounded-lg"><DollarSign className="w-4 h-4" /></div>
                    <span className="text-xs font-semibold text-slate-600">Kunlik daromad</span>
                  </div>
                  <strong className="text-cyan-700 text-xs font-extrabold">{dailyRevenue.toLocaleString('uz-UZ')} UZS</strong>
                </div>
              </div>
              
              <div className="bg-cyan-50/50 p-3 rounded-lg border border-cyan-100 text-[10px] text-cyan-700 leading-normal mt-5">
                👨‍⚕️ Hisobot va daromadlar klinika tomonidan xizmat narxlariga qarab avtomatik hisoblab boriladi. Begona shifobaxsh ma'lumotlar butunlay yashirin.
              </div>
            </div>

          </div>

          {/* Right Panel: Call Patients & Current Treatment Queues */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Treatment Console: ACTIVE CALLING SECTION */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-extrabold text-emerald-500 tracking-wider flex items-center gap-1 uppercase mb-1">
                <Clock className="w-4 h-4 animate-spin" /> CHAQIRILAYOTGAN HOZIRGI BEMOR
              </span>
              <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Faol Qabul Karusel</h3>

              {callingQueues.length === 0 ? (
                <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Play className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium">Hozirda shifokor xonasiga birorta ham bemor chaqirilmagan.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Pastdagi kutayotganlar ro'yxatidan "Chaqirish" tugmasini bosing.</p>
                </div>
              ) : (
                callingQueues.map((item) => {
                  const srv = services.find((s) => s.id === item.serviceId);
                  return (
                    <div key={item.id} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-600 text-white font-mono font-bold text-xl rounded-xl">
                          #{item.number}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-900">{item.patientName}</h4>
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                            Xona ichida / Davolash jarayonida
                          </span>
                          <p className="text-xs text-emerald-700 mt-1">Xizmat: <strong>{srv?.name}</strong></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onUpdateQueueStatus(item.id, 'cancelled')}
                          className="px-3 py-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Bekor qilish
                        </button>
                        <button
                          onClick={() => onUpdateQueueStatus(item.id, 'completed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Davolashni tugatish
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Waiting list */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex justify-between items-center">
                <span>Navbat Kutayotgan Bemorlar Ro'yxati</span>
                <span className="text-xs bg-cyan-100 text-cyan-700 font-bold px-2 py-0.5 rounded-full">
                  {pendingQueues.length} ta navbatda
                </span>
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Tizim har bir navbatni 10 soniyada yangilab turadi va navbatingiz kelgan bemorga SMS/Telegram orqali eslatma yuboriladi.
              </p>

              <div className="space-y-3">
                {pendingQueues.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-slate-100 rounded-xl text-center text-slate-400">
                    Kutayotgan navbatlar ro'yxati hozircha bo'sh.
                  </div>
                ) : (
                  pendingQueues.map((item) => {
                    const srv = services.find((s) => s.id === item.serviceId);
                    return (
                      <div key={item.id} className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-4 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="py-1.5 px-3 bg-white border border-slate-200 text-slate-800 font-mono font-bold text-sm rounded-lg shadow-2xs">
                            #{item.number}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{item.patientName}</h4>
                            <p className="text-[11px] text-slate-500 font-sans mt-0.5">📞 {item.patientPhone}</p>
                            <p className="text-[11px] text-slate-600 font-medium">Davolash yo'nalishi: <strong>{srv?.name}</strong></p>
                          </div>
                        </div>

                        <button
                          onClick={() => onUpdateQueueStatus(item.id, 'calling')}
                          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Chaqirish
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 bg-white border rounded-2xl">
          Klinika uchun ro'yxatdan o'tgan shifokorlar mavjud emas.
        </div>
      )}
    </div>
  );
}
