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
      :primary-search-value="busqueda"
      :show-primary-search="true"
      :show-primary-search-label="false"
      primary-search-placeholder="Buscar por cotización, cliente o consolidado"
      :show-filters="true"
      :filter-config="filtrosConfig"
      :filters-value="filtros"
      :show-export="false"
      empty-state-message="No hay cotizaciones de pago a proveedor."
      :show-new-button="true"
      new-button-label="Nueva cotización"
      :on-new-button-click="() => nuevaAbierta = true"
      @update:primary-search="alBuscar"
      @page-change="alCambiarPagina"
      @items-per-page-change="alCambiarTamano"
      @filter-change="alFiltrar"
    >
      <template #body-top>
        <div class="my-3 flex flex-wrap items-end gap-3">
          <UButton size="sm" color="neutral" variant="soft" @click="vigenciaAbierta = true">Vigencia de cotizaciones</UButton>
          <label class="text-sm text-gray-600">
            Resaltar desde (días)
            <input v-model.number="highlightAfterDays" type="number" min="1" class="mt-1 block w-28 rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Sin definir" />
          </label>
        </div>
      </template>
    </DataTable>

    <NuevaCotizacionModal :open="nuevaAbierta" @close="nuevaAbierta = false" @created="abrirFormulario" />

    <SupplierPaymentWindow
      :open="vigenciaAbierta"
      title="Vigencia de cotizaciones"
      subtitle="Se cuenta desde que se crea la cotización. Al vencer, hay que renovarla para crear la solicitud."
      @close="vigenciaAbierta = false"
    >
      <label class="text-sm text-gray-600">Vigencia (horas hábiles, sin sábados ni domingos)
        <input v-model.number="horasVigencia" type="number" min="1" max="240" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900" />
      </label>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="vigenciaAbierta = false">Cancelar</UButton>
        <UButton color="primary" :loading="guardandoVigencia" @click="guardarVigencia">Guardar</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import type { PagoProveedorCotizacion, PagoProveedorPaginacion } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import { useModal } from '~/composables/commons/useModal'
import { UBadge, UButton } from '#components'
import NuevaCotizacionModal from '~/components/pago-proveedor/NuevaCotizacionModal.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'

const { showSuccess, showError, showConfirmation } = useModal()
const filas = ref<PagoProveedorCotizacion[]>([])
const cargando = ref(false)
const busqueda = ref('')
const filtros = ref<Record<string, string>>({ estado: 'todos' })
const paginacion = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const horasVigencia = ref(48)
const guardandoVigencia = ref(false)
const nuevaAbierta = ref(false)
const vigenciaAbierta = ref(false)

const filtrosConfig: FilterConfig[] = [
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
  }
]

