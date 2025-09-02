# Notificaciones de WebSocket para Importación de Excel

## Descripción

Este sistema permite mostrar notificaciones automáticas cuando se completa una importación de Excel a través de WebSockets.

## Flujo de Funcionamiento

### 1. Evento WebSocket
Cuando se recibe el evento `ImportacionExcelCompleted` en el canal `private-Documentacion-notifications`, el sistema:

1. **Configuración de Canales** (`config/websocket/channels.ts`):
   - Define el evento `WS_EVENTS.IMPORTACION.EXCEL_COMPLETED`
   - Configura el callback para el rol `DOCUMENTACION`

2. **Helper de Notificaciones** (`utils/websocket-notifications.ts`):
   - Parsea los datos del evento
   - Emite un evento personalizado `websocket-notification`

### 2. Manejo de Notificaciones
El composable `useWebSocketNotifications` (`composables/useWebSocketNotifications.ts`):
- Escucha el evento personalizado
- Conecta con el sistema de notificaciones global

### 3. Sistema de Notificaciones
El composable `useNotifications` (`composables/useNotifications.ts`):
- Maneja el estado de los modales
- Proporciona métodos para mostrar notificaciones

### 4. Componentes de UI
- `GlobalNotifications.vue`: Contenedor principal
- `SuccessModal.vue`: Modal de éxito con soporte para detalles
- `ErrorModal.vue`: Modal de error

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

### Notificación Mostrada
- **Título**: "¡Importación Completada!"
- **Subtítulo**: "Excel procesado exitosamente"
- **Mensaje**: El mensaje del evento
- **Detalles**: "Productos importados: X de Y"
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
window.dispatchEvent(new CustomEvent('websocket-notification', {
  detail: {
    type: 'success',
    title: '¡Importación Completada!',
    subtitle: 'Excel procesado exitosamente',
    message: 'La importación se completó correctamente',
    details: 'Productos importados: 15 de 15',
    autoClose: true,
    duration: 5000
  }
}))
```

## Archivos Modificados

1. `config/websocket/channels.ts` - Agregado evento y callback
2. `utils/websocket-notifications.ts` - Helper para manejar notificaciones
3. `composables/useWebSocketNotifications.ts` - Composable para conectar eventos
4. `layouts/default.vue` - Inicialización del sistema
5. `components/GlobalNotifications.vue` - Agregado soporte para modales
6. `components/SuccessModal.vue` - Agregado soporte para detalles
7. `composables/useNotifications.ts` - Ya tenía soporte para detalles

## Notas Técnicas

- El sistema usa eventos personalizados para evitar dependencias circulares
- Los modales se muestran globalmente desde el layout principal
- El auto-close está configurado para 5 segundos
- Los detalles se muestran en texto más pequeño y gris

