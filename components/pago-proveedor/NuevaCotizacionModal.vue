<template>
  <SupplierPaymentWindow
    :open="open"
    title="Nueva cotización"
    subtitle="Parte de la cotización de Consolidada del cliente"
    @close="cerrar"
  >
    <div class="flex items-center gap-2 text-xs">
      <span class="font-semibold text-primary-700">1 · N.° de cotización</span>
      <span class="h-px flex-1 bg-gray-200" />
      <span class="text-gray-400">2 · Formulario</span>
    </div>

    <label class="text-sm font-medium text-gray-700">
      N.° de cotización de Consolidada <span class="text-red-600">*</span>
      <input
        v-model="codigo"
        type="text"
        placeholder="Código, cliente o documento"
        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        autocomplete="off"
        @focus="listaAbierta = true"
        @input="alEscribir"
      />
    </label>
    <div v-if="listaAbierta && codigo.trim().length >= 2" class="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div v-if="buscandoLista" class="space-y-2 p-3">
        <USkeleton class="h-8 w-full" />
        <USkeleton class="h-8 w-full" />
        <USkeleton class="h-8 w-3/4" />
      </div>
      <p v-else-if="!sugerencias.length" class="px-3 py-4 text-sm text-gray-500">No hay cotizaciones con ese texto.</p>
      <ul v-else class="max-h-56 overflow-y-auto">
        <li v-for="item in sugerencias" :key="item.cod_cotizacion_cc">
          <button type="button" class="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-primary-50" @click="elegir(item)">
            <span>
              <span class="block text-sm font-bold text-gray-900">{{ item.cod_cotizacion_cc }}</span>
              <span class="block text-xs text-gray-500">{{ item.cliente_nombre || 'Sin nombre' }}<span v-if="item.cliente_documento"> · {{ item.cliente_documento }}</span></span>
            </span>
            <span class="shrink-0 text-xs text-gray-400">{{ item.consolidado || '—' }}</span>
          </button>
        </li>
      </ul>
      <div v-if="paginacion.last_page > 1" class="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
        <span>{{ paginacion.current_page }} de {{ paginacion.last_page }}</span>
        <span class="flex gap-2">
          <button type="button" class="font-semibold text-primary-600 disabled:text-gray-300" :disabled="paginacion.current_page <= 1 || buscandoLista" @click="irPagina(paginacion.current_page - 1)">Anterior</button>
          <button type="button" class="font-semibold text-primary-600 disabled:text-gray-300" :disabled="paginacion.current_page >= paginacion.last_page || buscandoLista" @click="irPagina(paginacion.current_page + 1)">Siguiente</button>
        </span>
      </div>
    </div>
    <p v-if="codigo.trim().length < 2" class="text-xs text-gray-500">Escribe al menos 2 letras o números. Puedes buscar por el código, el cliente o el documento.</p>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div v-if="!resultado && !error" class="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      <p class="font-semibold text-gray-800">Aquí verás al cliente</p>
      <p class="mt-1">Su nombre, documento, el consolidado y sus proveedores aparecen al elegir una cotización de la lista.</p>
    </div>

    <div v-if="resultado" class="rounded-2xl border border-gray-200 bg-white p-4">
      <p class="text-sm font-semibold text-green-700">Cotización de Consolidada encontrada: {{ resultado.cod_cotizacion_cc }}</p>
      <p class="mt-2 text-base font-bold text-gray-900">{{ resultado.cliente.nombre || 'Sin nombre' }}</p>
      <p class="text-sm text-gray-500">DNI / RUC · {{ resultado.cliente.documento || '—' }}</p>
      <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt class="text-xs text-gray-500">Consolidado</dt><dd class="font-semibold">{{ resultado.consolidado || '—' }}</dd></div>
        <div><dt class="text-xs text-gray-500">Proveedores</dt><dd class="font-semibold">{{ resultado.proveedores.length }}</dd></div>
      </dl>
      <div v-if="resultado.proveedores.length" class="mt-2 flex flex-wrap gap-1.5">
        <span v-for="proveedor in resultado.proveedores" :key="proveedor.id_proveedor_cc" class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {{ proveedor.code_supplier }}
        </span>
      </div>
      <p v-if="resultado.aviso" class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ resultado.aviso }}</p>
      <p v-if="!resultado.proveedores.length" class="mt-3 text-sm text-red-600">Este consolidado todavía no tiene códigos de proveedor. No se puede cotizar el pago.</p>
    </div>

    <template #footer>
      <UButton color="neutral" variant="outline" @click="cerrar">Cancelar</UButton>
      <UButton color="primary" :loading="creando || buscando" :disabled="!puedeAceptar" @click="aceptar">Aceptar</UButton>
    </template>
  </SupplierPaymentWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { PagoProveedorBusquedaCc, PagoProveedorPaginacion, PagoProveedorSugerenciaCc } from '~/types/pago-proveedor'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; created: [id: number] }>()

