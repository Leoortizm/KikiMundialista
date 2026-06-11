// src/components/layout/BottomNav.tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, BarChart3, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const { firebaseUser, isAdmin } = useAuth();

  // Si no está autenticado, no renderizamos la barra de navegación inferior
  if (!firebaseUser) return null;

  const navItems = [
    { to: '/dashboard',     label: 'Inicio',        icon: LayoutDashboard },
    { to: '/partidos',      label: 'Partidos',      icon: Calendar },
    { to: '/grupos',        label: 'Grupos',        icon: Users },
    { to: '/clasificacion', label: 'Ranking',       icon: BarChart3 },
    isAdmin
      ? { to: '/admin',     label: 'Admin',         icon: Shield }
      : { to: '/reglas',    label: 'Reglas',        icon: BookOpen }
  ];

  return (
    <nav className={styles.bottomNav} aria-label="Navegación móvil inferior">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')
          }
        >
          <Icon className={styles.icon} size={20} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
