# Validación Pago a Proveedor

Control de lo recorrido en local contra la especificación (FL-01 a FL-15, CP-01 a CP-68) y la maqueta. El envío real por WhatsApp queda fuera. Cada pasada anota qué se miró y qué código se tocó.

Estados: `ok` recorrido en la pantalla y coincide · `ok-api` regla comprobada contra la API local con el rol real, sin recorrer la pantalla (las de plazo moviendo fechas en la base local) · `parcial` falta una parte, indicada en la nota · `pendiente` no se probó · `fuera` WhatsApp real o decisión marcada pendiente en la especificación.

## Bitácora de cambios

### Pasada 0 — flujo base ya existente antes de esta revisión

- Menú de Administración y China (grupo real `Administración`, no `Admin`).
- El yuan no se muestra en 0 cuando falta el tipo de cambio.
- La cuota 2, en Datos, no muestra el pago anterior como «Importe pagado».
- Paneles con `UCard` y estados con `UBadge`. El indicador de etapas usa `UCard`.
- `DynamicModal` acepta modal nulo (la verificación dejaba de romper).
- Import explícito de depósitos en Verificación.
- En local los archivos se guardan en disco público porque la clave de almacenamiento devolvía acceso inválido. No va a commit.
- Columna `observe_until` aplicada solo en su migración.
- El aviso de yuanes leía el archivo adjunto (`receipt` no llegaba a la vista).

### Pasada 1 — tablas y tema (esta sesión, antes de esta bitácora)

Archivos: `SupplierPaymentYuan.vue`, `SupplierPaymentDeposits.vue`, `SupplierPaymentApprovals.vue`, `SupplierPaymentExecutions.vue`, `SupplierPaymentFact.vue`, `SupplierPaymentWindow.vue`, `DataTable.vue`, `pages/pago-proveedor/solicitudes/index.vue`.

- La lista de yuanes pasó al `DataTable` del proyecto. Se quitaron el buscador, el selector y el botón Buscar propios. Estado y Socio quedan en Filtros.
- Columnas alineadas a la maqueta en yuanes, depósitos, aprobación (por aprobar y aprobados) y dólares (en proceso y pagados).
- Pestañas de aprobación y de dólares con `UTabs`. Se quitaron los chips de tipo; el reembolso se distingue por Estado.
- Textos de esas tablas y ventanas con colores del tema (`text-muted`, `text-highlighted`, `text-success`, `text-error`, `text-warning`, `text-primary`).
- El `DataTable` usa el placeholder y el mensaje vacío que ya recibía y no aplicaba.

### Pasada 2 — recorrido inicial de Cursor

Quedó sin cerrar. Su trabajo lo continúa la pasada 3.

| Hora | Caso | Qué se vio | Cambio en código |
| --- | --- | --- | --- |
| 01:25 | FL-07, CP-46, CP-54, CP-64, CP-67, CP-68 | La orden 9003 está en Confirmación y Completado. El historial dice cierre automático. El balance PDF respondió 200 y quedó en el historial. Al revisar Ejecución solo se ve esa etapa, con constancia y «Volver al paso actual». Ventas que abre Verificación vuelve a Cotizaciones. | `SupplierPaymentProgress.vue` ahora recibe la etapa que se está mirando y, si no es la actual, muestra solo esa. Textos de esa vista con colores del tema. `solicitudes/[id].vue` le pasa la etapa. |
| 01:35 | CP-07, CP-08 | La vista previa de la cotización cobraba bancaria en cada proveedor RMB. El servidor ya agrupaba. | `CotizacionForm.vue` agrupa en pantalla: la lleva el primero y el resto dice «Incluida en el Proveedor N». |
| 01:35 | Formularios | Inputs sueltos en depósito, yuanes, ejecución USD, diferencia de cambio y formulario T-T. | Pasaron a `UFormField`, `UInput`, `USelect`, `UTextarea` y `UCheckbox`. El archivo adjunto sigue en input de archivo. |

### Pasada 3 — E2E con todos los roles (5/11/2026)

Entorno: API local en `:8001` y base `127.0.0.1`, intranet en `:3100` con Chrome real. Roles: Cotizador (Ventas), Administración y ContenedorAlmacen (China), más el cliente en el enlace T-T. Clientes de prueba `CO10261610` y `CO10261611`. Sin envío real por WhatsApp.

Resultado final de esta pasada:

| Suite | Resultado |
| --- | --- |
| Reglas y estados por API | 124/124 |
| Plazos, mensajes, configuración y China por API | 48/48 |
| Recorrido en pantalla con los tres roles y el cliente | 35/35 |
| PHPStan sobre los PHP del módulo | sin errores |
| PDF de resumen y de balance | texto leído, sin código interno |

No se pudo correr PHPUnit: pide PHP 8.3 y este equipo tiene 8.2. Se ajustaron dos pruebas de mensajes y sus aserciones se comprobaron aparte con un script. `vue-tsc` deja 10 errores de tipos en el módulo, sin efecto al ejecutar; se detallan en Pendientes.

Bugs corregidos:

