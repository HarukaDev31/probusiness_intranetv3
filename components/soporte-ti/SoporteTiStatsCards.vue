<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <div class="rounded-xl border border-slate-200 bg-white p-3.5">
      <p class="mb-1 text-[10px] text-slate-500">Total</p>
      <p class="text-[20px] font-semibold">{{ stats.total }}</p>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-3.5">
      <p class="mb-1 text-[10px] text-slate-500">Pendientes</p>
      <p class="text-[20px] font-semibold text-amber-600">{{ stats.pendientes }}</p>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-3.5">
      <p class="mb-1 text-[10px] text-slate-500">En progreso</p>
      <p class="text-[20px] font-semibold text-blue-600">{{ stats.enProgreso }}</p>
    </div>
    <div class="rounded-xl border border-slate-200 bg-white p-3.5">
      <p class="mb-1 text-[10px] text-slate-500">Completadas</p>
      <p class="text-[20px] font-semibold text-green-600">{{ stats.operativas }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: { total: number; pendientes: number; enProgreso: number; operativas: number }
}>()
</script>
