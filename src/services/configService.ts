// src/services/configService.ts
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import type { FasePartido } from '../types';

const CONFIG_DOC_ID = 'torneo';

export interface TorneoConfig {
  fasesHabilitadas: FasePartido[];
}

const DEFAULT_FASES: FasePartido[] = ['grupos'];

/** Obtiene las fases actualmente habilitadas para predicción/visualización */
export async function getFasesHabilitadas(): Promise<FasePartido[]> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CONFIG, CONFIG_DOC_ID));
    if (snap.exists()) {
      const data = snap.data() as TorneoConfig;
      return data.fasesHabilitadas || DEFAULT_FASES;
    }
    return DEFAULT_FASES;
  } catch (error) {
    console.error('[configService] Error al obtener fases habilitadas:', error);
    return DEFAULT_FASES;
  }
}

/** Guarda las fases habilitadas en Firestore */
export async function updateFasesHabilitadas(fases: FasePartido[]): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.CONFIG, CONFIG_DOC_ID), {
    fasesHabilitadas: fases,
  }, { merge: true });
}

/** Suscripción en tiempo real a las fases habilitadas */
export function subscribeFasesHabilitadas(
  callback: (fases: FasePartido[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const ref = doc(db, COLLECTIONS.CONFIG, CONFIG_DOC_ID);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as TorneoConfig;
        callback(data.fasesHabilitadas || DEFAULT_FASES);
      } else {
        callback(DEFAULT_FASES);
      }
    },
    (err) => {
      console.error('[configService] Error en subscribeFasesHabilitadas:', err);
      onError?.(err);
    }
  );
}