| Regla | Qué pasaba | Archivo |
| --- | --- | --- |
| VW-27, VW-20 | Abrir el pago en yuanes rompía toda la pantalla de China, y «Otro motivo» rompía la de Verificación: el selector tenía una opción con valor vacío. | `SupplierPaymentYuan.vue`, `DepositReviewModal.vue` |
| CA-06 | Con Redis, cambiar tolerancia, plazos, tarifas o aprobación automática no surtía efecto por 6 horas: la caché se guardaba con etiquetas y se borraba sin ellas. | `PagoProveedorCacheService.php` |
| RN-21, CP-13 | La vigencia se guardaba con la hora de Lima en una app en UTC: vencía 5 horas antes y podía caer en domingo. | `PagoProveedorVigenciaService.php` |
| RN-56, CS-29 | Ventas no podía corregir un depósito observado en etapa 2. | `PagoProveedorEtapa1Service.php`, `AbonoResource.php`, `solicitudes/[id].vue` |
| ES-02 | Un depósito observado no dejaba al proveedor en Observado. | `PagoProveedorVerificacionService.php` |
| RN-62 | Si el banco recibía menos en un abono parcial, el saldo no bajaba al importe real. | `PagoProveedorEtapa1Service.php` |
| RN-124, CP-58 | El reembolso del pago 2 no devolvía la 2.ª administrativa ($500 en vez de $530). | `PagoProveedorConfirmacionService.php`, `PagoProveedorReembolsoService.php` |
| RN-35, CS-37 | Al anular el proveedor que llevaba la bancaria, esta no pasaba al siguiente. | `PagoProveedorEtapa1Service.php` |
| RN-72, CP-38 | «Por cobrar» vencido no volvía a Pendiente al consultarlo. | `PagoProveedorAprobacionService.php`, `PagoProveedorEtapa1Service.php` |
| RN-97 | Las solicitudes manuales de China aparecían en las listas de Ventas. | `PagoProveedorSolicitudService.php`, `PagoProveedorCotizacionService.php` |
| VW-08 | «Enviar resumen» fallaba en toda solicitud creada. | `PagoProveedorCotizacionWhatsappService.php` |
| VW-12, RN-72 | En «Por cobrar», Ventas no tenía botón para registrar el voucher de la diferencia. | `solicitudes/[id].vue` |
| Maqueta | Rechazar un reembolso lo cerraba. Ahora vuelve a Ventas para consultar al cliente. | `PagoProveedorReembolsoService.php` |
| Anexo B | Los WhatsApp de resumen, pedir datos, cuentas, aviso y balance no seguían el texto de la maqueta. | `PagoProveedorMensajeService.php`, `PagoProveedorEtapa1Service.php` |
| Socios | Faltaban Javiandy / ECU-DAV y «Pro Business - PE». El socio de la solicitud manual era texto libre. | `PagoProveedorSolicitud.php`, `SupplierPaymentYuan.vue` |
| Errores | Las pantallas decían «No se pudo completar la operación» y ocultaban el motivo real del servidor. | 8 componentes del módulo |
| VW-11 | Un error de validación borraba el formulario que el cliente ya había llenado; el tipo de código arrancaba vacío. | `formulario-tt/[token].vue`, `FormularioBancario.vue` |
| VW-24 | Hacer clic fuera cerraba la ventana y se perdía la constancia adjunta. | `SupplierPaymentWindow.vue` |
| VW-05 | La vista previa de WhatsApp quedaba al final de la página y sin negritas. Ahora abre en ventana. | `solicitudes/[id].vue`, `whatsappFormat.ts` |
| VW-14 | Mostraba las etapas 2, 3 y 4 juntas. Ahora solo la etapa elegida; se agregó el resumen de la operación y la proforma. | `SupplierPaymentProgress.vue` |
| VW-15 | «Enviar balance» no mostraba el mensaje antes de enviarlo. | `PagoProveedorConfirmacionService.php`, `SupplierPaymentProgress.vue` |
| VW-16 | El voucher no proponía el importe de la diferencia. | `SupplierPaymentProgress.vue` |
| VW-21, VW-23 | «Acciones» quedaba fuera de pantalla a 1440 px; tipo de pago mostraba `tt`. | `DataTable.vue`, `SupplierPaymentExecutions.vue` |
| RN-42 | Los datos T-T recibidos figuraban como faltantes por comparar contra un estado que no existe. | `solicitudes/[id].vue`, `SupplierPaymentProgress.vue` |
| Tema | Títulos ilegibles en modo oscuro y colores sueltos. 74 clases pasaron a colores del tema; formularios a componentes de Nuxt UI. | Módulo |
| General | `DynamicModal` fallaba con modal nulo en Verificación. | `DynamicModal.vue` |

### Pasada 4 — estados de la solicitud tras cada acción de Administración (6/11/2026)

Sobre `qa` con los commits nuevos (`e75d8453` y `6279305`). Se abrió la maqueta en el navegador y se comparó su código de render con las pantallas. El T-T se probó en `probusiness-clientes-front` (`origin/qa`, puerto 3001), donde ahora vive esa página.

| Suite | Resultado |
| --- | --- |
| Reglas y estados por API | 124/124 |
| Plazos, mensajes, configuración y China por API | 48/48 |
| Recorrido en pantalla con los tres roles y el cliente | 35/35 y 5/5 |
| Matriz de estados en pantalla | 49/49 (primera corrida: 6/28) |
| PHPStan del módulo | sin errores |

Qué ve la solicitud según lo que hizo Administración:

| ID | Acción | Lo que ve Ventas | Evidencia |
| --- | --- | --- | --- |
| ST-01 | Nada todavía | `Por validar · quedan…`, aprobación `Pendiente`, «En manos de Administración» | [st01-por-validar](pago-proveedor-validacion/st01-por-validar.png) |
| ST-02 | Validar importe exacto | `✓ Validado`, importe del banco, `✓ Aprobado automáticamente`, «Sin diferencias ni devoluciones» | [st02-validado-automatico](pago-proveedor-validacion/st02-validado-automatico.png) · [st02b-validado-admin](pago-proveedor-validacion/st02b-validado-admin.png) · [st02c-paso3-ventas](pago-proveedor-validacion/st02c-paso3-ventas.png) |
| ST-03 | Banco menor, dentro de tolerancia | `✎ Modificado`, «Importe: $a → $b», «Registraste $a», la asume Pro Business | [st03-ajuste-tolerancia](pago-proveedor-validacion/st03-ajuste-tolerancia.png) |
| ST-04 | Observar depósito | Proveedor `Observado`, `Observado · motivo`, aprobación `En espera`, Por realizar | [st04-observado](pago-proveedor-validacion/st04-observado.png) · [st04b-observado-mis-pendientes](pago-proveedor-validacion/st04b-observado-mis-pendientes.png) |
| ST-05 | Banco menor, fuera de tolerancia | «Hay una diferencia de $5.00: Administración decide» | [st05-pendiente-decision](pago-proveedor-validacion/st05-pendiente-decision.png) · [st05b-por-aprobar](pago-proveedor-validacion/st05b-por-aprobar.png) |
| ST-06 | Por cobrar | `Observado · Por cobrar $5.00`, plazo, voucher de la diferencia, Por realizar; luego `Por validar` y aprobado | [st06-por-cobrar](pago-proveedor-validacion/st06-por-cobrar.png) · [st06b-por-cobrar-admin](pago-proveedor-validacion/st06b-por-cobrar-admin.png) · [st06c-diferencia-por-validar](pago-proveedor-validacion/st06c-diferencia-por-validar.png) · [st06d-cobrada](pago-proveedor-validacion/st06d-cobrada.png) |
| ST-07 | Aprobar asumiendo | `✓ Aprobado por Administración`, «Asumió una diferencia de $5.00 (motivo)»; sale en Aprobados | [st07a-aprobar-con-motivo](pago-proveedor-validacion/st07a-aprobar-con-motivo.png) · [st07-aprobado-admin](pago-proveedor-validacion/st07-aprobado-admin.png) · [st07b-aprobados](pago-proveedor-validacion/st07b-aprobados.png) |
| ST-08 | Error de registro | `Observado · Error de registro`, qué corregir, Levantar observación; vuelve a En proceso | [st08a-error-registro-admin](pago-proveedor-validacion/st08a-error-registro-admin.png) · [st08-error-registro](pago-proveedor-validacion/st08-error-registro.png) · [st08b-levantada](pago-proveedor-validacion/st08b-levantada.png) |
| ST-09 | Corregir datos del depósito | `✎ Modificado`, «N.° de operación: a → b» | [st09a-corregido-por-validar](pago-proveedor-validacion/st09a-corregido-por-validar.png) · [st09-corregido](pago-proveedor-validacion/st09-corregido.png) |
| ST-10 | Sobrante y reembolso | Sobrante, Solicitar reembolso, solicitado, rechazado con motivo, aprobado con comprobante | [st10-sobrante-pendiente](pago-proveedor-validacion/st10-sobrante-pendiente.png) · [st10b-sobrante-aprobado](pago-proveedor-validacion/st10b-sobrante-aprobado.png) · [st10c-reembolso-solicitado](pago-proveedor-validacion/st10c-reembolso-solicitado.png) · [st10e-ventana-reembolso](pago-proveedor-validacion/st10e-ventana-reembolso.png) · [st10f-reembolso-rechazado](pago-proveedor-validacion/st10f-reembolso-rechazado.png) · [st10g-reembolso-aprobado](pago-proveedor-validacion/st10g-reembolso-aprobado.png) |
| ST-11 | Deshacer | Vuelve a `Por validar`, sin marcas de validado | [st11a-deshacer](pago-proveedor-validacion/st11a-deshacer.png) · [st11-deshecho](pago-proveedor-validacion/st11-deshecho.png) |
| ST-12 | Validar sin datos del proveedor | Sigue en paso 1 y pide completar datos | [st12-validado-sin-datos](pago-proveedor-validacion/st12-validado-sin-datos.png) |
| ST-13/14 | Pago ejecutado | Paso 3 pendiente y revisado; yuanes «no se envía al cliente», dólares «enviada por WhatsApp» | [st13-paso3-revisado-yuanes](pago-proveedor-validacion/st13-paso3-revisado-yuanes.png) · [st14-paso3-usd-pendiente](pago-proveedor-validacion/st14-paso3-usd-pendiente.png) · [st14b-paso3-usd-pagado](pago-proveedor-validacion/st14b-paso3-usd-pagado.png) |
| ST-16 a 20 | Confirmación | Tolerancia, por cobrar, a favor, cuota 2 y pago 2 según VW-14 | [st16-confirmacion-tolerancia](pago-proveedor-validacion/st16-confirmacion-tolerancia.png) · [st17-confirmacion-por-cobrar](pago-proveedor-validacion/st17-confirmacion-por-cobrar.png) · [st18-confirmacion-a-favor](pago-proveedor-validacion/st18-confirmacion-a-favor.png) · [st18b-reembolso-solicitado](pago-proveedor-validacion/st18b-reembolso-solicitado.png) · [st19-confirmacion-cuota-2](pago-proveedor-validacion/st19-confirmacion-cuota-2.png) · [st20-confirmacion-pago-2](pago-proveedor-validacion/st20-confirmacion-pago-2.png) |
| ST-21 | Voucher compartido con faltante | `Espera tu decisión`, Elegir proveedores; el elegido continúa | [st21-voucher-compartido](pago-proveedor-validacion/st21-voucher-compartido.png) · [st21b-elegir-proveedores](pago-proveedor-validacion/st21b-elegir-proveedores.png) · [st21c-eleccion-guardada](pago-proveedor-validacion/st21c-eleccion-guardada.png) |
| ST-22 | Error de registro vencido y anular | Extender o anular; proveedor `Anulado` | [st22a-observacion-vencida](pago-proveedor-validacion/st22a-observacion-vencida.png) · [st22-anulado](pago-proveedor-validacion/st22-anulado.png) |
| ST-23 | Cuota 2 a 2 días (RN-18) | «Compromiso del cliente: fecha · vence en 2 días» sin tapar la tarea real | [st23-aviso-cuota-2](pago-proveedor-validacion/st23-aviso-cuota-2.png) |
| ST-24 | T-T por autorizar | Borrador de Ventas, cliente revisa bloqueado, autoriza, Recibido | [st24b-por-autorizar](pago-proveedor-validacion/st24b-por-autorizar.png) · [st24c-enlace-autorizacion](pago-proveedor-validacion/st24c-enlace-autorizacion.png) · [st24d-cliente-revisa](pago-proveedor-validacion/st24d-cliente-revisa.png) · [st24f-cliente-autorizo](pago-proveedor-validacion/st24f-cliente-autorizo.png) · [st24g-recibido-ventas](pago-proveedor-validacion/st24g-recibido-ventas.png) |

