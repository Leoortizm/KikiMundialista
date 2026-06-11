// src/services/usersService.ts
// CRUD de perfiles de usuario en Firestore

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import type { UserProfile } from '../types';
import type { User } from 'firebase/auth';

/** Crea o actualiza el perfil de usuario en Firestore tras el login */
export async function upsertUserProfile(firebaseUser: User): Promise<UserProfile> {
  const ref = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // Actualiza sólo foto y nombre si cambió (ej: cambió foto de Google)
    await updateDoc(ref, {
      displayName: firebaseUser.displayName ?? snap.data().displayName,
      photoURL:    firebaseUser.photoURL    ?? snap.data().photoURL,
    });
    return snap.data() as UserProfile;
  }

  // Primer login — crea el perfil
  const newProfile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    uid:         firebaseUser.uid,
    displayName: firebaseUser.displayName ?? 'Jugador',
    email:       firebaseUser.email ?? '',
    photoURL:    firebaseUser.photoURL ?? undefined,
    role:        'player',
    gruposIds:   [],
    createdAt:   serverTimestamp(),
  };

  await setDoc(ref, newProfile);
  return { ...newProfile, createdAt: null } as unknown as UserProfile;
}

/** Obtiene el perfil de un usuario por UID */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/** Agrega el grupo a la lista del usuario */
export async function addGrupoToUser(uid: string, grupoId: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current: string[] = snap.data().gruposIds ?? [];
  if (!current.includes(grupoId)) {
    await updateDoc(ref, { gruposIds: [...current, grupoId] });
  }
}

/** Elimina el grupo de la lista del usuario */
export async function removeGrupoFromUser(uid: string, grupoId: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current: string[] = snap.data().gruposIds ?? [];
  await updateDoc(ref, { gruposIds: current.filter((id) => id !== grupoId) });
}

/** Obtiene perfiles de múltiples usuarios concurrentemente (máximo 100) */
export async function getUserProfilesByIds(uids: string[]): Promise<UserProfile[]> {
  if (uids.length === 0) return [];
  // SECURITY: Limitar consultas paralelas para evitar abuso de recursos
  const safeUids = uids.slice(0, 100);
  const docs = await Promise.all(
    safeUids.map((uid) => getDoc(doc(db, COLLECTIONS.USERS, uid))),
  );
  return docs.filter((d) => d.exists()).map((d) => d.data() as UserProfile);
}
