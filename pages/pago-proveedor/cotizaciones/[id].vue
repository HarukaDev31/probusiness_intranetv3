<template>
  <div class="mx-auto max-w-5xl p-6">
    <button type="button" class="mb-4 text-sm text-gray-500" @click="navigateTo('/pago-proveedor/cotizaciones')">← Regresar al listado</button>
    <div v-if="cargando" class="space-y-4">
      <USkeleton class="h-8 w-64" />
      <USkeleton class="h-40 w-full rounded-xl" />
      <USkeleton class="h-56 w-full rounded-xl" />
    </div>

    <form v-else-if="cotizacion" class="space-y-4" @submit.prevent="guardar">
      <header>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900">{{ cotizacion.solicitud_id ? `Cotización ${cotizacion.codigo}` : 'Nueva cotización' }}</h1>
          <p class="text-sm" :class="cotizacion.vencida ? 'font-semibold text-red-600' : 'text-gray-500'">{{ cotizacion.vigencia_texto }}</p>
        </div>
        <p class="mt-2 text-sm text-gray-600">
          Cliente: <strong class="text-gray-900">{{ cotizacion.cliente_nombre || 'sin identificar' }}</strong>
          <span class="text-gray-400"> · {{ cotizacion.codigo }} · {{ cotizacion.cod_cotizacion_cc }} · el N.° de orden y el código se generan al crear la solicitud y registrar el comprobante</span>
        </p>
        <p v-if="cotizacion.solicitud_id" class="mt-2 text-sm">
          <NuxtLink :to="`/pago-proveedor/solicitudes/${cotizacion.solicitud_id}`" class="font-semibold text-primary-600">Ver solicitud</NuxtLink>
        </p>
      </header>

      <section class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="text-lg font-semibold text-gray-900">Datos del cliente</h2>
        <p class="mt-1 text-sm text-gray-500">Datos tomados de la cotización de Consolidada. Para cambiar de cliente, vuelve y crea otra cotización.</p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <UFormField label="N.° de consolidado" required help="Consolidado en el que está el cliente.">
            <UInput :model-value="cotizacion.consolidado || '—'" disabled class="w-full" />
          </UFormField>
          <UFormField label="Nombre y apellido" required help="Cliente que solicita el pago.">
            <UInput :model-value="cotizacion.cliente_nombre || '—'" disabled class="w-full" />
          </UFormField>
          <UFormField label="WhatsApp">
            <template #hint><UBadge color="neutral" variant="soft" size="sm">Autocompletado</UBadge></template>
            <UInput :model-value="cotizacion.cliente_whatsapp || '—'" disabled class="w-full" />
          </UFormField>
          <UFormField label="Correo electrónico">
            <template #hint><UBadge color="neutral" variant="soft" size="sm">Autocompletado</UBadge></template>
            <UInput :model-value="cotizacion.cliente_correo || '—'" disabled class="w-full" />
          </UFormField>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="text-lg font-semibold text-gray-900">Proveedores</h2>
        <p class="mt-1 text-sm text-gray-500">Agrega uno o más proveedores. Cada uno puede tener distinto tipo de pago y modalidad.</p>

        <div v-for="(proveedor, indice) in proveedores" :key="proveedor.id || `nuevo-${indice}`" class="mt-4 rounded-xl border border-gray-200 p-4">
          <div class="mb-4 flex items-center justify-between gap-2">
            <h3 class="font-semibold text-gray-900">Proveedor {{ indice + 1 }}</h3>
            <div class="flex items-center gap-2">
              <UBadge v-if="proveedor.moneda" :color="proveedor.moneda === 'RMB' ? 'warning' : 'success'" variant="soft">{{ proveedor.moneda }}</UBadge>
              <UButton v-if="editable && proveedores.length > 1" type="button" color="error" variant="ghost" icon="i-lucide-trash-2" size="sm" @click="quitar(indice)" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <UFormField label="Código de proveedor" required help="Ventas elige el código que el intranet tiene para este cliente.">
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Ventas</UBadge></template>
              <USelect v-model="proveedor.code_supplier" :items="opcionesCodigo(proveedor.code_supplier)" :disabled="!editable" placeholder="Selecciona" class="w-full" @update:model-value="alElegirCodigo(proveedor)" />
            </UFormField>
            <UFormField label="Nombre del proveedor">
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Opcional</UBadge></template>
              <UInput v-model="proveedor.nombre_proveedor" :disabled="!editable" placeholder="Ej: Foshan Light Industry Co." class="w-full" />
            </UFormField>
            <UFormField label="Nombre del producto" help="Información registrada por Ventas en Por embarcar.">
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Autocompletado</UBadge></template>
              <UInput :model-value="proveedor.producto || '—'" disabled class="w-full" />
            </UFormField>
            <UFormField label="Moneda" required>
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Ventas</UBadge></template>
              <USelect v-model="proveedor.moneda" :items="monedas" :disabled="!editable" class="w-full" @update:model-value="alCambiarMoneda(proveedor)" />
            </UFormField>
            <UFormField label="Tipo de pago">
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Auto / según moneda</UBadge></template>
              <USelect v-model="proveedor.tipo_pago" :items="opcionesTipoPago(proveedor)" :disabled="proveedor.moneda !== 'USD' || !editable" class="w-full" />
            </UFormField>
            <UFormField label="Valor de carga" required>
              <template #hint><UBadge color="neutral" variant="soft" size="sm">Ventas</UBadge></template>
              <UInput v-model.number="proveedor.valor_carga_usd" :disabled="!editable" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" />
            </UFormField>
          </div>

          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <div class="rounded-xl border border-gray-200 p-4">
              <p class="font-semibold text-gray-900">Modalidad de abono del cliente</p>
              <p class="text-sm text-gray-500">Define cómo el cliente abonará a Pro Business.</p>
              <URadioGroup v-model="proveedor.modalidad_abono" :items="opcionesAbono" :disabled="!editable" class="mt-3" @update:model-value="alCambiarAbono(proveedor)" />
              <p v-if="notaAbono(proveedor)" class="mt-2 text-xs text-gray-500">{{ notaAbono(proveedor) }}</p>
            </div>
            <div class="rounded-xl border border-gray-200 p-4">
              <p class="font-semibold text-gray-900">Modalidad de pago al proveedor</p>
              <p class="text-sm text-gray-500">Define cómo Pro Business pagará al proveedor.</p>
              <URadioGroup v-model="proveedor.modalidad_pago" :items="opcionesPago" :disabled="!editable || proveedor.moneda === 'USD'" class="mt-3" @update:model-value="alCambiarPago(proveedor)" />
              <p v-if="notaPago(proveedor)" class="mt-2 text-xs text-gray-500">{{ notaPago(proveedor) }}</p>
            </div>
          </div>

          <div v-if="fraccionado(proveedor)" class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p class="font-semibold text-gray-900">Forma de fraccionamiento</p>
            <p class="text-sm text-gray-500">Define cómo se dividirán los importes en ambas modalidades.</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <UButton v-for="preset in presets" :key="preset.a" type="button" size="sm" :color="esPreset(proveedor, preset.a) ? 'primary' : 'neutral'" :variant="esPreset(proveedor, preset.a) ? 'solid' : 'outline'" :disabled="!editable" @click="elegirPreset(proveedor, indice, preset.a, preset.b)">{{ preset.label }}</UButton>
              <UButton type="button" size="sm" :color="esOtro(proveedor, indice) ? 'primary' : 'neutral'" :variant="esOtro(proveedor, indice) ? 'solid' : 'outline'" :disabled="!editable" @click="activarOtro(indice)">{{ etiquetaOtro(proveedor, indice) }}</UButton>
            </div>
            <UFormField v-if="esOtro(proveedor, indice)" label="Monto de la 1.ª parte" class="mt-3 max-w-xs">
              <UInput :model-value="montoPrimera(proveedor)" :disabled="!editable" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" @update:model-value="alMontoOtro(proveedor, $event)" />
            </UFormField>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <div class="rounded-lg bg-white p-3">
                <p class="text-xs font-bold uppercase text-gray-500">1.ª parte</p>
                <p class="mt-1 text-lg font-bold text-gray-900">{{ partes(proveedor).texto1 }}</p>
                <p class="text-sm text-gray-500">{{ textoCombo(proveedor)?.cap1 }}</p>
                <p v-if="proveedor.modalidad_abono === 'fraccionado'" class="mt-2 text-xs text-gray-500">Fecha del abono: al registrar el abono</p>
              </div>
              <div class="rounded-lg bg-white p-3">
                <p class="text-xs font-bold uppercase text-gray-500">2.ª parte</p>
                <p class="mt-1 text-lg font-bold text-gray-900">{{ partes(proveedor).texto2 }}</p>
                <p class="text-sm text-gray-500">{{ textoCombo(proveedor)?.cap2 }}</p>
                <div v-if="proveedor.modalidad_abono === 'fraccionado'" class="mt-2">
                  <p class="text-xs font-semibold text-gray-700">{{ textoCombo(proveedor)?.fecha }} <span class="text-gray-400">(opcional en la cotización)</span></p>
                  <UInput v-model="proveedor.fecha_cuota_2" :disabled="!editable" type="date" :min="hoy" class="mt-1 w-full" />
                  <p class="mt-1 text-xs" :class="proveedor.fecha_cuota_2 ? 'text-gray-700' : 'text-gray-400'">{{ textoFecha(proveedor.fecha_cuota_2) }}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span class="text-xs text-gray-500">Atajo:</span>
                    <UButton v-for="dias in [15, 20, 30]" :key="dias" type="button" size="xs" color="neutral" variant="outline" :disabled="!editable" @click="proveedor.fecha_cuota_2 = sumarDias(dias)">En {{ dias }} días</UButton>
                  </div>
                </div>
              </div>
            </div>
            <p class="mt-3 text-sm" :class="partes(proveedor).ok ? 'font-semibold text-green-700' : 'text-gray-500'">{{ partes(proveedor).total }}</p>
            <p v-if="textoCombo(proveedor)" class="mt-1 text-sm text-gray-600">{{ textoCombo(proveedor)?.res }} <UBadge color="neutral" variant="soft" size="sm">{{ textoCombo(proveedor)?.com }}</UBadge></p>
          </div>

          <div class="mt-4">
            <p class="text-sm font-semibold text-gray-900">Comisiones a aplicar sobre este proveedor</p>
            <div class="mt-2 flex flex-col gap-2">
              <UCheckbox v-model="proveedor.comision_bancaria" :disabled="!editable" label="Comisión bancaria / plataforma (tarifa fija configurada)" />
              <UCheckbox v-model="proveedor.comision_administrativa" :disabled="!editable" label="Comisión administrativa (tarifa fija configurada)" />
            </div>
          </div>

          <div class="mt-4 border-t border-gray-100 pt-4">
            <p class="text-sm font-medium text-gray-900">Proforma de la carga <UBadge color="neutral" variant="soft" size="sm">Ventas</UBadge></p>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <label class="inline-flex" :class="editable && proveedor.id ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'">
                <span class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">Seleccionar archivo</span>
                <input type="file" class="sr-only" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" :disabled="!editable || !proveedor.id" @change="subirProforma(proveedor, $event)" />
              </label>
              <span class="text-sm text-gray-500">{{ proveedor.proforma_nombre || 'Sin archivos seleccionados' }}</span>
              <a v-if="proveedor.proforma_url" :href="proveedor.proforma_url" target="_blank" class="text-sm font-semibold text-primary-600">Ver</a>
            </div>
            <p class="mt-1 text-xs text-gray-500">{{ proveedor.id ? 'PDF, JPG, PNG, Word o Excel.' : 'Guarda la cotización para adjuntar la proforma.' }}</p>
          </div>
        </div>

        <UButton v-if="editable" type="button" color="neutral" variant="outline" class="mt-4" icon="i-lucide-plus" @click="agregar">Agregar proveedor</UButton>
      </section>

      <section v-if="mostrarResumen" class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="text-lg font-semibold text-gray-900">Resumen de pago por proveedor</h2>
        <p class="mt-1 text-sm text-gray-500">Se genera al guardar, con las comisiones marcadas. Los importes en naranja son lo que se paga ahora.</p>
        <div v-if="hayYuanes" class="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-gray-50 p-4">
          <p class="text-sm text-gray-600">USD — Consultar con el Banco de China. 1 USD = RMB (CNY)</p>
          <UFormField label="Tipo de cambio" class="w-36">
            <UInput v-model.number="tipoCambio" :disabled="!editable" type="number" min="0" step="0.01" placeholder="6.70" class="w-full" />
          </UFormField>
          <UCheckbox v-model="tipoCambioConfirmado" :disabled="!editable" label="Tipo de cambio confirmado" />
        </div>
        <div class="mt-4 space-y-3">
          <article v-for="(proveedor, indice) in proveedoresConValor" :key="`resumen-${proveedor.id || indice}`" class="rounded-xl border border-gray-200 p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="font-semibold text-gray-900">Proveedor {{ indice + 1 }}: {{ proveedor.code_supplier || 'Sin código' }}</p>
                <p class="text-sm text-gray-500">{{ [proveedor.nombre_proveedor, proveedor.producto, etiquetaPago(proveedor), etiquetaModalidad(proveedor)].filter(Boolean).join(' · ') }}</p>
              </div>
              <div v-if="proveedor.calculo" class="text-right">
                <p class="text-xs text-gray-500">{{ proveedor.calculo.cuotas.length > 1 ? 'Total del proveedor (2 cuotas)' : 'Total del proveedor' }}</p>
                <p class="text-lg font-bold text-gray-900">${{ dinero(proveedor.calculo.total) }}</p>
              </div>
            </div>
            <div v-if="proveedor.calculo?.cuotas?.length > 1" class="mt-3 grid gap-3 md:grid-cols-2">
              <div v-for="cuota in proveedor.calculo.cuotas" :key="cuota.numero" class="rounded-lg bg-gray-50 p-3 text-sm">
                <p class="font-semibold">Cobro {{ cuota.numero }} ({{ cuota.porcentaje }}%) <UBadge :color="cuota.numero === 1 ? 'primary' : 'neutral'" variant="soft" size="sm">{{ cuota.numero === 1 ? 'Ahora' : (proveedor.fecha_cuota_2 ? `Fecha aprox. ${fechaCorta(proveedor.fecha_cuota_2)}` : 'Fecha por definir') }}</UBadge></p>
                <p class="mt-2 flex justify-between"><span>Valor de carga</span><span>${{ dinero(cuota.carga) }}</span></p>
                <p v-if="proveedor.comision_bancaria" class="flex justify-between"><span>Comisión bancaria / plataforma</span><span>{{ cuota.numero === 1 && proveedor.calculo.etiqueta_bancaria ? proveedor.calculo.etiqueta_bancaria : `$${dinero(cuota.bancaria)}` }}</span></p>
                <p v-if="proveedor.comision_administrativa" class="flex justify-between"><span>Comisión administrativa</span><span>${{ dinero(cuota.administrativa) }}</span></p>
                <p class="mt-2 flex justify-between font-bold" :class="cuota.numero === 1 ? 'text-primary-600' : 'text-gray-900'"><span>Total cobro {{ cuota.numero }}</span><span>${{ dinero(cuota.total) }}</span></p>
              </div>
            </div>
            <div v-else-if="proveedor.calculo" class="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
              <p class="font-semibold">Cobro único <UBadge color="primary" variant="soft" size="sm">Ahora</UBadge></p>
              <p class="mt-2 flex justify-between"><span>Valor de carga</span><span>${{ dinero(proveedor.calculo.valor_carga_usd) }}</span></p>
              <p v-if="proveedor.comision_bancaria" class="flex justify-between"><span>Comisión bancaria / plataforma</span><span>{{ proveedor.calculo.etiqueta_bancaria || `$${dinero(proveedor.calculo.bancaria)}` }}</span></p>
              <p v-if="proveedor.comision_administrativa" class="flex justify-between"><span>Comisión administrativa</span><span>${{ dinero(proveedor.calculo.administrativa) }}</span></p>
              <p class="mt-2 flex justify-between font-bold text-primary-600"><span>Total a pagar ahora</span><span>${{ dinero(proveedor.calculo.total_ahora) }}</span></p>
            </div>
            <p v-else class="mt-3 text-sm text-gray-500">Guarda la cotización para ver las comisiones de este proveedor.</p>
          </article>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span class="font-semibold text-gray-900">Total a pagar ahora</span>
          <span class="text-2xl font-bold text-primary-600">${{ dinero(cotizacion.total_ahora) }}</span>
        </div>
        <p v-if="cotizacion.total !== cotizacion.total_ahora" class="text-right text-sm text-gray-500">Total de la cotización con la cuota 2: ${{ dinero(cotizacion.total) }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton type="button" color="neutral" variant="outline" icon="i-lucide-message-circle" :loading="enviando" @click="prepararWhatsapp">Enviar resumen al cliente (WhatsApp)</UButton>
          <UButton type="button" color="neutral" variant="outline" icon="i-lucide-file-down" :loading="generandoPdf" @click="descargarPdf">Descargar PDF</UButton>
        </div>
        <div v-if="vistaPrevia" class="mt-4 rounded-xl bg-gray-50 p-4">
          <p class="text-sm font-semibold text-gray-900">Vista previa de WhatsApp</p>
          <pre class="mt-2 whitespace-pre-wrap text-sm text-gray-700">{{ vistaPrevia.texto }}</pre>
          <p class="mt-2 text-sm text-gray-500">{{ vistaPrevia.nota }}</p>
        </div>
      </section>

      <section v-if="cotizacion.historial?.length" class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="font-semibold text-gray-900">Historial</h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="(evento, i) in cotizacion.historial" :key="i">
            <span class="text-gray-500">{{ formatearFecha(evento.fecha) }}</span>
            · {{ evento.usuario }} · {{ evento.accion }}
            <span v-if="evento.detalle"> — {{ evento.detalle }}</span>
          </li>
        </ul>
      </section>

      <div v-if="editable" class="flex flex-wrap gap-2">
        <UButton type="submit" color="neutral" variant="outline" :loading="guardando">Guardar cotización</UButton>
        <UButton v-if="cotizacion.puede_renovar" type="button" color="warning" variant="soft" @click="renovar">Renovar cotización</UButton>
        <UButton type="button" color="primary" :loading="creandoSolicitud" @click="crearSolicitud">Guardar y crear solicitud</UButton>
      </div>
      <p v-if="editable" class="text-sm text-gray-500"><strong>Toda solicitud nace de una cotización.</strong> Usa Guardar cotización si el cliente solo quiere saber el costo. Si ya confirmó, Guardar y crear solicitud registra la cotización y crea la solicitud en un solo paso.</p>
      <ul v-if="editable && cotizacion.faltantes.length" class="list-disc pl-5 text-sm text-red-600">
        <li v-for="falta in cotizacion.faltantes" :key="falta">{{ falta }}</li>
      </ul>
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

const fraccionOtro = ref<Record<number, boolean>>({})
const monedas = [
  { label: 'RMB — Yuan chino', value: 'RMB' },
  { label: 'USD — Dólar americano', value: 'USD' }
]
const opcionesAbono = [
  { label: 'Total (1 abono)', value: 'total' },
  { label: 'Fraccionado (máx. 2 abonos)', value: 'fraccionado' }
]
const opcionesPago = [
  { label: 'Total (1 pago)', value: 'total' },
  { label: 'Fraccionado (máx. 2 pagos)', value: 'fraccionado' }
]
const presets = [
  { a: 50, b: 50, label: '50% – 50%' },
  { a: 30, b: 70, label: '30% – 70%' },
  { a: 40, b: 60, label: '40% – 60%' }
]

const editable = computed(() => !!cotizacion.value?.puede_editar)
const hoy = computed(() => new Date().toISOString().slice(0, 10))
const mostrarResumen = computed(() => proveedores.value.some(proveedor => proveedor.moneda && Number(proveedor.valor_carga_usd) > 0))
const hayYuanes = computed(() => proveedores.value.some(proveedor => proveedor.moneda === 'RMB' && Number(proveedor.valor_carga_usd) > 0))
const proveedoresConValor = computed(() => proveedores.value.filter(proveedor => proveedor.moneda && Number(proveedor.valor_carga_usd) > 0))
const dinero = (valor: number) => Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fraccionado(proveedor: PagoProveedorProveedor) {
  return proveedor.modalidad_abono === 'fraccionado' || (proveedor.moneda === 'RMB' && proveedor.modalidad_pago === 'fraccionado')
}

function opcionesCodigo(actual: string | null) {
  const usados = new Set(proveedores.value.map(item => item.code_supplier).filter(Boolean))
  return (cotizacion.value?.codigos_disponibles || [])
    .filter(codigo => codigo.code_supplier === actual || !usados.has(codigo.code_supplier))
    .map(codigo => ({ label: codigo.code_supplier, value: codigo.code_supplier }))
}

function opcionesTipoPago(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') {
    return [
      { label: 'USD / T-T', value: 'tt' },
      { label: 'USD / Tarjeta · Próximamente', value: 'tarjeta', disabled: true }
    ]
  }
  return [{ label: 'RMB / Transferencia', value: 'transferencia' }]
}

