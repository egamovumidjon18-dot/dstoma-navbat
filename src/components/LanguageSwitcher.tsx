import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { Language } from '../translations';

// Country codes for flag images (flagcdn.com) — used instead of flag emoji because
// Windows browsers commonly render regional-indicator flag emoji as plain 2-letter
// boxes instead of actual flag graphics.
export const LANGUAGE_META: Record<Language, { countryCode: string; native: string }> = {
  uz: { countryCode: 'uz', native: "O'zbekcha" },
  ru: { countryCode: 'ru', native: 'Русский' },
  en: { countryCode: 'gb', native: 'English' },
  kk: { countryCode: 'kz', native: 'Қазақша' },
  ky: { countryCode: 'kg', native: 'Кыргызча' },
  tg: { countryCode: 'tj', native: 'Тоҷикӣ' },
  tk: { countryCode: 'tm', native: 'Türkmençe' },
};

export function FlagIcon({ countryCode, className }: { countryCode: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/24x18/${countryCode}.png`}
      srcSet={`https://flagcdn.com/48x36/${countryCode}.png 2x`}
      alt={countryCode.toUpperCase()}
      className={`inline-block rounded-[2px] object-cover shadow-sm ${className || ''}`}
    />
  );
}

export function LanguageSwitcher({
  language,
  setLanguage,
  variant = 'dark',
}: {
  language: Language;
  setLanguage: (l: Language) => void;
  // "dark" matches the landing page's HUD chrome; "light" matches the panels'
  // white-card UI (DoctorDashboard/DirectorDashboard/SuperAdminDashboard).
  variant?: 'dark' | 'light';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const current = LANGUAGE_META[language] || LANGUAGE_META.uz;
  const isLight = variant === 'light';

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          isLight
            ? 'flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer'
            : 'flex items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer'
        }
      >
        <FlagIcon countryCode={current.countryCode} className="w-[18px] h-[13px]" />
        <span className={`text-[10px] font-black uppercase hidden sm:inline ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{language}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isLight ? 'text-slate-400' : 'text-slate-500'} ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl overflow-hidden z-[300] py-1.5 ${isLight ? 'bg-white border border-slate-200 shadow-black/10' : 'bg-[#0b1022] border border-slate-800 shadow-black/40'}`}>
          {(Object.keys(LANGUAGE_META) as Language[]).map((lang) => {
            const meta = LANGUAGE_META[lang];
            const isActive = language === lang;
            return (
              <button
                key={lang}
                onClick={() => { setLanguage(lang); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  isActive
                    ? (isLight ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-500/10 text-cyan-300')
                    : (isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-slate-800/60')
                }`}
              >
                <FlagIcon countryCode={meta.countryCode} className="w-5 h-[15px]" />
                <span className="text-xs font-bold flex-1">{meta.native}</span>
                {isActive && <Check className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
