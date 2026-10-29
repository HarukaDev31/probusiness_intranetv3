<template>
  <div class="mx-auto max-w-5xl space-y-4 p-6">
    <button type="button" class="text-sm text-gray-500" @click="navigateTo('/pago-proveedor/solicitudes')">← Solicitudes</button>
    <div v-if="cargando" class="py-12 text-center text-gray-500">Cargando solicitud…</div>

    <template v-else-if="solicitud">
      <header class="rounded-xl border border-gray-200 bg-white p-6">
        <p class="text-sm text-gray-500">Orden N.° {{ solicitud.numero_orden }} · {{ solicitud.cotizacion_codigo }} · {{ solicitud.cod_cotizacion_cc }}</p>
        <h1 class="mt-1 text-2xl font-semibold">{{ solicitud.cliente_nombre }}</h1>
        <p class="mt-1 text-sm text-gray-600">{{ solicitud.consolidado || 'Sin consolidado' }}<span v-if="solicitud.tipo_cambio"> · T.C. {{ solicitud.tipo_cambio }}</span></p>
        <dl class="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div><dt class="text-gray-500">Total cotizado</dt><dd class="font-medium">${{ dinero(solicitud.total_cotizado || 0) }}</dd></div>
          <div><dt class="text-gray-500">Abonado</dt><dd class="font-medium">${{ dinero(solicitud.total_abonado || 0) }}</dd></div>
          <div><dt class="text-gray-500">Saldo pendiente</dt><dd class="font-medium text-orange-600">${{ dinero(solicitud.saldo_pendiente || 0) }}</dd></div>
          <div><dt class="text-gray-500">Excedente</dt><dd class="font-medium">${{ dinero(solicitud.excedente || 0) }}</dd></div>
        </dl>
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton color="primary" variant="soft" @click="pedirDatos">Pedir datos del proveedor</UButton>
          <UButton color="neutral" variant="soft" @click="enviarCuentas">Cuentas bancarias</UButton>
          <UButton v-if="proveedoresConSaldo.length" color="primary" @click="abrirAbono()">Registrar comprobante</UButton>
        </div>
      </header>

      <article v-for="proveedor in solicitud.proveedores || []" :key="proveedor.id" class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-gray-400">Proveedor {{ proveedor.orden }}</p>
            <h2 class="text-lg font-semibold">{{ proveedor.titulo }}</h2>
            <p class="text-sm text-gray-600">{{ proveedor.producto }} · {{ proveedor.moneda === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T' }}</p>
            <p v-if="proveedor.codigo_solicitud" class="mt-1 text-xs text-gray-400">Código interno {{ proveedor.codigo_solicitud }}</p>
          </div>
          <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">{{ proveedor.etapa_nombre }} · {{ proveedor.estado_nombre }}</span>
        </div>

        <p class="mt-3 text-sm">A abonar ahora ${{ dinero(proveedor.importe_requerido) }} · Abonado ${{ dinero(proveedor.importe_abonado) }} · <span class="text-orange-600">Pendiente ${{ dinero(proveedor.saldo) }}</span></p>

        <section v-if="proveedor.moneda === 'RMB' && proveedor.puede_editar_etapa1" class="mt-4 rounded-lg bg-gray-50 p-4">
          <h3 class="text-sm font-semibold">Datos del proveedor</h3>
          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <label class="text-sm">Vendedor
              <input v-model="rmb[proveedor.id].vendedor" class="campo" />
            </label>
            <label class="text-sm">WeChat
              <input v-model="rmb[proveedor.id].wechat" class="campo" inputmode="numeric" />
            </label>
          </div>
          <UButton class="mt-3" size="sm" color="primary" @click="guardarRmb(proveedor)">Completar</UButton>
        </section>
        <p v-else-if="proveedor.moneda === 'RMB'" class="mt-3 text-sm text-gray-600">Vendedor {{ proveedor.datos.vendedor_nombre || '—' }} · WeChat {{ proveedor.datos.wechat || '—' }}</p>

        <section v-if="proveedor.moneda === 'USD'" class="mt-4 rounded-lg bg-gray-50 p-4">
          <h3 class="text-sm font-semibold">Datos bancarios (T-T)</h3>
          <p class="mt-1 text-sm">Estado: {{ etiquetaDatos(proveedor.datos.estado) }}<span v-if="proveedor.datos.correccion_solicitada"> · corrección pedida</span></p>
          <p v-if="proveedor.datos.beneficiario_nombre" class="text-sm text-gray-600">{{ proveedor.datos.beneficiario_nombre }} · {{ proveedor.datos.banco_nombre }} {{ proveedor.datos.banco_codigo }}</p>
          <div v-if="proveedor.puede_editar_etapa1" class="mt-3 flex flex-wrap gap-2">
            <UButton size="sm" color="primary" @click="enviarFormulario(proveedor)">Enviar formulario</UButton>
            <UButton size="sm" color="neutral" variant="soft" @click="abrirTt(proveedor.id)">Llenar por el cliente</UButton>
            <UButton v-if="proveedor.datos.estado === 'recibido'" size="sm" color="neutral" variant="soft" @click="pedirValidacion(proveedor)">Solicitar validación de datos</UButton>
          </div>
          <form v-if="ttAbierto === proveedor.id" class="mt-4 space-y-3" @submit.prevent="llenarTt(proveedor)">
            <FormularioBancario v-model="formularioTt" />
            <div class="flex gap-2">
              <UButton type="submit" size="sm" color="primary">Guardar como por autorizar</UButton>
              <UButton type="button" size="sm" color="neutral" variant="ghost" @click="ttAbierto = null">Cancelar</UButton>
            </div>
          </form>
        </section>

        <div v-if="proveedor.puede_editar_etapa1" class="mt-4">
          <button type="button" class="text-sm text-red-600" @click="anularProveedor(proveedor)">Anular proveedor</button>
        </div>
      </article>

      <section v-if="(solicitud.abonos || []).length" class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="font-semibold">Comprobantes</h2>
        <ul class="mt-3 space-y-3">
          <li v-for="abono in solicitud.abonos" :key="abono.id" class="rounded-lg border border-gray-100 p-3 text-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p>{{ abono.voucher_nombre }} · ${{ dinero(abono.importe) }} · {{ abono.banco.toUpperCase() }} · {{ abono.numero_operacion }}</p>
              <span class="rounded-full bg-gray-100 px-2 py-1 text-xs">{{ abono.estado_nombre }}</span>
            </div>
            <p v-if="abono.excedente > 0" class="mt-1 text-amber-700">Excedente ${{ dinero(abono.excedente) }} · {{ textoExcedente(abono.excedente_decision) }}</p>
            <p v-if="abono.operacion_repetida" class="text-amber-700">El número de operación ya estaba registrado.</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <a v-if="abono.voucher_url" :href="abono.voucher_url" target="_blank" class="text-orange-600">Ver voucher</a>
              <button v-if="abono.puede_editar" type="button" class="text-red-600" @click="anularAbono(abono)">Anular</button>
              <button v-if="abono.excedente_decision === 'por_consultar'" type="button" class="text-orange-600" @click="decidir(abono.id, 'reembolso_solicitado')">Solicitar reembolso</button>
              <button v-if="abono.excedente_decision === 'por_consultar' && hayCuotas" type="button" class="text-orange-600" @click="decidir(abono.id, 'aplicado_cuota')">Aplicar a la cuota 2</button>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="vistaPrevia" class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="font-semibold">Vista previa</h2>
        <p class="mt-2 break-all text-sm text-orange-700">{{ vistaPrevia.enlace }}</p>
        <pre class="mt-3 whitespace-pre-wrap text-sm">{{ vistaPrevia.texto }}</pre>
        <p class="mt-2 text-sm text-gray-500">{{ vistaPrevia.nota }}</p>
      </section>

      <form v-if="abonoAbierto" class="rounded-xl border border-orange-200 bg-orange-50 p-5" @submit.prevent="guardarAbono">
        <h2 class="font-semibold">Registrar comprobante de pago</h2>
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <label class="text-sm">Importe recibido (USD)
            <input v-model.number="abono.importe" type="number" min="0" step="0.01" class="campo" />
          </label>
          <label class="text-sm">Fecha de pago
            <input v-model="abono.fecha" type="date" class="campo" />
          </label>
          <label class="text-sm">N.° de operación
            <input v-model="abono.operacion" class="campo" />
          </label>
          <label class="text-sm">Banco receptor
            <select v-model="abono.banco" class="campo">
              <option value="bcp">BCP</option>
              <option value="interbank">Interbank</option>
            </select>
          </label>
          <label class="text-sm md:col-span-2">Comprobante
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="mt-1 block text-sm" @change="elegirVoucher" />
          </label>
          <label class="flex items-center gap-2 text-sm md:col-span-2">
            <input v-model="abono.interbancaria" type="checkbox" />
            Transferencia interbancaria o depósito en cajero
          </label>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Aplicar el abono a</h3>
            <button type="button" class="text-sm text-orange-700" @click="distribuir">Distribuir automáticamente</button>
          </div>
          <label v-for="proveedor in proveedoresConSaldo" :key="proveedor.id" class="flex items-center justify-between gap-3 text-sm">
            <span>{{ proveedor.code_supplier }} · pendiente ${{ dinero(proveedor.saldo) }}</span>
            <input v-model.number="abono.montos[proveedor.id]" type="number" min="0" step="0.01" class="campo w-32" />
          </label>
          <p class="text-sm">Recibido ${{ dinero(abono.importe || 0) }} · Aplicado ${{ dinero(aplicado) }} · Sin asignar ${{ dinero(sinAsignar) }}</p>
        </div>
        <div class="mt-4 flex gap-2">
          <UButton type="submit" color="primary" :disabled="aplicado <= 0" :loading="guardandoAbono">Registrar</UButton>
          <UButton type="button" color="neutral" variant="ghost" @click="abonoAbierto = false">Cancelar</UButton>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { PagoProveedorSolicitud, PagoProveedorSolicitudProveedor } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import { useModal } from '~/composables/commons/useModal'
import FormularioBancario from '~/components/pago-proveedor/FormularioBancario.vue'

const route = useRoute()
const { showSuccess, showError, showConfirmation } = useModal()
const cargando = ref(true)
const guardandoAbono = ref(false)
const solicitud = ref<PagoProveedorSolicitud | null>(null)
const rmb = reactive<Record<number, { vendedor: string; wechat: string }>>({})
const ttAbierto = ref<number | null>(null)
const formularioTt = ref<Record<string, unknown>>({})
const abonoAbierto = ref(false)
const voucher = ref<File | null>(null)
const vistaPrevia = ref<{ enlace?: string; texto: string; nota?: string } | null>(null)
const abono = reactive({
  importe: 0,
  fecha: '',
  operacion: '',
  banco: 'bcp',
  interbancaria: false,
  montos: {} as Record<number, number>
})

const dinero = (valor: number) => Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const proveedoresConSaldo = computed(() => (solicitud.value?.proveedores || []).filter(item => item.puede_editar_etapa1 && item.saldo > 0))
const hayCuotas = computed(() => (solicitud.value?.proveedores || []).some(item => item.modalidad_abono === 'fraccionado'))
const aplicado = computed(() => Object.values(abono.montos).reduce((suma, monto) => suma + (Number(monto) || 0), 0))
const sinAsignar = computed(() => Math.round(((abono.importe || 0) - aplicado.value) * 100) / 100)

function aplicar(datos: PagoProveedorSolicitud) {
  solicitud.value = datos
  for (const proveedor of datos.proveedores || []) {
    rmb[proveedor.id] = {
      vendedor: proveedor.datos?.vendedor_nombre || '',
      wechat: proveedor.datos?.wechat || ''
    }
  }
}

function etiquetaDatos(estado: string) {
  return { pendiente: 'Pendiente', enviado: 'Enviado', por_autorizar: 'Por autorizar', recibido: 'Recibido' }[estado] || estado
}

function textoExcedente(decision: string | null) {
  return {
    aplicado_cuota: 'se aplica a la cuota 2',
    no_devuelve: 'no se devuelve (hasta $1)',
    por_consultar: 'por consultar al cliente',
    reembolso_solicitado: 'reembolso solicitado'
  }[decision || ''] || decision
}

async function cargar() {
  const respuesta = await PagoProveedorService.obtenerSolicitud(Number(route.params.id))
  aplicar(respuesta.data)
}

async function pedirDatos() {
  try {
    const respuesta = await PagoProveedorService.pedirDatos(solicitud.value!.id)
    vistaPrevia.value = respuesta.data
    aplicar(respuesta.data.solicitud)
  } catch (error: any) {
    showError('Pedir datos', error?.data?.message || error.message || 'No se pudo preparar el mensaje.')
  }
}

async function enviarCuentas() {
  try {
    const respuesta = await PagoProveedorService.cuentas(solicitud.value!.id)
    vistaPrevia.value = respuesta.data
  } catch (error: any) {
    showError('Cuentas', error?.data?.message || error.message || 'No se pudo preparar el mensaje.')
  }
}

async function guardarRmb(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.guardarDatosRmb(solicitud.value!.id, proveedor.id, rmb[proveedor.id].vendedor, rmb[proveedor.id].wechat)
    aplicar(respuesta.data)
    showSuccess('Datos guardados', proveedor.code_supplier)
  } catch (error: any) {
    showError('Datos del proveedor', error.message || 'No se pudo guardar.')
  }
}

async function enviarFormulario(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.enviarFormulario(solicitud.value!.id, proveedor.id)
    vistaPrevia.value = respuesta.data
    aplicar(respuesta.data.solicitud)
  } catch (error: any) {
    showError('Formulario T-T', error.message || 'No se pudo preparar el enlace.')
  }
}

