<template>
  <div class="mx-auto max-w-5xl space-y-4 p-6">
    <button type="button" class="inline-flex items-center rounded-lg border border-primary-500 bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-primary-600" @click="navigateTo('/pago-proveedor/solicitudes')">← Regresar al listado</button>
    <div v-if="cargando" class="space-y-4">
      <USkeleton class="h-8 w-72" />
      <USkeleton class="h-36 w-full rounded-2xl" />
      <div class="grid gap-3 sm:grid-cols-3">
        <USkeleton class="h-24 rounded-2xl" />
        <USkeleton class="h-24 rounded-2xl" />
        <USkeleton class="h-24 rounded-2xl" />
      </div>
    </div>

    <template v-else-if="solicitud">
      <header class="space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight text-gray-800">{{ solicitud.cliente_nombre }}</h1>
          <span class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">Orden N.° {{ solicitud.numero_orden }}</span>
        </div>

        <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="mb-3 text-base font-bold text-gray-800">Datos del cliente</h2>
          <dl class="grid gap-4 sm:grid-cols-2">
            <div><dt class="text-xs text-gray-500">N.° de consolidado</dt><dd class="text-[15px] font-bold">{{ solicitud.consolidado ? `Consolidado ${solicitud.consolidado}` : '—' }}</dd></div>
            <div><dt class="text-xs text-gray-500">Nombre y apellido</dt><dd class="text-[15px] font-bold">{{ solicitud.cliente_nombre || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-500">WhatsApp</dt><dd class="text-[15px] font-bold">{{ solicitud.cliente_whatsapp || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-500">Correo electrónico</dt><dd class="text-[15px] font-bold">{{ solicitud.cliente_correo || '—' }}</dd></div>
          </dl>
          <p v-if="solicitud.cotizacion_codigo" class="mt-3 text-sm text-gray-500">Cotización {{ solicitud.cotizacion_codigo }}<span v-if="solicitud.tipo_cambio"> · T.C. {{ solicitud.tipo_cambio }}</span></p>
        </section>

        <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="mb-3 text-base font-bold text-gray-800">Resumen financiero</h2>
          <dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div class="rounded-2xl border border-gray-200 px-4 py-4"><dt class="text-sm text-gray-500">Total cotizado</dt><dd class="mt-1 text-[28px] font-bold leading-none">${{ dinero(solicitud.total_cotizado || 0) }}</dd></div>
            <div class="rounded-2xl border border-gray-200 px-4 py-4"><dt class="text-sm text-gray-500">Total abonado</dt><dd class="mt-1 text-[28px] font-bold leading-none">${{ dinero(solicitud.total_abonado || 0) }}</dd></div>
            <div class="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-4"><dt class="text-sm font-medium text-primary-700">Saldo pendiente</dt><dd class="mt-1 text-[28px] font-bold leading-none text-primary-700">${{ dinero(solicitud.saldo_pendiente || 0) }}</dd></div>
            <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4"><dt class="text-sm text-blue-800">Excedente</dt><dd class="mt-1 text-[28px] font-bold leading-none text-blue-800">${{ dinero(solicitud.excedente || 0) }}</dd></div>
          </dl>
        </section>

        <div v-if="(solicitud.saldo_pendiente || 0) > 0" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3">
          <div>
            <p class="text-sm font-bold text-primary-800">Hay saldo por cobrar</p>
            <p class="text-sm text-primary-700">${{ dinero(solicitud.saldo_pendiente || 0) }} · {{ proveedoresConSaldo.length }} proveedor{{ proveedoresConSaldo.length === 1 ? '' : 'es' }}</p>
          </div>
          <UButton color="primary" @click="abrirAbono()">Registrar comprobante</UButton>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-if="solicitud.cotizacion_id"
            size="sm"
            color="neutral"
            variant="soft"
            :to="`/pago-proveedor/cotizaciones/${solicitud.cotizacion_id}`"
          >
            Formulario de la solicitud
          </UButton>
          <UButton v-if="solicitud.cotizacion_id" size="sm" color="neutral" variant="soft" :loading="guardandoAviso" @click="enviarResumen">Enviar resumen</UButton>
          <UButton v-if="solicitud.cotizacion_id" size="sm" color="neutral" variant="ghost" :loading="guardandoAviso" @click="descargarResumen">Descargar PDF</UButton>
          <UButton size="sm" color="neutral" variant="soft" @click="abrirPedirDatos">Pedir datos del proveedor</UButton>
          <UButton size="sm" color="neutral" variant="ghost" @click="enviarCuentas">Cuentas bancarias</UButton>
        </div>
      </header>

      <article v-for="proveedor in solicitud.proveedores || []" :key="proveedor.id" class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <SupplierPaymentSteps labeled :current="proveedor.etapa" />
        <div class="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-gray-400">Proveedor {{ proveedor.orden }}</p>
            <h2 class="text-lg font-semibold">{{ proveedor.titulo }}</h2>
            <p class="text-sm text-gray-600">{{ proveedor.producto }} · {{ proveedor.moneda === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T' }}</p>
            <p v-if="proveedor.codigo_solicitud" class="mt-1 text-xs text-gray-400">Código interno {{ proveedor.codigo_solicitud }}</p>
          </div>
          <span :class="pillEstado(proveedor.estado)">{{ proveedor.etapa_nombre }} · {{ proveedor.estado_nombre }}</span>
        </div>

        <div v-if="siguientePaso(proveedor)" class="mt-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
          <p class="text-[11px] font-bold uppercase tracking-wide text-primary-700">Siguiente paso</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ siguientePaso(proveedor) }}</p>
        </div>

        <dl class="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div class="rounded-xl bg-gray-50 px-3 py-2"><dt class="text-xs text-gray-500">A abonar</dt><dd class="font-bold">${{ dinero(proveedor.importe_requerido) }}</dd></div>
          <div class="rounded-xl bg-gray-50 px-3 py-2"><dt class="text-xs text-gray-500">Abonado</dt><dd class="font-bold">${{ dinero(proveedor.importe_abonado) }}</dd></div>
          <div class="rounded-xl bg-primary-50 px-3 py-2"><dt class="text-xs text-primary-700">Pendiente</dt><dd class="font-bold text-primary-700">${{ dinero(proveedor.saldo) }}</dd></div>
        </dl>
        <p v-if="proveedor.puede_registrar_diferencia" class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Administración dejó este pago por cobrar. Registra el comprobante de la diferencia.
        </p>

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
        <section v-else-if="proveedor.observacion_china" class="mt-4 rounded-lg bg-red-50 p-4 text-sm">
          <h3 class="font-semibold">Observación de China</h3>
          <p class="mt-1">{{ proveedor.observacion_china.label }}<span v-if="proveedor.observacion_china.detail"> · {{ proveedor.observacion_china.detail }}</span></p>
          <p class="mt-1" :class="proveedor.observacion_china.overdue ? 'font-semibold text-red-700' : 'text-gray-600'">
            {{ proveedor.observacion_china.overdue ? 'El plazo de 48 h ya venció. Igual puedes corregir los datos.' : 'Corrige el vendedor o el WeChat para levantar la observación.' }}
          </p>
          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <label>Vendedor
              <input v-model="rmb[proveedor.id].vendedor" class="campo" />
            </label>
            <label>WeChat
              <input v-model="rmb[proveedor.id].wechat" class="campo" />
            </label>
          </div>
          <UButton class="mt-3" size="sm" color="primary" @click="levantarChina(proveedor)">Levantar observación</UButton>
        </section>
        <p v-else-if="proveedor.moneda === 'RMB'" class="mt-3 text-sm text-gray-600">Vendedor {{ proveedor.datos.vendedor_nombre || '—' }} · WeChat {{ proveedor.datos.wechat || '—' }}</p>

        <section v-if="proveedor.moneda === 'USD'" class="mt-4 rounded-lg bg-gray-50 p-4">
          <h3 class="text-sm font-semibold">Datos bancarios (T-T)</h3>
          <p class="mt-1 text-sm">Estado: {{ etiquetaDatos(proveedor.datos.estado) }}<span v-if="proveedor.datos.correccion_solicitada"> · corrección pedida</span></p>
          <p v-if="proveedor.datos.beneficiario_nombre" class="text-sm text-gray-600">{{ proveedor.datos.beneficiario_nombre }} · {{ proveedor.datos.banco_nombre }} {{ proveedor.datos.banco_codigo }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <template v-if="proveedor.puede_editar_etapa1">
              <UButton size="sm" color="primary" @click="enviarFormulario(proveedor)">Enviar formulario</UButton>
              <UButton size="sm" color="neutral" variant="soft" @click="abrirTt(proveedor.id, false)">Llenar por el cliente</UButton>
              <UButton v-if="proveedor.datos.estado === 'recibido'" size="sm" color="neutral" variant="soft" @click="pedirValidacion(proveedor)">Solicitar validación de datos</UButton>
            </template>
            <UButton
              v-if="proveedor.datos.beneficiario_nombre || proveedor.datos.estado === 'recibido' || proveedor.datos.estado === 'por_autorizar'"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="abrirTt(proveedor.id, true)"
            >
              Ver
            </UButton>
          </div>
          <form v-if="ttAbierto === proveedor.id" class="mt-4 space-y-3" @submit.prevent="llenarTt(proveedor)">
            <FormularioBancario v-model="formularioTt" :bloqueado="ttSoloLectura" />
            <div v-if="!ttSoloLectura" class="flex gap-2">
              <UButton type="submit" size="sm" color="primary">Guardar como por autorizar</UButton>
              <UButton type="button" size="sm" color="neutral" variant="ghost" @click="ttAbierto = null">Cancelar</UButton>
            </div>
            <UButton v-else type="button" size="sm" color="neutral" variant="ghost" @click="ttAbierto = null">Cerrar</UButton>
          </form>
        </section>

        <SupplierPaymentProgress v-if="solicitud.id" :solicitud-id="solicitud.id" :proveedor="proveedor" @saved="cargar" />

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
              <a v-if="abono.voucher_url" :href="abono.voucher_url" target="_blank" class="font-semibold text-primary-600">Ver voucher</a>
              <button v-if="abono.puede_editar" type="button" class="font-semibold text-primary-600" @click="editarAbono(abono)">Editar</button>
              <button v-if="abono.puede_editar" type="button" class="text-red-600" @click="anularAbono(abono)">Anular</button>
              <button v-if="abono.excedente_decision === 'por_consultar'" type="button" class="font-semibold text-primary-600" @click="decidir(abono.id, 'reembolso_solicitado')">Solicitar reembolso</button>
              <template v-if="abono.puede_elegir_continuacion">
                <label v-for="aplicacion in abono.aplicaciones" :key="aplicacion.solicitud_proveedor_id" class="flex items-center gap-1">
                  <input v-model="continuacion[abono.id]" type="checkbox" :value="aplicacion.solicitud_proveedor_id" />
                  {{ nombreProveedor(aplicacion.solicitud_proveedor_id) }}
                </label>
                <button type="button" class="font-semibold text-primary-600" @click="guardarContinuacion(abono.id)">Estos continúan</button>
              </template>
              <button v-if="abono.excedente_decision === 'por_consultar' && hayCuotas" type="button" class="font-semibold text-primary-600" @click="decidir(abono.id, 'aplicado_cuota')">Aplicar a la cuota 2</button>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="vistaPrevia" class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="font-semibold">Vista previa</h2>
        <p v-if="vistaPrevia.enlace" class="mt-2 break-all text-sm text-orange-700">{{ vistaPrevia.enlace }}</p>
        <pre class="mt-3 whitespace-pre-wrap text-sm">{{ vistaPrevia.texto }}</pre>
        <p class="mt-2 text-sm text-gray-500">{{ vistaPrevia.nota }}</p>
      </section>

      <section v-if="(solicitud.historial || []).length" class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="font-semibold">Historial</h2>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-gray-400">
                <th class="pb-2 pr-3">Fecha</th>
                <th class="pb-2 pr-3">Usuario</th>
                <th class="pb-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(evento, index) in solicitud.historial" :key="`${evento.fecha}-${index}`" class="border-t border-gray-100">
                <td class="py-2 pr-3 whitespace-nowrap text-gray-500">{{ evento.fecha ? new Date(evento.fecha).toLocaleString('es-PE') : '—' }}</td>
                <td class="py-2 pr-3">{{ evento.usuario || '—' }}</td>
                <td class="py-2">{{ evento.accion }}<span v-if="evento.detalle" class="text-gray-500"> · {{ evento.detalle }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <SupplierPaymentWindow
        :open="pedirDatosAbierto"
        title="Pedir datos del proveedor"
        subtitle="Elige a quién le pides los datos."
        @close="pedirDatosAbierto = false"
      >
        <p v-if="!candidatosDatos.length" class="text-sm text-gray-500">Todos los proveedores ya tienen sus datos.</p>
        <div v-else class="space-y-2">
          <label v-for="candidato in candidatosDatos" :key="candidato.id" class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <input v-model="candidatosElegidos" type="checkbox" :value="candidato.id" />
            <span>{{ candidato.titulo }} · {{ candidato.moneda }}</span>
          </label>
        </div>
        <template #footer>
          <UButton color="primary" :disabled="!candidatosElegidos.length" :loading="guardandoAviso" @click="confirmarPedirDatos">Preparar aviso</UButton>
        </template>
      </SupplierPaymentWindow>

      <SupplierPaymentWindow
        :open="abonoAbierto"
        :title="abonoEditandoId ? 'Editar comprobante de pago' : 'Registrar comprobante de pago'"
        subtitle="El abono se aplica a los proveedores con saldo."
        @close="abonoAbierto = false"
      >
        <form id="abono-form" class="space-y-4" @submit.prevent="guardarAbono">
          <div class="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-2">
            <label class="text-sm text-gray-500">Importe recibido (USD)
              <input v-model.number="abono.importe" type="number" min="0" step="0.01" class="campo" />
            </label>
            <label class="text-sm text-gray-500">Fecha de pago
              <input v-model="abono.fecha" type="date" class="campo" />
            </label>
            <label class="text-sm text-gray-500">N.° de operación
              <input v-model="abono.operacion" class="campo" />
            </label>
            <label class="text-sm text-gray-500">Banco receptor
              <select v-model="abono.banco" class="campo">
                <option value="bcp">BCP</option>
                <option value="interbank">Interbank</option>
              </select>
            </label>
            <label class="text-sm text-gray-500 md:col-span-2">Comprobante
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="mt-1 block text-sm text-gray-800" @change="elegirVoucher" />
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-800 md:col-span-2">
              <input v-model="abono.interbancaria" type="checkbox" />
              Transferencia interbancaria o depósito en cajero
            </label>
          </div>
          <div class="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold">Aplicar el abono a</h3>
              <button type="button" class="text-sm font-semibold text-primary-600" @click="distribuir">Distribuir automáticamente</button>
            </div>
            <label v-for="proveedor in proveedoresConSaldo" :key="proveedor.id" class="flex items-center justify-between gap-3 text-sm">
              <span>{{ proveedor.code_supplier }} · pendiente ${{ dinero(proveedor.saldo) }}</span>
              <input v-model.number="abono.montos[proveedor.id]" type="number" min="0" step="0.01" class="campo w-32" />
            </label>
            <p class="text-sm">Recibido ${{ dinero(abono.importe || 0) }} · Aplicado ${{ dinero(aplicado) }} · Sin asignar ${{ dinero(sinAsignar) }}</p>
          </div>
        </form>
        <template #footer>
          <UButton type="submit" form="abono-form" color="primary" :disabled="aplicado <= 0" :loading="guardandoAbono">
            {{ abonoEditandoId ? 'Guardar cambios' : 'Registrar comprobante' }}
          </UButton>
        </template>
      </SupplierPaymentWindow>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { PagoProveedorAbono, PagoProveedorSolicitud, PagoProveedorSolicitudProveedor } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import { useModal } from '~/composables/commons/useModal'
import FormularioBancario from '~/components/pago-proveedor/FormularioBancario.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import SupplierPaymentProgress from '~/components/pago-proveedor/SupplierPaymentProgress.vue'
import SupplierPaymentSteps from '~/components/pago-proveedor/SupplierPaymentSteps.vue'

const route = useRoute()
const { showSuccess, showError, showConfirmation } = useModal()
const cargando = ref(true)
const guardandoAbono = ref(false)
const guardandoAviso = ref(false)
const solicitud = ref<PagoProveedorSolicitud | null>(null)
const rmb = reactive<Record<number, { vendedor: string; wechat: string }>>({})
const ttAbierto = ref<number | null>(null)
const ttSoloLectura = ref(false)
const formularioTt = ref<Record<string, unknown>>({})
const abonoAbierto = ref(false)
const abonoEditandoId = ref<number | null>(null)
const pedirDatosAbierto = ref(false)
const candidatosDatos = ref<Array<{ id: number; titulo: string; moneda: string; incompleto: boolean }>>([])
const candidatosElegidos = ref<number[]>([])
const voucher = ref<File | null>(null)
const vistaPrevia = ref<{ enlace?: string; texto: string; nota?: string } | null>(null)
const continuacion = reactive<Record<number, number[]>>({})
const abono = reactive({
  importe: 0,
  fecha: '',
  operacion: '',
  banco: 'bcp',
  interbancaria: false,
  montos: {} as Record<number, number>
})

const dinero = (valor: number) => Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const proveedoresConSaldo = computed(() => (solicitud.value?.proveedores || []).filter(item => (item.puede_editar_etapa1 || item.puede_registrar_diferencia) && item.saldo > 0))
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

function pillEstado(estado: string) {
  if (estado === 'observado') return 'rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700'
  if (estado === 'completado') return 'rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700'
  if (estado === 'anulado') return 'rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600'
  return 'rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700'
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

async function abrirPedirDatos() {
  try {
    const respuesta = await PagoProveedorService.candidatosPedirDatos(solicitud.value!.id)
    candidatosDatos.value = respuesta.data || []
    candidatosElegidos.value = candidatosDatos.value.map(item => item.id)
    pedirDatosAbierto.value = true
  } catch (error: any) {
    showError('Pedir datos', error?.data?.message || error.message || 'No se pudo cargar los proveedores.')
  }
}

async function confirmarPedirDatos() {
  if (!candidatosElegidos.value.length) return
  guardandoAviso.value = true
  try {
    const respuesta = await PagoProveedorService.pedirDatos(solicitud.value!.id, candidatosElegidos.value)
    vistaPrevia.value = respuesta.data
    aplicar(respuesta.data.solicitud)
    pedirDatosAbierto.value = false
    showSuccess('Pedir datos', 'Quedó la vista previa del aviso.')
  } catch (error: any) {
    showError('Pedir datos', error?.data?.message || error.message || 'No se pudo preparar el mensaje.')
  } finally {
    guardandoAviso.value = false
  }
}

async function enviarResumen() {
  if (!solicitud.value?.cotizacion_id) return
  guardandoAviso.value = true
  try {
    const respuesta = await PagoProveedorService.vistaPreviaWhatsapp(solicitud.value.cotizacion_id)
    vistaPrevia.value = { texto: respuesta.data.texto, nota: respuesta.data.nota, enlace: respuesta.data.destinatario || undefined }
    showSuccess('Resumen', 'Quedó la vista previa para WhatsApp.')
  } catch (error: any) {
    showError('Resumen', error?.data?.message || error.message || 'No se pudo preparar el resumen.')
  } finally {
    guardandoAviso.value = false
  }
}

async function descargarResumen() {
  if (!solicitud.value?.cotizacion_id) return
  guardandoAviso.value = true
  try {
    const respuesta = await PagoProveedorService.descargarPdf(solicitud.value.cotizacion_id)
    const pdf = respuesta.data
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${pdf.base64}`
    link.download = pdf.filename || 'Resumen.pdf'
    link.click()
    showSuccess('PDF', 'Resumen descargado.')
  } catch (error: any) {
    showError('PDF', error?.data?.message || error.message || 'No se pudo descargar el PDF.')
  } finally {
    guardandoAviso.value = false
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

async function levantarChina(proveedor: PagoProveedorSolicitudProveedor) {
  try {
    const respuesta = await PagoProveedorService.levantarChina(solicitud.value!.id, proveedor.id, rmb[proveedor.id].vendedor, rmb[proveedor.id].wechat)
    solicitud.value = respuesta.data
    showSuccess('Observación', 'China ya puede continuar el pago.')
  } catch (error: any) {
    showError('Observación', error?.data?.message || 'No se pudo levantar la observación.')
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

function abrirTt(proveedorId: number, soloLectura = false) {
  const proveedor = solicitud.value?.proveedores.find(item => item.id === proveedorId)
  const datos = proveedor?.datos
  formularioTt.value = {
    beneficiario_nombre: datos?.beneficiario_nombre || '',
    beneficiario_cuenta: datos?.beneficiario_cuenta || '',
    beneficiario_direccion: datos?.beneficiario_direccion || '',
    beneficiario_pais: datos?.beneficiario_pais || '',
    beneficiario_ciudad: datos?.beneficiario_ciudad || '',
    banco_tipo_codigo: datos?.banco_tipo_codigo || 'SWIFT',
    banco_codigo: datos?.banco_codigo || '',
    banco_nombre: datos?.banco_nombre || '',
    banco_direccion: datos?.banco_direccion || '',
    banco_pais: datos?.banco_pais || '',
    banco_ciudad: datos?.banco_ciudad || '',
    usa_intermediario: Boolean(datos?.usa_intermediario),
    inter_tipo_codigo: datos?.inter_tipo_codigo || 'SWIFT',
    inter_codigo: datos?.inter_codigo || '',
    inter_nombre: datos?.inter_nombre || '',
    inter_direccion: datos?.inter_direccion || '',
    inter_pais: datos?.inter_pais || '',
    inter_ciudad: datos?.inter_ciudad || ''
  }
  ttSoloLectura.value = soloLectura
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

function siguientePaso(proveedor: PagoProveedorSolicitudProveedor) {
  if (proveedor.observacion_china) return 'Corrige el vendedor o el WeChat y levanta la observación.'
  if (proveedor.puede_registrar_diferencia) return 'Administración dejó una diferencia por cobrar. Registra ese comprobante.'
  if (proveedor.puede_editar_etapa1 && proveedor.moneda === 'RMB' && !proveedor.datos.wechat) return 'Completa el vendedor y el WeChat del proveedor.'
  if (proveedor.puede_editar_etapa1 && proveedor.moneda === 'USD' && proveedor.datos.estado !== 'autorizado') return 'Faltan los datos bancarios. Envía el formulario o llénalo aquí; el cliente tiene que autorizarlos.'
  if (proveedor.saldo > 0 && proveedor.etapa <= 1) return 'Registra el comprobante del cliente. Administración lo valida después.'
  if (proveedor.etapa === 2) return 'El depósito está con Administración. Aquí no hay nada que hacer hasta que lo aprueben o lo observen.'
  if (proveedor.etapa === 3) return proveedor.moneda === 'RMB' ? 'China registra el pago en yuanes.' : 'Administración transfiere al proveedor.'
  if (proveedor.etapa === 4 && proveedor.estado !== 'completado') return 'Revisa la confirmación: lo que falta está marcado abajo.'
  return ''
}

function abrirAbono() {
  abonoEditandoId.value = null
  abono.importe = 0
  abono.fecha = ''
  abono.operacion = ''
  abono.banco = 'bcp'
  abono.interbancaria = false
  voucher.value = null
  abono.montos = {}
  for (const proveedor of proveedoresConSaldo.value) abono.montos[proveedor.id] = 0
  abonoAbierto.value = true
}

function editarAbono(abonoItem: PagoProveedorAbono) {
  abonoEditandoId.value = abonoItem.id
  abono.importe = abonoItem.importe
  abono.fecha = abonoItem.fecha_pago
  abono.operacion = abonoItem.numero_operacion
  abono.banco = abonoItem.banco
  abono.interbancaria = abonoItem.interbancaria
  voucher.value = null
  abono.montos = {}
  for (const proveedor of solicitud.value?.proveedores || []) {
    const aplicacion = abonoItem.aplicaciones.find(item => item.solicitud_proveedor_id === proveedor.id)
    abono.montos[proveedor.id] = aplicacion ? Number(aplicacion.monto) : 0
  }
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
  if (!solicitud.value) return
  if (!abonoEditandoId.value && !voucher.value) {
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
    if (voucher.value) form.append('voucher', voucher.value)
    form.append('aplicaciones', JSON.stringify(
      Object.entries(abono.montos)
        .filter(([, monto]) => Number(monto) > 0)
        .map(([id, monto]) => ({ solicitud_proveedor_id: Number(id), monto: Number(monto) }))
    ))
    const editando = Boolean(abonoEditandoId.value)
    const respuesta = await PagoProveedorService.registrarAbono(solicitud.value.id, form, abonoEditandoId.value || undefined)
    aplicar(respuesta.data.solicitud)
    abonoAbierto.value = false
    abonoEditandoId.value = null
    showSuccess(editando ? 'Comprobante actualizado' : 'Comprobante registrado', respuesta.data.aviso_operacion_repetida || 'Quedó en validación.')
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

function nombreProveedor(id: number) {
  const proveedor = solicitud.value?.proveedores?.find(item => item.id === id)
  return proveedor?.code_supplier || proveedor?.supplier_name || `Proveedor ${id}`
}

async function guardarContinuacion(abonoId: number) {
  const elegidos = continuacion[abonoId] || []
  if (!elegidos.length || !solicitud.value) return
  try {
    const respuesta = await PagoProveedorService.elegirContinuacion(solicitud.value.id, abonoId, elegidos)
    aplicar(respuesta.data)
    showSuccess('Voucher compartido', 'Los proveedores elegidos continúan con el pago.')
  } catch (error: any) {
    showError('Voucher compartido', error?.data?.message || error.message || 'No se pudo guardar.')
  }
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
