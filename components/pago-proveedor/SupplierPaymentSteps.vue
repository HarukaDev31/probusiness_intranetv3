<template>
  <ol class="flex gap-1" :aria-label="`Etapa ${current} de 4`">
    <li
      v-for="step in steps"
      :key="step.n"
      class="min-w-0 flex-1"
    >
      <span class="block h-1.5 rounded-full" :class="barClass(step.n)" />
      <span v-if="labeled" class="mt-1 block truncate text-[11px]" :class="step.n === current ? 'font-semibold text-primary-700' : 'text-gray-400'">{{ step.label }}</span>
    </li>
  </ol>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  current: number
  labeled?: boolean
}>(), { labeled: false })

const steps = [
  { n: 1, label: 'Datos' },
  { n: 2, label: 'Validación' },
  { n: 3, label: 'Ejecución' },
  { n: 4, label: 'Confirmación' }
]

function barClass(step: number) {
  if (step < props.current) return 'bg-primary-500'
  if (step === props.current) return 'bg-primary-400'
  return 'bg-gray-200'
}
</script>