const dinero = (valor: number) => `$${Number(valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const columns: TableColumn<PagoProveedorCotizacion>[] = [
  { accessorKey: 'codigo', header: 'Cotización' },
  { accessorKey: 'creado_en', header: 'Fecha', cell: ({ row }) => formatDate(row.original.creado_en) },
  { accessorKey: 'antiguedad', header: 'Antigüedad', cell: ({ row }) => ageLabel(row.original) },
  { accessorKey: 'vigencia_texto', header: 'Vigencia' },
  { accessorKey: 'consolidado', header: 'Consolidado' },
  { accessorKey: 'cliente_nombre', header: 'Cliente' },
  { accessorKey: 'proveedores', header: 'Proveedores', cell: ({ row }) => supplierSummary(row.original) },
  { accessorKey: 'total_ahora', header: 'Total a pagar', cell: ({ row }) => dinero(row.original.total_ahora || row.original.total) },
  { accessorKey: 'tipo_cambio', header: 'T.C. usado', cell: ({ row }) => row.original.tipo_cambio ?? '—' },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => h(UBadge, {
      color: row.original.estado === 'confirmada' ? 'success' : row.original.vencida ? 'error' : 'warning',
      variant: 'soft',
      label: row.original.estado === 'confirmada' ? 'Confirmada' : row.original.vencida ? 'Vencida' : 'Pendiente'
    })
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }) => h('div', { class: 'flex flex-wrap gap-1' }, quoteActions(row.original))
  }
]

const highlightAfterDays = ref<number | null>(null)

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-PE')
}

function ageDays(createdAt: string | null) {
  if (!createdAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000))
}

function ageLabel(quote: PagoProveedorCotizacion) {
  if (quote.estado !== 'pendiente') return '—'
  const days = ageDays(quote.creado_en)
  const text = days === 0 ? 'hoy' : days === 1 ? 'hace 1 día' : `hace ${days} días`
  const marked = highlightAfterDays.value && days >= highlightAfterDays.value
  return marked ? `${text} · seguimiento` : text
}

function supplierSummary(quote: PagoProveedorCotizacion) {
  return (quote.proveedores || []).map((provider) => {
    const payment = provider.moneda === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T'
    const name = provider.nombre_proveedor ? ` · ${provider.nombre_proveedor}` : ''
    return `${provider.code_supplier || 'Sin código'}${name} · ${payment}`
  }).join(' · ') || '—'
}

function quoteActions(quote: PagoProveedorCotizacion) {
  const open = () => navigateTo(`/pago-proveedor/cotizaciones/${quote.id}`)
  const buttons = [
    h(UButton, { icon: 'i-heroicons-pencil-square', size: 'xs', color: 'neutral', variant: 'ghost', title: 'Editar', onClick: open })
  ]
  if (quote.puede_enviar) {
    buttons.push(h(UButton, { icon: 'i-heroicons-chat-bubble-left-right', size: 'xs', color: 'success', variant: 'ghost', title: 'Vista previa de WhatsApp', onClick: () => previewWhatsapp(quote) }))
    buttons.push(h(UButton, { icon: 'i-heroicons-document-arrow-down', size: 'xs', color: 'neutral', variant: 'ghost', title: 'Descargar PDF', onClick: () => downloadPdf(quote) }))
  }
  if (quote.puede_eliminar) {
    buttons.push(h(UButton, { icon: 'i-heroicons-trash', size: 'xs', color: 'error', variant: 'ghost', title: 'Eliminar', onClick: () => confirmDelete(quote) }))
  }
  if (quote.puede_renovar) {
    buttons.push(h(UButton, { size: 'xs', color: 'primary', label: 'Renovar', onClick: () => renewQuote(quote) }))
  } else if (quote.puede_crear_solicitud) {
    buttons.push(h(UButton, { size: 'xs', color: 'primary', label: 'Crear solicitud', onClick: () => createRequest(quote) }))
  }
  return buttons
}

async function cargar() {
  cargando.value = true
  try {
    const respuesta = await PagoProveedorService.listarCotizaciones({
      search: busqueda.value,
      estado: filtros.value.estado,
      page: paginacion.value.current_page,
      per_page: paginacion.value.per_page
    })
    filas.value = respuesta.data
    paginacion.value = respuesta.pagination
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
  filtros.value = { ...filtros.value, [clave]: String(normalizado ?? 'todos') }
  paginacion.value.current_page = 1
  cargar()
}

async function previewWhatsapp(quote: PagoProveedorCotizacion) {
  try {
    const response = await PagoProveedorService.vistaPreviaWhatsapp(quote.id)
    showSuccess('Vista previa de WhatsApp', response.data.texto || 'Mensaje listo.')
  } catch (error: any) {
    showError('WhatsApp', error.message || 'No se pudo armar el mensaje.')
  }
}

async function downloadPdf(quote: PagoProveedorCotizacion) {
  try {
    const response = await PagoProveedorService.descargarPdf(quote.id)
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

async function renewQuote(quote: PagoProveedorCotizacion) {
  try {
    await PagoProveedorService.renovarCotizacion(quote.id, null)
    showSuccess('Cotización renovada', 'Confirma el tipo de cambio del día y reenvía el resumen.')
    await cargar()
  } catch (error: any) {
    showError('Renovar', error.message || 'No se pudo renovar.')
  }
}

function createRequest(quote: PagoProveedorCotizacion) {
  showConfirmation('Crear solicitud', `Se confirma ${quote.codigo} y se abre la solicitud.`, async () => {
    try {
      const response = await PagoProveedorService.crearSolicitud(quote.id)
      await navigateTo(`/pago-proveedor/solicitudes/${response.data.id}`)
    } catch (error: any) {
      showError('Solicitud', error.message || 'Faltan datos para crear la solicitud.')
    }
  })
}

function confirmDelete(quote: PagoProveedorCotizacion) {
  showConfirmation('Eliminar cotización', `Se eliminará ${quote.codigo}. Esta acción no se puede deshacer.`, async () => {
    try {
      await PagoProveedorService.eliminarCotizacion(quote.id)
      showSuccess('Cotización eliminada', quote.codigo)
      await cargar()
    } catch (error: any) {
      showError('No se pudo eliminar', error.message || 'Inténtalo de nuevo.')
    }
  })
}

function abrirFormulario(id: number) {
  navigateTo(`/pago-proveedor/cotizaciones/${id}`)
}

async function guardarVigencia() {
  guardandoVigencia.value = true
  try {
    await PagoProveedorService.guardarVigencia(horasVigencia.value)
    vigenciaAbierta.value = false
    showSuccess('Vigencia actualizada', `Las cotizaciones nuevas vencen a las ${horasVigencia.value} horas hábiles.`)
  } catch (error: any) {
    showError('Vigencia', error.message || 'No se pudo guardar.')
  } finally {
    guardandoVigencia.value = false
  }
}

onMounted(async () => {
  try {
    const config = await PagoProveedorService.obtenerConfiguracion()
    const horas = Number(config.data.vigencia_cotizacion_horas)
    if (horas > 0) horasVigencia.value = horas
  } catch {
    horasVigencia.value = 48
  }
  await cargar()
})
</script>
