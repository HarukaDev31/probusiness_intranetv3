<template>
  <div class="mx-auto max-w-5xl p-6">
    <button type="button" class="mb-4 text-sm text-gray-500" @click="navigateTo('/pago-proveedor/cotizaciones')">← Cotizaciones</button>
    <div v-if="cargando" class="py-12 text-center text-gray-500">Cargando cotización…</div>

    <form v-else-if="cotizacion" class="space-y-4" @submit.prevent="guardar">
      <header class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm text-gray-500">{{ cotizacion.codigo }} · {{ cotizacion.cod_cotizacion_cc }}</p>
            <h1 class="text-2xl font-semibold">{{ cotizacion.cliente_nombre || 'Cliente' }}</h1>
            <p class="mt-1 text-sm text-gray-600">
              {{ cotizacion.cliente_documento || 'Sin documento' }} · {{ cotizacion.consolidado || 'Sin consolidado' }}
            </p>
          </div>
          <div class="text-right text-sm">
            <p :class="cotizacion.vencida ? 'text-red-600' : 'text-gray-600'">{{ cotizacion.vigencia_texto }}</p>
            <p class="mt-1 font-medium">{{ cotizacion.estado === 'confirmada' ? 'Confirmada' : 'Pendiente' }}</p>
          </div>
        </div>
        <p v-if="cotizacion.solicitud_id" class="mt-4 text-sm">
          <NuxtLink :to="`/pago-proveedor/solicitudes/${cotizacion.solicitud_id}`" class="text-orange-600">Ver solicitud</NuxtLink>
        </p>
      </header>

      <section v-for="(proveedor, indice) in proveedores" :key="proveedor.id || `nuevo-${indice}`" class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-semibold">Proveedor {{ indice + 1 }}</h2>
          <button v-if="editable && proveedores.length > 1" type="button" class="text-sm text-red-600" @click="quitar(indice)">Quitar</button>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="text-sm">Código de proveedor
            <select v-model="proveedor.code_supplier" :disabled="!editable" class="campo" @change="alElegirCodigo(proveedor)">
              <option value="">Selecciona</option>
              <option v-for="codigo in cotizacion.codigos_disponibles" :key="codigo.code_supplier" :value="codigo.code_supplier">
                {{ codigo.code_supplier }}
              </option>
            </select>
          </label>
          <label class="text-sm">Nombre del proveedor (opcional)
            <input v-model="proveedor.nombre_proveedor" :disabled="!editable" class="campo" />
          </label>
          <label class="text-sm md:col-span-2">Producto
            <input v-model="proveedor.producto" :disabled="!editable" class="campo" />
          </label>
          <label class="text-sm">Moneda
            <select v-model="proveedor.moneda" :disabled="!editable" class="campo" @change="alCambiarMoneda(proveedor)">
              <option value="RMB">RMB / Transferencia</option>
              <option value="USD">USD / T-T</option>
            </select>
          </label>
          <label class="text-sm">Tipo de pago
            <select v-model="proveedor.tipo_pago" disabled class="campo">
              <option value="transferencia">RMB / Transferencia</option>
              <option value="tt">USD / T-T</option>
              <option value="tarjeta" disabled>USD / Tarjeta · Próximamente</option>
            </select>
          </label>
          <label class="text-sm">Valor de carga (USD)
            <input v-model.number="proveedor.valor_carga_usd" :disabled="!editable" type="number" min="0" step="0.01" class="campo" />
          </label>
          <label class="text-sm">Abono del cliente
            <select v-model="proveedor.modalidad_abono" :disabled="!editable" class="campo" @change="alCambiarAbono(proveedor)">
              <option value="total">Total</option>
              <option value="fraccionado">Fraccionado en 2 cuotas</option>
            </select>
          </label>
          <label class="text-sm">Pago al proveedor
            <select v-model="proveedor.modalidad_pago" :disabled="!editable || proveedor.moneda === 'USD'" class="campo">
              <option value="total">Total</option>
              <option value="fraccionado">Fraccionado en 2 pagos</option>
            </select>
          </label>
          <label v-if="fraccionado(proveedor)" class="text-sm">Distribución
            <select v-model="proveedor.porcentaje_1" :disabled="!editable" class="campo" @change="alCambiarPorcentaje(proveedor)">
              <option :value="50">50% / 50%</option>
              <option :value="60">60% / 40%</option>
              <option :value="70">70% / 30%</option>
              <option :value="40">40% / 60%</option>
              <option :value="30">30% / 70%</option>
            </select>
          </label>
          <label v-if="proveedor.modalidad_abono === 'fraccionado'" class="text-sm">Fecha aproximada de la cuota 2
            <input v-model="proveedor.fecha_cuota_2" :disabled="!editable" type="date" class="campo" />
          </label>
        </div>

        <div class="mt-4 flex flex-wrap gap-4 text-sm">
          <label class="flex items-center gap-2"><input v-model="proveedor.comision_bancaria" :disabled="!editable" type="checkbox" /> Comisión bancaria / plataforma</label>
          <label class="flex items-center gap-2"><input v-model="proveedor.comision_administrativa" :disabled="!editable" type="checkbox" /> Comisión administrativa</label>
        </div>

        <div class="mt-4 text-sm">
          <p v-if="proveedor.proforma_nombre" class="text-gray-600">
            Proforma: {{ proveedor.proforma_nombre }}
            <a v-if="proveedor.proforma_url" :href="proveedor.proforma_url" target="_blank" class="ml-2 text-orange-600">Ver</a>
          </p>
          <label v-if="editable" class="mt-2 block">
            {{ proveedor.id ? 'Adjuntar proforma (PDF, JPG, PNG, Word o Excel)' : 'Guarda la cotización para adjuntar la proforma' }}
            <input v-if="proveedor.id" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" class="mt-1 block text-sm" @change="subirProforma(proveedor, $event)" />
          </label>
        </div>

        <p v-if="proveedor.calculo" class="mt-4 text-sm text-gray-700">
          Bancaria:
          <span class="font-medium">{{ proveedor.calculo.etiqueta_bancaria || `$${dinero(proveedor.calculo.bancaria)}` }}</span>
          · Administrativa: ${{ dinero(proveedor.calculo.administrativa) }}
          · Total: ${{ dinero(proveedor.calculo.total) }}
        </p>
      </section>

      <button v-if="editable" type="button" class="text-sm font-medium text-orange-600" @click="agregar">+ Agregar proveedor</button>

      <section class="rounded-xl border border-orange-200 bg-orange-50 p-5">
        <div class="grid gap-4 md:grid-cols-3">
          <label class="text-sm">Tipo de cambio (¥ por $)
            <input v-model.number="tipoCambio" :disabled="!editable" type="number" min="0" step="0.0001" class="campo" />
          </label>
          <label class="mt-6 flex items-center gap-2 text-sm">
            <input v-model="tipoCambioConfirmado" :disabled="!editable" type="checkbox" />
            Tipo de cambio confirmado
          </label>
          <div class="text-sm">
            <p class="text-gray-500">Total a pagar ahora</p>
            <p class="text-2xl font-semibold text-orange-600">${{ dinero(cotizacion.total_ahora) }}</p>
            <p class="text-gray-500">Total del servicio ${{ dinero(cotizacion.total) }}</p>
          </div>
        </div>
        <ul v-if="editable && cotizacion.faltantes.length" class="mt-4 list-disc pl-5 text-sm text-gray-700">
          <li v-for="falta in cotizacion.faltantes" :key="falta">{{ falta }}</li>
        </ul>
      </section>

      <div v-if="vistaPrevia" class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="font-semibold">Vista previa de WhatsApp</h2>
        <pre class="mt-3 whitespace-pre-wrap text-sm">{{ vistaPrevia.texto }}</pre>
        <p class="mt-2 text-sm text-gray-500">{{ vistaPrevia.nota }}</p>
      </div>

      <section v-if="cotizacion.historial?.length" class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="font-semibold">Historial</h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="(evento, i) in cotizacion.historial" :key="i">
            <span class="text-gray-500">{{ formatearFecha(evento.fecha) }}</span>
            · {{ evento.usuario }} · {{ evento.accion }}
            <span v-if="evento.detalle"> — {{ evento.detalle }}</span>
          </li>
        </ul>
      </section>

      <div v-if="editable" class="flex flex-wrap gap-2">
        <UButton type="submit" color="primary" :loading="guardando">Guardar cotización</UButton>
        <UButton type="button" color="neutral" variant="soft" :loading="generandoPdf" @click="descargarPdf">Descargar PDF</UButton>
        <UButton type="button" color="neutral" variant="soft" :loading="enviando" @click="prepararWhatsapp">Enviar resumen por WhatsApp</UButton>
        <UButton v-if="cotizacion.puede_renovar" type="button" color="warning" variant="soft" @click="renovar">Renovar</UButton>
        <UButton type="button" color="primary" variant="outline" :loading="creandoSolicitud" @click="crearSolicitud">Guardar y crear solicitud</UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { PagoProveedorCotizacion, PagoProveedorProveedor } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import { useModal } from '~/composables/commons/useModal'

