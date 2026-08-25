import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../services/firebase';
import { useHistoryLayer } from '../hooks/useHistoryLayer';
import { compressImage } from '../utils/imageCompressor';
import {
  PhasePicker, ToothPicker, ImageDropzone, describeUploadError,
  TREATMENT_PHASES, PHASE_ORDER, type TreatmentPhase,
} from './ImagingControls';
import { exportXrayReportPdf } from '../utils/pdfExport';
import type { ToothData } from './DentalChart';
import {
  Upload, Search, ZoomIn, ZoomOut, RotateCw,
  Brain, FileText, SplitSquareHorizontal,
  Image as ImageIcon, ChevronLeft, X, Check, Ban
} from 'lucide-react';
import { Language } from '../translations';
import { createTranslator, Dict } from '../utils/translate';

const XRAY_TRANSLATIONS: Dict = {
  "yuklanmoqda...": { ru: "Загружается...", en: "Uploading...", kk: "Жүктелуде...", ky: "Жүктөлүүдө...", tg: "Боргирӣ мешавад...", tk: "Ýüklenýär..." },

  "rentgenlar galereyasi": { ru: "Галерея рентгенов", en: "X-ray gallery", kk: "Рентгендер галереясы", ky: "Рентгендер галереясы", tg: "Галереяи рентгенҳо", tk: "Rentgen galereýasy" },
  "yuklash": { ru: "Загрузить", en: "Upload", kk: "Жүктеу", ky: "Жүктөө", tg: "Боргирӣ", tk: "Ýüklemek" },

  "bemorning barcha rentgen va tomografiya tasvirlari": { ru: "Все рентген- и томографические снимки пациента", en: "All X-ray and tomography images of the patient", kk: "Пациенттің барлық рентген және томография суреттері", ky: "Бейтаптын бардык рентген жана томография сүрөттөрү", tg: "Ҳамаи тасвирҳои рентгенӣ ва томографии бемор", tk: "Näsagyň ähli rentgen we tomografiýa suratlary" },
  "hozircha rentgen tasvirlari mavjud emas": { ru: "Рентген-снимков пока нет", en: "No X-ray images yet", kk: "Әзірге рентген суреттері жоқ", ky: "Азырынча рентген сүрөттөрү жок", tg: "То ҳол тасвирҳои рентгенӣ мавҷуд нестанд", tk: "Häzirlikçe rentgen suratlary ýok" },
  "bepul sinov muddati tugagan. davom etish uchun klinika premium obunaga o'tishi kerak.": { ru: "Бесплатный пробный период закончился. Для продолжения клинике нужно перейти на Premium-подписку.", en: "The free trial has ended. To continue, the clinic must upgrade to a Premium subscription.", kk: "Тегін сынақ мерзімі аяқталды. Жалғастыру үшін клиника Premium жазылымға өтуі керек.", ky: "Акысыз сыноо мөөнөтү бүттү. Улантуу үчүн клиника Premium жазылууга өтүшү керек.", tg: "Мӯҳлати санҷиши ройгон ба охир расид. Барои идома клиника бояд ба обунаи Premium гузарад.", tk: "Mugt synag möhleti gutardy. Dowam etmek üçin klinika Premium abuna geçmeli." },
  "ai xulosasi": { ru: "Заключение AI", en: "AI conclusion", kk: "AI қорытындысы", ky: "AI корутундусу", tg: "Хулосаи AI", tk: "AI netijesi" },
  "ishonch darajasi": { ru: "Уровень уверенности", en: "Confidence level", kk: "Сенімділік деңгейі", ky: "Ишеним деңгээли", tg: "Дараҷаи боварӣ", tk: "Ynam derejesi" },
  "aniq topilma yo'q.": { ru: "Явных находок нет.", en: "No definite findings.", kk: "Нақты табылған нәрсе жоқ.", ky: "Так табылган нерсе жок.", tg: "Ёфтаи аниқ нест.", tk: "Anyk tapyndy ýok." },
  "tish:": { ru: "Зуб:", en: "Tooth:", kk: "Тіс:", ky: "Тиш:", tg: "Дандон:", tk: "Diş:" },
  "taqqoslash rejimi": { ru: "Режим сравнения", en: "Comparison mode", kk: "Салыстыру режимі", ky: "Салыштыруу режими", tg: "Реҷаи муқоиса", tk: "Deňeşdirme tertibi" },
  "yangi rentgen yuklash": { ru: "Загрузить новый рентген", en: "Upload new X-ray", kk: "Жаңа рентген жүктеу", ky: "Жаңы рентген жүктөө", tg: "Боргирии рентгени нав", tk: "Täze rentgen ýükle" },
  "tasvir turi": { ru: "Тип снимка", en: "Image type", kk: "Сурет түрі", ky: "Сүрөт түрү", tg: "Навъи тасвир", tk: "Surat görnüşi" },
  "panoramali (opg)": { ru: "Панорамный (OPG)", en: "Panoramic (OPG)", kk: "Панорамалық (OPG)", ky: "Панорамалык (OPG)", tg: "Панорамӣ (OPG)", tk: "Panorama (OPG)" },
  "vizual (rvg)": { ru: "Визиографический (RVG)", en: "Visiograph (RVG)", kk: "Визуалды (RVG)", ky: "Визуалдык (RVG)", tg: "Визуалӣ (RVG)", tk: "Wizual (RVG)" },
  "tomografiya (cbct)": { ru: "Томография (CBCT)", en: "Tomography (CBCT)", kk: "Томография (CBCT)", ky: "Томография (CBCT)", tg: "Томография (CBCT)", tk: "Tomografiýa (CBCT)" },
  "boshqa": { ru: "Другое", en: "Other", kk: "Басқа", ky: "Башка", tg: "Дигар", tk: "Beýleki" },
  "bosqich": { ru: "Этап", en: "Stage", kk: "Кезең", ky: "Этап", tg: "Марҳила", tk: "Tapgyr" },
  "oldin (muolajadan oldin)": { ru: "До (до процедуры)", en: "Before (pre-treatment)", kk: "Дейін (процедураға дейін)", ky: "Мурун (процедурадан мурун)", tg: "Пеш (пеш аз муолиҷа)", tk: "Öň (proseduradan öň)" },
  "jarayon (davolash jarayoni)": { ru: "Процесс (в ходе лечения)", en: "During (treatment in progress)", kk: "Үрдіс (емдеу барысында)", ky: "Процесс (дарылоо учурунда)", tg: "Ҷараён (дар ҷараёни табобат)", tk: "Prosess (bejergi dowamynda)" },
  "keyin (muolajadan keyin)": { ru: "После (после процедуры)", en: "After (post-treatment)", kk: "Кейін (процедурадан кейін)", ky: "Кийин (процедурадан кийин)", tg: "Пас (пас аз муолиҷа)", tk: "Soň (proseduradan soň)" },
};



