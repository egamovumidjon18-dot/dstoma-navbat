import React, { useState } from 'react';
import { Clinic, Doctor, Service, QueueItem } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award, 
  ShieldCheck, 
  ArrowUpRight, 
  Activity, 
  Filter, 
  Home, 
  Lock, 
  Unlock, 
  CreditCard, 
  Layers, 
  Settings, 
  Plus, 
  UsersRound, 
  AlertTriangle,
  Coins
} from 'lucide-react';

interface DirectorDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  onUpdateClinicSubscription?: (clinicId: string, status: 'active' | 'suspended' | 'trial', nextDueDate: string) => void;
  onToggleClinicStatus?: (clinicId: string) => void;
}

export default function DirectorDashboard({
  clinics,
  doctors,
  services,
  queues,
  onUpdateClinicSubscription,
  onToggleClinicStatus
}: DirectorDashboardProps) {
  // Local state to simulate tenant updating if the parent didn't provide callbacks
  const [localClinics, setLocalClinics] = useState<Clinic[]>(clinics);
  
  // Tab-specific role selector:
  // 'boss' = Clinica bossi (isolated tenant view)
  // 'saas_admin' = SaaS System Owner (Umidjon Egamov - landlord/host portal)
  const [userRole, setUserRole] = useState<'boss' | 'saas_admin'>('boss');
  
  // In 'boss' mode, which clinic do you own/run? Only that clinic's data is visible
  const [selectedBossClinicId, setSelectedBossClinicId] = useState<string>('samarqand');

  const updateClinicLocal = (cId: string, newStatus: 'active' | 'suspended' | 'trial', newDate: string) => {
    setLocalClinics(prev => prev.map(c => {
      if (c.id === cId) {
        return { ...c, subscriptionStatus: newStatus, nextPaymentDate: newDate };
      }
      return c;
    }));
    if (onUpdateClinicSubscription) {
      onUpdateClinicSubscription(cId, newStatus, newDate);
    }
  };

  const toggleClinicActiveLocal = (cId: string) => {
    setLocalClinics(prev => prev.map(c => {
      if (c.id === cId) {
        const current = c.subscriptionStatus || 'active';
        const next: 'active' | 'suspended' | 'trial' = current === 'suspended' ? 'active' : 'suspended';
        return { ...c, subscriptionStatus: next };
      }
      return c;
    }));
    if (onToggleClinicStatus) {
      onToggleClinicStatus(cId);
    }
  };

  // Get active clinics list
  const currentClinics = localClinics;

  const getServicePrice = (sId: string) => {
    const srv = services.find((s) => s.id === sId);
    return srv ? srv.price : 0;
  };

  // 1. Calculations for Boss Mode (Isolated Clinic Tenant)
  const activeBossClinic = currentClinics.find(c => c.id === selectedBossClinicId) || currentClinics[0];
  const bossQueues = queues.filter(q => q.clinicId === selectedBossClinicId);
  const bossDoctors = doctors.filter(d => d.clinicId === selectedBossClinicId);
  const bossServices = services.filter(s => s.clinicId === selectedBossClinicId);

  const bossTotalCompleted = bossQueues.filter((q) => q.status === 'completed').length;
  const bossTotalActive = bossQueues.filter((q) => q.status === 'calling' || q.status === 'pending').length;
  const bossRevenue = bossQueues
    .filter((q) => q.status === 'completed')
    .reduce((sum, item) => sum + getServicePrice(item.serviceId), 0);

  const ratedBossQueues = bossQueues.filter((q) => q.status === 'completed' && q.rating !== undefined);
  const bossAverageRating = ratedBossQueues.length > 0 
    ? ratedBossQueues.reduce((sum, q) => sum + (q.rating || 0), 0) / ratedBossQueues.length 
    : 4.8;

  // Rent Payment Handler for the Boss of a clinic
  const [payingStatus, setPayingStatus] = useState<string>('');
  const handlePayRent = (cId: string) => {
    setPayingStatus('Processing...');
    setTimeout(() => {
      const nextMonthDate = new Date();
      nextMonthDate.setDate(nextMonthDate.getDate() + 30);
      const outputDateStr = nextMonthDate.toISOString().split('T')[0];
      
      updateClinicLocal(cId, 'active', outputDateStr);
      setPayingStatus('Muvaffaqiyatli to\'landi! Ijara portali faollashtirildi.');
      setTimeout(() => setPayingStatus(''), 4000);
    }, 1200);
  };

  // 2. Calculations for SaaS Provider Mode (Google Owner/Umidjon Egamov View)
  const totalSaaSClinics = currentClinics.length;
  const activeSaaSClinicsCount = currentClinics.filter(c => c.subscriptionStatus !== 'suspended').length;
  
  // Monthly rents collected (MRR)
  const totalMRR = currentClinics
    .filter(c => c.subscriptionStatus !== 'suspended')
    .reduce((sum, c) => sum + (c.rentalPrice || 0), 0);

  // Overall database metrics
  const totalCompletedAllClinics = queues.filter((q) => q.status === 'completed').length;
  const totalOverallRevenue = queues
    .filter((q) => q.status === 'completed')
    .reduce((sum, item) => sum + getServicePrice(item.serviceId), 0);

  return (
    <div id="director-dashboard-root" className="space-y-6 animate-fade-in">
      
      {/* SaaS Architecture Context Explanation Banner for Uzbekistan Market */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-slate-800 text-white p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 bg-[radial-gradient(circle_at_right,rgba(6,182,212,0.4),transparent_50%5)] pointer-events-none"></div>
        <div>
          <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            SAAS MULTI-TENANT RENTAL MODEL (O'ZBEKISTON)
          </span>
          <h2 className="text-base font-extrabold text-slate-100 mt-1.5 flex items-center gap-1.5">
            🏢 DStoma - Har bir klinika uchun alohida raqamli panel!
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-3xl">
            Siz ushbu tayyor elektron navbat dasturini butun O'zbekistondagi klinikalarga <strong className="text-cyan-400">oylik ijara (subscription)</strong> ko'rinishida berasiz. Har bir klinika xaridorlari, shifokorlari, xizmatlari va moliya hisobotlari <strong className="text-cyan-300">bir-biridan mutlaqo ajratilgan (izolatsiya qilingan)</strong>. Quyidagi datchikda ijarachilar boshqaruvi va klinika bosslarining alohida panellarini sinab ko'ring.
          </p>
        </div>

        {/* Dynamic ROLE Switcher simulating real multi-tenant entry */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Tizimga kirish roli:</span>
            
            <button
              onClick={() => setUserRole('boss')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                userRole === 'boss'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              💼 Klinika Bossi & Rahbari
            </button>

            <button
              onClick={() => setUserRole('saas_admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                userRole === 'saas_admin'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-755'
              }`}
            >
              👑 SaaS Tizim Egasi (Umidjon Egamov - Siz)
            </button>
          </div>

          {/* If Clinica Boss mode, selector for which clinic's boss is logged in */}
          {userRole === 'boss' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Klinika egasini almashtirish:</span>
              <select
                value={selectedBossClinicId}
                onChange={(e) => setSelectedBossClinicId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-cyan-400 font-bold text-xs py-1 px-2.5 rounded-lg focus:outline-none"
              >
                {currentClinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} Bossi {c.ownerName ? `(${c.ownerName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ==================== 1. CLINICA BOSS VIEW (MUTLAQO ALOHIDA IZOLATSIYA) ==================== */}
      {userRole === 'boss' && (
        <div className="space-y-6">
          {/* Tenant Info bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-cyan-100 text-cyan-800 border border-cyan-200 font-extrabold font-mono px-1.5 py-0.5 rounded">
                  ISOLATED CLINIC PORTAL
                </span>
                <span className="text-xs text-slate-400 font-semibold">| Subdomen:</span>
                <span className="text-xs font-bold font-mono text-cyan-600">{activeBossClinic.subdomain}.dstoma.uz</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-1.5">
                {activeBossClinic.name} — Boshqaruv Ofisi (Direktor Paneli)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Klinika rahbari: <strong className="text-slate-700">{activeBossClinic.ownerName || 'Noma\'lum'}</strong>. Ushbu panelda begona klinikalar ma'lumotlari ko'rinmaydi.
              </p>
            </div>

            {/* Rental Status display */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center gap-3.5 w-full md:w-auto">
              <div className="p-2.5 bg-cyan-100/50 text-cyan-700 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none">IJARA STATUSI (OYLIK)</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    activeBossClinic.subscriptionStatus === 'active' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                      : activeBossClinic.subscriptionStatus === 'trial'
                      ? 'bg-blue-105 bg-cyan-50 text-cyan-700 border border-cyan-150'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {activeBossClinic.subscriptionStatus === 'active' ? '● FAOL (To\'langan)' : activeBossClinic.subscriptionStatus === 'trial' ? '● SINOV MUDDATI' : '● FAOLSIZLANTIRILGAN'}
                  </span>
                  <span className="text-xs font-bold text-slate-600 font-mono">
                    {activeBossClinic.rentalPrice?.toLocaleString('uz-UZ')} UZS
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Muddati: {activeBossClinic.nextPaymentDate} gacha</span>
              </div>
            </div>
          </div>

          {/* Tenant check if rental is expired/suspended */}
          {activeBossClinic.subscriptionStatus === 'suspended' ? (
            <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                Kirish bloklandi - Foydalanish muddati tugagan!
              </h3>
              <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                Afsuski <strong className="text-rose-600">{activeBossClinic.name}</strong> klinikasining oylik dastur litsenziyasi tugagan yoki to'lov o'z vaqtida amalga oshirilmagan. Davom etish uchun oylik to'lovni amalga oshiring.
              </p>
              <div>
                <button
                  onClick={() => handlePayRent(activeBossClinic.id)}
                  disabled={payingStatus !== ''}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> {payingStatus || "Hozir to'lash (1.5 mln UZS - Payme/Uzum)"}
                </button>
              </div>
              {payingStatus && (
                <p className="text-xs font-semibold text-emerald-600 animate-pulse">{payingStatus}</p>
              )}
            </div>
          ) : (
            // Core Dashboard elements fully isolated
            <div className="space-y-6">
              {/* Isolated stats blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Klinika Daromadi (Kassa)</span>
                      <h3 className="text-md font-extrabold text-cyan-600 mt-1">{bossRevenue.toLocaleString('uz-UZ')} UZS</h3>
                    </div>
                    <span className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><DollarSign className="w-4.5 h-4.5" /></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block">Tashlangan cheklar asosida</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Navbatda xizmat ko'rildi</span>
                      <h3 className="text-md font-extrabold text-slate-800 mt-1">{bossTotalCompleted} bemor</h3>
                    </div>
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Users className="w-4.5 h-4.5" /></span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block">● Navbatda kutilayapti: {bossTotalActive} ta</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Shifokorlarimiz Reytingi</span>
                      <h3 className="text-md font-extrabold text-amber-500 mt-1">★ {bossAverageRating.toFixed(1)}</h3>
                    </div>
                    <span className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Award className="w-4.5 h-4.5" /></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block">{bossDoctors.length} ta umumiy shifokorlar soni</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">SaaS Litsenziya</span>
                      <h3 className="text-md font-extrabold text-slate-800 mt-1">FAOL</h3>
                    </div>
                    <span className="p-2 bg-slate-50 text-slate-500 rounded-lg"><ShieldCheck className="w-4.5 h-4.5" /></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">Keyingi to'lov: {activeBossClinic.nextPaymentDate}</span>
                </div>
              </div>

              {/* Doctors and Services separation overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Doctors List specific only to THIS tenant */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                    👨‍⚕️ SHIFOKORLAR MONITORINGI ({activeBossClinic.name})
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {bossDoctors.map(doc => {
                      const docQueues = bossQueues.filter(q => q.doctorId === doc.id);
                      const docActive = docQueues.filter(q => q.status === 'pending' || q.status === 'calling').length;
                      return (
                        <div key={doc.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img src={doc.image} alt={doc.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100 shadow-xs" referrerPolicy="no-referrer" />
                            <div>
                              <h5 className="text-xs font-bold text-slate-800">{doc.name}</h5>
                              <p className="text-[10px] text-slate-400 font-medium">{doc.specialty}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-slate-700 font-mono block">{docActive} ta kutilmoqda</span>
                            <span className="text-[10px] text-amber-500 font-semibold">★ {doc.rating.toFixed(1)} ({doc.ratingCount} baho)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Services List with UZS Pricing only for THIS tenant */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                      💰 DIAGNOSTIKA VALYUTA VA XIZMATLAR RO'YXATI
                    </h4>
                    <div className="space-y-2">
                      {bossServices.map(srv => (
                        <div key={srv.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-150">
                          <span className="text-xs font-semibold text-slate-700">{srv.name}</span>
                          <strong className="text-xs font-bold text-cyan-600 font-mono shrink-0 ml-4">{srv.price.toLocaleString('uz-UZ')} UZS</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulated Rental Upgrade and Action */}
                  <div className="bg-cyan-50 border border-cyan-150 p-4 rounded-xl text-[11px] text-cyan-700 mt-4 leading-relaxed space-y-1">
                    <p className="font-extrabold text-cyan-800 flex items-center gap-1">
                      <Settings className="w-3.5 h-3.5" /> Klinika sozlamalari & multi-tenant ajralish:
                    </p>
                    <p>Ushbu billing ma'lumotlari faqatgina Sizning <strong>{activeBossClinic.name}</strong> ma'muriyatingizga ko'rinadi. Ma'lumotlar bazasi ziddiyatsiz ishlaydi. Agar dasturni boshqa yangi klinikalarga ijaraga berishni xohlasangiz, quyidagi "Tizim Egasi" bo'limida yangi ijarachini kiritishingiz mumkin.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 2. SAAS PLATFORM EGASI VIEW (Siz - UMIDJON EGAMOV) ==================== */}
      {userRole === 'saas_admin' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                👑 SAAS PLATFORM SUPER-ADMIN
              </span>
              <h3 className="text-base font-extrabold text-slate-100 mt-2 flex items-center gap-2">
                DStoma SaaS Boshqaruv Markazi (Umidjon Egamov portali)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Butun O'zbekiston bo'yicha sizning dasturingizni oylik ijaraga olgan xususiy stomatologiya klinikalari monitoringi va moliyaviy hisobot paneli.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">UMUMIY IJARA DAROMADI (MRR)</span>
                <span className="text-base font-extrabold text-teal-400 font-mono">{totalMRR.toLocaleString('uz-UZ')} UZS / oyiga</span>
              </div>
              <span className="p-2.5 bg-teal-500/20 text-teal-400 rounded-lg"><Coins className="w-5 h-5" /></span>
            </div>
          </div>

          {/* Landlord high-level stats blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Ijarachi Klinikalar sONI</span>
              <h3 className="text-base font-extrabold text-slate-800 mt-1">{totalSaaSClinics} ta klinika</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">● Faol ijarada: {activeSaaSClinicsCount} ta</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Xizmat Qilingan Bemorlar (Global)</span>
              <h3 className="text-base font-extrabold text-slate-800 mt-1">{totalCompletedAllClinics} bemor qabul qilindi</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Barcha filiallar bo'yicha jami</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Aylanma Savdo (Klinikalar foydasi)</span>
              <h3 className="text-base font-extrabold text-cyan-600 mt-1">{totalOverallRevenue.toLocaleString('uz-UZ')} UZS</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Sizning dasturingiz orqali qilingan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase">SaaS O'rtacha Litsenziya bahosi</span>
              <h3 className="text-base font-extrabold text-slate-800 mt-1">1,733,333 UZS / oyiga</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Hozirgi barcha datchiklar bo'yicha</p>
            </div>
          </div>

          {/* Tenants Subscription leases controller */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>🗂️ JORIY IJARA TO'LOV KONTROLLERLAR VA KLINIKALAR RO'YXATI</span>
              <span className="text-[11px] text-cyan-600 normal-case">Yangi ijarachilar hisobini faollashtirish</span>
            </h4>

            {/* List of active paying clinics */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase">
                    <th className="pb-3 pr-2">Klinika nomi</th>
                    <th className="pb-3 px-2">Subdomen & Manzil</th>
                    <th className="pb-3 px-2 text-right">Oylik Ijara narxi</th>
                    <th className="pb-3 px-2">Keyingi to'lov sana</th>
                    <th className="pb-3 px-2">Klinika Boshi</th>
                    <th className="pb-3 px-2 text-center">Ijara/Litsenziya statusi</th>
                    <th className="pb-3 pl-2 text-right">Platformani bloklash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {currentClinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-slate-55 mt-2">
                      <td className="py-4 pr-2 font-bold text-slate-800">
                        <span className="mr-1.5">{clinic.logo}</span>{clinic.name}
                      </td>
                      <td className="py-4 px-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 ring-1 ring-slate-200 text-[10px] font-mono rounded select-all block w-max">
                          {clinic.subdomain}.dstoma.uz
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">{clinic.address}</span>
                      </td>
                      <td className="py-4 px-2 text-right font-bold text-slate-900 font-mono">
                        {clinic.rentalPrice?.toLocaleString('uz-UZ')} UZS
                      </td>
                      <td className="py-4 px-2 font-medium font-mono">
                        {clinic.nextPaymentDate}
                      </td>
                      <td className="py-4 px-2 font-semibold">
                        {clinic.ownerName || 'Shaxboz Ochilov'}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          clinic.subscriptionStatus === 'active' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : clinic.subscriptionStatus === 'trial'
                            ? 'bg-cyan-100 text-cyan-850 border border-cyan-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {clinic.subscriptionStatus === 'active' ? 'Faol (Ijara To\'langan)' : clinic.subscriptionStatus === 'trial' ? 'Sinovda' : 'Bloklangan/Muddati tugagan'}
                        </span>
                      </td>
                      <td className="py-4 pl-2 text-right">
                        <button
                          onClick={() => toggleClinicActiveLocal(clinic.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                            clinic.subscriptionStatus === 'suspended'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                          }`}
                        >
                          {clinic.subscriptionStatus === 'suspended' ? (
                            <span className="flex items-center justify-center gap-1"><Unlock className="w-3 h-3" /> Blokdan yechish</span>
                          ) : (
                            <span className="flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Bloklash/O'chirish</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simulated Landlord strategy alert */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-[11px] text-amber-800 mt-5 leading-normal flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-900 mb-0.5">⚠️ SaaS Bloklash / Activator Simulyatsiyasi qoidalari:</p>
                Ma'lumotlar bazasida ijarachilarni bloklasangiz, ularning boshloqlari ham, shifokorlari ham tizimdan foydalana olmaydilar (ular uchun panellar blok darchasiga kiradi). Bu sizning billing nazoratingiz haqiqiy multitenancy asosida butunlay xavfsiz va boshqaruvchan bo'lishini ta'minlaydi!
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