Bugs corregidos:

| Regla | Qué pasaba | Archivo |
| --- | --- | --- |
| VW-14, ES-63 | Las filas de decisión se montaban: al pulsar «Se realizará» el clic caía en «No se realizará» y la cuota se cerraba. | `SupplierPaymentProgress.vue` |
| VW-12 | El paso 2 no reflejaba a Administración: textos genéricos, sin banco, quién aprobó, cambios ni plazos. | `SupplierPaymentProgress.vue`, `solicitudes/[id].vue`, `PagoProveedorConfirmacionService.php` |
| VW-09 | Administración no podía abrir la solicitud («No tienes permiso»), aunque la pantalla tenía modo de solo lectura. China sigue sin acceso (RN-98). | `PagoProveedorAutorizacion.php`, `PagoProveedorSolicitudController.php` |
| ES-02 | Al abrir Por aprobar, el error de registro volvía solo a Pendiente y Ventas no podía levantarlo ni corregir el voucher. Ahora guarda qué corregir. | `PagoProveedorAprobacionService.php`, `PagoProveedorEtapa1Service.php`, `AbonoResource.php`, migración |
| RN-120, RN-123 | El reembolso del excedente se pedía solo, incluso antes de validar el depósito. Ahora lo solicita Ventas. | `PagoProveedorReembolsoService.php`, `PagoProveedorAprobacionService.php`, `PagoProveedorEtapa1Service.php` |
| VW-12 | Las correcciones de Administración no guardaban el dato anterior. | `PagoProveedorVerificacionService.php`, migración |
| VW-21 | Aprobados podía mostrar pagos pendientes por una respuesta tardía. Los reembolsos salían sin código, como `Pendiente` y sin filtro. | `SupplierPaymentApprovals.vue` |
| VW-22, VW-24 | Montos sin `$` en las ventanas de aprobación y de ejecución en dólares. | `ApprovalReviewModal.vue`, `UsdExecutionModal.vue` |
| VW-13 | Paso 3 sin franja «En manos de… desde», comprobante y balance pendientes, ver formulario T-T ni aviso sobre la constancia. El importe pagado usa el yuan real. | `SupplierPaymentProgress.vue`, `PagoProveedorConfirmacionService.php` |
| VW-13, ES-51 | La observación de China no se veía ni se levantaba en el paso 3. | `SupplierPaymentProgress.vue`, `solicitudes/[id].vue` |
| VW-14 | Confirmación sin monto por cuota, excedente, documentos, estados de balance y diferencia, ni pago 2 con yuanes. Quedaba `1 pendiente` en un proveedor Completado. | `SupplierPaymentProgress.vue`, `PagoProveedorConfirmacionService.php` |
| FL-13 | «Elegir proveedores» estaba en casillas sueltas de la tabla; ahora tiene su botón y ventana. | `SupplierPaymentProgress.vue`, `solicitudes/[id].vue` |
| RN-42 | «Enviar al cliente para autorización» siempre fallaba con datos Por autorizar. | `PagoProveedorEtapa1Service.php` |
| RN-18 | El aviso de la cuota 2 tapaba la tarea real, mostraba la fecha sin formato y marcaba `Cuota 2/2` estando en la 1. | `PagoProveedorSolicitudProveedor.php`, `SolicitudProveedorResource.php`, `solicitudes/index.vue` |
| VW-27 | La tabla de yuanes mezclaba inglés y español para China. Ahora va en español solo en esa tabla; el menú sigue en inglés. | `DataTable.vue`, `SupplierPaymentYuan.vue` |

Columnas de las 8 bandejas comparadas contra la maqueta en el navegador: coinciden.

