# Sistema de Autenticación Implementado

## Resumen de la Implementación

Se ha implementado un sistema de autenticación completo y seguro para la aplicación de gestión de dispositivos utilizando **Better Auth** en el backend y **React Router** en el frontend.

## Características Implementadas

### Backend (Elysia + Bun + Better Auth)

#### 1. Configuración de Better Auth
- **Ubicación**: `Back/src/core/auth/auth.config.ts`
- **Base de datos**: SQLite con tablas para usuarios, sesiones, cuentas y verificación
- **Estrategia**: Email/Password con hash seguro de contraseñas
- **Sesiones**: 7 días de duración con renovación automática

#### 2. Endpoints de Autenticación
Todos los endpoints de autenticación están disponibles en `/api/auth/*`:
- `POST /api/auth/sign-up/email` - Registro de nuevos usuarios
- `POST /api/auth/sign-in/email` - Inicio de sesión
- `POST /api/auth/sign-out` - Cierre de sesión
- `GET /api/auth/get-session` - Obtener sesión actual

#### 3. Middleware de Autenticación
- **Ubicación**: `Back/src/core/auth/auth.middleware.ts`
- Protege todas las rutas de dispositivos
- Valida la sesión en cada request
- Retorna 401 si no hay autenticación válida

#### 4. Rutas Protegidas
Todas estas rutas ahora requieren autenticación:
- `GET /api/computers`
- `GET /api/medicaldevices`
- `GET /api/computers/frequent`
- `GET /api/devices/entered`
- `POST /api/computers/checkin`
- `POST /api/medicaldevices/checkin`
- `POST /api/computers/frequent`
- `PATCH /api/computers/frequent/checkin/:id`
- `PATCH /api/devices/checkout/:id`

#### 5. CORS Configurado
- Permite credenciales (cookies de sesión)
- Origen permitido: `http://localhost:5173`
- Headers permitidos: `Content-Type`, `Authorization`

### Frontend (React + React Router + Better Auth Client)

#### 1. Cliente de Autenticación
- **Ubicación**: `Front/device-frontend/src/lib/auth-client.js`
- Configurado para enviar credenciales en todas las requests

#### 2. Context de Autenticación
- **Ubicación**: `Front/device-frontend/src/contexts/AuthContext.jsx`
- Gestiona el estado global de autenticación
- Proporciona `user`, `session`, `isLoading`, `isAuthenticated`

#### 3. Componentes Creados
- **Login** (`src/components/Login.jsx`): Formulario de inicio de sesión
- **Register** (`src/components/Register.jsx`): Formulario de registro
- **Dashboard** (`src/components/Dashboard.jsx`): Interfaz protegida de gestión de dispositivos
- **ProtectedRoute** (`src/components/ProtectedRoute.jsx`): Guarda de rutas

#### 4. Rutas Configuradas
- `/login` - Página de inicio de sesión
- `/register` - Página de registro
- `/dashboard` - Dashboard protegido (requiere autenticación)
- `/` - Redirige a `/dashboard`

#### 5. Características de Seguridad
- Todas las requests incluyen `credentials: 'include'` para enviar cookies
- Redirección automática a login si no hay autenticación
- Validación de contraseñas (mínimo 8 caracteres)
- Mensajes de error claros
- Loading states durante autenticación

## Cómo Usar el Sistema

### 1. Iniciar el Backend

```bash
cd Back
bun run dev
```

El servidor estará disponible en `http://localhost:3000`

### 2. Iniciar el Frontend

```bash
cd Front/device-frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### 3. Flujo de Uso

#### Primera Vez - Registro
1. Accede a `http://localhost:5173`
2. Serás redirigido a `/login`
3. Haz clic en "Regístrate aquí"
4. Completa el formulario:
   - Nombre completo
   - Correo electrónico
   - Contraseña (mínimo 8 caracteres)
   - Confirmar contraseña
5. Haz clic en "Crear Cuenta"
6. Serás automáticamente autenticado y redirigido al dashboard

#### Login Subsecuente
1. Accede a `http://localhost:5173/login`
2. Ingresa tu correo y contraseña
3. Haz clic en "Iniciar Sesión"
4. Serás redirigido al dashboard

#### Usando el Dashboard
- **Header**: Muestra tu nombre/email y botón de "Cerrar Sesión"
- **Tabs**: Acceso a todas las funcionalidades de gestión de dispositivos
- **Nuevo Registro**: Botón para agregar dispositivos
- **Protección**: Si intentas acceder sin login, serás redirigido automáticamente

