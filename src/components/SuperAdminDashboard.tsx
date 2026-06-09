import React, { useState } from 'react';
import { Clinic, Doctor, QueueItem, SaaSPayment } from '../types';
import { TRANSLATIONS, Language } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { getTelegramBotToken, setTelegramBotToken } from '../services/telegram';
import { 
  Building, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  DollarSign, 
  Activity, 
  ShieldAlert, 
  Eye, 
  Users, 
  CreditCard,
  Crown,
  KeyRound,
  User,
  Shield,
  Briefcase,
  Smartphone,
  Save,
  RotateCcw,
  Search,
  Globe,
  Lock,
  ListRestart,
  Mail,
  Inbox,
  PenSquare,
  AlertTriangle
} from 'lucide-react';

interface SuperAdminDashboardProps {
  clinics: Clinic[];
  queues: QueueItem[];
  doctors: Doctor[];
  onAddClinic: (newClinic: Clinic) => void;
  onToggleSubscription: (clinicId: string) => void;
  onUpdateClinicCreds?: (clinicId: string, login: string, pass: string) => void;
  onUpdateDoctorCreds?: (doctorId: string, login: string, pass: string) => void;
  onDeleteClinic?: (clinicId: string) => void;
  onDeleteDoctor?: (doctorId: string) => void;
  language: Language;

  // Custom added billing variables
  saasPayments?: SaaSPayment[];
  onApproveSaaSPayment?: (id: string) => void;
  onUpdateClinicDetails?: (updatedClinic: Clinic) => void;
  
  // Custom superadmin credentials and GMail simulation
  superadminLogin?: string;
  superadminPassword?: string;
  onUpdateSuperadminCreds?: (newLogin: string, newPass: string) => void;
  gmailInboxes?: Array<{
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    time: string;
    read: boolean;
  }>;
  onMockSendPayment?: (clinicId: string) => void;
}

