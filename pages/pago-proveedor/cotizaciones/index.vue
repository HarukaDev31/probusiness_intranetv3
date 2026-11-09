<template>
  <div class="md:p-6">
    <DataTable
      title="Cotizaciones"
      subtitle="Pago a proveedor"
      :show-title="true"
      icon="i-heroicons-banknotes"
      :data="filas"
      :columns="columns"
      :loading="cargando"
      :current-page="paginacion.current_page"
      :total-pages="paginacion.last_page"
      :total-records="paginacion.total"
      :items-per-page="paginacion.per_page"
      :show-primary-search="false"
      :show-filters="false"
      :show-body-top="true"
      :show-export="false"
      empty-state-message="No hay cotizaciones que coincidan con los filtros."
      :show-new-button="true"
      new-button-label="Nueva cotización"
      :on-new-button-click="() => nuevaAbierta = true"
      @page-change="alCambiarPagina"
      @items-per-page-change="alCambiarTamano"
    >
      <template #body-top>
        <div class="grid w-full gap-3 rounded-xl border border-default bg-default p-4 md:grid-cols-[1fr_auto_auto_auto]">
          <UFormField label="Buscar cliente o cotización" :ui="{ label: 'text-[11px] font-semibold uppercase text-muted' }">
            <UInput :model-value="busqueda" icon="i-heroicons-magnifying-glass" placeholder="Ej: Juan Pérez, COT-03" class="w-full" @update:model-value="(v) => alBuscar(String(v ?? ''))" />
          </UFormField>
          <UFormField label="Consolidado" :ui="{ label: 'text-[11px] font-semibold uppercase text-muted' }">
            <USelect :model-value="filtros.consolidado" :items="filtrosConfig[0]!.options" value-key="value" class="w-full md:w-40" @update:model-value="(v) => alFiltrar('consolidado', v)" />
          </UFormField>
          <UFormField label="Estado" :ui="{ label: 'text-[11px] font-semibold uppercase text-muted' }">
            <USelect :model-value="filtros.estado" :items="filtrosConfig[1]!.options" value-key="value" class="w-full md:w-40" @update:model-value="(v) => alFiltrar('estado', v)" />
          </UFormField>
          <UFormField label="Resaltar desde (días)" :ui="{ label: 'text-[11px] font-semibold uppercase text-muted' }">
            <UInput :model-value="filtros.resaltar_desde" type="number" min="0" placeholder="Sin definir" class="w-full md:w-40" @update:model-value="(v) => alFiltrar('resaltar_desde', v)" />
          </UFormField>
        </div>
      </template>
      <template #actions>
        <UButton
          size="md"
          color="neutral"
          variant="soft"
          icon="i-heroicons-cog-6-tooth"
          class="h-8 md:h-11"
          @click="() => { vigenciaAbierta = true }"
        >
          Vigencia de cotizaciones
        </UButton>
      </template>
    </DataTable>
    <p class="mt-2 text-xs text-muted">
      Una cotización no tiene N.° de orden, etapa ni código, y no aparece en «Mis pendientes».
      Pasa a Confirmada sola cuando se crea la solicitud. La antigüedad ayuda a decidir a quién dar seguimiento; en «Resaltar desde» defines desde cuántos días se marca.
    </p>

    <NuevaCotizacionModal :open="nuevaAbierta" @close="nuevaAbierta = false" @accepted="abrirBorrador" />

    <SupplierPaymentWindow
      :open="!!renovarCotizacion"
      title="Renovar cotización"
      :subtitle="renovarCotizacion ? `${renovarCotizacion.cliente_nombre || ''} · Consolidado ${soloConsolidado(renovarCotizacion.consolidado)}` : ''"
      :code="renovarCotizacion?.codigo"
      @close="renovarCotizacion = null"
    >
      <div v-if="renovarCotizacion" class="rounded-xl border border-success/40 bg-success/10 px-4 py-3">
        <p class="text-[11px] font-semibold uppercase text-muted">Nueva vigencia</p>
        <p class="text-lg font-bold text-success">Hasta {{ renovarNuevaVigencia }}</p>
      </div>
      <p v-if="renovarCotizacion" class="text-sm text-muted">Vigencia anterior: <strong class="text-error">venció el {{ renovarCotizacion.vigencia_hasta }}</strong></p>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="renovarCotizacion = null">Cancelar</UButton>
        <UButton color="primary" :loading="renovando" @click="confirmarRenovar">Renovar y ver formulario</UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="!!solicitudCotizacion"
      title="Crear solicitud"
      :subtitle="solicitudCotizacion ? `${solicitudCotizacion.cliente_nombre || ''} · Consolidado ${soloConsolidado(solicitudCotizacion.consolidado)}` : ''"
      :code="solicitudCotizacion?.codigo"
      @close="solicitudCotizacion = null"
    >
      <template v-if="solicitudCotizacion">
        <div class="rounded-lg border border-default">
          <div v-for="(provider, i) in solicitudCotizacion.proveedores || []" :key="i" class="flex items-center justify-between gap-2 border-b border-default px-3 py-2 text-sm last:border-b-0">
            <strong>{{ provider.code_supplier }}</strong>
            <UBadge :color="provider.moneda === 'RMB' ? 'warning' : 'info'" variant="soft" size="sm">{{ provider.moneda === 'RMB' ? 'RMB' : 'USD T-T' }}</UBadge>
          </div>
        </div>
        <div class="flex justify-between rounded-lg bg-primary-50 px-3 py-2 text-sm">
          <span class="text-muted">Total a pagar</span><strong class="text-primary-700">{{ dinero(solicitudCotizacion.total_ahora || solicitudCotizacion.total) }}</strong>
        </div>
        <p class="text-xs font-semibold uppercase text-muted">Requisitos para crear la solicitud</p>
        <UAlert
          :color="solicitudCotizacion.faltantes?.length ? 'warning' : 'success'"
          variant="subtle"
          :title="solicitudCotizacion.faltantes?.length ? `Falta${solicitudCotizacion.faltantes.length > 1 ? 'n' : ''} ${solicitudCotizacion.faltantes.length} dato${solicitudCotizacion.faltantes.length > 1 ? 's' : ''} para crear la solicitud` : 'Todo listo para crear la solicitud'"
        />
        <ul v-if="solicitudCotizacion.faltantes?.length" class="list-disc pl-5 text-sm text-error">
          <li v-for="falta in solicitudCotizacion.faltantes" :key="falta">{{ falta }}</li>
        </ul>
        <p v-else class="text-xs text-muted">Al crearla se genera la solicitud con su N.° de orden, la cotización pasa a Confirmada y los proveedores entran a la etapa 1.</p>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="solicitudCotizacion = null">Cancelar</UButton>
        <UButton v-if="solicitudCotizacion?.faltantes?.length" color="neutral" variant="outline" @click="completarEnFormulario">Completar en el formulario</UButton>
        <UButton color="primary" :loading="creandoSolicitud" :disabled="!solicitudCotizacion?.puede_crear_solicitud" @click="confirmarCrearSolicitud">Crear solicitud</UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="whatsappAbierto"
      :title="whatsappTitulo"
      :subtitle="whatsappDestinatario ? `Destino: ${whatsappDestinatario}` : 'Vista previa del mensaje'"
      @close="cerrarWhatsapp"
    >
      <UCard variant="subtle">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <pre class="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm text-highlighted" v-html="whatsappHtml(whatsappTexto)" />
      </UCard>
      <p v-if="whatsappNota" class="text-sm text-muted">{{ whatsappNota }}</p>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="cerrarWhatsapp">Cerrar</UButton>
        <UButton color="neutral" variant="outline" icon="i-heroicons-document-arrow-down" @click="descargarPdfWhatsapp">Descargar PDF</UButton>
        <UButton color="success" icon="i-heroicons-paper-airplane" :loading="enviandoWhatsapp" :disabled="!whatsappPuedeEnviar" @click="enviarWhatsapp">
          Enviar por WhatsApp
        </UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="vigenciaAbierta"
      title="Vigencia de cotizaciones"
      subtitle="Se cuenta desde que se crea la cotización. Al vencer, hay que renovarla para crear la solicitud."
      @close="vigenciaAbierta = false"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm text-muted">Vigencia (horas)
          <input v-model.number="horasVigencia" type="number" min="1" max="240" class="mt-1 block w-full rounded-lg border border-default px-3 py-2 text-sm font-semibold text-highlighted">
        </label>
        <label class="text-sm text-muted">Se cuentan
          <select v-model="tipoVigencia" class="mt-1 block w-full rounded-lg border border-default px-3 py-2 text-sm font-semibold text-highlighted">
            <option value="habiles">Horas hábiles (sin sábados ni domingos)</option>
            <option value="calendario">Horas corridas</option>
          </select>
        </label>
      </div>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="() => { vigenciaAbierta = false }">Cancelar</UButton>
        <UButton color="primary" :loading="guardandoVigencia" @click="guardarVigencia">Guardar</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import type { PagoProveedorCotizacion, PagoProveedorPaginacion } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useSupplierPaymentQuotes } from '~/composables/pago-proveedor/useSupplierPaymentQuotes'