const route = useRoute()
const { showSuccess, showError } = useModal()
const cargando = ref(true)
const guardando = ref(false)
const generandoPdf = ref(false)
const enviando = ref(false)
const creandoSolicitud = ref(false)
const cotizacion = ref<PagoProveedorCotizacion | null>(null)
const proveedores = ref<PagoProveedorProveedor[]>([])
const tipoCambio = ref<number | null>(null)
const tipoCambioConfirmado = ref(false)
const vistaPrevia = ref<{ texto: string; nota: string } | null>(null)

const editable = computed(() => !!cotizacion.value?.puede_editar)
const dinero = (valor: number) => Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fraccionado(proveedor: PagoProveedorProveedor) {
  return proveedor.modalidad_abono === 'fraccionado' || (proveedor.moneda === 'RMB' && proveedor.modalidad_pago === 'fraccionado')
}

function aplicar(datos: PagoProveedorCotizacion) {
  cotizacion.value = datos
  proveedores.value = datos.proveedores.map(proveedor => ({ ...proveedor, code_supplier: proveedor.code_supplier || '' }))
  tipoCambio.value = datos.tipo_cambio
  tipoCambioConfirmado.value = datos.tipo_cambio_confirmado
}

function payload() {
  return {
    tipo_cambio: tipoCambio.value,
    tipo_cambio_confirmado: tipoCambioConfirmado.value,
    proveedores: proveedores.value.map((proveedor) => ({
      id: proveedor.id,
      code_supplier: proveedor.code_supplier || null,
      nombre_proveedor: proveedor.nombre_proveedor,
      producto: proveedor.producto,
      moneda: proveedor.moneda,
      tipo_pago: proveedor.moneda === 'USD' ? 'tt' : 'transferencia',
      valor_carga_usd: proveedor.valor_carga_usd || 0,
      modalidad_abono: proveedor.modalidad_abono,
      modalidad_pago: proveedor.moneda === 'USD' ? proveedor.modalidad_abono : proveedor.modalidad_pago,
      porcentaje_1: Number(proveedor.porcentaje_1 || 50),
      porcentaje_2: 100 - Number(proveedor.porcentaje_1 || 50),
      fecha_cuota_2: proveedor.fecha_cuota_2,
      comision_bancaria: proveedor.comision_bancaria,
      comision_administrativa: proveedor.comision_administrativa
    }))
  }
}

