import React from 'react';
import type { Language } from '../translations';
import { getWelcomeCopy } from './welcome/translations';
import DStomaLogo from './welcome/DStomaLogo';
import LanguageSelector from './welcome/LanguageSelector';
import FeatureList from './welcome/FeatureList';
import DentalHologram from './welcome/DentalHologram';
import AuthPanel from './welcome/AuthPanel';

// The front door of the platform: the first screen an unauthenticated visitor
// sees. It replaced the old role-tab bar (Bemor/Shifokor/Boshliq/Superadmin),
// which exposed every internal panel to the public landing page.

interface Props {
  language: Language;
  setLanguage: (l: Language) => void;
  onRegister: () => void;
  onLogin: () => void;
}

export default function WelcomeScreen({ language, setLanguage, onRegister, onLogin }: Props) {
  const c = getWelcomeCopy(language);

  return (
    <div className="welcome-root relative min-h-screen w-full overflow-x-hidden text-slate-100 antialiased">
      {/* Ambient drifting motes — kept very sparse so the background never reads as noisy. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { l: '12%', t: '22%', s: 3, d: '0s' },
          { l: '31%', t: '68%', s: 2, d: '2.5s' },
          { l: '58%', t: '14%', s: 2, d: '1.1s' },
          { l: '72%', t: '77%', s: 3, d: '3.4s' },
          { l: '88%', t: '38%', s: 2, d: '4.2s' },
          { l: '45%', t: '88%', s: 2, d: '1.8s' },
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        {/* ---------------- Header ---------------- */}
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div className="welcome-fade-in group flex flex-col">
            <DStomaLogo
              variant="full"
              glow
              className="h-14 w-auto transition-transform duration-500 group-hover:scale-[1.03] sm:h-16 lg:h-[76px]"
            />
            <span className="mt-1.5 pl-0.5 text-[8px] font-bold uppercase tracking-[0.28em] text-cyan-500/70 sm:text-[9px]">
              {c.brandTagline}
            </span>
          </div>

          <div className="welcome-fade-in shrink-0" style={{ animationDelay: '120ms' }}>
            <LanguageSelector
              language={language}
              setLanguage={setLanguage}
              label={c.languageLabel}
            />
          </div>
        </header>

        {/* ---------------- Hero ---------------- */}
        <main className="flex flex-1 flex-col justify-center gap-10 py-8 lg:gap-12 lg:py-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[45fr_55fr] lg:gap-8">
            {/* Headline + description */}
            <div className="order-1 lg:col-start-1 lg:row-start-1">
              <h1
                className="welcome-fade-up text-[34px] font-extrabold leading-[1.06] tracking-tight sm:text-[46px] lg:text-[58px] xl:text-[64px]"
                style={{ animationDelay: '150ms' }}
              >
                {c.titlePre}
                <span
                  style={{
                    background: 'linear-gradient(90deg, #22D3EE, #22C55E)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {c.titleHighlight}
                </span>
                {c.titlePost}
              </h1>

              <p
                className="welcome-fade-up mt-5 max-w-md text-base leading-relaxed text-slate-300 sm:text-lg lg:text-[20px]"
                style={{ animationDelay: '280ms' }}
              >
                {c.description}
              </p>
            </div>

            {/* Hologram */}
            <div className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <DentalHologram />
            </div>

            {/* Features */}
            <div className="order-3 lg:col-start-1 lg:row-start-2">
              <FeatureList features={c.features} />
            </div>
          </div>

          {/* ---------------- Authentication ---------------- */}
          <AuthPanel
            registerLabel={c.register}
            loginLabel={c.login}
            securityLabel={c.security}
            onRegister={onRegister}
            onLogin={onLogin}
          />
        </main>
      </div>
    </div>
  );
}