async function llenarTt(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.llenarTt(solicitud.value!.id, proveedor.id, formularioTt.value)
    aplicar(respuesta.data)
    ttAbierto.value = null
    showSuccess('Por autorizar', 'El cliente debe autorizar estos datos antes de ejecutar el pago.')
  } catch (error: any) {
    showError('Formulario T-T', error.message || 'Revisa los datos bancarios.')
  }
}

async function pedirValidacion(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.solicitarValidacion(solicitud.value!.id, proveedor.id)
    vistaPrevia.value = respuesta.data
    aplicar(respuesta.data.solicitud)
  } catch (error: any) {
    showError('Validación', error.message || 'No se pudo pedir la validación.')
  }
}

function abrirTt(proveedorId: number) {
  formularioTt.value = { banco_tipo_codigo: 'SWIFT', inter_tipo_codigo: 'SWIFT', usa_intermediario: false }
  ttAbierto.value = proveedorId
}

function anularProveedor(proveedor: PagoProveedorSolicitudProveedor) {
  showConfirmation('Anular proveedor', `Se anula ${proveedor.code_supplier}. No sigue en el pago.`, async () => {
    try {
      const respuesta = await PagoProveedorService.anularProveedor(solicitud.value!.id, proveedor.id)
      aplicar(respuesta.data)
    } catch (error: any) {
      showError('Anular', error.message || 'No se pudo anular.')
    }
  })
}

