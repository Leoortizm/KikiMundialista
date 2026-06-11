// src/services/leaderboardService.ts
// Lectura en tiempo real y escritura del leaderboard por grupo.

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, COLLECTIONS, SUBCOLLECTIONS } from './firebase';
import type { LeaderboardEntry, Prediccion, ResultadoPartido, ConfigPuntos } from '../types';
import { calcularPuntos, DEFAULT_PUNTOS } from '../utils/puntos';

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
 * Actualiza (upsert) el leaderboard de un grupo con los puntos del partido recién finalizado.
 * Para cada predicción del partido:
 *  - Calcula los puntos obtenidos.
 *  - Lee la entry actual del usuario (si existe).
 *  - Acumula puntosTotal, prediccionesExactas, prediccionesGanador y partidosPredichos.
 *  - Escribe en batch.
 *
 * Nota: el nombre/foto se toman del documento `users/{uid}` para que siempre estén actualizados.
 */
export async function actualizarLeaderboard(
  grupoId:      string,
  predicciones: Prediccion[],
  resultado:    ResultadoPartido,
  config:       ConfigPuntos = DEFAULT_PUNTOS,
): Promise<void> {
  if (predicciones.length === 0) return;

  const batch = writeBatch(db);

  for (const pred of predicciones) {
    const puntos    = calcularPuntos(pred, resultado, config);
    const esExacto  = puntos === config.exacto;
    const esGanador = puntos === config.ganador && !esExacto;

    const puntosAnteriores = pred.puntosObtenidos ?? 0;
    const esExactoAnterior = puntosAnteriores === config.exacto;
    const esGanadorAnterior = puntosAnteriores === config.ganador && !esExactoAnterior;
    const yaTeniaPuntos = pred.puntosObtenidos !== undefined && pred.puntosObtenidos !== null;

    const diffPuntos    = puntos - puntosAnteriores;
    const diffExactas   = (esExacto ? 1 : 0) - (esExactoAnterior ? 1 : 0);
    const diffGanadores = (esGanador ? 1 : 0) - (esGanadorAnterior ? 1 : 0);
    const diffPredichos = yaTeniaPuntos ? 0 : 1;

    // Leer la entry actual
    const snap        = await getDoc(entryRef(grupoId, pred.uid));
    const current     = snap.exists() ? (snap.data() as LeaderboardEntry) : null;

    // Leer nombre/foto del usuario
    const userSnap    = await getDoc(doc(db, COLLECTIONS.USERS, pred.uid));
    const displayName = userSnap.exists()
      ? (userSnap.data().displayName as string) ?? 'Jugador'
      : 'Jugador';
    const photoURL = userSnap.exists()
      ? (userSnap.data().photoURL as string | undefined)
      : undefined;

    const newEntry: LeaderboardEntry = {
      uid:                  pred.uid,
      displayName,
      photoURL,
      puntosTotal:          (current?.puntosTotal          ?? 0) + diffPuntos,
      prediccionesExactas:  (current?.prediccionesExactas  ?? 0) + diffExactas,
      prediccionesGanador:  (current?.prediccionesGanador  ?? 0) + diffGanadores,
      partidosPredichos:    (current?.partidosPredichos    ?? 0) + diffPredichos,
      updatedAt:            serverTimestamp() as LeaderboardEntry['updatedAt'],
    };

    batch.set(entryRef(grupoId, pred.uid), newEntry);
  }

  await batch.commit();
}

/**
 * Conveniencia: actualiza el leaderboard de TODOS los grupos que participen
 * en un partido (se usa junto con calcularPuntosParaTodosLosGrupos).
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
