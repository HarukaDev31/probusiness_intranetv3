/**
 * WhatsApp shows *text* in bold. The text is escaped before the markup is added,
 * so the result is safe to render with v-html.
 */
export function whatsappHtml(text: string | null | undefined): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
}
