<template>
  <div class="md:p-6">
    <!-- Cabecera única: las tres vistas de Pago a Proveedor arrancan a la misma altura
         (título + subtítulo + acciones), así cambiar de pestaña no mueve el diseño. -->
    <header class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 text-xl font-bold text-highlighted md:text-2xl">
          <UIcon name="i-heroicons-banknotes" class="size-6 shrink-0 text-primary" />
          <span class="truncate">{{ title }}</span>
        </h1>
        <p class="mt-1 text-sm text-muted">{{ subtitle }}</p>
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
}>(), {
  title: 'Pago a Proveedor',
  subtitle: 'Solicitudes, aprobación y ejecución de pagos a proveedores.'
})
</script>
