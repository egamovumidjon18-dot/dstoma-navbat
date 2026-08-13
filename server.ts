// DIQQAT: Bu faqat development uchun mock ma'lumotlar.
// Production da real database ishlatiladi.

import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Without these, any unhandled error thrown inside an `async (req, res) => {...}`
// route handler (e.g. a Firestore write rejecting an `undefined` field) becomes an
// unhandled promise rejection, which crashes the ENTIRE Node process — taking the
// whole multi-tenant app down for every clinic, not just the failing request.
process.on("unhandledRejection", (reason) => {
  console.error("[DStoma Server] Unhandled promise rejection (kept process alive):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[DStoma Server] Uncaught exception (kept process alive):", err);
});

// Enable JSON bodies
app.use(express.json());

// SECURE HEADER MIDDLEWARE FOR PRODUCTION-GRADE COMPLIANCE
app.use((req, res, next) => {
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Ensures both bots' Telegram webhooks are registered, exactly once per cold start.
// This is deliberately awaited inside a real request's lifecycle (as middleware),
// not fired disconnected at module load — Vercel freezes a function's execution the
// moment its response is sent, so a fire-and-forget async call kicked off at module
// scope has no guarantee of ever finishing. Tying it to the request/response cycle
// means the platform keeps the invocation alive until this actually completes.
app.use(async (req, res, next) => {
  await ensureWebhooksSetupOnce();
  next();
});

// SESSION TOKENS (superadmin + director/doctor) — issued on /api/admin-login,
// /api/director-login, /api/doctor-login, and /api/admin-impersonate.
// Persisted to Firestore's "sessions" collection (doc id = token) so they survive
// Vercel's serverless cold starts — each invocation can land on a brand-new instance
// with an empty in-memory Map, which used to log everyone out at random. The Maps
// below are kept purely as a same-instance fast-path cache to avoid a Firestore
// round-trip on every request; Firestore is always the source of truth.
const superAdminSessions = new Map<string, number>(); // token -> expiresAt (ms)
// Sessions are sliding, not fixed: getAuthContext() below renews expiresAt on
// every request past the halfway point of the window, so someone who keeps
// the panel open and actually uses it never hits the wall — only real
// inactivity for the full window logs them out. 24h was a fixed wall: a
// doctor mid-shift who logged in that morning got kicked while still working.
const SUPERADMIN_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, sliding
const staffSessions = new Map<string, { role: 'director' | 'doctor'; clinicId: string; doctorId?: string; expiresAt: number }>();
const STAFF_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, sliding
// Patients get a session too, so a self-service write (changing their treating
// doctor, managing family members) can be proven to come from that patient
// instead of being accepted from anyone who knows a patient id.
const patientSessions = new Map<string, { patientId: string; expiresAt: number }>();

// A slow/unreachable Firestore connection must never hang an HTTP response —
// races any promise against a timeout so callers always get an answer.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function saveSuperAdminSession(token: string, expiresAt: number) {
  superAdminSessions.set(token, expiresAt);
  // On Vercel, the very next request (e.g. the credentials fetch right after login)
  // often lands on a different serverless instance with an empty in-memory Map, so it
  // depends on this Firestore write having already landed. Awaiting it here (bounded by
  // a timeout so a flaky connection can't hang the login response forever) closes that
  // race; a fire-and-forget write was tried before and caused intermittent "session not
  // found" 401s on actions performed immediately after logging in or resetting creds.
  if (fDb) {
    try {
      await withTimeout(setDoc(doc(fDb, "sessions", token), { type: "superadmin", expiresAt }), 4000);
    } catch (err) {
      console.error("[Session] Failed to persist superadmin session to Firestore:", err);
    }
  }
}
async function saveStaffSession(token: string, data: { role: 'director' | 'doctor'; clinicId: string; doctorId?: string; expiresAt: number }) {
  staffSessions.set(token, data);
  if (fDb) {
    try {
      await withTimeout(setDoc(doc(fDb, "sessions", token), stripUndefined({ type: "staff", ...data })), 4000);
    } catch (err) {
      console.error("[Session] Failed to persist staff session to Firestore:", err);
    }
  }
}

async function savePatientSession(token: string, data: { patientId: string; expiresAt: number }) {
  patientSessions.set(token, data);
  if (fDb) {
    try {
      await withTimeout(setDoc(doc(fDb, "sessions", token), { type: "patient", ...data }), 4000);
    } catch (err) {
      console.error("[Session] Failed to persist patient session to Firestore:", err);
    }
  }
}

// Extends a session past the halfway point of its window instead of on every
// single request — otherwise every authenticated call would carry a Firestore
// write. Fire-and-forget: a missed renewal just gets retried on the next
// request, it never blocks the response that triggered it.
function renewIfHalfway(token: string, expiresAt: number, ttlMs: number, save: (newExpiresAt: number) => void) {
  if (expiresAt - Date.now() < ttlMs / 2) {
    save(Date.now() + ttlMs);
  }
}

async function getAuthContext(req: any): Promise<{ isSuperAdmin: boolean; staff?: { role: 'director' | 'doctor'; clinicId: string; doctorId?: string }; patient?: { patientId: string } }> {
  const authHeader = String(req.headers["authorization"] || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return { isSuperAdmin: false };

  const saExpiry = superAdminSessions.get(token);
  if (saExpiry && saExpiry > Date.now()) {
    renewIfHalfway(token, saExpiry, SUPERADMIN_SESSION_TTL_MS, (exp) => { saveSuperAdminSession(token, exp); });
    return { isSuperAdmin: true };
  }
  const staff = staffSessions.get(token);
  if (staff && staff.expiresAt > Date.now()) {
    renewIfHalfway(token, staff.expiresAt, STAFF_SESSION_TTL_MS, (exp) => { saveStaffSession(token, { ...staff, expiresAt: exp }); });
    return { isSuperAdmin: false, staff };
  }
  const patientSession = patientSessions.get(token);
  if (patientSession && patientSession.expiresAt > Date.now()) {
    renewIfHalfway(token, patientSession.expiresAt, STAFF_SESSION_TTL_MS, (exp) => { savePatientSession(token, { ...patientSession, expiresAt: exp }); });
    return { isSuperAdmin: false, patient: { patientId: patientSession.patientId } };
  }

  // Cache miss (e.g. a fresh serverless instance) — fall back to Firestore, the
  // persistent source of truth, and repopulate the in-memory cache on a hit. Bounded
  // by a timeout so a slow/flaky Firestore connection degrades to "not authorized"
  // instead of hanging the request forever.
  if (fDb) {
    try {
      const snap = await withTimeout(getDoc(doc(fDb, "sessions", token)), 3000);
      if (snap.exists()) {
        const data: any = snap.data();
        if (data.expiresAt > Date.now()) {
          if (data.type === "superadmin") {
            superAdminSessions.set(token, data.expiresAt);
            renewIfHalfway(token, data.expiresAt, SUPERADMIN_SESSION_TTL_MS, (exp) => { saveSuperAdminSession(token, exp); });
            return { isSuperAdmin: true };
          }
          if (data.type === "staff") {
            const staffData = { role: data.role, clinicId: data.clinicId, doctorId: data.doctorId, expiresAt: data.expiresAt };
            staffSessions.set(token, staffData);
            renewIfHalfway(token, data.expiresAt, STAFF_SESSION_TTL_MS, (exp) => { saveStaffSession(token, { ...staffData, expiresAt: exp }); });
            return { isSuperAdmin: false, staff: staffData };
          }
          if (data.type === "patient") {
            patientSessions.set(token, { patientId: data.patientId, expiresAt: data.expiresAt });
            renewIfHalfway(token, data.expiresAt, STAFF_SESSION_TTL_MS, (exp) => { savePatientSession(token, { patientId: data.patientId, expiresAt: exp }); });
            return { isSuperAdmin: false, patient: { patientId: data.patientId } };
          }
        }
      }
    } catch (err) {
      console.error("[Session] Firestore session lookup failed/timed out:", err);
    }
  }
  return { isSuperAdmin: false };
}

async function requireSuperAdmin(req: any, res: any, next: any) {
  const auth = await getAuthContext(req);
  if (!auth.isSuperAdmin) {
    return res.status(401).json({ ok: false, error: "Superadmin sessiyasi topilmadi yoki muddati o'tgan. Qayta kiring." });
  }
  next();
}

// True if the caller is the superadmin, OR a director of `clinicId`, OR a doctor
// belonging to `clinicId` (when doctor access should also be allowed).
async function isAuthorizedForClinic(req: any, clinicId: string | undefined, allowDoctor = false): Promise<boolean> {
  const auth = await getAuthContext(req);
  if (auth.isSuperAdmin) return true;
  if (!auth.staff || !clinicId) return false;
  if (auth.staff.role === 'director') return auth.staff.clinicId === clinicId;
  if (allowDoctor && auth.staff.role === 'doctor') return auth.staff.clinicId === clinicId;
  return false;
}

// A LIGHTWEIGHT RATE-LIMITER TO DEFEND AGAINST BRUTE FORCE ATTACKS & SPAM
const ipLimits = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
    const now = Date.now();
    const record = ipLimits.get(ip);
    
    if (!record) {
      ipLimits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfterMs: record.resetTime - now
      });
    }
    next();
  };
}

// XSS SANITIZATION HELPER
// Strips angle brackets to prevent HTML tag injection. Does NOT HTML-entity-encode
// quotes/apostrophes/slashes: React already escapes text content on render (no
// dangerouslySetInnerHTML is used anywhere in this app), and entity-encoding here
// used to corrupt ordinary Uzbek text (apostrophes are common, e.g. "bo'lim").
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
}

// Firestore's setDoc rejects any field whose value is explicitly `undefined`
// (e.g. an optional field spread from a partial update object) — every save*
// function below runs its payload through this before writing.
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
}

// Centralized In-Memory Database for Synchronized Clinic Operations
interface ClinicVisit {
  id: string;
  date: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  complaint?: string;
  medicalNotes?: string;
  price?: number;
  clinicId?: string;
}

interface DoctorClinicLink {
  id: string;
  doctorId: string;
  clinicId: string;
  relationshipType: 'rental' | 'revenue_share' | 'independent';
  doctorRevenueSharePercent?: number;
  monthlyRentFee?: number;
  rentPaymentStatus?: 'paid' | 'unpaid';
  rentPaymentUpdatedAt?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  id: string;
  clinicId: string;
  fullName: string;
  passportSerial: string;
  phone: string;
  birthDate?: string;
  password?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicDiseases?: string;
  hasInfection?: boolean;
  telegramChatId?: string;
  medicalHistory?: any[];
  clinicVisits?: ClinicVisit[];
  managedBy?: string;
  primaryDoctorId?: string;
}

interface QueueItem {
  id: string;
  clinicId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  serviceId: string;
  number: number;
  status: 'pending' | 'scheduled' | 'calling' | 'in_progress' | 'completed' | 'cancelled';
  rating?: number;
  createdAt: string;
  appointmentDate?: string;
  appointmentTime?: string;
  hasInfection?: boolean;
  medicalNotes?: string;
  passportSerial?: string;
  telegramChatId?: string;
  complaint?: string;
}

const g = globalThis as any;
if (!g._doctorTelegramChats) {
  g._doctorTelegramChats = {};
}
if (!g._serverClinics) {
  g._serverClinics = [];
}
if (!g._serverDoctors) {
  g._serverDoctors = [];
}
if (!g._patientsDb) {
  g._patientsDb = [];
}
if (!g._queuesDb) {
  g._queuesDb = [];
}
// Variable initialization for fallbacks
if (!g._serverServices) {
  g._serverServices = [];
}

// FIREBASE INIT
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc, runTransaction } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

let fDb: any = null;
try {
  if (firebaseConfig && firebaseConfig.projectId) {
    const firebaseApp = initializeApp(firebaseConfig as any);
    const dbId = (firebaseConfig as any).firestoreDatabaseId || "ai-studio-0d6fd32c-9664-44c9-b09f-9e98080e44ef";
    fDb = getFirestore(firebaseApp, dbId);
    console.log("🔥 Connected to Firebase Firestore", dbId);
  } else {
    console.log("Firebase config not found or missing projectId");
  }
} catch (error) {
  console.log("Firebase Init Error:", error);
}

// ASYNC DB HELPERS
async function getPatients(): Promise<Patient[]> {
  if (fDb) {
    const s = await getDocs(collection(fDb, "patients"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id } as Patient));
  }
  return g._patientsDb || [];
}
async function savePatient(p: Patient) {
  // Hash at the data layer so every caller is protected — not just the HTTP endpoints
  // that remembered to hash before calling this (the Telegram bot registration flow
  // used to call this directly with a plaintext password).
  if ((p as any).password && !isHashedPassword((p as any).password)) {
    (p as any).password = hashPassword((p as any).password);
  }
  const clean = stripUndefined(p as any);
  if (fDb) {
    // merge:true — GET /api/patients strips `password` before it reaches the client, so
    // any doctor/patient edit built by spreading that copy (very common — diagnoses,
    // visit notes, allergies, etc.) would otherwise silently wipe the patient's password.
    await setDoc(doc(fDb, "patients", p.id!), clean, { merge: true });
  } else {
    if (!g._patientsDb) g._patientsDb = [];
    const idx = g._patientsDb.findIndex((x: any) => x.id === p.id);
    if (idx >= 0) g._patientsDb[idx] = { ...g._patientsDb[idx], ...clean };
    else g._patientsDb.push(clean);
  }
}
async function deletePatient(id: string) {
  if (fDb) await deleteDoc(doc(fDb, "patients", id));
  if (g._patientsDb) g._patientsDb = g._patientsDb.filter((x: any) => x.id !== id);
}
async function getQueues(): Promise<QueueItem[]> {
  if (fDb) {
    const s = await getDocs(collection(fDb, "queues"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id } as QueueItem));
  }
  return g._queuesDb || [];
}
async function saveQueue(q: QueueItem) {
  // Firestore's setDoc rejects any field whose value is explicitly `undefined`
  // (e.g. a queue item that never had appointmentDate/appointmentTime set, then
  // gets spread into an update object) — strip those keys before writing.
  const clean: any = {};
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined) clean[k] = v;
  }
  if (fDb) {
    await setDoc(doc(fDb, "queues", q.id!), clean);
  } else {
    if (!g._queuesDb) g._queuesDb = [];
    const idx = g._queuesDb.findIndex((x: any) => x.id === q.id);
    if (idx >= 0) g._queuesDb[idx] = clean;
    else g._queuesDb.push(clean);
  }
}
async function deleteQueue(id: string) {
  if (fDb) await deleteDoc(doc(fDb, "queues", id));
  else if (g._queuesDb) g._queuesDb = g._queuesDb.filter((x: any) => x.id !== id);
}

// Draws consumables down from the warehouse when a procedure is finished, using
// the per-service recipe the doctor configured in the "Muolajalar" tab.
//
// This lives on the server, next to the other things that happen on the
// status -> completed transition (the ClinicVisit record and the daily revenue
// rollup), so that EVERY way of completing an appointment consumes stock — the
// web dashboard, the doctor's Telegram bot button, and any direct PATCH alike.
// An earlier browser-only version silently skipped the bot path entirely, which
// let stock drift upward from reality with no audit record to reconcile against.
//
// One transaction does the whole thing:
//  - creates clinics/{clinicId}/materialUsage/{queueId}, which is both the audit
//    trail and the idempotency guard, so re-completing the same appointment (or
//    two surfaces racing) cannot deduct twice;
//  - writes stock from values read inside the transaction, so two doctors
//    finishing procedures that share a material can't lose each other's update.
// Fails soft: never let a warehouse problem block completing an appointment.
async function deductMaterialsForCompletedQueue(q: any) {
  const clinicId = q?.clinicId;
  const queueId = q?.id;
  const serviceId = q?.serviceId;
  if (!fDb || !clinicId || !queueId || !serviceId) return;

  try {
    await runTransaction(fDb, async (tx: any) => {
      const usageRef = doc(fDb, `clinics/${clinicId}/materialUsage`, queueId);
      if ((await tx.get(usageRef)).exists()) return;

      const recipeSnap = await tx.get(doc(fDb, `clinics/${clinicId}/serviceMaterials`, serviceId));
      if (!recipeSnap.exists()) return;

      // Merge duplicate rows so a material listed twice is deducted once.
      const merged = new Map<string, number>();
      for (const item of (recipeSnap.data()?.items || [])) {
        if (!item?.materialId || !(Number(item.qty) > 0)) continue;
        merged.set(item.materialId, (merged.get(item.materialId) || 0) + Number(item.qty));
      }
      if (merged.size === 0) return;

      // Firestore requires every read in a transaction before any write.
      const reads = await Promise.all(
        Array.from(merged, async ([materialId, qty]) => {
          const ref = doc(fDb, `clinics/${clinicId}/materials`, materialId);
          return { materialId, qty, ref, snap: await tx.get(ref) };
        })
      );

      const applied: any[] = [];
      for (const { materialId, qty, ref, snap } of reads) {
        if (!snap.exists()) continue;
        const mat = snap.data() || {};
        const current = Number(mat.quantity) || 0;
        // Clamped at zero: negative stock would read as the warehouse owing
        // supplies rather than simply being empty.
        tx.update(ref, { quantity: Math.max(0, current - qty) });
        applied.push({ materialId, name: mat.name || materialId, qty, unit: mat.unit || '' });
      }

      tx.set(usageRef, {
        queueId,
        serviceId,
        doctorId: q?.doctorId || null,
        items: applied,
        deductedAt: new Date().toISOString(),
      });
    });
  } catch (e) {
    console.error("[Materials] deduction failed for queue", queueId, e);
  }
}
async function getClinics() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "clinics"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverClinics || [];
}
async function saveClinic(c: any) {
  const clean = stripUndefined(c);
  // merge:true — the client's copy of a clinic has sensitive fields (password) stripped
  // out for security before it ever reaches the browser, so a plain overwrite here would
  // silently erase them on any partial-field edit.
  if (fDb) await setDoc(doc(fDb, "clinics", clean.id), clean, { merge: true });
  else {
    if (!g._serverClinics) g._serverClinics = [];
    const idx = g._serverClinics.findIndex((x: any) => x.id === clean.id);
    if (idx >= 0) g._serverClinics[idx] = { ...g._serverClinics[idx], ...clean };
    else g._serverClinics.push(clean);
  }
}
async function deleteClinic(id: string) {
  if (fDb) await deleteDoc(doc(fDb, "clinics", id));
  if (g._serverClinics) g._serverClinics = g._serverClinics.filter((x:any) => x.id !== id);
}
async function getDoctors() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "doctors"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverDoctors || [];
}
async function saveDoctor(c: any) {
  const clean = stripUndefined(c);
  // merge:true — same rationale as saveClinic: the client's copy has `password` stripped
  // out of GET /api/doctors, so an overwrite would wipe it on any partial-field edit.
  if (fDb) await setDoc(doc(fDb, "doctors", clean.id), clean, { merge: true });
  else {
    if (!g._serverDoctors) g._serverDoctors = [];
    const idx = g._serverDoctors.findIndex((x: any) => x.id === clean.id);
    if (idx >= 0) g._serverDoctors[idx] = { ...g._serverDoctors[idx], ...clean };
    else g._serverDoctors.push(clean);
  }
}
async function deleteDoctor(id: string) {
  if (fDb) await deleteDoc(doc(fDb, "doctors", id));
  if (g._serverDoctors) g._serverDoctors = g._serverDoctors.filter((x:any) => x.id !== id);
}
async function getDoctorClinicLinks() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "doctorClinicLinks"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverDoctorClinicLinks || [];
}
async function saveDoctorClinicLink(c: any) {
  const clean = stripUndefined(c);
  if (fDb) await setDoc(doc(fDb, "doctorClinicLinks", clean.id), clean);
  else {
    if (!g._serverDoctorClinicLinks) g._serverDoctorClinicLinks = [];
    g._serverDoctorClinicLinks = g._serverDoctorClinicLinks.filter((x:any) => x.id !== clean.id);
    g._serverDoctorClinicLinks.push(clean);
  }
}
async function deleteDoctorClinicLink(id: string) {
  if (fDb) await deleteDoc(doc(fDb, "doctorClinicLinks", id));
  if (g._serverDoctorClinicLinks) g._serverDoctorClinicLinks = g._serverDoctorClinicLinks.filter((x:any) => x.id !== id);
}

async function getPaymentReceipts() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "paymentReceipts"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverPaymentReceipts || [];
}
async function savePaymentReceipt(c: any) {
  const clean = stripUndefined(c);
  if (fDb) await setDoc(doc(fDb, "paymentReceipts", clean.id), clean, { merge: true });
  else {
    if (!g._serverPaymentReceipts) g._serverPaymentReceipts = [];
    const idx = g._serverPaymentReceipts.findIndex((x: any) => x.id === clean.id);
    if (idx >= 0) g._serverPaymentReceipts[idx] = { ...g._serverPaymentReceipts[idx], ...clean };
    else g._serverPaymentReceipts.push(clean);
  }
}

async function getReminders() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "reminders"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverReminders || [];
}
async function saveReminder(c: any) {
  const clean = stripUndefined(c);
  if (fDb) await setDoc(doc(fDb, "reminders", clean.id), clean, { merge: true });
  else {
    if (!g._serverReminders) g._serverReminders = [];
    const idx = g._serverReminders.findIndex((x: any) => x.id === clean.id);
    if (idx >= 0) g._serverReminders[idx] = { ...g._serverReminders[idx], ...clean };
    else g._serverReminders.push(clean);
  }
}
async function deleteReminder(id: string) {
  if (fDb) await deleteDoc(doc(fDb, "reminders", id));
  if (g._serverReminders) g._serverReminders = g._serverReminders.filter((x: any) => x.id !== id);
}

async function getServices() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "services"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverServices || [];
}
async function saveService(c: any) {
  const clean = stripUndefined(c);
  if (fDb) await setDoc(doc(fDb, "services", clean.id), clean);
  else {
    if (!g._serverServices) g._serverServices = [];
    g._serverServices = g._serverServices.filter((x:any) => x.id !== clean.id);
    g._serverServices.push(clean);
  }
}
async function deleteService(id: string) {
  if (fDb) await deleteDoc(doc(fDb, "services", id));
  if (g._serverServices) g._serverServices = g._serverServices.filter((x:any) => x.id !== id);
}

async function getAds() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "ads"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverAds || [];
}
async function saveAd(a: any) {
  const clean = stripUndefined(a);
  if (fDb) await setDoc(doc(fDb, "ads", clean.id), clean, { merge: true });
  else {
    if (!g._serverAds) g._serverAds = [];
    const idx = g._serverAds.findIndex((x: any) => x.id === clean.id);
    if (idx >= 0) g._serverAds[idx] = { ...g._serverAds[idx], ...clean };
    else g._serverAds.push(clean);
  }
}
async function deleteAd(id: string) {
  if (fDb) await deleteDoc(doc(fDb, "ads", id));
  if (g._serverAds) g._serverAds = g._serverAds.filter((x: any) => x.id !== id);
}

