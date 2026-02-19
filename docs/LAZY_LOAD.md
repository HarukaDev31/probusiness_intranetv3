# Lazy loading en la intranet

Este documento describe cómo está implementado el lazy loading y cómo extenderlo a más páginas para mejorar la carga inicial y la navegación.

## Qué se hizo

### 1. Configuración (nuxt.config.ts)

- **routeRules**: Las rutas no se pre-renderizan; cada página es un chunk que se descarga al navegar.
- **manualChunks** (ya existente): Chart.js, xlsx y websocket van en chunks separados para no bloquear el bundle principal.
- **optimizeDeps**: Exclusiones para cargar chart.js, xlsx y pusher bajo demanda.

### 2. Layout por defecto (layouts/default.vue)

Los componentes del layout ya usan `defineAsyncComponent`:

- SidebarMenu  
- SessionExpiredModal  
- CalendarUpdatePopup  
- GlobalNotifications  
- ModalContainer  
- GlobalSpinner  

Así la shell de la app carga antes y estos componentes se piden en paralelo.

### 3. Páginas con componentes en lazy

- **pages/basedatos/permisos/index.vue**: `DataTable` y `PermisoTramiteModal` con `defineAsyncComponent`.
- **pages/calendar/index.vue**: Modales y tablas del calendario en async; `CalendarSkeleton` se mantiene síncrono para mostrar el estado de carga de inmediato.
- **pages/cargaconsolidada/documentacion/completados/clientes/[id].vue**: `ModalAcciones`, `PagoGrid` y `SectionHeader` con `defineAsyncComponent`.

### 4. Sidebar

En `SidebarMenu.vue`, los `NuxtLink` a `/` y `/perfil` usan `no-prefetch` para no descargar esos chunks hasta que el usuario haga clic.

## Cómo aplicar lazy load en más páginas

### Opción A: defineAsyncComponent (recomendado para componentes pesados)

En la página, sustituir el import directo por un componente asíncrono:

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const DataTable = defineAsyncComponent(() => import('~/components/DataTable.vue'))
const MiModal = defineAsyncComponent(() => import('~/components/MiModal.vue'))
</script>

<template>
  <DataTable ... />
</template>
```

Candidatos típicos: `DataTable`, modales grandes, `PagoGrid`, `FileUploader`, `SectionHeader`, tablas o formularios complejos.

### Opción B: Prefijo Lazy de Nuxt (sin import)

Si el componente está en `components/` y quieres usarlo solo a veces (por ejemplo dentro de un `v-if`), puedes usar el prefijo `Lazy` en el template:

- Crear un alias o usar el nombre con prefijo en el template, por ejemplo `<LazyDataTable />` (requiere que Nuxt registre componentes con prefijo Lazy; en este proyecto no está habilitado por defecto, por eso se usa sobre todo la opción A).

### Opción C: Desactivar prefetch en enlaces concretos

Para enlaces que no quieras prefetchear (por ejemplo menús con muchas rutas):

```vue
<NuxtLink to="/ruta-pesada" no-prefetch>Texto</NuxtLink>
```

## Comportamiento esperado

- **Carga inicial**: Solo se descargan el layout, la página actual y los componentes que esa página importa de forma síncrona. El resto de componentes async se piden cuando se renderizan.
- **Cambio de página**: Cada ruta tiene su propio chunk; al navegar se descarga ese chunk (y sus componentes async cuando se usan).
- **Primera vez que se abre un modal/tabla pesada**: Puede haber un leve retraso mientras se descarga el chunk del componente; se puede mejorar con `defineAsyncComponent({ loader, loadingComponent, delay })` si se quiere un spinner o skeleton.

## Opcional: loading y errores en componentes async

Para mostrar un estado de carga o un mensaje de error mientras carga el componente:

```ts
const DataTable = defineAsyncComponent({
  loader: () => import('~/components/DataTable.vue'),
  loadingComponent: () => import('~/components/commons/SpinnerSmall.vue'),
  delay: 200,
  timeout: 10000,
  errorComponent: () => import('~/components/commons/ErrorLoad.vue'),
})
```

Así se reduce la sensación de “pantalla en blanco” en la primera carga de una página o sección muy pesada.
