import type { DocumentacionObservacionCategoria } from '~/types/cargaconsolidada/documentacionObservacion'

export const DOC_EXPEDIENTE_OBS_CATEGORIAS: Array<{
  value: DocumentacionObservacionCategoria
  label: string
  pillClass: string
  tagClass: string
  avatarClass: string
}> = [
  {
    value: 'factura_comercial',
    label: 'Factura Comercial',
    pillClass: 'bg-white text-gray-700 border-gray-300 hover:border-orange-400',
    tagClass: 'text-red-600 font-medium',
    avatarClass: 'bg-red-100 text-red-700'
  },
  {
    value: 'packing_list',
    label: 'Packing List',
    pillClass: 'bg-white text-gray-700 border-gray-300 hover:border-blue-400',
    tagClass: 'text-blue-600 font-medium',
    avatarClass: 'bg-blue-100 text-blue-700'
  },
  {
    value: 'excel_confirmacion',
    label: 'Excel Confirmación',
    pillClass: 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400',
    tagClass: 'text-emerald-600 font-medium',
    avatarClass: 'bg-emerald-100 text-emerald-700'
  },
  {
    value: 'general',
    label: 'General',
    pillClass: 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
    tagClass: 'text-gray-600 font-medium',
    avatarClass: 'bg-gray-100 text-gray-700'
  }
]

/** Canal privado Laravel Echo: `private-coordinacion-documentacion-expediente.{idProveedor}` */
export const documentacionExpedienteObsChannelName = (idProveedor: number | string) =>
  `coordinacion-documentacion-expediente.${idProveedor}`

export const DOC_EXPEDIENTE_OBS_WS_EVENT = 'DocumentacionExpedienteObservacionCreated'

export const getDocExpedienteObsCategoriaMeta = (categoria: DocumentacionObservacionCategoria) =>
  DOC_EXPEDIENTE_OBS_CATEGORIAS.find((c) => c.value === categoria) ?? DOC_EXPEDIENTE_OBS_CATEGORIAS[3]
