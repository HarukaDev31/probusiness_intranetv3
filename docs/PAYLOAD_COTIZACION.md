# Documentación del Payload - Guardar Cotización

## Endpoint
`POST /api/calculadora-importacion/save` (ajustar según tu ruta)

## Descripción
Este payload se envía cuando el usuario completa el formulario de 4 pasos de la calculadora de importación y presiona "Finalizar". Contiene toda la información del cliente, proveedores, productos, tarifas y asignaciones.

---

## Estructura del Payload

```typescript
{
  clienteInfo: ClienteInfo,
  proveedores: ProveedorRequest[],
  tarifaTotalExtraProveedor: number,
  tarifaTotalExtraItem: number,
  tarifaDescuento: number,
  id_usuario: number | null,
  id_carga_consolidada_contenedor: number | null,
  tarifa: Tarifa
}
```

---

## Desglose de Campos

### 1. `clienteInfo` (Object - Obligatorio)
Información del cliente que solicita la cotización.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `nombre` | string | Condicional* | Nombre completo del cliente. **Obligatorio si `tipoDocumento = 'DNI'`** |
| `dni` | string | Condicional* | DNI del cliente. **Obligatorio si `tipoDocumento = 'DNI'`** |
| `empresa` | string | Condicional* | Razón social de la empresa. **Obligatorio si `tipoDocumento = 'RUC'`** |
| `ruc` | string | Condicional* | RUC de la empresa. **Obligatorio si `tipoDocumento = 'RUC'`** |
| `whatsapp` | string \| null | Obligatorio | Número de WhatsApp del cliente |
| `correo` | string | Obligatorio | Correo electrónico del cliente |
| `tipoCliente` | string | Obligatorio | Tipo de tarifa del cliente. Valores: `'NUEVO'`, `'RECURRENTE'`, `'VIP'`, etc. |
| `tipoDocumento` | string | Obligatorio | Tipo de documento. Valores: `'DNI'` o `'RUC'` |
| `qtyProveedores` | number | Obligatorio | Cantidad total de proveedores (auto-calculado) |

**Nota:** Si `tipoDocumento = 'DNI'`, los campos `empresa` y `ruc` estarán vacíos. Si `tipoDocumento = 'RUC'`, los campos `nombre` y `dni` estarán vacíos.

**Ejemplo:**
```json
{
  "nombre": "Miguel Villegas Perez",
  "dni": "54646456",
  "empresa": "",
  "ruc": "",
  "whatsapp": "51934958839",
  "correo": "mvillegas@probusiness.pe",
  "tipoCliente": "NUEVO",
  "tipoDocumento": "DNI",
  "qtyProveedores": 2
}
```

---

### 2. `proveedores` (Array - Obligatorio)
Lista de proveedores con sus productos. Mínimo 1 proveedor.

#### Estructura de cada proveedor:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `cbm` | number | Obligatorio | Volumen total del proveedor en metros cúbicos (m³) |
| `peso` | number | Obligatorio | Peso total del proveedor en kilogramos (kg) |
| `qtyCaja` | number | Obligatorio | Cantidad total de cajas del proveedor |
| `productos` | ProductoItemRequest[] | Obligatorio | Lista de productos del proveedor (mínimo 1) |

#### Estructura de cada producto (`ProductoItemRequest`):

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `nombre` | string | Obligatorio | Nombre descriptivo del producto |
| `precio` | number | Obligatorio | Precio FOB unitario del producto en USD |
| `valoracion` | number | Opcional | Precio ajustado/valoración para aduanas (default: 0) |
| `cantidad` | number | Obligatorio | Cantidad de unidades del producto |
| `antidumpingCU` | number | Obligatorio | Antidumping por unidad en USD (default: 0) |
| `adValoremP` | number | Obligatorio | Porcentaje de Ad Valorem aplicable (default: 0) |

