# Migración de Tokens Django a JWT - Guía de Actualización

## Cambios Implementados

### Backend

1. **Dependencias Actualizadas** (`requirements.txt`)
   - ✅ Agregado `djangorestframework-simplejwt`

2. **Settings.py**
   - ✅ Reemplazado `rest_framework.authtoken` por `rest_framework_simplejwt`
   - ✅ Cambiado autenticación de `TokenAuthentication` a `JWTAuthentication`
   - ✅ Agregada configuración `SIMPLE_JWT` con:
     - Access token: 1 hora
     - Refresh token: 7 días
     - Rotación de refresh tokens habilitada
     - Blacklist después de rotación

3. **accounts/views.py**
   - ✅ Reemplazado `Token.objects.get_or_create()` por `RefreshToken.for_user()`
   - ✅ El endpoint de login ahora retorna `access` y `refresh` tokens
   - ✅ Agregados claims personalizados al token (rol, email, nombre)

4. **accounts/urls.py**
   - ✅ Agregado endpoint `token/refresh/` para refrescar tokens

### Frontend

1. **Nuevas Utilidades** (`src/utils/auth.ts`)
   - ✅ `setTokens()`: Guarda access y refresh tokens
   - ✅ `getAccessToken()` y `getRefreshToken()`: Recuperan tokens
   - ✅ `clearTokens()`: Limpia todos los tokens
   - ✅ `isTokenExpired()`: Verifica expiración del token
   - ✅ `refreshAccessToken()`: Refresca automáticamente el token
   - ✅ `authenticatedFetch()`: Wrapper de fetch con manejo automático de tokens

2. **Nuevo Hook** (`src/hooks/useAuthFetch.ts`)
   - ✅ Hook personalizado para peticiones autenticadas

3. **Componentes Actualizados**
   - ✅ `App.tsx`: Usa `getAccessToken()` en lugar de `localStorage.getItem('token')`
   - ✅ `Login.tsx`: Guarda access y refresh tokens con `setTokens()`
   - ✅ `Layout.tsx`: Usa `clearTokens()` al cerrar sesión
   - ✅ `Dashboard.tsx`: Ejemplo de uso de `authenticatedFetch()`

## Componentes que Necesitan Actualización

Los siguientes componentes aún usan el sistema de tokens antiguo y deben actualizarse:

### 1. Clientes.tsx
**Buscar y reemplazar:**
```typescript
// ANTES:
const token = localStorage.getItem('token');
const response = await fetch(url, {
  headers: {
    'Authorization': `Token ${token}`,
  },
});

// DESPUÉS:
import { authenticatedFetch } from '../utils/auth';
const response = await authenticatedFetch(url);
```

### 2. Mascotas.tsx
- Actualizar `fetchMascotas()` para usar `authenticatedFetch()`
- Actualizar `fetchClientes()` para usar `authenticatedFetch()`
- Actualizar `handleSubmit()` para usar `authenticatedFetch()`
- Actualizar `handleDelete()` para usar `authenticatedFetch()`
- Actualizar `handleViewHistory()` para usar `authenticatedFetch()`

### 3. Citas.tsx
- Actualizar todas las funciones fetch: `fetchCitas()`, `fetchClientes()`, `fetchMascotasPorCliente()`, `fetchVeterinarios()`
- Actualizar `handleSubmit()` y `handleStatusChange()`

### 4. RegistrosMedicos.tsx
- Actualizar `fetchRegistros()`, `fetchVacunas()`, `fetchMascotas()`, `fetchVeterinarios()`
- Actualizar `handleSubmit()` y `handleVacunaSubmit()`

### 5. Inventario.tsx
- Actualizar `fetchInventario()`, `handleSubmit()`, `handleDelete()`

### 6. Reportes.tsx
- Actualizar `fetchAllPages()` para usar `authenticatedFetch()`
- Actualizar `handleExportReport()`

### 7. Admin.tsx
- Actualizar `fetchUsers()`, `handleDelete()`, `handleSubmit()`

## Patrón de Actualización

Para cada componente, seguir este patrón:

```typescript
// 1. Importar al inicio del archivo
import { authenticatedFetch } from '../utils/auth';

// 2. Reemplazar fetch con authenticatedFetch
// ANTES:
const token = localStorage.getItem('token');
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`,
  },
  body: JSON.stringify(data),
});

// DESPUÉS:
const response = await authenticatedFetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

// 3. Eliminar verificaciones de token como:
if (!token) {
  setError('No hay sesión activa');
  return;
}
```

## Ventajas de JWT vs Tokens Django

1. **Seguridad Mejorada**
   - Tokens expiran automáticamente (1 hora)
   - Refresh tokens con rotación
   - No se almacenan en base de datos (stateless)

2. **Mejor Rendimiento**
   - No hay consultas a la base de datos para validar tokens
   - Escalabilidad mejorada

3. **Funcionalidad Adicional**
   - Claims personalizados en el token
   - Refresh automático sin re-login
   - Blacklist de tokens comprometidos

## Pasos Siguientes

1. **Instalar dependencias del backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Ejecutar migraciones:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Actualizar componentes frontend restantes** usando el patrón descrito arriba

4. **Probar el sistema:**
   - Login con usuario existente
   - Verificar que los tokens se guardan correctamente
   - Navegar entre páginas para verificar refresh automático
   - Cerrar sesión y verificar limpieza de tokens

## Notas Importantes

- Los tokens antiguos en la base de datos quedarán inválidos
- Los usuarios deberán volver a iniciar sesión
- El refresh token se renueva automáticamente con cada uso (rotation)
- Los tokens expirados se agregan a una blacklist automáticamente
