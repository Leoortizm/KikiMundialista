import {
  collection, doc, getDoc, getDocs,
  updateDoc, runTransaction,
  serverTimestamp, query, where, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import type { Grupo } from '../types';

/** Genera código de invitación de 6 caracteres sin caracteres ambiguos */
function generarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

/** Crea un nuevo grupo y lo agrega al perfil del creador */
export async function createGrupo(
  uid: string,
  data: { nombre: string; descripcion?: string },
): Promise<string> {
  const ref = doc(collection(db, COLLECTIONS.GRUPOS));

  await runTransaction(db, async (tx) => {
    tx.set(ref, {
      id:               ref.id,
      nombre:           data.nombre.trim(),
      descripcion:      data.descripcion?.trim() ?? '',
      adminUid:         uid,
      miembros:         [uid],
      codigoInvitacion: generarCodigo(),
      isPublico:        false,
      temporada:        'Mundial 2026',
      createdAt:        serverTimestamp(),
      solicitudesPendientes: [],
    });
    tx.update(doc(db, COLLECTIONS.USERS, uid), {
      gruposIds: arrayUnion(ref.id),
    });
  });

  return ref.id;
}

/** Une a un usuario a un grupo por código de invitación (crea solicitud pendiente) */
export async function joinGrupoByCodigo(
  uid: string,
  codigo: string,
): Promise<{ grupo: Grupo; estado: 'solicitado' | 'miembro' }> {
  const q = query(
    collection(db, COLLECTIONS.GRUPOS),
    where('codigoInvitacion', '==', codigo.toUpperCase().trim()),
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Código no encontrado. Verifica que sea correcto.');

  const grupoDoc = snap.docs[0];
  const grupo    = grupoDoc.data() as Grupo;

  if (grupo.miembros.includes(uid))
    throw new Error('Ya eres miembro de este grupo.');

  if (grupo.solicitudesPendientes?.includes(uid))
    throw new Error('Ya solicitaste unirte a este grupo. Espera aprobación del administrador.');

  await updateDoc(grupoDoc.ref, {
    solicitudesPendientes: arrayUnion(uid)
  });

  return { grupo: { ...grupo, id: grupoDoc.id }, estado: 'solicitado' };
}

/** Obtiene múltiples grupos por array de IDs */
export async function getGruposByIds(ids: string[]): Promise<Grupo[]> {
  if (ids.length === 0) return [];
  const docs = await Promise.all(
    ids.map((id) => getDoc(doc(db, COLLECTIONS.GRUPOS, id))),
  );
  return docs.filter((d) => d.exists()).map((d) => d.data() as Grupo);
}

/** Obtiene un grupo por ID */
export async function getGrupo(grupoId: string): Promise<Grupo | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.GRUPOS, grupoId));
  return snap.exists() ? (snap.data() as Grupo) : null;
}

/** Sale de un grupo (no aplica si eres admin) */
export async function leaveGrupo(uid: string, grupoId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    tx.update(doc(db, COLLECTIONS.GRUPOS, grupoId), { miembros: arrayRemove(uid) });
    tx.update(doc(db, COLLECTIONS.USERS, uid), { gruposIds: arrayRemove(grupoId) });
  });
}

/** Admin: regenera el código de invitación */
export async function regenerarCodigoInvitacion(grupoId: string): Promise<string> {
  const nuevoCodigo = generarCodigo();
  await updateDoc(doc(db, COLLECTIONS.GRUPOS, grupoId), {
    codigoInvitacion: nuevoCodigo,
  });
  return nuevoCodigo;
}

/** Admin: elimina un miembro del grupo */
export async function removerMiembroGrupo(grupoId: string, miembroUid: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    tx.update(doc(db, COLLECTIONS.GRUPOS, grupoId), { miembros: arrayRemove(miembroUid) });
    tx.update(doc(db, COLLECTIONS.USERS, miembroUid), { gruposIds: arrayRemove(grupoId) });
    // Borrar entry de leaderboard
    tx.delete(doc(db, COLLECTIONS.LEADERBOARDS, grupoId, 'entries', miembroUid));
  });
}

