import { computed } from 'vue'
import type { SoporteTiRol } from '~/constants/soporteTi'
import {
  SOPORTE_TI_DEMO_SOLICITANTE,
  SOPORTE_TI_ROL_META,
  soporteTiInicialesDesdeNombre
} from '~/constants/soporteTi'
import { ROLES } from '~/constants/roles'
import { SoporteTiService } from '~/services/soporteTiService'
import type {
  SoporteTiCreatePayload,
  SoporteTiEnviarMensajePayload,
  SoporteTiEvidenciaItem,
  SoporteTiListFilters,
  SoporteTiMensaje,
  SoporteTiSolicitud,
  SoporteTiMaqueta,
  SoporteTiWsEstadoPayload,
  SoporteTiWsMensajePayload
} from '~/types/soporteTi'
import {
  buildCreateApiBody,
  buildCreateSolicitudFormData,
  mapMensajeApiToUi,
  mapSolicitudApiToUi,
  mapSolicitudUiToApiPatch,
  parseSoporteTiListPayload
} from '~/utils/soporteTiMappers'
import { getSoporteTiSeedSolicitudes } from '~/utils/soporteTiSeed'
import { useSoporteTiChat } from '~/composables/useSoporteTiChat'
import { generarChatUuid } from '~/utils/soporteTiUuid'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import { estadoPorId, resolverEstado } from '~/constants/soporteTiEstados'
import { useUserRole } from '~/composables/auth/useUserRole'

function etiquetaAhora(): string {
  const d = new Date()
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
}

function siguienteOrdenEvidencia(ticket: SoporteTiSolicitud): number {
  const ev = ticket.evidencias
  if (!ev?.length) return 0
  return Math.max(...ev.map((e) => e.orden ?? 0)) + 1
}

function buildReplyPreview(mensajes: SoporteTiMensaje[], replyToId: number) {
  const origen = mensajes.find((m) => m.id === replyToId)
  if (!origen) return null
  const texto = origen.texto.length > 80 ? `${origen.texto.slice(0, 80)}…` : origen.texto
  return {
    id: origen.id,
    remitente: origen.remitente,
    texto,
    tieneImagen: !!(origen.imagenes?.length)
  }
}

function statsDesdeSolicitudes(list: SoporteTiSolicitud[]) {
  return {
    total: list.length,
    pendientes: list.filter((t) => t.estadoCodigo === 'pendiente').length,
    enProgreso: list.filter((t) =>
      ['en_progreso', 'en_maqueta', 'hecho'].includes(t.estadoCodigo)
    ).length,
    operativas: list.filter((t) => t.estadoCodigo === 'operativo').length
  }
}


