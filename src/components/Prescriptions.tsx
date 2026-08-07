import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, collectionGroup } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../services/firebase';
import { exportPrescriptionPdf, printPrescriptionPdf, exportPrescriptionsListPdf } from '../utils/pdfExport';
import {
  Pill, FileText, Plus, Search, Filter,
  Send, Download, Printer, Trash2, Calendar,
  Clock, CheckCircle, BrainCircuit, X, AlertTriangle, AlertCircle
} from 'lucide-react';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: Medication[];
  status: 'Active' | 'Completed';
  treatmentId?: string;
}

// Templates
const MEDICATION_TEMPLATES = [
  { name: 'Amoksiklav', dosage: '625 mg', frequency: '1 tabletkadan 2 mahal (har 12 soatda)', duration: '5-7 kun', notes: 'Ovqatlanish vaqtida yoki undan keyin qabul qilinadi.' },
  { name: 'Nimesil (Nimesulid)', dosage: '100 mg', frequency: '1 paketdan 2 mahal', duration: '3-5 kun', notes: 'Og\'riq va yallig\'lanishda yarim stakan suvda eritib ichiladi.' },
  { name: 'Ketonal (Ketoprofen)', dosage: '100 mg', frequency: '1 tabletkadan 1-2 mahal', duration: '3 kun', notes: 'Kuchli og\'riqda ovqatdan so\'ng.' },
  { name: 'Xlorgeksidin', dosage: '0.05%', frequency: 'Kuniga 2-3 marta chayiladi', duration: '5-7 kun', notes: 'Muolajadan so\'ng og\'iz bo\'shlig\'ini chayish uchun.' },
];

