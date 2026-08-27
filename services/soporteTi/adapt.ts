import { formatSoporteTiMarcaTiempo } from '~/utils/formatters'
import { CODE, byId, resolve } from '~/constants/soporteTiEstados'
import { resolveEsPropioMensaje } from '~/utils/soporteTiChatMensaje'
import type { SoporteTiComplejidad } from '~/utils/soporteTiComplejidad'
import type {
  SoporteTiCreatePayload,
  SoporteTiEstado,
  SoporteTiEstadoHistorial,
  SoporteTiEvidenciaItem,
  SoporteTiGestion,
  SoporteTiListStats,
  SoporteTiMensaje,
  SoporteTiMensajeInfoLectura,
  SoporteTiSolicitud
} from '~/types/soporteTi'
import type {
  SoporteTiEstadoApi,
  SoporteTiEstadoHistorialApi,
  SoporteTiEvidenciaApi,
  SoporteTiGestionApi,
  SoporteTiImagenMensajeApi,
  SoporteTiListResponseRaw,
  SoporteTiListStatsApi,
  SoporteTiMensajeApi,
  SoporteTiMensajeInfoLecturaApi,
  SoporteTiMensajeReplyPreviewApi,
  SoporteTiSolicitudApi,
  SoporteTiWsEstadoPayload,
  SoporteTiWsMensajePayload
} from '~/services/soporteTi/apiTypes'

function asComplejidad(v: string | null | undefined): SoporteTiComplejidad | null {
  if (!v) return null
  const ok = ['Baja', 'Media', 'Alta', 'Máxima'] as const
  return (ok as readonly string[]).includes(v) ? (v as SoporteTiComplejidad) : null
}

export function adaptEstado(e: SoporteTiEstadoApi): SoporteTiEstado {
  return {
    id: e.id,
    codigo: e.codigo,
    nombre: e.nombre,
    tipoSolicitud: e.tipo_solicitud,
    ordenKanban: e.orden_kanban
  }
}

function mapEstado(e: SoporteTiEstadoApi): SoporteTiEstado {
  return adaptEstado(e)
}

