import { uz } from './translations/uz';
import { ru } from './translations/ru';
import { en } from './translations/en';

export type Language = 'uz' | 'ru' | 'en';

export const TRANSLATIONS = {
  uz,
  ru,
  en
};

const medicalDict: Record<string, Record<'ru' | 'en', string>> = {
  // Categories
  "Diagnostika": { ru: "Диагностика", en: "Diagnostics" },
  "Terapevtik stomatologiya": { ru: "Терапевтическая стоматология", en: "Therapeutic Dentistry" },
  "Tishlarni oqartirish": { ru: "Отбеливание зубов", en: "Teeth Whitening" },
  "Vinirlar": { ru: "Виниры", en: "Veneers" },
  "Xirurgiya": { ru: "Хирургия", en: "Surgery" },
  "Protezlash": { ru: "Протезирование", en: "Prosthetics" },
  "Ortodontiya": { ru: "Ортодонтия", en: "Orthodontics" },
  "Bolalar stomatologiyasi": { ru: "Детская стоматология", en: "Pediatric Dentistry" },
  "Implantatsiya": { ru: "Имплантация", en: "Implantation" },
  "Profilaktika": { ru: "Профилактика", en: "Prevention" },
  "Boshqa xizmatlar": { ru: "Другие услуги", en: "Other Services" },
  
  // Services & Common terms
  "Konsultatsiya": { ru: "Консультация", en: "Consultation" },
  "Tish tozalash": { ru: "Чистка зубов", en: "Teeth Cleaning" },
  "Plomba qo'yish": { ru: "Установка пломбы", en: "Dental Filling" },
  "Tish sug'urish": { ru: "Удаление зуба", en: "Tooth Extraction" },
  "«Unisem» sementi": { ru: "Цемент «Unisem»", en: "«Unisem» Cement" },
  "1 ta kanalni qayta ochish (Re ENDO)": { ru: "Перелечивание 1 канала (Re ENDO)", en: "Retreatment of 1 canal (Re ENDO)" },
  "3 ta kanalni qayta ochish (Re ENDO)": { ru: "Перелечивание 3 каналов (Re ENDO)", en: "Retreatment of 3 canals (Re ENDO)" },
  "Air Flow usulida tozalash": { ru: "Чистка методом Air Flow", en: "Air Flow Cleaning" },
  "Air Flow yordamida tishlarni tozalash (bitta jag')": { ru: "Чистка Air Flow (одна челюсть)", en: "Air Flow Cleaning (single jaw)" },
  "Akril protez o'rnatish": { ru: "Установка акрилового протеза", en: "Acrylic Prosthesis Placement" },
  "All-on-4 implant tizimi o'rnatish": { ru: "Установка системы имплантов All-on-4", en: "All-on-4 Implant System Placement" },
  "Alpha Bio implanti o'rnatish": { ru: "Установка импланта Alpha Bio", en: "Alpha Bio Implant Placement" },
  "Amazing White oqartirish tizimi": { ru: "Система отбеливания Amazing White", en: "Amazing White Whitening System" },
  "Osstem implanti o'rnatish": { ru: "Установка импланта Osstem", en: "Osstem Implant Placement" },
  "Straumann implanti o'rnatish": { ru: "Установка импланта Straumann", en: "Straumann Implant Placement" },
  "Kariesni davolash": { ru: "Лечение кариеса", en: "Caries Treatment" },
  "Pulpitni davolash": { ru: "Лечение пульпита", en: "Pulpitis Treatment" },
  "Tish rentgen (snimka)": { ru: "Рентген зуба (снимок)", en: "Dental X-ray" },
  "Bregatlar o'rnatish": { ru: "Установка брекетов", en: "Braces Installation" }
};

export function translateMedicalText(text: string, lang: Language): string {
  if (lang === 'uz' || !text) return text;
  
  // Exact match
  if (medicalDict[text] && medicalDict[text][lang as 'ru'|'en']) {
    return medicalDict[text][lang as 'ru'|'en'];
  }
  
  // Fuzzy replace common words (super simple fallback)
  let translated = text;
  const wordT = lang === 'ru' ? {
    "o'rnatish": "установка",
    "tozalash": "чистка",
    "oqartirish": "отбеливание",
    "sementi": "цемент",
    "davolash": "лечение",
    "tizimi": "система"
  } : {
    "o'rnatish": "placement",
    "tozalash": "cleaning",
    "oqartirish": "whitening",
    "sementi": "cement",
    "davolash": "treatment",
    "tizimi": "system"
  };
  
  for (const [key, val] of Object.entries(wordT)) {
    const r = new RegExp(`\\b${key}\\b`, 'gi');
    translated = translated.replace(r, val);
  }
  
  return translated;
}