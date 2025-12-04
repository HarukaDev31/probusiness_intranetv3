# API para Envío de Documentos por WhatsApp

## Descripción
Este documento describe las rutas del backend necesarias para enviar documentos (factura comercial o guía de remisión) por WhatsApp.

## Endpoints

### Base URL
```
/api/carga-consolidada/contenedor/factura-guia
```

### 1. Enviar Factura Comercial por WhatsApp

**Endpoint:** `POST /send-factura/{idCotizacion}`

**Descripción:** Envía la factura comercial asociada a una cotización por WhatsApp al cliente.

**Parámetros de ruta:**
- `idCotizacion` (number, requerido): ID de la cotización

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Factura comercial enviada correctamente por WhatsApp",
  "data": {
    "messageId": "string",
    "sentAt": "2024-01-01T00:00:00Z"
  }
}
```

**Respuesta de error:**
```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

**Códigos de estado:**
- `200`: Éxito
- `400`: Error de validación (ej: factura no existe)
- `404`: Cotización no encontrada
- `500`: Error del servidor

---

### 2. Enviar Guía de Remisión por WhatsApp

**Endpoint:** `POST /send-guia/{idCotizacion}`

**Descripción:** Envía la guía de remisión asociada a una cotización por WhatsApp al cliente.

**Parámetros de ruta:**
- `idCotizacion` (number, requerido): ID de la cotización

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Guía de remisión enviada correctamente por WhatsApp",
  "data": {
    "messageId": "string",
    "sentAt": "2024-01-01T00:00:00Z"
  }
}
```

**Respuesta de error:**
```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

**Códigos de estado:**
- `200`: Éxito
- `400`: Error de validación (ej: guía no existe)
- `404`: Cotización no encontrada
- `500`: Error del servidor

---

## Implementación del Backend

### Consideraciones

1. **Validación de documentos:**
   - Verificar que el documento (factura o guía) exista antes de enviar
   - Verificar que el cliente tenga un número de WhatsApp válido
   - Verificar que la cotización esté en un estado válido para enviar documentos

2. **Integración con WhatsApp:**
   - Usar la API de WhatsApp configurada en `NUXT_WHATSAPPV3_URL`
   - Incluir el API key en los headers: `apikey: NUXT_WHATSAPPV3_API_KEY`
   - Enviar el documento como archivo adjunto o enlace según la configuración

3. **Manejo de errores:**
   - Retornar mensajes de error descriptivos
   - Registrar errores para debugging
   - Manejar casos donde el cliente no tenga WhatsApp configurado

4. **Logging:**
   - Registrar cada intento de envío
   - Guardar el estado del envío (éxito/fallo)
   - Almacenar el ID del mensaje de WhatsApp si está disponible

---

## Ejemplo de Implementación (Pseudocódigo)

```typescript
// Controller
async function sendFactura(req, res) {
  const { idCotizacion } = req.params;
  
  // 1. Validar que la cotización existe
  const cotizacion = await getCotizacion(idCotizacion);
  if (!cotizacion) {
    return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
  }
  
  // 2. Validar que la factura existe
  if (!cotizacion.factura_comercial) {
    return res.status(400).json({ success: false, error: 'No hay factura comercial disponible' });
  }
  
  // 3. Obtener datos del cliente
  const cliente = await getCliente(cotizacion.id_cliente);
  if (!cliente.telefono || !cliente.telefono.startsWith('51')) {
    return res.status(400).json({ success: false, error: 'Cliente no tiene WhatsApp válido' });
  }
  
  // 4. Enviar por WhatsApp
  try {
    const whatsappResponse = await whatsappService.sendDocument({
      phone: cliente.telefono,
      document: cotizacion.factura_comercial,
      caption: `Factura comercial - Cotización #${idCotizacion}`
    });
    
    // 5. Registrar el envío
    await logEnvio({
      idCotizacion,
      tipoDocumento: 'factura',
      whatsappMessageId: whatsappResponse.messageId,
      estado: 'enviado'
    });
    
    return res.json({
      success: true,
      message: 'Factura comercial enviada correctamente por WhatsApp',
      data: {
        messageId: whatsappResponse.messageId,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    // Registrar error
    await logEnvio({
      idCotizacion,
      tipoDocumento: 'factura',
      estado: 'error',
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      error: 'Error al enviar la factura por WhatsApp'
    });
  }
}
```

---

## Notas Adicionales

- Los endpoints deben estar protegidos con autenticación (Bearer token)
- Se recomienda implementar rate limiting para evitar spam
- Considerar implementar una cola de mensajes para envíos masivos
- Validar permisos del usuario antes de permitir el envío

