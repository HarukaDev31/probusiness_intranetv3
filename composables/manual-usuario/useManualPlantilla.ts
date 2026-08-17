import { ManualUsuarioService } from '~/services/manualUsuarioService'

/** Configuración mínima para generar una hoja con la plantilla estándar. */
export type ManualPlantillaConfig = {
  articuloTitulo: string
  articuloClave: string
  tags: string[]
}

export type ManualPlantillaSeccionKey =
  | 'que_es'
  | 'para_que'
  | 'quien'
  | 'cuando'
  | 'pasos_consultar'
  | 'pasos_seguimiento'
  | 'campos'
  | 'consideraciones'
  | 'errores'
  | 'ejemplo_practico'
  | 'resultado_esperado'
  | 'ver_tambien'

export type ManualPlantillaSeccionDef = {
  key: ManualPlantillaSeccionKey
  label: string
  description: string
}

export const MANUAL_PLANTILLA_SECCIONES: ManualPlantillaSeccionDef[] = [
  { key: 'que_es', label: '¿Qué es?', description: 'Definición breve de la pantalla o función.' },
  { key: 'para_que', label: '¿Para qué sirve?', description: 'Objetivo de negocio de la función.' },
  { key: 'quien', label: '¿Quién lo utiliza?', description: 'Rol o roles habilitados.' },
  { key: 'cuando', label: '¿Cuándo utilizarlo?', description: 'Momento o disparador de uso.' },
  { key: 'pasos_consultar', label: 'Pasos — Consultar / filtrar', description: 'Procedimiento para buscar o acotar registros.' },
  { key: 'pasos_seguimiento', label: 'Pasos — Dar seguimiento', description: 'Procedimiento sobre un registro concreto.' },
  { key: 'campos', label: 'Campos (acordeón + tabla)', description: 'Tabla Campo · Origen · Ejemplo.' },
  { key: 'consideraciones', label: 'Consideraciones (acordeón)', description: 'Casos particulares y advertencias.' },
  { key: 'errores', label: 'Errores frecuentes (acordeón)', description: 'Tabla Situación · Causa · Solución + aviso.' },
  { key: 'ejemplo_practico', label: 'Ejemplo práctico', description: 'Caso resuelto con datos ficticios.' },
  { key: 'resultado_esperado', label: 'Resultado esperado', description: 'Caja verde de confirmación.' },
  { key: 'ver_tambien', label: 'Ver también', description: 'Enlaces a artículos relacionados.' },
]

const QA_DEFAULTS: Record<string, { titulo: string; body: string }> = {
  que_es: {
    titulo: '¿Qué es?',
    body: 'Describe en 1–2 líneas qué es esta pantalla o función, sin tecnicismos.',
  },
  para_que: {
    titulo: '¿Para qué sirve?',
    body: 'Qué problema resuelve para quien la usa.',
  },
  quien: {
    titulo: '¿Quién lo utiliza?',
    body: 'Rol Comercial. (diferencias de permisos: pendiente de definir.)',
  },
  cuando: {
    titulo: '¿Cuándo utilizarlo?',
    body: 'Cuándo debe usar esta función el usuario.',
  },
  ejemplo_practico: {
    titulo: 'Ejemplo práctico (datos ficticios)',
    body: 'Ejemplo con nombres y datos inventados — nunca datos reales de clientes.',
  },
  ver_tambien: {
    titulo: 'Ver también',
    body: 'Artículos o procedimientos relacionados.',
  },
}

type BlockCreateInput = {
  tipo: string
  titulo?: string | null
  clave?: string | null
  payload?: Record<string, unknown>
}

function payloadQa(titulo: string, body: string) {
  return {
    subtitulo: null,
    snapshot: { qa: true, body },
  }
}

function payloadFlow(titulo: string, steps: string[]) {
  return {
    subtitulo: null,
    snapshot: {
      steps: steps.map((body) => ({ title: '', body })),
    },
  }
}

