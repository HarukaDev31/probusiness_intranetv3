import { formatSoporteTiMarcaTiempo } from '~/utils/formatters'
import type {
  SoporteTiSolicitud,
  SoporteTiSolicitudApi,
  SoporteTiListStatsApi,
  SoporteTiMensaje,
  SoporteTiMensajeApi,
  SoporteTiChatsPorUuid,
  SoporteTiCreatePayload,
  SoporteTiMensajeReplyPreviewApi,
  SoporteTiImagenMensajeApi,
  SoporteTiEstadoApi,
  SoporteTiEstadoHistorialApi,
  SoporteTiEstado,
  SoporteTiEstadoHistorial,
  SoporteTiEvidenciaApi,
  SoporteTiEvidenciaItem,
  SoporteTiGestion,
  SoporteTiGestionApi
  } from '~/types/soporteTi'
import { estadoPorId, resolverEstado } from '~/constants/soporteTiEstados'
import type { SoporteTiComplejidad } from '~/utils/soporteTiComplejidad'
import { resolveEsPropioMensaje } from '~/utils/soporteTiChatMensaje'

/**
 * Normaliza la respuesta del índice: `data` como arreglo o bundle `{ solicitudes, resumen }`,
 * y métricas en `resumen` / `totales` / `stats` (raíz o dentro de `data`).
 */
export function parseSoporteTiListPayload(res: {
  data?: unknown
  stats?: SoporteTiListStatsApi
  resumen?: SoporteTiListStatsApi
  totales?: SoporteTiListStatsApi
}): { rows: SoporteTiSolicitudApi[]; stats: SoporteTiListStatsApi | undefined } {
  const topStats = res.resumen ?? res.totales ?? res.stats
  const d = res.data

  if (Array.isArray(d)) {
    return { rows: d, stats: topStats }
  }

  if (d && typeof d === 'object') {
    const o = d as Record<string, unknown>
    const list = o.solicitudes ?? o.items ?? o.data
    const nested = (o.resumen ?? o.stats ?? o.totales) as SoporteTiListStatsApi | undefined
    const rows = Array.isArray(list) ? (list as SoporteTiSolicitudApi[]) : []
    return { rows, stats: nested ?? topStats }
  }

  return { rows: [], stats: topStats }
}

export function mapEstadoApiToUi(e: SoporteTiEstadoApi): SoporteTiEstado {
  return {
    id: e.id,
    codigo: e.codigo,
    nombre: e.nombre,
    tipoSolicitud: e.tipo_solicitud,
    ordenKanban: e.orden_kanban
  }
}

export function mapHistorialEstadoApiToUi(h: SoporteTiEstadoHistorialApi): SoporteTiEstadoHistorial {
  return {
    id: h.id,
    solicitudId: h.solicitud_id,
    estadoId: h.estado_id,
    estadoAnteriorId: h.estado_anterior_id,
    usuarioId: h.usuario_id,
    usuarioNombre: h.usuario_nombre,
    comentario: h.comentario,
    creadoEn: h.created_at,
    estado: h.estado ? mapEstadoApiToUi(h.estado) : undefined,
    estadoAnterior: h.estado_anterior ? mapEstadoApiToUi(h.estado_anterior) : null
  }
}

function resolverEstadoDesdeApi(row: SoporteTiSolicitudApi) {
  if (row.estado) {
    return mapEstadoApiToUi(row.estado)
  }
  if (row.estado_codigo) {
    const r = resolverEstado(row.estado_codigo)
    return {
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      tipoSolicitud: r.tipoSolicitud,
      ordenKanban: r.ordenKanban
    }
  }
  if (row.estado_id) {
    const local = estadoPorId(row.estado_id)
    if (local) {
      return {
        id: local.id,
        codigo: local.codigo,
        nombre: local.nombre,
        tipoSolicitud: local.tipoSolicitud,
        ordenKanban: local.ordenKanban
      }
    }
  }
  if (row.estado_legacy) {
    const r = resolverEstado(row.estado_legacy)
    return {
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      tipoSolicitud: r.tipoSolicitud,
      ordenKanban: r.ordenKanban
    }
  }
  const def = resolverEstado('pendiente')
  return {
    id: def.id,
    codigo: def.codigo,
    nombre: def.nombre,
    tipoSolicitud: def.tipoSolicitud,
    ordenKanban: def.ordenKanban
  }
}