// Persistent SuperAdmin audit trail — survives page reloads and server restarts
// (unlike the old session-only opsLogs array in SuperAdminDashboard.tsx).
async function saveAuditLogEntry(entry: { id: string; text: string; type: string; createdAt: string }) {
  if (fDb) {
    await setDoc(doc(fDb, "auditLogs", entry.id), entry);
  } else {
    if (!g._serverAuditLogs) g._serverAuditLogs = [];
    g._serverAuditLogs.unshift(entry);
    if (g._serverAuditLogs.length > 200) g._serverAuditLogs.pop();
  }
}
async function getAuditLogs() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "auditLogs"));
    const logs = s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
    logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return logs.slice(0, 100);
  }
  return (g._serverAuditLogs || []).slice(0, 100);
}
async function deleteAuditLogEntry(id: string) {
  if (fDb) {
    await deleteDoc(doc(fDb, "auditLogs", id));
  } else if (g._serverAuditLogs) {
    g._serverAuditLogs = g._serverAuditLogs.filter((x: any) => x.id !== id);
  }
}


async function getPayments() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "payments"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverPayments || [];
}
async function savePayment(c: any) {
  const clean = stripUndefined(c);
  if (fDb) await setDoc(doc(fDb, "payments", clean.id), clean);
  else {
    if (!g._serverPayments) g._serverPayments = [];
    g._serverPayments = g._serverPayments.filter((x:any) => x.id !== clean.id);
    g._serverPayments.push(clean);
  }
}
async function getReports() {
  if (fDb) {
    const s = await getDocs(collection(fDb, "reports"));
    return s.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }
  return g._serverReports || [];
}
async function saveReport(c: any) {
  const clean = stripUndefined(c);
  if (fDb) await setDoc(doc(fDb, "reports", clean.id), clean);
  else {
    if (!g._serverReports) g._serverReports = [];
    g._serverReports = g._serverReports.filter((x:any) => x.id !== clean.id);
    g._serverReports.push(clean);
  }
}
// Password hashing (scrypt, built into Node's crypto — no new dependency). New
// passwords are always hashed before storage. Legacy plaintext accounts are
// verified by direct comparison and transparently re-hashed on their next
// successful login — no big-bang migration, no risk of locking anyone out.
function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}
function isHashedPassword(stored: any): boolean {
  return typeof stored === "string" && stored.startsWith("scrypt:");
}
function verifyPassword(plain: string, stored: any): boolean {
  if (stored === undefined || stored === null || stored === "") return false;
  const storedStr = String(stored);
  if (isHashedPassword(storedStr)) {
    const parts = storedStr.split(":");
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    try {
      const check = crypto.scryptSync(plain, salt, 64).toString("hex");
      const a = Buffer.from(hash, "hex");
      const b = Buffer.from(check, "hex");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
  if (isEncryptedCredential(storedStr)) {
    const dec = decryptCredential(storedStr);
    return dec !== null && dec === plain;
  }
  // Legacy plaintext account, not yet migrated. Some legacy records were saved
  // with stray whitespace or a numeric type (e.g. from manual data entry) —
  // normalize both sides so those don't silently fail to match.
  return storedStr.trim() === String(plain).trim();
}

// Doctor/clinic login credentials are day-to-day operational passwords the SuperAdmin
// (the single trusted account owner) routinely needs to look up and hand out — unlike
// scrypt's one-way hash, they're stored with REVERSIBLE encryption (AES-256-GCM) so the
// SuperAdmin panel can always show the real current value behind a show/hide toggle,
// instead of permanently hiding it the moment it's saved. Patient and SuperAdmin-own
// passwords are unaffected and keep using the one-way scrypt hash above.
const CREDENTIALS_ENCRYPTION_KEY = crypto.scryptSync(
  process.env.CREDENTIALS_ENCRYPTION_KEY || "dstoma-default-creds-key-change-in-prod-env",
  "dstoma-creds-salt",
  32
);
function encryptCredential(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", CREDENTIALS_ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}
function isEncryptedCredential(stored: any): boolean {
  return typeof stored === "string" && stored.startsWith("enc:");
}
function decryptCredential(stored: string): string | null {
  try {
    const parts = stored.split(":");
    if (parts.length !== 4) return null;
    const [, ivHex, tagHex, dataHex] = parts;
    const decipher = crypto.createDecipheriv("aes-256-gcm", CREDENTIALS_ENCRYPTION_KEY, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

// Returns the RAW stored password value (hashed "scrypt:..." for migrated accounts,
// or plaintext for legacy/never-changed ones) — callers must use verifyPassword(),
// never compare with `===` directly.
async function getAdminCreds() {
  if (fDb) {
    try {
      const d = await getDoc(doc(fDb, "admin", "superadmin"));
      if (d.exists()) {
        const data = d.data();
        let pass = data.password;
        if (pass && typeof pass === "string" && pass.startsWith('b64:')) {
          // One-time upgrade path from the old (non-cryptographic) base64 "encoding".
          pass = Buffer.from(pass.substring(4), 'base64').toString('utf8');
        }
        return { login: data.login, password: pass };
      }
    } catch(err) {
      console.warn("Failed to get admin creds", err);
    }
  }
  return {
    login: (globalThis as any)._serverAdminLogin || process.env.ADMIN_USER || "superadmin",
    password: (globalThis as any)._serverAdminPassword || process.env.ADMIN_PASS || "demo123"
  };
}
async function saveAdminCreds(login: string, pass: string, alreadyHashed = false) {
  const stored = alreadyHashed ? pass : hashPassword(pass);
  (globalThis as any)._serverAdminLogin = login;
  (globalThis as any)._serverAdminPassword = stored;
  if (fDb) {
    try {
      await setDoc(doc(fDb, "admin", "superadmin"), { login, password: stored });
    } catch (e) {
      console.error(e);
    }
  }
}

// Dynamic variables to hold active Telegram Bot Tokens in memory for cross-client synchrony
let activeTelegramToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
let activeDoctorBotToken = process.env.DOCTOR_BOT_TOKEN || "";

async function loadTelegramCreds() {
  if (fDb) {
    try {
      const d = await getDoc(doc(fDb, "admin", "telegram"));
      if (d.exists()) {
        const data = d.data();
        if (data.token) activeTelegramToken = data.token;
        if (data.doctorToken) activeDoctorBotToken = data.doctorToken;
      }
    } catch(err) {
      console.warn("Failed to get telegram config", err);
    }
  }
}

async function saveTelegramCreds(token: string, doctorToken: string) {
  if (fDb) {
    try {
      await setDoc(doc(fDb, "admin", "telegram"), { token, doctorToken }, { merge: true });
    } catch(err) {
      console.error(err);
    }
  }
}

// Superadmin-only: these are live bot control tokens (whoever has them can send
// messages as the bot to every patient/doctor). Never expose them publicly.
app.get("/api/telegram-config", requireSuperAdmin, async (req, res) => {
  await loadTelegramCreds();
  res.json({ token: activeTelegramToken, doctorToken: activeDoctorBotToken });
});

const gAdmin = globalThis as any;
if (!gAdmin.superadminLogin) gAdmin.superadminLogin = process.env.ADMIN_USER || "superadmin";
if (!gAdmin.superadminPassword) gAdmin.superadminPassword = process.env.ADMIN_PASS || "demo123";

// POST endpoint for secure superadmin login to prevent plain text password on client-side
app.post("/api/admin-login", rateLimiter(5, 60 * 1000), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "Username and password are required" });
  }
  const creds = await getAdminCreds();
  if (username.toLowerCase() === creds.login.toLowerCase() && verifyPassword(password, creds.password)) {
    if (!isHashedPassword(creds.password)) {
      // Transparent one-time migration: this account just proved it knows the
      // password, so it's safe to upgrade its storage to a real hash now.
      await saveAdminCreds(creds.login, hashPassword(password), true);
    }
    const token = crypto.randomBytes(32).toString("hex");
    await saveSuperAdminSession(token, Date.now() + SUPERADMIN_SESSION_TTL_MS);
    return res.json({ ok: true, name: "SuperAdmin", token });
  }
  return res.status(401).json({ ok: false, error: "Incorrect credentials" });
});

// POST endpoint to update admin credentials dynamically
app.post("/api/admin-update-creds", rateLimiter(3, 60 * 1000), requireSuperAdmin, async (req, res) => {
  const { currentPassword, newLogin, newPassword } = req.body;
  const creds = await getAdminCreds();
  if (!currentPassword || !verifyPassword(currentPassword, creds.password)) {
    return res.status(401).json({ ok: false, error: "Joriy parol noto'g'ri (Current password incorrect)" });
  }
  if (newLogin && newLogin.trim() && newPassword && newPassword.trim()) {
    await saveAdminCreds(newLogin.trim(), newPassword.trim());
    return res.json({ ok: true });
  }
  return res.status(400).json({ ok: false, error: "Invalid login or password" });
});

// POST endpoint for secure director (clinic owner) login — verifies against real clinic
// records server-side so the client never needs to receive the full clinics list with
// plaintext passwords just to compare them locally.
app.post("/api/director-login", rateLimiter(5, 60 * 1000), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "Login va parol talab qilinadi" });
  }
  const allClinics = await getClinics();
  const matched = allClinics.find((c: any) => c && c.login && c.login.toLowerCase() === String(username).toLowerCase() && verifyPassword(password, c.password));
  if (!matched) {
    return res.status(401).json({ ok: false, error: "Login yoki parol noto'g'ri" });
  }
  if (!isHashedPassword(matched.password) && !isEncryptedCredential(matched.password)) {
    await saveClinic({ id: matched.id, password: encryptCredential(password) });
  }
  const { password: _pw, ...safeClinic } = matched;
  const token = crypto.randomBytes(32).toString("hex");
  await saveStaffSession(token, { role: 'director', clinicId: matched.id, expiresAt: Date.now() + STAFF_SESSION_TTL_MS });
  return res.json({ ok: true, clinic: safeClinic, token });
});

// POST endpoint for secure doctor login — same rationale as /api/director-login.
app.post("/api/doctor-login", rateLimiter(5, 60 * 1000), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "Login va parol talab qilinadi" });
  }
  const allDoctors = await getDoctors();
  const matched = allDoctors.find((d: any) => d && d.login && d.login.toLowerCase() === String(username).toLowerCase() && verifyPassword(password, d.password));
  if (!matched) {
    return res.status(401).json({ ok: false, error: "Login yoki parol noto'g'ri" });
  }
  if (!isHashedPassword(matched.password) && !isEncryptedCredential(matched.password)) {
    await saveDoctor({ id: matched.id, password: encryptCredential(password) } as any);
  }
  const { password: _pw, ...safeDoctor } = matched;
  const token = crypto.randomBytes(32).toString("hex");
  await saveStaffSession(token, { role: 'doctor', clinicId: matched.clinicId, doctorId: matched.id, expiresAt: Date.now() + STAFF_SESSION_TTL_MS });
  return res.json({ ok: true, doctor: safeDoctor, token });
});

// POST endpoint for secure patient login (passport serial + password) — same rationale.
app.post("/api/patient-login", rateLimiter(10, 60 * 1000), async (req, res) => {
  const { passportSerial, password } = req.body;
  if (!passportSerial || !password) {
    return res.status(400).json({ ok: false, error: "Pasport seriyasi va parol talab qilinadi" });
  }
  const cleanedPassport = String(passportSerial).replace(/\s+/g, "").toUpperCase();
  const allPatients = await getPatients();
  const matched = allPatients.find((p: any) => p && p.passportSerial && p.passportSerial.replace(/\s+/g, "").toUpperCase() === cleanedPassport && verifyPassword(password, p.password));
  if (!matched) {
    return res.status(401).json({ ok: false, error: "Pasport seriyasi yoki parol noto'g'ri" });
  }
  if (!isHashedPassword(matched.password)) {
    await savePatient({ id: matched.id, password: hashPassword(password) } as any);
  }
  const { password: _pw, ...safePatient } = matched;
  const token = crypto.randomBytes(32).toString("hex");
  await savePatientSession(token, { patientId: matched.id!, expiresAt: Date.now() + STAFF_SESSION_TTL_MS });
  return res.json({ ok: true, patient: safePatient, token });
});

// Superadmin-only: full clinic/doctor records INCLUDING credentials, for the SuperAdmin
// panel's "view/copy login details" feature. The public /api/clinics and /api/doctors
// below deliberately omit passwords.
app.get("/api/admin/credentials", requireSuperAdmin, async (req, res) => {
  const [allClinics, allDoctors] = await Promise.all([getClinics(), getDoctors()]);
  // Reversibly-encrypted passwords are decrypted here so the SuperAdmin panel can show
  // the real current value (behind its own show/hide toggle). A leftover one-way
  // scrypt hash (from before this account's password was last reset) can't be
  // recovered — it's passed through as-is and the panel shows it as hidden.
  const revealed = (list: any[]) => list.map((item) => {
    if (item.password && isEncryptedCredential(item.password)) {
      const dec = decryptCredential(item.password);
      if (dec !== null) return { ...item, password: dec };
    }
    return item;
  });
  res.json({ clinics: revealed(allClinics), doctors: revealed(allDoctors) });
});

// One-time migration: primaryDoctorId is now kept in sync automatically on every
// new queue booking (see POST /api/queues), but patients registered before that
// existed have no primaryDoctorId (or a stale one) — this backfills each patient
// to the doctor of their most recent queue, so doctor-scoped patient lists aren't
// empty for existing data. Idempotent — safe to re-run.
app.post("/api/admin/backfill-primary-doctor", requireSuperAdmin, async (req, res) => {
  const [allPatients, allQueues] = await Promise.all([getPatients(), getQueues()]);
  const normPhone = (p?: string) => (p || "").replace(/\D/g, "");

  const latestQueueByPhone = new Map<string, any>();
  allQueues.forEach((q: any) => {
    const phone = normPhone(q.patientPhone);
    if (!phone) return;
    const existing = latestQueueByPhone.get(phone);
    if (!existing || new Date(q.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      latestQueueByPhone.set(phone, q);
    }
  });

  let updated = 0;
  for (const p of allPatients as any[]) {
    const latestQueue = latestQueueByPhone.get(normPhone(p.phone));
    if (latestQueue && latestQueue.doctorId && p.primaryDoctorId !== latestQueue.doctorId) {
      await savePatient({ id: p.id, primaryDoctorId: latestQueue.doctorId } as Patient);
      updated++;
    }
  }

  res.json({ ok: true, totalPatients: allPatients.length, updated });
});

// One-time cleanup: removes a fixed, hand-verified list of queue/patient records
// created during this app's own development/testing (e.g. "SYNC BOOKING TEST",
// "Bot Test Patient") — identified by exact id, never by name pattern, so this
// can never accidentally match a real patient. Idempotent — already-deleted ids
// are silently skipped.
const KNOWN_TEST_QUEUE_IDS = [
  "q_3lu4ajk1d", // SYNC BOOKING TEST
  "q_3z9ritwbk", // Combined Test Patient
  "q_8914mab8q", // Booking Test Patient
  "q_bottest_28jb21", // Bot Test Patient
  "q_jop2l7etn", // fdtrttry
];
const KNOWN_TEST_PATIENT_IDS = [
  "pat_3hg3o", // Combined Test Patient
  "pat_k2aoe", // SYNC BOOKING TEST
];

app.post("/api/admin/cleanup-test-data", requireSuperAdmin, async (req, res) => {
  const [allQueues, allPatients] = await Promise.all([getQueues(), getPatients()]);
  const existingQueueIds = new Set(allQueues.map((q: any) => q.id));
  const existingPatientIds = new Set(allPatients.map((p: any) => p.id));

  let deletedQueues = 0;
  for (const id of KNOWN_TEST_QUEUE_IDS) {
    if (existingQueueIds.has(id)) {
      await deleteQueue(id);
      deletedQueues++;
    }
  }

  let deletedPatients = 0;
  for (const id of KNOWN_TEST_PATIENT_IDS) {
    if (existingPatientIds.has(id)) {
      await deletePatient(id);
      deletedPatients++;
    }
  }

  res.json({ ok: true, deletedQueues, deletedPatients });
});

// Superadmin-only: log into any Director or Doctor panel WITHOUT needing that
// account's own password — the superadmin's own token already proves who they are.
// Never accepts a patient's own password here; identity is entirely established by
// the (already-verified) superadmin session, not by anything in the request body.
app.post("/api/admin-impersonate", requireSuperAdmin, async (req, res) => {
  const { role, id } = req.body;
  if (role === 'director') {
    const clinics = await getClinics();
    const clinic: any = clinics.find((c: any) => c.id === id);
    if (!clinic) return res.status(404).json({ ok: false, error: "Klinika topilmadi" });
    const { password, ...safeClinic } = clinic;
    const token = crypto.randomBytes(32).toString("hex");
    await saveStaffSession(token, { role: 'director', clinicId: clinic.id, expiresAt: Date.now() + STAFF_SESSION_TTL_MS });
    return res.json({ ok: true, clinic: safeClinic, token });
  }
  if (role === 'doctor') {
    const doctors = await getDoctors();
    const doctor: any = doctors.find((d: any) => d.id === id);
    if (!doctor) return res.status(404).json({ ok: false, error: "Shifokor topilmadi" });
    const { password, ...safeDoctor } = doctor;
    const token = crypto.randomBytes(32).toString("hex");
    await saveStaffSession(token, { role: 'doctor', clinicId: doctor.clinicId, doctorId: doctor.id, expiresAt: Date.now() + STAFF_SESSION_TTL_MS });
    return res.json({ ok: true, doctor: safeDoctor, token });
  }
  return res.status(400).json({ ok: false, error: "Noto'g'ri rol" });
});

// POST to update the active Telegram Bot Token dynamically across all doctor & patient devices
app.post("/api/telegram-config", rateLimiter(3, 60 * 1000), requireSuperAdmin, async (req, res) => {
  const { token, doctorToken } = req.body;
  if ((token && token.trim()) || (doctorToken && doctorToken.trim())) {
    if (token && token.trim()) activeTelegramToken = token.trim();
    if (doctorToken && doctorToken.trim()) activeDoctorBotToken = doctorToken.trim();
    await saveTelegramCreds(activeTelegramToken, activeDoctorBotToken);
    console.log(`[DStoma Server] Dynamically updated active Telegram Bot Token(s).`);
    res.json({ ok: true, message: "Server token(s) updated successfully." });
  } else {
    res.status(400).json({ ok: false, error: "At least one token is required." });
  }
});

// Lets a doctor send a one-off Telegram message to their Telegram-linked patients
// without the bot token ever reaching the browser (see src/services/telegram.ts —
// the old client-side path that fetched the token into localStorage was removed).
app.post("/api/telegram/bulk-message", rateLimiter(5, 60 * 1000), async (req, res) => {
  const { chatIds, text } = req.body;
  if (!Array.isArray(chatIds) || chatIds.length === 0 || !text || !String(text).trim()) {
    return res.status(400).json({ ok: false, error: "chatIds va text talab qilinadi" });
  }
  const token = activeTelegramToken;
  if (!token) return res.status(400).json({ ok: false, error: "Telegram bot tokeni sozlanmagan" });

  let sent = 0;
  for (const chatId of chatIds) {
    try {
      const result = await tgApi(token, 'sendMessage', { chat_id: chatId, text: sanitizeString(String(text)) });
      if (result && result.ok) sent++;
    } catch (e) {
      console.warn(`[Bulk Telegram] Failed to send to ${chatId}:`, e);
    }
  }
  res.json({ ok: true, sent, total: chatIds.length });
});

// Live memory logs for diagnosing Telegram webhook delivery within the SuperAdmin dashboard
const webhookDebugLogs: any[] = [];

app.get("/api/telegram-debug-logs", requireSuperAdmin, (req, res) => {
  res.json({ logs: webhookDebugLogs });
});

// Telegram Webhook receiver endpoint for serverless architectures (like Vercel)
app.post("/api/telegram-webhook", async (req, res) => {
  const logEntry: any = {
    timestamp: new Date().toISOString(),
    query: req.query,
    url: req.url,
    headers: {
      host: req.headers.host,
      "user-agent": req.headers["user-agent"],
      "x-forwarded-proto": req.headers["x-forwarded-proto"]
    },
    body: null,
    success: false,
    error: null,
    tokenProcessed: null
  };
  
  // Keep logs at a reasonable size of 50 records
  webhookDebugLogs.unshift(logEntry);
  if (webhookDebugLogs.length > 50) {
    webhookDebugLogs.pop();
  }

  try {
    // Capture domain dynamically to keep our web_app links aligned with active deployments
    const host = req.headers.host;
    if (host) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      lastActiveDomain = `${protocol}://${host}`;
    }

    // Fail-safe manual token extraction from URL search parameters if Express req.query is unavailable
    let queryToken = req.query.token as string;
    if (!queryToken && req.url) {
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        queryToken = urlObj.searchParams.get('token') || '';
      } catch (urlErr) {
        // Safe to ignore
      }
    }

    const rawToken = queryToken || activeTelegramToken;
    if (!rawToken) {
      logEntry.error = "Token was absent";
      return res.status(500).json({ error: "Telegram bot token is not configured on the server." });
    }
    const token = rawToken.trim();

    // Reject spoofed webhook calls: only accept updates whose token query param
    // matches one of the two real, currently-configured bot tokens. Without this,
    // anyone could POST a fake "Telegram update" body and have it processed as if
    // it came from a real patient/doctor chat (fake registrations, AI cost abuse).
    if (token !== activeTelegramToken && token !== activeDoctorBotToken) {
      logEntry.error = "Token did not match a configured bot";
      return res.status(401).json({ error: "Invalid webhook token." });
    }
    logEntry.tokenProcessed = token.slice(0, 10) + "...";

    // Fail-safe request body decoder (reads raw stream chunks if body parsing was bypassed or delayed in Vercel)
    let update = req.body;
    if (!update || Object.keys(update).length === 0) {
      try {
        const buffers: Buffer[] = [];
        for await (const chunk of req) {
          buffers.push(chunk as Buffer);
        }
        const data = Buffer.concat(buffers).toString();
        if (data) {
          update = JSON.parse(data);
        }
      } catch (streamErr: any) {
        console.error("[Webhook Fallback Stream Parser Error]:", streamErr);
        logEntry.error = `Stream parsing failed: ${streamErr.message}`;
      }
    }

    // Further fail-safe in case body is parsed as string
    if (update && typeof update === 'string') {
      try {
        update = JSON.parse(update);
      } catch (err: any) {
        console.error("[Webhook String Body Parser Error]:", err);
        logEntry.error = `JSON string format invalid: ${err.message}`;
      }
    }

    logEntry.body = update;

    if (update && (update.message || update.callback_query)) {
      await handleTelegramUpdate(token, update);
      logEntry.success = true;
    } else {
      logEntry.error = "Update package has no valid .message or .callback_query elements";
    }
    
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram Webhook Error]:", err);
    logEntry.error = err.message || String(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Setup Telegram webhook dynamically for serverless architectures (like Vercel)
// Superadmin-only: this endpoint OVERWRITES the live bot token in server memory
// from a bare query param — an unauthenticated caller could otherwise hijack or
// break the bot integration with a single GET request.
app.get("/api/telegram-webhook-setup", requireSuperAdmin, async (req, res) => {
  try {
    const queryToken = req.query.token as string;
    const rawToken = queryToken || activeTelegramToken;
    if (!rawToken) {
      return res.status(400).json({ 
        ok: false, 
        error: "Telegram bot token is not configured in environment variables or query params. Please supply a token or set Vercel env." 
      });
    }
    const token = rawToken.trim();
    activeTelegramToken = token; // Synchronize setWebhook token to live memory state

    // Determine domain from query or host header
    let domainVal = req.query.domain as string;
    if (!domainVal) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      domainVal = `${protocol}://${host}`;
    }

    // Remove trailing slash
    if (domainVal.endsWith('/')) {
      domainVal = domainVal.slice(0, -1);
    }

    lastActiveDomain = domainVal;

    // Dynamically append the token as a query parameter so when Telegram executes POST webhook updates, we know exactly what bot token it belongs to!
    const webhookUrl = `${domainVal}/api/telegram-webhook?token=${encodeURIComponent(token)}`;
    console.log(`[Telegram Webhook Setup] Directing Telegram to webhook URL: ${webhookUrl}`);

    // Call Telegram setWebhook
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const tgData = await tgRes.json();

    if (tgData.ok) {
      return res.json({
        ok: true,
        message: "Webhook successfully verified & set with Telegram!",
        webhook_url: webhookUrl,
        telegram_response: tgData
      });
    } else {
      return res.status(400).json({
        ok: false,
        error: tgData.description || "Telegram declined setting Webhook.",
        telegram_response: tgData
      });
    }
  } catch (err: any) {
    console.error("[Telegram Setup Error]:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Centralized API Routes for patients and queues
app.get("/api/patients", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  const allPatients = await getPatients();
  // Never ship passwords in the bulk list — /api/patient-login verifies credentials
  // server-side and returns the one matching record (with password) after auth.
  res.json(allPatients.map((p: any) => { const { password, ...safe } = p; return safe; }));
});

// Cross-clinic lookup: find a patient's global record by phone or passport, regardless
// of which clinic they originally registered at. Used for portable medical history.
app.get("/api/patients/search", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  const phoneQuery = String(req.query.phone || "").replace(/\D/g, "");
  const passportQuery = String(req.query.passport || "").replace(/\s+/g, "").toUpperCase();
  if (!phoneQuery && !passportQuery) {
    return res.status(400).json({ error: "phone or passport query parameter is required." });
  }
  const allPatients = await getPatients();
  const results = allPatients.filter((p: any) => {
    const pPhone = String(p.phone || "").replace(/\D/g, "");
    const pSerial = String(p.passportSerial || "").replace(/\s+/g, "").toUpperCase();
    return (phoneQuery && pPhone && pPhone === phoneQuery) || (passportQuery && pSerial && pSerial === passportQuery);
  });
  res.json(results.map((p: any) => { const { password, ...safe } = p; return safe; }));
});

app.get("/api/payments", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(await getPayments());
});
app.post("/api/payments", rateLimiter(30, 60 * 1000), async (req, res) => {
  const p = req.body;
  await savePayment(p);
  res.status(201).json(p);
});

app.get("/api/reports", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(await getReports());
});
app.post("/api/reports", rateLimiter(30, 60 * 1000), async (req, res) => {
  const r = req.body;
  await saveReport(r);
  res.status(201).json(r);
});

app.post("/api/patients", rateLimiter(30, 60 * 1000), async (req, res) => {
  const newPatient = { ...req.body };
  if (!newPatient.id) {
    newPatient.id = 'pat_' + Math.random().toString(36).substr(2, 5);
  }
  
  // Sanitize values to immunize against Cross-Site Scripting (XSS)
  if (newPatient.fullName) newPatient.fullName = sanitizeString(newPatient.fullName);
  if (newPatient.phone) newPatient.phone = sanitizeString(newPatient.phone);
  if (newPatient.passportSerial) newPatient.passportSerial = sanitizeString(newPatient.passportSerial);
  if (newPatient.allergies) newPatient.allergies = sanitizeString(newPatient.allergies);
  if (newPatient.chronicDiseases) newPatient.chronicDiseases = sanitizeString(newPatient.chronicDiseases);
  if (newPatient.bloodGroup) newPatient.bloodGroup = sanitizeString(newPatient.bloodGroup);
  
  const serialClean = (newPatient.passportSerial || '').replace(/\s+/g, '').toUpperCase();

  if (newPatient.password && !isHashedPassword(newPatient.password)) {
    newPatient.password = hashPassword(newPatient.password);
  }

  const patDb = await getPatients();
  // Match on id too, not just passport/telegram. savePatient() merges by id, so a
  // body carrying a known id was already editing that record — it just wasn't
  // being recognised as an edit, which is what let anyone rewrite any patient.
  const existingIdx = patDb.findIndex(p => {
    const existingSerial = (p.passportSerial || '').replace(/\s+/g, '').toUpperCase();
    return (newPatient.id && p.id === newPatient.id) ||
           (existingSerial && existingSerial === serialClean) ||
           (newPatient.telegramChatId && String(p.telegramChatId) === String(newPatient.telegramChatId));
  });

  // Creating a brand-new record stays open — patients self-register here (public
  // site and Telegram bot) before they have any credentials to present. Editing
  // a record that already exists is what has to be proven.
  if (existingIdx !== -1) {
    const existing: any = patDb[existingIdx];
    const auth = await getAuthContext(req);
    const isStaffForClinic = auth.staff && auth.staff.clinicId === existing.clinicId;
    const selfOrManaged = auth.patient && (
      // their own record
      auth.patient.patientId === existing.id ||
      // a family member they already manage
      existing.managedBy === auth.patient.patientId ||
      // claiming someone as a family member (the family-cabinet link flow)
      newPatient.managedBy === auth.patient.patientId
    );
    if (!auth.isSuperAdmin && !isStaffForClinic && !selfOrManaged) {
      return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
    }
  }

  if (existingIdx === -1) {
    await savePatient(newPatient);
  } else {
    await savePatient({ ...patDb[existingIdx], ...newPatient });
  }
  const { password: _pw, ...safeNewPatient } = newPatient;
  res.status(201).json(safeNewPatient);
});

app.get("/api/queues", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(await getQueues());
});

