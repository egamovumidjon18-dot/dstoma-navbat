import React, { useState, useEffect } from 'react';
import {
  Building2, Bot, Database, MapPin, Activity, Settings as SettingsIcon,
  Save, Download, Upload, CheckCircle2, ChevronRight, AlertCircle, User, CreditCard, X, Handshake
} from 'lucide-react';
import { Doctor, Clinic, Patient, QueueItem, PaymentReceipt, DoctorClinicLink } from '../types';
import { decodeLegacyEntities } from '../utils/textFormat';
import { getAiAccessStatus } from '../utils/aiAccess';
import { compressImage } from '../utils/imageCompressor';
import { getApiUrl } from '../services/api';
import { TRANSLATIONS, Language } from '../translations';

// Only sections a doctor can meaningfully act on themselves. Clinic-network-wide
// concerns (staff/roles, Telegram bot token, document templates, security
// policy, system-wide audit log) live in Director/SuperAdmin dashboards instead —
// showing them here previously rendered as either dead stubs or fabricated demo data.
// "To'lov tizimlari" stays here deliberately: rental-model doctors collect payment
// directly (cash/card transfer), so they manage their own payout details and confirm
// patient-submitted receipts themselves — see handlePhotoUpload-style flow below.
const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Shaxsiy profil', icon: User },
  { id: 'clinic', label: 'Klinika ma\'lumotlari', icon: Building2 },
  { id: 'branches', label: 'Filiallar', icon: MapPin },
  { id: 'employment', label: 'Ish shartlari', icon: Handshake },
  { id: 'ai', label: 'AI sozlamalari', icon: Bot },
  { id: 'payment', label: 'To\'lov tizimlari', icon: CreditCard },
  { id: 'backup', label: 'Zaxira va Tiklash', icon: Database },
];

