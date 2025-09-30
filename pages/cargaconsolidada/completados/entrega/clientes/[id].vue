<template>
  <div class="p-6">
    <PageHeader
      :title="`Consolidado #${carga || ''} | ${clienteNombre}`"
      :subtitle="clienteNombre || ''"
      icon=""
      :hide-back-button="false"
      @back="navigateTo(`/cargaconsolidada/completados/entrega/${contenedorId}`)"
    >
      <template #actions>
        <div class="flex gap-2">
          <UButton
            v-if="!editable"
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-heroicons-pencil-square"
            @click="toggleEdit"
          >Editar</UButton>
          <template v-else>
            <UButton
              size="xs"
              color="primary"
              icon="i-heroicons-device-floppy"
              :disabled="!dirty"
              @click="handleSave"
            >Guardar</UButton>
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              icon="i-heroicons-x-mark"
              @click="toggleEdit"
            >Cancelar</UButton>
          </template>
        </div>
      </template>
    </PageHeader>
    <div class="border-t mt-2 pt-4" />

    <div class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 space-y-6">
        <!-- Información de entrega -->
        <section>
          <h3 class="font-semibold mb-2 text-sm uppercase tracking-wide">Información de entrega:</h3>

          <!-- Selector de tipo entrega (T.Cliente) -->
          <div class="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs mb-4">
            <div class="col-span-2 lg:col-span-1">
              <Label small>T. Cliente:</Label>
              <USelect v-model="form.tipo_cliente" :options="['Lima','Provincia']" size="xs" disabled/>
            </div>
            <div class="col-span-2 lg:col-span-1">
              <Label small>Bultos:</Label>
              <UInput v-model="form.qty_item" size="xs" />
            </div>
            <div class="col-span-2 lg:col-span-1">
              <Label small>Peso:</Label>
              <UInput v-model="form.peso" size="xs" />
            </div>
            <div v-if="form.tipo_cliente === 'Lima'" class="col-span-2 lg:col-span-1">
              <Label small>Dni / Id:</Label>
              <UInput v-model="form.documento" size="xs" />
            </div>
            <div v-else class="col-span-2 lg:col-span-1">
              <Label small>Dni / Ruc:</Label>
              <UInput v-model="form.documento" size="xs" />
            </div>
            <div v-if="form.tipo_cliente === 'Lima'" class="col-span-2 lg:col-span-1">
              <Label small># Licencia (1):</Label>
              <UInput v-model="form.licencia1" size="xs" />
            </div>
          </div>

          <!-- Vista para Lima (Chofer) -->
          <div v-if="form.tipo_cliente === 'Lima'" class="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
            <div class="col-span-1">
              <Label small>Nombre completo del Chofer:</Label>
              <UInput v-model="form.nombre_chofer" size="xs" />
            </div>
            <div class="col-span-1">
              <Label small>Dirección final de destino:</Label>
              <UInput v-model="form.direccion_final" size="xs" />
            </div>
            <div class="col-span-1">
              <Label small>Distrito:</Label>
              <UInput v-model="form.distrito_final" size="xs" />
            </div>
          </div>

          <!-- Vista para clientes fuera de Lima (Agencia y Ubicación) -->
          <div v-else class="mt-2 space-y-3 text-xs">
            <div class="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <div class="col-span-2 lg:col-span-2">
                <Label small>Nombre:</Label>
                <UInput v-model="form.nombre" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-1">
                <Label small>Celular:</Label>
                <UInput v-model="form.celular" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-1">
                <Label small>Departamento:</Label>
                <UInput v-model="form.departamento" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-1">
                <Label small>Provincia:</Label>
                <UInput v-model="form.provincia" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-1">
                <Label small>Distrito:</Label>
                <UInput v-model="form.distrito" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-2">
                <Label small>Agencia:</Label>
                <UInput v-model="form.agencia" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-2">
                <Label small>Manifiesto:</Label>
                <UInput v-model="form.manifiesto" size="xs" />
              </div>
            </div>
          </div>
        </section>

        <!-- Información de comprobante -->
        <section class="pt-2">
          <h3 class="font-semibold mb-2 text-sm">Información de comprobante:</h3>
          <div class="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <div class="col-span-2 lg:col-span-1">
              <Label small>Dni / Ruc:</Label>
              <UInput v-model="form.documento" size="xs" />
            </div>
            <div class="col-span-2 lg:col-span-2">
              <Label small>Nombre:</Label>
              <UInput v-model="form.nombre" size="xs" />
            </div>
          </div>
        </section>

        <!-- Fotos de conformidad -->
        <section class="pt-4">
          <h3 class="font-semibold mb-2 text-sm">Foto de conformidad de entrega:</h3>
          <div class="flex gap-4">
            <div v-for="(f,i) in evidencia" :key="i" class="w-28 h-32 border rounded-lg flex flex-col items-center justify-center text-[10px] gap-2 relative">
              <span>foto {{ i + 1 }}</span>
              <UButton size="xs" icon="i-heroicons-trash" color="error" variant="ghost" class="absolute top-1 right-1" @click="removeFoto(i)" />
            </div>
            <div class="w-28 h-32 border-dashed border rounded-lg flex flex-col items-center justify-center text-[10px] gap-1 cursor-pointer" @click="addFoto">
              <UIcon name="i-heroicons-plus" class="w-5 h-5" />
              <span>Agregar</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useEntrega } from '@/composables/cargaconsolidada/entrega/useEntrega'
