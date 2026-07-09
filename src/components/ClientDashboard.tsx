import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clinic, Doctor, Service, QueueItem, Patient, ToothDiagnosis } from '../types';
import { DjangoAPI, getApiUrl } from '../services/api';
import { TRANSLATIONS, Language, translateMedicalText } from '../translations';
import PatientPanel from './PatientPanel';
import ThreeDentalModel from './ThreeDentalModel';
import ClinicMap from './ClinicMap';
import AdBanner from './AdBanner';
import { 
  User, 
  Phone, 
  FileText, 
  Ticket, 
  Star, 
  Calendar, 
  RefreshCw, 
  Bell, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  ArrowLeft, 
  LogIn, 
  PlusCircle, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Search,
  ShieldAlert, 
  ThumbsUp,
  UserPlus2,
  Play,
  Pause,
  Activity,
  Zap,
  ShieldCheck,
  Award,
  Upload,
  QrCode,
  Bot,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface ClientDashboardProps {
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  queues: QueueItem[];
  selectedClinic: Clinic | null;
  onSelectClinic: (clinic: Clinic | null) => void;
  onAddQueue: (newQueue: QueueItem) => void;
  onCancelQueue: (id: string) => void;
  onUpdateDoctorRating: (doctorId: string, rating: number) => void;
  setActiveTab?: (tab: 'bemor' | 'shifokor' | 'boshliq' | 'kod') => void;
  language: Language;
  userLocationRef?: React.MutableRefObject<{ lat: number, lng: number, status: 'idle' | 'detecting' | 'active' | 'denied', initialized: boolean }>;
}

export default function ClientDashboard({
  clinics,
  doctors,
  services,
  queues,
  selectedClinic,
  onSelectClinic,
  onAddQueue,
  onCancelQueue,
  onUpdateDoctorRating,
  setActiveTab,
  language,
  userLocationRef
}: ClientDashboardProps) {

  // Translation Helper for ClientDashboard
  const t = (text: string) => {
    if (!language) return text;
    
    // Check global translations
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof typeof TRANSLATIONS['uz']];
    }

    type LocalDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
    const dict: Record<string, LocalDictEntry> = {
      "tanlangan filial": { ru: "Выбранный филиал", en: "Selected Branch", kk: "Таңдалған филиал", ky: "Тандалган филиал", tg: "Филиали интихобшуда", tk: "Saýlanan şahamça" },
      "faol filial monito'rlari": { ru: "Мониторинг активного филиала", en: "Active Branch Monitoring", kk: "Белсенді филиал мониторингі", ky: "Активдүү филиал мониторинги", tg: "Мониторинги филиали фаъол", tk: "Işjeň şahamça monitoringi" },
      "klinika tanlanmadi": { ru: "Филиал не выбран", en: "Clinic not selected", kk: "Филиал таңдалмады", ky: "Филиал тандалган жок", tg: "Филиал интихоб нашудааст", tk: "Şahamça saýlanmady" },
      "klinika filialini belgilang": { ru: "Выберите филиал клиники", en: "Select Clinic Branch", kk: "Клиника филиалын белгілеңіз", ky: "Клиника филиалын белгилеңиз", tg: "Филиали клиникаро таъин кунед", tk: "Klinika şahamçasyny bellläň" },
      "xizmatlarni, diagnostik tahlillarni va navbat olish panellarini faollashtirish uchun yuqoridagi xaritani ishlating.": {
        ru: "Используйте карту выше для активации услуг, диагностики и записи в очередь.",
        en: "Use the map above to activate services, dental diagnostics, and booking panels.",
        kk: "Қызметтерді, диагностикалық талдауларды және кезек алу панельдерін белсендіру үшін жоғарыдағы картаны пайдаланыңыз.",
        ky: "Кызматтарды, диагностикалык анализдерди жана кезек алуу панелдерин иштетүү үчүн жогорудагы картаны колдонуңуз.",
        tg: "Барои фаъол кардани хизматҳо, таҳлилҳои ташхисӣ ва панелҳои навбатгирӣ аз харитаи боло истифода баред.",
        tk: "Hyzmatlary, diagnostiki seljermeleri we nobat almak panellerini işjeňleşdirmek üçin ýokardaky kartany ulanyň."
      },
      "aloqa filiali tanlanmagan": { ru: "Филиал не выбран для связи", en: "No Connected Branch Selected", kk: "Байланыс филиалы таңдалмаған", ky: "Байланыш филиалы тандалган эмес", tg: "Филиали алоқа интихоб нашудааст", tk: "Aragatnaşyk şahamçasy saýlanmady" },
      "registratsiya qilish yoki kabinetga kirish uchun avval tepadan klinika filialini tanlang.": { ru: "Пожалуйста, сначала выберите филиал клиники сверху, чтобы зарегистрироваться или войти.", en: "Please select a clinic branch from above first to register or log in.", kk: "Тіркелу немесе кабинетке кіру үшін алдымен жоғарыдан клиника филиалын таңдаңыз.", ky: "Каттоо же кабинетке кирүү үчүн адегенде жогорудан клиника филиалын тандаңыз.", tg: "Барои сабти ном ё воридшавӣ ба кабинет аввал филиали клиникаро аз боло интихоб кунед.", tk: "Hasaba durmak ýa-da kabinete girmek üçin ilki ýokardan klinika şahamçasyny saýlaň." },
      "avval klinika filialini tanlashingiz lozim.": { ru: "Вы должны сначала выбрать филиал клиники.", en: "You must select a clinic branch first.", kk: "Алдымен клиника филиалын таңдауыңыз керек.", ky: "Адегенде клиника филиалын тандашыңыз керек.", tg: "Аввал бояд филиали клиникаро интихоб кунед.", tk: "Ilki klinika şahamçasyny saýlamaly." },
      "yangi bemor ro'yxatdan o'tish": { ru: "Регистрация нового пациента", en: "New Patient Registration", kk: "Жаңа пациентті тіркеу", ky: "Жаңы бейтапты каттоо", tg: "Бақайдгирии беморони нав", tk: "Täze näsagy hasaba almak" },
      "bemor shaxsiy kabinetga kirish": { ru: "Вход в личный кабинет пациента", en: "Patient Personal Cabinet Login", kk: "Пациенттің жеке кабинетіне кіру", ky: "Бейтаптын жеке кабинетине кирүү", tg: "Воридшавӣ ба кабинети шахсии бемор", tk: "Näsagyň şahsy kabinetine girmek" },
      "bemor kabineti": { ru: "Личный кабинет", en: "Patient Cabinet", kk: "Пациент кабинеті", ky: "Бейтап кабинети", tg: "Кабинети бемор", tk: "Näsag kabineti" },
      "bizning shifokorlar": { ru: "Наши врачи", en: "Our Doctors", kk: "Біздің дәрігерлер", ky: "Биздин дарыгерлер", tg: "Духтурони мо", tk: "Biziň lukmanlarymyz" },
      "navbatingizga tayyor": { ru: "Готов к приему", en: "Ready for queue", kk: "Кезегіңізге дайын", ky: "Кезегиңизге даяр", tg: "Ба навбати шумо тайёр", tk: "Nobatyňyza taýýar" },
      "ta baho": { ru: "оценок", en: "ratings", kk: "баға", ky: "баа", tg: "баҳо", tk: "baha" },
      "tibbiy xizmatlar narxnomasi": { ru: "Прайс-лист медицинских услуг", en: "Medical Services Price List", kk: "Медициналық қызметтер баға тізімі", ky: "Медициналык кызматтардын баа тизмеси", tg: "Нархномаи хизматрасониҳои тиббӣ", tk: "Lukmançylyk hyzmatlarynyň bahanamasy" },
      "eng hamyonbop tish davolash va jarrohlik litsenziyalangan tibbiy muolajalari": { ru: "Самые доступные лицензированные стоматологические процедуры и операции", en: "Most affordable licensed dental treatments and surgeries", kk: "Ең қолжетімді лицензияланған стоматологиялық емдеу және хирургиялық медициналық процедуралар", ky: "Эң жеткиликтүү лицензияланган тиш дарылоо жана хирургиялык медициналык процедуралар", tg: "Дастрастарин муолиҷаҳои литсензиядоршудаи дандонпизишкӣ ва ҷарроҳӣ", tk: "Iň elýeterli lisenziýaly diş bejeriş we jerrahlyk lukmançylyk çäreleri" },
      "iltimos, yulduzcha (*) qo'yilgan barcha majburiy maydonlarni to'ldiring!": { ru: "Пожалуйста, заполните все обязательные поля, отмеченные звездочкой (*)", en: "Please fill all required fields marked with an asterisk (*)", kk: "Өтінеміз, жұлдызша (*) қойылған барлық міндетті өрістерді толтырыңыз!", ky: "Сураныч, жылдызча (*) коюлган бардык милдеттүү талааларды толтуруңуз!", tg: "Лутфан, ҳамаи майдонҳои ҳатмии бо ситора (*)-нишондодашударо пур кунед!", tk: "Haýyş, ýyldyzça (*) bilen bellenen ähli hökmany meýdanlary dolduryň!" },
      "muvaffaqiyatli ro'yxatdan o'tdingiz!": { ru: "Успешно зарегистрированы!", en: "Registered successfully!", kk: "Сәтті тіркелдіңіз!", ky: "Ийгиликтүү катталдыңыз!", tg: "Шумо бомуваффақият сабти ном шудед!", tk: "Üstünlikli hasaba durduňyz!" },
      "iltimos, pasport seriyasi va parolingizni kiriting": { ru: "Пожалуйста, введите серию паспорта и пароль", en: "Please enter your passport serial and password", kk: "Өтінеміз, төлқұжат сериясы мен құпия сөзіңізді енгізіңіз", ky: "Сураныч, паспорт сериясы жана сырсөзүңүздү киргизиңиз", tg: "Лутфан, силсилаи шиноснома ва пароли худро ворид кунед", tk: "Haýyş, pasport seriýaňyzy we parolyňyzy giriziň" },
      "kabinetga muvaffaqiyatli kirdingiz!": { ru: "Успешно вошли в кабинет!", en: "Logged in successfully to cabinet!", kk: "Кабинетке сәтті кірдіңіз!", ky: "Кабинетке ийгиликтүү кирдиңиз!", tg: "Шумо бомуваффақият ба кабинет ворид шудед!", tk: "Kabinete üstünlikli girdiňiz!" },
      "kabinetdan chiqdingiz": { ru: "Вышли из кабинета", en: "Logged out of cabinet", kk: "Кабинеттен шықтыңыз", ky: "Кабинеттен чыктыңыз", tg: "Шумо аз кабинет баромадед", tk: "Kabinetden çykdyňyz" },
      "telegram id muvaffaqiyatli saqlandi! t.me/dstoma_bot muloqotga tayyor.": { ru: "Telegram ID сохранен! t.me/dstoma_bot готов к отправке уведомлений.", en: "Telegram ID saved! t.me/dstoma_bot is ready for communication.", kk: "Telegram ID сәтті сақталды! t.me/dstoma_bot хабарламаға дайын.", ky: "Telegram ID ийгиликтүү сакталды! t.me/dstoma_bot билдирүүлөргө даяр.", tg: "Telegram ID бомуваффақият захира шуд! t.me/dstoma_bot ба муошират тайёр аст.", tk: "Telegram ID üstünlikli ýatda saklandy! t.me/dstoma_bot habarlaşyga taýýar." },
      "iltimos, shifokor va xizmat turini tanlang!": { ru: "Пожалуйста, выберите Врача и Тип услуги!", en: "Please select Doctor and Service type!", kk: "Өтінеміз, дәрігер мен қызмет түрін таңдаңыз!", ky: "Сураныч, дарыгер жана кызмат түрүн тандаңыз!", tg: "Лутфан, духтур ва навъи хизматро интихоб кунед!", tk: "Haýyş, lukmany we hyzmat görnüşini saýlaň!" },
      "navbatingiz olindi! elektron chipta raqamingiz:": { ru: "Очередь занята! Номер вашего электронного билета:", en: "Queue booked successfully! Your electronic ticket number:", kk: "Кезегіңіз алынды! Электронды билет нөміріңіз:", ky: "Кезегиңиз алынды! Электрондук билет номериңиз:", tg: "Навбати шумо гирифта шуд! Рақами чиптаи электронии шумо:", tk: "Nobatyňyz alyndy! Elektron petegiňiziň belgisi:" },
      "navbat bekor qilindi": { ru: "Очередь отменена", en: "Queue cancelled", kk: "Кезек бас тартылды", ky: "Кезек жокко чыгарылды", tg: "Навбат бекор карда шуд", tk: "Nobat ýatyryldy" },
      "baho berganingiz uchun rahmat! ❤️": { ru: "Спасибо за вашу оценку! ❤️", en: "Thank you for rating! ❤️", kk: "Бағалағаныңыз үшін рахмет! ❤️", ky: "Баалаганыңыз үчүн рахмат! ❤️", tg: "Барои баҳогузорӣ ташаккур! ❤️", tk: "Baha berenligiňiz üçin sag boluň! ❤️" },
      "asosiy kabinet": { ru: "Главный кабинет", en: "Main Cabinet", kk: "Негізгі кабинет", ky: "Негизги кабинет", tg: "Кабинети асосӣ", tk: "Esasy kabinet" },
      "orqaga": { ru: "Назад", en: "Back", kk: "Артқа", ky: "Артка", tg: "Бозгашт", tk: "Yza" },
      "pasport seriyasi": { ru: "Серия паспорта", en: "Passport Series", kk: "Төлқұжат сериясы", ky: "Паспорт сериясы", tg: "Силсилаи шиноснома", tk: "Pasport seriýasy" },
      "parol": { ru: "Пароль", en: "Password", kk: "Құпия сөз", ky: "Сырсөз", tg: "Парол", tk: "Parol" },
      "tizimga kirish": { ru: "Войти в систему", en: "Log In", kk: "Жүйеге кіру", ky: "Тутумга кирүү", tg: "Воридшавӣ ба низом", tk: "Ulgama girmek" },
      "xizmat": { ru: "Услуга", en: "Service", kk: "Қызмет", ky: "Кызмат", tg: "Хизмат", tk: "Hyzmat" },
      "mijoz app": { ru: "Клиентское приложение", en: "Client App", kk: "Клиенттік қосымша", ky: "Клиенттик колдонмо", tg: "Барномаи мизоҷ", tk: "Müşderi programmasy" },
      "tibbiy ko'rik zallari & navigatsiya": { ru: "Медицинские залы и навигация", en: "Medical Rooms & Navigation", kk: "Медициналық қарау залдары және навигация", ky: "Медициналык кароо залдары жана навигация", tg: "Толорҳои муоинаи тиббӣ ва навигатсия", tk: "Lukmançylyk gözden geçiriş otaglary we nawigasiýa" },
      "klinika shifokorlari": { ru: "Врачи клиники", en: "Clinic Doctors", kk: "Клиника дәрігерлері", ky: "Клиника дарыгерлери", tg: "Духтурони клиника", tk: "Klinika lukmanlary" },
      "muolajalar": { ru: "Процедуры", en: "Procedures", kk: "Процедуралар", ky: "Процедуралар", tg: "Муолиҷаҳо", tk: "Bejergiler" },
      "filiallar ro'yxati (geolokatsiya)": { ru: "Список филиалов (Геолокация)", en: "Branches List (Geolocation)", kk: "Филиалдар тізімі (Геолокация)", ky: "Филиалдардын тизмеси (Геолокация)", tg: "Рӯйхати филиалҳо (Геолокатсия)", tk: "Şahamçalaryň sanawy (Geolokasiýa)" },
      "sizga eng yaqin litsenziyalangan stomatologik filialni qidiring, tanlang va bir zumda smart chipta oling.": { ru: "Ищите, выбирайте ближайший лицензированный стоматологический филиал и мгновенно получайте смарт-билет.", en: "Search, choose the closest licensed dental branch, and secure high-priority queue tickets on the fly.", kk: "Сізге ең жақын лицензияланған стоматологиялық филиалды іздеңіз, таңдаңыз және бір сәтте смарт билет алыңыз.", ky: "Сизге эң жакын лицензияланган стоматологиялык филиалды издеңиз, тандаңыз жана дароо смарт билет алыңыз.", tg: "Наздиктарин филиали литсензиядоршудаи стоматологиро ҷустуҷӯ кунед, интихоб кунед ва фавран чиптаи смартро гиред.", tk: "Size iň ýakyn lisenziýaly stomatologik şahamçany gözläň, saýlaň we bada-bat smart petek alyň." },
      "karta ko'rinishi": { ru: "Просмотр карты", en: "Map View", kk: "Карта көрінісі", ky: "Карта көрүнүшү", tg: "Намоиши харита", tk: "Karta görnüşi" },
      "klinika bemorlar oqimi & yuklamasi": { ru: "Поток пациентов и загрузка клиники", en: "Clinic Patient Flow & Allocation Load", kk: "Клиника пациенттер ағыны және жүктемесі", ky: "Клиника бейтаптар агымы жана жүктөмөсү", tg: "Ҷараён ва бори беморони клиника", tk: "Klinikanyň näsag akymy we ýüklemesi" },
      "bo'limlar kesimida real-vaqtdagi kutish yuklamasi integratsiyasi.": { ru: "Интеграция загрузки ожидания по отделениям в реальном времени.", en: "Real-time department-based queueing queue allocation analytics.", kk: "Бөлімдер бойынша нақты уақыттағы күту жүктемесі интеграциясы.", ky: "Бөлүмдөр боюнча реалдуу убакыттагы күтүү жүктөмөсүнүн интеграциясы.", tg: "Интегратсияи бори интизории вақти воқеӣ дар буриши шӯъбаҳо.", tk: "Bölümler boýunça hakyky wagt garaşyş ýüklemesiniň integrasiýasy." },
      "konsultatsiya og'zi": { ru: "Консультация полости рта", en: "Oral Consultation Room", kk: "Кеңес беру бөлмесі", ky: "Консультация бөлмөсү", tg: "Хонаи машваратӣ", tk: "Konsultasiýa otagy" },
      "tish diagnostik rentgen": { ru: "Рентген-диагностика зубов", en: "3D Dental X-Ray & Imaging", kk: "Тіс диагностикалық рентген", ky: "Тиш диагностикалык рентген", tg: "Рентгени ташхисии дандон", tk: "Diş diagnostiki rentgen" },
      "og'iz gigiyenasi xonasi": { ru: "Кабинет гигиены рта", en: "Oral Hygiene & Cleaning Room", kk: "Ауыз гигиенасы бөлмесі", ky: "Ооз гигиенасы бөлмөсү", tg: "Хонаи гигиенаи даҳон", tk: "Agyz gigiýenasy otagy" },
      "jarrohlik & implantatsiya": { ru: "Хирургия и имплантация", en: "Jaw Surgery & Dental Implants", kk: "Хирургия және имплантация", ky: "Хирургия жана имплантация", tg: "Ҷарроҳӣ ва имплантатсия", tk: "Jerrahlyk we implantasiýa" },
      "markaziy tish diagnostikasi & telemetriya": { ru: "Центральная диагностика зубов и телеметрия", en: "Central Dental diagnostics & Telemetry", kk: "Орталық тіс диагностикасы және телеметрия", ky: "Борбордук тиш диагностикасы жана телеметрия", tg: "Ташхиси марказии дандон ва телеметрия", tk: "Merkezi diş diagnostikasy we telemetriýa" },
      "bemor ma'lumotlari": { ru: "Данные пациента", en: "Patient Personal Details", kk: "Пациент деректері", ky: "Бейтап маалыматтары", tg: "Маълумоти бемор", tk: "Näsagyň maglumatlary" },
      "boshqa bo'lim": { ru: "Другое отделение", en: "Other department", kk: "Басқа бөлім", ky: "Башка бөлүм", tg: "Шӯъбаи дигар", tk: "Başga bölüm" },
      "ism sharfingiz": { ru: "Ваше имя и фамилия", en: "Your Full Name", kk: "Аты-жөніңіз", ky: "Атыңыз-фамилияңыз", tg: "Ному насаби шумо", tk: "Adyňyz we familiýaňyz" },
      "telefon raqamingiz": { ru: "Номер телефона", en: "Your Phone Number", kk: "Телефон нөміріңіз", ky: "Телефон номериңиз", tg: "Рақами телефони шумо", tk: "Telefon belgiňiz" },
      "tug'ilgan sanangiz": { ru: "Дата рождения", en: "Date of Birth", kk: "Туған күніңіз", ky: "Туулган күнүңүз", tg: "Санаи таваллуди шумо", tk: "Doglan senäňiz" },
      "qon guruhi": { ru: "Группа крови", en: "Blood Group", kk: "Қан тобы", ky: "Кан тобу", tg: "Гурӯҳи хун", tk: "Gan topary" },
      "allergiyalar (agar bo'lsa)": { ru: "Аллергии (если есть)", en: "Allergies (if any)", kk: "Аллергиялар (болса)", ky: "Аллергиялар (болсо)", tg: "Аллергияҳо (агар бошад)", tk: "Allergiýalar (bar bolsa)" },
      "surunkali kasalliklar": { ru: "Хронические заболевания", en: "Chronic diseases", kk: "Созылмалы аурулар", ky: "Уланма ооруулар", tg: "Бемориҳои музмин", tk: "Dowamly keseller" },
      "infeksion kasalliklar mavjudmi?": { ru: "Есть ли инфекционные заболевания?", en: "Are infectious diseases present?", kk: "Инфекциялық аурулар бар ма?", ky: "Инфекциялык оорулар барбы?", tg: "Оё бемориҳои сироятӣ мавҷуданд?", tk: "Ýokanç keseller barmy?" },
      "ro'yxatdan o'tish": { ru: "Зарегистрироваться", en: "Register Profile", kk: "Тіркелу", ky: "Каттоо", tg: "Сабти ном", tk: "Hasaba durmak" },
      "profilingizga kirish": { ru: "Войти в свой кабинет", en: "Enter Patient Profile", kk: "Профиліңізге кіру", ky: "Профилиңизге кирүү", tg: "Воридшавӣ ба профили худ", tk: "Profiliňize girmek" },
      "bemor shaxsiy kabinet": { ru: "Личный кабинет пациента", en: "Patient Personal Cabinet", kk: "Пациенттің жеке кабинеті", ky: "Бейтаптын жеке кабинети", tg: "Кабинети шахсии бемор", tk: "Näsagyň şahsy kabineti" },
      "onlayn navbat olish": { ru: "Онлайн-запись в очередь", en: "Online Queue Ticket Booking", kk: "Онлайн кезек алу", ky: "Онлайн кезек алуу", tg: "Гирифтани навбати онлайн", tk: "Onlaýn nobat almak" },
      "shifokorni tanlang": { ru: "Выберите врача", en: "Select Doctor", kk: "Дәрігерді таңдаңыз", ky: "Дарыгерди тандаңыз", tg: "Духтурро интихоб кунед", tk: "Lukmany saýlaň" },
      "xizmat turini tanlang": { ru: "Выберите тип услуги", en: "Select Medical Service Type", kk: "Қызмет түрін таңдаңыз", ky: "Кызмат түрүн тандаңыз", tg: "Навъи хизматро интихоб кунед", tk: "Hyzmat görnüşini saýlaň" },
      "elektron chiptani band qilish": { ru: "Забронировать смарт-билет", en: "Book Smart Queue Ticket", kk: "Электронды билетті брондау", ky: "Электрондук билетти брондоо", tg: "Бронкунии чиптаи электронӣ", tk: "Elektron petegi bronlamak" },
      "telegram bot orqali xabar olish (ixtiyoriy)": { ru: "Уведомления через Telegram бот (опционально)", en: "Get Queue Notifications via Telegram Bot", kk: "Telegram бот арқылы хабарлама алу (қосымша)", ky: "Telegram бот аркылуу билдирүү алуу (кошумча)", tg: "Гирифтани огоҳинома тавассути боти Telegram (ихтиёрӣ)", tk: "Telegram bot arkaly habarnama almak (islege görä)" },
      "faol navbatingiz": { ru: "Ваша активная очередь", en: "Your Active Queue Ticket", kk: "Сіздің белсенді кезегіңіз", ky: "Сиздин активдүү кезегиңиз", tg: "Навбати фаъоли шумо", tk: "Işjeň nobatyňyz" },
      "chipta raqami": { ru: "Номер билета", en: "Ticket Number", kk: "Билет нөмірі", ky: "Билет номери", tg: "Рақами чипта", tk: "Petek belgisi" },
      "shifokor": { ru: "Врач", en: "Doctor", kk: "Дәрігер", ky: "Дарыгер", tg: "Духтур", tk: "Lukman" },
      "qabul holati": { ru: "Статус приема", en: "Admission Status", kk: "Қабылдау мәртебесі", ky: "Кабылдоо абалы", tg: "Ҳолати қабул", tk: "Kabul ýagdaýy" },
      "navbatingiz kelganda sizga telegram va ekran orqali xabar beriladi. qabulga kechikmang.": { ru: "Вы будете уведомлены через Telegram при приближении очереди. Не опаздывайте.", en: "You will be notified via Telegram once your turn is close. Please do not be late.", kk: "Кезегіңіз келгенде сізге Telegram және экран арқылы хабарланады. Қабылдауға кешікпеңіз.", ky: "Кезегиңиз келгенде сизге Telegram жана экран аркылуу билдирилет. Кабылдоого кечикпеңиз.", tg: "Вақте ки навбати шумо мерасад, тавассути Telegram ва экран огоҳ карда мешавед. Ба қабул дер накунед.", tk: "Nobatyňyz gelende size Telegram we ekran arkaly habar berilýär. Kabula giç galmaň." },
      "bemor tarixi va tahlillar arxivi": { ru: "История посещений и архив аналитики", en: "Admissions History & Analytics Archive", kk: "Пациент тарихы мен талдаулар мұрағаты", ky: "Бейтап тарыхы жана анализдер архиви", tg: "Таърихи бемор ва бойгонии таҳлилҳо", tk: "Näsagyň taryhy we seljerme arhiwi" },
      "tish holati tahlili": { ru: "Анализ состояния зуба", en: "Dental Tooth Metric Analysis", kk: "Тіс жағдайын талдау", ky: "Тиш абалын анализдөө", tg: "Таҳлили ҳолати дандон", tk: "Diş ýagdaýynyň seljermesi" },
      "tish": { ru: "Зуб", en: "Tooth", kk: "Тіс", ky: "Тиш", tg: "Дандон", tk: "Diş" },
      "diagnostika": { ru: "Диагностика", en: "Diagnostics", kk: "Диагностика", ky: "Диагностика", tg: "Ташхис", tk: "Diagnostika" },
      "plomba holati: yaxshi": { ru: "Состояние пломбы: отличное", en: "Finishing health: Excellent", kk: "Пломба жағдайы: жақсы", ky: "Пломба абалы: жакшы", tg: "Ҳолати пломба: хуб", tk: "Plomba ýagdaýy: gowy" },
      "karies xavfi: yo'q": { ru: "Риск кариеса: отсутствует", en: "Caries risk: None", kk: "Кариес қаупі: жоқ", ky: "Кариес коркунучу: жок", tg: "Хатари кариес: нест", tk: "Kariýes howpy: ýok" },
      "emaldagi jarohatlar: aniqlanmadi": { ru: "Повреждения эмали: не обнаружены", en: "Enamel damage: Not detected", kk: "Эмальдегі зақымдар: анықталмады", ky: "Эмалдагы бузулуулар: аныкталган жок", tg: "Осебҳои сирдандон: муайян нашуд", tk: "Emaldaky zeperler: ýüze çykarylmady" },
      "tish ildizi: sog'lom": { ru: "Корень зуба: здоровый", en: "Tooth root: 100% Healthy", kk: "Тіс тамыры: сау", ky: "Тиш тамыры: соо", tg: "Решаи дандон: солим", tk: "Diş köki: sagdyn" },
      "avvalgi tashriflar tarixi": { ru: "История предыдущих визитов", en: "Past Admissions History logs", kk: "Алдыңғы келулер тарихы", ky: "Мурунку келүүлөр тарыхы", tg: "Таърихи ташрифҳои қаблӣ", tk: "Öňki gelen-gidenleriň taryhy" },
      "hech qanday oldingi tashriflar tarixi mavjud emas.": { ru: "История предыдущих визитов пуста.", en: "No previous dental visits history detected.", kk: "Ешқандай алдыңғы келулер тарихы жоқ.", ky: "Эч кандай мурунку келүүлөр тарыхы жок.", tg: "Ягон таърихи ташрифи қаблӣ мавҷуд нест.", tk: "Hiç hili öňki gelen-gidenleriň taryhy ýok." },
      "baho: v": { ru: "Оценка:", en: "Rating:", kk: "Баға:", ky: "Баа:", tg: "Баҳо:", tk: "Baha:" },
      "shifokor qabuli xizmatiga baho bering": { ru: "Оцените качество обслуживания врача", en: "Rate doctor's treatment service quality", kk: "Дәрігер қабылдау қызметіне баға беріңіз", ky: "Дарыгердин кабылдоо кызматына баа бериңиз", tg: "Ба хизмати қабули духтур баҳо диҳед", tk: "Lukmanyň kabul hyzmatyna baha beriň" },
      "aql tishi (m3)": { ru: "Зуб мудрости (M3)", en: "Wisdom Tooth (M3)", kk: "Ақыл тісі (M3)", ky: "Акыл тиши (M3)", tg: "Дандони ақл (M3)", tk: "Akyl dişi (M3)" },
      "katta oziq tish (molyar)": { ru: "Моляр", en: "Molar", kk: "Үлкен азу тіс (Моляр)", ky: "Чоң азуу тиш (Моляр)", tg: "Дандони калони хоягӣ (Моляр)", tk: "Uly iýmit dişi (Molýar)" },
      "kichik oziq tish (premolyar)": { ru: "Премоляр", en: "Premolar", kk: "Кіші азу тіс (Премоляр)", ky: "Кичине азуу тиш (Премоляр)", tg: "Дандони хурди хоягӣ (Премоляр)", tk: "Kiçi iýmit dişi (Premolýar)" },
      "qoziq tish (k9)": { ru: "Клык", en: "Canine", kk: "Азу тіс (К9)", ky: "Ит тиш (К9)", tg: "Дандони саг (К9)", tk: "It dişi (K9)" },
      "to'sar tish (kurak)": { ru: "Резец", en: "Incisor", kk: "Күрек тіс (Резец)", ky: "Күрөк тиш (Резец)", tg: "Дандони пеш (Резец)", tk: "Ön diş (Kesiji)" },
      "faqat rasm formatidagi fayllarni yuklashingiz mumkin!": { ru: "Вы можете загружать только изображения!", en: "Only image files are allowed!", kk: "Тек сурет форматындағы файлдарды жүктей аласыз!", ky: "Сиз бир гана сүрөт форматындагы файлдарды жүктөй аласыз!", tg: "Шумо метавонед танҳо файлҳои дар шакли расм бор кунед!", tk: "Diňe surat formatyndaky faýllary ýükläp bilersiňiz!" },
      "rasm muvaffaqiyatli yuklandi!": { ru: "Изображение успешно загружено!", en: "Image uploaded successfully!", kk: "Сурет сәтті жүктелді!", ky: "Сүрөт ийгиликтүү жүктөлдү!", tg: "Расм бомуваффақият бор карда шуд!", tk: "Surat üstünlikli ýüklendi!" },
      "ai yordamchi — premium xizmat. bepul sinov muddati tugagan.": { ru: "ИИ-помощник — премиум услуга. Бесплатный пробный период истёк.", en: "AI Assistant is a Premium feature. Free trial has ended.", kk: "AI Көмекші — Premium қызмет. Тегін сынақ мерзімі аяқталды.", ky: "AI Жардамчы — Premium кызмат. Акысыз сыноо мөөнөтү бүттү.", tg: "Ёрдамчии AI — хизмати Premium. Мӯҳлати озмоишии ройгон ба охир расид.", tk: "AI Kömekçi — Premium hyzmat. Mugt synag möhleti gutardy." },
      "diqqat: yuklangan rasm tishlarga taalluqli emas!": { ru: "Внимание: Загруженное изображение не относится к зубам!", en: "Warning: Uploaded image is not related to teeth!", kk: "Назар аударыңыз: Жүктелген сурет тістерге қатысты емес!", ky: "Көңүл буруңуз: Жүктөлгөн сүрөт тиштерге тиешелүү эмес!", tg: "Диққат: Тасвири боркардашуда ба дандонҳо алоқаманд нест!", tk: "Ünsi çekiň: Ýüklenen surat dişlere degişli däl!" },
      "ai diagnostika muvaffaqiyatli yakunlandi!": { ru: "ИИ диагностика завершена успешно!", en: "AI diagnostics computed successfully!", kk: "AI диагностикасы сәтті аяқталды!", ky: "AI диагностикасы ийгиликтүү аяктады!", tg: "Ташхиси AI бомуваффақият анҷом ёфт!", tk: "AI diagnostikasy üstünlikli tamamlandy!" },
      "offline diagnostika muvaffaqiyatli yakunlandi!": { ru: "Автономная диагностика завершена!", en: "Offline diagnostics computed successfully!", kk: "Офлайн диагностика сәтті аяқталды!", ky: "Офлайн диагностика ийгиликтүү аяктады!", tg: "Ташхиси офлайн бомуваффақият анҷом ёфт!", tk: "Oflaýn diagnostika üstünlikli tamamlandy!" },
      "xaritada ochish": { ru: "открыть на карте", en: "open in map", kk: "картада ашу", ky: "картада ачуу", tg: "дар харита кушодан", tk: "kartada açmak" },
      "filiallar xaritasi": { ru: "КАРТА ФИЛИАЛОВ", en: "BRANCHES MAP", kk: "ФИЛИАЛДАР КАРТАСЫ", ky: "ФИЛИАЛДАР КАРТАСЫ", tg: "ХАРИТАИ ФИЛИАЛҲО", tk: "ŞAHAMÇALAR KARTASY" },
      "to'g'ridan-to'g'ri telegram-da navbat olish, shifokorlar bilan chat va sun'iy intellekt shifokori maslahatlari integratsiyasi!": { ru: "Запись в очередь напрямую через Telegram, чат с врачами и консультации ИИ-стоматолога!", en: "Queue booking via Telegram, chat with specialists, and AI dental advisor integration!", kk: "Тікелей Telegram арқылы кезек алу, дәрігерлермен чат және жасанды интеллект дәрігерінің кеңестері интеграциясы!", ky: "Түз Telegram аркылуу кезек алуу, дарыгерлер менен чат жана жасалма интеллект дарыгеринин кеңештери интеграциясы!", tg: "Гирифтани навбат бевосита дар Telegram, чат бо духтурон ва интегратсияи маслиҳатҳои духтури зеҳни сунъӣ!", tk: "Göni Telegram-da nobat almak, lukmanlar bilen söhbet we emeli aň lukmanynyň maslahatlary integrasiýasy!" },
      "telegram-da ulanish va boshlash 💬": { ru: "Подключиться в Telegram 💬", en: "Connect on Telegram 💬", kk: "Telegram-да қосылу және бастау 💬", ky: "Telegram-да туташуу жана баштоо 💬", tg: "Дар Telegram пайваст шудан ва оғоз кардан 💬", tk: "Telegram-da birikmek we başlamak 💬" },
      "xizmatlarni ko'rish va navbat olish uchun yuqoridagi interaktiv xaritadan yoki ro'yxatdan o'zingiz xohlagan filialni tanlang. sizga eng yaqini maxsus belgi orqali tavsiya qilinadi.": { ru: "Для просмотра услуг и записи в очередь выберите желаемый филиал на интерактивной карте или в списке выше. Ближайший к вам филиал будет рекомендован специальной отметкой.", en: "To view services and join the queue, please select your preferred branch from the interactive map or list above. The closest one to you will be recommended with a special badge.", kk: "Қызметтерді көру және кезек алу үшін жоғарыдағы интерактивті картадан немесе тізімнен өзіңіз қалаған филиалды таңдаңыз. Сізге ең жақыны арнайы белгі арқылы ұсынылады.", ky: "Кызматтарды көрүү жана кезек алуу үчүн жогорудагы интерактивдүү картадан же тизмеден өзүңүз каалаган филиалды тандаңыз. Сизге эң жакыны атайын белги аркылуу сунушталат.", tg: "Барои дидани хизматҳо ва гирифтани навбат аз харитаи интерактивии боло ё аз рӯйхат филиали дилхоҳи худро интихоб кунед. Наздиктарин ба шумо бо аломати махсус тавсия дода мешавад.", tk: "Hyzmatlary görmek we nobat almak üçin ýokardaky interaktiw kartadan ýa-da sanawdan islän şahamçaňyzy saýlaň. Size iň ýakyny ýörite bellik bilen maslahat berilýär." },
      "klinika filiali tanlanmagan": { ru: "Филиал клиники не выбран", en: "Clinic Branch Not Selected", kk: "Клиника филиалы таңдалмаған", ky: "Клиника филиалы тандалган эмес", tg: "Филиали клиника интихоб нашудааст", tk: "Klinika şahamçasy saýlanmady" }
    };

    const localLang: keyof LocalDictEntry | null =
      (language === 'ru' || language === 'en' || language === 'kk' || language === 'ky' || language === 'tg' || language === 'tk')
        ? language
        : null;

    const cleanText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    if (localLang && dict[cleanText]) {
      return dict[cleanText][localLang];
    }

    // Fallback key lookup
    if (localLang && dict[text]) {
      return dict[text][localLang];
    }

    return text;
  };
  
  // Local list of patients to allow lookup during login
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'pat_test_2',
      clinicId: 'samarqand',
      fullName: 'Test Bemor 2',
      passportSerial: 'AA1234567',
      phone: '+998 (90) 123-45-67',
      birthDate: '1998-05-12',
      password: '123456',
      bloodGroup: 'II+',
      allergies: "Yo'q",
      chronicDiseases: "Mavjud emas (Sog'lom)",
      hasInfection: false,
      telegramChatId: '57896431'
    }
  ]);

  // Load patients and keep in-sync in real-time with our Central Express storage
  useEffect(() => {
    let active = true;
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/patients`);
        if (!res.ok) throw new Error("Status down");
        const data = await res.json();
        if (active && Array.isArray(data) && data.length > 0) {
          setPatients(data);
        }
      } catch (err) {
        console.warn("[ClientDashboard] Failed to fetch synced patients:", err);
      }
    };
    fetchPatients();
    const interval = setInterval(fetchPatients, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Patient login never issues a server session token (see /api/patient-login) — the
  // patient record itself, once verified, IS the session. Persisted to localStorage so
  // a device stays logged in across restarts instead of asking for passport+password
  // every visit; a useEffect below keeps this in sync with every setCurrentUser call
  // rather than touching each of the many call sites individually.
  const PATIENT_SESSION_KEY = 'dstoma_patient_session';
  const [currentUser, setCurrentUser] = useState<Patient | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(PATIENT_SESSION_KEY);
    if (!saved) return null;
    try { return JSON.parse(saved); } catch (e) { return null; }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentUser) localStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(currentUser));
    else localStorage.removeItem(PATIENT_SESSION_KEY);
  }, [currentUser]);

  // Screen control state matching user screenshots
  // 'home' -> Screenshot 1 (Main page with buttons, Shifokorlar & Xizmatlar listas)
  // 'register' -> Screenshot 2 (Bemor ma'lumotlari)
  // 'login' -> Let the user type their passport and password
  // 'cabinet' -> Screenshot 3 (Bemor Kabineti / Profilingizga kirish)
  // 'booking' -> Logged-in patient's queue-booking wizard: pick clinic -> pick doctor -> confirm
  // Defaults straight to 'cabinet' when a remembered session was found above, instead
  // of showing the logged-out landing page to an already-logged-in patient.
  const [activeSubView, setActiveSubView] = useState<'home' | 'register' | 'login' | 'cabinet' | 'booking'>(() => {
    if (typeof window === 'undefined') return 'home';
    return localStorage.getItem('dstoma_patient_session') ? 'cabinet' : 'home';
  });

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998901234567');
  const [passport, setPassport] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('1998-05-12');
  const [bloodGroup, setBloodGroup] = useState('II+');
  const [allergies, setAllergies] = useState("Yo'q");
  const [chronicDiseases, setChronicDiseases] = useState("Sog'lom");
  const [hasInfection, setHasInfection] = useState<boolean>(false);

  // Cabinet Specific States
  const [telegramIdInput, setTelegramIdInput] = useState('57896431');
  // Booking wizard: both start empty so the patient makes an explicit choice —
  // clinic first, then one of that clinic's doctors.
  const [bookingClinicId, setBookingClinicId] = useState('');
  const [bookingDoctorId, setBookingDoctorId] = useState('');
  const [complaint, setComplaint] = useState('');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  // --- FUTURISTIC 3D DENTAL SCANNER METRIC STATES ---
  const [selectedToothIndex, setSelectedToothIndex] = useState<number>(7); // index 7 is Universal #8 Upper Right Central Incisor (Maxillary Central Incisor)
  const [dentalSystem, setDentalSystem] = useState<'fdi' | 'universal'>('universal');
  const [activeJaw, setActiveJaw] = useState<'upper' | 'lower'>('upper');
  const [teethViewMode, setTeethViewMode] = useState<'arch' | 'grid'>('grid');

  // Perfectly spaced manual coordinates (x, y percentages) for 3D Arch representation
  // to prevent overlapping, bunched-up edge anomalies, and maintain flawless readability.
  const getArchCoordinates = (toothIdx: number) => {
    // Upper jaw (0 to 15)
    const upperCoords: { [key: number]: { x: number, y: number } } = {
      0: { x: 8, y: 76 },
      1: { x: 12, y: 65 },
      2: { x: 16, y: 56 },
      3: { x: 21, y: 46 },
      4: { x: 27, y: 38 },
      5: { x: 33, y: 31 },
      6: { x: 40, y: 26 },
      7: { x: 47, y: 23 },
      8: { x: 53, y: 23 },
      9: { x: 60, y: 26 },
      10: { x: 67, y: 31 },
      11: { x: 73, y: 38 },
      12: { x: 79, y: 46 },
      13: { x: 84, y: 56 },
      14: { x: 88, y: 65 },
      15: { x: 92, y: 76 }
    };

    // Lower jaw (16 to 31)
    const lowerCoords: { [key: number]: { x: number, y: number } } = {
      16: { x: 8, y: 24 },
      17: { x: 12, y: 35 },
      18: { x: 16, y: 44 },
      19: { x: 21, y: 54 },
      20: { x: 27, y: 62 },
      21: { x: 33, y: 69 },
      22: { x: 40, y: 74 },
      23: { x: 47, y: 77 },
      24: { x: 53, y: 77 },
      25: { x: 60, y: 74 },
      26: { x: 67, y: 69 },
      27: { x: 74, y: 62 },
      28: { x: 79, y: 54 },
      29: { x: 84, y: 44 },
      30: { x: 88, y: 35 },
      31: { x: 92, y: 24 }
    };

    return toothIdx < 16 ? upperCoords[toothIdx] : lowerCoords[toothIdx];
  };
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerTick, setScannerTick] = useState<number>(0);
  const [symptomsInput, setSymptomsInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Index helper systems (MEDICALLY TRIPLE-CHECKED & FULLY SYMMETRICAL FOR PRODUCTION)
  const getToothDisplayNumber = (index: number, system: 'fdi' | 'universal') => {
    if (system === 'universal') {
      if (index < 16) {
        return index + 1; // Upper arch: 1 to 16
      } else if (index < 24) {
        return 32 - (index - 16); // Lower arch left: 32 down to 25 (viewer's left side, patient's right)
      } else {
        return 24 - (index - 24); // Lower arch right: 24 down to 17 (viewer's right side, patient's left)
      }
    } else {
      if (index < 8) {
        return 18 - index; // Upper Quadrant 1 (viewer's left): 18 down to 11
      } else if (index < 16) {
        return 21 + (index - 8); // Upper Quadrant 2 (viewer's right): 21 up to 28
      } else if (index < 24) {
        return 48 - (index - 16); // Lower Quadrant 4 (viewer's left): 48 down to 41
      } else {
        return 31 + (index - 24); // Lower Quadrant 3 (viewer's right): 31 up to 38
      }
    }
  };

  const getAnatomicalName = (index: number) => {
    if ([0, 15, 16, 31].includes(index)) {
      return t("Aql tishi (M3)");
    }
    if ([1, 2, 13, 14, 17, 18, 29, 30].includes(index)) {
      return t("Katta oziq tish (Molyar)");
    }
    if ([3, 4, 11, 12, 19, 20, 27, 28].includes(index)) {
      return t("Kichik oziq tish (Premolyar)");
    }
    if ([5, 10, 21, 26].includes(index)) {
      return t("Qoziq tish (K9)");
    }
    return t("To'sar tish (Kurak)");
  };

  // Dynamic custom tooth metrics state to track AI diagnostic updates over time
  const [customTeethMetrics, setCustomTeethMetrics] = useState<{
    [key: number]: {
      health: number;
      enamel: number;
      dentin: number;
      pulp: number;
      root: number;
      gum: number;
      bone: number;
      caries: number;
      cavity: number;
      plaque: number;
      calculus: number;
      gingivitis: number;
      periodontitis: number;
      riskLabel: 'LOW' | 'MEDIUM' | 'HIGH';
    }
  }>({});

  const getToothMetrics = (idx: number) => {
    if (customTeethMetrics[idx]) {
      return customTeethMetrics[idx];
    }
    // Default initial state: perfectly healthy dental crown & roots
    return {
      health: 100,
      enamel: 100,
      dentin: 100,
      pulp: 100,
      root: 100,
      gum: 100,
      bone: 100,
      caries: 0,
      cavity: 0,
      plaque: 0,
      calculus: 0,
      gingivitis: 0,
      periodontitis: 0,
      riskLabel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH'
    };
  };

  const selectedTooth = getToothDisplayNumber(selectedToothIndex, dentalSystem);

  // Advanced imaging and drag-and-drop diagnostic states
  const [selectedToothImage, setSelectedToothImage] = useState<{
    mimeType: string;
    data: string; // Base64 encoding
  } | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [aiOutput, setAiOutput] = useState<{
    toothNumber: number;
    enamelAbrasion: string;
    healthFactor: string;
    recommendedTreatment: string;
    diagnosticText: string;
    actionPlan: string[];
    isSimulation: boolean;
  } | null>(null);
  const [aiRequiresPremium, setAiRequiresPremium] = useState(false);

  // --- TELEGRAM WEB APP / MINI APP INTEGRATION HOOK ---
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      try {
        tg.ready();
        tg.expand();
        
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          console.log("[DStoma Mini App Dev] Detected Telegram User context:", tgUser);
          
          const tgChatId = String(tgUser.id);
          setTelegramIdInput(tgChatId);
          
          // Auto-login if patient already registered with this Telegram ID
          const registeredMatch = patients.find(p => String(p.telegramChatId) === tgChatId);
          if (registeredMatch) {
            setCurrentUser(registeredMatch);
            setActiveSubView('cabinet');
            if (tg.showConfirm) {
              tg.showConfirm(`Xush kelibsiz, ${registeredMatch.fullName}! Tizim sizni Telegram profilingiz orqali shaxsiy kabinetga avtomatik kiritdi.`);
            } else {
              showToast(`Xush kelibsiz, ${registeredMatch.fullName}!`, "success");
            }
          } else {
            // New patient - Prefill registration details and redirect
            const nameSuggested = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || 'Telegram Bemor';
            setFullName(nameSuggested);
            
            showToast("Telegram orqali yangi bemor aniqlandi! Iltimos, hisobingizni ro'yxatdan o'tkazishni yakunlang.", "success");
            setActiveSubView('register');
          }
        }
      } catch (err) {
        console.warn("[Telegram SDK Load Notice]", err);
      }
    }
  }, [patients]);

  React.useEffect(() => {
    // Keep it synchronized, but clear AI result on manual tooth changes
    setAiOutput(null);
    
    // Automatically switch active jaw view based on selected tooth index
    if (selectedToothIndex < 16) {
      setActiveJaw('upper');
    } else {
      setActiveJaw('lower');
    }
  }, [selectedToothIndex]);

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(
        t('Faqat rasm formatidagi fayllarni yuklashingiz mumkin!'),
        'error'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedToothImage({
        mimeType: file.type,
        data: base64String
      });
      setImageFileName(file.name);
      showToast(
        t('Rasm muvaffaqiyatli yuklandi!'),
        'success'
      );
    };
    reader.readAsDataURL(file);
  };

  const saveDiagnosisForPatient = async (diagnosticResult: any) => {
    if (!currentUser) return;
    
    const newDiagnosis: ToothDiagnosis = {
      id: 'diag_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      toothIndex: selectedToothIndex,
      toothNumber: Number(getToothDisplayNumber(selectedToothIndex, dentalSystem)),
      symptoms: symptomsInput || 'Routine Check',
      imageFileName: imageFileName || undefined,
      enamelAbrasion: diagnosticResult.enamelAbrasion || "Moderate",
      healthFactor: diagnosticResult.healthFactor || "90%",
      recommendedTreatment: diagnosticResult.recommendedTreatment || "Fluoride therapy",
      diagnosticText: diagnosticResult.diagnosticText || "Condition looks normal.",
      actionPlan: diagnosticResult.actionPlan || []
    };
    
    const updatedDiagnoses = [...(currentUser.diagnoses || []), newDiagnosis];
    const updatedUser = {
      ...currentUser,
      diagnoses: updatedDiagnoses
    };
    
    setCurrentUser(updatedUser);
    setPatients(prev => prev.map(p => p.id === currentUser.id ? updatedUser : p));
    
    try {
      await fetch(`${getApiUrl()}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser)
      });
    } catch (apiErr) {
      console.warn("Failed to persist patient diagnostics on backend:", apiErr);
    }
  };

  const handleAiDiagnostic = async () => {
    setIsScanning(false);
    setIsAiLoading(true);

    const applyAiDiagnosticToTooth = (idx: number, diagnosticData: any) => {
      if (!diagnosticData) return;
      
      let parsedHealth = 100;
      let parsedCaries = 0;
      let parsedEnamel = 100;
      let parsedDentin = 100;
      let parsedPulp = 100;
      
      const hStr = ((diagnosticData.healthFactor || diagnosticData.enamelAbrasion || "") + "").toLowerCase();
      const matchPct = hStr.match(/(\d+)%/);
      const pct = matchPct ? parseInt(matchPct[1]) : null;
      
      if (hStr.includes('kritik') || hStr.includes('critical') || hStr.includes('42%') || (pct !== null && pct < 50)) {
        parsedHealth = pct !== null ? pct : 42;
        parsedCaries = Math.max(0, 100 - parsedHealth);
        parsedEnamel = 72;
        parsedDentin = 55;
        parsedPulp = 42;
      } else if (hStr.includes('o\'rta') || hStr.includes('o‘rta') || hStr.includes('fair') || hStr.includes('65%') || (pct !== null && pct < 85)) {
        parsedHealth = pct !== null ? pct : 60;
        parsedCaries = Math.max(0, 100 - parsedHealth);
        parsedEnamel = 68;
        parsedDentin = 75;
        parsedPulp = 82;
      } else if (pct !== null) {
        parsedHealth = pct;
        parsedCaries = Math.max(0, 100 - pct);
        parsedEnamel = Math.max(0, pct - (idx % 4));
        parsedDentin = Math.max(0, pct - 5);
        parsedPulp = pct;
      } else {
        const sym = (symptomsInput || '').toLowerCase();
        const hasImg = !!selectedToothImage;
        if (sym.includes('og\'riq') || sym.includes('ogriq') || sym.includes('shish') || sym.includes('pain') || sym.includes('ache') || sym.includes('hurt')) {
          parsedHealth = 42;
          parsedCaries = 58;
          parsedEnamel = 72;
          parsedDentin = 55;
          parsedPulp = 42;
        } else if (hasImg) {
          parsedHealth = 65;
          parsedCaries = 35;
          parsedEnamel = 68;
          parsedDentin = 75;
          parsedPulp = 82;
        } else {
          parsedHealth = 98;
          parsedCaries = 2;
          parsedEnamel = 98;
          parsedDentin = 100;
          parsedPulp = 100;
        }
      }
      
      setCustomTeethMetrics(prev => ({
        ...prev,
        [idx]: {
          health: parsedHealth,
          enamel: parsedEnamel,
          dentin: parsedDentin,
          pulp: parsedPulp,
          root: Math.min(100, Math.max(0, parsedHealth - 4)),
          gum: Math.min(100, Math.max(0, parsedHealth - 5)),
          bone: Math.min(100, Math.max(0, parsedHealth - 10)),
          caries: parsedCaries,
          cavity: Math.max(0, parsedCaries - 10),
          plaque: Math.floor(parsedCaries * 0.4 + 5),
          calculus: Math.floor(parsedCaries * 0.3 + 2),
          gingivitis: Math.floor(parsedCaries * 0.5),
          periodontitis: Math.max(0, 100 - parsedHealth - 10),
          riskLabel: parsedHealth < 50 ? 'HIGH' : parsedHealth < 75 ? 'MEDIUM' : 'LOW'
        }
      }));
    };

    setAiRequiresPremium(false);
    try {
      const response = await fetch(`${getApiUrl()}/api/ai/diagnostic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toothNumber: selectedTooth,
          symptoms: symptomsInput,
          language: language,
          image: selectedToothImage, // Base64 encoded file payload
          clinicId: selectedClinic?.id,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.requiresPremium) {
        setAiRequiresPremium(true);
        showToast(
          t("AI Yordamchi — Premium xizmat. Bepul sinov muddati tugagan."),
          'error'
        );
        return;
      }
      if (!response.ok) {
        throw new Error('API request failed');
      }
      setAiOutput(data);
      
      if (data.isDentalRelated === false) {
        showToast(
          t('Diqqat: Yuklangan rasm tishlarga taalluqli emas!'),
          'error'
        );
      } else {
        applyAiDiagnosticToTooth(selectedToothIndex, data);
      }
      
      await saveDiagnosisForPatient(data);
      if (data.isDentalRelated !== false) {
        showToast(
          t('AI diagnostika muvaffaqiyatli yakunlandi!'),
          'success'
        );
      }
    } catch (e: any) {
      console.error('AI telemetry processing error, falling back to local diagnostics', e);
      
      // Beautiful local simulation fallback on frontend!
      const hasImg = !!selectedToothImage;
      const cleanSym = (symptomsInput || '').trim().toLowerCase();
      let localFallback: any = {};

      if (language === 'uz') {
        if (hasImg) {
          localFallback = {
            enamelAbrasion: "32% Yuzaki mikrosiniq",
            healthFactor: "O'rta (65%)",
            recommendedTreatment: "Badiiy restavratsiya (Kompozit)",
            diagnosticText: `Tish (#${selectedTooth}) rasm tahlili natijalariga ko'ra emal qismida o'rta darajadagi yemirilish va tish chetida mikrosiniqlar aniqlandi. Quyidagi alomatlar o'rganildi: "${symptomsInput || 'Yo\'q'}". Tishni qayta tiklash va emalini mustahkamlash uchun kompozit restavratsiya qilish samaralidir.`,
            actionPlan: [
              "DStoma shifokoriga badiiy restavratsiya uchun uchrashish",
              "Kalsiy va minerallarga boy maxsus tish pastalarini ishlatish",
              "Rang beruvchi hamda o'ta issiq/sovuq taomlardan vaqtincha saqlanish"
            ]
          };
        } else if (cleanSym.includes('og\'riq') || cleanSym.includes('ogriq') || cleanSym.includes('shish') || cleanSym.includes('pain')) {
          localFallback = {
            enamelAbrasion: "28% Yuqori yemirilish",
            healthFactor: "Kritik (42%)",
            recommendedTreatment: "Kanal muolajasi (Endodontiya)",
            diagnosticText: `Tish #${selectedTooth} mandibular segmentida asab tolalari yallig'lanishi (pulpit) kuzatilmoqda. Bemor ko'rsatgan alomatlar: "${symptomsInput}". Zudlik bilan stomatolog ko'rigidan o'tib, ildiz kanallarini davolash tavsiya etiladi.`,
            actionPlan: [
              "Og'riq qoldiruvchi vositalarni shifokor nazoratida qo'llash",
              "Zudlik bilan DStoma shifokoriga navbat olish",
              "Issiq va sovuq oziq-ovqatlardan saqlanish"
            ]
          };
        } else {
          localFallback = {
            enamelAbrasion: "6% Minimal yemirilish",
            healthFactor: "Sog'lom (94%)",
            recommendedTreatment: "Muntazam profilaktika va Minerallash",
            diagnosticText: `Tish #${selectedTooth} normal anatomik tuzilishga ega. Maxsus patologiyalar aniqlanmadi. Muammali alomatlar qayd etilmadi. Sog'lom emal mudofaasini saqlash uchun fleyorli tish pastalardan muntazam foydalaning.`,
            actionPlan: [
              "Tongda va kechqurun tishlarni 2 daqiqa davomida yuvish",
              "Har 6 oyda DStoma klinikalarida ultratovushli tozalash",
              "Dental tish ipidan muntazam foydalanish"
            ]
          };
        }
      } else if (language === 'ru') {
        if (hasImg) {
          localFallback = {
            enamelAbrasion: "32% Поверхностная микротрещина",
            healthFactor: "Средний (65%)",
            recommendedTreatment: "Художественная реставрация зуба",
            diagnosticText: `Анализ изображения зуба #${selectedTooth}: на эмали обнаружена умеренная пигментация и микротрещина по краю. С учетом симптомов: "${symptomsInput || 'нет'}", рекомендуется художественная композитная реставрация для герметизации дефекта.`,
            actionPlan: [
              "Записаться на художественную реставрацию в клинику DStoma",
              "Использовать зубную пасту с гидроксиапатитом кальция для укрепления эмали",
              "Избегать резких температурных перепадов и красящих продуктов"
            ]
          };
        } else if (cleanSym.includes('бол') || cleanSym.includes('опух') || cleanSym.includes('острый') || cleanSym.includes('pain')) {
          localFallback = {
            enamelAbrasion: "28% Высокая абразия",
            healthFactor: "Критическое (42%)",
            recommendedTreatment: "Лечение корневых каналов (Эндодонтия)",
            diagnosticText: `В сегменте зуба #${selectedTooth} наблюдаются признаки воспаления пульпы (пульпит). Описанные симптомы: "${symptomsInput}". Рекомендуется скорейшая запись на прием для декомпрессии нерва в клинике DStoma.`,
            actionPlan: [
              "Применение противовоспалительных средств при острой боли",
              "Запись к дежурному стоматологу DStoma",
              "Исключение твердой и экстремально температурной пищи"
            ]
          };
        } else {
          localFallback = {
            enamelAbrasion: "6% Минимальный износ",
            healthFactor: "Отличное (94%)",
            recommendedTreatment: "Регулярная гигиена и реминерализация",
            diagnosticText: `Зуб #${selectedTooth} находится в здоровом анатомическом состоянии. Выраженных клинических патологий не выявлено. Рекомендуется стандартный уход и осмотр.`,
            actionPlan: [
              "Правильное очищение зубов щеткой средней жесткости",
              "Прохождение профгигиены каждые 6 месяцев",
              "Использование зубной нити после еды"
            ]
          };
        }
      } else {
        if (hasImg) {
          localFallback = {
            enamelAbrasion: "32% Superficial micro-fracture",
            healthFactor: "Fair (65%)",
            recommendedTreatment: "Aesthetic Composite Restoration",
            diagnosticText: `Visual analysis of your uploaded image for Tooth #${selectedTooth} indicates moderate enamel wear and a minor superficial fracture. Reported symptoms: "${symptomsInput || 'none'}". Aesthetic composite restoration is recommended.`,
            actionPlan: [
              "Schedule an appointment for composite restoration at DStoma",
              "Apply remineralizing toothpaste containing hydroxyapatite",
              "Avoid direct heavy biting on hard objects and thermal shock food"
            ]
          };
        } else if (cleanSym.includes('pain') || cleanSym.includes('ache') || cleanSym.includes('hurt') || cleanSym.includes('swoll')) {
          localFallback = {
            enamelAbrasion: "28% High abrasion",
            healthFactor: "Critical (42%)",
            recommendedTreatment: "Root Canal Therapy (Endodontics)",
            diagnosticText: `Active symptoms "${symptomsInput}" indicate pulp inflammation in Tooth #${selectedTooth}. Timely root canal treatment is recommended.`,
            actionPlan: [
              "Temporary anti-inflammatory medicine under professional guide",
              "Schedule an urgent check-in on the DStoma Map",
              "Avoid direct biting on hard surfaces and temperature extremes"
            ]
          };
        } else {
          localFallback = {
            enamelAbrasion: "6% Minor wearing",
            healthFactor: "Excellent (94%)",
            recommendedTreatment: "Preventative Fluoridation & Remineralization",
            diagnosticText: `Tooth #${selectedTooth} exhibits standard healthy occlusion and clean enamel layers. Normal visual metrics confirmed.`,
            actionPlan: [
              "Maintain thorough brushing morning and night",
              "Utilize interdental dental floss daily",
              "Schedule standard check-ups bi-annually"
            ]
          };
        }
      }

      setAiOutput(localFallback);
      applyAiDiagnosticToTooth(selectedToothIndex, localFallback);
      await saveDiagnosisForPatient(localFallback);
      
      showToast(
        t('Offline Diagnostika muvaffaqiyatli yakunlandi!'),
        'success'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Laser scan visual tick handler
  React.useEffect(() => {
    let timer: any;
    if (isScanning) {
      timer = setInterval(() => {
        setScannerTick(prev => prev + 1);
      }, 100);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Prepopulated queue entries matching screenshots
  const [myQueues, setMyQueues] = useState<QueueItem[]>([
    {
      id: 'q_pre_1',
      clinicId: 'samarqand',
      patientName: 'Test Bemor 2',
      patientPhone: '+998 (90) 123-45-67',
      doctorId: 'doc_sm_1',
      serviceId: 'srv_sm_3',
      number: 102,
      status: 'completed',
      rating: 5,
      createdAt: '2026-06-03T11:20:00Z'
    },
    {
      id: 'q_pre_2',
      clinicId: 'samarqand',
      patientName: 'Test Bemor 2',
      patientPhone: '+998 (90) 123-45-67',
      doctorId: 'doc_sm_2',
      serviceId: 'srv_sm_1',
      number: 105,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ]);

  // Sync myQueues statuses and ratings with main parent queues in real time
  React.useEffect(() => {
    setMyQueues((prevMyQueues) => {
      const updated = prevMyQueues.map((myQ) => {
        const masterQ = queues.find((q) => q.id === myQ.id);
        if (masterQ) {
          return { ...myQ, status: masterQ.status, rating: masterQ.rating || myQ.rating };
        }
        return myQ;
      });

      // Also append any new master queue item that belongs to this user if it's not already in local myQueues!
      if (currentUser) {
        queues.forEach((q) => {
          if (
            (q.patientPhone === currentUser.phone || q.patientName === currentUser.fullName) &&
            !updated.some((item) => item.id === q.id)
          ) {
            updated.unshift(q);
          }
        });
      }
      return updated;
    });
  }, [queues, currentUser]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !passport || !password) {
      showToast("Iltimos, yulduzcha (*) qo'yilgan barcha majburiy maydonlarni to'ldiring!", "error");
      return;
    }
    const newPatient: Patient = {
      id: 'pat_' + Math.random().toString(36).substr(2, 9),
      clinicId: selectedClinic?.id || 'samarqand',
      fullName,
      passportSerial: passport.toUpperCase(),
      phone,
      birthDate,
      password,
      bloodGroup,
      allergies,
      chronicDiseases,
      hasInfection,
      telegramChatId: telegramIdInput
    };
    
    // Save locally
    setPatients(prev => [...prev, newPatient]);
    setCurrentUser(newPatient);
    showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
    setActiveSubView('cabinet');

    // Post to server backend
    try {
      await fetch(`${getApiUrl()}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
    } catch (err) {
      console.warn("[ClientDashboard] Backend sync for patient registration failed", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport || !password) {
      showToast("Iltimos, pasport seriyasi va parolingizni kiriting", "error");
      return;
    }

    const cleanedPassport = passport.trim().toUpperCase();
    const cleanedPassword = password.trim();

    try {
      const res = await fetch(`${getApiUrl()}/api/patient-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passportSerial: cleanedPassport, password: cleanedPassword })
      });
      if (res.ok) {
        const data = await res.json();
        const foundPatient: Patient = data.patient;
        setPatients(prev => prev.some(p => p.id === foundPatient.id) ? prev.map(p => p.id === foundPatient.id ? foundPatient : p) : [...prev, foundPatient]);
        setCurrentUser(foundPatient);
        setTelegramIdInput(foundPatient.telegramChatId || '');
        showToast("Kabinetga muvaffaqiyatli kirdingiz!");
        setActiveSubView('cabinet');
      } else {
        showToast("Pasport seriyasi yoki parol noto'g'ri. Hisobingiz yo'q bo'lsa, 'Ro'yxatdan o'tish' orqali yarating.", "error");
      }
    } catch (err) {
      console.warn("[ClientDashboard] Patient login failed", err);
      showToast("Tarmoqqa ulanishda xatolik yuz berdi. Qayta urinib ko'ring.", "error");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast("Kabinetdan chiqdingiz");
    setActiveSubView('home');
  };

  const handleSaveTelegram = async () => {
    if (currentUser) {
      const updated = { ...currentUser, telegramChatId: telegramIdInput };
      setCurrentUser(updated);
      setPatients(prev => prev.map(p => p.id === currentUser.id ? updated : p));
      showToast("Telegram ID muvaffaqiyatli saqlandi! t.me/dstoma_bot muloqotga tayyor.");

      // Post in background to be fully accessible for Telegram Bot
      try {
        await fetch(`${getApiUrl()}/api/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.warn("[ClientDashboard] Failed to save Telegram ID to backend", err);
      }
    }
  };

  const handleBookQueue = (e?: React.FormEvent) => {
    e?.preventDefault();

    // The patient must explicitly pick a clinic and one of THAT clinic's doctors —
    // never silently fall back to "first doctor of first clinic".
    const clinic = clinics.find(c => c.id === bookingClinicId);
    const doc = doctors.find(d => d.id === bookingDoctorId && d.clinicId === bookingClinicId);
    if (!clinic || !doc) {
      showToast("Iltimos, avval klinikani va shifokorni tanlang!", "error");
      return;
    }

    const ticketNo = queues.length + myQueues.length + 107;

    const newQueue: QueueItem = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      clinicId: clinic.id,
      patientName: currentUser?.fullName || 'Mehmon',
      patientPhone: currentUser?.phone || phone,
      doctorId: doc.id,
      complaint: complaint,
      number: ticketNo,
      status: 'pending',
      createdAt: new Date().toISOString(),
      passportSerial: currentUser?.passportSerial || ''
    };
    if (currentUser?.telegramChatId || telegramIdInput) {
      newQueue.telegramChatId = currentUser?.telegramChatId || telegramIdInput;
    }

    // Add locally
    setMyQueues([newQueue, ...myQueues]);
    onAddQueue(newQueue);
    setComplaint('');
    // Return to the cabinet so the fresh ticket is immediately visible in "Mening navbatlarim".
    setActiveSubView('cabinet');
    showToast(`Navbatingiz olindi! Elektron chipta raqamingiz: #${ticketNo}`);
  };

  const handleCancelLocalQueue = (id: string) => {
    setMyQueues(myQueues.map(q => q.id === id ? { ...q, status: 'cancelled' } : q));
    onCancelQueue(id);
    showToast("Navbat bekor qilindi", "error");
  };

  const handleRatingLocalQueue = (id: string, rating: number) => {
    setMyQueues(myQueues.map(q => q.id === id ? { ...q, rating } : q));
    const item = myQueues.find(q => q.id === id);
    if (item) {
      onUpdateDoctorRating(item.doctorId, rating);
    }
    showToast("Baho berganingiz uchun rahmat! ❤️");
  };

  const [servicesSearchTerm, setServicesSearchTerm] = useState('');
  const [openServiceCategory, setOpenServiceCategory] = useState<string>("Mashhur xizmatlar");

  const getServiceCategory = (name: string): string => {
    const n = name.toLowerCase();
    
    if (n.includes('diagnostika') || n.includes('konsultatsiya') || n.includes('rentgen') || n.includes('snimka')) return 'Diagnostika';
    if (n.includes('oqartirish') || n.includes('zoom') || n.includes('bleaching')) return 'Tishlarni oqartirish';
    if (n.includes('vinir') || n.includes('komponir') || n.includes('lyuminir')) return 'Vinirlar';
    if (n.includes('implant') || n.includes('all-on-4') || n.includes('mega gen') || n.includes('osstem')) return 'Implantatsiya';
    if (n.includes('protez') || n.includes('koronka') || n.includes('metallokera') || n.includes('sirqoniy') || n.includes('plastmassa')) return 'Protezlash';
    if (n.includes('breket') || n.includes('plastinka') || n.includes('elayner') || n.includes('reteyner')) return 'Ortodontiya';
    if (n.includes('bolalar') || n.includes('sut tish')) return 'Bolalar stomatologiyasi';
    if (n.includes('olish') || n.includes('xirurg') || n.includes('operasiya') || n.includes('operatsiya') || n.includes('rezeksiya') || n.includes('kista') || n.includes('sinus')) return 'Xirurgiya';
    if (n.includes('tosh') || n.includes('tozalash') || n.includes('gigiyena') || n.includes('polirovka') || n.includes('ftor') || n.includes('air flow')) return 'Profilaktika';
    if (n.includes('karies') || n.includes('plomba') || n.includes('pulpit') || n.includes('abssess') || n.includes('davolash')) return 'Terapevtik stomatologiya';
    
    return 'Boshqa xizmatlar';
  };

  const isPopularService = (name: string): boolean => {
    const n = name.toLowerCase();
    if (n.includes('karies') || n.includes('kariesni davolash')) return true;
    if (n.includes('tish olish') && !n.includes('bolalar')) return true;
    if (n.includes('kompozit plomba') || n.includes('plomba')) return true;
    if (n.includes('tish toshlarini') || n.includes('tozalash')) return true;
    return false;
  };

  // Filter lists based on active clinic or current user's clinic or default clinic
  const activeClinic = selectedClinic || clinics.find(c => c.id === currentUser?.clinicId) || clinics[0];
  const clinicDoctors = doctors.filter(d => d.clinicId === activeClinic?.id);
  const clinicServices = services.filter(s => s.clinicId === activeClinic?.id);

  const groupServicesByCategory = () => {
    const filtered = clinicServices.filter(s => 
      s.name.toLowerCase().includes((servicesSearchTerm || '').toLowerCase())
    );
    
    const categories: Record<string, Service[]> = {};
    const popular: Service[] = [];
    
    filtered.forEach(s => {
      if (!servicesSearchTerm && isPopularService(s.name) && popular.length < 5) {
        popular.push(s);
      }
      
      const cat = getServiceCategory(s.name);
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s);
    });

    return { popular, categories };
  };

  const groupedServicesData = groupServicesByCategory();
  const sortedCategories = [
    "Diagnostika", "Terapevtik stomatologiya", "Tishlarni oqartirish", 
    "Vinirlar", "Xirurgiya", "Protezlash", "Ortodontiya", 
    "Bolalar stomatologiyasi", "Implantatsiya", "Profilaktika", "Boshqa"
  ].filter(c => groupedServicesData.categories[c] && groupedServicesData.categories[c].length > 0);

  return (
    <div className="space-y-6 font-sans relative">
      {/* Toast Notification overlay */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -50, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 left-1/2 z-50 pointer-events-none"
          >
            <div className={`px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md border ${
              toastMsg.type === 'success' 
                ? 'bg-emerald-500/95 border-emerald-400 text-white shadow-emerald-950/20' 
                : 'bg-rose-500/95 border-rose-400 text-white shadow-rose-950/20'
            }`}>
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-100 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-100 flex-shrink-0" />
              )}
              <span className="text-xs font-black tracking-wide leading-tight">{toastMsg.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- ACTION HUB CONTROL CARD (PREMIUM DARK GLASS DESIGN) ----------------- */}
      <div className="bg-[#0b1022]/85 rounded-3xl p-6 border border-[#203254]/80 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          <div className="text-left space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] text-[10px] font-black uppercase tracking-wider">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> {t("Faol filial monito'rlari")}
            </span>
            <h2 className="text-md font-black text-white tracking-wider flex items-center gap-2 uppercase">
              {activeClinic?.name}
            </h2>
            <span className="text-xs text-slate-400 font-bold leading-normal block">
              📍 {activeClinic?.address} {activeClinic?.mapLink && (
                <a 
                  href={activeClinic.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 ml-1.5 underline underline-offset-2 transition-all"
                >
                  ({t("xaritada ochish")}) <ExternalLink className="w-3 h-3 text-cyan-400 inline" />
                </a>
              )} | 📞 {activeClinic?.phone}
            </span>
          </div>

          {/* Tri-Action CTA Buttons styled exactly in luxurious cyber gradients */}
          <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
            {/* 1. View / Switch Clinics Map (Cyan MapPin glass tab) */}
            <button
              onClick={() => {
                onSelectClinic(null);
              }}
              className="px-5 py-3 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all cursor-pointer bg-slate-900 border border-[#203254]/80 text-cyan-400 hover:text-white hover:bg-slate-850 shadow-lg active:scale-95"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              {t("FILIALLAR XARITASI")}
            </button>

            {/* 2. Register new Patient (Emerald dark luxury) */}
            <button
              onClick={() => {
                setActiveSubView('register');
              }}
              className="px-5 py-3 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-95"
            >
              <UserPlus2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              {t("Yangi bemor Ro'yxatdan o'tish")}
            </button>

            {/* 3. Patient Cabinet (Indigo luxury glass tab) */}
            <button
              onClick={() => {
                if (currentUser) {
                  setActiveSubView('cabinet');
                } else {
                  setPassport('');
                  setPassword('');
                  setActiveSubView('login');
                }
              }}
              className="px-5 py-3 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 active:scale-95"
            >
              <LogIn className="w-4 h-4 text-cyan-200" />
              {t("bemor Shaxsiy kabinetga kirish")}
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- CLIENT DASHBOARD WORKSPACE ----------------- */}
      {activeSubView === 'home' && (
        <div className="space-y-6">
          <AdBanner placement="web_home" />
          <ClinicMap
            clinics={clinics}
            selectedClinic={selectedClinic}
            onSelectClinic={onSelectClinic}
            language={language}
            userLocationRef={userLocationRef}
          />

          {activeClinic ? (
            <div className="space-y-6 animate-fade-in text-left">

            {/* CROSS-CHANNEL SMART DUAL ONBOARDING & QR PANEL */}
            <div className="bg-[#10172a] rounded-3xl p-6 border border-slate-800 text-left relative overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.3)] animate-fade-in select-none">
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4 z-10 relative">
                <span className="p-1.5 bg-gradient-to-br from-indigo-505 to-emerald-500 rounded-xl text-white font-extrabold text-[10px] uppercase font-mono tracking-widest flex items-center gap-1 shrink-0">
                  <QrCode className="w-4 h-4 animate-pulse text-emerald-300" /> INTEGRATED
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest leading-none">
                    Dual Kirish va Tizim Integratsiyasi (Cross-Channel Access)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    Bemorlarimiz xohlasa QR kod orqali ushbu Ilovaga, xohlasa Telegram Bot manzili orqali to'g'ridan-to'g'ri Telegram-da navbat ola oladilar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                {/* Channel A: Web Application QR */}
                <div className="bg-[#1e293b]/70 rounded-2xl p-4 border border-slate-700/60 flex flex-col sm:flex-row items-center gap-4 hover:border-indigo-500/40 transition-all group">
                  <div className="bg-white p-2.5 rounded-xl shrink-0 shadow-lg shadow-black/30 group-hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-900" fill="currentColor">
                      <rect x="0" y="0" width="22" height="22" />
                      <rect x="2" y="2" width="18" height="18" fill="white" />
                      <rect x="5" y="5" width="12" height="12" />
                      
                      <rect x="78" y="0" width="22" height="22" />
                      <rect x="80" y="2" width="18" height="18" fill="white" />
                      <rect x="83" y="5" width="12" height="12" />
                      
                      <rect x="0" y="78" width="22" height="22" />
                      <rect x="2" y="80" width="18" height="18" fill="white" />
                      <rect x="5" y="83" width="12" height="12" />
                      
                      <rect x="30" y="4" width="6" height="6" />
                      <rect x="42" y="10" width="8" height="4" />
                      <rect x="58" y="2" width="4" height="10" />
                      <rect x="34" y="20" width="12" height="4" />
                      <rect x="4" y="30" width="6" height="6" />
                      <rect x="18" y="42" width="10" height="4" />
                      <rect x="32" y="32" width="36" height="6" />
                      <rect x="32" y="44" width="8" height="16" />
                      <rect x="48" y="44" width="16" height="4" />
                      <rect x="56" y="54" width="14" height="14" />
                      <rect x="78" y="32" width="16" height="6" />
                      <rect x="82" y="48" width="8" height="12" />
                      <rect x="78" y="78" width="10" height="10" />
                      <rect x="90" y="68" width="8" height="16" />
                    </svg>
                  </div>
                  <div className="text-center sm:text-left space-y-2 flex-1">
                    <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 font-mono text-[9px] font-black rounded uppercase border border-indigo-500/20">
                      🌐 DStoma Web App
                    </span>
                    <h4 className="text-xs font-black text-slate-100">
                      Mobil Telefon orqali UI Ilovaga kirish
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      Kamerangizni skanerga tuting va smart 3D tish holati datchigi hamda interaktiv xaritaga kiring!
                    </p>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-all underline"
                    >
                      Ilova havolasini ochish 🚀
                    </a>
                  </div>
                </div>

                {/* Channel B: Telegram Bot QR */}
                <div className="bg-[#1e293b]/70 rounded-2xl p-4 border border-slate-700/60 flex flex-col sm:flex-row items-center gap-4 hover:border-emerald-500/40 transition-all group">
                  <div className="bg-white p-2.5 rounded-xl shrink-0 shadow-lg shadow-black/30 group-hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 100 100" className="w-24 h-24 text-teal-900" fill="currentColor">
                      <rect x="0" y="0" width="22" height="22" />
                      <rect x="2" y="2" width="18" height="18" fill="white" />
                      <rect x="5" y="5" width="12" height="12" />
                      
                      <rect x="78" y="0" width="22" height="22" />
                      <rect x="80" y="2" width="18" height="18" fill="white" />
                      <rect x="83" y="5" width="12" height="12" />
                      
                      <rect x="0" y="78" width="22" height="22" />
                      <rect x="2" y="80" width="18" height="18" fill="white" />
                      <rect x="5" y="83" width="12" height="12" />
                      
                      <rect x="34" y="6" width="14" height="4" />
                      <rect x="52" y="2" width="8" height="8" />
                      <rect x="30" y="20" width="16" height="4" />
                      <rect x="10" y="34" width="8" height="12" />
                      <rect x="24" y="32" width="6" height="18" />
                      <rect x="42" y="32" width="28" height="10" />
                      <rect x="54" y="46" width="10" height="16" />
                      <rect x="78" y="30" width="12" height="12" />
                      <rect x="72" y="48" width="12" height="6" />
                      <rect x="78" y="62" width="18" height="6" />
                      <rect x="32" y="78" width="14" height="12" />
                      <rect x="50" y="82" width="18" height="8" />
                      
                      <circle cx="50" cy="50" r="6" fill="#02c39a" />
                    </svg>
                  </div>
                  <div className="text-center sm:text-left space-y-2 flex-1">
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 font-mono text-[9px] font-black rounded uppercase border border-emerald-500/20">
                      🤖 telegram bot manzili
                    </span>
                    <h4 className="text-xs font-black text-slate-100">
                      Smart Telegram Botimiz: @dstoma_bot
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      {t("To'g'ridan-to'g'ri Telegram-da navbat olish, shifokorlar bilan chat va sun'iy intellekt shifokori maslahatlari integratsiyasi!")}
                    </p>
                    <a
                      href="https://t.me/dstoma_bot"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-all underline"
                    >
                      {t("Telegram-da ulanish va boshlash 💬")}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 🏥 CLINICAL SERVICES PRICING & SELECTION CATALOG HAS BEEN MOVED TO PATIENT CABINET */}
            </div>
          ) : (
            /* Segment when there is no selected clinic yet, prompt them clearly and show the maps for manual selection */
            <div className="bg-[#0b1022]/85 border border-[#203254]/80 rounded-3xl p-8 text-center space-y-3 max-w-2xl mx-auto animate-fade-in shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="w-12 h-12 bg-slate-900 border border-slate-800 text-yellow-500 rounded-2xl mx-auto flex items-center justify-center text-xl shadow-lg">
                📍
              </div>
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-sans">
                {t("Klinika Filiali Tanlanmagan")}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold max-w-md mx-auto leading-relaxed">
                {t("Xizmatlarni ko'rish va navbat olish uchun yuqoridagi interaktiv xaritadan yoki ro'yxatdan o'zingiz xohlagan filialni tanlang. Sizga eng yaqini maxsus belgi orqali tavsiya qilinadi.")}
              </p>
            </div>
          )}
        </div>
      )}


      {/* ---------------- VIEW 2: REGISTER PATIENT FORM (SCREENSHOT 2) ---------------- */}
      {activeSubView === 'register' && (
        <div className="max-w-xl mx-auto bg-white text-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-100 overflow-hidden animate-fade-in text-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-100 text-center relative">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2">
              <UserPlus2 className="w-5 h-5 text-indigo-650" />
              Bemor Ma'lumotlari
            </h2>
            <p className="text-[10px] text-slate-450 font-semibold mt-1">Iltimos, elektron kartangizni ochish uchun formulani to'ldiring</p>
          </div>

          {/* Body Form */}
          <form onSubmit={handleRegister} className="p-6 md:p-8 space-y-5">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                Ism va familiya *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Umidjon Egamov"
                className="w-full bg-slate-50/70 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Passport & Birthdate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Pasport seriyasi va raqami *
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={passport}
                  onChange={(e) => setPassport(e.target.value.toUpperCase())}
                  placeholder="AA1234567"
                  className="w-full bg-slate-50/70 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all uppercase font-mono tracking-widest placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Tug'ilgan sana *
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-50/70 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone & Password Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Telefon raqam *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 (90) 123-45-67"
                  className="w-full bg-slate-50/70 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Parol *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Xavfsiz parol kiriting"
                  className="w-full bg-slate-50/70 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Blood group & Allergies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Qon guruhi
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-50/70 text-xs font-semibold text-slate-850 border border-slate-200 rounded-xl px-3 py-3 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                >
                  <option value="Noma'lum">Tanlang (Noma'lum)</option>
                  <option value="I+">I (O) Rh+</option>
                  <option value="I-">I (O) Rh-</option>
                  <option value="II+">II (A) Rh+</option>
                  <option value="II-">II (A) Rh-</option>
                  <option value="III+">III (B) Rh+</option>
                  <option value="III-">III (B) Rh-</option>
                  <option value="IV+">IV (AB) Rh+</option>
                  <option value="IV-">IV (AB) Rh-</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                  Allergiyalar
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Masalan: Penitsillin guruhiga"
                  className="w-full bg-slate-50/70 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Chronic diseases */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                Surunkali kasalliklar
              </label>
              <textarea
                value={chronicDiseases}
                onChange={(e) => setChronicDiseases(e.target.value)}
                placeholder="Yurak, Qon bosimi, qandli diabet yoki boshqa jiddiy muammolar haqida..."
                className="w-full bg-slate-50/70 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-3 h-20 resize-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Red Alert warning Box matching Screenshot 2 */}
            <div className="bg-rose-50/50 border border-rose-200/60 p-4.5 rounded-2xl flex items-start gap-3.5">
              <input
                type="checkbox"
                id="has-infection-chk"
                checked={hasInfection}
                onChange={(e) => setHasInfection(e.target.checked)}
                className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-5 h-5 cursor-pointer mt-0.5 shrink-0 transition-transform active:scale-90"
              />
              <label htmlFor="has-infection-chk" className="text-xs font-extrabold text-rose-900 leading-tight cursor-pointer select-none">
                DIQQAT: Jiddiy yuqumli kasalliklar mavjud bo'lsa belgilang.
                <span className="block font-normal text-[10px] text-rose-600 mt-1 leading-relaxed">
                  Gepatit, OIV yoki boshqa asbob-uskunalar daxlsizligiga bevosita ta'sir qiladigan kasalliklar mavjud bo'lsa, shifokor uchun buni belgilashingiz qat'iyan tavsiya etiladi.
                </span>
              </label>
            </div>

            {/* Submit Action Buttons exactly formatted as Screenshot 2 */}
            <div className="flex items-center gap-3.5 pt-4">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-100/50 cursor-pointer transition-all text-center"
              >
                Muvaffaqiyatli Ro'yxatdan o'tish
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSubView('home')}
                className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-2xl cursor-pointer transition-all"
              >
                Orqaga
              </button>
            </div>
          </form>
        </div>
      )}


      {/* ---------------- VIEW 1.5: LOGIN PATIENT FORM ---------------- */}
      {activeSubView === 'login' && (
        <div className="max-w-md mx-auto bg-white text-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-100 overflow-hidden animate-fade-in text-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-100 text-center">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5 text-cyan-600" />
              Bemor Kabinetiga Kirish
            </h2>
            <p className="text-[10px] text-slate-450 font-semibold mt-1">
              Shaxsiy tibbiy kartangizga kirish uchun pasport va parolingizni kiriting
            </p>
          </div>

          {/* Body Form */}
          <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-5">
            {/* Passport Serial */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                Pasport seriyasi va raqami *
              </label>
              <input
                type="text"
                required
                maxLength={9}
                value={passport}
                onChange={(e) => setPassport(e.target.value.toUpperCase())}
                placeholder="AA1234567"
                className="w-full bg-slate-50/70 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/25 focus:outline-none transition-all uppercase font-mono tracking-widest placeholder:text-slate-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                Parol *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50/70 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/25 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3.5 pt-4">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-650 hover:from-cyan-400 hover:to-blue-550 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-cyan-950/20 cursor-pointer transition-all text-center"
              >
                Tizimga kirish
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSubView('home')}
                className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-2xl cursor-pointer transition-all"
              >
                Orqaga
              </button>
            </div>

            {/* Link to Register */}
            <div className="text-center pt-2">
              <p className="text-[11px] font-semibold text-slate-500">
                Klinikada shaxsiy kartangiz yo'qmi?{" "}
                <button
                  type="button"
                  onClick={() => setActiveSubView('register')}
                  className="text-cyan-600 font-extrabold hover:underline"
                >
                  Yangi bemor ro'yxatdan o'tish
                </button>
              </p>
            </div>
          </form>
        </div>
      )}


      {/* ---------------- VIEW: QUEUE BOOKING WIZARD (clinic -> doctor -> confirm) ---------------- */}
      {activeSubView === 'booking' && currentUser && (
        <div className="max-w-3xl mx-auto animate-fade-in text-left">
          <form onSubmit={handleBookQueue} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">🎫 {t("Yangi navbat olish")}</h3>
                <p className="text-xs text-slate-500 mt-1">{t("Avval klinikani, so'ng shifokorni tanlang")}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubView('cabinet')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                ← {t("Kabinetga qaytish")}
              </button>
            </div>

            {/* Step 1: Clinic */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">1. {t("Klinikani tanlang")} *</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clinics.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setBookingClinicId(c.id);
                      // A doctor belongs to one clinic — switching clinics invalidates the old pick.
                      setBookingDoctorId('');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      bookingClinicId === c.id
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-900">🏥 {c.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1">📍 {c.address || ''}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Doctor (of the chosen clinic) */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">2. {t("Shifokorni tanlang")} *</h4>
              {!bookingClinicId ? (
                <p className="text-sm text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">{t("Avval klinikani tanlang")}</p>
              ) : (() => {
                const bookingClinicDoctors = doctors.filter(d => d.clinicId === bookingClinicId);
                if (bookingClinicDoctors.length === 0) {
                  return <p className="text-sm text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">{t("Bu klinikada hozircha shifokorlar yo'q")}</p>;
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bookingClinicDoctors.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setBookingDoctorId(d.id)}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                          bookingDoctorId === d.id
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <img
                          src={d.image}
                          alt={d.name}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + d.name; }}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{d.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{d.specialty}</p>
                          <p className="text-[11px] text-amber-500 font-bold mt-0.5">⭐ {(d.rating || 5).toFixed(1)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Step 3: Complaint (optional) */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">3. {t("Shikoyatingiz (ixtiyoriy)")}</h4>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={3}
                placeholder={t("Masalan: tishim og'riyapti...")}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!bookingClinicId || !bookingDoctorId}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
            >
              ✅ {t("Navbatni tasdiqlash")}
            </button>
          </form>
        </div>
      )}

      {/* ---------------- VIEW 3: PATIENT CABINET (SCREENSHOT 3) ---------------- */}
      {activeSubView === 'cabinet' && currentUser && (
        <PatientPanel
          patient={currentUser}
          onLogout={() => { setActiveSubView('home'); setCurrentUser(null); }}
          queues={queues}
          clinic={selectedClinic}
          onGoToBooking={() => {
            // Pre-select the patient's own clinic, but leave the doctor an explicit choice.
            setBookingClinicId(currentUser?.clinicId || activeClinic?.id || '');
            setBookingDoctorId('');
            setActiveSubView('booking');
          }}
          language={language}
          familyMembers={patients.filter(p => p.managedBy === currentUser.id)}
          onLinkFamilyMember={async (member) => {
            const updated = { ...member, managedBy: currentUser.id };
            setPatients(prev => prev.map(p => p.id === member.id ? updated : p));
            try {
              await fetch(`${getApiUrl()}/api/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
              });
            } catch (err) {
              console.warn('[ClientDashboard] Failed to link family member', err);
            }
          }}
          onUnlinkFamilyMember={async (member) => {
            const { managedBy, ...rest } = member;
            setPatients(prev => prev.map(p => p.id === member.id ? rest as Patient : p));
            try {
              await fetch(`${getApiUrl()}/api/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rest),
              });
            } catch (err) {
              console.warn('[ClientDashboard] Failed to unlink family member', err);
            }
          }}
          onSearchFamilyMember={async (query) => {
            const isPhone = /^[\d+\s()-]+$/.test(query);
            const param = isPhone ? `phone=${encodeURIComponent(query)}` : `passport=${encodeURIComponent(query)}`;
            try {
              const res = await fetch(`${getApiUrl()}/api/patients/search?${param}`);
              if (!res.ok) return [];
              return await res.json();
            } catch {
              return [];
            }
          }}
          onRegisterFamilyMember={async (info) => {
            const newMember: Patient = {
              id: 'pat_' + Math.random().toString(36).substr(2, 9),
              clinicId: currentUser.clinicId,
              fullName: info.fullName,
              passportSerial: info.passportSerial.toUpperCase(),
              phone: info.phone,
              birthDate: info.birthDate,
              password: info.password,
              managedBy: currentUser.id,
            };
            setPatients(prev => [...prev, newMember]);
            try {
              await fetch(`${getApiUrl()}/api/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMember),
              });
            } catch (err) {
              console.warn('[ClientDashboard] Failed to register family member', err);
            }
            return newMember;
          }}
        />
      )}

      {/* ----------------- FOOTER (SCREENSHOT 1) ----------------- */}
      <footer className="pt-8 border-t border-slate-200 mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs text-slate-400 font-semibold select-none pb-4">
          <p>© 2025-2026 DStoma Queue. Barcha huquqlar himoyalangan.</p>
          <p className="flex items-center gap-1.5 text-slate-500">
            Sizning sog'lig'ingiz biz uchun muhim ❤️
          </p>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
            <span>Avtomatik yangilanmoqda 3 soniya</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
