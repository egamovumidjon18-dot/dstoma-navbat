import React from 'react';
import { UserPlus, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  registerLabel: string;
  loginLabel: string;
  securityLabel: string;
  onRegister: () => void;
  onLogin: () => void;
}

export default function AuthPanel({
  registerLabel,
  loginLabel,
  securityLabel,
  onRegister,
  onLogin,
}: Props) {
  return (
    <div className="welcome-fade-up" style={{ animationDelay: '700ms' }}>
      <div
        className="mx-auto w-full max-w-3xl p-4 sm:p-5"
        style={{
          background: 'rgba(5, 20, 45, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(80, 170, 255, 0.25)',
          borderRadius: 28,
        }}
      >
        {/* Primary — register */}
        <button
          type="button"
          onClick={onRegister}
          className="group relative flex h-[70px] w-full items-center justify-between gap-3 rounded-[22px] px-5 sm:px-7 text-slate-950 transition-all duration-300 hover:scale-[1.015] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#051428] sm:h-[80px] sm:rounded-[24px]"
          style={{
            background: 'linear-gradient(90deg, #14D8A0 0%, #06B6D4 46%, #087FE5 100%)',
            boxShadow: '0 12px 34px rgba(6, 160, 220, 0.34)',
          }}
        >
          <span className="flex items-center gap-3 sm:gap-4">
            <UserPlus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
            <span className="text-lg font-semibold sm:text-[22px]">{registerLabel}</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 sm:h-6 sm:w-6" />
          <span
            className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:rounded-[24px]"
            style={{ boxShadow: '0 0 46px rgba(0, 220, 200, 0.45)' }}
          />
        </button>

        {/* Secondary — login */}
        <button
          type="button"
          onClick={onLogin}
          className="group mt-3 flex h-[70px] w-full items-center justify-between gap-3 rounded-[22px] px-5 text-white transition-all duration-300 hover:scale-[1.012] hover:border-cyan-400/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#051428] sm:h-[80px] sm:rounded-[24px] sm:px-7"
          style={{
            background: 'rgba(9, 28, 56, 0.78)',
            border: '1px solid rgba(80, 170, 255, 0.28)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <span className="flex items-center gap-3 sm:gap-4">
            <Lock className="h-6 w-6 text-cyan-300 sm:h-7 sm:w-7" strokeWidth={2.2} />
            <span className="text-lg font-semibold sm:text-[22px]">{loginLabel}</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-cyan-300 sm:h-6 sm:w-6" />
        </button>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-medium text-slate-500 sm:text-sm">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/80" />
        <span>{securityLabel}</span>
      </p>
    </div>
  );
}
