import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'dstoma_install_prompt_dismissed_at';
const DISMISS_DAYS = 14;

// Shown once a patient is inside their own cabinet — Chrome/Android can trigger the
// real install dialog directly (captured via beforeinstallprompt); Safari/iOS never
// fires that event, so it gets static "Share > Add to Home Screen" instructions
// instead. Silently does nothing if the app is already running installed, or was
// dismissed recently (re-prompting every visit would just get it dismissed forever).
export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    if (iOS) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
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

  return (
    <div className="col-span-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-900">DStoma ilovasini o'rnating</p>
          <p className="text-xs text-slate-600">
            {isIOS
              ? "Pastdagi ulashish (share) tugmasini bosib, \"Bosh ekranga qo'shish\"ni tanlang."
              : "Tezroq va qulayroq foydalanish uchun telefoningizga o'rnating."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!isIOS && (
          <button
            onClick={install}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            O'rnatish
          </button>
        )}
        <button onClick={dismiss} className="p-2 text-slate-400 hover:text-slate-600" aria-label="Yopish">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
