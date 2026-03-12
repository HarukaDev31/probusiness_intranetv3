---
name: precheck-components-architecture
description: Enforces reuse-first UI development and the project’s architecture rule that pages/components never call services directly but go through composables. Use whenever adding or changing UI/features or when a page/component needs backend data.
---

# Precheck de componentes y arquitectura

## Cuándo usar esta skill

Aplica **siempre antes de desarrollar** cuando:

- Se va a implementar una **nueva feature de UI** (página, sección, modal, tabla, formulario, filtro, etc.).
- Se va a agregar un **nuevo componente** visual.
- Una página o componente necesita **llamar a un servicio/API**.

## Reglas generales

1. **Patrón arquitectónico**
   - Las **pages (`pages/*.vue`) y components (`components/**/*.vue`) no pueden llamar servicios directamente**.
   - Todo acceso a backend/APIs/`services/**` debe pasar por un **composable** (`composables/*.ts`), que:
     - Expone funciones reusables (por ej. `useCalendarStore`, `useCotizaciones`, etc.).
     - Encapsula las llamadas a `services/*` y la manipulación de estado.
   - Si una page o componente actualmente importa un `Service` directo, debes:
     - Crear o reutilizar un composable que envuelva esa lógica.
     - Mover la llamada de servicio al composable.
     - Hacer que la page/componente solo consuma el composable.

2. **Orden de búsqueda de soluciones**
   - **Paso 1 – Reutilizar componentes del proyecto**
     - Antes de crear algo nuevo, revisa si ya existe un componente equivalente o similar.
     - Usa estas herramientas (en este orden de preferencia):
       - `Glob` / búsqueda por nombre en `components/**` y `pages/**`.
       - `Grep` / `SemanticSearch` para buscar conceptos similares (por ejemplo: “ActivityModal”, “CalendarFilters”, “tabla actividades”, “select responsables”).
     - Si encuentras un componente parecido:
       - Primero evalúa **composición/extensión** (props/slots/opciones) antes de duplicar lógica.
       - Solo si la reutilización es claramente peor (mucho acoplamiento o side-effects) considera extraer una parte a un sub-componente reusado.

   - **Paso 2 – Revisar documentación de Nuxt UI 3**
     - Si no hay componente propio reutilizable, **no inventes de cero aún**.
     - Revisa la doc de Nuxt UI 3 (`USelectMenu`, `UInput`, `UTable`, `UModal`, etc.) usando `WebFetch` o la URL conocida `https://ui3.nuxt.com/components/...`.
     - Intenta primero modelar la feature usando:
       - Componentes ya usados en el proyecto (mira ejemplos existentes en el código).
       - Combinación de componentes de Nuxt UI 3 + estilos Tailwind.

   - **Paso 3 – Crear componente nuevo desde cero**
     - Solo si:
       - No existe un componente del proyecto apropiado **y**
       - El patrón de Nuxt UI no cubre la necesidad sin hacks raros,
     - Entonces define y crea un nuevo componente bajo `components/**` o un nuevo composable bajo `composables/**`.
     - Mantén el componente:
       - **Enfocado** (una sola responsabilidad).
       - **Configurable** mediante props/slots en lugar de copiar/pegar versiones casi iguales.

3. **Uso de servicios y composables**

Cuando una feature necesita datos del backend o acciones (GET/POST/PUT/DELETE):

1. **Buscar composable existente**
   - Antes de tocar `services/**`, busca un composable adecuado:
     - Ejemplo: `useCalendarStore`, `useCotizaciones`, etc.
   - Si existe:
     - Reutiliza sus métodos/estado.
     - Si le falta una operación pequeña y encaja en su responsabilidad, extiéndelo ahí (no desde la page).

2. **Crear/expandir composable**
   - Si no existe un composable especializado:
     - Crea uno nuevo en `composables/` (por ejemplo `useXxxStore` o `useXxx`).
   - El composable:
     - Importa el `Service` correspondiente desde `services/**`.
     - Expone funciones limpias a las pages/componentes (ej: `loadFoo`, `createBar`, `updateBaz`).
     - Maneja errores, loading, caches y normalización de datos.

3. **Prohibiciones**
   - No llames `CalendarService`, `CotizacionesService`, ni ningún `Service` desde:
     - `pages/**`
     - `components/**`
   - No dupliques lógica de mapeo/normalización de respuestas en varias pages; centralízala en el composable.

## Checklist antes de crear/editar una feature

1. **¿Existe ya un componente similar?**
   - [ ] Busqué en `components/**` y `pages/**` algo reutilizable.
   - [ ] Si existe, evalué cómo reutilizarlo/extenderlo en lugar de crear uno nuevo.

2. **¿Puedo resolverlo con Nuxt UI 3?**
   - [ ] Revisé la doc de Nuxt UI 3 para el tipo de componente que necesito.
   - [ ] Preferí usar componentes ya presentes en el proyecto + estilos antes que inventar patrones nuevos.

3. **¿Respeto el patrón de arquitectura?**
   - [ ] La page o componente **no** importa directamente ningún `Service`.
   - [ ] Toda lógica de llamadas a backend está encapsulada en un composable bajo `composables/**`.
   - [ ] El composable expone una API clara y reutilizable para otras partes del sistema.

## Ejemplos rápidos

- **Nuevo select con búsqueda**:
  - Buscar primero si ya existe un select parecido (por ejemplo en `CalendarFilters.vue`, `ActivityModal.vue`).
  - Si no, revisar `USelectMenu` en la doc de Nuxt UI 3 y seguir el patrón existente en el proyecto.

- **Nueva página que consume un endpoint**:
  - Crear/usar `useXxxStore` o `useXxx` en `composables/`.
  - Poner ahí las llamadas a `XxxService`.
  - En la page solo usar el composable (`const { loadXxx, items } = useXxxStore()`).

