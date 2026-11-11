<template>
  <div class="md:p-6">
    <!-- Cabecera única: icono + nombre de la sección (título) y debajo «Pago a proveedor» en letra pequeña.
         Las vistas de Pago a Proveedor arrancan a la misma altura, así cambiar de pestaña no mueve el diseño. -->
    <header class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 text-xl font-bold text-highlighted md:text-2xl">
          <UIcon :name="icon" class="size-6 shrink-0 text-primary" />
          <span class="truncate">{{ title }}</span>
        </h1>
        <p class="mt-0.5 text-xs text-muted">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </div>
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