app.post("/api/queues", rateLimiter(20, 60 * 1000), async (req, res) => {
  try {
    const q = req.body;
    const clinicId = sanitizeString(q.clinic_id || q.clinicId || 'samarqand');
  const doctorId = sanitizeString(q.doctor_id || q.doctorId || 'doc_sm_1');
  // No fallback service id on purpose. The old 'srv_sm_1' default silently
  // labelled every self-booked appointment (the patient wizard only collects
  // clinic + doctor) as one specific procedure — which now also decides which
  // consumables get deducted from the warehouse, so a wrong guess quietly
  // drains the wrong materials. Empty means "not chosen yet", and the
  // deduction skips it rather than consuming something arbitrary.
  const serviceId = sanitizeString(q.service_id || q.serviceId || '');
  const patientName = sanitizeString(q.patient_name || q.patientName || 'Mehmon');
  const patientPhone = sanitizeString(q.patient_phone || q.patientPhone || '');
  const telegramChatId = q.telegram_chat_id || q.telegramChatId || null;
  const hasInfection = q.has_infection ?? q.hasInfection ?? false;
  const medicalNotes = sanitizeString(q.medical_notes ?? q.medicalNotes ?? '');
  const passportSerial = sanitizeString(q.passport_serial ?? q.passportSerial ?? '');
  const appointmentDate = sanitizeString(q.appointment_date ?? q.appointmentDate ?? '');
  const appointmentTime = sanitizeString(q.appointment_time ?? q.appointmentTime ?? '');

  const qDb = await getQueues();
  const ticketNo = qDb.filter(item => item.clinicId === clinicId).length + 104;

  const newQueueItem: any = {
    id: q.id || 'q_' + Math.random().toString(36).substr(2, 9),
    clinicId,
    patientName,
    patientPhone,
    doctorId,
    serviceId,
    number: ticketNo,
    status: q.status || 'pending',
    createdAt: new Date().toISOString(),
    hasInfection,
    medicalNotes,
    passportSerial
  };

  // A doctor booking a patient directly for a specific future date/time (rather
  // than the walk-in "take a ticket now" flow) creates the queue as already
  // 'scheduled' with these set — previously only the PATCH /api/queues/:id path
  // (rescheduling an existing ticket) could set these fields.
  if (appointmentDate) newQueueItem.appointmentDate = appointmentDate;
  if (appointmentTime) newQueueItem.appointmentTime = appointmentTime;

  if (telegramChatId) {
    newQueueItem.telegramChatId = telegramChatId;
  }
  if (q.complaint) {
    newQueueItem.complaint = sanitizeString(q.complaint);
  }

  await saveQueue(newQueueItem as QueueItem);

  // A patient's "treating doctor" (primaryDoctorId) tracks whoever they most
  // recently booked a queue with, so it stays accurate as a patient switches
  // doctors over time — this is also what scopes each doctor's "Bemorlar" list.
  // Matched by normalized phone within the same clinic; silently a no-op for a
  // guest/unregistered phone (never creates a patient here, that's not this
  // endpoint's job). Awaited (not fire-and-forget) — on Vercel, execution can be
  // frozen the instant the response is sent, and this write must not be lost.
  if (patientPhone) {
    try {
      const normalizedPhone = patientPhone.replace(/\D/g, "");
      const allPatients = await getPatients();
      const matchedPatient = allPatients.find(
        (p: any) => p.clinicId === clinicId && (p.phone || "").replace(/\D/g, "") === normalizedPhone
      );
      if (matchedPatient && matchedPatient.primaryDoctorId !== doctorId) {
        await savePatient({ id: matchedPatient.id, primaryDoctorId: doctorId } as Patient);
      }
    } catch (e) {
      console.error("[Queue Create] primaryDoctorId update failed:", e);
    }
  }

  // Confirm the new ticket to the patient over Telegram (server-side — the bot
  // token never has to leave the server or touch the browser).
  if (telegramChatId) {
    (async () => {
      try {
        const [srvDb, docDb, clinicsDb] = await Promise.all([getServices(), getDoctors(), getClinics()]);
        const srvObj = srvDb.find((s: any) => s.id === serviceId);
        const doctorObj = docDb.find((d: any) => d.id === doctorId);
        const clinicObj = clinicsDb.find((c: any) => c.id === clinicId);
        const text = `🏥 *DStoma Navbat Tizimi*\n\n` +
          `🤖 Hurmatli *${patientName}*, siz muvaffaqiyatli navbat oldingiz!\n\n` +
          `📍 *Filial:* ${clinicObj ? clinicObj.name : clinicId}\n` +
          `🎫 *Sizning chiptangiz:* #${ticketNo}\n` +
          `👨‍⚕ *Shifokor:* ${doctorObj ? doctorObj.name : 'Belgilanmagan'}\n` +
          `💼 *Xizmat turi:* ${srvObj ? srvObj.name : 'Ko\'rik'}\n\n` +
          `_Sizga navbatingiz yaqinlashganda qo'shimcha xabar jo'natiladi. Salomat bo'ling!_`;
        await sendBgTelegramMessage(telegramChatId, text, clinicId);
      } catch (e) {
        console.error("[Queue Create Notify Warn]", e);
      }
    })();
  }

  // Send active notification to assigned doctor if linked on Telegram
  const docChatId = g._doctorTelegramChats?.[doctorId];
  if (docChatId) {
    const textMsg = `🔔 *YANGI BEMOR NAVBATGA YOZILDI!* 🔔\n\n` +
      `🎫 *Chipta raqami:* #${ticketNo}\n` +
      `👤 *Bemor:* ${patientName}\n` +
      `📞 *Telefon:* \`${patientPhone}\`\n` +
      (medicalNotes ? `📝 *Izoh:* _${medicalNotes}_\n` : '') +
      `⏳ *Holati:* Navbatda kutmoqda`;
    
    sendDoctorDashboard(activeDoctorBotToken, Number(docChatId), doctorId, textMsg).catch(e => {
      console.error("[Doctor Notify Warn]", e);
    });
  }

  const responseData = {
    ...newQueueItem,
    clinic_id: clinicId,
    doctor_id: doctorId,
    service_id: serviceId,
    patient_name: patientName,
    patient_phone: patientPhone,
    telegram_chat_id: telegramChatId,
    has_infection: hasInfection,
    medical_notes: medicalNotes,
    passport_serial: passportSerial
  };
  res.status(201).json(responseData);
  } catch (e: any) {
    console.error("[Queue Create Error]", e);
    res.status(500).json({ error: e.message || "Failed to create queue" });
  }
});

