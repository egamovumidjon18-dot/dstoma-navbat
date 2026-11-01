<div align="center">
  <img src="public/logo-full.png" alt="DStoma" height="72" />
  <h3>Multi-clinic dental practice management and online booking</h3>
  <p>Web app · installable PWA · Android (Capacitor) · Telegram bots · 7 languages</p>
</div>

---

DStoma is a SaaS platform for dental clinics and clinic networks. Patients book online
and follow their treatment; doctors run their queue, dental chart, X-rays and
prescriptions; clinic directors see revenue and staff performance; and the platform
owner manages every clinic, subscription and payment from one panel.

It is live at [dstoma.online](https://dstoma.online).

## Features

### Patients
- Find a clinic on the map, see each doctor's real-time availability and book a slot
- Self sign-up with a login code; family accounts (a parent manages children)
- Personal cabinet: appointments, dental chart, treatment plan, payments
- Waitlist with a Telegram notification when a slot opens
- Rate a visit after it is completed
- AI chat that answers questions using the patient's own history (Premium)

### Doctors
- Live queue: call in, start, finish a visit; scheduled appointments
- Interactive dental chart (permanent/primary teeth, FDI/Universal/Palmer notation,
  per-surface conditions, mobility, root canals, bleeding, notes)
- Treatment plans with multi-visit stages and per-stage billing
- X-ray center and before/after photo gallery, linked to teeth
- AI analysis of the dental chart and X-rays (Gemini, Premium)
- Prescriptions with templates, PDF export and sending via Telegram
- Material stock per doctor with automatic deduction per procedure
- Finance: charges, payments, debts, receipts; personal statistics
- Works in several clinics at once (rent / revenue-share / own clinic)

### Clinic directors
- Today's revenue, queue and per-doctor performance
- Patient database (CRM) with visit history and referral source
- Add doctors (credentials generated once), service catalog and prices
- Business arrangement per doctor: revenue share %, monthly rent, or independent
- Material stock totals across doctors

### Platform owner (superadmin)
- Onboard clinics, or let clinics register themselves with a trial
- Subscription billing with confirmation flow, Basic/Premium tiers, overdue alerts
- MRR/ARR overview and forecast calculator
- Group reports for owners with several branches
- Bulk-add doctors, sign in as any director or doctor for support
- Ads shown in the app and in Telegram messages
- Telegram bot setup, webhook diagnostics, audit log

### Platform
- **7 interface languages:** Uzbek, Russian, English, Kazakh, Kyrgyz, Tajik, Turkmen.
  The choice is remembered; first visit follows the browser language.
- **Telegram:** patient bot (booking, reminders, notifications) and doctor bot
  (queue notifications, AI patient summary)
- **Daily appointment reminders** via a scheduled job
- **Google Calendar sync** for doctors' appointments
- **Installable PWA** and an **Android app** project (Capacitor)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, Recharts, Three.js, Motion |
| Backend | Node.js 24, Express 4 (single `server.ts`, ~75 REST endpoints) |
| Database | Google Cloud Firestore |
| Auth | Own sessions (hashed passwords, sliding expiry) + Firebase custom tokens for the browser |
| AI | Google Gemini (`gemini-2.5-flash`) |
| Hosting | Vercel (serverless function + static), or any Node host |
| Mobile | Capacitor 8 (Android) |
| PDF | jsPDF |

About 36,000 lines of TypeScript in `src/` plus ~6,000 in `server.ts`.

## Security model

- The server reaches Firestore through the **Admin SDK** with a service account.
- The browser signs in to Firebase with a **custom token** issued by
  `GET /api/firebase-token`, carrying the user's role and clinic(s).
- `firestore.rules` scope direct browser access: staff see only their clinic's data
  and their own patients; patients see only their own records (read-only); everything
  else (patients list, sessions, payments, credentials) is server-only.
- Passwords are hashed; clinic/doctor credentials shown to admins are encrypted at rest.
- Rate limiting on login and AI endpoints; Telegram Mini App sign-in verifies the
  Telegram signature.

## Getting started

**Requirements:** Node.js 24, a Firebase project with Firestore and Authentication enabled.

```bash
npm install
cp .env.example .env      # then fill it in (see below)
npm run dev               # http://localhost:3000
```

Without `FIREBASE_SERVICE_ACCOUNT` the dev server runs on an in-memory store, which is
enough to click through the patient, doctor and admin flows; the dental chart, X-rays
and other Firestore-backed panels need a real project.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | yes (production) | Service-account JSON on one line |
| `ADMIN_USER`, `ADMIN_PASS` | yes | Initial superadmin login (change it in the panel afterwards) |
| `CREDENTIALS_ENCRYPTION_KEY` | yes | Key for encrypting stored staff credentials |
| `GEMINI_API_KEY` | for AI | Google Gemini API key |
| `TELEGRAM_BOT_TOKEN`, `DOCTOR_BOT_TOKEN` | for Telegram | Patient and doctor bot tokens |
| `APP_URL` | yes | Public URL, used for links and the Telegram webhook |
| `CRON_SECRET` | on Vercel | Protects the reminders cron endpoint |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | optional | Google Calendar sync for doctors |

Point the app at your Firebase project in `firebase-applet-config.json` (the web config
from Firebase console → Project settings → Your apps).

### Demo data

```bash
GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json npm run seed:demo
```

Fills an **empty** Firestore project with English demo clinics, doctors, services,
patients, appointments and dental-chart entries, and prints the demo logins.
Use a separate project for demos — never your production database.

## Deployment

- **Vercel:** connect the repo; `vercel.json` routes `/api/*` to the Express app and
  schedules the daily reminder job. Set the environment variables above.
- **Any Node host (Render, Railway, VPS):** `npm run build && npm start`.
- **Firestore rules:** `npx firebase-tools deploy --only firestore:rules`
- **Android:** `npm run cap:sync`, then build in Android Studio.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Telegram webhook setup.

## Project layout

```
server.ts                  Express API, Telegram bots, AI calls, cron
src/
  App.tsx                  Routing between welcome, login and the role panels
  components/              Patient, doctor, director and superadmin panels
  hooks/useAppState.ts     App-wide state, sessions, data loading
  services/                Firebase client, API base URL
  server/firebaseAdmin.ts  Admin SDK wrapper used by the server
  translations/            Language files + shared UI phrases (ui.ts)
  utils/                   Billing, PDF export, scheduling, language store
scripts/                   Demo seed, Firestore migration, icon generator
firestore.rules            Browser access rules
android/                   Capacitor Android project
```

## Known limitations

- No automated test suite.
- `server.ts` is a single large file; splitting it by domain is the obvious next step.
- Currency is Uzbek so'm and notifications go through Telegram; other markets need a
  currency setting and SMS/WhatsApp.
- Not certified for HIPAA or GDPR.
