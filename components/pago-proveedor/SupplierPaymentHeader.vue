<template>
  <!-- Cabecera única de Pago a Proveedor: icono naranja + nombre de la sección y debajo «Pago a proveedor» en letra pequeña,
       alineado con el inicio del texto del título (pl-8 = icono size-6 + gap-2). Arranca a la altura de la tabla,
       igual en todos los perfiles (Ventas, Administración, China), así cambiar de vista no mueve el diseño. -->
  <header class="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div class="min-w-0">
      <h1 class="flex items-center gap-2 text-xl font-bold text-highlighted md:text-2xl">
        <UIcon :name="icon" class="size-6 shrink-0 text-primary" />
        <span class="truncate">{{ title }}</span>
      </h1>
      <p class="mt-0.5 pl-8 text-xs text-muted">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  subtitle?: string
  icon?: string
}>(), {
  title: 'Pago a Proveedor',
  subtitle: 'Pago a proveedor',
  icon: 'i-heroicons-banknotes'
})
</script>
