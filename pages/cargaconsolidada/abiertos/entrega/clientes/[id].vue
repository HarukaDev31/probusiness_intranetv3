<template>
  <div class="p-6">
    <PageHeader
      :title="`Consolidado #${carga || ''}.`"
      :subtitle="clienteNombre || ''"
      icon=""
      :hide-back-button="false"
      @back="navigateTo(`/cargaconsolidada/abiertos/entrega/${contenedorId}`)"
    />
    <div class="border-t mt-2 pt-4" />

    <div class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 space-y-6">
        <!-- Información de entrega -->
        <section>
          <h3 class="font-semibold mb-2 text-sm uppercase tracking-wide">Información de entrega:</h3>
          <div class="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <div class="col-span-2 lg:col-span-1">
              <Label small>Entrega:</Label>
              <USelect v-model="form.tipo_entrega" :options="['Lima','Provincia']" size="xs" />
            </div>
            <div class="col-span-2 lg:col-span-1">
              <Label small>Bultos:</Label>
              <UInput v-model="form.bultos" size="xs" />
            </div>
            <div class="col-span-2 lg:col-span-1">
              <Label small>Peso:</Label>
              <UInput v-model="form.peso" size="xs" placeholder="100kg" />
            </div>
            <div class="col-span-2 lg:col-span-1">
              <Label small>Dni / Id:</Label>
              <UInput v-model="form.documento" size="xs" />
            </div>
            <div class="col-span-2 lg:col-span-1">
              <Label small># Licencia (1):</Label>
              <UInput v-model="form.licencia1" size="xs" />
            </div>
            <div class="col-span-2 lg:col-span-1">
              <Label small># Licencia (2):</Label>
              <UInput v-model="form.licencia2" size="xs" />
            </div>
          </div>

          <!-- Condicional Lima / Provincia -->
          <div v-if="form.tipo_entrega === 'Lima'" class="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
            <div class="col-span-1 lg:col-span-1">
              <Label small>Nombre completo del Chofer :</Label>
              <UInput v-model="form.nombre_chofer" size="xs" />
            </div>
            <div class="col-span-1 lg:col-span-1">
              <Label small>Dirección final de destino:</Label>
              <UInput v-model="form.direccion_final" size="xs" />
            </div>
            <div class="col-span-1 lg:col-span-1">
              <Label small>Distrito:</Label>
              <UInput v-model="form.distrito" size="xs" />
            </div>
          </div>

          <div v-else-if="form.tipo_entrega === 'Provincia'" class="mt-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <div class="col-span-2 lg:col-span-1">
                <Label small>Dni/Ruc:</Label>
                <UInput v-model="form.documento" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-2">
                <Label small>Nombre:</Label>
                <UInput v-model="form.nombre" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-1">
                <Label small>Celular:</Label>
                <UInput v-model="form.celular" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-2">
                <Label small>Departamento *:</Label>
                <UInput v-model="form.departamento" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-2">
                <Label small>Provincia *:</Label>
                <UInput v-model="form.provincia" size="xs" />
              </div>
              <div class="col-span-2 lg:col-span-2">
                <Label small>Distrito *:</Label>
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
              <UInput v-model="form.comp_documento" size="xs" />
            </div>
            <div class="col-span-2 lg:col-span-2">
              <Label small>Nombre:</Label>
              <UInput v-model="form.comp_nombre" size="xs" />
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

      <!-- Panel lateral de ayuda -->
      <aside class="w-full lg:w-72 text-[11px] leading-relaxed space-y-4">
        <div>
          <h4 class="font-semibold mb-1">Estados:</h4>
          <p>- Pendiente</p>
          <p>- Entregado: se cambia automáticamente cuando se sube la foto de entrega</p>
        </div>
        <div>
          <h4 class="font-semibold mb-1">Acciones:</h4>
          <p>Editar: puedes editar cualquier información</p>
          <p>Guardar: se habilita al cambiar datos</p>
          <p>Bultos y peso: desde packing list</p>
          <p>Información de la entrega: formulario cliente</p>
          <p>Información del comprobante: formulario cliente</p>
        </div>
      </aside>
    </div>

    <div class="mt-6 flex gap-3">
      <UButton size="sm" color="primary" icon="i-heroicons-device-floppy" :disabled="!dirty" @click="handleSave">Guardar</UButton>
      <UButton size="sm" color="neutral" variant="outline" icon="i-heroicons-pencil-square" @click="toggleEdit">{{ editable ? 'Cancelar' : 'Editar' }}</UButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from '#imports'
import { UInput, USelect, UButton, UIcon } from '#components'
import PageHeader from '~/components/PageHeader.vue'

// Props/params
const route = useRoute()
const id = Number(route.params.id) // id de cotizacion
// Podríamos recibir id del contenedor vía query (?contenedor=XX)
const contenedorId = Number(route.query.contenedor) || 0

// Estado básico (placeholder: se integrará con service real luego)
const carga = ref<string | null>(null)
const clienteNombre = ref<string>('')

// Formulario reactivo
const form = ref<any>({
  tipo_entrega: 'Lima',
  bultos: '',
  peso: '',
  documento: '',
  licencia1: '',
  licencia2: '',
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
const evidencia = ref<Array<any>>([{},{ }])
const editable = ref<boolean>(true)

const snapshot = () => JSON.stringify(form.value)
const dirty = computed(() => snapshot() !== initialSnapshot.value)

const toggleEdit = () => {
  editable.value = !editable.value
  if (!editable.value) {
    // Reset cambios si cancela
    form.value = JSON.parse(initialSnapshot.value)
  }
}

const handleSave = () => {
  initialSnapshot.value = snapshot()
  // TODO: consumir servicio de guardado
}

const addFoto = () => {
  evidencia.value.push({})
}
const removeFoto = (i: number) => {
  evidencia.value.splice(i,1)
}

onMounted(() => {
  // TODO: fetch detalle del cliente entrega por id
  initialSnapshot.value = snapshot()
})
</script>
