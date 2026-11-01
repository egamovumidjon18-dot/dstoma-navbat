// Fills an EMPTY Firestore project with English demo data — clinics, doctors,
// services, patients, today's queue and a few dental charts — so the app can be
// shown or evaluated without real patient records.
//
//   GOOGLE_APPLICATION_CREDENTIALS=path/to/demo-project-key.json npm run seed:demo
//
// The target project is the one the key belongs to. It refuses to run when the
// database already has clinics, and refuses the project in
// firebase-applet-config.json (normally production) unless --allow-config-project
// is passed. Passwords are stored in plain text here; the server hashes or
// encrypts each one the first time it is used to sign in.
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import appConfig from '../firebase-applet-config.json';

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!keyPath) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the demo project\'s service-account key file.');
  process.exit(1);
}
const projectId: string = JSON.parse(fs.readFileSync(keyPath, 'utf8')).project_id;
if (projectId === appConfig.projectId && !process.argv.includes('--allow-config-project')) {
  console.error(`${projectId} is the project in firebase-applet-config.json (usually production). Use a separate demo project, or pass --allow-config-project.`);
  process.exit(1);
}
const db = getFirestore(initializeApp({ credential: cert(keyPath), projectId }), process.env.FIRESTORE_DATABASE_ID || '(default)');

if (!(await db.collection('clinics').limit(1).get()).empty) {
  console.error(`${projectId} already has clinics — the demo seed only writes to an empty database.`);
  process.exit(1);
}

const now = new Date();
const iso = (d: Date) => d.toISOString();
const day = (offset: number) => { const d = new Date(now); d.setDate(d.getDate() + offset); return d; };
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const month = 30 * 24 * 3600 * 1000;

const clinics = [
  { id: 'demo_clinic_downtown', name: 'BrightSmile Dental — Downtown', subdomain: 'brightsmile-downtown', address: '12 Central Avenue', phone: '+1 555 0100', lat: 41.3111, lng: 69.2797, logo: '🦷', groupId: 'BrightSmile', ownerName: 'Laura Bennett', login: 'demo-director', password: 'Demo#2026' },
  { id: 'demo_clinic_riverside', name: 'BrightSmile Dental — Riverside', subdomain: 'brightsmile-riverside', address: '48 River Road', phone: '+1 555 0101', lat: 41.3265, lng: 69.2285, logo: '😁', groupId: 'BrightSmile', ownerName: 'Laura Bennett', login: 'demo-director-2', password: 'Demo#2026' },
  { id: 'demo_clinic_pearl', name: 'Pearl Dental Studio', subdomain: 'pearl-dental', address: '7 Garden Street', phone: '+1 555 0200', lat: 41.2995, lng: 69.2401, logo: '💎', ownerName: 'Daniel Reyes', login: 'demo-director-3', password: 'Demo#2026' },
].map((c) => ({
  ...c,
  mapLink: `https://www.google.com/maps?q=${c.lat},${c.lng}`,
  rating: 5,
  activePatients: 0,
  rentalPrice: 1500000,
  nextPaymentDate: ymd(day(20)),
  subscriptionStatus: 'active',
  subscriptionTier: 'premium',
  aiTrialStartDate: iso(now),
}));

