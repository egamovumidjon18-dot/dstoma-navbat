export interface Clinic {
  id: string;
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  logo: string;
  // rating/ratingCount are server-computed (from real QueueItem.rating feedback) on
  // every GET /api/clinics response — the stored value is only a neutral pre-review
  // default and should never be trusted/edited directly.
  rating: number;
  ratingCount?: number;
  activePatients: number;
  mapLink?: string; // Google-Yandex Map link for full integration
  // SaaS Subscription Info
  rentalPrice?: number; // Monthly subscription fee in UZS
  nextPaymentDate?: string;
  subscriptionStatus?: 'active' | 'suspended' | 'trial';
  ownerName?: string;
  // System owner-provided credentials
  login?: string;
  password?: string;
  // AI Yordamchi is a Premium-only feature with a one-time 10-day free trial.
  // All AI usage bills against a single platform-wide key (see server.ts
  // getGeminiApiKey) — clinics no longer configure their own.
  subscriptionTier?: 'basic' | 'premium';
  aiTrialStartDate?: string; // ISO date; stamped once at clinic creation
  aiUsageDate?: string; // ISO date of the current daily AI usage window
  aiUsageCount?: number; // AI calls consumed so far within aiUsageDate
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  rating: number;
  ratingCount: number;
  image: string;
  status: 'idle' | 'busy' | 'away';
  // System owner-provided credentials
  login?: string;
  password?: string;
  // Where patients should send money directly (cash-app / bank transfer style —
  // no payment gateway API, doctor just publishes where to pay and confirms
  // receipts manually; see PaymentReceipt).
  paymentCardNumber?: string;
  paymentPhone?: string;
  // Doctor-configurable weekly schedule used to render the "Rejalashtirilgan"
  // time-slot grid. Falls back to a default (08:00-18:00, 60min, 13:00-14:00
  // lunch) when absent — see DEFAULT_WORKING_HOURS in DoctorDashboard.tsx.
  workingHours?: {
    startTime: string;   // "08:00"
    endTime: string;     // "18:00"
    slotMinutes: number; // 15 | 30 | 45 | 60
    lunchStart?: string; // "13:00"
    lunchEnd?: string;   // "14:00"
    // When on (default), the doctor's open panel automatically moves today's
    // scheduled appointments to 'calling' once their slot time arrives, so the
    // queue advances without the doctor starting each one by hand.
    autoQueue?: boolean;
  };
}

