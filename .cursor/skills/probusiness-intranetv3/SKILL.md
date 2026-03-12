---
name: probusiness-intranetv3
description: Context for the probusiness_intranetv3 Nuxt frontend project whose backend lives in a sibling Laravel/PHP 7 repo. Use when tasks may require backend changes, PHP version awareness, or following existing backend conventions.
---

# Probusiness Intranet v3 – Proyecto + Backend

## Ubicación de los proyectos

- **Frontend actual (este repo)**: `probusiness_intranetv3`
- **Backend Laravel**: repositorio hermano en `../intranet_back`
  - Cuando una tarea implique API, modelos, migraciones o lógica de negocio, asume que el backend está ahí.
  - Usa siempre rutas POSIX relativas (`../intranet_back`) en la documentación interna, no rutas de Windows.

## Versión y stack del backend

- Backend en **Laravel/PHP 7.x** (no PHP 8).
- Implica:
  - No usar características exclusivas de PHP 8+:
    - Sin `match`, tipos unión (`TypeA|TypeB`), promoted properties en constructores, atributos `#[...]`, etc.
  - Mantener el estilo de tipado actual del proyecto:
    - Tipos escalares y de retorno solo donde ya se están usando.
    - Evitar introducir tipados agresivos que rompan compatibilidad con PHP 7.

## Convenciones backend a respetar

Cuando hagas cambios en `../intranet_back`:

1. **Laravel estándar**
   - Controladores bajo `App\Http\Controllers\...` siguiendo el árbol existente (por ejemplo `CalculadoraImportacion`, `CargaConsolidada`).
   - Modelos bajo `App\Models\...` respetando nombres y namespaces ya usados.
   - Servicios bajo `App\Services\...` cuando la lógica de dominio es más compleja.
   - Rutas modulares en `routes/modules/*.php` siguiendo los patrones ya existentes.

2. **Migraciones**
   - Nuevas migraciones en `database/migrations` con nombres y timestamps coherentes con las ya creadas.
   - Mantener consistencia de tipos (`unsignedInteger` vs `unsignedBigInteger`, `nullable()`, etc.) según las tablas actuales.
   - Si amplías tablas ya tocadas por este proyecto (por ejemplo calculadora de importación, carga consolidada, TC Yuan), revisa primero las migraciones recientes para copiar el mismo estilo.

3. **Capa de servicio**
   - Si ya existe un `Service` para el módulo (por ejemplo `CalculadoraImportacionService`), extiende ahí la lógica en vez de meterla en el controlador.
   - Devuelve siempre respuestas JSON consistentes con lo que el frontend ya espera (`success`, `message`, `data`, etc.).

4. **Rutas y controladores**
   - Reutiliza los prefijos y middlewares definidos en los archivos de rutas modulares (no inventes nuevos patrones salvo necesidad explícita).
   - Cuando añadas endpoints, sigue la misma convención de nombres (`index`, `store`, `update`, `show`, etc.) y de URLs que se ve en los módulos `carga-consolidada` y `calculadora-importacion`.

## Coordinación frontend–backend

Cuando trabajes en el repo `probusiness_intranetv3` y la funcionalidad toque datos de API:

- Por defecto, **busca y modifica también** la parte correspondiente en `../intranet_back`.
- Asegúrate de:
  - Mantener alineados nombres de campos (`es_imo`, `usa_yuan`, `tc_yuan_usado`, etc.) entre TypeScript (`types/*.ts`), servicios (`services/*.ts`) y modelos/migraciones de Laravel.
  - Respetar las estructuras de respuesta que ya usa el frontend antes de introducir cambios de contrato.

## Ejemplos de cuándo aplicar este skill

- El usuario menciona cambiar o añadir:
  - Endpoints de API, lógica de negocio, validaciones o migraciones.
  - Campos relacionados con calculadora de importación, carga consolidada, TC Yuan, límites IMO, etc.
- El usuario pide “pushear en back” o confirmar cambios en backend.
- Cualquier tarea donde sea necesario recordar que:
  - El backend está en `../intranet_back`.
  - Es **Laravel en PHP 7**, con las convenciones descritas arriba.

