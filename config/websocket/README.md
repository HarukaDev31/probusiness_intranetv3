# Configuración de WebSocket - Sistema Dinámico

Este sistema permite registrar roles y eventos de forma dinámica antes de realizar la suscripción a los canales de WebSocket.

## Estructura

- **`events-config.ts`**: Archivo centralizado donde se definen:
  - Todos los eventos disponibles (`WS_EVENTS`)
  - Handlers/callbacks base para cada evento (`EVENT_HANDLERS`)
  - Configuración base de eventos por rol (`BASE_ROLE_EVENTS_CONFIG`)
  - Funciones para registro dinámico

- **`channels.ts`**: Genera automáticamente la configuración de `websocketRoles` leyendo desde `events-config.ts`

- **`events/`**: Carpeta con eventos organizados por rol:
  - `cotizador.ts` - Eventos específicos del rol Cotizador
  - `admin.ts` - Eventos específicos del rol Admin
  - `documentacion.ts` - Eventos específicos del rol Documentación
  - `contenedor-consolidado.ts` - Eventos del rol Contenedor Consolidado
  - `contenedor-almacen.ts` - Eventos del rol Contenedor Almacén
  - `coordinacion.ts` - Eventos del rol Coordinación
  - `user.ts` - Eventos del rol User
  - `index.ts` - Archivo central que importa y ejecuta todos los registros

## Organización por Rol

Los eventos están organizados por rol en archivos separados dentro de `config/websocket/events/`. Esto mantiene el código organizado y fácil de mantener.

### Agregar un Evento a un Rol

Para agregar un nuevo evento a un rol específico, edita el archivo correspondiente:

**Ejemplo: Agregar evento al rol Cotizador**

Edita `config/websocket/events/cotizador.ts`:

```typescript
import { 
  registerEventHandler, 
  subscribeEventToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { useModal } from '~/composables/commons/useModal'

export const registerCotizadorEvents = () => {
  // 1. Registrar el handler
  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_CONTACTED, (data) => {
    const { showSuccess } = useModal()
    showSuccess('Contacto con China', data.message)
  })

  // 2. Suscribir al rol
  subscribeEventToRole(
    ROLES.COTIZADOR,
    `${ROLES.COTIZADOR}-notifications`,
    WS_EVENTS.COTIZACION_CHINA_CONTACTED,
    undefined,
    'private'
  )
}
```

## Uso Básico

### Registrar un Handler para un Evento

```typescript
import { registerEventHandler } from '~/config/websocket/channels'

// Registrar un handler para un evento
registerEventHandler('MiNuevoEvento', (data) => {
  console.log('Evento recibido:', data)
  // Tu lógica aquí
})
```

### Suscribir un Evento a un Rol

```typescript
import { subscribeEventToRole } from '~/config/websocket/channels'

// Suscribir un evento a un rol existente
subscribeEventToRole(
  'Admin',                    // Rol
  'Admin-notifications',      // Nombre del canal
  'MiNuevoEvento',            // Nombre del evento
  (data) => {                 // Handler opcional
    console.log('Evento recibido:', data)
  },
  'private'                   // Tipo de canal (opcional, por defecto 'private')
)
```

### Suscribir Múltiples Eventos a un Rol

```typescript
import { subscribeEventsToRole } from '~/config/websocket/channels'

// Suscribir múltiples eventos a un rol
subscribeEventsToRole(
  'Admin',
  'Admin-notifications',
  ['Evento1', 'Evento2', 'Evento3'],
  'private'
)
```

### Registrar un Nuevo Rol Completo

```typescript
import { registerRole } from '~/config/websocket/channels'

// Registrar un nuevo rol con su configuración completa
registerRole('NuevoRol', [
  {
    name: 'NuevoRol-notifications',
    type: 'private',
    events: ['Evento1', 'Evento2']
  },
  {
    name: 'presence-NuevoRol-dashboard',
    type: 'presence',
    events: ['DashboardUpdate']
  }
])
```

## Ejemplo Completo

```typescript
// En un plugin o composable, antes de la suscripción
import { 
  registerEventHandler, 
  subscribeEventToRole,
  subscribeEventsToRole,
  registerRole,
  WS_EVENTS 
} from '~/config/websocket/channels'

// 1. Registrar handlers para nuevos eventos
registerEventHandler('PedidoCompletado', (data) => {
  const { showSuccess } = useModal()
  showSuccess('Pedido Completado', data.message)
})

registerEventHandler('StockBajo', (data) => {
  console.warn('Stock bajo:', data)
})

// 2. Suscribir eventos a roles existentes
subscribeEventToRole(
  ROLES.ADMIN,
  `${ROLES.ADMIN}-notifications`,
  'PedidoCompletado',
  (data) => {
    // Handler personalizado si es necesario
  }
)

subscribeEventsToRole(
  ROLES.CONTENEDOR_ALMACEN,
  `${ROLES.CONTENEDOR_ALMACEN}-notifications`,
  ['StockBajo', 'StockAlto'],
  'private'
)

// 3. Registrar un nuevo rol completo
registerRole('Supervisor', [
  {
    name: 'Supervisor-notifications',
    type: 'private',
    events: ['PedidoCompletado', 'StockBajo', WS_EVENTS.SYSTEM_UPDATE]
  }
])
```

## Cuándo Usar

Estas funciones deben ejecutarse **antes** de que se realice la suscripción a los canales. Los lugares ideales son:

1. **Plugins de Nuxt** (`plugins/*.ts`): Para configuraciones globales
2. **Composables**: Al inicio de la aplicación
3. **Middleware**: Antes de que se inicialice el WebSocket

## Notas Importantes

- Los registros dinámicos se fusionan con la configuración base
- Si registras un evento que ya existe, el handler se actualizará
- Si suscribes eventos a un rol existente, se agregarán a los eventos ya configurados
- Los canales se crean automáticamente si no existen
- La configuración se regenera automáticamente cuando se accede a `websocketRoles`

## Funciones Disponibles

### `registerEventHandler(eventName, handler)`
Registra un handler para un evento específico.

### `subscribeEventToRole(role, channelName, eventName, handler?, channelType?)`
Suscribe un evento a un rol. Crea el canal si no existe.

### `subscribeEventsToRole(role, channelName, events, channelType?)`
Suscribe múltiples eventos a un rol.

### `registerRole(role, channels)`
Registra un nuevo rol con su configuración completa de canales.

### `getWebsocketRoles()`
Obtiene la configuración actualizada de roles (incluye registros dinámicos).

### `refreshWebsocketRoles()`
Regenera manualmente la configuración de roles (normalmente no es necesario).