function combo(proveedor: PagoProveedorProveedor) {
  const pagoFraccionado = proveedor.modalidad_pago === 'fraccionado'
  const abonoFraccionado = proveedor.modalidad_abono === 'fraccionado'
  if (pagoFraccionado && abonoFraccionado) return 'b'
  if (pagoFraccionado) return 'a'
  if (abonoFraccionado) return 'c'
  return 't'
}

function textoCombo(proveedor: PagoProveedorProveedor) {
  const tipo = combo(proveedor)
  if (tipo === 'a') return { cap1: '1.er pago al proveedor', cap2: '2.º pago al proveedor', res: 'El cliente realiza un solo abono y Pro Business paga al proveedor en 2 partes.', com: 'Bancaria: 1 vez · Administrativa: 2 veces', fecha: '' }
  if (tipo === 'b') return { cap1: 'Cuota 1', cap2: 'Cuota 2', res: 'El cliente realiza 2 abonos (cuotas) y cada cuota se paga al proveedor.', com: 'Comisiones: en cada cuota.', fecha: 'Fecha en que el cliente se compromete a pagar la 2.ª cuota' }
  if (tipo === 'c') return { cap1: '1.er abono', cap2: '2.º abono', res: 'El cliente realiza 2 abonos y Pro Business paga al proveedor una sola vez, cuando el cliente haya abonado el total.', com: 'Comisiones: una sola vez.', fecha: 'Fecha en que el cliente se compromete a hacer el 2.º abono' }
  return null
}