import { UInput, USelect, UButton, UIcon } from '#components'
import PageHeader from '~/components/PageHeader.vue'


// Props/params
const route = useRoute()
const id = Number(route.params.id) // id de cotizacion
// El id del contenedor se derivará desde el detalle (entregaDetalle.id_contenedor)
let contenedorId: number | null = null
const cotizacionId = ref<number | null>(isNaN(id) ? null : id)
// Obtener detalle desde composable (cache si se navegó desde listado)
const { getEntregasDetalle, entregaDetalle, loading, getHeaders, carga } = useEntrega()
// Nombre del cliente (razon_social si existe, sino nombre)
const clienteNombre = computed(() => (entregaDetalle.value as any)?.razon_social || entregaDetalle.value?.nombre || '')


// Formulario reactivo
const form = ref<any>({
  tipo_cliente: 'Lima',
  tipo_entrega: 'Lima',
  qty_item: '',
  peso: '',
  documento: '',
  licencia1: '',
  nombre_chofer: '',
  direccion_final: '',
  distrito: '',
  // Provincia
  nombre: '',
  celular: '',
  departamento: '',
  provincia: '',
  agencia: '',
  manifiesto: '',
  // Comprobante
  comp_documento: '',
  comp_nombre: ''
})

const initialSnapshot = ref<string>('')
const evidencia = ref<Array<any>>([{}, {}])
const editable = ref<boolean>(false) // En completados iniciamos en modo lectura

const snapshot = () => JSON.stringify(form.value)
const dirty = computed(() => snapshot() !== initialSnapshot.value)

const toggleEdit = () => {
  editable.value = !editable.value
  if (!editable.value) {
    form.value = JSON.parse(initialSnapshot.value)
  }
}

const handleSave = () => {
  initialSnapshot.value = snapshot()
  // TODO: service update
}

const addFoto = () => {
  if (!editable.value) return
  evidencia.value.push({})
}
const removeFoto = (i: number) => {
  if (!editable.value) return
  evidencia.value.splice(i, 1)
}

onMounted(async () => {
  // Cargar detalle si no está cacheado o corresponde a otro id
  if (!entregaDetalle.value || entregaDetalle.value.id_cotizacion !== cotizacionId.value) {
    await getEntregasDetalle(cotizacionId.value as number)
  }
  // Derivar contenedor desde el detalle si existe
  if (entregaDetalle.value?.id_contenedor) {
    contenedorId = entregaDetalle.value.id_contenedor as any
  }
  // Obtener headers/carga sólo si aún no está y tenemos id_contenedor
  if (contenedorId && !carga.value) {
    await getHeaders(contenedorId)
  }
  if (entregaDetalle.value) {
    // Inicializar formulario con datos del detalle
    form.value.qty_item = entregaDetalle.value.qty_item || ''
    form.value.peso = entregaDetalle.value.peso || ''
    form.value.documento = entregaDetalle.value.documento || ''
    form.value.nombre = entregaDetalle.value.nombre || ''
    form.value.tipo_cliente = (entregaDetalle.value as any).tipo_cliente || form.value.tipo_cliente
    form.value.tipo_entrega = entregaDetalle.value.tipo_entrega || form.value.tipo_entrega
  }
  initialSnapshot.value = snapshot()
})
</script>