function abrirAbono() {
  abono.montos = {}
  for (const proveedor of proveedoresConSaldo.value) abono.montos[proveedor.id] = 0
  abonoAbierto.value = true
}

function distribuir() {
  let resto = Number(abono.importe) || 0
  for (const proveedor of proveedoresConSaldo.value) {
    const aplicadoProveedor = Math.min(proveedor.saldo, Math.max(0, resto))
    abono.montos[proveedor.id] = Math.round(aplicadoProveedor * 100) / 100
    resto = Math.round((resto - aplicadoProveedor) * 100) / 100
  }
}

function elegirVoucher(evento: Event) {
  voucher.value = (evento.target as HTMLInputElement).files?.[0] || null
}

async function guardarAbono() {
  if (!solicitud.value || !voucher.value) {
    showError('Comprobante', 'Adjunta el voucher.')
    return
  }
  guardandoAbono.value = true
  try {
    const form = new FormData()
    form.append('importe', String(abono.importe))
    form.append('fecha_pago', abono.fecha)
    form.append('numero_operacion', abono.operacion)
    form.append('banco', abono.banco)
    form.append('interbancaria', abono.interbancaria ? '1' : '0')
    form.append('voucher', voucher.value)
    form.append('aplicaciones', JSON.stringify(
      proveedoresConSaldo.value
        .filter(proveedor => Number(abono.montos[proveedor.id]) > 0)
        .map(proveedor => ({ solicitud_proveedor_id: proveedor.id, monto: Number(abono.montos[proveedor.id]) }))
    ))
    const respuesta = await PagoProveedorService.registrarAbono(solicitud.value.id, form)
    aplicar(respuesta.data.solicitud)
    abonoAbierto.value = false
    showSuccess('Comprobante registrado', respuesta.data.aviso_operacion_repetida || 'Quedó en validación.')
  } catch (error: any) {
    showError('Comprobante', error.message || 'No se pudo registrar.')
  } finally {
    guardandoAbono.value = false
  }
}

function anularAbono(abonoItem: { id: number }) {
  showConfirmation('Anular abono', 'El voucher se conserva, pero deja de aplicar a los proveedores.', async () => {
    try {
      const respuesta = await PagoProveedorService.anularAbono(solicitud.value!.id, abonoItem.id)
      aplicar(respuesta.data)
    } catch (error: any) {
      showError('Abono', error.message || 'No se pudo anular.')
    }
  })
}

async function decidir(abonoId: number, decision: string) {
  try {
    const respuesta = await PagoProveedorService.decidirExcedente(solicitud.value!.id, abonoId, decision)
    aplicar(respuesta.data)
  } catch (error: any) {
    showError('Excedente', error.message || 'No se pudo registrar la decisión.')
  }
}

onMounted(async () => {
  try {
    await cargar()
  } catch (error: any) {
    showError('Solicitud', error.message || 'No se pudo abrir la solicitud.')
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
  background: white;
  padding: 0.5rem 0.75rem;
}
</style>