function alElegirCodigo(proveedor: PagoProveedorProveedor) {
  const catalogo = cotizacion.value?.codigos_disponibles.find(item => item.code_supplier === proveedor.code_supplier)
  if (!catalogo) return
  if (!proveedor.producto && catalogo.producto) proveedor.producto = catalogo.producto
  if (!proveedor.nombre_proveedor && catalogo.nombre) proveedor.nombre_proveedor = catalogo.nombre
}

function alCambiarMoneda(proveedor: PagoProveedorProveedor) {
  proveedor.tipo_pago = proveedor.moneda === 'USD' ? 'tt' : 'transferencia'
  if (proveedor.moneda === 'USD') proveedor.modalidad_pago = proveedor.modalidad_abono
}

function alCambiarAbono(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') proveedor.modalidad_pago = proveedor.modalidad_abono
  if (proveedor.modalidad_abono === 'fraccionado' && ![30, 40, 50, 60, 70].includes(Number(proveedor.porcentaje_1))) {
    proveedor.porcentaje_1 = 50
    proveedor.porcentaje_2 = 50
  }
}

function alCambiarPorcentaje(proveedor: PagoProveedorProveedor) {
  proveedor.porcentaje_2 = 100 - Number(proveedor.porcentaje_1)
}

function agregar() {
  proveedores.value.push({
    orden: proveedores.value.length + 1,
    code_supplier: '',
    nombre_proveedor: '',
    producto: '',
    moneda: 'RMB',
    tipo_pago: 'transferencia',
    valor_carga_usd: 0,
    modalidad_abono: 'total',
    modalidad_pago: 'total',
    porcentaje_1: 100,
    porcentaje_2: null,
    fecha_cuota_2: null,
    comision_bancaria: true,
    comision_administrativa: false
  })
}

