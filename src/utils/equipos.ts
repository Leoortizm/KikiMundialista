// src/utils/equipos.ts
// Mapeo de códigos FIFA (3 letras) → nombre en español + bandera emoji/URL SVG

import worldCupTeams from '../assets/worldcup.teams.json';

export interface InfoEquipo {
  nombre: string;
  flag:   string;
}

const NOMBRES_ESP: Record<string, string> = {
  // Grupo A
  MEX: 'México',
  RSA: 'Sudáfrica',
  KOR: 'Corea del Sur',
  CZE: 'República Checa',
  // Grupo B
  CAN: 'Canadá',
  BIH: 'Bosnia y Herzegovina',
  QAT: 'Qatar',
  SUI: 'Suiza',
  // Grupo C
  BRA: 'Brasil',
  MAR: 'Marruecos',
  HAI: 'Haití',
  SCO: 'Escocia',
  // Grupo D
  USA: 'Estados Unidos',
  PAR: 'Paraguay',
  AUS: 'Australia',
  TUR: 'Turquía',
  // Grupo E
  GER: 'Alemania',
  CUW: 'Curazao',
  CIV: 'Costa de Marfil',
  ECU: 'Ecuador',
  // Grupo F
  NED: 'Países Bajos',
  JPN: 'Japón',
  SWE: 'Suecia',
  TUN: 'Túnez',
  // Grupo G
  BEL: 'Bélgica',
  EGY: 'Egipto',
  IRN: 'Irán',
  NZL: 'Nueva Zelanda',
  // Grupo H
  ESP: 'España',
  CPV: 'Cabo Verde',
  KSA: 'Arabia Saudita',
  URU: 'Uruguay',
  // Grupo I
  FRA: 'Francia',
  SEN: 'Senegal',
  IRQ: 'Irak',
  NOR: 'Noruega',
  // Grupo J
  ARG: 'Argentina',
  ALG: 'Argelia',
  AUT: 'Austria',
  JOR: 'Jordania',
  // Grupo K
  POR: 'Portugal',
  COD: 'República Democrática del Congo',
  UZB: 'Uzbekistán',
  COL: 'Colombia',
  // Grupo L
  ENG: 'Inglaterra',
  CRO: 'Croacia',
  GHA: 'Ghana',
  PAN: 'Panamá'
};

export const EQUIPOS: Record<string, InfoEquipo> = {};

// Poblamos el diccionario EQUIPOS usando el JSON
worldCupTeams.forEach((t: any) => {
  const code = t.fifa_code;
  EQUIPOS[code] = {
    nombre: NOMBRES_ESP[code] || t.name,
    flag: t.flag_icon
  };
});

/** Devuelve la bandera emoji de un equipo por su código FIFA (fallback) */
export function getFlag(codigo: string): string {
  return EQUIPOS[codigo]?.flag ?? '🏳️';
}

/** Devuelve el nombre en español de un equipo por su código FIFA */
export function getNombre(codigo: string): string {
  return EQUIPOS[codigo]?.nombre ?? codigo;
}

/** Devuelve la URL de la bandera SVG/PNG de flagcdn.com a partir del código FIFA */
export function getFlagUrl(codigo: string): string | null {
  if (!codigo || codigo.length < 3 || /^\d|W\d|L\d/.test(codigo)) {
    return null; // Es un placeholder de eliminación (ej: '1A', 'W74')
  }

  // Casos especiales para el Reino Unido (Escocia, Inglaterra)
  if (codigo === 'SCO') return 'https://flagcdn.com/w40/gb-sct.png';
  if (codigo === 'ENG') return 'https://flagcdn.com/w40/gb-eng.png';

  const emoji = EQUIPOS[codigo]?.flag;
  if (!emoji) return null;

  try {
    const chars = Array.from(emoji);
    if (chars.length < 2) return null;
    const iso2 = chars
      .slice(0, 2)
      .map(char => String.fromCodePoint(char.codePointAt(0)! - 127397))
      .join('')
      .toLowerCase();

    return `https://flagcdn.com/w40/${iso2}.png`;
  } catch (e) {
    console.error(`Error parsing flag for ${codigo}:`, e);
    return null;
  }
}