app.patch("/api/queues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    let updatedItem: QueueItem | null = null;

    const qDb = await getQueues();
    const itemMatch = qDb.find(q => q.id === id);

    if (itemMatch) {
      // Patients cancel their own ticket anonymously (no login exists for patients
      // at the API level yet); every other change — calling/completed status,
      // rescheduling, medical notes — is a clinic-staff action and requires an
      // authorized director/doctor session for this queue's clinic.
      const isPatientSelfCancel = updateFields.status === 'cancelled' &&
        updateFields.service_id === undefined && updateFields.appointmentDate === undefined &&
        updateFields.appointmentTime === undefined && updateFields.medical_notes === undefined;
      if (!isPatientSelfCancel && !(await isAuthorizedForClinic(req, itemMatch.clinicId, true))) {
        return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
      }
      updatedItem = {
        ...itemMatch,
        status: updateFields.status !== undefined ? updateFields.status : itemMatch.status,
        serviceId: updateFields.service_id !== undefined ? updateFields.service_id : itemMatch.serviceId,
        appointmentDate: updateFields.appointmentDate !== undefined ? updateFields.appointmentDate : itemMatch.appointmentDate,
        appointmentTime: updateFields.appointmentTime !== undefined ? updateFields.appointmentTime : itemMatch.appointmentTime,
        ...(updateFields.medical_notes !== undefined ? { medicalNotes: sanitizeString(updateFields.medical_notes) } : {})
      };
      await saveQueue(updatedItem);
      
      const item = updatedItem as QueueItem;
      // Memory sync as requested by user
      if (typeof (globalThis as any)._queuesDb !== 'undefined') {
        const _qDb = (globalThis as any)._queuesDb;
        const _idx = _qDb.findIndex((x: any) => x.id === item.id);
        if (_idx >= 0) _qDb[_idx] = item;
      }
      // Notify doctor
      const docChatId = g._doctorTelegramChats?.[item.doctorId];
      if (docChatId) {
        const statusLabel = item.status === 'calling' ? 'qabulxonaga chaqirildi 🟢' : (item.status === 'completed' ? 'tamomlandi ✅' : (item.status === 'cancelled' ? 'bekor qilindi ❌' : 'navbatda turibdi ⏳'));
        sendDoctorTelegramMessage(docChatId, `ℹ️ *Tizim yangilanishi:* #${item.number} - ${item.patientName} navbat holati *${statusLabel}* ga o'zgartirildi.`).catch(e => {
          console.error(`[Telegram] Doctor notification failed:`, e.message);
        });
      }
      
      // Notify patient
      let finalTgChatId = item.telegramChatId;
      let patientObj: Patient | null = null;
      if (item.passportSerial) {
         try {
           const patDb = await getPatients();
           const pat = patDb.find((p: any) => p.passportSerial === item.passportSerial);
           if (pat) {
             patientObj = pat;
             if (pat.telegramChatId) finalTgChatId = pat.telegramChatId;
           }
         } catch(e) {}
      } else if (item.telegramChatId) {
         try {
           const patDb = await getPatients();
           const pat = patDb.find((p: any) => p.telegramChatId === item.telegramChatId);
           if (pat) {
             patientObj = pat;
           }
         } catch(e) {}
      }

      // Deliberately not inside the `patientObj &&` branch below: consumables are
      // spent on the procedure whether or not the queue ticket could be matched
      // back to a registered patient record.
      if (item.status === 'completed' && itemMatch.status !== 'completed') {
        await deductMaterialsForCompletedQueue(item);
      }

      if (patientObj && item.status === 'completed' && itemMatch.status !== 'completed') {
        const srvDb = await getServices();
        const docDb = await getDoctors();
        const srvObj = srvDb.find((s: any) => s.id === (item.serviceId || ''));
        const doctorObj = docDb.find((d: any) => d.id === item.doctorId);
        
        const visit: ClinicVisit = stripUndefined({
          id: 'v_' + Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          doctorId: item.doctorId,
          doctorName: doctorObj ? doctorObj.name : 'Shifokor',
          serviceId: item.serviceId || '',
          serviceName: srvObj ? srvObj.name : 'Tibbiy xizmat',
          complaint: item.complaint,
          medicalNotes: item.medicalNotes,
          price: srvObj ? srvObj.price : 0
        });
        
        const updatedPat = { 
          ...patientObj, 
          clinicVisits: [...(patientObj.clinicVisits || []), visit] 
        };
        await savePatient(updatedPat);
      }

      if (finalTgChatId) {
        if (item.status === 'scheduled') {
          sendBgTelegramMessage(finalTgChatId, `📅 *Qabul vaqti belgilandi!* \n\nAssalomu alaykum, *${item.patientName}*!\nSizning navbatingiz shifokor tomonidan qabul qilindi.\n\n🕒 *Kuni:* ${item.appointmentDate || 'Tez orada'}\n⏰ *Vaqti:* ${item.appointmentTime || '--:--'}\n🎫 Chiptangiz: *#${item.number}*\n\nBelgilangan vaqtda klinikada bo'lishingizni so'raymiz.`, item.clinicId).catch(e => { console.error(`[Telegram] Patient notification failed:`, e.message); });
        } else if (item.status === 'calling') {
          sendBgTelegramMessage(finalTgChatId, `🔔 *CHIPTANGIZ KELDI!* 🔔\n\nAssalomu alaykum! Sizni shifokor hozir kabinetda kutmoqda. Kechikmasdan kirishingiz so'raladi. 🦷\n🎫 Chiptangiz: *#${item.number}*`, item.clinicId).catch(e => { console.error(`[Telegram] Patient notification failed:`, e.message); });
        } else if (item.status === 'completed') {
          sendBgTelegramMessage(finalTgChatId, `✅ *Rahmat!* \n\nShifokor ko'rigi muvaffaqiyatli yakunlandi. Salomat bo'ling! Iltimos, shaxsiy kabinetingizda shifokorga baho bering. ⭐`, item.clinicId).catch(e => { console.error(`[Telegram] Patient notification failed:`, e.message); });
        } else if (item.status === 'cancelled') {
          sendBgTelegramMessage(finalTgChatId, `❌ *Diqqat!* \n\nSizning *#${item.number}* sonli navbatingiz bekor qilindi.`, item.clinicId).catch(e => { console.error(`[Telegram] Patient notification failed:`, e.message); });
        }
      }

      // Generate daily report snapshot
      if (item.status === 'completed' || item.status === 'cancelled') {
        try {
          const dStr = new Date().toISOString().split('T')[0];
          const repId = `rep_${item.clinicId}_${dStr}`;
          
          let updatedQDb = qDb;
          const uIdx = updatedQDb.findIndex(q => q.id === item.id);
          if (uIdx >= 0) updatedQDb[uIdx] = item;
          else updatedQDb.push(item);
          
          const allQ = updatedQDb.filter(q => q.clinicId === item.clinicId && q.createdAt?.startsWith(dStr));
          const srvDocs = await getServices();
          let income = 0;
          let cCount = 0;
          
          allQ.forEach(q => {
            if (q.status === 'completed') {
              cCount++;
              const s = srvDocs.find((x: any) => x.id === q.serviceId);
              if (s) income += (s.price || 0);
            }
          });
          
          await saveReport({
             id: repId,
             clinicId: item.clinicId,
             date: dStr,
             totalQueues: allQ.length,
             completedQueues: cCount,
             totalRevenue: income
          });
        } catch(repErr) {
          console.error("Failed to generate report snapshot", repErr);
        }
      }

      res.json(updatedItem);
    } else {
      res.status(404).json({ error: "Queue not found" });
    }
  } catch (error: any) {
    console.error("[API Edit Queue] Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/queues/:id", async (req, res) => {
  const id = req.params.id;
  const existing: any = (await getQueues()).find((q: any) => q.id === id);
  if (!(await isAuthorizedForClinic(req, existing?.clinicId, true))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  await deleteQueue(id);
  res.json({ ok: true });
});

app.post("/api/queues/:id/rate", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    let updatedItem: QueueItem | null = null;

    const qDb = await getQueues();
    const itemMatch = qDb.find(q => q.id === id);

    if (itemMatch) {
      updatedItem = { ...itemMatch, rating: Number(rating) };
      await saveQueue(updatedItem);
      res.json(updatedItem);
    } else {
      res.status(404).json({ error: "Queue not found" });
    }
  } catch (error: any) {
    console.error("[API Rate Queue] Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/clinics", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const [allClinics, allQueues] = await Promise.all([getClinics(), getQueues()]);
  // Public listing (powers the anonymous patient booking page) — never ship the login
  // password. geminiApiKey is stripped too: all AI usage now bills against the single
  // platform-wide key (see getGeminiApiKey), so clinics no longer configure their own
  // key and this field has no legitimate reason to ever reach the browser.
  res.json(allClinics.map((c: any) => {
    const { password, geminiApiKey, ...safe } = c;
    // rating is derived live from real patient feedback (QueueItem.rating), never
    // a stored/editable value — a clinic can't have a frozen 5-star rating forever.
    const ratedQueues = allQueues.filter((q: any) => q.clinicId === c.id && typeof q.rating === 'number');
    if (ratedQueues.length > 0) {
      const avg = ratedQueues.reduce((sum: number, q: any) => sum + q.rating, 0) / ratedQueues.length;
      safe.rating = Number(avg.toFixed(2));
      safe.ratingCount = ratedQueues.length;
    } else {
      // No real feedback yet — keep the neutral pre-review default, but report 0
      // reviews honestly instead of implying real reviews exist.
      safe.ratingCount = 0;
    }
    return safe;
  }));
});

// Shared by two very different callers: the SuperAdmin panel (full clinic CRUD,
// including login/password/subscriptionTier/subscriptionStatus) and a clinic's own
// director/doctor editing their non-sensitive settings (name/phone/address) from
// Sozlamalar. Non-superadmin callers are restricted to a safe field allowlist —
// they can never grant themselves premium, change their subscription, or set login
// credentials through this endpoint. geminiApiKey deliberately absent — AI usage
// bills against one platform-wide key now, clinics no longer configure their own.
const CLINIC_SELF_EDIT_SAFE_FIELDS = ['name', 'phone', 'address', 'mapLink', 'logo', 'lat', 'lng'];
app.post("/api/clinics", async (req, res) => {
  const body = req.body;
  const auth = await getAuthContext(req);
  let clinicToSave: any;

  if (auth.isSuperAdmin) {
    clinicToSave = body;
  } else if (auth.staff && (auth.staff.role === 'director' || auth.staff.role === 'doctor') && auth.staff.clinicId === body.id) {
    clinicToSave = { id: body.id };
    for (const f of CLINIC_SELF_EDIT_SAFE_FIELDS) {
      if (f in body) clinicToSave[f] = body[f];
    }
  } else {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }

  if (!clinicToSave.aiTrialStartDate) {
    // Start the one-time 10-day free AI trial on first creation (or backfill it
    // once for a pre-existing clinic that predates this field).
    const existing = (await getClinics()).find((c: any) => c.id === clinicToSave.id);
    clinicToSave.aiTrialStartDate = existing?.aiTrialStartDate || new Date().toISOString();
  }
  if (clinicToSave.password && !isHashedPassword(clinicToSave.password) && !isEncryptedCredential(clinicToSave.password)) {
    clinicToSave.password = encryptCredential(clinicToSave.password);
  }
  await saveClinic(clinicToSave);
  const { password: _pw, ...safeClinicToSave } = clinicToSave;
  res.status(201).json(safeClinicToSave);
});

// Public, non-sensitive: lets any client show AI trial/premium status for a clinic
// (Sozlamalar page, upgrade banners) without needing to trigger an actual AI call.
app.get("/api/clinics/:id/ai-status", async (req, res) => {
  const { tier, daysLeftInTrial } = await getClinicAiTrialAndTier(req.params.id);
  res.json({ tier, daysLeftInTrial, eligible: tier === 'premium' || daysLeftInTrial > 0 });
});

app.delete("/api/clinics/:id", requireSuperAdmin, async (req, res) => {
  const id = req.params.id;
  await deleteClinic(id);
  // Optional cascade delete mappings if performance allows, but for now just single entity delete
  res.json({ ok: true });
});

app.get("/api/doctors", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const docs = await getDoctors();
  const mapped = docs.map((d: any) => ({
    id: d.id,
    full_name: d.name || d.fullName || d.full_name || "Unknown Doctor",
    name: d.name || d.fullName || d.full_name || "Unknown Doctor",
    specialization: d.specialty || d.specialization || "Stomatolog",
    specialty: d.specialty || d.specialization || "Stomatolog",
    rating: Number(d.rating) || 5.0,
    ratingCount: Number(d.ratingCount) || 1,
    image: d.image || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop",
    status: d.status || "idle",
    login: d.login,
    // password intentionally omitted — see /api/doctor-login and /api/admin/credentials
    clinicId: d.clinicId,
    paymentCardNumber: d.paymentCardNumber,
    paymentPhone: d.paymentPhone
  }));
  res.json(mapped);
});

app.post("/api/doctors", async (req, res) => {
  const doc = req.body;
  const auth = await getAuthContext(req);
  // Superadmin: any doctor. Director: any doctor at their own clinic (adding/editing
  // staff). Doctor: only their own record (self-editing profile/password in Settings).
  const allowed = auth.isSuperAdmin ||
    (auth.staff?.role === 'director' && auth.staff.clinicId === doc.clinicId) ||
    (auth.staff?.role === 'doctor' && auth.staff.doctorId === doc.id && auth.staff.clinicId === doc.clinicId);
  if (!allowed) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  if (doc.password && !isHashedPassword(doc.password) && !isEncryptedCredential(doc.password)) {
    doc.password = encryptCredential(doc.password);
  }
  await saveDoctor(doc);
  const { password: _pw, ...safeDoc } = doc;
  res.status(201).json(safeDoc);
});

app.delete("/api/doctors/:id", async (req, res) => {
  const id = req.params.id;
  const existing: any = (await getDoctors()).find((d: any) => d.id === id);
  if (!(await isAuthorizedForClinic(req, existing?.clinicId))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  await deleteDoctor(id);
  res.json({ ok: true });
});

app.delete("/api/patients/:id", async (req, res) => {
  const id = req.params.id;
  const existing: any = (await getPatients()).find((p: any) => p.id === id);
  if (!(await isAuthorizedForClinic(req, existing?.clinicId))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  await deletePatient(id);
  res.json({ ok: true });
});

app.get("/api/doctor-clinic-links", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(await getDoctorClinicLinks());
});

app.post("/api/doctor-clinic-links", async (req, res) => {
  const link = req.body;
  if (!link.doctorId || !link.clinicId) {
    return res.status(400).json({ error: "doctorId and clinicId are required." });
  }
  if (!(await isAuthorizedForClinic(req, link.clinicId))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  if (!link.id) link.id = `${link.doctorId}_${link.clinicId}`;
  const now = new Date().toISOString();
  if (!link.createdAt) link.createdAt = now;
  link.updatedAt = now;
  await saveDoctorClinicLink(link);
  res.status(201).json(link);
});

app.delete("/api/doctor-clinic-links/:id", async (req, res) => {
  const id = req.params.id;
  const existing: any = (await getDoctorClinicLinks()).find((l: any) => l.id === id);
  if (!(await isAuthorizedForClinic(req, existing?.clinicId))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  await deleteDoctorClinicLink(id);
  res.json({ ok: true });
});

// Manual "pay directly to the doctor, send a screenshot as proof" flow — no real
// payment gateway integration. GET is scoped to the requesting doctor/director;
// PATCH lets the doctor confirm/reject a pending receipt.
app.get("/api/payment-receipts", async (req, res) => {
  const clinicId = String(req.query.clinicId || "");
  const doctorId = String(req.query.doctorId || "");
  const patientId = String(req.query.patientId || "");
  const all: any[] = await getPaymentReceipts();
  let matches = all;
  if (clinicId) matches = matches.filter((r) => r.clinicId === clinicId);
  if (doctorId) matches = matches.filter((r) => r.doctorId === doctorId);
  if (patientId) matches = matches.filter((r) => r.patientId === patientId);
  if (matches.length > 0 && !(await isAuthorizedForClinic(req, matches[0].clinicId, true))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.patch("/api/payment-receipts/:id", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!['confirmed', 'rejected'].includes(status)) {
    return res.status(400).json({ ok: false, error: "status noto'g'ri" });
  }
  const existing: any = (await getPaymentReceipts()).find((r: any) => r.id === id);
  if (!existing) return res.status(404).json({ ok: false, error: "Topilmadi" });
  if (!(await isAuthorizedForClinic(req, existing.clinicId, true))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  const auth = await getAuthContext(req);
  if (auth.staff?.role === 'doctor' && auth.staff.doctorId !== existing.doctorId) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  await savePaymentReceipt({ id, status, resolvedAt: new Date().toISOString() });

  // Best-effort: let the patient know the outcome via Telegram, if they're linked.
  try {
    if (existing.patientId) {
      const patients = await getPatients();
      const pat: any = patients.find((p: any) => p.id === existing.patientId);
      if (pat?.telegramChatId) {
        const outcomeText = status === 'confirmed'
          ? `✅ To'lov cheki tasdiqlandi! Rahmat.`
          : `❌ Yuborgan to'lov chekingiz rad etildi. Iltimos, shifokor bilan bog'laning.`;
        await sendBgTelegramMessage(pat.telegramChatId, outcomeText, existing.clinicId);
      }
    }
  } catch (e) {
    console.warn("[Payment Receipt] Failed to notify patient of outcome:", e);
  }

  res.json({ ok: true });
});

// Lets a doctor ping a patient about an outstanding balance directly from the
// patient's profile, reusing the doctor's own published payment card/phone
// (see Doctor.paymentCardNumber/paymentPhone) — no gateway involved, patient
// pays manually and confirms via the existing receipt-upload Telegram flow.
app.post("/api/request-payment", async (req, res) => {
  const { patientId, doctorId, amount } = req.body;
  if (!patientId || !doctorId) {
    return res.status(400).json({ ok: false, error: "patientId va doctorId talab qilinadi" });
  }
  const doctors = await getDoctors();
  const doc: any = doctors.find((d: any) => d.id === doctorId);
  if (!doc) return res.status(404).json({ ok: false, error: "Shifokor topilmadi" });
  if (!(await isAuthorizedForClinic(req, doc.clinicId, true))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  const patients = await getPatients();
  const pat: any = patients.find((p: any) => p.id === patientId);
  if (!pat) return res.status(404).json({ ok: false, error: "Bemor topilmadi" });
  if (!pat.telegramChatId) {
    return res.status(400).json({ ok: false, error: "Bemor Telegram botga ulanmagan" });
  }
  const amountText = amount ? `${Number(amount).toLocaleString()} so'm` : "qarzdorlik";
  const payoutLines = [
    doc.paymentCardNumber ? `💳 Karta: ${doc.paymentCardNumber}` : null,
    doc.paymentPhone ? `📱 Telefon (Click/Payme): ${doc.paymentPhone}` : null,
  ].filter(Boolean);
  if (payoutLines.length === 0) {
    return res.status(400).json({ ok: false, error: "Shifokor to'lov rekvizitlarini kiritmagan (Sozlamalar > To'lov tizimlari)" });
  }
  const text = `💰 *To'lov so'rovi*\n\nHurmatli ${pat.fullName || 'bemor'}, sizda ${amountText} to'lanishi kerak.\n\n${payoutLines.join('\n')}\n\nTo'lovni amalga oshirgach, chekni ushbu bot orqali yuboring — shifokor tasdiqlaydi.`;
  await sendBgTelegramMessage(pat.telegramChatId, text, doc.clinicId);
  res.json({ ok: true });
});

app.get("/api/reminders", async (req, res) => {
  const clinicId = String(req.query.clinicId || "");
  const patientId = String(req.query.patientId || "");
  const doctorId = String(req.query.doctorId || "");
  const all: any[] = await getReminders();
  let matches = all;
  if (clinicId) matches = matches.filter((r) => r.clinicId === clinicId);
  if (patientId) matches = matches.filter((r) => r.patientId === patientId);
  if (doctorId) matches = matches.filter((r) => r.doctorId === doctorId);
  if (matches.length > 0 && !(await isAuthorizedForClinic(req, matches[0].clinicId, true))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.post("/api/reminders", async (req, res) => {
  const { clinicId, doctorId, patientId, text, dueDate } = req.body;
  if (!clinicId || !doctorId || !patientId || !text || !String(text).trim()) {
    return res.status(400).json({ ok: false, error: "clinicId, doctorId, patientId va text talab qilinadi" });
  }
  if (!(await isAuthorizedForClinic(req, clinicId, true))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  const reminder = {
    id: 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    clinicId, doctorId, patientId,
    text: sanitizeString(String(text)),
    dueDate: dueDate || undefined,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };
  await saveReminder(reminder);
  res.status(201).json(reminder);
});

app.patch("/api/reminders/:id", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!['pending', 'sent', 'done'].includes(status)) {
    return res.status(400).json({ ok: false, error: "status noto'g'ri" });
  }
  const existing: any = (await getReminders()).find((r: any) => r.id === id);
  if (!existing) return res.status(404).json({ ok: false, error: "Topilmadi" });
  if (!(await isAuthorizedForClinic(req, existing.clinicId, true))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }

  if (status === 'sent') {
    const patients = await getPatients();
    const pat: any = patients.find((p: any) => p.id === existing.patientId);
    if (!pat?.telegramChatId) {
      return res.status(400).json({ ok: false, error: "Bemor Telegram botga ulanmagan" });
    }
    await sendBgTelegramMessage(pat.telegramChatId, `🔔 *Eslatma:*\n\n${existing.text}`, existing.clinicId);
    await saveReminder({ id, status: 'sent', sentAt: new Date().toISOString() });
  } else {
    await saveReminder({ id, status });
  }
  res.json({ ok: true });
});

app.delete("/api/reminders/:id", async (req, res) => {
  const id = req.params.id;
  const existing: any = (await getReminders()).find((r: any) => r.id === id);
  if (!existing) return res.status(404).json({ ok: false, error: "Topilmadi" });
  if (!(await isAuthorizedForClinic(req, existing.clinicId, true))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  await deleteReminder(id);
  res.json({ ok: true });
});

app.get("/api/services", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(await getServices());
});

app.post("/api/services", async (req, res) => {
  const srv = req.body;
  if (!(await isAuthorizedForClinic(req, srv.clinicId))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  await saveService(srv);
  res.status(201).json(srv);
});

app.delete("/api/services/:id", async (req, res) => {
  const id = req.params.id;
  const existing: any = (await getServices()).find((s: any) => s.id === id);
  if (!(await isAuthorizedForClinic(req, existing?.clinicId))) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }
  await deleteService(id);
  res.json({ ok: true });
});

// Public: only active ads are ever returned. Placement/clinic targeting is filtered
// client-side (ads are non-sensitive marketing content).
app.get("/api/ads", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  const ads = await getAds();
  res.json(ads.filter((a: any) => a.status === 'active'));
});

// Superadmin-only: full ad list including paused ones, for the management panel.
app.get("/api/admin/ads", requireSuperAdmin, async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(await getAds());
});

app.post("/api/ads", requireSuperAdmin, async (req, res) => {
  const ad = req.body;
  if (!ad.createdAt) ad.createdAt = new Date().toISOString();
  await saveAd(ad);
  res.status(201).json(ad);
});

app.delete("/api/ads/:id", requireSuperAdmin, async (req, res) => {
  await deleteAd(req.params.id);
  res.json({ ok: true });
});

// One-time Telegram broadcast of an ad to every patient with a linked chat (optionally
// scoped to the ad's own clinicId). Distinct from the "append to queue messages" path,
// which happens automatically inside sendBgTelegramMessage.
app.post("/api/ads/:id/broadcast", requireSuperAdmin, async (req, res) => {
  const ads = await getAds();
  const ad: any = ads.find((a: any) => a.id === req.params.id);
  if (!ad) return res.status(404).json({ ok: false, error: "Ad not found" });

  const token = activeTelegramToken;
  if (!token) return res.status(400).json({ ok: false, error: "Telegram bot tokeni sozlanmagan" });

  const allPatients = await getPatients();
  const targets = allPatients.filter((p: any) => p.telegramChatId && (!ad.clinicId || p.clinicId === ad.clinicId));

  const replyMarkup = ad.linkUrl ? { inline_keyboard: [[{ text: "Batafsil", url: ad.linkUrl }]] } : undefined;
  const caption = `📢 *${ad.title}*${ad.body ? `\n\n${ad.body}` : ''}`;

  let sent = 0;
  for (const p of targets) {
    try {
      if (ad.imageUrl) {
        await tgApi(token, 'sendPhoto', { chat_id: p.telegramChatId, photo: ad.imageUrl, caption, parse_mode: 'Markdown', reply_markup: replyMarkup });
      } else {
        await tgApi(token, 'sendMessage', { chat_id: p.telegramChatId, text: caption, parse_mode: 'Markdown', reply_markup: replyMarkup });
      }
      sent++;
    } catch (e) {
      console.warn(`[Ads Broadcast] Failed to send to ${p.telegramChatId}:`, e);
    }
  }
  res.json({ ok: true, sent, total: targets.length });
});

// Persistent SuperAdmin audit trail (survives reloads/restarts).
app.get("/api/admin/audit-logs", requireSuperAdmin, async (req, res) => {
  res.json(await getAuditLogs());
});
app.post("/api/admin/audit-logs", requireSuperAdmin, async (req, res) => {
  const { text, type } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ ok: false, error: "text talab qilinadi" });
  }
  const entry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    text: sanitizeString(String(text)),
    type: ['success', 'warn', 'info'].includes(type) ? type : 'info',
    createdAt: new Date().toISOString(),
  };
  await saveAuditLogEntry(entry);
  res.status(201).json({ ok: true, entry });
});
app.delete("/api/admin/audit-logs/:id", requireSuperAdmin, async (req, res) => {
  await deleteAuditLogEntry(req.params.id);
  res.json({ ok: true });
});

function isUsableKey(key: any): key is string {
  return typeof key === "string" && key.trim() !== "" && !key.startsWith("YOUR_") && key !== "undefined" && key !== "null";
}

// AI Yordamchi (diagnostic + X-ray analysis) is a Premium-only feature, with a
// one-time 10-day free trial per clinic starting from their first-ever AI access
// attempt. Basic-tier clinics past their trial get zero AI access — configuring
// their own Gemini key does not bypass this gate, it only decides who pays for
// the Gemini bill once a clinic IS eligible (premium or still in trial).
const AI_TRIAL_MS = 10 * 24 * 60 * 60 * 1000;

async function getClinicAiTrialAndTier(clinicId: string): Promise<{ tier: 'basic' | 'premium'; daysLeftInTrial: number }> {
  const clinics = await getClinics();
  const clinic: any = clinics.find((c: any) => c.id === clinicId);
  if (!clinic) return { tier: 'basic', daysLeftInTrial: 0 };

  if (!clinic.aiTrialStartDate) {
    // Lazily start the trial the first time it's ever checked — covers clinics
    // created before this feature shipped, in addition to the eager stamp that
    // POST /api/clinics performs for newly-created clinics.
    clinic.aiTrialStartDate = new Date().toISOString();
    await saveClinic({ id: clinic.id, aiTrialStartDate: clinic.aiTrialStartDate });
  }

  const elapsedMs = Date.now() - new Date(clinic.aiTrialStartDate).getTime();
  const daysLeftInTrial = Math.max(0, Math.ceil((AI_TRIAL_MS - elapsedMs) / (24 * 60 * 60 * 1000)));
  return { tier: clinic.subscriptionTier === 'premium' ? 'premium' : 'basic', daysLeftInTrial };
}

// All AI usage across the whole platform bills against one single owner-funded
// key — clinics can no longer configure their own Gemini key (that option, and
// the leak of it via the public /api/clinics response, has been removed).
// Callers must still check getClinicAiTrialAndTier + checkAndConsumeAiUsage
// themselves first — this function does NOT gate access.
async function getGeminiApiKey(clinicId?: string): Promise<string | null> {
  const activeKey = process.env.GEMINI_API_KEY;
  return isUsableKey(activeKey) ? activeKey : null;
}

// Shared daily spending ceiling so a single clinic (or the anonymous Telegram
// bot channel) can't run up an unbounded Gemini bill against the one platform
// key. Deliberately generous — this is a safety net against abuse/bugs, not a
// per-feature quota — and is a single constant so it's trivial to retune later.
const DAILY_AI_CAP_PER_CLINIC = 50;
const DAILY_AI_CAP_PER_CHAT = 8;

// Per-clinic daily AI usage counter, mirroring the stored-timestamp/elapsed-time
// pattern getClinicAiTrialAndTier already uses. Returns false (caller must fall
// back to the existing simulated/offline AI response) once the clinic has used
// up today's shared allowance; otherwise consumes one unit and returns true.
async function checkAndConsumeAiUsage(clinicId: string): Promise<boolean> {
  const clinics = await getClinics();
  const clinic: any = clinics.find((c: any) => c.id === clinicId);
  if (!clinic) return false;

  const today = new Date().toISOString().slice(0, 10);
  const isNewDay = clinic.aiUsageDate !== today;
  const currentCount = isNewDay ? 0 : (clinic.aiUsageCount || 0);

  if (currentCount >= DAILY_AI_CAP_PER_CLINIC) return false;

  await saveClinic({ id: clinic.id, aiUsageDate: today, aiUsageCount: currentCount + 1 });
  return true;
}

// In-memory per-chat daily cap for the Telegram patient bot's free-text AI chat,
// which has no resolvable clinicId to hang a per-clinic cap off of. Same Map-based
// style as the ipLimits table inside rateLimiter() below. Resets naturally when a
// serverless instance recycles — this is an abuse guard, not a hard billing ledger.
const chatAiUsage = new Map<string, { count: number; date: string }>();
function checkAndConsumeChatAiUsage(chatId: number | string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const key = String(chatId);
  const record = chatAiUsage.get(key);

  if (!record || record.date !== today) {
    chatAiUsage.set(key, { count: 1, date: today });
    return true;
  }
  if (record.count >= DAILY_AI_CAP_PER_CHAT) return false;
  record.count++;
  return true;
}

// Lightweight per-chat cooldown so a script can't burn through the whole daily
// cap in a single second — separate from the daily cap itself.
const chatAiLastCallAt = new Map<string, number>();
function isChatAiOnCooldown(chatId: number | string): boolean {
  const key = String(chatId);
  const last = chatAiLastCallAt.get(key) || 0;
  const now = Date.now();
  if (now - last < 3000) return true;
  chatAiLastCallAt.set(key, now);
  return false;
}

// Calls the Gemini REST API directly (bypassing the @google/genai SDK, whose HTTP
// client hangs/misauthenticates in some sandboxed network environments — a plain
// fetch to the documented REST endpoint is more reliable and was verified working).
async function callGemini(opts: {
  model: string;
  parts: any[];
  apiKey: string;
  responseMimeType?: string;
  responseSchema?: any;
  systemInstruction?: string;
}): Promise<{ text: string }> {
  const apiKey = opts.apiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const body: any = { contents: [{ parts: opts.parts }] };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }
  if (opts.responseMimeType || opts.responseSchema) {
    body.generationConfig = {};
    if (opts.responseMimeType) body.generationConfig.responseMimeType = opts.responseMimeType;
    if (opts.responseSchema) body.generationConfig.responseSchema = opts.responseSchema;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }
  const data: any = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
  return { text };
}

console.log("[DStoma Core] Booting Production-Ready Full-Stack Web App...");

// All three /api/ai/* endpoints told Gemini "Uzbek (uz)" / "Russian (ru)" /
// otherwise "English (en)" — every non-uz/ru language (kk, ky, tg, tk) fell
// through to English even though the app's UI supports all seven. A doctor
// asking in Kazakh got an English answer.
const AI_PROMPT_LANGUAGE_NAMES: Record<string, string> = {
  uz: "Uzbek (uz)",
  ru: "Russian (ru)",
  en: "English (en)",
  kk: "Kazakh (kk)",
  ky: "Kyrgyz (ky)",
  tg: "Tajik (tg)",
  tk: "Turkmen (tk)",
};
function aiPromptLanguageName(lang: string): string {
  return AI_PROMPT_LANGUAGE_NAMES[lang] || AI_PROMPT_LANGUAGE_NAMES.uz;
}

/**
 * Endpoint for Real-time AI Dental Diagnostics and Telemetry
 * Securely calls Gemini on the server side to protect secrets.
 */
app.post("/api/ai/diagnostic", rateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    const { toothNumber, symptoms, language, image, clinicId } = req.body;

    if (!toothNumber) {
      return res.status(400).json({ error: "Tooth index number is required." });
    }

    const requestedLang = language || 'uz';

    if (clinicId) {
      const { tier, daysLeftInTrial } = await getClinicAiTrialAndTier(clinicId);
      if (tier !== 'premium' && daysLeftInTrial <= 0) {
        return res.status(402).json({
          requiresPremium: true,
          error: "AI Yordamchi — Premium xizmat. Bepul sinov muddati tugagan."
        });
      }
    }

    // Daily platform-wide spending ceiling — once hit, degrade gracefully to the
    // same simulated response used when no API key is configured, rather than
    // erroring out.
    if (clinicId && !(await checkAndConsumeAiUsage(clinicId))) {
      const simulatedData = getSimulatedDiagnosis(Number(toothNumber), symptoms || '', requestedLang, !!image);
      return res.json({
        ...simulatedData,
        isSimulation: true,
        toothNumber: Number(toothNumber)
      });
    }

    const apiKey = await getGeminiApiKey(clinicId);

    if (!apiKey) {
      // Eligible (premium/trial) but no key resolvable anywhere — genuine
      // misconfiguration (e.g. platform key missing), not a paywall case.
      const simulatedData = getSimulatedDiagnosis(Number(toothNumber), symptoms || '', requestedLang, !!image);
      return res.json({
        ...simulatedData,
        isSimulation: true,
        toothNumber: Number(toothNumber)
      });
    }

    // Advanced prompt design for dental analytics
    let promptText = `Perform a professional, clinically accurate dental diagnostic evaluation for the specified tooth:
Tooth index number: #${toothNumber} (Mandibular active tooth node)
Patient reported symptoms or diagnostic logs: "${symptoms || 'None - routine scanner telemetry check'}"
Target language for all text strings: ${aiPromptLanguageName(requestedLang)}`;

    if (image && image.data && image.mimeType) {
      promptText += `\n\n[IMAGE INCLUDED] A physical picture has been provided by the patient. 
FIRST, critically verify if the image actually contains teeth, a mouth, or a dental X-ray. 
If the image is completely unrelated to dentistry (e.g., a car, a landscape, an animal, a random object), you MUST set 'isDentalRelated' to false and clearly state in the 'diagnosticText' that the provided image does not appear to be dental-related. 
If it IS a dental image, set 'isDentalRelated' to true and carefully analyze it for any visible dental pathology (cavities, fractures, discoloration). Reflect your findings.`;
    } else {
      promptText += `\n\n[NO IMAGE PROVIDED] The user has not provided an image. Set 'isDentalRelated' to true.`;
    }

    promptText += `\n\nPlease analyze the symptoms, tooth location, pathic indicators, and generate a strict, clean clinical assessment.
All content text in the response must be written entirely in the requested language.
IMPORTANT MINIMUM REQUIREMENT: The 'healthFactor' field MUST include a specific percentage value strictly formatted with a '%' symbol (e.g., "O'rta (65%)", "Yaxshi (92%)", "Critical (42%)"). This exact numerical percentage is required to update the interactive 3D indicators.

Return the JSON response adhering strictly to this schema:
{
  "enamelAbrasion": "Wear/Damage metric (e.g. '15% abrasion', 'Moderate attrition', 'Normal')",
  "healthFactor": "Condition score with a MANDATORY percentage (e.g., 'Excellent (96%)', 'Fair (72%)', 'Critical (35%)')",
  "recommendedTreatment": "Individually suggested clinic treatment (e.g., 'Composite Plomba', 'Root Canal Therapy', 'Routine professional cleaning')",
  "diagnosticText": "Detailed explanatory diagnostic summary, pathophysiology notes and local dental care guidance",
  "actionPlan": ["Short actionable guidance item 1", "Short actionable guidance item 2", "Short actionable guidance item 3"]
}`;

    const parts: any[] = [];
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data
        }
      });
    }
    parts.push({ text: promptText });

    const response = await callGemini({
      model: "gemini-2.5-flash",
      parts,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["isDentalRelated", "enamelAbrasion", "healthFactor", "recommendedTreatment", "diagnosticText", "actionPlan"],
        properties: {
          isDentalRelated: { type: Type.BOOLEAN, description: "Set to false ONLY if an image is provided and it does NOT picture teeth, dental x-rays, or oral cavity." },
          enamelAbrasion: { type: Type.STRING },
          healthFactor: { type: Type.STRING },
          recommendedTreatment: { type: Type.STRING },
          diagnosticText: { type: Type.STRING },
          actionPlan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          }
        }
      },
      systemInstruction: "You are an expert, highly precise robotic AI dental system operating in DStoma Digital Hub. You analyze selected human teeth numbers and deliver clear, medical-quality descriptions, estimations, and treatments. Speak as an objective virtual dental clinic scientist. Strictly structure everything in the language requested — it may be Uzbek, Russian, English, Kazakh, Kyrgyz, Tajik, or Turkmen."
    });

    if (response && response.text) {
      const parsedData = JSON.parse(response.text.trim());
      return res.json({
        ...parsedData,
        isSimulation: false,
        toothNumber: Number(toothNumber)
      });
    } else {
      throw new Error("No response text found from the AI model.");
    }

  } catch (error: any) {
    console.error("[DStoma AI API] Error processing AI evaluation:", error);
    // Graceful production fallback with clear diagnostics details back to client
    const fallbackData = getSimulatedDiagnosis(Number(req.body.toothNumber || 24), req.body.symptoms || '', req.body.language || 'uz', !!req.body.image);
    return res.json({
      ...fallbackData,
      isSimulation: true,
      errorDetails: error.message,
      toothNumber: Number(req.body.toothNumber || 24)
    });
  }
});

