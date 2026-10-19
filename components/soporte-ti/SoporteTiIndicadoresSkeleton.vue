<template>
  <div class="space-y-4" aria-busy="true" aria-label="Cargando indicadores">
    <template v-if="tab === 'tiempos'">
      <section v-for="bloque in 2" :key="bloque" class="rounded-xl border border-default bg-default p-4">
        <USkeleton class="h-4 w-40" />
        <USkeleton class="mt-2 h-3 w-72" />
        <div class="mt-4 space-y-3">
          <USkeleton v-for="fila in 6" :key="fila" class="h-8 w-full" />
        </div>
      </section>
    </template>
    <template v-else-if="tab === 'detalle'">
      <USkeleton class="h-64 w-full rounded-xl" />
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <USkeleton v-for="card in 4" :key="card" class="h-24 rounded-xl" />
      </div>
      <USkeleton class="h-72 w-full rounded-xl" />
    </template>
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <USkeleton v-for="card in 4" :key="card" class="h-28 rounded-xl" />
      </div>
      <USkeleton class="h-24 w-full rounded-xl" />
      <div class="grid gap-4 xl:grid-cols-5">
        <USkeleton class="h-80 rounded-xl xl:col-span-3" />
        <USkeleton class="h-80 rounded-xl xl:col-span-2" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tab: 'resumen' | 'detalle' | 'tiempos' }>()
</script>
