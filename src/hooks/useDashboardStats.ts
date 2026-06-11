// src/hooks/useDashboardStats.ts
// Calcula las estadísticas reales del usuario sumando todos sus grupos.

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS, SUBCOLLECTIONS } from '../services/firebase';

export interface DashboardStats {
  puntosTotal:         number;
  prediccionesHechas:  number;
  aciertosExactos:     number;
  loading:             boolean;
}

/**
 * Agrega predicciones del usuario en todos sus grupos para calcular:
 * - puntosTotal        (suma de puntosObtenidos en predicciones finalizadas)
 * - prediccionesHechas (total de predicciones guardadas)
 * - aciertosExactos    (predicciones con 3 puntos)
 */
export function useDashboardStats(
  uid:      string | undefined,
  gruposIds: string[],
): DashboardStats {
  const [stats,   setStats]   = useState<Omit<DashboardStats, 'loading'>>({
    puntosTotal:        0,
    prediccionesHechas: 0,
    aciertosExactos:    0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid || gruposIds.length === 0) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      let puntosTotal        = 0;
      let prediccionesHechas = 0;
      let aciertosExactos    = 0;

      try {
        for (const grupoId of gruposIds) {
          const q = query(
            collection(db, COLLECTIONS.GRUPOS, grupoId, SUBCOLLECTIONS.PREDICCIONES),
            where('uid', '==', uid),
          );
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const data = d.data();
            prediccionesHechas += 1;
            if (typeof data.puntosObtenidos === 'number') {
              puntosTotal     += data.puntosObtenidos;
              if (data.puntosObtenidos === 3) aciertosExactos += 1;
            }
          });
        }
      } catch {
        // Si falla por permisos no bloqueamos el Dashboard
      }

      if (!cancelled) {
        setStats({ puntosTotal, prediccionesHechas, aciertosExactos });
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [uid, gruposIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...stats, loading };
}
