# Notificaciones de WebSocket para Importación de Excel

## Descripción

Este sistema permite mostrar notificaciones automáticas cuando se completa una importación de Excel a través de WebSockets.

## Flujo de Funcionamiento

### 1. Evento WebSocket
Cuando se recibe el evento `ImportacionExcelCompleted` en el canal `private-Documentacion-notifications`, el sistema:

1. **Configuración de Canales** (`config/websocket/channels.ts`):
   - Define el evento `WS_EVENTS.IMPORTACION.EXCEL_COMPLETED`
   - Configura el callback para el rol `DOCUMENTACION`

2. **Helper de Modales** (`utils/websocket-notifications.ts`):
   - Parsea los datos del evento
   - Emite un evento personalizado `websocket-modal`

### 2. Manejo de Modales
El composable `useWebSocketNotifications` (`composables/useWebSocketNotifications.ts`):
- Escucha el evento personalizado `websocket-modal`
- Conecta con el sistema de modales dinámicos

### 3. Sistema de Modales
El composable `useModal` (`composables/commons/useModal.ts`):
- Maneja el estado de los modales dinámicos
- Proporciona métodos para mostrar modales de éxito, error, warning e info

### 4. Componentes de UI
- `ModalContainer.vue`: Contenedor principal para modales dinámicos
- `DynamicModal.vue`: Modal dinámico que se adapta al tipo de notificación
- Sistema `useModal`: Sistema de modales ya establecido en el proyecto

## Estructura de Datos

### Evento WebSocket
```json
{
  "id": 40,
  "nombre_archivo": "PLANTILLA BASE DE PRODUCTO_SISTEMA 2024.xlsx",
  "status": "completed",
  "message": "Importación completada exitosamente. 15 productos importados de 15 totales.",
  "estadisticas": {
    "total_productos": 15,
    "productos_importados": 15,
    "errores": 0
  },
  "cantidad_rows": 15,
  "created_at": "2025-09-02T19:23:30+00:00",
  "updated_at": "2025-09-02T19:24:49+00:00",
  "tipo_evento": "importacion_excel_completed"
}
```

### Modal Mostrado
- **Tipo**: Success
- **Título**: "¡Importación Completada!"
- **Mensaje**: El mensaje del evento + detalles de productos importados
- **Duración**: 5 segundos (auto-close)

## Configuración

### Variables de Entorno
Asegúrate de tener configuradas las variables de Pusher en `nuxt.config.ts`:
```typescript
runtimeConfig: {
  public: {
    pusherAppKey: process.env.PUSHER_APP_KEY,
    pusherAppCluster: process.env.PUSHER_APP_CLUSTER
  }
}
```

### Roles de Usuario
El sistema está configurado para el rol `DOCUMENTACION`. Para otros roles, agregar en `config/websocket/channels.ts`.

## Uso

### Para Desarrolladores
1. El sistema se inicializa automáticamente en el layout principal
2. No se requiere configuración adicional
3. Las notificaciones aparecen automáticamente cuando se recibe el evento

### Para Testing
Puedes simular el evento manualmente:
```javascript
// En la consola del navegador
window.dispatchEvent(new CustomEvent('websocket-modal', {
  detail: {
    type: 'success',
    title: '¡Importación Completada!',
    message: 'La importación se completó correctamente\n\nProductos importados: 15 de 15',
    duration: 5000
  }
}))
```

## Archivos Modificados

1. `config/websocket/channels.ts` - Agregado evento y callback
2. `utils/websocket-notifications.ts` - Helper para manejar modales
3. `composables/useWebSocketNotifications.ts` - Composable para conectar eventos con useModal
4. `layouts/default.vue` - Inicialización del sistema
5. `pages/test-websocket-notifications.vue` - Página de prueba actualizada

## Notas Técnicas

- El sistema usa eventos personalizados para evitar dependencias circulares
- Los modales se muestran a través del `ModalContainer` existente usando `DynamicModal`
- El auto-close está configurado para 5 segundos
- Los detalles se incluyen en el mensaje principal separados por saltos de línea
- Utiliza el sistema `useModal` que ya está establecido y probado en el proyecto
- No requiere componentes adicionales como `SuccessModal` o `ErrorModal`

