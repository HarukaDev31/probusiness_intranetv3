import type {
  SoporteTiSolicitud,
  SoporteTiSolicitudApi,
  SoporteTiMensaje,
  SoporteTiMensajeApi,
  SoporteTiChatsPorUuid,
  SoporteTiCreatePayload,
  SoporteTiMensajeReplyPreviewApi,
  SoporteTiImagenMensajeApi,
  SoporteTiEstadoApi,
  SoporteTiEstadoHistorialApi,
  SoporteTiEstado,
  SoporteTiEstadoHistorial
} from '~/types/soporteTi'
import { estadoPorId, resolverEstado } from '~/constants/soporteTiEstados'

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
    tieneImagen: r.tiene_imagen ?? false
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

export function mapSolicitudApiToUi(row: SoporteTiSolicitudApi): SoporteTiSolicitud {
  const est = resolverEstadoDesdeApi(row)
  return {
    backendId: row.id,
    chatUuid: row.chat_uuid,
    codigo: row.codigo,
    tipo: row.tipo_solicitud,
    subtipoB: row.subtipo_b,
    titulo: row.titulo,
    area: row.area,
    solicitante: row.solicitante,
    pm: row.pm,
    analista: row.analista,
    criticidad: row.criticidad,
    estadoId: est.id,
    estadoCodigo: est.codigo,
    estado: est.nombre,
    faseIndex: row.fase_index,
    progreso: row.progreso,
    slaHoras: row.sla_horas,
    horasTranscurridas: row.horas_transcurridas,
    fechaRegistro: row.fecha_registro,
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
      : null
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
  return {
    id: m.id,
    remitente: m.remitente,
    iniciales: m.iniciales,
    color: m.color,
    texto: m.texto,
    esSistema: m.es_sistema,
    marcaTiempo: m.marca_tiempo,
    esPropio: m.es_propio,
    archivoNombre: m.archivo_nombre ?? null,
    replyToId: m.reply_to_id ?? null,
    replyTo: mapReplyApi(m.reply_to),
    imagenes: mapImagenesApi(m.imagenes)
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

export function buildCreateApiBody(payload: SoporteTiCreatePayload, demoSolicitante: string) {
  return {
    tipo_solicitud: payload.tipo,
    subtipo_b: payload.tipo === 'B' ? payload.subtipoB : null,
    titulo: payload.titulo || 'Nueva solicitud',
    area: payload.area,
    seccion_ruta: payload.seccionRuta || null,
    descripcion: payload.descripcion || null,
    solicitante: demoSolicitante
  }
}
