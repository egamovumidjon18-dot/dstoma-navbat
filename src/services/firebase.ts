import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, onSnapshot as firestoreOnSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { getApiUrl } from './api';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// firestore.rules only let a signed-in Firebase user in, scoped by the claims the
// server puts on their custom token (see GET /api/firebase-token in server.ts).
// The app's own session token is exchanged for that sign-in here.
function storedSessionToken(): string | null {
  try {
    return sessionStorage.getItem('dstoma_sa_token')
      || localStorage.getItem('dstoma_staff_token')
      || sessionStorage.getItem('dstoma_staff_token')
      || localStorage.getItem('dstoma_patient_token');
  } catch {
    return null;
  }
}

let syncSeq = 0;
// Signs Firebase in as whoever `sessionToken` (or, without one, any stored app
// session) belongs to, or signs it out when there is none. Only the latest call
// applies, so a quick logout/login can't leave the previous user signed in.
export async function syncFirebaseAuth(sessionToken?: string | null) {
  const seq = ++syncSeq;
  const token = sessionToken || storedSessionToken();
  try {
    if (!token) {
      if (auth.currentUser) await signOut(auth);
      return;
    }
    const res = await fetch(`${getApiUrl()}/api/firebase-token`, { headers: { Authorization: `Bearer ${token}` } });
    if (seq !== syncSeq) return;
    if (!res.ok) {
      if (res.status === 401 && auth.currentUser) await signOut(auth);
      return;
    }
    const data = await res.json();
    if (seq !== syncSeq || !data?.token) return;
    await signInWithCustomToken(auth, data.token);
  } catch (err) {
    console.warn('[Firebase] Sign-in sync failed', err);
  }
}

// Drop-in for Firestore's onSnapshot that waits for the Firebase sign-in above.
// A listener opened before it would be rejected by the rules and, once errored,
// never recover; this one (re)subscribes whenever the signed-in user changes.
export const onSnapshot = ((ref: any, ...handlers: any[]) => {
  let inner: (() => void) | null = null;
  let currentUid: string | null | undefined;
  const stopAuth = onAuthStateChanged(auth, (user) => {
    const uid = user?.uid ?? null;
    if (uid === currentUid) return;
    currentUid = uid;
    inner?.();
    inner = user ? (firestoreOnSnapshot as any)(ref, ...handlers) : null;
  });
  return () => {
    stopAuth();
    inner?.();
  };
}) as typeof firestoreOnSnapshot;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Do not throw to avoid crashing the app on transient network errors
}
