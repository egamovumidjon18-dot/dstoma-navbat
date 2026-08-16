import React, { useEffect, useRef, useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import type { Language } from '../../translations';

// Every locale the platform ships, labelled in its own script so a speaker can
// find their language without reading any of the others.
const OPTIONS: { code: Language; label: string; short: string }[] = [
  { code: 'uz', label: "O‘zbekcha", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'kk', label: 'Қазақша', short: 'KK' },
  { code: 'ky', label: 'Кыргызча', short: 'KY' },
  { code: 'tg', label: 'Тоҷикӣ', short: 'TG' },
  { code: 'tk', label: 'Türkmençe', short: 'TK' },
];

interface Props {
  language: Language;
  setLanguage: (l: Language) => void;
  label: string;
}

export default function LanguageSelector({ language, setLanguage, label }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.code === language) ?? OPTIONS[0];

  // Close on outside click / Escape so the dropdown never traps the page.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex items-center gap-2 sm:gap-2.5 rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold text-slate-100 transition-all duration-300 hover:border-cyan-400/45 hover:bg-[#0b2244]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        style={{
          background: 'rgba(10, 30, 60, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(80, 180, 255, 0.25)',
        }}
      >
        <Globe className="h-4 w-4 text-cyan-300" />
        <span className="tracking-wide">{current.short}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 max-h-[60vh] w-44 overflow-y-auto rounded-2xl py-1.5 shadow-2xl shadow-black/60"
          style={{
            background: 'rgba(6, 20, 45, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(80, 180, 255, 0.25)',
          }}
        >
          {OPTIONS.map((opt) => {
            const active = opt.code === language;
            return (
              <li key={opt.code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLanguage(opt.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:bg-cyan-500/15 ${
                    active ? 'text-cyan-300' : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {active && <Check className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
