import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { patientBalance } from '../utils/treatmentBilling';
import {
  Home, Calendar, FileText, CreditCard,
  Smile, Clock, Bell, Users, Folder, Settings,
  HelpCircle, ChevronDown, BellRing,
  User, Star, Check, Phone, MessageCircle, Plus, Search, UserPlus, X, Trash2, Menu, Bot, Send, ImagePlus, Stethoscope
} from 'lucide-react';
import { Patient, QueueItem, Clinic, Doctor, PaymentReceipt, TreatmentCharge } from '../types';
import { decodeLegacyEntities } from '../utils/textFormat';
import { TreatmentItem } from './TreatmentPlan';
import AdBanner from './AdBanner';
import InstallAppBanner from './InstallAppBanner';
import BottomNav from './BottomNav';
import DentalChart from './DentalChart';
import { TRANSLATIONS, Language } from '../translations';
import { getApiUrl } from '../services/api';

interface NewFamilyMemberInfo {
  fullName: string;
  phone: string;
  passportSerial: string;
  birthDate: string;
  password: string;
}

type PatientPanelDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
const PATIENT_PANEL_TRANSLATIONS: Record<string, PatientPanelDictEntry> = {
  "qon guruhi": { ru: "Группа крови", en: "Blood group", kk: "Қан тобы", ky: "Кан тобу", tg: "Гурӯҳи хун", tk: "Gan topary" },
  "allergiyalar": { ru: "Аллергии", en: "Allergies", kk: "Аллергия", ky: "Аллергия", tg: "Аллергияҳо", tk: "Allergiýalar" },
  "surunkali kasalliklar": { ru: "Хронические заболевания", en: "Chronic diseases", kk: "Созылмалы аурулар", ky: "Уланма ооруулар", tg: "Бемориҳои музмин", tk: "Dowamly keseller" },
  "tanlang (noma'lum)": { ru: "Выберите (неизвестно)", en: "Select (unknown)", kk: "Таңдаңыз (белгісіз)", ky: "Тандаңыз (белгисиз)", tg: "Интихоб кунед (номаълум)", tk: "Saýlaň (näbelli)" },
  "ai yordamchi": { ru: "AI-помощник", en: "AI assistant", kk: "AI көмекші", ky: "AI жардамчы", tg: "Ёрдамчии AI", tk: "AI kömekçi" },
  "ai yordamchi — premium xizmat. bepul sinov muddati tugagan.": { ru: "AI-помощник — Premium-услуга. Бесплатный пробный период закончился.", en: "AI assistant is a Premium feature. The free trial has ended.", kk: "AI көмекші — Premium қызмет. Тегін сынақ мерзімі аяқталды.", ky: "AI жардамчы — Premium кызмат. Акысыз сыноо мөөнөтү бүттү.", tg: "Ёрдамчии AI — хизмати Premium. Мӯҳлати санҷиши ройгон ба охир расид.", tk: "AI kömekçi — Premium hyzmat. Mugt synag möhleti gutardy." },
  "(taxminiy javob — ai hozircha band, birozdan so'ng qayta urinib ko'ring)": { ru: "(Примерный ответ — AI сейчас занят, попробуйте чуть позже)", en: "(Approximate answer — the AI is busy right now, try again shortly)", kk: "(Болжамды жауап — AI қазір бос емес, сәлден соң қайталап көріңіз)", ky: "(Болжолдуу жооп — AI азыр бош эмес, бир аздан кийин кайра аракет кылыңыз)", tg: "(Ҷавоби тахминӣ — AI ҳоло банд аст, пас аз чанде такрор кунед)", tk: "(Takmyny jogap — AI häzir meşgul, biraz soň gaýtadan synanyşyň)" },
  "a'zoni qo'shishda xatolik yuz berdi.": { ru: "Произошла ошибка при добавлении члена семьи.", en: "An error occurred while adding the family member.", kk: "Мүшені қосу кезінде қате шықты.", ky: "Мүчөнү кошууда ката кетти.", tg: "Ҳангоми илова кардани аъзо хатогӣ рух дод.", tk: "Agzany goşmakda ýalňyşlyk ýüze çykdy." },
  "bekor qilingan": { ru: "Отменено", en: "Cancelled", kk: "Болдырылмады", ky: "Жокко чыгарылган", tg: "Бекор карда шуда", tk: "Ýatyrylan" },
  "oldingizda": { ru: "Перед вами", en: "Ahead of you", kk: "Алдыңызда", ky: "Алдыңызда", tg: "Пеш аз шумо", tk: "Öňüňizde" },
  "kishi": { ru: "чел.", en: "people", kk: "адам", ky: "адам", tg: "нафар", tk: "adam" },
  "navbat sizda": { ru: "Ваша очередь", en: "It's your turn", kk: "Кезек сізде", ky: "Кезек сизде", tg: "Навбати шумо", tk: "Sizin nobatyňyz" },
  "javob olishda xatolik yuz berdi. internet aloqasini tekshiring.": { ru: "Ошибка при получении ответа. Проверьте подключение к интернету.", en: "Failed to get a response. Check your internet connection.", kk: "Жауап алу кезінде қате. Интернет байланысын тексеріңіз.", ky: "Жооп алууда ката. Интернет байланышын текшериңиз.", tg: "Ҳангоми гирифтани ҷавоб хатогӣ. Пайвасти интернетро тафтиш кунед.", tk: "Jogap almakda ýalňyşlyk. Internet birikmesini barlaň." },
  "menyu": { ru: "Меню", en: "Menu", kk: "Мәзір", ky: "Меню", tg: "Меню", tk: "Menýu" },
  "rasm biriktirildi": { ru: "Изображение прикреплено", en: "Image attached", kk: "Сурет тіркелді", ky: "Сүрөт тиркелди", tg: "Тасвир замима шуд", tk: "Surat birikdirildi" },
  "rasm yuborildi": { ru: "Изображение отправлено", en: "Image sent", kk: "Сурет жіберілді", ky: "Сүрөт жөнөтүлдү", tg: "Тасвир фиристода шуд", tk: "Surat iberildi" },
  "savolingizni yozing...": { ru: "Напишите свой вопрос...", en: "Type your question...", kk: "Сұрағыңызды жазыңыз...", ky: "Сурооңузду жазыңыз...", tg: "Саволи худро нависед...", tk: "Soragyňyzy ýazyň..." },
  "so'm": { ru: "сум", en: "UZS", kk: "сом", ky: "сом", tg: "сӯм", tk: "som" },
  "tish sog'lig'i bo'yicha savol bering yoki rasm yuboring": { ru: "Задайте вопрос о здоровье зубов или отправьте фото", en: "Ask a question about dental health or send a photo", kk: "Тіс денсаулығы туралы сұрақ қойыңыз немесе сурет жіберіңіз", ky: "Тиш ден соолугу боюнча суроо бериңиз же сүрөт жөнөтүңүз", tg: "Дар бораи саломатии дандон савол диҳед ё акс фиристед", tk: "Diş saglygy barada sorag beriň ýa-da surat iberiň" },
  "yozmoqda...": { ru: "Печатает...", en: "Typing...", kk: "Жазып жатыр...", ky: "Жазып жатат...", tg: "Менависад...", tk: "Ýazýar..." },
  "davolovchi shifokor": { ru: "Лечащий врач", en: "Treating doctor", kk: "Емдеуші дәрігер", ky: "Дарылоочу дарыгер", tg: "Табиби муолиҷакунанда", tk: "Bejeriji lukman" },
  "shifokorni tanlang": { ru: "Выберите врача", en: "Select a doctor", kk: "Дәрігерді таңдаңыз", ky: "Дарыгерди тандаңыз", tg: "Табибро интихоб кунед", tk: "Lukmany saýlaň" },
  "hali biriktirilmagan": { ru: "Еще не назначен", en: "Not assigned yet", kk: "Әлі тағайындалмаған", ky: "Али дайындалган эмес", tg: "Ҳанӯз таъин нашудааст", tk: "Heniz bellenmedik" },
  "saqlanmadi, qayta urinib ko'ring": { ru: "Не сохранено, попробуйте еще раз", en: "Not saved, please try again", kk: "Сақталмады, қайталап көріңіз", ky: "Сакталган жок, кайра аракет кылыңыз", tg: "Захира нашуд, дубора кӯшиш кунед", tk: "Ýatda saklanmady, gaýtadan synanyşyň" },
  "o'zgartirish": { ru: "Изменить", en: "Change", kk: "Өзгерту", ky: "Өзгөртүү", tg: "Тағйир додан", tk: "Üýtgetmek" },
  saqlash: { ru: "Сохранить", en: "Save", kk: "Сақтау", ky: "Сактоо", tg: "Захира кардан", tk: "Ýatda saklamak" },
  "bosh sahifa": { ru: "Главная", en: "Home", kk: "Басты бет", ky: "Башкы бет", tg: "Саҳифаи асосӣ", tk: "Baş sahypa" },
  "mening navbatlarim": { ru: "Мои очереди", en: "My queues", kk: "Менің кезектерім", ky: "Менин кезектерим", tg: "Навбатҳои ман", tk: "Meniň nobatlarym" },
  "davolash rejam": { ru: "Мой план лечения", en: "My treatment plan", kk: "Менің емдеу жоспарым", ky: "Менин дарылоо планым", tg: "Нақшаи муолиҷаи ман", tk: "Meniň bejergi meýilnamam" },
  "to'lovlarim": { ru: "Мои платежи", en: "My payments", kk: "Менің төлемдерім", ky: "Менин төлөмдөрүм", tg: "Пардохтҳои ман", tk: "Meniň töleglerim" },
  "tashriflar tarixi": { ru: "История посещений", en: "Visit history", kk: "Тарихы", ky: "Тарых", tg: "Таърихи ташрифҳо", tk: "Baryş taryhy" },
  "eslatmalarim": { ru: "Мои напоминания", en: "My reminders", kk: "Менің ескертулерім", ky: "Менин эскертүүлөрүм", tg: "Ёдоварҳои ман", tk: "Meniň duýduryşlarym" },
  oilam: { ru: "Моя семья", en: "My family", kk: "Менің отбасым", ky: "Менин үй-бүлөм", tg: "Оилаи ман", tk: "Maşgalam" },
  "tish sxemasi": { ru: "Зубная карта", en: "Dental chart", kk: "Тіс картасы", ky: "Тиш картасы", tg: "Харитаи дандон", tk: "Diş kartasy" },
  sozlamalar: { ru: "Настройки", en: "Settings", kk: "Баптаулар", ky: "Тууралоолор", tg: "Танзимот", tk: "Sazlamalar" },
  "ko'rilayotgan kabinet": { ru: "Просматриваемый кабинет", en: "Viewing cabinet", kk: "Қаралып жатқан кабинет", ky: "Каралып жаткан кабинет", tg: "Кабинети дидашаванда", tk: "Görülýän kabinet" },
  men: { ru: "Я", en: "Me", kk: "Мен", ky: "Мен", tg: "Ман", tk: "Men" },
  "yordam kerakmi?": { ru: "Нужна помощь?", en: "Need help?", kk: "Көмек керек пе?", ky: "Жардам керекпи?", tg: "Ёрӣ лозим аст?", tk: "Kömek gerekmi?" },
  "biz bilan bog'laning": { ru: "Свяжитесь с нами", en: "Contact us", kk: "Бізбен байланысыңыз", ky: "Биз менен байланышыңыз", tg: "Бо мо тамос гиред", tk: "Biz bilen habarlaşyň" },
  "klinika bilan aloqa": { ru: "Связь с клиникой", en: "Contact clinic", kk: "Клиникамен байланыс", ky: "Клиника менен байланыш", tg: "Тамос бо клиника", tk: "Klinika bilen habarlaşyk" },
  "bemor paneli": { ru: "Панель пациента", en: "Patient panel", kk: "Пациент панелі", ky: "Бейтап панели", tg: "Панели бемор", tk: "Näsag paneli" },
  "ko'rilmoqda:": { ru: "Просматривается:", en: "Viewing:", kk: "Қаралуда:", ky: "Каралууда:", tg: "Дида мешавад:", tk: "Görülýär:" },
  chiqish: { ru: "Выход", en: "Log out", kk: "Шығу", ky: "Чыгуу", tg: "Баромад", tk: "Çykmak" },
  "keyingi navbatingiz": { ru: "Ваша следующая очередь", en: "Your next queue", kk: "Келесі кезегіңіз", ky: "Кийинки кезегиңиз", tg: "Навбати оянда", tk: "Indiki nobatyňyz" },
  rejalashtirilgan: { ru: "Запланировано", en: "Scheduled", kk: "Жоспарланды", ky: "Пландаштырылды", tg: "Ба нақша гирифташуда", tk: "Meýilleşdirildi" },
  chaqirilmoqda: { ru: "Вызывается", en: "Being called", kk: "Шақырылуда", ky: "Чакырылууда", tg: "Даъват мешавад", tk: "Çagyrylýar" },
  qabulda: { ru: "На приёме", en: "In session", kk: "Қабылдауда", ky: "Кабылдоодо", tg: "Дар қабул", tk: "Kabulda" },
  navbatda: { ru: "В очереди", en: "In queue", kk: "Кезекте", ky: "Кезекте", tg: "Дар навбат", tk: "Nobatda" },
  "navbat raqami:": { ru: "Номер очереди:", en: "Queue number:", kk: "Кезек нөмірі:", ky: "Кезек номери:", tg: "Рақами навбат:", tk: "Nobat belgisi:" },
  "hozircha faol navbatingiz yo'q": { ru: "У вас пока нет активной очереди", en: "You have no active queue yet", kk: "Сізде әзірге белсенді кезек жоқ", ky: "Сизде азырынча активдүү кезек жок", tg: "Шумо ҳанӯз навбати фаъол надоред", tk: "Sizde heniz işjeň nobat ýok" },
  "yangi navbat olish": { ru: "Взять новую очередь", en: "Take a new queue", kk: "Жаңа кезек алу", ky: "Жаңы кезек алуу", tg: "Гирифтани навбати нав", tk: "Täze nobat almak" },
  "navbat olish": { ru: "Взять очередь", en: "Take a queue", kk: "Кезек алу", ky: "Кезек алуу", tg: "Гирифтани навбат", tk: "Nobat almak" },
  "barchasini ko'rish": { ru: "Смотреть всё", en: "View all", kk: "Барлығын көру", ky: "Баарын көрүү", tg: "Ҳамаро дидан", tk: "Ählisini görmek" },
  "umumiy davolash rejasi": { ru: "Общий план лечения", en: "Overall treatment plan", kk: "Жалпы емдеу жоспары", ky: "Жалпы дарылоо планы", tg: "Нақшаи умумии муолиҷа", tk: "Umumy bejergi meýilnamasy" },
  "hozircha davolash rejasi kiritilmagan": { ru: "Пока не введён план лечения", en: "No treatment plan entered yet", kk: "Әзірге емдеу жоспары енгізілмеген", ky: "Азырынча дарылоо планы киргизилген эмес", tg: "Ҳанӯз нақшаи муолиҷа ворид нашудааст", tk: "Heniz bejergi meýilnamasy girizilmedi" },
  "so'nggi tashriflar": { ru: "Последние посещения", en: "Recent visits", kk: "Соңғы келулер", ky: "Акыркы келүүлөр", tg: "Ташрифҳои охирин", tk: "Soňky baryşlar" },
  "hozircha tashriflar tarixi yo'q": { ru: "Пока нет истории посещений", en: "No visit history yet", kk: "Әзірге келу тарихы жоқ", ky: "Азырынча келүү тарыхы жок", tg: "Ҳанӯз таърихи ташриф нест", tk: "Heniz baryş taryhy ýok" },
  jarayonda: { ru: "В процессе", en: "In progress", kk: "Барысында", ky: "Жүрүшүндө", tg: "Дар ҷараён", tk: "Dowam edýär" },
  "hozircha eslatmalar yo'q": { ru: "Пока нет напоминаний", en: "No reminders yet", kk: "Әзірге ескертулер жоқ", ky: "Азырынча эскертүүлөр жок", tg: "Ҳанӯз ёдоварӣ нест", tk: "Heniz duýduryş ýok" },
  "qolgan to'lov": { ru: "Оставшийся платёж", en: "Remaining payment", kk: "Қалған төлем", ky: "Калган төлөм", tg: "Пардохти боқимонда", tk: "Galan töleg" },
  "tezkor amallar": { ru: "Быстрые действия", en: "Quick actions", kk: "Жылдам әрекеттер", ky: "Тез аракеттер", tg: "Амалҳои зуд", tk: "Çalt hereketler" },
  "navbatni tanlang": { ru: "Выберите очередь", en: "Choose a queue", kk: "Кезекті таңдаңыз", ky: "Кезекти тандаңыз", tg: "Навбатро интихоб кунед", tk: "Nobaty saýlaň" },
  "telegram orqali chat": { ru: "Чат через Telegram", en: "Chat via Telegram", kk: "Telegram арқылы чат", ky: "Telegram аркылуу чат", tg: "Чат тавассути Telegram", tk: "Telegram arkaly çat" },
  "klinika bilan yozishing": { ru: "Пишите клинике", en: "Message the clinic", kk: "Клиникаға жазыңыз", ky: "Клиникага жазыңыз", tg: "Ба клиника нависед", tk: "Klinika ýazyň" },
  "to'liq reja va narxlar": { ru: "Полный план и цены", en: "Full plan and prices", kk: "Толық жоспар мен бағалар", ky: "Толук план жана баалар", tg: "Нақша ва нархҳои пурра", tk: "Doly meýilnama we bahalar" },
  "ma'lumot yo'q": { ru: "Нет информации", en: "No information", kk: "Ақпарат жоқ", ky: "Маалымат жок", tg: "Маълумот нест", tk: "Maglumat ýok" },
  "hozircha navbat tarixingiz yo'q": { ru: "У вас пока нет истории очередей", en: "You have no queue history yet", kk: "Сізде әзірге кезек тарихы жоқ", ky: "Сизде азырынча кезек тарыхы жок", tg: "Шумо ҳанӯз таърихи навбат надоред", tk: "Sizde heniz nobat taryhy ýok" },
  "navbat #": { ru: "Очередь №", en: "Queue #", kk: "Кезек №", ky: "Кезек №", tg: "Навбати №", tk: "Nobat #" },
  "umumiy reja": { ru: "Общий план", en: "Overall plan", kk: "Жалпы жоспар", ky: "Жалпы план", tg: "Нақшаи умумӣ", tk: "Umumy meýilnama" },
  bajarilgan: { ru: "Выполнено", en: "Done", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷрошуда", tk: "Ýerine ýetirildi" },
  qolgan: { ru: "Осталось", en: "Remaining", kk: "Қалды", ky: "Калды", tg: "Боқимонда", tk: "Galan" },
  "oila a'zolarim": { ru: "Члены моей семьи", en: "My family members", kk: "Менің отбасы мүшелерім", ky: "Менин үй-бүлө мүчөлөрүм", tg: "Аъзоёни оилаи ман", tk: "Maşgala agzalarym" },
  "yangi a'zo ro'yxatdan o'tkazish": { ru: "Зарегистрировать нового члена", en: "Register new member", kk: "Жаңа мүшені тіркеу", ky: "Жаңы мүчөнү каттоо", tg: "Сабти узви нав", tk: "Täze agzany hasaba almak" },
  "ota-ona, farzand, aka-uka, opa-singilingizni shu yerdan boshqaring — ularning navbati, davolash rejasi va tashriflar tarixini bir joydan ko'rasiz.": {
    ru: "Управляйте отсюда родителями, детьми, братьями и сёстрами — их очередь, план лечения и историю посещений вы увидите в одном месте.",
    en: "Manage your parents, children, and siblings from here — see their queue, treatment plan, and visit history in one place.",
    kk: "Ата-анаңызды, балаңызды, аға-інілеріңізді осы жерден басқарыңыз — олардың кезегін, емдеу жоспарын және келу тарихын бір жерден көресіз.",
    ky: "Ата-энеңизди, балаңызды, ага-инилериңизди ушул жерден башкарыңыз — алардын кезегин, дарылоо планын жана келүү тарыхын бир жерден көрөсүз.",
    tg: "Волидайн, фарзандон, бародарону хоҳаронатонро аз ин ҷо идора кунед — навбат, нақшаи муолиҷа ва таърихи ташрифи онҳоро дар як ҷо мебинед.",
    tk: "Ata-eneňizi, çagalaryňyzy, doganlaryňyzy şu ýerden dolandyryň — olaryň nobatyny, bejergi meýilnamasyny we baryş taryhyny bir ýerden görersiňiz."
  },
  "hozircha oila a'zosi qo'shilmagan": { ru: "Пока не добавлен ни один член семьи", en: "No family member added yet", kk: "Әзірге бірде-бір отбасы мүшесі қосылмаған", ky: "Азырынча бир дагы үй-бүлө мүчөсү кошулган эмес", tg: "Ҳанӯз ягон узви оила илова нашудааст", tk: "Heniz hiç bir maşgala agzasy goşulmady" },
  "kabinetini ko'rish": { ru: "Просмотреть кабинет", en: "View cabinet", kk: "Кабинетін көру", ky: "Кабинетин көрүү", tg: "Дидани кабинет", tk: "Kabinetini görmek" },
  "oiladan chiqarish": { ru: "Удалить из семьи", en: "Remove from family", kk: "Отбасынан шығару", ky: "Үй-бүлөдөн чыгаруу", tg: "Аз оила баровардан", tk: "Maşgaladan çykarmak" },
  "mavjud bemorni qidirib qo'shish": { ru: "Найти и добавить существующего пациента", en: "Find and add an existing patient", kk: "Бар пациентті тауып қосу", ky: "Бар бейтапты табып кошуу", tg: "Ёфтан ва иловаи бемори мавҷуда", tk: "Bar näsagy tapyp goşmak" },
  "telefon raqami yoki pasport seriyasi": { ru: "Номер телефона или серия паспорта", en: "Phone number or passport series", kk: "Телефон нөмірі немесе төлқұжат сериясы", ky: "Телефон номери же паспорт сериясы", tg: "Рақами телефон ё силсилаи шиноснома", tk: "Telefon belgisi ýa-da pasport seriýasy" },
  "qidirilmoqda...": { ru: "Идёт поиск...", en: "Searching...", kk: "Ізделуде...", ky: "Изделүүдө...", tg: "Ҷустуҷӯ...", tk: "Gözlenýär..." },
  qidirish: { ru: "Поиск", en: "Search", kk: "Іздеу", ky: "Издөө", tg: "Ҷустуҷӯ", tk: "Gözlemek" },
  "bunday bemor topilmadi": { ru: "Такой пациент не найден", en: "No such patient found", kk: "Мұндай пациент табылмады", ky: "Мындай бейтап табылган жок", tg: "Чунин бемор ёфт нашуд", tk: "Şeýle näsag tapylmady" },
  "oilamga qo'shish": { ru: "Добавить в семью", en: "Add to family", kk: "Отбасыма қосу", ky: "Үй-бүлөмө кошуу", tg: "Ба оила илова кардан", tk: "Maşgala goşmak" },
  "ism familiya": { ru: "Имя и фамилия", en: "Full name", kk: "Аты-жөні", ky: "Аты-жөнү", tg: "Ном ва насаб", tk: "Ady familiýasy" },
  telefon: { ru: "Телефон", en: "Phone", kk: "Телефон", ky: "Телефон", tg: "Телефон", tk: "Telefon" },
  "pasport seriyasi": { ru: "Серия паспорта", en: "Passport series", kk: "Төлқұжат сериясы", ky: "Паспорт сериясы", tg: "Силсилаи шиноснома", tk: "Pasport seriýasy" },
  "tug'ilgan sana": { ru: "Дата рождения", en: "Date of birth", kk: "Туған күні", ky: "Туулган күнү", tg: "Санаи таваллуд", tk: "Doglan senesi" },
  "oila a'zosini ro'yxatdan o'tkazish": { ru: "Регистрация члена семьи", en: "Register family member", kk: "Отбасы мүшесін тіркеу", ky: "Үй-бүлө мүчөсүн каттоо", tg: "Сабти узви оила", tk: "Maşgala agzasyny hasaba almak" },
  "to'liq ism": { ru: "Полное имя", en: "Full name", kk: "Толық аты", ky: "Толук аты", tg: "Номи пурра", tk: "Doly ady" },
  "ism familiya (namuna)": { ru: "Имя Фамилия", en: "First Last", kk: "Аты Тегі", ky: "Аты Теги", tg: "Ном Насаб", tk: "Ady Familiýasy" },
  parol: { ru: "Пароль", en: "Password", kk: "Құпия сөз", ky: "Сыр сөз", tg: "Парол", tk: "Parol" },
  "a'zo mustaqil kirishi uchun parol": { ru: "Пароль для самостоятельного входа члена", en: "Password for the member's own login", kk: "Мүшенің өз бетінше кіруі үшін құпия сөз", ky: "Мүчөнүн өз алдынча кириши үчүн сыр сөз", tg: "Парол барои воридшавии мустақилонаи узв", tk: "Agzanyň özi girmegi üçin parol" },
  "a'zo kattalashganda shu pasport va parol bilan o'z alohida kabinetiga kira oladi.": {
    ru: "Когда член семьи вырастет, он сможет войти в свой отдельный кабинет с этим паспортом и паролем.",
    en: "When the member grows up, they can log into their own separate cabinet with this passport and password.",
    kk: "Мүше есейгенде осы төлқұжат пен құпия сөз арқылы өзінің жеке кабинетіне кіре алады.",
    ky: "Мүчө чоңойгондо ушул паспорт жана сыр сөз менен өзүнүн өзүнчө кабинетине кире алат.",
    tg: "Вақте ки узв калон мешавад, метавонад бо ин шиноснома ва парол ба кабинети алоҳидаи худ ворид шавад.",
    tk: "Agza ulalanda şu pasport we parol bilen öz aýratyn kabinetine girip biler."
  },
  "bekor qilish": { ru: "Отмена", en: "Cancel", kk: "Болдырмау", ky: "Жокко чыгаруу", tg: "Бекор кардан", tk: "Ýatyrmak" },
  "navbatni bekor qilmoqchimisiz?": { ru: "Отменить очередь?", en: "Cancel this queue?", kk: "Кезекті болдырмайсыз ба?", ky: "Кезекти жокко чыгарасызбы?", tg: "Навбатро бекор мекунед?", tk: "Nobaty ýatyrmakçymysyňyz?" },
  "saqlanmoqda...": { ru: "Сохраняется...", en: "Saving...", kk: "Сақталуда...", ky: "Сакталууда...", tg: "Захира мешавад...", tk: "Ýatda saklanýar..." },
  "ro'yxatdan o'tkazish": { ru: "Зарегистрировать", en: "Register", kk: "Тіркеу", ky: "Каттоо", tg: "Сабти ном", tk: "Hasaba almak" },
  bajarildi: { ru: "Выполнено", en: "Done", kk: "Орындалды", ky: "Аткарылды", tg: "Иҷро шуд", tk: "Ýerine ýetirildi" },
  bemor: { ru: "Пациент", en: "Patient", kk: "Пациент", ky: "Бейтап", tg: "Бемор", tk: "Näsag" },
  "xush kelibsiz,": { ru: "Добро пожаловать,", en: "Welcome,", kk: "Қош келдіңіз,", ky: "Кош келдиңиз,", tg: "Хуш омадед,", tk: "Hoş geldiňiz," },
  "sizning og'iz sog'lig'ingiz biz uchun muhim.": { ru: "Здоровье вашей полости рта важно для нас.", en: "Your oral health matters to us.", kk: "Сіздің ауыз қуысыңыздың саулығы біз үшін маңызды.", ky: "Сиздин ооз көңдөйүңүздүн саламаттыгы биз үчүн маанилүү.", tg: "Саломатии даҳони шумо барои мо муҳим аст.", tk: "Siziň agyz saglygyňyz biz üçin möhüm." },
  "navbatlaringiz, davolash rejangiz va to'lovlaringizni shu yerda kuzatib boring.": { ru: "Следите здесь за вашими очередями, планом лечения и платежами.", en: "Track your queues, treatment plan, and payments here.", kk: "Кезектеріңізді, емдеу жоспарыңызды және төлемдеріңізді осы жерден бақылаңыз.", ky: "Кезектериңизди, дарылоо планыңызды жана төлөмдөрүңүздү ушул жерден байкап туруңуз.", tg: "Навбатҳо, нақшаи муолиҷа ва пардохтҳои худро дар ин ҷо пайгирӣ кунед.", tk: "Nobatlaryňyzy, bejergi meýilnamaňyzy we tölegleriňizi şu ýerden yzarlaň." },
};

export default function PatientPanel({
  patient,
  onLogout,
  queues = [],
  clinic,
  onGoToBooking,
  onCancelQueue,
  familyMembers = [],
  onUnlinkFamilyMember,
  onRegisterFamilyMember,
  language,
  doctors = [],
  onChangeDoctor,
  onUpdateProfile,
}: {
  patient: Patient;
  onLogout: () => void;
  queues?: QueueItem[];
  clinic?: Clinic | null;
  onGoToBooking?: () => void;
  onCancelQueue?: (queueId: string) => void;
  familyMembers?: Patient[];
  onUnlinkFamilyMember?: (member: Patient) => Promise<void>;
  onRegisterFamilyMember?: (info: NewFamilyMemberInfo) => Promise<Patient>;
  language?: Language;
  doctors?: Doctor[];
  // Second arg says which patient record to update — see TreatingDoctorCard.
  onChangeDoctor?: (doctorId: string, forPatientId: string) => Promise<void>;
  // `updates.id` says which patient record to write — the logged-in account, or
  // a family member being viewed. Omitting it used to mean "always the logged-in
  // account", which is what let editing a child's cabinet silently overwrite
  // the parent's own phone/passport/medical fields.
  onUpdateProfile?: (updates: Partial<Patient> & { id: string }) => Promise<void>;
}) {
  const localLang: keyof PatientPanelDictEntry | null =
    (language === "ru" || language === "en" || language === "kk" || language === "ky" || language === "tg" || language === "tk")
      ? language
      : null;

  const t = (text: string): string => {
    if (!language) return text;
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof (typeof TRANSLATIONS)["uz"]];
    }
    const cleanText = text.trim().toLowerCase().replace(/\s+/g, " ");
    const entry = PATIENT_PANEL_TRANSLATIONS[cleanText] || PATIENT_PANEL_TRANSLATIONS[text];
    if (entry) {
      if (localLang) return entry[localLang];
      const idx = text.search(/[a-zA-Zʻʼ'’]/);
      if (idx === -1) return text;
      return text.slice(0, idx) + text.charAt(idx).toUpperCase() + text.slice(idx + 1);
    }
    return text;
  };

  const [activeTab, setActiveTab] = useState('bosh_sahifa');
  // Registration now only collects fullName + password (see ClientDashboard's
  // register form) — phone, passport, birth date, and the medical fields below
  // are deliberately deferred to here, so this is the one place they actually
  // get filled in.
  // Which patient record the cabinet is currently showing: the logged-in
  // account itself, or a family member they manage (picked below). Hoisted
  // above the profile-form state so Sozlamalar edits the patient actually on
  // screen — this used to always read/write `patient` (the parent), so filling
  // in a child's own phone/passport/medical fields while viewing their cabinet
  // silently overwrote the parent's instead.
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingPatient = viewingId ? familyMembers.find((m) => m.id === viewingId) || patient : patient;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: viewingPatient?.phone || '',
    passportSerial: viewingPatient?.passportSerial || '',
    birthDate: viewingPatient?.birthDate || '',
    bloodGroup: viewingPatient?.bloodGroup || '',
    allergies: viewingPatient?.allergies || '',
    chronicDiseases: viewingPatient?.chronicDiseases || '',
  });
  useEffect(() => {
    if (isEditingProfile) return;
    setProfileForm({
      phone: viewingPatient?.phone || '',
      passportSerial: viewingPatient?.passportSerial || '',
      birthDate: viewingPatient?.birthDate || '',
      bloodGroup: viewingPatient?.bloodGroup || '',
      allergies: viewingPatient?.allergies || '',
      chronicDiseases: viewingPatient?.chronicDiseases || '',
    });
    // Only re-sync from the incoming patient prop while NOT editing — otherwise
    // the background poll refreshing `patient` every few seconds would stomp
    // on whatever the user is mid-typing. Also re-syncs on switching who is
    // being viewed, so the form shows the newly-picked family member's own
    // values instead of briefly showing the previous patient's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingPatient?.id, viewingPatient?.phone, viewingPatient?.passportSerial, viewingPatient?.birthDate, viewingPatient?.bloodGroup, viewingPatient?.allergies, viewingPatient?.chronicDiseases, isEditingProfile]);
  const handleSaveProfile = async () => {
    if (!onUpdateProfile) return;
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        id: viewingPatient.id,
        phone: profileForm.phone.trim() || undefined,
        passportSerial: profileForm.passportSerial.trim() || undefined,
        birthDate: profileForm.birthDate || undefined,
        bloodGroup: profileForm.bloodGroup || undefined,
        allergies: profileForm.allergies.trim() || undefined,
        chronicDiseases: profileForm.chronicDiseases.trim() || undefined,
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.warn('[PatientPanel] Failed to save profile', err);
    } finally {
      setIsSavingProfile(false);
    }
  };
  // Sidebar is always-visible on desktop; on narrow (phone) screens it's an off-canvas
  // drawer toggled by a hamburger button, closed by default and after picking a tab.
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Tracked directly instead of relying on Tailwind's md: + negative-translate utility
  // combo, which didn't reliably generate the expected CSS in this project's Tailwind
  // v4 setup — an inline transform driven by this flag is unambiguous either way.
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => setIsDesktopViewport(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [planItems, setPlanItems] = useState<TreatmentItem[]>([]);
  const [myReceipts, setMyReceipts] = useState<PaymentReceipt[]>([]);
  const [myCharges, setMyCharges] = useState<TreatmentCharge[]>([]);
  const [showRegisterFamilyForm, setShowRegisterFamilyForm] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState<NewFamilyMemberInfo>({
    fullName: '', phone: '', passportSerial: '', birthDate: '', password: '',
  });
  const [isRegisteringFamilyMember, setIsRegisteringFamilyMember] = useState(false);
  const [familyRegisterError, setFamilyRegisterError] = useState('');

  type AiChatMessage = { role: 'user' | 'assistant'; text: string; isSimulation?: boolean };
  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatImage, setAiChatImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [aiChatSending, setAiChatSending] = useState(false);
  const [aiChatRequiresPremium, setAiChatRequiresPremium] = useState(false);

  const handleAiChatImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, base64] = result.split(',');
      setAiChatImage({ data: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleAiChatSend = async () => {
    const messageText = aiChatInput.trim();
    if (!messageText && !aiChatImage) return;
    setAiChatMessages((prev) => [...prev, { role: 'user', text: messageText || t("rasm yuborildi") }]);
    setAiChatInput('');
    const imageToSend = aiChatImage;
    setAiChatImage(null);
    setAiChatSending(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/ai/patient-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic?.id,
          message: messageText,
          image: imageToSend,
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.requiresPremium) {
        setAiChatRequiresPremium(true);
        return;
      }
      setAiChatMessages((prev) => [...prev, { role: 'assistant', text: data.reply || '', isSimulation: !!data.isSimulation }]);
    } catch {
      setAiChatMessages((prev) => [...prev, { role: 'assistant', text: t("javob olishda xatolik yuz berdi. internet aloqasini tekshiring."), isSimulation: true }]);
    } finally {
      setAiChatSending(false);
    }
  };


  const handleRegisterFamilyMember = async () => {
    if (!newFamilyMember.fullName.trim() || !newFamilyMember.phone.trim() || !newFamilyMember.passportSerial.trim() || !newFamilyMember.password.trim()) return;
    if (!onRegisterFamilyMember) return;
    setIsRegisteringFamilyMember(true);
    setFamilyRegisterError('');
    try {
      await onRegisterFamilyMember(newFamilyMember);
      setShowRegisterFamilyForm(false);
      setNewFamilyMember({ fullName: '', phone: '', passportSerial: '', birthDate: '', password: '' });
    } catch (err: any) {
      // Keep the form open with what they typed — the server rejects a passport
      // that already belongs to someone, and closing silently would show a
      // family member that was never actually saved.
      setFamilyRegisterError(err?.message || t("A'zoni qo'shishda xatolik yuz berdi."));
    } finally {
      setIsRegisteringFamilyMember(false);
    }
  };

  const isViewingSelf = viewingPatient.id === patient.id;

  useEffect(() => {
    if (!viewingPatient?.id) return;
    const unsub = onSnapshot(
      collection(db, `patients/${viewingPatient.id}/treatmentPlans`),
      (snapshot) => {
        const data: TreatmentItem[] = [];
        snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as TreatmentItem));
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPlanItems(data);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `patients/${viewingPatient.id}/treatmentPlans`)
    );
    return () => unsub();
  }, [viewingPatient?.id]);

  // The patient's own payments AND charges, so their figures match the doctor's.
  // Charges carry the discounts: passing an empty list here (as this used to)
  // made every treatment fall back to its undiscounted list price, so the
  // patient was shown a different bill from the one their doctor sees.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dstoma_patient_token') : null;
    if (!viewingPatient?.id || !token) { setMyReceipts([]); setMyCharges([]); return; }
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };
    const q = encodeURIComponent(viewingPatient.id);
    fetch(`${getApiUrl()}/api/payment-receipts?patientId=${q}`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (active) setMyReceipts(Array.isArray(d) ? d : []); })
      .catch(() => { if (active) setMyReceipts([]); });
    fetch(`${getApiUrl()}/api/treatment-charges?patientId=${q}`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (active) setMyCharges(Array.isArray(d) ? d : []); })
      .catch(() => { if (active) setMyCharges([]); });
    return () => { active = false; };
  }, [viewingPatient?.id]);

  // patientId is the reliable link; normalized phone is only a fallback for
  // queues created before that field existed (or by a legacy client). Phone-only
  // matching used to be the sole check, which silently showed no queue at all
  // for any patient who hadn't filled in a phone number yet — registration only
  // requires fullName + password now, so that's common for freshly-booked patients.
  const normalizedPhone = (viewingPatient?.phone || '').replace(/\D/g, '');
  const myQueues = queues.filter((q) => {
    if (viewingPatient?.id && q.patientId) return q.patientId === viewingPatient.id;
    if (!normalizedPhone) return false;
    return (q.patientPhone || '').replace(/\D/g, '') === normalizedPhone;
  });
  const nextQueue = myQueues
    .filter((q) => ['pending', 'scheduled', 'calling', 'in_progress'].includes(q.status))
    .sort((a, b) => new Date(a.appointmentDate || a.createdAt).getTime() - new Date(b.appointmentDate || b.createdAt).getTime())[0] || null;

  // "Oldingizda N kishi" for an undated walk-in ticket — the same doctor's other
  // still-waiting walk-ins with a lower ticket number. Scheduled appointments
  // (a picked date/time) don't have a meaningful queue position, so this stays
  // null for those and the UI falls back to showing the date/time instead.
  const queuePosition = (nextQueue && nextQueue.status === 'pending' && !nextQueue.appointmentDate)
    ? queues.filter((q) =>
        q.doctorId === nextQueue.doctorId &&
        q.clinicId === nextQueue.clinicId &&
        !q.appointmentDate &&
        ['pending', 'calling', 'in_progress'].includes(q.status) &&
        q.number < nextQueue.number
      ).length
    : null;

  const visits = [...(viewingPatient?.clinicVisits || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activePlanItems = planItems.filter((i) => i.status !== 'Cancelled');
  // Money via the shared billing util so the patient sees the same figures the
  // doctor does. Without a patient session token the payment list stays empty,
  // in which case this reads as fully outstanding — never as wrongly paid.
  const patientBilling = useMemo(
    () => patientBalance(planItems, myCharges, myReceipts, {
      clinicId: viewingPatient?.clinicId,
      patientId: viewingPatient?.id,
      patientName: viewingPatient?.fullName,
    }),
    [planItems, myCharges, myReceipts, viewingPatient?.id, viewingPatient?.clinicId, viewingPatient?.fullName]
  );
  const totalCost = patientBilling.total;
  const completedCost = patientBilling.paid;
  const remainingCost = patientBilling.debt;
  const planProgress = activePlanItems.length > 0
    ? Math.round((activePlanItems.filter((i) => i.status === 'Completed').length / activePlanItems.length) * 100)
    : 0;
  const upcomingPlanItems = activePlanItems.filter((i) => i.status !== 'Completed');

  const navItems: { id: string; icon: React.ReactNode; label: string }[] = [
    { id: 'bosh_sahifa', icon: <Home size={18} />, label: t('bosh sahifa') },
    { id: 'navbatlar', icon: <Calendar size={18} />, label: t('mening navbatlarim') },
    { id: 'reja', icon: <FileText size={18} />, label: t('davolash rejam') },
    { id: 'tolovlar', icon: <CreditCard size={18} />, label: t("to'lovlarim") },
    { id: 'tarix', icon: <Clock size={18} />, label: t('tashriflar tarixi') },
    { id: 'tish_sxemasi', icon: <Smile size={18} />, label: t('tish sxemasi') },
    { id: 'eslatma', icon: <Bell size={18} />, label: t('eslatmalarim') },
    { id: 'oilam', icon: <Users size={18} />, label: t('oilam') },
    { id: 'ai_yordamchi', icon: <Bot size={18} />, label: t('AI Yordamchi') },
    { id: 'sozlamalar', icon: <Settings size={18} />, label: t('sozlamalar') },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex font-sans text-slate-800">
      {/* Mobile-only backdrop, tap to close the drawer */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop; an off-canvas drawer on phone screens */}
      <div
        className="fixed md:static inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white border-r border-slate-200 flex flex-col h-full shadow-sm transition-transform duration-300"
        style={{ transform: isDesktopViewport || isMobileNavOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
            🦷
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">DStoma<br/><span className="text-sm font-semibold text-blue-600">NAVBATI</span></span>
        </div>

        {/* Profile Info */}
        <div className="px-6 py-4 flex items-center gap-3">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(decodeLegacyEntities(patient?.fullName) || t('bemor'))}&background=0D8ABC&color=fff`} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">{decodeLegacyEntities(patient?.fullName) || t('bemor')}</h3>
            <p className="text-xs text-slate-500 font-medium">{decodeLegacyEntities(patient?.phone) || '+998 -- --- -- --'}</p>
          </div>
        </div>

        {familyMembers.length > 0 && (
          <div className="px-6 pb-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t("ko'rilayotgan kabinet")}</label>
            <select
              value={viewingId || ''}
              onChange={(e) => setViewingId(e.target.value || null)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">{decodeLegacyEntities(patient.fullName)} ({t('men')})</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>{decodeLegacyEntities(m.fullName)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              active={activeTab === item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileNavOpen(false); }}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>

        {/* Support */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-2 text-slate-700">
              <HelpCircle size={20} />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-1">{t('yordam kerakmi?')}</p>
            <p className="text-[10px] text-slate-500 mb-3">{t("biz bilan bog'laning")}</p>
            {clinic?.phone ? (
              <a href={`tel:${clinic.phone}`} className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors">
                {t('klinika bilan aloqa')}
              </a>
            ) : (
              <button disabled className="w-full bg-slate-200 text-slate-400 font-bold text-xs py-2.5 rounded-xl cursor-not-allowed">
                {t('klinika bilan aloqa')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 md:h-20 bg-[#F8FAFC] flex items-center justify-between px-4 md:px-10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 shrink-0"
              aria-label={t('menyu')}
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-slate-900 truncate">{navItems.find((n) => n.id === activeTab)?.label || t('bemor paneli')}</h1>
              {!isViewingSelf && (
                <p className="text-xs font-bold text-blue-600 mt-0.5 truncate">{t("ko'rilmoqda:")} {decodeLegacyEntities(viewingPatient.fullName)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <button onClick={onLogout} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs md:text-sm border border-indigo-100/50 hover:bg-indigo-100 transition-colors">
              <User size={16} /> <span className="hidden sm:inline">{t('chiqish')}</span> <ChevronDown size={14} className="hidden sm:inline" />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 pb-24 md:pb-10">

          {activeTab === 'bosh_sahifa' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InstallAppBanner />
              <TreatingDoctorCard
                patient={viewingPatient}
                doctors={doctors}
                onChangeDoctor={onChangeDoctor}
                t={t}
              />
              {/* Main Welcome Banner */}
              <div className="md:col-span-2 bg-blue-50/50 rounded-3xl p-8 border border-blue-100 flex items-center justify-between overflow-hidden relative">
                <div className="max-w-sm z-10">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('xush kelibsiz,')} {decodeLegacyEntities(patient?.fullName)?.split(' ')[0] || t('bemor')}! 👋</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t("sizning og'iz sog'lig'ingiz biz uchun muhim.")}
                    {' '}{t("navbatlaringiz, davolash rejangiz va to'lovlaringizni shu yerda kuzatib boring.")}
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 w-[40%] h-full opacity-80" style={{
                  backgroundImage: 'url("https://cdn3d.iconscout.com/3d/premium/thumb/tooth-4993510-4161103.png")',
                  backgroundSize: 'contain',
                  backgroundPosition: 'right bottom',
                  backgroundRepeat: 'no-repeat'
                }}></div>
              </div>

              <div className="md:col-span-3">
                <AdBanner placement="web_patient_panel" clinicId={patient?.clinicId} />
              </div>

              {/* Next Queue Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">{t("keyingi navbatingiz")}</h3>
                  {nextQueue && (
                    <span className={
                      "px-3 py-1 text-[10px] font-bold rounded-lg border " +
                      (nextQueue.status === 'calling'
                        // Visually distinct on purpose: this is the one status that means
                        // "go to the cabinet right now" — it used to look identical to
                        // plain waiting, so patients had no visual cue to act on.
                        ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'
                        : nextQueue.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                    }>
                      {nextQueue.status === 'scheduled' ? t("rejalashtirilgan") : nextQueue.status === 'calling' ? t("chaqirilmoqda") : nextQueue.status === 'in_progress' ? t("qabulda") : t("navbatda")}
                    </span>
                  )}
                </div>
                {nextQueue ? (
                  <div className="flex gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{nextQueue.appointmentDate || new Date(nextQueue.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs font-medium text-slate-500">{nextQueue.appointmentTime || ''}</p>
                      <div className="mt-2 text-sm text-slate-700">
                        <p className="font-bold">{t("navbat raqami:")} #{nextQueue.number}</p>
                        {queuePosition !== null && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {queuePosition > 0 ? `${t("oldingizda")} ${queuePosition} ${t("kishi")}` : t("navbat sizda")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">{t("hozircha faol navbatingiz yo'q")}</p>
                )}
                {nextQueue && <AdBanner placement="web_queue_screen" clinicId={patient?.clinicId} />}
                {nextQueue ? (
                  <button
                    onClick={() => {
                      if (window.confirm(t("navbatni bekor qilmoqchimisiz?"))) onCancelQueue?.(nextQueue.id);
                    }}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-xl transition-colors border border-rose-100"
                  >
                    {t("bekor qilish")}
                  </button>
                ) : (
                  <button onClick={onGoToBooking} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-md shadow-blue-600/20">
                    {t("navbat olish")}
                  </button>
                )}
              </div>

              {/* Treatment Plan */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] md:col-span-1 md:row-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">{t("davolash rejam")}</h3>
                  <button onClick={() => setActiveTab('reja')} className="text-blue-600 text-xs font-bold hover:underline">{t("barchasini ko'rish")} &gt;</button>
                </div>

                {activePlanItems.length > 0 ? (
                  <>
                    <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                          🦷
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">{t("umumiy davolash rejasi")}</p>
                          <p className="font-bold text-slate-900 text-lg">{totalCost.toLocaleString()} {t("so'm")}</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${planProgress}%` }}></div>
                      </div>
                      <p className="text-right text-[10px] font-bold text-slate-500">{planProgress}%</p>
                    </div>

                    <div className="space-y-4">
                      {activePlanItems.slice(0, 4).map((item) => (
                        <PlanItem
                          key={item.id}
                          status={item.status === 'Completed' ? 'done' : item.status === 'In Progress' ? 'current' : 'planned'}
                          title={`${item.toothId ? `${item.toothId}-tish ` : ''}${item.treatment}`}
                          price={`${item.price.toLocaleString()} ${t("so'm")}`}
                          date={item.status === 'Completed' ? new Date(item.createdAt).toLocaleDateString() : undefined}
                          doneLabel={t("bajarildi")}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">{t("hozircha davolash rejasi kiritilmagan")}</p>
                )}
              </div>

              {/* Last Visits */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">{t("so'nggi tashriflar")}</h3>
                  <button onClick={() => setActiveTab('tarix')} className="text-blue-600 text-xs font-bold hover:underline">{t("barchasini ko'rish")} &gt;</button>
                </div>
                {visits.length > 0 ? (
                  <div className="space-y-4">
                    {visits.slice(0, 4).map((v) => (
                      <VisitItem
                        key={v.id}
                        date={new Date(v.date).toLocaleDateString()}
                        title={v.serviceName}
                        doctor={decodeLegacyEntities(v.doctorName) || ''}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">{t("hozircha tashriflar tarixi yo'q")}</p>
                )}
              </div>

              {/* Right Column: Reminders & Payments */}
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900">{t("eslatmalarim")}</h3>
                    <button onClick={() => setActiveTab('eslatma')} className="text-blue-600 text-xs font-bold hover:underline">{t("barchasini ko'rish")} &gt;</button>
                  </div>
                  {upcomingPlanItems.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingPlanItems.slice(0, 2).map((item) => (
                        <div key={item.id} className="bg-orange-50 rounded-2xl p-4 flex items-center justify-between border border-orange-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl text-orange-500 flex items-center justify-center shadow-sm">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{item.treatment}</p>
                              <p className="text-xs text-slate-500">{item.toothId ? `${item.toothId}-tish` : ''}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold">
                            {item.status === 'In Progress' ? t("jarayonda") : t("rejalashtirilgan")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">{t("hozircha eslatmalar yo'q")}</p>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900">{t("to'lovlarim")}</h3>
                    <button onClick={() => setActiveTab('tolovlar')} className="text-blue-600 text-xs font-bold hover:underline">{t("barchasini ko'rish")} &gt;</button>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">{t("qolgan to'lov")}</p>
                    <p className="text-xl font-bold text-slate-900">{remainingCost.toLocaleString()} <span className="text-sm font-medium">{t("so'm")}</span></p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="md:col-span-3 mt-2">
                <h3 className="font-bold text-slate-900 mb-4">{t("tezkor amallar")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <QuickAction onClick={onGoToBooking} icon={<Calendar className="text-purple-500" />} title={t("yangi navbat olish")} desc={t("navbatni tanlang")} bg="bg-purple-50" border="border-purple-100" />
                  <a href="https://t.me/dstoma_bot" target="_blank" rel="noopener noreferrer">
                    <QuickAction icon={<MessageCircle className="text-blue-500" />} title={t("telegram orqali chat")} desc={t("klinika bilan yozishing")} bg="bg-blue-50" border="border-blue-100" />
                  </a>
                  <QuickAction onClick={() => setActiveTab('reja')} icon={<FileText className="text-emerald-500" />} title={t("davolash rejam")} desc={t("to'liq reja va narxlar")} bg="bg-emerald-50" border="border-emerald-100" />
                  {clinic?.phone ? (
                    <a href={`tel:${clinic.phone}`}>
                      <QuickAction icon={<Phone className="text-indigo-500" />} title={t("klinika bilan aloqa")} desc={decodeLegacyEntities(clinic.phone)} bg="bg-indigo-50" border="border-indigo-100" />
                    </a>
                  ) : (
                    <QuickAction icon={<Phone className="text-indigo-500" />} title={t("klinika bilan aloqa")} desc={t("ma'lumot yo'q")} bg="bg-indigo-50" border="border-indigo-100" />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'navbatlar' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">{t("mening navbatlarim")}</h3>
              {myQueues.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">{t("hozircha navbat tarixingiz yo'q")}</p>
              ) : (
                <div className="space-y-3">
                  {myQueues.map((q) => {
                    const d = new Date(q.appointmentDate || q.createdAt);
                    const statusStyle: Record<string, string> = {
                      pending: 'bg-amber-50 text-amber-600 border-amber-100',
                      scheduled: 'bg-blue-50 text-blue-600 border-blue-100',
                      calling: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      in_progress: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      completed: 'bg-slate-100 text-slate-500 border-slate-200',
                      cancelled: 'bg-rose-50 text-rose-500 border-rose-100',
                    };
                    const statusLabel: Record<string, string> = {
                      pending: t('navbatda'),
                      scheduled: t('rejalashtirilgan'),
                      calling: t('chaqirilmoqda'),
                      in_progress: t('qabulda'),
                      completed: t('bajarildi'),
                      cancelled: t('bekor qilingan'),
                    };
                    const isActive = ['pending', 'scheduled', 'calling', 'in_progress'].includes(q.status);
                    return (
                      <div key={q.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center shrink-0 leading-none">
                          <span className="text-[15px] font-black">{d.getDate()}</span>
                          <span className="text-[9px] font-bold uppercase">{d.toLocaleDateString('uz-UZ', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm">{t("navbat #")}{q.number}</p>
                          <p className="text-xs text-slate-500 truncate">{q.appointmentTime || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase border shrink-0 ${statusStyle[q.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {statusLabel[q.status] || q.status}
                        </span>
                        {isActive && onCancelQueue && (
                          <button
                            onClick={() => {
                              if (window.confirm(t("navbatni bekor qilmoqchimisiz?"))) onCancelQueue(q.id);
                            }}
                            className="shrink-0 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={t("bekor qilish")}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reja' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">{t("davolash rejam")}</h3>
              {activePlanItems.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">{t("hozircha davolash rejasi kiritilmagan")}</p>
              ) : (
                <div className="space-y-4">
                  {activePlanItems.map((item) => (
                    <PlanItem
                      key={item.id}
                      status={item.status === 'Completed' ? 'done' : item.status === 'In Progress' ? 'current' : 'planned'}
                      title={`${item.toothId ? `${item.toothId}-tish ` : ''}${item.treatment}`}
                      price={`${item.price.toLocaleString()} ${t("so'm")}`}
                      date={item.status === 'Completed' ? new Date(item.createdAt).toLocaleDateString() : undefined}
                      doneLabel={t("bajarildi")}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tolovlar' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-lg">
              <h3 className="font-bold text-slate-900 mb-4">{t("to'lovlarim")}</h3>
              <div className="bg-slate-50 rounded-2xl p-5 mb-5 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{t("qolgan to'lov")}</p>
                  <p className="text-xl font-bold text-slate-900">{remainingCost.toLocaleString()} <span className="text-sm font-medium">{t("so'm")}</span></p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-slate-600"><div className="w-2 h-2 rounded-full bg-slate-400"></div> {t("umumiy reja")}</span>
                  <span className="font-bold text-slate-900">{totalCost.toLocaleString()} {t("so'm")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-slate-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {t("bajarilgan")}</span>
                  <span className="font-bold text-slate-900">{completedCost.toLocaleString()} {t("so'm")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-slate-600"><div className="w-2 h-2 rounded-full bg-red-500"></div> {t("qolgan")}</span>
                  <span className="font-bold text-slate-900">{remainingCost.toLocaleString()} {t("so'm")}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tarix' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">{t("tashriflar tarixi")}</h3>
              {visits.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">{t("hozircha tashriflar tarixi yo'q")}</p>
              ) : (
                <div className="space-y-2">
                  {visits.map((v) => (
                    <VisitItem
                      key={v.id}
                      date={new Date(v.date).toLocaleDateString()}
                      title={v.serviceName}
                      doctor={decodeLegacyEntities(v.doctorName) || ''}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'eslatma' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">{t("eslatmalarim")}</h3>
              {upcomingPlanItems.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">{t("hozircha eslatmalar yo'q")}</p>
              ) : (
                <div className="space-y-3">
                  {upcomingPlanItems.map((item) => (
                    <div key={item.id} className="bg-orange-50 rounded-2xl p-4 flex items-center justify-between border border-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl text-orange-500 flex items-center justify-center shadow-sm">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.treatment}</p>
                          <p className="text-xs text-slate-500">{item.toothId ? `${item.toothId}-tish` : ''}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold">
                        {item.status === 'In Progress' ? t("jarayonda") : t("rejalashtirilgan")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tish_sxemasi' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: '75vh' }}>
              <DentalChart patientId={viewingPatient.id} readOnly language={language} />
            </div>
          )}

          {activeTab === 'oilam' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">{t("oila a'zolarim")}</h3>
                  <button
                    onClick={() => setShowRegisterFamilyForm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    <UserPlus size={14} /> {t("yangi a'zo ro'yxatdan o'tkazish")}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  {t("ota-ona, farzand, aka-uka, opa-singilingizni shu yerdan boshqaring — ularning navbati, davolash rejasi va tashriflar tarixini bir joydan ko'rasiz.")}
                </p>
                {familyMembers.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">{t("hozircha oila a'zosi qo'shilmagan")}</p>
                ) : (
                  <div className="space-y-3">
                    {familyMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(decodeLegacyEntities(m.fullName) || t('bemor'))}&background=0D8ABC&color=fff`} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{decodeLegacyEntities(m.fullName)}</p>
                            <p className="text-xs text-slate-500">{decodeLegacyEntities(m.phone)} {m.birthDate ? `· ${m.birthDate}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setViewingId(m.id); setActiveTab('bosh_sahifa'); }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            {t("kabinetini ko'rish")}
                          </button>
                          <button
                            onClick={() => onUnlinkFamilyMember?.(m)}
                            title={t("oiladan chiqarish")}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* The "find an existing patient by phone and add them" panel was
                  removed. Setting managedBy to yourself was its own authorization
                  server-side, so knowing someone's phone number was enough to
                  attach them and then read their whole chart. Family members can
                  now only be registered as new people. */}
              <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 font-semibold leading-snug">
                  {t("oila a'zosini faqat yangi ro'yxatdan o'tkazish orqali qo'shish mumkin")}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ai_yordamchi' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col max-w-2xl" style={{ height: '75vh' }}>
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">AI Yordamchi</h3>
                  <p className="text-[11px] text-slate-500">{t("tish sog'lig'i bo'yicha savol bering yoki rasm yuboring")}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiChatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 px-6">
                    <Bot size={32} className="mb-2 opacity-40" />
                    <p className="text-sm">{t("savolingizni yozing — masalan, \"tishim og'riyapti, nima qilishim kerak?\"")}</p>
                  </div>
                )}
                {aiChatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {m.text}
                      {m.isSimulation && (
                        <p className={`text-[10px] mt-1.5 ${m.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                          {t("(taxminiy javob — AI hozircha band, birozdan so'ng qayta urinib ko'ring)")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {aiChatSending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-400 rounded-2xl px-4 py-2.5 text-sm">{t("yozmoqda...")}</div>
                  </div>
                )}
              </div>

              {aiChatRequiresPremium ? (
                <div className="p-4 border-t border-slate-100 bg-rose-50 text-center shrink-0">
                  <p className="text-xs font-bold text-rose-600">{t("AI Yordamchi — Premium xizmat. Bepul sinov muddati tugagan.")}</p>
                </div>
              ) : (
                <div className="p-3 border-t border-slate-100 shrink-0">
                  {aiChatImage && (
                    <div className="mb-2 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 w-fit">
                      <span className="text-xs text-slate-500">{t("rasm biriktirildi")}</span>
                      <button onClick={() => setAiChatImage(null)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="p-2.5 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0">
                      <ImagePlus size={18} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAiChatImagePick} />
                    </label>
                    <input
                      type="text"
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !aiChatSending && handleAiChatSend()}
                      placeholder={t("savolingizni yozing...")}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 min-w-0 text-slate-800"
                    />
                    <button
                      onClick={handleAiChatSend}
                      disabled={aiChatSending || (!aiChatInput.trim() && !aiChatImage)}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sozlamalar' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">{t("sozlamalar")}</h3>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {t("o'zgartirish")}
                  </button>
                )}
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-3 mb-4 text-sm">
                <span className="text-slate-500">{t("ism familiya")}</span>
                <span className="font-bold text-slate-900">{decodeLegacyEntities(viewingPatient?.fullName)}</span>
              </div>

              {!isEditingProfile ? (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500">{t("telefon")}</span>
                    <span className="font-bold text-slate-900">{decodeLegacyEntities(viewingPatient?.phone) || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500">{t("pasport seriyasi")}</span>
                    <span className="font-bold text-slate-900">{decodeLegacyEntities(viewingPatient?.passportSerial) || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500">{t("tug'ilgan sana")}</span>
                    <span className="font-bold text-slate-900">{viewingPatient?.birthDate || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500">{t("qon guruhi")}</span>
                    <span className="font-bold text-slate-900">{viewingPatient?.bloodGroup || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500">{t("allergiyalar")}</span>
                    <span className="font-bold text-slate-900">{decodeLegacyEntities(viewingPatient?.allergies) || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("surunkali kasalliklar")}</span>
                    <span className="font-bold text-slate-900">{decodeLegacyEntities(viewingPatient?.chronicDiseases) || '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("telefon")}</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("pasport seriyasi")}</label>
                    <input
                      type="text"
                      value={profileForm.passportSerial}
                      onChange={(e) => setProfileForm({ ...profileForm, passportSerial: e.target.value.toUpperCase() })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium text-slate-800 uppercase"
                      placeholder="AA1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("tug'ilgan sana")}</label>
                    <input
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("qon guruhi")}</label>
                    <select
                      value={profileForm.bloodGroup}
                      onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                    >
                      <option value="">{t("tanlang (noma'lum)")}</option>
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
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("allergiyalar")}</label>
                    <input
                      type="text"
                      value={profileForm.allergies}
                      onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("surunkali kasalliklar")}</label>
                    <textarea
                      value={profileForm.chronicDiseases}
                      onChange={(e) => setProfileForm({ ...profileForm, chronicDiseases: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium text-slate-800 h-16 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      {isSavingProfile ? t("saqlanmoqda...") : t("saqlash")}
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      disabled={isSavingProfile}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl transition-colors"
                    >
                      {t("bekor qilish")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {showRegisterFamilyForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">{t("oila a'zosini ro'yxatdan o'tkazish")}</h3>
              <button onClick={() => setShowRegisterFamilyForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("to'liq ism")} *</label>
                <input
                  type="text"
                  value={newFamilyMember.fullName}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, fullName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800"
                  placeholder={t("ism familiya (namuna)")}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("telefon")} *</label>
                  <input
                    type="text"
                    value={newFamilyMember.phone}
                    onChange={(e) => setNewFamilyMember({ ...newFamilyMember, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800"
                    placeholder="+998 90 123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("tug'ilgan sana")}</label>
                  <input
                    type="date"
                    value={newFamilyMember.birthDate}
                    onChange={(e) => setNewFamilyMember({ ...newFamilyMember, birthDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("pasport seriyasi")} *</label>
                <input
                  type="text"
                  value={newFamilyMember.passportSerial}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, passportSerial: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800"
                  placeholder="AD1234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t("parol")} *</label>
                <input
                  type="password"
                  value={newFamilyMember.password}
                  onChange={(e) => setNewFamilyMember({ ...newFamilyMember, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-800"
                  placeholder={t("a'zo mustaqil kirishi uchun parol")}
                />
                <p className="text-[10px] text-slate-400 mt-1">{t("a'zo kattalashganda shu pasport va parol bilan o'z alohida kabinetiga kira oladi.")}</p>
              </div>
            </div>
            {familyRegisterError && (
              <p className="text-xs font-bold text-rose-500 mt-4">{familyRegisterError}</p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowRegisterFamilyForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                {t("bekor qilish")}
              </button>
              <button
                onClick={handleRegisterFamilyMember}
                disabled={isRegisteringFamilyMember || !newFamilyMember.fullName.trim() || !newFamilyMember.phone.trim() || !newFamilyMember.passportSerial.trim() || !newFamilyMember.password.trim()}
                className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                {isRegisteringFamilyMember ? t('saqlanmoqda...') : t("ro'yxatdan o'tkazish")}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        onBook={() => onGoToBooking?.()}
        onOpenMore={() => setIsMobileNavOpen(true)}
      />
    </div>
  );
}

// Lets the patient see and change who treats them. Until now the only way to
// switch doctors was to book a new appointment with someone else (which is what
// reassigns primaryDoctorId server-side) — there was no way to just say "I want
// a different doctor from now on".
function TreatingDoctorCard({
  patient,
  doctors,
  onChangeDoctor,
  t,
}: {
  patient: Patient;
  doctors: Doctor[];
  // Takes the patient id explicitly rather than assuming "the logged-in
  // account" — this card can be showing a managed family member, and the
  // change must land on that member's own record, not the parent's.
  onChangeDoctor?: (doctorId: string, forPatientId: string) => Promise<void>;
  t: (s: string) => string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [picked, setPicked] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Only doctors at the patient's own clinic — switching to a doctor at another
  // branch would silently move the patient out of their clinic's roster.
  const options = doctors.filter((d) => d.clinicId === patient.clinicId);
  const current = doctors.find((d) => d.id === patient.primaryDoctorId);

  if (!onChangeDoctor || options.length === 0) return null;

  const save = async () => {
    if (!picked || picked === patient.primaryDoctorId) { setIsEditing(false); return; }
    setIsSaving(true);
    setSaveError(false);
    try {
      await onChangeDoctor(picked, patient.id);
      setIsEditing(false);
    } catch {
      // Keep the editor open and say so — silently closing would tell the
      // patient their treating doctor changed when the server rejected it.
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="md:col-span-3 bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Stethoscope size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{t('davolovchi shifokor')}</p>
          {isEditing ? (
            <>
              <select
                value={picked}
                onChange={(e) => setPicked(e.target.value)}
                className="mt-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800 bg-white outline-none focus:border-blue-500"
              >
                <option value="">{t('shifokorni tanlang')}</option>
                {options.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                ))}
              </select>
              {saveError && (
                <p className="text-[11px] font-bold text-rose-500 mt-1">{t('saqlanmadi, qayta urinib ko\'ring')}</p>
              )}
            </>
          ) : (
            <p className="font-bold text-slate-900 text-sm truncate">
              {current ? current.name : t('hali biriktirilmagan')}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('bekor qilish')}
            </button>
            <button
              onClick={save}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {isSaving ? '...' : t('saqlash')}
            </button>
          </>
        ) : (
          <button
            onClick={() => { setPicked(patient.primaryDoctorId || ''); setIsEditing(true); }}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            {t("o'zgartirish")}
          </button>
        )}
      </div>
    </div>
  );
}

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`${active ? 'text-blue-600' : 'text-slate-400'}`}>{icon}</span>
      {label}
    </button>
  );
};

const PlanItem: React.FC<{ status: 'done' | 'current' | 'planned', title: string, price: string, date?: string, doneLabel?: string }> = ({ status, title, price, date, doneLabel = 'Bajarildi' }) => {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1">
        {status === 'done' && (
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check size={12} strokeWidth={4} />
          </div>
        )}
        {status === 'current' && (
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center" />
        )}
        {status === 'planned' && (
          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center" />
        )}
      </div>
      <div className="flex-1 flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <p className={`font-bold text-sm ${status === 'planned' ? 'text-slate-500' : 'text-slate-900'}`}>{title}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm text-slate-900 mb-1">{price}</p>
          {status === 'done' && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded">{doneLabel} {date && <span className="text-emerald-400 ml-1">{date}</span>}</span>}
        </div>
      </div>
    </div>
  );
};

const VisitItem: React.FC<{ date: string, badge?: string, title: string, doctor: string }> = ({ date, badge, title, doctor }) => {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
      <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl shrink-0">🦷</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-slate-500">{date}</span>
          {badge && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded">{badge}</span>}
        </div>
        <p className="font-bold text-sm text-slate-900">{title}</p>
        {doctor && <p className="text-xs text-slate-500 mt-0.5">{doctor}</p>}
      </div>
    </div>
  );
};

function QuickAction({ icon, title, desc, bg, border, onClick }: { icon: React.ReactNode, title: string, desc: string, bg: string, border: string, onClick?: () => void }) {
  // A clickable card rendered as a <div onClick> — unreachable by keyboard (no
  // tab stop, no Enter/Space activation) and invisible to screen readers as an
  // action. Real <button> only when there's actually an onClick to fire; the
  // info-only cards (no onClick, e.g. "klinika bilan aloqa" with no number on
  // file) correctly stay a plain, non-interactive div.
  const className = `rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-white border ${border} shadow-sm ${onClick ? 'cursor-pointer transition-transform hover:scale-105' : ''}`;
  const content = (
    <>
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="font-bold text-slate-900 text-xs mb-1">{title}</p>
      <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
    </>
  );
  if (onClick) {
    return <button type="button" onClick={onClick} className={`${className} w-full`}>{content}</button>;
  }
  return <div className={className}>{content}</div>;
}
