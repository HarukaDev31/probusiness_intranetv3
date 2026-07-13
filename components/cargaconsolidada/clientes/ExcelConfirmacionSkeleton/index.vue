<script setup lang="ts">
withDefaults(
  defineProps<{
    productCount?: number
  }>(),
  { productCount: 2 }
)
</script>

<template>
  <div class="space-y-4" aria-busy="true" aria-label="Cargando confirmación">
    <div class="rounded-lg border border-gray-200 bg-white p-1.5">
      <div class="flex gap-1.5 overflow-hidden">
        <USkeleton
          v-for="n in 3"
          :key="`tab-${n}`"
          class="h-9 rounded-lg"
          :class="n === 1 ? 'flex-[1.4]' : 'flex-1'"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <USkeleton class="h-6 w-44 rounded-full" />
      <div class="flex flex-wrap gap-2">
        <USkeleton class="h-8 w-32 rounded-md" />
        <USkeleton class="h-8 w-24 rounded-md" />
      </div>
    </div>

    <div
      v-for="n in productCount"
      :key="`product-${n}`"
      class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      :class="{ 'opacity-80': n > 1 }"
    >
      <div class="px-3 py-2.5 flex items-center gap-2.5 border-b border-gray-100">
        <USkeleton class="size-8 rounded-lg shrink-0" />
        <USkeleton class="h-4 flex-1 max-w-[58%] rounded-md" />
        <USkeleton class="h-5 w-14 rounded-full shrink-0" />
        <USkeleton class="size-4 rounded shrink-0" />
      </div>

      <div v-if="n === 1" class="p-4 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-stretch">
          <div class="space-y-3">
            <USkeleton class="min-h-44 w-full rounded-xl" />
            <div class="space-y-1.5">
              <USkeleton class="h-3 w-24 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2 space-y-1.5">
              <USkeleton class="h-3 w-28 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
            <div v-for="field in 4" :key="`field-${field}`" class="space-y-1.5">
              <USkeleton class="h-3 w-16 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
            <div class="col-span-2 space-y-1.5">
              <USkeleton class="h-3 w-20 rounded-md" />
              <USkeleton class="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>

        <div class="pt-1 border-t border-gray-100">
          <div class="flex items-center gap-2 py-2">
            <USkeleton class="size-4 rounded-md shrink-0" />
            <USkeleton class="h-4 w-32 rounded-md" />
            <USkeleton class="h-5 w-10 rounded-full ms-auto" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
            <div v-for="car in 4" :key="`car-${car}`" class="space-y-1.5">
              <USkeleton class="h-3 w-20 rounded-md" />
              <USkeleton class="h-8 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