/**
 * Endpoint for AI analysis of a full X-ray image (OPG/RVG/CBCT), returning
 * multiple findings across the image rather than a single-tooth diagnosis.
 */
app.post("/api/ai/xray-analysis", rateLimiter(10, 60 * 1000), async (req, res) => {
  const { image, xrayType, language, clinicId } = req.body;
  const requestedLang = language || 'uz';
  try {
    if (!image || !image.data || !image.mimeType) {
      return res.status(400).json({ error: "X-ray image is required." });
    }

    if (clinicId) {
      const { tier, daysLeftInTrial } = await getClinicAiTrialAndTier(clinicId);
      if (tier !== 'premium' && daysLeftInTrial <= 0) {
        return res.status(402).json({
          requiresPremium: true,
          error: "AI Yordamchi — Premium xizmat. Bepul sinov muddati tugagan."
        });
      }
      if (!(await checkAndConsumeAiUsage(clinicId))) {
        return res.json({ ...getSimulatedXrayAnalysis(xrayType, requestedLang), isSimulation: true });
      }
    }

    const apiKey = await getGeminiApiKey(clinicId);
    if (!apiKey) {
      return res.json({ ...getSimulatedXrayAnalysis(xrayType, requestedLang), isSimulation: true });
    }

    const promptText = `Analyze this dental ${xrayType || 'X-ray'} image as an expert radiologist.
Target language for all text strings: ${aiPromptLanguageName(requestedLang)}
Identify every visible pathology or notable finding (caries, bone loss, impacted teeth, periapical lesions, existing restorations, etc.), each tied to a specific tooth number (FDI notation) where possible.
Return strict JSON matching this schema:
{
  "findings": [{ "description": "short finding description", "confidence": 0-100 integer, "toothNumber": "FDI tooth number as string, or empty string if not tooth-specific" }],
  "overallConfidence": 0-100 integer
}`;

    const response = await callGemini({
      model: "gemini-2.5-flash",
      parts: [{ inlineData: { mimeType: image.mimeType, data: image.data } }, { text: promptText }],
      apiKey,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["findings", "overallConfidence"],
        properties: {
          findings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["description", "confidence"],
              properties: {
                description: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                toothNumber: { type: Type.STRING },
              }
            }
          },
          overallConfidence: { type: Type.NUMBER },
        }
      },
      systemInstruction: "You are an expert dental radiologist AI operating in DStoma Digital Hub. Analyze X-ray images and report findings precisely and objectively, in the requested language."
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({ ...parsed, isSimulation: false });
    }
    throw new Error("No response text found from the AI model.");
  } catch (error: any) {
    console.error("[DStoma AI API] X-ray analysis error:", error);
    return res.json({ ...getSimulatedXrayAnalysis(req.body.xrayType, requestedLang), isSimulation: true, errorDetails: error.message });
  }
});

/**
 * Conversational "AI Yordamchi" for the patient's own web cabinet — mirrors the
 * Telegram patient bot's free-text/photo AI chat (same prompt, same fallback
 * text), gated the same way as the other clinic-scoped AI features.
 */
app.post("/api/ai/patient-chat", rateLimiter(10, 60 * 1000), async (req, res) => {
  const { clinicId, message, image, language } = req.body;
  const requestedLang = language || 'uz';
  try {
    if (!message && !image) {
      return res.status(400).json({ error: "Message or image is required." });
    }

    if (clinicId) {
      const { tier, daysLeftInTrial } = await getClinicAiTrialAndTier(clinicId);
      if (tier !== 'premium' && daysLeftInTrial <= 0) {
        return res.status(402).json({
          requiresPremium: true,
          error: "AI Yordamchi — Premium xizmat. Bepul sinov muddati tugagan."
        });
      }
      if (!(await checkAndConsumeAiUsage(clinicId))) {
        return res.json({ reply: getPatientBotSimulatedReply(message || '', !!image), isSimulation: true });
      }
    }

    const apiKey = await getGeminiApiKey(clinicId);
    if (!apiKey) {
      return res.json({ reply: getPatientBotSimulatedReply(message || '', !!image), isSimulation: true });
    }

    const systemPrompt = `You are an expert robotic AI dental scientist operating in DStoma Digital Hub. You analyze dental questions, symptoms, and human teeth/mouth photos/x-rays. Respond in ${aiPromptLanguageName(requestedLang)} (unless the patient writes in a different language). Be warm, precise, professional, and very helpful. Format with bullet points where necessary. Keep the answer under 150 words. Always include a reminder that AI diagnostics is estimated and you must schedule/consult real dentists at DStoma.`;
    const userPrompt = message ? message : "Diagnose this uploaded tooth/mouth photo and give preventative dental advice.";

    const parts: any[] = [];
    if (image && image.data && image.mimeType) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
      parts.push({ text: `Analyze this tooth image for symptoms, fractures, decay, or gum issues, and respond to: "${userPrompt}"\n\nSystem Instruction: ${systemPrompt}` });
    } else {
      parts.push({ text: `Analyze this question: "${userPrompt}"\n\nSystem Instruction: ${systemPrompt}` });
    }

    const response = await callGemini({ model: "gemini-2.5-flash", parts, apiKey });
    return res.json({ reply: response.text?.trim() || getPatientBotSimulatedReply(userPrompt, !!image), isSimulation: false });
  } catch (error: any) {
    console.error("[DStoma AI API] Patient chat error:", error);
    return res.json({ reply: getPatientBotSimulatedReply(req.body.message || '', !!req.body.image), isSimulation: true, errorDetails: error.message });
  }
});

function getSimulatedXrayAnalysis(xrayType: string, lang: string) {
  const isUz = lang === 'uz';
  return {
    findings: [
      {
        description: isUz ? "Tasvir sifati tahlil uchun yetarli, ammo aniq AI kaliti sozlanmagan (simulyatsiya natijasi)" : "Image quality sufficient, but no AI key configured (simulated result)",
        confidence: 60,
        toothNumber: "",
      },
    ],
    overallConfidence: 60,
  };
}

// Helper for offline diagnostics & prompt feedback
function getSimulatedDiagnosis(tooth: number, symptoms: string, lang: string, hasImage = false) {
  const cleanSym = symptoms.trim().toLowerCase();
  const severityIndex = (tooth + cleanSym.length) % 3;
  
  if (lang === 'uz') {
    if (hasImage) {
      if (severityIndex === 0) {
        return {
          enamelAbrasion: "18% Yengil yemirilish",
          healthFactor: "Yaxshi (82%)",
          recommendedTreatment: "Profilaktik tozalash",
          diagnosticText: `Yuborilgan tish (#${tooth}) rasm tahliliga ko'ra, kichik dog'lar va yengil shikastlanish ko'rinib turibdi. Alomatlar: "${symptoms || 'Yo\'q'}". Maxsus muolajalarsiz faqatgina ftorlash tavsiya etiladi.`,
          actionPlan: [
            "DStoma shifokoriga profilaktika uchun uchrashish",
            "Ftorga boy tish pastasidan foydalanish",
            "Tish ipidan muntazam foydalanish"
          ]
        };
      } else if (severityIndex === 1) {
        return {
          enamelAbrasion: "32% Yuzaki mikrosiniq",
          healthFactor: "O'rta (65%)",
          recommendedTreatment: "Badiiy restavratsiya (Kompozit)",
          diagnosticText: `Yuborilgan tish (#${tooth}) rasm tahlili natijalariga ko'ra emal qismida o'rta darajadagi yemirilish va tish chetida mikrosiniqlar aniqlandi. Quyidagi alomatlar ham o'rganildi: "${symptoms || 'Yo\'q'}" . Tishni qayta tiklash va emalini mustahkamlash uchun kompozit restavratsiya qilish samaralidir.`,
          actionPlan: [
            "DStoma shifokoriga badiiy restavratsiya uchun uchrashish",
            "Kalsiy va minerallarga boy maxsus tish pastalarini ishlatish",
            "Rang beruvchi hamda o'ta issiq/sovuq taomlardan vaqtincha saqlanish"
          ]
        };
      } else {
        return {
          enamelAbrasion: "65% Chuqur karies / yemirilish",
          healthFactor: "Kritik (35%)",
          recommendedTreatment: "Kanal muolajasi va Koronka",
          diagnosticText: `Yuborilgan tish (#${tooth}) rasmida jiddiy shikastlanish, ehtimol nervgacha yetib borgan karies ko'rinmoqda. Alomatlar: "${symptoms || 'Yo\'q'}". Zudlik bilan shifokor ko'rigi va ehtimoliy ildiz kanali muolajasi (endodontiya) zarur.`,
          actionPlan: [
            "Zudlik bilan DStoma shifokoriga qo'ng'iroq qilish",
            "Og'riq qoldiruvchi dorilarni shifokor nazoratida olish",
            "Qattiq ovqatlardan tiyilish"
          ]
        };
      }
    }
    if (cleanSym.includes('og\'riq') || cleanSym.includes('ogriq') || cleanSym.includes('shish') || cleanSym.includes('pain')) {
      return {
        enamelAbrasion: "28% Yuqori yemirilish",
        healthFactor: "Kritik (42%)",
        recommendedTreatment: "Kanal muolajasi (Endodontiya)",
        diagnosticText: `Tish #${tooth} mandibular segmentida asab tolalari yallig'lanishi (pulpit) kuzatilmoqda. Bemor ko'rsatgan alomatlar: "${symptoms}". Zudlik bilan stomatolog ko'rigidan o'tib, chuqur ildiz kanallarini davolash tavsiya etiladi.`,
        actionPlan: [
          "Og'riq qoldiruvchi vositalarni shifokor nazoratida qo'llash",
          "Zudlik bilan DStoma shifokoriga navbat olish",
          "Issiq va sovuq oziq-ovqatlardan saqlanish"
        ]
      };
    }
    return {
      enamelAbrasion: "6% Minimal yemirilish",
      healthFactor: "Sog'lom (94%)",
      recommendedTreatment: "Muntazam profilaktika va Minerallash",
      diagnosticText: `Tish #${tooth} normal anatomik tuzilishga ega. Maxsus patologiyalar aniqlanmadi. Muammali alomatlar qayd etilmadi. Sog'lom emal mudofaasini saqlash uchun feylerli tish pastalardan muntazam foydalaning.`,
      actionPlan: [
        "Tongda va kechqurun tishlarni 2 daqiqa davomida yuvish",
        "Har 6 oyda DStoma klinikalarida ultratovushli tozalash",
        "Dental tish ipidan muntazam foydalanish"
      ]
    };
  } else if (lang === 'ru') {
    if (hasImage) {
      if (severityIndex === 0) {
        return {
          enamelAbrasion: "18% Легкое повреждение",
          healthFactor: "Хорошее (82%)",
          recommendedTreatment: "Профилактическая чистка",
          diagnosticText: `Анализ изображения зуба #${tooth}: наблюдаются незначительные пятна и легкий износ. Симптомы: "${symptoms || 'нет'}". Рекомендуется фторирование без сложных вмешательств.`,
          actionPlan: [
            "Профилактический визит в DStoma",
            "Использовать зубную пасту с фтором",
            "Регулярно использовать зубную нить"
          ]
        };
      } else if (severityIndex === 1) {
        return {
          enamelAbrasion: "32% Поверхностная микротрещина",
          healthFactor: "Средний (65%)",
          recommendedTreatment: "Художественная реставрация зуба",
          diagnosticText: `Результаты анализа изображения зуба #${tooth}: на эмали обнаружена умеренная пигментация и микротрещина по краю. С учетом симптомов: "${symptoms || 'нет'}", рекомендуется художественная композитная реставрация для герметизации дефекта и защиты нерва.`,
          actionPlan: [
            "Записаться на художественную реставрацию в клинику DStoma",
            "Использовать зубную пасту с гидроксиапатитом кальция для укрепления эмали",
            "Избегать резких температурных перепадов и красящих продуктов"
          ]
        };
      } else {
        return {
          enamelAbrasion: "65% Глубокий кариес",
          healthFactor: "Критическое (35%)",
          recommendedTreatment: "Лечение корневых каналов и коронка",
          diagnosticText: `На изображении зуба #${tooth} обнаружено серьезное повреждение, возможен глубокий кариес. Симптомы: "${symptoms || 'нет'}". Необходим срочный осмотр и возможное лечение каналов.`,
          actionPlan: [
            "Срочно посетить стоматолога DStoma",
            "Принимать обезболивающие только по назначению",
            "Избегать твердой пищи"
          ]
        };
      }
    }
    if (cleanSym.includes('бол') || cleanSym.includes('опух') || cleanSym.includes('острый') || cleanSym.includes('pain')) {
      return {
        enamelAbrasion: "28% Высокая абразия",
        healthFactor: "Критическое (42%)",
        recommendedTreatment: "Лечение корневых каналов (Эндодонтия)",
        diagnosticText: `В сегменте зуба #${tooth} наблюдаются признаки воспаления пульпы (пульпит). Описанные симптомы: "${symptoms}". Рекомендуется проведение рентген-диагностики зуба и терапевтическое эндодонтическое вмешательство.`,
        actionPlan: [
          "Применение противовоспалительных средств при острой боли",
          "Запись к дежурному стоматологу DStoma",
          "Исключение твердой и экстремально температурной пищи"
        ]
      };
    }
    return {
      enamelAbrasion: "6% Минимальный износ",
      healthFactor: "Отличное (94%)",
      recommendedTreatment: "Регулярная гигиена и реминерализация",
      diagnosticText: `Зуб #${tooth} находится в здоровом анатомическом состоянии. Выраженных клинических патологий не выявлено. Для сохранения эмали рекомендуется стандартная профилактика.`,
      actionPlan: [
        "Правильное очищение зубов щеткой средней жесткости",
        "Прохождение профгигиены каждые 6 месяцев",
        "Использование зубной нити после еды"
      ]
    };
  } else {
    // English default
    if (hasImage) {
      if (severityIndex === 0) {
        return {
          enamelAbrasion: "18% Mild wear",
          healthFactor: "Good (82%)",
          recommendedTreatment: "Preventative Cleaning & Fluoride",
          diagnosticText: `Based on the attached image of Tooth #${tooth}, there are minor spots and slight wear. Symptoms: "${symptoms || 'none'}". Fluoride therapy is recommended.`,
          actionPlan: [
            "Schedule preventative care at DStoma",
            "Use fluoride-rich toothpaste",
            "Floss daily"
          ]
        };
      } else if (severityIndex === 1) {
        return {
          enamelAbrasion: "32% Superficial micro-fracture",
          healthFactor: "Fair (65%)",
          recommendedTreatment: "Aesthetic Composite Restoration",
          diagnosticText: `Visual analysis of your uploaded image for Tooth #${tooth} indicates moderate enamel wear and a minor superficial fracture on the incisal edge. Symptoms: "${symptoms || 'none'}". Aesthetic composite restoration is recommended to protect the tissue structure.`,
          actionPlan: [
            "Schedule an appointment for composite restoration at DStoma",
            "Apply remineralizing toothpaste containing hydroxyapatite",
            "Avoid direct heavy biting on hard objects and thermal shock food"
          ]
        };
      } else {
        return {
          enamelAbrasion: "65% Deep decay",
          healthFactor: "Critical (35%)",
          recommendedTreatment: "Root Canal and Crown",
          diagnosticText: `Image analysis of Tooth #${tooth} reveals severe damage, likely deep decay reaching the pulp. Symptoms: "${symptoms || 'none'}". Urgent dental care is required.`,
          actionPlan: [
            "Urgent appointment at DStoma",
            "Take pain relievers only as directed",
            "Avoid chewing hard foods"
          ]
        };
      }
    }
    if (cleanSym.includes('pain') || cleanSym.includes('ache') || cleanSym.includes('hurt') || cleanSym.includes('swoll')) {
      return {
        enamelAbrasion: "28% High abrasion",
        healthFactor: "Critical (42%)",
        recommendedTreatment: "Root Canal Therapy (Endodontics)",
        diagnosticText: `Active symptoms "${symptoms}" indicate localized pulp inflammation or early deep lesion in Tooth #${tooth}. Timely professional therapy is strongly recommended.`,
        actionPlan: [
          "Temporary anti-inflammatory medicine under professional guide",
          "Schedule an urgent diagnostic check-in on the DStoma Map",
          "Avoid direct biting on hard surfaces and temperature extremes"
        ]
      };
    }
    return {
      enamelAbrasion: "6% Minor wearing",
      healthFactor: "Excellent (94%)",
      recommendedTreatment: "Preventative Fluoridation & Remineralization",
      diagnosticText: `Tooth #${tooth} exhibits standard healthy occlusion and clean enamel layers. Preventative care is recommended to stabilize and preserve surface mineral densities.`,
      actionPlan: [
        "Maintain thorough brushing morning and night",
        "Utilize interdental dental floss daily",
        "Schedule standard check-ups bi-annually"
      ]
    };
  }
}

// ==================== TELEGRAM BOT API HANDLER & GENERATIVE DENTAL AI CHATBOT ====================
async function tgApi(token: string, method: string, payload: any) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    
    // Auto-retry fallback if formatting parse fails
    if (!result.ok && payload && payload.parse_mode && 
        result.description && 
        (result.description.toLowerCase().includes("parse") || result.description.toLowerCase().includes("entity") || result.description.toLowerCase().includes("entities"))) {
      console.warn(`[Telegram API Warning] Retry without formatting parse_mode because: ${result.description}`);
      const fallbackPayload = { ...payload };
      delete fallbackPayload.parse_mode;
      const retryResponse = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackPayload),
      });
      return await retryResponse.json();
    }
    
    return result;
  } catch (error) {
    console.error(`[Telegram API Error] Failed to call ${method}:`, error);
    return null;
  }
}

async function sendBgTelegramMessage(chatId: string | number, text: string, clinicId?: string) {
  const token = activeTelegramToken;
  if (!token) return;

  let finalText = text;
  try {
    const ads = await getAds();
    const eligibleAd = ads.find((a: any) => a.status === 'active' && a.telegramEnabled && (!a.clinicId || a.clinicId === clinicId));
    if (eligibleAd) {
      finalText += `\n\n📢 *${eligibleAd.title}*${eligibleAd.body ? `\n${eligibleAd.body}` : ''}${eligibleAd.linkUrl ? `\n${eligibleAd.linkUrl}` : ''}`;
    }
  } catch (e) {
    // Ad lookup failure must never block the actual queue notification.
    console.warn('[Ads] Failed to append ad to Telegram message:', e);
  }

  await tgApi(token, 'sendMessage', {
    chat_id: chatId,
    text: finalText,
    parse_mode: 'Markdown'
  });
}

