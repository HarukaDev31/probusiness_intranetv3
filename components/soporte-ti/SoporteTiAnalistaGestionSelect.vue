<script setup lang="ts">
import { computed } from 'vue'
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { SOPORTE_TI_COMPLEJIDADES, complejidadOk } from '~/utils/soporteTiComplejidad'
import { estadosItems } from '~/utils/soporteTiGestion'
import { useSoporteTiAcciones } from '~/composables/useSoporteTiAcciones'

const props = defineProps<{ ticket: SoporteTiSolicitud }>()

const { cambiarComplejidad, cambiarEstado } = useSoporteTiAcciones()

const g = computed(() => props.ticket.gestion)
const itemsEstado = computed(() => estadosItems(g.value.estados))
const esTipoA = computed(() => props.ticket.tipo === 'A')
const itemsComplejidad = computed(() =>
  SOPORTE_TI_COMPLEJIDADES.map((c) => ({ label: c, value: c }))
)

const mostrarComplejidadPm = computed(() => esTipoA.value && g.value.puedeComplejidadPm)
const mostrarComplejidadAnalista = computed(
  () => (esTipoA.value && g.value.puedeComplejidadAnalista) || (!esTipoA.value && g.value.puedeComplejidad)
)

const valorComplejidadPm = computed(() => g.value.complejidadPmValor ?? undefined)
const valorComplejidadAnalista = computed(() =>
  esTipoA.value ? (g.value.complejidadAnalistaValor ?? undefined) : (g.value.complejidadValor ?? undefined)
)

const gridCols = computed(() => {
  const n =
    (mostrarComplejidadPm.value ? 1 : 0) +
    (mostrarComplejidadAnalista.value ? 1 : 0) +
    1
  if (n <= 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  return 'grid-cols-3'
})

function onCambioEstado(val: unknown) {
  const codigo = typeof val === 'string' ? val : String(val ?? '')
  void cambiarEstado(props.ticket, codigo, { rolEtiqueta: 'analista' })
}

function onCambioComplejidad(val: unknown, rol: 'pm' | 'analista' | 'legacy') {
  const raw = typeof val === 'string' ? val : String(val ?? '')
  if (!complejidadOk(raw)) return
  void cambiarComplejidad(props.ticket, raw, { rol })
}
</script>

<template>
  <div
    v-if="g.esStaff"
    class="grid w-full min-w-0 gap-3"
    :class="gridCols"
    @click.stop
    @pointerdown.stop
  >
    <div v-if="mostrarComplejidadPm" class="min-w-0 space-y-1">
      <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Complejidad PM
      </span>
      <USelect
        :model-value="valorComplejidadPm"
        :items="itemsComplejidad"
        value-key="value"
        label-key="label"
        size="sm"
        class="w-full min-w-0"
        placeholder="Definir"
        @update:model-value="(v) => onCambioComplejidad(v, 'pm')"
      />
    </div>

    <div v-if="mostrarComplejidadAnalista" class="min-w-0 space-y-1">
      <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {{ esTipoA ? 'Complejidad analista' : 'Complejidad' }}
      </span>
      <USelect
        :model-value="valorComplejidadAnalista"
        :items="itemsComplejidad"
        value-key="value"
        label-key="label"
        size="sm"
        class="w-full min-w-0"
        placeholder="Definir"
        @update:model-value="(v) => onCambioComplejidad(v, esTipoA ? 'analista' : 'legacy')"
      />
    </div>

    <div class="min-w-0 space-y-1">
      <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Estado
      </span>
      <USelect
        :model-value="g.estadoValor ?? undefined"
        :items="itemsEstado"
        :disabled="!g.estadoEditable"
        value-key="value"
        label-key="label"
        size="sm"
        class="w-full min-w-0"
        :title="!g.estadoEditable ? 'Define primero la complejidad' : undefined"
        :placeholder="g.estadoPlaceholder"
        @update:model-value="onCambioEstado"
      />
    </div>
  </div>
</template>
