import React, { useState, useEffect } from 'react';

import { 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut,
  Info,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Calendar,
  Move,
  Compass,
  Crosshair,
  TrendingUp,
  Clock,
  Terminal,
  Cpu,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Printer,
  HeartPulse,
  Database
} from 'lucide-react';
import { Scene } from './ThreeDentalModel/Scene';

interface ThreeDentalModelProps {
  selectedToothIndex: number;
  setSelectedToothIndex: (idx: number) => void;
  language: string;
  dentalSystem: 'fdi' | 'universal';
  getToothMetrics?: (idx: number) => any;
  getToothDisplayNumber?: (idx: number, system: 'fdi' | 'universal') => number | string;
  getAnatomicalName?: (idx: number) => string;
  globalAiResult?: any;
}

export default function ThreeDentalModel({
  selectedToothIndex,
  setSelectedToothIndex,
  language = 'uz',
  dentalSystem = 'fdi',
  getToothMetrics = (idx) => ({ health: 100 }),
  getToothDisplayNumber = (index, system = 'fdi') => {
    if (system === 'universal') {
      if (index < 16) {
        return index + 1; // Upper arch: 1 to 16
      } else if (index < 24) {
        return 32 - (index - 16); // Lower arch left: 32 down to 25
      } else {
        return 24 - (index - 24); // Lower arch right: 24 down to 17
      }
    } else {
      if (index < 8) {
        return 18 - index; // Upper Quadrant 1: 18 down to 11
      } else if (index < 16) {
        return 21 + (index - 8); // Upper Quadrant 2: 21 up to 28
      } else if (index < 24) {
        return 48 - (index - 16); // Lower Quadrant 4: 48 down to 41
      } else {
        return 31 + (index - 24); // Lower Quadrant 3: 31 up to 38
      }
    }
  },
  getAnatomicalName = (idx) => `Tooth #${idx + 1}`,
  globalAiResult = null
}: ThreeDentalModelProps) {
  
  // Controlling the active view: front, top, bottom
  const [activeView, setActiveView] = useState<'front' | 'top' | 'bottom'>('front');
  const [zoomLevel, setZoomLevel] = useState<number>(1.05);
  const [activeTab, setActiveTab] = useState<'3D MODEL' | 'X-RAY' | 'ANALYSIS' | 'REPORT'>('3D MODEL');
  const [liveTime, setLiveTime] = useState<string>('14:35:42');
  const [showAll32Teeth, setShowAll32Teeth] = useState<boolean>(false);

  // Sync internal clock to make the medical HUD live and authentic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-GB'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fallback language settings
  const localLang = (language?.toLowerCase() as 'uz' | 'ru' | 'en') || 'uz';

  const i18n = {
    uz: {
      dentalAi: "STOMATOLOGIYA AI",
      diagSystem: "DIAGNOSTIK TIZIM",
      holographicClinical: "GOLOGRAFIK KLINIK NAZORAT TERMINALI",
      patientId: "BEMOR ID",
      dateTime: "SANA / VAQT",
      aiDiagnosticHeader: "AI DIAGNOSTIKA",
      active: "FAOL",
      toothIdentification: "TISH ID-RAQAMI",
      focalScan: "FOKAL SKANERLASH",
      toothIdLabel: "SORAQLANGAN TISH:",
      maxillaryQuad: "Tepa jag' (Maksilyar)",
      mandibularQuad: "Pastki jag' (Mandibulyar)",
      toothCondition: "TISH HOLATI STATUSI",
      metricIndex: "METRIK INDEKS",
      healthValueLabel: "SOG'LOM",
      statusEvaluation: "HOLATNI BAHOLASH:",
      structuralAnalysis: "KARKAS ANALIZI",
      layersDiag: "QATLAM DIAG...",
      enamel: "Mina qatlami",
      dentin: "Dentin qatlami",
      pulp: "Pulpa qatlami",
      rootHealth: "Ildiz salomatligi",
      gumSeal: "Milk birikishi",
      alveolarBone: "Alveolyar suyak",
      wearPressure: "YEYILISH VA BOSIM",
      stressLab: "STRESS TAHLILI",
      masticForce: "CHAYNASH KUCHI",
      occlusalBalance: "OKKLYUZAL BALANS",
      all32TeethMatrixDiag: "BARCHA 32 TISH MATRIX DIAGNOSTIKASI",
      all32TeethDiagBoth: "32 TISH DIAGNOSTIKASI (TEPA & PASTKI)",
      teeth16View: "16-Tish Ko'rinishi",
      teeth32Grid: "32-Tish To'liq Skan",
      anatomicalMidline: "Anatomik Gorizontal Markaziy Chiziq",
      lowerJawBadge: "PASTKI JAX TISHLARI",
      scrollLeft: "Chapga",
      scrollRight: "O'ngga",
      increaseZoom: "Kattalashtirish",
      resetFocal: "Fokusni tiklash",
      aiDiagnosisCard: "SUN'IY INTELLEKT TAHLILI",
      activeAssist: "FAOL YORDAMCHI",
      abrasion: "Emal Yemirilishi",
      cariesPathology: "Karies patologiyasi",
      calculus: "Tish toshlari",
      severeCavity: "Chuqur karies",
      gingivitisRisk: "Milk yallig'lanishi",
      abrasionDesc: "Yuza emal yemirilishi",
      cariesDesc: "Mahalliy demineralizatsiya bosqichi",
      calculusDesc: "Kalsifikatsiyalangan bio-plyonka",
      cavityDesc: "Rivojlangan emal yemirilishi",
      gingivitisDesc: "Milk qonash ko'rsatkichi",
      riskAssessment: "XAVF DARAJASI",
      classifier: "TASNIFLAGICH",
      riskLabel: "XAVF DARAJASI",
      recommendation: "KLINIK TAVSIYA",
      treatment: "DAVOLASH CHORASI",
      historyDiary: "MUOLAJA TARIXI",
      archiveLogs: "ARXIV JURNALLARI"
    },
    ru: {
      dentalAi: "ДЕНТАЛЬНЫЙ ИИ",
      diagSystem: "ДИАГНОСТИЧЕСКАЯ СИСТЕМА",
      holographicClinical: "ГОЛОГРАФИЧЕСКИЙ КЛИНИЧЕСКИЙ ТЕРМИНАЛ",
      patientId: "ID ПАЦИЕНТА",
      dateTime: "ДАТА / ВРЕМЯ",
      aiDiagnosticHeader: "ИИ ДИАГНОСТИКА",
      active: "АКТИВНО",
      toothIdentification: "ИДЕНТИФИКАЦИЯ ЗУБА",
      focalScan: "ФОКУСНОЕ СКАНИРОВАНИЕ",
      toothIdLabel: "ID ЗУБА:",
      maxillaryQuad: "Верхняя челюсть",
      mandibularQuad: "Нижняя челюсть",
      toothCondition: "СОСТОЯНИЕ ЗУБА",
      metricIndex: "МЕТРИЧЕСКИЙ ИНДЕКС",
      healthValueLabel: "ЗДОРОВЬЕ",
      statusEvaluation: "ОЦЕНКА СОСТОЯНИЯ:",
      structuralAnalysis: "СТРУКТУРНЫЙ АНАЛИЗ",
      layersDiag: "ДИАГР. СЛОЕВ",
      enamel: "Эмаль",
      dentin: "Дентин",
      pulp: "Пульпа зубная",
      rootHealth: "Здоровье корня",
      gumSeal: "Прилегание десны",
      alveolarBone: "Альвеолярная кость",
      wearPressure: "ИЗНОС И ДАВЛЕНИЕ",
      stressLab: "СТРЕСС-АНАЛИЗ",
      masticForce: "ЖЕВАТЕЛЬНАЯ СИЛА",
      occlusalBalance: "ОККЛЮЗИОННЫЙ БАЛАНС",
      all32TeethMatrixDiag: "МАТРИЦА ВСЕХ 32 ЗУБОВ",
      all32TeethDiagBoth: "ДИАГНОСТИКА 32 ЗУБОВ (ВЕРХ И НИЗ)",
      teeth16View: "16-Зубный ряд",
      teeth32Grid: "Таблица 32 зубов",
      anatomicalMidline: "Анатомическая горизонтальная линия",
      lowerJawBadge: "НИЖНЯЯ ЧЕЛЮСТЬ",
      scrollLeft: "Влево",
      scrollRight: "Вправо",
      increaseZoom: "Увеличить",
      resetFocal: "Сбросить фокус",
      aiDiagnosisCard: "АНАЛИЗ ИИ-ДИАГНОСТИКИ",
      activeAssist: "ИИ-ПОМОЩНИК",
      abrasion: "Истирание эмали",
      cariesPathology: "Патология кариеса",
      calculus: "Зубной камень",
      severeCavity: "Глубокая полость",
      gingivitisRisk: "Риск гингивита",
      abrasionDesc: "Поверхностный износ эмали дентина",
      cariesDesc: "Локализованная деминерализация",
      calculusDesc: "Окаменевшие отложения налета",
      cavityDesc: "Запущенное разрушение эмали",
      gingivitisDesc: "Оценка кровоточивости десен",
      riskAssessment: "ОЦЕНКА РИСКОВ",
      classifier: "КЛАССИФИКАТОР",
      riskLabel: "РИСК",
      recommendation: "РЕКОМЕНДАЦИЯ ИИ",
      treatment: "ЛЕЧЕНИЕ",
      historyDiary: "ДНЕВНИК ИСТОРИИ",
      archiveLogs: "АРХИВ ЛОГОВ"
    },
    en: {
      dentalAi: "DENTAL AI",
      diagSystem: "DIAGNOSTIC SYSTEM",
      holographicClinical: "HOLOGRAPHIC CLINICAL TERMINAL",
      patientId: "PATIENT ID",
      dateTime: "DATE / TIME",
      aiDiagnosticHeader: "AI DIAGNOSTIC",
      active: "ACTIVE",
      toothIdentification: "TOOTH IDENTIFICATION",
      focalScan: "FOCAL SCAN",
      toothIdLabel: "TOOTH ID:",
      maxillaryQuad: "Maxillary Quadrant",
      mandibularQuad: "Mandibular Quadrant",
      toothCondition: "TOOTH CONDITION",
      metricIndex: "METRIC INDEX",
      healthValueLabel: "HEALTH",
      statusEvaluation: "STATUS EVALUATION:",
      structuralAnalysis: "STRUCTURAL ANALYSIS",
      layersDiag: "LAYERS DIAG",
      enamel: "Enamel",
      dentin: "Dentin",
      pulp: "Pulp cavity",
      rootHealth: "Root health",
      gumSeal: "Gum seal",
      alveolarBone: "Alveolar bone",
      wearPressure: "WEAR & PRESSURE",
      stressLab: "STRESS LAB",
      masticForce: "MASTIC FORCE",
      occlusalBalance: "OCCLUSAL BALANCE",
      all32TeethMatrixDiag: "COMPLETE 32-TEETH MATRIX",
      all32TeethDiagBoth: "ALL 32 TEETH DIAGNOSTICS (UPPER & LOWER)",
      teeth16View: "16-Teeth Row",
      teeth32Grid: "32-Teeth Grid",
      anatomicalMidline: "Anatomical Horizontal Midline",
      lowerJawBadge: "LOWER JAW",
      scrollLeft: "Scroll Left",
      scrollRight: "Scroll Right",
      increaseZoom: "Increase Zoom",
      resetFocal: "Reset focal center",
      aiDiagnosisCard: "AI DIAGNOSIS",
      activeAssist: "ACTIVE ASSIST",
      abrasion: "Enamel Abrasion",
      cariesPathology: "Caries pathology",
      calculus: "Dental Calculus",
      severeCavity: "Severe Cavity",
      gingivitisRisk: "Gingivitis risk",
      abrasionDesc: "Superficial enamel dentin wear",
      cariesDesc: "Localized demineralization",
      calculusDesc: "Calcified biofilm deposits",
      cavityDesc: "Advanced enamel decay loss",
      gingivitisDesc: "Gum boundary bleeding score",
      riskAssessment: "RISK ASSESSMENT",
      classifier: "CLASSIFIER",
      riskLabel: "RISK",
      recommendation: "RECOMMENDATION",
      treatment: "TREATMENT",
      historyDiary: "HISTORY DIARY",
      archiveLogs: "ARCHIVE logs"
    }
  };

  const currentI18n = i18n[localLang] || i18n.en;

  const viewLabels = {
    uz: {
      front: 'OLDINDAN',
      left: 'CHAP PERSPEKTIVA',
      right: 'O\'NG PERSPEKTIVA',
      top: 'TEPA JAX (OKKLYUZAL)',
      bottom: 'PASTKI JAX (OKKLYUZAL)',
      back: 'ORQAGA'
    },
    ru: {
      front: 'СПЕРЕДИ',
      left: 'ЛЕВАЯ ПРОЕКЦИЯ',
      right: 'ПРАВАЯ ПРОЕКЦИЯ',
      top: 'ВЕРХНЯЯ ЧЕЛЮСТЬ',
      bottom: 'НИЖНЯЯ ЧЕЛЮСТЬ',
      back: 'НАЗАД'
    },
    en: {
      front: 'FRONTAL',
      left: 'LEFT ASPECT',
      right: 'RIGHT ASPECT',
      top: 'MAXILLARY ARCH',
      bottom: 'MANDIBULAR ARCH',
      back: 'BACK'
    }
  };

  const currentLabels = viewLabels[localLang] || viewLabels.en;

  // Set active view perspective selection
  const handleViewSelect = (view: 'front' | 'top' | 'bottom') => {
    setActiveView(view);
  };

  // Sync state if scene updates view changes from swipe gestures
  const handleSceneViewChange = (newView: 'front' | 'top' | 'bottom') => {
    setActiveView(newView);
  };

  const getToothDisplay = () => {
    const num = getToothDisplayNumber(selectedToothIndex, dentalSystem);
    const name = getAnatomicalName(selectedToothIndex);
    const metrics = getToothMetrics(selectedToothIndex);
    return { num, name, health: metrics?.health || 100 };
  };

  const activeToothInfo = getToothDisplay();
  const currentMetrics = getToothMetrics(selectedToothIndex);

  const getShortName = (idx: number, lang: string) => {
    if ([0, 15, 16, 31].includes(idx)) {
      return lang === 'uz' ? 'Aql tishi' : lang === 'ru' ? 'Мудрость' : 'Wisdom';
    }
    if ([1, 2, 13, 14, 17, 18, 29, 30].includes(idx)) {
      return lang === 'uz' ? 'Molyar' : lang === 'ru' ? 'Моляр' : 'Molar';
    }
    if ([3, 4, 11, 12, 19, 20, 27, 28].includes(idx)) {
      return lang === 'uz' ? 'Premolyar' : lang === 'ru' ? 'Премоляр' : 'Premolar';
    }
    if ([5, 10, 21, 26].includes(idx)) {
      return lang === 'uz' ? 'Qoziq tish' : lang === 'ru' ? 'Клык' : 'Canine';
    }
    return lang === 'uz' ? "Kurak" : lang === 'ru' ? "Резец" : "Incisor";
  };

  const isUpperSelected = selectedToothIndex < 16;
  const activeIndices = [
    // Upper jaw (Universal 1 to 16, FDI 18 to 28)
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    // Lower jaw (Universal 32 down to 17, FDI 48 down to 41, then 31 up to 38)
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31
  ];

  // Auto-scroll the active tooth card into view in the horizontal scroller row
  useEffect(() => {
    const activeBtn = document.getElementById(`horizontal-tooth-${selectedToothIndex}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedToothIndex]);

  // Dynamic status evaluation
  const healthVal = currentMetrics?.health ?? 100;
  let conditionLabel = localLang === 'uz' ? 'SOG\'LOM' : localLang === 'ru' ? 'ЗДОРОВ' : 'HEALTHY';
  let conditionColor = 'text-emerald-400';
  let conditionBg = 'bg-emerald-950/25 border-emerald-500/20';
  
  if (healthVal < 50) {
    conditionLabel = localLang === 'uz' ? 'KRITIK (PATOLOGIYA)' : localLang === 'ru' ? 'КРИТИЧЕСКИЙ' : 'CRITICAL';
    conditionColor = 'text-rose-400 animate-pulse';
    conditionBg = 'bg-rose-950/25 border-rose-500/20';
  } else if (healthVal < 82) {
    conditionLabel = localLang === 'uz' ? 'KUZATUV OSTIDA' : localLang === 'ru' ? 'ПОД НАБЛЮДЕНИЕМ' : 'SENSITIVE';
    conditionColor = 'text-amber-400';
    conditionBg = 'bg-amber-950/25 border-amber-500/20';
  }

  return (
    <div 
      id="three-dental-model-root" 
      className="w-full flex flex-col items-center justify-start bg-[#020711] border border-cyan-500/10 rounded-[32px] p-4 md:p-6 text-slate-100 select-none shadow-[0_0_80px_rgba(3,10,24,0.95)] mx-auto overflow-hidden relative"
    >
      {/* Dynamic Ambient Space Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* =========================================================================
          1. TOP HOLOGRAPHIC STATION HUD HEADER
          ========================================================================= */}
      <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-cyan-950/45 pb-4 mb-5 z-20 gap-4">
        
        {/* Left Side: Diagnostic System Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-3 h-3 rounded-full bg-[#00f2fe]/30 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[14px] md:text-[15px] font-black tracking-widest font-mono text-white flex items-center gap-2">
              {currentI18n.dentalAi} <span className="text-[#00f2fe] text-xs font-bold font-sans bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/25">{currentI18n.diagSystem}</span>
            </span>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              {currentI18n.holographicClinical}
            </span>
          </div>
        </div>

        {/* Center: System Telemetry Data */}
        <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono">
          <div className="flex flex-col text-left border-l border-cyan-950/40 pl-3">
            <span className="text-slate-500 tracking-wider">{currentI18n.patientId}</span>
            <span className="text-slate-300 font-bold">78645092</span>
          </div>
          
          <div className="flex flex-col text-left border-l border-cyan-950/40 pl-3">
            <span className="text-slate-500 tracking-wider">{currentI18n.dateTime}</span>
            <span className="text-cyan-400 font-bold">2026-06-17 / {liveTime}</span>
          </div>

          <div className="flex flex-col text-left border-l border-cyan-950/40 pl-3">
            <span className="text-slate-500 tracking-wider">{currentI18n.aiDiagnosticHeader}</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {currentI18n.active}
            </span>
          </div>
        </div>

        {/* Right: Station Workstation Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#030a17]/95 border border-cyan-500/20 p-1.5 rounded-2xl z-10 shrink-0">
          {(['3D MODEL', 'X-RAY', 'ANALYSIS', 'REPORT'] as const).map((tab) => {
            const isSel = activeTab === tab;
            let displayTab: string = tab;
            if (tab === '3D MODEL') displayTab = localLang === 'uz' ? '3D MODEL' : localLang === 'ru' ? '3D МОДЕЛЬ' : '3D MODEL';
            if (tab === 'X-RAY') displayTab = localLang === 'uz' ? 'RENTGEN (X-RAY)' : localLang === 'ru' ? 'РЕНТГЕН' : 'X-RAY';
            if (tab === 'ANALYSIS') displayTab = localLang === 'uz' ? 'TAHLIL (AI)' : localLang === 'ru' ? 'АНАЛИЗ ИИ' : 'ANALYSIS';
            if (tab === 'REPORT') displayTab = localLang === 'uz' ? 'HISOBOT' : localLang === 'ru' ? 'ОТЧЕТ' : 'REPORT';

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[9.5px] font-extrabold font-mono tracking-widest transition-all ${
                  isSel 
                    ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                {displayTab}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          2. CORE THREE-COLUMN DENTAL COMMAND GRID LAYOUT
          ========================================================================= */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 z-10 items-stretch">
        
        {/* -----------------------------------------------------------------------
            LEFT CLINICAL DATA PANEL (COL SPAN 3)
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Card 1: Tooth Identification */}
          <div className="bg-[#030a17]/85 border border-cyan-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all text-left">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-3 border-b border-cyan-950/40 pb-2">
              <span className="text-[10px] font-bold font-mono text-[#00f2fe] tracking-widest uppercase flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                {currentI18n.toothIdentification}
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">{currentI18n.focalScan}</span>
            </div>
            
            <div className="flex items-center gap-4 mt-2">
              {/* Virtual Wireframe Silhouette */}
              <div className="w-14 h-14 rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/60 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-x-0 h-[1.5px] bg-cyan-400/40 animate-bounce" style={{ animationDuration: '2s' }} />
                <svg className="w-9 h-9 text-cyan-400/70" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6">
                  {/* Styled single tooth schematic */}
                  <path d="M 25,25 Q 35,5 50,5 Q 65,5 75,25 Q 85,50 70,80 Q 50,95 50,95 Q 50,95 30,80 Q 15,50 25,25 Z" strokeDasharray="3,2" />
                  <line x1="50" y1="5" x2="50" y2="95" strokeDasharray="5,5" strokeWidth="2" stroke="rgba(0,242,254,0.4)" />
                </svg>
              </div>
              
              <div className="flex flex-col text-left">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-400 text-[10px] font-mono uppercase">{currentI18n.toothIdLabel}</span>
                  <span className="text-2xl font-black font-mono text-white text-shadow-glow">#{activeToothInfo.num}</span>
                </div>
                <div className="text-[11px] font-bold text-[#00f2fe] mt-0.5 uppercase tracking-wide truncate max-w-[150px]">
                  {activeToothInfo.name}
                </div>
                <div className="text-[8.5px] font-mono text-slate-500 mt-0.5 tracking-wider font-extrabold uppercase">
                  {isUpperSelected ? currentI18n.maxillaryQuad : currentI18n.mandibularQuad}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Tooth Condition */}
          <div className="bg-[#030a17]/85 border border-cyan-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all text-left">
            <div className="flex items-center justify-between mb-3 border-b border-cyan-950/40 pb-2">
              <span className="text-[10px] font-bold font-mono text-[#00f2fe] tracking-widest uppercase flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {currentI18n.toothCondition}
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">{currentI18n.metricIndex}</span>
            </div>

            <div className="flex items-center gap-4 mt-2">
              {/* Radial Circular Progress Gauge */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track Circle */}
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="rgba(15, 32, 66, 0.4)" strokeWidth="3" />
                  {/* Colored Indicator circle */}
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="16" 
                    fill="transparent" 
                    stroke={healthVal >= 82 ? "#10b981" : healthVal >= 50 ? "#f59e0b" : "#f43f5e"} 
                    strokeWidth="3" 
                    strokeDasharray="100"
                    strokeDashoffset={100 - healthVal}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.618s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-black font-mono text-white leading-none">{healthVal}%</span>
                  <span className="text-[7px] text-slate-500 font-mono tracking-tighter">{currentI18n.healthValueLabel}</span>
                </div>
              </div>

              {/* Status and telemetry */}
              <div className="flex flex-col text-left">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest">{currentI18n.statusEvaluation}</span>
                <span className={`text-[12px] font-black tracking-wide uppercase ${conditionColor} mt-0.5`}>
                  {conditionLabel}
                </span>

                {/* Micro Live Sparkline Wave Line */}
                <div className="w-32 h-6 mt-2 relative overflow-hidden bg-black/35 rounded-lg border border-cyan-950/45 px-1 flex items-center">
                  <svg className="w-full h-full text-cyan-400" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path 
                      d={healthVal < 50 
                        ? "M 0 10 Q 15 2 30 18 T 60 1 T 90 19 L 100 10" 
                        : "M 0 10 Q 25 1 50 19 T 100 10"
                      } 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1" 
                    />
                  </svg>
                  <span className="absolute right-1.5 bottom-0.5 text-[6.5px] font-mono text-slate-500">1.25 kHz</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Structural Layer Analysis */}
          <div className="bg-[#030a17]/85 border border-cyan-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all text-left">
            <div className="flex items-center justify-between mb-2.5 border-b border-cyan-950/40 pb-2">
              <span className="text-[10px] font-bold font-mono text-[#00f2fe] tracking-widest uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                {currentI18n.structuralAnalysis}
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">{currentI18n.layersDiag}</span>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              {[
                { name: currentI18n.enamel, value: currentMetrics?.enamel ?? 100, color: 'bg-cyan-500' },
                { name: currentI18n.dentin, value: currentMetrics?.dentin ?? 100, color: 'bg-emerald-500' },
                { name: currentI18n.pulp, value: currentMetrics?.pulp ?? 100, color: 'bg-amber-500' },
                { name: currentI18n.rootHealth, value: currentMetrics?.root ?? 100, color: 'bg-violet-500' },
                { name: currentI18n.gumSeal, value: currentMetrics?.gum ?? 100, color: 'bg-pink-500' },
                { name: currentI18n.alveolarBone, value: currentMetrics?.bone ?? 100, color: 'bg-teal-500' }
              ].map((layer) => (
                <div key={layer.name} className="flex flex-col">
                  <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono mb-1">
                    <span className="text-slate-400 capitalize">{layer.name}</span>
                    <span className="text-cyan-400 font-bold">{layer.value}%</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden relative border border-slate-950/50">
                    <div 
                      className={`h-full rounded-full ${layer.color} transition-all duration-500`}
                      style={{ width: `${layer.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Wear & Pressure Indices */}
          <div className="bg-[#030a17]/85 border border-cyan-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all text-left">
            <div className="flex items-center justify-between mb-2.5 border-b border-cyan-950/40 pb-2">
              <span className="text-[10px] font-bold font-mono text-[#00f2fe] tracking-widest uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                {currentI18n.wearPressure}
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">{currentI18n.stressLab}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-1 text-[9px] font-mono">
              <div className="flex flex-col bg-slate-950/40 p-2.5 rounded-xl border border-cyan-950/50">
                <span className="text-slate-500 text-[8px]">{currentI18n.masticForce}</span>
                <span className="text-white font-bold text-xs mt-1">
                  {Math.round(35 + (healthVal / 100) * 15.5)} N
                </span>
                <div className="w-full h-1 bg-cyan-950/40 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-500" 
                    style={{ width: `${Math.round(40 + (healthVal / 100) * 28)}%` }} 
                  />
                </div>
              </div>
              <div className="flex flex-col bg-slate-950/40 p-2.5 rounded-xl border border-cyan-950/50">
                <span className="text-slate-500 text-[8px]">{currentI18n.occlusalBalance}</span>
                <span className="text-emerald-400 font-bold text-xs mt-1">
                  {Math.round(75 + (healthVal / 100) * 20.8)}%
                </span>
                <div className="w-full h-1 bg-cyan-950/40 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-500" 
                    style={{ width: `${Math.round(75 + (healthVal / 100) * 20.8)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* -----------------------------------------------------------------------
            CENTER VISUALIZATION WORKSPACE (COL SPAN 6)
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-6 w-full flex flex-col items-center justify-start gap-4">
          
          {/* Top Row: Arch FDI Selector */}
          <div className="w-full flex-col bg-[#030a17]/95 border border-[#0d2a4a]/85 p-3 sm:p-4 rounded-2xl relative shadow-2xl flex text-left">
            <div className="absolute inset-0 bg-[radial-gradient(rgba(0,242,254,0.012)_1.2px,transparent_1.2px)] [background-size:20px_20px] pointer-events-none rounded-2xl" />
            
            <div className="w-full flex items-center justify-between mb-3 shrink-0">
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#00f2fe] font-mono uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute opacity-70" />
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                {showAll32Teeth 
                  ? (localLang === 'uz' ? 'BARCHA 32 TISH MATRIX DIAGNOSTIKASI' : localLang === 'ru' ? 'МАТРИЦА ВСЕХ 32 ЗУБОВ' : 'COMPLETE 32-TEETH MATRIX')
                  : (localLang === 'uz' ? 'BARCHA 32 TISH DIAGNOSTIKASI (TEPA & PASTKI)' : localLang === 'ru' ? 'ДИАГНОСТИКА 32 ЗУБОВ (ВЕРХ И НИЗ)' : 'ALL 32 TEETH DIAGNOSTICS (UPPER & LOWER)')
                }
              </span>
              <div className="flex items-center gap-2">
                {/* 32 Teeth Toggle Mode Switch */}
                <button
                  type="button"
                  onClick={() => setShowAll32Teeth(!showAll32Teeth)}
                  className="text-[9px] font-mono font-bold uppercase py-1 px-2.5 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-[#00f2fe] hover:bg-cyan-900 hover:border-cyan-400 transition-all cursor-pointer flex items-center gap-1 shadow-md hover:shadow-cyan-400/10 active:scale-95"
                >
                  <Database className="w-3 h-3" />
                  {showAll32Teeth 
                    ? (localLang === 'uz' ? '16 Lik Ko\'rinish' : '16-Teeth Row')
                    : (localLang === 'uz' ? '32 Ta Tish To\'liq' : '32-Teeth Grid')
                  }
                </button>
                <span className="text-[8.5px] font-mono text-cyan-400/80 bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-500/15 uppercase font-bold tracking-wider hidden sm:inline-block">
                  {showAll32Teeth ? 'Full Matrix' : (isUpperSelected ? 'Maxilla Arch' : 'Mandible Arch')}
                </span>
              </div>
            </div>

            {showAll32Teeth ? (
              /* DUAL DENTAL MATRIX GRAPHIC CHART (UPPER & LOWER) */
              <div className="w-full flex flex-col gap-3 font-mono p-1 rounded-xl bg-slate-950/30 border border-cyan-950/40">
                {/* UPPER ROW */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[8px] text-slate-500 uppercase px-1.5 border-b border-cyan-950/20 pb-0.5 mb-1">
                    <span>Upper Maxilla {dentalSystem === 'universal' ? '(1-16)' : '(FDI 18-11, 21-28)'}</span>
                    <span className="text-cyan-400 font-bold">1st Quadrant &larr; &rarr; 2nd Quadrant</span>
                  </div>
                  <div className="flex items-stretch gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500/15 scrollbar-track-transparent">
                    {Array.from({ length: 16 }, (_, i) => i).map((idx, index) => {
                      const isSelected = idx === selectedToothIndex;
                      const toothNum = getToothDisplayNumber(idx, dentalSystem);
                      const shortName = getShortName(idx, localLang);
                      const metrics = getToothMetrics(idx);
                      const healthVal = metrics?.health ?? 100;

                      let borderStyle = "border-[#10243d]/40 bg-[#030c1a]/50 text-slate-400 hover:border-cyan-500/20";
                      if (isSelected) {
                        borderStyle = "border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.25)] ring-1 ring-cyan-500/15";
                      } else if (healthVal < 50) {
                        borderStyle = "border-rose-500/25 bg-rose-950/15 text-rose-400";
                      } else if (healthVal < 82) {
                        borderStyle = "border-amber-500/25 bg-amber-950/10 text-amber-400";
                      }

                      return (
                        <React.Fragment key={idx}>
                          <button
                            type="button"
                            onClick={() => setSelectedToothIndex(idx)}
                            className={`flex-1 shrink-0 min-w-[39px] sm:min-w-[43px] flex flex-col items-center justify-between p-1 rounded-lg border transition-all duration-200 cursor-pointer ${borderStyle}`}
                          >
                            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-black font-mono transition-all ${
                              isSelected ? 'bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(0,242,254,0.4)] font-black' : healthVal < 50 ? 'bg-rose-600 text-white' : healthVal < 82 ? 'bg-amber-500 text-white' : 'bg-black/40 text-slate-200'
                            }`}>
                              {toothNum}
                            </span>
                            <div className="w-full h-0.5 mt-1 rounded-full overflow-hidden bg-slate-900/50">
                              <div className={`h-full ${healthVal >= 82 ? 'bg-emerald-400' : healthVal >= 70 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${healthVal}%` }} />
                            </div>
                            <span className="text-[6.5px] text-slate-500 capitalize line-clamp-1 truncate mt-0.5">{shortName.substring(0, 4)}</span>
                          </button>
                          {index === 7 && <div className="w-[1.5px] bg-dashed border-r border-cyan-500/25 h-8 self-center mx-0.5" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* ANATOMICAL DIVIDER */}
                <div className="w-full flex items-center justify-center relative py-1">
                  <div className="absolute left-0 right-0 h-px border-b border-cyan-500/10 border-dashed z-0" />
                  <span className="relative z-10 px-3 py-0.5 rounded-full bg-[#030a17] text-[7.5px] font-black uppercase text-cyan-500/50 border border-cyan-500/15 tracking-widest font-mono">
                    {currentI18n.anatomicalMidline}
                  </span>
                </div>

                {/* LOWER ROW */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[8px] text-slate-500 uppercase px-1.5 border-b border-cyan-950/20 pb-0.5 mb-1">
                    <span>Lower Mandible {dentalSystem === 'universal' ? '(17-32)' : '(FDI 48-41, 31-38)'}</span>
                    <span className="text-cyan-400 font-bold">4th Quadrant &larr; &rarr; 3rd Quadrant</span>
                  </div>
                  <div className="flex items-stretch gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500/15 scrollbar-track-transparent">
                    {Array.from({ length: 16 }, (_, i) => i + 16).map((idx, index) => {
                      const isSelected = idx === selectedToothIndex;
                      const toothNum = getToothDisplayNumber(idx, dentalSystem);
                      const shortName = getShortName(idx, localLang);
                      const metrics = getToothMetrics(idx);
                      const healthVal = metrics?.health ?? 100;

                      let borderStyle = "border-[#10243d]/40 bg-[#030c1a]/50 text-slate-400 hover:border-cyan-500/20";
                      if (isSelected) {
                        borderStyle = "border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.25)] ring-1 ring-cyan-500/15";
                      } else if (healthVal < 50) {
                        borderStyle = "border-rose-500/25 bg-rose-950/15 text-rose-400";
                      } else if (healthVal < 82) {
                        borderStyle = "border-amber-500/25 bg-amber-950/10 text-amber-400";
                      }

                      return (
                        <React.Fragment key={idx}>
                          <button
                            type="button"
                            onClick={() => setSelectedToothIndex(idx)}
                            className={`flex-1 shrink-0 min-w-[39px] sm:min-w-[43px] flex flex-col items-center justify-between p-1 rounded-lg border transition-all duration-200 cursor-pointer ${borderStyle}`}
                          >
                            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-black font-mono transition-all ${
                              isSelected ? 'bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(0,242,254,0.4)] font-black' : healthVal < 49 ? 'bg-rose-600 text-white' : healthVal < 82 ? 'bg-amber-500 text-white' : 'bg-black/40 text-slate-200'
                            }`}>
                              {toothNum}
                            </span>
                            <div className="w-full h-0.5 mt-1 rounded-full overflow-hidden bg-slate-900/50">
                              <div className={`h-full ${healthVal >= 82 ? 'bg-emerald-400' : healthVal >= 70 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${healthVal}%` }} />
                            </div>
                            <span className="text-[6.5px] text-slate-500 capitalize line-clamp-1 truncate mt-0.5">{shortName.substring(0, 4)}</span>
                          </button>
                          {index === 7 && <div className="w-[1.5px] bg-dashed border-r border-cyan-500/25 h-8 self-center mx-0.5" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE ROW HORIZONTALLY SCROLLABLE CARDS WITH SLEEK CLICK CHEVRONS AND STYLED TRACK */
              <div className="w-full relative px-7 flex items-center group/scroller">
                {/* Left Click-to-Scroll Chevron */}
                <button
                  type="button"
                  onClick={() => {
                    const row = document.getElementById('teeth-scroll-row-inner');
                    if (row) row.scrollBy({ left: -220, behavior: 'smooth' });
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-10 rounded-l-lg bg-slate-900/90 border border-slate-800 hover:bg-cyan-950 text-[#00f2fe] border-r-0 flex items-center justify-center hover:border-cyan-400 shadow-md active:scale-95 transition-all cursor-pointer opacity-80 group-hover/scroller:opacity-100"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Inner flex scroll container */}
                <div 
                  id="teeth-scroll-row-inner"
                  className="w-full flex items-stretch gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-cyan-500/25 scrollbar-track-cyan-950/20 scroll-smooth"
                >
                  {activeIndices.map((idx, index) => {
                    const isSelected = idx === selectedToothIndex;
                    const toothNum = getToothDisplayNumber(idx, dentalSystem);
                    const shortName = getShortName(idx, localLang);
                    const metrics = getToothMetrics(idx);
                    const healthVal = metrics?.health ?? 100;
                    
                    let borderStyle = "border-[#10243d]/60 bg-[#030c1a]/60 text-slate-400 hover:border-cyan-500/30 hover:bg-[#030c1a]/90";
                    if (isSelected) {
                      borderStyle = "border-cyan-400 bg-cyan-950/50 text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.35)] ring-1 ring-cyan-500/20";
                    } else if (healthVal < 50) {
                      borderStyle = "border-rose-500/30 bg-rose-950/20 text-rose-400 hover:border-rose-500/50";
                    } else if (healthVal < 82) {
                      borderStyle = "border-amber-500/30 bg-amber-950/12 text-amber-400 hover:border-amber-500/50";
                    }

                    return (
                      <React.Fragment key={idx}>
                        <button
                          id={`horizontal-tooth-${idx}`}
                          type="button"
                          onClick={() => setSelectedToothIndex(idx)}
                          className={`flex-1 shrink-0 min-w-[50px] max-w-[65px] flex flex-col items-center justify-between p-2 rounded-xl border transition-all duration-300 cursor-pointer ${borderStyle}`}
                        >
                          <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black font-mono transition-all ${
                            isSelected 
                              ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(0,242,254,0.6)]'
                              : healthVal < 50
                              ? 'bg-rose-600 text-white font-extrabold border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.55)]'
                              : healthVal < 82
                              ? 'bg-amber-500 text-white font-extrabold border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.55)]'
                              : 'bg-black/50 text-slate-200'
                          }`}>
                            {toothNum}
                          </span>

                          <div className="w-full h-1 my-1.5 rounded-full overflow-hidden bg-slate-950/50 relative">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                healthVal >= 82 ? 'bg-emerald-400' : healthVal >= 70 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                              }`}
                              style={{ width: `${healthVal}%` }}
                            />
                          </div>

                          <span className={`text-[8.5px] font-bold tracking-tight text-center font-sans line-clamp-1 truncate capitalize ${
                            isSelected ? 'text-cyan-300 font-extrabold' : 'text-slate-500'
                          }`}>
                            {shortName}
                          </span>
                        </button>

                        {index === 7 && (
                          <div className="flex flex-col items-center justify-center px-1.5 select-none text-cyan-500/30 shrink-0">
                            <div className="w-px h-6 bg-dashed border-r border-[#00f2fe]/20" />
                            <span className="text-[6.5px] font-mono tracking-widest my-0.5 font-bold uppercase text-[#00f2fe]/40">MID</span>
                            <div className="w-px h-6 bg-dashed border-r border-[#00f2fe]/20" />
                          </div>
                        )}

                        {index === 15 && (
                          <div className="flex flex-col items-center justify-center px-2 py-3 select-none text-emerald-400 shrink-0 mx-1 bg-emerald-950/20 border border-emerald-500/10 rounded-xl">
                            <span className="text-[8px] font-mono tracking-widest font-extrabold uppercase text-emerald-400">
                              {localLang === 'uz' ? "PASTKI JAX" : localLang === 'ru' ? "НИЖНЯЯ Ч" : "LOWER JAW"}
                            </span>
                          </div>
                        )}

                        {index === 23 && (
                          <div className="flex flex-col items-center justify-center px-1.5 select-none text-cyan-500/30 shrink-0">
                            <div className="w-px h-6 bg-dashed border-r border-[#00f2fe]/20" />
                            <span className="text-[6.5px] font-mono tracking-widest my-0.5 font-bold uppercase text-[#00f2fe]/40">MID</span>
                            <div className="w-px h-6 bg-dashed border-r border-[#00f2fe]/20" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Right Click-to-Scroll Chevron */}
                <button
                  type="button"
                  onClick={() => {
                    const row = document.getElementById('teeth-scroll-row-inner');
                    if (row) row.scrollBy({ left: 220, behavior: 'smooth' });
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-10 rounded-r-lg bg-slate-900/90 border border-slate-800 hover:bg-cyan-950 text-[#00f2fe] border-l-0 flex items-center justify-center hover:border-cyan-400 shadow-md active:scale-95 transition-all cursor-pointer opacity-80 group-hover/scroller:opacity-100"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Core Interactive Viewport */}
          <div className="w-full h-[380px] md:h-[420px] bg-[#020914] border border-[#0d2d4a] rounded-3xl relative overflow-hidden flex items-center justify-center shadow-inner z-10 group">
            <div className="absolute inset-0 bg-[#020813]/40 z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(0,242,254,0.015)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none" />



            {/* ===================================================================
                [RIGHT FLOATING RANGE SLIDER & TARGETS] (Exactly as shown in mockup)
                =================================================================== */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 bg-slate-950/70 border border-cyan-500/10 p-3 rounded-2xl shadow-lg backdrop-blur-md">
              {/* Zoom Mag-glass Icon */}
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.1))}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-cyan-950 text-cyan-400 border border-cyan-500/15 flex items-center justify-center hover:border-[#00f2fe] hover:text-white transition-all cursor-pointer"
                title="Increase Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Vertical Drag/Slide Track Element */}
              <div className="h-28 flex flex-col items-center justify-between relative py-2 select-none group/slider">
                {/* Visual scale tick lines on slide */}
                <div className="absolute left-1 flex flex-col gap-1.5 text-[5px] text-cyan-500/30 font-mono font-bold">
                  <span>- 2.0</span>
                  <span>- 1.5</span>
                  <span>- 1.0</span>
                  <span>- 0.5</span>
                </div>
                
                {/* Real hidden responsive slider control element */}
                <input 
                  type="range"
                  min="0.7"
                  max="2.0"
                  step="0.05"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="accent-cyan-400 cursor-pointer h-24 w-1 shadow-inner rounded-full"
                  style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
                />
              </div>
              
              <span className="text-[8px] font-mono text-cyan-400/80 tracking-tighter bg-black/45 px-1.5 rounded leading-none py-1">
                {Math.floor(zoomLevel * 100)}%
              </span>

              {/* Reset Crosshair lock button at bottom */}
              <button
                type="button"
                onClick={() => { setZoomLevel(1.05); handleViewSelect('front'); }}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-cyan-950 text-[#00f2fe] border border-cyan-500/15 flex items-center justify-center hover:border-[#00f2fe] hover:shadow-[0_0_8px_rgba(0,242,254,0.4)] transition-all cursor-pointer"
                title="Reset focal center"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>

            {/* The SVG Dental Render Canvas */}
            <div className="w-full h-full flex items-center justify-center">
              {activeTab === 'REPORT' ? (
                /* GORGEOUS ENTERPRISE-GRADE PATIENT CLINICAL REPORT */
                <div id="diagnostic-report-worksheet" className="w-full h-full bg-[#020b18] overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 text-left font-mono text-[9px] sm:text-[10px] text-slate-300 select-all border border-cyan-500/20 rounded-3xl relative">
                  <div className="absolute top-2 right-2 text-[6.5px] text-cyan-400 font-bold bg-cyan-950/40 p-1 rounded uppercase tracking-widest border border-cyan-500/10">
                    Doc ID: #DENT-2026-{selectedToothIndex}
                  </div>
                  
                  {/* Report Header Logo & Organization */}
                  <div className="flex items-start gap-3 border-b border-cyan-900/40 pb-3">
                    <HeartPulse className="w-8 h-8 text-[#00f2fe] shrink-0 animate-pulse" />
                    <div className="flex flex-col">
                      <h4 className="text-white text-[10px] sm:text-[11px] font-black tracking-widest uppercase">AGIENT DIGITAL DENTAL STATION</h4>
                      <p className="text-[7.5px] text-slate-500 uppercase mt-0.5 font-bold">COMPREHENSIVE CLINICAL FINDINGS SHEET</p>
                    </div>
                  </div>

                  {/* Patient Records Stats metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#031124]/70 p-3 rounded-xl border border-cyan-950/40 text-[8.5px]">
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase">TELEMETRY SCAN TIME</span>
                      <span className="text-white font-bold mt-0.5">{liveTime} UTC</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase">PATIENT TARGET SYSTEM</span>
                      <span className="text-cyan-400 font-bold mt-0.5 font-sans capitalize">{dentalSystem.toUpperCase()} - {localLang.toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col col-span-2 sm:col-span-1">
                      <span className="text-slate-500 uppercase">HEALTH DIRECTIVE</span>
                      <span className="text-[#00f2fe] font-bold mt-0.5">Verified AI Diagnosis</span>
                    </div>
                  </div>

                  {/* Active Selected Tooth Breakdown */}
                  <div className="flex flex-col border border-cyan-950/50 bg-[#030e1c]/45 p-3 rounded-xl">
                    <span className="text-[8px] text-[#00f2fe] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" />
                      SELECTED TOOTH SCAN ANALYSIS
                    </span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-black/30 p-2 rounded border border-cyan-950/20 mb-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tooth Position:</span>
                        <span className="text-white font-bold">#{getToothDisplayNumber(selectedToothIndex, dentalSystem)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Anat. Name:</span>
                        <span className="text-white font-bold capitalize">{getAnatomicalName(selectedToothIndex)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Health index:</span>
                        <span className={`font-bold ${currentMetrics?.health >= 82 ? 'text-emerald-400' : currentMetrics?.health >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {currentMetrics?.health ?? 100}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-550">Risk category:</span>
                        <span className={`font-bold ${currentMetrics?.riskLabel === 'HIGH' ? 'text-rose-400 animate-pulse' : currentMetrics?.riskLabel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {currentMetrics?.riskLabel ?? 'LOW'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[7.5px] sm:text-[8px] text-slate-400 leading-relaxed italic text-left">
                      "Selected tooth displays superficial {currentMetrics?.caries > 30 ? 'active decay' : 'enamel surface'} with a calculative mineral density index of {currentMetrics?.dentin ?? 100}%. Periodontal gum sealing is {currentMetrics?.gum ?? 100}% intact. Professional tooth-colored restoration advised if health drops further."
                    </p>
                  </div>

                  {/* Dynamic Tooth-By-Tooth Pathological findings loop */}
                  <div className="flex flex-col">
                    <span className="text-[8px] text-amber-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Sliders className="w-3 h-3" />
                      SYSTEM ARCH PATHOLOGY REGISTER (CHART LOGS)
                    </span>
                    <div className="max-h-[110px] overflow-y-auto border border-cyan-950/40 rounded-lg p-1.5 flex flex-col gap-1 bg-[#020914] scrollbar-thin scrollbar-thumb-cyan-500/20">
                      {Array.from({ length: 32 }, (_, i) => i)
                        .map(i => ({ idx: i, m: getToothMetrics(i) }))
                        .filter(item => item.m && item.m.health < 82)
                        .map(item => {
                          const num = getToothDisplayNumber(item.idx, dentalSystem);
                          const isUpper = item.idx < 16;
                          return (
                            <div key={item.idx} className="flex justify-between items-center text-[7.5px] p-1 border-b border-cyan-950/30 last:border-0 border-dashed hover:bg-[#030d1c]/50">
                              <span className="text-white font-bold">Tooth #{num} ({getAnatomicalName(item.idx).split(' (')[0]})</span>
                              <span className="text-slate-500 uppercase">{isUpper ? 'Upper' : 'Lower'}</span>
                              <span className="font-extrabold text-amber-500">{item.m.health}% Health</span>
                              <span className={`px-1 py-0.5 rounded text-[6.5px] leading-none font-bold ${item.m.riskLabel === 'HIGH' ? 'bg-rose-950/40 border border-rose-500/30 text-rose-400' : 'bg-amber-950/40 border border-amber-500/30 text-amber-400'}`}>
                                {item.m.riskLabel} RISK
                              </span>
                            </div>
                          );
                        })}
                      {Array.from({ length: 32 }, (_, i) => i).map(i => ({ idx: i, m: getToothMetrics(i) })).filter(item => item.m && item.m.health < 82).length === 0 && (
                        <div className="text-slate-500 p-3 text-center italic">No outstanding teeth pathologies registered. System healthy.</div>
                      )}
                    </div>
                  </div>

                  {/* Actions & E-Signature Verification bar */}
                  <div className="mt-auto pt-3 border-t border-cyan-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-550 text-[7px] uppercase tracking-tighter">SIGIL VERIFIED TYPE:</span>
                      <span className="text-emerald-400 font-extrabold text-[8px] tracking-wide border border-emerald-500/20 bg-emerald-950/30 px-1 py-0.5 rounded">
                        DR. AI DIAGNOST DDS
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button 
                        type="button"
                        onClick={() => console.log("Printing Diagnostic Patient Chart for tooth #" + selectedToothIndex)}
                        className="py-1 px-2.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/40 text-[#00f2fe] uppercase text-[7.5px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow"
                      >
                        <Printer className="w-3 h-3" />
                        Print Chart
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Scene
                  selectedToothIndex={selectedToothIndex}
                  setSelectedToothIndex={setSelectedToothIndex}
                  renderMode={
                    activeTab === '3D MODEL' 
                      ? 'realistic' 
                      : activeTab === 'X-RAY' 
                      ? 'x-ray' 
                      : 'ai-diagnostic'
                  }
                  showRoots={true}
                  showBone={true}
                  crossSection={activeTab === 'X-RAY'} // In X-ray we can simulate transparent crossSection lines for greater scientific fidelity!
                  autoRotate={false}
                  zoomLevel={zoomLevel}
                  brightness={1.25}
                  jawView="both"
                  getToothMetrics={getToothMetrics}
                  getAnatomicalName={getAnatomicalName}
                  getToothDisplayNumber={getToothDisplayNumber}
                  dentalSystem={dentalSystem}
                  localLang={localLang}
                  currentView={activeView}
                  onViewChange={handleSceneViewChange}
                />
              )}
            </div>
          </div>

          {/* Under-view Tabs Buttons */}
          <div className="w-full flex flex-wrap justify-center gap-1.5 md:gap-2.5 py-2.5 z-10 shrink-0">
            {[
              { id: 'front', label: currentLabels.front },
              { id: 'top', label: currentLabels.top },
              { id: 'bottom', label: currentLabels.bottom }
            ].map((btn) => {
              const isActive = activeView === btn.id;
              return (
                <button
                  id={`tab-btn-${btn.id}`}
                  key={btn.id}
                  onClick={() => handleViewSelect(btn.id as any)}
                  className={`px-3.5 py-2 text-[9.5px] font-black tracking-widest rounded-full transition-all duration-300 border cursor-pointer uppercase ${
                    isActive
                      ? 'bg-transparent text-[#00f2fe] border-[#00f2fe] shadow-[0_0_12px_rgba(0,242,254,0.25)] font-extrabold'
                      : 'bg-[#040e1f]/60 text-slate-400 border-cyan-950/50 hover:border-cyan-500/25 hover:text-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* -----------------------------------------------------------------------
            RIGHT MEDICAL DIAGNOSTIC INTELLIGENCE (COL SPAN 3)
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Card 1: AI Diagnosis */}
          <div className="bg-[#030a17]/85 border border-cyan-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all text-left">
            <div className="flex items-center justify-between mb-2.5 border-b border-cyan-950/40 pb-2">
              <span className="text-[10px] font-bold font-mono text-[#00f2fe] tracking-widest uppercase flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                {currentI18n.aiDiagnosisCard}
              </span>
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-wide">{currentI18n.activeAssist}</span>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              {[
                { name: currentI18n.abrasion, value: currentMetrics?.caries > 30 ? 45 : 12, label: currentI18n.abrasionDesc },
                { name: currentI18n.cariesPathology, value: currentMetrics?.caries ?? 0, label: currentI18n.cariesDesc },
                { name: currentI18n.calculus, value: currentMetrics?.calculus ?? 15, label: currentI18n.calculusDesc },
                { name: currentI18n.severeCavity, value: currentMetrics?.cavity ?? 0, label: currentI18n.cavityDesc },
                { name: currentI18n.gingivitisRisk, value: currentMetrics?.gingivitis ?? 0, label: currentI18n.gingivitisDesc }
              ].map((diag) => (
                <div key={diag.name} className="flex flex-col text-[8.5px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{diag.name}</span>
                    <span className={`font-bold ${diag.value > 30 ? 'text-rose-400' : diag.value > 15 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {diag.value}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full mt-1 border border-cyan-950/30 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${diag.value > 30 ? 'bg-rose-500' : diag.value > 15 ? 'bg-amber-400' : 'bg-cyan-600'}`}
                      style={{ width: `${diag.value}%` }}
                    />
                  </div>
                  <span className="text-[6.5px] text-slate-500 mt-0.5 leading-none">{diag.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Risk Assessment */}
          <div className="bg-[#030a17]/85 border border-cyan-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all text-left">
            <div className="flex items-center justify-between mb-2.5 border-b border-cyan-950/40 pb-2">
              <span className="text-[10px] font-bold font-mono text-[#00f2fe] tracking-widest uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                {currentI18n.riskAssessment}
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">{currentI18n.classifier}</span>
            </div>

            <div className="flex items-center gap-4 mt-2">
              {/* Colored Badge */}
              <div className={`px-4 py-2.5 rounded-xl border font-mono text-center font-black uppercase text-sm flex flex-col justify-center ${
                currentMetrics?.riskLabel === 'HIGH' 
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : currentMetrics?.riskLabel === 'MEDIUM'
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
              }`}>
                <span className="text-[7.5px] font-mono text-slate-500 leading-none mb-1">{currentI18n.riskLabel}</span>
                <span className="text-sm font-black">
                  {currentMetrics?.riskLabel === 'HIGH' ? (localLang === 'uz' ? 'YUQORI' : localLang === 'ru' ? 'ВЫСОКИЙ' : 'HIGH') :
                   currentMetrics?.riskLabel === 'MEDIUM' ? (localLang === 'uz' ? 'O\'RTA' : localLang === 'ru' ? 'СРЕДНИЙ' : 'MEDIUM') :
                   (localLang === 'uz' ? 'PAST' : localLang === 'ru' ? 'НИЗКИЙ' : 'LOW')}
                </span>
              </div>

              <div className="flex flex-col text-left text-[9.5px] font-mono text-slate-400">
                <span>{localLang === 'uz' ? 'Profilaktika lozim:' : localLang === 'ru' ? 'Требуется профилактика:' : 'Preventions advised:'}</span>
                <span className="text-white font-bold text-[10px] mt-1 leading-normal">
                  {currentMetrics?.riskLabel === 'HIGH' 
                    ? (localLang === 'uz' ? 'TEZKOR STOMATOLOG KO\'RIGI' : localLang === 'ru' ? 'СРОЧНЫЙ ВИЗИТ К СТОМАТОЛОГУ' : 'IMMEDIATE DENTAL TREATMENT')
                    : currentMetrics?.riskLabel === 'MEDIUM'
                    ? (localLang === 'uz' ? 'KOMPLEKS TOZALASH' : localLang === 'ru' ? 'КОМПЛЕКСНАЯ ЧИСТКА' : 'DEEP CLEANING METHOD')
                    : (localLang === 'uz' ? 'GIGIYENIK KO\'RIK' : localLang === 'ru' ? 'ГИГИЕНИЧЕСКИЙ ОСМОТР' : 'MAINTAIN HEALTHCARE')
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Clinical Recommendation */}
          <div className="bg-[#030a17]/85 border border-cyan-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all text-left">
            <div className="flex items-center justify-between mb-2.5 border-b border-cyan-950/40 pb-2">
              <span className="text-[10px] font-bold font-mono text-[#00f2fe] tracking-widest uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {currentI18n.recommendation}
              </span>
              <span className="text-[8px] font-mono text-slate-500">{currentI18n.treatment}</span>
            </div>

            <div className="flex flex-col gap-2.5 mt-2.5 font-mono text-[9px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span className="text-white sm:text-[9.5px] leading-tight">
                  {localLang === 'uz' ? 'Ftorli tish pastasi bilan yuvish' : localLang === 'ru' ? 'Чистка фторсодержащей пастой' : 'Fluoride Brushing Adherence'} ({Math.max(60, Math.min(100, healthVal - 5))}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-white sm:text-[9.5px] leading-tight">
                  {localLang === 'uz' ? 'Tish iplaridan har kuni foydalanish' : localLang === 'ru' ? 'Ежедневная зубная нить' : 'Interdental Flossing Daily'} ({Math.max(50, Math.min(100, healthVal - 20))}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-white sm:text-[9.5px] leading-tight">
                  {localLang === 'uz' ? 'Shakarli ichimliklarni cheklash' : localLang === 'ru' ? 'Ограничение сладких напитков' : 'Limit sugar drink/snacking'} ({Math.max(40, Math.min(100, healthVal - 10))}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                <span className="text-white sm:text-[9.5px] leading-tight">
                  {localLang === 'uz' ? 'Professional gigiyenik tozalash' : localLang === 'ru' ? 'Профессиональный осмотр гигиены' : 'Professional hygiene check'} ({healthVal < 50 ? 100 : Math.max(50, Math.min(100, healthVal))}%)
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Historical Change Log */}
          <div className="bg-[#030a17]/85 border border-cyan-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all text-left">
            <div className="flex items-center justify-between mb-2 border-b border-[#0f243a] pb-2">
              <span className="text-[10px] font-bold font-mono text-[#00f2fe] tracking-widest uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {currentI18n.historyDiary}
              </span>
              <span className="text-[8px] font-mono text-slate-500">{currentI18n.archiveLogs}</span>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {[
                { date: '21.05.2025', desc: localLang === 'uz' ? 'Emal yemirilishi tahlili' : localLang === 'ru' ? 'Анализ износа эмали' : 'Enamel wear evaluation', h: '94%' },
                { date: '19.07.2024', desc: localLang === 'uz' ? 'Yengil tish qatlamlari olindi' : localLang === 'ru' ? 'Удален незначительный налет' : 'Slight plaque removed', h: '88%' },
                { date: '03.11.2023', desc: localLang === 'uz' ? 'Profilaktik germetizatsiya qilingan' : localLang === 'ru' ? 'Проведено защитное запечатывание' : 'Preventative sealing done', h: '100%' }
              ].map((log) => (
                <div key={log.date} className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono leading-none py-1 border-b border-cyan-950/20 last:border-0 border-dashed">
                  <div className="flex flex-col text-left">
                    <span className="text-slate-550 font-bold">{log.date}</span>
                    <span className="text-slate-500 text-[7px] mt-0.5">{log.desc}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{log.h}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
