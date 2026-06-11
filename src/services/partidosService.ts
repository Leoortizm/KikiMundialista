// src/services/partidosService.ts

import {
  collection, doc, getDocs, getDoc,
  query, orderBy, updateDoc, setDoc,
  serverTimestamp, Timestamp, where, onSnapshot,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import type { Partido, ResultadoPartido, FasePartido } from '../types';
import worldCupData from '../assets/worldcup.json';

/** Todos los partidos ordenados por fecha (lectura única) */
export async function getPartidos(): Promise<Partido[]> {
  const q    = query(collection(db, COLLECTIONS.PARTIDOS), orderBy('fechaHora', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Partido);
}

/**
 * Suscripción en tiempo real a todos los partidos ordenados por fecha.
 * Retorna la función de limpieza (unsubscribe).
 */
export function subscribePartidos(
  callback: (partidos: Partido[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTIONS.PARTIDOS), orderBy('fechaHora', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as Partido)),
    (err) => { console.error('[partidos] onSnapshot error:', err); onError?.(err); },
  );
}

/** Partidos por fase */
export async function getPartidosByFase(fase: FasePartido): Promise<Partido[]> {
  const q    = query(
    collection(db, COLLECTIONS.PARTIDOS),
    where('fase', '==', fase),
    orderBy('fechaHora', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Partido);
}

/** Obtiene un partido por ID */
export async function getPartido(id: string): Promise<Partido | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.PARTIDOS, id));
  return snap.exists() ? (snap.data() as Partido) : null;
}

/** Admin: carga el resultado final y marca como finalizado */
export async function finalizarPartido(
  partidoId: string,
  resultado: ResultadoPartido,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PARTIDOS, partidoId), {
    resultado,
    estado:    'finalizado',
    updatedAt: serverTimestamp(),
  });
}

/** Admin: marca un partido como en vivo */
export async function marcarEnVivo(partidoId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PARTIDOS, partidoId), {
    estado:    'en_vivo',
    updatedAt: serverTimestamp(),
  });
}

