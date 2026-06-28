import type { Prediccion, ResultadoPartido, ConfigPuntos } from '../types';

// Configuración de puntos por defecto (puede sobreescribirse desde Firestore)
export const DEFAULT_PUNTOS: ConfigPuntos = {
  exacto:  3,
  ganador: 1,
  fallo:   0,
};

/**
 * Calcula los puntos obtenidos para una predicción dado el resultado real.
 *
 * Sistema de puntos (máximo 3 pts por partido):
 *
 *  FASE DE GRUPOS:
 *   - Marcador exacto:                                      3 pts
 *   - Acertar ganador o empate (sin marcador exacto):        1 pt
 *   - Fallo:                                                 0 pts
 *
 *  ELIMINATORIAS (ganador claro en 90 min):
 *   - Marcador exacto:                                      3 pts
 *   - Acertar ganador (sin marcador exacto):                 1 pt
 *   - Fallo:                                                 0 pts
 *
 *  ELIMINATORIAS (empate en 90 min → penales/alargue):
 *   - Marcador exacto + ganadorExtra correcto:               3 pts
 *   - Marcador exacto + ganadorExtra incorrecto/ausente:     1 pt
 *   - Marcador incorrecto + ganadorExtra correcto:           1 pt
 *   - Fallo total:                                           0 pts
 */
export function calcularPuntos(
  prediccion: Pick<Prediccion, 'golesLocal' | 'golesVisitante' | 'ganadorExtra'>,
  resultado: ResultadoPartido,
  config: ConfigPuntos = DEFAULT_PUNTOS,
): number {
  const pL = Number(prediccion.golesLocal);
  const pV = Number(prediccion.golesVisitante);
  const rL = Number(resultado.golesLocal);
  const rV = Number(resultado.golesVisitante);

  // Determinar el ganador efectivo del partido
  const ganadorEfectivo = resultado.ganador ?? (rL > rV ? 'local' : rV > rL ? 'visitante' : 'empate');

  // ¿Fue a penales/alargue? (empate en 90 min pero con un ganador definido)
  const fueAPenales = rL === rV && ganadorEfectivo !== 'empate';

  // ── Resultado exacto (marcador completo) ──
  if (pL === rL && pV === rV) {
    if (fueAPenales) {
      // Eliminatoria con empate: 3 pts SOLO si también acertó quién avanza
      if (prediccion.ganadorExtra && prediccion.ganadorExtra === ganadorEfectivo) {
        return config.exacto;   // 3 pts — predicción perfecta
      }
      // Acertó marcador pero no quién avanza → solo 1 pt (como acertar empate)
      return config.ganador;    // 1 pt
    }
    // Grupos o eliminatoria con ganador claro: marcador exacto = 3 pts
    return config.exacto;
  }

  // ── No acertó el marcador exacto ──

  const ganadorPrediccion = pL > pV ? 'local' : pV > pL ? 'visitante' : 'empate';

  // Acertar ganador o empate → 1 pt
  if (ganadorPrediccion === ganadorEfectivo) {
    return config.ganador;
  }

  // Eliminatoria: predijo empate + ganadorExtra correcto → 1 pt
  if (
    prediccion.ganadorExtra &&
    prediccion.ganadorExtra === ganadorEfectivo
  ) {
    return config.ganador;
  }

  return config.fallo;
}

/**
 * Calcula los puntos de todas las predicciones de un partido
 * y devuelve un Map uid → puntos, listo para batch write.
 */
export function calcularPuntosPartido(
  predicciones: Prediccion[],
  resultado: ResultadoPartido,
  config: ConfigPuntos = DEFAULT_PUNTOS,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const pred of predicciones) {
    result.set(pred.uid, calcularPuntos(pred, resultado, config));
  }
  return result;
}

/**
 * Agrega un Map de puntos nuevos sobre los actuales del leaderboard.
 * Retorna objeto listo para Firestore update.
 */
export function agregarPuntosLeaderboard(
  predicciones: Prediccion[],
  resultado: ResultadoPartido,
  config: ConfigPuntos = DEFAULT_PUNTOS,
): Record<string, { delta: number; exacto: boolean; ganador: boolean }> {
  const entries: Record<string, { delta: number; exacto: boolean; ganador: boolean }> = {};

  for (const pred of predicciones) {
    const puntos = calcularPuntos(pred, resultado, config);
    const esExacto = puntos === config.exacto;
    const esGanador = puntos === config.ganador;

    entries[pred.uid] = {
      delta: puntos,
      exacto: esExacto,
      ganador: esGanador && !esExacto,
    };
  }

  return entries;
}
