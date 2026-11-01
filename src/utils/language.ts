import { useSyncExternalStore } from 'react';
import type { Language } from '../translations';

// The chosen interface language, kept outside React state so it survives a
// reload (it used to reset to Uzbek every time) and so components that are not
// handed a `language` prop — the error boundary, the install banner — can still
// follow it.
const STORAGE_KEY = 'dstoma_language';
const LANGUAGES: Language[] = ['uz', 'ru', 'en', 'kk', 'ky', 'tg', 'tk'];

function initialLanguage(): Language {
  if (typeof window === 'undefined') return 'uz';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.includes(saved as Language)) return saved as Language;
  } catch {
    // Storage blocked (private mode, embedded webview) — fall through.
  }
  // First visit: take the browser's language when the app has it.
  for (const tag of navigator.languages || [navigator.language]) {
    const base = String(tag).toLowerCase().split('-')[0] as Language;
    if (LANGUAGES.includes(base)) return base;
  }
  return 'uz';
}

let current: Language = initialLanguage();
const listeners = new Set<() => void>();

if (typeof document !== 'undefined') document.documentElement.lang = current;

export function getLanguage(): Language {
  return current;
}

export function setStoredLanguage(language: Language) {
  if (language === current) return;
  current = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not persisted, but still applied for this session.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = language;
  listeners.forEach((notify) => notify());
}

export function useLanguage(): Language {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    getLanguage,
    () => 'uz' as Language,
  );
}
