import React, { useState } from 'react';
import { Clinic, Doctor, QueueItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
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
  Crown
} from 'lucide-react';

interface SuperAdminDashboardProps {
  clinics: Clinic[];
  queues: QueueItem[];
  doctors: Doctor[];
  onAddClinic: (newClinic: Clinic) => void;
  onToggleSubscription: (clinicId: string) => void;
}

export default function SuperAdminDashboard({
  clinics,
  queues,
  doctors,
  onAddClinic,
  onToggleSubscription
}: SuperAdminDashboardProps) {
  // Local States for creating clinic
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicSubdomain, setNewClinicSubdomain] = useState('');
  const [newClinicAddress, setNewClinicAddress] = useState('');
  const [newClinicPhone, setNewClinicPhone] = useState('+998901234567');
  const [newClinicFee, setNewClinicFee] = useState<number>(1500000);
  const [newClinicOwner, setNewClinicOwner] = useState('');

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

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = () => {
    if (!generatedCreds) return;
    const shareText = `Klinika: ${generatedCreds.clinicName}\nSubdomen: ${generatedCreds.subdomain}.dstoma.uz\nDirektor: ${generatedCreds.ownerName}\n\nBoshlang'ich Kirish Ma'lumotlari:\nLogin: ${generatedCreds.login}\nParol: ${generatedCreds.pass}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    triggerToast("Hisob ma'lumotlari buferga nusxalandi!");
    setTimeout(() => setCopied(false), 2000);
  };

  // SaaS calculations
  const totalClinics = clinics.length;
  const activeClinicsCount = clinics.filter(c => c.subscriptionStatus === 'active' || c.subscriptionStatus === 'trial').length;
  
  // Monthly Recurring Revenue (MRR) - sum of active clinics fee
  const currentMRR = clinics
    .filter(c => c.subscriptionStatus === 'active')
    .reduce((sum, c) => sum + (c.rentalPrice || 1500000), 0);

  const totalPatients = 205 + queues.length;

  const handleCreateClinicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newClinicSubdomain || !newClinicOwner) {
      triggerToast("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    // clean subdomain
    const cleanSubdomain = newClinicSubdomain.toLowerCase().trim().replace(/[^a-z0-h0-9]/g, '');
    const exists = clinics.some(c => c.subdomain === cleanSubdomain);
    if (exists) {
      triggerToast("Ushbu subdomen bilan ro'yxatdan o'tilgan!");
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
      lat: 41.311081, // Default center
      lng: 69.240562,
      logo: '🦷',
      rating: 5.0,
      activePatients: 0,
      rentalPrice: newClinicFee,
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subscriptionStatus: 'active',
      ownerName: newClinicOwner
    };

    onAddClinic(initialClinic);
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
    triggerToast("Yangi filial tarmogqa muvaffaqiyatli qo'shildi!");
  };

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl shadow-xl transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-750 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-950 text-cyan-400 rounded-2xl border border-cyan-800/60 shadow-inner">
            <Crown className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">SaaS Platform Owner</h2>
            <h1 className="text-xl font-extrabold mt-0.5">DStoma Queue - Super Admin Boshqaruv Markazi</h1>
            <p className="text-xs text-slate-400 mt-0.5">Global ko'rsatkichlar, barcha klinikalar billing tizimi va obunalar monitoringi.</p>
          </div>
        </div>
      </div>

      {/* GLOBAL KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              Jami faol klinikalar
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {activeClinicsCount} / {totalClinics}
            </div>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              Monthly Recurring Revenue (MRR)
            </span>
            <div className="text-md font-extrabold text-[#0284c7] font-mono mt-2">
              {currentMRR.toLocaleString('uz-UZ')} so'm
            </div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              Tizimdagi jami shifokorlar
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {doctors.length} nafar
            </div>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-150/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-widest">
              Jami Navbatlar & Bemorlar
            </span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {totalPatients} ta chipta
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Add Clinic Form (SaaS Onboarding) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
              <span className="text-xl">🏢</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Yangi Filial (Tenant Clinic) Qo'shish
              </h3>
            </div>

            <form onSubmit={handleCreateClinicSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Klinika Nomi *
                </label>
                <input
                  type="text"
                  required
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  placeholder="Masalan: DStoma Buxoro filial"
                  className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">
                    Subdomen (SaaS Subdomain) *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-cyan-500">
                    <input
                      type="text"
                      required
                      value={newClinicSubdomain}
                      onChange={(e) => setNewClinicSubdomain(e.target.value.toLowerCase())}
                      placeholder="buxoro"
                      className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold font-mono">.dstoma.uz</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">
                    Direktor Ismi (CEO) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClinicOwner}
                    onChange={(e) => setNewClinicOwner(e.target.value)}
                    placeholder="Masalan: Aziz Alimov"
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">
                    Oylik Litsenziya Haqi *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    <input
                      type="number"
                      required
                      value={newClinicFee}
                      onChange={(e) => setNewClinicFee(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none font-mono"
                    />
                    <span className="text-[9px] text-slate-500 font-extrabold shrink-0">so'm/oy</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">
                    Telefon Raqami
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
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Klinika Manzili
                </label>
                <input
                  type="text"
                  value={newClinicAddress}
                  onChange={(e) => setNewClinicAddress(e.target.value)}
                  placeholder="Yunusobod tumani, Toshkent"
                  className="w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-md cursor-pointer transition-all text-center flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                Yangi Filialni Qabul Qilish
              </button>
            </form>
          </div>

          {/* Generated Credentials Access Control Panel (AS REQUESTED) */}
          <AnimatePresence>
            {generatedCreds && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 text-white p-5 rounded-3xl border border-slate-850 shadow-xl space-y-4 text-left relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 pointer-events-none opacity-25 bg-[radial-gradient(circle,rgba(6,182,212,0.15),transparent_70%)]"></div>
                
                <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                  <span className="text-[10px] font-extrabold text-indigo-400 tracking-wider uppercase flex items-center gap-1">
                    🔓 Direktor Boshlang'ich Kirish Kaliti
                  </span>
                  <button 
                    onClick={() => setGeneratedCreds(null)}
                    className="text-slate-550 hover:text-slate-350 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-850 space-y-2">
                    <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                      Klinika direktori kabinetga kirishi uchun quyidagi ma'lumotlarni nusxalash tugmasi orqali yuboring:
                    </p>
                    <div className="font-mono text-[11px] space-y-1 text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-900 select-all">
                      <p><span className="text-slate-500">Filial:</span> {generatedCreds.clinicName}</p>
                      <p><span className="text-slate-500">Subdomen:</span> {generatedCreds.subdomain}.dstoma.uz</p>
                      <p><span className="text-slate-500">Direktor:</span> {generatedCreds.ownerName}</p>
                      <hr className="border-slate-850 my-1 py-0" />
                      <p className="text-cyan-400"><span className="text-slate-500">Login:</span> {generatedCreds.login}</p>
                      <p className="text-emerald-400"><span className="text-slate-500">Parol:</span> {generatedCreds.pass}</p>
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
                        <Copy className="w-4 h-4" /> Barcha Ma'lumotlarni Nusxalash
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: Billing and Subscriptions List */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">💳</span>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Billing va Obunalar Nazorati
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-extrabold font-mono rounded-lg">
                Joriy MRR: {currentMRR.toLocaleString('uz-UZ')} so'm
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Obuna muddati tugagan klinika filiallarini birgina tugma orqali <span className="text-rose-600 font-bold">'suspended'</span> holatiga o'tkazishingiz yoki faollashtirishingiz mumkin.
            </p>

            <div className="space-y-3.5">
              {clinics.map((clinic) => {
                const subStatus = clinic.subscriptionStatus || 'active';
                const fee = clinic.rentalPrice || 1500000;
                
                return (
                  <div key={clinic.id} className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-150/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{clinic.logo}</span>
                        <h4 className="text-xs font-extrabold text-slate-850 leading-none">{clinic.name}</h4>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded font-mono">
                          {clinic.subdomain}.dstoma.uz
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">Rahbar: <span className="text-slate-600">{clinic.ownerName || "Kiritilmagan"}</span></p>
                      
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[10px] font-bold text-slate-500">
                          Narxi: <strong className="text-slate-800 font-mono font-extrabold">{fee.toLocaleString('uz-UZ')} so'm/oy</strong>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Muddati: <strong className="text-slate-600">{clinic.nextPaymentDate || '2026-07-01'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`px-2 py-1 text-[9px] font-extrabold uppercase rounded-full ${
                        subStatus === 'active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : subStatus === 'trial' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {subStatus === 'active' ? 'Active' : subStatus === 'trial' ? 'Trial' : 'Suspended'}
                      </span>

                      <button
                        onClick={() => onToggleSubscription(clinic.id)}
                        className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg cursor-pointer transition-all ${
                          subStatus === 'suspended'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        {subStatus === 'suspended' ? 'Faollashtirish' : 'Bloklash/Suspend'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