import { UBadge, UButton } from '#components'
import NuevaCotizacionModal from '~/components/pago-proveedor/NuevaCotizacionModal.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const api = useSupplierPaymentQuotes()

const filas = ref<PagoProveedorCotizacion[]>([])
const consolidados = ref<string[]>([])
const cargando = ref(false)
const busqueda = ref('')
const filtros = ref<Record<string, string>>({ consolidado: 'todos', estado: 'todos', resaltar_desde: '' })
const paginacion = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const horasVigencia = ref(48)
const tipoVigencia = ref<'habiles' | 'calendario'>('habiles')
const guardandoVigencia = ref(false)
const nuevaAbierta = ref(false)
const vigenciaAbierta = ref(false)
const whatsappAbierto = ref(false)
const whatsappId = ref<number | null>(null)
const whatsappCodigo = ref<string | null>(null)
const whatsappTexto = ref('')
const whatsappNota = ref('')
const whatsappDestinatario = ref<string | null>(null)
const whatsappPuedeEnviar = ref(false)
const enviandoWhatsapp = ref(false)
const whatsappTitulo = computed(() => whatsappCodigo.value ? `WhatsApp · ${whatsappCodigo.value}` : 'WhatsApp')

const filtrosConfig = computed<FilterConfig[]>(() => [
  {
    key: 'consolidado',
    label: 'Consolidado',
    placeholder: 'Consolidado',
    options: [
      { label: 'Todos', value: 'todos' },
      ...consolidados.value.map((item) => ({ label: item, value: item }))
    ]
  },
  {
    key: 'estado',
    label: 'Estado',
    placeholder: 'Estado',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'Pendiente', value: 'pendiente' },
      { label: 'Vencida', value: 'vencida' },
      { label: 'Confirmada', value: 'confirmada' }
    ]
  },
  {
    key: 'resaltar_desde',
    label: 'Resaltar desde (días)',
    type: 'number',
    placeholder: 'Sin definir',
    options: []
  }
])

