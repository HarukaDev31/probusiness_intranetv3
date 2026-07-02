# Payload de creación de viáticos (múltiples items)

El frontend envía la creación de viáticos con **múltiples conceptos de pago** (concepto, monto y comprobante por cada uno). El backend debe aceptar este formato para cuadrar con la nueva UI.

## Endpoint

- **Método:** `POST`
- **URL:** `/api/viaticos` (o la base que uses para viáticos)
- **Content-Type:** `multipart/form-data`

## Formato del body (FormData)

### Campos comunes (siempre)

| Campo                   | Tipo   | Obligatorio | Descripción |
|-------------------------|--------|-------------|-------------|
| `subject`               | string | Sí          | Asunto del viático |
| `reimbursement_date`    | string | Sí          | Fecha de reintegro (ISO date, ej. `2026-01-26`) |
| `requesting_area`       | string | Sí          | Área solicitante (ej. Marketing, Ventas, Importaciones, Administración, Otros) |
| `expense_description`  | string | Sí*         | Descripción general del gasto. Si el front envía items, puede ser concatenación de conceptos o texto libre. |
| `total_amount`          | string | Sí          | Monto total en números (ej. `150.50`). Es la suma de todos los `items[].monto`. |

\* En el front se envía siempre; puede estar vacío si se usan solo items.

### Items de pago (array)

Por cada item de pago el front envía (índice `i` desde 0):

| Campo                         | Tipo   | Obligatorio | Descripción |
|-------------------------------|--------|-------------|-------------|
| `items[i][concepto]`          | string | Sí          | Concepto del gasto (ej. "Pasaje Lima–Trujillo") |
| `items[i][monto]`             | string | Sí          | Monto de ese concepto (ej. `85.00`) |
| `items[i][receipt_file]`      | File   | No          | Archivo del comprobante (imagen o PDF) |

- Los índices son consecutivos: `items[0]`, `items[1]`, `items[2]`, …
- Un mismo viático puede tener **varios** items (varios conceptos, cada uno con su monto y opcionalmente su comprobante).
- La suma de todos `items[i][monto]` debe coincidir con `total_amount`.

## Ejemplo de campos enviados (pseudocódigo)

```
subject = "Solicitud de reintegro de viáticos"
reimbursement_date = "2026-01-26"
requesting_area = "Ventas"
expense_description = "Pasaje Lima–Trujillo; Hospedaje 1 noche"
total_amount = "350.00"

items[0][concepto] = "Pasaje Lima–Trujillo"
items[0][monto] = "150.00"
items[0][receipt_file] = <File>

items[1][concepto] = "Hospedaje 1 noche"
items[1][monto] = "200.00"
items[1][receipt_file] = <File>
```

## Compatibilidad con formato anterior (un solo comprobante)

Si el front envía **sin** `items` (payload legacy), solo llegarán:

- `subject`, `reimbursement_date`, `requesting_area`, `expense_description`, `total_amount`
- `receipt_file` (un solo archivo)

En ese caso el backend puede seguir creando un viático con un único comprobante como hasta ahora.

## Resumen para implementación en backend

1. Detectar si vienen `items[0][concepto]` (o equivalente en tu framework) para saber si es formato con items.
2. Si hay items:
   - Recorrer todos los `items[i]` (concepto, monto, receipt_file).
   - Validar que la suma de montos = `total_amount`.
   - Guardar en BD: cabecera del viático (subject, dates, area, total_amount, expense_description) y detalle por item (concepto, monto, archivo asociado).
3. Si no hay items, usar solo los campos planos + `receipt_file` como hasta ahora.

Si me indicas stack del backend (Laravel, Node, etc.), puedo bajar esto a código de ejemplo (controlador + validación).

---

## Retribuciones (comprobantes de pago subidos por admin) y WhatsApp

### Endpoint de actualización (subir retribuciones)

Cuando el front envía **un comprobante de retribución** (admin), hace **una petición por archivo** al endpoint de actualización del viático, por ejemplo:

- **Método:** `POST`
- **URL:** `/api/viaticos/update/{id}`
- **Content-Type:** `multipart/form-data`

Campos relevantes por cada llamada:

| Campo                       | Tipo   | Descripción |
|----------------------------|--------|-------------|
| `payment_receipt_file`      | File   | Archivo del comprobante |
| `payment_receipt_banco`      | string | Banco (opcional) |
| `payment_receipt_monto`     | string | Monto (opcional) |
| `payment_receipt_fecha_cierre` | string | Fecha cierre YYYY-MM-DD (opcional) |

Cada llamada crea **una fila nueva** en la tabla de retribuciones del viático.

### Columna `sended_at` en retribuciones

- Añadir en la tabla de retribuciones una columna **`sended_at`** (datetime, nullable).
- **Cuando se guarda una retribución nueva:** enviar **1 mensaje de WhatsApp** por ese comprobante (al usuario del viático o al flujo que tengan) y, tras enviar correctamente, actualizar `sended_at = now()` en esa fila.
- **Validación para no reenviar:** si una retribución ya tiene `sended_at` distinto de null, **no** volver a enviar WhatsApp por ese comprobante (evitar duplicados al reabrir o reutilizar datos).

Resumen:

1. **1 WhatsApp por cada archivo** de retribución subido (una notificación por comprobante).
2. **Actualizar `sended_at`** en la fila de la retribución cuando el mensaje se haya enviado.
3. **No enviar** WhatsApp para retribuciones que ya tengan `sended_at` informado.

El frontend espera que las respuestas del API incluyan en cada retribución el campo `sended_at` (ISO datetime o null) para mostrarlo en la UI.
