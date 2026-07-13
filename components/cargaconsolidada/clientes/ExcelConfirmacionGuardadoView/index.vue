<script setup lang="ts">
const props = defineProps<{
  basePath: string
  backBasePath: string
}>()

const route = useRoute()
const uuid = computed(() => String(route.params.uuid || ''))
const contenedorId = computed(() => String(route.query.contenedor || ''))
const tabQuery = computed(() => String(route.query.tab || 'general'))
const clienteQueryName = computed(() => String(route.query.cliente || ''))
const carga = computed(() => String(route.query.carga || ''))
const mensaje = computed(() => String(route.query.mensaje || '').trim())

const pageTitle = computed(() => clienteQueryName.value || 'Cliente')
const pageSubtitle = computed(() => {
  const parts = ['Confirmación guardada']
  if (carga.value) parts.push(`Carga #${carga.value}`)
  return parts.join(' · ')
})

const volverAEditar = () => {
  navigateTo({
    path: `${props.basePath}/clientes/excel-confirmacion/${uuid.value}`,
    query: {
      ...(contenedorId.value ? { contenedor: contenedorId.value } : {}),
      ...(tabQuery.value ? { tab: tabQuery.value } : {}),
      ...(clienteQueryName.value ? { cliente: clienteQueryName.value } : {})
    }
  })
}

const volverAClientes = () => {
  if (contenedorId.value) {
    navigateTo({
      path: `${props.backBasePath}/clientes/${contenedorId.value}`,
      query: { tab: tabQuery.value }
    })
    return
  }
  navigateTo(`${props.backBasePath}/clientes`)
}
</script>

<template>
  <div class="md:p-6">
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      icon="i-heroicons-check-circle"
      @back="volverAClientes"
    />

    <div class="max-w-lg mx-auto mt-6">
      <div class="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-10 text-center">
        <div class="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-success-50 ring-4 ring-success-100">
          <UIcon name="i-heroicons-check-circle" class="size-9 text-success-600" />
        </div>

        <h2 class="text-xl font-semibold text-gray-900">
          Cambios guardados
        </h2>

        <p class="mt-2 text-sm text-gray-600 leading-relaxed">
          {{ mensaje || 'La confirmación del cliente se actualizó correctamente.' }}
        </p>

        <p v-if="clienteQueryName" class="mt-4 text-xs text-gray-500">
          {{ clienteQueryName }}<template v-if="carga"> · Carga #{{ carga }}</template>
        </p>

        <div class="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
          <UButton
            color="primary"
            icon="i-heroicons-pencil-square"
            label="Volver a editar"
            class="justify-center"
            @click="volverAEditar"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-left"
            label="Volver a clientes"
            class="justify-center"
            @click="volverAClientes"
          />
        </div>
      </div>
    </div>
  </div>
</template>
