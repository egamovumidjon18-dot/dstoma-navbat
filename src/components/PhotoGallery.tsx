import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../services/firebase';
import { useHistoryLayer } from '../hooks/useHistoryLayer';
import { compressImage } from '../utils/imageCompressor';
import {
  PhasePicker, ToothPicker, ImageDropzone, describeUploadError,
  TREATMENT_PHASES, PHASE_ORDER, type TreatmentPhase,
} from './ImagingControls';
import { exportPhotoGalleryPdf } from '../utils/pdfExport';
import type { ToothData } from './DentalChart';
import {
  Camera, Upload, Search, Filter,
  Image as ImageIcon, ChevronLeft, X,
  SplitSquareHorizontal, Download, Lock, Unlock, Tag, Trash2, Calendar
} from 'lucide-react';
import { Language } from '../translations';
import { createTranslator, Dict } from '../utils/translate';

const GALLERY_TRANSLATIONS: Dict = {
  "yuklash": { ru: "Загрузить", en: "Upload", kk: "Жүктеу", ky: "Жүктөө", tg: "Боргирӣ", tk: "Ýüklemek" },

  "foto galereya": { ru: "Фотогалерея", en: "Photo gallery", kk: "Фотогалерея", ky: "Фотогалерея", tg: "Галереяи аксҳо", tk: "Foto galereýa" },
  "galereya": { ru: "Галерея", en: "Gallery", kk: "Галерея", ky: "Галерея", tg: "Галерея", tk: "Galereýa" },
  "taymlayn": { ru: "Таймлайн", en: "Timeline", kk: "Таймлайн", ky: "Таймлайн", tg: "Хатти вақт", tk: "Wagt çyzgysy" },
  "pdf yuklash": { ru: "Скачать PDF", en: "Download PDF", kk: "PDF жүктеу", ky: "PDF жүктөө", tg: "Боргирии PDF", tk: "PDF ýükle" },

  "bemorning klinik fotolari va natijalar": { ru: "Клинические фото пациента и результаты", en: "Patient's clinical photos and results", kk: "Пациенттің клиникалық фотолары және нәтижелер", ky: "Бейтаптын клиникалык сүрөттөрү жана натыйжалар", tg: "Аксҳои клиникии бемор ва натиҷаҳо", tk: "Näsagyň kliniki suratlary we netijeler" },
  "qidirish (tish raqami, eslatma)...": { ru: "Поиск (номер зуба, примечание)...", en: "Search (tooth number, note)...", kk: "Іздеу (тіс нөмірі, ескертпе)...", ky: "Издөө (тиш номери, эскертүү)...", tg: "Ҷустуҷӯ (рақами дандон, эзоҳ)...", tk: "Gözleg (diş belgisi, bellik)..." },
  "barcha toifalar": { ru: "Все категории", en: "All categories", kk: "Барлық санаттар", ky: "Бардык категориялар", tg: "Ҳамаи категорияҳо", tk: "Ähli kategoriýalar" },
  "oldin": { ru: "До", en: "Before", kk: "Дейін", ky: "Мурун", tg: "Пеш", tk: "Öň" },
  "keyin": { ru: "После", en: "After", kk: "Кейін", ky: "Кийин", tg: "Пас", tk: "Soň" },
  "hozircha fotosuratlar mavjud emas": { ru: "Фотографий пока нет", en: "No photos yet", kk: "Әзірге фотосуреттер жоқ", ky: "Азырынча сүрөттөр жок", tg: "То ҳол аксҳо мавҷуд нестанд", tk: "Häzirlikçe suratlar ýok" },
  "rasm ma'lumotlari": { ru: "Сведения об изображении", en: "Image details", kk: "Сурет мәліметтері", ky: "Сүрөт маалыматтары", tg: "Маълумоти тасвир", tk: "Surat maglumatlary" },
  "yuklangan sana": { ru: "Дата загрузки", en: "Upload date", kk: "Жүктелген күні", ky: "Жүктөлгөн күнү", tg: "Санаи боргирӣ", tk: "Ýüklenen senesi" },
  "maxfiylik": { ru: "Конфиденциальность", en: "Privacy", kk: "Құпиялылық", ky: "Купуялуулук", tg: "Махфият", tk: "Gizlinlik" },
  "faqat shifokorlar uchun": { ru: "Только для врачей", en: "Doctors only", kk: "Тек дәрігерлер үшін", ky: "Дарыгерлер үчүн гана", tg: "Танҳо барои духтурон", tk: "Diňe lukmanlar üçin" },
  "bemor ko'rishi mumkin": { ru: "Пациент может видеть", en: "Patient can view", kk: "Пациент көре алады", ky: "Бейтап көрө алат", tg: "Бемор дида метавонад", tk: "Näsag görüp biler" },
  "eslatma": { ru: "Примечание", en: "Note", kk: "Ескертпе", ky: "Эскертүү", tg: "Эзоҳ", tk: "Bellik" },
  "solishtirish rejimi": { ru: "Режим сравнения", en: "Comparison mode", kk: "Салыстыру режимі", ky: "Салыштыруу режими", tg: "Реҷаи муқоиса", tk: "Deňeşdirme tertibi" },
  "yangi foto yuklash": { ru: "Загрузить новое фото", en: "Upload new photo", kk: "Жаңа фото жүктеу", ky: "Жаңы сүрөт жүктөө", tg: "Боргирии акси нав", tk: "Täze surat ýükle" },
  "toifa": { ru: "Категория", en: "Category", kk: "Санат", ky: "Категория", tg: "Категория", tk: "Kategoriýa" },
  "umumiy yuz": { ru: "Общий вид лица", en: "Full face", kk: "Жалпы бет", ky: "Жалпы бет", tg: "Рӯи умумӣ", tk: "Umumy ýüz" },
  "intraoral": { ru: "Интраоральный", en: "Intraoral", kk: "Интраоральды", ky: "Интраоралдык", tg: "Дохилидаҳонӣ", tk: "Intraoral" },
  "tabassum": { ru: "Улыбка", en: "Smile", kk: "Күлкі", ky: "Жылмаюу", tg: "Табассум", tk: "Ýylgyryş" },
  "boshqa": { ru: "Другое", en: "Other", kk: "Басқа", ky: "Башка", tg: "Дигар", tk: "Beýleki" },
  "bosqich": { ru: "Этап", en: "Stage", kk: "Кезең", ky: "Этап", tg: "Марҳила", tk: "Tapgyr" },
  "oldin (muolajadan oldin)": { ru: "До (до процедуры)", en: "Before (pre-treatment)", kk: "Дейін (процедураға дейін)", ky: "Мурун (процедурадан мурун)", tg: "Пеш (пеш аз муолиҷа)", tk: "Öň (proseduradan öň)" },
  "jarayon (davolash jarayoni)": { ru: "Процесс (в ходе лечения)", en: "During (treatment in progress)", kk: "Үрдіс (емдеу барысында)", ky: "Процесс (дарылоо учурунда)", tg: "Ҷараён (дар ҷараёни табобат)", tk: "Prosess (bejergi dowamynda)" },
  "keyin (muolajadan keyin)": { ru: "После (после процедуры)", en: "After (post-treatment)", kk: "Кейін (процедурадан кейін)", ky: "Кийин (процедурадан кийин)", tg: "Пас (пас аз муолиҷа)", tk: "Soň (proseduradan soň)" },
  "tish raqami (ixtiyoriy)": { ru: "Номер зуба (необязательно)", en: "Tooth number (optional)", kk: "Тіс нөмірі (міндетті емес)", ky: "Тиш номери (милдеттүү эмес)", tg: "Рақами дандон (ихтиёрӣ)", tk: "Diş belgisi (hökman däl)" },
  "shaxsiy (bemor ko'ra olmaydi)": { ru: "Личное (пациент не увидит)", en: "Private (patient cannot see)", kk: "Жеке (пациент көре алмайды)", ky: "Жеке (бейтап көрө албайт)", tg: "Шахсӣ (бемор дида наметавонад)", tk: "Şahsy (näsag görüp bilmez)" },
};



