---
name: organizacion-scope
description: >-
  Fuerza organizacion_id desde el usuario autenticado o el padre en DB, nunca
  desde query/body/headers salvo org 1. Usar al crear/listar/actualizar
  cotizaciones, consolidados, vendedores, archivos, panel-acceso o cualquier
  endpoint multi-org (id_org, organizacion_id, ID_Organizacion).
---

# Alcance por organización

`ID_ORGANIZACION_ADMIN = 1` (Probusiness). El resto son socios.

## Regla

La organización de un registro **nunca** se toma del cliente (`query`, `body`, `headers`, form-data) salvo que el usuario autenticado sea org 1.

- **Org ≠ 1**: `organizacion_id` sale de `auth()->user()->ID_Organizacion` o se **copia del padre en DB** (contenedor → cotización → proveedor → costos/archivos). Ignorar `id_org` / `organizacion_id` si vienen en el request.
- **Org 1**: puede elegir otra org (filtros o panel-acceso). Aun así, no confiar en un `organizacion_id` suelto para **crear** un hijo: copiarlo del padre visible o validar que el padre pertenece a la org elegida.

## Backend (Laravel / PHP 7)

1. Resolver org así:
   ```php
   $authOrg = (int) auth()->user()->getAttribute('ID_Organizacion');
   $orgEfectiva = $authOrg;
   if ($authOrg === 1) {
       $fromRequest = $request->input('id_org', $request->input('organizacion_id'));
       if ($fromRequest !== null && $fromRequest !== '') {
           $orgEfectiva = (int) $fromRequest;
       }
   }
   ```
2. Al **crear**: no asignar `organizacion_id` desde el request. Usar `SincronizaOrganizacionId` (copia del padre) o setear la org del usuario. Validar que el padre (contenedor, vendedor, etc.) pertenezca a `$orgEfectiva`.
3. Al **listar / actualizar / borrar**: Eloquent con `OrganizacionScope` ya filtra. `DB::table()` **no**: agregar `->where('organizacion_id', ...)` a mano.
4. Un socio no puede apuntar a un contenedor/vendedor de otra org mandando su id en el body.

## Frontend

- No enviar `id_org` / `organizacion_id` en servicios de negocio (cotizaciones, consolidados, archivos).
- Excepción: pantallas de **panel-acceso** usadas por org 1 para administrar otras orgs.
- Dropdowns (vendedores, cargas) deben salir de endpoints que ya filtran por la org del token.

## Equivalencia org 1 vs socio

Misma entidad y mismos campos de negocio. Cambia el **origen de datos** (calculadora vs resumen/IA) y los tabs/acciones del rol, no el dueño del registro.
