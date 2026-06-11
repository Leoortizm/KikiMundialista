# 🏆 KikiMundialista — Mundial 2026

Plataforma interactiva de predicciones futbolísticas (polla/quiniela/kiki) para el Mundial 2026. Los usuarios pueden predecir resultados, unirse a grupos de amigos y competir en tiempo real por el liderazgo del torneo.

---

## 🚀 Características Principales

*   **Autenticación Segura**: Login mediante cuentas de Google a través de Firebase Authentication.
*   **Predicciones en Tiempo Real**: Envío y edición de predicciones para partidos en estado "programado" antes de su inicio.
*   **Grupos Privados**: Creación y unión a grupos cerrados compartiendo códigos de invitación únicos.
*   **Tabla de Clasificación (Leaderboard)**: Puntuación automatizada en tiempo real que mide el desempeño de todos los miembros de un grupo.
*   **Diseño Premium y Responsivo**: Experiencia de usuario pulida y adaptada a móviles mediante transiciones fluidas y componentes CSS personalizados.
*   **Seguridad Auditada**:
    *   Reglas robustas de Firestore para evitar secuestro de grupos, suplantación de identidades y escalación de privilegios.
    *   Cabeceras de seguridad optimizadas (CSP, X-Frame-Options, HSTS, Referrer Policy) configuradas en Firebase Hosting.
    *   Validaciones defensivas en el lado del cliente.

---

## 🛠️ Stack Tecnológico

*   **Frontend**: React (v19) + TypeScript + Vite
*   **Estilos**: Vanilla CSS con variables de diseño (tokens) y animaciones personalizadas
*   **Base de Datos y Auth**: Firebase (Authentication, Firestore con persistencia local/offline)
*   **Hosting**: Firebase Hosting

---

## 📦 Instalación y Configuración Local

1. **Clonar el repositorio** (si aplica) o descargar la carpeta del proyecto.
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Variables de Entorno**:
   Crea un archivo `.env.local` en la raíz del proyecto y completa las credenciales de tu proyecto de Firebase (toma como referencia el archivo `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY="tu-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="tu-proyecto"
   VITE_FIREBASE_STORAGE_BUCKET="tu-proyecto.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="tu-sender-id"
   VITE_FIREBASE_APP_ID="tu-app-id"
   ```
4. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

---

## 🚀 Despliegue (Deploy)

Para desplegar la aplicación a producción utilizando Firebase CLI, asegúrate de estar autenticado (`firebase login`) y ejecuta los siguientes comandos:

### Desplegar la aplicación web (Hosting):
```bash
# 1. Genera la build optimizada
npm run build

# 2. Despliega al hosting
firebase deploy --only hosting
```

### Desplegar reglas de base de datos (Firestore):
```bash
firebase deploy --only firestore:rules
```

---

## 📁 Estructura del Proyecto

*   `src/assets/`: Logos, iconos y recursos gráficos.
*   `src/components/`: Componentes comunes y layouts (Navbar, BottomNav, etc.).
*   `src/features/`: Lógica e interfaces divididas por contexto de negocio (Autenticación, Partidos).
*   `src/hooks/`: Hooks de React personalizados para consumo de Firestore.
*   `src/pages/`: Páginas principales (Dashboard, Clasificación, Grupos, Login).
*   `src/services/`: Capa de servicios y llamadas API centralizadas (Firebase Auth, Firestore, perfiles).
*   `src/styles/`: Sistema de tokens de diseño y hojas de estilo globales.
*   `src/utils/`: Funciones utilitarias (cálculo de puntos, formateo de fechas, etc.).
*   `firestore.rules`: Reglas de seguridad declarativas para la base de datos Firestore.
*   `firebase.json`: Configuración de Hosting y redirecciones.