async function sendDoctorTelegramMessage(chatId: string | number, text: string) {
  const token = activeDoctorBotToken;
  if (!token) return;
  await tgApi(token, 'sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  });
}

async function sendDoctorDashboard(token: string, chatId: number | string, doctorId: string, text: string) {
  const qDb = await getQueues();
  const docQueues = qDb.filter((q: any) => q.doctorId === doctorId && q.status !== 'completed' && q.status !== 'cancelled');
  let msg = text + "\n\n";
  const sDocs = await getDoctors();
  const activeDoc = sDocs.find((d: any) => d.id === doctorId);
  const docName = activeDoc ? activeDoc.name : "Shifokor";
  msg += `👨‍⚕️ *Shifokor:* Dr. ${docName}\n`;
  msg += `⏳ *Faol navbatlar soni:* ${docQueues.length} ta bemor\n\n`;

  const callingPatient = docQueues.find(q => q.status === 'calling');
  if (callingPatient) {
    msg += `🔔 *Xonadagi bemor:* \n` +
      ` 🎫 Chipta raqami: *#${callingPatient.number}*\n` +
      ` 👤 Ismi: *${callingPatient.patientName}*\n` +
      ` 📞 Tel: \`${callingPatient.patientPhone}\`\n` +
      ` 🩺 Status: *QABULDA (Xonada)*\n\n`;
  }

  if (docQueues.length > 0) {
    msg += `📋 *Kutayotgan bemorlar ro'yxati (Navbati bilan):*\n`;
    docQueues.forEach((q, idx) => {
      const statusSign = q.status === 'calling' ? '🟢' : '⏳';
      msg += `${idx + 1}. ${statusSign} *#${q.number}* - ${q.patientName} (${q.status === 'calling' ? 'xonada' : 'kutmoqda'})\n`;
    });
  } else {
    msg += `🎉 *Hozircha navbatda turgan bemorlar yo'q! Navbatchilik bo'sh.*`;
  }

  const replyMarkup: any = { inline_keyboard: [] };
  
  if (callingPatient) {
    replyMarkup.inline_keyboard.push([
      { text: "✅ Qabulni Yakunlash", callback_data: `doc_complete_active_${doctorId}` },
      { text: "❌ Bekor qilish", callback_data: `doc_cancel_active_${doctorId}` }
    ]);
  } else if (docQueues.length > 0) {
    replyMarkup.inline_keyboard.push([
      { text: "🔔 Keyingi bemorni chaqirish", callback_data: `doc_call_next_${doctorId}` }
    ]);
  }
  
  replyMarkup.inline_keyboard.push([
    { text: "🔄 Yangilash", callback_data: `doc_refresh_${doctorId}` },
    { text: "🚪 Tizimdan chiqish", callback_data: `doc_logout_${doctorId}` }
  ]);

  await tgApi(token, 'sendMessage', {
    chat_id: chatId,
    text: msg,
    parse_mode: 'Markdown',
    reply_markup: replyMarkup
  });
}

// Active conversational sessions state mapper for Telegram registration
const gSessions = globalThis as any;
if (!gSessions._botSessions) {
  gSessions._botSessions = {};
}
// Telegram's private-chat `chat.id` is the user's numeric Telegram ID, which is
// IDENTICAL across both bots for the same person — so a plain `chatId` key let a
// patient-flow session (e.g. mid-registration on the patient bot) collide with a
// doctor-flow session for that same person on the doctor bot, causing one bot to
// run the other bot's conversation logic (and reply through the wrong bot/token).
// Scoping the key by which bot the message came in on eliminates the collision.
function sessionKey(token: string, chatId: number): string {
  return `${token === activeDoctorBotToken ? "doctor" : "patient"}:${chatId}`;
}
const botSessions: Record<string, {
  step?: 'register_name' | 'register_phone' | 'register_passport' | 'register_password' | 'register_blood' | 'doctor_login' | 'doctor_password' | 'patient_login_passport' | 'patient_login_password' | 'book_queue_complaint' | 'awaiting_receipt_photo';
  tempDoctorLogin?: string;
  tempPatientId?: string;
  tempUser?: {
    id?: string;
    clinicId?: string;
    doctorId?: string;
    fullName?: string;
    passportSerial?: string;
    phone?: string;
    password?: string;
    bloodGroup?: string;
    telegramChatId?: string;
  };
  receiptQueueId?: string;
  receiptDoctorId?: string;
  receiptClinicId?: string;
  receiptPatientId?: string;
  receiptPatientName?: string;
}> = gSessions._botSessions;

async function startTelegramBot() {
  await loadTelegramCreds();
  console.log("[Telegram Bot] Launching Dual Polling Bot Service for Patient and Doctor bots...");
  let patientOffset = 0;
  let doctorOffset = 0;
  let lastPatientToken = "";
  let lastDoctorToken = "";

  async function pollPatient() {
    const token = activeTelegramToken;
    if (!token) {
      setTimeout(pollPatient, 4000);
      return;
    }

    if (token !== lastPatientToken) {
      try {
        console.log(`[Patient Bot] clearing pending webhooks/updates for token: ${token.slice(0, 10)}...`);
        await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
        lastPatientToken = token;
      } catch (err) {
        console.error("[Patient Bot] Failed to clear webhook:", err);
      }
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${patientOffset}&timeout=5`);
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.result && data.result.length > 0) {
          for (const update of data.result) {
            patientOffset = update.update_id + 1;
            try {
              await handleTelegramUpdate(token, update);
            } catch (err) {
              console.error("[Patient Bot Update handling warning]:", err);
            }
          }
        }
      }
    } catch (e) {
      // suppress network noise logging
    }
    setTimeout(pollPatient, 1000);
  }

  async function pollDoctor() {
    const token = activeDoctorBotToken;
    if (!token) {
      setTimeout(pollDoctor, 4000);
      return;
    }

    if (token !== lastDoctorToken) {
      try {
        console.log(`[Doctor Bot] clearing pending webhooks/updates for token: ${token.slice(0, 10)}...`);
        await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
        lastDoctorToken = token;
      } catch (err) {
        console.error("[Doctor Bot] Failed to clear webhook:", err);
      }
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${doctorOffset}&timeout=5`);
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.result && data.result.length > 0) {
          for (const update of data.result) {
            doctorOffset = update.update_id + 1;
            try {
              await handleTelegramUpdate(token, update);
            } catch (err) {
              console.error("[Doctor Bot Update handling warning]:", err);
            }
          }
        }
      }
    } catch (e) {
      // suppress network noise logging
    }
    setTimeout(pollDoctor, 1000);
  }

  pollPatient();
  pollDoctor();
}

async function handleTelegramUpdate(token: string, update: any) {
  try {
    const isDoctorBot = (token === activeDoctorBotToken);

    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';
      const firstName = update.message.chat.first_name || 'Bemor';
      
      const session = botSessions[sessionKey(token, chatId)];
      if (session && session.step) {
        await handleRegistrationStep(token, chatId, session, update.message);
        return;
      }

      if (text.startsWith('/start')) {
        if (isDoctorBot) {
          await sendDoctorWelcomeMessage(token, chatId, firstName);
        } else {
          await sendPatientWelcomeMessage(token, chatId, firstName);
        }
      } else if (text.startsWith('/doctor')) {
        if (isDoctorBot) {
          await handleDoctorCabinetCommand(token, chatId);
        } else {
          await tgApi(token, 'sendMessage', {
            chat_id: chatId,
            text: `⚠️ <b>Ushbu bot faqat bemorlar uchun mo'ljallangan!</b>\n\nShifokor xizmatlari va navbatni boshqarish uchun shifokor yordamchi botimizga o'ting: @dstoma_doctor_bot`,
            parse_mode: 'HTML'
          });
        }
      } else {
        if (isDoctorBot) {
          const matchedDoctorId = Object.keys(g._doctorTelegramChats || {}).find(key => String(g._doctorTelegramChats[key]) === String(chatId));
          if (matchedDoctorId) {
            // Logged-in doctor typing free text → treat it as a patient-name lookup
            // for the AI pre-appointment summary feature.
            await handleDoctorPatientAiLookup(token, chatId, matchedDoctorId, text);
          } else {
            await tgApi(token, 'sendMessage', {
              chat_id: chatId,
              text: `ℹ️ <b>DStoma Shifokor Yordamchisi:</b>\n\nShaxsiy kabinetingizga kirish uchun /start yoki /doctor buyrug'ini yuboring. Kirgandan so'ng, bemor ismini yozsangiz — AI uning tibbiy tarixi bo'yicha qisqa xulosa beradi.`,
              parse_mode: 'HTML'
            });
          }
        } else {
          await handlePatientBotDiagnosticMessage(token, chatId, update.message, firstName);
        }
      }
    } else if (update.callback_query) {
      const queryId = update.callback_query.id;
      const chatId = update.callback_query.message.chat.id;
      const callbackData = update.callback_query.data;
      const firstName = update.callback_query.from.first_name || 'Bemor';

      await tgApi(token, 'answerCallbackQuery', { callback_query_id: queryId });

      if (isDoctorBot) {
        await handleDoctorCallbackQuery(token, chatId, callbackData, firstName);
      } else {
        await handleCallbackQuery(token, chatId, callbackData, firstName);
      }
    }
  } catch (err) {
    console.error("[Telegram Dynamic Router Error]:", err);
  }
}

async function handleDoctorCabinetCommand(token: string, chatId: number) {
  const matchedDoctorId = Object.keys(g._doctorTelegramChats || {}).find(key => String(g._doctorTelegramChats[key]) === String(chatId));
  if (matchedDoctorId) {
    await sendDoctorDashboard(token, chatId, matchedDoctorId, `👨‍⚕️ *Shifokor boshqaruv paneli:*`);
  } else {
    botSessions[sessionKey(token, chatId)] = { step: 'doctor_login' };
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `🔐 *DStoma Shifokor Autentifikatsiyasi*\n\nTizimda shifokor sifatida tasdiqlanish uchun shaxsiy login nomingizni kiriting:\n\n_(Masalan: \`umidjon\`, \`abdulaziz\` yoki \`sherzod\` )_`,
      parse_mode: 'Markdown'
    });
  }
}

// AI Yordamchi for the doctor bot: doctor types a patient's name, AI returns a
// concise pre-appointment summary of their real medical history (allergies,
// chronic conditions, past diagnoses/visits) — respects the same Premium/trial
// gate as the web app's AI features (see getClinicAiTrialAndTier).
async function handleDoctorPatientAiLookup(token: string, chatId: number, doctorId: string, queryText: string) {
  const query = queryText.trim();
  if (!query) return;

  const allDoctors = await getDoctors();
  const doctorObj: any = allDoctors.find((d: any) => d.id === doctorId);
  const clinicId = doctorObj?.clinicId;

  if (clinicId) {
    const { tier, daysLeftInTrial } = await getClinicAiTrialAndTier(clinicId);
    if (tier !== 'premium' && daysLeftInTrial <= 0) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `🔒 *AI Yordamchi — Premium xizmat*\n\nBemor tarixi bo'yicha AI xulosasi Premium obuna orqali ishlaydi. Bepul sinov muddati tugagan.`,
        parse_mode: 'Markdown'
      });
      return;
    }
  }

  const allPatients = await getPatients();
  const clinicPatients = allPatients.filter((p: any) => !clinicId || p.clinicId === clinicId);
  const matches = clinicPatients.filter((p: any) => (p.fullName || '').toLowerCase().includes(query.toLowerCase()));

  if (matches.length === 0) {
    await tgApi(token, 'sendMessage', { chat_id: chatId, text: `🔎 "${query}" ismli bemor topilmadi.` });
    return;
  }
  if (matches.length > 1) {
    const list = matches.slice(0, 5).map((p: any, i: number) => `${i + 1}. ${p.fullName} — ${p.phone || 'tel yo\'q'}`).join('\n');
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `Bir nechta mos bemor topildi, aniqroq ism yozing:\n\n${list}`
    });
    return;
  }

  const patient: any = matches[0];
  await tgApi(token, 'sendChatAction', { chat_id: chatId, action: 'typing' });

  const visits = (patient.clinicVisits || []).slice(-5);
  const diagnoses = (patient.diagnoses || []).slice(-5);
  const factsText = [
    `Ism: ${patient.fullName}`,
    `Qon guruhi: ${patient.bloodGroup || 'Nomalum'}`,
    `Allergiya: ${patient.allergies || "Yo'q"}`,
    `Surunkali kasalliklar: ${patient.chronicDiseases || "Yo'q"}`,
    `Yuqumli kasallik bor: ${patient.hasInfection ? 'Ha' : "Yo'q"}`,
    visits.length > 0 ? `So'ngi tashriflar: ${visits.map((v: any) => `${v.date?.slice(0, 10) || ''} — ${v.serviceName || ''} (Dr. ${v.doctorName || ''})`).join('; ')}` : "Avvalgi tashrif yo'q",
    diagnoses.length > 0 ? `So'ngi tashxislar: ${diagnoses.map((d: any) => `tish #${d.toothNumber}: ${d.diagnosticText || d.recommendedTreatment || ''}`).join('; ')}` : "Avvalgi tashxis yo'q",
  ].join('\n');

  const apiKey = await getGeminiApiKey(clinicId);
  const underDailyCap = !clinicId || (await checkAndConsumeAiUsage(clinicId));
  let summaryText = '';
  if (apiKey && underDailyCap) {
    try {
      const response = await callGemini({
        model: "gemini-2.5-flash",
        parts: [{ text: `Quyidagi bemor ma'lumotlari asosida shifokor uchun qabulga tayyorgarlik ko'rish maqsadida qisqa (100 so'zdan kam), aniq, professional xulosa yoz. O'zbek tilida yoz, faqat muhim klinik nuqtalarni ko'rsat:\n\n${factsText}` }],
        apiKey,
      });
      summaryText = response.text?.trim() || '';
    } catch (err) {
      console.error("[Doctor Bot AI Summary] Gemini call failed:", err);
    }
  }

  const text = `🧠 *AI Xulosasi — ${patient.fullName}*\n\n` +
    (summaryText || factsText) +
    `\n\n📞 Tel: \`${patient.phone || 'Nomalum'}\``;

  await tgApi(token, 'sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
}

let lastActiveDomain = "https://dstoma-queue.uz";

function getSecureWebAppUrl() {
  let url = process.env.APP_URL || lastActiveDomain || "https://dstoma-queue.uz";
  url = url.trim();
  if (url.startsWith("http://")) {
    url = url.replace("http://", "https://");
  }
  if (!url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}

async function sendPatientWelcomeMessage(token: string, chatId: number, firstName: string) {
  const text = `🦷 <b>DStoma Elektron Navbat Tizimiga xush kelibsiz!</b> 🦷\n\n` +
    `Assalomu alaykum, <b>${firstName}</b>! Ushbu rasmiy yordamchi bot orqali siz:\n` +
    `• Klinikalarda olingan navbatingiz holatini real vaqtda kuzatib borishingiz;\n` +
    `• Shifokor sizni chaqirganda bevosita telegramda tezkor xabar olishingiz;\n` +
    `• To'g'ridan-to'g'ri Telegram-da navbatga yozilishingiz mumkin.\n\n` +
    `🆔 Sizning Telegram <b>Chat ID</b> raqamingiz: <code>${chatId}</code>\n` +
    `<i>(Ushbu ID raqamni DStoma platformasida navbat olayotib kiriting)</i>\n\n` +
    `👇 Quyidagi tugmalardan birini tanlang yoki savolingiz bo'lsa bizga yozib yuboring (Gemini AI shifokorimiz javob beradi!):`;

  const webAppUrl = getSecureWebAppUrl();

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: "📱 DStoma Mini App-ni ochish",
          web_app: { url: webAppUrl }
        }
      ],
      [
        { text: "🔐 Tizimga Ulanish (Login)", callback_data: "patient_login" },
        { text: "📝 Ro'yxatdan O'tish", callback_data: "bot_register" }
      ],
      [
        { text: "🎟 Mening faol navbatim", callback_data: "my_queue" },
        { text: "➕ Yangi Navbat Olish", callback_data: "book_queue" }
      ],
      [
        { text: "🦷 AI Diagnostika", callback_data: "ai_help" }
      ],
      [
        { text: "🏥 Klinikalarimiz", callback_data: "list_clinics" },
        { text: "🖼 Web App QR Kodi", callback_data: "app_qr" }
      ],
      [
        { text: "ℹ️ Qo'llanma", callback_data: "patient_guide" }
      ]
    ]
  };

  await tgApi(token, 'sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup
  });
}

async function sendDoctorWelcomeMessage(token: string, chatId: number, firstName: string) {
  const text = `👨‍⚕️ <b>DStoma Shifokor Yordamchi Tizimiga xush kelibsiz!</b> 👨‍⚕️\n\n` +
    `Assalomu alaykum, <b>${firstName}</b>! Ushbu maxsus yordamchi bot faqat DStoma shifokorlari uchun mo'ljallangan.\n\n` +
    `<b>Bot orqali quyidagilarni amalga oshirishingiz mumkin:</b>\n` +
    `• 🔄 Yangi bemor navbatga yozilganda tezkor bildirishnoma olish;\n` +
    `• 📢 Bemorlarni bevosita xonaga chaqirish, navbat to'liq yakunlash va bekor qilish;\n` +
    `• 📊 Kabinet holati va navbat kutish ro'yxatini istalgan joydan real vaqtda boshqarish;\n` +
    `• 🧠 Tizimga kirgandan so'ng, bemor ismini yozib AI orqali uning tibbiy tarixi xulosasini olish.\n\n` +
    `🆔 Sizning Telegram <b>Chat ID</b> raqamingiz: <code>${chatId}</code>\n\n` +
    `👇 Tizimdan to'liq foydalanish va shaxsiy kabinetingizga ulanish uchun quyidagi tugmalardan birini tanlang yoki o'zingizni authentication qiling (shifokor sifatida login/password kiriting):`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: "🔐 Shifokor Login / Tizimga Ulanish", callback_data: "doctor_cabinet" }
      ],
      [
        { text: "ℹ️ Qo'llanma", callback_data: "guide" }
      ]
    ]
  };

  await tgApi(token, 'sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup
  });
}