function notaAbono(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'RMB' && proveedor.modalidad_abono !== 'fraccionado') return 'Si el cliente envía 2 vouchers que sumen el total, se cuenta como un solo abono: la comisión se cobra una sola vez.'
  return ''
}

function notaPago(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') return 'Bloqueado en dólares: sigue la modalidad de abono del cliente.'
  if (proveedor.moneda === 'RMB' && proveedor.modalidad_pago !== 'fraccionado' && proveedor.modalidad_abono === 'fraccionado') return 'Con pago total, el proveedor solo se paga cuando el cliente haya abonado el total.'
  return ''
}

function partes(proveedor: PagoProveedorProveedor) {
  const valor = Number(proveedor.valor_carga_usd) || 0
  const primero = Number(proveedor.porcentaje_1) || 0
  const segundo = Number(proveedor.porcentaje_2 ?? (100 - primero)) || 0
  const simbolo = proveedor.moneda === 'RMB' ? '¥' : '$'
  const ok = primero > 0 && segundo > 0 && Math.abs(primero + segundo - 100) < 0.05 && valor > 0 && !!proveedor.moneda
  const monto1 = Math.round(valor * primero) / 100
  const monto2 = +(valor - monto1).toFixed(2)
  const monto = (numero: number) => `${simbolo}${dinero(numero)}`
  if (!ok) {
    return { ok: false, texto1: '—', texto2: '—', total: proveedor.moneda && valor > 0 ? 'Elige cómo se reparte el pago.' : 'Ingresa la moneda y el valor de carga para ver los montos.' }
  }
  return { ok: true, texto1: `${primero}% · ${monto(monto1)}`, texto2: `${segundo}% · ${monto(monto2)}`, total: `Total ${monto(valor)} — Correcto` }
}

