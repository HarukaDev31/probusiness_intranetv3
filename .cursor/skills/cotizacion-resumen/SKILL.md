---
name: cotizacion-resumen
description: >-
  Reglas de negocio del flujo Cotización Resumen (socios / orgs ≠ 1): editar solo
  COTIZADO, confirmar con contenedor, code_supplier con prefijo de 3 letras de la
  org, duplicar sin contenedor, archivos en la misma vista del cotizador y
  alcance por organización. Usar al tocar pages/cotizaciones/resumen,
  CotizacionResumenController, code_supplier de resumen, o al documentar el
  módulo (manual / Drive JS).
---

# Cotización resumen (socios)

Flujo de cotización **sin items de calculadora**: PDF/Excel + IA → `Cotizacion` + proveedores `modo_cotizacion = resumen`.

Org 1 usa el cotizador (`/cotizaciones`). Orgs 2+ usan este flujo (`/cotizaciones/resumen`). Misma entidad de negocio; cambia el origen de datos.

Leer también: [organizacion-scope](../organizacion-scope/SKILL.md), [precheck-components-architecture](../precheck-components-architecture/SKILL.md), [spinner-modal-async-actions](../spinner-modal-async-actions/SKILL.md).

## Pantallas

| Ruta | Uso |
|------|-----|
| `/cotizaciones/resumen` | Listado (maqueta Cotizador) |
| `/cotizaciones/resumen/crear` | Alta wizard 3 pasos |
| `/cotizaciones/resumen/crear?editar={id}` | Edición (solo COTIZADO) |
| `/cargaconsolidada/abiertos/pasos/{contenedor}` | Entrada al consolidado (socio ve pasos, no salta a cotizaciones) |
| `/cargaconsolidada/abiertos/cotizaciones/{contenedor}?tab=prospectos` | Cotizaciones del consolidado (desde el paso Cotización) |
| `/cargaconsolidada/abiertos/cotizaciones/documentacion/{idCotizacion}?backTo=/cotizaciones/resumen` | Archivos (misma vista que el cotizador org 1) |

Pages/components **no** llaman services: `useCotizacionResumen` → `cotizacionResumenService`.

## Estados

- `estado_resumen`: `COTIZADO` \| `CONFIRMADO` (propio del flujo).
- Al crear / duplicar: `estado_resumen = COTIZADO`, `estado` y `estado_cotizador = PENDIENTE`.
- Con contenedor asignado, **aparece en Prospectos y Embarcados** tanto en COTIZADO como en CONFIRMADO.
- Al confirmar: `estado_resumen`, `estado` y `estado_cotizador` quedan `CONFIRMADO` y se generan `code_supplier` faltantes.

## Contenedor (consolidado)

- **Alta** desde el wizard: el consolidado es obligatorio.
- **Duplicar**: copia igual, estado **COTIZADO**, **sin contenedor**, **sin `code_supplier`**.
- **No se puede confirmar** si `id_contenedor` es null. Hay que editarla (COTIZADO) y asignarle un consolidado.
- Al asignar/cambiar contenedor en edición, se replica `id_contenedor` a proveedores, resumen y archivo IA.
- WhatsApp: si el número no trae código de país, el back antepone el `phone_code` del país del contenedor (`pais_flags`). La comparación en BD clientes usa dígitos internacionales + nacionales (no solo +51).

## Editar

- Solo si `estado_resumen === COTIZADO`. Confirmada: no editar.
- Se pueden **agregar** proveedores, costos y cambiar cliente / vendedor / consolidado.
- Si alguna vez estuvo confirmada y volvió a COTIZADO: **mantener el `code_supplier` de cada proveedor** (emparejar por `id`, nunca por orden de array).
- Proveedores nuevos (sin `id`) nacen sin código; lo reciben en la **siguiente** confirmación, con el siguiente sufijo.
- Si se re-escanea el PDF, conservar `id` + `code_supplier` del proveedor en la **misma posición**.

## Confirmar

1. Exigir contenedor (front + back).
2. Generar `code_supplier` solo donde falte.
3. **No borrar, no reordenar, no pisar** códigos existentes.
4. `fecha_confirmacion` solo la primera vez.

## `code_supplier` (resumen)

Igual que el cotizador (`{iniciales cliente}{carga}-{N}`) **más prefijo de 3 letras de la organización**.

```
{ORG3}{INICIALES}{CARGA}-{N}
Andes Import + Juan Perez + B5 → ANDJUPE5-1
```

- Prefijo: `CodeSupplierHelper::orgPrefix` (ASCII, solo letras, 3 chars).
- Sufijo: `maxSuffixForBase(baseConOrg) + 1` para los nuevos.
- Recorrer proveedores `orderBy('id')` (orden de alta). No reordenar al reconfirmar.
- Org 1 (calculadora) **no** usa este prefijo; solo resumen/socios.

## Archivos

El PDF/Excel del wizard se guarda en `CotizacionProveedorArchivoIa` y también en `cotizacion_file_url`. En Prospectos se muestra en la columna Cotización (PDF o Excel). El botón **Archivos** del listado **solo aparece si está CONFIRMADO**. Abre **la misma vista del cotizador**:

`CotizacionesDocumentacionView` → `/cargaconsolidada/abiertos/cotizaciones/documentacion/{idCotizacion}`.

