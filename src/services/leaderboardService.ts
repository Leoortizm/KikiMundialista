// src/services/leaderboardService.ts
// Lectura en tiempo real y escritura del leaderboard por grupo.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, COLLECTIONS, SUBCOLLECTIONS } from './firebase';
import type { LeaderboardEntry, Prediccion, ResultadoPartido, ConfigPuntos } from '../types';
import { DEFAULT_PUNTOS } from '../utils/puntos';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const entriesRef = (grupoId: string) =>
  collection(db, COLLECTIONS.LEADERBOARDS, grupoId, SUBCOLLECTIONS.ENTRIES);

const entryRef = (grupoId: string, uid: string) =>
  doc(db, COLLECTIONS.LEADERBOARDS, grupoId, SUBCOLLECTIONS.ENTRIES, uid);

// ─────────────────────────────────────────────────────────────
// Suscripción en tiempo real
// ─────────────────────────────────────────────────────────────

/**
 * Suscribe a los cambios del leaderboard de un grupo.
 * Las entradas vienen ordenadas por puntosTotal DESC.
 * Retorna la función de limpieza (unsubscribe).
 */
export function subscribeLeaderboard(
  grupoId: string,
  callback: (entries: LeaderboardEntry[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    entriesRef(grupoId),
    orderBy('puntosTotal', 'desc'),
  );

  return onSnapshot(
    q,
    (snap) => {
      const entries = snap.docs.map((d) => d.data() as LeaderboardEntry);
      callback(entries);
    },
    (err) => {
      console.error('[leaderboard] onSnapshot error:', err);
      onError?.(err);
    },
  );
}

// ─────────────────────────────────────────────────────────────
// Escritura del leaderboard (llamada desde Admin al finalizar partido)
// ─────────────────────────────────────────────────────────────

/**
 * Recalcula el leaderboard completo de un grupo desde cero,
 * sumando los puntos de TODAS las predicciones que ya tienen puntosObtenidos.
 *
 * Este enfoque es idempotente y correcto tanto en la primera finalización
 * como en recálculos/correcciones posteriores.
 */
export async function actualizarLeaderboard(
  grupoId:      string,
  _predicciones: Prediccion[],   // ya no se usan para el cálculo — se leen desde Firestore
  _resultado:    ResultadoPartido,
  _config:       ConfigPuntos = DEFAULT_PUNTOS,
): Promise<void> {
  // 1. Leer TODAS las predicciones del grupo y filtrar localmente las que
  //    ya tienen puntos asignados (evita requerir índice compuesto en Firestore)
  const todasQ   = collection(db, COLLECTIONS.GRUPOS, grupoId, SUBCOLLECTIONS.PREDICCIONES);
  const todasSnap = await getDocs(todasQ);
  const todasPreds = todasSnap.docs
    .map((d) => d.data() as Prediccion)
    .filter((p) => p.puntosObtenidos !== undefined && p.puntosObtenidos !== null);

  if (todasPreds.length === 0) return;

  // 2. Agrupar por uid y acumular estadísticas desde cero
  const porUid = new Map<string, {
    puntosTotal: number;
    prediccionesExactas: number;
    prediccionesGanador: number;
    partidosPredichos: number;
  }>();

  for (const pred of todasPreds) {
    const pts = pred.puntosObtenidos ?? 0;
    const esExacto  = pts === DEFAULT_PUNTOS.exacto;
    const esGanador = pts === DEFAULT_PUNTOS.ganador && !esExacto;

    const acc = porUid.get(pred.uid) ?? {
      puntosTotal: 0,
      prediccionesExactas: 0,
      prediccionesGanador: 0,
      partidosPredichos: 0,
    };

    acc.puntosTotal          += pts;
    acc.prediccionesExactas  += esExacto  ? 1 : 0;
    acc.prediccionesGanador  += esGanador ? 1 : 0;
    acc.partidosPredichos    += 1;

    porUid.set(pred.uid, acc);
  }

  // 3. Para cada uid, leer nombre/foto y escribir la entry en batch
  const batch = writeBatch(db);

  for (const [uid, stats] of porUid.entries()) {
    const userSnap    = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    const displayName = userSnap.exists()
      ? (userSnap.data().displayName as string) ?? 'Jugador'
      : 'Jugador';
    const photoURL = userSnap.exists()
      ? (userSnap.data().photoURL as string | undefined)
      : undefined;

    const newEntry: LeaderboardEntry = {
      uid,
      displayName,
      photoURL,
      puntosTotal:         stats.puntosTotal,
      prediccionesExactas: stats.prediccionesExactas,
      prediccionesGanador: stats.prediccionesGanador,
      partidosPredichos:   stats.partidosPredichos,
      updatedAt:           serverTimestamp() as LeaderboardEntry['updatedAt'],
    };

    batch.set(entryRef(grupoId, uid), newEntry);
  }

  await batch.commit();
}

/**
 * Conveniencia: actualiza el leaderboard de TODOS los grupos.
 */
export async function actualizarLeaderboardParaTodosLosGrupos(
  gruposIds:     string[],
  prediccionesPorGrupo: Map<string, Prediccion[]>,
  resultado:     ResultadoPartido,
  config:        ConfigPuntos = DEFAULT_PUNTOS,
): Promise<void> {
  for (const grupoId of gruposIds) {
    const preds = prediccionesPorGrupo.get(grupoId) ?? [];
    if (preds.length > 0) {
      await actualizarLeaderboard(grupoId, preds, resultado, config);
    }
  }
}
