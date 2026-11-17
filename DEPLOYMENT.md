# 🚀 DStoma Loyihasini Production Nashriga Joylashtirish Yo'riqnomasi

Ushbu loyiha **React (Vite)** va **Node.js (Express)** texnologiyalarida to'liq TypeScript yordamida yozilgan professional, to'liq funksional tizimdir. Loyihani internet tarmog'iga muvaffaqiyatli joylashtirish uchun quyidagi usullardan foydalanishingiz mumkin.

---

## 🚀 Render'ga joylash (Vercel o'rniga) — tavsiya etiladi

Vercel Hobby tarifi CPU limiti oshgani uchun deploy'larni to'xtatgan edi. Render'da ilova oddiy doimiy server sifatida ishlaydi: Telegram botlar polling bilan ishlaydi, kundalik eslatmalarni (har kuni 08:00 Toshkent vaqti) server o'zi yuboradi.

**1. Tayyorgarlik (sizdan)**
- **Yangi Firebase kaliti:** Firebase console → `dstoma-ca27c` → Project settings → Service accounts → *Generate new private key*. Vercel'dagi qiymatni ko'ra olmaysiz (u "Secret" turida saqlangan). Eski kalitni shu sahifadan o'chiring, ayniqsa skrinshotda ko'ringan `d117df43…` ni. JSON faylni bitta qatorga keltirib saqlang.
- **`ADMIN_PASS`:** superadmin paroli (production'da standart parol yo'q).
- **`CREDENTIALS_ENCRYPTION_KEY`:** Vercel → Settings → Environment Variables'da qiymatini ko'ring va nusxalang. Ko'rinmasa, eski xodim parollari tekshirilmaydi va ularga SuperAdmin paneli orqali yangi parol berish kerak bo'ladi.
- `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `DOCTOR_BOT_TOKEN`: Vercel'dagi qiymatlar. Telegram tokenlari Firestore'da ham saqlanadi (SuperAdmin → Telegram bot), shuning uchun ular bo'sh qolsa ham bot ishlashi mumkin.

**2. Render'da**
1. [render.com](https://render.com) → ro'yxatdan o'ting → GitHub'ni ulang → **New → Blueprint** → `dstoma-navbat` repozitoriyasini tanlang. Render `render.yaml` ni o'qiydi.
2. `sync: false` qilingan o'zgaruvchilarni (yuqoridagi qiymatlarni) kiriting → **Apply**.
3. Build 5–10 daqiqa oladi. Tugagach `https://dstoma-xxxx.onrender.com` ochilishi, tizimga kirish ishlashi kerak.
4. Log'larda `Listening live`, `running in production` va `[Telegram Bot] Launching...` yozuvlari bo'lishi kerak.

