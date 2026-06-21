import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useAppState } from './hooks/useAppState';
import ClientDashboard from './components/ClientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import DirectorDashboard from './components/DirectorDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { KeyRound, ShieldAlert, LogOut, CheckCircle, Smartphone, Lock, ClipboardCheck } from 'lucide-react';

export default function App() {
  const {
    isAppLoading,
    clinics,
    doctors,
    services,
    queues,
    activeTab,
    setActiveTab,
    selectedClinic,
    setSelectedClinic,
    language,
    setLanguage,
    currentUser,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authError,
    superadminLogin,
    superadminPassword,
    gmailInboxes,
    saasPayments,
    userLocationRef,
    t,
    handleUpdateClinicCreds,
    handleUpdateDoctorCreds,
    handleUpdateDoctorDetails,
    handleDeleteClinic,
    handleDeleteDoctor,
    handleLoginSubmit,
    handleLogout,
    handleAddQueue,
    handleCancelQueue,
    handleUpdateQueueStatus,
    handleUpdateDoctorRating,
    handleToggleClinicStatus,
    handleUpdateClinicDetails,
    handlePaySubscriptionSimulate,
    handleApproveSaaSPayment,
    handleUpdateSuperadminCreds,
    handleAddClinic,
    handleAddDoctor,
    handleUpdateService,
    handleAddService,
    handleDeleteService
  } = useAppState();

  // Determine if user has permission to view a protected tab
  const hasAccess = (tab: 'shifokor' | 'boshliq' | 'superadmin') => {
    if (!currentUser) return false;
    if (currentUser.type === 'superadmin' && tab === 'superadmin') return true;
    if (tab === 'shifokor' && currentUser.type === 'doctor') return true;
    if (tab === 'boshliq' && currentUser.type === 'director') return true;
    return false;
  };

  return (
    <div className="w-full min-h-screen bg-[#020712] text-slate-100 antialiased font-sans flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* GLOBAL HUD HEADER & NAVIGATION */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#020712]/80 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="group flex items-center gap-3 cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={() => setActiveTab('bemor')}>
            <span className="text-[26px] inline-block animate-float-glow group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-400">🦷</span>
            <div className="group-hover:translate-x-1 transition-transform duration-300">
              <span className="font-display font-black text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">
                DStoma Queue
              </span>
              <span className="text-[8px] block -mt-1 font-mono text-cyan-500 font-bold tracking-widest uppercase">
                Smart Dental AI Portal
              </span>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#090f1d] p-1 rounded-xl border border-white/[0.04]">
            <button
              onClick={() => setActiveTab('bemor')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'bemor'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {language === 'uz' ? 'Bemor Kabineti' : language === 'ru' ? 'Кабинет Пациента' : 'Patient Cabinet'}
            </button>
            <button
              onClick={() => setActiveTab('shifokor')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'shifokor'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {language === 'uz' ? 'Shifokor Paneli' : language === 'ru' ? 'Панель Врача' : 'Doctor Panel'}
            </button>
            <button
              onClick={() => setActiveTab('boshliq')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'boshliq'
                  ? 'bg-violet-500 text-slate-950 shadow-md font-extrabold scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {language === 'uz' ? 'Boshliq Paneli' : language === 'ru' ? 'Панель Директора' : 'Boss Panel'}
            </button>
            <button
              onClick={() => setActiveTab('superadmin')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'superadmin'
                  ? 'bg-indigo-500 text-slate-950 shadow-md font-extrabold scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {language === 'uz' ? 'Superadmin SaaS' : language === 'ru' ? 'Суперадмин SaaS' : 'Superadmin SaaS'}
            </button>
          </nav>

          {/* Language Switcher & Active Role Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              {(['uz', 'ru', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                    language === lang
                      ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline-block px-2 py-1 text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-black uppercase tracking-wider">
                  {currentUser.name || currentUser.type}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-white/[0.03] bg-[#030916]">
          <button
            onClick={() => setActiveTab('bemor')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-extrabold transition-all uppercase ${
              activeTab === 'bemor' ? 'text-emerald-400 font-black' : 'text-slate-500'
            }`}
          >
            <span>🦷</span>
            <span>{language === 'uz' ? 'PATIENT' : 'PATIENT'}</span>
          </button>
          <button
            onClick={() => setActiveTab('shifokor')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-extrabold transition-all uppercase ${
              activeTab === 'shifokor' ? 'text-cyan-400 font-black' : 'text-slate-500'
            }`}
          >
            <span>👨‍⚕️</span>
            <span>{language === 'uz' ? 'DOCTOR' : 'DOCTOR'}</span>
          </button>
          <button
            onClick={() => setActiveTab('boshliq')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-extrabold transition-all uppercase ${
              activeTab === 'boshliq' ? 'text-violet-400 font-black' : 'text-slate-500'
            }`}
          >
            <span>💼</span>
            <span>{language === 'uz' ? 'DIRECTOR' : 'DIRECTOR'}</span>
          </button>
          <button
            onClick={() => setActiveTab('superadmin')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-extrabold transition-all uppercase ${
              activeTab === 'superadmin' ? 'text-indigo-400 font-black' : 'text-slate-500'
            }`}
          >
            <span>👑</span>
            <span>{language === 'uz' ? 'SAAS' : 'SAAS'}</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD ROUTING MAIN VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {isAppLoading ? (
          <div className="flex flex-col items-center justify-center my-auto w-full h-full pb-20">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="mt-5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              {language === 'uz' ? "Ma'lumotlar yuklanmoqda..." : "Loading..."}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'bemor' && (
              <ErrorBoundary>
                <ClientDashboard
                  clinics={clinics}
                  doctors={doctors}
                  services={services}
                  queues={queues}
                  selectedClinic={selectedClinic}
                  onSelectClinic={setSelectedClinic}
                  onAddQueue={handleAddQueue}
                  onCancelQueue={handleCancelQueue}
                  onUpdateDoctorRating={handleUpdateDoctorRating}
                  setActiveTab={setActiveTab}
                  language={language}
                  userLocationRef={userLocationRef}
                />
              </ErrorBoundary>
            )}

        {activeTab === 'shifokor' && (
          hasAccess('shifokor') ? (
            <ErrorBoundary>
              <DoctorDashboard
                clinics={clinics}
                doctors={doctors}
                services={services}
                queues={queues}
                onUpdateQueueStatus={handleUpdateQueueStatus}
                selectedClinic={selectedClinic}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                language={language}
              />
            </ErrorBoundary>
          ) : (
            <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full my-auto py-12">
              <SecurityLoginForm role="doctor" onSubmit={handleLoginSubmit} language={language} error={authError} authUsername={authUsername} setAuthUsername={setAuthUsername} authPassword={authPassword} setAuthPassword={setAuthPassword} />
            </div>
          )
        )}

        {activeTab === 'boshliq' && (
          hasAccess('boshliq') ? (
            <ErrorBoundary>
              <DirectorDashboard
                clinics={clinics}
                doctors={doctors}
                services={services}
                queues={queues}
                setActiveTab={setActiveTab}
                onAddDoctor={handleAddDoctor}
                onDeleteDoctor={handleDeleteDoctor}
                onUpdateService={handleUpdateService}
                onAddService={handleAddService}
                onDeleteService={handleDeleteService}
                clinicId={currentUser?.clinicId || 'samarqand'}
                onSimulatePayment={handlePaySubscriptionSimulate}
                saasPayments={saasPayments}
                language={language}
              />
            </ErrorBoundary>
          ) : (
            <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full my-auto py-12">
              <SecurityLoginForm role="director" onSubmit={handleLoginSubmit} language={language} error={authError} authUsername={authUsername} setAuthUsername={setAuthUsername} authPassword={authPassword} setAuthPassword={setAuthPassword} />
            </div>
          )
        )}

        {activeTab === 'superadmin' && (
          hasAccess('superadmin') ? (
            <ErrorBoundary>
              <SuperAdminDashboard
                clinics={clinics}
                queues={queues}
                doctors={doctors}
                onAddClinic={handleAddClinic}
                onAddDoctor={handleAddDoctor}
                onToggleSubscription={handleToggleClinicStatus}
                onUpdateClinicCreds={handleUpdateClinicCreds}
                onUpdateDoctorCreds={handleUpdateDoctorCreds}
                onUpdateDoctorDetails={handleUpdateDoctorDetails}
                onDeleteClinic={handleDeleteClinic}
                onDeleteDoctor={handleDeleteDoctor}
                language={language}
                saasPayments={saasPayments}
                onApproveSaaSPayment={handleApproveSaaSPayment}
                onUpdateClinicDetails={handleUpdateClinicDetails}
                superadminLogin={superadminLogin}
                superadminPassword={superadminPassword}
                onUpdateSuperadminCreds={handleUpdateSuperadminCreds}
                gmailInboxes={gmailInboxes}
              />
            </ErrorBoundary>
          ) : (
            <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full my-auto py-12">
              <SecurityLoginForm role="superadmin" onSubmit={handleLoginSubmit} language={language} error={authError} authUsername={authUsername} setAuthUsername={setAuthUsername} authPassword={authPassword} setAuthPassword={setAuthPassword} />
            </div>
          )
        )}
        </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-slate-900 bg-[#020712] text-center text-xs text-slate-500 font-mono">
        <p>© 2026 DStoma SaaS Technologies Inc. All Rights Reserved. Dynamic Multi-Tenant Network.</p>
      </footer>
      <Analytics />
    </div>
  );
}

// PREMIUM LOCALIZED LOGIN FORM OVERLAY & DRAWER WITH DEMO CREDENTIAL CARD DIRECT ENTRANCE
interface SecurityLoginFormProps {
  role: 'doctor' | 'director' | 'superadmin';
  onSubmit: (e: React.FormEvent) => void;
  language: 'uz' | 'ru' | 'en';
  error: string | null;
  authUsername: string;
  setAuthUsername: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
}

function SecurityLoginForm({
  role,
  onSubmit,
  language,
  error,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword
}: SecurityLoginFormProps) {
  const getRoleLabel = () => {
    if (role === 'doctor') return language === 'uz' ? 'Shifokor Kabineti' : language === 'ru' ? 'Кабинет Врача' : 'Doctor Specialist Cabinet';
    if (role === 'director') return language === 'uz' ? 'Klinika Boshlig\'i Paneli' : language === 'ru' ? 'Панель Директора' : 'Clinic Director Panel';
    return language === 'uz' ? 'Superadmin SaaS' : language === 'ru' ? 'Суперадмин SaaS' : 'SaaS Superadmin HQ';
  };

  const getRoleIcon = () => {
    if (role === 'doctor') return '👨‍⚕️';
    if (role === 'director') return '🏢';
    return '👑';
  };

  return (
    <div id="security_login_form_wrapper" className="w-full bg-[#040c1d]/90 border border-[#0d264a] p-8 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400"></div>

      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#031126] border border-cyan-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
          {getRoleIcon()}
        </div>
        <h2 className="text-lg font-display font-black tracking-wider text-slate-100 uppercase">
          {getRoleLabel()}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto mt-2.5">
          {language === 'uz' 
            ? "Ushbu bo'lim faqat ro'yxatdan o'tgan mutaxassislar uchun mo'ljallangan. Profilingizga tegishli kalit so'zlarni kiriting."
            : "Authorized personnel authentication access only. Please provide secure parameters below."}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-400 flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-black mb-1.5">
            {language === 'uz' ? 'LOGIN / USERNAME' : 'LOGIN / USERNAME'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder="login/username"
              className="w-full bg-[#020814] border border-[#0d213d] hover:border-cyan-500/40 focus:border-cyan-500 focus:outline-none rounded-xl py-3 px-4 text-xs font-mono text-slate-100 placeholder-slate-600 transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono tracking-widest text-[#a855f7] uppercase font-black mb-1.5">
            {language === 'uz' ? 'KOD / PAROL' : 'ACCESS PASSWORD'}
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#020814] border border-[#0d213d] hover:border-[#a855f7]/40 focus:border-[#a855f7] focus:outline-none rounded-xl py-3 px-4 text-xs font-mono text-slate-100 placeholder-slate-600 transition-all shadow-inner"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 hover:brightness-110 active:scale-[0.99] text-slate-950 font-display font-extrabold text-xs uppercase py-3.5 rounded-xl tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{language === 'uz' ? 'Profilingizni ochish' : language === 'ru' ? 'Получить доступ' : 'Grant Clearance'}</span>
        </button>
      </form>
    </div>
  );
}
