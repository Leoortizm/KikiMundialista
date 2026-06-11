// src/services/prediccionesService.ts

import {
  collection, doc, getDoc, getDocs,
  setDoc, query, where, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS, SUBCOLLECTIONS } from './firebase';
import type { Prediccion, ResultadoPartido } from '../types';
import { calcularPuntos, DEFAULT_PUNTOS } from '../utils/puntos';
import type { ConfigPuntos } from '../types';

/** ID compuesto para garantizar 1 predicción por usuario por partido */
const predId = (partidoId: string, uid: string) => `${partidoId}_${uid}`;

const predRef = (grupoId: string, id: string) =>
  doc(db, COLLECTIONS.GRUPOS, grupoId, SUBCOLLECTIONS.PREDICCIONES, id);

/** Guarda o actualiza una predicción (solo si el partido aún no inició) */
export async function savePrediccion(
  grupoId:   string,
  uid:       string,
  partidoId: string,
  data: {
    golesLocal:     number;
    golesVisitante: number;
    ganadorExtra?:  'local' | 'visitante';
  },
): Promise<void> {
  // SECURITY: Validar goles como enteros no negativos
  const gl = Math.round(data.golesLocal);
  const gv = Math.round(data.golesVisitante);
  if (!Number.isInteger(gl) || gl < 0 || gl > 99) throw new Error('Goles local inválidos.');
  if (!Number.isInteger(gv) || gv < 0 || gv > 99) throw new Error('Goles visitante inválidos.');

  const id  = predId(partidoId, uid);
  const ref = predRef(grupoId, id);
  const existing = await getDoc(ref);

  await setDoc(ref, {
    id,
    partidoId,
    uid,
    golesLocal:     gl,
    golesVisitante: gv,
    ganadorExtra:   data.ganadorExtra ?? null,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Obtiene la predicción de un usuario para un partido en un grupo */
export async function getPrediccion(
  grupoId:   string,
  uid:       string,
  partidoId: string,
): Promise<Prediccion | null> {
  const snap = await getDoc(predRef(grupoId, predId(partidoId, uid)));
  return snap.exists() ? (snap.data() as Prediccion) : null;
}

/** Obtiene todas las predicciones de un usuario en un grupo, como Map<partidoId, Prediccion> */
export async function getUserPrediccionesMap(
  grupoId: string,
  uid:     string,
): Promise<Map<string, Prediccion>> {
  const q    = query(
    collection(db, COLLECTIONS.GRUPOS, grupoId, SUBCOLLECTIONS.PREDICCIONES),
    where('uid', '==', uid),
  );
  const snap = await getDocs(q);
  const map  = new Map<string, Prediccion>();
  snap.docs.forEach((d) => {
    const p = d.data() as Prediccion;
    map.set(p.partidoId, p);
  });
  return map;
}

/** Obtiene todas las predicciones de un partido en un grupo */
export async function getPrediccionesByPartido(
  grupoId:   string,
  partidoId: string,
): Promise<Prediccion[]> {
  const q    = query(
    collection(db, COLLECTIONS.GRUPOS, grupoId, SUBCOLLECTIONS.PREDICCIONES),
    where('partidoId', '==', partidoId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Prediccion);
}

/**
 * Calcula y persiste los puntos para TODOS los grupos que tengan predicciones
 * de ese partido. Se llama desde el admin cuando carga el resultado.
 * Retorna un Map<grupoId, Prediccion[]> con las predicciones procesadas,
 * para que el caller pueda actualizar el leaderboard sin re-fetch.
 */
export async function calcularPuntosParaTodosLosGrupos(
  gruposIds: string[],
  partidoId: string,
  resultado: ResultadoPartido,
  config:    ConfigPuntos = DEFAULT_PUNTOS,
): Promise<Map<string, Prediccion[]>> {
  const prediccionesPorGrupo = new Map<string, Prediccion[]>();

  for (const grupoId of gruposIds) {
    const predicciones = await getPrediccionesByPartido(grupoId, partidoId);
    if (predicciones.length === 0) continue;

    prediccionesPorGrupo.set(grupoId, predicciones);

    const batch = writeBatch(db);
    for (const pred of predicciones) {
      const puntos = calcularPuntos(pred, resultado, config);
      batch.update(predRef(grupoId, pred.id), { puntosObtenidos: puntos });
    }
    await batch.commit();
  }

  return prediccionesPorGrupo;
}
