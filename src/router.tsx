// src/router.tsx
// Definición de rutas con React Router v6

import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AuthGuard, PublicOnlyGuard } from './components/auth/AuthGuard';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { lazy, Suspense } from 'react';

// Carga diferida de páginas (code splitting)
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const GruposPage       = lazy(() => import('./pages/GruposPage'));
const PartidosPage     = lazy(() => import('./pages/PartidosPage'));
const ClasificacionPage = lazy(() => import('./pages/ClasificacionPage'));
const AdminPage        = lazy(() => import('./pages/AdminPage'));
const ReglasPage       = lazy(() => import('./pages/ReglasPage'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );
}

/** Layout con Navbar — solo para rutas autenticadas */
function AppLayout() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </>
  );
}

export const router = createBrowserRouter([
  // ── Rutas públicas (solo si NO estás autenticado) ──
  {
    path: '/login',
    element: (
      <PublicOnlyGuard>
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </PublicOnlyGuard>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyGuard>
        <Suspense fallback={<PageLoader />}>
          <Register />
        </Suspense>
      </PublicOnlyGuard>
    ),
  },

  // ── Rutas protegidas (requieren auth) ──
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true,          element: <Dashboard /> },
      { path: '/dashboard',   element: <Dashboard /> },
      { path: '/grupos',      element: <GruposPage /> },
      { path: '/partidos',    element: <PartidosPage /> },
      { path: '/clasificacion', element: <ClasificacionPage /> },
      { path: '/reglas',      element: <ReglasPage /> },
      {
        path: '/admin',
        element: (
          <AuthGuard requireAdmin>
            <AdminPage />
          </AuthGuard>
        ),
      },
    ],
  },

  // ── 404 ──
  {
    path: '*',
    element: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: '1rem' }}>
        <h1 style={{ fontSize: '4rem', fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>404</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Página no encontrada</p>
        <a href="/dashboard" style={{ color: 'var(--color-primary-light)' }}>Volver al inicio</a>
      </div>
    ),
  },
]);
