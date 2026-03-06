<template>
  <div class="p-6">
    <!-- Header Section -->


  <DataTable title="" :show-pagination="false" :data="general" :columns="generalColumnsByRole" :loading="loadingGeneral || loadingHeaders"
      icon="" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral" :total-records="totalRecordsGeneral"
      :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral" :show-secondary-search="false"
      :show-filters="true" :filter-config="filterConfigGeneral" :show-export="false"
      empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
      @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
      @filter-change="handleFilterChangeGeneral" @clear-filters="handleClearFiltersGeneral" :hide-back-button="false" :show-primary-search="true"
      :primary-search-placeholder="'Buscar por nombre o teléfono'" :filters-value="filtersGeneral"
      :show-body-top="true"
      :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.ADMINISTRACION) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`">
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Factura y Guía #${carga}`" :headers="headersFormatted" :loading="loadingGeneral || loadingHeaders" />
          <div v-if="currentRole === ROLES.CONTABILIDAD" class="flex justify-end">
            <UButton
              icon="i-heroicons-paper-airplane"
              color="primary"
              variant="solid"
              size="sm"
              @click="handleEnviarFormulario"
            >
              Enviar formulario
            </UButton>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGeneral } from '~/composables/cargaconsolidada/factura-guia/useGeneral'
import { USelect, UBadge, UButton, UTooltip } from '#components'
import SimpleUploadFileModal from '~/components/cargaconsolidada/cotizacion-final/CotizacionFinalSimpleUploadFile.vue'
import SendDocumentModal from '~/components/cargaconsolidada/factura-guia/SendDocumentModal.vue'
import EnviarFormularioModal from '~/components/cargaconsolidada/factura-guia/EnviarFormularioModal.vue'
import ContabilidadSendModal from '~/components/cargaconsolidada/factura-guia/ContabilidadSendModal.vue'
import type { ContabilidadAction } from '~/components/cargaconsolidada/factura-guia/ContabilidadSendModal.vue'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import type { TableColumn } from '@nuxt/ui'
import { useUserRole } from '~/composables/auth/useUserRole'
const { general, loadingGeneral, getGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, filtersGeneral, handleSearchGeneral, handlePageChangeGeneral, handleItemsPerPageChangeGeneral, handleFilterChangeGeneral, handleClearFiltersGeneral, uploadFacturaComercial, uploadGuiaRemision, headers, carga, loadingHeaders, getHeaders, deleteFacturaComercial, deleteGuiaRemision } = useGeneral()
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useWhatsapp } from '~/composables/cargaconsolidada/factura-guia/useWhatsapp'
import SectionHeader from '~/components/commons/SectionHeader.vue'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import { formatCurrency } from '~/utils/formatters'
const { withSpinner } = useSpinner()
const cellWrap = (classAdd: string) => (content: any) => h('div', { class: `py-2 px-1 min-w-0 ${classAdd}` }, content)

// Header "Total comprobantes" formateado en dólares
// Headers con Total comprobantes y Total detracciones formateados en dólares (vienen del backend vía getHeaders)
const headersFormatted = computed(() => {
  if (!headers.value?.length) return []
  return headers.value.map((h: { label?: string; value?: string | number; icon?: string; por_usuario?: unknown }) => {
    const label = (h.label || '').toLowerCase()
    const isTotalComprobantes = label.includes('total') && label.includes('comprobante')
    const isTotalDetracciones = label.includes('total') && label.includes('detraccion')
    const isDetraccionPagado = label.includes('detraccion') && label.includes('pagado')
    if (isTotalComprobantes || isTotalDetracciones || isDetraccionPagado) {
      const num = Number(h.value)
      const currency = isTotalComprobantes ? 'USD' : 'PEN'
      return { ...h, value: Number.isFinite(num) ? formatCurrency(num, currency) : (h.value ?? 'N/A') }
    }
    return h
  })
})
const { showSuccess, showError, showConfirmation } = useModal()
const { sendFactura, sendGuia, sendComprobantes, sendGuiasContabilidad, sendDetracciones, sendFormularioContabilidad } = useWhatsapp()
const route = useRoute()
const id = Number(route.params.id)
const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)
const simpleUploadFileModal = overlay.create(SimpleUploadFileModal)
const sendDocumentModal = overlay.create(SendDocumentModal)
const enviarFormularioModal = overlay.create(EnviarFormularioModal)
const contabilidadSendModal = overlay.create(ContabilidadSendModal)

