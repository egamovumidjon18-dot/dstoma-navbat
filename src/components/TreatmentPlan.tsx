import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../services/firebase';
import { 
  FileText, Plus, Check, Clock, XCircle, PlayCircle, 
  Download, Send, Sparkles, User, Calendar, Trash2, Search
} from 'lucide-react';
import { STANDARD_SERVICES_CATALOG } from './DirectorDashboard';

export interface TreatmentItem {
  id: string;
  toothId: string;
  treatment: string;
  price: number;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  doctorName: string;
  createdAt: string;
}

export default function TreatmentPlan({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState(0);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [newItem, setNewItem] = useState<Partial<TreatmentItem>>({
    toothId: '',
    treatment: '',
    price: 0,
    status: 'Planned',
    doctorName: 'Dr. Karimov'
  });

  useEffect(() => {
    if (!patientId) return;
    const unsub = onSnapshot(
      collection(db, `patients/${patientId}/treatmentPlans`),
      (snapshot) => {
        const data: TreatmentItem[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as TreatmentItem);
        });
        // Sort by createdAt desc
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `patients/${patientId}/treatmentPlans`);
      }
    );
    return () => unsub();
  }, [patientId]);

  const handleSave = async () => {
    if (!newItem.treatment) return;
    try {
      const id = Date.now().toString();
      const item: TreatmentItem = {
        id,
        toothId: newItem.toothId || '-',
        treatment: newItem.treatment,
        price: Number(newItem.price) || 0,
        status: newItem.status as any || 'Planned',
        doctorName: newItem.doctorName || "Dr. Noma'lum",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, `patients/${patientId}/treatmentPlans`, id), item);
      setShowAdd(false);
      setNewItem({ toothId: '', treatment: '', price: 0, status: 'Planned', doctorName: 'Dr. Karimov' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/treatmentPlans`);
    }
  };

  const handleUpdateStatus = async (id: string, status: TreatmentItem['status']) => {
    try {
      await updateDoc(doc(db, `patients/${patientId}/treatmentPlans`, id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/treatmentPlans`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, `patients/${patientId}/treatmentPlans`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/treatmentPlans`);
    }
  };

  const activeItems = items.filter(i => i.status !== 'Cancelled');
  const totalCost = activeItems.reduce((acc, curr) => acc + curr.price, 0);
  const completedCost = activeItems.filter(i => i.status === 'Completed').reduce((acc, curr) => acc + curr.price, 0);
  const progressPercent = activeItems.length > 0 
    ? Math.round((activeItems.filter(i => i.status === 'Completed').length / activeItems.length) * 100) 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'In Progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Planned': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Cancelled': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const handleTelegramShare = () => {
    const text = `*Davolash Rejasi*\n\n${items.map(i => `🦷 Tish ${i.toothId}: ${i.treatment} - ${i.price.toLocaleString()} so'm [${i.status}]`).join('\n')}\n\n💰 *Umumiy summa:* ${totalCost.toLocaleString()} so'm\n✅ *Bajarilgan:* ${completedCost.toLocaleString()} so'm\n⏳ *Qolgan summa:* ${(totalCost - completedCost).toLocaleString()} so'm`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent('DStoma Klinikasi')}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#020712] rounded-3xl p-6 text-slate-300 font-sans border border-slate-800" id="treatment-plan-container">
      
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 print:hidden">
        <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                Davolash Rejasi
              </h3>
              <p className="text-sm text-slate-500">Bemorning kompleks davolash bosqichlari</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleTelegramShare} className="p-2 bg-[#111827] hover:bg-[#1f2937] text-indigo-400 rounded-lg border border-slate-800 transition-colors tooltip" title="Telegram orqali yuborish">
                <Send className="w-4 h-4" />
              </button>
              <button onClick={handlePrint} className="p-2 bg-[#111827] hover:bg-[#1f2937] text-rose-400 rounded-lg border border-slate-800 transition-colors tooltip" title="Chop etish / PDF">
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" /> Yangi muolaja
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2 flex justify-between items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Umumiy progress</span>
            <span className="text-2xl font-black text-white">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full bg-[#111827] rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
               <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="w-full lg:w-[350px] bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Moliyaviy hisobot</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Umumiy summa:</span>
                <span className="text-lg font-bold text-white">{totalCost.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Bajarilgan muolajalar:</span>
                <span className="text-lg font-bold text-emerald-400">{completedCost.toLocaleString()} so'm</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-sm text-slate-400">Qolgan summa:</span>
            <span className="text-xl font-black text-amber-400">{(totalCost - completedCost).toLocaleString()} so'm</span>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-6 flex items-start gap-4">
        <div className="p-3 bg-indigo-500/20 rounded-xl">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-300 mb-1">AI Tavsiyasi</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            Bemor tarixiga asoslanib, avval muammoli tishlardagi kariesni davolash, so'ngra implant o'rnatish bosqichiga o'tish tavsiya etiladi. Davolash davomiyligi taxminan 3-4 hafta.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#111827] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Tish</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Muolaja</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Narx</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Shifokor</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Sana</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Holat</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className="hover:bg-[#111827]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 font-bold text-xs">
                      {item.toothId}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{item.treatment}</td>
                  <td className="px-6 py-4 font-mono text-slate-300">{item.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-4 h-4" /> {item.doctorName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                        className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border outline-none transition-all ${getStatusColor(item.status)}`}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                      >
                        <option value="Planned" className="bg-[#111827] text-amber-400">Rejalashtirilgan</option>
                        <option value="In Progress" className="bg-[#111827] text-blue-400">Jarayonda</option>
                        <option value="Completed" className="bg-[#111827] text-emerald-400">Bajarildi</option>
                        <option value="Cancelled" className="bg-[#111827] text-rose-400">Bekor qilindi</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Muolaja rejasi hozircha bo'sh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Yangi muolaja qo'shish</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Tish raqami (FDI)</label>
                  <input 
                    type="text" 
                    placeholder="Masalan: 36"
                    value={newItem.toothId}
                    onChange={e => setNewItem({...newItem, toothId: e.target.value})}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Holati</label>
                  <select 
                    value={newItem.status}
                    onChange={e => setNewItem({...newItem, status: e.target.value as any})}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="Planned">Rejalashtirilgan</option>
                    <option value="In Progress">Jarayonda</option>
                    <option value="Completed">Bajarildi</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-400">Muolaja Katalogi</label>
                </div>
                <div className="bg-[#111827] border border-slate-700 rounded-xl p-3">
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Katalogdan qidirish..."
                      value={catalogSearchQuery}
                      onChange={(e) => setCatalogSearchQuery(e.target.value)}
                      className="w-full bg-[#1f2937] border border-slate-700 text-xs font-bold text-slate-100 rounded-lg pl-8 pr-3 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {!catalogSearchQuery && (
                    <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-700 mb-2">
                      {STANDARD_SERVICES_CATALOG.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCatalogCategory(idx)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                            selectedCatalogCategory === idx
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-[#1f2937] border-slate-700 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          {cat.categoryNameUz}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
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
                        return <div className="py-4 text-center text-xs font-bold text-slate-500">Katalogda xizmat topilmadi</div>;
                      }

                      return results.map((item, idX) => (
                        <button
                          key={idX}
                          type="button"
                          onClick={() => setNewItem({...newItem, treatment: item.name, price: item.price})}
                          className={`text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 ${
                            newItem.treatment === item.name
                              ? 'bg-[#1e2f50] border-emerald-500'
                              : 'bg-[#1f2937] border-slate-700 hover:border-emerald-500/50'
                          }`}
                        >
                          <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">{item.category}</span>
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-bold text-slate-100">{item.name}</span>
                            <span className="text-xs font-black text-emerald-400">{item.price.toLocaleString()} so'm</span>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Muolaja nomi (Maxsus)</label>
                <input 
                  type="text" 
                  placeholder="Kanal tozalash va plomba"
                  value={newItem.treatment}
                  onChange={e => setNewItem({...newItem, treatment: e.target.value})}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Narxi (so'm)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={newItem.price || ''}
                  onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Shifokor</label>
                <input 
                  type="text" 
                  value={newItem.doctorName}
                  onChange={e => setNewItem({...newItem, doctorName: e.target.value})}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  disabled={!newItem.treatment}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