### Pasada 5 — vista final de China (maqueta `Intranet Pro Business`, 6/11/2026)

La maqueta nueva cambia el modelo de China: la lista agrupa por solicitud, con varios proveedores y el dinero recibido del socio. Si la maqueta y el PDF difieren, manda la maqueta.

Tablas: `pago_proveedor_ingresos` es nueva. `pago_proveedor_solicitudes` suma `country` y `request_date`; `pago_proveedor_solicitud_proveedores` suma `client_name`; en `pago_proveedor_ejecuciones` la constancia pasa a opcional. Una segunda migración crea el ingreso de los pagos ya registrados, para que no salgan como por cobrar.

| ID | Qué se probó | Evidencia |
| --- | --- | --- |
| VW-27 | Indicadores, estados, 12 columnas iguales a la maqueta, filtros y búsqueda | [ch01-lista](pago-proveedor-validacion/ch01-lista.png) · [ch04-creada](pago-proveedor-validacion/ch04-creada.png) · [ch15-filtro-observado](pago-proveedor-validacion/ch15-filtro-observado.png) |
| VW-31 | Nueva solicitud y edición con varios proveedores, USD y RMB enlazados | [ch02-nueva-solicitud](pago-proveedor-validacion/ch02-nueva-solicitud.png) · [ch03-formulario-lleno](pago-proveedor-validacion/ch03-formulario-lleno.png) · [ch12-editar](pago-proveedor-validacion/ch12-editar.png) · [ch13-editada](pago-proveedor-validacion/ch13-editada.png) |
| VW-28 | Gestionar: ingreso, pago, deshacer y balance | [ch05-gestionar](pago-proveedor-validacion/ch05-gestionar.png) · [ch06-ingreso](pago-proveedor-validacion/ch06-ingreso.png) · [ch07-ingreso-guardado](pago-proveedor-validacion/ch07-ingreso-guardado.png) · [ch10-registrar-pago](pago-proveedor-validacion/ch10-registrar-pago.png) · [ch11-pagado](pago-proveedor-validacion/ch11-pagado.png) · [ch14-todos-pagados](pago-proveedor-validacion/ch14-todos-pagados.png) |
| VW-29 | Observar con texto libre; los demás proveedores siguen | [ch08-observar](pago-proveedor-validacion/ch08-observar.png) · [ch09-observado](pago-proveedor-validacion/ch09-observado.png) |
| VW-30 | Perú: ingreso, constancia y aviso antes de confirmar; llega a Ventas | [ch16-peru](pago-proveedor-validacion/ch16-peru.png) · [ch17-peru-pago](pago-proveedor-validacion/ch17-peru-pago.png) · [ch18-peru-listo](pago-proveedor-validacion/ch18-peru-listo.png) · [ch19-peru-pagado](pago-proveedor-validacion/ch19-peru-pagado.png) · [ch20-peru-deshacer](pago-proveedor-validacion/ch20-peru-deshacer.png) |
| — | Móvil y modo oscuro | [ch21-movil](pago-proveedor-validacion/ch21-movil.png) · [ch22-oscuro](pago-proveedor-validacion/ch22-oscuro.png) |

Decisiones donde la maqueta no alcanza:

- Solo las solicitudes manuales se editan. Las de Perú las corrige Ventas (RN-98).
- En Perú el ingreso, la constancia y el aviso son obligatorios: el T.C. real sale del ingreso (promedio de lo recibido) y Ventas usa la constancia. En las manuales el voucher es opcional, como en la maqueta.
- «Deshacer pago» se bloquea en Perú cuando Ventas ya envió el balance, recibió el voucher de la diferencia o decidió la cuota o el pago 2.
- Se mantiene «Nueva solicitud» por RN-97, aunque la maqueta no muestra el botón.
- Quien registra en Perú el dinero enviado a China no está definido en el PDF. Queda en China, como en la maqueta.

Bugs encontrados al probar: la tabla ancha se cortaba por la izquierda (`DataTable.vue`, `safe center`) y un aviso de éxito cerraba la ventana lateral.

Socios desde `organizacion`: el modal de China ya no pide país. Elige un socio de `organizacion` (nunca la organización 1) y «Nuevo socio» crea una fila ahí, con nombre y país. Los pagos de Perú solo llegan por Ventas, en yuanes y ya aprobados. [ch02b-nuevo-socio](pago-proveedor-validacion/ch02b-nuevo-socio.png)

Un socio creado así no tiene usuarios ni menús; eso lo hace el comando `organizacion:crear`. De momento China no tiene el botón «Nueva solicitud»: solo edita las solicitudes manuales que ya existen.

Pendiente: `PortalSocio`, la vista del socio que también trae la maqueta, se hará más adelante.

## Flujos

