import React from 'react';
import { Star, MapPin, Users, ArrowRight } from 'lucide-react';
import { Clinic } from '../types';

interface ClinicCardProps {
  clinic: Clinic;
  distanceKm?: number;
  onBook: () => void;
}

// Presentational card for the "nearby clinics" list on the patient-facing landing
// page. Clinic has no photo field, so the visual anchor is its logo/emoji in a
// colored tile rather than a placeholder photo implying a feature that isn't there.
const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, distanceKm, onBook }) => {
  const hasRatings = (clinic.ratingCount || 0) > 0;

  return (
    <div className="bg-[#0c1225] border border-[#1e3256]/60 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/40 transition-all group">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
        {clinic.logo || '🦷'}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-white truncate">{clinic.name}</h4>
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{clinic.address}</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            {hasRatings ? clinic.rating.toFixed(1) : "Yangi"}
            {hasRatings && <span className="text-slate-500 font-medium">({clinic.ratingCount})</span>}
          </span>
          {typeof distanceKm === 'number' && (
            <span className="text-[11px] font-bold text-cyan-400">{distanceKm.toFixed(1)} km</span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Users className="w-3 h-3" />
            {clinic.activePatients || 0}
          </span>
        </div>
      </div>

      <button
        onClick={onBook}
        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#04120c] text-xs font-black rounded-xl transition-colors group-hover:gap-2"
      >
        Navbat <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ClinicCard;
