# Componentes de chat reutilizables

Bloques compartidos entre **Soporte TI** y **Copiloto IA**:

| Componente | Uso |
|------------|-----|
| `ChatPanelShell` | `UCard` con slots `header` / cuerpo / `footer` |
| `ChatMessagesScroll` | Área de mensajes con scroll y `scrollToBottom()` |
| `ChatComposerSimple` | Input + enviar (Copiloto) |
| `ChatConversationHeader` | Avatar, título y acciones (Copiloto) |

Soporte TI mantiene burbujas, adjuntos y emoji en `SoporteTiChatPanel`; el listado usa `ChatMessagesScroll`.
