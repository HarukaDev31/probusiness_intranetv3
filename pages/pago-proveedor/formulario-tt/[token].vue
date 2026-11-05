<template>
  <div class="mx-auto max-w-2xl p-6">
    <UCard>
      <p class="text-sm text-muted">Pro Business</p>
      <h1 class="text-2xl font-semibold text-highlighted">Datos bancarios para el pago</h1>
      <div v-if="cargando" class="mt-6 space-y-3">
        <USkeleton class="h-4 w-48" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-2/3" />
      </div>
      <UAlert v-else-if="error" class="mt-4" color="error" variant="subtle" :title="error" />
      <template v-else-if="formulario">
        <p class="mt-2 text-sm text-muted">{{ formulario.proveedor }}<span v-if="formulario.nombre_proveedor"> · {{ formulario.nombre_proveedor }}</span> · {{ formulario.producto }}</p>
        <UAlert v-if="listo" class="mt-6" color="success" variant="subtle" :title="mensaje || 'Estos datos ya fueron autorizados.'" />
        <form v-else class="mt-6 space-y-4" @submit.prevent="enviar">
          <p v-if="formulario.correccion_solicitada && !editando" class="text-sm text-warning">Revisa los datos. Si hay que corregirlos, usa Editar datos y vuelve a autorizarlos.</p>
          <FormularioBancario v-model="datos" :bloqueado="bloqueado" />
          <UCheckbox v-model="autorizo" label="Autorizo que estos datos sean utilizados para realizar el pago al proveedor." />
          <UAlert v-if="errorEnvio" color="error" variant="subtle" :title="errorEnvio" />
          <div class="flex gap-2">
            <UButton v-if="bloqueado" type="button" color="neutral" variant="soft" @click="editando = true">Editar datos</UButton>
            <UButton v-else type="submit" color="primary" :loading="enviando">Enviar</UButton>
          </div>
        </form>
      </template>
    </UCard>
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
const errorEnvio = ref('')
const mensaje = ref('')
const listo = ref(false)
const editando = ref(false)
const autorizo = ref(false)
const formulario = ref<any>(null)
const datos = ref<Record<string, any>>({ banco_tipo_codigo: 'SWIFT', inter_tipo_codigo: 'SWIFT', usa_intermediario: false })

const bloqueado = computed(() => !!formulario.value?.correccion_solicitada && !editando.value && formulario.value?.estado === 'recibido')

async function enviar() {
  errorEnvio.value = ''
  enviando.value = true
  try {
    const respuesta = await PagoProveedorService.guardarFormularioTt(String(route.params.token), { ...datos.value, autorizo: autorizo.value })
    mensaje.value = respuesta.data.mensaje
    listo.value = true
  } catch (err: any) {
    errorEnvio.value = err.message || 'No se pudo enviar el formulario.'
  } finally {
    enviando.value = false
  }
}

onMounted(async () => {
  try {
    const respuesta = await PagoProveedorService.verFormularioTt(String(route.params.token))
    formulario.value = respuesta.data
    datos.value = {
      ...respuesta.data.datos,
      banco_tipo_codigo: respuesta.data.datos?.banco_tipo_codigo || 'SWIFT',
      inter_tipo_codigo: respuesta.data.datos?.inter_tipo_codigo || 'SWIFT',
      usa_intermediario: !!respuesta.data.datos?.usa_intermediario
    }
    if (respuesta.data.bloqueado) listo.value = true
  } catch (err: any) {
    error.value = err.message || 'El enlace no es válido.'
  } finally {
    cargando.value = false
  }
})
</script>