function esPreset(proveedor: PagoProveedorProveedor, porcentaje: number) {
  return !fraccionOtro.value[proveedores.value.indexOf(proveedor)] && Number(proveedor.porcentaje_1) === porcentaje
}

function esOtro(proveedor: PagoProveedorProveedor, indice: number) {
  if (fraccionOtro.value[indice]) return true
  const porcentaje = Number(proveedor.porcentaje_1)
  return porcentaje > 0 && porcentaje < 100 && porcentaje !== 50 && porcentaje !== 30 && porcentaje !== 40
}

function etiquetaOtro(proveedor: PagoProveedorProveedor, indice: number) {
  if (!esOtro(proveedor, indice)) return 'Otro'
  const primero = Number(proveedor.porcentaje_1) || 0
  const segundo = Number(proveedor.porcentaje_2 ?? (100 - primero)) || 0
  if (!(primero > 0)) return 'Otro'
  return `Otro: ${primero}% – ${segundo}%`
}

function elegirPreset(proveedor: PagoProveedorProveedor, indice: number, primero: number, segundo: number) {
  fraccionOtro.value[indice] = false
  proveedor.porcentaje_1 = primero
  proveedor.porcentaje_2 = segundo
}

function activarOtro(indice: number) {
  fraccionOtro.value[indice] = true
}

