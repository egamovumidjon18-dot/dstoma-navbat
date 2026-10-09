import React, { useState } from 'react';
import { ArrowLeft, Building2, CheckCircle2, Copy, Phone, Send, ShieldAlert, User } from 'lucide-react';
import type { Language } from '../../translations';
import { getWelcomeCopy } from './translations';
import DStomaLogo from './DStomaLogo';
import LanguageSelector from './LanguageSelector';

// Public clinic self-registration — the counterpart to UnifiedLoginScreen for
// someone who has no account at all. A clinic arrives here (typically from a QR
// code), gives three details, and is signed straight into their own director
// panel with credentials shown once.

export const SUPPORT_PHONE = '+998 88 958 88 48';
export const SUPPORT_PHONE_TEL = '+998889588848';
export const SUPPORT_TELEGRAM = 'dr_egamov_u';

interface Props {
  language: Language;
  setLanguage: (l: Language) => void;
  onBack: () => void;
  onGoLogin: () => void;
  onSubmit: (input: {
    name: string;
    ownerName: string;
    phone: string;
    address?: string;
  }) => Promise<{ login: string; password: string } | { error: string }>;
  onDone: () => void;
}

const copy = {
  uz: {
    title: 'Klinikangizni ro’yxatdan o’tkazing',
    sub: 'Uch dona ma’lumot — va klinikangiz paneli tayyor. Keyin shifokorlaringizni o’zingiz qo’shasiz.',
    clinic: 'Klinika nomi',
    clinicPh: 'Masalan: Smile Dental',
    owner: 'Rahbar ismi-sharifi',
    ownerPh: 'Masalan: Aziz Karimov',
    phone: 'Telefon raqamingiz',
    address: 'Manzil (ixtiyoriy)',
    addressPh: 'Shahar, ko’cha',
    submit: 'Ro’yxatdan o’tish',
    submitting: 'Yaratilmoqda...',
    haveAccount: 'Hisobingiz bormi?',
    login: 'Kirish',
    doneTitle: 'Klinikangiz tayyor!',
    doneSub: 'Quyidagi login va parolni saqlab qo’ying — parol boshqa ko’rsatilmaydi.',
    loginLabel: 'Login',
    passLabel: 'Parol',
    copy: 'Nusxalash',
    copied: 'Nusxalandi',
    enter: 'Panelga kirish',
    nextTitle: 'Keyingi qadam',
    nextBody: 'Panelda "Shifokorlar" bo’limiga o’ting va shifokorlaringizni qo’shing — har biriga login va parol avtomatik yaratiladi.',
    helpTitle: 'Savol yoki muammo bo’lsa',
    helpBody: 'Istalgan vaqtda bevosita bog’laning:',
  },
  ru: {
    title: 'Зарегистрируйте свою клинику',
    sub: 'Три поля — и панель клиники готова. Затем добавите своих врачей.',
    clinic: 'Название клиники',
    clinicPh: 'Например: Smile Dental',
    owner: 'Ф.И.О. руководителя',
    ownerPh: 'Например: Азиз Каримов',
    phone: 'Ваш телефон',
    address: 'Адрес (необязательно)',
    addressPh: 'Город, улица',
    submit: 'Зарегистрироваться',
    submitting: 'Создаётся...',
    haveAccount: 'Есть аккаунт?',
    login: 'Войти',
    doneTitle: 'Клиника готова!',
    doneSub: 'Сохраните логин и пароль — пароль больше не покажется.',
    loginLabel: 'Логин',
    passLabel: 'Пароль',
    copy: 'Копировать',
    copied: 'Скопировано',
    enter: 'Войти в панель',
    nextTitle: 'Следующий шаг',
    nextBody: 'В панели откройте раздел "Врачи" и добавьте своих врачей — логин и пароль создаются автоматически.',
    helpTitle: 'Если возникнут вопросы',
    helpBody: 'Свяжитесь напрямую в любое время:',
  },
  en: {
    title: 'Register your clinic',
    sub: 'Three details and your clinic panel is ready. Then you add your own doctors.',
    clinic: 'Clinic name',
    clinicPh: 'e.g. Smile Dental',
    owner: 'Director full name',
    ownerPh: 'e.g. Aziz Karimov',
    phone: 'Your phone number',
    address: 'Address (optional)',
    addressPh: 'City, street',
    submit: 'Register',
    submitting: 'Creating...',
    haveAccount: 'Already have an account?',
    login: 'Sign in',
    doneTitle: 'Your clinic is ready!',
    doneSub: 'Save the login and password below — the password will not be shown again.',
    loginLabel: 'Login',
    passLabel: 'Password',
    copy: 'Copy',
    copied: 'Copied',
    enter: 'Open my panel',
    nextTitle: 'Next step',
    nextBody: 'In the panel, open "Doctors" and add your team — each one gets a login and password automatically.',
    helpTitle: 'Questions or problems',
    helpBody: 'Reach out directly any time:',
  },
};

