// src/pages/Dashboard.tsx
// Vista principal post-login

import { useAuth } from '../features/auth/AuthContext';
import { Users, Calendar, BarChart3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import worldCupLogo from '../assets/world_cup_logo.png';
import triondaLogo from '../assets/Trionda.png';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { PageTransition } from '../components/layout/PageTransition';
import styles from './Dashboard.module.css';

const QUICK_ACTIONS = [
  {
    id:    'action-partidos',
    to:    '/partidos',
    icon:  Calendar,
    color: 'blue',
    label: 'Ver Partidos',
    desc:  'Consulta el calendario del Mundial 2026',
  },
  {
    id:    'action-grupos',
    to:    '/grupos',
    icon:  Users,
    color: 'green',
    label: 'Mis Grupos',
    desc:  'Crea o únete a una polla',
  },
  {
    id:    'action-clasificacion',
    to:    '/clasificacion',
    icon:  BarChart3,
    color: 'gold',
    label: 'Clasificación',
    desc:  'Ve quién va ganando',
  },
];

export default function Dashboard() {
  const { userProfile, firebaseUser } = useAuth();
  const name      = userProfile?.displayName ?? firebaseUser?.displayName ?? 'Jugador';
  const firstName = name.split(' ')[0];
  const gruposIds = userProfile?.gruposIds ?? [];

  const { puntosTotal, prediccionesHechas, aciertosExactos, loading: statsLoading } =
    useDashboardStats(firebaseUser?.uid, gruposIds);

  const STATS = [
    {
      label: 'Puntos totales',
      value: statsLoading ? '…' : puntosTotal > 0 ? String(puntosTotal) : '—',
      sub:   puntosTotal > 0 ? 'puntos acumulados' : 'sin predicciones aún',
      color: 'gold',
    },
    {
      label: 'Predicciones hechas',
      value: statsLoading ? '…' : String(prediccionesHechas),
      sub:   'de 104 partidos',
      color: 'blue',
    },
    {
      label: 'Aciertos exactos',
      value: statsLoading ? '…' : String(aciertosExactos),
      sub:   'marcador correcto (3 pts)',
      color: 'green',
    },
    {
      label: 'Grupos activos',
      value: String(gruposIds.length),
      sub:   gruposIds.length === 1 ? 'competencia' : 'competencias',
      color: 'red',
    },
  ];

  return (
    <PageTransition>
      <div className={`${styles.page} container`}>
      {/* Saludo */}
      <section className={`${styles.hero} animate-slide-up`}>
        <div className={styles.heroText}>
          <p className={styles.greeting}>¡Buenas, {firstName}! 👋</p>
          <h1 className={styles.heroTitle}>
            Bienvenido a la{' '}
            <span className="text-gradient">Polla del Mundial</span>
          </h1>
          <p className={styles.heroSub}>
            Mundial 2026 · USA / Canadá / México · 48 selecciones · 104 partidos
          </p>
        </div>
        <div className={styles.heroTrophy} aria-hidden="true">
          <img src={worldCupLogo} alt="World Cup 2026" className={styles.heroLogo} />
        </div>
      </section>

      {/* Stats reales */}
      <section className={`${styles.statsGrid} animate-slide-up`} style={{ animationDelay: '0.1s' }}>
        {STATS.map((stat) => (
          <div key={stat.label} className={`${styles.statCard} card ${styles[stat.color + 'Card']}`}>
            <p className={`${styles.statValue} ${statsLoading ? styles.statLoading : ''}`}>
              {stat.value}
            </p>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statSub}>{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* Quick actions */}
      <section className={styles.section} style={{ animationDelay: '0.2s' }}>
        <div className={styles.sectionHeader}>
          <img src={triondaLogo} alt="" className={styles.sectionHeaderLogo} />
          <h2 className={styles.sectionTitle}>¿Qué quieres hacer?</h2>
        </div>
        <div className={styles.actionsGrid}>
          {QUICK_ACTIONS.map(({ id, to, icon: Icon, color, label, desc }) => (
            <Link
              key={to}
              id={id}
              to={to}
              className={`${styles.actionCard} card card-hover ${styles[color]}`}
            >
              <div className={`${styles.actionIcon} ${styles[`icon_${color}`]}`}>
                <Icon size={24} />
              </div>
              <div className={styles.actionText}>
                <p className={styles.actionLabel}>{label}</p>
                <p className={styles.actionDesc}>{desc}</p>
              </div>
              <ArrowRight size={18} className={styles.actionArrow} />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA si no tiene grupos */}
      {gruposIds.length === 0 && (
        <div className={`${styles.ctaBanner} card animate-slide-up`} style={{ animationDelay: '0.3s' }}>
          <div className={styles.ctaContent}>
            <Users size={32} />
            <div>
              <p className={styles.ctaTitle}>Aún no estás en ningún grupo</p>
              <p className={styles.ctaDesc}>Crea una polla o únete con un código de invitación para competir con tus amigos.</p>
            </div>
          </div>
          <Link to="/grupos" id="cta-grupos" className={styles.ctaBtn}>
            Ir a Grupos <ArrowRight size={16} />
          </Link>
        </div>
      )}
      </div>
    </PageTransition>
  );
}
