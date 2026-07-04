import { uz } from './translations/uz';
import { ru } from './translations/ru';
import { en } from './translations/en';
import { kk } from './translations/kk';
import { ky } from './translations/ky';
import { tg } from './translations/tg';
import { tk } from './translations/tk';

export type Language = 'uz' | 'ru' | 'en' | 'kk' | 'ky' | 'tg' | 'tk';

export const TRANSLATIONS = {
  uz,
  ru,
  en,
  kk,
  ky,
  tg,
  tk
};

type MedicalLang = 'ru' | 'en' | 'kk' | 'ky' | 'tg' | 'tk';

const medicalDict: Record<string, Record<MedicalLang, string>> = {
  // Categories
  "Diagnostika": { ru: "Диагностика", en: "Diagnostics", kk: "Диагностика", ky: "Диагностика", tg: "Ташхис", tk: "Diagnostika" },
  "Terapevtik stomatologiya": { ru: "Терапевтическая стоматология", en: "Therapeutic Dentistry", kk: "Терапиялық стоматология", ky: "Терапиялык стоматология", tg: "Стоматологияи табобатӣ", tk: "Terapewtik stomatologiýa" },
  "Tishlarni oqartirish": { ru: "Отбеливание зубов", en: "Teeth Whitening", kk: "Тісті ағарту", ky: "Тиштерди агартуу", tg: "Сафедкунии дандонҳо", tk: "Diş ýagtylandyrmak" },
  "Vinirlar": { ru: "Виниры", en: "Veneers", kk: "Винирлер", ky: "Винирлер", tg: "Винирҳо", tk: "Wenirler" },
  "Xirurgiya": { ru: "Хирургия", en: "Surgery", kk: "Хирургия", ky: "Хирургия", tg: "Ҷарроҳӣ", tk: "Hirurgiýa" },
  "Protezlash": { ru: "Протезирование", en: "Prosthetics", kk: "Протездеу", ky: "Протездөө", tg: "Протезгузорӣ", tk: "Protezirlemek" },
  "Ortodontiya": { ru: "Ортодонтия", en: "Orthodontics", kk: "Ортодонтия", ky: "Ортодонтия", tg: "Ортодонтия", tk: "Ortodontiýa" },
  "Bolalar stomatologiyasi": { ru: "Детская стоматология", en: "Pediatric Dentistry", kk: "Балалар стоматологиясы", ky: "Балдар стоматологиясы", tg: "Стоматологияи кӯдакон", tk: "Çaga stomatologiýasy" },
  "Implantatsiya": { ru: "Имплантация", en: "Implantation", kk: "Имплантация", ky: "Имплантация", tg: "Имплантатсия", tk: "Implantasiýa" },
  "Profilaktika": { ru: "Профилактика", en: "Prevention", kk: "Алдын алу", ky: "Алдын алуу", tg: "Пешгирӣ", tk: "Öňüni alyş" },
  "Boshqa xizmatlar": { ru: "Другие услуги", en: "Other Services", kk: "Басқа қызметтер", ky: "Башка кызматтар", tg: "Хизматрасониҳои дигар", tk: "Beýleki hyzmatlar" },

  // Services & Common terms
  "Konsultatsiya": { ru: "Консультация", en: "Consultation", kk: "Кеңес беру", ky: "Кеңеш берүү", tg: "Машварат", tk: "Maslahat" },
  "Tish tozalash": { ru: "Чистка зубов", en: "Teeth Cleaning", kk: "Тіс тазалау", ky: "Тиш тазалоо", tg: "Тозакунии дандон", tk: "Diş arassalamak" },
  "Plomba qo'yish": { ru: "Установка пломбы", en: "Dental Filling", kk: "Пломба қою", ky: "Пломба коюу", tg: "Гузоштани пломба", tk: "Plomba goýmak" },
  "Tish sug'urish": { ru: "Удаление зуба", en: "Tooth Extraction", kk: "Тіс жұлу", ky: "Тиш жулуу", tg: "Кашидани дандон", tk: "Diş aýyrmak" },
  "«Unisem» sementi": { ru: "Цемент «Unisem»", en: "«Unisem» Cement", kk: "«Unisem» цементі", ky: "«Unisem» цементи", tg: "Сементи «Unisem»", tk: "«Unisem» sementi" },
  "1 ta kanalni qayta ochish (Re ENDO)": { ru: "Перелечивание 1 канала (Re ENDO)", en: "Retreatment of 1 canal (Re ENDO)", kk: "1 арнаны қайта емдеу (Re ENDO)", ky: "1 каналды кайра дарылоо (Re ENDO)", tg: "Аз нав табобати 1 канал (Re ENDO)", tk: "1 kanaly gaýtadan bejermek (Re ENDO)" },
  "3 ta kanalni qayta ochish (Re ENDO)": { ru: "Перелечивание 3 каналов (Re ENDO)", en: "Retreatment of 3 canals (Re ENDO)", kk: "3 арнаны қайта емдеу (Re ENDO)", ky: "3 каналды кайра дарылоо (Re ENDO)", tg: "Аз нав табобати 3 канал (Re ENDO)", tk: "3 kanaly gaýtadan bejermek (Re ENDO)" },
  "Air Flow usulida tozalash": { ru: "Чистка методом Air Flow", en: "Air Flow Cleaning", kk: "Air Flow әдісімен тазалау", ky: "Air Flow ыкмасы менен тазалоо", tg: "Тозакунӣ бо усули Air Flow", tk: "Air Flow usulynda arassalamak" },
  "Air Flow yordamida tishlarni tozalash (bitta jag')": { ru: "Чистка Air Flow (одна челюсть)", en: "Air Flow Cleaning (single jaw)", kk: "Air Flow көмегімен тіс тазалау (бір жақ)", ky: "Air Flow жардамында тиш тазалоо (бир жаак)", tg: "Тозакунии дандон бо Air Flow (як фак)", tk: "Air Flow bilen diş arassalamak (bir äň)" },
  "Akril protez o'rnatish": { ru: "Установка акрилового протеза", en: "Acrylic Prosthesis Placement", kk: "Акрил протезін орнату", ky: "Акрил протезин орнотуу", tg: "Гузоштани протези акрилӣ", tk: "Akril protez oturtmak" },
  "All-on-4 implant tizimi o'rnatish": { ru: "Установка системы имплантов All-on-4", en: "All-on-4 Implant System Placement", kk: "All-on-4 имплант жүйесін орнату", ky: "All-on-4 имплант системасын орнотуу", tg: "Гузоштани системаи имплантҳои All-on-4", tk: "All-on-4 implant ulgamyny oturtmak" },
  "Alpha Bio implanti o'rnatish": { ru: "Установка импланта Alpha Bio", en: "Alpha Bio Implant Placement", kk: "Alpha Bio имплантын орнату", ky: "Alpha Bio имплантын орнотуу", tg: "Гузоштани имплантҳои Alpha Bio", tk: "Alpha Bio implant oturtmak" },
  "Amazing White oqartirish tizimi": { ru: "Система отбеливания Amazing White", en: "Amazing White Whitening System", kk: "Amazing White ағарту жүйесі", ky: "Amazing White агартуу системасы", tg: "Системаи сафедкунии Amazing White", tk: "Amazing White ýagtylandyryş ulgamy" },
  "Osstem implanti o'rnatish": { ru: "Установка импланта Osstem", en: "Osstem Implant Placement", kk: "Osstem имплантын орнату", ky: "Osstem имплантын орнотуу", tg: "Гузоштани импланти Osstem", tk: "Osstem implant oturtmak" },
  "Straumann implanti o'rnatish": { ru: "Установка импланта Straumann", en: "Straumann Implant Placement", kk: "Straumann имплантын орнату", ky: "Straumann имплантын орнотуу", tg: "Гузоштани импланти Straumann", tk: "Straumann implant oturtmak" },
  "Kariesni davolash": { ru: "Лечение кариеса", en: "Caries Treatment", kk: "Кариесті емдеу", ky: "Кариести дарылоо", tg: "Табобати кариес", tk: "Kariesi bejermek" },
  "Pulpitni davolash": { ru: "Лечение пульпита", en: "Pulpitis Treatment", kk: "Пульпитті емдеу", ky: "Пульпитти дарылоо", tg: "Табобати пульпит", tk: "Pulpiti bejermek" },
  "Tish rentgen (snimka)": { ru: "Рентген зуба (снимок)", en: "Dental X-ray", kk: "Тіс рентгені (сурет)", ky: "Тиш рентгени (сүрөт)", tg: "Рентгени дандон (сурат)", tk: "Diş rentgeni (surat)" },
  "Bregatlar o'rnatish": { ru: "Установка брекетов", en: "Braces Installation", kk: "Брекет орнату", ky: "Брекет орнотуу", tg: "Гузоштани брекетҳо", tk: "Breket oturtmak" }
};