const doctors = [
  { id: 'demo_doc_smith', clinicId: 'demo_clinic_downtown', name: 'Dr. Emily Smith', specialty: 'General dentist', login: 'demo-doctor', password: 'Demo#2026' },
  { id: 'demo_doc_khan', clinicId: 'demo_clinic_downtown', name: 'Dr. Omar Khan', specialty: 'Orthodontist', login: 'demo-doctor-2', password: 'Demo#2026' },
  { id: 'demo_doc_lee', clinicId: 'demo_clinic_riverside', name: 'Dr. Grace Lee', specialty: 'Oral surgeon', login: 'demo-doctor-3', password: 'Demo#2026' },
  { id: 'demo_doc_moreau', clinicId: 'demo_clinic_pearl', name: 'Dr. Julien Moreau', specialty: 'Prosthodontist', login: 'demo-doctor-4', password: 'Demo#2026' },
].map((d) => ({
  ...d,
  rating: 5,
  ratingCount: 0,
  image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(d.name)}`,
  status: 'idle',
  workingHours: { startTime: '09:00', endTime: '18:00', slotMinutes: 30, lunchStart: '13:00', lunchEnd: '14:00', autoQueue: true, workDays: [1, 2, 3, 4, 5, 6] },
}));

const links = [
  { doctorId: 'demo_doc_smith', clinicId: 'demo_clinic_downtown', relationshipType: 'revenue_share', doctorRevenueSharePercent: 40 },
  { doctorId: 'demo_doc_khan', clinicId: 'demo_clinic_downtown', relationshipType: 'rental', monthlyRentFee: 4000000, rentPaymentStatus: 'paid' },
  { doctorId: 'demo_doc_smith', clinicId: 'demo_clinic_riverside', relationshipType: 'revenue_share', doctorRevenueSharePercent: 45 },
  { doctorId: 'demo_doc_lee', clinicId: 'demo_clinic_riverside', relationshipType: 'revenue_share', doctorRevenueSharePercent: 40 },
  { doctorId: 'demo_doc_moreau', clinicId: 'demo_clinic_pearl', relationshipType: 'independent' },
].map((l) => ({ ...l, id: `${l.doctorId}_${l.clinicId}`, status: 'active', createdAt: iso(now), updatedAt: iso(now) }));

const serviceList: Array<[string, number]> = [
  ['Consultation', 100000], ['Professional teeth cleaning', 350000], ['Composite filling', 450000],
  ['Root canal treatment', 900000], ['Tooth extraction', 300000], ['Teeth whitening', 1200000],
  ['Ceramic crown', 2500000], ['Dental implant', 6000000], ['Braces (per month)', 800000],
];
const services = clinics.flatMap((c) => serviceList.map(([name, price], i) => ({ id: `${c.id}_svc_${i}`, clinicId: c.id, name, price })));
const svc = (clinicId: string, name: string) => services.find((s) => s.clinicId === clinicId && s.name === name)!;

const patientNames = [
  'Sarah Johnson', 'Michael Brown', 'Aisha Rahman', 'David Kim', 'Sofia Garcia', 'James Wilson',
  'Olivia Martin', 'Noah Davis', 'Mia Thompson', 'Lucas Silva', 'Hannah Müller', 'Ethan Clark',
];
const bloodGroups = ['I (O) Rh+', 'II (A) Rh+', 'III (B) Rh+', 'IV (AB) Rh+', 'II (A) Rh-'];
const patients = patientNames.map((fullName, i) => {
  const doc = doctors[i % doctors.length];
  return {
    id: `demo_pat_${i + 1}`,
    clinicId: doc.clinicId,
    primaryDoctorId: doc.id,
    fullName,
    phone: `+1 555 01${String(10 + i).padStart(2, '0')}`,
    loginCode: i === 0 ? 'DEMO01' : `DEMO${String(i + 1).padStart(2, '0')}`,
    password: 'demo1234',
    birthDate: `${1975 + i * 3}-0${(i % 9) + 1}-1${i % 9}`,
    bloodGroup: bloodGroups[i % bloodGroups.length],
    allergies: i % 4 === 0 ? 'Penicillin' : '',
    hasInfection: false,
    referredBy: i % 3 === 0 ? 'Instagram' : i % 3 === 1 ? 'A friend' : '',
    clinicVisits: [
      {
        id: `demo_visit_${i + 1}`,
        date: iso(new Date(now.getTime() - (i + 1) * month / 3)),
        doctorId: doc.id,
        doctorName: doc.name,
        serviceId: svc(doc.clinicId, 'Consultation').id,
        serviceName: 'Consultation',
        clinicId: doc.clinicId,
        price: 100000,
      },
    ],
  };
});

// Today's queue: some done (rated), one in the chair, the rest waiting or booked later.
const statuses = ['completed', 'completed', 'completed', 'in_progress', 'pending', 'pending', 'scheduled', 'scheduled', 'completed', 'scheduled'] as const;
const visitServices = ['Professional teeth cleaning', 'Composite filling', 'Consultation', 'Root canal treatment', 'Consultation', 'Teeth whitening', 'Ceramic crown', 'Tooth extraction', 'Composite filling', 'Consultation'];
const counters: Record<string, number> = {};
const queues = statuses.map((status, i) => {
  const p = patients[i];
  counters[p.clinicId] = (counters[p.clinicId] || 0) + 1;
  const hour = 9 + i;
  return {
    id: `demo_queue_${i + 1}`,
    clinicId: p.clinicId,
    patientId: p.id,
    patientName: p.fullName,
    patientPhone: p.phone,
    doctorId: p.primaryDoctorId,
    serviceId: svc(p.clinicId, visitServices[i]).id,
    number: counters[p.clinicId],
    status,
    createdAt: iso(now),
    appointmentDate: ymd(now),
    appointmentTime: `${String(hour).padStart(2, '0')}:00`,
    complaint: status === 'pending' ? 'Sensitivity to cold on the lower left side' : '',
    ...(status === 'completed' ? { rating: 5 - (i % 2) } : {}),
  };
});

// A few teeth per chart, keyed by FDI number like the app writes them.
const tooth = (condition: string, treatment: string, dentist: string, cost: number, daysAgo: number, surfaces: Record<string, string> = {}) => ({
  condition,
  conditions: [condition],
  surfaces,
  notes: '',
  history: [{ id: `h_${condition}_${daysAgo}`, date: iso(day(-daysAgo)), treatment, condition, cost, dentist }],
});
const charts: Record<string, Record<string, object>> = {
  demo_pat_1: {
    '16': tooth('Composite Filling', 'Composite filling', 'Dr. Emily Smith', 450000, 40, { O: 'Composite Filling' }),
    '36': tooth('Root Canal Completed', 'Root canal treatment', 'Dr. Emily Smith', 900000, 20),
    '46': tooth('Initial Caries', 'Examination', 'Dr. Emily Smith', 0, 3, { O: 'Initial Caries' }),
  },
  demo_pat_2: {
    '11': tooth('Crown', 'Ceramic crown', 'Dr. Omar Khan', 2500000, 60),
    '24': tooth('Deep Caries', 'Examination', 'Dr. Omar Khan', 0, 5, { M: 'Deep Caries' }),
  },
  demo_pat_3: {
    '38': tooth('Extracted', 'Tooth extraction', 'Dr. Grace Lee', 300000, 90),
    '26': tooth('Implant', 'Dental implant', 'Dr. Grace Lee', 6000000, 30),
  },
};

const writer = db.bulkWriter();
const put = (path: string, data: object) => writer.set(db.doc(path), data);
clinics.forEach((c) => put(`clinics/${c.id}`, c));
doctors.forEach((d) => put(`doctors/${d.id}`, d));
links.forEach((l) => put(`doctorClinicLinks/${l.id}`, l));
services.forEach((s) => put(`services/${s.id}`, s));
patients.forEach((p) => put(`patients/${p.id}`, p));
queues.forEach((q) => put(`queues/${q.id}`, q));
for (const [pid, teeth] of Object.entries(charts)) {
  for (const [num, data] of Object.entries(teeth)) put(`patients/${pid}/dentalChart/${num}`, { id: num, ...data });
}
await writer.close();

console.log(`Seeded ${projectId}: ${clinics.length} clinics, ${doctors.length} doctors, ${services.length} services, ${patients.length} patients, ${queues.length} appointments today.

Demo logins (password for staff: Demo#2026, for patients: demo1234)
  Clinic director   demo-director        (BrightSmile Downtown)
  Doctor            demo-doctor          (Dr. Emily Smith, works in two clinics)
  Patient           DEMO01               (Sarah Johnson)
  Superadmin        ADMIN_USER / ADMIN_PASS from the environment`);
process.exit(0);