function openPreview (url: string, fileName: string) {
  modalPreview.open({ file: { file_url: url, file_name: fileName }, isOpen: true })
}

// Modal state for creating pagos
const { currentRole, currentId } = useUserRole()
const selectedCliente = ref('')

// Tab state
const activeTab = ref('general') as Ref<string>

// Tab configuration
const tabs = [
  { value: 'general', label: 'General' },
  { value: 'pagos', label: 'Pagos' }
]

const generalColumnsByRole = computed<TableColumn<any>[]>(() => {
  switch (currentRole.value) {
    case ROLES.ADMINISTRACION:
      return generalColumnsAdministrador.value || []
    case ROLES.CONTABILIDAD:
      return generalColumnsContabilidad.value || []
    default:
      return generalColumns.value || []
  }
})
const generalColumnsAdministrador = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N°',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }: { row: any }) => {
      const nombre = row.original?.nombre || ''
      const documento = row.original?.documento || ''
      const correo = row.original?.correo || ''
      const telefono = row.original?.telefono || ''
      return h('div', { class: 'py-2 w-full whitespace-normal' }, [
        h('div', { class: 'font-medium' }, nombre),
        h('div', { class: 'text-sm text-gray-500' }, documento),
        h('div', { class: 'text-sm text-gray-500' }, telefono),
        h('div', { class: 'text-sm text-gray-500' }, correo)
      ])
    }
  },

  {
    accessorKey: 'tipo_cliente',
    header: 'T. Cliente',
    cell: ({ row }: { row: any }) => {
      return row.original.name
    }
  },
  //Ajuste	C.Final	Factura C.	Guia R.
  {
    accessorKey: 'ajuste',
    header: 'Ajuste',
    cell: ({ row }: { row: any }) => {
      return h(UBadge, {
        color: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'error' : 'success',
        label: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'SI' : 'NO'
      })
    }
  },
  {
    accessorKey: 'c_final',
    header: 'C. Final',
    cell: ({ row }: { row: any }) => {
      // cotizacion_final_url SHOW DOWNLOAD ICON 
      if (row.original.cotizacion_final_url) {
        return h(UButton, {
          icon: 'vscode-icons:file-type-excel',
          color: 'primary',
          variant: 'ghost',
          size: 'xl',
          onClick: () => {
            window.open(row.original.cotizacion_final_url, '_blank')
          }
        })
      } else {
        return
      }
    }
  },
  {
    accessorKey: 'factura_c_',
    header: 'Factura C. ',
    cell: ({ row }: { row: any }) => {
      // if factura_comercial exist show download icon else show button to open modal to upload and button delete
      if (row.original.factura_comercial) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',
            onClick: () => {
              window.open(row.original.factura_comercial, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            onClick: () => {
              handleDeleteFacturaComercial(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          label: 'Subir',

          variant: 'outline',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Facturas Electronicas',
              multiple: true,
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file?: File, files?: File[] }) => {
                await handleUploadFacturaComercial(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guia R. ',
    cell: ({ row }: { row: any }) => {
      // if guia_r exist show download icon else show button to open modal to upload
      if (row.original.guia_remision_url) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',

            onClick: () => {
              window.open(row.original.guia_remision_url, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            onClick: () => {
              handleDeleteGuiaRemision(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          variant: 'outline',
          label: 'Subir',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Guia Remisión',
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file: File }) => {
                await handleUploadGuiaRemision(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'whatsapp',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const hasFactura = !!row.original.factura_comercial
      const hasGuia = !!row.original.guia_remision_url
      const clienteNombre = row.original?.nombre || 'Cliente'
      
      // Solo mostrar el botón si hay al menos un documento disponible
      
      
      return h(UTooltip, {
        text: 'Enviar documento por WhatsApp',
        placement: 'top'
      }, {
        default: () => h(UButton, {
          icon: 'i-heroicons-chat-bubble-left-right',
          color: 'success',
          variant: 'ghost',
          onClick: () => {
            sendDocumentModal.open({
              idCotizacion: row.original.id_cotizacion,
              clienteNombre: clienteNombre,
              hasFactura: hasFactura,
              hasGuia: hasGuia,
              onClose: () => sendDocumentModal.close(),
              onSend: async (documentType: 'factura' | 'guia') => {
                await handleSendDocument(row.original.id_cotizacion, documentType)
              }
            })
          }
        })
      })
    }
  }
])
const generalColumns = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N°',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }: { row: any }) => {
      const nombre = row.original?.nombre || ''
      const documento = row.original?.documento || ''
      const correo = row.original?.correo || ''
      const telefono = row.original?.telefono || ''
      return h('div', { class: 'py-2 w-full whitespace-normal' }, [
        h('div', { class: 'font-medium' }, nombre),
        h('div', { class: 'text-sm text-gray-500' }, documento),
        h('div', { class: 'text-sm text-gray-500' }, telefono),
        h('div', { class: 'text-sm text-gray-500' }, correo)
      ])
    }
  },

  {
    accessorKey: 'tipo_cliente',
    header: 'T. Cliente',
    cell: ({ row }: { row: any }) => {
      return row.original.name
    }
  },
  //Ajuste	C.Final	Factura C.	Guia R.
  {
    accessorKey: 'ajuste',
    header: 'Ajuste',
    cell: ({ row }: { row: any }) => {
      return h(UBadge, {
        color: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'error' : 'success',
        label: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'SI' : 'NO'
      })
    }
  },
  {
    accessorKey: 'c_final',
    header: 'C. Final',
    cell: ({ row }: { row: any }) => {
      // cotizacion_final_url SHOW DOWNLOAD ICON 
      if (row.original.cotizacion_final_url) {
        return h(UButton, {
          icon: 'vscode-icons:file-type-excel',
          color: 'primary',
          variant: 'ghost',
          size: 'xl',
          onClick: () => {
            window.open(row.original.cotizacion_final_url, '_blank')
          }
        })
      } else {
        return
      }
    }
  },
  {
    accessorKey: 'factura_c_',
    header: 'Factura C. ',
    cell: ({ row }: { row: any }) => {
      // if factura_comercial exist show download icon else show button to open modal to upload and button delete
      if (row.original.factura_comercial) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',
            onClick: () => {
              window.open(row.original.factura_comercial, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            onClick: () => {
              handleDeleteFacturaComercial(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          label: 'Subir',

          variant: 'outline',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Facturas Electronicas',
              multiple: true,
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file?: File, files?: File[] }) => {
                await handleUploadFacturaComercial(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guia R. ',
    cell: ({ row }: { row: any }) => {
      // if guia_r exist show download icon else show button to open modal to upload
      if (row.original.guia_remision_url) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',

            onClick: () => {
              window.open(row.original.guia_remision_url, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            onClick: () => {
              handleDeleteGuiaRemision(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          variant: 'outline',
          label: 'Subir',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Guia Remisión',
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file: File }) => {
                await handleUploadGuiaRemision(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'whatsapp',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const hasFactura = !!row.original.factura_comercial
      const hasGuia = !!row.original.guia_remision_url
      const clienteNombre = row.original?.nombre || 'Cliente'
      
      // Solo mostrar el botón si hay al menos un documento disponible
      
      
      return h(UTooltip, {
        text: 'Enviar documento por WhatsApp',
        placement: 'top'
      }, {
        default: () => h(UButton, {
          icon: 'iconamoon:menu-burger-horizontal',
          color: 'success',
          variant: 'ghost',
          onClick: () => {
            sendDocumentModal.open({
              idCotizacion: row.original.id_cotizacion,
              clienteNombre: clienteNombre,
              hasFactura: hasFactura,
              hasGuia: hasGuia,
              onClose: () => sendDocumentModal.close(),
              onSend: async (documentType: 'factura' | 'guia') => {
                await handleSendDocument(row.original.id_cotizacion, documentType)
              }
            })
          }
        })
      })
    }
  }
])

const generalColumnsContabilidad = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N°',
    cell: ({ row }: { row: any }) => cellWrap('w-12 text-center')(row.index + 1)
  },
  {
    //if registrado is true and tipo_comprobantes is factura show razon social and ruc
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }: { row: any }) => {
      const nombre = row.original?.nombre || ''
      const telefono = row.original?.telefono || ''
      const tipo_comprobante = row.original?.comprobante_form?.tipo_comprobante || ''
      const registrado = row.original?.registrado || false
      const razon_social = row.original?.comprobante_form?.razon_social || ''
      const ruc = row.original?.comprobante_form?.ruc || ''
      const nodes: any[] = [
        h('div', { class: 'font-medium text-gray-900 dark:text-white break-words line-clamp-2 min-w-0' }, nombre),
        ...(telefono ? [h('div', { class: 'text-sm text-gray-500 dark:text-gray-400' }, telefono)] : [])
      ]
      if (registrado && tipo_comprobante === 'FACTURA') {
        if (razon_social) nodes.push(h('div', { class: 'font-medium text-gray-900 dark:text-white break-words line-clamp-2 min-w-0' }, razon_social))
        if (ruc) nodes.push(h('div', { class: 'text-sm text-gray-500 dark:text-gray-400' }, ruc))
      }
      return cellWrap('max-w-[200px] min-w-0 whitespace-normal flex flex-col gap-0.5')(nodes)
    }
  },
  {
    accessorKey: 'tipo_cliente',
    header: 'T. Cliente',
    cell: ({ row }: { row: any }) => cellWrap('')(row.original.tipo_cliente_nombre ?? row.original.name ?? '—')
  },
  {
    accessorKey: 'registrado',
    header: 'Registrado',
    cell: ({ row }: { row: any }) => cellWrap('flex justify-center')(h(UBadge, {
      label: row.original.registrado ? 'Sí' : 'No',
      color: row.original.registrado ? 'success' : 'error',
      variant: 'solid',
      size: 'lg'
    }))
  },
  {
    accessorKey: 'tipo_entrega',
    header: 'T. Entrega',
    cell: ({ row }: { row: any }) => cellWrap('text-center')(row.original.tipo_entrega ?? '—')
  },
  {
    accessorKey: 'tipo_comprobante',
    header: 'T. Comprobante',
    cell: ({ row }: { row: any }) => {
      //center text
      const val = row.original.form_tipo_comprobante as string | null | undefined
      if (!val) return cellWrap('text-center')(h('span', { class: 'text-gray-400 text-sm' }, '—'))
      return cellWrap('text-center')(h('span', { class: 'text-gray-400 text-sm' }, val))
    }
  },
  {
    accessorKey: 'total_comprobantes',
    header: 'Valor Comprobante',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ valor_comprobante?: number | null }> | undefined
      if (!comprobantes?.length) return cellWrap('')(h('span', { class: 'text-gray-400 text-sm' }, '—'))
      return cellWrap('text-right')(h('div', { class: 'flex flex-col gap-0.5 text-sm' }, comprobantes.map((c, i) => {
        const val = c.valor_comprobante
        return h('span', { key: i, class: 'font-medium tabular-nums' }, val != null ? formatCurrency(Number(val), 'USD') : '—')
      })))
    }
  },
  {
    accessorKey: 'total_detracciones',
    header: 'Detracción',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ tiene_detraccion?: boolean; detraccion?: { monto: number; monto_pagado?: number | null; file_url?: string } | null }> | undefined
      if (!comprobantes?.length) return cellWrap('')(h('span', { class: 'text-gray-400 text-sm' }, '—'))
      return cellWrap('')(h('div', { class: 'flex flex-col gap-1' }, comprobantes.map((c, i) => {
        const d = c.detraccion
        if (!c.tiene_detraccion || !d) return h('span', { key: i, class: 'text-gray-400 text-sm' }, '—')
        const required = Number(d.monto || 0)
        const paid = Number(d.monto_pagado ?? 0)
        const estado = required > 0 && paid >= required ? 'pagado' : 'adelanto'
        const bgClass = estado === 'pagado' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
        return h('span', { key: i, class: `rounded-md px-2 py-0.5 text-sm font-medium tabular-nums inline-block w-fit ${bgClass}` }, `S/ ${required.toFixed(2)}`)
      })))
    }
  },
  {
    accessorKey: 'comprobante_pdf',
    header: 'Comprobante (PDF)',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ comprobante_file_url?: string | null; file_url?: string | null; file_name?: string | null }> | undefined
      if (!comprobantes?.length) return cellWrap('text-center')(h('span', { class: 'text-gray-400 text-sm' }, '—'))
      return cellWrap('text-center')(h('div', { class: 'flex flex-col gap-1 justify-center items-center' }, comprobantes.map((c, i) => {
        const url = c.file_url ?? c.comprobante_file_url
        const fileName = c.file_name || 'Comprobante.pdf'
        if (!url) return h('span', { key: i, class: 'text-gray-400 text-sm' }, '—')
        return h(UButton, {
          key: i,
          icon: 'vscode-icons:file-type-pdf2',
          size: 'xl',
          color: 'error',
          variant: 'ghost',
          'aria-label': 'Ver comprobante',
          onClick: () => openPreview(url, fileName)
        })
      })))
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guía R.',
    cell: ({ row }: { row: any }) => {
      const guias = row.original.guias_remision as Array<{ id: number; file_name: string; file_url: string | null }> | undefined
      const legacyUrl = row.original.guia_remision_url as string | null | undefined
      const activeGuias = guias?.filter((g: any) => g.file_url) ?? []
      if (!activeGuias.length && !legacyUrl) return cellWrap('')(h('span', { class: 'text-gray-400 text-sm' }, '—'))
      if (activeGuias.length) {
        return cellWrap('')(h('div', { class: 'flex flex-col gap-1' }, activeGuias.map((g: any, i: number) =>
          h(UButton, {
            key: i,
            icon: 'vscode-icons:file-type-pdf2',
            size: 'xl',
            color: 'primary',
            variant: 'ghost',
            'aria-label': 'Ver guía',
            onClick: () => openPreview(g.file_url, g.file_name || 'Guía.pdf')
          })
        )))
      }
      return cellWrap('')(h(UButton, {
        icon: 'i-heroicons-eye',
        size: 'xs',
        color: 'primary',
        variant: 'soft',
        'aria-label': 'Ver guía',
        onClick: () => openPreview(legacyUrl!, 'Guía.pdf')
      }))
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const estado = row.original.estado_cotizacion_final || 'PENDIENTE'
      const colorMap: Record<string, 'success' | 'error' | 'warning' | 'neutral' | 'info'> = {
        PAGADO: 'success', AJUSTADO: 'error', SOBREPAGO: 'warning', PENDIENTE: 'neutral', COTIZADO: 'info'
      }
      return cellWrap('')(h(UBadge, { label: estado, color: colorMap[estado] || 'neutral', variant: 'soft', size: 'xs' }))
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const clienteNombre = row.original?.nombre || 'Cliente'
      return cellWrap('')(h('div', { class: 'flex items-center gap-1 flex-wrap' }, [
        h(UTooltip, { text: 'Ver detalle contabilidad', placement: 'top' }, {
          default: () => h(UButton, {
            icon: 'i-heroicons-eye',
            color: 'primary',
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              navigateTo(`/cargaconsolidada/contabilidad/factura-guia/clientes/${row.original.id_cotizacion}?carga=${carga.value || ''}`)
            }
          })
        }),
        h(UTooltip, { text: 'Ver formulario comprobante', placement: 'top' }, {
          default: () => h(UButton, {
            icon: 'i-heroicons-pencil-square',
            color: 'neutral',
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              navigateTo(`/cargaconsolidada/contabilidad/factura-guia/formulario-comprobante/${row.original.id_cotizacion}`)
            }
          })
        }),
        h(UTooltip, { text: 'Acciones WhatsApp', placement: 'top' }, {
          default: () => h(UButton, {
            icon: 'iconamoon:menu-burger-horizontal',
            color: 'success',
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              contabilidadSendModal.open({
                idCotizacion: row.original.id_cotizacion,
                clienteNombre,
                onClose: () => contabilidadSendModal.close(),
                onSend: async (action: ContabilidadAction) => {
                  await handleContabilidadSendAction(row.original.id_cotizacion, action)
                }
              })
            }
          })
        }),
        
      ]))
    }
  }
])

