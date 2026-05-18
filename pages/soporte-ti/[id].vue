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
      <p class="text-sm">{{ error }}</p>
    </UCard>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SoporteTiDetailPageSkeleton
        v-if="cargandoTicket"
        class="flex min-h-0 flex-1 flex-col"
        :solo-chat="esSolicitante"
      />
      <UCard v-else-if="!ticket" class="text-center">
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
          No existe esta solicitud o no tienes acceso.
        </p>
        <UButton color="primary" variant="outline" size="sm" @click="volver">
          Regresar al listado
        </UButton>
      </UCard>
      <SoporteTiDetailView v-else :ticket="ticket" class="flex min-h-0 flex-1 flex-col" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { navigateTo, useRoute } from '#imports'
import PageHeader from '~/components/PageHeader.vue'
import SoporteTiDetailPageSkeleton from '~/components/soporte-ti/SoporteTiDetailPageSkeleton.vue'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { sincronizarSalasGlobales } from '~/composables/useSoporteTiChatGlobal'
import type { SoporteTiSolicitud } from '~/types/soporteTi'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const paramId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
})

const { error, resolverTicketParaRuta, rolActivo, solicitudPorParamRuta } = useSoporteTi()

const esSolicitante = computed(() => rolActivo.value === 'Solicitante')

const cargandoTicket = ref(true)
const ticket = ref<SoporteTiSolicitud | null>(null)

const headerTitle = computed(() => {
  if (cargandoTicket.value) return 'Soporte TI'
  if (!ticket.value) return 'Solicitud no encontrada'
  return ticket.value.titulo || 'Detalle de solicitud'
})

const headerSubtitle = computed(() => {
  if (cargandoTicket.value) return 'Cargando…'
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
  () => {
    const id = paramId.value
    if (!id || typeof id !== 'string' || !ticket.value || cargandoTicket.value) return null
    return solicitudPorParamRuta(id)
  },
  (actualizado) => {
    if (actualizado) ticket.value = actualizado
  }
)

watch(
  () => ticket.value?.chatUuid,
  (uuid) => {
    if (!uuid) return
    void sincronizarSalasGlobales([uuid])
  }
)

watch(paramId, async () => {
  if (cargandoTicket.value) return
  cargandoTicket.value = true
  try {
    await resolveTicket()
  } finally {
    cargandoTicket.value = false
  }
})

function volver() {
  void navigateTo('/soporte-ti')
}

onMounted(async () => {
  try {
    await resolveTicket()
  } finally {
    cargandoTicket.value = false
  }
})
</script>
