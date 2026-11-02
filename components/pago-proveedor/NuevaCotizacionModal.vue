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
        maxlength="10"
        placeholder="Ej: CO10261583"
        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 uppercase"
        @input="alEscribir"
        @keyup.enter="buscar"
      />
    </label>
    <p v-if="!codigo.trim()" class="text-xs text-gray-500">Escribe el número completo, por ejemplo CO10261583. De ahí se trae la información del cliente.</p>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div v-if="!resultado && !error" class="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      <p class="font-semibold text-gray-800">Aquí verás al cliente</p>
      <p class="mt-1">Su nombre, documento, el consolidado y sus proveedores aparecen al escribir un número válido.</p>
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
import type { PagoProveedorBusquedaCc } from '~/types/pago-proveedor'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; created: [id: number] }>()

const codigo = ref('')
const buscando = ref(false)
const creando = ref(false)
const error = ref('')
const resultado = ref<PagoProveedorBusquedaCc | null>(null)
let secuencia = 0

const puedeAceptar = computed(() => !!resultado.value && resultado.value.proveedores.length > 0 && !creando.value)

watch(() => props.open, (abierto) => {
  if (!abierto) return
  codigo.value = ''
  error.value = ''
  resultado.value = null
})

function alEscribir() {
  error.value = ''
  resultado.value = null
  const limpio = codigo.value.trim().toUpperCase()
  if (/^CO\d{8}$/.test(limpio)) buscar()
}

async function buscar() {
  const limpio = codigo.value.trim().toUpperCase()
  if (!/^CO\d{8}$/.test(limpio)) {
    error.value = limpio ? 'El número debe tener el formato CO y 8 dígitos.' : ''
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