async function handleRegistrationStep(token: string, chatId: number, session: any, message: any) {
  const text = message.text || '';
  
  if (session.step === 'register_name') {
    if (!text || text.trim().length < 3) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Iltimos, ism va familiyangizni to'liqroq yozing (kamida 3 ta harf):"
      });
      return;
    }
    session.tempUser.fullName = text.trim();
    session.step = 'register_phone';
    
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `📱 *DStoma Tezkor Ro'yxatdan O'tish (2/5):* \n\n` +
        `Rahmat, *${session.tempUser.fullName}*!\n\n` +
        `Endi mobil telefon raqamingizni kiriting (Masalan: \`+998901234567\`) yoki pastdagi *'📱 Telefon raqamni ulashish'* tugmasini bosing:`,
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: "📱 Telefon raqamni ulashish", request_contact: true }]
        ],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });

  } else if (session.step === 'register_phone') {
    let phone = '';
    if (message.contact && message.contact.phone_number) {
      phone = message.contact.phone_number;
    } else if (text) {
      phone = text.trim();
    }

    if (!phone) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Iltimos, telefon raqamingizni kiriting yoki '📱 Telefon raqamni ulashish' tugmasini bosing:"
      });
      return;
    }

    // format phone nicely
    phone = phone.replace(/[\s\(\)\-]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.length === 9) phone = '+998' + phone;
      else if (phone.length === 12) phone = '+' + phone;
      else phone = '+' + phone;
    }

    session.tempUser.phone = phone;
    session.step = 'register_passport';

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `📇 *DStoma Tezkor Ro'yxatdan O'tish (3/5):* \n\n` +
        `Telefon raqam qabul qilindi: \`${phone}\`\n\n` +
        `Iltimos, pasport seriyasi va raqamingizni kiriting (masalan: AA1234567):`,
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });

  } else if (session.step === 'register_passport') {
    if (!text || text.trim().length < 5) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Pasport seriyasi va raqami yaroqsiz yoki juda qisqa. Iltimos qayta urinib ko'ring (Masalan: AA1234567):"
      });
      return;
    }
    const passport = text.trim().toUpperCase();
    
    // Check if passport is already used
    const patDb = await getPatients();
    const duplicate = patDb.find((p: any) => p.passportSerial.toUpperCase() === passport);
    if (duplicate) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `⚠️ Ma'lumot xatosi! \`${passport}\` pasport raqami bilan bemor allaqachon ro'yxatdan o'tgan. Iltimos boshqa pasport kiriting:`
      });
      return;
    }

    session.tempUser.passportSerial = passport;
    session.step = 'register_password';

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `🔑 *DStoma Tezkor Ro'yxatdan O'tish (4/5):* \n\n` +
        `Pasport kiritildi: \`${passport}\`\n\n` +
        `Kelajakda shaxsiy kabinetga kirishda foydalanish uchun xavfsiz parol yozib yuboring (kamida 4 ta belgi):`,
      parse_mode: 'Markdown'
    });

  } else if (session.step === 'register_password') {
    if (!text || text.trim().length < 4) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Parol kamida 4 ta belgidan iborat bo'lishi kerak. Iltimos parolni yozing:"
      });
      return;
    }
    
    session.tempUser.password = text.trim();
    session.step = 'register_blood';

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "I (O) Rh+", callback_data: `reg_blood_I+` },
          { text: "I (O) Rh-", callback_data: `reg_blood_I-` }
        ],
        [
          { text: "II (A) Rh+", callback_data: `reg_blood_II+` },
          { text: "II (A) Rh-", callback_data: `reg_blood_II-` }
        ],
        [
          { text: "III (B) Rh+", callback_data: `reg_blood_III+` },
          { text: "III (B) Rh-", callback_data: `reg_blood_III-` }
        ],
        [
          { text: "IV (AB) Rh+", callback_data: `reg_blood_IV+` },
          { text: "IV (AB) Rh-", callback_data: `reg_blood_IV-` }
        ]
      ]
    };

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `🩸 *DStoma Tezkor Ro'yxatdan O'tish (5/5):* \n\n` +
        `So'nggi qadam! Iltimos, qon guruhingizni tanlang:`,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup
    });
  } else if (session.step === 'doctor_login') {
    if (!text || text.trim().length === 0) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Iltimos, login nomingizni to'g'ri kiriting:"
      });
      return;
    }
    session.tempDoctorLogin = text.trim().toLowerCase();
    session.step = 'doctor_password';
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: "🔑 Endi shaxsiy mahfiy parolingizni kiriting:"
    });
  } else if (session.step === 'doctor_password') {
    if (!text || text.trim().length === 0) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Iltimos, parolingizni kiriting:"
      });
      return;
    }
    const loginVal = session.tempDoctorLogin;
    const pwdVal = text.trim();
    
    const serverDoctors = await getDoctors();
    const doc = serverDoctors.find((d: any) => d.login.toLowerCase() === loginVal && verifyPassword(pwdVal, d.password));
    
    if (doc) {
      g._doctorTelegramChats[doc.id] = String(chatId);
      delete botSessions[sessionKey(token, chatId)];
      
      const successText = `🎉 *Tizimga muvaffaqiyatli kirdingiz!* 🎉\n\n` +
        `👨‍⚕️ *Shifokor:* Dr. *${doc.name}*\n` +
        `🦷 *Mutaxassislik:* ${doc.specialty}\n\n` +
        `✅ Ushbu Telegram profilingiz endi shaxsiy DStoma shifokor kabinetingizga ulandi! Yangi bemorlar yozilganda shu yerda xabarnomalar olasiz va navbatlarni boshqara olasiz.`;
      
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: successText,
        parse_mode: 'Markdown'
      });
      
      await sendDoctorDashboard(token, chatId, doc.id, `📋 *Shifokor boshqaruv paneli:*`);
    } else {
      session.step = 'doctor_login';
      delete session.tempDoctorLogin;
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "❌ *Login yoki parol xato!* Iltimos, login nomingizni qaytadan kiriting:"
      });
    }
  } else if (session.step === 'patient_login_passport') {
    if (!text || text.trim().length < 5) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Pasport formati noto'g'ri. Iltimos qaytadan kiriting (Masalan: AA1234567):"
      });
      return;
    }
    const passport = text.trim().toUpperCase();
    const patDb = await getPatients();
    const pat = patDb.find((p: any) => p.passportSerial?.toUpperCase() === passport);
    if (!pat) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `❌ Bunday pasport seriya bilan ro'yxatdan o'tgan bemor topilmadi.\nIltimos, qaytadan urinib ko'ring yoki "Ro'yxatdan o'tish" tugmasini ishlating.`
      });
      return;
    }
    session.tempPatientId = pat.id;
    session.step = 'patient_login_password';
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `🔑 *Parolni kiriting:*\n\nIltimos, DStoma tizimidagi shaxsiy parolingizni yozib yuboring:`,
      parse_mode: 'Markdown'
    });
  } else if (session.step === 'patient_login_password') {
    if (!text || text.trim().length === 0) {
      await tgApi(token, 'sendMessage', { chat_id: chatId, text: "⚠️ Iltimos, parolingizni kiriting:" });
      return;
    }
    const patDb = await getPatients();
    const pat = patDb.find((p: any) => p.id === session.tempPatientId);
    if (pat && verifyPassword(text.trim(), pat.password)) {
      pat.telegramChatId = String(chatId);
      await savePatient(pat);
      delete botSessions[sessionKey(token, chatId)];

      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `🎉 *Tizimga muvaffaqiyatli ulandingiz!*\n\n` +
          `👤 *Bemor:* ${pat.fullName}\n` +
          `Endi navbatingiz o'zgarganda bu yerda xabarnomalar olasiz! Siz menyu orqali yangi navbatlar band qilishingiz ham mumkin.`,
        parse_mode: 'Markdown'
      });
    } else {
      session.step = 'patient_login_passport';
      delete session.tempPatientId;
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `❌ *Parol xato!* Iltimos, boshidan boshlab parport raqamingizni qaytadan kiriting:`
      });
    }
  } else if (session.step === 'book_queue_complaint') {
    const complaint = text === '⏭ O\'tkazib yuborish' ? '' : text.trim();
    const clinicId = session.tempUser?.clinicId;
    const doctorId = session.tempUser?.doctorId;
    delete botSessions[sessionKey(token, chatId)]; // form submitted

    if (!clinicId || !doctorId) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "❌ Sessiya muddati tugagan. Iltimos, /start orqali qaytadan urinib ko'ring."
      });
      return;
    }
    // Process queue creation
    await proceedQueueBooking(token, chatId, clinicId, doctorId, complaint);
  } else if (session.step === 'awaiting_receipt_photo') {
    const photo = message.photo;
    if (!photo || photo.length === 0) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Iltimos, to'lov chekini rasm (screenshot/surat) sifatida yuboring."
      });
      return;
    }
    try {
      const largest = photo[photo.length - 1];
      const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${largest.file_id}`);
      const fileInfo = await fileInfoRes.json();
      if (!fileInfo.ok || !fileInfo.result?.file_path) {
        throw new Error("Failed to resolve Telegram file path");
      }
      const downloadUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.result.file_path}`;
      const imageRes = await fetch(downloadUrl);
      const buffer = await imageRes.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      const ext = fileInfo.result.file_path.split('.').pop() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const receipt = {
        id: 'receipt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        clinicId: session.receiptClinicId || 'samarqand',
        doctorId: session.receiptDoctorId,
        patientId: session.receiptPatientId,
        patientName: session.receiptPatientName || 'Bemor',
        queueId: session.receiptQueueId,
        imageData: `data:${mimeType};base64,${base64Data}`,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      await savePaymentReceipt(receipt);

      const doctorChatId = g._doctorTelegramChats?.[session.receiptDoctorId || ''];
      if (doctorChatId) {
        const doctorBotToken = activeDoctorBotToken;
        if (doctorBotToken) {
          try {
            await tgApi(doctorBotToken, 'sendPhoto', {
              chat_id: doctorChatId,
              photo: largest.file_id,
              caption: `💳 *Yangi to'lov cheki keldi!*\n\n👤 Bemor: ${receipt.patientName}\n\nSozlamalar > To'lov tizimlari bo'limida ko'rib chiqib tasdiqlashingiz mumkin.`,
              parse_mode: 'Markdown'
            });
          } catch (e) {
            console.warn("[Payment Receipt] Failed to notify doctor via Telegram:", e);
          }
        }
      }

      delete botSessions[sessionKey(token, chatId)];
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "✅ To'lov chekingiz qabul qilindi va shifokorga yuborildi. Tasdiqlangach sizga xabar beramiz."
      });
    } catch (err) {
      console.error("[Telegram] Payment receipt upload error:", err);
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Chekni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
      });
    }
  }
}

// Books a real queue ticket against the clinic/doctor the patient actually picked
// (their real database records — no hardcoded fake branches/doctors). This calls
// saveQueue() directly in-process instead of the previous self-fetch to
// http://127.0.0.1:3000/api/queues, which only ever worked in local dev — on Vercel
// nothing listens on that address (there's no app.listen() there), so every booking
// attempt from the bot silently failed in production.
async function proceedQueueBooking(token: string, chatId: number, clinicId: string, doctorId: string, complaint: string) {
  await tgApi(token, 'sendMessage', {
    chat_id: chatId,
    text: "⚡ *DStoma Elektron Navbat Serveriga chipta so'rovi yuborilmoqda, iltimos kuting...*"
  });

  try {
    const [patDb, clinicsDb, doctorsDb, qDb] = await Promise.all([getPatients(), getClinics(), getDoctors(), getQueues()]);
    const existingPat = patDb.find((p: any) => String(p.telegramChatId || '') === String(chatId));
    const clinicObj = clinicsDb.find((c: any) => c.id === clinicId);
    const doctorObj = doctorsDb.find((d: any) => d.id === doctorId);

    if (!clinicObj || !doctorObj) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `❌ Tanlangan klinika yoki shifokor topilmadi. Iltimos, /start orqali qaytadan urinib ko'ring.`
      });
      return;
    }

    const patientName = existingPat ? existingPat.fullName : `Bot Bemor`;
    const patientPhone = existingPat ? existingPat.phone : `+998(BOT)${chatId.toString().slice(-6)}`;
    const passportSerial = existingPat ? existingPat.passportSerial : '';
    const ticketNo = qDb.filter((item: any) => item.clinicId === clinicId).length + 104;

    const newQueueItem: QueueItem = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      clinicId,
      doctorId,
      serviceId: '', // the bot doesn't offer service selection (yet) — left blank rather than a fake id
      patientName,
      patientPhone,
      passportSerial,
      telegramChatId: String(chatId),
      number: ticketNo,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    if (complaint) newQueueItem.complaint = complaint;

    await saveQueue(newQueueItem);

    const successText = `🎉 *Muvaffaqiyatli navbatga yozildingiz!* 🎉\n\n` +
      `🎫 *Smart E-Ticket: #${ticketNo}*\n` +
      `👤 Bemor: *${patientName}*\n` +
      `🏥 Klinikangiz: *${clinicObj.name}*\n` +
      `👨‍⚕️ Shifokor: *${doctorObj.name}*\n` +
      (complaint ? `💬 Shikoyat: *${complaint}*\n` : '') +
      `\nUshbu elektron ro'yxat raqami orqali klinika qabulxonasida yoki *Mening navbatim* menyusi orqali tasdiqlash jarayonlarini kuzatib borishingiz mumkin.`;

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: successText,
      parse_mode: 'Markdown'
    });

    // Notify the assigned doctor's own bot chat, if they're logged in there — same
    // notification the web app's booking flow triggers via POST /api/queues.
    const docChatId = (globalThis as any)._doctorTelegramChats?.[doctorId];
    if (docChatId) {
      const doctorMsg = `🔔 *YANGI BEMOR NAVBATGA YOZILDI!* 🔔\n\n` +
        `🎫 *Chipta raqami:* #${ticketNo}\n` +
        `👤 *Bemor:* ${patientName}\n` +
        `📞 *Telefon:* \`${patientPhone}\`\n` +
        (complaint ? `📝 *Izoh:* _${complaint}_\n` : '') +
        `⏳ *Holati:* Navbatda kutmoqda`;
      sendDoctorDashboard(activeDoctorBotToken, Number(docChatId), doctorId, doctorMsg).catch(e => {
        console.error("[Doctor Notify Warn]", e);
      });
    }

    // Return to main menu
    await sendPatientWelcomeMessage(token, chatId, patientName);
  } catch (error: any) {
    console.error("[Bot] create queue error", error.message);
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `❌ *Navbat yaratishda xatolik yuz berdi!* Iltimos keyinroq qayta urinib ko'ring.`
    });
  }
}



function getBotSimulatedReply(text: string, hasImage: boolean): string {
  const t = text.toLowerCase();
  if (hasImage) {
    return `📸 *DStoma Shifokor AI Referensi:*\n\n` +
      `Siz yuklagan tasvir tahliliga ko'ra tish emalining o'rta darajali emirilishi va milklar atrofida bir oz shishish/qizarish (gingivit yoki periodontit boshlang'ich bosqichi) belgilari aniqlandi.\n\n` +
      `*🩺 Shifokor uchun klinik tavsiyalar:* \n` +
      `• Klinik dental professional gigiyenik tozalash;\n` +
      `• Mahalliy antiseptik terapiya (Xlorgeksidin diglyukonat 0.12% chayish);\n` +
      `• Reminerallash va ftorlash muolajalari tavsiya etiladi.`;
  }
  return `🩺 *DStoma Shifokor Klinik Ko'makchisi:*\n\n` +
    `Siz so'ragan so'rov buyicha klinik ma'lumotlar tahlili: "${text || 'Karyes tahlili'}"\n\n` +
    `Bizning AI yordamchimiz shifokorlar uchun professional patologiyalar, dori dozalari, terapevtik hamda jarrohlik operatsiyalari rejalashtirish bo'yicha tezkor ma'lumotlarni topib beradi. Iltimos shaxsiy kabinetingizga ulaning!`;
}


async function handlePatientBotDiagnosticMessage(token: string, chatId: number, message: any, firstName: string) {
  const text = message.text || message.caption || '';
  const photo = message.photo;

  await tgApi(token, 'sendChatAction', { chat_id: chatId, action: 'typing' });

  try {
    let imagePart: any = null;
    if (photo && photo.length > 0) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚡ *DStoma AI Diagnostika:* Yuklangan dental tasviringiz yuklab olinmoqda va skaner qilinmoqda, iltimos ozgina kuting..."
      });
      const largest = photo[photo.length - 1];
      const fileId = largest.file_id;
      const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
      const fileInfo = await fileInfoRes.json();
      if (fileInfo.ok && fileInfo.result && fileInfo.result.file_path) {
        const filePath = fileInfo.result.file_path;
        const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
        const imageRes = await fetch(downloadUrl);
        const buffer = await imageRes.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const ext = filePath.split('.').pop() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        imagePart = { inlineData: { mimeType: mimeType, data: base64Data } };
      }
    }

    if (!text && !imagePart) return;

    const systemPrompt = `You are an expert robotic AI dental scientist operating in DStoma Digital Hub. You analyze dental questions, symptoms, and human teeth/mouth photos/x-rays. You talk directly to patient named ${firstName}. Respond in Uzbek (unless they write in Russian or English). Be warm, precise, professional, and very helpful. Format with bullet points where necessary. Keep the answer under 150 words. Always include a reminder that AI diagnostics is estimated and you must schedule/consult real dentists at DStoma.`;
    const userPrompt = text ? text : "Diagnose this uploaded tooth/mouth photo and give preventative dental advice.";

    let response;
    const botApiKey = await getGeminiApiKey(); // no clinic context here — platform-wide key
    // This channel has no resolvable clinicId, so it can't use the per-clinic daily
    // cap — instead it gets its own per-chat daily cap + a short cooldown, so no
    // single Telegram user can drain the shared platform key for free.
    const underChatCap = !isChatAiOnCooldown(chatId) && checkAndConsumeChatAiUsage(chatId);
    if (botApiKey && underChatCap) {
      const parts: any[] = [];
      if (imagePart) {
        parts.push(imagePart);
        parts.push({ text: `Analyze this tooth image for symptoms, fractures, decay, or gum issues, and respond to: "${userPrompt}"\n\nSystem Instruction: ${systemPrompt}` });
      } else {
        parts.push({ text: `Analyze this question: "${userPrompt}"\n\nSystem Instruction: ${systemPrompt}` });
      }
      try {
        response = await callGemini({ model: "gemini-2.5-flash", parts, apiKey: botApiKey });
      } catch (err) {
        console.error("[Telegram Patient Bot] Gemini call failed:", err);
      }
    }

    const replyText = response?.text || getPatientBotSimulatedReply(userPrompt, !!imagePart);

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: replyText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 DStoma Mini App-ni ochish", web_app: { url: getSecureWebAppUrl() } }],
          [{ text: "📝 Bot orqali Navbat Olish", callback_data: "book_queue" }]
        ]
      }
    });
  } catch (err) {
    console.error("[Telegram Patient Bot AI Diagnostics Error]:", err);
    const fallbackText = getPatientBotSimulatedReply(text, !!photo);
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: fallbackText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 DStoma Mini App-ni ochish", web_app: { url: getSecureWebAppUrl() } }],
          [{ text: "📝 Bot orqali Navbat Olish", callback_data: "book_queue" }]
        ]
      }
    });
  }
}

function getPatientBotSimulatedReply(text: string, hasImage: boolean): string {
  const t = text.toLowerCase();
  if (hasImage) {
    return `📸 *DStoma AI Diagnostika tahlili:*\n\n` +
      `Siz yuklagan rasm tahliliga ko'ra tish emalining o'rta darajali shikastlanishi va milklar atrofida bir oz qizarish (gingivit boshlang'ich alomati) sezilmoqda.\n\n` +
      `*🛡 Tavsiyalar:* \n` +
      `• Yumshoq cho'tkada va kalsiy-ftorli pastalardan foydalaning;\n` +
      `• Shifokor ko'rigi uchun navbat band eting.\n\n` +
      `⚠️ Muolajadan oldin tish shifokori bilan batafsil maslahatlashing.`;
  }
  if (t.includes('og\'riq') || t.includes('ogriq') || t.includes('shash') || t.includes('tish')) {
    return `🩺 *DStoma AI Diagnostika:*\n\n` +
      `Tish sohasidagi og'riq yoki qattiq sezuvchanlik paydo bo'lishiga pulpada yoki tish ildiz kanalida asab tolasining yallig'lanishi sabab bo'lishi mumkin.\n\n` +
      `*🛡 Shoshilinch maslahatlar:* \n` +
      `• Issiq va sovuqdan butunlay saqlaning;\n` +
      `• Tuz va soda aralashmasi bilan iliq suvda og'izni chaying;\n` +
      `• DStoma xizmatidan foydalangan holda navbat oling.`;
  }
  return `👋 *Assalomu alaykum! Men DStoma virtual stomatolog yordamchisiman.*\n\n` +
    `Sizning savolingiz: "${text || 'Bo\'sh'}"\n\n` +
    `Menga tishingiz yoki milklaringiz rasmini yuborishingiz yoki savolingizni yozishingiz mumkin. Men ularni tahlil qilib, tibbiy maslahat beraman.`;
}

async function handleDoctorCallbackQuery(token: string, chatId: number, callbackData: string, firstName: string) {
  if (callbackData === 'doctor_cabinet') {
    await handleDoctorCabinetCommand(token, chatId);
    return;
  }

  if (callbackData.startsWith('doc_call_next_')) {
    const docId = callbackData.replace('doc_call_next_', '');
    const qDb = await getQueues();
    const pendingItem = qDb.find((q: any) => q.doctorId === docId && q.status === 'pending');
    if (pendingItem) {
      pendingItem.status = 'calling';
      await saveQueue(pendingItem);
      if (pendingItem.telegramChatId) {
        await sendBgTelegramMessage(pendingItem.telegramChatId, `🔔 *CHIPTANGIZ KELDI!* 🔔\n\nAssalomu alaykum! Sizni shifokor hozir kabinetda kutmoqda. Kechikmasdan kirishingiz so'raladi. 🦷\n🎫 Chiptangiz: *#${pendingItem.number}*`, pendingItem.clinicId);
      }
      await sendDoctorDashboard(token, chatId, docId, `🔔 *#${pendingItem.number} - ${pendingItem.patientName}* xonaga chaqirildi! Bemorga xabarnoma yuborildi.`);
    } else {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Kutayotgan navbatlar ro'yxatida hech kim yo'q!"
      });
    }
    return;
  }

  if (callbackData.startsWith('doc_complete_active_')) {
    const docId = callbackData.replace('doc_complete_active_', '');
    const qDb = await getQueues();
    const callingItem = qDb.find((q: any) => q.doctorId === docId && q.status === 'calling');
    if (callingItem) {
      callingItem.status = 'completed';
      await saveQueue(callingItem);
      await deductMaterialsForCompletedQueue(callingItem);
      if (callingItem.telegramChatId) {
        await sendBgTelegramMessage(callingItem.telegramChatId, `✅ *Rahmat!* \n\nShifokor ko'rigi muvaffaqiyatli yakunlandi. Salomat bo'ling! Iltimos, shaxsiy kabinetingizda shifokorga baho bering. ⭐`, callingItem.clinicId);
      }
      await sendDoctorDashboard(token, chatId, docId, `✅ *#${callingItem.number} - ${callingItem.patientName}* qabuli muvaffaqiyatli yakunlandi.`);
    } else {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Faol qabul qilinayotgan bemor topilmadi!"
      });
    }
    return;
  }

  if (callbackData.startsWith('doc_cancel_active_')) {
    const docId = callbackData.replace('doc_cancel_active_', '');
    const qDb = await getQueues();
    const callingItem = qDb.find((q: any) => q.doctorId === docId && q.status === 'calling');
    if (callingItem) {
      callingItem.status = 'cancelled';
      await saveQueue(callingItem);
      if (callingItem.telegramChatId) {
        await sendBgTelegramMessage(callingItem.telegramChatId, `❌ *Diqqat!* \n\nSizning *#${callingItem.number}* sonli navbatingiz bekor qilindi.`, callingItem.clinicId);
      }
      await sendDoctorDashboard(token, chatId, docId, `❌ *#${callingItem.number} - ${callingItem.patientName}* navbati bekor qilindi.`);
    } else {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Bekor qilish uchun faol qabul qilinayotgan bemor topilmadi!"
      });
    }
    return;
  }

  if (callbackData.startsWith('doc_refresh_')) {
    const docId = callbackData.replace('doc_refresh_', '');
    await sendDoctorDashboard(token, chatId, docId, `🔄 Kabinet holati va navbatlar ro'yxati yangilandi!`);
    return;
  }

  if (callbackData.startsWith('doc_logout_')) {
    const docId = callbackData.replace('doc_logout_', '');
    delete g._doctorTelegramChats[docId];
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: "🚪 Shifokor shaxsiy profilidan chiqdingiz!"
    });
    await sendDoctorWelcomeMessage(token, chatId, firstName);
    return;
  }

  if (callbackData === 'guide') {
    const text = "ℹ️ *DStoma - Shifokorlar uchun Botdan foydalanish qo'llanmasi:*\n\n" +
      "1️⃣ Telegram botni shaxsiy shifokor kabinetingizga ulash uchun `🔐 Shifokor Login / Tizimga Ulanish` tugmasini bosing yoki `/doctor` buyrug'ini yuboring.\n" +
      "2️⃣ Tizimdagi ro'yxatdan o'tgan login va parolingizni kiriting.\n" +
      "3️⃣ Ulanish muvaffaqiyatli amalga oshgach, profilingiz avtomatik tarzda bog'lanadi.\n" +
      "4️⃣ Endi yangi bemorlar navbatga yozilganda shu yerda tezkor bildirishnomalar olasiz va navbatni bevosita boshqarishingiz mumkin.\n\n" +
      "👨‍⚕️ _DStoma zamonaviy tibbiyot tizimi ish faoliyatingizni osonlashtirishga yordam beradi!_";

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
  }
}

