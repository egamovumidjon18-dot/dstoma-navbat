import React, { useRef, useState } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
import { compressImage, ImageTooLargeError, ImageUnreadableError } from '../utils/imageCompressor';

// Shared upload controls for XRayCenter and PhotoGallery. Both used to declare
// their own copy of the stage enum, their own dropzone (whose "drop it here"
// copy did nothing, because no drop handlers were ever written), and their own
// silent failure path.

/**
 * When the image was taken, relative to the treatment. Both XRay and Photo
 * already stored exactly these literals, so this is a shared type over existing
 * data rather than a migration.
 */
export type TreatmentPhase = 'Oldin' | 'Jarayon' | 'Keyin' | 'Boshqa';

export const TREATMENT_PHASES: { id: TreatmentPhase; label: string; hint: string; color: string }[] = [
  { id: 'Oldin', label: 'Muolajadan oldin', hint: 'Boshlang\'ich holat', color: 'bg-amber-500' },
  { id: 'Jarayon', label: 'Muolaja jarayonida', hint: 'Davolash davomida', color: 'bg-blue-500' },
  { id: 'Keyin', label: 'Muolajadan keyin', hint: 'Yakuniy natija', color: 'bg-emerald-500' },
  { id: 'Boshqa', label: 'Boshqa', hint: 'Turkumlanmagan', color: 'bg-slate-400' },
];

export const PHASE_ORDER: TreatmentPhase[] = ['Oldin', 'Jarayon', 'Keyin', 'Boshqa'];

// FDI permanent dentition, in the order they sit in the mouth.
const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

interface PhasePickerProps {
  value: TreatmentPhase;
  onChange: (phase: TreatmentPhase) => void;
  t?: (s: string) => string;
}

/** Explicit before / during / after choice, rather than a bare dropdown. */
export function PhasePicker({ value, onChange, t = (s) => s }: PhasePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TREATMENT_PHASES.map((phase) => {
        const active = value === phase.id;
        return (
          <button
            key={phase.id}
            type="button"
            onClick={() => onChange(phase.id)}
            className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
              active ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${phase.color}`} />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-white leading-tight truncate">{t(phase.label)}</span>
              <span className="block text-[10px] text-slate-400 leading-tight truncate">{t(phase.hint)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface ToothPickerProps {
  value: string[];
  onChange: (teeth: string[]) => void;
  t?: (s: string) => string;
}

/**
 * FDI tooth picker, multi-select because a panoramic or CBCT covers many teeth.
 * Replaces the free-text field whose value was used directly as a Firestore
 * document id — a stray space or slash there produced a broken path.
 */
export function ToothPicker({ value, onChange, t = (s) => s }: ToothPickerProps) {
  const [open, setOpen] = useState(false);
  const toggle = (n: number) => {
    const id = String(n);
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const Row = ({ teeth }: { teeth: number[] }) => (
    <div className="flex gap-0.5 justify-center flex-wrap">
      {teeth.map((n) => {
        const active = value.includes(String(n));
        return (
          <button
            key={n}
            type="button"
            onClick={() => toggle(n)}
            className={`w-7 h-7 rounded text-[10px] font-bold transition-colors ${
              active ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
      >
        <span className={value.length ? 'text-white' : 'text-slate-500'}>
          {value.length ? value.join(', ') : t('Tishni tanlang')}
        </span>
        <span className="text-[10px] text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded-xl space-y-1.5">
          <Row teeth={FDI_UPPER} />
          <div className="h-px bg-slate-700 my-1" />
          <Row teeth={FDI_LOWER} />
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-[10px] font-bold text-rose-400 hover:text-rose-300 pt-1"
            >
              {t('Tozalash')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface DropzoneProps {
  previewUrl: string | null;
  isProcessing: boolean;
  error: string | null;
  maxSizeLabel: string;
  onFile: (file: File) => void;
  onClear: () => void;
  t?: (s: string) => string;
}

/** Click-or-drop file area. The drop half was advertised but never implemented. */
export function ImageDropzone({
  previewUrl, isProcessing, error, maxSizeLabel, onFile, onClear, t = (s) => s,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); take(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          dragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        {previewUrl ? (
          <div className="relative">
            <img src={previewUrl} alt="" className="max-h-40 mx-auto rounded-lg" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-1 right-1 p-1 bg-slate-900/80 rounded-full text-slate-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-7 h-7 mx-auto mb-2 text-slate-500" />
            <p className="text-xs text-slate-400 font-medium">
              {isProcessing ? t('Ishlanmoqda...') : t('Faylni tanlang yoki shu yerga tashlang')}
            </p>
            <p className="text-[10px] text-slate-600 mt-1">{maxSizeLabel}</p>
          </>
        )}
        {/* .dcm is deliberately not accepted: the browser cannot decode DICOM,
            so offering it only ever produced a confusing failure. */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => take(e.target.files)}
          className="hidden"
        />
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-300 font-medium leading-snug">{error}</p>
        </div>
      )}
    </div>
  );
}

/** Turns a compression failure into something a doctor can act on. */
export function describeUploadError(err: unknown, t: (s: string) => string = (s) => s): string {
  if (err instanceof ImageTooLargeError) {
    return t("Rasm hajmi juda katta — uni kichraytirib yoki sifatini pasaytirib qayta yuklang.");
  }
  if (err instanceof ImageUnreadableError) {
    return t("Bu fayl formatini o'qib bo'lmadi. JPG yoki PNG yuklang (DICOM qo'llab-quvvatlanmaydi).");
  }
  return t("Yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
}

export { compressImage };
