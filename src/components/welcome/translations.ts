// Welcome-screen copy. Kept separate from the app-wide TRANSLATIONS dictionary
// because this screen is the pre-login marketing surface — its strings are
// full sentences written for the brand, not the short UI labels used inside
// the dashboards.
//
// Covers every locale the platform ships (see Language in src/translations.ts),
// so switching language on the welcome screen never drops a visitor back to a
// half-translated page.

import type { Language } from '../../translations';

export interface WelcomeCopy {
  brandTagline: string;
  titlePre: string;
  titleHighlight: string;
  titlePost: string;
  description: string;
  features: { title: string; description: string }[];
  register: string;
  login: string;
  security: string;
  languageLabel: string;
}

export const WELCOME_TRANSLATIONS: Record<Language, WelcomeCopy> = {
  uz: {
    brandTagline: 'STOMATOLOGIYA PLATFORMASI',
    titlePre: 'Sog‘lom tabassum uchun ',
    titleHighlight: 'zamonaviy',
    titlePost: ' yechim',
    description:
      'Bemorlar uchun qulay navbat, doktorlar uchun samarali boshqaruv tizimi.',
    features: [
      { title: 'Online navbat', description: 'Navbatni oson va tez bron qiling' },
      { title: 'AI tahlil', description: 'Sun’iy intellekt yordamida tish holatini baholang' },
      { title: 'Klinika topish', description: 'Yaqin klinikalarni xaritada oson toping' },
    ],
    register: 'Ro‘yxatdan o‘tish',
    login: 'Kirish',
    security: 'Ma’lumotlaringiz xavfsiz va ishonchli',
    languageLabel: 'Tilni tanlash',
  },

  ru: {
    brandTagline: 'СТОМАТОЛОГИЧЕСКАЯ ПЛАТФОРМА',
    titlePre: 'Здоровая улыбка — ',
    titleHighlight: 'современное',
    titlePost: ' решение',
    description:
      'Удобная очередь для пациентов, эффективная система управления для врачей.',
    features: [
      { title: 'Онлайн очередь', description: 'Бронируйте очередь легко и быстро' },
      { title: 'AI анализ', description: 'Оцените состояние зубов с помощью искусственного интеллекта' },
      { title: 'Поиск клиники', description: 'Легко находите ближайшие клиники на карте' },
    ],
    register: 'Регистрация',
    login: 'Вход',
    security: 'Ваши данные защищены и надёжны',
    languageLabel: 'Выбор языка',
  },

  en: {
    brandTagline: 'STOMATOLOGY PLATFORM',
    titlePre: 'Healthy smile with a ',
    titleHighlight: 'modern',
    titlePost: ' solution',
    description:
      'Convenient queueing for patients, an efficient management system for doctors.',
    features: [
      { title: 'Online queue', description: 'Book your appointment easily and quickly' },
      { title: 'AI analysis', description: 'Assess dental health with artificial intelligence' },
      { title: 'Find a clinic', description: 'Easily find nearby clinics on the map' },
    ],
    register: 'Sign up',
    login: 'Log in',
    security: 'Your data is safe and secure',
    languageLabel: 'Select language',
  },

  kk: {
    brandTagline: 'СТОМАТОЛОГИЯ ПЛАТФОРМАСЫ',
    titlePre: 'Сау күлкі үшін ',
    titleHighlight: 'заманауи',
    titlePost: ' шешім',
    description:
      'Пациенттер үшін ыңғайлы кезек, дәрігерлер үшін тиімді басқару жүйесі.',
    features: [
      { title: 'Онлайн кезек', description: 'Кезекті оңай әрі жылдам брондаңыз' },
      { title: 'AI талдау', description: 'Жасанды интеллект көмегімен тіс жағдайын бағалаңыз' },
      { title: 'Клиника табу', description: 'Жақын клиникаларды картадан оңай табыңыз' },
    ],
    register: 'Тіркелу',
    login: 'Кіру',
    security: 'Деректеріңіз қауіпсіз және сенімді',
    languageLabel: 'Тілді таңдау',
  },

  ky: {
    brandTagline: 'СТОМАТОЛОГИЯ ПЛАТФОРМАСЫ',
    titlePre: 'Соо жылмаюу үчүн ',
    titleHighlight: 'заманбап',
    titlePost: ' чечим',
    description:
      'Бейтаптар үчүн ыңгайлуу кезек, дарыгерлер үчүн натыйжалуу башкаруу системасы.',
    features: [
      { title: 'Онлайн кезек', description: 'Кезекти оңой жана тез брондоңуз' },
      { title: 'AI талдоо', description: 'Жасалма интеллект жардамы менен тиш абалын баалаңыз' },
      { title: 'Клиника табуу', description: 'Жакынкы клиникаларды картадан оңой табыңыз' },
    ],
    register: 'Каттоо',
    login: 'Кирүү',
    security: 'Маалыматтарыңыз коопсуз жана ишенимдүү',
    languageLabel: 'Тилди тандоо',
  },

  tg: {
    brandTagline: 'ПЛАТФОРМАИ СТОМАТОЛОГӢ',
    titlePre: 'Барои табассуми солим ҳалли ',
    titleHighlight: 'муосир',
    titlePost: '',
    description:
      'Навбати қулай барои беморон, низоми идоракунии самаранок барои духтурон.',
    features: [
      { title: 'Навбати онлайн', description: 'Навбатро осон ва зуд банд кунед' },
      { title: 'Таҳлили AI', description: 'Бо ёрии зеҳни сунъӣ ҳолати дандонро баҳо диҳед' },
      { title: 'Ёфтани клиника', description: 'Клиникаҳои наздикро дар харита осон ёбед' },
    ],
    register: 'Сабти ном',
    login: 'Ворид шудан',
    security: 'Маълумоти шумо бехатар ва боэътимод аст',
    languageLabel: 'Интихоби забон',
  },

  tk: {
    brandTagline: 'STOMATOLOGIÝA PLATFORMASY',
    titlePre: 'Sagdyn ýylgyryş üçin ',
    titleHighlight: 'döwrebap',
    titlePost: ' çözgüt',
    description:
      'Näsaglar üçin amatly nobat, lukmanlar üçin netijeli dolandyryş ulgamy.',
    features: [
      { title: 'Onlaýn nobat', description: 'Nobaty aňsat we çalt bronlaň' },
      { title: 'AI seljerme', description: 'Emeli aň kömegi bilen diş ýagdaýyny bahalaň' },
      { title: 'Klinika tapmak', description: 'Ýakyn klinikalary kartada aňsat tapyň' },
    ],
    register: 'Hasaba durmak',
    login: 'Girmek',
    security: 'Maglumatlaryňyz howpsuz we ygtybarly',
    languageLabel: 'Dili saýlamak',
  },
};

export const getWelcomeCopy = (lang: Language): WelcomeCopy =>
  WELCOME_TRANSLATIONS[lang] ?? WELCOME_TRANSLATIONS.uz;