/** Admin: agrega un partido nuevo (seed o manual) */
export async function addPartido(
  data: Omit<Partido, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = doc(collection(db, COLLECTIONS.PARTIDOS));
  await setDoc(ref, {
    ...data,
    id:        ref.id,
    estado:    'programado',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

const CODIGOS_EQUIPOS: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "RSA", "South Korea": "KOR", "Czech Republic": "CZE",
  "Canada": "CAN", "Bosnia & Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "USA": "USA", "Paraguay": "PAR", "Australia": "AUS", "Turkey": "TUR",
  "Germany": "GER", "Curaçao": "CUW", "Ivory Coast": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Jordan": "JOR", "Portugal": "POR",
  "DR Congo": "COD", "Colombia": "COL", "Uzbekistan": "UZB", "England": "ENG",
  "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN", "Venezuela": "VEN",
  "Jamaica": "JAM", "Chile": "CHI", "Perú": "PER", "Honduras": "HON",
  "Poland": "POL", "Camerún": "CMR", "Nigeria": "NGA", "Serbia": "SRB",
  "Costa de Marfil": "CIV", "Hungría": "HUN", "Turquía": "TUR", "Países Bajos": "NED",
  "Bélgica": "BEL", "Suiza": "SUI", "Dinamarca": "DEN", "Austria": "AUT",
  "Túnez": "TUN", "Suecia": "SWE", "Poland (POL)": "POL"
};

function getCodigoEquipo(nombre: string): string {
  if (CODIGOS_EQUIPOS[nombre]) return CODIGOS_EQUIPOS[nombre];
  const limpio = nombre.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  return limpio || 'TBD';
}

function getSedeInfo(ground: string): { estadio: string; ciudad: string; pais: string } {
  const g = ground.toLowerCase();
  if (g.includes('mexico city')) return { estadio: 'Estadio Azteca', ciudad: 'Ciudad de México', pais: 'MEX' };
  if (g.includes('guadalajara') || g.includes('zapopan')) return { estadio: 'Estadio Akron', ciudad: 'Guadalajara', pais: 'MEX' };
  if (g.includes('monterrey') || g.includes('guadalupe')) return { estadio: 'Estadio BBVA', ciudad: 'Monterrey', pais: 'MEX' };
  if (g.includes('toronto')) return { estadio: 'BMO Field', ciudad: 'Toronto', pais: 'CAN' };
  if (g.includes('vancouver')) return { estadio: 'BC Place', ciudad: 'Vancouver', pais: 'CAN' };
  if (g.includes('los angeles') || g.includes('inglewood')) return { estadio: 'SoFi Stadium', ciudad: 'Los Ángeles', pais: 'USA' };
  if (g.includes('san francisco') || g.includes('santa clara')) return { estadio: 'Levi\'s Stadium', ciudad: 'San Francisco', pais: 'USA' };
  if (g.includes('seattle')) return { estadio: 'Lumen Field', ciudad: 'Seattle', pais: 'USA' };
  if (g.includes('new york') || g.includes('east ruth')) return { estadio: 'MetLife Stadium', ciudad: 'Nueva York', pais: 'USA' };
  if (g.includes('boston') || g.includes('foxborough')) return { estadio: 'Gillette Stadium', ciudad: 'Boston', pais: 'USA' };
  if (g.includes('philadelphia')) return { estadio: 'Lincoln Financial Field', ciudad: 'Filadelfia', pais: 'USA' };
  if (g.includes('miami') || g.includes('gardens')) return { estadio: 'Hard Rock Stadium', ciudad: 'Miami', pais: 'USA' };
  if (g.includes('atlanta')) return { estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta', pais: 'USA' };
  if (g.includes('houston')) return { estadio: 'NRG Stadium', ciudad: 'Houston', pais: 'USA' };
  if (g.includes('kansas')) return { estadio: 'Arrowhead Stadium', ciudad: 'Kansas City', pais: 'USA' };
  if (g.includes('dallas') || g.includes('arlington')) return { estadio: 'AT&T Stadium', ciudad: 'Dallas', pais: 'USA' };
  return { estadio: ground, ciudad: ground, pais: 'USA' };
}

function parseFechaHora(dateStr: string, timeStr: string): Timestamp {
  const parts = timeStr.split(' ');
  const time = parts[0];
  const tz = parts[1] || 'UTC';
  let tzOffset = 'Z';
  if (tz.startsWith('UTC')) {
    const offset = tz.replace('UTC', '');
    if (offset) {
      const sign = offset.startsWith('-') ? '-' : '+';
      const num = Math.abs(parseInt(offset));
      const pad = num.toString().padStart(2, '0');
      tzOffset = `${sign}${pad}:00`;
    }
  }
  const isoStr = `${dateStr}T${time}:00${tzOffset}`;
  return Timestamp.fromDate(new Date(isoStr));
}

/** Borra todos los partidos de la base de datos */
export async function clearPartidos(): Promise<void> {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.PARTIDOS));
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);
  querySnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

/**
 * Seed oficial con los partidos del Mundial 2026 cargados desde worldcup.json.
 * Borra previamente los partidos existentes para evitar duplicados.
 */
export async function seedPartidosMundial2026(_adminUid?: string): Promise<void> {
  await clearPartidos();

  const partidos: Array<Omit<Partido, 'id' | 'createdAt' | 'updatedAt'>> = worldCupData.matches.map((m: any) => {
    let fase: FasePartido = 'grupos';
    const round = m.round.toLowerCase();
    
    if (round.includes('matchday')) {
      fase = 'grupos';
    } else if (round.includes('round of 32')) {
      fase = 'dieciseisavos';
    } else if (round.includes('round of 16')) {
      fase = 'octavos';
    } else if (round.includes('quarter-final')) {
      fase = 'cuartos';
    } else if (round.includes('semi-final')) {
      fase = 'semis';
    } else if (round.includes('third place')) {
      fase = 'tercer_puesto';
    } else if (round.includes('final')) {
      fase = 'final';
    }

    const grupoFase = fase === 'grupos' && m.group ? m.group.replace('Group ', '') : undefined;
    const { estadio, ciudad, pais } = getSedeInfo(m.ground);
    const fechaHora = parseFechaHora(m.date, m.time);

    const matchData: Omit<Partido, 'id' | 'createdAt' | 'updatedAt'> = {
      fase,
      equipoLocal: m.team1,
      codigoLocal: getCodigoEquipo(m.team1),
      equipoVisitante: m.team2,
      codigoVisitante: getCodigoEquipo(m.team2),
      fechaHora,
      estadio,
      ciudad,
      pais,
      estado: 'programado'
    };

    if (grupoFase) {
      matchData.grupoFase = grupoFase;
    }

    return matchData;
  });

  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);
  for (const p of partidos) {
    const ref = doc(collection(db, COLLECTIONS.PARTIDOS));
    batch.set(ref, {
      ...p,
      id:        ref.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

/**
 * Admin: actualiza los equipos de un partido eliminatorio (TBD) con los clasificados reales
 */
export async function updateEquiposPartido(
  partidoId: string,
  data: {
    equipoLocal: string;
    codigoLocal: string;
    equipoVisitante: string;
    codigoVisitante: string;
  }
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PARTIDOS, partidoId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