**3. Domen**
1. Render → servis → **Settings → Custom Domains** → `www.dstoma.online` va `dstoma.online` ni qo'shing.
2. Domen registratoringizda DNS yozuvlarini Render ko'rsatgan qiymatlarga o'zgartiring (Vercel'ga ishora qilgan yozuvlarni almashtiring). Tarqalishi bir necha daqiqadan bir necha soatgacha.
3. Render domen uchun HTTPS sertifikatini o'zi beradi.

**4. Vercel'ni o'chirish (muhim)**
Hosting ko'chgach Vercel loyihasini o'chiring yoki to'xtating. Pauza tugagach u Telegram webhook'ini o'ziga qaytarib oladi va Render'dagi bot bilan tortishib qoladi.

**5. Tekshirish ro'yxati**
- Direktor, shifokor va bemor sifatida kirib ko'ring.
- Telegram botga `/start` yuboring.
- Firebase console → Authentication → Settings → Authorized domains'ga `dstoma.online` va `www.dstoma.online` ni qo'shing (kirishda xato bo'lsa).

Narx: `render.yaml` da `plan: starter` yozilgan, chunki doimiy ishlaydigan instans kerak. Joriy narxni Render'ning narxlar sahifasidan tekshiring. Bepul instanslar bo'sh turganda uxlaydi, bu botlar va eslatmalar uchun mos emas.

---

## 📌 Muhim: Telegram Bot va Serverless Ssenariylari

Loyihangizda **Telegram Bot** xizmati mavjud. Chatbot foydalanuvchilar kelgan buyruqlarini eshitishi uchun ikki xil usul bor:
1. **Puling (Polling) usuli:** Server doimiy ravishda Telegram serveridan yangi xabarlarni so'rab oladi.
2. **Vebxuk (Webhook) usuli:** Telegram yangi xabar kelganda uni to'g'ridan-to'g'ri serveringizga HTTP POST so'rovi bilan jo'natadi.

⚠️ **DIQQAT:** **Vercel** serverless platforma hisoblanadi. Unda backend server 24/7 ishlab turmaydi, balki faqat so'rov kelgandagina uyg'onib, keyin muzlatiladi (freeze). Shu sababli, **Puling (polling) bot Vercel-da ishlamaydi**. 
* Agar siz loyihani **Vercel**-da joylashtirmoqchi bo'lsangiz, albatta **Telegram Webhook**-ni sozlashingiz kerak (pastdagi Vercel yo'riqnomasiga qarang).
* Agar siz loyihani **Render**, **Railway**, **VPS/Docker** kabi doimiy ishlab turuvchi (persistent process) platformalarga joylashtirsangiz, Polling rejimi hech qanday qo'shimcha sozlomalarsiz avtomatik ishlaydi!

---

## METHOD 1: Doimiy Platformalar (Railway, Render, Koyeb yoki VPS) — *TAVSIYA ETILADI*

Ushbu platformalar Node.js serveringizni 24/7 uzluksiz ishlatadi va Telegram doimiy eshituvchisi (polling) hech qanday vebxuksiz ishlaydi.

### Joylashtirish Qadamlari (GitHub orqali):
1. Loyihangizni yangi shaxsiy yoki ommaviy GitHub repozitoriyasiga yuklang.
2. **Render.com** yoki **Railway.app**-ga kiring va GitHub profilingiz orqali ro'yxatdan o'ting.
3. Yangi **Web Service** qo'shing va loyiha repozitoriyasini unga bog'lang.
4. Quyidagi parametrlarni o'rnating:
   * **Runtime:** `Node` (v18+)
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start`
5. Atrof-muhit o'zgaruvchilarini (Environment Variables) sozlang:
   * `NODE_ENV` = `production`
   * `GEMINI_API_KEY` = *Sizning Google Gemini API kalitingiz*
   * `FIREBASE_SERVICE_ACCOUNT` = *Firebase service account JSON fayli, bitta qatorda (pastdagi "Firebase xavfsizligi" bo'limiga qarang)*
   * `VITE_TELEGRAM_BOT_TOKEN` = *Sizning Telegram Bot tokeningiz (BotFather-dan olingan)*
   * `APP_URL` = *Tizim joylashtiriladigan sayt manzili (masalan: `https://dstoma.onrender.com`)*
6. **Deploy** tugmasini bosing. Bo'ldi! Tizimingiz ham veb-sayt, ham bot uchun to'liq ishga tushadi.

---

## METHOD 2: Vercel Platformasiga Joylashtirish (Serverless Webhook bilan)

Agar siz loyihani faqat **Vercel**-da saqlamoqchi bo'lsangiz, serverless holatda Telegram bot ishlay olishi uchun quyidagi amallarni bajaring:

### 1-qadam: Vercel-ga deploy qilish
1. GitHub repozitoriyangizni **Vercel.com**-ga ulab yaxlit loyihani yarating.
2. Atrof-muhit muhit o'zgaruvchilarini (Environment Variables) Vercel dashboard orqali kiriting:
   * `GEMINI_API_KEY`
   * `VITE_TELEGRAM_BOT_TOKEN`
   * `APP_URL` = *Vercel bergan saytingiz manzili (masalan: `https://dstoma.vercel.app`)*
3. Vercel loyihani avtomatik ravishda build qilib, saytni ishga tushiradi.

### 2-qadam: Telegram Webhook-ni faollashtirish
Loyihada vebxuklarni qabul qiluvchi maxsus maxfiy va xavfsiz `/api/telegram-webhook` endpointi yaratilgan. Sayt deploy bo'lgach, Telegram botingizni ushbu manzilga yo'naltirishingiz shart.

Buning uchun quyidagi havolani tayyorlang (o'zgaruvchilarni almashtiring) va brauzeringizda oching:
```text
https://api.telegram.org/bot<Sizning_Bot_Tokeningiz>/setWebhook?url=<Sizning_Vercel_Saytingiz>/api/telegram-webhook
```

**Namuna:**
Agar tokeningiz `123456:ABC-DEF` va saytingiz `dstoma.vercel.app` bo'lsa:
```text
https://api.telegram.org/bot123456:ABC-DEF/setWebhook?url=https://dstoma.vercel.app/api/telegram-webhook
```

Ochganingizda, Telegram quyidagicha muvaffaqiyatli natija qaytaradi:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

Ushbu sozlamadan keyin, kimdir botga yozishi bilan Telegram xabarni to'g'ridan-to'g'ri sizning Vercel serverless backend-ingizga yo'naltiradi va u zumda maslahat yoki buyruqni qayta ishlab javob beradi.

---

## 🛠 Atrof-muhit O'zgaruvchilari (Environment Variables) Ro'yxati

Ishlab chiqarish (Production) muhiti uchun `.env` faylida yoki xosting panelida quyidagilarni to'ldiring:

```env
# Google Gemini API integratsiyasi kaliti (Tish diagnostika va AI savol-javob uchun)
GEMINI_API_KEY=AIzaSy...

# Telegram Bot tokeni (BotFather bergan maxfiy kalit)
VITE_TELEGRAM_BOT_TOKEN=7849...:AAF...

# Ilovaning asosiy URL manzili (Telegram Mini App URL-lar va vebxuk manzili ulanishi uchun)
APP_URL=https://sizning-saytingiz.com
```

---

*Omad yor bo'lsin! Savollaringiz yoki qo'shimcha sozlomalaringiz bo'lsa, istalgan vaqtda yozib yuboring.*


---

## 🔒 Firebase xavfsizligi (majburiy)

Server Firestore'ga **Admin SDK** orqali ulanadi, brauzer esa serverdan olingan Firebase token bilan kiradi. `firestore.rules` faqat shu tokenga ega foydalanuvchilarga, faqat o'z klinikasi va bemorlari ma'lumotlariga ruxsat beradi.

1. **Service account kaliti:** Firebase console → Project settings → Service accounts → *Generate new private key*. Yuklangan JSON faylni bitta qatorga keltirib, `FIREBASE_SERVICE_ACCOUNT` muhit o'zgaruvchisiga qo'ying (Vercel/Render). Bu faylni hech qachon GitHub'ga yuklamang.
2. **Authentication'ni yoqish:** Firebase console → Authentication → *Get started* (custom token bilan kirish uchun kerak, alohida provayder yoqish shart emas).
3. **Qoidalarni joylash:** `npx firebase-tools deploy --only firestore:rules` (yoki `firestore.rules` mazmunini Firebase console → Firestore → Rules oynasiga qo'yib, *Publish* bosing).

Tartib muhim: avval 1–2-qadamlar va yangi kodni deploy qiling, keyin qoidalarni joylang. Aks holda server bazaga ulana olmaydi.