function payloadGrupoColapsable(clave: string) {
  return {
    subtitulo: null,
    snapshot: { colapsable: true },
  }
}

function payloadTablaDoc(columns: string[], rows: string[][]) {
  return {
    subtitulo: null,
    snapshot: { variant: 'doc', columns, rows },
  }
}

/** Bloques a crear bajo el grupo artículo (orden de la plantilla). */
export function buildPlantillaSeccionBlocks(
  key: ManualPlantillaSeccionKey,
  _config?: Partial<ManualPlantillaConfig>
): BlockCreateInput[] {
  switch (key) {
    case 'que_es':
    case 'para_que':
    case 'quien':
    case 'cuando':
    case 'ejemplo_practico':
    case 'ver_tambien': {
      const d = QA_DEFAULTS[key]
      return [{ tipo: 'texto', titulo: d.titulo, payload: payloadQa(d.titulo, d.body) }]
    }
    case 'pasos_consultar':
      return [{
        tipo: 'flow',
        titulo: 'Pasos — Consultar y filtrar',
        payload: payloadFlow('Pasos — Consultar y filtrar', [
          'Ingresa al módulo y abre la pestaña correspondiente.',
          'Revisa la tabla; los registros más recientes suelen aparecer primero.',
          'Usa “Buscar” si necesitas un registro específico.',
          'Abre “Filtros” y elige de las listas desplegables.',
          'Aplica los filtros para actualizar la tabla.',
        ]),
      }]
    case 'pasos_seguimiento':
      return [{
        tipo: 'flow',
        titulo: 'Pasos — Dar seguimiento',
        payload: payloadFlow('Pasos — Dar seguimiento', [
          'Ubica el registro en la tabla.',
          'Usa “Ver” para revisar el detalle completo.',
          'Actualiza los campos editables y presiona “Guardar” si corresponde.',
          'Usa las acciones disponibles (Mensaje, Eliminar, etc.) según el caso.',
        ]),
      }]
    case 'campos':
      return [
        {
          tipo: 'grupo',
          titulo: 'Campos que deben completarse',
          clave: 'campos',
          payload: payloadGrupoColapsable('campos'),
        },
        {
          tipo: 'tabla',
          titulo: null,
          payload: payloadTablaDoc(
            ['Campo', 'Origen', 'Ejemplo'],
            [
              ['Campo de ejemplo', 'Quién lo completa', 'Valor ficticio'],
              ['pendiente de definir', 'pendiente de definir', 'pendiente de definir'],
            ]
          ),
          _nestedUnderPrevious: true,
        } as BlockCreateInput & { _nestedUnderPrevious?: boolean },
      ]
    case 'consideraciones':
      return [
        {
          tipo: 'grupo',
          titulo: 'Consideraciones importantes',
          clave: 'consideraciones',
          payload: payloadGrupoColapsable('consideraciones'),
        },
        {
          tipo: 'texto',
          titulo: null,
          payload: {
            subtitulo: null,
            snapshot: {
              body: 'Agrega aquí casos particulares, límites del sistema o dependencias con otras funciones.',
            },
          },
          _nestedUnderPrevious: true,
        } as BlockCreateInput & { _nestedUnderPrevious?: boolean },
      ]
    case 'errores':
      return [
        {
          tipo: 'grupo',
          titulo: 'Errores frecuentes',
          clave: 'errores',
          payload: payloadGrupoColapsable('errores'),
        },
        {
          tipo: 'tabla',
          titulo: null,
          payload: payloadTablaDoc(
            ['Situación', 'Causa probable', 'Solución'],
            [['pendiente de definir', 'pendiente de definir', 'pendiente de definir']]
          ),
          _nestedUnderPrevious: true,
        } as BlockCreateInput & { _nestedUnderPrevious?: boolean },
        {
          tipo: 'callout',
          titulo: null,
          payload: {
            subtitulo: null,
            snapshot: {
              tone: 'warning',
              title: 'Completar con el equipo',
              body: 'Completa esta tabla junto con soporte y usuarios del área antes de publicar.',
            },
          },
          _nestedUnderPrevious: true,
        } as BlockCreateInput & { _nestedUnderPrevious?: boolean },
      ]
    case 'resultado_esperado':
      return [{
        tipo: 'callout',
        titulo: null,
        payload: {
          subtitulo: null,
          snapshot: {
            tone: 'success',
            title: 'Resultado esperado:',
            body: 'Describe qué debe ver el usuario al terminar, para confirmar que la acción funcionó.',
          },
        },
      }]
    default:
      return []
  }
}