export interface XRay {
  id: string;
  patientId: string;
  type: 'OPG' | 'RVG' | 'CBCT' | 'Other';
  stage?: TreatmentPhase;
  date: string;
  url: string;
  status: 'Pending' | 'Analyzed' | 'Approved';
  notes: string;
  // FDI numbers this image covers. Absent on records from before the field
  // existed; a panoramic legitimately covers many teeth, hence an array.
  teeth?: string[];
}

export interface AIFinding {
  id: string;
  description: string;
  confidence: number;
  toothNumber?: string;
}

export interface AIAnalysis {
  id: string;
  findings: AIFinding[];
  overallConfidence: number;
}

export default function XRayCenter({ patientId, clinicId, patientName, doctorName, language }: { patientId: string; clinicId?: string; patientName?: string; doctorName?: string; language?: Language }) {
  const t = createTranslator(language, XRAY_TRANSLATIONS);
  const [xrays, setXrays] = useState<XRay[]>([]);
  const [activeView, setActiveView] = useState<'gallery' | 'viewer' | 'compare'>('gallery');
  const [selectedXRay, setSelectedXRay] = useState<XRay | null>(null);
  const [compareXRay, setCompareXRay] = useState<XRay | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [requiresPremium, setRequiresPremium] = useState(false);
  
  // Viewer state
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<XRay['type']>('OPG');
  const [uploadStage, setUploadStage] = useState<TreatmentPhase>('Oldin');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadTeeth, setUploadTeeth] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Back/Escape close the upload dialog and step out of the viewer, instead
  // of leaving the app from three levels deep.
  useHistoryLayer(showUpload, () => setShowUpload(false), 'xray-upload');
  useHistoryLayer(activeView !== 'gallery', () => setActiveView('gallery'), 'xray-view');
  
  useEffect(() => {
    if (!patientId) return;
    const unsub = onSnapshot(
      collection(db, `patients/${patientId}/xrays`),
      (snapshot) => {
        const data: XRay[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as XRay);
        });
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setXrays(data);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `patients/${patientId}/xrays`)
    );
    return () => unsub();
  }, [patientId]);

  const loadAnalysis = async (xrayId: string) => {
    const xray = xrays.find(x => x.id === xrayId);
    if (!xray) return;
    setIsAnalyzing(true);
    setRequiresPremium(false);
    try {
      const [header, base64Data] = xray.url.split(',');
      const mimeMatch = header.match(/data:(.*);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const response = await fetch('/api/ai/xray-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: { data: base64Data || xray.url, mimeType },
          xrayType: xray.type,
          language: language || 'uz',
          clinicId,
        }),
      });
      const data = await response.json();
      if (data.requiresPremium) {
        setRequiresPremium(true);
        setAnalysis(null);
        return;
      }
      setAnalysis({
        id: xrayId,
        overallConfidence: data.overallConfidence ?? 0,
        findings: (data.findings || []).map((f: any, i: number) => ({
          id: String(i + 1),
          description: f.description,
          confidence: f.confidence,
          toothNumber: f.toothNumber || undefined,
        })),
      });
      if (xray.status === 'Pending') {
        setDoc(doc(db, `patients/${patientId}/xrays`, xrayId), { status: 'Analyzed' }, { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `patients/${patientId}/xrays`)
        );
      }
    } catch (err) {
      console.error('X-ray AI analysis failed', err);
      setAnalysis({ id: xrayId, overallConfidence: 0, findings: [] });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isSavingFinding, setIsSavingFinding] = useState<string | null>(null);

  const handleAddFindingToChart = async (finding: AIFinding) => {
    if (!finding.toothNumber) return;
    setIsSavingFinding(finding.id);
    try {
      const toothRef = doc(db, `patients/${patientId}/dentalChart`, finding.toothNumber);
      const existingSnap = await getDoc(toothRef);
      const existing = existingSnap.exists() ? (existingSnap.data() as ToothData) : {
        id: finding.toothNumber,
        condition: 'Healthy',
        conditions: ['Healthy'],
        surfaces: {},
        notes: '',
        history: [],
      };
      const updatedTooth: ToothData = {
        ...existing,
        history: [
          {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            treatment: `AI topilma: ${finding.description}`,
            condition: existing.condition,
            cost: 0,
            dentist: doctorName || 'Shifokor',
            notes: `AI ishonch darajasi: ${finding.confidence}%`,
          },
          ...(existing.history || []),
        ],
      };
      await setDoc(toothRef, updatedTooth);
      alert(`Topilma ${finding.toothNumber}-tish kartasiga qo'shildi.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/dentalChart`);
    } finally {
      setIsSavingFinding(null);
    }
  };

  const handleAddFindingToPlan = async (finding: AIFinding) => {
    if (!finding.toothNumber) return;
    setIsSavingFinding(finding.id);
    try {
      const planId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
      const planItem = {
        id: planId,
        toothId: finding.toothNumber,
        treatment: finding.description,
        price: 0,
        status: 'Planned',
        doctorName: doctorName || 'Shifokor',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, `patients/${patientId}/treatmentPlans`, planId), planItem);
      alert("Davolash rejasiga qo'shildi.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/treatmentPlans`);
    } finally {
      setIsSavingFinding(null);
    }
  };

  const handleApproveAnalysis = async () => {
    if (!selectedXRay) return;
    try {
      await setDoc(doc(db, `patients/${patientId}/xrays`, selectedXRay.id), { status: 'Approved' }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/xrays`);
    }
  };

  const handleRejectAnalysis = async () => {
    if (!selectedXRay) return;
    try {
      await setDoc(doc(db, `patients/${patientId}/xrays`, selectedXRay.id), { status: 'Pending' }, { merge: true });
      setAnalysis(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/xrays`);
    }
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const compressed = await compressImage(file, 1024);
      setPreviewUrl(compressed);
    } catch (err) {
      // Surfaced in the dialog instead of an alert() the doctor has to dismiss
      // before they can see the form again.
      setUploadError(describeUploadError(err, t));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!previewUrl) {
      setUploadError(t("Iltimos, avval rasm tanlang."));
      return;
    }
    // Date.now() alone collides when two uploads land in the same millisecond.
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newXRay: XRay = {
      id,
      patientId,
      type: uploadType,
      stage: uploadStage,
      date: new Date().toISOString(),
      url: previewUrl,
      status: 'Pending',
      notes: uploadNotes,
      teeth: uploadTeeth,
    };
    try {
      setIsUploading(true);
      setUploadError(null);
      await setDoc(doc(db, `patients/${patientId}/xrays`, id), newXRay);
      setShowUpload(false);
      setPreviewUrl(null);
      setUploadNotes('');
      setUploadTeeth([]);
    } catch (error) {
      // handleFirestoreError only logs, so without this the dialog just sat
      // there looking like nothing had happened.
      setUploadError(describeUploadError(error, t));
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/xrays`);
    } finally {
      setIsUploading(false);
    }
  };

  const openViewer = (xray: XRay) => {
    setSelectedXRay(xray);
    setActiveView('viewer');
    setZoom(100);
    setRotation(0);
    setAnalysis(null);
  };

  const startCompare = () => {
    const others = xrays.filter(x => x.id !== selectedXRay?.id);
    if (others.length > 0) {
      setCompareXRay(others[0]);
      setActiveView('compare');
    }
  };

  // The search box existed but was never wired to anything.
  const filteredXRays = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return xrays;
    return xrays.filter(x =>
      (x.notes || '').toLowerCase().includes(q) ||
      (x.type || '').toLowerCase().includes(q) ||
      (x.teeth || []).some(n => n.includes(q)) ||
      new Date(x.date).toLocaleDateString().includes(q)
    );
  }, [xrays, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-[#020712] rounded-3xl p-3 sm:p-6 text-slate-300 font-sans border border-slate-800">
      {activeView === 'gallery' && (
        <div className="flex flex-col h-full">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" /> {t("Rentgenlar galereyasi")}
              </h3>
              <p className="text-sm text-slate-500">{t("Bemorning barcha rentgen va tomografiya tasvirlari")}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Qidirish...")}
                  className="w-full md:w-48 pl-9 pr-4 py-2 bg-[#0a0f1d] border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Upload className="w-4 h-4" /> {t("Yuklash")}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {PHASE_ORDER.map(stageGroup => {
              const phase = TREATMENT_PHASES.find(p => p.id === stageGroup)!;
              const stageXRays = filteredXRays.filter(x => (x.stage || "Boshqa") === stageGroup);
              if (stageXRays.length === 0) return null;

              return (
                <div key={stageGroup} className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${phase.color}`} />
                    {t(phase.label)}
                    <span className="text-slate-600 normal-case font-medium">({stageXRays.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {stageXRays.map(xray => (
                      <div key={xray.id} className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={() => openViewer(xray)}>
                        <div className="h-48 bg-slate-900 relative overflow-hidden">
                          <img src={xray.url} alt="X-Ray" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <span className="bg-[#020712]/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700">
                              {xray.type}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0">
                              <p className="text-white font-bold text-sm">{new Date(xray.date).toLocaleDateString()}</p>
                              <p className="text-xs text-slate-500">{new Date(xray.date).toLocaleTimeString()}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${xray.status === "Approved" ? "bg-emerald-500" : xray.status === "Analyzed" ? "bg-indigo-500" : "bg-amber-500"}`}></div>
                          </div>
                          {!!xray.teeth?.length && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {xray.teeth.map(n => (
                                <span key={n} className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold">{n}</span>
                              ))}
                            </div>
                          )}
                          {!!xray.notes && (
                            <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{xray.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredXRays.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                <ImageIcon className="w-12 h-12 mb-4 text-slate-700" />
                <p>{searchTerm ? t("Hech narsa topilmadi") : t("Hozircha rentgen tasvirlari mavjud emas")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === "viewer" && selectedXRay && (
        <div className="flex flex-col h-full">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">
            <button onClick={() => setActiveView("gallery")} className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" /> {t("Ortga qaytish")}
            </button>
            <div className="text-center order-last w-full sm:order-none sm:w-auto">
              <h4 className="text-white font-bold">{selectedXRay.type} {t("Tasviri")}</h4>
              <p className="text-xs text-slate-500">{new Date(selectedXRay.date).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#111827] rounded-lg border border-slate-800 p-1">
                <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1.5 hover:bg-[#1f2937] text-slate-400 hover:text-white rounded-md"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
                <button onClick={() => setZoom(Math.min(300, zoom + 10))} className="p-1.5 hover:bg-[#1f2937] text-slate-400 hover:text-white rounded-md"><ZoomIn className="w-4 h-4" /></button>
              </div>
              <button onClick={() => setRotation((r) => r + 90)} className="p-2 bg-[#111827] hover:bg-[#1f2937] text-slate-400 hover:text-white rounded-lg border border-slate-800">
                <RotateCw className="w-4 h-4" />
              </button>
              <button onClick={startCompare} className="p-2 bg-[#111827] hover:bg-[#1f2937] text-slate-400 hover:text-white rounded-lg border border-slate-800">
                <SplitSquareHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stacks below lg: a fixed 350px panel beside the image left the image
              pane at roughly zero width on a phone and forced horizontal overflow. */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-y-auto lg:overflow-visible">
            {/* Image Viewer */}

            <div className="flex-1 min-h-[240px] bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
              <div
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="w-full h-full flex items-center justify-center"
              >
                <img src={selectedXRay.url} alt="X-Ray View" className="max-w-full max-h-full object-contain" />
              </div>
            </div>

            {/* Right Panel (AI & Tools) */}
            <div className="w-full lg:w-[350px] shrink-0 bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 flex flex-col gap-6 lg:overflow-y-auto">
              <div>
                <button 
                  onClick={() => loadAnalysis(selectedXRay.id)}
                  disabled={isAnalyzing || analysis !== null}
                  className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Brain className="w-5 h-5" /> 
                  {isAnalyzing ? "Tahlil qilinmoqda..." : analysis ? "AI Tahlil Yakunlandi" : "AI Tahlilni Boshlash"}
                </button>
              </div>

              {requiresPremium && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center space-y-1.5">
                  <p className="text-sm font-bold text-amber-400">🔒 AI Yordamchi — Premium xizmat</p>
                  <p className="text-xs text-slate-400">{t("Bepul sinov muddati tugagan. Davom etish uchun klinika Premium obunaga o'tishi kerak.")}</p>
                </div>
              )}

              {analysis && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h5 className="font-bold text-white">{t("AI Xulosasi")}</h5>
                    <div className="flex flex-col items-end">
                       <span className="text-xs text-slate-500">{t("Ishonch darajasi")}</span>
                       <span className="text-lg font-black text-emerald-400">{analysis.overallConfidence}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {analysis.findings.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">{t("Aniq topilma yo'q.")}</p>
                    )}
                    {analysis.findings.map(finding => (
                      <div key={finding.id} className="bg-[#111827] p-3 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-sm font-bold text-white">{finding.description}</span>
                           <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                             {finding.confidence}% AI
                           </span>
                        </div>
                        {finding.toothNumber && (
                          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                            <span>{t("Tish:")}<span className="text-emerald-400 font-bold">{finding.toothNumber}</span></span>
                            <div className="flex gap-2">
                               <button
                                 onClick={() => handleAddFindingToChart(finding)}
                                 disabled={isSavingFinding === finding.id}
                                 className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                               >
                                 Chartga qo'shish
                               </button>
                               <button
                                 onClick={() => handleAddFindingToPlan(finding)}
                                 disabled={isSavingFinding === finding.id}
                                 className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                               >
                                 Rejaga qo'shish
                               </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={handleApproveAnalysis}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Tasdiqlash
                    </button>
                    <button
                      onClick={handleRejectAnalysis}
                      className="flex-1 py-2 bg-[#111827] hover:bg-rose-500/20 text-rose-400 border border-slate-800 hover:border-rose-500/50 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Ban className="w-4 h-4" /> Rad etish
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-slate-800">
                <button
                  onClick={() => exportXrayReportPdf(patientName, selectedXRay, analysis)}
                  className="w-full py-2.5 bg-[#111827] hover:bg-[#1f2937] text-white border border-slate-800 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" /> PDF Hisobot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'compare' && selectedXRay && compareXRay && (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">
            <button onClick={() => setActiveView('viewer')} className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" /> Ortga qaytish
            </button>
            <h4 className="text-white font-bold">{t("Taqqoslash Rejimi")}</h4>
            <div className="w-24"></div>
          </div>
          
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="flex-1 flex flex-col gap-2">
              <div className="bg-[#111827] p-2 rounded-lg text-center text-xs font-bold text-slate-400">Joriy: {new Date(selectedXRay.date).toLocaleDateString()}</div>
              <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                <img src={selectedXRay.url} className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
               <div className="bg-[#111827] p-2 rounded-lg text-center text-xs font-bold text-slate-400 flex justify-between items-center">
                 <span>Solishtirilayotgan: {new Date(compareXRay.date).toLocaleDateString()}</span>
                 <select 
                   className="bg-[#020712] border border-slate-700 rounded px-2 py-0.5"
                   onChange={(e) => {
                     const f = xrays.find(x => x.id === e.target.value);
                     if(f) setCompareXRay(f);
                   }}
                   value={compareXRay.id}
                 >
                   {xrays.filter(x => x.id !== selectedXRay.id).map(x => (
                     <option key={x.id} value={x.id}>{new Date(x.date).toLocaleDateString()}</option>
                   ))}
                 </select>
               </div>
               <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                <img src={compareXRay.url} className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/80 backdrop-blur-sm p-4">
          {/* max-h + scroll: on a phone this dialog is taller than the viewport,
              and without it the Yuklash button was simply unreachable. */}
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{t("Yangi rentgen yuklash")}</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Tasvir turi")}</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as any)}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="OPG">{t("Panoramali (OPG)")}</option>
                  <option value="RVG">{t("Vizual (RVG)")}</option>
                  <option value="CBCT">{t("Tomografiya (CBCT)")}</option>
                  <option value="Other">{t("Boshqa")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Muolaja bosqichi")}</label>
                <PhasePicker value={uploadStage} onChange={setUploadStage} t={t} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Tishlar")}</label>
                <ToothPicker value={uploadTeeth} onChange={setUploadTeeth} t={t} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Holat va kerakli muolaja")}</label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  rows={2}
                  placeholder={t("Masalan: 36-tishda chuqur karies, kanal davolash kerak")}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              <ImageDropzone
                previewUrl={previewUrl}
                isProcessing={isUploading}
                error={uploadError}
                maxSizeLabel={t("JPG, PNG")}
                onFile={handleFile}
                onClear={() => setPreviewUrl(null)}
                t={t}
              />

              <button
                onClick={handleUpload}
                disabled={isUploading || !previewUrl}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                {isUploading ? t("Yuklanmoqda...") : t("Yuklash")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
