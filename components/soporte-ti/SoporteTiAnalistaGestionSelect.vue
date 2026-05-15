<script setup lang="ts">
import { computed } from 'vue'
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { SOPORTE_TI_ESTADOS } from '~/constants/soporteTiEstados'
import {
  SOPORTE_TI_COMPLEJIDADES,
  esComplejidadCatalogo,
  puedePasarAEnProgreso
} from '~/utils/soporteTiCriticidad'
import { aplicarCambioEstadoEnSolicitud } from '~/utils/soporteTiEstadoTransition'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{ ticket: SoporteTiSolicitud }>()

const { actualizarSolicitud, agregarMensajeSistema, etiquetaAhora } = useSoporteTi()
const { showError } = useModal()

const itemsEstado = computed(() =>
  SOPORTE_TI_ESTADOS.filter(
    (e) =>
      e.codigo !== 'operativo' &&
      (e.tipoSolicitud === null || e.tipoSolicitud === props.ticket.tipo)
  ).map((e) => ({ label: e.nombre, value: e.codigo }))
)

const itemsComplejidad = SOPORTE_TI_COMPLEJIDADES.map((c) => ({
  label: c,
  value: c
}))

/** Estado solo editable con complejidad Baja/Media/Alta/Máxima ya asignada. */
const estadoHabilitado = computed(() => esComplejidadCatalogo(props.ticket.criticidad))

const valorComplejidadSelect = computed(() => {
  const c = props.ticket.criticidad
  return esComplejidadCatalogo(c) ? c : undefined
})

function onCambioEstado(val: unknown) {
  if (!estadoHabilitado.value) return
  const nuevoCodigo = typeof val === 'string' ? val : String(val ?? '')
  const t = props.ticket
  if (!nuevoCodigo || nuevoCodigo === t.estadoCodigo) return
  if (nuevoCodigo === 'en_progreso' && !puedePasarAEnProgreso(t)) {
    showError(
      'No se puede pasar a En progreso',
      'Revisa la complejidad y el flujo (en tipo A con maqueta, debe estar aprobada).'
    )
    return
  }
  const actualizada = aplicarCambioEstadoEnSolicitud(t, nuevoCodigo)
  void actualizarSolicitud({
    ...actualizada,
    ultimaActualizacion: etiquetaAhora()
  })
  agregarMensajeSistema(t.chatUuid, t.codigo, `Estado actualizado a "${actualizada.estado}" (analista).`)
}

function onCambioComplejidad(val: unknown) {
  const raw = typeof val === 'string' ? val : String(val ?? '')
  if (!esComplejidadCatalogo(raw)) return
  const t = props.ticket
  if (t.criticidad === raw) return
  void actualizarSolicitud({
    ...t,
    criticidad: raw,
    ultimaActualizacion: etiquetaAhora()
  })
  agregarMensajeSistema(t.chatUuid, t.codigo, `Complejidad actualizada a «${raw}».`)
}
</script>

<template>
  <div
    class="grid w-full min-w-0 grid-cols-2 gap-3"
    @click.stop
    @pointerdown.stop
  >
    <div class="min-w-0 space-y-1">
      <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Complejidad
      </span>
      <USelect
        :model-value="valorComplejidadSelect"
        :items="itemsComplejidad"
        value-key="value"
        label-key="label"
        size="sm"
        class="w-full min-w-0"
        placeholder="Definir"
        @update:model-value="onCambioComplejidad"
      />
    </div>
    <div class="min-w-0 space-y-1">
      <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Estado
      </span>
      
      <USelect
        :model-value="ticket.estadoCodigo"
        :items="itemsEstado"
        :disabled="!estadoHabilitado"
        value-key="value"
        label-key="label"
        size="sm"
        class="w-full min-w-0"
        :title="!estadoHabilitado ? 'Define primero la complejidad' : undefined"
        placeholder="Estado"
        @update:model-value="onCambioEstado"
      />
    </div>
  </div>
</template>
