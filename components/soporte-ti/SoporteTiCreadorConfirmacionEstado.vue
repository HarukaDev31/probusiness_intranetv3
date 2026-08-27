<template>
  <div
    v-if="compact"
    class="min-w-0"
    @click.stop
    @pointerdown.stop
  >
    <p class="text-[10px] font-medium uppercase tracking-wide text-muted">Estado</p>
    <USelect
      :model-value="ticket.gestion.estadoValor ?? undefined"
      :items="items"
      value-key="value"
      label-key="label"
      size="sm"
      class="mt-1 w-full min-w-0"
      :placeholder="ticket.gestion.estadoPlaceholder"
      :disabled="!ticket.gestion.puedeConfirmar"
      @update:model-value="emit('change', $event)"
    />
    <p class="mt-1 text-[10px] leading-snug text-muted">
      <template v-if="ticket.gestion.puedeConfirmar">
        Operativo u Observado
      </template>
      <template v-else>
        Al estar Desplegado
      </template>
    </p>
  </div>
  <UCard v-else>
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

const props = withDefaults(
  defineProps<{
    ticket: SoporteTiSolicitud
    compact?: boolean
  }>(),
  { compact: false }
)

const emit = defineEmits<{
  change: [val: unknown]
}>()

const items = computed(() => estadosItems(props.ticket.gestion.estados))
</script>
