<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden md:p-6">
    <PageHeader
      :title="headerTitle"
      :subtitle="headerSubtitle"
      icon="i-heroicons-ticket"
      :hide-back-button="false"
      @back="volver"
    />

    <UCard v-if="error" color="warning" variant="subtle">
      <p class="text-sm">{{ error }} — Mostrando datos locales de demostración.</p>
    </UCard>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="!cargaListaTerminada || resolviendoRuta" class="flex justify-center py-16">
        <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-gray-400" />
      </div>
      <UCard v-else-if="!ticket" class="text-center">
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
          No existe esta solicitud o no tienes acceso.
        </p>
        <UButton color="primary" variant="outline" size="sm" @click="volver">
          Regresar al listado
        </UButton>
      </UCard>
      <SoporteTiDetailView v-else-if="ticket" :ticket="ticket" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { navigateTo, useRoute } from '#imports'
import PageHeader from '~/components/PageHeader.vue'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import type { SoporteTiSolicitud } from '~/types/soporteTi'
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const paramId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
})

const {
  error,
  cargar,
  handlersSala,
  resolverTicketParaRuta
} = useSoporteTi()

const { suscribirSala, desuscribirTodas, setSalaActiva } = useSoporteTiChatRoom()
const cargaListaTerminada = ref(false)
const resolviendoRuta = ref(false)
const ticket = ref<SoporteTiSolicitud | null>(null)

const headerTitle = computed(() => {
  if (!cargaListaTerminada.value || resolviendoRuta.value) return 'Soporte TI'
  if (!ticket.value) return 'Solicitud no encontrada'
  return ticket.value.titulo || 'Detalle de solicitud'
})

const headerSubtitle = computed(() => {
  if (!cargaListaTerminada.value || resolviendoRuta.value) return 'Cargando…'
  if (!ticket.value) return 'Verifica el enlace o vuelve al listado.'
  const parts = [ticket.value.codigo, ticket.value.estado].filter(Boolean)
  return parts.join(' · ')
})

async function resolveTicket() {
  const id = paramId.value
  if (!id || typeof id !== 'string') {
    ticket.value = null
    return
  }
  ticket.value = await resolverTicketParaRuta(id)
}

watch(
  () => ticket.value?.chatUuid,
  (uuid) => {
    setSalaActiva(uuid ?? null)
    if (uuid) {
      suscribirSala(uuid, handlersSala(uuid))
    }
  },
  { immediate: true }
)

watch(paramId, async () => {
  if (!cargaListaTerminada.value) return
  resolviendoRuta.value = true
  try {
    await resolveTicket()
  } finally {
    resolviendoRuta.value = false
  }
})

function volver() {
  void navigateTo('/soporte-ti')
}

onMounted(async () => {
  await cargar()
  await resolveTicket()
  cargaListaTerminada.value = true
})

onUnmounted(() => {
  desuscribirTodas()
  setSalaActiva(null)
})
</script>