| ID | Qué cubre | Estado | Evidencia |
| --- | --- | --- | --- |
| FL-01 | Cotización a solicitud | ok | Creada por pantalla. Vencida, renovar y tramos por API. [vw01-ventas-cotizaciones](pago-proveedor-validacion/vw01-ventas-cotizaciones.png) · [vw02-nueva-cotizacion](pago-proveedor-validacion/vw02-nueva-cotizacion.png) · [vw03b-formulario-completo](pago-proveedor-validacion/vw03b-formulario-completo.png) |
| FL-02 | Etapa 1, datos y comprobante | ok | RMB y T-T por pantalla. Anular abono por API. [vw10b-comprobante-completo](pago-proveedor-validacion/vw10b-comprobante-completo.png) · [vw11-formulario-tt-cliente](pago-proveedor-validacion/vw11-formulario-tt-cliente.png) |
| FL-03 | Verificar depósito | ok | Validar, observar y banco menor por pantalla. Corregir digitación y deshacer por API. [vw19-validar-deposito](pago-proveedor-validacion/vw19-validar-deposito.png) · [vw20-observar-deposito](pago-proveedor-validacion/vw20-observar-deposito.png) · [cp30-banco-recibe-menos](pago-proveedor-validacion/cp30-banco-recibe-menos.png) |
| FL-04 | Aprobación | ok | Motivo obligatorio y Por cobrar por pantalla. Límites y casilla por API. [vw22-aprobacion-del-pago](pago-proveedor-validacion/vw22-aprobacion-del-pago.png) · [cp36-sin-motivo](pago-proveedor-validacion/cp36-sin-motivo.png) · [cp37-por-cobrar-ventas](pago-proveedor-validacion/cp37-por-cobrar-ventas.png) |
| FL-05 | Ejecución en dólares | ok | De punta a punta por pantalla, con aviso en vista previa. [vw24a-ejecucion-usd](pago-proveedor-validacion/vw24a-ejecucion-usd.png) · [vw24b-ejecucion-aviso](pago-proveedor-validacion/vw24b-ejecucion-aviso.png) · [vw23b-pagados](pago-proveedor-validacion/vw23b-pagados.png) |
| FL-06 | Ejecución en yuanes | ok | [vw28-pago-en-yuanes](pago-proveedor-validacion/vw28-pago-en-yuanes.png) · [vw29-observar-pago](pago-proveedor-validacion/vw29-observar-pago.png) · [cp50-observacion-china](pago-proveedor-validacion/cp50-observacion-china.png) |
| FL-07 | Confirmación y cierre | ok | [vw14-confirmacion-completada](pago-proveedor-validacion/vw14-confirmacion-completada.png) · [cp64-revision-paso-3](pago-proveedor-validacion/cp64-revision-paso-3.png) |
| FL-08 | Diferencia de cambio | ok | A cobrar, a favor y tolerancia, con vista previa del balance. [vw15a-balance-vista-previa](pago-proveedor-validacion/vw15a-balance-vista-previa.png) · [vw14b-confirmacion-por-cobrar](pago-proveedor-validacion/vw14b-confirmacion-por-cobrar.png) · [vw16-voucher-diferencia](pago-proveedor-validacion/vw16-voucher-diferencia.png) · [vw14c-confirmacion-a-favor](pago-proveedor-validacion/vw14c-confirmacion-a-favor.png) |
| FL-09 | Cuotas | ok | Se realizará por pantalla; no se realizará por API. [vw14e-cuota-2-por-decidir](pago-proveedor-validacion/vw14e-cuota-2-por-decidir.png) · [cp59-cuota-2-tipo-de-cambio](pago-proveedor-validacion/cp59-cuota-2-tipo-de-cambio.png) · [cp59b-cuota-2-etapa-1](pago-proveedor-validacion/cp59b-cuota-2-etapa-1.png) |
| FL-10 | Dos pagos al proveedor | ok | No se realizará por pantalla; se realizará y pago 2 por API. [vw14d-pago-2-por-decidir](pago-proveedor-validacion/vw14d-pago-2-por-decidir.png) · [vw17-pago-2-no-se-realizara](pago-proveedor-validacion/vw17-pago-2-no-se-realizara.png) |
| FL-11 | Excedentes y reembolsos | ok | Reembolso por pantalla; excedentes por API. [vw25-reembolso-solicitado](pago-proveedor-validacion/vw25-reembolso-solicitado.png) · [vw25b-aprobar-reembolso](pago-proveedor-validacion/vw25b-aprobar-reembolso.png) |
| FL-12 | Observaciones y plazos | ok-api | Plazos movidos en la base local. El aviso a jefatura queda solo en historial (PV-11). |
| FL-13 | Voucher compartido | ok | Elegir proveedores por pantalla. [st21-voucher-compartido](pago-proveedor-validacion/st21-voucher-compartido.png) · [st21b-elegir-proveedores](pago-proveedor-validacion/st21b-elegir-proveedores.png) · [st21c-eleccion-guardada](pago-proveedor-validacion/st21c-eleccion-guardada.png) |
| FL-14 | Solicitud manual de China | ok | [vw31-nueva-solicitud-manual](pago-proveedor-validacion/vw31-nueva-solicitud-manual.png) · [cp51-manual-sin-codigo](pago-proveedor-validacion/cp51-manual-sin-codigo.png) · [vw31b-manual-creada](pago-proveedor-validacion/vw31b-manual-creada.png) · [cp52-manual-sin-aviso](pago-proveedor-validacion/cp52-manual-sin-aviso.png) |
| FL-15 | Anulaciones | ok-api | Abono, proveedor y pago vencido por API. |

## Casos de prueba

