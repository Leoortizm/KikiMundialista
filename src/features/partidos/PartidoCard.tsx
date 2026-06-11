// src/features/partidos/PartidoCard.tsx
import { useState, useEffect } from 'react';
import { Lock, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { Partido, Prediccion } from '../../types';
import { getFlag, getFlagUrl, getNombre } from '../../utils/equipos';
import { aceptaPredicciones, formatFechaPartido, formatCountdown } from '../../utils/fechas';
import { savePrediccion } from '../../services/prediccionesService';
import { Button } from '../../components/common/Button';
import styles from './PartidoCard.module.css';

interface PartidoCardProps {
  partido:    Partido;
  grupoId:    string;
  uid:        string;
  prediccion: Prediccion | undefined;
  onSaved:    (partidoId: string, pred: { golesLocal: number; golesVisitante: number }) => void;
}

export function PartidoCard({ partido, grupoId, uid, prediccion, onSaved }: PartidoCardProps) {
  const abierto  = aceptaPredicciones(partido.fechaHora) && partido.estado === 'programado';

  const [gl,       setGl]      = useState(prediccion?.golesLocal      ?? 0);
  const [gv,       setGv]      = useState(prediccion?.golesVisitante   ?? 0);
  const [saving,   setSaving]  = useState(false);
  const [saved,    setSaved]   = useState(false);
  const [error,    setError]   = useState('');
  const [countdown,setCd]      = useState(formatCountdown(partido.fechaHora));

  // Sincroniza si llega predicción externa
  useEffect(() => {
    if (prediccion) {
      setGl(prediccion.golesLocal);
      setGv(prediccion.golesVisitante);
    }
  }, [prediccion]);

  // Countdown en tiempo real
  useEffect(() => {
    const id = setInterval(() => setCd(formatCountdown(partido.fechaHora)), 30_000);
    return () => clearInterval(id);
  }, [partido.fechaHora]);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await savePrediccion(grupoId, uid, partido.id, { golesLocal: gl, golesVisitante: gv });
      setSaved(true);
      onSaved(partido.id, { golesLocal: gl, golesVisitante: gv });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  function cambio(valor: number, actual: number, set: (n: number) => void) {
    const n = actual + valor;
    if (n >= 0 && n <= 20) { set(n); setSaved(false); }
  }

  // ── Badge de estado ──
  const estadoBadge = {
    programado: { label: countdown,    cls: styles.badgeProgramado, icon: <Clock size={12} /> },
    en_vivo:    { label: '🔴 En vivo', cls: styles.badgeEnVivo,    icon: null },
    finalizado: { label: '✅ Finalizado', cls: styles.badgeFinalizado, icon: null },
  }[partido.estado];

  // ── Puntos obtenidos (solo si finalizado y hay predicción) ──
  const pts = prediccion?.puntosObtenidos;
  const ptsBadge =
    partido.estado === 'finalizado' && prediccion != null
      ? pts === 3
        ? { label: '+3 pts 🎯', cls: styles.ptsGold }
        : pts === 1
          ? { label: '+1 pt ✓',  cls: styles.ptsSilver }
          : { label: '0 pts ✗',  cls: styles.ptsFail }
      : null;

  return (
    <article className={`${styles.card} card card-hover`}>
      {/* Header */}
      <div className={styles.header}>
        <span className={`${styles.badge} ${estadoBadge.cls}`}>
          {estadoBadge.icon}
          {estadoBadge.label}
        </span>
        {partido.grupoFase && (
          <span className={styles.grupo}>Grupo {partido.grupoFase}</span>
        )}
      </div>

      {/* Equipos */}
      <div className={styles.matchup}>
        {/* Local */}
        <div className={styles.team}>
          <div className={styles.flagWrapper}>
            {getFlagUrl(partido.codigoLocal) ? (
              <img
                src={getFlagUrl(partido.codigoLocal)!}
                alt={`Bandera de ${getNombre(partido.codigoLocal)}`}
                className={styles.flagImg}
              />
            ) : (
              <span className={styles.flagPlaceholder}>{getFlag(partido.codigoLocal)}</span>
            )}
          </div>
          <span className={styles.teamName} title={getNombre(partido.codigoLocal)}>{partido.codigoLocal}</span>
        </div>

        {/* Marcador real (si finalizado) o predicción editable */}
        <div className={styles.scoreArea}>
          {partido.estado === 'finalizado' && partido.resultado ? (
            // Resultado real
            <div className={styles.resultFinal}>
              <span className={styles.goalFinal}>{partido.resultado.golesLocal}</span>
              <span className={styles.dash}>—</span>
              <span className={styles.goalFinal}>{partido.resultado.golesVisitante}</span>
            </div>
          ) : abierto ? (
            // Inputs editables
            <div className={styles.scoreInputs}>
              <div className={styles.counter}>
                <button className={styles.counterBtn} onClick={() => cambio(-1, gl, setGl)} aria-label="Restar local">−</button>
                <span className={styles.counterVal}>{gl}</span>
                <button className={styles.counterBtn} onClick={() => cambio(+1, gl, setGl)} aria-label="Sumar local">+</button>
              </div>
              <span className={styles.vs}>—</span>
              <div className={styles.counter}>
                <button className={styles.counterBtn} onClick={() => cambio(-1, gv, setGv)} aria-label="Restar visitante">−</button>
                <span className={styles.counterVal}>{gv}</span>
                <button className={styles.counterBtn} onClick={() => cambio(+1, gv, setGv)} aria-label="Sumar visitante">+</button>
              </div>
            </div>
          ) : (
            // Cerrado sin resultado
            <div className={styles.lockedScore}>
              <Lock size={16} />
              {prediccion
                ? <span>{prediccion.golesLocal} — {prediccion.golesVisitante}</span>
                : <span className={styles.noPred}>Sin predicción</span>
              }
            </div>
          )}
        </div>

        {/* Visitante */}
        <div className={`${styles.team} ${styles.teamRight}`}>
          <div className={styles.flagWrapper}>
            {getFlagUrl(partido.codigoVisitante) ? (
              <img
                src={getFlagUrl(partido.codigoVisitante)!}
                alt={`Bandera de ${getNombre(partido.codigoVisitante)}`}
                className={styles.flagImg}
              />
            ) : (
              <span className={styles.flagPlaceholder}>{getFlag(partido.codigoVisitante)}</span>
            )}
          </div>
          <span className={styles.teamName} title={getNombre(partido.codigoVisitante)}>{partido.codigoVisitante}</span>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.fecha}>{formatFechaPartido(partido.fechaHora)}</span>
        <span className={styles.estadio}>🏟 {partido.estadio}</span>
      </div>

      {/* Mi predicción label (cuando está cerrado y hay pred) */}
      {partido.estado === 'finalizado' && prediccion && (
        <div className={styles.myPred}>
          <span>Tu predicción: {prediccion.golesLocal} — {prediccion.golesVisitante}</span>
          {ptsBadge && <span className={`${styles.ptsBadge} ${ptsBadge.cls}`}>{ptsBadge.label}</span>}
        </div>
      )}

      {/* Acciones (solo si abierto) */}
      {abierto && (
        <div className={styles.actions}>
          {error && (
            <p className={styles.error} role="alert">
              <AlertCircle size={14} /> {error}
            </p>
          )}
          <Button
            id={`btn-pred-${partido.id}`}
            variant={saved ? 'success' : 'primary'}
            size="sm"
            fullWidth
            loading={saving}
            onClick={handleSave}
            leftIcon={saved ? <CheckCircle size={15} /> : undefined}
          >
            {saved ? '¡Guardado!' : prediccion ? 'Actualizar predicción' : 'Guardar predicción'}
          </Button>
        </div>
      )}
    </article>
  );
}
