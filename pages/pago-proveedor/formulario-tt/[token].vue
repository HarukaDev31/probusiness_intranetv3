<template>
  <div class="mx-auto max-w-2xl p-6">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <p class="text-sm text-gray-500">Pro Business</p>
      <h1 class="text-2xl font-semibold">Datos bancarios para el pago</h1>
      <div v-if="cargando" class="py-8 text-gray-500">Cargando formulario…</div>
      <p v-else-if="error" class="mt-4 text-red-600">{{ error }}</p>
      <template v-else-if="formulario">
        <p class="mt-2 text-sm text-gray-600">{{ formulario.proveedor }}<span v-if="formulario.nombre_proveedor"> · {{ formulario.nombre_proveedor }}</span> · {{ formulario.producto }}</p>
        <p v-if="listo" class="mt-6 text-green-700">{{ mensaje || 'Estos datos ya fueron autorizados.' }}</p>
        <form v-else class="mt-6 space-y-4" @submit.prevent="enviar">
          <p v-if="formulario.correccion_solicitada && !editando" class="text-sm text-amber-800">Revisa los datos. Si hay que corregirlos, usa Editar datos y vuelve a autorizarlos.</p>
          <FormularioBancario v-model="datos" :bloqueado="bloqueado" />
          <label class="flex items-start gap-2 text-sm">
            <input v-model="autorizo" type="checkbox" class="mt-1" />
            Autorizo que estos datos sean utilizados para realizar el pago al proveedor.
          </label>
          <div class="flex gap-2">
            <UButton v-if="bloqueado" type="button" color="neutral" variant="soft" @click="editando = true">Editar datos</UButton>
            <UButton v-else type="submit" color="primary" :loading="enviando">Enviar</UButton>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import FormularioBancario from '~/components/pago-proveedor/FormularioBancario.vue'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const cargando = ref(true)
const enviando = ref(false)
const error = ref('')
const mensaje = ref('')
const listo = ref(false)
const editando = ref(false)
const autorizo = ref(false)
const formulario = ref<any>(null)
const datos = ref<Record<string, any>>({ banco_tipo_codigo: 'SWIFT', inter_tipo_codigo: 'SWIFT', usa_intermediario: false })

const bloqueado = computed(() => !!formulario.value?.correccion_solicitada && !editando.value && formulario.value?.estado === 'recibido')

async function enviar() {
  error.value = ''
  enviando.value = true
  try {
    const respuesta = await PagoProveedorService.guardarFormularioTt(String(route.params.token), { ...datos.value, autorizo: autorizo.value })
    mensaje.value = respuesta.data.mensaje
    listo.value = true
  } catch (err: any) {
    error.value = err.message || 'No se pudo enviar el formulario.'
  } finally {
    enviando.value = false
  }
}

onMounted(async () => {
  try {
    const respuesta = await PagoProveedorService.verFormularioTt(String(route.params.token))
    formulario.value = respuesta.data
    datos.value = { banco_tipo_codigo: 'SWIFT', inter_tipo_codigo: 'SWIFT', usa_intermediario: false, ...respuesta.data.datos }
    if (respuesta.data.bloqueado) listo.value = true
  } catch (err: any) {
    error.value = err.message || 'El enlace no es válido.'
  } finally {
    cargando.value = false
  }
})
</script>