| ID | Esperado en una línea | Estado | Nota |
| --- | --- | --- | --- |
| CP-01 | Nueva cotización carga cliente bloqueado y 1 proveedor | ok | [vw03-formulario-inicial](pago-proveedor-validacion/vw03-formulario-inicial.png) |
| CP-02 | N.° inexistente no deja aceptar | ok | [cp02-numero-inexistente](pago-proveedor-validacion/cp02-numero-inexistente.png) |
| CP-03 | N.° ya usado avisa y deja continuar | ok-api |  |
| CP-04 | Otra cotización nueva nace limpia | ok-api |  |
| CP-05 | Tramos USD 100 / 120 / 120 / 150 | ok-api | 100, 120, 120, 150. |
| CP-06 | Tramos RMB 50 / 90 / 90 / 120 | ok-api | 50, 90, 90, 120. |
| CP-07 | Bancaria solo en el primer RMB | ok-api |  |
| CP-08 | Al quitar el primero, la bancaria pasa al siguiente | ok-api |  |
| CP-09 | Administrativa ×2 y bancaria una vez | ok-api | Administrativa $60. |
| CP-10 | Cuotas: total a pagar ahora = cuota 1 | ok-api |  |
| CP-11 | USD fraccionado bloquea el pago al proveedor en 2 cuotas | ok-api |  |
| CP-12 | Sin T.C. no hay PDF ni resumen | ok-api |  |
| CP-13 | Vigencia salta sábado y domingo | ok-api | Corregido el desfase de 5 h. |
| CP-14 | Vencida bloquea enviar y ofrece Renovar | ok-api |  |
| CP-15 | Renovar conserva el N.° y no reenvía sola | ok-api |  |
| CP-16 | Sin proforma no crea solicitud | ok-api |  |
| CP-17 | Crear solicitud confirma la cotización y deja etapa 1 | ok | [cs01-1-solicitud-creada](pago-proveedor-validacion/cs01-1-solicitud-creada.png) |
| CP-18 | Pedir datos RMB y enlace T-T | ok | [vw05a-pedir-datos-preview](pago-proveedor-validacion/vw05a-pedir-datos-preview.png) |
| CP-19 | WeChat con letras no se guarda | ok | [cp19-wechat-invalido](pago-proveedor-validacion/cp19-wechat-invalido.png) |
| CP-20 | Cliente autoriza el formulario T-T | ok | [vw11c-formulario-enviado](pago-proveedor-validacion/vw11c-formulario-enviado.png) |
| CP-21 | Llenado por Ventas queda Por autorizar | ok-api | Pantalla abierta: [vw11b-tt-llenado-por-ventas](pago-proveedor-validacion/vw11b-tt-llenado-por-ventas.png) |
| CP-22 | SWIFT de 7 caracteres falla | ok | [cp22-swift-invalido](pago-proveedor-validacion/cp22-swift-invalido.png) |
| CP-23 | Comprobante queda en validación y en Verificación | ok | [vw18-verificacion](pago-proveedor-validacion/vw18-verificacion.png) |
| CP-24 | Registrar sin aplicar proveedores queda deshabilitado | ok | [vw10a-comprobante-vacio](pago-proveedor-validacion/vw10a-comprobante-vacio.png) |
| CP-25 | N.° de operación repetido avisa y deja registrar | ok-api |  |
| CP-26 | Etapa 2 y código solo con datos e importe completos | ok-api |  |
| CP-27 | No se anula un abono ya validado | ok-api |  |
| CP-28 | Abono mayor muestra Excedente | ok-api |  |
| CP-29 | Validar exacto y aprobar solo si no hay diferencia | ok |  |
| CP-30 | Banco recibe menos: ajusta y, si pasa de $1, va a Por aprobar | ok | [cp30-banco-recibe-menos](pago-proveedor-validacion/cp30-banco-recibe-menos.png) |
| CP-31 | Corregir N.° de operación no valida | ok-api |  |
| CP-32 | Observar «No ingresó» | ok | [vw20-observar-deposito](pago-proveedor-validacion/vw20-observar-deposito.png) · [cs29-observado-ventas](pago-proveedor-validacion/cs29-observado-ventas.png) |
| CP-33 | Deshacer a los 3 min, 10 h y 30 h | ok-api | 3 min, 10 h y 30 h con fechas movidas. |
| CP-34 | Alerta si pasan 2 h sin validar | ok-api | Fecha movida. |
| CP-35 | Faltante de $0.60 se asume y aprueba solo | ok-api |  |
| CP-36 | Asumir $5 exige motivo | ok | [cp36-sin-motivo](pago-proveedor-validacion/cp36-sin-motivo.png) |
| CP-37 | Por cobrar, voucher y nueva aprobación | ok | [cp37-por-cobrar-ventas](pago-proveedor-validacion/cp37-por-cobrar-ventas.png) |
| CP-38 | Por cobrar a los 7 días vuelve a Pendiente | ok-api | Fecha movida. |
| CP-39 | Observación a los 7 días avisa y permite extender o anular | ok-api | Fecha movida. Aviso a jefatura solo en historial (PV-11). |
| CP-40 | Con aprobación automática apagada va a Por aprobar | ok-api |  |
| CP-41 | Ejecución USD completa y cierra si no hay pendientes | ok | [vw24b-ejecucion-aviso](pago-proveedor-validacion/vw24b-ejecucion-aviso.png) |
| CP-42 | Registrar USD sin aviso queda deshabilitado | ok | Deshabilitado sin aviso. |
| CP-43 | Ganancia negativa en rojo | ok | Cobrada 120, real 150, administrativa 30: ganancia $0. |
| CP-44 | No existe paso ni campo SWIFT | ok-api |  |
| CP-45 | China no lista un pago de Perú sin proforma | ok-api | Sin proforma no nace la solicitud. |
| CP-46 | RMB en tolerancia: pagado y completado; balance no aplica | ok | [vw14-confirmacion-completada](pago-proveedor-validacion/vw14-confirmacion-completada.png) |
| CP-47 | T.C. real menor: diferencia por cobrar | ok | [vw14b-confirmacion-por-cobrar](pago-proveedor-validacion/vw14b-confirmacion-por-cobrar.png) |
| CP-48 | Sobran yuanes: balance a devolver y reembolso | ok | [vw14c-confirmacion-a-favor](pago-proveedor-validacion/vw14c-confirmacion-a-favor.png) |
| CP-49 | Aviso de yuanes sin importe, sin adjunto y sin código | ok | [vw28-pago-en-yuanes](pago-proveedor-validacion/vw28-pago-en-yuanes.png) |
| CP-50 | China observa y Ventas levanta | ok | [cp50-observacion-china](pago-proveedor-validacion/cp50-observacion-china.png) |
| CP-51 | Solicitud manual exige código o nombre | ok | [cp51-manual-sin-codigo](pago-proveedor-validacion/cp51-manual-sin-codigo.png) |
| CP-52 | La manual no avisa a Ventas ni al cliente | ok | [cp52-manual-sin-aviso](pago-proveedor-validacion/cp52-manual-sin-aviso.png) |
| CP-53 | China no edita datos cargados por Ventas | ok-api |  |
| CP-54 | Balance sin diferencia no se envía; sí se descarga | ok-api | La pantalla no ofrece enviar. |
| CP-55 | Balance de 2 pagos con detalle y total | ok-api | PDF leído: pago 1, pago 2 y total; `Balance_ROVI21-1.pdf`. |
| CP-56 | Etapa 4 con pago 2 por decidir | ok | [vw14d-pago-2-por-decidir](pago-proveedor-validacion/vw14d-pago-2-por-decidir.png) |
| CP-57 | «Se realizará» vuelve a etapa 3 | ok-api |  |
| CP-58 | «No se realizará» arma el reembolso del pago 2 | ok | $530. [vw17-pago-2-no-se-realizara](pago-proveedor-validacion/vw17-pago-2-no-se-realizara.png) |
| CP-59 | Cuota 2 se realizará: vuelve a etapa 1, mismo código, T.C. nuevo | ok | [cp59b-cuota-2-etapa-1](pago-proveedor-validacion/cp59b-cuota-2-etapa-1.png) |
| CP-60 | Cuota 2 no se realizará: completa sin cobrarla | ok-api |  |
| CP-61 | Un reembolso abierto impide completar | ok-api |  |
| CP-62 | Mis pendientes no muestra lo que espera otra área | ok | [cp62-mis-pendientes](pago-proveedor-validacion/cp62-mis-pendientes.png) |
| CP-63 | Reembolso sin banco o sin foto no se aprueba | ok | Sin foto por API; aprobar por pantalla. [vw25b-aprobar-reembolso](pago-proveedor-validacion/vw25b-aprobar-reembolso.png) |
| CP-64 | Ver un paso anterior en lectura y volver | ok | [cp64-revision-paso-3](pago-proveedor-validacion/cp64-revision-paso-3.png) |
| CP-65 | Sin nombre, el código es el título | ok-api | También visto en las capturas. |
| CP-66 | El cliente no ve el código de solicitud | ok-api | Mensajes y 3 PDF sin código interno. |
| CP-67 | Completado sigue mostrando constancias | ok | [vw14-confirmacion-completada](pago-proveedor-validacion/vw14-confirmacion-completada.png) |
| CP-68 | Ventas no entra a Aprobación | ok | Por pantalla y API, en los 3 roles. |

## Vistas

