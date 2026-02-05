# Calculadora de Importación – Reglas de negocio y API

Documento extraído de `pages/cotizaciones/crear.vue` y `composables/useCalculadoraImportacion.ts`. **No incluye reglas de descuento.**

---

## 1. Reglas de negocio

### 1.1 Proveedores (extras)

| Constante | Valor | Significado |
|-----------|--------|-------------|
| **MAX_PROVEEDORES** | 3 | Número de proveedores “incluidos” (sin cargo extra). |
| **MAX_PROVEEDORES_EXTRA** | 3 | Máximo de proveedores adicionales permitidos (más allá de los 3 base). |
| **TARIFA_EXTRA_PROVEEDOR** | 50 | USD por cada proveedor que exceda los 3. |

**Límites:**

- Total máximo de proveedores = `MAX_PROVEEDORES + MAX_PROVEEDORES_EXTRA` = **6**.
- En el paso 1, “Qty Proveedores” está acotado entre 1 y 6 (`:min="1"` `:max="6"`).

**Cálculo del extra por proveedores:**

- Proveedores “extra” = `cantidad de proveedores - 3` (si es negativo se usa 0).
- Monto extra proveedores = `proveedores_extra × 50` USD.  
- Ese monto se puede sobrescribir manualmente en el formulario (`tarifaExtraProveedorManual`); lo que se envía al backend es el valor final (manual o calculado).

---

### 1.2 Ítems extra (por CBM total)

El número de ítems “base” y “extra” permitidos, y la tarifa por ítem extra, dependen del **CBM total** de la cotización (suma de `cbm` de todos los proveedores).

Se usa la tabla **TARIFAS_EXTRA_ITEM_PER_CBM** (por rango de CBM):

| id | CBM desde (limit_inf) | CBM hasta (limit_sup) | item_base | item_extra | item_max | tarifa (USD/ítem extra) |
|----|----------------------|------------------------|-----------|------------|----------|--------------------------|
| 1  | 0.1                  | 1.0                   | 6         | 4          | 10       | 20                       |
| 2  | 1.01                 | 2.0                   | 8         | 7          | 15       | 10                       |
| 3  | 2.1                  | 3.0                   | 10        | 5          | 15       | 10                       |
| 4  | 3.1                  | 6.0                   | 13        | 7          | 20       | 10                       |
| 5  | 6.1                  | 9.0                   | 15        | 5          | 20       | 10                       |
| 6  | 9.1                  | 12.0                  | 17        | 8          | 25       | 10                       |
| 7  | 12.1                 | 15.0                  | 19        | 6          | 25       | 10                       |
| 8  | 15.1                 | 9999                   | 20        | 10         | 30       | 10                       |

**Definiciones:**

- **item_base:** cantidad de ítems (líneas de producto) incluidas sin cargo.
- **item_extra:** cantidad de ítems que se pueden agregar como “extra” (cobrables).
- **item_max = item_base + item_extra:** tope de ítems permitidos para ese rango de CBM.
- **tarifa:** precio en USD por cada ítem que supere `item_base` (hasta el límite de ítems extra).

**Cálculo del extra por ítems:**

1. Se obtiene el total de ítems = número de entradas en `proveedores[].productos` (no la suma de cantidades).
2. Con el CBM total se elige la fila de la tabla (rango donde cae el CBM; si no hay coincidencia exacta se usa la más cercana o la primera si CBM ≤ 0).
3. `ítems_extra_a_cobrar = min( total_ítems - item_base, item_extra )` (no se cobran por encima de `item_max`).
4. Monto extra ítems = `ítems_extra_a_cobrar × tarifa` (USD).  
- Ese monto también se puede sobrescribir manualmente (`tarifaExtraItemManual`); al backend se envía el valor final.

---

### 1.3 Tarifa principal (por tipo de cliente y CBM)

- La **tarifa principal** (flete/base) se elige por **tipo de cliente** (NUEVO, RECURRENTE, PREMIUM, SOCIO, INACTIVO, MANUAL) y por **CBM total**.
- Las opciones vienen del backend: `GET api/calculadora-importacion/tarifas`. Cada tarifa tiene `label`, `value`, `limit_inf`, `limit_sup`, `tarifa`, etc.
- Si el tipo es **MANUAL**, la tarifa es un número ingresado por el usuario (obligatorio y > 0).
- **Descuento:** no se documenta aquí (excluido por solicitud).

---

### 1.4 Validaciones en el flujo (resumen)

- Paso 1: WhatsApp obligatorio; según tipo documento, nombre (DNI) o empresa (RUC) obligatorio; `qtyProveedores` entre 1 y 6.
- Paso 2: Al menos un proveedor; cada uno con `cbm > 0`, al menos un producto con nombre, precio > 0, cantidad > 0. No se pueden superar los ítems máximos del rango de CBM.
- Paso 3: Tarifa seleccionada (o tarifa manual válida).
- Al guardar: vendedor y consolidado obligatorios; si tarifa es MANUAL, `tarifa > 0`.

---

## 2. API a la que enviar la cotización

**Método y URL**

- **POST** `api/calculadora-importacion`  
- Body: JSON (objeto `saveCotizacionRequest`).

Para **actualizar** una cotización existente, se envía el mismo body incluyendo el campo **`id`** (número) con el ID de la cotización.

