import React from 'react';
import { Home, Calendar, Plus, Smile, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onBook: () => void;
  onOpenMore: () => void;
}

// Mobile-only (md:hidden) bottom tab bar for the patient cabinet — the primary,
// thumb-reachable nav for the 4 most-used destinations plus a raised center "+"
// booking button. The existing hamburger drawer (all 9 nav items) stays reachable
// via "Profil" here rather than being replaced, so nothing that worked before is lost.
export default function BottomNav({ activeTab, onNavigate, onBook, onOpenMore }: BottomNavProps) {
  const item = (id: string, icon: React.ReactNode, label: string, onClick: () => void) => {
    const active = activeTab === id;
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
          active ? 'text-blue-600' : 'text-slate-400'
        }`}
      >
        {icon}
        <span className="text-[10px] font-bold">{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white border-t border-slate-200 flex items-stretch shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {item('bosh_sahifa', <Home size={20} />, "Bosh sahifa", () => onNavigate('bosh_sahifa'))}
      {item('navbatlar', <Calendar size={20} />, "Navbatlar", () => onNavigate('navbatlar'))}

      {/* Raised center action button */}
      <div className="flex-1 flex items-center justify-center relative">
        <button
          onClick={onBook}
          className="absolute -top-5 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 border-4 border-white transition-colors"
          aria-label="Yangi navbat olish"
        >
          <Plus size={26} />
        </button>
      </div>

      {item('tish_sxemasi', <Smile size={20} />, "Tish sxemasi", () => onNavigate('tish_sxemasi'))}

      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-slate-400"
      >
        <User size={20} />
        <span className="text-[10px] font-bold">Profil</span>
      </button>
    </nav>
  );
}