export function translateMedicalText(text: string, lang: Language): string {
  if (lang === 'uz' || !text) return text;

  // Exact match
  if (medicalDict[text] && medicalDict[text][lang as MedicalLang]) {
    return medicalDict[text][lang as MedicalLang];
  }

  // Fuzzy replace common words (super simple fallback)
  let translated = text;
  const wordTables: Record<MedicalLang, Record<string, string>> = {
    ru: { "o'rnatish": "установка", "tozalash": "чистка", "oqartirish": "отбеливание", "sementi": "цемент", "davolash": "лечение", "tizimi": "система" },
    en: { "o'rnatish": "placement", "tozalash": "cleaning", "oqartirish": "whitening", "sementi": "cement", "davolash": "treatment", "tizimi": "system" },
    kk: { "o'rnatish": "орнату", "tozalash": "тазалау", "oqartirish": "ағарту", "sementi": "цементі", "davolash": "емдеу", "tizimi": "жүйесі" },
    ky: { "o'rnatish": "орнотуу", "tozalash": "тазалоо", "oqartirish": "агартуу", "sementi": "цементи", "davolash": "дарылоо", "tizimi": "системасы" },
    tg: { "o'rnatish": "гузоштани", "tozalash": "тозакунии", "oqartirish": "сафедкунии", "sementi": "сементи", "davolash": "табобати", "tizimi": "системаи" },
    tk: { "o'rnatish": "oturtmak", "tozalash": "arassalamak", "oqartirish": "ýagtylandyrmak", "sementi": "sementi", "davolash": "bejermek", "tizimi": "ulgamy" },
  };
  const wordT = wordTables[lang as MedicalLang] || wordTables.en;

  for (const [key, val] of Object.entries(wordT)) {
    const r = new RegExp(`\\b${key}\\b`, 'gi');
    translated = translated.replace(r, val);
  }

  return translated;
}