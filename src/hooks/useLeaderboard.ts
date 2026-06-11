// src/hooks/useLeaderboard.ts
// Hook que suscribe en tiempo real al leaderboard de un grupo.

import { useEffect, useState } from 'react';
import { subscribeLeaderboard } from '../services/leaderboardService';
import type { LeaderboardEntry } from '../types';

interface UseLeaderboardResult {
  entries:  LeaderboardEntry[];
  loading:  boolean;
  error:    string | null;
}

/**
 * Suscribe en tiempo real al leaderboard del grupo indicado.
 * Limpia el listener al desmontar o cambiar de grupoId.
 * Si grupoId es null/undefined, no hace nada y retorna estado vacío.
 */
export function useLeaderboard(grupoId: string | null | undefined): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!grupoId) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeLeaderboard(
      grupoId,
      (newEntries) => {
        setEntries(newEntries);
        setLoading(false);
      },
      (err) => {
        setError(err.message ?? 'Error al cargar la clasificación.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [grupoId]);

  return { entries, loading, error };
}
