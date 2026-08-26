import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../services/firebase';
import { STANDARD_SERVICES_CATALOG } from './DirectorDashboard';
import { Language } from '../translations';
import { createTranslator, Dict } from '../utils/translate';
import { saveTreatmentCharge } from '../utils/treatmentCharges';
import {
  Stethoscope,
  Plus,
  History,
  AlertTriangle,
  X,
  Brain,
  DollarSign,
  Edit,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Grid,
  RotateCcw,
  Search,
  Save
} from 'lucide-react';

export interface ToothSurfaceData {
  O?: string;
  M?: string;
  D?: string;
  B?: string;
  L?: string;
}

export interface ToothData {
  id: string; 
  condition: string;
  conditions?: string[];
  surfaces: ToothSurfaceData;
  notes: string;
  material?: string;
  mobility?: string;
  bleeding?: boolean;
  suppuration?: boolean;
  rootCanals?: number;
  history: Array<{
    id: string;
    date: string;
    treatment: string;
    condition: string;
    cost: number; // list price — the discount is recorded separately, not folded in
    discountPercent?: number;
    dentist: string;
    notes?: string;
    material?: string;
    shade?: string;
  }>;
}

// Keyed by the Uzbek label so CONDITIONS[].label doubles as the translation key
// — the palette, the drawer chips, the surface list, the history and both
// dialogs all render the same strings through t().
const DENTAL_CHART_TRANSLATIONS: Dict = {
  "sog'lom": { ru: "Здоровый", en: "Healthy", kk: "Сау", ky: "Дени сак", tg: "Солим", tk: "Sagdyn" },
  "boshlang'ich kariyes": { ru: "Начальный кариес", en: "Initial caries", kk: "Бастапқы кариес", ky: "Баштапкы кариес", tg: "Кариеси ибтидоӣ", tk: "Başlangyç karies" },
  "chuqur kariyes": { ru: "Глубокий кариес", en: "Deep caries", kk: "Терең кариес", ky: "Терең кариес", tg: "Кариеси чуқур", tk: "Çuň karies" },
  "pulpit": { ru: "Пульпит", en: "Pulpitis", kk: "Пульпит", ky: "Пульпит", tg: "Пулпит", tk: "Pulpit" },
  "periodontit": { ru: "Периодонтит", en: "Periodontitis", kk: "Периодонтит", ky: "Периодонтит", tg: "Периодонтит", tk: "Periodontit" },
  "apikal zararlanish": { ru: "Апикальное поражение", en: "Apical lesion", kk: "Апикалды зақымдану", ky: "Апикалдык зыян", tg: "Осеби апикалӣ", tk: "Apikal zeper" },
  "kanal davolash boshlandi": { ru: "Лечение канала начато", en: "Root canal started", kk: "Арнаны емдеу басталды", ky: "Канал дарылоо башталды", tg: "Табобати канал оғоз шуд", tk: "Kanal bejergisi başlandy" },
  "kanal davolandi": { ru: "Канал вылечен", en: "Root canal completed", kk: "Арна емделді", ky: "Канал дарыланды", tg: "Канал табобат шуд", tk: "Kanal bejerildi" },
  "vaqtinchalik plomba": { ru: "Временная пломба", en: "Temporary filling", kk: "Уақытша пломба", ky: "Убактылуу пломба", tg: "Пломбаи муваққатӣ", tk: "Wagtlaýyn plomba" },
  "kompozit plomba": { ru: "Композитная пломба", en: "Composite filling", kk: "Композиттік пломба", ky: "Композиттик пломба", tg: "Пломбаи композитӣ", tk: "Kompozit plomba" },
  "shisha ionomer plomba": { ru: "Стеклоиономерная пломба", en: "Glass ionomer filling", kk: "Шыны иономер пломба", ky: "Айнек иономер пломба", tg: "Пломбаи шишагӣ-иономерӣ", tk: "Aýna ionomer plomba" },
  "silant": { ru: "Силант", en: "Sealant", kk: "Силант", ky: "Силант", tg: "Силант", tk: "Silant" },
  "koronka": { ru: "Коронка", en: "Crown", kk: "Коронка", ky: "Коронка", tg: "Тоҷ", tk: "Koronka" },
  "ko'prik": { ru: "Мост", en: "Bridge", kk: "Көпір", ky: "Көпүрө", tg: "Пул", tk: "Köpri" },
  "implant": { ru: "Имплант", en: "Implant", kk: "Имплант", ky: "Имплант", tg: "Имплант", tk: "Implant" },
  "briket": { ru: "Брекет", en: "Bracket", kk: "Брекет", ky: "Брекет", tg: "Брекет", tk: "Breket" },
  "harakatlanuvchi": { ru: "Подвижный", en: "Mobile", kk: "Қозғалмалы", ky: "Кыймылдуу", tg: "Ҳаракатнок", tk: "Hereketli" },
  "sinish": { ru: "Перелом", en: "Fracture", kk: "Сынық", ky: "Сынык", tg: "Шикастагӣ", tk: "Döwük" },
  "olish rejalashtirilgan": { ru: "Планируется удаление", en: "Extraction planned", kk: "Жұлу жоспарланған", ky: "Сууруу пландаштырылган", tg: "Кашидан ба нақша гирифта шуд", tk: "Aýyrmak meýilleşdirilen" },
  "olingan": { ru: "Удалён", en: "Extracted", kk: "Жұлынған", ky: "Сууруп алынган", tg: "Кашида шуд", tk: "Aýrylan" },
  "yo'q (missing)": { ru: "Отсутствует", en: "Missing", kk: "Жоқ", ky: "Жок", tg: "Мавҷуд нест", tk: "Ýok" },
  "retensiya (impacted)": { ru: "Ретенция", en: "Impacted", kk: "Ретенция", ky: "Ретенция", tg: "Ретенсия", tk: "Retensiýa" },
  "kuzatuv": { ru: "Наблюдение", en: "Observation", kk: "Бақылау", ky: "Байкоо", tg: "Мушоҳида", tk: "Gözegçilik" },
  "qayta ko'rik zarur": { ru: "Требуется повторный осмотр", en: "Needs review", kk: "Қайта тексеру қажет", ky: "Кайра текшерүү керек", tg: "Аз нав муоина лозим аст", tk: "Gaýtadan barlag gerek" },

  "tezkor bo'yash:": { ru: "Быстрая разметка:", en: "Quick paint:", kk: "Жылдам белгілеу:", ky: "Ыкчам белгилөө:", tg: "Ранги зуд:", tk: "Çalt boýag:" },
  "barchasi": { ru: "Всего", en: "All", kk: "Барлығы", ky: "Бардыгы", tg: "Ҳама", tk: "Ählisi" },
  "karies": { ru: "Кариес", en: "Caries", kk: "Кариес", ky: "Кариес", tg: "Кариес", tk: "Karies" },
  "plomba": { ru: "Пломба", en: "Filling", kk: "Пломба", ky: "Пломба", tg: "Пломба", tk: "Plomba" },
  "kanal": { ru: "Канал", en: "Canal", kk: "Арна", ky: "Канал", tg: "Канал", tk: "Kanal" },
  "yo'q": { ru: "Нет", en: "Missing", kk: "Жоқ", ky: "Жок", tg: "Нест", tk: "Ýok" },
  "belgilangan": { ru: "Отмечено", en: "Marked", kk: "Белгіленген", ky: "Белгиленген", tg: "Қайдшуда", tk: "Bellenen" },
  "bajarildi": { ru: "Выполнено", en: "Done", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷро шуд", tk: "Ýerine ýetirildi" },
  "yuqori jag'": { ru: "Верхняя челюсть", en: "Upper jaw", kk: "Жоғарғы жақ", ky: "Жогорку жаак", tg: "Ҷоғи боло", tk: "Ýokarky äň" },
  "pastki jag'": { ru: "Нижняя челюсть", en: "Lower jaw", kk: "Төменгі жақ", ky: "Ылдыйкы жаак", tg: "Ҷоғи поён", tk: "Aşaky äň" },
  "saqlanmagan o'zgarishlar bor. saqlamasdan chiqilsinmi?": { ru: "Есть несохранённые изменения. Выйти без сохранения?", en: "There are unsaved changes. Leave without saving?", kk: "Сақталмаған өзгерістер бар. Сақтамай шығасыз ба?", ky: "Сакталбаган өзгөрүүлөр бар. Сактабай чыгасызбы?", tg: "Тағйироти захиранашуда мавҷуданд. Бе захира баромадан?", tk: "Ýatda saklanmadyk üýtgeşmeler bar. Ýatda saklaman çykmalymy?" },
};

export type ToothCategory =
  | 'missing' | 'implants' | 'crowns' | 'endo' | 'filled' | 'decayed' | 'marked' | 'healthy';

const DECAY_IDS = ['Deep Caries', 'Initial Caries', 'Pulpitis', 'Periodontitis', 'Apical Lesion'];
const FILLING_IDS = ['Composite Filling', 'Temporary Filling', 'Glass Ionomer Filling', 'Sealant'];
const ENDO_IDS = ['Root Canal Started', 'Root Canal Completed'];
const CROWN_IDS = ['Crown', 'Bridge'];
// Diagnoses that are neither restorative nor decay but still mean "this tooth has
// been flagged". Without this bucket they fell through to `healthy`, so a tooth
// painted black for a fracture was reported as healthy.
const MARKED_IDS = [
  'Orthodontic Bracket', 'Mobility', 'Fracture', 'Extraction Planned', 'Impacted',
  'Observation', 'Needs Review',
];

/**
 * Every category a tooth belongs to. A tooth genuinely can be several things at
 * once (root-canalled AND crowned AND newly carious), and the previous code
 * assigned only the first match, which made KARIES read systematically low.
 *
 * This is the single definition — both the counters and the click-to-highlight
 * filter call it, so a counter can no longer disagree with what it highlights.
 */
export function categorizeTooth(tooth?: {
  condition?: string;
  conditions?: string[];
  surfaces?: ToothSurfaceData | Record<string, string | undefined>;
}): Set<ToothCategory> {
  const out = new Set<ToothCategory>();
  if (!tooth) { out.add('healthy'); return out; }

  const conditions = tooth.conditions?.length
    ? tooth.conditions
    : (tooth.condition ? [tooth.condition] : []);
  const surfaceValues = Object.values(tooth.surfaces || {}).filter(Boolean) as string[];

  const isDecay = (c: string) => DECAY_IDS.includes(c) || String(c).includes('Caries');
  const isFilling = (c: string) => FILLING_IDS.includes(c) || String(c).includes('Filling');

  if (conditions.includes('Extracted') || conditions.includes('Missing')) out.add('missing');
  if (conditions.includes('Implant')) out.add('implants');
  if (conditions.some(c => CROWN_IDS.includes(c))) out.add('crowns');
  if (conditions.some(c => ENDO_IDS.includes(c))) out.add('endo');
  // Surfaces are checked independently of the crown-level state, so caries under
  // an existing crown or beside an existing filling is no longer invisible.
  if (conditions.some(isFilling) || surfaceValues.some(isFilling)) out.add('filled');
  if (conditions.some(isDecay) || surfaceValues.some(isDecay)) out.add('decayed');
  if (conditions.some(c => MARKED_IDS.includes(c))) out.add('marked');

  if (out.size === 0) out.add('healthy');
  return out;
}

interface StatSnapshot {
  healthy: number; decayed: number; filled: number; endo: number;
  crowns: number; implants: number; missing: number; marked: number; total: number;
}

// Declared once so the counter row and its highlight filter can never drift apart.
const STAT_BUCKETS: Array<{
  key: ToothCategory | null;
  label: string;
  value: (s: StatSnapshot) => number;
  text: string;
  border: string;
}> = [
  { key: null, label: 'Barchasi', value: s => s.total, text: 'text-slate-800', border: 'border-slate-800 ring-slate-800' },
  { key: 'healthy', label: "Sog'lom", value: s => s.healthy, text: 'text-emerald-500', border: 'border-emerald-500 ring-emerald-500' },
  { key: 'decayed', label: 'Karies', value: s => s.decayed, text: 'text-rose-500', border: 'border-rose-500 ring-rose-500' },
  { key: 'filled', label: 'Plomba', value: s => s.filled, text: 'text-blue-500', border: 'border-blue-500 ring-blue-500' },
  { key: 'endo', label: 'Kanal', value: s => s.endo, text: 'text-amber-500', border: 'border-amber-500 ring-amber-500' },
  { key: 'crowns', label: 'Koronka', value: s => s.crowns, text: 'text-purple-500', border: 'border-purple-500 ring-purple-500' },
  { key: 'implants', label: 'Implant', value: s => s.implants, text: 'text-cyan-500', border: 'border-cyan-500 ring-cyan-500' },
  { key: 'marked', label: 'Belgilangan', value: s => s.marked, text: 'text-orange-500', border: 'border-orange-500 ring-orange-500' },
  { key: 'missing', label: "Yo'q", value: s => s.missing, text: 'text-gray-500', border: 'border-gray-500 ring-gray-500' },
];

const CONDITIONS = [
  { id: 'Healthy', color: '#10b981', label: "Sog'lom" },
  { id: 'Initial Caries', color: '#fcd34d', label: "Boshlang'ich Kariyes" },
  { id: 'Deep Caries', color: '#ef4444', label: "Chuqur Kariyes" },
  { id: 'Pulpitis', color: '#dc2626', label: "Pulpit" },
  { id: 'Periodontitis', color: '#991b1b', label: "Periodontit" },
  { id: 'Apical Lesion', color: '#7f1d1d', label: "Apikal zararlanish" },
  { id: 'Root Canal Started', color: '#f59e0b', label: "Kanal davolash boshlandi" },
  { id: 'Root Canal Completed', color: '#d97706', label: "Kanal davolandi" },
  { id: 'Temporary Filling', color: '#60a5fa', label: "Vaqtinchalik plomba" },
  { id: 'Composite Filling', color: '#3b82f6', label: "Kompozit plomba" },
  { id: 'Glass Ionomer Filling', color: '#2563eb', label: "Shisha ionomer plomba" },
  { id: 'Sealant', color: '#ccfbf1', label: "Silant" },
  { id: 'Crown', color: '#a855f7', label: "Koronka" },
  { id: 'Bridge', color: '#9333ea', label: "Ko'prik" },
  { id: 'Implant', color: '#06b6d4', label: "Implant" },
  { id: 'Orthodontic Bracket', color: '#cbd5e1', label: "Briket" },
  { id: 'Mobility', color: '#f97316', label: "Harakatlanuvchi" },
  { id: 'Fracture', color: '#000000', label: "Sinish" },
  { id: 'Extraction Planned', color: '#475569', label: "Olish rejalashtirilgan" },
  { id: 'Extracted', color: '#1e293b', label: "Olingan" },
  { id: 'Missing', color: '#0f172a', label: "Yo'q (Missing)" },
  { id: 'Impacted', color: '#6366f1', label: "Retensiya (Impacted)" },
  { id: 'Observation', color: '#bae6fd', label: "Kuzatuv" },
  { id: 'Needs Review', color: '#fbcfe8', label: "Qayta ko'rik zarur" }
];

const QUADRANT_1 = [18, 17, 16, 15, 14, 13, 12, 11];
const QUADRANT_2 = [21, 22, 23, 24, 25, 26, 27, 28];
const QUADRANT_4 = [48, 47, 46, 45, 44, 43, 42, 41];
const QUADRANT_3 = [31, 32, 33, 34, 35, 36, 37, 38];

const PRIMARY_QUADRANT_1 = [55, 54, 53, 52, 51];
const PRIMARY_QUADRANT_2 = [61, 62, 63, 64, 65];
const PRIMARY_QUADRANT_4 = [85, 84, 83, 82, 81];
const PRIMARY_QUADRANT_3 = [71, 72, 73, 74, 75];

const getNotationLabel = (fdi: number, notation: "FDI" | "Universal" | "Palmer") => {
  if (notation === "FDI") return fdi.toString();
  
  const isPrimary = fdi > 50;
  
  if (notation === "Universal") {
    if (!isPrimary) {
      if (fdi >= 11 && fdi <= 18) return (9 - (fdi % 10)).toString();
      if (fdi >= 21 && fdi <= 28) return (8 + (fdi % 10)).toString();
      if (fdi >= 31 && fdi <= 38) return (25 - (fdi % 10)).toString();
      if (fdi >= 41 && fdi <= 48) return (24 + (fdi % 10)).toString();
    } else {
      const primaryMap: Record<number, string> = {
        55:'A', 54:'B', 53:'C', 52:'D', 51:'E',
        61:'F', 62:'G', 63:'H', 64:'I', 65:'J',
        75:'K', 74:'L', 73:'M', 72:'N', 71:'O',
        81:'P', 82:'Q', 83:'R', 84:'S', 85:'T'
      };
      return primaryMap[fdi] || fdi.toString();
    }
  }
  
  if (notation === "Palmer") {
    const isUpper = fdi < 30 || (fdi >= 51 && fdi <= 65);
    const isRight = (fdi >= 11 && fdi <= 18) || (fdi >= 41 && fdi <= 48) || (fdi >= 51 && fdi <= 55) || (fdi >= 81 && fdi <= 85);
    let val = (fdi % 10).toString();
    if (isPrimary) {
      val = String.fromCharCode(64 + (fdi % 10)); // 1->A, 2->B, etc.
    }
    
    if (isUpper && isRight) return `${val}┘`;
    if (isUpper && !isRight) return `└${val}`;
    if (!isUpper && isRight) return `${val}┐`;
    if (!isUpper && !isRight) return `┌${val}`;
  }
  
  return fdi.toString();
};

interface InteractiveToothProps {
  key?: React.Key;
  number: number;
  displayNumber?: string;
  data?: ToothData;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onSurfaceClick: (surface: string) => void;
  onSurfaceDoubleClick?: (surface: string) => void;
  highlightCondition: string | null;
}

const InteractiveTooth = ({ 
  number, 
  displayNumber,
  data, 
  isSelected, 
  onClick, 
  onDoubleClick,
  onSurfaceClick,
  onSurfaceDoubleClick,
  highlightCondition
}: InteractiveToothProps) => {
  const isUpper = number < 30 || (number >= 51 && number <= 65);
  const isMolar = [8, 7, 6].includes(number % 10) || ([5, 4].includes(number % 10) && number >= 51 && number <= 85);
  const q = number < 20 ? 1 : number < 30 ? 2 : number < 40 ? 3 : number < 50 ? 4 : number < 60 ? 1 : number < 70 ? 2 : number < 80 ? 3 : 4;
  
  let topS = 'B', bottomS = 'L', leftS = 'M', rightS = 'D';
  if (q === 1) { topS = 'B'; bottomS = 'L'; leftS = 'D'; rightS = 'M'; }
  else if (q === 2) { topS = 'B'; bottomS = 'L'; leftS = 'M'; rightS = 'D'; }
  else if (q === 3) { topS = 'L'; bottomS = 'B'; leftS = 'M'; rightS = 'D'; }
  else if (q === 4) { topS = 'L'; bottomS = 'B'; leftS = 'D'; rightS = 'M'; }

  const surfaces = data?.surfaces || {};
  const conditions = data?.conditions || (data?.condition ? [data.condition] : ['Healthy']);
  const globalCondition = conditions[0] || 'Healthy';
  
  const hasCond = (c: string) => conditions.includes(c);
  
  const isExtracted = hasCond('Extracted');
  const isImplant = hasCond('Implant');
  
  // Same categorizer the counters use, so clicking "PLOMBA 1" highlights exactly
  // one tooth rather than every tooth that loosely matched a second, divergent
  // copy of this logic.
  const hasCondition = (category: string) =>
    categorizeTooth({ conditions, surfaces }).has(category as ToothCategory);

  const isFaded = highlightCondition && !hasCondition(highlightCondition);

  const getToothColor = (condition: string) => {
    if (condition === 'Healthy') return '#F5F0E8';
    if (condition === 'Extracted') return 'none';
    const found = CONDITIONS.find(c => c.id === condition);
    return found ? found.color : '#F5F0E8';
  };

  const getSurfaceFill = (s: string) => {
    const val = surfaces[s];
    if (!val) return 'transparent';
    return getToothColor(val);
  };

  const getPrimaryCrownCondition = () => {
    if (conditions.includes('Implant')) return 'Implant';
    if (conditions.includes('Crown')) return 'Crown';
    if (conditions.includes('Bridge')) return 'Bridge';
    if (conditions.includes('Extracted')) return 'Extracted';
    if (conditions.includes('Missing')) return 'Missing';
    
    const overlays = ['Orthodontic Bracket', 'Mobility', 'Fracture', 'Extraction Planned', 'Observation', 'Needs Review', 'Impacted'];
    return conditions.find(c => !['Root Canal Started', 'Root Canal Completed', 'Apical Lesion', 'Periodontitis', ...overlays].includes(c)) || 'Healthy';
  };

  const crownCondition = getPrimaryCrownCondition();
  const baseColor = getToothColor(crownCondition);
  const strokeColor = '#D4C5A9';

  let rootFill = baseColor;
  let rootStroke = strokeColor;
  if (conditions.includes('Root Canal Completed') || conditions.includes('Root Canal Started')) {
    rootFill = '#F59E0B';
    rootStroke = '#d97706';
  } else if (conditions.includes('Apical Lesion')) {
    rootFill = '#EF4444';
    rootStroke = '#7f1d1d';
  } else if (conditions.includes('Implant')) {
    rootFill = '#06B6D4';
    rootStroke = '#0891b2';
  }

  const lastHistory = data?.history && data.history.length > 0 ? data.history[0] : null;

  const upperSingleRoot = "M 16 70 Q 25 10 34 70 Z";
  const upperMolarRoot = "M 12 70 Q 18 10 23 60 Q 25 55 27 60 Q 32 10 38 70 Z";
  const lowerSingleRoot = "M 16 50 Q 25 110 34 50 Z";
  const lowerMolarRoot = "M 12 50 Q 18 110 23 60 Q 25 65 27 60 Q 32 110 38 50 Z";

  const rootPath = isUpper
    ? (isMolar ? upperMolarRoot : upperSingleRoot)
    : (isMolar ? lowerMolarRoot : lowerSingleRoot);

  const crownRect = isUpper
    ? { x: 10, y: 70, w: 30, h: 30, cx: 25, cy: 85 }
    : { x: 10, y: 20, w: 30, h: 30, cx: 25, cy: 35 };

  return (
    <div 
      className={`relative flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer hover:scale-110 group
        ${isSelected ? 'scale-110 z-30' : 'z-10 hover:z-20'}
        ${isFaded ? 'opacity-15 grayscale' : 'opacity-100'}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className={`flex flex-col items-center relative ${isSelected ? 'ring-2 ring-emerald-500 rounded-xl p-1 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-emerald-50' : 'p-1'}`}>
        {isUpper && <span className="text-xs font-bold mb-0.5 text-gray-400">{displayNumber || number}</span>}
        
        <svg width="40" height="95" viewBox="0 0 50 120" className="drop-shadow-sm filter">
          <defs>
            <clipPath id={`crown-clip-${number}`}>
              <rect x={crownRect.x} y={crownRect.y} width={crownRect.w} height={crownRect.h} rx="8" />
            </clipPath>
            <radialGradient id={`crown-shine-${number}`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="0.7" />
              <stop offset="40%" stopColor="white" stopOpacity="0.1" />
              <stop offset="100%" stopColor="black" stopOpacity="0.15" />
            </radialGradient>
            <linearGradient id={`root-shade-${number}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="black" stopOpacity="0.2" />
              <stop offset="30%" stopColor="white" stopOpacity="0.2" />
              <stop offset="70%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="black" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {isExtracted ? (
            <path d={isUpper ? "M10,70 L40,100 M40,70 L10,100" : "M10,20 L40,50 M40,20 L10,50"} stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
          ) : (
            <>
              {/* Roots */}
              {isImplant ? (
                <g>
                  {isUpper ? (
                    <>
                      <rect x="18" y="20" width="14" height="45" rx="3" fill="#06B6D4" />
                      <rect x="18" y="20" width="14" height="45" rx="3" fill={`url(#root-shade-${number})`} />
                      <path d="M 16,30 L 34,35 M 16,40 L 34,45 M 16,50 L 34,55 M 16,60 L 34,65" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" />
                    </>
                  ) : (
                    <>
                      <rect x="18" y="55" width="14" height="45" rx="3" fill="#06B6D4" />
                      <rect x="18" y="55" width="14" height="45" rx="3" fill={`url(#root-shade-${number})`} />
                      <path d="M 16,65 L 34,70 M 16,75 L 34,80 M 16,85 L 34,90 M 16,95 L 34,100" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}
                </g>
              ) : (
                <>
                  <path d={rootPath} fill={rootFill} stroke={rootStroke} strokeWidth="1.5" />
                  <path d={rootPath} fill={`url(#root-shade-${number})`} className="pointer-events-none" />
                </>
              )}
              
              {/* Base Crown Background */}
              <rect x={crownRect.x} y={crownRect.y} width={crownRect.w} height={crownRect.h} rx="8" fill={baseColor} />
              
              {/* Surfaces Overlay (clipped to rounded crown) */}
              <g clipPath={`url(#crown-clip-${number})`}>
                {isUpper ? (
                  <>
                    <polygon points="10,70 40,70 30,80 20,80" fill={getSurfaceFill(topS)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick(topS); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.(topS); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                    <polygon points="40,70 40,100 30,90 30,80" fill={getSurfaceFill(rightS)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick(rightS); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.(rightS); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                    <polygon points="40,100 10,100 20,90 30,90" fill={getSurfaceFill(bottomS)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick(bottomS); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.(bottomS); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                    <polygon points="10,100 10,70 20,80 20,90" fill={getSurfaceFill(leftS)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick(leftS); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.(leftS); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                    <polygon points="20,80 30,80 30,90 20,90" fill={getSurfaceFill('O')} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick('O'); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.('O'); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                  </>
                ) : (
                  <>
                    <polygon points="10,20 40,20 30,30 20,30" fill={getSurfaceFill(topS)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick(topS); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.(topS); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                    <polygon points="40,20 40,50 30,40 30,30" fill={getSurfaceFill(rightS)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick(rightS); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.(rightS); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                    <polygon points="40,50 10,50 20,40 30,40" fill={getSurfaceFill(bottomS)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick(bottomS); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.(bottomS); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                    <polygon points="10,50 10,20 20,30 20,40" fill={getSurfaceFill(leftS)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick(leftS); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.(leftS); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                    <polygon points="20,30 30,30 30,40 20,40" fill={getSurfaceFill('O')} stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinejoin="round" onClick={(e) => { e.stopPropagation(); onSurfaceClick('O'); }} onDoubleClick={(e) => { e.stopPropagation(); onSurfaceDoubleClick?.('O'); }} className="hover:opacity-80 transition-all cursor-pointer hover:stroke-black/30" />
                  </>
                )}
              </g>

              {/* 3D Crown Overlay */}
              <rect x={crownRect.x} y={crownRect.y} width={crownRect.w} height={crownRect.h} rx="8" fill={`url(#crown-shine-${number})`} className="pointer-events-none mix-blend-overlay" />

              {/* Outer Crown Border */}
              <rect x={crownRect.x} y={crownRect.y} width={crownRect.w} height={crownRect.h} rx="8" fill="none" stroke={strokeColor} strokeWidth="1.5" className="pointer-events-none" />
            </>
          )}
        </svg>
        
        {/* Overlays / Badges */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-wrap justify-center gap-0.5 w-full pointer-events-none z-10 px-0.5">
          {conditions.includes('Orthodontic Bracket') && <span className="flex items-center justify-center w-4 h-4 bg-slate-500 rounded-full text-[10px] text-white font-bold border border-white shadow-sm" title="Briket">B</span>}
          {conditions.includes('Mobility') && <span className="flex items-center justify-center w-4 h-4 bg-orange-500 rounded-full text-[10px] text-white font-bold border border-white shadow-sm" title="Harakatlanuvchi">M</span>}
          {conditions.includes('Fracture') && <span className="flex items-center justify-center w-4 h-4 bg-black rounded-full text-[10px] text-white font-bold border border-white shadow-sm" title="Sinish">F</span>}
          {conditions.includes('Extraction Planned') && <span className="flex items-center justify-center w-4 h-4 bg-rose-600 rounded-full text-[10px] text-white font-bold border border-white shadow-sm" title="Olish rejalashtirilgan">X</span>}
          {conditions.includes('Observation') && <span className="flex items-center justify-center w-4 h-4 bg-sky-400 rounded-full text-[10px] text-white font-bold border border-white shadow-sm" title="Kuzatuv">O</span>}
          {conditions.includes('Needs Review') && <span className="flex items-center justify-center w-4 h-4 bg-pink-400 rounded-full text-[10px] text-white font-bold border border-white shadow-sm" title="Qayta ko'rik zarur">!</span>}
          {conditions.includes('Impacted') && <span className="flex items-center justify-center w-4 h-4 bg-indigo-500 rounded-full text-[10px] text-white font-bold border border-white shadow-sm" title="Retensiya (Impacted)">I</span>}
        </div>

        {!isUpper && <span className="text-xs font-bold mt-0.5 text-gray-400">{displayNumber || number}</span>}
      </div>
    </div>
  );
};

interface DentalChartProps {
  patientId: string;
  doctorName?: string;
  readOnly?: boolean;
  language?: Language;
  clinicId?: string;
  doctorId?: string;
  patientName?: string;
  staffToken?: string | null;
}

export default function DentalChart({
  patientId, doctorName, readOnly = false, language, clinicId, doctorId, patientName, staffToken,
}: DentalChartProps) {
  const t = createTranslator(language, DENTAL_CHART_TRANSLATIONS);
  const [teeth, setTeeth] = useState<Record<string, ToothData>>({});
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null);
  const [highlightCondition, setHighlightCondition] = useState<string | null>(null);
  const [toothSearch, setToothSearch] = useState('');
  const [toothType, setToothType] = useState<"adult" | "child">("adult");
  const [notation, setNotation] = useState<"FDI" | "Universal" | "Palmer">("FDI");
  
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [showEditTooth, setShowEditTooth] = useState(false);
  const [showXRay, setShowXRay] = useState(false);
  const [editToothData, setEditToothData] = useState<Partial<ToothData>>({});
  
  const [newTreatment, setNewTreatment] = useState({ 
    treatment: '', 
    cost: 0, 
    discount: 0,
    notes: '', 
    condition: 'Healthy',
    surfaceOnly: false,
    material: '',
    shade: '',
    duration: '30',
    assistant: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState(0);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [paintCondition, setPaintCondition] = useState<string | null>(null);
  const [pendingPaintChanges, setPendingPaintChanges] = useState<Record<string, ToothData>>({});
  const [isSavingPaint, setIsSavingPaint] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
    if (!patientId) return;
    const unsub = onSnapshot(
      collection(db, `patients/${patientId}/dentalChart`),
      (snapshot) => {
        const data: Record<string, ToothData> = {};
        snapshot.forEach(doc => {
          data[doc.id] = doc.data() as ToothData;
        });
        setTeeth(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `patients/${patientId}/dentalChart`);
      }
    );
    return () => unsub();
  }, [patientId]);

  // Unsaved paint belongs to the patient it was drawn on. Without this, switching
  // patients carried the previous patient's pending teeth over — they rendered on
  // the new chart and pressing "Saqlash" wrote them into the WRONG patient's
  // record. Clearing on id change is the only safe behaviour.
  useEffect(() => {
    setPendingPaintChanges({});
    setSelectedTooth(null);
    setSelectedSurface(null);
  }, [patientId]);

  // Painting is only persisted when "Saqlash" is pressed, so leaving the page
  // with pending changes silently discards them.
  useEffect(() => {
    if (Object.keys(pendingPaintChanges).length === 0) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pendingPaintChanges]);

  const applyPaintToTooth = (id: number, surface?: string) => {
    if (readOnly || !paintCondition) return;
    const toothIdStr = id.toString();
    // Read the pending state through the functional updater below rather than
    // from this closure: two clicks on the same tooth inside one render batch
    // both used to start from the same stale snapshot, so the first was lost.
    applyPaintInternal(toothIdStr, surface);
  };

  const applyPaintInternal = (toothIdStr: string, surface?: string) => {
    setPendingPaintChanges(prev => {
    const existingTooth = prev[toothIdStr] || teeth[toothIdStr] || {
      id: toothIdStr,
      condition: 'Healthy',
      conditions: ['Healthy'],
      surfaces: {},
      notes: '',
      history: []
    };

    let updatedSurfaces = { ...existingTooth.surfaces } as Record<string, string>;
    let currentConditions = [...(existingTooth.conditions || (existingTooth.condition ? [existingTooth.condition] : ['Healthy']))];
    
    // Clear out 'Healthy' if we add something else
    if (currentConditions.includes('Healthy') && paintCondition !== 'Healthy') {
      currentConditions = currentConditions.filter(c => c !== 'Healthy');
    }

    const globalConditions = ['Crown', 'Extracted', 'Missing', 'Implant', 'Healthy', 'Pulpitis', 'Periodontitis', 'Apical Lesion', 'Root Canal Started', 'Root Canal Completed', 'Bridge', 'Orthodontic Bracket', 'Mobility', 'Fracture', 'Extraction Planned', 'Impacted', 'Observation', 'Needs Review'];
    
    if (surface) {
      if (paintCondition === 'Healthy') {
         delete updatedSurfaces[surface];
         if (Object.keys(updatedSurfaces).length === 0 && currentConditions.length === 0) {
            currentConditions = ['Healthy'];
         }
      } else if (!globalConditions.includes(paintCondition)) {
        if (updatedSurfaces[surface] === paintCondition) {
          delete updatedSurfaces[surface];
        } else {
          updatedSurfaces[surface] = paintCondition;
        }
      } else {
        if (currentConditions.includes(paintCondition)) {
          // Toggle off
          currentConditions = currentConditions.filter(c => c !== paintCondition);
          if (currentConditions.length === 0 && Object.keys(updatedSurfaces).length === 0) currentConditions = ['Healthy'];
        } else {
          if (paintCondition === 'Extracted' || paintCondition === 'Missing' || paintCondition === 'Implant') {
             currentConditions = [paintCondition];
             updatedSurfaces = {};
          } else {
             currentConditions = [...currentConditions, paintCondition];
             if (paintCondition === 'Crown' || paintCondition === 'Bridge') {
               updatedSurfaces = {};
               currentConditions = currentConditions.filter(c => !['Implant', 'Extracted', 'Missing'].includes(c));
             }
          }
        }
      }
    } else {
      if (currentConditions.includes(paintCondition)) {
        // Toggle off
        currentConditions = currentConditions.filter(c => c !== paintCondition);
        if (currentConditions.length === 0 && Object.keys(updatedSurfaces).length === 0) currentConditions = ['Healthy'];
      } else {
        if (paintCondition === 'Healthy' || paintCondition === 'Extracted' || paintCondition === 'Missing' || paintCondition === 'Implant') {
           // These completely reset the tooth
           currentConditions = [paintCondition];
           updatedSurfaces = {};
        } else {
           // Add the new condition
           currentConditions = [...currentConditions, paintCondition];
           // If it's a Crown, maybe clear surfaces but keep root canal
           if (paintCondition === 'Crown' || paintCondition === 'Bridge') {
             updatedSurfaces = {};
             // Ensure it doesn't have other incompatible crown statuses
             currentConditions = currentConditions.filter(c => !['Implant', 'Extracted', 'Missing'].includes(c));
           }
        }
      }
    }

    const updatedTooth: ToothData = {
      ...existingTooth,
      condition: currentConditions[0] || 'Healthy',
      conditions: currentConditions,
      surfaces: updatedSurfaces,
    };

    return { ...prev, [toothIdStr]: updatedTooth };
    });
  };

  const handleSavePaintChanges = async () => {
    if (readOnly || Object.keys(pendingPaintChanges).length === 0) return;
    setIsSavingPaint(true);
    try {
      // merge:true, because XRayCenter and PhotoGallery write history entries
      // into these same documents — a full overwrite here would erase whatever
      // they added between the doctor painting and pressing Saqlash.
      const promises = Object.entries(pendingPaintChanges).map(([id, data]) =>
        setDoc(doc(db, `patients/${patientId}/dentalChart`, id), data, { merge: true })
      );
      await Promise.all(promises);
      setPendingPaintChanges({});
      setPaintCondition(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `patients/${patientId}/dentalChart`);
    } finally {
      setIsSavingPaint(false);
    }
  };

  const handleResetChart = async () => {
    if (readOnly || !patientId) return;

    if (!window.confirm("Barcha tishlardagi belgilanishlarni va tarixni o'chirib, dastlabki sog'lom holatiga qaytarmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) {
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Delete all existing tooth records for this patient
      Object.keys(teeth).forEach(id => {
        const toothRef = doc(db, `patients/${patientId}/dentalChart`, id);
        batch.delete(toothRef);
      });

      await batch.commit();
      alert("Barcha tishlar tarixi tozalandi va sog'lom holatga keltirildi!");
      // Also drop unsaved paint — otherwise the canvas still showed the painted
      // teeth right after "everything cleared", and saving resurrected them.
      setPendingPaintChanges({});
      setPaintCondition(null);
      setSelectedTooth(null);
      setSelectedSurface(null);
    } catch (error) {
      console.error("Tozalashda xatolik:", error);
      alert("Xatolik yuz berdi.");
    }
  };

  const handleToothClick = (id: number) => {
    if (paintCondition) {
      applyPaintToTooth(id);
      return;
    }
    setSelectedTooth(id.toString());
    setSelectedSurface(null);
    setNewTreatment(prev => ({...prev, surfaceOnly: false}));
    setAiResult(null); // reset AI result for new tooth
  };

  const handleSurfaceClick = (id: number, surface: string) => {
    if (paintCondition) {
      applyPaintToTooth(id, surface);
      return;
    }
    setSelectedTooth(id.toString());
    setSelectedSurface(surface);
    setNewTreatment(prev => ({...prev, surfaceOnly: true}));
  };

  const handleSurfaceDoubleClick = (id: number, surface: string) => {
    if (paintCondition || readOnly) return;
    handleSurfaceClick(id, surface);
    setShowAddTreatment(true);
  };


  const runAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      if (!selectedTooth || !currentToothData) {
        setAiResult({
          findings: [],
          recommendations: "Tish tanlanmagan. Tahlil uchun odontogrammadan tish tanlang.",
          riskLevel: "Noma'lum"
        });
        return;
      }

      const conditions = currentToothData.conditions || (currentToothData.condition ? [currentToothData.condition] : ['Healthy']);
      const surfaceConditions = Object.values(currentToothData.surfaces || {}).filter(Boolean);
      const allConditions = [...conditions, ...surfaceConditions];

      const hasSerious = allConditions.some(c => 
        ['Deep Caries', 'Pulpitis', 'Periodontitis', 'Apical Lesion'].includes(c as string)
      );
      const hasModerate = allConditions.some(c => 
        ['Initial Caries', 'Root Canal Started', 'Mobility'].includes(c as string)
      );

      const riskLevel = hasSerious ? "Yuqori" : hasModerate ? "O'rta" : "Past";
      const confidence = hasSerious ? 91 : hasModerate ? 78 : 95;

      const numStr = getNotationLabel(parseInt(selectedTooth), notation);
      const mainCond = conditions[0] || 'Healthy';
      const recommendations = hasSerious
        ? `${numStr}-tish: Zudlik bilan davolash tavsiya etiladi. Holat: ${CONDITIONS.find(c => c.id === mainCond)?.label}. Kechiktirish asoratlarni kuchaytirishi mumkin.`
        : hasModerate
        ? `${numStr}-tish: Yaqin orada nazorat va davolash kerak. Holat: ${CONDITIONS.find(c => c.id === mainCond)?.label}.`
        : `${numStr}-tish: Hozircha sog'lom ko'rinish. Muntazam nazorat davom ettirilsin.`;

      setAiResult({
        findings: [{ tooth: selectedTooth, condition: mainCond, confidence }],
        recommendations,
        riskLevel
      });
    }, 1800);
  };

  const handleSaveEditTooth = async () => {
    if (readOnly || !selectedTooth) return;
    try {
      const toothRef = doc(db, `patients/${patientId}/dentalChart`, selectedTooth);
      // Start from what the dialog was actually seeded with (pending paint wins
      // over the persisted doc), not from the persisted doc alone — otherwise
      // unsaved paint on this tooth was silently dropped by this write.
      const base = pendingPaintChanges[selectedTooth] || teeth[selectedTooth];
      const dataToSave: any = { ...base, ...editToothData, id: selectedTooth };

      // Editing the primary condition must not discard the tooth's other
      // conditions. This previously collapsed e.g. ['Crown','Root Canal
      // Completed'] down to ['Crown'].
      if (editToothData.condition) {
        const existing = base?.conditions || (base?.condition ? [base.condition] : []);
        const rest = existing.filter(c => c !== base?.condition && c !== editToothData.condition);
        dataToSave.conditions = [editToothData.condition, ...rest];
      }

      // Make sure we have a minimum viable object if the tooth was previously completely empty
      if (!dataToSave.condition) dataToSave.condition = 'Healthy';
      if (!dataToSave.history) dataToSave.history = [];
      if (!dataToSave.surfaces) dataToSave.surfaces = {};

      await setDoc(toothRef, dataToSave, { merge: true });
      setShowEditTooth(false);
      // This tooth is now persisted, so its pending entry is stale — leaving it
      // meant a later "Saqlash" would overwrite what was just saved here.
      setPendingPaintChanges(prev => {
        if (!prev[selectedTooth]) return prev;
        const next = { ...prev };
        delete next[selectedTooth];
        return next;
      });
    } catch (error) {
      console.error("Error saving tooth edit:", error);
    }
  };

  const handleSaveTreatment = async () => {
    if (readOnly || !selectedTooth) return;

    const toothData = pendingPaintChanges[selectedTooth] || teeth[selectedTooth] || {
      id: selectedTooth,
      condition: 'Healthy',
      conditions: ['Healthy'],
      surfaces: {},
      notes: '',
      history: []
    };

    let updatedSurfaces = { ...toothData.surfaces } as Record<string, string>;
    let currentConditions = toothData.conditions || (toothData.condition ? [toothData.condition] : ['Healthy']);
    
    // Clear out 'Healthy' if we add something else
    if (currentConditions.includes('Healthy') && newTreatment.condition !== 'Healthy') {
      currentConditions = currentConditions.filter(c => c !== 'Healthy');
    }

    if (newTreatment.surfaceOnly && selectedSurface) {
       updatedSurfaces[selectedSurface] = newTreatment.condition;
    } else {
       const paintCondition = newTreatment.condition;
       
       if (paintCondition === 'Healthy' || paintCondition === 'Extracted' || paintCondition === 'Missing' || paintCondition === 'Implant') {
           // These completely reset the tooth
           currentConditions = [paintCondition];
           updatedSurfaces = {};
       } else {
           // Add the new condition if it's not already there
           if (!currentConditions.includes(paintCondition)) {
               currentConditions = [...currentConditions, paintCondition];
           }
           // If it's a Crown, maybe clear surfaces but keep root canal
           if (paintCondition === 'Crown' || paintCondition === 'Bridge') {
             updatedSurfaces = {};
             // Ensure it doesn't have other incompatible crown statuses
             currentConditions = currentConditions.filter(c => !['Implant', 'Extracted', 'Missing'].includes(c));
           }
       }
    }

    // The discount is now recorded rather than silently folded into the price.
    // `cost` stays the list price and the percentage travels with the charge, so
    // the treatment history and reports can show what was actually given away.
    const listPrice = Number(newTreatment.cost) || 0;
    const discountPercent = Number(newTreatment.discount) || 0;
    const treatmentLabel = newTreatment.treatment + (selectedSurface && newTreatment.surfaceOnly ? ` (Yuzasi: ${selectedSurface})` : '');

    const updatedTooth: ToothData = {
      ...toothData,
      condition: currentConditions[0] || 'Healthy',
      conditions: currentConditions,
      surfaces: updatedSurfaces,
      notes: newTreatment.notes || toothData.notes,
      history: [
        {
          id: Date.now().toString(),
          date: new Date(newTreatment.date).toISOString(),
          treatment: treatmentLabel,
          condition: newTreatment.condition,
          cost: listPrice,
          discountPercent: discountPercent || undefined,
          dentist: doctorName || 'Dr. Shifokor',
          notes: newTreatment.notes + (newTreatment.assistant ? ` | Assistent: ${newTreatment.assistant}` : ''),
          material: newTreatment.material,
          shade: newTreatment.shade
        },
        ...(toothData.history || [])
      ]
    };

    try {
      const newPlanId = newTreatment.treatment
        ? Date.now().toString() + "_" + Math.random().toString(36).substring(2, 9)
        : null;

      // Both writes go in one batch — previously a failure on the second left the
      // chart already changed with no matching plan entry.
      const batch = writeBatch(db);
      batch.set(doc(db, `patients/${patientId}/dentalChart`, selectedTooth), updatedTooth, { merge: true });
      if (newPlanId) {
        batch.set(doc(db, `patients/${patientId}/treatmentPlans`, newPlanId), {
          id: newPlanId,
          toothId: selectedTooth,
          treatment: treatmentLabel,
          price: listPrice,
          status: 'Completed',
          doctorName: doctorName || 'Dr. Shifokor',
          createdAt: new Date(newTreatment.date).toISOString()
        });
      }
      await batch.commit();

      if (newPlanId && clinicId && doctorId && staffToken) {
        await saveTreatmentCharge({
          id: newPlanId,
          clinicId, patientId, doctorId, patientName,
          treatmentName: treatmentLabel,
          toothId: selectedTooth,
          listPrice,
          discountPercent,
        }, staffToken);
      }

      setShowAddTreatment(false);
      setNewTreatment({ treatment: '', cost: 0, discount: 0, notes: '', condition: 'Healthy', surfaceOnly: false, material: '', shade: '', duration: '30', assistant: '', date: new Date().toISOString().split('T')[0] });
      
      // Clear pending paint changes for this tooth if any
      if (pendingPaintChanges[selectedTooth]) {
        const newPending = { ...pendingPaintChanges };
        delete newPending[selectedTooth];
        setPendingPaintChanges(newPending);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/dentalChart`);
    }
  };

  const currentToothData = selectedTooth ? (pendingPaintChanges[selectedTooth] || teeth[selectedTooth]) : null;
  const currentStatus = (selectedSurface ? currentToothData?.surfaces?.[selectedSurface] : (currentToothData?.conditions?.[0] || currentToothData?.condition)) || currentToothData?.conditions?.[0] || currentToothData?.condition || 'Healthy';
  const currentConditionLabel = CONDITIONS.find(c => c.id === currentStatus)?.label || "Sog'lom";

  const getICD10 = (condition: string) => {
    switch (condition) {
      case 'Initial Caries': return 'K02.0';
      case 'Deep Caries': return 'K02.1';
      case 'Pulpitis': return 'K04.0';
      case 'Periodontitis': return 'K04.4';
      case 'Apical Lesion': return 'K04.5';
      case 'Extracted': return 'K08.1';
      case 'Missing': return 'K00.0';
      case 'Healthy': return '-';
      default: return 'Z98.8';
    }
  };


  // Calculate live statistics
  const totalTeeth = toothType === 'adult' ? 32 : 20;
  const currentTeethSet = new Set(
    toothType === 'adult' 
      ? [...QUADRANT_1, ...QUADRANT_2, ...QUADRANT_3, ...QUADRANT_4].map(String)
      : [...PRIMARY_QUADRANT_1, ...PRIMARY_QUADRANT_2, ...PRIMARY_QUADRANT_3, ...PRIMARY_QUADRANT_4].map(String)
  );
  
  const stats = {
    healthy: 0, decayed: 0, filled: 0, endo: 0, crowns: 0, implants: 0, missing: 0,
    marked: 0, total: totalTeeth
  };

  const processedIds = new Set();
  const mergedTeethData = { ...teeth, ...pendingPaintChanges };

  // A tooth counts in EVERY category that applies to it, not just the first one
  // that matched. A root-canalled tooth that has since decayed used to show up
  // only under KANAL, which is why KARIES always read low.
  Object.entries(mergedTeethData).forEach(([toothId, tRaw]) => {
    if (!currentTeethSet.has(toothId)) return; // Only count the currently visible dentition
    const t = tRaw as ToothData;
    processedIds.add(toothId);

    const categories = categorizeTooth(t);
    if (categories.has('missing')) stats.missing++;
    if (categories.has('implants')) stats.implants++;
    if (categories.has('crowns')) stats.crowns++;
    if (categories.has('endo')) stats.endo++;
    if (categories.has('filled')) stats.filled++;
    if (categories.has('decayed')) stats.decayed++;
    if (categories.has('marked')) stats.marked++;
    if (categories.has('healthy')) stats.healthy++;
  });

  // Teeth with no record yet are healthy
  stats.healthy += (totalTeeth - processedIds.size);
  stats.healthy = Math.max(0, stats.healthy);

  // "Done" means work finished versus work still outstanding — not the fraction
  // of the mouth carrying restorations, which is what dividing by all 32 teeth
  // measured (a perfectly healthy patient read 0%).
  const completedCount = stats.filled + stats.endo + stats.crowns + stats.implants;
  const outstandingCount = stats.decayed + stats.marked;
  const completedPercent = (completedCount + outstandingCount) > 0
    ? Math.round((completedCount / (completedCount + outstandingCount)) * 100)
    : 100;

  const getConditionColor = (id?: string) => CONDITIONS.find(c => c.id === id)?.color || '#10b981';

  return (
    <div className="flex flex-col min-h-full w-full bg-gray-50 font-sans">
      <div className="flex-1 flex flex-col bg-white w-full relative">
        <div className="flex-1 flex flex-col relative">
          {/* CENTER PANEL: Odontogram */}
          <div className="flex-1 flex flex-col bg-white relative min-h-0">
              
              {/* Toolbar & Filters */}
              <div className="px-4 py-3 border-b border-gray-200 bg-white flex flex-col gap-3 z-20">
                {/* Top Row: View Options & Zoom */}
                <div className="flex flex-wrap items-center justify-between text-sm text-gray-700">
                  <div className="flex items-center gap-4 font-semibold flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider">Ko'rinish:</span>
                      <button className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-bold text-xs">3D</button>
                    </div>
                    <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider">Tishlar turi:</span>
                      <button onClick={() => setToothType("adult")} className={`px-2 py-1 rounded-md text-xs transition-colors ${toothType === "adult" ? 'bg-emerald-100 text-emerald-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}>Doimiy (32)</button>
                      <button onClick={() => setToothType("child")} className={`px-2 py-1 rounded-md text-xs transition-colors ${toothType === "child" ? 'bg-emerald-100 text-emerald-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}>Sut (20)</button>
                    </div>
                    <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider">Notatsiya:</span>
                      <button onClick={() => setNotation("FDI")} className={`px-2 py-1 rounded-md text-xs transition-colors ${notation === "FDI" ? 'bg-emerald-100 text-emerald-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}>FDI</button>
                      <button onClick={() => setNotation("Universal")} className={`px-2 py-1 rounded-md text-xs transition-colors ${notation === "Universal" ? 'bg-emerald-100 text-emerald-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}>Universal</button>
                      <button onClick={() => setNotation("Palmer")} className={`px-2 py-1 rounded-md text-xs transition-colors ${notation === "Palmer" ? 'bg-emerald-100 text-emerald-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}>Palmer</button>
                    </div>
                    {!readOnly && (
                      <>
                        <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleResetChart}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm ml-2"
                            title="Barcha belgilangan tishlarni tozalab, sog'lom holatiga qaytarish"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Barchasini tozalash (Sog'lom)
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2 lg:mt-0">
                    <div className="relative mr-2">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Tish raqami (masalan: 18)..." 
                        className="pl-7 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-52 transition-all"
                        value={toothSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setToothSearch(val);
                          if (val) {
                            const qAdult = [...QUADRANT_1, ...QUADRANT_2, ...QUADRANT_3, ...QUADRANT_4];
                            const qChild = [...PRIMARY_QUADRANT_1, ...PRIMARY_QUADRANT_2, ...PRIMARY_QUADRANT_3, ...PRIMARY_QUADRANT_4];
                            const allTeeth = toothType === "adult" ? qAdult : qChild;
                            
                            const found = allTeeth.find(id => getNotationLabel(id, notation).toLowerCase() === val.toLowerCase());
                            if (found) {
                               setSelectedTooth(found.toString());
                            } else {
                               const fdiFound = allTeeth.find(id => id.toString() === val);
                               if (fdiFound) setSelectedTooth(fdiFound.toString());
                            }
                          } else {
                            setSelectedTooth(null);
                          }
                        }}
                      />
                    </div>
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-xs font-bold text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"><ZoomIn className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    <button
                      onClick={() => setShowGrid((v) => !v)}
                      title="Chizmani ko'rsatish/yashirish"
                      className={`p-1 rounded-md transition-colors ${showGrid ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setZoom(1); setToothSearch(''); setSelectedTooth(null); }}
                      title="Ko'rinishni asliga qaytarish"
                      className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Stats & Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    {STAT_BUCKETS.map(({ key, label, value, text, border }) => {
                      const active = highlightCondition === key;
                      return (
                        <button
                          key={String(key)}
                          onClick={() => setHighlightCondition(key)}
                          className={`flex flex-col px-2.5 py-1 rounded-lg min-w-[56px] transition-all border text-left ${
                            active
                              ? `bg-white shadow-sm ring-1 ring-offset-1 ${border}`
                              : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'
                          }`}
                        >
                          <span className={`text-sm font-black leading-none ${text}`}>{value(stats)}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 leading-none">{t(label)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Progress Mini */}
                  <div className="flex items-center gap-2 sm:pl-4 sm:border-l border-gray-100">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        <path className="text-emerald-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${completedPercent}, 100`} strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-800 leading-none">{completedPercent}%</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase mt-0.5 leading-none">{t("Bajarildi")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col relative min-h-0">
                 {/* Quick Paint Palette (Horizontal) — doctor-only, hidden entirely in read-only mode */}
                 {!readOnly && (
                 <div className="w-full bg-white border-b border-gray-100 flex flex-col z-10 shrink-0">
                    <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                       <div className="w-full flex items-center justify-between mb-2">
                         <span className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 shrink-0 mr-2">
                           <Sparkles className="w-5 h-5 text-emerald-500" /> Tezkor bo'yash:
                         </span>

                         {Object.keys(pendingPaintChanges).length > 0 && (
                           <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-bold text-emerald-600">
                                {Object.keys(pendingPaintChanges).length} ta o'zgarish
                              </span>
                              <button
                                onClick={handleSavePaintChanges}
                                disabled={isSavingPaint}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-sm flex items-center gap-2 shrink-0"
                              >
                                <Save className="w-4 h-4" />
                                {isSavingPaint ? 'Saqlanmoqda...' : 'Saqlash'}
                              </button>
                              <button
                                onClick={() => setPendingPaintChanges({})}
                                className="px-4 py-2 bg-white text-red-500 hover:bg-red-50 font-bold text-xs rounded-full transition-colors border border-gray-200 shrink-0"
                              >
                                Tozalash
                              </button>
                           </div>
                         )}
                       </div>

                       {/* A compact grid rather than 24 oversized pills on a
                           flex-wrap row, which used to eat ~400px of vertical
                           space above the chart and looked untidy at every width. */}
                       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1.5 w-full">
                         {CONDITIONS.map(c => {
                           const isSelected = paintCondition === c.id;
                           return (
                             <button
                               key={c.id}
                               onClick={() => setPaintCondition(isSelected ? null : c.id)}
                               title={t(c.label)}
                               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all min-w-0
                                 ${isSelected ? 'bg-emerald-50 border border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                             >
                               <span className={`w-3 h-3 rounded-full shadow-sm shrink-0 border border-black/5 ${isSelected ? 'scale-125' : ''} transition-transform`} style={{ backgroundColor: c.color }}></span>
                               <span className="text-xs font-bold leading-tight text-left truncate">{t(c.label)}</span>
                             </button>
                           );
                         })}
                       </div>
                       {paintCondition && (
                         <button onClick={() => setPaintCondition(null)} className="mt-2 text-xs font-bold text-red-500 hover:text-white px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-500 hover:border-red-500 transition-colors self-start">
                           Bekor qilish
                         </button>
                       )}
                    </div>
                 </div>
                 )}

                 {/* Chart Canvas Area */}
                 <div
                   id="chart-canvas-container"
                   className={`flex-1 overflow-auto relative p-4 sm:p-8 select-none bg-[#F8FAFC] ${paintCondition ? '[&_*]:!cursor-crosshair' : ''}`}
                   style={showGrid ? {
                     backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
                     backgroundSize: '24px 24px',
                   } : undefined}
                 >
                    {/* transformOrigin is top-LEFT: with `top center` the scaled
                        overflow split evenly on both sides, and the left half is
                        unreachable in an LTR scroll container — so at the default
                        zoom the outer molars on that side were simply lost. */}
                    <div className="relative transition-transform duration-300 mx-auto flex flex-col items-center min-w-max pb-8" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%` }}>
                       <div className="bg-white rounded-3xl p-3 sm:p-6 flex flex-col items-center shadow-sm border border-gray-200">
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">{t("YUQORI JAG'")}</div>
                      
                      {/* Upper row: Q1 right | midline | Q2 left */}
                      <div className="flex items-end justify-center gap-1 w-full relative">
                        <div className="flex justify-end gap-1">
                          {(toothType === 'adult' ? QUADRANT_1 : PRIMARY_QUADRANT_1).map(id => (
                            <InteractiveTooth 
                              key={id} number={id} 
                              displayNumber={getNotationLabel(id, notation)}
                              data={pendingPaintChanges[id.toString()] || teeth[id.toString()]} 
                              isSelected={selectedTooth === id.toString()} 
                              onClick={() => handleToothClick(id)}
                              onDoubleClick={() => { if (readOnly) return; handleToothClick(id); setShowAddTreatment(true); }}
                              onSurfaceClick={(surface: string) => handleSurfaceClick(id, surface)}
                              onSurfaceDoubleClick={(surface: string) => handleSurfaceDoubleClick(id, surface)}
                              highlightCondition={highlightCondition}
                            />
                          ))}
                        </div>
                        
                        <div className="w-px h-full bg-gray-200 mx-3 self-stretch"></div>
                        
                        <div className="flex justify-start gap-1">
                          {(toothType === 'adult' ? QUADRANT_2 : PRIMARY_QUADRANT_2).map(id => (
                            <InteractiveTooth 
                              key={id} number={id} 
                              displayNumber={getNotationLabel(id, notation)}
                              data={pendingPaintChanges[id.toString()] || teeth[id.toString()]} 
                              isSelected={selectedTooth === id.toString()} 
                              onClick={() => handleToothClick(id)}
                              onDoubleClick={() => { if (readOnly) return; handleToothClick(id); setShowAddTreatment(true); }}
                              onSurfaceClick={(surface: string) => handleSurfaceClick(id, surface)}
                              onSurfaceDoubleClick={(surface: string) => handleSurfaceDoubleClick(id, surface)}
                              highlightCondition={highlightCondition}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Horizontal midline */}
                      <div className="w-full h-px bg-gray-200 my-3"></div>

                      {/* Lower row: Q4 right | midline | Q3 left */}
                      <div className="flex items-start justify-center gap-1 w-full relative">
                        <div className="flex justify-end gap-1">
                          {(toothType === 'adult' ? QUADRANT_4 : PRIMARY_QUADRANT_4).map(id => (
                            <InteractiveTooth 
                              key={id} number={id} 
                              displayNumber={getNotationLabel(id, notation)}
                              data={pendingPaintChanges[id.toString()] || teeth[id.toString()]} 
                              isSelected={selectedTooth === id.toString()} 
                              onClick={() => handleToothClick(id)}
                              onDoubleClick={() => { if (readOnly) return; handleToothClick(id); setShowAddTreatment(true); }}
                              onSurfaceClick={(surface: string) => handleSurfaceClick(id, surface)}
                              onSurfaceDoubleClick={(surface: string) => handleSurfaceDoubleClick(id, surface)}
                              highlightCondition={highlightCondition}
                            />
                          ))}
                        </div>
                        
                        <div className="w-px h-full bg-gray-200 mx-3 self-stretch"></div>
                        
                        <div className="flex justify-start gap-1">
                          {(toothType === 'adult' ? QUADRANT_3 : PRIMARY_QUADRANT_3).map(id => (
                            <InteractiveTooth 
                              key={id} number={id} 
                              displayNumber={getNotationLabel(id, notation)}
                              data={pendingPaintChanges[id.toString()] || teeth[id.toString()]} 
                              isSelected={selectedTooth === id.toString()} 
                              onClick={() => handleToothClick(id)}
                              onDoubleClick={() => { if (readOnly) return; handleToothClick(id); setShowAddTreatment(true); }}
                              onSurfaceClick={(surface: string) => handleSurfaceClick(id, surface)}
                              onSurfaceDoubleClick={(surface: string) => handleSurfaceDoubleClick(id, surface)}
                              highlightCondition={highlightCondition}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">{t("PASTKI JAG'")}</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
          {/* BOTTOM PANEL: Tooth Details Drawer */}
          {selectedTooth && (
            <div className="w-full flex-none bg-[#0a0f1d] border-t border-slate-800 shrink-0 z-20 shadow-2xl relative">
              <div className="flex flex-row w-full p-6 gap-6 overflow-x-auto relative items-stretch custom-scrollbar min-h-[300px]">
                <button 
                  onClick={() => setSelectedTooth(null)}
                      className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors z-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    {/* Header */}
                    <div className="flex flex-col gap-4 shrink-0 w-[200px] justify-between border-r border-slate-800 pr-6">
                      <div className="flex flex-col gap-2 mt-1">
                        <h4 className="text-4xl font-black text-white leading-tight">Tish {selectedTooth ? ((['┐','└','┘','┌'].some(s => getNotationLabel(parseInt(selectedTooth), notation).includes(s))) ? '' : '#') + getNotationLabel(parseInt(selectedTooth), notation) : ''}</h4>
                        {selectedSurface && (
                          <span className="px-3 py-1.5 w-fit bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-sm font-bold uppercase tracking-wider mt-1">
                            Yuza: {selectedSurface}
                          </span>
                        )}
                      </div>
                      {!readOnly && (
                        <button onClick={() => { setEditToothData(currentToothData || {}); setShowEditTooth(true); }} className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-sm font-bold transition-colors">
                          <Edit className="w-4 h-4" /> Tahrirlash
                        </button>
                      )}
                    </div>

                    {/* Info Breakdown */}
                    <div className="flex flex-col gap-4 shrink-0 w-[280px] border-r border-slate-800 pr-6 overflow-y-auto custom-scrollbar">
                      <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">Umumiy holat</span>
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" /> {currentToothData?.history?.length ? "To'langan" : "Yo'q"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {((currentToothData?.conditions?.length ? currentToothData.conditions : (currentToothData?.condition ? [currentToothData.condition] : ['Healthy']))).map((cond: string, idx: number) => (
                            <div key={idx} onClick={() => handleToothClick(parseInt(selectedTooth))} className="relative group flex items-center gap-2 px-3 py-1.5 bg-[#0a0f1d] rounded-lg border border-slate-700 cursor-pointer hover:border-slate-500 transition-all overflow-hidden">
                              <span className="w-2.5 h-2.5 rounded-full shadow-sm z-10" style={{ backgroundColor: getConditionColor(cond) }}></span>
                              <span className="text-sm font-bold text-white z-10">{CONDITIONS.find(c => c.id === cond)?.label || "Sog'lom"}</span>
                              {paintCondition && (
                                <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                                  <span className="text-xs font-bold text-emerald-400 mix-blend-plus-lighter">Qo'llash</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {(currentToothData?.material || currentToothData?.mobility || currentToothData?.rootCanals !== undefined || currentToothData?.bleeding || currentToothData?.suppuration || currentToothData?.notes) && (
                        <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                           {currentToothData.material && (
                             <div className="flex items-center justify-between">
                               <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Material:</span>
                               <span className="text-sm text-white font-medium">{currentToothData.material}</span>
                             </div>
                           )}
                           {currentToothData.mobility && (
                             <div className="flex items-center justify-between">
                               <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Qimirlashi:</span>
                               <span className="text-sm text-white font-medium">{currentToothData.mobility}</span>
                             </div>
                           )}
                           {currentToothData.rootCanals !== undefined && (
                             <div className="flex items-center justify-between">
                               <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Ildiz kanallari:</span>
                               <span className="text-sm text-white font-medium">{currentToothData.rootCanals}</span>
                             </div>
                           )}
                           {currentToothData.bleeding && (
                             <div className="flex items-center justify-between">
                               <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Qonash:</span>
                               <span className="text-sm text-rose-400 font-bold">Bor</span>
                             </div>
                           )}
                           {currentToothData.suppuration && (
                             <div className="flex items-center justify-between">
                               <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Yiringlash:</span>
                               <span className="text-sm text-amber-400 font-bold">Bor</span>
                             </div>
                           )}
                           {currentToothData.notes && (
                             <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-white/5">
                               <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Izoh:</span>
                               <span className="text-xs text-slate-300 italic">{currentToothData.notes}</span>
                             </div>
                           )}
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                         <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">Yuzalar</span>
                         <div className="grid grid-cols-1 gap-2">
                           {['O', 'M', 'D', 'B', 'L'].map((surf) => {
                             const cond = currentToothData?.surfaces?.[surf] || 'Healthy';
                             const label = CONDITIONS.find(c => c.id === cond)?.label || "Sog'lom";
                             return (
                               <div key={surf} onClick={() => handleSurfaceClick(parseInt(selectedTooth), surf)} className={`relative group flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer hover:border-slate-400 transition-all overflow-hidden ${selectedSurface === surf ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                                  <span className="text-xs font-bold text-slate-400 uppercase z-10 w-16">Yuza {surf}</span>
                                  <div className="flex items-center justify-end gap-2 z-10 flex-1 truncate">
                                    <span className="text-xs font-bold text-white truncate" title={label}>{label}</span>
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getConditionColor(cond as string) }}></span>
                                  </div>
                                  {paintCondition && (
                                    <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                                      <span className="text-xs font-bold text-emerald-400 mix-blend-plus-lighter">Qo'llash</span>
                                    </div>
                                  )}
                               </div>
                             );
                           })}
                         </div>
                      </div>
                    </div>

                    {/* Stats & Actions Grid */}
                    <div className="flex flex-col gap-4 shrink-0 w-[300px] border-r border-slate-800 pr-6 justify-between">
                       <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                         <div className="flex flex-col gap-1">
                           <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">ICD-10</span>
                           <span className="font-medium text-white text-sm leading-tight truncate" title={getICD10(currentToothData?.conditions?.[0] || currentToothData?.condition || 'Healthy')}>{getICD10(currentToothData?.conditions?.[0] || currentToothData?.condition || 'Healthy')}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Shifokor</span>
                           <span className="font-medium text-white text-sm truncate leading-tight" title={currentToothData?.history?.[0]?.dentist || doctorName || 'Biriktirilmagan'}>{currentToothData?.history?.[0]?.dentist || doctorName || 'Biriktirilmagan'}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Oxirgi tashrif</span>
                           <span className="font-medium text-white text-sm leading-tight">{currentToothData?.history?.[0]?.date ? new Date(currentToothData.history[0].date).toLocaleDateString('ru-RU') : 'Kiritilmagan'}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Davolash narxi</span>
                           <span className="font-bold text-emerald-400 text-sm leading-tight">{currentToothData?.history?.reduce((acc, h) => acc + h.cost, 0).toLocaleString() || 0} UZS</span>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-3 mt-auto">
                         {!readOnly && (
                           <button onClick={() => setShowAddTreatment(true)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all group">
                             <Plus className="w-5 h-5 text-emerald-400" />
                             <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Muolaja</span>
                           </button>
                         )}
                         <button onClick={() => setShowXRay(true)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all group">
                           <ImageIcon className="w-5 h-5 text-blue-400" />
                           <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Rentgen</span>
                         </button>
                       </div>
                    </div>

                    {/* AI Diagnostika (Compact) */}
                    <div className="flex flex-col gap-3 shrink-0 w-[280px] border-r border-slate-800 pr-6">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-indigo-400">
                           <Brain className="w-5 h-5" />
                           <span className="text-sm font-black uppercase tracking-wider">AI Diagnostika</span>
                         </div>
                         {!aiResult && !isAnalyzing && (
                           <button onClick={runAiAnalysis} className="text-xs bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-3 py-1.5 rounded-md font-bold transition-all border border-indigo-500/30">
                             Tahlil
                           </button>
                         )}
                       </div>
                       
                       {isAnalyzing ? (
                         <div className="flex flex-col items-center justify-center h-full gap-3 mt-2">
                           <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                           <span className="text-sm font-bold text-indigo-400 animate-pulse">Tahlil qilinmoqda...</span>
                         </div>
                       ) : aiResult ? (
                         <div className="flex flex-col gap-2 mt-2 h-full overflow-y-auto custom-scrollbar text-sm pb-2">
                            <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                              aiResult.riskLevel === 'Yuqori' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 
                              aiResult.riskLevel === "O'rta" ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 
                              'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            }`}>
                              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-xs uppercase opacity-75">Xavf darajasi: {aiResult.riskLevel}</span>
                                <span className="leading-tight">{CONDITIONS.find(c => c.id === aiResult.findings[0]?.condition)?.label || "Sog'lom"}</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 bg-blue-500/10 text-blue-300 p-3 rounded-lg border border-blue-500/20">
                              <Stethoscope className="w-5 h-5 shrink-0 mt-0.5" />
                              <span className="leading-tight">{aiResult.recommendations}</span>
                            </div>
                         </div>
                       ) : (
                         <div className="flex items-center justify-center h-full text-sm text-slate-500 text-center italic mt-2 leading-relaxed bg-white/5 rounded-xl border border-white/5 p-4">
                           Sun'iy intellekt orqali tashxis qo'yish uchun tahlilni boshlang
                         </div>
                       )}
                    </div>

                    {/* History Timeline */}
                    <div className="flex flex-col gap-3 min-w-[280px] flex-1 overflow-y-auto custom-scrollbar pr-2 h-full">
                      <div className="flex items-center justify-between px-1 sticky top-0 bg-[#0a0f1d] pb-2 z-10">
                        <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                          Davolash tarixi
                        </h5>
                        <span className="text-xs text-slate-500 font-bold bg-white/5 px-2 py-1 rounded-full">{currentToothData?.history?.length || 0} ta yozuv</span>
                      </div>
                      
                      {currentToothData?.history && currentToothData.history.length > 0 ? (
                        <div className="relative border-l-2 border-slate-800 ml-2 space-y-4 mt-1">
                          {currentToothData.history.map((h, i) => (
                            <div key={h.id || i} className="relative pl-5">
                              <div className="absolute -left-[6px] top-2.5 w-2.5 h-2.5 rounded-full bg-[#111827] ring-2 ring-[#0a0f1d] border border-slate-600" style={{ backgroundColor: getConditionColor(h.condition || 'Healthy') }}></div>
                              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-2 group hover:border-white/10 transition-colors">
                                 <div className="flex justify-between items-center">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-sm font-black text-white leading-tight">{h.treatment}</span>
                                      <span className="text-xs font-bold text-slate-500 uppercase">{CONDITIONS.find(c => c.id === h.condition)?.label}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
                                       {new Date(h.date).toLocaleDateString('ru-RU')}
                                    </div>
                                 </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-1.5 mt-4">
                          <History className="w-6 h-6 text-slate-700 opacity-50" />
                          <span className="text-xs italic opacity-50">Tarix mavjud emas</span>
                        </div>
                      )}
                    </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Treatment Dialog */}
      {showAddTreatment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0a0f1d] rounded-[32px] border border-slate-700 shadow-2xl w-full max-w-2xl p-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full"></div>
            <div className="bg-[#111827] rounded-[24px] p-8 relative z-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-2xl font-black text-white">Yangi Muolaja</h3>
                  <p className="text-sm text-emerald-400 font-bold mt-1">
                    Tish {selectedTooth ? ((['┐','└','┘','┌'].some(s => getNotationLabel(parseInt(selectedTooth), notation).includes(s))) ? '' : '#') + getNotationLabel(parseInt(selectedTooth), notation) : ''} {selectedSurface ? `— ${selectedSurface} yuzasi` : ''}
                  </p>
                </div>
                <button onClick={() => setShowAddTreatment(false)} className="text-slate-500 hover:text-white bg-[#0a0f1d] hover:bg-rose-500/20 p-3 rounded-xl transition-colors border border-slate-800">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-[#0a0f1d] p-5 rounded-2xl border border-emerald-500/20">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 rounded-md border-slate-700 bg-[#111827] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#0a0f1d]"
                      checked={newTreatment.surfaceOnly}
                      onChange={e => setNewTreatment({...newTreatment, surfaceOnly: e.target.checked})}
                      disabled={!selectedSurface}
                    />
                    <div>
                      <div className="text-sm font-black text-white">Faqat tanlangan yuza uchun</div>
                      <div className="text-xs text-slate-400 font-medium mt-1">Muolaja faqatgina tanlangan yuzaga ({selectedSurface || 'tanlanmagan'}) ta'sir qiladi.</div>
                    </div>
                  </label>
                </div>

                <div className="mt-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Muolaja Katalogi (Xizmatni tanlang)</label>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">Standart Katalog</span>
                  </div>
                  <div className="bg-[#0d1428] border border-[#1e2f50] rounded-2xl p-4 shadow-inner">
                    <div className="relative mb-4">
                      <input
                        type="text"
                        placeholder="Katalogdan qidirish..."
                        value={catalogSearchQuery}
                        onChange={(e) => setCatalogSearchQuery(e.target.value)}
                        className="w-full bg-[#111a33] border border-[#263b65] text-xs font-bold text-slate-100 rounded-xl pl-9 pr-3.5 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-500"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>

                    {!catalogSearchQuery && (
                      <div className="flex flex-wrap gap-1.5 pb-3 border-b border-[#172545] mb-3">
                        {STANDARD_SERVICES_CATALOG.map((cat, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedCatalogCategory(idx)}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                              selectedCatalogCategory === idx
                                ? 'bg-emerald-500 border-emerald-500 text-slate-900 shadow-md shadow-emerald-500/20'
                                : 'bg-[#111a33] border-[#1e2f50] hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400'
                            }`}
                          >
                            {cat.categoryNameUz}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                      {(() => {
                        const results: { name: string; price: number; category: string }[] = [];
                        STANDARD_SERVICES_CATALOG.forEach(cat => {
                          cat.items.forEach(itm => {
                            const matchesSearch = !catalogSearchQuery || itm.name.toLowerCase().includes(catalogSearchQuery.toLowerCase());
                            const matchesCategory = catalogSearchQuery || STANDARD_SERVICES_CATALOG.indexOf(cat) === selectedCatalogCategory;
                            if (matchesSearch && matchesCategory) {
                              results.push({ ...itm, category: cat.categoryNameUz });
                            }
                          });
                        });

                        if (results.length === 0) {
                          return <div className="col-span-full py-6 text-center text-xs font-bold text-slate-500">Katalogda xizmat topilmadi</div>;
                        }

                        return results.map((item, idX) => (
                          <button
                            key={idX}
                            type="button"
                            onClick={() => setNewTreatment({...newTreatment, treatment: item.name, cost: item.price})}
                            className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                              newTreatment.treatment === item.name
                                ? 'bg-[#152445] border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                : 'bg-[#101830] border-[#1b2a4e] hover:border-emerald-500/50'
                            }`}
                          >
                            <span className="text-[9px] font-mono font-black text-emerald-500/70 uppercase tracking-widest block">{item.category}</span>
                            <span className="text-xs font-bold text-slate-100 leading-snug">{item.name}</span>
                            <span className="text-[10px] font-black text-emerald-400 mt-1">{item.price.toLocaleString()} so'm</span>
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Holat / Tashxis</label>
                    <select 
                      value={newTreatment.condition}
                      onChange={e => setNewTreatment({...newTreatment, condition: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner appearance-none"
                    >
                      {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Muolaja nomi (Maxsus)</label>
                    <input 
                      type="text" 
                      placeholder="Masalan: Maxsus davolash"
                      value={newTreatment.treatment}
                      onChange={e => setNewTreatment({...newTreatment, treatment: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Material</label>
                    <input 
                      type="text" 
                      placeholder="Filtek Ultimate"
                      value={newTreatment.material}
                      onChange={e => setNewTreatment({...newTreatment, material: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Tish Rangi (Shade)</label>
                    <input 
                      type="text" 
                      placeholder="A2, A3..."
                      value={newTreatment.shade}
                      onChange={e => setNewTreatment({...newTreatment, shade: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Davomiyligi (Daqiqa)</label>
                    <input 
                      type="number" 
                      value={newTreatment.duration}
                      onChange={e => setNewTreatment({...newTreatment, duration: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Sana</label>
                    <input 
                      type="date" 
                      value={newTreatment.date}
                      onChange={e => setNewTreatment({...newTreatment, date: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Narxi (UZS)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={newTreatment.cost || ''}
                        onChange={e => setNewTreatment({...newTreatment, cost: Number(e.target.value)})}
                        className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Chegirma (%)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newTreatment.discount || ''}
                      onChange={e => setNewTreatment({...newTreatment, discount: Number(e.target.value)})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Shifokor</label>
                    <input 
                      type="text" 
                      defaultValue={doctorName || 'Dr. Shifokor'}
                      readOnly
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-400 outline-none shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Assistent</label>
                    <input 
                      type="text" 
                      placeholder="Assistent ismi"
                      value={newTreatment.assistant}
                      onChange={e => setNewTreatment({...newTreatment, assistant: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Klinik Eslatma</label>
                  <textarea 
                    rows={4}
                    placeholder="Batafsil ma'lumotlar..."
                    value={newTreatment.notes}
                    onChange={e => setNewTreatment({...newTreatment, notes: e.target.value})}
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner resize-none custom-scrollbar"
                  ></textarea>
                </div>

                <div className="pt-6 flex gap-4 border-t border-slate-800">
                  <button 
                    onClick={() => setShowAddTreatment(false)}
                    className="flex-1 py-4 bg-[#0a0f1d] border border-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    onClick={handleSaveTreatment}
                    disabled={!newTreatment.treatment}
                    className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 text-lg"
                  >
                    <CheckCircle2 className="w-6 h-6" /> Saqlash va Tasdiqlash
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tooth Details Dialog */}
      {showEditTooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0a0f1d] rounded-[32px] border border-slate-700 shadow-2xl w-full max-w-xl p-2 relative overflow-hidden">
            <div className="bg-[#111827] rounded-[24px] p-8 relative z-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-2xl font-black text-white">Tishni Tahrirlash</h3>
                  <p className="text-sm text-emerald-400 font-bold mt-1">
                    Tish {selectedTooth ? ((['┐','└','┘','┌'].some(s => getNotationLabel(parseInt(selectedTooth), notation).includes(s))) ? '' : '#') + getNotationLabel(parseInt(selectedTooth), notation) : ''}
                  </p>
                </div>
                <button onClick={() => setShowEditTooth(false)} className="text-slate-500 hover:text-white bg-[#0a0f1d] hover:bg-rose-500/20 p-3 rounded-xl transition-colors border border-slate-800">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Holat</label>
                    <select 
                      value={editToothData.condition || 'Healthy'}
                      onChange={e => setEditToothData({...editToothData, condition: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner appearance-none"
                    >
                      {CONDITIONS.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Material</label>
                    <input 
                      type="text" 
                      placeholder="Plomba materiali..."
                      value={editToothData.material || ''}
                      onChange={e => setEditToothData({...editToothData, material: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Qimirlashi (Mobility)</label>
                    <select 
                      value={editToothData.mobility || ''}
                      onChange={e => setEditToothData({...editToothData, mobility: e.target.value})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner appearance-none"
                    >
                      <option value="">Yo'q</option>
                      <option value="I daraja">I daraja</option>
                      <option value="II daraja">II daraja</option>
                      <option value="III daraja">III daraja</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Ildiz kanallari</label>
                    <input 
                      type="number" 
                      min="0"
                      max="4"
                      placeholder="Kanallar soni"
                      value={editToothData.rootCanals || ''}
                      onChange={e => setEditToothData({...editToothData, rootCanals: parseInt(e.target.value) || undefined})}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                  </div>
                  <div className="flex flex-col gap-3 justify-end pb-2">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5">
                          <input type="checkbox" className="peer sr-only" checked={editToothData.bleeding || false} onChange={e => setEditToothData({...editToothData, bleeding: e.target.checked})} />
                          <div className="w-5 h-5 border-2 border-slate-600 rounded bg-[#0a0f1d] peer-checked:bg-rose-500 peer-checked:border-rose-500 transition-colors"></div>
                          <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Qonash (Bleeding)</span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5">
                          <input type="checkbox" className="peer sr-only" checked={editToothData.suppuration || false} onChange={e => setEditToothData({...editToothData, suppuration: e.target.checked})} />
                          <div className="w-5 h-5 border-2 border-slate-600 rounded bg-[#0a0f1d] peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors"></div>
                          <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Yiringlash (Suppuration)</span>
                     </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Qo'shimcha izoh</label>
                  <textarea 
                    rows={4}
                    placeholder="Batafsil ma'lumotlar..."
                    value={editToothData.notes || ''}
                    onChange={e => setEditToothData({...editToothData, notes: e.target.value})}
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner resize-none custom-scrollbar"
                  ></textarea>
                </div>

                <div className="pt-6 flex gap-4 border-t border-slate-800">
                  <button 
                    onClick={() => setShowEditTooth(false)}
                    className="flex-1 py-4 bg-[#0a0f1d] border border-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    onClick={handleSaveEditTooth}
                    className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 text-lg"
                  >
                    <CheckCircle2 className="w-6 h-6" /> Saqlash
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* X-Ray Placeholder Dialog */}
      {showXRay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0a0f1d] rounded-[32px] border border-slate-700 shadow-2xl w-full max-w-4xl p-2 relative overflow-hidden">
             <div className="bg-[#111827] rounded-[24px] p-8 relative z-10 flex flex-col h-[80vh]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-2xl font-black text-white">Rentgen Tasvirlari</h3>
                    <p className="text-sm text-emerald-400 font-bold mt-1">
                      Tish {selectedTooth ? ((['┐','└','┘','┌'].some(s => getNotationLabel(parseInt(selectedTooth), notation).includes(s))) ? '' : '#') + getNotationLabel(parseInt(selectedTooth), notation) : ''}
                    </p>
                  </div>
                  <button onClick={() => setShowXRay(false)} className="text-slate-500 hover:text-white bg-[#0a0f1d] hover:bg-rose-500/20 p-3 rounded-xl transition-colors border border-slate-800">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-4">
                   <ImageIcon className="w-16 h-16 text-slate-700 opacity-50" />
                   <p className="text-slate-500 font-medium text-lg">Bu tish uchun rentgen tasvirlari yuklanmagan.</p>
                   {!readOnly && (
                     <label className="px-6 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl font-bold border border-blue-500/20 transition-all flex items-center gap-2 mt-4 cursor-pointer">
                       <Plus className="w-5 h-5" /> Tasvir yuklash
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                         if (e.target.files && e.target.files.length > 0) {
                           alert("Rentgen tasviri muvaffaqiyatli yuklandi (Simulyatsiya)");
                         }
                       }} />
                     </label>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