/** Admin: acepta una solicitud de ingreso */
export async function aceptarSolicitudIngreso(grupoId: string, miembroUid: string): Promise<void> {
  const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, miembroUid));
  const displayName = userSnap.exists() ? userSnap.data().displayName || 'Jugador' : 'Jugador';
  const photoURL = userSnap.exists() ? userSnap.data().photoURL || null : null;

  await runTransaction(db, async (tx) => {
    tx.update(doc(db, COLLECTIONS.GRUPOS, grupoId), {
      miembros: arrayUnion(miembroUid),
      solicitudesPendientes: arrayRemove(miembroUid),
    });
    tx.update(doc(db, COLLECTIONS.USERS, miembroUid), {
      gruposIds: arrayUnion(grupoId),
    });
    // Inicializar entry de leaderboard con 0 puntos
    tx.set(doc(db, COLLECTIONS.LEADERBOARDS, grupoId, 'entries', miembroUid), {
      uid: miembroUid,
      displayName,
      photoURL,
      puntosTotal: 0,
      prediccionesExactas: 0,
      prediccionesGanador: 0,
      partidosPredichos: 0,
      updatedAt: serverTimestamp(),
    });
  });
}

/** Admin: rechaza una solicitud de ingreso */
export async function rechazarSolicitudIngreso(grupoId: string, miembroUid: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.GRUPOS, grupoId), {
    solicitudesPendientes: arrayRemove(miembroUid),
  });
}

/** Admin: actualiza el nombre del grupo */
export async function updateGrupoNombre(grupoId: string, nuevoNombre: string): Promise<void> {
  if (!nuevoNombre.trim()) throw new Error('El nombre del grupo no puede estar vacío.');
  await updateDoc(doc(db, COLLECTIONS.GRUPOS, grupoId), {
    nombre: nuevoNombre.trim(),
  });
}

/** Admin: elimina por completo el grupo, desvincula a sus miembros, y borra predicciones y leaderboard */
export async function deleteGrupo(grupoId: string): Promise<void> {
  const grupo = await getGrupo(grupoId);
  if (!grupo) throw new Error('Grupo no encontrado.');

  const { writeBatch, collection, getDocs } = await import('firebase/firestore');

  // Recopilar todas las operaciones antes de comprometer
  type BatchOp = { type: 'update'; ref: ReturnType<typeof doc>; data: Record<string, unknown> }
               | { type: 'delete'; ref: ReturnType<typeof doc> };

  const ops: BatchOp[] = [];

  // 1. Remover el grupoId de la lista de grupos de todos los miembros
  const miembros = grupo.miembros || [];
  miembros.forEach((memberUid) => {
    ops.push({
      type: 'update',
      ref: doc(db, COLLECTIONS.USERS, memberUid),
      data: { gruposIds: arrayRemove(grupoId) },
    });
  });

  // 2. Borrar todas las predicciones de la subcolección
  const predsSnap = await getDocs(collection(db, COLLECTIONS.GRUPOS, grupoId, 'predicciones'));
  predsSnap.docs.forEach((docSnap) => {
    ops.push({ type: 'delete', ref: docSnap.ref });
  });

  // 3. Borrar todas las entradas de leaderboard
  const leaderboardSnap = await getDocs(collection(db, COLLECTIONS.LEADERBOARDS, grupoId, 'entries'));
  leaderboardSnap.docs.forEach((docSnap) => {
    ops.push({ type: 'delete', ref: docSnap.ref });
  });

  // 4. Borrar el documento del grupo
  ops.push({ type: 'delete', ref: doc(db, COLLECTIONS.GRUPOS, grupoId) });

  // 5. Ejecutar en chunks de 450 (máximo Firestore = 500)
  const CHUNK_SIZE = 450;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.type === 'delete') {
        batch.delete(op.ref);
      } else {
        batch.update(op.ref, op.data);
      }
    }
    await batch.commit();
  }
}