No abrir el PDF de IA en una pestaña suelta.

Separar por org:

- `organizacion_id` nunca viene del cliente (salvo org 1). Ver skill de org.
- `CotizacionCotizadorDocumentacionController@show` valida la cotización con Eloquent (scope) y filtra `DB::table` por `organizacion_id`.
- Storage: `assets/images/agentecompra/{organizacion_id}/`.
- Staging IA: `cargaconsolidada/cotizacion-resumen/staging/{orgId}`.

## Duplicar

Copia cliente, proveedores, resumen, costos y archivo IA. Limpia:

- `id_contenedor = null` (cabecera e hijos)
- `code_supplier = null`
- `estado_resumen = COTIZADO`
- `estado` / `estado_cotizador = PENDIENTE`
- `cod_contract`, `fecha_confirmacion`
- uuid y fecha nuevos

## Backend (PHP 7)

`../probusiness_intranetv2_back`

- Controller: `CotizacionResumenController`
- Rutas: `routes/modules/carga-consolidada.php` prefix `cotizacion-resumen`
  - `GET /` listado · `POST /` alta · `GET /{id}` detalle
  - `PUT /{id}` editar · `POST /{id}/duplicar`
  - `PUT /{id}/estado` · `DELETE /{id}`
- Helper: `CodeSupplierHelper::generateWithOrgPrefix`

`DB::table()` no tiene `OrganizacionScope`: filtrar `organizacion_id` a mano.

## Frontend

- Types: `types/cargaconsolidada/cotizacion-resumen.ts`
- Composable: `composables/cargaconsolidada/cotizacion-resumen`
- Listado: editar (solo COTIZADO), duplicar, eliminar, archivos, confirmar con contenedor.
- Prospectos y Embarcados (org ≠ 1) comparten headers: CBM China (bandera China), CBM {país del contenedor} (bandera real desde `pais_flags`), CBM Pendiente, CBM IMO, Fob, Logística, Impuestos. La bandera de destino no se hardcodea a Perú: sale de `id_pais` del consolidado.
- Prospectos (org ≠ 1): Nº, Fecha, Contacto, T.Cliente, Volumen, Fob, Logística, Impuestos, Tarifa, Descuento, Cotización, Estado, Acciones. Sin Qty Item ni Cargos extra.
- Embarcados (org ≠ 1): Asesor, Status China, N, Contacto, T.Rotulado (PENDIENTE/GENERAL; solo guarda el tipo), Productos, F. Llegada, Qty item, CBM total, Weight, Supplier, Code supplier (solo lectura), Supplier phone, bloque China, Acciones (ojo, guardar, hamburguesa: enviar rotulado muestra todos los proveedores de la fila y permite asignar el tipo; Enviar solo si al menos uno no está en PENDIENTE; Reenviar si ya se envió; pedir documentos, recordatorio, enviar inspección). Sin Rotulo status. `tipo_rotulado` enum incluye `pendiente` (default). WhatsApp rotulado: conexión general actual; EMTA por org queda pendiente.
- Clientes (org ≠ 1, `/cargaconsolidada/abiertos/clientes/{id}`): solo tabs Documentación y Variación. Documentación mezcla seguimiento + docs: Nº, Contacto, T.Cliente, Volumen, Fob, Logística, Impuesto, Tarifa, Productos, Code Supplier, Invoice, Packing list, Excel Conf., Acciones (hamburguesa: pedir documentos y recordatorios; ojo: misma vista de documentación con tabs Documentación y Excel confirmación, sin Volumen documento ni Valor documento). Variación: Nº, Asesor, Contacto, T.Cliente, Tarifa, Vol. Cot, Vol. China, Variación (solo Cot vs China; sin Valor Cot, Valor Doc ni Vol. Doc). Headers de ambos tabs: bandera China, bandera del país del contenedor, Qty clientes, Qty items, Fob, Logística, Impuestos.
- China: badge de solo lectura (lo cambia Almacén China).

## Documentación posterior (Drive JS / manual)

Esta skill es la fuente de reglas para documentar el front. Cuando se arme el manual (Drive JS o CMS):

1. Una página por pantalla de la tabla de arriba.
2. Copy de usuario, no rutas de API ni env vars.
3. Plantilla de [manual-usuario-plantilla](../manual-usuario-plantilla/SKILL.md): qué es, para qué, quién, cuándo, pasos, campos, consideraciones.
4. Incluir las reglas de esta skill como “Consideraciones”: estados, contenedor, códigos, org, archivos.
5. No inventar un flujo distinto al cotizador org 1: mismas entidades, otro origen de datos.

## Checklist al tocar el módulo

- [ ] Org del usuario o del padre en DB; nunca del body (salvo org 1)
- [ ] Editar solo COTIZADO; confirmar solo con contenedor; con contenedor aparece en Prospectos/Embarcados en COTIZADO y CONFIRMADO
- [ ] `code_supplier` por `id`; prefijo 3 letras org; no reordenar al reconfirmar
- [ ] Duplicar = COTIZADO sin contenedor ni códigos
- [ ] Archivos solo en CONFIRMADO; misma vista del cotizador; path por org
- [ ] Page → composable → service; spinner + modal en async
