<template>
  <div class="p-6">
    <!-- Header Section -->


  <DataTable title="" :show-pagination="false" :data="general" :columns="generalColumnsByRole" :loading="loadingGeneral || loadingHeaders"
      icon="" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral" :total-records="totalRecordsGeneral"
      :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral" :show-secondary-search="false"
      :show-filters="false" :filter-config="filterConfigGeneral" :show-export="false"
      empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
      @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
      @filter-change="handleFilterChangeGeneral" :hide-back-button="false" :show-primary-search="false"
      :show-body-top="true"
      :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.ADMINISTRACION || currentRole == ROLES.CONTABILIDAD) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`">
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Factura y Guía #${carga}`" :headers="headers" :loading="loadingGeneral || loadingHeaders" />
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
import FacturasComercialesModal from '~/components/cargaconsolidada/factura-guia/FacturasComercialesModal.vue'
import EnviarFormularioModal from '~/components/cargaconsolidada/factura-guia/EnviarFormularioModal.vue'
import ContabilidadSendModal from '~/components/cargaconsolidada/factura-guia/ContabilidadSendModal.vue'
import type { ContabilidadAction } from '~/components/cargaconsolidada/factura-guia/ContabilidadSendModal.vue'
import { getEstadoColor } from '~/utils/consolidado'
import { ESTADOS_PAGO } from '~/constants/consolidado'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import type { TableColumn } from '@nuxt/ui'
import { useUserRole } from '~/composables/auth/useUserRole'
const { general, loadingGeneral, getGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, handleSearchGeneral, handlePageChangeGeneral, handleItemsPerPageChangeGeneral, handleFilterChangeGeneral, uploadFacturaComercial, uploadGuiaRemision, headers, carga, loadingHeaders, getHeaders, deleteFacturaComercial, deleteGuiaRemision, getFacturasComerciales } = useGeneral()
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useWhatsapp } from '~/composables/cargaconsolidada/factura-guia/useWhatsapp'
import SectionHeader from '~/components/commons/SectionHeader.vue'
const { withSpinner } = useSpinner()
const { showSuccess, showError, showConfirmation } = useModal()
const { sendFactura, sendGuia, sendComprobantes, sendGuiasContabilidad, sendDetracciones, sendFormularioContabilidad } = useWhatsapp()
const route = useRoute()
const id = Number(route.params.id)
const overlay = useOverlay()
const simpleUploadFileModal = overlay.create(SimpleUploadFileModal)
const sendDocumentModal = overlay.create(SendDocumentModal)
const facturasComercialesModal = overlay.create(FacturasComercialesModal)
const enviarFormularioModal = overlay.create(EnviarFormularioModal)
const contabilidadSendModal = overlay.create(ContabilidadSendModal)
// Modal state for creating pagos
const { currentRole, currentId } = useUserRole()
const selectedCliente = ref('')

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
    header: 'Factura E.',
    cell: ({ row }: { row: any }) => {
      // Si tiene factura_comercial antiguo (legacy), mostrar botones antiguos
      if (row.original.factura_comercial) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',
            'aria-label': 'Descargar factura comercial',
            onClick: () => {
              window.open(row.original.factura_comercial, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            'aria-label': 'Eliminar factura comercial',
            onClick: () => {
              handleDeleteFacturaComercial(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        // Si no tiene factura_comercial antiguo, mostrar botón de ojo para ver facturas en modal
        return h(UButton, {
          icon: 'i-heroicons-eye',
          color: 'primary',
          variant: 'outline',
          'aria-label': 'Ver facturas comerciales',
          onClick: async () => {
            await handleViewFacturasComerciales(row.original.id_cotizacion)
          }
        })
      }
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guia R. ',
    cell: ({ row }: { row: any }) => {
      const guias = row.original.guias_remision || []
      const hasGuias = guias.length > 0 || !!row.original.guia_remision_url
      if (hasGuias) {
        const items = guias.length ? guias : [{ id: 0, file_name: 'Guía', file_url: row.original.guia_remision_url }]
        return h('div', { class: 'flex flex-wrap gap-1' }, items.map((g: any, i: number) =>
          h(UButton, {
            key: g.id || i,
            icon: 'vscode-icons:file-type-pdf2',
            color: 'primary',
            variant: 'outline',
            size: 'xs',
            'aria-label': g.file_name || 'Ver guía PDF',
            onClick: () => { if (g.file_url) window.open(g.file_url, '_blank') }
          })
        ))
      }
      return h(UButton, {
        icon: 'i-heroicons-arrow-up-tray',
        color: 'primary',
        variant: 'outline',
        label: 'Subir',
        onClick: () => {
          simpleUploadFileModal.open({
            title: 'Subir Guía Remisión',
            onClose: () => simpleUploadFileModal.close(),
            onSave: async (data: { file: File }) => {
              await handleUploadGuiaRemision(data, row.original.id_cotizacion)
            }
          })
        }
      })
    }
  },
  {
    accessorKey: 'whatsapp',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const hasFactura = !!row.original.factura_comercial
      const guias = row.original.guias_remision || []
      const hasGuia = guias.length > 0 || !!row.original.guia_remision_url
      const clienteNombre = row.original?.nombre || 'Cliente'
      
    
      
      return h(UTooltip, {
        text: 'Enviar documento por WhatsApp',
        placement: 'top'
      }, {
        default: () => h(UButton, {
          icon: 'iconamoon:menu-burger-horizontal',
          color: 'success',
          variant: 'ghost',
          'aria-label': 'Enviar documento por WhatsApp',
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
    header: 'Factura E.',
    cell: ({ row }: { row: any }) => {
      // Si tiene factura_comercial antiguo (legacy), mostrar botones antiguos
      if (row.original.factura_comercial) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',
            'aria-label': 'Descargar factura comercial',
            onClick: () => {
              window.open(row.original.factura_comercial, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            'aria-label': 'Eliminar factura comercial',
            onClick: () => {
              handleDeleteFacturaComercial(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        // Si no tiene factura_comercial antiguo, mostrar botón de ojo para ver facturas en modal
        return h(UButton, {
          icon: 'i-heroicons-eye',
          color: 'primary',
          variant: 'outline',
          'aria-label': 'Ver facturas comerciales',
          onClick: async () => {
            await handleViewFacturasComerciales(row.original.id_cotizacion)
          }
        })
      }
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guia R. ',
    cell: ({ row }: { row: any }) => {
      const guias = row.original.guias_remision || []
      const hasGuias = guias.length > 0 || !!row.original.guia_remision_url
      if (hasGuias) {
        const items = guias.length ? guias : [{ id: 0, file_name: 'Guía', file_url: row.original.guia_remision_url }]
        return h('div', { class: 'flex flex-wrap gap-1' }, items.map((g: any, i: number) =>
          h(UButton, {
            key: g.id || i,
            icon: 'vscode-icons:file-type-pdf2',
            color: 'primary',
            variant: 'outline',
            size: 'xs',
            'aria-label': g.file_name || 'Ver guía PDF',
            onClick: () => { if (g.file_url) window.open(g.file_url, '_blank') }
          })
        ))
      }
      return h(UButton, {
        icon: 'i-heroicons-arrow-up-tray',
        color: 'primary',
        variant: 'outline',
        label: 'Subir',
        onClick: () => {
          simpleUploadFileModal.open({
            title: 'Subir Guía Remisión',
            multiple: true,
            onClose: () => simpleUploadFileModal.close(),
            onSave: async (data: { file: File }) => {
              await handleUploadGuiaRemision(data, row.original.id_cotizacion)
            }
          })
        }
      })
    }
  },
  {
    accessorKey: 'whatsapp',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const hasFactura = !!row.original.factura_comercial
      const guias = row.original.guias_remision || []
      const hasGuia = guias.length > 0 || !!row.original.guia_remision_url
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
          'aria-label': 'Enviar documento por WhatsApp',
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
    cell: ({ row }: { row: any }) => row.index + 1
  },
  {
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }: { row: any }) => {
      const nombre = row.original?.nombre || ''
      const documento = row.original?.documento || ''
      const telefono = row.original?.telefono || ''
      const correo = row.original?.correo || ''
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
    cell: ({ row }: { row: any }) => row.original.tipo_cliente_nombre
  },
  {
    accessorKey: 'registrado',
    header: 'Registrado',
    cell: ({ row }: { row: any }) => {
      const idContenedorPago = row.original.id_contenedor_pago
      const otroContenedor = idContenedorPago != null && idContenedorPago !== id
      if (otroContenedor) return h(UBadge, { label: 'X', color: 'error', variant: 'soft' })
      return h(UBadge, {
        label: row.original.registrado ? 'Sí' : 'No',
        color: row.original.registrado ? 'success' : 'error',
        variant: 'soft'
      })
    }
  },
  {
    accessorKey: 'tipo_comprobante',
    header: 'T. Comprobante',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ tipo_comprobante?: string | null }> | undefined
      if (!comprobantes?.length) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      return h('div', { class: 'flex flex-col gap-1' }, comprobantes.map((c, i) =>
        c.tipo_comprobante
          ? h(UBadge, { key: i, label: c.tipo_comprobante, color: 'info', variant: 'soft' })
          : h(UBadge, { key: i, label: '—', color: 'neutral', variant: 'soft' })
      ))
    }
  },
  {
    accessorKey: 'total_comprobantes',
    header: 'Valor Comprobante',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ valor_comprobante?: number | null }> | undefined
      if (!comprobantes?.length) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      return h('div', { class: 'flex flex-col gap-0.5 text-sm' }, comprobantes.map((c, i) => {
        const val = c.valor_comprobante
        return h('span', { key: i, class: 'font-medium' }, val != null ? `S/ ${Number(val).toFixed(2)}` : '—')
      }))
    }
  },
  {
    accessorKey: 'total_detracciones',
    header: 'Detracción',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ tiene_detraccion?: boolean; detraccion?: { monto: number; file_url?: string } | null }> | undefined
      if (!comprobantes?.length) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      return h('div', { class: 'flex flex-col gap-1' }, comprobantes.map((c, i) => {
        const d = c.detraccion
        const tieneDet = c.tiene_detraccion
        if (!tieneDet && !d) return h(UBadge, { key: i, label: 'No', color: 'neutral', variant: 'soft', size: 'xs' })
        if (tieneDet && !d) {
          return h('span', { key: i, class: 'text-sm inline-flex items-center gap-1' }, [h(UBadge, { label: 'Sí', color: 'warning', variant: 'soft', size: 'xs' }), h('span', { class: 'text-gray-500 text-xs' }, '(pend. constancia)')])
        }
        const monto = `S/ ${Number(d!.monto).toFixed(2)}`
        if (d!.file_url) {
          return h('div', { key: i, class: 'flex flex-wrap items-center gap-1.5' }, [
            h(UBadge, { label: 'Sí', color: 'success', variant: 'soft', size: 'xs' }),
            h('span', { class: 'text-sm font-medium' }, monto),
            h(UButton, {
              icon: 'i-heroicons-eye',
              size: 'xs',
              color: 'neutral',
              variant: 'ghost',
              'aria-label': 'Ver constancia',
              onClick: () => { if (d?.file_url) window.open(d.file_url, '_blank') }
            })
          ])
        }
        return h('div', { key: i, class: 'flex items-center gap-1.5' }, [
          h(UBadge, { label: 'Sí', color: 'success', variant: 'soft', size: 'xs' }),
          h('span', { class: 'text-sm font-medium' }, monto)
        ])
      }))
    }
  },
  {
    accessorKey: 'comprobante_pdf',
    header: 'Comprobante (PDF)',
    cell: ({ row }: { row: any }) => {
      console.log('comprobantes', row.original.comprobantes)
      const comprobantes = row.original.comprobantes as Array<{ comprobante_file_url?: string | null; file_path?: string | null; file_name?: string | null }> | undefined
      if (!comprobantes?.length) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      
      return h('div', { class: 'flex flex-col gap-1' }, comprobantes.map((c, i) => {
        const url = c.file_path ?? c.comprobante_file_url
       //show with pdf icon
        if (!url) return h(UButton, { key: i, icon: 'vscode-icons:file-type-pdf2', color: 'neutral', variant: 'ghost', size: 'xs' }, '—')
        return h(UButton, { key: i, icon: 'vscode-icons:file-type-pdf2', color: 'primary', variant: 'ghost', size: 'xs', onClick: () => window.open(url, '_blank') })
      }))
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guía R.',
    cell: ({ row }: { row: any }) => {
      const guias = row.original.guias_remision || []
      const hasGuias = guias.length > 0 || !!row.original.guia_remision_url
      if (!hasGuias) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      const items = guias.length ? guias : [{ file_url: row.original.guia_remision_url }]
      return h('div', { class: 'flex flex-row gap-1' }, items.map((g: any, i: number) =>
        h(UButton, {
          key: i,
          icon: 'vscode-icons:file-type-pdf2',
          color: 'primary',
          variant: 'ghost',
          size: 'xs',
          onClick: () => { if (g.file_url) window.open(g.file_url, '_blank') }
        })
      ))
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const totalPagado = Number(row.original.total_pagado ?? 0)
      const totalConfirmado = Number(row.original.total_pagado_confirmado ?? 0)
      const montoPagar = Number(row.original.monto_a_pagar ?? 0)

      let label: string
      let className: string

      const isPagadoVerificado = totalPagado >= montoPagar && totalConfirmado >= montoPagar && montoPagar > 0
      const isPagadoPendiente = totalPagado >= montoPagar && totalConfirmado < montoPagar && montoPagar > 0

      if (totalPagado === 0) {
        label = 'PENDIENTE'
        className = `py-1 text-xs font-medium border ${getEstadoColor('PENDIENTE')}`
      } else if (totalPagado < montoPagar) {
        label = 'ADELANTO'
        className = `py-1 text-xs font-medium border ${getEstadoColor('ADELANTO')}`
      } else if (isPagadoVerificado) {
        label = 'PAGADO'
        className = 'bg-green-500 text-white dark:bg-green-500 dark:text-white'
      } else {
        label = 'PAGADO'
        className = 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
      }

      return h('div', [
        h(USelect as any, {
          class: className,
          modelValue: label,
          items: ESTADOS_PAGO,
          disabled: true
        })
      ])
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const clienteNombre = row.original?.nombre || 'Cliente'
      return h('div', { class: 'flex items-center gap-1' }, [
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
            icon: 'i-heroicons-document-text',
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
        })
      ])
    }
  }
])

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

const handleUploadFacturaComercial = async (data: { file?: File, files?: File[] }, idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      console.log('handleUploadFacturaComercial - data recibido:', {
        hasFile: !!data.file,
        hasFiles: !!data.files,
        filesLength: data.files?.length || 0,
        fileType: data.file?.constructor?.name,
        filesTypes: data.files?.map(f => f?.constructor?.name)
      })
      
      const filesToUpload = data.files || (data.file ? [data.file] : [])
      
      console.log('filesToUpload:', filesToUpload.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        isFile: f instanceof File
      })))
      
      if (filesToUpload.length === 0) {
        showError('No se seleccionaron archivos para subir', 'error')
        return
      }

      // Verificar que todos los archivos sean válidos
      const validFiles = filesToUpload.filter(f => f instanceof File && f.size > 0)
      if (validFiles.length === 0) {
        showError('No se encontraron archivos válidos para subir', 'error')
        return
      }

      console.log('Enviando archivos:', {
        total: validFiles.length,
        idCotizacion
      })

      // Enviar todos los archivos en un solo request
      const response = await uploadFacturaComercial({
        idCotizacion: idCotizacion,
        files: validFiles
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
  const handleViewFacturasComerciales = async (idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const response = await getFacturasComerciales(idCotizacion)
      if (response.success) {
        facturasComercialesModal.open({
          facturas: response.data || [],
          idCotizacion: idCotizacion,
          onClose: () => facturasComercialesModal.close(),
          onDelete: async (id: number) => {
            await handleDeleteFacturaComercialById(id, idCotizacion)
          },
          onUpload: async (files: File[], idCotizacion: number) => {
            await handleUploadFacturaComercialInModal(files, idCotizacion)
          },
          onRefresh: async (idCotizacion: number) => {
            const refreshResponse = await getFacturasComerciales(idCotizacion)
            if (refreshResponse.success && refreshResponse.data) {
              return refreshResponse.data
            }
            return []
          }
        })
      } else {
        showError('No se encontraron facturas comerciales', 'error')
      }
    } catch (error) {
      console.error('Error al obtener facturas comerciales:', error)
      showError('Error al cargar las facturas comerciales', 'error')
    }
  })
}

