// src/components/layout/Navbar.tsx
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, BarChart3, Shield, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { signOut } from '../../services/authService';
import styles from './Navbar.module.css';
import logoColor from '../../assets/logo_color.png';

const NAV_LINKS = [
  { to: '/dashboard',     label: 'Inicio',         icon: LayoutDashboard },
  { to: '/partidos',      label: 'Partidos',        icon: Calendar        },
  { to: '/grupos',        label: 'Mis Grupos',      icon: Users           },
  { to: '/clasificacion', label: 'Clasificación',   icon: BarChart3       },
  { to: '/reglas',        label: 'Reglas',          icon: BookOpen        },
];

export function Navbar() {
  const { firebaseUser, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [signingOut,  setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } finally {
      setSigningOut(false);
    }
  }

  const displayName = userProfile?.displayName ?? firebaseUser?.displayName ?? 'Jugador';
  const photoURL    = userProfile?.photoURL    ?? firebaseUser?.photoURL    ?? null;
  const initials    = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <header className={`${styles.navbar} glass`}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link to="/dashboard" className={styles.brand} id="nav-logo">
            <img src={logoColor} alt="KikiMundialista Logo" className={styles.brandLogo} />
            <span className={styles.brandName}>KikiMundialista</span>
          </Link>

          {/* Nav desktop */}
          <nav className={styles.desktopNav} aria-label="Navegación principal">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                id={`nav-${to.replace('/', '')}`}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                id="nav-admin"
                className={({ isActive }) =>
                  [styles.navLink, styles.adminLink, isActive ? styles.navLinkActive : ''].join(' ')
                }
              >
                <Shield size={16} />
                Admin
              </NavLink>
            )}
          </nav>

          {/* Perfil + logout */}
          <div className={styles.userSection}>
            <div className={styles.avatar} title={displayName}>
              {photoURL ? (
                <img src={photoURL} alt={displayName} className={styles.avatarImg} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </div>
            <span className={styles.userName}>{displayName.split(' ')[0]}</span>
            <button
              id="btn-sign-out"
              className={styles.signOutBtn}
              onClick={handleSignOut}
              disabled={signingOut}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              {signingOut
                ? <span className="spinner" style={{ width: 16, height: 16 }} />
                : <LogOut size={16} />
              }
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
