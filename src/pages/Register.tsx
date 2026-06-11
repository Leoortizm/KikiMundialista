// src/pages/Register.tsx — Redirige a Login (Google OAuth crea cuenta automáticamente)
// No necesitamos pantalla de registro separada: el popup de Google crea la cuenta
// si es la primera vez, o hace login si ya existe.
import { Navigate } from 'react-router-dom';

export default function Register() {
  // Con Google OAuth no hay registro explícito: el flujo es idéntico al login.
  // Si alguien llega a /register, lo mandamos a /login directamente.
  return <Navigate to="/login" replace />;
}
