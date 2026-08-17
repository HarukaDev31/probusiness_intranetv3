import type { CaptureShot } from './types'

type CaptureOverride = Pick<
  CaptureShot,
  'type' | 'target' | 'actions' | 'targetText' | 'padding' | 'minWidth' | 'minHeight'
>

const overrides: Record<string, CaptureOverride> = {
  'news__leer-avisos__paso-01-tarjetas-y-detalle': {
    type: 'seccion',
    target: { css: '[data-manual-capture="news-card"]' },
    padding: 16,
    minWidth: 480,
    minHeight: 180,
  },
  'viaticos__crear-y-seguir__paso-01-crear-viatico-o-reintegro': {
    type: 'modal',
    actions: [
      { type: 'click', target: { role: 'button', name: 'Crear viático o reintegro', exact: true } },
      { type: 'wait', target: { role: 'dialog' }, state: 'visible', timeout: 15_000 },
    ],
    target: { role: 'dialog' },
    targetText: ['Crear viático o reintegro', 'Asunto', 'Área Solicitante'],
    padding: 12,
    minWidth: 480,
    minHeight: 360,
  },
  'viaticos__crear-y-seguir__paso-02-ojo-lapiz-y-filtros': {
    type: 'seccion',
    actions: [
      { type: 'click', target: { role: 'button', name: 'Filtros', exact: true } },
      { type: 'wait', target: '.filters-panel', state: 'visible', timeout: 10_000 },
    ],
    target: { manualCapture: 'data-table' },
    targetText: ['Mis viáticos y reintegros', 'Filtros', 'Estado'],
    padding: 12,
    minWidth: 640,
    minHeight: 280,
  },
  'basedatos-clientes__buscar-y-filtrar__paso-01-encontrar-a-alguien': {
    type: 'seccion',
    actions: [
      { type: 'click', target: { role: 'button', name: 'Filtros', exact: true } },
      { type: 'wait', target: '.filters-panel', state: 'visible', timeout: 10_000 },
    ],
    target: { manualCapture: 'data-table' },
    targetText: ['Base de datos de clientes', 'Buscar por', 'Servicio'],
    padding: 12,
    minWidth: 640,
    minHeight: 280,
  },
}

export function captureOverride(captureKey: string): CaptureOverride | undefined {
  return overrides[captureKey]
}