const handleContabilidadSendAction = async (idCotizacion: number, action: ContabilidadAction) => {
  await withSpinner(async () => {
    try {
      let response
      const labelMap: Record<ContabilidadAction, string> = {
        comprobantes: 'comprobantes',
        guias: 'guías de remisión',
        detracciones: 'constancias de detracción',
        formulario: 'formulario'
      }
      if (action === 'comprobantes') response = await sendComprobantes(idCotizacion)
      else if (action === 'guias') response = await sendGuiasContabilidad(idCotizacion)
      else if (action === 'detracciones') response = await sendDetracciones(idCotizacion)
      else response = await sendFormularioContabilidad(idCotizacion)

      if (response.success) {
        showSuccess('Enviado por WhatsApp', `Los ${labelMap[action]} se enviaron correctamente.`)
        contabilidadSendModal.close()
      } else {
        showError('Error al enviar', response.error || `No se pudo enviar los ${labelMap[action]} por WhatsApp`)
      }
    } catch (error: any) {
      showError('Error al enviar', error?.message || 'Error inesperado al enviar por WhatsApp')
    }
  }, 'Enviando por WhatsApp...')
}

const handleEnviarFormulario = () => {
  enviarFormularioModal.open({
    idContenedor: id,
    onClose: () => enviarFormularioModal.close(),
    onSent: () => {
      enviarFormularioModal.close()
      showSuccess('Formularios enviados', 'Los mensajes de WhatsApp fueron enviados correctamente.')
    }
  })
}

