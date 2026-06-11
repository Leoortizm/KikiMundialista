// src/services/firebase.ts
// Inicialización central de Firebase — importar desde aquí en toda la app

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicialización de Firebase App
const app = initializeApp(firebaseConfig);

// Auth con proveedor Google
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore con caché persistente multi-tab (funciona offline)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Nombres de colecciones — evita strings hardcodeados en toda la app
export const COLLECTIONS = {
  USERS:        'users',
  GRUPOS:       'grupos',
  PARTIDOS:     'partidos',
  LEADERBOARDS: 'leaderboards',
  CONFIG:       'config',
} as const;

// Subcollection helper
export const SUBCOLLECTIONS = {
  PREDICCIONES: 'predicciones',
  ENTRIES:      'entries',
} as const;

export default app;
