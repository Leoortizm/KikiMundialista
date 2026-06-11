import type { Prediccion, ResultadoPartido, ConfigPuntos } from '../types';

// Configuración de puntos por defecto (puede sobreescribirse desde Firestore)
export const DEFAULT_PUNTOS: ConfigPuntos = {
  exacto:  3,
  ganador: 1,
  fallo:   0,
};

/**
 * Calcula los puntos obtenidos para una predicción dado el resultado real.
 * Soporta fase de grupos (puede haber empate) y eliminatorias (ganador obligatorio).
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
  const ganadorReal = resultado.ganador;

  // Resultado exacto (marcador completo)
  if (pL === rL && pV === rV) {
    return config.exacto;
  }

  // Ganador correcto
  const ganadorPrediccion = pL > pV ? 'local' : pV > pL ? 'visitante' : 'empate';

  if (ganadorReal) {
    // Eliminatoria: solo local o visitante
    if (ganadorReal !== 'empate' && ganadorPrediccion === ganadorReal) {
      return config.ganador;
    }
    // Eliminatoria con definición por penales: verificar ganadorExtra
    if (
      prediccion.ganadorExtra &&
      prediccion.ganadorExtra === ganadorReal
    ) {
      return config.ganador;
    }
  } else {
    // Fase de grupos: empate también es ganador válido
    if (ganadorPrediccion === ganadorReal) {
      return config.ganador;
    }
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
