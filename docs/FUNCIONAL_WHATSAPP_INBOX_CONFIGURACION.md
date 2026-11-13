# Guía rápida — Configurar WhatsApp para el Chat

Instrucciones claras para conectar el número de WhatsApp Business con el chat de la intranet. Sin jerga técnica.

> PDF: [Guia_Configurar_WhatsApp_Chat.pdf](./Guia_Configurar_WhatsApp_Chat.pdf)

---

## 1. Qué vas a lograr

Que tu equipo chatee con clientes desde la intranet, con el número de WhatsApp Business de tu empresa.

Cada empresa usa su propio número. Los datos se guardan en la pantalla **WhatsApp** de la intranet.

---

## 2. Qué necesitas antes

- Cuenta WhatsApp Business en Meta
- Número activo en esa cuenta
- Acceso a Meta for Developers (o alguien que lo gestione)
- Usuario de intranet con permiso (ProBusiness: Gerencia; socios: perfil Socio)
- La URL del webhook (la da el equipo técnico de ProBusiness)

---

## 3. Dónde se configura

| Pantalla | Para qué | Cómo llegar |
|---|---|---|
| **WhatsApp** (configuración) | Pegar datos del número y claves de Meta | `/admin/whatsapp` (o el engranaje del chat) |
| **Chat WhatsApp** | Conversar con clientes | Menú Chat WhatsApp → `/coordinacion/whatsapp-inbox` |

Los datos de Meta van solo en **WhatsApp (configuración)**. El chat es solo para operar.

---

## 4. Datos a completar en `/admin/whatsapp`

| Campo | Qué es | ¿Obligatorio? |
|---|---|---|
| Activar WhatsApp | Enciende o apaga el chat | Sí |
| Número visible | Cómo se muestra (ej. +51 999…) | Recomendado |
| ID del número | Phone number ID de Meta | Sí |
| ID de la cuenta (WABA) | ID de tu cuenta WhatsApp Business | Sí |
| Token de acceso | Clave para enviar y recibir | Sí |
| Secreto de la app | Clave de seguridad de la app en Meta | Sí |
| Token del webhook | Contraseña que defines tú; **igual** en Meta y aquí | Sí |
| Versión de la API | Suele ser `v19.0` | Recomendado |
| Idioma de plantillas | Ej. `es_PE` | Recomendado |

Si un secreto ya estaba guardado, déjalo vacío al guardar = no lo cambias.

---

## 5. Pasos en Meta

1. Abre la app en Meta for Developers → producto WhatsApp → vincula cuenta y número.
2. Copia: ID del número, WABA, Token de acceso, Secreto de la app.
3. En el webhook:
   - URL que te indique ProBusiness (termina en `/webhooks/meta/whatsapp-inbox`)
   - Verify token = el mismo que pondrás en la intranet
   - Suscribe `messages`
4. Si necesitas escribir fuera de las 24 h, crea plantillas aprobadas en Meta Business Manager.

---

## 6. Pasos en la intranet

1. Entra con usuario autorizado.
2. Abre `/admin/whatsapp`.
3. Activa WhatsApp y completa los campos de la sección 4.
4. Guarda.
5. Abre el Chat y haz una prueba.

---

## 7. Cómo saber que quedó bien

- Meta muestra el webhook verificado
- WhatsApp está activado en la intranet
- Puedes enviar un mensaje de prueba
- Llega un mensaje entrante al chat

---

## 8. Si algo falla

| Qué ves | Qué revisar |
|---|---|
| Meta no verifica el webhook | Token del webhook distinto entre Meta e intranet |
| No llegan mensajes | URL, secreto de la app, ID del número |
| No puedo enviar | Activar WhatsApp off o token inválido |
| No veo la configuración | Sin permiso (Gerencia / Socio) |
| No veo el chat | Falta el menú en tu rol |

---

## 9. No mezclar

Esta guía es solo para el **Chat WhatsApp**. No uses el webhook ni las claves del Copiloto de ventas.
