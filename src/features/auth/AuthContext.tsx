// src/features/auth/AuthContext.tsx
// Proveedor global de autenticación — envuelve toda la app

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../../services/firebase';
import { upsertUserProfile } from '../../services/usersService';
import type { UserProfile } from '../../types';

interface AuthContextValue {
  /** Usuario Firebase (null si no autenticado) */
  firebaseUser: User | null;
  /** Perfil extendido de Firestore — se actualiza en tiempo real */
  userProfile: UserProfile | null;
  /** true mientras se resuelve el estado inicial */
  loading: boolean;
  /** true si hay usuario autenticado */
  isAuthenticated: boolean;
  /** true si el usuario tiene rol admin */
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    // Procesar resultado de la redirección (OAuth redirect flow)
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log('Autenticación vía redirección exitosa para:', result.user.email);
        }
      })
      .catch((err) => {
        console.error('Error al procesar el resultado de la redirección:', err);
      });

    // Listener 1: Auth state (login / logout)
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
      } else {
        // Asegura que el documento exista en Firestore antes de suscribirse
        try {
          await upsertUserProfile(user);
        } catch (err) {
          console.error('Error al sincronizar perfil de usuario:', err);
        }
        // El onSnapshot de abajo se encargará de actualizar loading
      }
    });

    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    // Listener 2: Escucha cambios en tiempo real del perfil del usuario.
    // Esto actualiza gruposIds, role, etc. sin necesidad de recargar la página.
    const unsubProfile = onSnapshot(
      doc(db, COLLECTIONS.USERS, firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error en onSnapshot del perfil:', err);
        setLoading(false);
      },
    );

    return unsubProfile; // Limpia el listener al cambiar de usuario o desmontar
  }, [firebaseUser]);

  const value: AuthContextValue = {
    firebaseUser,
    userProfile,
    loading,
    isAuthenticated: !!firebaseUser,
    isAdmin: userProfile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook para consumir el contexto de auth */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