export default function Prescriptions({ patientId, patientName, doctorName, patientTelegramChatId }: { patientId?: string; patientName?: string; doctorName?: string; patientTelegramChatId?: string }) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Prescription>>({
    doctorName: doctorName || 'Shifokor',
    diagnosis: '',
    medications: [],
    status: 'Active'
  });

  const [currentMed, setCurrentMed] = useState<Partial<Medication>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);

  useEffect(() => {
    if (patientId) {
      const unsub = onSnapshot(
        collection(db, `patients/${patientId}/prescriptions`),
        (snapshot) => {
          const data: Prescription[] = [];
          snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() } as Prescription);
          });
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setPrescriptions(data);
        },
        (error) => handleFirestoreError(error, OperationType.GET, `patients/${patientId}/prescriptions`)
      );
      return () => unsub();
    } else {
      const unsub = onSnapshot(
        query(collectionGroup(db, 'prescriptions')),
        (snapshot) => {
          const data: Prescription[] = [];
          snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() } as Prescription);
          });
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setPrescriptions(data);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'prescriptions')
      );
      return () => unsub();
    }
  }, [patientId]);

  const handleSavePrescription = async () => {
    if (!formData.medications || formData.medications.length === 0) return;
    if (!patientId) return; // Must select a patient or be in patient profile to create
    
    const id = Date.now().toString();
    const newPrescription: Prescription = {
      id,
      patientId,
      doctorName: formData.doctorName || 'Unknown Doctor',
      date: new Date().toISOString(),
      diagnosis: formData.diagnosis || '',
      medications: formData.medications as Medication[],
      status: formData.status || 'Active',
      treatmentId: formData.treatmentId
    };

    try {
      await setDoc(doc(db, `patients/${patientId}/prescriptions`, id), newPrescription);
      setShowForm(false);
      setFormData({ doctorName: doctorName || 'Shifokor', diagnosis: '', medications: [], status: 'Active' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/prescriptions`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, `patients/${patientId}/prescriptions`, id));
      if (selectedPrescription?.id === id) setSelectedPrescription(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/prescriptions`);
    }
  };

  const handleSendTelegram = async (p: Prescription) => {
    if (!patientTelegramChatId) {
      alert("Bemor Telegram botga ulanmagan.");
      return;
    }
    setIsSendingTelegram(p.id);
    try {
      const medLines = p.medications.map((m) => `• ${m.name} — ${m.dosage}, ${m.frequency} (${m.duration})`).join('\n');
      const text = `💊 Retsept\n\nTashxis: ${p.diagnosis || '-'}\nShifokor: ${p.doctorName}\nSana: ${new Date(p.date).toLocaleDateString('uz-UZ')}\n\n${medLines}`;
      const res = await fetch('/api/telegram/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatIds: [patientTelegramChatId], text }),
      });
      const data = await res.json();
      if (data.ok && data.sent > 0) {
        alert("Retsept Telegram orqali yuborildi.");
      } else {
        alert("Yuborib bo'lmadi.");
      }
    } catch (error) {
      console.error('Telegram send failed', error);
      alert("Yuborib bo'lmadi.");
    } finally {
      setIsSendingTelegram(null);
    }
  };

  const addMedication = () => {
    if (!currentMed.name) return;
    const med: Medication = {
      id: Date.now().toString(),
      name: currentMed.name || '',
      dosage: currentMed.dosage || '',
      frequency: currentMed.frequency || '',
      duration: currentMed.duration || '',
      notes: currentMed.notes || ''
    };
    setFormData({
      ...formData,
      medications: [...(formData.medications || []), med]
    });
    setCurrentMed({});
  };

  const removeMedication = (id: string) => {
    setFormData({
      ...formData,
      medications: (formData.medications || []).filter(m => m.id !== id)
    });
  };

  const applyTemplate = (template: typeof MEDICATION_TEMPLATES[0]) => {
    setCurrentMed(template);
    setShowTemplates(false);
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.medications.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-[#020712] rounded-3xl p-6 text-slate-300 font-sans border border-slate-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-500" /> {patientId ? 'Retseptlar' : 'Barcha retseptlar'}
          </h3>
          <p className="text-sm text-slate-500">
            {patientId ? "Bemor uchun dorilar ro'yxati va davolash rejimini belgilash" : "Klinikadagi barcha yozilgan retseptlar ro'yxati"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportPrescriptionsListPdf(patientName, filteredPrescriptions)}
            disabled={filteredPrescriptions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white border border-slate-800 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Barchasini yuklash
          </button>
          {patientId && !showForm && !selectedPrescription && (
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Yangi retsept
            </button>
          )}
        </div>
      </div>

      {!showForm && !selectedPrescription && (
        <div className="flex flex-col h-full min-h-0">
          <div className="flex gap-4 mb-6 bg-[#0a0f1d] p-4 rounded-2xl border border-slate-800">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Tashxis yoki dori nomi bo'yicha qidirish..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {filteredPrescriptions.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPrescription(p)}
                className="bg-[#0a0f1d] p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer group flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md mb-2 inline-block">
                      {new Date(p.date).toLocaleDateString()}
                    </span>
                    <h4 className="font-bold text-white line-clamp-1">{p.diagnosis || "Umumiy retsept"}</h4>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <Pill className="w-4 h-4" /> {p.medications.length} ta dori
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className={`text-xs font-bold ${p.status === 'Active' ? 'text-blue-400' : 'text-slate-500'}`}>
                    {p.status === 'Active' ? 'Faol (Qabul qilinmoqda)' : 'Yakunlangan'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); exportPrescriptionPdf(patientName, p); }}
                      className="p-1.5 text-slate-400 hover:text-white bg-[#111827] rounded-lg transition-colors"
                      title="PDF Yuklash"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendTelegram(p); }}
                      disabled={isSendingTelegram === p.id}
                      className="p-1.5 text-slate-400 hover:text-[#0088cc] bg-[#111827] rounded-lg transition-colors disabled:opacity-50"
                      title="Telegramga yuborish"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredPrescriptions.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                <FileText className="w-12 h-12 mb-4 text-slate-700" />
                <p>Retseptlar topilmadi</p>
                {patientId && (
                  <button 
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-4 py-2 bg-[#111827] text-white rounded-xl text-sm font-bold border border-slate-800 hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
                  >
                    Yangi retsept yaratish
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col lg:flex-row gap-6">
          {/* Main Form */}
          <div className="flex-1 space-y-6">
            <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-white text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" /> Yangi Retsept
                </h4>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Tashxis yoki Sabab (Ixtiyoriy)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Masalan: Tish olingandan keyingi holat"
                      value={formData.diagnosis}
                      onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button 
                      type="button"
                      title="Ovozli kiritish (Voice to text)"
                      onClick={() => alert("Ovozli kiritish funksiyasi ishga tushirildi")}
                      className="px-4 bg-[#111827] border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 rounded-xl transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-bold text-white">Dorilar ro'yxati</h5>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAiRecommendations(true)}
                      className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" /> AI Tavsiya
                    </button>
                    <button 
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-xs font-bold bg-[#111827] text-emerald-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500 transition-colors"
                    >
                      Shablonlar
                    </button>
                  </div>
                </div>

                {/* Templates Dropdown */}
                {showTemplates && (
                  <div className="mb-4 bg-[#111827] border border-slate-700 rounded-xl p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {MEDICATION_TEMPLATES.map((t, i) => (
                      <div 
                        key={i} 
                        onClick={() => applyTemplate(t)}
                        className="p-3 bg-[#0a0f1d] hover:bg-[#1f2937] border border-slate-800 rounded-lg cursor-pointer transition-colors"
                      >
                        <p className="font-bold text-emerald-400 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{t.dosage} • {t.frequency}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* AI Dropdown Placeholder */}
                {showAiRecommendations && (
                   <div className="mb-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 relative">
                      <button onClick={() => setShowAiRecommendations(false)} className="absolute top-2 right-2 text-indigo-500 hover:text-indigo-300">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex gap-3 items-start">
                        <BrainCircuit className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <h6 className="font-bold text-indigo-300 text-sm mb-1">AI Assistant Tahlili</h6>
                          <p className="text-xs text-indigo-200/70 mb-3">Bemorning oxirgi muolajasi "Periodontit (36-tish)" asosida quyidagi preparatlar tavsiya etiladi:</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center bg-[#020712]/50 p-2 rounded-lg border border-indigo-500/10">
                              <div>
                                <p className="font-bold text-white text-xs">Amoksiklav 625 mg</p>
                                <p className="text-[10px] text-slate-500">Antibakterial terapiya</p>
                              </div>
                              <button onClick={() => applyTemplate(MEDICATION_TEMPLATES[0])} className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded">Qo'shish</button>
                            </div>
                            <div className="flex justify-between items-center bg-[#020712]/50 p-2 rounded-lg border border-indigo-500/10">
                              <div>
                                <p className="font-bold text-white text-xs">Nimesil</p>
                                <p className="text-[10px] text-slate-500">Yallig'lanishga qarshi va og'riqsizlantiruvchi</p>
                              </div>
                              <button onClick={() => applyTemplate(MEDICATION_TEMPLATES[1])} className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded">Qo'shish</button>
                            </div>
                          </div>
                        </div>
                      </div>
                   </div>
                )}

                {/* Add Medication Form */}
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dori nomi</label>
                      <input 
                        type="text" 
                        placeholder="Masalan: Paratsetamol"
                        value={currentMed.name || ''}
                        onChange={e => setCurrentMed({...currentMed, name: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Doza</label>
                      <input 
                        type="text" 
                        placeholder="Masalan: 500 mg"
                        value={currentMed.dosage || ''}
                        onChange={e => setCurrentMed({...currentMed, dosage: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Davomiyligi</label>
                      <input 
                        type="text" 
                        placeholder="Masalan: 5 kun"
                        value={currentMed.duration || ''}
                        onChange={e => setCurrentMed({...currentMed, duration: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qabul qilish tartibi</label>
                      <input 
                        type="text" 
                        placeholder="Masalan: 1 tabletkadan 3 mahal"
                        value={currentMed.frequency || ''}
                        onChange={e => setCurrentMed({...currentMed, frequency: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qo'shimcha eslatma</label>
                      <input 
                        type="text" 
                        placeholder="Masalan: Ovqatdan keyin ko'p suv bilan"
                        value={currentMed.notes || ''}
                        onChange={e => setCurrentMed({...currentMed, notes: e.target.value})}
                        className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={addMedication}
                    disabled={!currentMed.name}
                    className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-sm transition-colors"
                  >
                    Dorini ro'yxatga qo'shish
                  </button>
                </div>

                {/* Added Medications List */}
                <div className="space-y-3">
                  {formData.medications?.map((med, index) => (
                    <div key={med.id || index} className="flex items-start gap-3 p-3 bg-[#111827] rounded-xl border border-slate-800">
                       <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                         {index + 1}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-1">
                           <h6 className="font-bold text-white text-sm truncate">{med.name} <span className="text-slate-400 font-normal">({med.dosage})</span></h6>
                           <button onClick={() => removeMedication(med.id)} className="text-slate-500 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                         <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {med.frequency}</span>
                           <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {med.duration}</span>
                         </div>
                         {med.notes && (
                           <p className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1">
                             <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> {med.notes}
                           </p>
                         )}
                       </div>
                    </div>
                  ))}
                  {formData.medications?.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-4">Hozircha hech qanday dori qo'shilmadi</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <button 
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-[#111827] hover:bg-[#1f2937] text-white font-bold rounded-xl transition-colors border border-slate-800"
                 >
                   Bekor qilish
                 </button>
                 <button 
                  onClick={handleSavePrescription}
                  disabled={!formData.medications?.length}
                  className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                 >
                   Retseptni Saqlash
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPrescription && !showForm && (
        <div className="flex flex-col h-full">
           <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setSelectedPrescription(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" /> Yopish
              </button>
              <div className="flex gap-2">
                 <button
                   onClick={() => handleSendTelegram(selectedPrescription)}
                   disabled={isSendingTelegram === selectedPrescription.id}
                   className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-[#0088cc] border border-slate-800 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                 >
                   <Send className="w-4 h-4" /> Telegram
                 </button>
                 <button
                   onClick={() => printPrescriptionPdf(patientName, selectedPrescription)}
                   className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-emerald-400 border border-slate-800 rounded-xl text-sm font-bold transition-colors"
                 >
                   <Printer className="w-4 h-4" /> Chop etish
                 </button>
                 <button
                   onClick={() => exportPrescriptionPdf(patientName, selectedPrescription)}
                   className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                 >
                   <Download className="w-4 h-4" /> PDF Yuklash
                 </button>
              </div>
           </div>

           {/* Prescription Details (A4 Preview Style) */}
           <div className="flex-1 bg-white p-8 md:p-12 rounded-2xl overflow-y-auto custom-scrollbar text-slate-800 max-w-3xl mx-auto w-full">
             <div className="flex justify-between items-start border-b-2 border-emerald-500 pb-6 mb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-1">DStoma<span className="text-emerald-500">Navbati</span></h1>
                  <p className="text-sm text-slate-500">Zamonaviy stomatologiya klinikasi</p>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p>Manzil: Toshkent sh., Chilonzor tumani</p>
                  <p>Tel: +998 (90) 123-45-67</p>
                </div>
             </div>

             <div className="flex justify-between mb-8 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Bemor:</p>
                  <p className="font-bold text-lg">{/* We don't have patient name here easily without prop, fallback to text */} Bemor ID: {patientId}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 mb-1">Sana:</p>
                  <p className="font-bold text-lg">{new Date(selectedPrescription.date).toLocaleDateString()}</p>
                </div>
             </div>

             {selectedPrescription.diagnosis && (
               <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tashxis / Ko'rsatma:</p>
                 <p className="font-bold text-slate-900">{selectedPrescription.diagnosis}</p>
               </div>
             )}

             <div className="mb-12">
               <div className="flex items-center gap-2 mb-6">
                 <span className="text-3xl font-serif font-black text-slate-900">Rp:</span>
               </div>
               
               <div className="space-y-6">
                 {selectedPrescription.medications.map((med, idx) => (
                   <div key={med.id} className="border-b border-slate-100 pb-6 last:border-0">
                     <p className="font-bold text-lg text-slate-900 flex items-center gap-2">
                       {idx + 1}. {med.name} <span className="font-normal text-slate-500 text-sm">- {med.dosage}</span>
                     </p>
                     <div className="mt-2 pl-6 border-l-2 border-emerald-500 ml-2 space-y-1 text-slate-700">
                       <p><span className="font-bold">Qabul qilish:</span> {med.frequency}</p>
                       <p><span className="font-bold">Davomiyligi:</span> {med.duration}</p>
                       {med.notes && <p className="text-sm italic text-slate-500 mt-2">"{med.notes}"</p>}
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="flex justify-between items-end mt-16 pt-6 border-t border-slate-200">
               <div>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Shifokor:</p>
                 <p className="font-bold text-lg text-slate-900">{selectedPrescription.doctorName}</p>
               </div>
               <div className="text-center">
                 <div className="w-48 border-b border-slate-400 mb-2"></div>
                 <p className="text-xs text-slate-500 uppercase tracking-wider">Imzo / Muhr</p>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
