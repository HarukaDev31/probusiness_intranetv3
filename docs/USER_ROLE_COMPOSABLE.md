# Composable useUserRole

Este composable proporciona funcionalidad para obtener y gestionar la información del usuario actual, incluyendo su rol basado en el `grupo.nombre` de la respuesta de la API.

## Características

- ✅ **Carga Global Automática**: Los datos se cargan una sola vez al iniciar la aplicación
- ✅ Lee datos del usuario actual desde localStorage (`auth_user`)
- ✅ Extrae automáticamente el rol del usuario (`grupo.nombre`)
- ✅ Proporciona computed properties para información del usuario
- ✅ Funciones de utilidad para verificar roles
- ✅ Manejo de estados de carga y errores
- ✅ Tipado completo con TypeScript
- ✅ Patrón Singleton: Una sola instancia global de los datos del usuario

## Uso Básico

```vue
<script setup lang="ts">
// Usar el composable (los datos se cargan automáticamente al iniciar la app)
const { 
  userData, 
  currentRole, 
  userName, 
  userEmail, 
  userCompany,
  isUserActive,
  loading,
  error,
  hasRole,
  hasAnyRole 
} = useUserRole()

// ¡No es necesario llamar fetchCurrentUser()! Los datos se cargan globalmente
</script>

<template>
  <div>
    <!-- Mostrar información del usuario -->
    <div v-if="loading">Cargando...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <h2>Bienvenido, {{ userName }}</h2>
      <p>Email: {{ userEmail }}</p>
      <p>Rol: {{ currentRole }}</p>
      <p>Empresa: {{ userCompany }}</p>
      <p>Estado: {{ isUserActive ? 'Activo' : 'Inactivo' }}</p>
    </div>

    <!-- Verificar roles para mostrar contenido condicional -->
    <div v-if="hasRole('Documentacion')">
      <p>Este contenido solo es visible para usuarios con rol "Documentacion"</p>
    </div>

    <div v-if="hasAnyRole(['Admin', 'Supervisor'])">
      <p>Este contenido es visible para administradores y supervisores</p>
    </div>
  </div>
</template>
```

## API del Composable

### Estado Reactivo

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `userData` | `UserData \| null` | Datos completos del usuario (readonly) |
| `loading` | `boolean` | Estado de carga (readonly) |
| `error` | `string \| null` | Mensaje de error si existe (readonly) |

### Computed Properties

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `currentRole` | `string` | Rol del usuario (`grupo.nombre`) |
| `userName` | `string` | Nombre completo del usuario |
| `userEmail` | `string` | Email del usuario |
| `userCompany` | `string` | Nombre de la empresa del usuario |
| `isUserActive` | `boolean` | Estado activo del usuario |

### Métodos

| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `fetchCurrentUser()` | - | `Promise<void>` | Obtiene los datos del usuario actual |
| `hasRole(role)` | `string` | `boolean` | Verifica si el usuario tiene un rol específico |
| `hasAnyRole(roles)` | `string[]` | `boolean` | Verifica si el usuario tiene alguno de los roles especificados |
| `getUserData()` | - | `UserData \| null` | Obtiene todos los datos del usuario |

## Estructura de Datos

### UserData Interface

```typescript
interface UserData {
  role: string
  avatar: string | null
  isActive: boolean
  raw: UserRaw
  email: string
  empresa: UserCompany
  estado: number
  grupo: UserGroup
  descripcion: string
  estado: number
  id: number
  nombre: string
  organizacion: UserOrganization
}
```

### UserGroup Interface

```typescript
interface UserGroup {
  id: number
  nombre: string          // ← Este es el rol del usuario
  descripcion: string
  tipo_privilegio: number
  estado: number
  notificacion: number
}
```

## Ejemplos de Uso

### 1. Verificación de Roles en Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { currentRole, hasRole } = useUserRole()
  
  // Verificar si el usuario tiene acceso a una ruta específica
  if (to.path.startsWith('/admin') && !hasRole('Admin')) {
    return navigateTo('/unauthorized')
  }
  
  // Verificar múltiples roles
  if (to.path.startsWith('/reports') && !hasAnyRole(['Admin', 'Supervisor', 'Documentacion'])) {
    return navigateTo('/unauthorized')
  }
})
```

### 2. Componente con Contenido Condicional

```vue
<template>
  <div>
    <!-- Contenido para todos los usuarios -->
    <h1>Dashboard</h1>
    
    <!-- Contenido específico por rol -->
    <div v-if="hasRole('Documentacion')">
      <h2>Panel de Documentación</h2>
      <DocumentationPanel />
    </div>
    
    <div v-if="hasRole('Admin')">
      <h2>Panel de Administración</h2>
      <AdminPanel />
    </div>
    
    <!-- Contenido para múltiples roles -->
    <div v-if="hasAnyRole(['Admin', 'Supervisor'])">
      <h2>Reportes Avanzados</h2>
      <AdvancedReports />
    </div>
  </div>
</template>

<script setup lang="ts">
const { hasRole, hasAnyRole } = useUserRole()
</script>
```

### 3. Guardado de Datos del Usuario

```typescript
// En un servicio o composable
const { userData, currentRole } = useUserRole()

const saveUserAction = async (action: string) => {
  const userInfo = {
    userId: userData.value?.id,
    userRole: currentRole.value,
    userEmail: userData.value?.email,
    action,
    timestamp: new Date().toISOString()
  }
  
  // Guardar en base de datos o logs
  await logUserAction(userInfo)
}
```

## Fuente de Datos

El composable lee los datos del usuario desde:
```
localStorage.getItem('auth_user')
```

Los datos deben estar almacenados en formato JSON en la clave `auth_user` del localStorage.

## Manejo de Errores

El composable maneja automáticamente los errores y los expone a través de la propiedad `error`:

```vue
<template>
  <div>
    <div v-if="loading" class="loading-spinner">
      Cargando información del usuario...
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>Error al cargar datos del usuario: {{ error }}</p>
      <UButton @click="fetchCurrentUser" label="Reintentar" />
    </div>
    
    <div v-else>
      <!-- Contenido normal -->
    </div>
  </div>
</template>
```

## Notas Importantes

1. **Carga Automática**: Los datos se cargan automáticamente al iniciar la aplicación mediante un plugin de Nuxt
2. **Datos del Usuario**: El composable lee los datos desde `localStorage.getItem('auth_user')`
3. **Formato de Datos**: Los datos deben estar almacenados en formato JSON válido
4. **Rol Principal**: El rol se extrae de `grupo.nombre` en los datos del usuario
5. **Reactividad**: Todas las propiedades son reactivas y se actualizan automáticamente
6. **Tipado**: Incluye tipos TypeScript completos para mejor desarrollo
7. **No es necesario llamar fetchCurrentUser()**: Los datos están disponibles inmediatamente en cualquier componente 