| ID | Vista | Estado | Evidencia |
| --- | --- | --- | --- |
| VW-01 | Lista de cotizaciones | ok | [vw01-ventas-cotizaciones](pago-proveedor-validacion/vw01-ventas-cotizaciones.png) · [vw01b-vigencia](pago-proveedor-validacion/vw01b-vigencia.png) |
| VW-02 | Nueva cotización | ok | [vw02-nueva-cotizacion](pago-proveedor-validacion/vw02-nueva-cotizacion.png) · [cp02-numero-inexistente](pago-proveedor-validacion/cp02-numero-inexistente.png) |
| VW-03 | Formulario | ok | [vw03-formulario-inicial](pago-proveedor-validacion/vw03-formulario-inicial.png) · [vw03b-formulario-completo](pago-proveedor-validacion/vw03b-formulario-completo.png) |
| VW-04 | PDF resumen | parcial | PDF generado y texto leído. No se comparó el diseño hoja por hoja con la maqueta. |
| VW-05 | Vista previa WhatsApp de Ventas | ok | [vw05a-pedir-datos-preview](pago-proveedor-validacion/vw05a-pedir-datos-preview.png) · [vw05b-cuentas-bancarias](pago-proveedor-validacion/vw05b-cuentas-bancarias.png) · [vw05c-resumen](pago-proveedor-validacion/vw05c-resumen.png) |
| VW-06 | Mis pendientes | ok | [cp62-mis-pendientes](pago-proveedor-validacion/cp62-mis-pendientes.png) |
| VW-07 | Todas las solicitudes | ok | [vw07-todas-las-solicitudes](pago-proveedor-validacion/vw07-todas-las-solicitudes.png) |
| VW-08 | Detalle | ok | [cs01-1-solicitud-creada](pago-proveedor-validacion/cs01-1-solicitud-creada.png) |
| VW-09 | Paso 1 | ok | [vw09b-paso1-tt](pago-proveedor-validacion/vw09b-paso1-tt.png) |
| VW-10 | Registrar comprobante | ok | [vw10a-comprobante-vacio](pago-proveedor-validacion/vw10a-comprobante-vacio.png) · [vw10b-comprobante-completo](pago-proveedor-validacion/vw10b-comprobante-completo.png) |
| VW-11 | Formulario T-T | ok | [vw11-formulario-tt-cliente](pago-proveedor-validacion/vw11-formulario-tt-cliente.png) · [vw11b-tt-llenado-por-ventas](pago-proveedor-validacion/vw11b-tt-llenado-por-ventas.png) · [vw11c-formulario-enviado](pago-proveedor-validacion/vw11c-formulario-enviado.png) |
| VW-12 | Paso 2 visto por Ventas | ok | [vw12-paso2-visto-por-ventas](pago-proveedor-validacion/vw12-paso2-visto-por-ventas.png) |
| VW-13 | Paso 3 visto por Ventas | ok | [vw13-paso3-visto-por-ventas](pago-proveedor-validacion/vw13-paso3-visto-por-ventas.png) |
| VW-14 | Confirmación | ok | [vw14-confirmacion-completada](pago-proveedor-validacion/vw14-confirmacion-completada.png) · [vw14b-confirmacion-por-cobrar](pago-proveedor-validacion/vw14b-confirmacion-por-cobrar.png) · [vw14d-pago-2-por-decidir](pago-proveedor-validacion/vw14d-pago-2-por-decidir.png) · [vw14e-cuota-2-por-decidir](pago-proveedor-validacion/vw14e-cuota-2-por-decidir.png) |
| VW-15 | Balance | ok | PDF leído y vista previa antes de enviar. [vw15a-balance-vista-previa](pago-proveedor-validacion/vw15a-balance-vista-previa.png) · [vw15-balance-enviado](pago-proveedor-validacion/vw15-balance-enviado.png) |
| VW-16 | Voucher de la diferencia | ok | [vw16-voucher-diferencia](pago-proveedor-validacion/vw16-voucher-diferencia.png) |
| VW-17 | Pago 2 no se realizará | ok | [vw17-pago-2-no-se-realizara](pago-proveedor-validacion/vw17-pago-2-no-se-realizara.png) |
| VW-18 | Verificación | ok | [vw18-verificacion](pago-proveedor-validacion/vw18-verificacion.png) |
| VW-19 | Validar depósito | ok | [vw19-validar-deposito](pago-proveedor-validacion/vw19-validar-deposito.png) · [cp30-banco-recibe-menos](pago-proveedor-validacion/cp30-banco-recibe-menos.png) |
| VW-20 | Observar depósito | ok | [vw20-observar-deposito](pago-proveedor-validacion/vw20-observar-deposito.png) |
| VW-21 | Aprobación | ok | [vw21a-por-aprobar](pago-proveedor-validacion/vw21a-por-aprobar.png) · [vw21b-aprobados](pago-proveedor-validacion/vw21b-aprobados.png) |
| VW-22 | Ventana de aprobación | ok | [vw22-aprobacion-del-pago](pago-proveedor-validacion/vw22-aprobacion-del-pago.png) |
| VW-23 | Pagos en dólares | ok | [vw23-pagos-en-dolares](pago-proveedor-validacion/vw23-pagos-en-dolares.png) · [vw23b-pagados](pago-proveedor-validacion/vw23b-pagados.png) |
| VW-24 | Ventana de ejecución USD | ok | [vw24a-ejecucion-usd](pago-proveedor-validacion/vw24a-ejecucion-usd.png) · [vw24b-ejecucion-aviso](pago-proveedor-validacion/vw24b-ejecucion-aviso.png) |
| VW-25 | Reembolso solicitado y Aprobar reembolso | ok | [vw25a-bandeja-reembolso](pago-proveedor-validacion/vw25a-bandeja-reembolso.png) · [vw25-reembolso-solicitado](pago-proveedor-validacion/vw25-reembolso-solicitado.png) · [vw25b-aprobar-reembolso](pago-proveedor-validacion/vw25b-aprobar-reembolso.png) |
| VW-26 | Tarifas y tolerancia | ok | Abiertas por pantalla; guardado y efecto por API. [vw26a-tolerancia-y-plazos](pago-proveedor-validacion/vw26a-tolerancia-y-plazos.png) · [vw26b-comision-bancaria](pago-proveedor-validacion/vw26b-comision-bancaria.png) · [vw26c-comision-administrativa](pago-proveedor-validacion/vw26c-comision-administrativa.png) |
| VW-27 | Lista China | ok | Encabezados de la tabla en inglés para este rol: ver Pendientes. [vw27-pagos-en-yuanes](pago-proveedor-validacion/vw27-pagos-en-yuanes.png) |
| VW-28 | Registrar pago en yuanes | ok | [vw28-pago-en-yuanes](pago-proveedor-validacion/vw28-pago-en-yuanes.png) |
| VW-29 | Observar en China | ok | [vw29-observar-pago](pago-proveedor-validacion/vw29-observar-pago.png) |
| VW-30 | Texto del aviso | ok | Dentro de la ventana de pago. [vw28-pago-en-yuanes](pago-proveedor-validacion/vw28-pago-en-yuanes.png) |
| VW-31 | Solicitud manual | ok | [vw31-nueva-solicitud-manual](pago-proveedor-validacion/vw31-nueva-solicitud-manual.png) · [vw31b-manual-creada](pago-proveedor-validacion/vw31b-manual-creada.png) |

Además, en pantalla: [tema-oscuro-mis-pendientes](pago-proveedor-validacion/tema-oscuro-mis-pendientes.png) · [movil-mis-pendientes](pago-proveedor-validacion/movil-mis-pendientes.png). Móvil y tema oscuro se revisaron solo en Mis pendientes.

## Pendientes

Decisión para ti:

1. **China en inglés (VW-27):** la tabla de yuanes ya va en español. El menú y el resto de la intranet siguen en inglés para ContenedorAlmacen; cambiarlo afecta a ese rol en toda la intranet.

Sin validar:

- Envío real por WhatsApp: se probó hasta la vista previa. Queda fuera por PV-20.
- Los chips de estado de la lista de yuanes de la maqueta siguen como Filtros del `DataTable`, por la convención del módulo.
- Las capturas muestran datos de un cliente de la copia local: no se suben al repo y sus enlaces solo abren en este equipo.
- Comparación visual hoja por hoja del PDF de resumen con la maqueta.
- PHPUnit: requiere PHP 8.3. Corre en el CI.

Deuda técnica sin efecto al ejecutar:

- `vue-tsc` marca 9 errores de tipos: `DepositReviewModal.vue`, `useSlaCountdown.ts`, `solicitudes/index.vue` y 6 identificadores duplicados en `types/pago-proveedor.ts`.
- En tablas anchas, el borde con desplazamiento automático del `DataTable` se mueve al acercar el mouse. Es del componente general; las acciones quedaron fijas a la derecha.

## Cierre

Pasada 4: 49/49 estados en pantalla, 35/35 y 5/5 del recorrido, 172/172 por API. Los 68 casos de prueba tienen resultado y ninguno quedó en falla.