function soloConsolidado(valor: string | null | undefined) {
  return String(valor || '').split(/\s*[-–]\s*/)[0]?.trim() || '—'
}

const dinero = (valor: number) => `$${Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const columns: TableColumn<PagoProveedorCotizacion>[] = [
  {
    accessorKey: 'codigo',
    header: 'Cotización',
    cell: ({ row }) => h('div', [
      h('strong', { class: 'text-highlighted' }, row.original.codigo || '—'),
      row.original.resumen_enviado
        ? h('div', { class: 'mt-0.5 text-[11px] text-muted' }, 'Resumen enviado')
        : null
    ])
  },
  { accessorKey: 'creado_en', header: 'Fecha', cell: ({ row }) => formatDate(row.original.creado_en) },
  {
    accessorKey: 'antiguedad_texto',
    header: 'Antigüedad',
    cell: ({ row }) => {
      const text = row.original.antiguedad_texto || '—'
      if (!row.original.resaltar) return text
      return h(UBadge, { color: 'warning', variant: 'soft', label: `${text} · seguimiento` })
    }
  },
  {
    accessorKey: 'vigencia_texto',
    header: 'Vigencia',
    cell: ({ row }) => {
      if (row.original.estado === 'confirmada') return '—'
      return h('div', [
        h('span', { class: row.original.vencida ? 'font-semibold text-error' : '' }, row.original.vigencia_texto || '—'),
        row.original.vigencia_hasta
          ? h('div', { class: 'text-[11px] text-muted' }, `hasta el ${row.original.vigencia_hasta}`)
          : null
      ])
    }
  },
  { accessorKey: 'consolidado', header: 'Consolidado', cell: ({ row }) => soloConsolidado(row.original.consolidado) },
  { accessorKey: 'cliente_nombre', header: 'Cliente' },
  { accessorKey: 'proveedores', header: 'Proveedores', cell: ({ row }) => supplierSummary(row.original) },
  {
    accessorKey: 'total_ahora',
    header: 'Total a pagar',
    cell: ({ row }) => {
      const ahora = dinero(row.original.total_ahora || row.original.total)
      const total = Number(row.original.total || 0)
      const ahoraNum = Number(row.original.total_ahora || 0)
      const tieneCuotas = total > ahoraNum + 0.004
      return h('div', [
        h('span', ahora),
        tieneCuotas
          ? h('div', { class: 'text-[11px] text-muted' }, `ahora · total en 2 cuotas ${dinero(total)}`)
          : null
      ])
    }
  },
  {
    accessorKey: 'tipo_cambio',
    header: 'T.C. usado',
    cell: ({ row }) => {
      if (!row.original.tipo_cambio) return '—'
      return h('div', [
        h('div', String(row.original.tipo_cambio)),
        row.original.tipo_cambio_fecha
          ? h('div', { class: 'text-[11px] text-muted' }, `(${row.original.tipo_cambio_fecha})`)
          : null
      ])
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => h('div', { class: 'flex flex-col items-start gap-1' }, [
      h(UBadge, {
        color: row.original.estado === 'confirmada' ? 'success' : row.original.vencida ? 'error' : 'warning',
        variant: 'soft',
        label: row.original.estado === 'confirmada' ? 'Confirmada' : row.original.vencida ? 'Vencida' : 'Pendiente'
      }),
      row.original.estado === 'confirmada' && row.original.solicitud_id
        ? h('a', {
            class: 'cursor-pointer text-xs font-medium text-primary hover:underline',
            onClick: () => { void navigateTo(`/pago-proveedor/solicitudes/${row.original.solicitud_id}`) }
          }, "Ver solicitud ↗")
        : null
    ])
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }) => h('div', { class: 'flex flex-wrap gap-1' }, quoteActions(row.original))
  }
]

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-PE')
}

function supplierSummary(quote: PagoProveedorCotizacion) {
  const list = quote.proveedores || []
  if (!list.length) return '—'
  return h('div', { class: 'flex flex-col' }, list.map((provider, index) => {
    const rmb = provider.moneda === 'RMB'
    return h('div', { class: ['py-1', index > 0 ? 'border-t border-dashed border-default' : ''] }, [
      h('div', { class: 'flex flex-wrap items-center gap-2' }, [
        h('strong', { class: 'text-highlighted' }, provider.code_supplier || 'Sin código'),
        h(UBadge, { color: rmb ? 'warning' : 'info', variant: 'soft', size: 'sm', label: rmb ? 'RMB · Transferencia' : 'USD · T-T' })
      ]),
      provider.nombre_proveedor ? h('div', { class: 'text-xs text-muted' }, provider.nombre_proveedor) : null
    ])
  }))
}

function quoteActions(quote: PagoProveedorCotizacion) {
  const open = () => { void navigateTo(`/pago-proveedor/cotizaciones/${quote.id}`) }
  const vencida = quote.estado === 'pendiente' && quote.puede_renovar
  const buttons = [
    h(UButton, {
      icon: quote.puede_editar ? 'i-heroicons-pencil-square' : 'i-heroicons-eye',
      size: 'xs',
      color: 'neutral',
      variant: 'ghost',
      title: vencida ? 'Vencida: renuévala para editarla' : quote.puede_editar ? 'Editar' : 'Ver',
      disabled: vencida,
      onClick: open
    })
  ]
  if (vencida) {
    buttons.push(
      h(UButton, { icon: 'i-heroicons-chat-bubble-left-right', size: 'xs', color: 'neutral', variant: 'ghost', disabled: true, title: 'Vencida: renuévala para enviarla' }),
      h(UButton, { icon: 'i-heroicons-document-arrow-down', size: 'xs', color: 'neutral', variant: 'ghost', disabled: true, title: 'Vencida: renuévala para descargar el PDF' })
    )
  }
  if (!vencida && quote.puede_enviar) {
    buttons.push(h(UButton, {
      icon: 'i-heroicons-chat-bubble-left-right',
      size: 'xs',
      color: 'success',
      variant: 'ghost',
      title: 'WhatsApp',
      onClick: () => { void abrirWhatsapp(quote) }
    }))
  }
  if (!vencida && (quote.puede_descargar_pdf ?? quote.puede_enviar)) {
    buttons.push(h(UButton, {
      icon: 'i-heroicons-document-arrow-down',
      size: 'xs',
      color: 'neutral',
      variant: 'ghost',
      title: 'Descargar PDF',
      onClick: () => { void downloadPdf(quote) }
    }))
  }
  if (quote.puede_eliminar) {
    buttons.push(h(UButton, {
      icon: 'i-heroicons-trash',
      size: 'xs',
      color: 'error',
      variant: 'ghost',
      title: 'Eliminar',
      onClick: () => confirmDelete(quote)
    }))
  }
  if (quote.estado === 'confirmada') {
    // La solicitud se abre desde el enlace de la columna Estado; no es una acción.
  } else if (quote.puede_renovar) {
    buttons.push(h(UButton, { size: 'xs', color: 'primary', label: 'Renovar', onClick: () => { renovarCotizacion.value = quote } }))
  } else if (quote.estado === 'pendiente' && quote.puede_editar) {
    buttons.push(h(UButton, { size: 'xs', color: 'primary', label: 'Crear solicitud', onClick: () => createRequest(quote) }))
  }
  return buttons
}

async function cargar() {
  cargando.value = true
  try {
    const resaltarRaw = Number(filtros.value.resaltar_desde)
    const respuesta = await api.list({
      search: busqueda.value,
      estado: filtros.value.estado,
      consolidado: filtros.value.consolidado,
      resaltar_desde: Number.isFinite(resaltarRaw) && resaltarRaw > 0 ? resaltarRaw : null,
      page: paginacion.value.current_page,
      per_page: paginacion.value.per_page
    })
    filas.value = respuesta.data
    paginacion.value = respuesta.pagination
    if (Array.isArray(respuesta.consolidados) && respuesta.consolidados.length) {
      consolidados.value = respuesta.consolidados
    } else {
      const fromRows = [...new Set(
        (respuesta.data || [])
          .map((row) => row.consolidado)
          .filter((value): value is string => !!value && value.trim() !== '')
      )].sort()
      if (fromRows.length) consolidados.value = fromRows
    }
  } catch (error: any) {
    showError('Cotizaciones', error.message || 'No se pudo cargar el listado.')
  } finally {
    cargando.value = false
  }
}

function alBuscar(valor: string) {
  busqueda.value = valor
  paginacion.value.current_page = 1
  cargar()
}

function alCambiarPagina(pagina: number) {
  paginacion.value.current_page = pagina
  cargar()
}

function alCambiarTamano(tamano: number) {
  paginacion.value.per_page = tamano
  paginacion.value.current_page = 1
  cargar()
}

function alFiltrar(clave: string, valor: unknown) {
  const normalizado = valor && typeof valor === 'object' && 'value' in (valor as Record<string, unknown>)
    ? (valor as Record<string, unknown>).value
    : valor
  const texto = normalizado === null || normalizado === undefined ? '' : String(normalizado)
  filtros.value = {
    ...filtros.value,
    [clave]: clave === 'resaltar_desde' ? texto : (texto || 'todos')
  }
  paginacion.value.current_page = 1
  cargar()
}

function alLimpiarFiltros() {
  filtros.value = { consolidado: 'todos', estado: 'todos', resaltar_desde: '' }
  paginacion.value.current_page = 1
  cargar()
}

async function abrirWhatsapp(quote: PagoProveedorCotizacion) {
  try {
    const response = await withSpinner(() => api.previewWhatsapp(quote.id), 'Preparando mensaje…')
    whatsappId.value = quote.id
    whatsappCodigo.value = quote.codigo
    whatsappTexto.value = response.data.texto || ''
    whatsappNota.value = response.data.nota || ''
    whatsappDestinatario.value = response.data.destinatario || quote.cliente_whatsapp || null
    whatsappPuedeEnviar.value = response.data.puede_enviar !== false && !!whatsappDestinatario.value
    whatsappAbierto.value = true
  } catch (error: any) {
    showError('WhatsApp', error.message || 'No se pudo armar el mensaje.')
  }
}

async function descargarPdfWhatsapp() {
  if (!whatsappId.value) return
  await downloadPdf({ id: whatsappId.value } as PagoProveedorCotizacion)
}

function cerrarWhatsapp() {
  if (enviandoWhatsapp.value) return
  whatsappAbierto.value = false
  whatsappId.value = null
}

async function enviarWhatsapp() {
  if (!whatsappId.value || !whatsappPuedeEnviar.value) return
  enviandoWhatsapp.value = true
  try {
    const response = await withSpinner(() => api.sendWhatsapp(whatsappId.value!), 'Enviando WhatsApp…')
    showSuccess('WhatsApp enviado', response.data.nota || 'Resumen enviado al cliente.')
    whatsappAbierto.value = false
    whatsappId.value = null
    await cargar()
  } catch (error: any) {
    showError('WhatsApp', error.message || 'No se pudo enviar el mensaje.')
  } finally {
    enviandoWhatsapp.value = false
  }
}

async function downloadPdf(quote: PagoProveedorCotizacion) {
  try {
    const response = await api.downloadPdf(quote.id)
    const binary = atob(response.data.base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = response.data.filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (error: any) {
    showError('PDF', error.message || 'No se pudo generar el resumen.')
  }
}

const renovarCotizacion = ref<PagoProveedorCotizacion | null>(null)
const renovando = ref(false)

/** Misma regla que el back: horas hábiles saltan sábado y domingo (hora de Lima, UTC-5). */
function nuevaVigencia(): Date {
  const lima = new Date(Date.now() - 5 * 3600 * 1000)
  if (tipoVigencia.value === 'calendario') return new Date(lima.getTime() + horasVigencia.value * 3600 * 1000)
  let restantes = Math.max(0, horasVigencia.value) * 60
  let cursor = new Date(lima.getTime())
  while (restantes > 0) {
    const dia = cursor.getUTCDay()
    if (dia === 0 || dia === 6) {
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + (dia === 6 ? 2 : 1)))
      continue
    }
    const medianoche = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1))
    const minutosDelDia = Math.floor((medianoche.getTime() - cursor.getTime()) / 60000)
    if (minutosDelDia >= restantes) return new Date(cursor.getTime() + restantes * 60000)
    restantes -= minutosDelDia
    cursor = medianoche
  }
  return cursor
}

function textoLima(fecha: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(fecha.getUTCDate())}/${p(fecha.getUTCMonth() + 1)}/${fecha.getUTCFullYear()} · ${p(fecha.getUTCHours())}:${p(fecha.getUTCMinutes())}`
}

