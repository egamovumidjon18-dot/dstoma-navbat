import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TreatmentItem } from '../components/TreatmentPlan';
import type { Photo } from '../components/PhotoGallery';
import type { Prescription } from '../components/Prescriptions';
import type { XRay, AIAnalysis } from '../components/XRayCenter';

function newDoc(title: string, patientName?: string): jsPDF {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Bemor: ${patientName || '-'}`, 14, 25);
  doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, 14, 30);
  doc.setTextColor(0);
  return doc;
}

function downloadDoc(doc: jsPDF, filenamePrefix: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${filenamePrefix}_${stamp}.pdf`);
}

export function exportTreatmentListPdf(patientName: string | undefined, items: TreatmentItem[]) {
  const doc = newDoc("Muolaja Tarixi", patientName);
  autoTable(doc, {
    startY: 36,
    head: [["Sana", "Muolaja", "Tish", "Shifokor", "Narx (so'm)"]],
    body: items.map((i) => [
      new Date(i.createdAt).toLocaleDateString('uz-UZ'),
      i.treatment,
      i.toothId || '-',
      i.doctorName,
      i.price.toLocaleString('uz-UZ'),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  downloadDoc(doc, 'muolaja_tarixi');
}

export function exportPhotoGalleryPdf(patientName: string | undefined, photos: Photo[]) {
  const doc = newDoc("Foto Galereya", patientName);
  let y = 38;
  const pageHeight = doc.internal.pageSize.getHeight();
  for (const photo of photos) {
    if (y + 70 > pageHeight) {
      doc.addPage();
      y = 18;
    }
    try {
      doc.addImage(photo.url, 'JPEG', 14, y, 60, 45);
    } catch {
      // Unsupported image encoding — skip the image, still list its metadata below.
    }
    doc.setFontSize(10);
    doc.text(`Sana: ${new Date(photo.date).toLocaleDateString('uz-UZ')}`, 80, y + 8);
    doc.text(`Turkum: ${photo.category}`, 80, y + 15);
    if (photo.toothNumber) doc.text(`Tish: ${photo.toothNumber}`, 80, y + 22);
    if (photo.notes) doc.text(`Eslatma: ${photo.notes}`, 80, y + 29);
    y += 55;
  }
  downloadDoc(doc, 'foto_galereya');
}

function buildPrescriptionDoc(patientName: string | undefined, p: Prescription): jsPDF {
  const doc = newDoc("Retsept", patientName);
  doc.setFontSize(11);
  doc.text(`Shifokor: ${p.doctorName}`, 14, 40);
  doc.text(`Sana: ${new Date(p.date).toLocaleDateString('uz-UZ')}`, 14, 46);
  doc.text(`Tashxis: ${p.diagnosis || '-'}`, 14, 52);
  autoTable(doc, {
    startY: 58,
    head: [["Dori", "Dozasi", "Chastotasi", "Muddati", "Eslatma"]],
    body: p.medications.map((m) => [m.name, m.dosage, m.frequency, m.duration, m.notes || '-']),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  return doc;
}

export function exportPrescriptionPdf(patientName: string | undefined, p: Prescription) {
  downloadDoc(buildPrescriptionDoc(patientName, p), `retsept_${p.id}`);
}

export function printPrescriptionPdf(patientName: string | undefined, p: Prescription) {
  const doc = buildPrescriptionDoc(patientName, p);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

export function exportPrescriptionsListPdf(patientName: string | undefined, prescriptions: Prescription[]) {
  const doc = newDoc(patientName ? "Retseptlar" : "Barcha retseptlar", patientName);
  autoTable(doc, {
    startY: 36,
    head: [["Sana", "Bemor", "Shifokor", "Tashxis", "Dorilar soni", "Holati"]],
    body: prescriptions.map((p) => [
      new Date(p.date).toLocaleDateString('uz-UZ'),
      patientName || p.patientId,
      p.doctorName,
      p.diagnosis || '-',
      String(p.medications.length),
      p.status === 'Active' ? 'Faol' : 'Yakunlangan',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  downloadDoc(doc, 'retseptlar');
}

export function exportXrayReportPdf(patientName: string | undefined, xray: XRay, analysis: AIAnalysis | null) {
  const doc = newDoc("Rentgen Hisoboti", patientName);
  doc.setFontSize(11);
  doc.text(`Turi: ${xray.type}`, 14, 40);
  doc.text(`Sana: ${new Date(xray.date).toLocaleDateString('uz-UZ')}`, 14, 46);
  doc.text(`Holati: ${xray.status}`, 14, 52);
  try {
    doc.addImage(xray.url, 'JPEG', 14, 58, 90, 68);
  } catch {
    // Unsupported image encoding — skip embedding, report still lists findings below.
  }
  let y = 58;
  if (analysis) {
    doc.setFontSize(12);
    doc.text(`AI Xulosasi (ishonch: ${analysis.overallConfidence}%)`, 112, y + 6);
    autoTable(doc, {
      startY: y + 12,
      margin: { left: 112 },
      tableWidth: 84,
      head: [["Topilma", "Tish", "%"]],
      body: analysis.findings.map((f) => [f.description, f.toothNumber || '-', String(f.confidence)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });
  }
  downloadDoc(doc, `rentgen_hisobot_${xray.id}`);
}

export function exportTreatmentRecordPdf(patientName: string | undefined, item: TreatmentItem) {
  const doc = newDoc("Muolaja Tafsiloti", patientName);
  autoTable(doc, {
    startY: 36,
    body: [
      ["Sana", new Date(item.createdAt).toLocaleDateString('uz-UZ')],
      ["Muolaja", item.treatment],
      ["Tish raqami", item.toothId || '-'],
      ["Shifokor", item.doctorName],
      ["Narx", `${item.price.toLocaleString('uz-UZ')} so'm`],
      ["Holati", item.status],
    ],
    styles: { fontSize: 10 },
    theme: 'plain',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
  });
  downloadDoc(doc, `muolaja_${item.id}`);
}
