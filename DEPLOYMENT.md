# 🚀 DStoma Loyihasini Production Nashriga Joylashtirish Yo'riqnomasi

Ushbu loyiha **React (Vite)** va **Node.js (Express)** texnologiyalarida to'liq TypeScript yordamida yozilgan professional, to'liq funksional tizimdir. Loyihani internet tarmog'iga muvaffaqiyatli joylashtirish uchun quyidagi usullardan foydalanishingiz mumkin.

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
