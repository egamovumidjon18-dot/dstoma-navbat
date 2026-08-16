import React from 'react';
import { CalendarDays, Sparkles, MapPin } from 'lucide-react';

// Deliberately not "cards" — the reference composition has these reading as
// part of the hero column, so only the icon gets a bordered container while
// the text sits directly on the background.

const ICONS = [CalendarDays, Sparkles, MapPin];

interface Props {
  features: { title: string; description: string }[];
}

export default function FeatureList({ features }: Props) {
  return (
    <ul className="space-y-4 sm:space-y-5">
      {features.map((f, i) => {
        const Icon = ICONS[i] ?? CalendarDays;
        return (
          <li
            key={f.title}
            className="group flex items-start gap-4 welcome-fade-up"
            style={{ animationDelay: `${400 + i * 100}ms` }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_24px_rgba(0,200,255,0.28)]"
              style={{
                background: 'rgba(10, 32, 62, 0.6)',
                border: '1px solid rgba(80, 180, 255, 0.22)',
                boxShadow: '0 0 18px rgba(0, 180, 255, 0.10) inset',
              }}
            >
              <Icon className="h-5 w-5 text-cyan-300 transition-colors duration-300 group-hover:text-cyan-200" />
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-base sm:text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-0.5 text-sm sm:text-[15px] leading-relaxed text-slate-400">
                {f.description}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