`Untitled`, `constancia-local.png` y las capturas no deben subir.

## Pasada en QA (6 de noviembre de 2026)

Entorno: `qaintranet.probusiness.pe`, con Cotizador, Administración y China por el login real.
Flujo solo de Perú: China no crea solicitudes y su botón «Nueva solicitud» está oculto.

| Prueba en QA | Resultado |
|---|---|
| Flujo completo en pantalla | 35/35 |
| Estados en pantalla | 47/49 |
| Vista de China, pagos de Perú | 12/12 |
| Casos abiertos con su rol, sin errores en pantalla ni 500 | 41/41 |

Los 2 fallos de estados son el mismo caso (`ST-22a`): necesita un plazo vencido y en QA no se adelantan fechas. En local pasa.

### Casos que quedan en QA

El nombre del caso está en el producto de cada solicitud, para encontrarlo en pantalla. Las capturas están en `docs/pago-proveedor-validacion/qa/` y no se suben al repositorio porque traen datos de clientes.

| Caso | Código | Dónde se ve | Capturas |
|---|---|---|---|
| Cotización vigente | COT-41 | Ventas › Cotizaciones | — |
| USD T-T · Etapa 1 faltan datos | Orden 40 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-etapa-1-faltan-datos.png) |
| USD T-T · Etapa 1 falta comprobante | Orden 41 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-etapa-1-falta-comprobante.png) |
| USD T-T · Etapa 2 depósito por verificar | PE37NOV26 | Administración › Verificación | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-etapa-2-depo-sito-por-verificar.png) |
| USD T-T · Etapa 2 depósito observado | PE38NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-etapa-2-depo-sito-observado.png) |
| USD T-T · Etapa 2 por aprobar, banco recibió menos | PE39NOV26 | Administración › Aprobación de pagos | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-etapa-2-por-aprobar-banco-recibio-menos.png) |
| USD T-T · Etapa 2 por cobrar | PE40NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-etapa-2-por-cobrar.png) |
| USD T-T · Etapa 3 listo para transferir | PE41NOV26 | Administración › Pagos en dólares | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-etapa-3-listo-para-transferir.png) |
| USD T-T · Pagado con constancia | PE42NOV26 | Administración › Pagos en dólares › Pagados | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-pagado-con-constancia.png) |
| USD T-T · Cuota 1 de 2 lista para transferir | PE43NOV26 | Administración › Pagos en dólares | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-cuota-1-de-2-lista-para-transferir.png) |
| USD T-T · Anulado por Ventas | Orden 49 | Ventas › Todas las solicitudes | [Ventas](pago-proveedor-validacion/qa/caso-usd-t-t-anulado-por-ventas.png) |
| RMB · Etapa 1 faltan datos | Orden 50 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-1-faltan-datos.png) |
| RMB · Etapa 1 falta comprobante | Orden 51 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-1-falta-comprobante.png) |
| RMB · Etapa 2 depósito por verificar | CN44NOV26 | Administración › Verificación | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-2-depo-sito-por-verificar.png) |
| RMB · Etapa 2 depósito observado | CN45NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-2-depo-sito-observado.png) |
| RMB · Etapa 2 por aprobar, banco recibió menos | CN46NOV26 | Administración › Aprobación de pagos | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-2-por-aprobar-banco-recibio-menos.png) |
| RMB · Etapa 2 por cobrar | CN47NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-2-por-cobrar.png) |
| RMB · Etapa 2 error de registro | CN48NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-2-error-de-registro.png) |
| RMB · Etapa 3 pendiente en China | CN49NOV26 | China › Pago a proveedores | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-3-pendiente-en-china.png) · [China](pago-proveedor-validacion/qa/caso-china-rmb-etapa-3-pendiente-en-china.png) |
| RMB · Etapa 3 observado por China | CN50NOV26 | China y Ventas | [Ventas](pago-proveedor-validacion/qa/caso-rmb-etapa-3-observado-por-china.png) · [China](pago-proveedor-validacion/qa/caso-china-rmb-etapa-3-observado-por-china.png) |
| RMB · Pagado, cobrar diferencia al cliente | CN51NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-pagado-cobrar-diferencia-al-cliente.png) · [China](pago-proveedor-validacion/qa/caso-china-rmb-pagado-cobrar-diferencia-al-cliente.png) |
| RMB · Pagado, diferencia a favor del cliente | CN52NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-pagado-diferencia-a-favor-del-cliente.png) · [China](pago-proveedor-validacion/qa/caso-china-rmb-pagado-diferencia-a-favor-del-cliente.png) |
| RMB · Pagado sin diferencia | CN53NOV26 | Ventas › Todas las solicitudes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-pagado-sin-diferencia.png) · [China](pago-proveedor-validacion/qa/caso-china-rmb-pagado-sin-diferencia.png) |
| RMB · 2 pagos, decidir pago 2 | CN54NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-2-pagos-decidir-pago-2.png) · [China](pago-proveedor-validacion/qa/caso-china-rmb-2-pagos-decidir-pago-2.png) |
| RMB · Cuota 1 pagada, decidir cuota 2 | CN55NOV26 | Ventas › Mis pendientes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-cuota-1-pagada-decidir-cuota-2.png) · [China](pago-proveedor-validacion/qa/caso-china-rmb-cuota-1-pagada-decidir-cuota-2.png) |
| RMB · Anulado por Ventas | Orden 64 | Ventas › Todas las solicitudes | [Ventas](pago-proveedor-validacion/qa/caso-rmb-anulado-por-ventas.png) |

«USD Tarjeta» no se creó: el sistema lo rechaza por estar fuera de alcance en esta versión.

### Diferencias con la maqueta corregidas

- Dólares: «Observaciones» en rojo y en dos líneas; negativos como `-$250.00`; títulos de tarjetas completos.
- Ventas: pastillas en Forma de pago, Etapa y Estado; «2 pagos» en lugar de «2 partes».
- Aprobación y Verificación: fechas `dd/mm/aaaa` y textos largos en varias líneas.
- China: el cliente real en los pagos de Perú y la fecha de pago sin el mes repetido.

### Diferencias que siguen

- Filtros: la maqueta los muestra abiertos sobre la tabla; la intranet los agrupa en el panel «Filtros» de su tabla común.
- Ventas: la maqueta agrupa los proveedores de una orden en una sola fila de cliente; la intranet usa una fila por proveedor.
- Dólares, En proceso: la intranet agrega la franja «Pagos listos para transferir», que no está en la maqueta.
- A 1440 px con el menú abierto, Aprobación (417 px), China (344 px), Verificación (124 px) y Dólares (30 px) necesitan scroll horizontal. A 1920 px caben.
- Menú de China en inglés (Home, Customers…): viene del idioma de ese usuario, igual que antes de este módulo.

### Pendiente fuera del código

- El enlace del formulario T-T apunta a `clientes.probusiness.pe`, que da «Page not found». El formulario solo está en la rama `qa` del front de clientes. El caso se probó con ese front en local conectado a la API de QA. Falta publicarlo y definir `APP_URL_CLIENTES` en el servidor.
- WhatsApp: los envíos no dieron error, pero la recepción se confirma en el teléfono.
