<template>
  <div class="space-y-4" aria-busy="true" aria-label="Cargando indicadores">
    <template v-if="tab === 'tiempos'">
      <section v-for="bloque in 2" :key="bloque" class="rounded-xl border border-default bg-default p-4">
        <USkeleton class="block h-4 w-40" />
        <USkeleton class="mt-2 block h-3 w-72" />
        <div class="mt-4 space-y-3">
          <USkeleton v-for="fila in 6" :key="fila" class="block h-8 w-full" />
        </div>
      </section>
    </template>

    <template v-else-if="tab === 'detalle'">
      <section class="rounded-xl border border-default bg-default p-4">
        <USkeleton class="block h-4 w-40" />
        <USkeleton class="mt-3 block h-64 w-full" />
      </section>
      <section v-for="bloque in 2" :key="bloque" class="space-y-4">
        <USkeleton class="block h-5 w-36" />
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div v-for="card in 4" :key="card" class="rounded-xl border border-default bg-default p-4">
            <USkeleton class="block h-3 w-16" />
            <USkeleton class="mt-3 block h-7 w-14" />
            <USkeleton class="mt-2 block h-3 w-24" />
          </div>
        </div>
        <div class="grid gap-4 xl:grid-cols-2">
          <div class="rounded-xl border border-default bg-default p-4">
            <USkeleton class="block h-4 w-24" />
            <USkeleton class="mt-3 block h-72 w-full" />
          </div>
          <div class="rounded-xl border border-default bg-default p-4">
            <USkeleton class="block h-4 w-32" />
            <div class="mt-4 space-y-3">
              <USkeleton v-for="fila in 4" :key="fila" class="block h-8 w-full" />
            </div>
          </div>
        </div>
      </section>
      <section class="rounded-xl border border-default bg-default p-4">
        <USkeleton class="block h-4 w-40" />
        <div class="mt-4 space-y-3">
          <USkeleton v-for="fila in 3" :key="fila" class="block h-8 w-full" />
        </div>
      </section>
      <section class="rounded-xl border border-default bg-default p-4">
        <USkeleton class="block h-4 w-56" />
        <USkeleton class="mt-3 block h-72 w-full" />
      </section>
    </template>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="card in 4" :key="card" class="rounded-xl border border-default bg-default p-4">
          <USkeleton class="block h-3 w-28" />
          <USkeleton class="mt-3 block h-8 w-16" />
          <USkeleton class="mt-3 block h-5 w-20 rounded-full" />
        </div>
      </div>
      <section class="rounded-xl border border-default bg-default p-4">
        <USkeleton class="block h-4 w-32" />
        <div class="mt-3 space-y-2">
          <USkeleton v-for="fila in 2" :key="fila" class="block h-8 w-full" />
        </div>
      </section>
      <div class="grid gap-4 xl:grid-cols-5">
        <section class="rounded-xl border border-default bg-default p-4 xl:col-span-3">
          <USkeleton class="block h-4 w-40" />
          <USkeleton class="mt-3 block h-80 w-full" />
        </section>
        <section class="rounded-xl border border-default bg-default p-4 xl:col-span-2">
          <USkeleton class="block h-4 w-48" />
          <USkeleton class="mt-3 block h-64 w-full" />
        </section>
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <section v-for="grafico in 4" :key="grafico" class="rounded-xl border border-default bg-default p-4">
          <USkeleton class="block h-4 w-40" />
          <USkeleton class="mt-3 block h-72 w-full" />
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tab: 'resumen' | 'detalle' | 'tiempos' }>()
</script>
