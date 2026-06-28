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
            A partir de dieciseisavos de final, los partidos no pueden terminar en empate en la vida real. Si al término de los 90/120 minutos el marcador está empatado, el clasificado se define mediante penales. En estas fases aplica el selector de <strong>Ganador Extra</strong>.
          </p>

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
                  <td><strong>Marcador exacto con ganador claro en 90 min</strong></td>
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
            <h4 className={styles.faqQuestion}>¿Puedo cambiar mi predicción después de guardarla?</h4>
            <p className={styles.faqAnswer}>Sí, puedes modificar tu pronóstico las veces que quieras en la sección de Partidos, siempre y cuando el partido no haya comenzado (el contador del partido debe estar activo).</p>
          </div>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>¿Qué pasa si no guardo una predicción para un partido?</h4>
            <p className={styles.faqAnswer}>Si el partido comienza y no registraste tu marcador, se guardará automáticamente como "Sin predicción" y no sumarás puntos (0 puntos) para ese encuentro.</p>
          </div>
          <div className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>¿Los puntos y las predicciones son independientes por grupo?</h4>
            <p className={styles.faqAnswer}>Sí, son 100% independientes. Puedes ingresar pronósticos diferentes para el mismo partido en cada uno de tus grupos (por ejemplo, arriesgar un resultado en un grupo y ser más conservador en otro). En consecuencia, tu puntuación y tu posición en la tabla de clasificación se calculan de forma aislada dentro de cada grupo.</p>
          </div>
        </div>
      </section>
    </div>
    </PageTransition>
  );
}
