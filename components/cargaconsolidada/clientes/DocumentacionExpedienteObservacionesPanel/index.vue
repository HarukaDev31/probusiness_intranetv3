<template>
  <UCard
    class="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-lg shadow-md border-2 border-orange-400"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5 text-orange-500" />
        <h3 class="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
          Observaciones del expediente
        </h3>
        <UBadge color="warning" variant="solid" size="sm">
          {{ observaciones.length }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <div
        v-if="loading"
        class="py-6 text-center text-sm text-gray-500"
      >
        Cargando observaciones…
      </div>

      <div
        v-else-if="error"
        class="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2"
      >
        {{ error }}
      </div>

      <div
        v-else-if="observaciones.length === 0"
        class="rounded-lg bg-gray-50 dark:bg-gray-900/40 text-gray-500 text-sm px-3 py-4 text-center"
      >
        Aún no hay observaciones para este proveedor.
      </div>

      <div
        v-else
        ref="listaRef"
        class="max-h-64 overflow-y-auto space-y-3 pr-1"
      >
        <article
          v-for="obs in observaciones"
          :key="obs.id"
          class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3"
        >
          <div class="flex items-start gap-3">
            <div
              class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
              :class="avatarClass(obs.categoria)"
            >
              {{ iniciales(obs.user_name) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ obs.user_name }}
                </span>
                <span class="text-xs" :class="categoriaTagClass(obs.categoria)">
                  {{ categoriaLabel(obs.categoria) }}
                </span>
                <span class="text-xs text-gray-400 ml-auto">
                  {{ formatTimestamp(obs.created_at) }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {{ obs.mensaje }}
              </p>
            </div>
          </div>
        </article>
      </div>

      <div class="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-700">
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de observación">
          <button
            v-for="cat in DOC_EXPEDIENTE_OBS_CATEGORIAS"
            :key="cat.value"
            type="button"
            role="radio"
            :aria-checked="categoriaSeleccionada === cat.value"
            class="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
            :class="categoriaSeleccionada === cat.value
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'"
            @click="seleccionarCategoria(cat.value)"
          >
            {{ cat.label }}
          </button>
        </div>

        <div class="flex gap-2 items-stretch">
          <UTextarea
            v-model="mensajeDraft"
            placeholder="Escribe una observación..."
            :rows="2"
            autoresize
            class="flex-1"
            :disabled="sending"
            @keydown.ctrl.enter.prevent="handleEnviar"
            @keydown.meta.enter.prevent="handleEnviar"
          />
          <UButton
            label="Enviar"
            color="warning"
            class="self-end shrink-0"
            :loading="sending"
            :disabled="!mensajeDraft.trim() || sending"
            @click="handleEnviar"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import {
  DOC_EXPEDIENTE_OBS_CATEGORIAS,
  getDocExpedienteObsCategoriaMeta
} from '~/constants/documentacionExpedienteObservaciones'
import { useDocumentacionExpedienteObservaciones } from '~/composables/cargaconsolidada/useDocumentacionExpedienteObservaciones'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import type { DocumentacionObservacionCategoria } from '~/types/cargaconsolidada/documentacionObservacion'
import { TIMEZONE_PERU } from '~/utils/formatters'

const props = defineProps<{
  proveedorId: number | null | undefined
}>()

const proveedorIdRef = computed(() => props.proveedorId)

const {
  observaciones,
  loading,
  sending,
  error,
  categoriaSeleccionada,
  mensajeDraft,
  enviarObservacion
} = useDocumentacionExpedienteObservaciones(proveedorIdRef)

const listaRef = ref<HTMLElement | null>(null)
const { showError } = useModal()
const { withSpinner } = useSpinner()

watch(
  () => observaciones.value.length,
  async () => {
    await nextTick()
    if (listaRef.value) {
      listaRef.value.scrollTop = listaRef.value.scrollHeight
    }
  }
)

const iniciales = (nombre: string) => {
  const partes = String(nombre || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0] || ''}${partes[1][0] || ''}`.toUpperCase()
}

const categoriaLabel = (categoria: DocumentacionObservacionCategoria) =>
  getDocExpedienteObsCategoriaMeta(categoria).label

const categoriaTagClass = (categoria: DocumentacionObservacionCategoria) =>
  getDocExpedienteObsCategoriaMeta(categoria).tagClass

const avatarClass = (categoria: DocumentacionObservacionCategoria) =>
  getDocExpedienteObsCategoriaMeta(categoria).avatarClass

const seleccionarCategoria = (categoria: DocumentacionObservacionCategoria) => {
  categoriaSeleccionada.value = categoria
}

const formatTimestamp = (value: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE_PERU,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')}/${get('month')} ${get('hour')}:${get('minute')}`
}

const handleEnviar = async () => {
  if (sending.value || !mensajeDraft.value.trim()) return

  try {
    await withSpinner(async () => {
      await enviarObservacion()
    }, 'Enviando observación…')
  } catch (e: unknown) {
    showError(
      'No se pudo enviar',
      e instanceof Error ? e.message : 'Ocurrió un error al guardar la observación.'
    )
  }
}
</script>