async function handleCallbackQuery(token: string, chatId: number, callbackData: string, firstName: string) {
  if (callbackData === 'patient_login') {
    const patDb = await getPatients();
    const existing = patDb.find((p: any) => String(p.telegramChatId || '') === String(chatId));
    if (existing) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `✅ *Siz allaqachon tizimga ulanib bo'lgansiz!*\n\n` +
          `👤 *Ismingiz:* ${existing.fullName}\n` +
          `📞 *Telefon:* ${existing.phone}\n` +
          `📇 *Pasport:* ${existing.passportSerial}\n\n` +
          `Siz bemalol navbat olishingiz yoki holatini kuzatishingiz mumkin.`,
        parse_mode: 'Markdown'
      });
      return;
    }

    botSessions[sessionKey(token, chatId)] = { step: 'patient_login_passport' };
    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `🔐 *Tizimga Ulanish (Login):* \n\nIltimos, DStoma tizimidagi qayd etilgan *Pasport seriya va raqamingizni* kiriting (masalan: AA1234567):`,
      parse_mode: 'Markdown'
    });
    return;
  }

  if (callbackData === 'bot_register') {
    // Check if patient exists
    const patDb = await getPatients();
    const existing = patDb.find((p: any) => String(p.telegramChatId || '') === String(chatId));
    if (existing) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `🏥 *Siz allaqachon ro'yxatdan o'tgansiz!* \n\n` +
          `👤 *Ismingiz:* ${existing.fullName}\n` +
          `📞 *Telefon:* ${existing.phone}\n` +
          `📇 *Pasport:* ${existing.passportSerial}\n` +
          `🩸 *Qon guruhi:* ${existing.bloodGroup}\n\n` +
          `Shaxsiy kabinetga kirishda ushbu pasportingizdan foydalaning.`,
        parse_mode: 'Markdown'
      });
      return;
    }

    botSessions[sessionKey(token, chatId)] = {
      step: 'register_name',
      tempUser: {
        id: 'pat_tg_' + Date.now(),
        clinicId: 'samarqand',
        telegramChatId: String(chatId),
        bloodGroup: 'I+'
      }
    };

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: `📝 *DStoma Tezkor Ro'yxatdan O'tish boshlandi (1/5):* \n\n` +
        `Iltimos, o'zingizning to'liq ism, familiyangizni (F.I.SH.) kiriting:\n` +
        `_(Masalan: Umidjon Egamov)_`,
      parse_mode: 'Markdown'
    });
    return;
  }

  if (callbackData.startsWith('reg_blood_')) {
    const blood = callbackData.replace('reg_blood_', '');
    const session = botSessions[sessionKey(token, chatId)];
    if (session && session.tempUser) {
      session.tempUser.bloodGroup = blood;

      // Bot registration doesn't ask which clinic the patient belongs to (unlike the
      // web app), so fall back to the first real clinic rather than a fake id that
      // doesn't exist in the database.
      const defaultClinicId = session.tempUser.clinicId || (await getClinics())[0]?.id || '';

      const finalPatient: Patient = {
        id: session.tempUser.id || 'pat_' + Date.now(),
        clinicId: defaultClinicId,
        fullName: session.tempUser.fullName || 'Telegram Bemor',
        passportSerial: session.tempUser.passportSerial || 'AA0000000',
        phone: session.tempUser.phone || '',
        birthDate: '1995-01-01',
        password: session.tempUser.password || '123456',
        bloodGroup: session.tempUser.bloodGroup || 'I+',
        telegramChatId: String(chatId)
      };

      await savePatient(finalPatient);
      delete botSessions[sessionKey(token, chatId)];

      const successText = `🎉 *Tabriklaymiz, ro'yxatdan o'tish muvaffaqiyatli yakunlandi!* 🎉\n\n` +
        `👤 *Ism, Familiya:* ${finalPatient.fullName}\n` +
        `📞 *Telefon:* ${finalPatient.phone}\n` +
        `📇 *Pasport:* ${finalPatient.passportSerial}\n` +
        `🩸 *Qon guruhi:* ${finalPatient.bloodGroup}\n\n` +
        `✅ Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!\n\n` +
        `🔒 *Ushbu Telegram profil avtomatik ravishda DStoma tizimi bilan integratsiya qilindi!* Endi veb/mobil ilovada 'Kabinet' sahifasiga kirganingizda ushbu ma'lumotlar foydalanuvchini tizimga kiritadi. Rahmat!`;

      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: successText,
        parse_mode: 'Markdown'
      });
    }
    return;
  }

  if (callbackData === 'list_clinics') {
    try {
      const clinics = await getClinics();
      let text = "🏥 *Bizning faol Stomatologiya klinikalarimiz:* \n\n";
      if (Array.isArray(clinics) && clinics.length > 0) {
        clinics.forEach((c: any, idx: number) => {
          text += `${idx + 1}. *${c.name}*\n📍 ${c.address || 'Manzil berilmagan'}\n📞 ${c.phone || 'Telefon berilmagan'}\n\n`;
        });
      } else {
        text += "Hozircha tizimda klinikalar mavjud emas.";
      }
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error("[Bot] list_clinics error", err);
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "❌ Klinikalar ro'yxatini yuklab bo'lmadi. Birozdan so'ng qayta urinib ko'ring."
      });
    }
  } else if (callbackData === 'list_doctors') {
    try {
      const doctors = await getDoctors();
      let text = "👨‍⚕️ *Bizning professional shifokorlarimiz:* \n\n";
      if (Array.isArray(doctors) && doctors.length > 0) {
        doctors.slice(0, 10).forEach((d: any) => {
          text += `• *${d.name || 'Noma\'lum shifokor'}*\n 🦷 Mutaxassisligi: ${d.specialty || 'Stomatolog-Terapevt'}\n ⭐ Reytingi: ${(d.rating || 5).toFixed ? d.rating.toFixed(1) : d.rating || '5.0'}\n\n`;
        });
      } else {
        text += "Hozircha shifokorlar ro'yxati yuklanmadi.";
      }
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error("[Bot] list_doctors error", err);
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "❌ Shifokorlar ro'yxatini yuklab bo'lmadi. Birozdan so'ng qayta urinib ko'ring."
      });
    }
  } else if (callbackData === 'list_services') {
    const text = "💸 *Tibbiy Xizmatlarimiz va Standart Narxlari (UZS):*\n\n" +
      "🦷 *Samarqand filiali:* \n" +
      " • Konsultatsiya — 50,000 so'm\n" +
      " • Tish tozalash — 250,000 so'm\n" +
      " • Plomba qo'yish — 400,000 so'm\n" +
      " • Tish sug'urish — 150,000 so'm\n\n" +
      "🩺 *Buxoro / Farg'ona filiali:* \n" +
      " • Konsultatsiya uchrashuvi — 45,000 so'm\n" +
      " • Plomba Qoyish — 200,000 so'm\n" +
      " • Kanal Tozalash va To'ldirish — 350,050 so'm\n" +
      " • Shved uslubida Oqartirish — 1,200,000 so'm\n\n" +
      "🏬 *Toshkent Premium Smart binosi:* \n" +
      " • Ortodont diagnoz va Ko'rik — 80,000 so'm\n" +
      " • Keramik Vinir (1 ta tish) — 3,000,000 so'm\n" +
      " • Dental Implantatsiya (Premium) — 4,200,000 so'm\n" +
      " • Sirkoniy Koronka qo'yish — 1,800,000 so'm\n\n" +
      "💡 _Navbat olish va ushbu xizmatlardan foydalanish uchun quyidagi tugmani bosing:_";

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: "📝 Navbatchilikni Band Qilish", callback_data: "book_queue" }]]
      }
    });

  } else if (callbackData === 'my_queue') {
    try {
      const patDb = await getPatients();
      const existingPat = patDb.find((p: any) => String(p.telegramChatId || '') === String(chatId));

      const queues = await getQueues();

      const myQueues = Array.isArray(queues)
        ? queues.filter((q: any) => {
            const isChatMatch = String(q.telegram_chat_id || q.telegramChatId) === String(chatId);
            const isPassportMatch = existingPat && existingPat.passportSerial && String(q.passport_serial || q.passportSerial) === existingPat.passportSerial;
            return isChatMatch || isPassportMatch;
          })
        : [];

      if (myQueues.length > 0) {
        let text = "🎟 *Sizning active navbatlaringiz (Active Tickets):* \n\n";
        myQueues.forEach((q: any) => {
          const statusMap: Record<string, string> = {
            'pending': '⏳ Navbatingizni kuting',
            'calling': '🔔 Sizni Shifokor xonaga Chaqirmoqda!',
            'in_progress': '🩺 Hozir qabuldasiz',
            'completed': '✅ Tamomlangan',
            'cancelled': '❌ Bekor qilingan'
          };
          const rawStatus = q.is_completed ? 'completed' : q.status;
          const statusText = statusMap[rawStatus] || '⏳ Kutish kutilmoqda';

          text += `🎫 *Chipta: #${q.number}*\n` +
            `👤 Patient: ${q.patient_name || q.patientName}\n` +
            `🩺 Holati: *${statusText}*\n` +
            `📅 Vaqti: ${new Date(q.created_at || q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n`;
        });

        const receiptButtons = myQueues
          .filter((q: any) => q.doctorId || q.doctor_id)
          .slice(0, 5)
          .map((q: any) => ([{ text: `💳 #${q.number} uchun to'lov chekini yuborish`, callback_data: `send_receipt_${q.id}` }]));

        await tgApi(token, 'sendMessage', {
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
          ...(receiptButtons.length > 0 ? { reply_markup: { inline_keyboard: receiptButtons } } : {})
        });
      } else {
        await tgApi(token, 'sendMessage', {
          chat_id: chatId,
          text: `Sizda hozircha faol chipta/navbat topilmadi.\n\nDStoma veb ilovasiga o'ting va navbat olayotib ushbu Telegram Chat ID ni kiriting: \`${chatId}\`\nShundan so'ng navbatingiz o'zgarganda bot sizga bir zumda bildirishnomalar yubora boshlaydi! 🚀`,
          parse_mode: 'Markdown'
        });
      }
    } catch (err) {
      console.error("[Bot] my_queue error", err);
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "❌ Navbat ma'lumotlarini yuklab bo'lmadi. Birozdan so'ng qayta urinib ko'ring."
      });
    }
  } else if (callbackData === 'ai_help') {
    const text = "🦷 *DStoma - Mashina Toifasidagi Dental AI Assistanti!*\n\n" +
      "Siz biron-bir tishingizda og'riq sezyapsizmi yoki tish emali zararlanganmi? Bizning virtual stomatolog shifokorimiz sizga maslahat berishga tayyor!\n\n" +
      "👇 *Imkoniyatlar va foydalanish yo'riqnomasi:*\n" +
      "• ✍️ *Savol Yozish:* Istalgan vaqtda shunchaki muammoingizni yozib yuborishingiz mumkin (masalan, _'Menda karies va milk shamollashi bor...'_)\n" +
      "• 📸 *Rasm Yuborish (YANGI):* Og'iz bo'shlig'ingiz, tishingiz yoki dental rentgen (X-ray) rasmini botga rasm formatida yuboring va tavsif yozing. Bizning AI ko'rib chiqib, tahlil beradi!\n\n" +
      "Gemini aqlli AI-diagnost tizimi sizga bir zumda xavfsiz tavsiyalarni ishlab chiqadi! Savolingizni yoki rasmingizni bemalol yozib jo'nating:";

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });

  } else if (callbackData === 'app_qr') {
    const webAppUrl = process.env.APP_URL || "https://dstoma-queue.uz/";
    const text = "📱 *DStoma Smart Portaliga Kirish:* \n\n" +
      "💻 *Mobil yoki Desktop sayt manzili:* \n" +
      `🔗 [${webAppUrl}](${webAppUrl})\n\n` +
      "⚡ *Tezkor kirish QR kodi (Visual Matrix):*\n" +
      "```\n" +
      "███████████████████████████████\n" +
      "██ █▀▀▀█ ██ █▀█ █ █ █ ██ █▀▀▀█ ██\n" +
      "██ █ █ █ ██▀ ▄ ▀▀▀█▄▀ ██ █ █ █ ██\n" +
      "██ █▄▄▄█ ██▀▄▄█▄ ▀ ██ ██ █▄▄▄█ ██\n" +
      "██▄▄▄▄▄▄▄██▄▀██ █ ▀ █▄██▄▄▄▄▄▄▄██\n" +
      "██ ▀▀▄ ▄▄██ ▄▄▀█▄█▀█ ▀██  █▄▀▀▄██\n" +
      "██▀▄ ▀ ▀▄██▄▀█ █ ▄▀█  ██▄▄█▀▀  ██\n" +
      "███▀▀▄▄█▄██ ▀██ █▄██ ▄██▄ █▄▀█ ██\n" +
      "██ █▀▀▀█ ██▀█▀ ▄█▀▀█▀ ██ ▀ ██  ██\n" +
      "██ █   █ ██  ▄▄▀▀  ▀ ██▄▀▀▄███ ██\n" +
      "██ █▄▄▄█ ██ ▀▀ ▀▄▀▀▄█▄██ █▀▀▄█ ██\n" +
      "██▄▄▄▄▄▄▄██▄▄██▄█▄██▄▄██▄▄▄▄▄▄▄██\n" +
      "```\n" +
      "Kamerani ushbu QR kodi tomon yo'naltiring, yoki shunchaki yuqoridagi [Havolaga] click qiling! Smart integratsiyamiz orqali platformaga bir zumda ulanasiz! 🛸";

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });

  } else if (callbackData.startsWith('send_receipt_')) {
    const queueId = callbackData.replace('send_receipt_', '');
    try {
      const queues = await getQueues();
      const q: any = queues.find((item: any) => item.id === queueId);
      if (!q) {
        await tgApi(token, 'sendMessage', { chat_id: chatId, text: "⚠️ Navbat topilmadi." });
        return;
      }
      const patDb = await getPatients();
      const pat: any = patDb.find((p: any) => String(p.telegramChatId || '') === String(chatId));
      botSessions[sessionKey(token, chatId)] = {
        step: 'awaiting_receipt_photo',
        receiptQueueId: q.id,
        receiptDoctorId: q.doctorId,
        receiptClinicId: q.clinicId,
        receiptPatientId: pat?.id,
        receiptPatientName: pat?.fullName || q.patientName
      };
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "💳 *To'lov chekini yuborish*\n\nIltimos, to'lovni tasdiqlovchi skrinshot yoki rasmni shu yerga rasm sifatida yuboring. Shifokor uni ko'rib chiqib tasdiqlaydi.",
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error("[Telegram] send_receipt error:", err);
    }

  } else if (callbackData === 'book_queue') {
    const patDb = await getPatients();
    const existing = patDb.find((p: any) => String(p.telegramChatId || '') === String(chatId));
    if (!existing) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `⚠️ *Diqqat!*\n\nNavbat olish uchun avval bot orqali Ro'yxatdan o'tishingiz yoki Tizimga ulanishingiz kerak.`,
        parse_mode: 'Markdown'
      });
      return;
    }

    // Stage 1: select clinic — real clinics from the database, not a hardcoded list.
    const clinicsForBooking = await getClinics();
    if (!Array.isArray(clinicsForBooking) || clinicsForBooking.length === 0) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "❌ Hozircha tizimda faol klinika mavjud emas."
      });
      return;
    }
    const text = "🏥 *1/3-Qadam: Navbat olish uchun klinikamiz filialini tanlang:*";
    const replyMarkup = {
      inline_keyboard: [
        ...clinicsForBooking.map((c: any) => ([{ text: `📍 ${c.name}`, callback_data: `book_cl:${c.id}` }])),
        [{ text: "↩️ Orqaga Qaytish", callback_data: "back_to_main" }]
      ]
    };

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup
    });

  } else if (callbackData === 'back_to_main') {
    await sendPatientWelcomeMessage(token, chatId, firstName);

  } else if (callbackData === 'patient_guide') {
    const text = "ℹ️ *DStoma - Bemorlar uchun Botdan foydalanish qo'llanmasi:*\n\n" +
      "1️⃣ *Navbat Olish:* `📝 Bot orqali Navbat Olish` tugmasini bosing, filialni, shifokor va kerakli xizmatni tanlab tezkor elektron chipta (e-ticket) oling.\n" +
      "2️⃣ *Tizimga Kirish:* `📝 Bot orqali Ro'yxatdan O'tish` yoki Mini App orqali shaxsiy ma'lumotlaringizni to'ldiring.\n" +
      "3️⃣ *Navbatni Kuzatish:* `🎟 Mening faol navbatim` tugmasi orqali istalgan daqiqada hozirgi navbat holatini ko'ring.\n" +
      "4️⃣ *Sun'iy Intellekt:* Botga bevosita og'riq haqida savollar yozishingiz yoki tish/og'iz bo'shlig'i rasmini jo'natib diagnostika tahlilini olishingiz mumkin.\n\n" +
      "🦷 _DStoma - sog'lom tabassum sari birgalikda!_";

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });

  } else if (callbackData.startsWith('book_cl:')) {
    // Stage 2: select a real doctor belonging to the chosen clinic
    const selectedClinicId = callbackData.slice('book_cl:'.length);
    const [clinicsForDoc, doctorsForClinic] = await Promise.all([getClinics(), getDoctors()]);
    const branchName = clinicsForDoc.find((c: any) => c.id === selectedClinicId)?.name || "Tanlangan filial";
    const clinicDoctors = doctorsForClinic.filter((d: any) => d.clinicId === selectedClinicId);

    if (clinicDoctors.length === 0) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `❌ *${branchName}* filialida hozircha shifokor mavjud emas.`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: "↩️ Boshqa Filial Tanlash", callback_data: "book_queue" }]] }
      });
      return;
    }

    const text = `👨‍⚕️ *2/3-Qadam [${branchName}]: Qaysi professional shifokorimiz ko'rigiga yozilmoqchisiz?*`;
    const replyMarkup = {
      inline_keyboard: [
        ...clinicDoctors.map((d: any) => ([{ text: `🥼 ${d.name}${d.specialty ? ` (${d.specialty})` : ''}`, callback_data: `bk_doc:${selectedClinicId}|${d.id}` }])),
        [{ text: "↩️ Boshqa Filial Tanlash", callback_data: "book_queue" }]
      ]
    };

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup
    });

  } else if (callbackData.startsWith('bk_doc:')) {
    // Stage 3: optional complaint, then confirm
    const [clinicId, doctorId] = callbackData.slice('bk_doc:'.length).split('|');

    botSessions[sessionKey(token, chatId)] = {
      step: 'book_queue_complaint',
      tempUser: { clinicId, doctorId }
    };

    await tgApi(token, 'sendMessage', {
      chat_id: chatId,
      text: "✏️ *3/3-Qadam: Shikoyatingiz* (Masalan: tishim ogriyapti, plomba tushdi...)\n\nIxtiyoriy yozib qoldiring yohuud 'O'tkazib yuborish' uchun pastdagi tugmani bosing:",
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: "⏭ O'tkazib yuborish", callback_data: "bk_skip" }]]
      }
    });

  } else if (callbackData === 'bk_skip') {
    const session = botSessions[sessionKey(token, chatId)];
    const clinicId = session?.tempUser?.clinicId;
    const doctorId = session?.tempUser?.doctorId;
    delete botSessions[sessionKey(token, chatId)];

    if (!clinicId || !doctorId) {
      await tgApi(token, 'sendMessage', {
        chat_id: chatId,
        text: "❌ Sessiya muddati tugagan. Iltimos, /start orqali qaytadan urinib ko'ring."
      });
      return;
    }
    await proceedQueueBooking(token, chatId, clinicId, doctorId, '');
  }
}

// Boot Express Server integrated with Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModule = "vite";
    const { createServer: createViteServer } = await import(viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Hashed build assets (dist/assets/*) are safe to cache forever — their
    // filename changes whenever content does. index.html itself must never be
    // cached: it's the only thing that references the current hash filenames,
    // so a stale cached copy (Safari's disk cache is notoriously aggressive)
    // points at JS/CSS files a redeploy has already deleted, leaving a blank
    // (or here, dark-shell-only) unhydrated page — the same class of bug fixed
    // for the old Vercel deployment via vercel.json's no-cache headers.
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }
      },
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DStoma Express Suite] Listening live at http://0.0.0.0:${PORT}`);
    console.log(`[DStoma Mode] running in ${process.env.NODE_ENV || 'development'}`);
    
    // Launch Telegram Smart Polling bot service asynchronously
    startTelegramBot();
  });
}

// Registers (or re-registers) a bot's Telegram webhook to point at this deployment's
// own /api/telegram-webhook endpoint — the same action the SuperAdmin panel's manual
// "Webhook Sozlash" button performs, done automatically so nobody has to remember to
// click it after every deploy/domain change. A no-op if it's already pointed correctly
// (checked first so a warm/repeat cold start doesn't keep hammering Telegram's API).
// Returns true on success (webhook now correctly registered), false otherwise — the
// caller uses this to fall back from a Firestore-stored token to the raw env var one.
async function ensureWebhookRegistered(token: string, label: string): Promise<boolean> {
  if (!token) return false;
  try {
    const domain = (
      process.env.APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      lastActiveDomain
    ).trim().replace(/\/$/, "");
    const expectedUrl = `${domain}/api/telegram-webhook?token=${encodeURIComponent(token)}`;

    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const info = await infoRes.json();
    if (!info.ok) {
      console.error(`[Telegram Webhook] ${label} token rejected by Telegram (likely stale/revoked):`, info.description);
      return false;
    }
    if (info.result?.url === expectedUrl) return true;

    const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(expectedUrl)}`);
    const setData = await setRes.json();
    if (setData.ok) {
      console.log(`[Telegram Webhook] ${label} auto-registered: ${expectedUrl}`);
      return true;
    }
    console.error(`[Telegram Webhook] ${label} auto-registration failed:`, setData.description);
    return false;
  } catch (err) {
    console.error(`[Telegram Webhook] ${label} auto-registration error:`, err);
    return false;
  }
}

// Tries the (possibly Firestore-overridden) in-memory token first; if Telegram
// rejects it — e.g. a stale token saved before the SuperAdmin rotated it in BotFather
// and updated Vercel's env var, but never re-saved through the SuperAdmin panel —
// falls back to the raw environment variable, which is the deployment owner's most
// directly-controlled source of truth. Returns whichever token actually ended up
// registered so the caller can update the live in-memory value too — otherwise the
// webhook receiver's own token check (which compares against that same in-memory
// value) would reject every update Telegram sends, even though setWebhook succeeded.
async function ensureWebhookRegisteredWithFallback(currentToken: string, envToken: string | undefined, label: string): Promise<string | null> {
  if (await ensureWebhookRegistered(currentToken, label)) return currentToken;
  if (envToken && envToken !== currentToken) {
    console.log(`[Telegram Webhook] ${label} retrying with the raw env var token...`);
    if (await ensureWebhookRegistered(envToken, label)) return envToken;
  }
  return null;
}

// Single-flight cache for the middleware above: the first request on a fresh cold
// start does the real check (awaited); every request after that (same warm instance)
// just awaits the already-resolved promise, which is effectively free.
let webhookSetupPromise: Promise<void> | null = null;
function ensureWebhooksSetupOnce(): Promise<void> {
  if (!process.env.VERCEL) return Promise.resolve();
  if (!webhookSetupPromise) {
    const envPatientToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const envDoctorToken = process.env.DOCTOR_BOT_TOKEN;
    webhookSetupPromise = loadTelegramCreds()
      .then(() => Promise.all([
        ensureWebhookRegisteredWithFallback(activeTelegramToken, envPatientToken, "Patient Bot"),
        ensureWebhookRegisteredWithFallback(activeDoctorBotToken, envDoctorToken, "Doctor Bot"),
      ]))
      .then(([resolvedPatientToken, resolvedDoctorToken]) => {
        const patientChanged = resolvedPatientToken && resolvedPatientToken !== activeTelegramToken;
        const doctorChanged = resolvedDoctorToken && resolvedDoctorToken !== activeDoctorBotToken;
        if (patientChanged) activeTelegramToken = resolvedPatientToken!;
        if (doctorChanged) activeDoctorBotToken = resolvedDoctorToken!;
        if (patientChanged || doctorChanged) {
          // Persist so the next cold start reads the working token straight from
          // Firestore instead of needing this same fallback dance again.
          return saveTelegramCreds(activeTelegramToken, activeDoctorBotToken);
        }
      })
      .then(() => undefined)
      .catch((err) => {
        console.error("[Telegram Webhook] one-time setup failed:", err);
      });
  }
  return webhookSetupPromise;
}

// Guard server execution when deploying to serverless platforms (like Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