function fromRow(row: SoporteTiSolicitudApi): SoporteTiEstado {
  if (row.estado) return mapEstado(row.estado)
  if (row.estado_codigo) {
    const r = resolve(row.estado_codigo)
    return {
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      tipoSolicitud: r.tipoSolicitud,
      ordenKanban: r.ordenKanban
    }
  }
  if (row.estado_id) {
    const local = byId(row.estado_id)
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
  const def = resolve(CODE.PENDING)
  return {
    id: def.id,
    codigo: def.codigo,
    nombre: def.nombre,
    tipoSolicitud: def.tipoSolicitud,
    ordenKanban: def.ordenKanban
  }
}

function mapGestion(g: SoporteTiGestionApi): SoporteTiGestion {
  return {
    esCreador: g.es_creador,
    esStaff: g.es_staff,
    puedeComplejidad: g.puede_complejidad,
    puedeComplejidadPm: g.puede_complejidad_pm ?? false,
    puedeComplejidadAnalista: g.puede_complejidad_analista ?? false,
    puedeAsignacion: g.puede_asignacion ?? false,
    puedeEstado: g.puede_estado,
    puedeEliminar: g.puede_eliminar ?? false,
    estados: g.estados.map((e) => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre
    })),
    estadoValor: g.estado_valor,
    complejidadValor: asComplejidad(g.complejidad_valor),
    complejidadPmValor: asComplejidad(g.complejidad_pm_valor),
    complejidadAnalistaValor: asComplejidad(g.complejidad_analista_valor),
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

function mapEvidencia(e: SoporteTiEvidenciaApi): SoporteTiEvidenciaItem {
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

function mapReply(r?: SoporteTiMensajeReplyPreviewApi | null) {
  if (!r) return null
  return {
    id: r.id,
    remitente: r.remitente,
    texto: r.texto,
    tieneImagen: r.tiene_imagen ?? false,
    imagenUrl: r.imagen_url ?? null
  }
}

function mapImagenes(imgs?: SoporteTiImagenMensajeApi[]) {
  if (!imgs?.length) return undefined
  return imgs.map((i) => ({
    url: i.url,
    nombre: i.nombre,
    tamano: i.tamano ?? null
  }))
}

export function adaptSolicitud(row: SoporteTiSolicitudApi): SoporteTiSolicitud {
  const est = fromRow(row)
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
    pmUserId:
      row.pm_user_id !== undefined && row.pm_user_id !== null ? Number(row.pm_user_id) : null,
    analista: row.analista,
    analistaUserId:
      row.analista_user_id !== undefined && row.analista_user_id !== null
        ? Number(row.analista_user_id)
        : null,
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
    evidencias: sortedEv?.map(mapEvidencia),
    gestion: mapGestion(row.gestion)
  }
}

export function adaptMensaje(m: SoporteTiMensajeApi): SoporteTiMensaje {
  const adjuntoPendiente = m.adjunto_pendiente === true
  const esPropio = resolveEsPropioMensaje(m)
  return {
    id: m.id,
    remitente: m.remitente,
    iniciales: m.iniciales,
    color: m.color,
    avatarUrl: m.avatar_url ?? null,
    texto: m.texto,
    esSistema: m.es_sistema,
    esMaqueta: m.es_maqueta === true,
    marcaTiempo: m.created_at_iso
      ? formatSoporteTiMarcaTiempo(m.created_at_iso)
      : m.marca_tiempo,
    esPropio,
    archivoNombre: m.archivo_nombre ?? null,
    replyToId: m.reply_to_id ?? null,
    replyTo: mapReply(m.reply_to),
    imagenes: mapImagenes(m.imagenes),
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

export function adaptHistorial(h: SoporteTiEstadoHistorialApi): SoporteTiEstadoHistorial {
  return {
    id: h.id,
    solicitudId: h.solicitud_id,
    estadoId: h.estado_id,
    estadoAnteriorId: h.estado_anterior_id,
    usuarioId: h.usuario_id,
    usuarioNombre: h.usuario_nombre,
    comentario: h.comentario,
    creadoEn: h.created_at,
    estado: h.estado ? mapEstado(h.estado) : undefined,
    estadoAnterior: h.estado_anterior ? mapEstado(h.estado_anterior) : null
  }
}

export function adaptMensajeInfo(data: SoporteTiMensajeInfoLecturaApi): SoporteTiMensajeInfoLectura {
  return {
    mensaje: adaptMensaje(data.mensaje),
    entregadoEnFmt: data.entregado_en_fmt,
    leidoPor: data.leido_por.map((u) => ({
      usuarioId: u.usuario_id,
      nombre: u.nombre,
      iniciales: u.iniciales,
      avatarUrl: u.avatar_url ?? null,
      telefono: u.telefono ?? null,
      email: u.email ?? null,
      leidoEn: u.leido_en ?? null,
      leidoEnFmt: u.leido_en_fmt ?? null
    })),
    leidoPorTodos: data.leido_por_todos,
    destinatariosCount: data.destinatarios_count,
    lecturasCount: data.lecturas_count
  }
}

export function adaptListStats(s?: SoporteTiListStatsApi): SoporteTiListStats | undefined {
  if (!s) return undefined
  return {
    total: s.total,
    pendientes: s.pendientes,
    enProgreso: s.en_progreso ?? 0,
    operativas: s.operativas
  }
}

export function adaptListResponse(res: SoporteTiListResponseRaw): {
  success: boolean
  data: SoporteTiSolicitud[]
  resumen?: SoporteTiListStats
  message?: string
} {
  const rows = Array.isArray(res.data) ? res.data : []
  return {
    success: res.success,
    data: rows.map(adaptSolicitud),
    resumen: adaptListStats(res.resumen),
    message: res.message
  }
}

export function adaptWsMensaje(p: SoporteTiWsMensajePayload): {
  chatUuid: string
  codigo: string
  mensaje: SoporteTiMensaje
} {
  return {
    chatUuid: p.chat_uuid,
    codigo: p.codigo,
    mensaje: adaptMensaje(p.mensaje)
  }
}

export function adaptWsEstado(p: SoporteTiWsEstadoPayload): {
  chatUuid: string
  codigo: string
  estadoId: number
  estadoCodigo: string
  estado: string
  faseIndex?: number
  progreso?: number
  ultimaActualizacion?: string
  titulo?: string
} {
  return {
    chatUuid: p.chat_uuid,
    codigo: p.codigo,
    estadoId: p.estado_id,
    estadoCodigo: p.estado_codigo,
    estado: p.estado,
    faseIndex: p.fase_index,
    progreso: p.progreso,
    ultimaActualizacion: p.ultima_actualizacion,
    titulo: p.titulo
  }
}

export function toUpdateBody(s: Partial<SoporteTiSolicitud>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (s.estadoId !== undefined) out.estado_id = s.estadoId
  if (s.estadoCodigo !== undefined) {
    out.estado_id = resolve(s.estadoCodigo).id
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

export function toCreateFormData(payload: SoporteTiCreatePayload): FormData {
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
