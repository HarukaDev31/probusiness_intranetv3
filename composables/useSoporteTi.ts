import { computed } from 'vue'
import type { SoporteTiRol } from '~/constants/soporteTi'
import { SOPORTE_TI_ROL_META, soporteTiInicialesDesdeNombre } from '~/constants/soporteTi'
import { ROLES } from '~/constants/roles'
import { SoporteTiService } from '~/services/soporteTiService'
import type {
  SoporteTiCreatePayload,
  SoporteTiEnviarMensajePayload,
  SoporteTiListFilters,
  SoporteTiMensaje,
  SoporteTiSolicitud,
  SoporteTiSolicitudApi,
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
import { useSoporteTiChat } from '~/composables/useSoporteTiChat'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import { encolarLeidosDesdeMensajes } from '~/composables/useSoporteTiChatLeidos'
import { estadoPorId, resolverEstado } from '~/constants/soporteTiEstados'
import { aplicarCambioEstadoEnSolicitud } from '~/utils/soporteTiEstadoTransition'
import { useUserRole } from '~/composables/auth/useUserRole'
import {
  crearClientIdMensaje,
  mensajeOptimistaDesdeEnvio
} from '~/utils/soporteTiChatMensaje'
import { formatSoporteTiMarcaTiempo } from '~/utils/formatters'

function clientIdFallback(m: SoporteTiMensaje): string {
  return m.clientId ?? `legacy-${m.id}`
}

function etiquetaAhora(): string {
  return formatSoporteTiMarcaTiempo(new Date())
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
  const { hasRole, userName, userPhotoUrl } = useUserRole()
  const {
    mensajesDe,
    metaDe,
    agregarMensaje,
    actualizarMensajeEnSala,
    reemplazarMensajeOptimista,
    quitarMensajeOptimista,
    cargarChatInicial,
    cargarMensajesAnteriores,
    aplicarMensajesLeidosWs,
    resetSala
  } = useSoporteTiChat()

  const rolActivo = computed<SoporteTiRol>(() => {
    if (hasRole(ROLES.PM)) return 'PM'
    if (hasRole(ROLES.SOPORTE)) return 'Analista'
    return 'Solicitante'
  })

  function remitenteChatUi() {
    const r = rolActivo.value
    const nombre = userName.value || 'Usuario'
    return {
      nombre,
      iniciales: soporteTiInicialesDesdeNombre(nombre),
      color: SOPORTE_TI_ROL_META[r].color,
      avatarUrl: userPhotoUrl.value ?? null
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

  async function resolverTicketParaRuta(param: string): Promise<SoporteTiSolicitud | null> {
    if (!param) return null
    const raw = decodeURIComponent(param.trim())
    const local = solicitudPorParamRuta(raw)
    if (local) return local

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

  function agregarMensajeSistema(chatUuid: string, _codigo: string, texto: string) {
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
  }

  function esSalaChatVisible(chatUuid: string): boolean {
    const { salaActivaUuid } = useSoporteTiChatRoom()
    return salaActivaUuid.value === chatUuid
  }

  function aplicarMensajeRemoto(
    chatUuidEsperado: string,
    payload: SoporteTiWsMensajePayload,
    esActualizacion = false
  ) {
    if (!payload.chat_uuid || payload.chat_uuid !== chatUuidEsperado) return
    if (!esSalaChatVisible(chatUuidEsperado)) return

    const ui = mapMensajeApiToUi(payload.mensaje)
    if (ui.esPropio) {
      ui.estadoEnvio = ui.adjuntoPendiente
        ? 'enviando'
        : payload.mensaje.leido
          ? 'leido'
          : 'entregado'
    }

    const lista = mensajesDe(chatUuidEsperado)

    let idxOptimista = -1
    for (let i = lista.length - 1; i >= 0; i--) {
      const m = lista[i]!
      if (
        m.esPropio &&
        ui.esPropio &&
        (m.estadoEnvio === 'pendiente' || m.estadoEnvio === 'enviando') &&
        (m.clientId || m.id < 0)
      ) {
        idxOptimista = i
        break
      }
    }
    if (idxOptimista >= 0) {
      const prev = lista[idxOptimista]!
      reemplazarMensajeOptimista(chatUuidEsperado, prev.clientId ?? clientIdFallback(prev), {
        ...ui,
        clientId: undefined,
        imagenes: ui.imagenes?.length ? ui.imagenes : prev.imagenes,
        texto: ui.texto || prev.texto,
        estadoEnvio: ui.esPropio
          ? ui.adjuntoPendiente
            ? 'enviando'
            : payload.mensaje.leido
              ? 'leido'
              : 'entregado'
          : undefined
      })
      return
    }

    const existe = lista.some((m) => m.id === ui.id && m.id > 0)
    if (esActualizacion || existe) {
      actualizarMensajeEnSala(chatUuidEsperado, ui)
    } else {
      agregarMensaje(chatUuidEsperado, ui)
    }

    if (!ui.esPropio && !ui.esSistema) {
      encolarLeidosDesdeMensajes(chatUuidEsperado, [ui])
    }
  }

  function aplicarMensajesLeidosRemoto(
    chatUuid: string,
    payload: import('~/types/soporteTi').SoporteTiWsMensajesLeidosPayload
  ) {
    if (!payload.mensaje_ids?.length || !esSalaChatVisible(chatUuid)) return
    aplicarMensajesLeidosWs(chatUuid, payload.mensaje_ids)
  }

  async function refrescarSolicitudPorChatUuid(chatUuid: string) {
    const s = solicitudPorChatUuid(chatUuid)
    if (!s?.backendId) return
    try {
      const res = await SoporteTiService.show(s.backendId)
      if (res.success && res.data) {
        fusionarSolicitudApiEnLista(res.data, chatUuid)
      }
    } catch {
      // listado sigue usable; el detalle se puede recargar al entrar
    }
  }

  function aplicarEstadoRemoto(payload: SoporteTiWsEstadoPayload) {
    void refrescarSolicitudPorChatUuid(payload.chat_uuid)
  }

  let cargarEnCurso: Promise<void> | null = null
  let ultimosFiltrosListado: SoporteTiListFilters | undefined

  async function cargar(filters?: SoporteTiListFilters) {
    ultimosFiltrosListado = filters
    if (cargarEnCurso) return cargarEnCurso

    cargarEnCurso = (async () => {
      error.value = null
      try {
        const res = await SoporteTiService.list(filters)
        if (!res || typeof res !== 'object') throw new Error('Respuesta inválida del servidor')
        if (!res.success) throw new Error(res.message || 'Error al cargar')
        const { rows } = parseSoporteTiListPayload(res)
        solicitudes.value = rows
          .map((row) => {
            try {
              return mapSolicitudApiToUi(row)
            } catch (e) {
              console.warn('[SoporteTI] Fila de listado omitida por datos inválidos:', row, e)
              return null
            }
          })
          .filter((s): s is SoporteTiSolicitud => s != null)
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Error al cargar'
        solicitudes.value = []
      }
    })().finally(() => {
      cargarEnCurso = null
    })

    return cargarEnCurso
  }

  /** Asegura el listado en memoria (una sola petición concurrente). */
  async function asegurarListadoCargado() {
    if (solicitudes.value.length > 0) {
      return extraerChatUuidsDesdeSolicitudes(solicitudes.value)
    }
    await cargar(ultimosFiltrosListado)
    return extraerChatUuidsDesdeSolicitudes(solicitudes.value)
  }

  function extraerChatUuidsDesdeSolicitudes(list: SoporteTiSolicitud[]) {
    return list.map((s) => s.chatUuid).filter((uuid): uuid is string => Boolean(uuid))
  }

  async function actualizarSolicitud(
    actualizada: SoporteTiSolicitud
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const idx = solicitudes.value.findIndex((s) => s.chatUuid === actualizada.chatUuid)
    const antes = idx !== -1 ? solicitudes.value[idx] : null

    solicitudes.value = solicitudes.value.map((s) =>
      s.chatUuid === actualizada.chatUuid ? actualizada : s
    )

    if (actualizada.backendId == null) {
      if (antes != null) {
        solicitudes.value = solicitudes.value.map((s) =>
          s.chatUuid === actualizada.chatUuid ? antes : s
        )
      }
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }

    try {
      const res = await SoporteTiService.update(
        actualizada.backendId,
        mapSolicitudUiToApiPatch(actualizada)
      )
      if (!res.success) {
        throw new Error(res.message || 'Error al guardar')
      }
      if (res.data) {
        fusionarSolicitudApiEnLista(res.data, actualizada.chatUuid)
      }
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

  function fusionarSolicitudApiEnLista(data: SoporteTiSolicitudApi, chatUuid: string) {
    const ui = mapSolicitudApiToUi(data)
    solicitudes.value = solicitudes.value.map((s) =>
      s.chatUuid === chatUuid ? { ...s, ...ui, chatUuid: s.chatUuid } : s
    )
  }

  async function actualizarPrioridadSolicitud(
    t: SoporteTiSolicitud,
    prioridad: number
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (t.backendId == null) {
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }
    const idx = solicitudes.value.findIndex((s) => s.chatUuid === t.chatUuid)
    const antes = idx !== -1 ? solicitudes.value[idx] : null
    solicitudes.value = solicitudes.value.map((s) =>
      s.chatUuid === t.chatUuid ? { ...s, prioridad, ultimaActualizacion: etiquetaAhora() } : s
    )
    try {
      const res = await SoporteTiService.updatePrioridad(t.backendId, prioridad)
      if (!res.success) throw new Error(res.message || 'No se pudo actualizar la prioridad')
      if (res.data) fusionarSolicitudApiEnLista(res.data, t.chatUuid)
      return { ok: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      if (antes != null) {
        solicitudes.value = solicitudes.value.map((s) =>
          s.chatUuid === t.chatUuid ? antes : s
        )
      }
      return { ok: false, error: msg || 'Error al guardar en el servidor' }
    }
  }

  async function actualizarComplejidadSolicitud(
    t: SoporteTiSolicitud,
    criticidad: string,
    rol?: 'pm' | 'analista' | 'legacy'
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (t.backendId == null) {
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }

    const idx = solicitudes.value.findIndex((s) => s.chatUuid === t.chatUuid)
    const antes = idx !== -1 ? solicitudes.value[idx] : null
    const patchGestion = { ...t.gestion }
    if (t.tipo === 'A' && rol === 'pm') {
      patchGestion.complejidadPmValor = criticidad as SoporteTiSolicitud['gestion']['complejidadPmValor']
    } else if (t.tipo === 'A' && rol === 'analista') {
      patchGestion.complejidadAnalistaValor =
        criticidad as SoporteTiSolicitud['gestion']['complejidadAnalistaValor']
    } else if (t.tipo !== 'A') {
      patchGestion.complejidadValor = criticidad as SoporteTiSolicitud['gestion']['complejidadValor']
    }
    const actualizada: SoporteTiSolicitud = {
      ...t,
      criticidad,
      complejidadPm: t.tipo === 'A' && rol === 'pm' ? criticidad : t.complejidadPm,
      complejidadAnalista:
        t.tipo === 'A' && rol === 'analista' ? criticidad : t.complejidadAnalista,
      gestion: patchGestion,
      ultimaActualizacion: etiquetaAhora()
    }

    solicitudes.value = solicitudes.value.map((s) =>
      s.chatUuid === t.chatUuid ? actualizada : s
    )

    try {
      const res = await SoporteTiService.updateComplejidad(t.backendId, criticidad)
      if (!res.success) {
        throw new Error(res.message || 'No se pudo actualizar la complejidad')
      }
      if (res.data) {
        fusionarSolicitudApiEnLista(res.data, t.chatUuid)
      }
      return { ok: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      if (antes != null) {
        solicitudes.value = solicitudes.value.map((s) =>
          s.chatUuid === t.chatUuid ? antes : s
        )
      }
      return { ok: false, error: msg || 'Error al guardar en el servidor' }
    }
  }

  async function actualizarEstadoSolicitud(
    t: SoporteTiSolicitud,
    estadoCodigo: string
  ): Promise<{ ok: true; solicitud: SoporteTiSolicitud } | { ok: false; error: string }> {
    if (t.backendId == null) {
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }

    const idx = solicitudes.value.findIndex((s) => s.chatUuid === t.chatUuid)
    const antes = idx !== -1 ? solicitudes.value[idx] : null
    const actualizada = {
      ...aplicarCambioEstadoEnSolicitud(t, estadoCodigo),
      ultimaActualizacion: etiquetaAhora()
    }

    solicitudes.value = solicitudes.value.map((s) =>
      s.chatUuid === t.chatUuid ? actualizada : s
    )

    try {
      const res = await SoporteTiService.updateEstado(t.backendId, { estadoCodigo })
      if (!res.success) {
        throw new Error(res.message || 'No se pudo actualizar el estado')
      }
      if (res.data) {
        fusionarSolicitudApiEnLista(res.data, t.chatUuid)
        const merged = solicitudes.value.find((s) => s.chatUuid === t.chatUuid)
        return { ok: true, solicitud: merged ?? actualizada }
      }
      return { ok: true, solicitud: actualizada }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      if (antes != null) {
        solicitudes.value = solicitudes.value.map((s) =>
          s.chatUuid === t.chatUuid ? antes : s
        )
      }
      return { ok: false, error: msg || 'Error al guardar en el servidor' }
    }
  }

  async function crearSolicitud(payload: SoporteTiCreatePayload) {
    const sla = payload.tipo === 'A' ? 72 : 8
    const res = payload.imagenes?.length
      ? await SoporteTiService.store(buildCreateSolicitudFormData(payload))
      : await SoporteTiService.store(buildCreateApiBody(payload) as Record<string, unknown>)
    if (!res.success || !res.data) throw new Error(res.message || 'No se pudo crear')
    const nueva = mapSolicitudApiToUi(res.data)
    solicitudes.value = [...solicitudes.value, nueva]
    if (nueva.chatUuid && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('soporte-ti-suscribir-sala', { detail: { chatUuid: nueva.chatUuid } })
      )
    }
    const msgCreado =
      payload.tipo === 'A'
        ? `Ticket ${nueva.codigo} creado.`
        : `Ticket ${nueva.codigo} creado. SLA: ${sla}h.`
    agregarMensajeSistema(nueva.chatUuid, nueva.codigo, msgCreado)
    return nueva
  }

  async function subirMaqueta(
    t: SoporteTiSolicitud,
    archivo: File,
    mensaje?: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (t.backendId == null) {
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }

    const fd = new FormData()
    fd.append('archivo', archivo)
    const texto = mensaje?.trim()
    if (texto) fd.append('mensaje', texto)

    try {
      const res = await SoporteTiService.postMaqueta(t.backendId, fd)
      if (!res.success || !res.data) {
        throw new Error(res.message || 'No se pudo subir la maqueta')
      }
      fusionarSolicitudApiEnLista(res.data, t.chatUuid)
      await cargarChatInicial(t.chatUuid)
      return { ok: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo subir la maqueta'
      return { ok: false, error: msg }
    }
  }

  async function enviarChat(chatUuid: string, payload: SoporteTiEnviarMensajePayload) {
    const ticket = solicitudPorChatUuid(chatUuid)
    if (!ticket?.backendId) {
      throw new Error('No se puede enviar el mensaje: solicitud no disponible en el servidor')
    }

    const clientId = crearClientIdMensaje()
    const previews =
      payload.imagenes?.map((f) => ({
        url: URL.createObjectURL(f),
        nombre: f.name
      })) ?? []

    const optimista = mensajeOptimistaDesdeEnvio(
      clientId,
      remitenteChatUi(),
      payload,
      previews
    )
    agregarMensaje(chatUuid, optimista)

    try {
      const res = await SoporteTiService.postMensaje(ticket.backendId, payload)
      if (!res.success || !res.data) {
        throw new Error(res.message || 'No se pudo enviar el mensaje')
      }

      const confirmado = mapMensajeApiToUi(res.data)
      confirmado.estadoEnvio = confirmado.adjuntoPendiente
        ? 'enviando'
        : res.data.leido
          ? 'leido'
          : 'entregado'

      const fusionado: SoporteTiMensaje = {
        ...confirmado,
        clientId: undefined,
        imagenes: confirmado.imagenes?.length ? confirmado.imagenes : optimista.imagenes,
        texto: confirmado.texto || optimista.texto,
        archivoNombre: confirmado.archivoNombre ?? optimista.archivoNombre
      }

      const yaEnSala = mensajesDe(chatUuid).some((m) => m.id === fusionado.id && m.id > 0)
      if (yaEnSala) {
        actualizarMensajeEnSala(chatUuid, fusionado)
      } else {
        reemplazarMensajeOptimista(chatUuid, clientId, fusionado)
      }

      previews.forEach((p) => URL.revokeObjectURL(p.url))
    } catch (e) {
      previews.forEach((p) => URL.revokeObjectURL(p.url))
      actualizarMensajeEnSala(chatUuid, {
        ...optimista,
        estadoEnvio: 'error'
      })
      throw e
    }
  }

  function handlersSala(chatUuid: string) {
    return {
      onMensajeCreado: (p: SoporteTiWsMensajePayload) =>
        aplicarMensajeRemoto(chatUuid, p, false),
      onMensajeActualizado: (p: SoporteTiWsMensajePayload) =>
        aplicarMensajeRemoto(chatUuid, p, true),
      onMensajesLeidos: (p) => aplicarMensajesLeidosRemoto(chatUuid, p),
      onEstadoActualizado: (p: SoporteTiWsEstadoPayload) => {
        if (p.chat_uuid !== chatUuid) return
        aplicarEstadoRemoto(p)
      }
    }
  }

  return {
    rolActivo,
    solicitudes,
    stats,
    error,
    cargar,
    asegurarListadoCargado,
    actualizarSolicitud,
    actualizarPrioridadSolicitud,
    actualizarComplejidadSolicitud,
    actualizarEstadoSolicitud,
    crearSolicitud,
    subirMaqueta,
    enviarChat,
    agregarMensajeSistema,
    mensajesDe,
    metaDe,
    cargarChatInicial,
    cargarMensajesAnteriores,
    resetSala,
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