export function defaultPlantillaConfig(page?: {
  titulo?: string
  modulo_key?: string
  role_slug?: string
}): ManualPlantillaConfig {
  const modulo = page?.modulo_key || 'modulo/funcion'
  const tituloPagina = page?.titulo || 'Nombre de la funcionalidad'
  const rolSlug = page?.role_slug || 'comercial'
  const rol = rolSlug.charAt(0).toUpperCase() + rolSlug.slice(1)
  const partes = modulo.split('/').filter(Boolean)
  const moduloLabel = partes
    .map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' → ') || 'Módulo'

  let articuloClave = `/${modulo}`
  if (partes.length >= 2) {
    articuloClave = `/${partes[0]}?tab=${partes.slice(1).join('-')}`
  }

  const articuloTitulo =
    tituloPagina.split(/\s*[—–-]\s*/)[0]?.trim() || tituloPagina

  return {
    articuloTitulo,
    articuloClave,
    tags: [`Rol: ${rol}`, `Módulo: ${moduloLabel}`, 'pendiente de definir'],
  }
}

export function buildArticuloRootPayload(config: ManualPlantillaConfig) {
  return {
    subtitulo: null,
    snapshot: {
      variant: 'articulo',
      tags: config.tags,
    },
  }
}

async function createBlockTree(
  pageId: number,
  parentId: number | null,
  blocks: BlockCreateInput[]
) {
  let lastGroupId: number | null = parentId
  for (const raw of blocks) {
    const block = { ...raw } as BlockCreateInput & { _nestedUnderPrevious?: boolean }
    const nested = Boolean(block._nestedUnderPrevious)
    delete (block as { _nestedUnderPrevious?: boolean })._nestedUnderPrevious

    const parent_id = nested && lastGroupId ? lastGroupId : parentId
    const created = await ManualUsuarioService.adminCreateBlock(pageId, {
      parent_id,
      tipo: block.tipo,
      titulo: block.titulo ?? undefined,
      clave: block.clave ?? undefined,
      payload: block.payload,
    })
    if (block.tipo === 'grupo' && !nested) {
      lastGroupId = created.id
    }
  }
}

export function useManualPlantilla() {
  const applying = ref(false)

  const applySeccion = async (
    pageId: number,
    parentId: number,
    key: ManualPlantillaSeccionKey
  ) => {
    const blocks = buildPlantillaSeccionBlocks(key)
    if (!blocks.length) return
    applying.value = true
    try {
      await createBlockTree(pageId, parentId, blocks)
    } finally {
      applying.value = false
    }
  }

  const applyPlantillaCompleta = async (pageId: number, config: ManualPlantillaConfig) => {
    applying.value = true
    try {
      const root = await ManualUsuarioService.adminCreateBlock(pageId, {
        titulo: config.articuloTitulo,
        clave: config.articuloClave,
        payload: buildArticuloRootPayload(config),
      })

      for (const sec of MANUAL_PLANTILLA_SECCIONES) {
        await createBlockTree(pageId, root.id, buildPlantillaSeccionBlocks(sec.key, config))
      }
    } finally {
      applying.value = false
    }
  }

  return {
    applying: readonly(applying),
    applySeccion,
    applyPlantillaCompleta,
  }
}