#### Cerrar Sesión
1. Haz clic en el botón "Cerrar Sesión" en el header
2. Tu sesión será eliminada
3. Serás redirigido a la página de login

## Estructura de Archivos Nuevos

### Backend
```
Back/src/core/auth/
├── auth.config.ts      # Configuración de Better Auth
├── auth.middleware.ts  # Middleware de autenticación
└── index.ts           # Exportaciones
```

### Frontend
```
Front/device-frontend/src/
├── lib/
│   └── auth-client.js       # Cliente de Better Auth
├── contexts/
│   └── AuthContext.jsx      # Context de autenticación
└── components/
    ├── Login.jsx           # Página de login
    ├── Register.jsx        # Página de registro
    ├── Dashboard.jsx       # Dashboard protegido
    └── ProtectedRoute.jsx  # Guard de rutas
```

## Archivos Modificados

### Backend
- `Back/src/adapter/api/elysia/controller.elysia.ts` - Agregadas rutas de auth y middleware
- `Back/src/adapter/api/elysia/elysia.api.ts` - CORS actualizado con credentials

### Frontend
- `Front/device-frontend/src/App.jsx` - Reescrito para usar React Router
- `Front/device-frontend/src/App.css` - Agregados estilos de autenticación

## Base de Datos

### Tablas Creadas Automáticamente
El sistema crea automáticamente estas tablas en `database.SQLite`:

1. **user** - Información de usuarios
   - id, name, email, emailVerified, image, createdAt, updatedAt

2. **session** - Sesiones activas
   - id, expiresAt, ipAddress, userAgent, userId

3. **account** - Cuentas y contraseñas
   - id, accountId, providerId, userId, password (hash), tokens

4. **verification** - Verificaciones (futuro uso)
   - id, identifier, value, expiresAt

## Seguridad Implementada

### Backend
- ✅ Contraseñas hasheadas con algoritmo seguro (Better Auth usa bcrypt)
- ✅ Sesiones con expiración (7 días)
- ✅ Cookies HTTP-only para prevenir XSS
- ✅ CORS configurado correctamente
- ✅ Validación de datos con Zod
- ✅ Middleware de autenticación en todas las rutas protegidas

### Frontend
- ✅ Validación de formularios
- ✅ Contraseñas mínimo 8 caracteres
- ✅ Confirmación de contraseña en registro
- ✅ Manejo de errores de autenticación
- ✅ Redirección automática si no hay sesión
- ✅ Loading states para mejor UX
- ✅ Credentials incluidas en todas las requests

## Variables de Entorno

Asegúrate de que el archivo `.env` en el backend contenga:

```env
BETTER_AUTH_SECRET=LbagX2VEDutEpP1W8XTrculsiW12OT8n
BETTER_AUTH_URL=http://localhost:3000
DB_FILE_NAME=db.sqlite
```

## Notas Importantes

1. **Primera Ejecución**: Las tablas se crean automáticamente al iniciar el servidor
2. **Puerto del Backend**: Debe ser 3000 (configurado en código)
3. **Puerto del Frontend**: Debe ser 5173 (por defecto de Vite)
4. **Sesiones**: Las sesiones persisten durante 7 días
5. **CORS**: Solo se permite el origen `http://localhost:5173`

## Pruebas Sugeridas

1. ✅ Registrar un nuevo usuario
2. ✅ Cerrar sesión e iniciar sesión nuevamente
3. ✅ Intentar acceder a `/dashboard` sin login (debe redirigir)
4. ✅ Crear dispositivos estando autenticado
5. ✅ Verificar que las sesiones persistan al recargar la página
6. ✅ Probar errores de login (credenciales incorrectas)
7. ✅ Verificar validación de formularios

## Próximos Pasos Opcionales

- [ ] Implementar recuperación de contraseña
- [ ] Agregar verificación de email
- [ ] Implementar roles de usuario (admin, user)
- [ ] Agregar límite de intentos de login
- [ ] Implementar 2FA (autenticación de dos factores)
- [ ] Agregar OAuth (Google, GitHub, etc.)
- [ ] Mejorar mensajes de error
- [ ] Agregar logs de auditoría

## Soporte

Si encuentras algún problema:
1. Verifica que ambos servidores estén corriendo
2. Revisa la consola del navegador para errores
3. Revisa la terminal del backend para errores
4. Asegúrate de que las variables de entorno estén correctas
5. Verifica que no haya conflictos de puertos

---

**Implementación completada el:** 2025
**Stack Tecnológico:**
- Backend: Elysia + Bun + Better Auth + SQLite
- Frontend: React + React Router + Better Auth Client
- Base de datos: SQLite
