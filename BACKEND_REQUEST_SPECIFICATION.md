# Especificación del Request para Actualización de Productos

## Endpoint
```
PUT /api/base-datos/productos/{id}
```

## Estructura del Request Body

### Campos Obligatorios
Ninguno - todos los campos son opcionales

### Campos Opcionales

```json
{
  "link": "string | null",
  "arancel_sunat": "string | null",
  "arancel_tlc": "string | null", 
  "correlativo": "string | null",
  "antidumping": "string | null",
  "antidumping_value": "string | null",
  "tipo_producto": "string | null",
  "entidad_id": "number | null",
  "etiquetado": "string | null",
  "tipo_etiquetado_id": "number | null",
  "doc_especial": "string | null",
  "tiene_observaciones": "boolean | null",
  "observaciones": "string | null"
}
```

## Descripción de Campos

### Campos de Tributos Aduaneros
- **`link`**: URL del producto (ej: "www.alibaba.com/...")
- **`arancel_sunat`**: Porcentaje de arancel SUNAT (ej: "0%", "10%")
- **`arancel_tlc`**: Porcentaje de arancel TLC (ej: "0%", "5%")
- **`correlativo`**: Código correlativo (ej: "NO", "SI", "ABC123")
- **`antidumping`**: Indica si aplica antidumping ("SI" | "NO")
- **`antidumping_value`**: Valor específico del antidumping (solo si `antidumping` = "SI")

### Campos de Requisitos Aduaneros
- **`tipo_producto`**: Tipo de producto ("LIBRE" | "RESTRINGIDO")
- **`entidad_id`**: ID de la entidad (solo si `tipo_producto` = "RESTRINGIDO")
- **`etiquetado`**: Tipo de etiquetado ("NORMAL" | "ESPECIAL")
- **`tipo_etiquetado_id`**: ID del tipo específico de etiquetado (solo si `etiquetado` = "ESPECIAL")
- **`doc_especial`**: Indica si requiere documento especial ("SI" | "NO")

### Campos de Observaciones
- **`tiene_observaciones`**: Indica si tiene observaciones (true | false)
- **`observaciones`**: Texto de las observaciones (solo si `tiene_observaciones` = true)

## Ejemplo de Request

### Request Completo
```json
{
  "link": "https://www.alibaba.com/product-detail/123456",
  "arancel_sunat": "10%",
  "arancel_tlc": "0%",
  "correlativo": "NO",
  "antidumping": "SI",
  "antidumping_value": "25.5%",
  "tipo_producto": "RESTRINGIDO",
  "entidad_id": 5,
  "etiquetado": "ESPECIAL",
  "tipo_etiquetado_id": 12,
  "doc_especial": "SI",
  "tiene_observaciones": true,
  "observaciones": "El vista de aduanas observó la medida del producto."
}
```

### Request Mínimo (solo algunos campos)
```json
{
  "arancel_sunat": "5%",
  "tipo_producto": "LIBRE",
  "etiquetado": "NORMAL"
}
```

### Request con Campos Condicionales
```json
{
  "arancel_sunat": "15%",
  "antidumping": "SI",
  "antidumping_value": "30%",
  "tipo_producto": "RESTRINGIDO",
  "entidad_id": 3,
  "etiquetado": "ESPECIAL",
  "tipo_etiquetado_id": 8,
  "tiene_observaciones": true,
  "observaciones": "Producto requiere certificación adicional."
}
```

## Validaciones del Backend

### Validaciones de Campos Condicionales
1. **`antidumping_value`**: Solo debe enviarse si `antidumping` = "SI"
2. **`entidad_id`**: Solo debe enviarse si `tipo_producto` = "RESTRINGIDO"
3. **`tipo_etiquetado_id`**: Solo debe enviarse si `etiquetado` = "ESPECIAL"
4. **`observaciones`**: Solo debe enviarse si `tiene_observaciones` = true

### Validaciones de Formato
1. **`arancel_sunat`** y **`arancel_tlc`**: Deben ser strings con formato de porcentaje
2. **`antidumping_value`**: Debe ser string con formato de porcentaje
3. **`link`**: Debe ser una URL válida
4. **`tiene_observaciones`**: Debe ser boolean

### Validaciones de Valores Permitidos
1. **`antidumping`**: Solo "SI" o "NO"
2. **`tipo_producto`**: Solo "LIBRE" o "RESTRINGIDO"
3. **`etiquetado`**: Solo "NORMAL" o "ESPECIAL"
4. **`doc_especial`**: Solo "SI" o "NO"

## Respuesta Esperada

### Respuesta de Éxito
```json
{
  "success": true,
  "data": {
    "id": 123,
    "link": "https://www.alibaba.com/product-detail/123456",
    "arancel_sunat": "10%",
    "arancel_tlc": "0%",
    "correlativo": "NO",
    "antidumping": "SI",
    "antidumping_value": "25.5%",
    "tipo_producto": "RESTRINGIDO",
    "entidad_id": 5,
    "etiquetado": "ESPECIAL",
    "tipo_etiquetado_id": 12,
    "doc_especial": "SI",
    "tiene_observaciones": true,
    "observaciones": "El vista de aduanas observó la medida del producto.",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Producto actualizado exitosamente"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": "Mensaje de error específico",
  "data": null
}
```

## Notas Importantes

1. **Campos Opcionales**: Todos los campos son opcionales. El frontend solo envía los campos que tienen valor.
2. **Filtrado**: El frontend filtra campos vacíos, undefined o null antes de enviar.
3. **Campos Condicionales**: Los campos que aparecen solo cuando se selecciona una opción específica son opcionales.
4. **Validación**: El backend debe validar que los campos condicionales solo se envíen cuando corresponda.
5. **Actualización Parcial**: Solo se actualizan los campos enviados, manteniendo los valores existentes para los campos no enviados. 