const handleDeleteFacturaComercialById = async (idFactura: number, idCotizacion: number) => {
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar esta factura comercial? Esta acción no se puede deshacer.',
    async () => {
      try {
        await withSpinner(async () => {
          const response = await deleteFacturaComercial(idFactura)
          if (response.success) {
            showSuccess('Factura comercial eliminada correctamente', 'success')
            // Refrescar la lista de facturas en el modal
            const refreshResponse = await getFacturasComerciales(idCotizacion)
            if (refreshResponse.success && refreshResponse.data) {
              facturasComercialesModal.patch({
                facturas: refreshResponse.data
              })
            }
            await getGeneral(Number(id))
          } else {
            showError('Error al eliminar la factura comercial', 'error')
          }
        }, 'Eliminando factura...')
      } catch (error) {
        console.error('Error al eliminar factura comercial:', error)
        showError('Error al eliminar la factura comercial', 'error')
      }
    }
  )
}

const handleUploadFacturaComercialInModal = async (files: File[], idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const response = await uploadFacturaComercial({
        idCotizacion: idCotizacion,
        files: files
      })

      if (response.success) {
        const count = files.length
        const message = (response as any).message || 
          (count === 1 
            ? 'Factura comercial subida correctamente' 
            : `${count} factura(s) comercial(es) subida(s) correctamente`)
        showSuccess(message, 'success')
        
        // Refrescar la lista de facturas en el modal
        const refreshResponse = await getFacturasComerciales(idCotizacion)
        if (refreshResponse.success && refreshResponse.data) {
          facturasComercialesModal.patch({
            facturas: refreshResponse.data
          })
        }
        
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