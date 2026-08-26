import React, { useState } from 'react';
import { Bot, Sparkles, ChevronRight, Activity, Plus } from 'lucide-react';
import { Patient } from '../types';
import { decodeLegacyEntities } from '../utils/textFormat';

export default function AIAssistantWidget({ patientId, patient }: { patientId: string | number; patient?: Patient }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<null | any>(null);
  const [noData, setNoData] = useState(false);

  const analyze = () => {
    setAnalyzing(true);
    setNoData(false);
    // Uses the most recent real diagnosis recorded for this patient (see DentalChart's
    // AI diagnostic flow) instead of a fabricated response, so the analysis actually
    // reflects the selected patient.
    setTimeout(() => {
      setAnalyzing(false);
      const diagnoses = patient?.diagnoses || [];
      if (diagnoses.length === 0) {
        setNoData(true);
        return;
      }
      const latest = [...diagnoses].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      const alerts: string[] = [];
      if (patient?.allergies) {
        alerts.push(`Bemor ${decodeLegacyEntities(patient.allergies)} ga allergiyasi bor (Diqqat qiling!)`);
      }
      if (patient?.hasInfection) {
        alerts.push("Bemorda infeksiya holati qayd etilgan");
      }
      setResult({
        summary: `${latest.toothNumber}-tish bo'yicha so'nggi tahlil (${new Date(latest.createdAt).toLocaleDateString('uz-UZ')}): ${decodeLegacyEntities(latest.diagnosticText)}`,
        recommendations: latest.actionPlan?.length ? latest.actionPlan : [decodeLegacyEntities(latest.recommendedTreatment) || ''],
        alerts,
      });
    }, 600);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h4 className="font-bold text-indigo-100 text-base flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" /> AI Diagnostika Yordamchisi
        </h4>
        {!result && !analyzing && !noData && (
          <button onClick={analyze} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Tahlil qilish
          </button>
        )}
      </div>

      {analyzing && (
        <div className="py-8 flex flex-col items-center justify-center text-indigo-300 relative z-10">
          <Activity className="w-8 h-8 animate-pulse text-indigo-400 mb-3" />
          <p className="text-sm font-medium animate-pulse">Bemor tarixini tahlil qilmoqda...</p>
        </div>
      )}

      {!analyzing && noData && (
        <div className="py-6 flex flex-col items-center justify-center text-center text-indigo-200/70 relative z-10">
          <Bot className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs">
            Ushbu bemor uchun hali AI tish diagnostikasi amalga oshirilmagan.
            Tahlil qilish uchun "Dental Chart" bo'limidan foydalaning.
          </p>
          <button onClick={() => setNoData(false)} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            Yopish
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4 relative z-10 animate-fade-in">
          <div className="bg-slate-900/50 p-3 rounded-xl border border-indigo-500/20 text-sm text-indigo-100 leading-relaxed">
            {result.summary}
          </div>
          
          {result.alerts.map((alert: string, i: number) => (
             <div key={i} className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
               <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
               {alert}
             </div>
          ))}

          <div>
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Tavsiya etilgan qadamlar:</h5>
            <div className="space-y-2">
              {result.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-700 hover:border-indigo-500/40 transition-colors group cursor-pointer">
                  <div className="mt-0.5 bg-indigo-500/20 text-indigo-400 w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <p className="text-xs text-slate-300 group-hover:text-white transition-colors flex-1">{rec}</p>
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:text-white transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2 flex justify-end">
             <button onClick={() => setResult(null)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors">
               Qayta tahlil qilish <ChevronRight className="w-3 h-3" />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
