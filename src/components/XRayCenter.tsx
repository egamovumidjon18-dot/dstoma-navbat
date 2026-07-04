import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../services/firebase';
import { compressImage } from '../utils/imageCompressor';
import { 
  Upload, Search, ZoomIn, ZoomOut, RotateCw, 
  Brain, FileText, SplitSquareHorizontal,
  Image as ImageIcon, ChevronLeft, X
} from 'lucide-react';

export interface XRay {
  id: string;
  patientId: string;
  type: 'OPG' | 'RVG' | 'CBCT' | 'Other';
  stage?: 'Oldin' | 'Keyin' | 'Jarayon' | 'Boshqa';
  date: string;
  url: string;
  status: 'Pending' | 'Analyzed' | 'Approved';
  notes: string;
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

export default function XRayCenter({ patientId, clinicId }: { patientId: string; clinicId?: string }) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<XRay['type']>('OPG');
  const [uploadStage, setUploadStage] = useState<XRay['stage']>('Oldin');
  
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
          language: 'uz',
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
    } catch (err) {
      console.error('X-ray AI analysis failed', err);
      setAnalysis({ id: xrayId, overallConfidence: 0, findings: [] });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(file, 1024);
        setPreviewUrl(compressed);
      } catch (err) {
        console.error('Image processing failed', err);
        alert("Rasm formatini o'qib bo'lmadi.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUpload = async () => {
    if (!previewUrl) {
      alert("Iltimos, avval rasm tanlang.");
      return;
    }
    const id = Date.now().toString();
    const newXRay: XRay = {
      id,
      patientId,
      type: uploadType,
      stage: uploadStage,
      date: new Date().toISOString(),
      url: previewUrl,
      status: 'Pending',
      notes: ''
    };
    try {
      setIsUploading(true);
      await setDoc(doc(db, `patients/${patientId}/xrays`, id), newXRay);
      setShowUpload(false);
      setPreviewUrl(null);
    } catch (error) {
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

  return (
    <div className="flex flex-col h-full bg-[#020712] rounded-3xl p-6 text-slate-300 font-sans border border-slate-800">
      {activeView === 'gallery' && (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" /> Rentgenlar Galereyasi
              </h3>
              <p className="text-sm text-slate-500">Bemorning barcha rentgen va tomografiya tasvirlari</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Qidirish..." 
                  className="pl-9 pr-4 py-2 bg-[#0a0f1d] border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <button 
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                <Upload className="w-4 h-4" /> Yuklash
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {["Oldin", "Jarayon", "Keyin", "Boshqa"].map(stageGroup => {
              const stageXRays = xrays.filter(x => (x.stage || "Boshqa") === stageGroup);
              if (stageXRays.length === 0) return null;
              
              return (
                <div key={stageGroup} className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    {stageGroup === "Oldin" ? "Muolajadan oldin" : 
                     stageGroup === "Keyin" ? "Muolajadan keyin" : 
                     stageGroup === "Jarayon" ? "Davolash jarayoni" : "Boshqa tasvirlar"}
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
                            <div>
                              <p className="text-white font-bold text-sm">{new Date(xray.date).toLocaleDateString()}</p>
                              <p className="text-xs text-slate-500">{new Date(xray.date).toLocaleTimeString()}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${xray.status === "Approved" ? "bg-emerald-500" : xray.status === "Analyzed" ? "bg-indigo-500" : "bg-amber-500"}`}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {xrays.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                <ImageIcon className="w-12 h-12 mb-4 text-slate-700" />
                <p>Hozircha rentgen tasvirlari mavjud emas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === "viewer" && selectedXRay && (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">
            <button onClick={() => setActiveView("gallery")} className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" /> Ortga qaytish
            </button>
            <div className="text-center">
              <h4 className="text-white font-bold">{selectedXRay.type} Tasviri</h4>
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

          <div className="flex-1 flex gap-4 min-h-0">
            {/* Image Viewer */}

            <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
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
            <div className="w-[350px] bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 flex flex-col gap-6 overflow-y-auto">
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
                  <p className="text-xs text-slate-400">Bepul sinov muddati tugagan. Davom etish uchun klinika Premium obunaga o'tishi kerak.</p>
                </div>
              )}

              {analysis && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h5 className="font-bold text-white">AI Xulosasi</h5>
                    <div className="flex flex-col items-end">
                       <span className="text-xs text-slate-500">Ishonch darajasi</span>
                       <span className="text-lg font-black text-emerald-400">{analysis.overallConfidence}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {analysis.findings.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">Aniq topilma yo'q.</p>
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
                            <span>Tish: <span className="text-emerald-400 font-bold">{finding.toothNumber}</span></span>
                            <div className="flex gap-2">
                               <button className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">Chartga qo'shish</button>
                               <button className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">Rejaga qo'shish</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex gap-2">
                    <button className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors">
                      Tasdiqlash
                    </button>
                    <button className="flex-1 py-2 bg-[#111827] hover:bg-rose-500/20 text-rose-400 border border-slate-800 hover:border-rose-500/50 rounded-lg text-sm font-bold transition-colors">
                      Rad etish
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-slate-800">
                <button className="w-full py-2.5 bg-[#111827] hover:bg-[#1f2937] text-white border border-slate-800 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
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
            <h4 className="text-white font-bold">Taqqoslash Rejimi</h4>
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
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Yangi rentgen yuklash</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Tasvir turi</label>
                  <select 
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="OPG">Panoramali (OPG)</option>
                    <option value="RVG">Vizual (RVG)</option>
                    <option value="CBCT">Tomografiya (CBCT)</option>
                    <option value="Other">Boshqa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Bosqich</label>
                  <select 
                    value={uploadStage}
                    onChange={(e) => setUploadStage(e.target.value as any)}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="Oldin">Oldin (Muolajadan oldin)</option>
                    <option value="Jarayon">Jarayon (Davolash jarayoni)</option>
                    <option value="Keyin">Keyin (Muolajadan keyin)</option>
                    <option value="Boshqa">Boshqa</option>
                  </select>
                </div>
              </div>

              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*,.dcm" 
                className="hidden" 
              />
              <div 
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-8 text-center transition-colors cursor-pointer overflow-hidden relative" 
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} className="max-h-40 mx-auto object-contain" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-300 font-bold mb-1">
                      {isUploading ? "Ishlanmoqda..." : "Faylni tanlang yoki shu yerga tashlang"}
                    </p>
                    <p className="text-xs text-slate-500">JPG, PNG, DICOM (Max 10MB)</p>
                  </>
                )}
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleUpload}
                  disabled={isUploading || !previewUrl}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {isUploading ? "Yuklanmoqda..." : "Yuklash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