**Ejemplo:**
```json
[
  {
    "cbm": 2.5,
    "peso": 150,
    "qtyCaja": 4,
    "productos": [
      {
        "nombre": "Juguete de plástico",
        "precio": 5.50,
        "valoracion": 7.00,
        "cantidad": 100,
        "antidumpingCU": 0.50,
        "adValoremP": 6
      },
      {
        "nombre": "Peluche",
        "precio": 3.20,
        "valoracion": 0,
        "cantidad": 200,
        "antidumpingCU": 0,
        "adValoremP": 0
      }
    ]
  },
  {
    "cbm": 1.8,
    "peso": 100,
    "qtyCaja": 3,
    "productos": [
      {
        "nombre": "Artículo decorativo",
        "precio": 8.00,
        "valoracion": 0,
        "cantidad": 50,
        "antidumpingCU": 0,
        "adValoremP": 0
      }
    ]
  }
]
```

---

### 3. `tarifaTotalExtraProveedor` (Number - Obligatorio)
Tarifa total extra por proveedores adicionales.

**Cálculo:**
- Los primeros 3 proveedores no tienen costo adicional
- Del 4to proveedor en adelante: **$50.00 USD por proveedor**
- Se suma cualquier tarifa adicional manual ingresada en el Paso 4

**Fórmula:** 
```
tarifaTotalExtraProveedor = (cantidad_proveedores_extra × $50) + tarifa_manual_adicional
```

**Ejemplo:** 
- 5 proveedores → 2 extras → 2 × $50 = $100.00
- Tarifa manual adicional: $20.00
- **Total: $120.00**

---

### 4. `tarifaTotalExtraItem` (Number - Obligatorio)
Tarifa total extra por items adicionales según el volumen CBM.

**Cálculo:** Depende del rango de CBM total y cuántos items hay por encima del límite base.

| Rango CBM | Items Base Gratis | Items Extra Permitidos | Tarifa por Item Extra |
|-----------|-------------------|------------------------|----------------------|
| 0.1 - 1.0 m³ | 6 | 4 | $20.00 USD |
| 1.1 - 2.0 m³ | 8 | 7 | $10.00 USD |
| 2.1 - 3.0 m³ | 10 | 5 | $10.00 USD |

**Fórmula:** 
```
tarifaTotalExtraItem = suma_items_extra_por_proveedor + tarifa_manual_adicional
```

**Ejemplo:**
- Proveedor 1: CBM = 1.5 → Base 8 items gratis. Tiene 10 items → 2 extras × $10 = $20.00
- Proveedor 2: CBM = 0.8 → Base 6 items gratis. Tiene 8 items → 2 extras × $20 = $40.00
- Tarifa manual adicional: $15.00
- **Total: $75.00**

---

### 5. `tarifaDescuento` (Number - Opcional)
Descuento aplicado a la cotización en USD.

**Valor por defecto:** `0`

**Ejemplo:** `50.00` (descuento de $50 USD)

---

### 6. `id_usuario` (Number | null - Obligatorio en Paso 4)
ID del vendedor asignado a esta cotización.

**Valor:** 
- ID numérico del usuario vendedor seleccionado en el Paso 4
- `null` si no se asignó vendedor

**Ejemplo:** `15` (ID del usuario "Carlos Mendoza")

---

### 7. `id_carga_consolidada_contenedor` (Number | null - Obligatorio en Paso 4)
ID del contenedor/campaña al que se asignará esta cotización.

**Valor:** 
- ID numérico del contenedor seleccionado en el Paso 4
- `null` si no se asignó contenedor