---

## 3. Payload (ejemplo)

Estructura que arma el front en `handleEndFormulario` (sin incluir lógica de descuento en esta doc).

```json
{
  "id": 123,
  "clienteInfo": {
    "nombre": "Juan Pérez",
    "dni": "12345678",
    "whatsapp": "51999888777",
    "correo": "juan@mail.com",
    "qtyProveedores": 2,
    "tipoCliente": "NUEVO",
    "tipoDocumento": "DNI",
    "empresa": "",
    "ruc": ""
  },
  "proveedores": [
    {
      "id": "1",
      "code_supplier": "PROV001",
      "cbm": 2.5,
      "peso": 120,
      "qtyCaja": 10,
      "productos": [
        {
          "nombre": "Producto A",
          "precio": 10.5,
          "valoracion": 100,
          "cantidad": 50,
          "antidumpingCU": 0,
          "adValoremP": 5.2
        },
        {
          "nombre": "Producto B",
          "precio": 8,
          "valoracion": 80,
          "cantidad": 100,
          "antidumpingCU": 0,
          "adValoremP": 0
        }
      ]
    },
    {
      "id": "2",
      "code_supplier": null,
      "cbm": 1.2,
      "peso": 60,
      "qtyCaja": 5,
      "productos": [
        {
          "nombre": "Producto C",
          "precio": 15,
          "valoracion": 200,
          "cantidad": 20,
          "antidumpingCU": 0,
          "adValoremP": 0
        }
      ]
    }
  ],
  "tarifaTotalExtraProveedor": 0,
  "tarifaTotalExtraItem": 30,
  "tarifaDescuento": 0,
  "id_usuario": 5,
  "id_carga_consolidada_contenedor": 12,
  "tarifa": {
    "id": 1,
    "limit_inf": "0",
    "limit_sup": "5",
    "type": "STANDARD",
    "tarifa": 850,
    "label": "NUEVO",
    "value": "NUEVO"
  },
  "tipo_cambio": 3.7
}
```

**Notas:**

- **`id`**: solo en edición; en creación se omite.
- **`clienteInfo.tipoDocumento`**: `"DNI"` o `"RUC"`. Si es RUC, suelen usarse `empresa` y `ruc` en lugar de nombre/dni.
- **`proveedores[].id`**: string (ej. `"1"`, `"2"`). Opcional según backend.
- **`proveedores[].code_supplier`**: puede ser `null` si no hay código.
- **`tarifaTotalExtraProveedor`** / **`tarifaTotalExtraItem`**: en el front se calculan con las reglas anteriores pero el usuario puede editarlos; se envía el valor final (manual o calculado).
- **`tarifaDescuento`**: se envía (ej. 0); reglas de descuento no documentadas aquí.
- **`id_usuario`**: ID del vendedor (obligatorio al guardar).
- **`id_carga_consolidada_contenedor`**: ID del consolidado (obligatorio al guardar).
- **`tarifa`**: objeto de tarifa (viene de `GET tarifas` o en MANUAL con `tarifa` numérico).

---

## 4. Respuesta esperada del backend

El frontend hace:

```ts
const response = await CalculadoraImportacionService.saveCotizacion(saveCotizacionRequest)
if (response.success) {
  // redirige a /cotizaciones
}
```

Por tanto la API debe responder con un objeto que tenga al menos:

- **`success`**: `true` si la cotización se creó/actualizó correctamente; `false` en caso contrario.

Ejemplo mínimo:

```json
{
  "success": true,
  "data": {
    "id": 124,
    "cod_cotizacion": "COT-2026-001",
    ...
  },
  "message": "Cotización guardada correctamente"
}
```

En error se espera algo como `success: false` y opcionalmente `message` para mostrar al usuario.

---

## 5. Resumen de constantes (front)

```ts
MAX_PROVEEDORES        = 3
MAX_PROVEEDORES_EXTRA  = 3
TARIFA_EXTRA_PROVEEDOR = 50   // USD por proveedor extra

TARIFAS_EXTRA_ITEM_PER_CBM = [
  { limit_inf: 0.1,   limit_sup: 1.0,   item_base: 6,  item_extra: 4,  tarifa: 20 },
  { limit_inf: 1.01,  limit_sup: 2.0,   item_base: 8,  item_extra: 7,  tarifa: 10 },
  { limit_inf: 2.1,   limit_sup: 3.0,   item_base: 10, item_extra: 5,  tarifa: 10 },
  { limit_inf: 3.1,   limit_sup: 6.0,   item_base: 13, item_extra: 7,  tarifa: 10 },
  { limit_inf: 6.1,   limit_sup: 9.0,   item_base: 15, item_extra: 5,  tarifa: 10 },
  { limit_inf: 9.1,   limit_sup: 12.0,  item_base: 17, item_extra: 8,  tarifa: 10 },
  { limit_inf: 12.1,  limit_sup: 15.0,  item_base: 19, item_extra: 6,  tarifa: 10 },
  { limit_inf: 15.1,  limit_sup: 9999,  item_base: 20, item_extra: 10, tarifa: 10 },
]
```

El backend puede replicar estas constantes o recibir los montos ya calculados en `tarifaTotalExtraProveedor` y `tarifaTotalExtraItem` (el front envía el valor final que ve el usuario, manual o calculado).
