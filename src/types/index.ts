import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────
export interface UserProfile {
  uid: string;              // Firebase Auth UID (= doc ID)
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'player';
  createdAt: Timestamp;
  gruposIds: string[];      // IDs de grupos donde participa
}

// ─────────────────────────────────────────────
// GRUPO
// ─────────────────────────────────────────────
export interface Grupo {
  id: string;
  nombre: string;
  descripcion?: string;
  adminUid: string;
  miembros: string[];       // Array de UIDs
  codigoInvitacion: string; // 6 chars alfanumérico único
  isPublico: boolean;
  temporada: string;        // "Mundial 2026"
  createdAt: Timestamp;
  solicitudesPendientes?: string[]; // Array de UIDs esperando aprobación
}

// ─────────────────────────────────────────────
// PARTIDO
// ─────────────────────────────────────────────
export type FasePartido =
  | 'grupos'
  | 'dieciseisavos'
  | 'octavos'
  | 'cuartos'
  | 'semis'
  | 'tercer_puesto'
  | 'final';

export type EstadoPartido = 'programado' | 'en_vivo' | 'finalizado';

export interface ResultadoPartido {
  golesLocal: number;
  golesVisitante: number;
  /** Para eliminatorias: ganador después de penales si aplica */
  ganador?: 'local' | 'visitante' | 'empate';
}

export interface Partido {
  id: string;
  fase: FasePartido;
  grupoFase?: string;        // "A"…"L" — solo fase de grupos
  equipoLocal: string;       // "Argentina"
  equipoVisitante: string;   // "España"
  codigoLocal: string;       // "ARG" — para banderas emoji/SVG
  codigoVisitante: string;   // "ESP"
  fechaHora: Timestamp;
  estadio: string;
  ciudad: string;
  pais: string;              // "USA" | "CAN" | "MEX"
  resultado?: ResultadoPartido;
  estado: EstadoPartido;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// PREDICCIÓN
// Subcolección: grupos/{grupoId}/predicciones
// doc ID: "{partidoId}_{uid}"
// ─────────────────────────────────────────────
export interface Prediccion {
  id: string;
  partidoId: string;
  uid: string;
  golesLocal: number;
  golesVisitante: number;
  /** Para eliminatorias: quién gana después de empate/penales */
  ganadorExtra?: 'local' | 'visitante';
  puntosObtenidos?: number;  // null hasta que el partido finalice
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// LEADERBOARD
// Colección: leaderboards/{grupoId}/entries/{uid}
// ─────────────────────────────────────────────
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  puntosTotal: number;
  prediccionesExactas: number;    // Marcador exacto (3 pts)
  prediccionesGanador: number;    // Solo ganador correcto (1 pt)
  partidosPredichos: number;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// CONFIG (Firestore: config/puntos)
// ─────────────────────────────────────────────
export interface ConfigPuntos {
  exacto: number;    // default: 3
  ganador: number;   // default: 1
  fallo: number;     // default: 0
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
