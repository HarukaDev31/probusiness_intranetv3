# Rendimiento en desarrollo (`npm run dev`)

## Tiempos normales en este proyecto

Con ~174 páginas, `@nuxt/ui`, Nuxt Icon (modo local) y Nitro en dev, un arranque en frío suele tardar **15–20 s**. No es un bug aislado: el grafo del proyecto es grande.

## Cambios ya aplicados en `nuxt.config.ts`

- **DevTools desactivados por defecto** (menos trabajo al iniciar).
- **Vite `server.watch.ignored`** ignora `node_modules`, `.git`, `.nuxt`, `.output`, `dist` (menos reinicios en bucle).

### Activar DevTools cuando los necesites

PowerShell:

```powershell
$env:NUXT_DEVTOOLS = 'true'
npm run dev
```

## Lazy load en rutas de entrega

Las páginas bajo `pages/cargaconsolidada/**/entrega/` cargan `EntregaView`, `EntregaClientesView`, `CargoEntregaFirmaCargaView` y `HorariosAdmin` con `defineAsyncComponent` (chunks separados al navegar).

## Vite warmup (`nuxt.config.ts`)

Al arrancar `pnpm dev`, Vite precalienta layout, `DataTable` y la ruta de entrega en completados. Reduce la latencia de la **primera** visita a esas pantallas en desarrollo.

## Checklist: OneDrive (solo si está activo)

Si el repo está sincronizado con OneDrive, Vite puede reiniciar en bucle (`.nuxt/dist directory has been removed`). Si OneDrive **no** está activo, ignora esta sección.

- Mover el proyecto fuera de carpetas sincronizadas, o excluir `node_modules` y `.nuxt` de la copia de seguridad.

## Otras mejoras opcionales

| Acción | Efecto |
|--------|--------|
| Quitar `@nuxtjs/tailwindcss` del `package.json` si no se usa (solo `@nuxt/ui` + Tailwind 4) | Menos `node_modules` |
| Reducir páginas duplicadas (`coordinacion` / `documentacion` copiadas de `completados`) | Menos rutas que escanear |
| `npx update-browserslist-db@latest` | Quita el WARN de Browserslist (marginal) |
| No guardar muchos archivos a la vez al arrancar | Evita reinicios de Nuxt |

## Medir de nuevo

Tras mover fuera de OneDrive o excluir carpetas:

1. Detener `npm run dev` (Ctrl+C)
2. Borrar `.nuxt` una vez: `Remove-Item -Recurse -Force .nuxt`
3. `npm run dev` y anotar el tiempo hasta `Nuxt Nitro server built`

Debería bajar varios segundos y dejar de reiniciar en bucle.
