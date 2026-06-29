// src/pages/ReglasPage.tsx
// Página de reglas e instrucciones del juego

import { Trophy, Target, HelpCircle, BookOpen, AlertTriangle } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition';
import styles from './ReglasPage.module.css';

export default function ReglasPage() {
  return (
    <PageTransition>
      <div className={`${styles.page} container`}>
      {/* Hero Banner */}
      <div className={`${styles.hero} animate-slide-up`}>
        <div className={styles.heroContent}>
          <div className={styles.heroIconWrap}><BookOpen size={28} /></div>
          <div>
            <h1 className={styles.title}>Reglas del Juego</h1>
            <p className={styles.subtitle}>Descubre cómo sumar puntos y convertirte en el campeón de la polla</p>
          </div>
        </div>
      </div>
      {/* Pasos para Jugar */}
      <section className={`${styles.section} animate-slide-up`} style={{ animationDelay: '0.05s' }}>
        <h2 className={styles.sectionTitle}><Trophy size={18} /> ¿Cómo Jugar?</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Crea o únete a un grupo</h3>
            <p className={styles.stepDesc}>Crea tu propio grupo para competir con amigos o únete a uno existente usando el código de invitación de 6 caracteres.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Registra tus predicciones</h3>
            <p className={styles.stepDesc}>Ve a la sección de Partidos e ingresa tu marcador pronosticado para cada encuentro. Tienes tiempo hasta el pitazo inicial de cada partido.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>¡Suma puntos en vivo!</h3>
            <p className={styles.stepDesc}>Una vez que el administrador finalice un partido con el resultado real, los puntos se calcularán automáticamente y ascenderás en la clasificación.</p>
          </div>
        </div>
      </section>

      {/* Sistema de Puntuación General */}
      <section className={`${styles.section} animate-slide-up`} style={{ animationDelay: '0.1s' }}>
        <h2 className={styles.sectionTitle}><Target size={18} /> Sistema de Puntuación General</h2>
        <p className={styles.introText}>
          Tus pronósticos se comparan con el resultado real del partido al finalizar. Los puntos base se otorgan de la siguiente manera:
        </p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Acierto</th>
                <th>Puntos</th>
                <th>Descripción</th>
                <th>Ejemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.rowExacto}>
                <td className={styles.aciertoCell}>
                  <span className={`${styles.badge} ${styles.badgeExacto}`}>🎯 Marcador Exacto</span>
                </td>
                <td className={styles.puntosCell}><strong>3 pts</strong></td>
                <td>Acertar el número exacto de goles de ambos equipos.</td>
                <td>Predicción: <strong>2 - 1</strong> | Resultado: <strong>2 - 1</strong></td>
              </tr>
              <tr className={styles.rowGanador}>
                <td className={styles.aciertoCell}>
                  <span className={`${styles.badge} ${styles.badgeGanador}`}>✓ Ganador / Empate</span>
                </td>
                <td className={styles.puntosCell}><strong>1 pt</strong></td>
                <td>Acertar qué equipo gana (o si hay empate) pero no el marcador exacto.</td>
                <td>Predicción: <strong>3 - 0</strong> | Resultado: <strong>1 - 0</strong></td>
              </tr>
              <tr className={styles.rowFallo}>
                <td className={styles.aciertoCell}>
                  <span className={`${styles.badge} ${styles.badgeFallo}`}>✗ Pronóstico Incorrecto</span>
                </td>
                <td className={styles.puntosCell}><strong>0 pts</strong></td>
                <td>No acertar el resultado del partido ni la tendencia (ganador/empate).</td>
                <td>Predicción: <strong>1 - 1</strong> | Resultado: <strong>0 - 2</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Reglas de Eliminatorias (Playoffs) */}
      <section className={`${styles.section} animate-slide-up`} style={{ animationDelay: '0.15s' }}>
        <h2 className={styles.sectionTitle}><AlertTriangle size={18} /> Fase de Eliminatorias (Playoffs y Ganador Extra)</h2>
        <div className={styles.elimInfo}>
          <p className={styles.elimText}>
            En playoffs, los partidos no pueden quedar en tablas. Tu marcador pronosticado aplica para todo el tiempo de juego antes de penales (<strong>90 minutos + prórroga de 120 minutos si la hay</strong>). Solo si tras los 120 minutos el marcador sigue igualado y van a <strong>tanda de penales</strong>, aplica tu elección de <strong>Ganador Extra</strong>.
          </p>

          <div className={styles.infoBox} style={{ marginBlock: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
            <h4 style={{ margin: 0, marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              📌 Clarificación importante sobre prórrogas y penales:
            </h4>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <li><strong>Marcador pronosticado:</strong> Incluye los 90 minutos reglamentarios MÁS el tiempo extra (120 min). Si queda 1-1 en los 90 min y en el alargue termina 2-1, el marcador real del partido es 2-1.</li>
              <li><strong>Tanda de penales (Ganador Extra):</strong> Se activa únicamente cuando tras los 120 minutos el marcador sigue en empate. Ahí se evalúa quién avanzó en la tanda de penales frente a tu selección de Ganador Extra.</li>
            </ul>
          </div>

          <div className={styles.tableWrap} style={{ marginTop: 'var(--space-4)' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Escenario (Playoffs)</th>
                  <th>Ejemplo de Pronóstico vs Realidad</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.rowExacto}>
                  <td><strong>Marcador exacto con ganador claro en 90/120 min</strong></td>
                  <td>Predije 3-1 | Resultado 3-1</td>
                  <td className={styles.puntosCell}><strong>3 pts</strong></td>
                </tr>
                <tr className={styles.rowExacto}>
                  <td><strong>Marcador exacto de empate + Ganador Extra Acierto ✅</strong></td>
                  <td>Predije 1-1 + "Avanza Local" | Resultado 1-1 (Gana Local en penales)</td>
                  <td className={styles.puntosCell}><strong>3 pts</strong></td>
                </tr>
                <tr className={styles.rowGanador}>
                  <td><strong>Marcador exacto de empate + Ganador Extra Fallo ❌</strong></td>
                  <td>Predije 1-1 + "Avanza Visitante" | Resultado 1-1 (Gana Local en penales)</td>
                  <td className={styles.puntosCell}><strong>1 pt</strong></td>
                </tr>
                <tr className={styles.rowGanador}>
                  <td><strong>Acertar solo ganador/empate sin marcador exacto</strong></td>
                  <td>Predije 2-0 | Resultado 3-1</td>
                  <td className={styles.puntosCell}><strong>1 pt</strong></td>
                </tr>
                <tr className={styles.rowGanador}>
                  <td><strong>Predijo empate sin acertar marcador + Ganador Extra Acierto</strong></td>
                  <td>Predije 2-2 + "Avanza Local" | Resultado 1-1 (Gana Local en penales)</td>
                  <td className={styles.puntosCell}><strong>1 pt</strong></td>
                </tr>
                <tr className={styles.rowFallo}>
                  <td><strong>Fallo Total</strong></td>
                  <td>No acertaste el resultado ni la tendencia</td>
                  <td className={styles.puntosCell}><strong>0 pts</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ rápido */}
      <section className={`${styles.section} animate-slide-up`} style={{ animationDelay: '0.2s' }}>
        <h2 className={styles.sectionTitle}><HelpCircle size={18} /> Preguntas Frecuentes</h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>En los partidos de eliminatorias, ¿mi marcador cuenta para 90 o 120 minutos?</h4>
            <p className={styles.faqAnswer}>El marcador que pronosticas aplica para todo el tiempo de juego disputado antes de los tiros penales. Esto incluye los 90 minutos reglamentarios más el alargue/prórroga de 30 minutos si lo hubiere (120 minutos en total).</p>
          </div>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>¿Puedo cambiar mi predicción después de guardarla?</h4>
            <p className={styles.faqAnswer}>Sí, puedes modificar tu pronóstico las veces que quieras en la sección de Partidos, siempre y cuando el partido no haya comenzado (el contador del partido debe estar activo).</p>
          </div>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>¿Qué pasa si no guardo una predicción para un partido?</h4>
            <p className={styles.faqAnswer}>Si el partido comienza y no registraste tu marcador, se guardará automáticamente como "Sin predicción" y no sumarás puntos (0 puntos) para ese encuentro.</p>
          </div>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>¿Los puntos y las predicciones son independientes por grupo?</h4>
            <p className={styles.faqAnswer}>Sí, son 100% independientes. Puedes ingresar pronósticos diferentes para el mismo partido en cada uno de tus grupos. Tu puntuación y tu posición en la tabla de clasificación se calculan de forma aislada dentro de cada grupo.</p>
          </div>
        </div>
      </section>
    </div>
    </PageTransition>
  );
}
