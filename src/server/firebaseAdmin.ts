// Server-side Firestore access through the Admin SDK.
//
// The server used to talk to Firestore with the browser SDK and no sign-in, which
// only worked because firestore.rules allowed every read and write to everyone.
// The Admin SDK authenticates with a service account and bypasses the rules, so
// the rules can now lock the database down to signed-in staff and patients.
//
// The functions below mirror the subset of the browser SDK's modular API that
// server.ts uses (collection, doc, getDocs, getDoc, setDoc, deleteDoc,
// runTransaction, and snap.exists() as a method), so the call sites stay as they are.
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getFirestore as adminFirestore, type Firestore, type DocumentReference, type DocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

// Credentials come from FIREBASE_SERVICE_ACCOUNT (the service-account JSON, as one
// string, which is what Vercel/Render env vars can hold), or from
// GOOGLE_APPLICATION_CREDENTIALS / the platform's default credentials.
export function initFirebaseAdmin(projectId: string): App | null {
  if (adminApp) return adminApp;
  if (getApps().length) return (adminApp = getApps()[0]);
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    adminApp = initializeApp({ credential: cert(JSON.parse(raw)), projectId });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // cert() rather than applicationDefault(): with the key itself the custom
    // tokens are signed locally instead of through the IAM Credentials API,
    // which a fresh project does not have enabled.
    adminApp = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS), projectId });
  }
  return adminApp;
}

export function getFirestore(app: App, databaseId: string): Firestore {
  return adminFirestore(app, databaseId);
}

// Mints the token the browser exchanges (signInWithCustomToken) for a Firebase
// sign-in carrying these claims; firestore.rules reads them from request.auth.token.
export function createFirebaseToken(uid: string, claims: Record<string, unknown>): Promise<string> {
  if (!adminApp) throw new Error('Firebase Admin is not initialised');
  return getAuth(adminApp).createCustomToken(uid, claims);
}

function wrapDoc(s: DocumentSnapshot) {
  return { id: s.id, ref: s.ref, exists: () => s.exists, data: () => s.data() };
}

export function collection(db: Firestore, path: string) {
  return db.collection(path);
}

export function doc(db: Firestore, ...segments: string[]) {
  return db.doc(segments.join('/'));
}

export async function getDocs(ref: FirebaseFirestore.Query) {
  const s = await ref.get();
  const docs = s.docs.map(wrapDoc);
  return { docs, size: s.size, empty: s.empty, forEach: (fn: (d: ReturnType<typeof wrapDoc>) => void) => docs.forEach(fn) };
}

export async function getDoc(ref: DocumentReference) {
  return wrapDoc(await ref.get());
}

export async function setDoc(ref: DocumentReference, data: any, options?: { merge?: boolean }) {
  await (options ? ref.set(data, options) : ref.set(data));
}

export async function deleteDoc(ref: DocumentReference) {
  await ref.delete();
}

export function runTransaction<T>(db: Firestore, fn: (tx: any) => Promise<T>): Promise<T> {
  return db.runTransaction((t) =>
    fn({
      get: async (ref: DocumentReference) => wrapDoc(await t.get(ref)),
      set: (ref: DocumentReference, data: any, options?: { merge?: boolean }) => (options ? t.set(ref, data, options) : t.set(ref, data)),
      update: (ref: DocumentReference, data: any) => t.update(ref, data),
      delete: (ref: DocumentReference) => t.delete(ref),
    })
  );
}