type SettingsDictEntry = { ru: string; en: string; kk: string; ky: string; tg: string; tk: string };
const SETTINGS_TRANSLATIONS: Record<string, SettingsDictEntry> = {
  "shaxsiy profil": { ru: "Личный профиль", en: "Personal profile", kk: "Жеке профиль", ky: "Жеке профиль", tg: "Профили шахсӣ", tk: "Şahsy profil" },
  "klinika ma'lumotlari": { ru: "Информация о клинике", en: "Clinic information", kk: "Клиника туралы ақпарат", ky: "Клиника тууралуу маалымат", tg: "Маълумоти клиника", tk: "Klinika maglumaty" },
  filiallar: { ru: "Филиалы", en: "Branches", kk: "Филиалдар", ky: "Филиалдар", tg: "Филиалҳо", tk: "Şahamçalar" },
  "ai sozlamalari": { ru: "Настройки AI", en: "AI Settings", kk: "AI баптаулары", ky: "AI тууралоолору", tg: "Танзимоти AI", tk: "AI sazlamalary" },
  "to'lov tizimlari": { ru: "Платёжные системы", en: "Payment Systems", kk: "Төлем жүйелері", ky: "Төлөм системалары", tg: "Системаҳои пардохт", tk: "Töleg ulgamlary" },
  "zaxira va tiklash": { ru: "Резервное копирование", en: "Backup & Restore", kk: "Сақтық көшірме және қалпына келтіру", ky: "Камдык көчүрмө жана калыбына келтирүү", tg: "Нусхабардорӣ ва барқарорсозӣ", tk: "Ätiýaçlyk we dikeltmek" },
  sozlamalar: { ru: "Настройки", en: "Settings", kk: "Баптаулар", ky: "Тууралоолор", tg: "Танзимот", tk: "Sazlamalar" },
  "shifokor ma'lumotlari va ish jadvali": { ru: "Информация о враче и график работы", en: "Doctor info and work schedule", kk: "Дәрігер туралы ақпарат және жұмыс кестесі", ky: "Дарыгер тууралуу маалымат жана иш графиги", tg: "Маълумоти духтур ва ҷадвали кор", tk: "Lukman maglumaty we iş tertibi" },
  "yuklanmoqda...": { ru: "Загружается...", en: "Loading...", kk: "Жүктелуде...", ky: "Жүктөлүүдө...", tg: "Бор карда мешавад...", tk: "Ýüklenýär..." },
  "rasm yuklash": { ru: "Загрузить фото", en: "Upload photo", kk: "Фото жүктеу", ky: "Сүрөт жүктөө", tg: "Боркунии расм", tk: "Surat ýüklemek" },
  "tavsiya etiladigan o'lcham: 256x256": { ru: "Рекомендуемый размер: 256x256", en: "Recommended size: 256x256", kk: "Ұсынылатын өлшем: 256x256", ky: "Сунушталган өлчөм: 256x256", tg: "Андозаи тавсияшуда: 256x256", tk: "Maslahat berilýän ölçeg: 256x256" },
  "shifokor profili topilmadi — tizimga qayta kiring.": { ru: "Профиль врача не найден — войдите заново.", en: "Doctor profile not found — please log in again.", kk: "Дәрігер профилі табылмады — қайта кіріңіз.", ky: "Дарыгер профили табылган жок — кайра кириңиз.", tg: "Профили духтур ёфт нашуд — дубора ворид шавед.", tk: "Lukman profili tapylmady — täzeden giriň." },
  "ism familiya": { ru: "Имя и фамилия", en: "Full name", kk: "Аты-жөні", ky: "Аты-жөнү", tg: "Ном ва насаб", tk: "Ady familiýasy" },
  mutaxassislik: { ru: "Специальность", en: "Specialty", kk: "Мамандығы", ky: "Адистиги", tg: "Ихтисос", tk: "Hünär" },
  login: { ru: "Логин", en: "Login", kk: "Логин", ky: "Логин", tg: "Логин", tk: "Login" },
  status: { ru: "Статус", en: "Status", kk: "Мәртебе", ky: "Статус", tg: "Ҳолат", tk: "Ýagdaý" },
  "parolni o'zgartirish": { ru: "Изменить пароль", en: "Change password", kk: "Құпия сөзді өзгерту", ky: "Сыр сөздү өзгөртүү", tg: "Тағйири парол", tk: "Paroly üýtgetmek" },
  "yangi parol": { ru: "Новый пароль", en: "New password", kk: "Жаңа құпия сөз", ky: "Жаңы сыр сөз", tg: "Пароли нав", tk: "Täze parol" },
  "parolni tasdiqlang": { ru: "Подтвердите пароль", en: "Confirm password", kk: "Құпия сөзді растаңыз", ky: "Сыр сөздү ырастаңыз", tg: "Паролро тасдиқ кунед", tk: "Paroly tassyklaň" },
  "asosiy ma'lumotlar va rekvizitlar": { ru: "Основная информация и реквизиты", en: "Basic info and details", kk: "Негізгі ақпарат және деректемелер", ky: "Негизги маалымат жана реквизиттер", tg: "Маълумоти асосӣ ва реквизитҳо", tk: "Esasy maglumat we rekwizitler" },
  "klinika tanlanmagan.": { ru: "Клиника не выбрана.", en: "No clinic selected.", kk: "Клиника таңдалмаған.", ky: "Клиника тандалган эмес.", tg: "Клиника интихоб нашудааст.", tk: "Klinika saýlanmady." },
  "klinika nomi": { ru: "Название клиники", en: "Clinic name", kk: "Клиника атауы", ky: "Клиниканын аты", tg: "Номи клиника", tk: "Klinikanyň ady" },
  "telefon raqam": { ru: "Номер телефона", en: "Phone number", kk: "Телефон нөмірі", ky: "Телефон номери", tg: "Рақами телефон", tk: "Telefon belgisi" },
  manzil: { ru: "Адрес", en: "Address", kk: "Мекенжай", ky: "Дарек", tg: "Суроға", tk: "Salgy" },
  reyting: { ru: "Рейтинг", en: "Rating", kk: "Рейтинг", ky: "Рейтинг", tg: "Рейтинг", tk: "Reýting" },
  "obuna holati": { ru: "Статус подписки", en: "Subscription status", kk: "Жазылым мәртебесі", ky: "Жазылуу статусу", tg: "Ҳолати обуна", tk: "Abuna ýagdaýy" },
  "ai yordamchi — premium xizmat": { ru: "AI Ассистент — Premium услуга", en: "AI Assistant — Premium service", kk: "AI Көмекші — Premium қызмет", ky: "AI Жардамчы — Premium кызмат", tg: "Ёрдамчии AI — хизмати Premium", tk: "AI Kömekçi — Premium hyzmat" },
  "✓ premium ai faol": { ru: "✓ Premium AI активен", en: "✓ Premium AI active", kk: "✓ Premium AI белсенді", ky: "✓ Premium AI активдүү", tg: "✓ Premium AI фаъол", tk: "✓ Premium AI işjeň" },
  "klinikangiz premium obunada — ai diagnostika va rentgen tahlili cheklovsiz ishlaydi.": { ru: "Ваша клиника на Premium подписке — AI-диагностика и анализ рентгена работают без ограничений.", en: "Your clinic is on Premium subscription — AI diagnostics and X-ray analysis work without limits.", kk: "Клиникаңыз Premium жазылымда — AI диагностика және рентген талдауы шектеусіз жұмыс істейді.", ky: "Клиникаңыз Premium жазылууда — AI диагностика жана рентген анализи чектөөсүз иштейт.", tg: "Клиникаи шумо дар обунаи Premium аст — ташхиси AI ва таҳлили рентген бе маҳдудият кор мекунад.", tk: "Klinikaňyz Premium abunada — AI diagnostika we rentgen seljermesi çäksiz işleýär." },
  "🎁 bepul sinov davri": { ru: "🎁 Бесплатный пробный период", en: "🎁 Free trial period", kk: "🎁 Тегін сынақ мерзімі", ky: "🎁 Акысыз сыноо мөөнөтү", tg: "🎁 Давраи озмоишии ройгон", tk: "🎁 Mugt synag döwri" },
  "ai yordamchidan bepul foydalanish uchun": { ru: "Для бесплатного использования AI Ассистента осталось", en: "To use AI Assistant for free, you have", kk: "AI Көмекшіні тегін пайдалану үшін", ky: "AI Жардамчыны акысыз колдонуу үчүн", tg: "Барои истифодаи ройгони Ёрдамчии AI", tk: "AI Kömekçini mugt ulanmak üçin" },
  kun: { ru: "дней", en: "days", kk: "күн", ky: "күн", tg: "рӯз", tk: "gün" },
  "qoldi. sinov tugagach, ai ishlashi uchun premium obunaga o'tish kerak bo'ladi.": { ru: "осталось. После окончания пробного периода потребуется Premium подписка для работы AI.", en: "left. Once the trial ends, you'll need a Premium subscription for AI to work.", kk: "қалды. Сынақ мерзімі аяқталғаннан кейін AI жұмыс істеуі үшін Premium жазылым қажет болады.", ky: "калды. Сыноо мөөнөтү бүткөндөн кийин AI иштеши үчүн Premium жазылуу керек болот.", tg: "монд. Пас аз ба охир расидани давраи озмоишӣ, барои кори AI обунаи Premium лозим мешавад.", tk: "galdy. Synag döwri gutaranda AI-nyň işlemegi üçin Premium abuna gerek bolar." },
  "🔒 sinov muddati tugadi": { ru: "🔒 Пробный период истёк", en: "🔒 Trial period ended", kk: "🔒 Сынақ мерзімі аяқталды", ky: "🔒 Сыноо мөөнөтү бүттү", tg: "🔒 Давраи озмоишӣ тамом шуд", tk: "🔒 Synag döwri gutardy" },
  "ai diagnostika va rentgen tahlili — premium obuna xizmati. davom etish uchun premium'ga o'ting.": { ru: "AI-диагностика и анализ рентгена — услуга Premium подписки. Перейдите на Premium, чтобы продолжить.", en: "AI diagnostics and X-ray analysis are a Premium subscription service. Upgrade to Premium to continue.", kk: "AI диагностика және рентген талдауы — Premium жазылым қызметі. Жалғастыру үшін Premium'ға өтіңіз.", ky: "AI диагностика жана рентген анализи — Premium жазылуу кызматы. Улантуу үчүн Premium'га өтүңүз.", tg: "Ташхиси AI ва таҳлили рентген — хизмати обунаи Premium. Барои идома ба Premium гузаред.", tk: "AI diagnostika we rentgen seljermesi — Premium abuna hyzmaty. Dowam etmek üçin Premium-a geçiň." },
  "✓ so'rov yuborildi — tizim egasi to'lovni tasdiqlagach, ai faollashadi.": { ru: "✓ Запрос отправлен — AI активируется после подтверждения оплаты владельцем системы.", en: "✓ Request sent — AI will activate once the system owner confirms payment.", kk: "✓ Сұрау жіберілді — жүйе иесі төлемді растағаннан кейін AI белсендіріледі.", ky: "✓ Суроо жөнөтүлдү — тутум ээси төлөмдү ырастагандан кийин AI активдешет.", tg: "✓ Дархост фиристода шуд — пас аз тасдиқи пардохт аз ҷониби соҳиби система AI фаъол мешавад.", tk: "✓ Isleg iberildi — ulgam eýesi tölegi tassyklandan soň AI işjeňleşer." },
  "premium'ga o'tish uchun so'rov yuborish": { ru: "Отправить запрос на переход на Premium", en: "Send request to upgrade to Premium", kk: "Premium'ға өту үшін сұрау жіберу", ky: "Premium'га өтүү үчүн суроо жөнөтүү", tg: "Фиристодани дархост барои гузариш ба Premium", tk: "Premium-a geçmek üçin isleg ibermek" },
  "gemini api integratsiyasi (ixtiyoriy)": { ru: "Интеграция Gemini API (необязательно)", en: "Gemini API Integration (optional)", kk: "Gemini API интеграциясы (міндетті емес)", ky: "Gemini API интеграциясы (милдеттүү эмес)", tg: "Интегратсияи Gemini API (ихтиёрӣ)", tk: "Gemini API integrasiýasy (hökmany däl)" },
  "o'z gemini api kalitingizni kiritsangiz, ai xarajati sizning google hisobingizga yoziladi. kiritilmasa, platformaning umumiy kaliti ishlatiladi.": {
    ru: "Если вы введёте свой ключ Gemini API, расходы на AI будут списываться с вашего аккаунта Google. Если не ввести, будет использоваться общий ключ платформы.",
    en: "If you enter your own Gemini API key, AI costs will be billed to your Google account. If not entered, the platform's shared key will be used.",
    kk: "Егер өз Gemini API кілтіңізді енгізсеңіз, AI шығындары сіздің Google есептік жазбаңызға жазылады. Енгізілмесе, платформаның ортақ кілті пайдаланылады.",
    ky: "Эгер өз Gemini API ачкычыңызды киргизсеңиз, AI чыгымдары Google эсебиңизге жазылат. Киргизилбесе, платформанын жалпы ачкычы колдонулат.",
    tg: "Агар калиди Gemini API-и худро ворид кунед, харочоти AI ба ҳисоби Google-и шумо навишта мешавад. Агар ворид накунед, калиди умумии платформа истифода мешавад.",
    tk: "Öz Gemini API açaryňyzy girizseňiz, AI çykdajylary Google hasabyňyza ýazylar. Girizilmese, platformanyň umumy açary ulanylar."
  },
  "kalit olish (google ai studio)": { ru: "Получить ключ (Google AI Studio)", en: "Get key (Google AI Studio)", kk: "Кілт алу (Google AI Studio)", ky: "Ачкыч алуу (Google AI Studio)", tg: "Гирифтани калид (Google AI Studio)", tk: "Açar almak (Google AI Studio)" },
  "api kalit": { ru: "API Ключ", en: "API Key", kk: "API Кілт", ky: "API Ачкыч", tg: "Калиди API", tk: "API Açar" },
  "tekshirilmoqda...": { ru: "Проверяется...", en: "Checking...", kk: "Тексерілуде...", ky: "Текшерилүүдө...", tg: "Тафтиш мешавад...", tk: "Barlanýar..." },
  tekshirish: { ru: "Проверить", en: "Check", kk: "Тексеру", ky: "Текшерүү", tg: "Тафтиш кардан", tk: "Barlamak" },
  "✓ kalit ishlayapti": { ru: "✓ Ключ работает", en: "✓ Key works", kk: "✓ Кілт жұмыс істейді", ky: "✓ Ачкыч иштейт", tg: "✓ Калид кор мекунад", tk: "✓ Açar işleýär" },
  "✗ kalit yaroqsiz yoki tarmoq xatosi": { ru: "✗ Ключ недействителен или ошибка сети", en: "✗ Key is invalid or network error", kk: "✗ Кілт жарамсыз немесе желі қатесі", ky: "✗ Ачкыч жараксыз же тармак катасы", tg: "✗ Калид нодуруст ё хатои шабака", tk: "✗ Açar nädogry ýa-da tor ýalňyşlygy" },
  "ma'lumotlar bazasini xavfsiz saqlash": { ru: "Безопасное хранение базы данных", en: "Secure database storage", kk: "Деректер базасын қауіпсіз сақтау", ky: "Маалымат базасын коопсуз сактоо", tg: "Захираи бехатари пойгоҳи додаҳо", tk: "Maglumat bazasyny howpsuz saklamak" },
  "zaxira nusxasi (backup)": { ru: "Резервная копия (Backup)", en: "Backup copy", kk: "Сақтық көшірме (Backup)", ky: "Камдык көчүрмө (Backup)", tg: "Нусхаи эҳтиётӣ (Backup)", tk: "Ätiýaçlyk nusga (Backup)" },
  "hozir nusxa olish": { ru: "Сделать копию сейчас", en: "Back up now", kk: "Қазір көшірме жасау", ky: "Азыр көчүрмө жасоо", tg: "Ҳозир нусха гирифтан", tk: "Häzir nusga almak" },
  "ma'lumotlarni tiklash": { ru: "Восстановление данных", en: "Data restore", kk: "Деректерді қалпына келтіру", ky: "Маалыматтарды калыбына келтирүү", tg: "Барқарорсозии додаҳо", tk: "Maglumatlary dikeltmek" },
  "bu funksiya hali ishlab chiqilmagan — noto'g'ri fayl real ma'lumotlarni buzib qo'yishi mumkinligi sabab ehtiyotkorlik bilan qurilishi kerak": {
    ru: "Эта функция пока не разработана — из-за риска повреждения реальных данных неправильным файлом она должна создаваться с осторожностью.",
    en: "This feature is not yet built — since a wrong file could corrupt real data, it needs to be built carefully.",
    kk: "Бұл функция әлі әзірленбеген — қате файл нақты деректерді бүлдіруі мүмкін болғандықтан, оны абайлап құру керек.",
    ky: "Бул функция азырынча иштелип чыккан эмес — туура эмес файл реалдуу маалыматтарды бузушу мүмкүн болгондуктан, аны этияттык менен түзүү керек.",
    tg: "Ин функсия ҳанӯз таҳия нашудааст — азбаски файли нодуруст метавонад додаҳои воқеиро вайрон кунад, бояд бо эҳтиёт сохта шавад.",
    tk: "Bu funksiýa heniz işlenip düzülmedi — nädogry faýl hakyky maglumatlary zaýalap biljekdigi sebäpli ünsli gurulmaly."
  },
  "hozircha mavjud emas": { ru: "Пока недоступно", en: "Not available yet", kk: "Әзірге қолжетімсіз", ky: "Азырынча жеткиликсиз", tg: "Ҳанӯз дастрас нест", tk: "Heniz elýeter däl" },
  "tarmoqdagi barcha klinika filiallari": { ru: "Все филиалы клиники в сети", en: "All clinic branches in the network", kk: "Желідегі барлық клиника филиалдары", ky: "Тармактагы бардык клиника филиалдары", tg: "Ҳамаи филиалҳои клиника дар шабака", tk: "Tordaky ähli klinika şahamçalary" },
  "filiallar topilmadi.": { ru: "Филиалы не найдены.", en: "No branches found.", kk: "Филиалдар табылмады.", ky: "Филиалдар табылган жок.", tg: "Филиалҳо ёфт нашуданд.", tk: "Şahamçalar tapylmady." },
  joriy: { ru: "ТЕКУЩИЙ", en: "CURRENT", kk: "АҒЫМДАҒЫ", ky: "УЧУРДАГЫ", tg: "ҶОРӢ", tk: "HÄZIRKI" },
  "bemorlar to'lovni to'g'ridan-to'g'ri shu rekvizitlarga o'tkazadi va chekni telegram bot orqali yuboradi — siz esa shu yerda tasdiqlaysiz.": {
    ru: "Пациенты переводят оплату напрямую на эти реквизиты и отправляют чек через Telegram-бота — а вы подтверждаете здесь.",
    en: "Patients transfer payment directly to these details and send the receipt via the Telegram bot — you confirm it here.",
    kk: "Пациенттер төлемді осы деректемелерге тікелей аударады және чекті Telegram бот арқылы жібереді — сіз оны осы жерде растайсыз.",
    ky: "Бейтаптар төлөмдү ушул реквизиттерге түздөн-түз которушат жана чекти Telegram бот аркылуу жөнөтүшөт — сиз болсо ушул жерде ырастайсыз.",
    tg: "Беморон пардохтро мустақиман ба ин реквизитҳо мегузаронанд ва чекро тавассути боти Telegram мефиристанд — шумо бошед дар ин ҷо тасдиқ мекунед.",
    tk: "Näsaglar tölegi göni şu rekwizitlere geçirýär we çeki Telegram bot arkaly iberýär — siz bolsa şu ýerde tassyklaýarsyňyz."
  },
  "to'lov rekvizitlaringiz": { ru: "Ваши платёжные реквизиты", en: "Your payment details", kk: "Сіздің төлем деректемелеріңіз", ky: "Сиздин төлөм реквизиттериңиз", tg: "Реквизитҳои пардохти шумо", tk: "Töleg rekwizitleriňiz" },
  "karta raqami": { ru: "Номер карты", en: "Card number", kk: "Карта нөмірі", ky: "Карта номери", tg: "Рақами корт", tk: "Kart belgisi" },
  "telefon raqami (click/payme)": { ru: "Номер телефона (Click/Payme)", en: "Phone number (Click/Payme)", kk: "Телефон нөмірі (Click/Payme)", ky: "Телефон номери (Click/Payme)", tg: "Рақами телефон (Click/Payme)", tk: "Telefon belgisi (Click/Payme)" },
  "tasdiqlash kutayotgan cheklar": { ru: "Чеки, ожидающие подтверждения", en: "Receipts awaiting confirmation", kk: "Растауды күтетін чектер", ky: "Ырастоону күтүп жаткан чектер", tg: "Чекҳои интизори тасдиқ", tk: "Tassyklamak garaşylýan çekler" },
  "hozircha birorta ham to'lov cheki yuborilmagan.": { ru: "Пока не отправлено ни одного чека об оплате.", en: "No payment receipts submitted yet.", kk: "Әзірге бірде-бір төлем чегі жіберілмеген.", ky: "Азырынча бир дагы төлөм чеги жөнөтүлгөн эмес.", tg: "Ҳанӯз ягон чеки пардохт фиристода нашудааст.", tk: "Heniz hiç bir töleg çeki iberilmedi." },
  bemor: { ru: "Пациент", en: "Patient", kk: "Пациент", ky: "Бейтап", tg: "Бемор", tk: "Näsag" },
  navbat: { ru: "очередь", en: "queue", kk: "кезек", ky: "кезек", tg: "навбат", tk: "nobat" },
  "ushbu klinikaning bemorlar va navbatlar ma'lumotini json formatda yuklab olish": { ru: "Скачать данные пациентов и очередей этой клиники в формате JSON", en: "Download this clinic's patient and queue data in JSON format", kk: "Осы клиниканың пациенттер мен кезектер деректерін JSON форматында жүктеп алу", ky: "Ушул клиниканын бейтаптар жана кезектер маалыматын JSON форматында жүктөп алуу", tg: "Боргирии додаҳои беморон ва навбатҳои ин клиника дар формати JSON", tk: "Bu klinikanyň näsag we nobat maglumatyny JSON formatda ýüklemek" },
  tasdiqlash: { ru: "Подтвердить", en: "Confirm", kk: "Растау", ky: "Ырастоо", tg: "Тасдиқ кардан", tk: "Tassyklamak" },
  "rad etish": { ru: "Отклонить", en: "Reject", kk: "Қабылдамау", ky: "Четке кагуу", tg: "Рад кардан", tk: "Ret etmek" },
  tasdiqlangan: { ru: "Подтверждено", en: "Confirmed", kk: "Расталды", ky: "Ырасталды", tg: "Тасдиқшуда", tk: "Tassyklandy" },
  "rad etilgan": { ru: "Отклонено", en: "Rejected", kk: "Қабылданбады", ky: "Четке кагылды", tg: "Радшуда", tk: "Ret edildi" },
  "ushbu modul ishlab chiqilmoqda": { ru: "Этот модуль в разработке", en: "This module is under development", kk: "Бұл модуль әзірленуде", ky: "Бул модуль иштелип чыгууда", tg: "Ин модул дар ҳоли таҳия аст", tk: "Bu modul işlenip taýýarlanýar" },
  "tez orada": { ru: "Скоро", en: "Coming soon,", kk: "Жақында", ky: "Жакында", tg: "Ба зудӣ", tk: "Ýakynda" },
  "bo'limi ishga tushadi.": { ru: "раздел будет запущен.", en: "section will launch.", kk: "бөлімі іске қосылады.", ky: "бөлүмү иштетилет.", tg: "бахш оғоз мешавад.", tk: "bölümi işe girer." },
  saqlandi: { ru: "Сохранено", en: "Saved", kk: "Сақталды", ky: "Сакталды", tg: "Захира шуд", tk: "Ýatda saklandy" },
  saqlash: { ru: "Сохранить", en: "Save", kk: "Сақтау", ky: "Сактоо", tg: "Захира кардан", tk: "Ýatda saklamak" },
  "shifokor profili topilmadi.": { ru: "Профиль врача не найден.", en: "Doctor profile not found.", kk: "Дәрігер профилі табылмады.", ky: "Дарыгер профили табылган жок.", tg: "Профили духтур ёфт нашуд.", tk: "Lukman profili tapylmady." },
  "parollar mos kelmadi.": { ru: "Пароли не совпадают.", en: "Passwords do not match.", kk: "Құпия сөздер сәйкес келмейді.", ky: "Сыр сөздөр дал келген жок.", tg: "Паролҳо мувофиқат намекунанд.", tk: "Parollar gabat gelmedi." },
  "saqlab bo'lmadi. internet aloqasini tekshiring.": { ru: "Не удалось сохранить. Проверьте подключение к интернету.", en: "Could not save. Check your internet connection.", kk: "Сақтау мүмкін болмады. Интернет байланысын тексеріңіз.", ky: "Сактоо мүмкүн болгон жок. Интернет байланышын текшериңиз.", tg: "Захира нашуд. Пайвасти интернетро тафтиш кунед.", tk: "Ýatda saklap bolmady. Internet baglanyşygyny barlaň." },
  "klinika ma'lumotlari topilmadi.": { ru: "Информация о клинике не найдена.", en: "Clinic information not found.", kk: "Клиника туралы ақпарат табылмады.", ky: "Клиника тууралуу маалымат табылган жок.", tg: "Маълумоти клиника ёфт нашуд.", tk: "Klinika maglumaty tapylmady." },
  "bu bo'lim uchun saqlash hali ishlab chiqilmagan.": { ru: "Сохранение для этого раздела ещё не реализовано.", en: "Saving is not yet implemented for this section.", kk: "Бұл бөлім үшін сақтау әлі жүзеге асырылмаған.", ky: "Бул бөлүм үчүн сактоо азырынча ишке ашырылган эмес.", tg: "Захира барои ин бахш ҳанӯз татбиқ нашудааст.", tk: "Bu bölüm üçin ýatda saklamak heniz durmuşa geçirilmedi." },
  "faqat rasm formatidagi fayllarni yuklashingiz mumkin!": { ru: "Можно загружать только файлы в формате изображения!", en: "You can only upload image files!", kk: "Тек сурет форматындағы файлдарды жүктеуге болады!", ky: "Só сүрөт форматындагы файлдарды гана жүктөөгө болот!", tg: "Танҳо файлҳои дар формати расм иҷозат дода мешавад!", tk: "Diňe surat formatly faýllary ýüklemek bolar!" },
  "rasmni yuklab bo'lmadi. internet aloqasini tekshiring.": { ru: "Не удалось загрузить фото. Проверьте подключение к интернету.", en: "Could not upload photo. Check your internet connection.", kk: "Фотоны жүктеу мүмкін болмады. Интернет байланысын тексеріңіз.", ky: "Сүрөттү жүктөө мүмкүн болгон жок. Интернет байланышын текшериңиз.", tg: "Расм бор нашуд. Пайвасти интернетро тафтиш кунед.", tk: "Surat ýüklenip bolmady. Internet baglanyşygyny barlaň." },
  "chekni belgilab bo'lmadi. internet aloqasini tekshiring.": { ru: "Не удалось отметить чек. Проверьте подключение к интернету.", en: "Could not mark the receipt. Check your internet connection.", kk: "Чекті белгілеу мүмкін болмады. Интернет байланысын тексеріңіз.", ky: "Чекти белгилөө мүмкүн болгон жок. Интернет байланышын текшериңиз.", tg: "Чек қайд карда нашуд. Пайвасти интернетро тафтиш кунед.", tk: "Çek bellenip bolmady. Internet baglanyşygyny barlaň." },
  "ish shartlari": { ru: "Условия работы", en: "Employment terms", kk: "Жұмыс шарттары", ky: "Иш шарттары", tg: "Шартҳои кор", tk: "Iş şertleri" },
  "sizning klinikalar bilan ish shartlaringiz — buni faqat klinika direktori yoki tizim egasi o'zgartira oladi.": { ru: "Ваши условия работы с клиниками — изменить их может только директор клиники или владелец системы.", en: "Your work terms with clinics — only the clinic director or system owner can change these.", kk: "Клиникалармен жұмыс шарттарыңыз — оларды тек клиника директоры немесе жүйе иесі өзгерте алады.", ky: "Клиникалар менен иш шарттарыңыз — аларды гана клиника директору же тутум ээси өзгөртө алат.", tg: "Шартҳои кори шумо бо клиникаҳо — онҳоро танҳо директори клиника ё соҳиби система тағйир дода метавонад.", tk: "Klinikalar bilen iş şertleriňiz — olary diňe klinika direktory ýa-da ulgam eýesi üýtgedip biler." },
  ulush: { ru: "Доля", en: "Revenue share", kk: "Үлес", ky: "Үлүш", tg: "Ҳисса", tk: "Paý" },
  ijara: { ru: "Аренда", en: "Rental", kk: "Жалдау", ky: "Ижара", tg: "Иҷора", tk: "Kärende" },
  mustaqil: { ru: "Независимый", en: "Independent", kk: "Тәуелсіз", ky: "Көз карандысыз", tg: "Мустақил", tk: "Garaşsyz" },
  "sizning ulushingiz:": { ru: "Ваша доля:", en: "Your share:", kk: "Сіздің үлесіңіз:", ky: "Сиздин үлүшүңүз:", tg: "Ҳиссаи шумо:", tk: "Siziň paýyňyz:" },
  "klinika ulushi:": { ru: "Доля клиники:", en: "Clinic's share:", kk: "Клиника үлесі:", ky: "Клиниканын үлүшү:", tg: "Ҳиссаи клиника:", tk: "Klinikanyň paýy:" },
  "oylik ijara:": { ru: "Ежемесячная аренда:", en: "Monthly rent:", kk: "Айлық жалдау:", ky: "Айлык ижара:", tg: "Иҷораи моҳона:", tk: "Aýlyk kärende:" },
  "holat:": { ru: "Статус:", en: "Status:", kk: "Мәртебе:", ky: "Абал:", tg: "Ҳолат:", tk: "Ýagdaý:" },
  "to'langan": { ru: "Оплачено", en: "Paid", kk: "Төленді", ky: "Төлөндү", tg: "Пардохтшуда", tk: "Tölendi" },
  "to'lanmagan": { ru: "Не оплачено", en: "Unpaid", kk: "Төленбеді", ky: "Төлөнгөн жок", tg: "Пардохтнашуда", tk: "Tölenmedi" },
  "bu — sizning shaxsiy klinikangiz. barcha daromad sizga tegishli.": { ru: "Это ваша личная клиника. Весь доход принадлежит вам.", en: "This is your own personal clinic. All revenue belongs to you.", kk: "Бұл — сіздің жеке клиникаңыз. Барлық табыс сізге тиесілі.", ky: "Бул — сиздин жеке клиникаңыз. Бардык киреше сизге таандык.", tg: "Ин — клиникаи шахсии шумост. Тамоми даромад ба шумо тааллуқ дорад.", tk: "Bu — siziň şahsy klinikaňyz. Ähli girdeji size degişli." },
  "hozircha ish shartlaringiz belgilanmagan — bu haqda klinika direktori bilan bog'laning.": { ru: "Ваши условия работы пока не установлены — обратитесь по этому поводу к директору клиники.", en: "Your employment terms haven't been set yet — please contact your clinic director about this.", kk: "Жұмыс шарттарыңыз әзірге белгіленбеген — бұл туралы клиника директорына хабарласыңыз.", ky: "Иш шарттарыңыз азырынча белгиленген эмес — бул тууралуу клиника директору менен байланышыңыз.", tg: "Шартҳои кори шумо ҳанӯз муайян нашудааст — дар ин бора бо директори клиника тамос гиред.", tk: "Iş şertleriňiz heniz bellenmedi — bu barada klinika direktory bilen habarlaşyň." },
};

