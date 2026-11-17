# probusiness_intranetv3 (front Nuxt 3 + Nuxt UI 3.3.7)

Back: `HarukaDev31/intranet_back` (Laravel). Prod = `master` (Netlify "intranetv2"), QA = `qa` (Netlify "qaintranet",
https://qaintranet.probusiness.pe, despliega solo ~2 min después del push a `qa`).

## Flujo de trabajo
- Rama `soporte/{ticket}` desde `master` → merge `--no-ff` a `qa` → PR a `master`. Nunca push a `master`.
- Antes de subir: `NODE_OPTIONS=--max-old-space-size=6144 npx nuxt build` (debe terminar en "Build complete"; los errores de fetch de fuentes de Google no importan).
- Esperar deploy QA: cambia el `buildId:"…"` del HTML de qaintranet.

## Mapa de módulos (dónde está cada cosa)
- **Pago a Proveedor** (Ventas / Administración / China): `pages/pago-proveedor/**`, `components/pago-proveedor/**`,
  `composables/pago-proveedor/**`, `services/pagoProveedorService.ts`, `types/pago-proveedor.ts`.
  - Detalle de solicitud y etapas: `pages/pago-proveedor/solicitudes/[id].vue` + `components/pago-proveedor/SupplierPaymentProgress.vue`.
  - Validar depósito / aprobación: `DepositReviewModal.vue`, `ApprovalReviewModal.vue`. Yuanes: `SupplierPaymentYuan.vue`, `YuanRequestDrawer.vue`.
  - Estilo de tablas: `assets/css/pago-proveedor-tablas.css` (clases `pp-tabla`).
- **Almacén China** (perfil ContenedorAlmacen): `pages/operaciones-china`, `pages/clientes-china`, `pages/flujo-caja`,
  `components/china-billing/**`, `services/chinaBillingService.ts`, `types/china-billing.ts`.
  - Nueva operación: `ChinaOperationForm.vue` (país = UInputMenu paginado, tarifas del socio, `rate_tier`).
  - Cobros: `ChinaPaymentsPanel.vue` (tabla) + `ChinaPaymentDrawer.vue` (lateral) + `ChinaPaymentForm.vue` (registrar pago).
  - Clientes = organizaciones socio/importador: `ChinaClientForm.vue`. Panel de acceso › Organizaciones: `pages/panel-acceso/organizaciones.vue`.
- **Pagos del socio/importador**: `pages/pagos-socio` + `components/partner-payments/PartnerBillingPanel.vue` (acceso por permiso de menú `pagos-socio`, sin filtro de rol en el front).
- Contenedor común de estas páginas: `components/pago-proveedor/SupplierPaymentPage.vue` (`wide-tables` = tablas a todo el ancho).

## Convenciones de UI
- Montos: `UInputNumber` con `:step="0.01"` (con `1` redondea los centavos) y sin +/−: `:ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }"`.
- `UAvatar` no acepta `color`/`variant`: para íconos naranjas usar `class="bg-primary/10" :ui="{ icon: 'text-primary' }"`.
- DataTable duplica la tabla (columna fija): en pruebas filtrar filas/botones visibles.

## Pruebas en QA
- `e2e/qa/` (ver su README): `npx playwright test --config=playwright.qa.config.ts --trace off`, credenciales por variables `QA_*`.
  En sesiones en la nube: `PW_CHROMIUM_PATH=$(ls -d /opt/pw-browsers/chromium*/chrome-linux*/chrome | head -1)`.
- `e2e/china-billing/` es para base local con semilla (no QA).

## Cómo trabajar (ahorro de tokens)
- **Verificar según el tipo de cambio**: color/texto/ancho → build + 1 chequeo de DOM (estilo computado, texto, anchos) sin capturas.
  Lógica (cálculos, estados, permisos) → correr/extender `e2e/qa` o un script corto; capturas solo si el layout es el problema.
- No re-explorar: usar el mapa de arriba antes de buscar con grep.
- Cambios simples de UI (colores, textos, anchos, placeholders) → delegar a un modelo menor (Sonnet/Haiku); back, migraciones y reglas de negocio → modelo principal.
- Mensajes cortos: en el chat del ticket y en PRs, un resumen al cerrar cada ronda, no por cada cambio.
- Una sesión nueva por ronda de observaciones; leer "Estado" abajo en vez de reconstruir el historial.

## Estado PRY-26-0003 (Pago a Proveedor + Almacén China)
- Rama `soporte/PRY-26-0003-2` en front y back, en `qa`. PRs abiertos sin merge: front #166, back intranet_back#41 (van juntos; el back trae migraciones y elimina `china_clients`).
- Ticket en la intranet: id 121 (chat de Meliza Valle). Al atender: responder en el chat con "[Soporte Bot] …" y marcar los mensajes como revisados
  (`PATCH /api/soporte-ti/chats/{uuid}/mensajes/{id}/revisado`). Todas las observaciones hasta el mensaje 1999 están atendidas y marcadas.
- Datos de prueba en QA: socio "[QA-PRUEBA] Socio Colombia" (org 6) e importador "[QA-PRUEBA] Importador Lima" (org 7), ambos con usuario (correo); operaciones/cobros "[QA-E2E …]".
- Pendiente: tarifas de Pro Business (org 1) se configuran en Panel de acceso; e2e local `e2e/china-billing` desactualizado.
