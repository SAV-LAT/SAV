# SAV (v4.2.0 - Despliegue Final)

🚀 **Actualización Crítica**: Sistema de Recargas Seleccionables, Reembolso Automático de Inversión y Botones de Telegram (Polling) implementados.

Plataforma profesional de Activos Virtuales con sistema de tareas por video, niveles VIP, gestión financiera y panel administrativo en tiempo real.

## Requisitos

- Node.js 18+
- npm

## Instalación

### 1. Backend

```bash
cd backend
npm install
```

Crear archivo `.env` (opcional, hay valores por defecto para demo):

```
PORT=4000
JWT_SECRET=tu_clave_secreta
```

Iniciar:

```bash
npm run dev
```

El API estará en `http://localhost:4000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará en `http://localhost:5173`

### 3. Base de datos (Supabase)

Este proyecto requiere una conexión activa a Supabase. El **Modo Demo (memoria) ha sido desactivado** para garantizar la consistencia de datos en producción.

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta los scripts en `supabase/migrations/` en el SQL Editor (del 001 al 006)
3. Añade en `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (Solo en el servidor)
   - `SUPABASE_ANON_KEY` (Para el cliente frontend)

## Estructura

```
sav/
├── backend/          # API Node.js + Express
├── frontend/         # React + Vite + Tailwind (App Android Capacitor)
├── supabase/         # Migraciones SQL
├── video/            # Repositorio oficial de videos
└── DISENO-VISUAL-SAV.md
```

## Funcionalidades

- ✅ Tiempo Real: Saldo y ganancias actualizados al instante vía WebSockets.
- ✅ Videos Locales: Reproducción directa desde el servidor, sin dependencias externas.
- ✅ App Nativa: Lista para generar APK Android mediante Capacitor.
- ✅ Multinivel: Sistema de comisiones por red de afiliados.
- ✅ Seguridad: Encriptación de contraseñas y claves de retiro.
- ✅ Panel Admin: Control total de usuarios, finanzas y contenido.

## Observaciones

Este proyecto es una plataforma de gestión de activos virtuales. No usar en producción sin revisión de seguridad y legalidad financiera.
