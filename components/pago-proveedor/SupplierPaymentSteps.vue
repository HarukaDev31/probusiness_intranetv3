<template>
  <ol class="flex gap-1.5" :aria-label="`Etapa ${current} de ${steps.length}`">
    <li
      v-for="step in steps"
      :key="step.n"
      class="min-w-0 flex-1"
    >
      <UCard
        :as="navigable ? 'button' : 'div'"
        :type="navigable ? 'button' : undefined"
        class="w-full text-left"
        :class="navigable ? 'cursor-pointer' : 'cursor-default'"
        :color="stepColor(step.n)"
        :variant="stepVariant(step.n)"
        :ui="cardUi"
        @click="navigable && emit('select', step.n)"
      >
        <span
          v-if="labeled"
          class="block truncate text-[11px]"
          :class="step.n === active ? 'font-semibold' : ''"
        >
          {{ step.label }}
        </span>
      </UCard>
    </li>
  </ol>
  <UButton
    v-if="navigable && viewing != null && viewing !== current"
    class="mt-2"
    size="xs"
    color="primary"
    variant="link"
    @click="emit('select', current)"
  >
    Volver al paso actual
  </UButton>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  current: number
  labeled?: boolean
  navigable?: boolean
  viewing?: number | null
}>(), {
  labeled: false,
  navigable: false,
  viewing: null
})

const emit = defineEmits<{ select: [step: number] }>()

const steps = [
  { n: 1, label: 'Datos' },
  { n: 2, label: 'Validación' },
  { n: 3, label: 'Ejecución' },
  { n: 4, label: 'Confirmación' }
]

const active = computed(() => props.viewing ?? props.current)

const cardUi = computed(() => props.labeled
  ? { body: 'px-2 py-1.5 sm:px-2 sm:py-1.5' }
  : { body: 'h-1.5 p-0 sm:p-0' }
)

function stepColor(step: number) {
  if (step === active.value) return 'warning'
  if (step <= props.current) return 'primary'
  return 'neutral'
}

function stepVariant(step: number) {
  if (step === active.value || step < props.current) return 'solid'
  return 'subtle'
}
</script>
