<template>
  <!-- Mensaje automático de WhatsApp con su botón «Copiar texto» (#2287): arriba «Mensaje» y el botón, abajo el texto. -->
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm font-medium text-muted">Mensaje</span>
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        icon="i-lucide-copy"
        :disabled="!texto"
        @click="copiar"
      >
        {{ copiado ? 'Copiado' : 'Copiar texto' }}
      </UButton>
    </div>
    <UCard variant="subtle">
      <p v-if="cargando && !texto" class="text-sm text-muted">Preparando mensaje…</p>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <pre v-else class="overflow-auto whitespace-pre-wrap font-sans text-sm text-highlighted" :class="[alturaClass, cargando ? 'opacity-60' : '']" v-html="whatsappHtml(texto)" />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { whatsappHtml } from '~/utils/whatsappFormat'
import { useModal } from '~/composables/commons/useModal'

const props = withDefaults(defineProps<{
  texto?: string | null
  cargando?: boolean
  alturaClass?: string
}>(), {
  texto: '',
  cargando: false,
  alturaClass: 'max-h-80'
})

const { showError } = useModal()
const copiado = ref(false)

/** Copia el texto tal cual se envía por WhatsApp (con sus *negritas*). */
async function copiar() {
  const texto = String(props.texto || '')
  if (!texto) return
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    // Navegadores sin permiso de portapapeles: copia con un textarea temporal.
    const area = document.createElement('textarea')
    area.value = texto
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    if (!ok) {
      showError('Copiar texto', 'No se pudo copiar. Selecciona el texto y cópialo a mano.')
      return
    }
  }
  copiado.value = true
  setTimeout(() => { copiado.value = false }, 1800)
}
</script>