// A patient-submitted proof-of-payment (screenshot/photo sent via the Telegram bot).
// The doctor manually confirms or rejects it — no real payment gateway involved.
export interface PaymentReceipt {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId?: string;
  patientName?: string;
  queueId?: string;
  imageData: string; // base64 data URL of the receipt photo
  amount?: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

// A doctor-authored note/reminder about a specific patient. "Yuborish" sends it to
// the patient immediately via the Telegram bot (no background scheduler exists yet,
// so this is manually triggered rather than auto-firing at dueDate).
export interface Reminder {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  text: string;
  dueDate?: string; // ISO date, informational only
  status: 'pending' | 'sent' | 'done';
  createdAt: string;
  sentAt?: string;
}

export interface Service {
  id: string;
  clinicId: string;
  name: string;
  price: number; // in UZS
}

export interface ToothDiagnosis {
  id: string;
  createdAt: string;
  toothIndex: number;
  toothNumber: number;
  symptoms: string;
  imageFileName?: string;
  enamelAbrasion: string;
  healthFactor: string;
  recommendedTreatment: string;
  diagnosticText: string;
  actionPlan: string[];
}

export interface ClinicVisit {
  id: string;
  date: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  complaint?: string;
  medicalNotes?: string;
  price?: number;
  clinicId?: string; // which clinic this visit happened at; falls back to Patient.clinicId when absent (legacy visits)
}

// Business relationship between a doctor and a clinic they work at. A doctor can hold
// multiple active links (multi-clinic doctors); absence of a link for a doctor+clinic
// pair means "legacy full-visibility relationship", identical to pre-link behavior.
export interface DoctorClinicLink {
  id: string; // `${doctorId}_${clinicId}` — deterministic, prevents duplicates
  doctorId: string;
  clinicId: string;
  // 'independent' = solo practice: the doctor IS the clinic owner, so there's no
  // revenue split or rent to track — full stats always show, no privacy gating.
  relationshipType: 'rental' | 'revenue_share' | 'independent';
  doctorRevenueSharePercent?: number; // doctor's cut 0-100 (revenue_share only); clinic's cut = 100 - this
  monthlyRentFee?: number; // UZS (rental only)
  rentPaymentStatus?: 'paid' | 'unpaid';
  rentPaymentUpdatedAt?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  fullName: string;
  // Registration only collects fullName + password now — passport, phone, and
  // the rest are filled in later from the patient's own cabinet (Sozlamalar),
  // so none of them can be guaranteed present at creation time.
  passportSerial?: string;
  phone?: string;
  // Short, patient-facing code auto-generated at registration (see server.ts
  // generateUniqueLoginCode). Passport used to be the only login identifier;
  // it's no longer collected up front, so this is what /api/patient-login
  // matches against for accounts created after this change. Older accounts
  // that do have a passportSerial keep logging in with it — the login form
  // and endpoint accept either.
  loginCode?: string;
  telegramChatId?: string;
  birthDate?: string;
  password?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicDiseases?: string;
  hasInfection?: boolean;
  diagnoses?: ToothDiagnosis[];
  medicalHistory?: any[];
  clinicVisits?: ClinicVisit[];
  // Family cabinet: if set, this patient is a dependent managed by another
  // patient (the family admin) — id of that admin's Patient record.
  managedBy?: string;
  // The doctor currently treating this patient — scopes which doctor sees them
  // in their "Bemorlar" list. Kept in sync automatically: every time this patient
  // books a new queue (POST /api/queues in server.ts), primaryDoctorId is updated
  // to that queue's doctorId, so it always reflects whoever they most recently
  // booked with — this is the patient's own way of "switching" treating doctors.
  primaryDoctorId?: string;
}

export interface QueueItem {
  id: string;
  clinicId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  serviceId?: string;
  number: number;
  status: 'pending' | 'scheduled' | 'calling' | 'in_progress' | 'completed' | 'cancelled';
  rating?: number; // feedback stars 1-5
  createdAt: string; // ISO string
  appointmentDate?: string;
  appointmentTime?: string;
  hasInfection?: boolean; // Django models matching
  medicalNotes?: string;  // Django models matching
  passportSerial?: string; // Django models matching
  telegramChatId?: string; // Telegram Chat ID for automated updates
  complaint?: string; // Patient complaint
}

export interface SaaSPayment {
  id: string;
  clinicId: string;
  clinicName: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pending_approval' | 'confirmed' | 'unpaid';
  // 'premium_upgrade' requests, once approved, flip the clinic's subscriptionTier
  // to 'premium' (unlocking AI Yordamchi) in addition to the usual payment bookkeeping.
  paymentType?: 'subscription' | 'premium_upgrade';
}

export interface CodeSnippet {
  title: string;
  language: string;
  description: string;
  filename: string;
  code: string;
}

export interface ToothMetrics {
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

// Superadmin-only advertising placements shown to patients on the web app and/or
// via the Telegram bot. No clinicId = platform-wide (shown to every clinic's patients).
export interface Advertisement {
  id: string;
  title: string;
  body?: string;
  imageUrl?: string; // base64 data URL, compressed client-side before upload
  linkUrl?: string;
  placements: Array<'web_home' | 'web_patient_panel' | 'web_queue_screen'>;
  telegramEnabled: boolean; // append to queue/reminder bot messages
  status: 'active' | 'paused';
  createdAt: string;
  clinicId?: string; // optional targeting to one clinic's patients only
}


