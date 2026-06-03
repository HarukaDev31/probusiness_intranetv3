# Envíos programáticos → WhatsApp Inbox

Los envíos de plantillas Meta de **coordinación** (`fromNumber consolidado` + `queueCoordinacionWhatsApp`) se registran en **`wa_inbox_*`**.

## Flujo

1. Código llama `sendMessage(..., 'consolidado', $meta)` o `queueCoordinacionWhatsApp(CoordinacionWhatsappPayload::...)`.
2. Varios pasos del mismo caso → `runWhatsAppCoordinacionBatch()` (Horizon muestra un grupo).
3. Job `SendCoordinacionWhatsAppJob` → `WhatsappInboxCoordinacionOutboundService::process()`.
4. `findOrCreateConversation` + `createOutboundPending` / `sendTemplateWithHeaderSync`.
5. Cola `SendWaInboxOutboundJob` → Meta Graph API.
6. WebSocket + lista del inbox muestran el mensaje (texto = `chat_preview` del payload).

**Ya no** hay registro en Bitrix open line ni tabla `whatsapp_coordinacion_bitrix_registros`.

## Dos batches en Horizon (programático)

| Batch | Cola | Jobs | Nombre en Horizon |
|-------|------|------|-------------------|
| **1 — Programático** | `META_WHATSAPP_QUEUE` | `SendCoordinacionWhatsAppJob` | `Programático · Rotulado · carga …` |
| **2 — Envío inbox** | `META_WHATSAPP_INBOX_QUEUE` | `SendWaInboxOutboundJob` | `Inbox envío · Rotulado · carga …` |

Flujo: el batch 1 registra en `wa_inbox_*` (pending o sync). Al terminar batch 1 (`finally`), se arma el batch 2 solo con mensajes `delivery_status=pending` (Meta Graph).

Envíos **sueltos** (un solo `queueCoordinacionWhatsApp` sin batch programático) o **intranet manual** siguen despachando `SendWaInboxOutboundJob` al instante.

| Helper | Uso |
|--------|-----|
| `setWhatsAppCoordinacionBatchId` + `queueCoordinacionWhatsApp` × N + `dispatchWhatsAppCoordinacionBatch` | Rotulado, solicitar documentos |
| `runWhatsAppCoordinacionBatch($tipo, $context, $enqueue)` | Calculadora, entrega masiva, recordatorio docs |

Tablas: `whatsapp_coordinacion_batches` (`laravel_batch_id`, `outbound_laravel_batch_id`, `job_domain`) + `whatsapp_coordinacion_batch_items` (`inbox_message_id`).

## Payload

- **`chat_preview`**: texto visible en el inbox (antes `bitrix_message`; el backend acepta ambos por compatibilidad).
- Opcional: `contact_name` para el sidebar.

## Puntos de entrada (revisados)

| Área | Archivo |
|------|---------|
| Trait / cola / batch | `app/Traits/WhatsappTrait.php` |
| Job | `app/Jobs/WhatsApp/SendCoordinacionWhatsAppJob.php` |
| Batch service | `app/Services/WhatsApp/WhatsAppCoordinacionBatchService.php` |
| Payloads plantilla | `app/Support/WhatsApp/CoordinacionWhatsappPayload.php` |
| Servicio inbox | `app/Services/WhatsappInbox/WhatsappInboxCoordinacionOutboundService.php` |
| Meta Graph | `app/Services/WhatsApp/MetaWhatsAppCoordinacionService.php` (solo plantillas) |
| Rotulado | `app/Jobs/SendRotuladoJob.php` |
| Documentos | `app/Jobs/SolicitarDocumentosWhatsAppJob.php` |
| Entregas | `SendDeliveryConfirmationWhatsApp*Job.php`, `SendDeliveryFormBulkJob.php` |
| Calculadora | `app/Services/CalculadoraImportacion/CalculadoraImportacionWhatsappService.php` |
| Recordatorio docs | `app/Http/Controllers/CargaConsolidada/Clientes/GeneralController.php` |

## Intranet manual

`POST api/whatsapp-inbox/conversations/{id}/templates` — mismo modelo de mensajes; no pasa por `SendCoordinacionWhatsAppJob`.

## Índices (lecturas)

Solo en migración aparte (BD ya creada antes): `2026_06_03_160000_add_read_optimization_indexes_wa_inbox_and_coord_batches.php` — idempotente, segura si se vuelve a ejecutar. Resumen:

| Tabla | Índice | Consulta |
|-------|--------|----------|
| `wa_inbox_conversations` | `(session_id, last_message_at, id)` | Lista inbox ordenada |
| `wa_inbox_conversations` | `(session_id, phone_e164)` UNIQUE | findOrCreate |
| `wa_inbox_conversations` | `(assigned_user_id, last_message_at)`, `(status, last_message_at)` | Filtros mis/cerradas |
| `wa_inbox_messages` | `(conversation_id, sent_at, id)` | Chat paginado |
| `wa_inbox_messages` | `meta_message_id` UNIQUE | Webhook / dedupe |
| `wa_inbox_messages` | `(conversation_id, delivery_status, id)` | Pending outbound |
| `wa_inbox_webhook_logs` | `(processed_at)` | Pendientes de procesar |
| `whatsapp_coordinacion_batch_items` | `(batch_id, status, sort_order)` | Batch 2 programático |
| `whatsapp_coordinacion_batch_items` | `inbox_message_id` | Enlace ítem → mensaje |
| `whatsapp_coordinacion_batches` | `(id_cotizacion, tipo, created_at)`, `laravel_batch_id`, `outbound_laravel_batch_id` | Historial / Horizon |

## Notas

- Archivos de encabezado: S3 + `path` en BD; en API/listado se expone URL **CDN** (`CoordinacionMediaLink::urlForDisplay`).
