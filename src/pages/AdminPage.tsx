// src/pages/AdminPage.tsx
import { useState, useEffect } from 'react';
import { Database, CheckCircle, Loader, Edit } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import {
  subscribePartidos,
  finalizarPartido,
  marcarEnVivo,
  seedPartidosMundial2026,
  updateEquiposPartido
} from '../services/partidosService';
import { getFasesHabilitadas, updateFasesHabilitadas } from '../services/configService';
import { EQUIPOS, getNombre } from '../utils/equipos';
import type { FasePartido } from '../types';
import { calcularPuntosParaTodosLosGrupos } from '../services/prediccionesService';
import { actualizarLeaderboardParaTodosLosGrupos } from '../services/leaderboardService';
import { getDocs, collection } from 'firebase/firestore';
import { db, COLLECTIONS } from '../services/firebase';
import { Button } from '../components/common/Button';
import { PageTransition } from '../components/layout/PageTransition';
import type { Partido } from '../types';
import styles from './AdminPage.module.css';

type ResultForm = { golesLocal: string; golesVisitante: string; ganador: '' | 'local' | 'visitante' | 'empate' };

export default function AdminPage() {
  const { firebaseUser } = useAuth();

  const [partidos,       setPartidos]       = useState<Partido[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState('');
  const [seeding,        setSeeding]        = useState(false);
  const [seedMsg,        setSeedMsg]        = useState('');
  const [savingId,       setSavingId]       = useState<string | null>(null);
  const [successIds,     setSuccessIds]     = useState<Set<string>>(new Set());
  const [forms,          setForms]          = useState<Record<string, ResultForm>>({});
  const [fasesHabilitadas, setFasesHabilitadas] = useState<FasePartido[]>(['grupos']);

  // Carga fases habilitadas al montar
  useEffect(() => {
    getFasesHabilitadas().then(setFasesHabilitadas);
  }, []);

  async function handleToggleFase(fase: FasePartido) {
    const nuevas = fasesHabilitadas.includes(fase)
      ? fasesHabilitadas.filter((f) => f !== fase)
      : [...fasesHabilitadas, fase];
    setFasesHabilitadas(nuevas);
    try {
      await updateFasesHabilitadas(nuevas);
    } catch (err) {
      console.error('Error al guardar fases:', err);
      alert('Error al guardar la configuración de fases.');
    }
  }

  async function handleUpdateEquipos(
    partidoId: string,
    localCode: string,
    visCode: string
  ) {
    const eqLocal = getNombre(localCode);
    const eqVis = getNombre(visCode);
    await updateEquiposPartido(partidoId, {
      equipoLocal: eqLocal,
      codigoLocal: localCode,
      equipoVisitante: eqVis,
      codigoVisitante: visCode
    });
  }

  // ── Partidos: suscripción en tiempo real ──────────────────────────────
  useEffect(() => {
    setLoading(true);
    setLoadError('');

    const unsubscribe = subscribePartidos(
      (ps) => {
        setPartidos(ps);
        // Sincroniza formularios: preserva el valor actual si el admin ya lo editó
        setForms((prev) => {
          const next: Record<string, ResultForm> = {};
          ps.forEach((p) => {
            next[p.id] = prev[p.id] ?? {
              golesLocal:     p.resultado?.golesLocal.toString()     ?? '0',
              golesVisitante: p.resultado?.golesVisitante.toString() ?? '0',
              ganador:        p.resultado?.ganador ?? '',
            };
          });
          return next;
        });
        setLoading(false);
      },
      (err) => {
        setLoadError(err.message ?? 'Error al cargar partidos.');
        setLoading(false);
      },
    );

    return unsubscribe; // limpia el listener al desmontar
  }, []);

  function updateForm(id: string, field: keyof ResultForm, value: string) {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleFinalizar(partido: Partido) {
    const form = forms[partido.id];
    const gl   = parseInt(form.golesLocal);
    const gv   = parseInt(form.golesVisitante);
    if (isNaN(gl) || isNaN(gv)) return;

    setSavingId(partido.id);
    try {
      const resultado = {
        golesLocal:     gl,
        golesVisitante: gv,
        ganador: form.ganador || (gl > gv ? 'local' : gv > gl ? 'visitante' : 'empate') as 'local' | 'visitante' | 'empate',
      };
      await finalizarPartido(partido.id, resultado);

      // Obtener la lista más reciente de grupos para no ignorar grupos nuevos
      const gruposSnap = await getDocs(collection(db, COLLECTIONS.GRUPOS));
      const latestGruposIds = gruposSnap.docs.map((d) => d.id);

      // 1. Calcula y persiste los puntos en cada predicción (retorna el Map)
      const prediccionesPorGrupo = await calcularPuntosParaTodosLosGrupos(
        latestGruposIds, partido.id, resultado,
      );

      // 2. Actualiza el leaderboard de cada grupo con los nuevos puntos
      await actualizarLeaderboardParaTodosLosGrupos(
        latestGruposIds, prediccionesPorGrupo, resultado,
      );

      setSuccessIds((prev) => new Set([...prev, partido.id]));
      setTimeout(() => setSuccessIds((prev) => { const s = new Set(prev); s.delete(partido.id); return s; }), 3000);
    } catch (err) {
      console.error('Error al finalizar partido:', err);
      alert('Error al finalizar el partido. Revisa la consola para más detalles.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleEnVivo(id: string) {
    try {
      await marcarEnVivo(id);
    } catch (err) {
      console.error('Error al marcar en vivo:', err);
      alert('Error al marcar en vivo. Revisa la consola.');
    }
  }

  async function handleSeed() {
    if (!confirm('¿Seguro que quieres borrar todos los partidos existentes y cargar el fixture oficial completo (104 partidos) del Mundial 2026? Esta acción eliminará los marcadores de prueba actuales.')) return;
    setSeeding(true); setSeedMsg('');
    try {
      await seedPartidosMundial2026(firebaseUser!.uid);
      setSeedMsg('✅ Fixture completo de 104 partidos cargado. Recarga la página.');
    } catch (e: unknown) {
      setSeedMsg(`❌ ${(e as Error).message}`);
    } finally {
      setSeeding(false);
    }
  }

  const pendientes  = partidos.filter((p) => p.estado === 'programado');
  const enVivo      = partidos.filter((p) => p.estado === 'en_vivo');
  const finalizados = partidos.filter((p) => p.estado === 'finalizado');

  return (
    <PageTransition>
      <div className={`${styles.page} container`}>
        <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel Admin</h1>
          <p className={styles.subtitle}>Carga resultados y gestiona el torneo</p>
        </div>
      </div>

      {/* Panel de control de fases */}
      <div className={`${styles.configBox} card`}>
        <h2 className={styles.configTitle}>⚙️ Configuración de Fases Activas</h2>
        <p className={styles.configDesc}>
          Habilita o deshabilita las fases del torneo para los jugadores comunes. Los usuarios comunes solo verán y podrán hacer predicciones en las fases seleccionadas:
        </p>
        <div className={styles.fasesGrid}>
          {([
            { key: 'grupos',         label: 'Fase de Grupos' },
            { key: 'dieciseisavos',  label: 'Dieciseisavos (R32)' },
            { key: 'octavos',        label: 'Octavos de Final' },
            { key: 'cuartos',        label: 'Cuartos de Final' },
            { key: 'semis',          label: 'Semifinales' },
            { key: 'tercer_puesto',  label: '3er Puesto' },
            { key: 'final',          label: 'Final' }
          ] as { key: FasePartido; label: string }[]).map((f) => {
            const active = fasesHabilitadas.includes(f.key);
            return (
              <label key={f.key} className={styles.faseLabel}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handleToggleFase(f.key)}
                  className={styles.checkbox}
                />
                <span className={active ? styles.faseActive : ''}>{f.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Error de carga */}
      {loadError && (
        <div role="alert" style={{
          padding: 'var(--space-4) var(--space-5)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(227,29,43,0.25)',
          background: 'rgba(227,29,43,0.06)',
          color: 'var(--color-danger)',
          fontSize: 'var(--text-sm)',
          marginBottom: 'var(--space-2)',
        }}>
          ⚠️ {loadError}
        </div>
      )}

      {/* Seed — solo cuando ya terminó de cargar */}
      {!loading && partidos.length === 0 && (
        <div className={`${styles.seedBox} card`}>
          <Database size={32} className={styles.seedIcon} />
          <div>
            <p className={styles.seedTitle}>Base de datos vacía</p>
            <p className={styles.seedDesc}>Carga el fixture oficial completo (104 partidos) del Mundial 2026 para comenzar.</p>
          </div>
          <Button id="btn-seed" variant="primary" loading={seeding} onClick={handleSeed}>
            Cargar 104 partidos
          </Button>
          {seedMsg && <p className={styles.seedMsg}>{seedMsg}</p>}
        </div>
      )}

      {partidos.length > 0 && (
        <div className={`${styles.seedBox} card`} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <p style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Hay <strong>{partidos.length}</strong> partidos en la base de datos.
          </p>
          <Button id="btn-seed-more" variant="danger" size="sm" loading={seeding} onClick={handleSeed}>
            Borrar y re-cargar fixture (104 partidos)
          </Button>
          {seedMsg && <p className={styles.seedMsg}>{seedMsg}</p>}
        </div>
      )}

      {loading ? (
        <div className={styles.loader}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : loadError ? null : (
        <>
          {/* En vivo */}
          {enVivo.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>🔴 En vivo</h2>
              <div className={styles.grid}>
                {enVivo.map((p) => (
                  <ResultCard key={p.id} partido={p} form={forms[p.id]} saving={savingId === p.id}
                    success={successIds.has(p.id)} onUpdate={updateForm} onFinalizar={handleFinalizar}
                    onUpdateEquipos={handleUpdateEquipos} />
                ))}
              </div>
            </section>
          )}

          {/* Pendientes */}
          {pendientes.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>⏳ Programados</h2>
              <div className={styles.grid}>
                {pendientes.map((p) => (
                  <ResultCard key={p.id} partido={p} form={forms[p.id]} saving={savingId === p.id}
                    success={successIds.has(p.id)} onUpdate={updateForm} onFinalizar={handleFinalizar}
                    onEnVivo={handleEnVivo} onUpdateEquipos={handleUpdateEquipos} />
                ))}
              </div>
            </section>
          )}

          {/* Finalizados */}
          {finalizados.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>✅ Finalizados</h2>
              <div className={styles.grid}>
                {finalizados.map((p) => (
                  <ResultCard key={p.id} partido={p} form={forms[p.id]} saving={savingId === p.id}
                    success={successIds.has(p.id)} onUpdate={updateForm} onFinalizar={handleFinalizar}
                    onUpdateEquipos={handleUpdateEquipos} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
    </PageTransition>
  );
}

// ── Subcomponente ResultCard ──
interface ResultCardProps {
  partido:      Partido;
  form:         ResultForm;
  saving:       boolean;
  success:      boolean;
  onUpdate:     (id: string, field: keyof ResultForm, value: string) => void;
  onFinalizar:  (p: Partido) => void;
  onEnVivo?:    (id: string) => void;
  onUpdateEquipos: (partidoId: string, localCode: string, visCode: string) => Promise<void>;
}

function ResultCard({
  partido,
  form,
  saving,
  success,
  onUpdate,
  onFinalizar,
  onEnVivo,
  onUpdateEquipos
}: ResultCardProps) {
  const esElim = partido.fase !== 'grupos';

  const [editando, setEditando] = useState(false);
  const [localCode, setLocalCode] = useState(partido.codigoLocal);
  const [visCode, setVisCode] = useState(partido.codigoVisitante);
  const [guardandoEquipos, setGuardandoEquipos] = useState(false);

  // Sincroniza códigos si cambian en la base de datos externamente
  useEffect(() => {
    setLocalCode(partido.codigoLocal);
    setVisCode(partido.codigoVisitante);
  }, [partido.codigoLocal, partido.codigoVisitante]);

  const optionsEquipos = Object.entries(EQUIPOS)
    .map(([code, info]) => ({ code, nombre: info.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const localExiste = EQUIPOS[partido.codigoLocal] != null;
  const visExiste = EQUIPOS[partido.codigoVisitante] != null;

  async function handleSaveEquipos() {
    setGuardandoEquipos(true);
    try {
      await onUpdateEquipos(partido.id, localCode, visCode);
      setEditando(false);
    } catch (error) {
      console.error('Error al guardar equipos:', error);
      alert('No se pudo guardar la modificación de equipos.');
    } finally {
      setGuardandoEquipos(false);
    }
  }

  return (
    <div className={`${styles.resultCard} card`}>
      <div className={styles.cardHeader}>
        <span className={styles.matchName}>
          <strong>{partido.codigoLocal}</strong> vs <strong>{partido.codigoVisitante}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: 'normal', marginTop: '2px' }}>
            ({partido.equipoLocal} vs {partido.equipoVisitante})
          </span>
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {partido.estado === 'programado' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditando(!editando)}
              leftIcon={<Edit size={12} />}
              style={{ padding: '4px var(--space-2)' }}
            >
              {editando ? 'Cancelar' : 'Equipos'}
            </Button>
          )}
          {partido.grupoFase && (
            <span className={`${styles.badge} ${styles.badgeGrupo}`}>Grupo {partido.grupoFase}</span>
          )}
        </div>
      </div>

      {editando ? (
        <div className={styles.editEquiposForm}>
          <span className={styles.editEquiposTitle}>Editar Selecciones ({partido.fase.replace('_', ' ')})</span>
          <div className={styles.editSelects}>
            <div className={styles.editSelectGroup}>
              <label className={styles.editSelectLabel}>Equipo Local</label>
              <select
                className={styles.editSelect}
                value={localCode}
                onChange={(e) => setLocalCode(e.target.value)}
              >
                {!localExiste && <option value={partido.codigoLocal}>{partido.equipoLocal} (Actual)</option>}
                {optionsEquipos.map((opt) => (
                  <option key={opt.code} value={opt.code}>{opt.nombre} ({opt.code})</option>
                ))}
              </select>
            </div>
            <div className={styles.editSelectGroup}>
              <label className={styles.editSelectLabel}>Equipo Visitante</label>
              <select
                className={styles.editSelect}
                value={visCode}
                onChange={(e) => setVisCode(e.target.value)}
              >
                {!visExiste && <option value={partido.codigoVisitante}>{partido.equipoVisitante} (Actual)</option>}
                {optionsEquipos.map((opt) => (
                  <option key={opt.code} value={opt.code}>{opt.nombre} ({opt.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.editActions}>
            <Button variant="secondary" size="sm" onClick={() => setEditando(false)} disabled={guardandoEquipos}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={guardandoEquipos} onClick={handleSaveEquipos}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.scoreForm}>
            <input type="number" min="0" max="20"
              className={styles.scoreInput}
              value={form?.golesLocal ?? '0'}
              onChange={(e) => onUpdate(partido.id, 'golesLocal', e.target.value)}
              aria-label={`Goles ${partido.equipoLocal}`}
            />
            <span className={styles.scoreDash}>—</span>
            <input type="number" min="0" max="20"
              className={styles.scoreInput}
              value={form?.golesVisitante ?? '0'}
              onChange={(e) => onUpdate(partido.id, 'golesVisitante', e.target.value)}
              aria-label={`Goles ${partido.equipoVisitante}`}
            />
          </div>

          {/* Ganador (solo eliminatorias y si hay empate) */}
          {esElim && (
            <select className={styles.ganadorSelect}
              value={form?.ganador ?? ''}
              onChange={(e) => onUpdate(partido.id, 'ganador', e.target.value)}>
              <option value="">Ganador (si hay penales)</option>
              <option value="local">{partido.equipoLocal}</option>
              <option value="visitante">{partido.equipoVisitante}</option>
            </select>
          )}

          <div className={styles.cardActions}>
            {onEnVivo && partido.estado === 'programado' && (
              <Button variant="danger" size="sm" onClick={() => onEnVivo(partido.id)}>
                Marcar en vivo
              </Button>
            )}
            <Button id={`btn-finalizar-${partido.id}`} variant={success ? 'success' : 'primary'} size="sm"
              loading={saving} onClick={() => onFinalizar(partido)}
              leftIcon={success ? <CheckCircle size={15} /> : saving ? <Loader size={15} /> : undefined}>
              {success ? '¡Guardado!' : partido.estado === 'finalizado' ? 'Recalcular/Corregir' : 'Finalizar partido'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