const pick = (language: Language) =>
  language === 'ru' ? copy.ru : language === 'uz' ? copy.uz : copy.en;

export default function ClinicSignupScreen({
  language,
  setLanguage,
  onBack,
  onGoLogin,
  onSubmit,
  onDone,
}: Props) {
  const c = getWelcomeCopy(language);
  const L = pick(language);

  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creds, setCreds] = useState<{ login: string; password: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await onSubmit({
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setCreds(result);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    placeholder: string,
    Icon: typeof User,
    required = true,
    type = 'text',
  ) => (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-cyan-400">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-600 outline-none transition-colors focus:border-cyan-500/60"
        />
      </div>
    </div>
  );

  // Shown on both the form and the success panel: the moment a brand-new
  // customer hits a problem is exactly when they have nobody to ask.
  const supportBlock = (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">{L.helpTitle}</p>
      <p className="mt-1.5 text-xs text-slate-400">{L.helpBody}</p>
      <div className="mt-3 flex flex-col gap-2">
        <a
          href={`tel:${SUPPORT_PHONE_TEL}`}
          className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-bold text-white transition-colors hover:border-cyan-500/50"
        >
          <Phone className="h-4 w-4 shrink-0 text-cyan-400" />
          {SUPPORT_PHONE}
        </a>
        <a
          href={`https://t.me/${SUPPORT_TELEGRAM}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-bold text-white transition-colors hover:border-cyan-500/50"
        >
          <Send className="h-4 w-4 shrink-0 text-cyan-400" />
          @{SUPPORT_TELEGRAM}
        </a>
      </div>
    </div>
  );

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
          <div
            className="welcome-fade-in mb-8 flex flex-col items-center text-center"
            style={{ animationDelay: '150ms' }}
          >
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
            {!creds ? (
              <>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-extrabold text-white sm:text-[26px]">{L.title}</h1>
                  <p className="mt-2 text-sm text-slate-400">{L.sub}</p>
                </div>

                {error && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-300">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {field(L.clinic, name, setName, L.clinicPh, Building2)}
                  {field(L.owner, ownerName, setOwnerName, L.ownerPh, User)}
                  {field(L.phone, phone, setPhone, '+998 90 123 45 67', Phone, true, 'tel')}
                  {field(L.address, address, setAddress, L.addressPh, Building2, false)}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-3.5 text-sm font-black uppercase tracking-wider text-white transition-opacity disabled:opacity-50"
                  >
                    {submitting ? L.submitting : L.submit}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-500">
                  {L.haveAccount}{' '}
                  <button type="button" onClick={onGoLogin} className="font-bold text-cyan-400 hover:underline">
                    {L.login}
                  </button>
                </p>

                {supportBlock}
              </>
            ) : (
              <>
                <div className="mb-6 flex flex-col items-center text-center">
                  <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-400" />
                  <h1 className="text-2xl font-extrabold text-white">{L.doneTitle}</h1>
                  <p className="mt-2 text-sm text-slate-400">{L.doneSub}</p>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {L.loginLabel}
                    </p>
                    <p className="mt-0.5 break-all font-mono text-base font-black text-cyan-300">
                      {creds.login}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {L.passLabel}
                    </p>
                    <p className="mt-0.5 break-all font-mono text-base font-black text-emerald-300">
                      {creds.password}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `${L.loginLabel}: ${creds.login}\n${L.passLabel}: ${creds.password}`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-white transition-colors hover:border-cyan-500/50"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? L.copied : L.copy}
                </button>

                <button
                  type="button"
                  onClick={onDone}
                  className="mt-2.5 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-3.5 text-sm font-black uppercase tracking-wider text-white"
                >
                  {L.enter}
                </button>

                <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                    {L.nextTitle}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{L.nextBody}</p>
                </div>

                {supportBlock}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
