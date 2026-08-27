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
  // The standard procedure catalog, in full. Only a handful of these were
  // here before, so most procedure names stayed Uzbek whatever language the
  // clinic had chosen.
  "Tish rentgeni": { ru: "Рентген зуба", en: "Dental X-ray", kk: "Тіс рентгені", ky: "Тиш рентгени", tg: "Рентгени дандон", tk: "Diş rentgeni" },
  "Pulpitni davolash (1 ta ildiz kanali)": { ru: "Лечение пульпита (1 корневой канал)", en: "Pulpitis treatment (1 root canal)", kk: "Пульпитті емдеу (1 түбір арнасы)", ky: "Пульпитти дарылоо (1 тамыр каналы)", tg: "Табобати пульпит (1 канали реша)", tk: "Pulpiti bejermek (1 kök kanaly)" },
  "Pulpitni davolash (2 ta ildiz kanali)": { ru: "Лечение пульпита (2 корневых канала)", en: "Pulpitis treatment (2 root canals)", kk: "Пульпитті емдеу (2 түбір арнасы)", ky: "Пульпитти дарылоо (2 тамыр каналы)", tg: "Табобати пульпит (2 канали реша)", tk: "Pulpiti bejermek (2 kök kanaly)" },
  "Pulpitni davolash (3 ta ildiz kanali)": { ru: "Лечение пульпита (3 корневых канала)", en: "Pulpitis treatment (3 root canals)", kk: "Пульпитті емдеу (3 түбір арнасы)", ky: "Пульпитти дарылоо (3 тамыр каналы)", tg: "Табобати пульпит (3 канали реша)", tk: "Pulpiti bejermek (3 kök kanaly)" },
  "Kompozit plomba": { ru: "Композитная пломба", en: "Composite filling", kk: "Композиттік пломба", ky: "Композиттик пломба", tg: "Пломбаи композитӣ", tk: "Kompozit plomba" },
  "Nurli (svetovaya) plomba": { ru: "Световая пломба", en: "Light-cured filling", kk: "Жарық пломба", ky: "Жарык пломба", tg: "Пломбаи нурӣ", tk: "Ýagtylyk plombasy" },
  "Shloionomerli sement": { ru: "Стеклоиономерный цемент", en: "Glass ionomer cement", kk: "Шыны иономер цементі", ky: "Айнек иономер цементи", tg: "Сементи шишаиономерӣ", tk: "Aýna ionomer sementi" },
  "Tishlarni o'stirish (badiiy restavratsiya)": { ru: "Наращивание зубов (художественная реставрация)", en: "Tooth build-up (aesthetic restoration)", kk: "Тіс өсіру (көркем реставрация)", ky: "Тиш өстүрүү (көркөм реставрация)", tg: "Афзоиши дандон (реставратсияи бадеӣ)", tk: "Diş ösdürmek (çeper dikeldiş)" },
  "Stomatitni davolash": { ru: "Лечение стоматита", en: "Stomatitis treatment", kk: "Стоматитті емдеу", ky: "Стоматитти дарылоо", tg: "Табобати стоматит", tk: "Stomatiti bejermek" },
  "Otok (yiring haydash/drenaj)": { ru: "Отёк (дренаж гноя)", en: "Swelling (abscess drainage)", kk: "Ісік (іріңді дренаждау)", ky: "Шишик (ириңди дренаждоо)", tg: "Варам (дренажи фасод)", tk: "Çiş (iriň drenažy)" },
  "Pulposeptin": { ru: "Пульпосептин", en: "Pulposeptine", kk: "Пульпосептин", ky: "Пульпосептин", tg: "Пулпосептин", tk: "Pulposeptin" },
  "Kalsiy saqlovchi pasta": { ru: "Кальцийсодержащая паста", en: "Calcium-containing paste", kk: "Кальций құрамды паста", ky: "Кальций камтыган паста", tg: "Хамираи дорои калсий", tk: "Kalsiý saklaýan pasta" },
  "Kanaldan asbob siniqlarini olib tashlash (bitta kanal)": { ru: "Извлечение обломка инструмента из канала (один канал)", en: "Removal of a broken instrument from a canal (one canal)", kk: "Арнадан құрал сынығын алу (бір арна)", ky: "Каналдан аспап сыныгын алуу (бир канал)", tg: "Баровардани пораи асбоб аз канал (як канал)", tk: "Kanaldan gural bölegini aýyrmak (bir kanal)" },
  "Zoom 4 oqartirish tizimi": { ru: "Система отбеливания Zoom 4", en: "Zoom 4 whitening system", kk: "Zoom 4 ағарту жүйесі", ky: "Zoom 4 агартуу системасы", tg: "Системаи сафедкунии Zoom 4", tk: "Zoom 4 ýagtylandyryş ulgamy" },
  "Kanal ichini oqartirish": { ru: "Внутриканальное отбеливание", en: "Intracanal whitening", kk: "Арна ішін ағарту", ky: "Канал ичин агартуу", tg: "Сафедкунии дохили канал", tk: "Kanal içini ýagtylandyrmak" },
  "Opalescence oqartirish tizimi": { ru: "Система отбеливания Opalescence", en: "Opalescence whitening system", kk: "Opalescence ағарту жүйесі", ky: "Opalescence агартуу системасы", tg: "Системаи сафедкунии Opalescence", tk: "Opalescence ýagtylandyryş ulgamy" },
  "Keramik vinir o'rnatish": { ru: "Установка керамического винира", en: "Ceramic veneer placement", kk: "Керамикалық винир орнату", ky: "Керамикалык винир орнотуу", tg: "Гузоштани винири керамикӣ", tk: "Keramiki winir oturtmak" },
  "Kompozit vinir o'rnatish": { ru: "Установка композитного винира", en: "Composite veneer placement", kk: "Композиттік винир орнату", ky: "Композиттик винир орнотуу", tg: "Гузоштани винири композитӣ", tk: "Kompozit winir oturtmak" },
  "Tsirkoniy vinir o'rnatish": { ru: "Установка циркониевого винира", en: "Zirconia veneer placement", kk: "Цирконий винирін орнату", ky: "Цирконий винирин орнотуу", tg: "Гузоштани винири сирконий", tk: "Sirkoniý winir oturtmak" },
  "E-max vinir o'rnatish": { ru: "Установка винира E-max", en: "E-max veneer placement", kk: "E-max винирін орнату", ky: "E-max винирин орнотуу", tg: "Гузоштани винири E-max", tk: "E-max winir oturtmak" },
  "Tish olish": { ru: "Удаление зуба", en: "Tooth extraction", kk: "Тіс жұлу", ky: "Тиш жулуу", tg: "Кашидани дандон", tk: "Diş aýyrmak" },
  "Aqlli tishni olish": { ru: "Удаление зуба мудрости", en: "Wisdom tooth extraction", kk: "Ақыл тісін жұлу", ky: "Акыл тишин жулуу", tg: "Кашидани дандони ақл", tk: "Akyl dişini aýyrmak" },
  "Retenirlangan 8-tishni (chiqmagan aqlli tishni) olish": { ru: "Удаление ретинированного 8-го зуба (непрорезавшегося зуба мудрости)", en: "Removal of an impacted third molar (unerupted wisdom tooth)", kk: "Ретинирленген 8-тісті (шықпаған ақыл тісін) жұлу", ky: "Ретинирленген 8-тишти (чыкпаган акыл тишин) жулуу", tg: "Кашидани дандони 8-уми ретинӣ (дандони ақли набаромада)", tk: "Retinirlenen 8-dişi (çykmadyk akyl dişini) aýyrmak" },
  "Tish kistasi va granulomasini olish": { ru: "Удаление кисты и гранулёмы зуба", en: "Removal of a dental cyst and granuloma", kk: "Тіс кистасы мен гранулемасын алу", ky: "Тиш кистасы жана гранулемасын алуу", tg: "Баровардани киста ва гранулемаи дандон", tk: "Diş kistasyny we granulemasyny aýyrmak" },
  "Loskutli operatsiyalar": { ru: "Лоскутные операции", en: "Flap surgery", kk: "Лоскутты операциялар", ky: "Лоскуттуу операциялар", tg: "Ҷарроҳиҳои лоскутӣ", tk: "Loskutly operasiýalar" },
  "Sinus-lifting": { ru: "Синус-лифтинг", en: "Sinus lift", kk: "Синус-лифтинг", ky: "Синус-лифтинг", tg: "Синус-лифтинг", tk: "Sinus-lifting" },
  "Murakkab tish olish": { ru: "Сложное удаление зуба", en: "Complex tooth extraction", kk: "Күрделі тіс жұлу", ky: "Татаал тиш жулуу", tg: "Кашидани мураккаби дандон", tk: "Çylşyrymly diş aýyrmak" },
  "Tish milk kapshonini kesish": { ru: "Иссечение десневого капюшона", en: "Excision of the gum hood", kk: "Қызыл иек капюшонын кесу", ky: "Тиш этинин капюшонун кесүү", tg: "Буридани капюшони милк", tk: "Diş etiniň gapyrjagyny kesmek" },
  "Vestibuloplastika": { ru: "Вестибулопластика", en: "Vestibuloplasty", kk: "Вестибулопластика", ky: "Вестибулопластика", tg: "Вестибулопластика", tk: "Westibuloplastika" },
  "Implant tishni olib tashlash": { ru: "Удаление импланта", en: "Implant removal", kk: "Имплантты алып тастау", ky: "Имплантты алып салуу", tg: "Баровардани имплант", tk: "Implanty aýyrmak" },
  "Tish ildizini olish": { ru: "Удаление корня зуба", en: "Tooth root extraction", kk: "Тіс түбірін алу", ky: "Тиш тамырын алуу", tg: "Кашидани решаи дандон", tk: "Diş köküni aýyrmak" },
  "Tish ildizi uchini rezeksiya qilish": { ru: "Резекция верхушки корня зуба", en: "Root apex resection", kk: "Тіс түбірінің ұшын резекциялау", ky: "Тиш тамырынын учун резекциялоо", tg: "Резексияи нӯги решаи дандон", tk: "Diş kökiniň ujuny rezeksiýa etmek" },
  "Og'iz bo'shlig'i abssessini davolash": { ru: "Лечение абсцесса полости рта", en: "Oral abscess treatment", kk: "Ауыз қуысы абсцессін емдеу", ky: "Ооз көңдөйүнүн абсцессин дарылоо", tg: "Табобати абсесси холигоҳи даҳон", tk: "Agyz boşlugynyň absessini bejermek" },
  "Shtamplangan tish g'ilofi (koronka) o'rnatish": { ru: "Установка штампованной коронки", en: "Stamped crown placement", kk: "Штампталған коронка орнату", ky: "Штампталган коронка орнотуу", tg: "Гузоштани тоҷи штампшуда", tk: "Ştamplanan koronka oturtmak" },
  "Byugel protezini o'rnatish": { ru: "Установка бюгельного протеза", en: "Clasp (bugel) denture placement", kk: "Бюгель протезін орнату", ky: "Бюгель протезин орнотуу", tg: "Гузоштани протези бюгелӣ", tk: "Býugel protez oturtmak" },
  "Ko'chmaydigan protez o'rnatish": { ru: "Установка несъёмного протеза", en: "Fixed prosthesis placement", kk: "Алынбайтын протез орнату", ky: "Алынбай турган протез орнотуу", tg: "Гузоштани протези собит", tk: "Aýrylmaýan protez oturtmak" },
  "Mikroprotezlash": { ru: "Микропротезирование", en: "Micro-prosthetics", kk: "Микропротездеу", ky: "Микропротездөө", tg: "Микропротезгузорӣ", tk: "Mikroprotezirlemek" },
  "Neylon protez o'rnatish": { ru: "Установка нейлонового протеза", en: "Nylon denture placement", kk: "Нейлон протезін орнату", ky: "Нейлон протезин орнотуу", tg: "Гузоштани протези нейлонӣ", tk: "Neýlon protez oturtmak" },
  "T-kristall protez o'rnatish": { ru: "Установка протеза T-Crystal", en: "T-Crystal denture placement", kk: "T-Crystal протезін орнату", ky: "T-Crystal протезин орнотуу", tg: "Гузоштани протези T-Crystal", tk: "T-Crystal protez oturtmak" },
  "Kvadroti protez o'rnatish": { ru: "Установка протеза Quattro Ti", en: "Quattro Ti denture placement", kk: "Quattro Ti протезін орнату", ky: "Quattro Ti протезин орнотуу", tg: "Гузоштани протези Quattro Ti", tk: "Quattro Ti protez oturtmak" },
  "Teleskopik protez": { ru: "Телескопический протез", en: "Telescopic denture", kk: "Телескопиялық протез", ky: "Телескопиялык протез", tg: "Протези телескопӣ", tk: "Teleskopiki protez" },
  "Metallo-keramika koronka": { ru: "Металлокерамическая коронка", en: "Metal-ceramic crown", kk: "Металлокерамикалық коронка", ky: "Металлокерамикалык коронка", tg: "Тоҷи металлокерамикӣ", tk: "Metallokeramiki koronka" },
  "Professional metallo-keramika koronka": { ru: "Профессиональная металлокерамическая коронка", en: "Premium metal-ceramic crown", kk: "Кәсіби металлокерамикалық коронка", ky: "Кесипкөй металлокерамикалык коронка", tg: "Тоҷи касбии металлокерамикӣ", tk: "Hünär metallokeramiki koronka" },
  "Tsirkoniy dioksidli koronka": { ru: "Коронка из диоксида циркония", en: "Zirconium dioxide crown", kk: "Цирконий диоксиді коронкасы", ky: "Цирконий диоксид коронкасы", tg: "Тоҷи диоксиди сирконий", tk: "Sirkoniý dioksidli koronka" },
  "Plastmassa koronka o'rnatish": { ru: "Установка пластмассовой коронки", en: "Plastic crown placement", kk: "Пластмасса коронка орнату", ky: "Пластмасса коронка орнотуу", tg: "Гузоштани тоҷи пластмассӣ", tk: "Plastmassa koronka oturtmak" },
  "Tish plastinkalarini o'rnatish": { ru: "Установка зубных пластинок", en: "Dental plate fitting", kk: "Тіс пластинкаларын орнату", ky: "Тиш пластинкаларын орнотуу", tg: "Гузоштани пластинкаҳои дандон", tk: "Diş plastinkalaryny oturtmak" },
  "Reteynerlar o'rnatish": { ru: "Установка ретейнеров", en: "Retainer placement", kk: "Ретейнер орнату", ky: "Ретейнер орнотуу", tg: "Гузоштани ретейнерҳо", tk: "Reteýner oturtmak" },
  "Metall breketlar o'rnatish": { ru: "Установка металлических брекетов", en: "Metal braces installation", kk: "Металл брекет орнату", ky: "Металл брекет орнотуу", tg: "Гузоштани брекетҳои металлӣ", tk: "Metal breket oturtmak" },
  "Keramik breketlar o'rnatish": { ru: "Установка керамических брекетов", en: "Ceramic braces installation", kk: "Керамикалық брекет орнату", ky: "Керамикалык брекет орнотуу", tg: "Гузоштани брекетҳои керамикӣ", tk: "Keramiki breket oturtmak" },
  "Sapfir breketlar o'rnatish": { ru: "Установка сапфировых брекетов", en: "Sapphire braces installation", kk: "Сапфир брекет орнату", ky: "Сапфир брекет орнотуу", tg: "Гузоштани брекетҳои сафирӣ", tk: "Sapfir breket oturtmak" },
  "Samoliguratsiyalanuvchi (o'zi qulflanadigan) breketlar": { ru: "Самолигирующие брекеты", en: "Self-ligating braces", kk: "Өзі лигатураланатын брекеттер", ky: "Өзү лигатураланган брекеттер", tg: "Брекетҳои худлигатурашаванда", tk: "Öz-özüni ligirleýän breketler" },
  "Damon breketlarini o'rnatish": { ru: "Установка брекетов Damon", en: "Damon braces installation", kk: "Damon брекеттерін орнату", ky: "Damon брекеттерин орнотуу", tg: "Гузоштани брекетҳои Damon", tk: "Damon breketlerini oturtmak" },
  "Bolalar tishini olish": { ru: "Удаление молочного зуба", en: "Baby tooth extraction", kk: "Сүт тісін жұлу", ky: "Сүт тишин жулуу", tg: "Кашидани дандони ширӣ", tk: "Süýt dişini aýyrmak" },
  "Bolalar tishini plomba qilish": { ru: "Пломбирование молочного зуба", en: "Baby tooth filling", kk: "Сүт тісін пломбалау", ky: "Сүт тишин пломбалоо", tg: "Пломбагузории дандони ширӣ", tk: "Süýt dişini plombalamak" },
  "Bolalar tishi fissuralarini germetizatsiya qilish": { ru: "Герметизация фиссур молочных зубов", en: "Sealing of baby-tooth fissures", kk: "Сүт тістерінің фиссураларын герметизациялау", ky: "Сүт тиштеринин фиссураларын герметизациялоо", tg: "Германизатсияи фиссураҳои дандонҳои ширӣ", tk: "Süýt dişleriniň fissuralaryny germetizasiýa etmek" },
  "Bolalarga breket o'rnatish": { ru: "Установка брекетов детям", en: "Braces installation for children", kk: "Балаларға брекет орнату", ky: "Балдарга брекет орнотуу", tg: "Гузоштани брекет ба кӯдакон", tk: "Çagalara breket oturtmak" },
  "Bolalarda pulpitni davolash": { ru: "Лечение пульпита у детей", en: "Pulpitis treatment in children", kk: "Балалардағы пульпитті емдеу", ky: "Балдардагы пульпитти дарылоо", tg: "Табобати пульпит дар кӯдакон", tk: "Çagalarda pulpiti bejermek" },
  "Mini-implant o'rnatish": { ru: "Установка мини-импланта", en: "Mini implant placement", kk: "Мини-имплант орнату", ky: "Мини-имплант орнотуу", tg: "Гузоштани мини-имплант", tk: "Mini-implant oturtmak" },
  "Implant ustiga koronka qo'yish": { ru: "Установка коронки на имплант", en: "Crown placement on an implant", kk: "Имплант үстіне коронка қою", ky: "Имплант үстүнө коронка коюу", tg: "Гузоштани тоҷ бар имплант", tk: "Implantyň üstüne koronka goýmak" },
  "Bir lahzali (bir vaqtdagi) implantatsiya": { ru: "Одномоментная имплантация", en: "Immediate implantation", kk: "Бір сәттік имплантация", ky: "Бир мезгилдүү имплантация", tg: "Имплантатсияи якбора", tk: "Bir wagtlaýyn implantasiýa" },
  "Bir bosqichli tish implantatsiyasi": { ru: "Одноэтапная имплантация зуба", en: "One-stage dental implantation", kk: "Бір кезеңдік тіс имплантациясы", ky: "Бир этаптуу тиш имплантациясы", tg: "Имплантатсияи якмарҳилаи дандон", tk: "Bir tapgyrly diş implantasiýasy" },
  "MegaGen implanti o'rnatish": { ru: "Установка импланта MegaGen", en: "MegaGen implant placement", kk: "MegaGen имплантын орнату", ky: "MegaGen имплантын орнотуу", tg: "Гузоштани импланти MegaGen", tk: "MegaGen implant oturtmak" },
  "Tish toshlarini olib tashlash (bitta jag')": { ru: "Удаление зубного камня (одна челюсть)", en: "Tartar removal (single jaw)", kk: "Тіс тасын алып тастау (бір жақ)", ky: "Тиш ташын алып салуу (бир жаак)", tg: "Баровардани санги дандон (як фак)", tk: "Diş daşyny aýyrmak (bir äň)" },
  "Fissuralarni germetizatsiya qilish (bitta tish)": { ru: "Герметизация фиссур (один зуб)", en: "Fissure sealing (one tooth)", kk: "Фиссураларды герметизациялау (бір тіс)", ky: "Фиссураларды герметизациялоо (бир тиш)", tg: "Германизатсияи фиссураҳо (як дандон)", tk: "Fissuralary germetizasiýa etmek (bir diş)" },
  "Tishlarni silliqlash (polirovka)": { ru: "Полировка зубов", en: "Tooth polishing", kk: "Тістерді жылтырату (полировка)", ky: "Тиштерди жылмалоо (полировка)", tg: "Сайқалкунии дандон", tk: "Dişleri ýylmamak (polirowka)" },
  "Ftorlash (ftor lak bilan qoplash)": { ru: "Фторирование (покрытие фтор-лаком)", en: "Fluoridation (fluoride varnish coating)", kk: "Фторлау (фтор лакпен жабу)", ky: "Фторлоо (фтор лак менен каптоо)", tg: "Фторкунӣ (пӯшонидан бо лаки фтор)", tk: "Ftorlamak (ftor lak bilen örtmek)" },
  "Har ikkala jag'ning umumiy profilaktik gigiyenasi": { ru: "Общая профилактическая гигиена обеих челюстей", en: "Full preventive hygiene of both jaws", kk: "Екі жақтың жалпы профилактикалық гигиенасы", ky: "Эки жаактын жалпы профилактикалык гигиенасы", tg: "Гигиенаи умумии профилактикии ҳар ду фак", tk: "Iki äňiň umumy öňüni alyş gigiýenasy" },
  "Bregatlar o'rnatish": { ru: "Установка брекетов", en: "Braces Installation", kk: "Брекет орнату", ky: "Брекет орнотуу", tg: "Гузоштани брекетҳо", tk: "Breket oturtmak" }
};

