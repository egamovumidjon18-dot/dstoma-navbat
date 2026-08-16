import React, { useState } from 'react';
import { ArrowLeft, Lock, LogIn, ShieldAlert, User } from 'lucide-react';
import type { Language } from '../../translations';
import { getWelcomeCopy } from './translations';
import DStomaLogo from './DStomaLogo';
import LanguageSelector from './LanguageSelector';

// One login screen for every account type on the platform — patient, doctor,
// clinic director, superadmin. It doesn't ask which kind of account this is;
// handleLoginSubmit tries each server-side in turn and reports back which one
// matched, and the caller (App.tsx) routes to that role's screen. So this
// component itself stays role-agnostic, both in what it asks for and in how
// it looks — no "patient cabinet" branding, since it isn't one.

interface Props {
  language: Language;
  setLanguage: (l: Language) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onGoRegister: () => void;
}

export default function UnifiedLoginScreen({
  language,
  setLanguage,
  username,
  setUsername,
  password,
  setPassword,
  error,
  onSubmit,
  onBack,
  onGoRegister,
}: Props) {
  const c = getWelcomeCopy(language);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    setSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="welcome-root relative min-h-screen w-full overflow-x-hidden text-slate-100 antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { l: '14%', t: '18%', s: 3, d: '0s' },
          { l: '82%', t: '28%', s: 2, d: '1.6s' },
          { l: '68%', t: '72%', s: 3, d: '2.8s' },
          { l: '22%', t: '80%', s: 2, d: '3.6s' },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full welcome-particle"
            style={{
              left: p.l,
              top: p.t,
              width: p.s,
              height: p.s,
              animationDelay: p.d,
              background: 'rgba(120, 210, 255, 0.6)',
              boxShadow: '0 0 8px rgba(0,190,255,0.55)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="welcome-fade-in flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'uz' ? 'Orqaga' : language === 'ru' ? 'Назад' : 'Back'}
          </button>
          <div className="welcome-fade-in shrink-0" style={{ animationDelay: '100ms' }}>
            <LanguageSelector language={language} setLanguage={setLanguage} label={c.languageLabel} />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="welcome-fade-in mb-8 flex flex-col items-center text-center" style={{ animationDelay: '150ms' }}>
            <DStomaLogo variant="full" glow className="h-14 w-auto" />
          </div>

          <div
            className="welcome-fade-up w-full p-6 sm:p-8"
            style={{
              animationDelay: '250ms',
              background: 'rgba(5, 20, 45, 0.72)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(80, 170, 255, 0.25)',
              borderRadius: 28,
            }}
          >
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-white sm:text-[26px]">
                {language === 'uz' ? 'Xush kelibsiz' : language === 'ru' ? 'Добро пожаловать' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {language === 'uz'
                  ? 'Login va parolingizni kiriting — tizim sizni avtomatik tanib, o’z panelingizga yo’naltiradi.'
                  : language === 'ru'
                  ? 'Введите логин и пароль — система сама определит вашу роль и откроет нужную панель.'
                  : 'Enter your login and password — the system recognizes your account and opens the right panel.'}
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-300">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                  {language === 'uz' ? 'Login' : language === 'ru' ? 'Логин' : 'Login'}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={language === 'uz' ? 'Login yoki kod' : language === 'ru' ? 'Логин или код' : 'Login or code'}
                    className="w-full rounded-xl border border-[#0d213d] bg-[#020814] py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 shadow-inner transition-all hover:border-cyan-500/40 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                  {language === 'uz' ? 'Parol' : language === 'ru' ? 'Пароль' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#0d213d] bg-[#020814] py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 shadow-inner transition-all hover:border-cyan-500/40 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-lg transition-all hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70"
                style={{
                  background: 'linear-gradient(90deg, #14D8A0 0%, #06B6D4 46%, #087FE5 100%)',
                  boxShadow: '0 10px 28px rgba(6, 160, 220, 0.32)',
                }}
              >
                <LogIn className="h-4 w-4" />
                {submitting
                  ? language === 'uz'
                    ? 'Tekshirilmoqda...'
                    : language === 'ru'
                    ? 'Проверка...'
                    : 'Checking...'
                  : language === 'uz'
                  ? 'Tizimga kirish'
                  : language === 'ru'
                  ? 'Войти'
                  : 'Log in'}
              </button>
            </form>

            <button
              type="button"
              onClick={onGoRegister}
              className="mt-5 w-full text-center text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-300"
            >
              {language === 'uz'
                ? 'Hisobingiz yo’qmi? '
                : language === 'ru'
                ? 'Нет аккаунта? '
                : "Don't have an account? "}
              <span className="text-cyan-400">{c.register}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