export interface Photo {
  id: string;
  patientId: string;
  url: string;
  category: string;
  // Legacy single-tooth field, kept because handleLinkToChart uses it as a
  // Firestore document id. New uploads set it to the first entry of `teeth`.
  toothNumber: string;
  teeth?: string[];
  date: string;
  isPrivate: boolean;
  stage?: TreatmentPhase;
  notes: string;
}

export interface BeforeAfterPair {
  id: string;
  patientId: string;
  beforePhotoId: string;
  afterPhotoId: string;
  title: string;
  date: string;
}

export default function PhotoGallery({ patientId, patientName, doctorName, language }: { patientId: string; patientName?: string; doctorName?: string; language?: Language }) {
  const t = createTranslator(language, GALLERY_TRANSLATIONS);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pairs, setPairs] = useState<BeforeAfterPair[]>([]);
  
  const [activeView, setActiveView] = useState<'gallery' | 'timeline' | 'compare' | 'viewer'>('gallery');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [showUpload, setShowUpload] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadTeeth, setUploadTeeth] = useState<string[]>([]);

  useHistoryLayer(showUpload, () => setShowUpload(false), 'photo-upload');
  useHistoryLayer(activeView !== 'gallery', () => setActiveView('gallery'), 'photo-view');
  const [uploadData, setUploadData] = useState<Partial<Photo>>({
    category: 'General',
    stage: 'Oldin',
    toothNumber: '',
    isPrivate: false,
    notes: ''
  });

  // Slider for before/after
  const [sliderPosition, setSliderPosition] = useState(50);
  const [comparePair, setComparePair] = useState<BeforeAfterPair | null>(null);

  useEffect(() => {
    if (!patientId) return;
    const unsubPhotos = onSnapshot(
      collection(db, `patients/${patientId}/photos`),
      (snapshot) => {
        const data: Photo[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as Photo);
        });
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPhotos(data);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `patients/${patientId}/photos`)
    );

    const unsubPairs = onSnapshot(
      collection(db, `patients/${patientId}/before_after_pairs`),
      (snapshot) => {
        const data: BeforeAfterPair[] = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() } as BeforeAfterPair);
        });
        setPairs(data);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `patients/${patientId}/before_after_pairs`)
    );

    return () => {
      unsubPhotos();
      unsubPairs();
    };
  }, [patientId]);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const compressed = await compressImage(file, 800);
      setPreviewUrl(compressed);
    } catch (err) {
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
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newPhoto: Photo = {
      id,
      patientId,
      url: previewUrl,
      category: uploadData.category || 'General',
      // Kept as a single string for backwards compatibility with existing
      // records and with handleLinkToChart, which uses it as a document id.
      toothNumber: (uploadTeeth[0] || ''),
      teeth: uploadTeeth,
      date: new Date().toISOString(),
      isPrivate: uploadData.isPrivate || false,
      stage: uploadData.stage || 'Boshqa',
      notes: uploadData.notes || ''
    };
    try {
      setIsUploading(true);
      setUploadError(null);
      await setDoc(doc(db, `patients/${patientId}/photos`, id), newPhoto);
      setShowUpload(false);
      setPreviewUrl(null);
      setUploadTeeth([]);
      setUploadData({ category: 'General', stage: 'Oldin', toothNumber: '', isPrivate: false, notes: '' });
    } catch (error) {
      setUploadError(describeUploadError(error, t));
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/photos`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // One click used to permanently delete a clinical photo with no confirmation.
    if (!window.confirm(t("Bu fotoni butunlay o'chirasizmi?"))) return;
    try {
      await deleteDoc(doc(db, `patients/${patientId}/photos`, id));
      if (selectedPhoto?.id === id) setSelectedPhoto(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/photos`);
    }
  };

  const [isLinkingToChart, setIsLinkingToChart] = useState(false);
  const handleLinkToChart = async (photo: Photo) => {
    if (!photo.toothNumber) {
      alert("Bu foto uchun tish raqami kiritilmagan. Avval fotoni tahrirlab tish raqamini kiriting.");
      return;
    }
    setIsLinkingToChart(true);
    try {
      const toothRef = doc(db, `patients/${patientId}/dentalChart`, photo.toothNumber);
      const existingSnap = await getDoc(toothRef);
      const existing = existingSnap.exists() ? (existingSnap.data() as ToothData) : {
        id: photo.toothNumber,
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
            treatment: `Foto biriktirildi${photo.category ? ` (${photo.category})` : ''}`,
            condition: existing.condition,
            cost: 0,
            dentist: doctorName || 'Shifokor',
            notes: photo.notes || '',
          },
          ...(existing.history || []),
        ],
      };
      await setDoc(toothRef, updatedTooth);
      alert(`Foto ${photo.toothNumber}-tish kartasiga muvaffaqiyatli bog'landi.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patientId}/dentalChart`);
    } finally {
      setIsLinkingToChart(false);
    }
  };

  const categories = Array.from(new Set(photos.map(p => p.category)));

  const filteredPhotos = photos.filter(p => {
    // Guarded: a record missing toothNumber or notes used to throw here and
    // blank the entire component.
    const q = searchTerm.toLowerCase();
    const teeth = p.teeth?.length ? p.teeth : (p.toothNumber ? [p.toothNumber] : []);
    const matchesSearch = !q
      || teeth.some(n => String(n).includes(searchTerm))
      || (p.notes || '').toLowerCase().includes(q);
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const openViewer = (photo: Photo) => {
    setSelectedPhoto(photo);
    setActiveView('viewer');
  };

  const openCompare = (pair: BeforeAfterPair) => {
    setComparePair(pair);
    setSliderPosition(50);
    setActiveView('compare');
  };

  return (
    <div className="flex flex-col h-full bg-[#020712] rounded-3xl p-3 sm:p-6 text-slate-300 font-sans border border-slate-800">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-500" /> {t("Foto galereya")}
          </h3>
          <p className="text-sm text-slate-500">{t("Bemorning klinik fotolari va natijalar")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeView !== 'viewer' && activeView !== 'compare' && (
            <div className="flex bg-[#0a0f1d] rounded-xl border border-slate-800 p-1">
              <button 
                onClick={() => setActiveView('gallery')}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeView === 'gallery' ? 'bg-[#111827] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t("Galereya")}
              </button>
              <button 
                onClick={() => setActiveView('timeline')}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeView === 'timeline' ? 'bg-[#111827] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t("Taymlayn")}
              </button>
            </div>
          )}

          {activeView !== 'viewer' && activeView !== 'compare' && (
            <>
              <button
                onClick={() => exportPhotoGalleryPdf(patientName, filteredPhotos)}
                disabled={filteredPhotos.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-[#111827] hover:bg-[#1f2937] text-white border border-slate-800 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
              <button 
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                <Upload className="w-4 h-4" /> {t("Yuklash")}
              </button>
            </>
          )}

          {(activeView === 'viewer' || activeView === 'compare') && (
            <button 
              onClick={() => { setActiveView('gallery'); setSelectedPhoto(null); setComparePair(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#1f2937] text-white border border-slate-800 rounded-xl text-sm font-bold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Ortga qaytish
            </button>
          )}
        </div>
      </div>

      {activeView === 'gallery' && (
        <div className="flex flex-col h-full min-h-0">
          <div className="flex flex-wrap gap-4 mb-6 bg-[#0a0f1d] p-4 rounded-2xl border border-slate-800">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder={t("Qidirish (tish raqami, eslatma)...")} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
            <div className="min-w-[150px] relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none transition-colors appearance-none"
              >
                <option value="All">{t("Barcha toifalar")}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Before/After Pairs Section */}
          {pairs.length > 0 && !searchTerm && filterCategory === 'All' && (
            <div className="mb-8">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <SplitSquareHorizontal className="w-4 h-4" /> Oldin va Keyin
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pairs.map(pair => {
                  const beforePhoto = photos.find(p => p.id === pair.beforePhotoId);
                  const afterPhoto = photos.find(p => p.id === pair.afterPhotoId);
                  if (!beforePhoto || !afterPhoto) return null;
                  
                  return (
                    <div 
                      key={pair.id} 
                      onClick={() => openCompare(pair)}
                      className="group bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex h-32">
                        <div className="w-1/2 border-r border-slate-800 relative">
                          <img src={beforePhoto.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <span className="absolute bottom-1 left-1 bg-[#020712]/80 text-[10px] font-bold text-white px-1.5 py-0.5 rounded">{t("Oldin")}</span>
                        </div>
                        <div className="w-1/2 relative">
                          <img src={afterPhoto.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <span className="absolute bottom-1 right-1 bg-[#020712]/80 text-[10px] font-bold text-white px-1.5 py-0.5 rounded">{t("Keyin")}</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h5 className="font-bold text-white text-sm truncate">{pair.title}</h5>
                        <p className="text-xs text-slate-500">{new Date(pair.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">

            {PHASE_ORDER.map(stageGroup => {
              const phase = TREATMENT_PHASES.find(p => p.id === stageGroup)!;
              const stagePhotos = filteredPhotos.filter(p => (p.stage || "Boshqa") === stageGroup);
              if (stagePhotos.length === 0) return null;

              return (
                <div key={stageGroup} className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${phase.color}`} />
                    {t(phase.label)}
                    <span className="text-slate-600 normal-case font-medium">({stagePhotos.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {stagePhotos.map(photo => (
                      <div 
                        key={photo.id} 
                        className="group relative bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-colors"
                      >
                        <div className="h-40 bg-slate-900 relative" onClick={() => openViewer(photo)}>
                          <img src={photo.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            {photo.isPrivate && (
                              <span className="bg-[#020712]/80 text-rose-400 p-1 rounded-md border border-slate-700">
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                            <span className="bg-[#020712]/80 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700">
                              {photo.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-3 flex justify-between items-start">
                          <div>
                            <p className="text-white font-bold text-sm">{new Date(photo.date).toLocaleDateString()}</p>
                            {photo.toothNumber && (
                              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-1">
                                Tish: {photo.toothNumber}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {filteredPhotos.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                <ImageIcon className="w-12 h-12 mb-4 text-slate-700" />
                <p>{t("Hozircha fotosuratlar mavjud emas")}</p>
              </div>
            )}
          </div>
        </div>


      )}

      {activeView === 'timeline' && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="relative pl-4 md:pl-8 py-4 space-y-8 before:absolute before:inset-0 before:ml-[1.25rem] md:before:ml-[2.25rem] before:h-full before:w-0.5 before:bg-slate-800">
            {filteredPhotos.map(photo => (
              <div key={photo.id} className="relative flex items-start gap-4 md:gap-6">
                <div className="absolute left-0 w-3 h-3 bg-emerald-500 rounded-full mt-1.5 md:ml-1 ring-4 ring-[#020712] z-10"></div>
                <div className="flex-1 bg-[#0a0f1d] p-4 rounded-2xl border border-slate-800 flex gap-4 ml-4 md:ml-0 hover:border-emerald-500/50 transition-colors">
                  <div className="w-32 h-24 shrink-0 rounded-xl overflow-hidden cursor-pointer" onClick={() => openViewer(photo)}>
                     <img src={photo.url} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-emerald-500" /> {new Date(photo.date).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400 mb-2">{new Date(photo.date).toLocaleTimeString()}</span>
                    <div className="flex gap-2">
                       <span className="text-[10px] font-bold bg-[#111827] text-slate-300 px-2 py-1 rounded-md">{photo.category}</span>
                       {photo.toothNumber && (
                         <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">Tish: {photo.toothNumber}</span>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'viewer' && selectedPhoto && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center relative">
            <img src={selectedPhoto.url} className="max-w-full max-h-full object-contain" />
            <div className="absolute bottom-4 left-4 flex gap-2">
               <span className="bg-[#020712]/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700">
                 {selectedPhoto.category}
               </span>
               {selectedPhoto.toothNumber && (
                 <span className="bg-emerald-500/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500">
                   Tish: {selectedPhoto.toothNumber}
                 </span>
               )}
            </div>
          </div>
          <div className="w-full lg:w-[300px] bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 flex flex-col">
            <h4 className="font-bold text-white mb-4 border-b border-slate-800 pb-2">{t("Rasm ma'lumotlari")}</h4>
            
            <div className="space-y-4 mb-6">
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1">{t("Yuklangan sana")}</span>
                <p className="text-sm text-slate-300">{new Date(selectedPhoto.date).toLocaleString()}</p>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1">{t("Maxfiylik")}</span>
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  {selectedPhoto.isPrivate ? <><Lock className="w-4 h-4 text-rose-400" />{t("Faqat shifokorlar uchun")}</> : <><Unlock className="w-4 h-4 text-emerald-400" />{t("Bemor ko'rishi mumkin")}</>}
                </p>
              </div>
              {selectedPhoto.notes && (
                <div>
                  <span className="block text-xs font-bold text-slate-500 mb-1">{t("Eslatma")}</span>
                  <p className="text-sm text-slate-300 bg-[#111827] p-3 rounded-xl border border-slate-800">{selectedPhoto.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-2">
              <button
                onClick={() => handleLinkToChart(selectedPhoto)}
                disabled={isLinkingToChart}
                className="w-full py-2.5 bg-[#111827] hover:bg-[#1f2937] text-white rounded-xl text-sm font-bold border border-slate-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <Tag className="w-4 h-4" /> {isLinkingToChart ? "Bog'lanmoqda..." : "Dental Chartga bog'lash"}
              </button>
              <button 
                onClick={() => handleDelete(selectedPhoto.id)}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-sm font-bold border border-rose-500/20 transition-colors flex justify-center items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'compare' && comparePair && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="text-center mb-4">
            <h4 className="text-lg font-bold text-white">{comparePair.title}</h4>
            <p className="text-sm text-slate-500">{t("Solishtirish rejimi")}</p>
          </div>
          
          <div className="flex-1 bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden relative select-none">
            {(() => {
              const beforePhoto = photos.find(p => p.id === comparePair.beforePhotoId);
              const afterPhoto = photos.find(p => p.id === comparePair.afterPhotoId);
              if (!beforePhoto || !afterPhoto) return null;

              return (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div className="relative w-full max-w-4xl h-full max-h-[600px] bg-slate-900">
                    <img src={afterPhoto.url} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                    
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img src={beforePhoto.url} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                    </div>

                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-emerald-500 cursor-ew-resize flex items-center justify-center z-10"
                      style={{ left: `calc(${sliderPosition}% - 2px)` }}
                    >
                       <div className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-slate-800 border-2 border-emerald-500">
                         <SplitSquareHorizontal className="w-4 h-4" />
                       </div>
                    </div>
                    
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                    />

                    <div className="absolute top-4 left-4 bg-[#020712]/80 text-white px-3 py-1 rounded text-xs font-bold z-10 pointer-events-none">{t("Oldin")}</div>
                    <div className="absolute top-4 right-4 bg-emerald-500/80 text-white px-3 py-1 rounded text-xs font-bold z-10 pointer-events-none">{t("Keyin")}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/80 backdrop-blur-sm p-4">
          {/* This dialog is taller than a phone viewport; without the height cap
              and scroll, its submit button was completely unreachable. */}
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{t("Yangi foto yuklash")}</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <ImageDropzone
                previewUrl={previewUrl}
                isProcessing={isUploading}
                error={uploadError}
                maxSizeLabel={t("JPG, PNG")}
                onFile={handleFile}
                onClear={() => setPreviewUrl(null)}
                t={t}
              />

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Toifa")}</label>
                <select
                  value={uploadData.category}
                  onChange={e => setUploadData({...uploadData, category: e.target.value})}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="General">{t("Umumiy yuz")}</option>
                  <option value="Intraoral">{t("Intraoral")}</option>
                  <option value="Smile">{t("Tabassum")}</option>
                  <option value="Other">{t("Boshqa")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Muolaja bosqichi")}</label>
                <PhasePicker
                  value={(uploadData.stage || 'Oldin') as TreatmentPhase}
                  onChange={(stage) => setUploadData({ ...uploadData, stage })}
                  t={t}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Tishlar")}</label>
                <ToothPicker value={uploadTeeth} onChange={setUploadTeeth} t={t} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{t("Holat va kerakli muolaja")}</label>
                <textarea
                  rows={2}
                  value={uploadData.notes}
                  onChange={e => setUploadData({...uploadData, notes: e.target.value})}
                  placeholder={t("Masalan: 36-tishda chuqur karies, kanal davolash kerak")}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors resize-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="isPrivate"
                  checked={uploadData.isPrivate}
                  onChange={e => setUploadData({...uploadData, isPrivate: e.target.checked})}
                  className="w-4 h-4 rounded bg-[#111827] border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="isPrivate" className="text-sm font-bold text-slate-300">{t("Shaxsiy (Bemor ko'ra olmaydi)")}</label>
              </div>

              <div className="pt-4">
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
        </div>
      )}
    </div>
  );
}
