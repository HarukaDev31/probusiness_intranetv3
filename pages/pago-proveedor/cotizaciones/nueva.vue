<template>
  <div class="mx-auto max-w-2xl p-6">
    <button type="button" class="mb-4 text-sm text-gray-500" @click="navigateTo('/pago-proveedor/cotizaciones')">← Cotizaciones</button>
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 class="text-xl font-semibold text-gray-900">Nueva cotización</h1>
      <p class="mt-1 text-sm text-gray-500">Empieza con el número de la cotización de Carga Consolidada.</p>

      <label class="mt-6 block text-sm font-medium text-gray-700">
        N.° de cotización de Consolidada
        <input
          v-model="codigo"
          type="text"
          maxlength="10"
          placeholder="CO10261583"
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 uppercase"
          @keyup.enter="buscar"
        />
      </label>
      <UButton class="mt-3" color="primary" :loading="buscando" @click="buscar">Buscar</UButton>

      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>

      <div v-if="resultado" class="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p class="font-medium text-gray-900">{{ resultado.cliente.nombre || 'Sin nombre' }}</p>
        <p class="text-sm text-gray-600">{{ resultado.cliente.documento || 'Sin documento' }}</p>
        <p class="mt-2 text-sm">Consolidado: {{ resultado.consolidado || '—' }}</p>
        <p class="text-sm">Proveedores con código: {{ resultado.proveedores.length }}</p>
        <p v-if="resultado.aviso" class="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ resultado.aviso }}</p>
        <UButton class="mt-4" color="primary" :loading="creando" :disabled="resultado.proveedores.length === 0" @click="aceptar">
          Aceptar
        </UButton>
        <p v-if="resultado.proveedores.length === 0" class="mt-2 text-sm text-red-600">
          Este consolidado todavía no tiene códigos de proveedor. No se puede cotizar el pago.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PagoProveedorBusquedaCc } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'

const codigo = ref('')
const buscando = ref(false)
const creando = ref(false)
const error = ref('')
const resultado = ref<PagoProveedorBusquedaCc | null>(null)

async function buscar() {
  error.value = ''
  resultado.value = null
  const limpio = codigo.value.trim().toUpperCase()
  if (!/^CO\d{8}$/.test(limpio)) {
    error.value = 'El número debe tener el formato CO y 8 dígitos.'
    return
  }
  buscando.value = true
  try {
    const respuesta = await PagoProveedorService.buscarConsolidada(limpio)
    resultado.value = respuesta.data
  } catch (err: any) {
    error.value = err.message || 'No se encontró la cotización.'
  } finally {
    buscando.value = false
  }
}

async function aceptar() {
  if (!resultado.value) return
  creando.value = true
  error.value = ''
  try {
    const creada = await PagoProveedorService.crearCotizacion(resultado.value.cod_cotizacion_cc)
    await navigateTo(`/pago-proveedor/cotizaciones/${creada.data.id}`)
  } catch (err: any) {
    error.value = err.message || 'No se pudo crear la cotización.'
  } finally {
    creando.value = false
  }
}
</script>
