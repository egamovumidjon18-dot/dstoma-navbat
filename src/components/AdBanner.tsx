import React, { useEffect, useState } from 'react';
import { Advertisement } from '../types';

type Placement = 'web_home' | 'web_patient_panel' | 'web_queue_screen';

export default function AdBanner({ placement, clinicId }: { placement: Placement; clinicId?: string }) {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ads')
      .then(res => (res.ok ? res.json() : []))
      .then((ads: Advertisement[]) => {
        if (cancelled) return;
        const eligible = ads.filter(a => a.placements?.includes(placement) && (!a.clinicId || a.clinicId === clinicId));
        setAd(eligible[0] || null);
      })
      .catch(() => { if (!cancelled) setAd(null); });
    return () => { cancelled = true; };
  }, [placement, clinicId]);

  if (!ad) return null;

  const content = (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      {ad.imageUrl && (
        <img src={ad.imageUrl} alt={ad.title} className="w-full max-h-40 object-cover" />
      )}
      <div className="p-3">
        <p className="text-xs font-black text-slate-800">{ad.title}</p>
        {ad.body && <p className="text-[11px] text-slate-500 mt-0.5">{ad.body}</p>}
      </div>
    </div>
  );

  if (ad.linkUrl) {
    return (
      <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block my-3">
        {content}
      </a>
    );
  }
  return <div className="my-3">{content}</div>;
}