function mapReplyApi(r?: SoporteTiMensajeReplyPreviewApi | null) {
  if (!r) return null
  return {
    id: r.id,
    remitente: r.remitente,
    texto: r.texto,
    tieneImagen: r.tiene_imagen ?? false,
    imagenUrl: r.imagen_url ?? null
  }
}

function mapImagenesApi(imgs?: SoporteTiImagenMensajeApi[]) {
  if (!imgs?.length) return undefined
  return imgs.map((i) => ({
    url: i.url,
    nombre: i.nombre,
    tamano: i.tamano ?? null
  }))
}

function mapEvidenciaApiToUi(e: SoporteTiEvidenciaApi): SoporteTiEvidenciaItem {
  return {
    id: e.id,
    tipo: e.tipo,
    texto: e.texto ?? null,
    url: e.url ?? null,
    nombre: e.nombre ?? null,
    tamano: e.tamano ?? null,
    mime: e.mime ?? null,
    orden: e.orden
  }
}

export function mapGestion(g: SoporteTiGestionApi): SoporteTiGestion {
  return {
    esCreador: g.es_creador,
    esStaff: g.es_staff,
    puedeComplejidad: g.puede_complejidad,
    puedeComplejidadPm: g.puede_complejidad_pm ?? false,
    puedeComplejidadAnalista: g.puede_complejidad_analista ?? false,
    puedeEstado: g.puede_estado,
    estados: g.estados.map((e) => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre
    })),
    estadoValor: g.estado_valor,
    complejidadValor: g.complejidad_valor as SoporteTiComplejidad | null,
    complejidadPmValor: (g.complejidad_pm_valor ?? null) as SoporteTiComplejidad | null,
    complejidadAnalistaValor: (g.complejidad_analista_valor ?? null) as SoporteTiComplejidad | null,
    tiempoEstimadoRango: g.tiempo_estimado_rango ?? false,
    estadoEditable: g.estado_editable,
    puedeConfirmar: g.puede_confirmar,
    estadoPlaceholder: g.estado_placeholder,
    terminoEstimado: g.termino_estimado,
    slaEtiqueta: g.sla_etiqueta,
    verSla: g.ver_sla,
    puedeEnProgreso: g.puede_en_progreso,
    contadorActivo: g.contador_activo,
    contadorPausado: g.contador_pausado === true,
    contadorFin: g.contador_fin,
    contadorRestanteSegundos:
      g.contador_restante_segundos != null ? Number(g.contador_restante_segundos) : null,
    contadorVencido: g.contador_vencido
  }
}

export function mapSolicitudApiToUi(row: SoporteTiSolicitudApi): SoporteTiSolicitud {
  const est = resolverEstadoDesdeApi(row)
  const sortedEv = row.evidencias?.length
    ? [...row.evidencias].sort((a, b) => a.orden - b.orden)
    : undefined
  return {
    backendId: row.id,
    chatUuid: row.chat_uuid,
    codigo: row.codigo,
    tipo: row.tipo_solicitud,
    subtipoB: row.subtipo_b,
    titulo: row.titulo,
    prioridad: row.prioridad != null ? Number(row.prioridad) : 2,
    area: row.area,
    solicitante: row.solicitante,
    solicitanteUserId:
      row.solicitante_user_id !== undefined && row.solicitante_user_id !== null
        ? Number(row.solicitante_user_id)
        : null,
    pm: row.pm,
    analista: row.analista,
    criticidad: row.criticidad,
    complejidadPm: row.complejidad_pm,
    complejidadAnalista: row.complejidad_analista,
    estadoId: est.id,
    estadoCodigo: est.codigo,
    estado: est.nombre,
    faseIndex: row.fase_index,
    progreso: row.progreso,
    slaHoras: row.sla_horas,
    horasTranscurridas: row.horas_transcurridas,
    fechaRegistro: row.fecha_registro,
    fechaRegistroIso: row.fecha_registro_iso,
    ultimaActualizacion: row.ultima_actualizacion,
    fechaFinEstimado: row.fecha_fin_estimado,
    seccionRuta: row.seccion_ruta ?? undefined,
    descripcion: row.descripcion ?? undefined,
    maqueta: row.maqueta
      ? {
          nombre: row.maqueta.nombre,
          tamano: row.maqueta.tamano,
          fechaEntrega: row.maqueta.fecha_entrega,
          aprobada: row.maqueta.aprobada,
          dataUrl: row.maqueta.url_preview ?? null
        }
      : null,
    evidencias: sortedEv?.map(mapEvidenciaApiToUi),
    gestion: mapGestion(row.gestion)
  }
}

