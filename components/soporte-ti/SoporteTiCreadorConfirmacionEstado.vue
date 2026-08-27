<template>
  <UCard>
    <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      Confirmación
    </p>
    <div class="max-w-xs space-y-2" @click.stop @pointerdown.stop>
      <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Estado
      </span>
      <USelect
        :model-value="ticket.gestion.estadoValor ?? undefined"
        :items="items"
        value-key="value"
        label-key="label"
        size="sm"
        class="w-full min-w-0"
        :placeholder="ticket.gestion.estadoPlaceholder"
        :disabled="!ticket.gestion.puedeConfirmar"
        @update:model-value="emit('change', $event)"
      />
      <p class="text-[11px] text-gray-500 dark:text-gray-400">
        <template v-if="ticket.gestion.puedeConfirmar">
          Elige <strong>Operativo</strong> u <strong>Observado</strong>.
        </template>
        <template v-else>
          Disponible cuando el ticket esté <strong>Desplegado</strong>: solo
          <strong>Operativo</strong> u <strong>Observado</strong>.
        </template>
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { estadosItems } from '~/utils/soporteTiGestion'

const props = defineProps<{ ticket: SoporteTiSolicitud }>()

const emit = defineEmits<{
  change: [val: unknown]
}>()

/** Solo operativo / observado (el API ya filtra así para el creador). */
const items = computed(() => estadosItems(props.ticket.gestion.estados))
</script>
