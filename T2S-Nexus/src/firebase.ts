import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getFirestore, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

const activeFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (firebaseConfigJson as any).firestoreDatabaseId || "(default)"
};

const app = initializeApp(activeFirebaseConfig);

// Safe Analytics initialization
let analyticsInstance: any = null;
if (typeof window !== 'undefined' && activeFirebaseConfig.measurementId) {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    isSupported().then(supported => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
    }).catch(() => {});
  }).catch(() => {});
}
export const analytics = analyticsInstance;

// Initialize Firestore with settings to improve stability in sandboxed environments
const isIframe = typeof window !== 'undefined' && window.self !== window.top;
const dbId = activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== "(default)"
  ? activeFirebaseConfig.firestoreDatabaseId
  : undefined;

let dbInstance;
try {
  dbInstance = dbId
    ? initializeFirestore(app, isIframe ? { experimentalAutoDetectLongPolling: true } : {}, dbId)
    : initializeFirestore(app, isIframe ? { experimentalAutoDetectLongPolling: true } : {});
} catch (e) {
  console.warn("initializeFirestore failed, falling back to getFirestore:", e);
  dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

export function isOfflineError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code = (error as any)?.code || '';
  return (
    msg.includes('offline') || 
    msg.includes('unavailable') || 
    msg.includes('failed-precondition') || 
    msg.includes('failed to get document') ||
    msg.includes('network') ||
    msg.includes('api has not been used') ||
    msg.includes('is disabled') ||
    msg.includes('firestore.googleapis.com') ||
    msg.includes('permission-denied') ||
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    code === 'permission-denied'
  );
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
  console.warn('Firestore Notice: ', JSON.stringify(errInfo));

  const errorLower = errInfo.error.toLowerCase();
  const isQuotaError = errorLower.includes('quota') || 
                       errorLower.includes('limit exceeded') || 
                       errorLower.includes('resource-exhausted') || 
                       errorLower.includes('quota_exceeded');

  if (isQuotaError) {
    if (typeof window !== 'undefined') {
      try {
        (window as any).dispatchEvent(new (window as any).CustomEvent('firestore-quota', { detail: errInfo }));
      } catch (e) {
        console.error("Failed to dispatch custom firestore-quota event:", e);
      }
    }
    console.warn("Firestore Quota Exceeded detected. Handling gracefully via UI warning and cache fallback.");
    return;
  }

  const isApiNotEnabled = errorLower.includes('api has not been used') || 
                          errorLower.includes('is disabled') || 
                          errorLower.includes('firestore.googleapis.com');

  if (isApiNotEnabled) {
    if (typeof window !== 'undefined') {
      try {
        (window as any).dispatchEvent(new (window as any).CustomEvent('firestore-api-disabled', { detail: errInfo }));
      } catch (e) {
        console.error("Failed to dispatch custom firestore-api-disabled event:", e);
      }
    }
    console.warn("Firestore Database is not yet enabled in the Firebase project. Running in resilient local offline mode.");
    return;
  }

  if (isOfflineError(error)) {
    if (typeof window !== 'undefined') {
      try {
        (window as any).dispatchEvent(new (window as any).CustomEvent('firestore-offline', { detail: errInfo }));
      } catch (e) {
        console.error("Failed to dispatch custom firestore-offline event:", e);
      }
    }
    console.warn("Firestore Offline status detected. Operating with resilient local cache fallback.");
    return;
  }

  // Gracefully log without crashing the application runtime
  console.warn("Firestore operation caught and handled gracefully:", errInfo);
}

// Non-blocking connectivity check to avoid delaying initial application render
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection verified");
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore operating with resilient local cache fallback.");
      }
    }
  }, 4000);
}
