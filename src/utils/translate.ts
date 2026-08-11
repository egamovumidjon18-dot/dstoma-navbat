import { TRANSLATIONS, Language } from "../translations";

/**
 * One entry per translatable phrase. Uzbek is the key itself, so a missing
 * entry degrades to readable Uzbek rather than to a raw key like "btn.save".
 */
export interface DictEntry {
  ru: string;
  en: string;
  kk: string;
  ky: string;
  tg: string;
  tk: string;
}

export type Dict = Record<string, DictEntry>;

/**
 * Builds the `t()` used across the app. Several components each carried their
 * own byte-identical copy of this lookup, and the clinical tabs (materials,
 * prescriptions, treatment plan, photos, history, x-ray, procedures) had none
 * at all — which is why switching language changed the shell but left their
 * contents in Uzbek.
 *
 * Resolution order: the shared app-wide dictionary first, then the component's
 * own dictionary (matched case/whitespace-insensitively), then the original
 * text. On Uzbek the text is returned sentence-cased, since dictionary keys are
 * written lowercase for matching but the UI shows them capitalized.
 */
export function createTranslator(language: Language | undefined, dict: Dict = {}) {
  const localLang: keyof DictEntry | null =
    language === "ru" || language === "en" || language === "kk" ||
    language === "ky" || language === "tg" || language === "tk"
      ? language
      : null;

  return (text: string): string => {
    if (!language || !text) return text;

    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof (typeof TRANSLATIONS)["uz"]];
    }

    const cleanText = text.trim().toLowerCase().replace(/\s+/g, " ");
    const entry = dict[cleanText] || dict[text];
    if (entry) {
      if (localLang) return entry[localLang];
      // Uzbek: restore the sentence-case the UI expects, skipping any leading emoji.
      const idx = text.search(/[a-zA-Zʻʼ'’]/);
      if (idx === -1) return text;
      return text.slice(0, idx) + text.charAt(idx).toUpperCase() + text.slice(idx + 1);
    }

    return text;
  };
}