export function mapSolicitudUiToApiPatch(
  s: Partial<SoporteTiSolicitud>
): Partial<SoporteTiSolicitudApi> {
  const out: Partial<SoporteTiSolicitudApi> = {}
  if (s.estadoId !== undefined) out.estado_id = s.estadoId
  if (s.estadoCodigo !== undefined) {
    const e = resolverEstado(s.estadoCodigo)
    out.estado_id = e.id
  }
  if (s.faseIndex !== undefined) out.fase_index = s.faseIndex
  if (s.progreso !== undefined) out.progreso = s.progreso
  if (s.ultimaActualizacion !== undefined) out.ultima_actualizacion = s.ultimaActualizacion
  if (s.criticidad !== undefined) out.criticidad = s.criticidad
  if (s.maqueta !== undefined) {
    out.maqueta = s.maqueta
      ? {
          nombre: s.maqueta.nombre,
          tamano: s.maqueta.tamano,
          fecha_entrega: s.maqueta.fechaEntrega,
          aprobada: s.maqueta.aprobada,
          url_preview: s.maqueta.dataUrl ?? null
        }
      : null
  }
  return out
}

export function mapMensajeApiToUi(m: SoporteTiMensajeApi): SoporteTiMensaje {
  const adjuntoPendiente = m.adjunto_pendiente === true
  const esPropio = resolveEsPropioMensaje(m)
  return {
    id: m.id,
    remitente: m.remitente,
    iniciales: m.iniciales,
    color: m.color,
    texto: m.texto,
    esSistema: m.es_sistema,
    marcaTiempo: m.created_at_iso
      ? formatSoporteTiMarcaTiempo(m.created_at_iso)
      : m.marca_tiempo,
    esPropio,
    archivoNombre: m.archivo_nombre ?? null,
    replyToId: m.reply_to_id ?? null,
    replyTo: mapReplyApi(m.reply_to),
    imagenes: mapImagenesApi(m.imagenes),
    adjuntoPendiente,
    estadoEnvio: esPropio
      ? adjuntoPendiente
        ? 'enviando'
        : m.leido
          ? 'leido'
          : 'entregado'
      : undefined
  }
}

export function mapChatsApiToUi(
  raw: Record<string, SoporteTiMensajeApi[]> | undefined
): SoporteTiChatsPorUuid {
  if (!raw) return {}
  const out: SoporteTiChatsPorUuid = {}
  for (const k of Object.keys(raw)) {
    out[k] = raw[k].map(mapMensajeApiToUi)
  }
  return out
}

export function buildCreateApiBody(payload: SoporteTiCreatePayload) {
  return {
    tipo_solicitud: payload.tipo,
    subtipo_b: payload.tipo === 'B' ? payload.subtipoB : null,
    titulo: payload.titulo || 'Nueva solicitud',
    area: payload.area,
    seccion_ruta: payload.seccionRuta || null,
    descripcion: payload.descripcion || null
  }
}

export function buildCreateSolicitudFormData(payload: SoporteTiCreatePayload): FormData {
  const fd = new FormData()
  fd.append('tipo_solicitud', payload.tipo)
  if (payload.subtipoB) fd.append('subtipo_b', payload.subtipoB)
  fd.append('titulo', payload.titulo || 'Nueva solicitud')
  fd.append('area', payload.area)
  if (payload.seccionRuta) fd.append('seccion_ruta', payload.seccionRuta)
  if (payload.descripcion) fd.append('descripcion', payload.descripcion)
  payload.imagenes?.forEach((file, i) => {
    fd.append(`imagenes[${i}]`, file)
  })
  return fd
}
