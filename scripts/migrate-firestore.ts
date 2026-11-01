// One-off copy of every Firestore document from the old AI Studio project
// (scripts/source-firebase-config.json) into the project in
// firebase-applet-config.json.
//
// The source is read with the browser SDK, which only works while the old
// database's rules are still open — run this before locking it down. The target
// is written with the Admin SDK, so pass its service-account key file:
//
//   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json npx tsx scripts/migrate-firestore.ts --dry-run
//   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json npx tsx scripts/migrate-firestore.ts
//
// Documents keep their ids, so running it again overwrites rather than duplicates.
// Sessions are not copied: everyone signs in again on the new project.
import { initializeApp as initClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import sourceConfig from './source-firebase-config.json';
import targetConfig from '../firebase-applet-config.json';

const TOP_LEVEL = [
  'admin', 'ads', 'auditLogs', 'clinics', 'doctorClinicLinks', 'doctors', 'patients',
  'paymentReceipts', 'payments', 'prescriptions', 'queues', 'reminders', 'reports',
  'services', 'treatmentCharges', 'waitlist',
];
// Subcollections the app writes under each patient / clinic document. The
// browser SDK cannot list subcollections, so these are taken from the code.
const SUBCOLLECTIONS: Record<string, string[]> = {
  patients: ['before_after_pairs', 'dentalChart', 'photos', 'prescriptions', 'treatmentPlans', 'xrays'],
  clinics: ['materialUsage', 'materials', 'serviceMaterials', 'settings', 'stageTemplates'],
};

const dryRun = process.argv.includes('--dry-run');

if (sourceConfig.projectId === targetConfig.projectId) {
  console.error('firebase-applet-config.json still points at the source project — put the new project config there first.');
  process.exit(1);
}

const source = getClientFirestore(initClientApp(sourceConfig), sourceConfig.firestoreDatabaseId);
const targetDbId = (targetConfig as any).firestoreDatabaseId || '(default)';
const target = getFirestore(initializeApp({ credential: applicationDefault(), projectId: targetConfig.projectId }), targetDbId);
const writer = target.bulkWriter();
writer.onWriteError((err) => {
  console.error(`  ✗ ${err.documentRef.path}: ${err.message}`);
  return err.failedAttempts < 3;
});

let total = 0;
async function copyCollection(path: string): Promise<string[]> {
  const snap = await getDocs(collection(source, path));
  for (const d of snap.docs) {
    if (!dryRun) writer.set(target.doc(`${path}/${d.id}`), d.data());
  }
  total += snap.size;
  if (snap.size) console.log(`  ${path}: ${snap.size}`);
  return snap.docs.map((d) => d.id);
}

console.log(`${sourceConfig.projectId}/${sourceConfig.firestoreDatabaseId} → ${targetConfig.projectId}/${targetDbId}${dryRun ? ' (dry run)' : ''}`);
for (const name of TOP_LEVEL) {
  const ids = await copyCollection(name);
  for (const sub of SUBCOLLECTIONS[name] || []) {
    for (const id of ids) await copyCollection(`${name}/${id}/${sub}`);
  }
}
await writer.close();
console.log(`${dryRun ? 'Would copy' : 'Copied'} ${total} documents.`);
process.exit(0);