const codigo = ref('')
const buscando = ref(false)
const buscandoLista = ref(false)
const creando = ref(false)
const listaAbierta = ref(false)
const error = ref('')
const resultado = ref<PagoProveedorBusquedaCc | null>(null)
const sugerencias = ref<PagoProveedorSugerenciaCc[]>([])
const paginacion = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 8, total: 0 })
let secuencia = 0
let listaSecuencia = 0
let espera: ReturnType<typeof setTimeout> | undefined

const puedeAceptar = computed(() => !!resultado.value && resultado.value.proveedores.length > 0 && !creando.value)

watch(() => props.open, (abierto) => {
  if (!abierto) return
  codigo.value = ''
  error.value = ''
  resultado.value = null
  sugerencias.value = []
  listaAbierta.value = false
  paginacion.value = { current_page: 1, last_page: 1, per_page: 8, total: 0 }
})

function alEscribir() {
  error.value = ''
  resultado.value = null
  listaAbierta.value = true
  if (espera) clearTimeout(espera)
  espera = setTimeout(() => cargarSugerencias(1), 250)
}

function irPagina(page: number) {
  cargarSugerencias(page)
}

async function cargarSugerencias(page: number) {
  const texto = codigo.value.trim()
  if (texto.length < 2) {
    sugerencias.value = []
    return
  }
  const actual = ++listaSecuencia
  buscandoLista.value = true
  try {
    const respuesta = await PagoProveedorService.sugerirConsolidada({ q: texto, page, per_page: 8 })
    if (actual !== listaSecuencia) return
    sugerencias.value = respuesta.data || []
    paginacion.value = respuesta.pagination
  } catch (err: any) {
    if (actual !== listaSecuencia) return
    sugerencias.value = []
    error.value = err?.data?.message || err?.message || 'No se pudo buscar.'
  } finally {
    if (actual === listaSecuencia) buscandoLista.value = false
  }
}

function elegir(item: PagoProveedorSugerenciaCc) {
  codigo.value = item.cod_cotizacion_cc
  listaAbierta.value = false
  buscar()
}

async function buscar() {
  const limpio = codigo.value.trim().toUpperCase()
  if (!/^CO\d{8}$/.test(limpio)) {
    error.value = 'Elige una cotización de la lista.'
    resultado.value = null
    return
  }
  const actual = ++secuencia
  buscando.value = true
  error.value = ''
  try {
    const respuesta = await PagoProveedorService.buscarConsolidada(limpio)
    if (actual !== secuencia) return
    resultado.value = respuesta.data
  } catch (err: any) {
    if (actual !== secuencia) return
    resultado.value = null
    error.value = err?.data?.message || err?.message || 'No encontramos esa cotización de Consolidada. Revisa el número.'
  } finally {
    if (actual === secuencia) buscando.value = false
  }
}

async function aceptar() {
  if (!resultado.value || !puedeAceptar.value) return
  creando.value = true
  error.value = ''
  try {
    const creada = await PagoProveedorService.crearCotizacion(resultado.value.cod_cotizacion_cc)
    emit('created', creada.data.id)
    emit('close')
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'No se pudo crear la cotización.'
  } finally {
    creando.value = false
  }
}

function cerrar() {
  emit('close')
}
</script>
