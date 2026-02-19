# API Verificación Permisos – estado_administracion y guardar-verificacion

Documentación para el backend (Laravel u otro) usada por la vista **Verificación > Permisos > [id]**.

## Columna estado_administracion (enum)

Se debe agregar la columna **`estado_administracion`** en la tabla donde se guarda el estado de verificación de cada **pago de servicio** (voucher). Suele ser la tabla que relaciona el trámite con el documento de pago (por ejemplo `tramite_aduana_pago` o la tabla de documentos con metadatos de pago).

### Migración (Laravel)

```php
// database/migrations/xxxx_add_estado_administracion_to_tramite_aduana_pago.php
public function up()
{
    Schema::table('tramite_aduana_pago', function (Blueprint $table) {
        $table->enum('estado_administracion', ['PENDIENTE', 'CONFIRMADO', 'OBSERVADO'])
              ->default('PENDIENTE')
              ->after('id_documento'); // o donde corresponda
    });
}
```

Si el estado se guarda en la tabla de documentos (por ejemplo `tramite_aduana_documentos`), añadir la columna ahí:

```php
Schema::table('tramite_aduana_documentos', function (Blueprint $table) {
    $table->enum('estado_administracion', ['PENDIENTE', 'CONFIRMADO', 'OBSERVADO'])
          ->default('PENDIENTE')
          ->nullable()
          ->after('seccion');
});
```

- **Valores:** `PENDIENTE` | `CONFIRMADO` | `OBSERVADO`.
- En las respuestas de listado de documentos / pagos, el frontend espera el estado en `estado_verificacion`, `estado` o `status` (cualquiera de esos nombres con esos valores).

---

## Endpoint: guardar estado y comprobantes en una sola petición

La pantalla de verificación de permisos solo persiste cambios al hacer clic en **Guardar**. En esa acción se envían:

1. Estados de verificación de cada pago de servicio (Conforme / Pendiente / Observado).
2. Comprobantes nuevos: derecho de trámite por tipo de permiso y comprobante de tramitador (RH/Factura).

### POST `.../tramites/{id}/guardar-verificacion`

**Content-Type:** `multipart/form-data`

| Campo | Tipo | Descripción |
|-------|------|--------------|
| `estados_pago_servicio` | string (JSON) | Array de `{ "id_documento": number, "estado": "PENDIENTE" \| "CONFIRMADO" \| "OBSERVADO" }`. Un elemento por cada pago de servicio (voucher) que se quiera actualizar. |
| `comprobante_derecho_{id_tipo_permiso}` | File (opcional) | Un archivo por cada tipo de permiso que tenga comprobante nuevo. Ej: `comprobante_derecho_1`, `comprobante_derecho_2`. |
| `pago_derecho_{id_tipo_permiso}_monto` | string (opcional) | Monto del pago de derecho para ese tipo. |
| `pago_derecho_{id_tipo_permiso}_banco` | string (opcional) | Banco del pago de derecho para ese tipo. |
| `pago_derecho_{id_tipo_permiso}_fecha_cierre` | string (opcional) | Fecha de cierre del pago (YYYY-MM-DD). |
| `comprobante_tramitador` | File (opcional) | Un único archivo para el comprobante del tramitador (RH/Factura). |
| `pago_tramitador_monto` | string (opcional) | Monto del pago al tramitador. |
| `pago_tramitador_banco` | string (opcional) | Banco del pago al tramitador. |
| `pago_tramitador_fecha_cierre` | string (opcional) | Fecha de cierre del pago al tramitador (YYYY-MM-DD). |

**Ejemplo de `estados_pago_servicio`:**

```json
[
  { "id_documento": 101, "estado": "CONFIRMADO" },
  { "id_documento": 102, "estado": "PENDIENTE" }
]
```

**Comportamiento backend (recomendado):**

1. Parsear `estados_pago_servicio` y para cada `id_documento` actualizar la columna `estado_administracion` (o la que use el modelo) al valor `estado`.
2. Para cada key que empiece por `comprobante_derecho_` extraer `id_tipo_permiso` y subir el archivo como documento del trámite con `seccion = 'seguimiento'` (o la sección que use para “Expediente/CPB” por tipo) y `id_tipo_permiso` = ese id. Crear categoría si hace falta (ej. “Expediente o CPB”).
3. Si viene `comprobante_tramitador`, subir el archivo como documento con `seccion = 'seguimiento'` e `id_tipo_permiso = null` (compartido).
4. Respuesta: `{ "success": true }` o `{ "success": false, "error": "..." }`.

**Respuesta éxito:**

```json
{
  "success": true
}
```

**Respuesta error:**

```json
{
  "success": false,
  "error": "Mensaje descriptivo"
}
```

---

## Endpoints existentes relacionados

- **PATCH** `.../tramites/{id}/pagos-servicio/{idDocumento}/estado`  
  Sigue pudiendo usarse para actualizar solo un estado de un pago de servicio. El front puede usar en su lugar `guardar-verificacion` para enviar todos los estados a la vez.
- **POST** `.../tramites/{id}/documentos`  
  Sigue usándose para subir un documento (categoria, archivo, seccion, id_tipo_permiso). El endpoint `guardar-verificacion` puede reutilizar la misma lógica de subida internamente.
