import React, { useEffect, useState } from 'react';
import { Download, X, Menu } from 'lucide-react';

const DISMISS_KEY = 'dstoma_install_prompt_dismissed_at';
const DISMISS_DAYS = 14;

interface Props {
  dark?: boolean;
}

// Shown as soon as a visitor lands on the site — most people never notice the
// small browser-native install icon, so this surfaces it explicitly instead of
// waiting to be discovered. Chrome/Android can trigger the real install dialog
// directly once `beforeinstallprompt` fires (a one-click install); until then
// (or on browsers that never fire it, like desktop Firefox) it shows manual
// "browser menu" instructions instead of staying hidden. Safari/iOS never
// fires that event at all, so it always gets the Share > Add to Home Screen
// instructions. Silently does nothing if already running installed, or was
// dismissed recently (re-prompting every visit would just get it dismissed
// forever).
export default function InstallAppBanner({ dark = false }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafariDesktop, setIsSafariDesktop] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);
    // macOS Safari never fires beforeinstallprompt and has its own "Add to
    // Dock" flow (Safari 17+/macOS Sonoma+), completely different from the
    // Chrome-style "browser menu" instructions used for everything else.
    const safariDesktop = !iOS && /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
    setIsSafariDesktop(safariDesktop);
    setVisible(true);

    if (iOS || safariDesktop) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  const hint = isIOS
    ? "Pastdagi ulashish (Share) tugmasini bosib, \"Bosh ekranga qo'shish\"ni tanlang."
    : isSafariDesktop
    ? "Yuqoridagi ulashish (Share) tugmasini yoki \"Fayl\" menyusini bosib, \"Dock-ga qo'shish\" (Add to Dock)ni tanlang."
    : deferredPrompt
    ? "Tezroq va qulayroq foydalanish uchun telefoningizga/kompyuteringizga o'rnating."
    : "Brauzer menyusidan (⋮ yoki ...) \"Ilovani o'rnatish\" yoki \"Bosh ekranga qo'shish\"ni tanlang.";

  return (
    <div
      className={`relative rounded-2xl p-4 pr-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border ${
        dark
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-emerald-50 border-emerald-100'
      }`}
    >
      <button
        onClick={dismiss}
        className={`absolute top-3 right-3 p-1 ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
        aria-label="Yopish"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
            DStoma ilovasini o'rnating
          </p>
          <p className={`text-xs flex items-center gap-1 flex-wrap ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            {!isIOS && !deferredPrompt && <Menu className="w-3 h-3 shrink-0" />}
            {hint}
          </p>
        </div>
      </div>
      {!isIOS && deferredPrompt && (
        <button
          onClick={install}
          className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors self-start sm:self-auto"
        >
          O'rnatish
        </button>
      )}
    </div>
  );
}