interface SettingsProps {
  doctor?: Doctor;
  clinic?: Clinic | null;
  clinicPatients?: Patient[];
  clinicQueues?: QueueItem[];
  allClinics?: Clinic[];
  onRequestPremiumUpgrade?: (clinicId: string) => void;
  staffToken?: string | null;
  language?: Language;
}

export default function Settings({ doctor, clinic, clinicPatients = [], clinicQueues = [], allClinics = [], onRequestPremiumUpgrade, staffToken, language }: SettingsProps) {
  const localLang: keyof SettingsDictEntry | null =
    (language === "ru" || language === "en" || language === "kk" || language === "ky" || language === "tg" || language === "tk")
      ? language
      : null;

  const t = (text: string): string => {
    if (!language) return text;
    if (TRANSLATIONS[language] && text in TRANSLATIONS[language]) {
      return TRANSLATIONS[language][text as keyof (typeof TRANSLATIONS)["uz"]];
    }
    const cleanText = text.trim().toLowerCase().replace(/\s+/g, " ");
    const entry = SETTINGS_TRANSLATIONS[cleanText] || SETTINGS_TRANSLATIONS[text];
    if (entry) {
      if (localLang) return entry[localLang];
      const idx = text.search(/[a-zA-Zʻʼ'’]/);
      if (idx === -1) return text;
      return text.slice(0, idx) + text.charAt(idx).toUpperCase() + text.slice(idx + 1);
    }
    return text;
  };

  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [profileName, setProfileName] = useState(decodeLegacyEntities(doctor?.name) || '');
  const [profileSpecialty, setProfileSpecialty] = useState(decodeLegacyEntities(doctor?.specialty) || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(doctor?.image || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const [clinicName, setClinicName] = useState(decodeLegacyEntities(clinic?.name) || '');
  const [clinicPhone, setClinicPhone] = useState(decodeLegacyEntities(clinic?.phone) || '');
  const [clinicAddress, setClinicAddress] = useState(decodeLegacyEntities(clinic?.address) || '');
  const [premiumRequestSent, setPremiumRequestSent] = useState(false);
  const aiAccess = getAiAccessStatus(clinic);

  const [paymentCardNumber, setPaymentCardNumber] = useState(doctor?.paymentCardNumber || '');
  const [paymentPhone, setPaymentPhone] = useState(doctor?.paymentPhone || '');
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptActionId, setReceiptActionId] = useState<string | null>(null);
  const [viewerReceipt, setViewerReceipt] = useState<PaymentReceipt | null>(null);

  const [myLinks, setMyLinks] = useState<DoctorClinicLink[]>([]);
  const [myLinksLoading, setMyLinksLoading] = useState(false);

  useEffect(() => {
    if (activeSection !== 'employment' || !doctor?.id) return;
    let active = true;
    setMyLinksLoading(true);
    fetch(`${getApiUrl()}/api/doctor-clinic-links`, {
      headers: staffToken ? { Authorization: `Bearer ${staffToken}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DoctorClinicLink[]) => {
        if (active) setMyLinks(Array.isArray(data) ? data.filter((l) => l.doctorId === doctor.id) : []);
      })
      .catch(() => { if (active) setMyLinks([]); })
      .finally(() => { if (active) setMyLinksLoading(false); });
    return () => { active = false; };
  }, [activeSection, doctor?.id, staffToken]);

  useEffect(() => {
    setProfileName(decodeLegacyEntities(doctor?.name) || '');
    setProfileSpecialty(decodeLegacyEntities(doctor?.specialty) || '');
    setProfileImage(doctor?.image || '');
    setPaymentCardNumber(doctor?.paymentCardNumber || '');
    setPaymentPhone(doctor?.paymentPhone || '');
  }, [doctor?.id]);

  useEffect(() => {
    if (activeSection !== 'payment' || !doctor?.id) return;
    let active = true;
    setReceiptsLoading(true);
    fetch(`${getApiUrl()}/api/payment-receipts?doctorId=${encodeURIComponent(doctor.id)}`, {
      headers: staffToken ? { Authorization: `Bearer ${staffToken}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (active) setReceipts(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setReceipts([]); })
      .finally(() => { if (active) setReceiptsLoading(false); });
    return () => { active = false; };
  }, [activeSection, doctor?.id, staffToken]);

  const handleResolveReceipt = async (id: string, status: 'confirmed' | 'rejected') => {
    setReceiptActionId(id);
    try {
      const res = await fetch(`${getApiUrl()}/api/payment-receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(staffToken ? { Authorization: `Bearer ${staffToken}` } : {}) },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setViewerReceipt(null);
    } catch {
      setSaveError(t("chekni belgilab bo'lmadi. internet aloqasini tekshiring."));
    } finally {
      setReceiptActionId(null);
    }
  };

  useEffect(() => {
    setClinicName(decodeLegacyEntities(clinic?.name) || '');
    setClinicPhone(decodeLegacyEntities(clinic?.phone) || '');
    setClinicAddress(decodeLegacyEntities(clinic?.address) || '');
  }, [clinic?.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoUploadError(t("faqat rasm formatidagi fayllarni yuklashingiz mumkin!"));
      return;
    }
    if (!doctor) {
      setPhotoUploadError(t("shifokor profili topilmadi."));
      return;
    }
    setPhotoUploadError(null);
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImage(file, 400);
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(staffToken ? { Authorization: `Bearer ${staffToken}` } : {}) },
        body: JSON.stringify({ ...doctor, image: compressed }),
      });
      if (!res.ok) throw new Error('Saqlashda xatolik');
      setProfileImage(compressed);
    } catch (err) {
      setPhotoUploadError(t("rasmni yuklab bo'lmadi. internet aloqasini tekshiring."));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    if (activeSection === 'profile') {
      if (!doctor) { setSaveError(t("shifokor profili topilmadi.")); return; }
      if (newPassword && newPassword !== confirmPassword) {
        setSaveError(t("parollar mos kelmadi."));
        return;
      }
      setIsSaving(true);
      try {
        const res = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(staffToken ? { Authorization: `Bearer ${staffToken}` } : {}) },
          body: JSON.stringify({
            ...doctor,
            name: profileName.trim(),
            specialty: profileSpecialty.trim(),
            ...(newPassword ? { password: newPassword } : {}),
          }),
        });
        if (!res.ok) throw new Error('Saqlashda xatolik');
        setNewPassword('');
        setConfirmPassword('');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        setSaveError(t("saqlab bo'lmadi. internet aloqasini tekshiring."));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (activeSection === 'clinic') {
      if (!clinic) { setSaveError(t("klinika ma'lumotlari topilmadi.")); return; }
      setIsSaving(true);
      try {
        const res = await fetch('/api/clinics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(staffToken ? { Authorization: `Bearer ${staffToken}` } : {}) },
          body: JSON.stringify({
            ...clinic,
            name: clinicName.trim(),
            phone: clinicPhone.trim(),
            address: clinicAddress.trim(),
          }),
        });
        if (!res.ok) throw new Error('Saqlashda xatolik');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        setSaveError(t("saqlab bo'lmadi. internet aloqasini tekshiring."));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (activeSection === 'payment') {
      if (!doctor) { setSaveError(t("shifokor profili topilmadi.")); return; }
      setIsSaving(true);
      try {
        const res = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(staffToken ? { Authorization: `Bearer ${staffToken}` } : {}) },
          body: JSON.stringify({
            ...doctor,
            paymentCardNumber: paymentCardNumber.trim(),
            paymentPhone: paymentPhone.trim(),
          }),
        });
        if (!res.ok) throw new Error('Saqlashda xatolik');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        setSaveError(t("saqlab bo'lmadi. internet aloqasini tekshiring."));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Other sections have no real backing store yet.
    setSaveError(t("bu bo'lim uchun saqlash hali ishlab chiqilmagan."));
  };

  const handleDownloadBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      clinic: clinic || null,
      patients: clinicPatients,
      queues: clinicQueues,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dstoma_backup_${clinic?.id || 'klinika'}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
               <h3 className="text-xl font-bold text-white mb-1">{t("shaxsiy profil")}</h3>
               <p className="text-sm text-slate-500 mb-6">{t("shifokor ma'lumotlari va ish jadvali")}</p>
            </div>
            
            <div className="flex gap-6 items-center mb-8">
               <div className="w-24 h-24 bg-[#111827] border border-slate-700 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                 {profileImage ? (
                   <img src={profileImage} alt={profileName || 'Doctor'} className="w-full h-full object-cover" />
                 ) : (
                   <User className="w-10 h-10 text-slate-500" />
                 )}
               </div>
               <div>
                 <input
                   ref={photoInputRef}
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={handlePhotoUpload}
                 />
                 <button
                   type="button"
                   onClick={() => photoInputRef.current?.click()}
                   disabled={isUploadingPhoto || !doctor}
                   className="px-4 py-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-700 rounded-xl text-sm font-bold text-white transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isUploadingPhoto ? t('yuklanmoqda...') : t('rasm yuklash')}
                 </button>
                 <p className="text-xs text-slate-500">{t("tavsiya etiladigan o'lcham: 256x256")}</p>
                 {photoUploadError && <p className="text-xs text-rose-400 mt-1">{photoUploadError}</p>}
               </div>
            </div>

            {!doctor && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                {t("shifokor profili topilmadi — tizimga qayta kiring.")}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("ism familiya")}</label>
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("mutaxassislik")}</label>
                <input type="text" value={profileSpecialty} onChange={(e) => setProfileSpecialty(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("login")}</label>
                <input type="text" value={doctor?.login || ''} disabled className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("status")}</label>
                <input type="text" value={doctor?.status || ''} disabled className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 outline-none cursor-not-allowed" />
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-6">
              <h4 className="font-bold text-white mb-4">{t("parolni o'zgartirish")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("yangi parol")}</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="********" className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("parolni tasdiqlang")}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********" className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'clinic':
        return (
          <div className="space-y-6">
            <div>
               <h3 className="text-xl font-bold text-white mb-1">{t("klinika ma'lumotlari")}</h3>
               <p className="text-sm text-slate-500 mb-6">{t("asosiy ma'lumotlar va rekvizitlar")}</p>
            </div>
            
            {!clinic && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                {t("klinika tanlanmagan.")}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("klinika nomi")}</label>
                <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("telefon raqam")}</label>
                <input type="text" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("manzil")}</label>
                <input type="text" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("reyting")}</label>
                <input type="text" value={clinic?.rating ?? '—'} disabled className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("obuna holati")}</label>
                <input type="text" value={clinic?.subscriptionStatus || '—'} disabled className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 outline-none cursor-not-allowed" />
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div>
               <h3 className="text-xl font-bold text-white mb-1">{t("ai sozlamalari")}</h3>
               <p className="text-sm text-slate-500 mb-6">{t("ai yordamchi — premium xizmat")}</p>
            </div>

            <div className="space-y-4">
               {aiAccess.tier === 'premium' ? (
                 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                   <h5 className="font-bold text-emerald-400 flex items-center gap-2 mb-1"><Bot className="w-4 h-4" /> {t("✓ premium ai faol")}</h5>
                   <p className="text-xs text-slate-400">{t("klinikangiz premium obunada — ai diagnostika va rentgen tahlili cheklovsiz ishlaydi.")}</p>
                 </div>
               ) : aiAccess.eligible ? (
                 <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                   <h5 className="font-bold text-amber-400 flex items-center gap-2 mb-1"><Bot className="w-4 h-4" /> {t("🎁 bepul sinov davri")}</h5>
                   <p className="text-xs text-slate-400">{t("ai yordamchidan bepul foydalanish uchun")} <strong className="text-amber-300">{aiAccess.daysLeft} {t("kun")}</strong> {t("qoldi. sinov tugagach, ai ishlashi uchun premium obunaga o'tish kerak bo'ladi.")}</p>
                 </div>
               ) : (
                 <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 space-y-3">
                   <div>
                     <h5 className="font-bold text-rose-400 flex items-center gap-2 mb-1"><Bot className="w-4 h-4" /> {t("🔒 sinov muddati tugadi")}</h5>
                     <p className="text-xs text-slate-400">{t("ai diagnostika va rentgen tahlili — premium obuna xizmati. davom etish uchun premium'ga o'ting.")}</p>
                   </div>
                   {premiumRequestSent ? (
                     <p className="text-xs text-emerald-400 font-bold">{t("✓ so'rov yuborildi — tizim egasi to'lovni tasdiqlagach, ai faollashadi.")}</p>
                   ) : (
                     <button
                       onClick={() => {
                         if (clinic?.id && onRequestPremiumUpgrade) {
                           onRequestPremiumUpgrade(clinic.id);
                           setPremiumRequestSent(true);
                         }
                       }}
                       disabled={!clinic?.id || !onRequestPremiumUpgrade}
                       className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
                     >
                       {t("premium'ga o'tish uchun so'rov yuborish")}
                     </button>
                   )}
                 </div>
               )}
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div>
               <h3 className="text-xl font-bold text-white mb-1">{t("zaxira va tiklash")}</h3>
               <p className="text-sm text-slate-500 mb-6">{t("ma'lumotlar bazasini xavfsiz saqlash")}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                   <Download className="w-8 h-8 text-blue-500" />
                 </div>
                 <h4 className="font-bold text-white mb-2">{t("zaxira nusxasi (backup)")}</h4>
                 <p className="text-xs text-slate-400 mb-6">{t("ushbu klinikaning bemorlar va navbatlar ma'lumotini json formatda yuklab olish")} ({clinicPatients.length} {t('bemor')}, {clinicQueues.length} {t('navbat')})</p>
                 <button onClick={handleDownloadBackup} disabled={!clinic} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-colors w-full">
                   {t('hozir nusxa olish')}
                 </button>
               </div>

               <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-slate-600/10 rounded-full flex items-center justify-center mb-4">
                   <Upload className="w-8 h-8 text-slate-500" />
                 </div>
                 <h4 className="font-bold text-white mb-2">{t("ma'lumotlarni tiklash")}</h4>
                 <p className="text-xs text-slate-400 mb-6">{t("bu funksiya hali ishlab chiqilmagan — noto'g'ri fayl real ma'lumotlarni buzib qo'yishi mumkinligi sabab ehtiyotkorlik bilan qurilishi kerak")}</p>
                 <button disabled className="px-6 py-2.5 bg-slate-700 text-slate-400 rounded-xl font-bold text-sm w-full cursor-not-allowed">
                   {t('hozircha mavjud emas')}
                 </button>
               </div>
            </div>
          </div>
        );

      case 'branches':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{t("filiallar")}</h3>
              <p className="text-sm text-slate-500 mb-6">{t("tarmoqdagi barcha klinika filiallari")}</p>
            </div>
            {allClinics.length === 0 ? (
              <div className="p-6 bg-[#111827] border border-slate-700 rounded-2xl text-center text-sm text-slate-400">
                {t("filiallar topilmadi.")}
              </div>
            ) : (
              <div className="space-y-3">
                {allClinics.map((c) => (
                  <div key={c.id} className={`flex items-center justify-between border rounded-2xl p-4 ${c.id === clinic?.id ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-[#111827] border-slate-700'}`}>
                    <div>
                      <p className="font-bold text-white text-sm flex items-center gap-2">
                        {decodeLegacyEntities(c.name)}
                        {c.id === clinic?.id && <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full font-black">{t("joriy")}</span>}
                      </p>
                      <p className="text-xs text-slate-500">{decodeLegacyEntities(c.address)} · {decodeLegacyEntities(c.phone)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${c.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {c.subscriptionStatus || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'employment':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{t("ish shartlari")}</h3>
              <p className="text-sm text-slate-500 mb-6">{t("sizning klinikalar bilan ish shartlaringiz — buni faqat klinika direktori yoki tizim egasi o'zgartira oladi.")}</p>
            </div>

            {myLinksLoading ? (
              <p className="text-xs text-slate-500">{t('yuklanmoqda...')}</p>
            ) : myLinks.length === 0 ? (
              <div className="p-6 bg-[#111827] border border-slate-700 rounded-2xl text-center text-sm text-slate-400">
                {t("hozircha ish shartlaringiz belgilanmagan — bu haqda klinika direktori bilan bog'laning.")}
              </div>
            ) : (
              <div className="space-y-3">
                {myLinks.map((link) => {
                  const linkClinic = allClinics.find((c) => c.id === link.clinicId);
                  return (
                    <div key={link.id} className="bg-[#111827] border border-slate-700 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-white text-sm">{decodeLegacyEntities(linkClinic?.name) || link.clinicId}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          link.relationshipType === 'independent' ? 'bg-emerald-500/10 text-emerald-400' :
                          link.relationshipType === 'revenue_share' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {link.relationshipType === 'independent' ? `🏠 ${t('mustaqil')}` : link.relationshipType === 'revenue_share' ? t('ulush') : t('ijara')}
                        </span>
                      </div>
                      {link.relationshipType === 'revenue_share' && (
                        <p className="text-xs text-slate-400">
                          {t("sizning ulushingiz:")} <strong className="text-white">{link.doctorRevenueSharePercent ?? 50}%</strong>
                          {' · '}
                          {t("klinika ulushi:")} <strong className="text-white">{100 - (link.doctorRevenueSharePercent ?? 50)}%</strong>
                        </p>
                      )}
                      {link.relationshipType === 'rental' && (
                        <p className="text-xs text-slate-400">
                          {t("oylik ijara:")} <strong className="text-white">{(link.monthlyRentFee ?? 0).toLocaleString('uz-UZ')} so'm</strong>
                          {' · '}
                          {t("holat:")} <strong className={link.rentPaymentStatus === 'paid' ? 'text-emerald-400' : 'text-rose-400'}>{link.rentPaymentStatus === 'paid' ? t("to'langan") : t("to'lanmagan")}</strong>
                        </p>
                      )}
                      {link.relationshipType === 'independent' && (
                        <p className="text-xs text-slate-400">
                          {t("Bu — sizning shaxsiy klinikangiz. Barcha daromad sizga tegishli.")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{t("to'lov tizimlari")}</h3>
              <p className="text-sm text-slate-500 mb-6">{t("bemorlar to'lovni to'g'ridan-to'g'ri shu rekvizitlarga o'tkazadi va chekni telegram bot orqali yuboradi — siz esa shu yerda tasdiqlaysiz.")}</p>
            </div>

            {!doctor && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                {t("shifokor profili topilmadi — tizimga qayta kiring.")}
              </div>
            )}

            <div className="bg-[#111827] border border-slate-700 rounded-2xl p-5">
              <h4 className="font-bold text-white mb-4">{t("to'lov rekvizitlaringiz")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("karta raqami")}</label>
                  <input type="text" value={paymentCardNumber} onChange={(e) => setPaymentCardNumber(e.target.value)} placeholder="8600 1234 5678 9012" className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("telefon raqami (click/payme)")}</label>
                  <input type="text" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} placeholder="+998 90 123 45 67" className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-700 rounded-2xl p-5">
              <h4 className="font-bold text-white mb-4">{t('tasdiqlash kutayotgan cheklar')} {receipts.filter(r => r.status === 'pending').length > 0 && <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black ml-1">{receipts.filter(r => r.status === 'pending').length}</span>}</h4>
              {receiptsLoading ? (
                <p className="text-xs text-slate-500">{t('yuklanmoqda...')}</p>
              ) : receipts.length === 0 ? (
                <p className="text-xs text-slate-500">{t("hozircha birorta ham to'lov cheki yuborilmagan.")}</p>
              ) : (
                <div className="space-y-3">
                  {receipts.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 bg-[#0a0f1d] border border-slate-800 rounded-xl p-3">
                      <button type="button" onClick={() => setViewerReceipt(r)} className="shrink-0">
                        <img src={r.imageData} alt="Chek" className="w-16 h-16 rounded-lg object-cover border border-slate-700 hover:opacity-80 transition-opacity" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{r.patientName || t('bemor')}</p>
                        <p className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleString('uz-UZ')}</p>
                      </div>
                      {r.status === 'pending' ? (
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleResolveReceipt(r.id, 'confirmed')}
                            disabled={receiptActionId === r.id}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            ✓ {t('tasdiqlash')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveReceipt(r.id, 'rejected')}
                            disabled={receiptActionId === r.id}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 rounded-lg text-xs font-bold transition-colors"
                          >
                            ✕ {t('rad etish')}
                          </button>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase shrink-0 ${r.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {r.status === 'confirmed' ? t('tasdiqlangan') : t('rad etilgan')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {viewerReceipt && (
              <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setViewerReceipt(null)}>
                <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => setViewerReceipt(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                  <img src={viewerReceipt.imageData} alt="Chek" className="w-full rounded-2xl border border-slate-700" />
                  {viewerReceipt.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => handleResolveReceipt(viewerReceipt.id, 'confirmed')}
                        disabled={receiptActionId === viewerReceipt.id}
                        className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors"
                      >
                        ✓ {t('tasdiqlash')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveReceipt(viewerReceipt.id, 'rejected')}
                        disabled={receiptActionId === viewerReceipt.id}
                        className="flex-1 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 rounded-xl font-bold text-sm transition-colors"
                      >
                        ✕ {t('rad etish')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-[#0a0f1d] rounded-2xl border border-dashed border-slate-800 p-8">
             <SettingsIcon className="w-12 h-12 mb-4 text-slate-700 animate-spin-slow" style={{ animationDuration: '3s' }} />
             <p className="text-lg font-bold text-slate-400 mb-2">{t('ushbu modul ishlab chiqilmoqda')}</p>
             <p className="text-sm">{t('tez orada')} {t(SETTINGS_SECTIONS.find(s => s.id === activeSection)?.label || '').toLowerCase()} {t("bo'limi ishga tushadi.")}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#020712] rounded-3xl border border-slate-800 overflow-hidden text-slate-300 font-sans">

      {/* Sidebar Navigation — a horizontal scroll strip on mobile (fixed side-by-side
          columns overflowed the content pane off-screen below md), a full vertical
          sidebar from md up. */}
      <div className="w-full md:w-64 bg-[#0a0f1d] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col md:overflow-y-auto custom-scrollbar shrink-0">
         <div className="hidden md:block p-6 border-b border-slate-800 sticky top-0 bg-[#0a0f1d] z-10">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <SettingsIcon className="w-6 h-6 text-emerald-500" /> {t('sozlamalar')}
           </h2>
         </div>
         <div className="flex md:block overflow-x-auto md:overflow-x-visible gap-1 md:gap-0 md:space-y-1 p-3 md:p-4 hide-scrollbar">
           {SETTINGS_SECTIONS.map((section) => (
             <button
               key={section.id}
               onClick={() => setActiveSection(section.id)}
               className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                 activeSection === section.id
                   ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                   : 'text-slate-400 hover:text-white hover:bg-[#111827]'
               }`}
             >
               <section.icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
               <span className="truncate">{t(section.label)}</span>
               {activeSection === section.id && <ChevronRight className="hidden md:block w-4 h-4 ml-auto shrink-0 opacity-50" />}
             </button>
           ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:h-full overflow-hidden bg-[#020712]">
         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
           <div className="max-w-4xl mx-auto">
             {renderSection()}
           </div>
         </div>

         {/* Footer Action Bar */}
         {!['branches', 'backup', 'employment', 'ai'].includes(activeSection) && (
         <div className="p-4 border-t border-slate-800 bg-[#0a0f1d] flex justify-end shrink-0">
           <div className="flex items-center gap-4 max-w-4xl w-full mx-auto px-4">
             {saveError && (
               <span className="text-rose-400 text-sm font-bold flex items-center gap-2 ml-auto">
                 <AlertCircle className="w-4 h-4" /> {saveError}
               </span>
             )}
             {saveSuccess && !saveError && (
               <span className="text-emerald-400 text-sm font-bold flex items-center gap-2 ml-auto">
                 <CheckCircle2 className="w-4 h-4" /> {t('saqlandi')}
               </span>
             )}
             <button 
               onClick={handleSave}
               disabled={isSaving}
               className={`ml-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
             >
               {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               {t('saqlash')}
             </button>
           </div>
         </div>
         )}
      </div>

    </div>
  );
}