**Ejemplo:** `42` (Contenedor #42)

---

### 8. `tarifa` (Object - Obligatorio)
Objeto con la tarifa calculada automáticamente según el CBM total y tipo de cliente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID de la tarifa en la base de datos |
| `limit_inf` | string | Límite inferior del rango CBM (ej: "0.1") |
| `limit_sup` | string | Límite superior del rango CBM (ej: "1.0") |
| `type` | string | Tipo de tarifa. Valores: `'STANDARD'` o `'PLAIN'` |
| `tarifa` | number | Monto de la tarifa en USD |
| `label` | string | Etiqueta del tipo de cliente (ej: "NUEVO") |
| `value` | string | Valor del tipo de cliente (ej: "NUEVO") |

**Ejemplo:**
```json
{
  "id": 5,
  "limit_inf": "1.1",
  "limit_sup": "2.0",
  "type": "STANDARD",
  "tarifa": 450.00,
  "label": "NUEVO",
  "value": "NUEVO"
}
```

---

## Ejemplo Completo del Payload

```json
{
  "clienteInfo": {
    "nombre": "Miguel Villegas Perez",
    "dni": "54646456",
    "empresa": "",
    "ruc": "",
    "whatsapp": "51934958839",
    "correo": "mvillegas@probusiness.pe",
    "tipoCliente": "NUEVO",
    "tipoDocumento": "DNI",
    "qtyProveedores": 2
  },
  "proveedores": [
    {
      "cbm": 1.5,
      "peso": 120,
      "qtyCaja": 5,
      "productos": [
        {
          "nombre": "Juguete de plástico",
          "precio": 5.50,
          "valoracion": 7.00,
          "cantidad": 100,
          "antidumpingCU": 0.50,
          "adValoremP": 6
        },
        {
          "nombre": "Peluche",
          "precio": 3.20,
          "valoracion": 0,
          "cantidad": 200,
          "antidumpingCU": 0,
          "adValoremP": 0
        }
      ]
    },
    {
      "cbm": 0.8,
      "peso": 80,
      "qtyCaja": 3,
      "productos": [
        {
          "nombre": "Artículo decorativo",
          "precio": 8.00,
          "valoracion": 0,
          "cantidad": 50,
          "antidumpingCU": 0,
          "adValoremP": 0
        }
      ]
    }
  ],
  "tarifaTotalExtraProveedor": 0,
  "tarifaTotalExtraItem": 60.00,
  "tarifaDescuento": 25.00,
  "id_usuario": 15,
  "id_carga_consolidada_contenedor": 42,
  "tarifa": {
    "id": 5,
    "limit_inf": "2.0",
    "limit_sup": "3.0",
    "type": "STANDARD",
    "tarifa": 550.00,
    "label": "NUEVO",
    "value": "NUEVO"
  }
}
```

---

## Notas Importantes

1. **Validación de Campos Condicionales:** El backend debe validar que si `tipoDocumento = 'DNI'`, los campos `nombre` y `dni` tengan valores, y viceversa para `RUC`.

2. **CBM Total:** Se calcula sumando todos los `cbm` de los proveedores. Este valor determina qué `tarifa` se aplica.

3. **Tarifas Automáticas:** Los campos `tarifaTotalExtraProveedor` y `tarifaTotalExtraItem` ya vienen calculados desde el frontend, pero el backend puede recalcularlos para validación.

4. **Descuento Opcional:** Si no se aplica descuento, el valor será `0`.

5. **Asignaciones:** Los campos `id_usuario` e `id_carga_consolidada_contenedor` son obligatorios en el Paso 4, pero pueden ser `null` si el usuario no selecciona ninguna opción.

---

## Flujo de Datos

```
Paso 1: Datos del Cliente
  ↓
  clienteInfo se completa

Paso 2: Información de Carga
  ↓
  proveedores[] se llena con productos

Paso 3: Cálculos y Resumen
  ↓
  Se muestran todos los cálculos
  tarifa se asigna automáticamente según CBM

Paso 4: Terminar
  ↓
  Se ingresan tarifas manuales adicionales
  Se selecciona vendedor y contenedor
  ↓
  Se envía payload completo al backend
```

---

## Fecha de Actualización
14 de enero de 2026

## Versión
1.0.0
