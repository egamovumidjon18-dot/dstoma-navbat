import React, { useState } from 'react';
import { CodeSnippet } from '../types';
import { DJANGO_SOLUTIONS } from '../data';
import { Terminal, Copy, Check, FileCode, CheckCircle2, RefreshCw, AlertTriangle, BookOpen } from 'lucide-react';

export default function DjangoSolutions() {
  const [activeSnippetIdx, setActiveSnippetIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const activeSnippet = DJANGO_SOLUTIONS[activeSnippetIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="django-solutions-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient light */}
      <div className="absolute left-[30%] top-[-20%] w-[400px] h-[400px] pointer-events-none opacity-20 bg-[radial-gradient(circle,rgba(59,130,246,0.3),transparent_70%)]"></div>

      {/* Left Column: Explanations and Tab list */}
      <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
              KOD XOQONLIGI
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h3 className="text-md font-bold text-slate-100 flex items-center gap-1.5 leading-snug">
            <Terminal className="text-blue-500 w-5 h-5" /> Django 6+ Multi-Tenant Sozlamalari
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Loyihangizni Railway-da muammosiz ishga tushirish, Samarqand klinikalarini xaritaga joylash va Google SEO qidiruvlarida yuqoriga chiqarish bo'yicha to'liq ishchi yechimlar.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="space-y-2">
          {DJANGO_SOLUTIONS.map((snippet, idx) => (
            <button
              key={snippet.title}
              onClick={() => setActiveSnippetIdx(idx)}
              className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-center gap-3 ${
                activeSnippetIdx === idx
                  ? 'bg-blue-600/25 border-blue-500/40 text-blue-300 shadow-md'
                  : 'bg-slate-850 border-slate-800 hover:border-slate-700/60 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <FileCode className={`w-4 h-4 shrink-0 ${activeSnippetIdx === idx ? 'text-blue-400' : 'text-slate-500'}`} />
              <div className="min-w-0">
                <h5 className="text-[11px] font-bold truncate leading-tight uppercase tracking-wider">
                  {snippet.title.split('.')[1]?.trim() || snippet.title}
                </h5>
                <p className="text-[9px] text-slate-500 truncate mt-0.5 font-mono">
                  {snippet.filename}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Diagnostic helper card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
          <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> Muhim Eslatma (Railway-da):
          </h4>
          <p className="text-[10px] text-slate-400 leading-normal">
            SQLite bazalaridan Railway ko'p holatlarda container yangilanganda tozalab yuborishi mumkin. Multi-Tenant ishlab chiqarish (production) muhiti uchun Railway-da <strong>PostgreSQL</strong> yoki <strong>MySQL</strong> bazasini ulash va <code className="text-rose-400 font-mono">env</code> yordamida ishonchli bog'lash tavsiya etiladi.
          </p>
        </div>
      </div>

      {/* Right Column: Code Editor Simulator with copy feature */}
      <div className="lg:col-span-8 flex flex-col h-[520px] bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        {/* Editor Top Bar Controls */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Dots */}
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-[11px] text-slate-400 ml-2 font-mono font-bold flex items-center gap-1">
              💾 {activeSnippet.filename}
            </span>
          </div>

          {/* Copy Buttons */}
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-slate-300 font-extrabold rounded-lg flex items-center gap-1.5 transition-all outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Nusxalandi!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Nusxa ko'chirish
              </>
            )}
          </button>
        </div>

        {/* Snippet Description */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-850 text-xs text-slate-300 leading-relaxed font-semibold">
          💡 {activeSnippet.description}
        </div>

        {/* Code Content Editor Area */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-normal relative select-text scrollbar-thin">
          <pre className="text-blue-100 whitespace-pre scroll-smooth selection:bg-blue-600 selection:text-white">
            {activeSnippet.code}
          </pre>
        </div>
      </div>
    </div>
  );
}