function montoPrimera(proveedor: PagoProveedorProveedor) {
  const valor = Number(proveedor.valor_carga_usd) || 0
  const porcentaje = Number(proveedor.porcentaje_1) || 0
  if (!(valor > 0) || !(porcentaje > 0) || porcentaje >= 100) return ''
  return (Math.round(valor * porcentaje) / 100).toFixed(2)
}

function alMontoOtro(proveedor: PagoProveedorProveedor, raw: string | number) {
  const valor = Number(proveedor.valor_carga_usd) || 0
  const monto = Number(raw) || 0
  if (valor > 0 && monto > 0 && monto < valor) {
    const primero = Math.round((monto / valor) * 10000) / 100
    proveedor.porcentaje_1 = primero
    proveedor.porcentaje_2 = Math.round((100 - primero) * 100) / 100
  }
}

function sumarDias(dias: number) {
  const fecha = new Date()
  fecha.setHours(12, 0, 0, 0)
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

function textoFecha(iso: string | null) {
  if (!iso) return 'Aún no hay fecha elegida.'
  const fecha = new Date(`${iso}T12:00:00`)
  const hoyFecha = new Date()
  hoyFecha.setHours(12, 0, 0, 0)
  const dias = Math.round((fecha.getTime() - hoyFecha.getTime()) / 86400000)
  const larga = fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const cuando = dias === 0 ? 'hoy' : dias > 0 ? `en ${dias} día${dias > 1 ? 's' : ''}` : `hace ${-dias} día${-dias > 1 ? 's' : ''}`
  return `${larga} · ${cuando} (fecha aproximada)`
}

function fechaCorta(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

function etiquetaPago(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') return proveedor.tipo_pago === 'tarjeta' ? 'USD / Tarjeta' : 'USD / T-T'
  return 'RMB / Transferencia'
}

function etiquetaModalidad(proveedor: PagoProveedorProveedor) {
  const tipo = combo(proveedor)
  if (tipo === 'b') return '2 cuotas'
  if (tipo === 'a') return '2 pagos al proveedor'
  if (tipo === 'c') return '2 abonos'
  return 'Pago único'
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
  if (!catalogo) {
    proveedor.producto = ''
    return
  }
  proveedor.producto = catalogo.producto || ''
  if (!proveedor.nombre_proveedor && catalogo.nombre) proveedor.nombre_proveedor = catalogo.nombre
}

function alCambiarMoneda(proveedor: PagoProveedorProveedor) {
  proveedor.tipo_pago = proveedor.moneda === 'USD' ? 'tt' : 'transferencia'
  if (proveedor.moneda === 'USD') proveedor.modalidad_pago = proveedor.modalidad_abono
}

function asegurarReparto(proveedor: PagoProveedorProveedor) {
  if (!fraccionado(proveedor)) return
  const porcentaje = Number(proveedor.porcentaje_1)
  if (porcentaje > 0 && porcentaje < 100) return
  proveedor.porcentaje_1 = 50
  proveedor.porcentaje_2 = 50
}

function alCambiarAbono(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') proveedor.modalidad_pago = proveedor.modalidad_abono
  else if (proveedor.modalidad_abono === 'fraccionado') proveedor.modalidad_pago = 'fraccionado'
  asegurarReparto(proveedor)
}

function alCambiarPago(proveedor: PagoProveedorProveedor) {
  if (proveedor.moneda === 'USD') proveedor.modalidad_pago = proveedor.modalidad_abono
  asegurarReparto(proveedor)
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

