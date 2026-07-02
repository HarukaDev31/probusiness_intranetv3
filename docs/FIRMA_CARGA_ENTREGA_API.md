# API Firma Cargo de Entrega

## Resumen

Endpoints para visualizar y firmar el documento de cargo de entrega. Los datos se obtienen de la tabla `contenedor_consolidado_cotizacion` (campos `cargo_entrega_pdf_url`, `cargo_entrega_pdf_firmado_url`).

---

## 1. Obtener PDF de Cargo de Entrega

**GET** `/api/carga-consolidada/contenedor/entrega/cargo-entrega-pdf/{id_contenedor}/{id_cotizacion}`

### Respuesta esperada

```json
{
  "success": true,
  "data": {
    "cargo_entrega_pdf_url": "storage/delivery/cargo-xxx.pdf",
    "cargo_entrega_pdf_firmado_url": null,
    "nombre": "Nombre del cliente",
    "telefono": "51999999999"
  }
}
```

- Si `cargo_entrega_pdf_firmado_url` es `null`, el frontend usará `cargo_entrega_pdf_url` para mostrar el PDF.
- La consulta debe obtener el registro de `contenedor_consolidado_cotizacion` donde `id_contenedor` y `id_cotizacion` coincidan.

---

## 2. Firmar Cargo de Entrega

**POST** `/api/carga-consolidada/contenedor/entrega/cargo-entrega-firmar`

### Body (JSON)

```json
{
  "id_contenedor": 123,
  "id_cotizacion": 456,
  "nombre": "Juan Pérez",
  "dni": "12345678",
  "signature": "data:image/png;base64,iVBORw0KGgo..."
}
```

### Lógica del backend (similar a `uploadConformidad`)

1. **Validar** `id_contenedor`, `id_cotizacion`, `nombre`, `dni`, `signature`.
2. **Obtener** el registro de `contenedor_consolidado_cotizacion` por `id_contenedor` + `id_cotizacion`.
3. **Generar PDF firmado**: superponer la imagen de firma (base64) y los datos nombre/DNI sobre el PDF original (`cargo_entrega_pdf_url`).
4. **Guardar** el PDF resultante en storage (ej: `delivery_cargo_firmado/{id_cotizacion}/`).
5. **Actualizar** `contenedor_consolidado_cotizacion`:
   ```sql
   UPDATE contenedor_consolidado_cotizacion
   SET cargo_entrega_pdf_firmado_url = 'ruta/guardada.pdf'
   WHERE id_contenedor = ? AND id_cotizacion = ?
   ```
6. **Enviar WhatsApp** al cliente (usando `sendMessage` y `sendMedia` como en `uploadConformidad`), con mensaje tipo:
   ```
   Hola {nombre} 👋
   Adjunto el documento de cargo de entrega firmado correspondiente a su importación del consolidado #{carga}.
   Muchas gracias por confiar en Pro Business.
   ```

### Respuesta esperada

```json
{
  "success": true,
  "message": "Firma guardada correctamente"
}
```
