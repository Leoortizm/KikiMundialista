// src/services/authService.ts
// Operaciones de Firebase Authentication — Solo Google OAuth

import {
  signInWithPopup,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

/** Login / Registro con Google (popup) — crea cuenta si no existe */
export async function loginWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

/** Cerrar sesión */
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/** Mensajes de error en español */
export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/popup-closed-by-user':    'Cerraste la ventana de Google. Inténtalo de nuevo.',
    'auth/network-request-failed':  'Error de conexión. Verifica tu internet.',
    'auth/too-many-requests':       'Demasiados intentos. Espera unos minutos.',
    'auth/cancelled-popup-request': '',
    'auth/popup-blocked':           'El navegador bloqueó la ventana emergente. Permite los popups para este sitio.',
    'auth/user-disabled':           'Esta cuenta ha sido deshabilitada.',
  };
  return messages[code] ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