const renovarNuevaVigencia = computed(() => renovarCotizacion.value ? textoLima(nuevaVigencia()) : '')

async function confirmarRenovar() {
  const quote = renovarCotizacion.value
  if (!quote) return
  renovando.value = true
  try {
    await withSpinner(() => api.renew(quote.id), 'Renovando…')
    renovarCotizacion.value = null
    await navigateTo(`/pago-proveedor/cotizaciones/${quote.id}`)
  } catch (error: any) {
    showError('Renovar', error.message || 'No se pudo renovar.')
  } finally {
    renovando.value = false
  }
}

const solicitudCotizacion = ref<PagoProveedorCotizacion | null>(null)
const creandoSolicitud = ref(false)

function createRequest(quote: PagoProveedorCotizacion) {
  solicitudCotizacion.value = quote
}

function completarEnFormulario() {
  const quote = solicitudCotizacion.value
  solicitudCotizacion.value = null
  if (quote) void navigateTo(`/pago-proveedor/cotizaciones/${quote.id}`)
}

async function confirmarCrearSolicitud() {
  const quote = solicitudCotizacion.value
  if (!quote || !quote.puede_crear_solicitud) return
  creandoSolicitud.value = true
  try {
    const respuesta = await withSpinner(() => api.createRequest(quote.id), 'Creando solicitud…')
    solicitudCotizacion.value = null
    showSuccess('Solicitud creada', `N.° ${respuesta.data.numero_orden}`)
    await navigateTo(`/pago-proveedor/solicitudes/${respuesta.data.id}`)
  } catch (error: any) {
    showError('Solicitud', error.message || 'Faltan datos para crear la solicitud.')
  } finally {
    creandoSolicitud.value = false
  }
}

