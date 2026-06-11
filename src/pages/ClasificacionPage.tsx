// src/pages/ClasificacionPage.tsx
// Leaderboard en tiempo real — Fase 4

import { useState, useEffect } from 'react';
import { BarChart3, Users, Target, CheckCircle, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getGruposByIds } from '../services/gruposService';
import { PageTransition } from '../components/layout/PageTransition';
import type { LeaderboardEntry, Grupo } from '../types';
import styles from './ClasificacionPage.module.css';
import logoSinColor from '../assets/logo_sin_color.png';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

// ─────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────

interface AvatarProps {
  entry: LeaderboardEntry;
  size?: 'sm' | 'md' | 'lg';
  isMe?: boolean;
}
function Avatar({ entry, size = 'md', isMe = false }: AvatarProps) {
  return (
    <div className={`${styles.avatar} ${styles[`avatar_${size}`]} ${isMe ? styles.avatarMe : ''}`}>
      {entry.photoURL ? (
        <img
          src={entry.photoURL}
          alt={entry.displayName}
          className={styles.avatarImg}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className={styles.avatarInitials}>{getInitials(entry.displayName)}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Podio Top 3
// ─────────────────────────────────────────────

interface PodiumProps {
  top3:  LeaderboardEntry[];
  myUid: string;
}
function Podium({ top3, myUid }: PodiumProps) {
  // Reordenamos para display: 2nd | 1st | 3rd
  const displayOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heightMap    = [styles.podiumSilver, styles.podiumGold, styles.podiumBronze];
  const indexMap     = [1, 0, 2];

  return (
    <div className={styles.podium}>
      {displayOrder.map((entry, i) => {
        const realIndex = indexMap[i];
        const isMe = entry.uid === myUid;
        return (
          <div
            key={entry.uid}
            className={`${styles.podiumSlot} ${heightMap[i]} ${isMe ? styles.podiumMe : ''}`}
          >
            <div className={styles.podiumMedal}>{MEDAL[realIndex]}</div>
            <Avatar entry={entry} size="lg" isMe={isMe} />
            <p className={styles.podiumName}>{entry.displayName.split(' ')[0]}</p>
            <div className={styles.podiumBar}>
              <span className={styles.podiumPoints}>{entry.puntosTotal}</span>
              <span className={styles.podiumPts}>pts</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Fila de la tabla
// ─────────────────────────────────────────────

interface RowProps {
  entry: LeaderboardEntry;
  pos:   number;
  isMe:  boolean;
}
function LeaderRow({ entry, pos, isMe }: RowProps) {
  return (
    <div className={`${styles.row} ${isMe ? styles.rowMe : ''}`}>
      <span className={styles.rowPos}>
        {pos <= 3 ? MEDAL[pos - 1] : <span className={styles.rowPosNum}>{pos}</span>}
      </span>
      <Avatar entry={entry} size="sm" isMe={isMe} />
      <span className={styles.rowName}>
        {entry.displayName}
        {isMe && <span className={styles.rowYou}>Tú</span>}
      </span>
      <span className={styles.rowStat} title="Marcadores exactos (3 pts)">
        <CheckCircle size={13} className={styles.iconExacto} />
        {entry.prediccionesExactas}
      </span>
      <span className={styles.rowStat} title="Ganador correcto (1 pt)">
        <Target size={13} className={styles.iconGanador} />
        {entry.prediccionesGanador}
      </span>
      <span className={styles.rowStat} title="Partidos predichos">
        <BarChart3 size={13} className={styles.iconPartidos} />
        {entry.partidosPredichos}
      </span>
      <span className={styles.rowPoints}>
        {entry.puntosTotal} <span className={styles.rowPts}>pts</span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Página Principal
// ─────────────────────────────────────────────

export default function ClasificacionPage() {
  const { firebaseUser, userProfile } = useAuth();
  const myUid    = firebaseUser!.uid;
  const grupoIds = userProfile?.gruposIds ?? [];

  // Cargar metadatos de grupos para mostrar nombres reales en los tabs
  const [grupos,        setGrupos]        = useState<Grupo[]>([]);
  const [gruposLoading, setGruposLoading] = useState(false);

  useEffect(() => {
    if (grupoIds.length === 0) return;
    setGruposLoading(true);
    getGruposByIds(grupoIds)
      .then(setGrupos)
      .catch(() => {/* silencioso */})
      .finally(() => setGruposLoading(false));
  }, [grupoIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(
    grupoIds.length > 0 ? grupoIds[0] : null,
  );

  // Sync selectedGrupoId cuando carguen los grupos por primera vez
  useEffect(() => {
    if (!selectedGrupoId && grupoIds.length > 0) {
      setSelectedGrupoId(grupoIds[0]);
    }
  }, [grupoIds.join(','), selectedGrupoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { entries, loading, error } = useLeaderboard(selectedGrupoId);

  // Nombre del grupo actualmente seleccionado
  const selectedGrupo = grupos.find((g) => g.id === selectedGrupoId);
  const top3  = entries.slice(0, 3);
  const rest  = entries.slice(3);
  const myPos = entries.findIndex((e) => e.uid === myUid);

  // ── Sin grupos ──────────────────────────────
  if (!gruposLoading && grupoIds.length === 0) {
    return (
      <PageTransition>
        <div className={`${styles.page} container`}>
          <div className={styles.emptyState}>
            <img src={logoSinColor} alt="KikiMundialista Logo" className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>No estás en ningún grupo</h2>
            <p className={styles.emptyDesc}>
              Únete a una polla para ver la clasificación de tus amigos.
            </p>
            <Link to="/grupos" className={styles.emptyBtn}>
              <Users size={16} /> Ir a Mis Grupos
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={`${styles.page} container`}>
        {/* Header */}
        <div className={`${styles.header} animate-slide-up`}>
          <div>
            <h1 className={styles.title}>Clasificación</h1>
            <p className={styles.subtitle}>
              {selectedGrupo
                ? `${selectedGrupo.nombre} · ${entries.length} participante${entries.length !== 1 ? 's' : ''}`
                : 'Ranking en tiempo real · Mundial 2026'}
            </p>
          </div>
          {/* Indicador en vivo */}
          <div className={styles.liveBadge}>
            <Radio size={13} className={styles.liveDot} />
            En vivo
          </div>
        </div>

        {/* Selector de grupo (si hay más de uno) */}
        {grupos.length > 1 && (
          <div className={`${styles.groupTabs} animate-slide-up`} style={{ animationDelay: '0.05s' }}>
            {grupos.map((g) => (
              <button
                key={g.id}
                className={`${styles.groupTab} ${selectedGrupoId === g.id ? styles.groupTabActive : ''}`}
                onClick={() => setSelectedGrupoId(g.id)}
              >
                <Users size={14} />
                {g.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Cargando */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 'var(--space-12)' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={`${styles.errorCard} card animate-scale-in`}>
            <p className={styles.errorText}>Error al cargar la clasificación: {error}</p>
          </div>
        )}

        {/* Estado vacío (si no hay suficientes personas o datos) */}
        {!loading && !error && entries.length === 0 && (
          <div className={styles.emptyState}>
            <img src={logoSinColor} alt="KikiMundialista Logo" className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>Sin participantes</h2>
            <p className={styles.emptyDesc}>No hay predicciones ni puntos registrados en este grupo aún.</p>
            <Link to="/partidos" className={styles.emptyBtn}>
              <BarChart3 size={16} /> Hacer predicciones
            </Link>
          </div>
        )}

        {/* Mi posición (si no estoy en top 3) */}
        {!loading && myPos >= 3 && (
          <div className={`${styles.myPosBanner} card animate-slide-up`} style={{ animationDelay: '0.1s' }}>
            <span className={styles.myPosLabel}>Tu posición</span>
            <span className={styles.myPosNum}>#{myPos + 1}</span>
            <span className={styles.myPosPoints}>{entries[myPos]?.puntosTotal ?? 0} pts</span>
          </div>
        )}

        {/* Podio top 3 */}
        {!loading && top3.length >= 2 && (
          <div className="card animate-slide-up" style={{ animationDelay: '0.15s', padding: 'var(--space-6)' }}>
            <Podium top3={top3} myUid={myUid} />
          </div>
        )}

        {/* Tabla completa */}
        {!loading && entries.length > 0 && (
          <div className={`${styles.tableWrap} card animate-slide-up`} style={{ animationDelay: '0.2s' }}>
            {/* Cabecera */}
            <div className={styles.tableHeader}>
              <span className={styles.thPos}>#</span>
              <span aria-hidden="true"></span> {/* Espacio reservado para el Avatar */}
              <span className={styles.thName}>Jugador</span>
              <span className={styles.thStat} title="Marcadores exactos (3 pts)"><CheckCircle size={14} /></span>
              <span className={styles.thStat} title="Ganador correcto (1 pt)"><Target size={14} /></span>
              <span className={styles.thStat} title="Partidos predichos"><BarChart3 size={14} /></span>
              <span className={styles.thPoints}>Puntos</span>
            </div>

            {/* Filas */}
            {entries.map((entry, i) => (
              <LeaderRow
                key={entry.uid}
                entry={entry}
                pos={i + 1}
                isMe={entry.uid === myUid}
              />
            ))}

            {top3.length >= 2 && rest.length > 0 && (
              <p className={styles.restNote}>
                {entries.length} participantes en total
              </p>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