export function useSoporteTi() {
  const config = useRuntimeConfig()
  const usarApi = computed(() => config.public.soporteTiUseApi !== false)
  const { hasRole, userName, currentId } = useUserRole()
  const { publicarDemo } = useSoporteTiChatRoom()
  const {
    mensajesDe,
    metaDe,
    agregarMensaje,
    actualizarMensajeEnSala,
    cargarChatInicial,
    cargarMensajesAnteriores,
    initDemoStore
  } = useSoporteTiChat()

  const rolActivo = computed<SoporteTiRol>(() => {
    if (hasRole(ROLES.PM)) return 'PM'
    if (hasRole(ROLES.SOPORTE)) return 'Analista'
    return 'Solicitante'
  })

  /** Remitente burbuja (nombre real + color según rol intranet) */
  function remitenteChatUi() {
    const r = rolActivo.value
    const nombre = userName.value || 'Usuario'
    return {
      nombre,
      iniciales: soporteTiInicialesDesdeNombre(nombre),
      color: SOPORTE_TI_ROL_META[r].color
    }
  }

  const solicitudes = useState<SoporteTiSolicitud[]>('soporte-ti-solicitudes', () => [])
  const error = useState<string | null>('soporte-ti-error', () => null)

  const stats = computed(() => statsDesdeSolicitudes(solicitudes.value))

  function solicitudPorChatUuid(chatUuid: string) {
    return solicitudes.value.find((s) => s.chatUuid === chatUuid) ?? null
  }

  function solicitudPorCodigo(codigo: string) {
    return solicitudes.value.find((s) => s.codigo === codigo) ?? null
  }

  /** Resuelve fila por segmento de URL: id numérico, UUID de chat o código ticket */
  function solicitudPorParamRuta(param: string): SoporteTiSolicitud | null {
    if (!param) return null
    const raw = decodeURIComponent(param.trim())
    if (/^\d+$/.test(raw)) {
      const n = Number(raw)
      return solicitudes.value.find((s) => s.backendId === n) ?? null
    }
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
    ) {
      return solicitudes.value.find((s) => s.chatUuid === raw) ?? null
    }
    return solicitudes.value.find((s) => s.codigo === raw) ?? null
  }

  function upsertSolicitud(ui: SoporteTiSolicitud) {
    const idx = solicitudes.value.findIndex(
      (s) =>
        (ui.backendId != null && s.backendId === ui.backendId) || s.chatUuid === ui.chatUuid
    )
    if (idx >= 0) {
      solicitudes.value = solicitudes.value.map((s, i) => (i === idx ? ui : s))
    } else {
      solicitudes.value = [...solicitudes.value, ui]
    }
  }

  /**
   * Resuelve ticket para la URL cuando no está en memoria (p. ej. enlace directo): GET show o búsqueda en list.
   */
  async function resolverTicketParaRuta(param: string): Promise<SoporteTiSolicitud | null> {
    if (!param) return null
    const raw = decodeURIComponent(param.trim())
    const local = solicitudPorParamRuta(raw)
    if (local) return local
    if (!usarApi.value) return null

    if (/^\d+$/.test(raw)) {
      try {
        const res = await SoporteTiService.show(Number(raw))
        if (!res?.success || !res.data) return null
        const ui = mapSolicitudApiToUi(res.data)
        upsertSolicitud(ui)
        return ui
      } catch {
        return null
      }
    }

    try {
      const res = await SoporteTiService.list({ q: raw, tipo: 'todos' })
      if (!res?.success || !res || typeof res !== 'object') return null
      const { rows } = parseSoporteTiListPayload(res)
      const mapped = rows.map((row) => mapSolicitudApiToUi(row))
      const lower = raw.toLowerCase()
      const byCode = mapped.find((r) => r.codigo.toLowerCase() === lower)
      if (byCode) {
        upsertSolicitud(byCode)
        return byCode
      }
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
      ) {
        const byUuid = mapped.find((r) => r.chatUuid.toLowerCase() === lower)
        if (byUuid) {
          upsertSolicitud(byUuid)
          return byUuid
        }
      }
      if (mapped.length === 1) {
        upsertSolicitud(mapped[0]!)
        return mapped[0]!
      }
    } catch {
      return null
    }
    return null
  }

  function agregarMensajeSistema(chatUuid: string, codigo: string, texto: string) {
    const msg: SoporteTiMensaje = {
      id: Date.now(),
      remitente: 'Sistema',
      iniciales: 'SYS',
      color: '#64748b',
      texto,
      esSistema: true,
      marcaTiempo: etiquetaAhora()
    }
    agregarMensaje(chatUuid, msg)
    if (!usarApi.value) {
      publicarDemo(chatUuid, 'mensaje_creado', {
        chat_uuid: chatUuid,
        codigo,
        mensaje: {
          id: msg.id,
          remitente: msg.remitente,
          iniciales: msg.iniciales,
          color: msg.color,
          texto: msg.texto,
          es_sistema: true,
          marca_tiempo: msg.marcaTiempo
        }
      })
    }
  }

  function aplicarMensajeRemoto(payload: SoporteTiWsMensajePayload, esActualizacion = false) {
    const ui = mapMensajeApiToUi(payload.mensaje)
    const lista = mensajesDe(payload.chat_uuid)
    const existe = lista.some((m) => m.id === ui.id)
    if (esActualizacion || existe) {
      actualizarMensajeEnSala(payload.chat_uuid, ui)
    } else {
      agregarMensaje(payload.chat_uuid, ui)
    }
  }

  function aplicarEstadoRemoto(payload: SoporteTiWsEstadoPayload) {
    const s = solicitudPorChatUuid(payload.chat_uuid)
    if (!s) return
    const est = payload.estado_id
      ? estadoPorId(payload.estado_id) ?? resolverEstado(payload.estado_codigo || payload.estado)
      : resolverEstado(payload.estado_codigo || payload.estado)
    const actualizada: SoporteTiSolicitud = {
      ...s,
      estadoId: est.id,
      estadoCodigo: est.codigo,
      estado: est.nombre,
      faseIndex: payload.fase_index ?? s.faseIndex,
      progreso: payload.progreso ?? s.progreso,
      ultimaActualizacion: payload.ultima_actualizacion ?? etiquetaAhora()
    }
    void actualizarSolicitud(actualizada, { emitirWs: false })
    agregarMensajeSistema(
      payload.chat_uuid,
      payload.codigo,
      `Estado actualizado a "${est.nombre}".`
    )
  }

  async function cargar(filters?: SoporteTiListFilters) {
    error.value = null
    try {
      if (usarApi.value) {
        const res = await SoporteTiService.list(filters)
        if (!res || typeof res !== 'object') throw new Error('Respuesta inválida del servidor')
        if (!res.success) throw new Error(res.message || 'Error al cargar')
        const { rows } = parseSoporteTiListPayload(res)
        solicitudes.value = rows.map((row) => mapSolicitudApiToUi(row))
      } else {
        solicitudes.value = getSoporteTiSeedSolicitudes()
        initDemoStore()
      }
    } catch (e: any) {
      error.value = e?.message || 'Error al cargar'
      if (usarApi.value) {
        solicitudes.value = []
      } else {
        solicitudes.value = getSoporteTiSeedSolicitudes()
        initDemoStore()
      }
    }
  }

  async function actualizarSolicitud(
    actualizada: SoporteTiSolicitud,
    opts?: { emitirWs?: boolean }
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const idx = solicitudes.value.findIndex((s) => s.chatUuid === actualizada.chatUuid)
    const antes = idx !== -1 ? solicitudes.value[idx] : null

    solicitudes.value = solicitudes.value.map((s) =>
      s.chatUuid === actualizada.chatUuid ? actualizada : s
    )

    const emitir = opts?.emitirWs !== false
    if (!usarApi.value && emitir) {
      if (antes && antes.estadoId !== actualizada.estadoId) {
        publicarDemo(actualizada.chatUuid, 'estado', {
          chat_uuid: actualizada.chatUuid,
          codigo: actualizada.codigo,
          estado_id: actualizada.estadoId,
          estado_codigo: actualizada.estadoCodigo,
          estado: actualizada.estado,
          fase_index: actualizada.faseIndex,
          progreso: actualizada.progreso,
          ultima_actualizacion: actualizada.ultimaActualizacion
        })
      }
    }

    if (!usarApi.value || actualizada.backendId == null) {
      return { ok: true }
    }
    try {
      await SoporteTiService.update(
        actualizada.backendId,
        mapSolicitudUiToApiPatch(actualizada)
      )
      return { ok: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      if (antes != null) {
        solicitudes.value = solicitudes.value.map((s) =>
          s.chatUuid === actualizada.chatUuid ? antes : s
        )
      }
      return { ok: false, error: msg || 'Error al guardar en el servidor' }
    }
  }

  async function crearSolicitud(payload: SoporteTiCreatePayload) {
    const sla = payload.tipo === 'A' ? 72 : 8
    const hoyCorto = etiquetaAhora().split(' ').slice(0, 2).join(' ')
    const chatUuid = generarChatUuid()

    if (usarApi.value) {
      const res = payload.imagenes?.length
        ? await SoporteTiService.store(buildCreateSolicitudFormData(payload))
        : await SoporteTiService.store(buildCreateApiBody(payload) as Record<string, unknown>)
      if (!res.success || !res.data) throw new Error(res.message || 'No se pudo crear')
      const nueva = mapSolicitudApiToUi(res.data)
      solicitudes.value = [...solicitudes.value, nueva]
      agregarMensajeSistema(
        nueva.chatUuid,
        nueva.codigo,
        `Ticket ${nueva.codigo} creado. SLA: ${sla}h.`
      )
      return nueva
    }

    const pref = payload.tipo === 'A' ? 'PRJ' : 'REQ'
    const codigo = `${pref}-${String(Math.floor(Math.random() * 900 + 100))}`
    const estIni = resolverEstado('pendiente')
    const demoSolicitante = (userName.value || '').trim() || SOPORTE_TI_DEMO_SOLICITANTE
    const nueva: SoporteTiSolicitud = {
      backendId: null,
      chatUuid,
      codigo,
      tipo: payload.tipo,
      subtipoB: payload.tipo === 'B' ? payload.subtipoB : null,
      titulo: payload.titulo || 'Nueva solicitud',
      area: payload.area,
      solicitante: demoSolicitante,
      solicitanteUserId: currentId.value ? Number(currentId.value) : null,
      pm: payload.tipo === 'A' ? 'Por asignar' : null,
      analista: 'Por asignar',
      criticidad: 'Por definir',
      estadoId: estIni.id,
      estadoCodigo: estIni.codigo,
      estado: estIni.nombre,
      faseIndex: 0,
      progreso: 0,
      slaHoras: sla,
      horasTranscurridas: 0,
      fechaRegistro: hoyCorto,
      ultimaActualizacion: hoyCorto,
      fechaFinEstimado: payload.tipo === 'A' ? 'Por definir' : null,
      seccionRuta: payload.seccionRuta || undefined,
      descripcion: payload.descripcion || undefined,
      maqueta: null
    }

    const evidenciasDemo: SoporteTiEvidenciaItem[] = []
    let ord = 0
    if (payload.imagenes?.length) {
      evidenciasDemo.push({
        tipo: 'texto',
        texto: `${nueva.titulo} — Evidencia`,
        orden: ord++
      })
      for (const f of payload.imagenes) {
        evidenciasDemo.push({
          tipo: 'imagen',
          url: URL.createObjectURL(f),
          nombre: f.name,
          tamano:
            f.size > 1048576
              ? `${(f.size / 1048576).toFixed(1)} MB`
              : `${Math.round(f.size / 1024)} KB`,
          orden: ord++
        })
      }
      nueva.evidencias = evidenciasDemo
    }

    solicitudes.value = [...solicitudes.value, nueva]
    agregarMensajeSistema(chatUuid, codigo, `Ticket ${codigo} creado. SLA: ${sla}h.`)
    if (payload.imagenes?.length) {
      await enviarChat(nueva.chatUuid, { texto: `${nueva.titulo} — Evidencia` })
      for (const file of payload.imagenes) {
        await enviarChat(nueva.chatUuid, { texto: '', imagenes: [file] })
      }
    }
    return nueva
  }

  async function enviarChat(chatUuid: string, payload: SoporteTiEnviarMensajePayload) {
    const ticket = solicitudPorChatUuid(chatUuid)
    if (!ticket) return

    const meta = remitenteChatUi()
    const prev = mensajesDe(chatUuid)
    const replyTo =
      payload.replyToId != null ? buildReplyPreview(prev, payload.replyToId) : null

    const imagenesLocales =
      payload.imagenes?.map((file) => ({
        url: URL.createObjectURL(file),
        nombre: file.name,
        tamano:
          file.size > 1048576
            ? `${(file.size / 1048576).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`
      })) ?? []

    const msgLocal: SoporteTiMensaje = {
      id: Date.now(),
      remitente: meta.nombre,
      iniciales: meta.iniciales,
      color: meta.color,
      texto: payload.texto,
      esSistema: false,
      marcaTiempo: etiquetaAhora(),
      esPropio: true,
      replyToId: payload.replyToId ?? null,
      replyTo,
      imagenes: imagenesLocales.length ? imagenesLocales : undefined
    }

    if (usarApi.value && ticket.backendId != null) {
      const res = await SoporteTiService.postMensaje(ticket.backendId, payload)
      if (res.success && res.data) {
        agregarMensaje(chatUuid, mapMensajeApiToUi(res.data))
        return
      }
    }

    agregarMensaje(chatUuid, msgLocal)

    const evNuevas: SoporteTiEvidenciaItem[] = []
    let ordEv = siguienteOrdenEvidencia(ticket)
    if (payload.texto.trim() !== '') {
      evNuevas.push({ tipo: 'texto', texto: payload.texto, orden: ordEv++ })
    }
    imagenesLocales.forEach((img, i) => {
      const file = payload.imagenes?.[i]
      if (!file) return
      evNuevas.push({
        tipo: 'imagen',
        url: img.url,
        nombre: img.nombre,
        tamano: img.tamano,
        orden: ordEv++
      })
    })
    if (evNuevas.length) {
      ticket.evidencias = [...(ticket.evidencias ?? []), ...evNuevas]
    }

    publicarDemo(chatUuid, 'mensaje_creado', {
      chat_uuid: chatUuid,
      codigo: ticket.codigo,
      mensaje: {
        id: msgLocal.id,
        remitente: msgLocal.remitente,
        iniciales: msgLocal.iniciales,
        color: msgLocal.color,
        texto: msgLocal.texto,
        es_sistema: false,
        marca_tiempo: msgLocal.marcaTiempo,
        reply_to_id: msgLocal.replyToId ?? null,
        reply_to: replyTo
          ? {
            id: replyTo.id,
            remitente: replyTo.remitente,
            texto: replyTo.texto,
            tiene_imagen: replyTo.tieneImagen
          }
          : null,
        imagenes: imagenesLocales.map((i) => ({
          url: i.url,
          nombre: i.nombre,
          tamano: i.tamano
        }))
      }
    })
  }

  function handlersSala(chatUuid: string) {
    return {
      onMensajeCreado: (p: SoporteTiWsMensajePayload) => aplicarMensajeRemoto(p, false),
      onMensajeActualizado: (p: SoporteTiWsMensajePayload) => aplicarMensajeRemoto(p, true),
      onEstadoActualizado: (p: SoporteTiWsEstadoPayload) => aplicarEstadoRemoto(p)
    }
  }

  return {
    rolActivo,
    solicitudes,
    stats,
    error,
    usarApi,
    cargar,
    actualizarSolicitud,
    crearSolicitud,
    enviarChat,
    agregarMensajeSistema,
    mensajesDe,
    metaDe,
    cargarChatInicial,
    cargarMensajesAnteriores,
    solicitudPorChatUuid,
    solicitudPorCodigo,
    solicitudPorParamRuta,
    resolverTicketParaRuta,
    handlersSala,
    etiquetaAhora,
    registrarMaquetaLocal(
      chatUuid: string,
      mq: SoporteTiMaqueta,
      mensajePm: string,
      archivoNombre?: string
    ) {
      const t = solicitudPorChatUuid(chatUuid)
      if (!t) return
      void actualizarSolicitud({
        ...t,
        maqueta: mq,
        ultimaActualizacion: etiquetaAhora()
      })
      const quien = remitenteChatUi()
      const msg: SoporteTiMensaje = {
        id: Date.now(),
        remitente: quien.nombre,
        iniciales: quien.iniciales,
        color: quien.color,
        texto: mensajePm,
        esSistema: false,
        marcaTiempo: etiquetaAhora(),
        esPropio: rolActivo.value === 'PM',
        archivoNombre: archivoNombre ?? mq.nombre,
        imagenes: mq.dataUrl
          ? [{ url: mq.dataUrl, nombre: mq.nombre, tamano: mq.tamano }]
          : undefined
      }
      agregarMensaje(chatUuid, msg)
      agregarMensajeSistema(
        chatUuid,
        t.codigo,
        `Maqueta "${mq.nombre}" subida. Pendiente de aprobación del solicitante.`
      )
    }
  }
}