const handleUploadFacturaComercial = async (data: { file?: File, files?: File[] }, idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const filesToUpload = data.files || (data.file ? [data.file] : [])
      
      if (filesToUpload.length === 0) {
        showError('No se seleccionaron archivos para subir', 'error')
        return
      }

      // Enviar todos los archivos en un solo request
      const response = await uploadFacturaComercial({
        idCotizacion: idCotizacion,
        files: filesToUpload
      })

      if (response.success) {
        const count = filesToUpload.length
        const message = (response as any).message || 
          (count === 1 
            ? 'Factura comercial subida correctamente' 
            : `${count} factura(s) comercial(es) subida(s) correctamente`)
        showSuccess(message, 'success')
        await getGeneral(Number(id))
      } else {
        const errorMessage = (response as any).message || 'Error al subir las facturas comerciales'
        showError(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error al subir facturas comerciales:', error)
      showError('Error al subir las facturas comerciales', 'error')
    }
  })
}
const handleDeleteFacturaComercial = async (idCotizacion: number) => {
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
    async () => {
      try {
        await withSpinner(async () => {
          const response = await deleteFacturaComercial(idCotizacion)
          if (response.success) {
            await getGeneral(Number(id))
            showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
          }
        }, 'Eliminando archivo...')
      } catch (error) {
        console.error('Error al eliminar archivo:', error)
        showError('Error de Eliminación', 'Error al eliminar el archivo')
      }
    }
  )
}
const handleDeleteGuiaRemision = async (idCotizacion: number) => {
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
    async () => {
      try {
        await withSpinner(async () => {
          const response = await deleteGuiaRemision(idCotizacion)
          if (response.success) {
            await getGeneral(Number(id))
            showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
          }
        }, 'Eliminando archivo...')
      } catch (error) {
        console.error('Error al eliminar archivo:', error)
        showError('Error de Eliminación', 'Error al eliminar el archivo')
      }
    }
  )
}
const handleUploadGuiaRemision = async (data: { file: File }, idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const response = await uploadGuiaRemision({
        idCotizacion: idCotizacion,
        file: data.file
      })
      if (response.success) {
        showSuccess('Guía remisión subida correctamente', 'success')
        await getGeneral(Number(id))
      } else {
        showError('Error al subir la guía remisión', 'error')
      }
    } catch (error) {
      showError('Error al subir la guía remisión', 'error')
    }
  })
}

const handleSendDocument = async (idCotizacion: number, documentType: 'factura' | 'guia') => {
  await withSpinner(async () => {
    try {
      let response
      if (documentType === 'factura') {
        response = await sendFactura(idCotizacion)
      } else {
        response = await sendGuia(idCotizacion)
      }
      
      if (response.success) {
        showSuccess(
          'Documento enviado',
          `El ${documentType === 'factura' ? 'factura comercial' : 'guía de remisión'} se ha enviado correctamente por WhatsApp`
        )
        sendDocumentModal.close()
      } else {
        showError('Error al enviar documento', response.error || 'No se pudo enviar el documento por WhatsApp')
      }
    } catch (error: any) {
      showError('Error al enviar documento', error?.message || 'Error al enviar el documento por WhatsApp')
    }
  }, 'Enviando documento...')
}

onMounted(async () => {
  await getGeneral(Number(id))
  await getHeaders(Number(id))
})
</script>

<style scoped></style>