// Lookup by a normalized form of the name, so capitalisation differences in
// hand-typed procedure names still find their translation.
const medicalDictByKey = new Map(
  Object.entries(medicalDict).map(([k, v]) => [k.trim().toLowerCase().replace(/\s+/g, ' '), v]),
);

export function translateMedicalText(text: string, lang: Language): string {
  if (lang === 'uz' || !text) return text;

  // Exact match
  if (medicalDict[text] && medicalDict[text][lang as MedicalLang]) {
    return medicalDict[text][lang as MedicalLang];
  }

  // Same name, different capitalisation or spacing. Clinics retype catalog
  // procedures by hand, so an entry that differs only in case would otherwise
  // miss the dictionary and fall through to the word-by-word pass below.
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const loose = medicalDictByKey.get(normalized);
  if (loose && loose[lang as MedicalLang]) return loose[lang as MedicalLang];

  // Word-by-word fallback for names a clinic invented itself, which no
  // dictionary can cover. Reads roughly rather than fluently, but a Russian
  // speaker gets further with "лечение зуб" than with "Tish davolash".
  // Longest terms first, so a phrase is matched before its parts are.
  let translated = text;
  const wordTables: Record<MedicalLang, Record<string, string>> = {
    ru: { "germetizatsiya qilish": "герметизация", "olib tashlash": "удаление", "rezeksiya qilish": "резекция", "plomba qilish": "пломбирование", "o'rnatish": "установка", "protezlash": "протезирование", "oqartirish": "отбеливание", "tozalash": "чистка", "davolash": "лечение", "tishlarni": "зубы", "breketlar": "брекеты", "implanti": "имплант", "koronka": "коронка", "tishini": "зуб", "implant": "имплант", "rentgen": "рентген", "bolalar": "детские", "protezi": "протез", "sementi": "цемент", "breket": "брекет", "protez": "протез", "plomba": "пломба", "kanali": "канал", "tishni": "зуб", "tizimi": "система", "kesish": "иссечение", "kanal": "канал", "vinir": "винир", "tishi": "зуб", "olish": "удаление", "qo'yish": "установка", "tish": "зуб", "bilan": "с", "uchun": "для", "va": "и" },
    en: { "germetizatsiya qilish": "sealing", "olib tashlash": "removal", "rezeksiya qilish": "resection", "plomba qilish": "filling", "o'rnatish": "placement", "protezlash": "prosthetics", "oqartirish": "whitening", "tozalash": "cleaning", "davolash": "treatment", "tishlarni": "teeth", "breketlar": "braces", "implanti": "implant", "koronka": "crown", "tishini": "tooth", "implant": "implant", "rentgen": "X-ray", "bolalar": "children's", "protezi": "prosthesis", "sementi": "cement", "breket": "brace", "protez": "prosthesis", "plomba": "filling", "kanali": "canal", "tishni": "tooth", "tizimi": "system", "kesish": "excision", "kanal": "canal", "vinir": "veneer", "tishi": "tooth", "olish": "extraction", "qo'yish": "placement", "tish": "tooth", "bilan": "with", "uchun": "for", "va": "and" },
    kk: { "germetizatsiya qilish": "герметизациялау", "olib tashlash": "алып тастау", "rezeksiya qilish": "резекциялау", "plomba qilish": "пломбалау", "o'rnatish": "орнату", "protezlash": "протездеу", "oqartirish": "ағарту", "tozalash": "тазалау", "davolash": "емдеу", "tishlarni": "тістерді", "breketlar": "брекеттер", "implanti": "имплант", "koronka": "коронка", "tishini": "тісін", "implant": "имплант", "rentgen": "рентген", "bolalar": "балалар", "protezi": "протез", "sementi": "цементі", "breket": "брекет", "protez": "протез", "plomba": "пломба", "kanali": "арна", "tishni": "тісті", "tizimi": "жүйесі", "kesish": "кесу", "kanal": "арна", "vinir": "винир", "tishi": "тісі", "olish": "алу", "qo'yish": "қою", "tish": "тіс", "bilan": "арқылы", "uchun": "үшін", "va": "және" },
    ky: { "germetizatsiya qilish": "герметизациялоо", "olib tashlash": "алып салуу", "rezeksiya qilish": "резекциялоо", "plomba qilish": "пломбалоо", "o'rnatish": "орнотуу", "protezlash": "протездөө", "oqartirish": "агартуу", "tozalash": "тазалоо", "davolash": "дарылоо", "tishlarni": "тиштерди", "breketlar": "брекеттер", "implanti": "имплант", "koronka": "коронка", "tishini": "тишин", "implant": "имплант", "rentgen": "рентген", "bolalar": "балдар", "protezi": "протез", "sementi": "цементи", "breket": "брекет", "protez": "протез", "plomba": "пломба", "kanali": "канал", "tishni": "тишти", "tizimi": "системасы", "kesish": "кесүү", "kanal": "канал", "vinir": "винир", "tishi": "тиши", "olish": "алуу", "qo'yish": "коюу", "tish": "тиш", "bilan": "менен", "uchun": "үчүн", "va": "жана" },
    tg: { "germetizatsiya qilish": "германизатсия", "olib tashlash": "баровардан", "rezeksiya qilish": "резексия", "plomba qilish": "пломбагузорӣ", "o'rnatish": "гузоштани", "protezlash": "протезгузорӣ", "oqartirish": "сафедкунӣ", "tozalash": "тозакунӣ", "davolash": "табобати", "tishlarni": "дандонҳо", "breketlar": "брекетҳо", "implanti": "имплант", "koronka": "тоҷ", "tishini": "дандон", "implant": "имплант", "rentgen": "рентген", "bolalar": "кӯдакон", "protezi": "протез", "sementi": "сементи", "breket": "брекет", "protez": "протез", "plomba": "пломба", "kanali": "канал", "tishni": "дандон", "tizimi": "системаи", "kesish": "буридан", "kanal": "канал", "vinir": "винир", "tishi": "дандон", "olish": "кашидан", "qo'yish": "гузоштан", "tish": "дандон", "bilan": "бо", "uchun": "барои", "va": "ва" },
    tk: { "germetizatsiya qilish": "germetizasiýa", "olib tashlash": "aýyrmak", "rezeksiya qilish": "rezeksiýa", "plomba qilish": "plombalamak", "o'rnatish": "oturtmak", "protezlash": "protezirlemek", "oqartirish": "ýagtylandyrmak", "tozalash": "arassalamak", "davolash": "bejermek", "tishlarni": "dişleri", "breketlar": "breketler", "implanti": "implant", "koronka": "koronka", "tishini": "dişini", "implant": "implant", "rentgen": "rentgen", "bolalar": "çagalar", "protezi": "protez", "sementi": "sementi", "breket": "breket", "protez": "protez", "plomba": "plomba", "kanali": "kanal", "tishni": "dişi", "tizimi": "ulgamy", "kesish": "kesmek", "kanal": "kanal", "vinir": "winir", "tishi": "dişi", "olish": "aýyrmak", "qo'yish": "goýmak", "tish": "diş", "bilan": "bilen", "uchun": "üçin", "va": "we" },
  };
  const wordT = wordTables[lang as MedicalLang] || wordTables.en;

  for (const [key, val] of Object.entries(wordT)) {
    const r = new RegExp(`(^|[^\\p{L}])${key.replace(/'/g, "['\u2019]")}(?![\\p{L}])`, 'giu');
    translated = translated.replace(r, (_m, pre) => `${pre}${val}`);
  }

  return translated;
}
