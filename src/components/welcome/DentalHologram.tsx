import React from 'react';
import DStomaLogo from './DStomaLogo';

// The hero visual: the official DStoma mark presented as a hologram floating
// above a scanner platform, set inside a dimmed dental-clinic environment.
//
// Everything around the mark (rings, beams, platform, room) is built here in
// CSS — the mark itself is the untouched brand PNG, so the identity is never
// approximated or redrawn.

export default function DentalHologram() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[560px] welcome-scale-in">
      {/* ---------- Dental clinic environment (dimmed, blurred, non-competing) ---------- */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]"
        aria-hidden="true"
        style={{ opacity: 0.2, filter: 'blur(6px)' }}
      >
        {/* room falloff */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 68% 42%, rgba(12,48,92,0.55), transparent 62%), linear-gradient(160deg, #04101f 0%, #061a33 55%, #030b18 100%)',
          }}
        />
        {/* operatory lamp, upper right */}
        <div className="absolute right-[4%] top-[6%] h-[22%] w-[30%]">
          <div
            className="absolute inset-0 rounded-[26px]"
            style={{ background: 'linear-gradient(150deg,#12283f,#0a1725)' }}
          />
          <div className="absolute inset-x-[14%] top-[26%] grid grid-cols-3 gap-[8%]">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="aspect-square rounded-full"
                style={{
                  background: 'radial-gradient(circle,#eaf7ff 0%,#7fd4ff 55%,rgba(30,120,190,0) 100%)',
                }}
              />
            ))}
          </div>
          <div
            className="absolute -bottom-[8%] left-1/2 h-[22%] w-[8%] -translate-x-1/2"
            style={{ background: 'linear-gradient(180deg,#12283f,#0a1725)' }}
          />
        </div>

        {/* wall-mounted x-ray / vitals monitor, right */}
        <div
          className="absolute right-[3%] top-[36%] h-[24%] w-[26%] rounded-xl"
          style={{
            background: 'linear-gradient(150deg,#0a2b46,#08192b)',
            border: '1px solid rgba(90,170,240,0.22)',
            boxShadow: '0 0 30px rgba(20,120,200,0.22)',
          }}
        >
          <div
            className="absolute inset-[10%] rounded-md"
            style={{
              background:
                'repeating-linear-gradient(90deg, rgba(140,205,255,0.16) 0 6%, rgba(140,205,255,0.04) 6% 12%)',
            }}
          />
        </div>

        {/* dental chair silhouette, lower area */}
        <div className="absolute bottom-[2%] left-[8%] h-[34%] w-[64%]">
          <div
            className="absolute bottom-[26%] left-[6%] h-[42%] w-[76%] -rotate-[8deg] rounded-[40px]"
            style={{ background: 'linear-gradient(160deg,#0e2033,#081524)' }}
          />
          <div
            className="absolute bottom-0 left-[34%] h-[30%] w-[26%] rounded-b-2xl"
            style={{ background: 'linear-gradient(180deg,#0d1e30,#060f1b)' }}
          />
        </div>

        {/* instrument tray glint, left */}
        <div
          className="absolute left-[4%] top-[30%] h-[9%] w-[20%] rounded-full"
          style={{ background: 'linear-gradient(90deg,rgba(120,190,255,0.20),transparent)' }}
        />
      </div>

      {/* ---------- Ambient hologram bloom ---------- */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(0,200,255,0.20), transparent 55%), radial-gradient(circle at 50% 78%, rgba(0,235,190,0.16), transparent 46%)',
        }}
      />

      {/* ---------- Projection beam: platform -> mark ---------- */}
      <div
        className="pointer-events-none absolute left-1/2 top-[36%] h-[44%] w-[74%] -translate-x-1/2 welcome-pulse"
        aria-hidden="true"
        style={{
          clipPath: 'polygon(36% 0%, 64% 0%, 100% 100%, 0% 100%)',
          background:
            'linear-gradient(180deg, rgba(0,225,255,0.16) 0%, rgba(0,200,255,0.07) 45%, rgba(0,180,255,0.015) 100%)',
          filter: 'blur(14px)',
        }}
      />

      {/* ---------- Scanner ring orbiting the mark ---------- */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[34%] w-[74%] -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="h-full w-full welcome-orbit" style={{ transformStyle: 'preserve-3d' }}>
          <div
            className="absolute inset-0 rounded-[50%]"
            style={{
              border: '1.5px solid rgba(0,215,255,0.34)',
              transform: 'rotateX(74deg)',
              boxShadow: '0 0 26px rgba(0,200,255,0.30)',
            }}
          />
        </div>
      </div>

      {/* ---------- The brand mark, floating ---------- */}
      <div className="absolute left-1/2 top-[13%] w-[66%] -translate-x-1/2">
        <div className="relative welcome-float">
          <DStomaLogo variant="mark" alt="DStoma" className="w-full" />
          {/* Cyan bloom behind the mark so it reads as a projection, without
              tinting the mark's own brand colours. */}
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(circle, rgba(0,220,255,0.32), transparent 68%)',
              filter: 'blur(26px)',
            }}
          />
        </div>
      </div>

      {/* ---------- Drifting pixel fragments (echo of the mark's dissolve) ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {[
          { l: '20%', t: '20%', s: 7, d: '0s' },
          { l: '15%', t: '31%', s: 5, d: '1.2s' },
          { l: '26%', t: '14%', s: 4, d: '2.4s' },
          { l: '12%', t: '24%', s: 6, d: '3.1s' },
          { l: '78%', t: '22%', s: 5, d: '1.8s' },
          { l: '84%', t: '33%', s: 4, d: '0.6s' },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute rounded-[2px] welcome-particle"
            style={{
              left: p.l,
              top: p.t,
              width: p.s,
              height: p.s,
              animationDelay: p.d,
              background: 'rgba(90, 215, 255, 0.85)',
              boxShadow: '0 0 10px rgba(0,200,255,0.75)',
            }}
          />
        ))}
      </div>

      {/* ---------- Holographic scanner platform ---------- */}
      <div className="absolute bottom-[6%] left-1/2 h-[26%] w-[76%] -translate-x-1/2">
        {/* outer glow pool */}
        <div
          className="absolute inset-x-0 bottom-0 h-[76%] rounded-[50%] welcome-pulse"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,225,255,0.34) 0%, rgba(0,190,255,0.12) 45%, transparent 72%)',
            filter: 'blur(8px)',
          }}
        />
        {/* concentric rings */}
        {[
          { inset: '18%', op: 0.5 },
          { inset: '27%', op: 0.34 },
          { inset: '36%', op: 0.22 },
        ].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-[50%]"
            style={{
              left: r.inset,
              right: r.inset,
              bottom: '14%',
              height: `${52 - i * 12}%`,
              border: `1px solid rgba(0,220,255,${r.op})`,
              boxShadow: `0 0 18px rgba(0,200,255,${r.op * 0.5})`,
            }}
          />
        ))}
        {/* glass deck */}
        <div
          className="absolute inset-x-[6%] bottom-[6%] h-[46%] rounded-[50%]"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,60,110,0.55) 0%, rgba(4,24,48,0.85) 100%)',
            border: '1px solid rgba(70,190,255,0.34)',
            boxShadow:
              '0 0 40px rgba(0,180,255,0.28), inset 0 8px 26px rgba(0,200,255,0.16)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        />
        {/* wordmark on the deck face */}
        <span
          className="absolute inset-x-0 bottom-[13%] text-center text-[11px] sm:text-sm font-black tracking-[0.16em]"
          style={{
            background: 'linear-gradient(90deg,#38BDF8,#22C55E)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 18px rgba(0,200,255,0.28)',
          }}
        >
          DStoma
        </span>
      </div>
    </div>
  );
}
