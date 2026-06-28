// src/pages/PartidosPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Users, AlertCircle, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { getPartidos } from '../services/partidosService';
import { getUserPrediccionesMap } from '../services/prediccionesService';
import { getGruposByIds } from '../services/gruposService';
import { PartidoCard } from '../features/partidos/PartidoCard';
import { subscribeFasesHabilitadas } from '../services/configService';
import { PageTransition } from '../components/layout/PageTransition';
import type { Partido, Prediccion, Grupo, FasePartido } from '../types';
import styles from './PartidosPage.module.css';

type Fase = 'todos' | 'grupos' | 'dieciseisavos' | 'octavos' | 'cuartos' | 'semis' | 'tercer_puesto' | 'final';

const FASES: { key: Fase; label: string }[] = [
  { key: 'todos',          label: 'Todos'      },
  { key: 'grupos',         label: 'Fase de grupos' },
  { key: 'dieciseisavos',  label: 'Dieciseisavos' },
  { key: 'octavos',        label: 'Octavos'    },
  { key: 'cuartos',        label: 'Cuartos'    },
  { key: 'semis',          label: 'Semis'      },
  { key: 'tercer_puesto',  label: '3er puesto' },
  { key: 'final',          label: 'Final'      },
];

export default function PartidosPage() {
  const { firebaseUser, userProfile } = useAuth();
  const uid = firebaseUser!.uid;

  const [partidos,      setPartidos]      = useState<Partido[]>([]);
  const [grupos,        setGrupos]        = useState<Grupo[]>([]);
  const [grupoSelec,    setGrupoSelec]    = useState<string>('');
  const [predsMap,      setPredsMap]      = useState<Map<string, Prediccion>>(new Map());
  const [fase,          setFase]          = useState<Fase>('todos');
  const [loading,       setLoading]       = useState(true);
  const [loadingPreds,  setLoadingPreds]  = useState(false);
  const [fasesHabilitadas, setFasesHabilitadas] = useState<FasePartido[]>(['grupos']);

  // Suscripción a fases habilitadas
  useEffect(() => {
    const unsubscribe = subscribeFasesHabilitadas((f) => {
      setFasesHabilitadas(f);
    });
    return unsubscribe;
  }, []);

  // Carga partidos y grupos una sola vez
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ps, gs] = await Promise.all([
          getPartidos(),
          getGruposByIds(userProfile?.gruposIds ?? []),
        ]);
        setPartidos(ps);
        setGrupos(gs);
        if (gs.length > 0) setGrupoSelec(gs[0].id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userProfile?.gruposIds]);

  // Carga predicciones cuando cambia el grupo seleccionado
  const loadPreds = useCallback(async () => {
    if (!grupoSelec) return;
    setLoadingPreds(true);
    try {
      const map = await getUserPrediccionesMap(grupoSelec, uid);
      setPredsMap(map);
    } finally {
      setLoadingPreds(false);
    }
  }, [grupoSelec, uid]);

  useEffect(() => { loadPreds(); }, [loadPreds]);

  function handleSaved(partidoId: string, data: { golesLocal: number; golesVisitante: number }) {
    setPredsMap((prev) => {
      const next = new Map(prev);
      const existing = prev.get(partidoId);
      next.set(partidoId, {
        ...(existing ?? {}),
        id:             `${partidoId}_${uid}`,
        partidoId,
        uid,
        golesLocal:     data.golesLocal,
        golesVisitante: data.golesVisitante,
      } as Prediccion);
      return next;
    });
  }

  const isAdmin = userProfile?.role === 'admin';

  // Si no es admin, solo puede ver partidos de las fases habilitadas
  const partidosPermitidos = isAdmin
    ? partidos
    : partidos.filter((p) => fasesHabilitadas.includes(p.fase));

  const partidosFiltrados = fase === 'todos'
    ? partidosPermitidos
    : partidosPermitidos.filter((p) => p.fase === fase);

  const fasesVisibles = FASES.filter((f) => {
    if (f.key === 'todos') return true;
    if (isAdmin) return true;
    return fasesHabilitadas.includes(f.key as FasePartido);
  });

  // En "todos": agrupar por fecha (orden cronológico). En otras fases: por grupo/fase.
  const formatFechaKey = (ts: import('../types').Partido['fechaHora']) => {
    const d = ts.toDate();
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const partidosAgrupados: Record<string, Partido[]> = {};
  for (const p of partidosFiltrados) {
    let key: string;
    if (fase === 'todos') {
      key = formatFechaKey(p.fechaHora);
    } else if (fase === 'grupos' || p.fase === 'grupos') {
      key = `Grupo ${p.grupoFase ?? '?'}`;
    } else {
      key = p.fase.charAt(0).toUpperCase() + p.fase.slice(1).replace('_', ' ');
    }
    if (!partidosAgrupados[key]) partidosAgrupados[key] = [];
    partidosAgrupados[key].push(p);
  }

  // En "todos", ordenar las fechas cronológicamente
  const entradasAgrupadas = fase === 'todos'
    ? Object.entries(partidosAgrupados).sort(([, a], [, b]) =>
        a[0].fechaHora.toMillis() - b[0].fechaHora.toMillis()
      )
    : Object.entries(partidosAgrupados);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 'var(--space-16)' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  if (partidos.length === 0) {
    return (
      <div className={`${styles.page} container`}>
        <div className={styles.emptyPartidos}>
          <p>No hay partidos cargados aún.</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            El admin debe cargar los partidos desde el panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={`${styles.page} container`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Partidos</h1>
          <p className={styles.subtitle}>Mundial 2026 · {partidos.length} partidos</p>
        </div>

        {/* Selector de grupo */}
        {grupos.length === 0 ? (
          <div className={styles.noGrupo}>
            <AlertCircle size={16} />
            <span>Únete a un <Link to="/grupos">grupo</Link> para hacer predicciones</span>
          </div>
        ) : grupos.length > 1 ? (
          <div className={styles.grupoSelector}>
            <label htmlFor="sel-grupo" className={styles.grupoLabel}>Prediciendo para:</label>
            <select
              id="sel-grupo"
              className={styles.grupoSelect}
              value={grupoSelec}
              onChange={(e) => setGrupoSelec(e.target.value)}
            >
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.grupoSingle}>
            <Users size={14} />
            <span>{grupos[0].nombre}</span>
          </div>
        )}
      </div>

      {/* Tabs de fase */}
      <div className={styles.faseTabs} role="tablist" aria-label="Filtrar por fase">
        {fasesVisibles.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={fase === key}
            className={[styles.faseTab, fase === key ? styles.faseTabActive : ''].join(' ')}
            onClick={() => setFase(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Partidos agrupados */}
      {loadingPreds ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 'var(--space-8)' }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : (
        <div className={styles.grupos}>

          {/* ── Partidos de HOY (solo en tab "Todos") ── */}
          {fase === 'todos' && (() => {
            const hoy = new Date();
            const hoyStr = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`;
            const deHoy = partidosFiltrados.filter((p) => {
              const f = p.fechaHora.toDate();
              return `${f.getFullYear()}-${f.getMonth()}-${f.getDate()}` === hoyStr;
            });
            if (deHoy.length === 0) return null;
            return (
              <section className={styles.todaySection}>
                <div className={styles.todayHeader}>
                  <CalendarClock size={16} className={styles.todayIcon} />
                  <h2 className={styles.todayTitle}>Partidos de hoy</h2>
                  <span className={styles.todayCount}>{deHoy.length} {deHoy.length === 1 ? 'partido' : 'partidos'}</span>
                </div>
                <div className={styles.grid}>
                  {deHoy.map((p) => (
                    <PartidoCard
                      key={p.id}
                      partido={p}
                      grupoId={grupoSelec}
                      uid={uid}
                      prediccion={predsMap.get(p.id)}
                      onSaved={handleSaved}
                    />
                  ))}
                </div>
              </section>
            );
          })()}

          {/* ── Resto de partidos agrupados ── */}
          {entradasAgrupadas.map(([grupo, ps]) => (
            <section key={grupo} className={styles.grupoSection}>
              <h2 className={styles.grupoTitle}>
                {grupo.charAt(0).toUpperCase() + grupo.slice(1)}
              </h2>
              <div className={styles.grid}>
                {ps.map((p) => (
                  <PartidoCard
                    key={p.id}
                    partido={p}
                    grupoId={grupoSelec}
                    uid={uid}
                    prediccion={predsMap.get(p.id)}
                    onSaved={handleSaved}
                  />
                ))}
              </div>
            </section>
          ))}
          {entradasAgrupadas.length === 0 && (
            <p className={styles.noPartidos}>No hay partidos en esta fase aún.</p>
          )}
        </div>
      )}
      </div>
    </PageTransition>
  );
}
