import { Timestamp } from 'firebase/firestore';

/** Convierte un Firestore Timestamp a Date nativo */
export function toDate(ts: Timestamp): Date {
  return ts.toDate();
}

/** Formatea fecha larga: "Martes 11 de junio · 20:00 hs" */
export function formatFechaPartido(ts: Timestamp, locale = 'es-MX'): string {
  const date = ts.toDate();
  const fecha = date.toLocaleDateString(locale, {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });
  const hora = date.toLocaleTimeString(locale, {
    hour:   '2-digit',
    minute: '2-digit',
  });
  const capitalizada = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  return `${capitalizada} · ${hora} hs`;
}

/** Formatea hora corta: "20:00" */
export function formatHora(ts: Timestamp, locale = 'es-MX'): string {
  return ts.toDate().toLocaleTimeString(locale, {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/** Formatea fecha corta: "11 jun" */
export function formatFechaCorta(ts: Timestamp, locale = 'es-MX'): string {
  return ts.toDate().toLocaleDateString(locale, {
    day:   'numeric',
    month: 'short',
  });
}

/** Formatea countdown hasta el partido: "2d 4h 30m" | "En curso" | "Finalizado" */
export function formatCountdown(ts: Timestamp): string {
  const now  = Date.now();
  const diff = ts.toDate().getTime() - now;

  if (diff <= 0 && diff > -120 * 60 * 1000) return '⏱ En curso';
  if (diff <= -120 * 60 * 1000) return 'Finalizado';

  const totalMin = Math.floor(diff / 60_000);
  const days  = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins  = totalMin % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Verifica si el partido aún acepta predicciones (antes de la hora de inicio) */
export function aceptaPredicciones(fechaHora: Timestamp): boolean {
  return fechaHora.toDate().getTime() > Date.now();
}

/** Genera timestamp de ahora para Firestore */
export function nowTimestamp(): Timestamp {
  return Timestamp.now();
}
