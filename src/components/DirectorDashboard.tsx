import React, { useState } from 'react';
import { Clinic, Doctor, Service, QueueItem } from '../types';
import { 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Star, 
  BarChart3, 
  Calendar, 
  Plus, 
  Award, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Building, 
  Search,
  ArrowLeft,
  HeartPulse,
  ChevronDown,
  Wrench,
  Sparkles
} from 'lucide-react';

interface DirectorDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  setActiveTab?: (tab: 'bemor' | 'shifokor' | 'boshliq' | 'kod' | 'superadmin') => void;
  onAddDoctor?: (newDoc: Doctor) => void;
  onUpdateService?: (updatedService: Service) => void;
}

export default function DirectorDashboard({
  clinics,
  doctors,
  services,
  queues,
  setActiveTab,
  onAddDoctor,
  onUpdateService
}: DirectorDashboardProps) {
  
  // Tab-specific view model: 'bugun', 'haftalik', 'shifokorlar', 'sozlamalar'
  const [activeSubTab, setActiveSubTab] = useState<'bugun' | 'haftalik' | 'shifokorlar' | 'sozlamalar'>('bugun');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Doctor Creation Form States
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('Stomatolog-ortoped');
  const [newDocAvatar, setNewDocAvatar] = useState('https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop');
  const [showAddDoctorForm, setShowAddDoctorForm] = useState(false);
  const [docFeedbackMsg, setDocFeedbackMsg] = useState('');

  // Editing services in grid
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceName, setEditingServiceName] = useState('');
  const [editingServicePrice, setEditingServicePrice] = useState<number>(0);
  const [srvFeedbackMsg, setSrvFeedbackMsg] = useState('');

  // Filter lists based on Samarqand clinic (the default CEO location)
  const currentClinicId = 'samarqand';
  const clinicDoctors = doctors.filter(d => d.clinicId === currentClinicId);
  const clinicServices = services.filter(s => s.clinicId === currentClinicId);
  const clinicQueues = queues.filter(q => q.clinicId === currentClinicId);

  // Filter queues by status
  const pendingQueues = clinicQueues.filter(q => q.status === 'pending');
  const callingQueues = clinicQueues.filter(q => q.status === 'calling' || q.status === 'in_progress');
  const completedQueues = clinicQueues.filter(q => q.status === 'completed');

  // Weekly historical table data (Screenshot 7 & 8 detail)
  const weeklyReportData = [
    { dayName: 'Dushanba', dateStr: '27.05.2026', patientsCount: 5, revenue: 1100000, avgRating: 5.0 },
    { dayName: 'Seshanba', dateStr: '28.05.2026', patientsCount: 8, revenue: 2350000, avgRating: 4.8 },
    { dayName: 'Chorshanba', dateStr: '29.05.2026', patientsCount: 4, revenue: 900000, avgRating: 4.5 },
    { dayName: 'Payshanba', dateStr: '30.05.2026', patientsCount: 11, revenue: 3800000, avgRating: 4.9 },
    { dayName: 'Juma', dateStr: '31.05.2026', patientsCount: 7, revenue: 1850000, avgRating: 4.7 },
    { dayName: 'Shanba', dateStr: '01.06.2026', patientsCount: 13, revenue: 5200000, avgRating: 5.0 },
    { dayName: 'Yakshanba', dateStr: '02.06.2026', patientsCount: 2, revenue: 450000, avgRating: 4.0 }
  ];

  // Calculations for KPI Cards
  const totalCompletedToday = completedQueues.length;
  const currentWaitingCount = pendingQueues.length + callingQueues.length;
  
  const getServicePrice = (id: string) => {
    return services.find(s => s.id === id)?.price || 0;
  };

  const todayRevenue = completedQueues.reduce((sum, q) => sum + getServicePrice(q.serviceId), 0);
  const totalRegisteredPatientsCount = 205 + queues.length; // From screenshot 5 'Jami ro'yxatdagi bemorlar' is 205

  // Calculations per doctor for today's grid
  const getDocTodayStats = (docId: string) => {
    const docCompleted = completedQueues.filter(q => q.doctorId === docId);
    const docActive = pendingQueues.filter(q => q.doctorId === docId).length + callingQueues.filter(q => q.doctorId === docId).length;
    const docRevenue = docCompleted.reduce((sum, q) => sum + getServicePrice(q.serviceId), 0);
    return {
      completedCount: docCompleted.length,
      activeCount: docActive,
      revenue: docRevenue
    };
  };

  // Search filter for patients
  const searchResults = clinicQueues.filter(q => 
    q.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.patientPhone.includes(searchQuery)
  );

  // Handler for adding doctor
  const handleCreateDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) {
      setDocFeedbackMsg("Iltimos, shifokor ismini to'liq kiriting!");
      return;
    }

    const newDocObj: Doctor = {
      id: 'doc_sm_' + (doctors.length + 1),
      clinicId: currentClinicId,
      name: newDocName,
      specialty: newDocSpecialty,
      rating: 5.0,
      ratingCount: 0,
      image: newDocAvatar,
      status: 'idle'
    };

    if (onAddDoctor) {
      onAddDoctor(newDocObj);
    } else {
      // Local addition fallback
      doctors.push(newDocObj);
    }

    setNewDocName('');
    setDocFeedbackMsg("Yangi shifokor profili muvaffaqiyatli saqlandi va qabulga tayyor!");
    setTimeout(() => {
      setDocFeedbackMsg('');
      setShowAddDoctorForm(false);
    }, 3000);
  };

  // Handler for editing service prices
  const startEditingService = (srv: Service) => {
    setEditingServiceId(srv.id);
    setEditingServiceName(srv.name);
    setEditingServicePrice(srv.price);
  };

  const handleUpdateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceId || !editingServiceName || editingServicePrice <= 0) {
      setSrvFeedbackMsg("Iltimos xizmat parametrlari to'g'riligini tekshiring!");
      return;
    }

    const updatedSrv: Service = {
      id: editingServiceId,
      clinicId: currentClinicId,
      name: editingServiceName,
      price: editingServicePrice
    };

    if (onUpdateService) {
      onUpdateService(updatedSrv);
    } else {
      // Offline fallback
      const idx = services.findIndex(s => s.id === editingServiceId);
      if (idx !== -1) {
        services[idx] = updatedSrv;
      }
    }

    setEditingServiceId(null);
    setSrvFeedbackMsg("Tibbiy xizmat narxi va nomi muvaffaqiyatli tahrirlandi!");
    setTimeout(() => setSrvFeedbackMsg(''), 3000);
  };

  return (
    <div className="space-y-6 font-sans text-left">
      {/* ----------------- BANNER HEADER (SCREENSHOT 5) ----------------- */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-100">👑 Boshliq Paneli</h2>
          <h1 className="text-xl font-extrabold mt-1">
            Samarqand Filiali Boshqaruv Markazi — {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </h1>
          <p className="text-xs text-blue-150 mt-1">Sizga bog'langan klinika tarmog'ini masofadan analitika va biznes mantiqi yordamida boshqaring.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowSearchModal(true)}
            className="px-5 py-2.5 bg-blue-700/50 hover:bg-blue-700 text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all text-white cursor-pointer"
          >
            <Search className="w-4 h-4" /> Bemor qidirish
          </button>
          
          <button
            onClick={() => setActiveTab && setActiveTab('bemor')}
            className="px-5 py-2.5 bg-white text-blue-600 hover:bg-slate-50 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Asosiy kabinet
          </button>
        </div>
      </div>

      {/* SEARCH PATIENT MODAL POPUP */}
      {showSearchModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                <Search className="text-blue-500 w-4 h-4" /> Bemorlarni qidirish
              </h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ism yoki telefon raqam bo'yicha..."
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:border-blue-500 focus:outline-none"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {searchQuery === '' ? (
                <p className="text-[11px] text-slate-400 text-center py-4">Ism yoki telefon raqamini yozing...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">Birorta ham bemor topilmadi.</p>
              ) : (
                searchResults.map(pt => (
                  <div key={pt.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-slate-800 block text-[11px]">{pt.patientName}</strong>
                      <span className="text-slate-400 font-mono text-[10px]">{pt.patientPhone}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-500 font-mono">Chipta #{pt.number}</span>
                      <span className="block text-[10px] text-slate-400">Filial: Samarqand</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-755 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* SUB-TABS INTERFACE (SCREENSHOT 5) */}
      <div className="flex border-b border-slate-200 gap-1 select-none overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('bugun')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'bugun' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          Bugun
        </button>
        <button
          onClick={() => setActiveSubTab('haftalik')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'haftalik' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          Haftalik hisobot
        </button>
        <button
          onClick={() => setActiveSubTab('shifokorlar')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'shifokorlar' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          Shifokorlar KPI
        </button>
        <button
          onClick={() => setActiveSubTab('sozlamalar')}
          className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider relative transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'sozlamalar' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          ⚙ Tibbiy Xizmatlar & Narxlar
        </button>
      </div>

      {/* METRIC CARD DOCK (SCREENSHOT 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              Bugun qabul qilingan
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {totalCompletedToday} kishi
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              Bugun joriy daromad
            </span>
            <div className="text-md font-extrabold text-blue-700 font-mono mt-2">
              {todayRevenue.toLocaleString('uz-UZ')}.00 so'm
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              Hozir kutayotgan
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {currentWaitingCount} kishi
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              Jami ro'yxatdagi bemorlar
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {totalRegisteredPatientsCount} ta
            </div>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* -------------------- TAB 1: BUGUN VIEW (SCREENSHOT 5) -------------------- */}
      {activeSubTab === 'bugun' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Shifokorlar bugungi hisoboti (Tab 1 left part) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">
                🩺 Shifokorlar bugungi ko'rsatkichlari
              </h3>

              <div className="overflow-x-auto text-xs">
                <table className="w-full min-w-[500px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase font-extrabold">
                      <th className="px-4 py-2.5">Shifokor</th>
                      <th className="px-4 py-2.5 text-center">Bemorlar</th>
                      <th className="px-4 py-2.5 text-right">Bugungi daromad</th>
                      <th className="px-4 py-2.5 text-center">Reyting</th>
                      <th className="px-4 py-2.5 text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-705">
                    {clinicDoctors.map((doc) => {
                      const stats = getDocTodayStats(doc.id);
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/30">
                          <td className="px-4 py-3.5 flex items-center gap-3">
                            <img src={doc.image} alt={doc.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100 animate-fade-in" referrerPolicy="no-referrer" />
                            <div>
                              <strong className="text-slate-800 block text-xs">{doc.name}</strong>
                              <span className="text-[10px] text-slate-400 font-semibold">{doc.specialty}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono">
                            {stats.completedCount} kishi / <span className="text-amber-600 font-bold">{stats.activeCount} kutmoqda</span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-blue-700">
                            {stats.revenue.toLocaleString('uz-UZ')}.00 so'm
                          </td>
                          <td className="px-4 py-3.5 text-center text-amber-400 font-sans font-bold">
                            ★ {doc.rating.toFixed(1)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setActiveTab && setActiveTab('shifokor')}
                              className="text-blue-500 hover:text-blue-600 font-extrabold underline cursor-pointer"
                            >
                              Kabinet
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Xizmatlar (bugun) (Tab 1 right part) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">
                📋 Bugungi mashhur xizmatlar
              </h3>
              
              <div className="divide-y divide-slate-100">
                {clinicServices.map(srv => {
                  const callCount = completedQueues.filter(q => q.serviceId === srv.id).length;
                  return (
                    <div key={srv.id} className="py-3 flex items-center justify-between first:pt-1 last:pb-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#0284c7]">✔</span>
                        <span className="font-extrabold text-slate-700">{srv.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
                          {callCount} ta
                        </span>
                        <span className="font-extrabold text-slate-800 font-mono">
                          {srv.price.toLocaleString('uz-UZ')} UZS
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Full width: bugungi barcha navbatlar list */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
            <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">
              📜 Bugungi barcha elektron chiptalar va navbat listi
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase font-extrabold">
                    <th className="px-4 py-2.5"># Chipta</th>
                    <th className="px-4 py-2.5">Bemor F.I.SH</th>
                    <th className="px-4 py-2.5">Telefon Raqami</th>
                    <th className="px-4 py-2.5">Shifokor</th>
                    <th className="px-4 py-2.5">Xizmat turi</th>
                    <th className="px-4 py-2.5">Holati</th>
                    <th className="px-4 py-2.5">Baholash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-55 font-semibold text-slate-655">
                  {clinicQueues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">Bugun navbatlar ro'yxati mutlaqo bo'sh.</td>
                    </tr>
                  ) : (
                    clinicQueues.map((item) => {
                      const doc = doctors.find(d => d.id === item.doctorId);
                      const srv = services.find(s => s.id === item.serviceId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/30">
                          <td className="px-4 py-3.5 font-bold font-mono text-slate-500">
                            #{item.number}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-850">
                            {item.patientName}
                          </td>
                          <td className="px-4 py-3.5 text-slate-450 font-mono">
                            {item.patientPhone}
                          </td>
                          <td className="px-4 py-3.5 text-slate-755 font-extrabold">
                            {doc?.name || 'Dr. Umidjon'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {srv?.name || 'Konsultatsiya'}
                          </td>
                          <td className="px-4 py-3.5">
                            {item.status === 'completed' ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-100 flex items-center gap-1 w-max">
                                ✔ Davolangan
                              </span>
                            ) : item.status === 'cancelled' ? (
                              <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg text-[10px] font-bold flex items-center gap-1 w-max">
                                ✕ Bekor qilingan
                              </span>
                            ) : item.status === 'in_progress' ? (
                              <span className="px-2.5 py-1 bg-sky-50 text-sky-850 border border-sky-100 rounded-lg text-[10px] font-bold flex items-center gap-1 w-max animate-pulse">
                                🦷 Xonada Qabulda
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-100 flex items-center gap-1 w-max animate-pulse">
                                ⏳ Chaqiruv Kutilmoqda
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-amber-400 text-sm">
                            {item.rating ? '★'.repeat(item.rating) : <span className="text-slate-350 font-normal font-mono">baho yo'q</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* -------------------- TAB 2: HAFTALIK HISOBOT VIEW (SCREENSHOT 6, 7, 8) -------------------- */}
      {activeSubTab === 'haftalik' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Kunlik tafsilot table (Screenshot 7 detail) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
            <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" /> Haftalik kunlik tafsilot
            </h3>

            <div className="overflow-x-auto text-[11px] font-semibold text-slate-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-extrabold border-b border-slate-100">
                    <th className="px-3 py-2">Kun</th>
                    <th className="px-3 py-2">Sana</th>
                    <th className="px-3 py-2 text-center">Bemorlar</th>
                    <th className="px-3 py-2 text-right">Daromad</th>
                    <th className="px-3 py-2 text-center">Baho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {weeklyReportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="px-3 py-3 font-bold text-slate-800">{item.dayName}</td>
                      <td className="px-3 py-3 font-mono text-slate-400">{item.dateStr}</td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-655">{item.patientsCount} kishi</td>
                      <td className="px-3 py-3 text-right font-mono text-cyan-600 font-extrabold">
                        {item.revenue.toLocaleString('uz-UZ')} so'm
                      </td>
                      <td className="px-3 py-3 text-center text-amber-500 font-bold">★ {item.avgRating.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side: Graph grids utilizing gorgeous SVG charts */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Chart 1: Kunlik daromad line chart */}
            <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Kunlik daromad grafigi (so'm)
                </h4>
                <span className="text-[11px] bg-blue-50 text-blue-800 font-mono font-extrabold px-2 py-0.5 rounded-full">
                  Haftalik jami: 15,650,000 UZS
                </span>
              </div>

              {/* Responsive Elegant SVG Chart */}
              <div className="h-44 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Gradient Area Shadow */}
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Closed Path for Fill */}
                  <path 
                    d="M 10 140 Q 80 110, 150 70 T 290 85 T 430 35 L 430 145 Z" 
                    fill="url(#chart-grad)" 
                  />

                  {/* Curved Chart Line */}
                  <path 
                    d="M 10 140 Q 80 110, 150 70 T 290 85 T 430 35" 
                    fill="none" 
                    stroke="#2563eb" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />

                  {/* Dots at Data Points */}
                  <circle cx="10" cy="140" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="80" cy="110" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="150" cy="70" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="220" cy="98" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="290" cy="85" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="360" cy="50" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="430" cy="35" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* Day labels at bottom */}
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1.5 pt-1">
                  <span>Dush</span>
                  <span>Sesh</span>
                  <span>Chor</span>
                  <span>Pay</span>
                  <span>Jum</span>
                  <span>Shan</span>
                  <span>Yak</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Kunlik bemorlar count line chart */}
            <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Kunlik tashrif buyurgan bemorlar soni
                </h4>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-mono font-extrabold px-2 py-0.5 rounded-full">
                  Haftalik jami: 50 bemor
                </span>
              </div>

              {/* SVG Bemorlar Chart */}
              <div className="h-44 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Gradient Area Shadow (Green) */}
                  <defs>
                    <linearGradient id="chart-grad-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Closed Path for Fill */}
                  <path 
                    d="M 10 110 Q 80 85, 150 120 T 290 90 T 430 40 L 430 145 Z" 
                    fill="url(#chart-grad-g)" 
                  />

                  {/* Curved Chart Line (Green) */}
                  <path 
                    d="M 10 110 Q 80 85, 150 120 T 290 90 T 430 40" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />

                  {/* Dots at Data Points */}
                  <circle cx="10" cy="110" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="80" cy="85" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="150" cy="120" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="220" cy="65" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="290" cy="90" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="360" cy="45" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="430" cy="40" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* Day labels at bottom */}
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1.5 pt-1">
                  <span>Dush</span>
                  <span>Sesh</span>
                  <span>Chor</span>
                  <span>Pay</span>
                  <span>Jum</span>
                  <span>Shan</span>
                  <span>Yak</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* -------------------- TAB 3: SHIFOKORLAR VIEW & CREATE PROFILE (SCREENSHOT 9 COVERS) -------------------- */}
      {activeSubTab === 'shifokorlar' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">
              🧑‍⚕ Shifokorlar va Ularning Kunlik Analitikalari
            </h3>

            <button
              onClick={() => setShowAddDoctorForm(!showAddDoctorForm)}
              className="px-4 py-2 bg-[#0284c7] hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yangi Shifokor Profilini Yaratish
            </button>
          </div>

          {/* Feedback messages */}
          {docFeedbackMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-fade-in">
              {docFeedbackMsg}
            </div>
          )}

          {/* Onboarding New Doctor Form */}
          {showAddDoctorForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 max-w-2xl space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                🩺 Yangi Shifokor Qo'shish Shakli (CEO Onboarding)
              </h4>

              <form onSubmit={handleCreateDoctorSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">To'liq ismi-sharifi (F.I.SH) *</label>
                    <input
                      type="text"
                      required
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Masalan: Dr. Sardor Rustamov"
                      className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mutaxassisligi / Mutaxassislik Yo'nalishi</label>
                    <select
                      value={newDocSpecialty}
                      onChange={(e) => setNewDocSpecialty(e.target.value)}
                      className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 focus:border-cyan-500"
                    >
                      <option value="Stomatolog-ortoped">Stomatolog-ortoped</option>
                      <option value="Xirurg-Stomatolog">Xirurg-Stomatolog</option>
                      <option value="Bolalar Stomatologi">Bolalar Stomatologi</option>
                      <option value="Estetik Salomatlik Bo'yicha Ekspert">Estetik Salomatlik Eksperti</option>
                      <option value="Ortodont">Ortodont</option>
                      <option value="Terapevt-Stomatolog">Terapevt-Stomatolog</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Shifokor surati (Avatar URL)</label>
                  <input
                    type="url"
                    value={newDocAvatar}
                    onChange={(e) => setNewDocAvatar(e.target.value)}
                    className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Sifatli portret surati havolasini kiriting.</p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddDoctorForm(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all"
                  >
                    Saqlash & Onboard
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Doctor KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinicDoctors.map((doc) => {
              const todayStats = getDocTodayStats(doc.id);
              return (
                <div key={doc.id} className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md">
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-4 mb-4">
                    <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2 border-blue-500 shadow-sm" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="text-md font-extrabold text-slate-800">{doc.name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{doc.specialty}</p>
                      
                      <div className="flex items-center text-amber-500 text-xs mt-1.5 gap-1 font-bold">
                        <span>★ {doc.rating.toFixed(1)}</span>
                        <span className="text-slate-400 text-[10px] font-normal font-mono">({doc.ratingCount || 12} sharhlar)</span>
                      </div>
                    </div>
                  </div>

                  {/* Numeric Grid (Screenshot 9 detail) */}
                  <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Bugun</span>
                      <strong className="text-xs font-bold text-slate-750 font-mono">{todayStats.completedCount} kishi</strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Haftalik</span>
                      <strong className="text-xs font-bold text-slate-750 font-mono">{todayStats.completedCount + 15} kishi</strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Erkinligi</span>
                      <strong className="text-xs font-bold text-emerald-600 font-sans">Faol ({doc.status === 'idle' ? 'bo\'sh' : doc.status === 'busy' ? 'band' : 'tushlikda'})</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-450 font-bold">Status:🟢 Qabulga tayyor</span>
                    <button
                      onClick={() => setActiveTab && setActiveTab('shifokor')}
                      className="text-blue-500 hover:text-blue-600 text-xs font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      Kabinetga o'tish <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* -------------------- TAB 4: EDIT SERVICES AND LICENSED PRICES -------------------- */}
      {activeSubTab === 'sozlamalar' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-150/80 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">🔧</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                ⚙ Tibbiy Xizmatlar Katalogi va Narxlar Tahriri
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
              {clinicServices.length} faol xizmatlar topildi
            </span>
          </div>

          {srvFeedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-2xl animate-fade-in">
              {srvFeedbackMsg}
            </div>
          )}

          {/* Inline Edit Form Container */}
          {editingServiceId && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                📝 Xizmat narxini va nomini o'zgartirish oynasi
              </h4>

              <form onSubmit={handleUpdateServiceSubmit} className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Xizmat nomi</label>
                  <input
                    type="text"
                    required
                    value={editingServiceName}
                    onChange={(e) => setEditingServiceName(e.target.value)}
                    className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Narxi (UZS)</label>
                  <input
                    type="number"
                    required
                    value={editingServicePrice}
                    onChange={(e) => setEditingServicePrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-250 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingServiceId(null)}
                    className="px-3.5 py-2.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#0284c7] hover:bg-cyan-700 text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0"
                  >
                    Yangilash✓
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of services in a table */}
          <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
            {clinicServices.map((srv) => (
              <div key={srv.id} className="p-3.5 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">{srv.name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Samarqand filiali | ID: {srv.id}
                  </span>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <span className="text-xs font-extrabold font-mono text-cyan-650 bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-100">
                    {srv.price.toLocaleString('uz-UZ')} so'm
                  </span>

                  <button
                    onClick={() => startEditingService(srv)}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0"
                  >
                    Tahrirlash/Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- FOOTER (SCREENSHOT 5) ----------------- */}
      <footer className="pt-8 border-t border-slate-200 mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs text-slate-400 font-semibold select-none pb-4">
          <p>© 2025-2026 DStoma Clinic Boss Panel. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-1.5 text-slate-500">
            Klinika hisoboti avtomatik tarzda shakllanadi.
          </div>
        </div>
      </footer>
    </div>
  );
}
