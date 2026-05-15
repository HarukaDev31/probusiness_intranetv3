<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100 text-slate-800 lg:flex-row">
    <SoporteTiSidebar :rol="rolActivo" @update:rol="setRol" />

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        class="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5"
      >
        <h1 class="text-[14px] font-semibold">{{ tituloCabecera }}</h1>
        <UButton
          v-if="!seleccion && rolActivo === 'Solicitante'"
          size="sm"
          icon="i-heroicons-plus"
          @click="modalCrear = true"
        >
          Nueva solicitud
        </UButton>
      </div>

      <div v-if="error" class="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2 text-[12px] text-amber-900">
        {{ error }} — Mostrando datos locales de demostración.
      </div>

      <SoporteTiDetailView
        v-if="seleccion"
        :ticket="seleccion"
        @back="setSeleccion(null)"
      />
      <div v-else class="flex-1 overflow-y-auto p-5">
        <SoporteTiStatsCards :stats="stats" class="mb-4" />
        <SoporteTiTableView :solicitudes="solicitudesVisibles" @select="setSeleccion" />
      </div>
    </div>

    <SoporteTiModalCreate v-model:open="modalCrear" @saved="onCreada" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import type { SoporteTiCreatePayload } from '~/types/soporteTi'
import SoporteTiSidebar from '~/components/soporte-ti/SoporteTiSidebar.vue'
import SoporteTiStatsCards from '~/components/soporte-ti/SoporteTiStatsCards.vue'
import SoporteTiTableView from '~/components/soporte-ti/SoporteTiTableView.vue'
import SoporteTiDetailView from '~/components/soporte-ti/SoporteTiDetailView.vue'
import SoporteTiModalCreate from '~/components/soporte-ti/SoporteTiModalCreate.vue'

definePageMeta({
  middleware: 'auth'
})

const {
  rolActivo,
  setRol,
  solicitudesVisibles,
  stats,
  seleccion,
  setSeleccion,
  error,
  cargar,
  crearSolicitud,
  handlersSala
} = useSoporteTi()

const { suscribirSala, desuscribirTodas, setSalaActiva } = useSoporteTiChatRoom()
const salasSuscritas = ref<Set<string>>(new Set())

watch(
  solicitudesVisibles,
  (list) => {
    const activos = new Set(list.map((s) => s.chatUuid))
    for (const uuid of activos) {
      if (!salasSuscritas.value.has(uuid)) {
        suscribirSala(uuid, handlersSala(uuid))
        salasSuscritas.value.add(uuid)
      }
    }
  },
  { immediate: true, deep: true }
)

watch(seleccion, (s) => {
  setSalaActiva(s?.chatUuid ?? null)
})

const modalCrear = ref(false)

const tituloCabecera = computed(() => {
  if (seleccion.value) return `Detalle — ${seleccion.value.codigo}`
  if (rolActivo.value === 'Solicitante') return 'Mis solicitudes'
  if (rolActivo.value === 'PM') return 'Gestión de proyectos'
  return 'Panel del analista'
})

async function onCreada(payload: SoporteTiCreatePayload) {
  try {
    await crearSolicitud(payload)
  } catch {
    /* useModal opcional */
  }
}

onMounted(() => {
  void cargar()
})

onUnmounted(() => {
  desuscribirTodas()
  setSalaActiva(null)
})
</script>
