# SAV - Proyecto (Updated v1.6.1)

Plataforma web responsive con sistema de tareas por video, niveles, retiros, recargas y panel administrativo.

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
2. Ejecuta los scripts en `supabase/migrations/` en el SQL Editor (del 001 al 005)
3. Añade en `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (Solo en el servidor)
   - `SUPABASE_ANON_KEY` (Para el cliente frontend)

## Credenciales de Acceso

Las credenciales deben ser gestionadas de forma privada. Por seguridad, las contraseñas predeterminadas han sido removidas de este documento.

### Código de invitación
- Contactar con un administrador o usuario VIP para obtener un código válido.

## Estructura

```
sav proyecto/
├── backend/          # API Node.js + Express
├── frontend/         # React + Vite + Tailwind
├── supabase/         # Migraciones SQL
├── imag/             # Imágenes del carrusel
└── DISENO-VISUAL-SAV.md
```

## Funcionalidades

- ✅ Autenticación (login, registro con código de invitación)
- ✅ Dashboard con carrusel
- ✅ Sala de tareas por nivel
- ✅ Detalle de tarea con pregunta/encuesta
- ✅ Perfil de usuario con estadísticas
- ✅ Retiro (con contraseña de fondo)
- ✅ Recarga
- ✅ Tabla de niveles VIP / ganancias
- ✅ Registro de facturación (ingresos/gastos)
- ✅ Sorteo / ruleta
- ✅ Seguridad de cuenta
- ✅ Panel admin (usuarios, recargas, retiros)

## Observaciones

Este proyecto es una **demo educativa**. No usar en producción sin revisión de seguridad, legal y financiera.