function quitar(indice: number) {
  proveedores.value.splice(indice, 1)
}

async function guardar() {
  if (!cotizacion.value) return
  guardando.value = true
  try {
    const respuesta = await PagoProveedorService.guardarCotizacion(cotizacion.value.id, payload())
    aplicar(respuesta.data)
    showSuccess('Cotización guardada', cotizacion.value.codigo)
  } catch (error: any) {
    showError('No se pudo guardar', error.message || 'Revisa los datos.')
  } finally {
    guardando.value = false
  }
}

async function subirProforma(proveedor: PagoProveedorProveedor, evento: Event) {
  const archivo = (evento.target as HTMLInputElement).files?.[0]
  if (!archivo || !cotizacion.value || !proveedor.id) return
  try {
    const respuesta = await PagoProveedorService.subirProforma(cotizacion.value.id, proveedor.id, archivo)
    aplicar(respuesta.data)
    showSuccess('Proforma cargada', archivo.name)
  } catch (error: any) {
    showError('Proforma', error.message || 'No se pudo subir el archivo.')
  }
}

async function descargarPdf() {
  if (!cotizacion.value) return
  generandoPdf.value = true
  try {
    await guardarSilencioso()
    const respuesta = await PagoProveedorService.descargarPdf(cotizacion.value.id)
    const binario = atob(respuesta.data.base64)
    const bytes = new Uint8Array(binario.length)
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = respuesta.data.filename
    enlace.click()
    URL.revokeObjectURL(url)
  } catch (error: any) {
    showError('PDF', error.message || 'No se pudo generar el resumen.')
  } finally {
    generandoPdf.value = false
  }
}

async function prepararWhatsapp() {
  if (!cotizacion.value) return
  enviando.value = true
  try {
    await guardarSilencioso()
    const respuesta = await PagoProveedorService.vistaPreviaWhatsapp(cotizacion.value.id)
    vistaPrevia.value = respuesta.data
    const fresco = await PagoProveedorService.obtenerCotizacion(cotizacion.value.id)
    aplicar(fresco.data)
  } catch (error: any) {
    showError('WhatsApp', error.message || 'No se pudo armar el mensaje.')
  } finally {
    enviando.value = false
  }
}

async function crearSolicitud() {
  if (!cotizacion.value) return
  creandoSolicitud.value = true
  try {
    await guardarSilencioso()
    const respuesta = await PagoProveedorService.crearSolicitud(cotizacion.value.id)
    showSuccess('Solicitud creada', `N.° ${respuesta.data.numero_orden}`)
    await navigateTo(`/pago-proveedor/solicitudes/${respuesta.data.id}`)
  } catch (error: any) {
    showError('Solicitud', error.message || 'Faltan datos para crear la solicitud.')
  } finally {
    creandoSolicitud.value = false
  }
}

async function renovar() {
  if (!cotizacion.value) return
  try {
    const respuesta = await PagoProveedorService.renovarCotizacion(cotizacion.value.id, tipoCambio.value)
    aplicar(respuesta.data)
    showSuccess('Cotización renovada', 'Confirma el tipo de cambio del día y reenvía el resumen.')
  } catch (error: any) {
    showError('Renovar', error.message || 'No se pudo renovar.')
  }
}

async function guardarSilencioso() {
  if (!cotizacion.value || !editable.value) return
  const respuesta = await PagoProveedorService.guardarCotizacion(cotizacion.value.id, payload())
  aplicar(respuesta.data)
}

function formatearFecha(valor: string | null) {
  if (!valor) return ''
  return new Date(valor).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(async () => {
  try {
    const respuesta = await PagoProveedorService.obtenerCotizacion(Number(route.params.id))
    aplicar(respuesta.data)
  } catch (error: any) {
    showError('Cotización', error.message || 'No se pudo abrir la cotización.')
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.campo {
  margin-top: 0.25rem;
  display: block;
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
  background: white;
}
.campo:disabled {
  background: #f9fafb;
  color: #6b7280;
}
</style>