export default function SuperAdminDashboard({
  clinics,
  queues,
  doctors,
  onAddClinic,
  onToggleSubscription,
  onUpdateClinicCreds,
  onUpdateDoctorCreds,
  onDeleteClinic,
  onDeleteDoctor,
  language,
  saasPayments = [],
  onApproveSaaSPayment,
  onUpdateClinicDetails,
  superadminLogin = 'superadmin',
  superadminPassword = 'adminstoma',
  onUpdateSuperadminCreds,
  gmailInboxes = [],
  onMockSendPayment
}: SuperAdminDashboardProps) {
  
  const t = (key: keyof typeof TRANSLATIONS['uz']) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['uz'][key] || String(key);
  };

  // Local States for creating clinic
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicSubdomain, setNewClinicSubdomain] = useState('');
  const [newClinicAddress, setNewClinicAddress] = useState('');
  const [newClinicPhone, setNewClinicPhone] = useState('+998901234567');
  const [newClinicFee, setNewClinicFee] = useState<number>(1500000);
  const [newClinicOwner, setNewClinicOwner] = useState('');
  const [newClinicMapLink, setNewClinicMapLink] = useState('');

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
  const [newSuperadminLogin, setNewSuperadminLogin] = useState(superadminLogin);
  const [newSuperadminPass, setNewSuperadminPass] = useState(superadminPassword);

  // SaaS Calculator Interactive Simulation inputs
  const [simAddedClinics, setSimAddedClinics] = useState(3);
  const [simPricePerClinic, setSimPricePerClinic] = useState(1500000);

  // Telegram Bot Token Setting state
  const [telegramToken, setTelegramToken] = useState(getTelegramBotToken());

  // Generated credentials storage
  const [generatedCreds, setGeneratedCreds] = useState<{
    clinicName: string;
    subdomain: string;
    ownerName: string;
    login: string;
    pass: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Simulated System Operations Log (gives elite visual feel)
  const [opsLogs, setOpsLogs] = useState<Array<{ id: string; time: string; text: string; type: 'success' | 'warn' | 'info' }>>([
    { id: '1', time: '12:34', text: 'Stoma Samarqand billing status checked - [Active]', type: 'success' },
    { id: '2', time: '13:10', text: 'Doctor Umidjon Egamov login credentials requested', type: 'info' },
    { id: '3', time: '14:24', text: 'Buxoro filial billing alerts sent to Azizbek', type: 'warn' },
  ]);

  const addLog = (text: string, type: 'success' | 'info' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setOpsLogs(prev => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 5)]);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = () => {
    if (!generatedCreds) return;
    const shareText = `Klinika: ${generatedCreds.clinicName}\nSubdomain: ${generatedCreds.subdomain}.dstoma.uz\nDirekor: ${generatedCreds.ownerName}\n\nLogin: ${generatedCreds.login}\nParol: ${generatedCreds.pass}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    triggerToast(language === 'uz' ? "Hisob ma'lumotlari nusxalandi!" : language === 'ru' ? "Учетные данные скопированы!" : "Credentials copied successfully!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGeneric = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(language === 'uz' ? "Nusxalandi!" : language === 'ru' ? "Скопировано!" : "Copied!");
  };

  // SaaS calculations
  const totalClinics = clinics.length;
  const activeClinicsCount = clinics.filter(c => c.subscriptionStatus === 'active' || c.subscriptionStatus === 'trial').length;
  const currentMRR = clinics
    .filter(c => c.subscriptionStatus === 'active')
    .reduce((sum, c) => sum + (c.rentalPrice || 1500000), 0);

  const totalPatients = 142 + queues.length;

  const handleCreateClinicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newClinicSubdomain || !newClinicOwner) {
      triggerToast(language === 'uz' ? "Iltimos, barcha majburiy maydonlarni to'ldiring!" : "Please fill in all required fields!");
      return;
    }

    const cleanSubdomain = newClinicSubdomain.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const exists = clinics.some(c => c.subdomain === cleanSubdomain);
    if (exists) {
      triggerToast(language === 'uz' ? "Ushbu subdomen bilan ro'yxatdan o'tilgan!" : "This subdomain is already registered!");
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
      lat: 41.311081,
      lng: 69.240562,
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

    onAddClinic(initialClinic);
    addLog(`New clinic "${newClinicName}" onboarded under tenant [${cleanSubdomain}]`, 'success');

    setGeneratedCreds({
      clinicName: newClinicName,
      subdomain: cleanSubdomain,
      ownerName: newClinicOwner,
      login: generatedLogin,
      pass: generatedPass
    });

    // Reset fields
    setNewClinicName('');
    setNewClinicSubdomain('');
    setNewClinicAddress('');
    setNewClinicOwner('');
    setNewClinicMapLink('');
    triggerToast(language === 'uz' ? "Yangi filial tarmoqqa muvaffaqiyatli qo'shildi!" : "New clinic onboarded successfully!");
  };

  const handleUpdateClinicCredsClick = (clinic: Clinic) => {
    setEditingClinicId(clinic.id);
    setClinicLoginVal(clinic.login || `ceo_${clinic.subdomain}`);
    setClinicPassVal(clinic.password || 'Stoma123!');
  };

  const handleSaveClinicCredsSubmit = (clinicId: string) => {
    if (!clinicLoginVal || !clinicPassVal) {
      triggerToast(language === 'uz' ? "Login va parol bo'sh bo'lishi mumkin emas!" : "Login and password cannot be empty!");
      return;
    }
    if (onUpdateClinicCreds) {
      onUpdateClinicCreds(clinicId, clinicLoginVal, clinicPassVal);
      addLog(`Clinic ID [${clinicId}] credentials modified: ${clinicLoginVal}`, 'info');
      setEditingClinicId(null);
      triggerToast(language === 'uz' ? "Klinika hisob ma'lumotlari yangilandi!" : "Clinic credentials updated successfully!");
    } else {
      triggerToast("Callback not tied yet in parent component");
    }
  };

  const handleUpdateDoctorCredsClick = (doctor: Doctor) => {
    setEditingDoctorId(doctor.id);
    setDoctorLoginVal(doctor.login || doctor.name.toLowerCase().replace(/\s+/g, ''));
    setDoctorPassVal(doctor.password || 'StomaDoc!');
  };

  const handleSaveDoctorCredsSubmit = (docId: string) => {
    if (!doctorLoginVal || !doctorPassVal) {
      triggerToast(language === 'uz' ? "Login va parol bo'sh bo'lishi mumkin emas!" : "Login and password cannot be empty!");
      return;
    }
    if (onUpdateDoctorCreds) {
      onUpdateDoctorCreds(docId, doctorLoginVal, doctorPassVal);
      addLog(`Doctor ID [${docId}] credentials modified: ${doctorLoginVal}`, 'info');
      setEditingDoctorId(null);
      triggerToast(language === 'uz' ? "Shifokor hisob ma'lumotlari yangilandi!" : "Doctor credentials updated successfully!");
    } else {
      triggerToast("Callback not tied yet in parent component");
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

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 border border-cyan-500 text-cyan-200 px-5 py-4 rounded-2xl shadow-xl transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold font-mono">{toastMsg}</span>
        </div>
      )}

      {/* HEADER BANNER WITH GRADIENT AND CROWN ACCENT */}
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
          <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-830 shrink-0 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#06b6d4]" />
            <span className="text-[11px] font-bold text-slate-350 font-mono">DSTOMA NETWORK CENTRAL</span>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none">
              {t('totalClinics')}
            </span>
            <div className="text-2xl font-black text-slate-850 font-mono mt-2">
              {activeClinicsCount} <span className="text-xs font-normal text-slate-400">/ {totalClinics}</span>
            </div>
          </div>
          <div className="p-3 bg-cyan-50 text-[#06b6d4] rounded-xl shadow-xs">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none">
              {t('mrr')}
            </span>
            <div className="text-md font-extrabold text-[#0284c7] font-mono mt-2 flex items-center gap-1">
              <span>{currentMRR.toLocaleString('uz-UZ')}</span>
              <span className="text-[10px] text-slate-500 font-bold font-sans">so'm/oy</span>
            </div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none">
              {t('totalDoctors')}
            </span>
            <div className="text-2xl font-black text-slate-850 font-mono mt-2">
              {doctors.length} <span className="text-xs font-normal text-slate-400">nafar</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none">
              {t('totalPatients')}
            </span>
            <div className="text-2xl font-black text-slate-850 font-mono mt-2">
              {totalPatients} <span className="text-xs font-normal text-slate-400">chipta</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ONBOARD CLINIC */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md relative overflow-hidden">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1 uppercase tracking-wide">
                    {t('subdomain')} *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-cyan-500">
                    <input
                      type="text"
                      required
                      value={newClinicSubdomain}
                      onChange={(e) => setNewClinicSubdomain(e.target.value.toLowerCase())}
                      placeholder="toshkent"
                      className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                    />
                    <span className="text-[9px] text-slate-400 font-black font-mono">.dstoma.uz</span>
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

              <div className="grid grid-cols-2 gap-3">
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
                      className="w-full bg-transparent text-xs font-bold text-slate-850 focus:outline-none font-mono"
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
                    className="text-slate-500 hover:text-slate-350 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-850 space-y-2">
                    <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                      {t('ownerProvisionNotice')}
                    </p>
                    <div className="font-mono text-[11px] space-y-1.5 text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-900 select-all">
                      <p><span className="text-slate-500">Filial:</span> {generatedCreds.clinicName}</p>
                      <p><span className="text-slate-500">Subdomain:</span> {generatedCreds.subdomain}.dstoma.uz</p>
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

          {/* SIMULATED SYSTEM LOGS */}
          <div className="bg-slate-900 text-slate-300 p-4.5 rounded-3xl border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#06b6d4] font-mono">
                ⚡ SYSTEM ACCESS LOGS (AUDIT)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="space-y-2">
              {opsLogs.map(log => (
                <div key={log.id} className="text-[10px] font-mono flex items-start gap-1.5">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className={`${
                    log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-cyan-400'
                  }`}>•</span>
                  <span className="text-slate-400">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SAAS PREMIUM FINANCIAL FORECAST CALCULATOR */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4">
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
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase block tracking-wider">Haqiqiy MRR (Oylik)</span>
                  <strong className="text-sm font-black text-slate-800 font-mono">
                    {currentMRR.toLocaleString('uz-UZ')} UZS
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase block tracking-wider">Mo'ljaldagi ARR (Yillik)</span>
                  <strong className="text-sm font-black text-indigo-650 font-mono">
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

              {/* Dynamic Simulation Inputs */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">
                  📈 Kelgusi Davr Rejalashtirish Simulyatori
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Yangi kutilayotgan filiallar soni:</span>
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
                    <span className="text-slate-600">Oylik tarmoq to'lovi (xar bitta):</span>
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
              <div className="bg-gradient-to-br from-slate-905 to-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#06b6d4] block">SIMULATION OUTPUT</span>
                
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
                  <span className="text-slate-350 font-medium">Kutilayotgan Jami ARR (Yillik):</span>
                  <span className="font-black text-cyan-400 font-mono">
                    {((currentMRR + (simAddedClinics * simPricePerClinic)) * 12).toLocaleString('uz-UZ')} so'm/yil
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 1. SaaS OYLIK TO'LOVLARNI TASDIQLASH BOARD (USER REQUESTED) ==================== */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4">
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
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-150 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider block">
                        JAMI TASDIQLANGAN HAQIQIY DAROMAD
                      </span>
                      <strong className="text-xl font-black text-emerald-950 font-mono block mt-1">
                        {confirmedTotal.toLocaleString('uz-UZ')} so'm
                      </strong>
                      <span className="text-[10px] text-slate-550 mt-1 block font-semibold">
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
                      <p className="text-xs text-slate-400 py-4 text-center font-medium bg-slate-50 border border-slate-105 rounded-xl">
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
                                  <span className="text-[9px] font-normal text-slate-450 uppercase font-mono tracking-wider">
                                    Trial tugagan
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-650 mt-1 font-semibold">
                                  Ijara: <strong className="font-mono text-indigo-950">{pay.amount.toLocaleString()} UZS</strong> | Yuborildi: <strong className="font-mono text-slate-700">{pay.dueDate}</strong>
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  if (onApproveSaaSPayment) {
                                    onApproveSaaSPayment(pay.id);
                                    addLog(`Oylik to'lov tasdiqlandi: ${associatedClinic?.name || 'Klinika'} - ${pay.amount.toLocaleString()} UZS`, 'success');
                                    triggerToast(`To'lov muvaffaqiyatli tasdiqlandi va hisob-kitob daromadiga qo'shildi! ✓`);
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

          {/* ==================== 2. SUPERADMIN PASSWORD UPDATE FORMS (GMAIL SECURED) ==================== */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">🛡️</span>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Superadmin Parol Sozlamalari
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                    Gmail hisobi orqali parol almashtirish va xabarnomalar tizimi
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-[#0284c7] font-black underline decoration-indigo-200">
                Gmail Protected
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Xavfsizlik tizimi yuqori darajada sozlangan. Superadmin login yoki parolini o'zgartirganingizda, yangi hisob ma'lumotlari darhol sizning tasdiqlangan <strong className="text-indigo-800">egamovumidjon18@gmail.com</strong> pochtangizga jo'natiladi.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateSuperadminCreds) {
                onUpdateSuperadminCreds(newSuperadminLogin, newSuperadminPass);
                addLog(`Superadmin login/paroli o'zgartirildi va Gmail ga jo'natildi`, 'info');
                triggerToast("Yangi hisob ma'lumotlari Gmail elektron pochtangizga jo'natildi! 📬");
              }
            }} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3.5">
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
                    type="text"
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
                <span>Malumotlarni O'zgartirish & Pochtaga jo'natish ✉️</span>
              </button>
            </form>
          </div>

          {/* ==================== 3. GMAIL INBOX SIMULATION SCREENSHOTS OR LIVING WIDGET ==================== */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-red-600 rounded-lg text-white font-black text-[9px] uppercase font-mono px-1.5 animate-pulse">
                  GMAIL LIVE
                </span>
                <span className="text-[10px] font-black text-slate-450 tracking-wider font-mono">
                  EGAMOVUMIDJON18@GMAIL.COM INBOX
                </span>
              </div>
              <Inbox className="w-4 h-4 text-[#ef4444]" />
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Yangi hisob o'zgarganda yoki billing amali bajarilganda kelgan elektron maktublarni shu yerning o'zida real monitoring qilishingiz mumkin:
            </p>

            <div className="space-y-2 mt-3 select-none">
              {gmailInboxes.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs font-mono">
                  Inbox is empty / Xatlar yo'q
                </div>
              ) : (
                gmailInboxes.map(mail => (
                  <div 
                    key={mail.id} 
                    className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 rounded-xl space-y-1.5 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#f87171] font-bold font-mono">Kimdan: {mail.from}</span>
                      <span className="text-slate-500 font-mono">{mail.time}</span>
                    </div>
                    <strong className="text-slate-200 block text-[11px]">{mail.subject}</strong>
                    <p className="text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-9003/30 p-2 rounded border border-slate-900 font-mono">
                      {mail.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ==================== TELEGRAM BOT CONFIGURATION (USER INTEGRATION) ==================== */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4 font-sans text-left">
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

            <form onSubmit={(e) => {
              e.preventDefault();
              setTelegramBotToken(telegramToken);
              triggerToast("Telegram Bot Token muvaffaqiyatli saqlandi! ⚡");
              addLog(`Telegram Bot Token yangilandi!`, 'success');
            }} className="space-y-3.5 pt-1">
              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest">BOT API TOKEN *</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="7514931393:AAFFZJ-fFf9hV4gA-S..."
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    className="flex-1 bg-slate-50 text-xs font-mono text-slate-800 border border-slate-250 rounded-lg px-3 py-2.5 focus:border-[#0284c7] focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-sm shrink-0 uppercase cursor-pointer"
                  >
                    Saqlash ✓
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-1">
                  Xavfsiz integratsiya faollashtirilgan. Token lokal brauzer xotirasiga va muhit o'zgaruvchilariga bog'lanadi.
                </p>
              </div>
            </form>

            {/* Vercel Webhook Setup Section */}
            <div className="bg-[#f0f9ff] rounded-2xl p-4 border border-blue-150 space-y-3">
              <strong className="text-[10px] uppercase font-black tracking-widest text-blue-600 block">🧭 Vercel (Serverless) Webhook Sozlash</strong>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                Agarda platformangiz Vercel serverless tizimida bo'lsa, Telegram bot yangiliklarni qabul qilishi uchun unga saytning webhook manzilini yuklash kerak:
              </p>
              <button
                type="button"
                onClick={async () => {
                  const activeToken = telegramToken || getTelegramBotToken();
                  if (!activeToken) {
                    triggerToast("Iltimos, avval Telegram API tokenini yuqorida saqlang!");
                    return;
                  }
                  triggerToast("Webhook Telegram serverida ro'yxatdan o'tkazilmoqda...");
                  try {
                    const domain = window.location.origin;
                    const response = await fetch(`/api/telegram-webhook-setup?domain=${encodeURIComponent(domain)}`);
                    const data = await response.json();
                    
                    if (data.ok) {
                      triggerToast("Webhook muvaffaqiyatli bog'landi! Telegram bot faollashdi. 🎉✅");
                      addLog(`Telegram Webhook muvaffaqiyatli bog'landi: ${data.webhook_url}`, 'success');
                    } else {
                      triggerToast(`Xatolik: ${data.error || 'Webhook sozlanmadi'}`);
                    }
                  } catch (err: any) {
                    triggerToast("Server / Webhook bilan bog'lanishda xatolik yuz berdi!");
                  }
                }}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-sm shrink-0 uppercase cursor-pointer"
              >
                Telegram Webhook-ni Avtomatik Sozlash ⚡
              </button>
              <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                Faol Vercel Webhook havolasi: <code className="bg-white/80 px-1 border border-slate-150 rounded font-mono text-[9px] text-[#2563eb]">{window.location.origin}/api/telegram-webhook</code>
              </p>
            </div>

            {/* Test Notification Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
              <strong className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">⚡ Bot Integratsiyasini Test Qilish</strong>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID raqam (masalan, 57896431)"
                  id="test_telegram_chat_id"
                  className="flex-1 bg-white text-xs font-bold font-mono text-slate-850 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none"
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
                      const response = await fetch(`https://api.telegram.org/bot${telegramToken || getTelegramBotToken()}/sendMessage`, {
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
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-[10px] tracking-wide rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
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

        {/* RIGHT COLUMN: ADVANCED CLINICS & DOCTORS CREDENTIALS CONTROLLER */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION 1: CLINIC CREDENTIALS & LICENSING BILLING BOX */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4">
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
                            {clinic.subdomain}.dstoma.uz
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                          Rahbar/CEO: <span className="text-slate-700">{clinic.ownerName || "Kiritilmagan"}</span> | Oylik litsenziya: <span className="text-slate-850 font-mono font-bold">{fee.toLocaleString('uz-UZ')} so'm</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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
                    <div className="bg-white p-3 rounded-xl border border-slate-150/80">
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
                          
                          <div className="grid grid-cols-2 gap-3">
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
                              <label className="text-[9px] font-black text-slate-500 block mb-1">PAROL</label>
                              <input
                                type="text"
                                value={clinicPassVal}
                                onChange={(e) => setClinicPassVal(e.target.value)}
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
                              className="p-1 px-2.5 text-[9px] bg-slate-100 text-slate-650 font-bold rounded-md hover:bg-slate-200"
                              title="Tizim tomonidan tasodifiy hisob ma'lumotlarini o'rnatish"
                            >
                              Tasodifiy generatsiya
                            </button>
                            <button
                              onClick={() => handleSaveClinicCredsSubmit(clinic.id)}
                              className="p-1 px-3 text-[9px] bg-slate-900 hover:bg-slate-850 text-white font-black rounded-md flex items-center gap-1 active:scale-95"
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
                                {clinic.password || 'Stoma100'}
                              </code>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => setClinicToEdit(clinic)}
                              className="px-2.5 py-1 text-indigo-650 hover:text-indigo-850 rounded bg-indigo-50 hover:bg-indigo-100 text-[10px] font-black cursor-pointer flex items-center gap-1"
                              title="Klinika ma'lumotlarini o'zgartirish"
                            >
                              ⚙️ Tahrirlash
                            </button>
                            <button
                              onClick={() => handleCopyGeneric(`Login: ${clinic.login || `ceo_${clinic.subdomain}`} | Parol: ${clinic.password || 'Stoma100'}`)}
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
                            <button
                              onClick={() => {
                                const confirmText = language === 'uz' 
                                  ? `"${clinic.name}" klinikasini butunlay o'chirishni tasdiqlaysizmi? Barcha bog'liq shifokorlar va navbatlar ham o'chib ketishi mumkin.` 
                                  : language === 'ru' 
                                  ? `Вы действительно хотите удалить клинику "${clinic.name}"? Все врачи и очереди этой клиники тоже могут быть удалены.` 
                                  : `Are you sure you want to completely delete "${clinic.name}" clinic? All associated doctors and queues may also be deleted.`;
                                if (window.confirm(confirmText)) {
                                  onDeleteClinic?.(clinic.id);
                                  addLog(`Clinic "${clinic.name}" has been permanently purged.`, 'warn');
                                  triggerToast(language === 'uz' ? "Klinika o'chirib tashlandi!" : language === 'ru' ? "Клиника полностью удалена!" : "Clinic successfully purged!");
                                }
                              }}
                              className="px-2.5 py-1 text-rose-600 hover:text-rose-800 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-black cursor-pointer flex items-center gap-1"
                              title="Klinikani butunlay o'chirish"
                            >
                              🗑️ {language === 'uz' ? "O'chirish" : language === 'ru' ? "Удалить" : "Delete"}
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

          {/* SECTION 2: DOCTOR CREDENTIALS HUB (EXPLICITLY GIVEN BY OWNER) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👨‍⚕</span>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  {t('doctorCredsTitle')}
                </h2>
              </div>
              
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
            </div>

            <p className="text-xs text-slate-500">
              Shifokorlarning shaxsiy kabinetga kirish hisoblari hamda ularning parollari mutlaqo ushbu bo'limda belgilanadi. Shifokorlar o'zlarining kabinetiga joriy login-parollar orqali kirib navbatlarni boshqara oladilar.
            </p>

            <div className="divide-y divide-slate-100">
              {filteredDoctors.map((doc) => {
                const isEditingDoc = editingDoctorId === doc.id;
                return (
                  <div key={doc.id} className="py-4.5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      
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
                          <h4 className="text-xs font-black text-slate-850 leading-tight">{doc.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            Specialty: <span className="text-slate-650">{doc.specialty}</span> | Filial: <span className="text-[#06b6d4] font-mono text-[9px] font-black uppercase bg-cyan-950/10 px-1.5 py-0.5 rounded">{doc.clinicId}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          doc.status === 'idle' ? 'bg-emerald-500' : doc.status === 'busy' ? 'bg-rose-500' : 'bg-amber-400'
                        }`} title={`Hozirgi holat: ${doc.status}`}></span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold capitalize select-none">
                          {doc.status}
                        </span>
                      </div>
                    </div>

                    {/* Credentials status or Edit form for specific Doctor */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
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

                          <div className="grid grid-cols-2 gap-3">
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
                              <label className="text-[9px] font-black text-slate-500 block mb-0.5">PAROL</label>
                              <input
                                type="text"
                                value={doctorPassVal}
                                onChange={(e) => setDoctorPassVal(e.target.value)}
                                className="w-full bg-white text-[11px] font-bold font-mono text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 focus:border-[#06b6d4] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-1 px-1 mt-1">
                            <button
                              onClick={() => {
                                const defaultLog = doc.name.split(' ')[0].toLowerCase() + Math.floor(10 + Math.random() * 90);
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
                                {doc.login || doc.name.split(' ')[0].toLowerCase()}
                              </code>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono">{t('customPass')}:</span>
                              <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono text-[11px] select-all">
                                {doc.password || 'Password123'}
                              </code>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleCopyGeneric(`Shifokor: ${doc.name} | Login: ${doc.login || doc.name.split(' ')[0].toLowerCase()} | Password: ${doc.password || 'Password123'}`)}
                              className="p-1 text-slate-400 hover:text-slate-600 bg-white border border-slate-150 rounded"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateDoctorCredsClick(doc)}
                              className="p-1 px-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-[10px] font-black rounded"
                            >
                              {t('resetCreds')}
                            </button>
                            <button
                              onClick={() => {
                                const confirmText = language === 'uz' 
                                  ? `"${doc.name}" shifokor profilini o'chirishni tasdiqlaysizmi?` 
                                  : language === 'ru' 
                                  ? `Вы действительно хотите удалить профиль врача "${doc.name}"?` 
                                  : `Are you sure you want to completely delete "${doc.name}" doctor profile?`;
                                if (window.confirm(confirmText)) {
                                  onDeleteDoctor?.(doc.id);
                                  addLog(`Doctor "${doc.name}" credentials have been deleted.`, 'warn');
                                  triggerToast(language === 'uz' ? "Shifokor o'chirildi!" : language === 'ru' ? "Врач успешно удален!" : "Doctor successfully removed!");
                                }
                              }}
                              className="px-2.5 py-1 text-rose-600 hover:text-rose-800 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-black cursor-pointer flex items-center gap-1 animate-fade-in"
                              title="Shifokorni butunlay o'chirish"
                            >
                              🗑️ {language === 'uz' ? "O'chirish" : language === 'ru' ? "Удалить" : "Delete"}
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

      {/* DETAILED CLINIC EDITING MODAL (USER REQUIREMENT) */}
      {clinicToEdit && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl space-y-4 font-sans text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                📝 Klinika Tafsilotlarini Tahrirlash
              </h3>
              <button 
                onClick={() => setClinicToEdit(null)} 
                className="text-slate-400 hover:text-slate-650 text-sm font-black cursor-pointer"
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

              <div className="grid grid-cols-2 gap-3.5">
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

              <div className="grid grid-cols-2 gap-3.5">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-850 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
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
    </div>
  );
}