function confirmDelete(quote: PagoProveedorCotizacion) {
  if (!quote.puede_eliminar) {
    showError('Eliminar', 'Solo se pueden eliminar cotizaciones pendientes sin solicitud.')
    return
  }
  showConfirmation(
    'Eliminar cotización',
    `¿Eliminar ${quote.codigo}? Solo aplica a cotizaciones pendientes. Esta acción no se puede deshacer.`,
    async () => {
      try {
        await withSpinner(() => api.remove(quote.id), 'Eliminando…')
        showSuccess('Cotización eliminada', quote.codigo)
        await cargar()
      } catch (error: any) {
        showError('No se pudo eliminar', error.message || 'Inténtalo de nuevo.')
      }
    }
  )
}

function abrirBorrador(codigo: string) {
  navigateTo({ path: '/pago-proveedor/cotizaciones/nueva', query: { cc: codigo } })
}

async function guardarVigencia() {
  if (!horasVigencia.value || horasVigencia.value < 1) {
    showError('Vigencia', 'Ingresa una vigencia de 1 hora o más.')
    return
  }
  guardandoVigencia.value = true
  try {
    await withSpinner(() => api.saveValidity(horasVigencia.value, tipoVigencia.value), 'Guardando…')
    vigenciaAbierta.value = false
    const tipoLabel = tipoVigencia.value === 'habiles' ? 'hábiles' : 'corridas'
    showSuccess('Vigencia actualizada', `Las cotizaciones nuevas vencen a las ${horasVigencia.value} horas ${tipoLabel}.`)
  } catch (error: any) {
    showError('Vigencia', error.message || 'No se pudo guardar.')
  } finally {
    guardandoVigencia.value = false
  }
}

onMounted(async () => {
  try {
    const config = await api.getConfig()
    const horas = Number(config.data.vigencia_cotizacion_horas)
    if (horas > 0) horasVigencia.value = horas
    const tipo = String(config.data.vigencia_cotizacion_tipo || 'habiles')
    tipoVigencia.value = tipo === 'calendario' ? 'calendario' : 'habiles'
  } catch {
    horasVigencia.value = 48
    tipoVigencia.value = 'habiles'
  }
  await cargar()
})
</script>
