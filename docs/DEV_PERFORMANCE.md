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

## Checklist: OneDrive (impacto alto en Windows)

El repo está bajo `OneDrive\Desktop`. Eso ralentiza mucho Vite y puede provocar:

`.nuxt/dist directory has been removed. Restarting Nuxt...`

### Opción A — Mover el proyecto (recomendado)

1. Copiar/clonar a una ruta local, por ejemplo: `C:\dev\probusiness_intranetv3`
2. `pnpm install` (o `npm install`)
3. Abrir esa carpeta en Cursor y ejecutar `npm run dev`

### Opción B — Excluir carpetas de la sincronización

En OneDrive → Configuración → Sincronizar y hacer copia de seguridad → **Administrar copia de seguridad**:

- Excluir `node_modules` del proyecto
- Excluir `.nuxt` y `.output` si aparecen

O usar “Liberar espacio” en esas carpetas para que no se sincronicen en tiempo real.

### Opción C — Marcar solo código

Mantener en OneDrive solo lo que subes a git; `node_modules` y `.nuxt` deben generarse solo en disco local.

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
