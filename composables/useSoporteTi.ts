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
  SoporteTiMaqueta,
  SoporteTiWsEstadoPayload,
  SoporteTiWsMensajePayload
} from '~/types/soporteTi'
import { useSoporteTiChat } from '~/composables/useSoporteTiChat'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import { encolarLeidosDesdeMensajes } from '~/composables/useSoporteTiChatLeidos'
import { CODE, IN_PROGRESS_CODES } from '~/constants/soporteTiEstados'
import { apply as applyStateChange } from '~/utils/soporteTiEstadoTransition'
import { useUserRole } from '~/composables/auth/useUserRole'
import {
  crearClientIdMensaje,
  mensajeOptimistaDesdeEnvio
} from '~/utils/soporteTiChatMensaje'
import { formatSoporteTiMarcaTiempo } from '~/utils/formatters'

function clientIdFallback(m: SoporteTiMensaje): string {
  return m.clientId ?? `legacy-${m.id}`
}

function nowLabel(): string {
  return formatSoporteTiMarcaTiempo(new Date())
}

function statsFromList(list: SoporteTiSolicitud[]) {
  return {
    total: list.length,
    pendientes: list.filter((t) => t.estadoCodigo === CODE.PENDING).length,
    enProgreso: list.filter((t) =>
      (IN_PROGRESS_CODES as readonly string[]).includes(t.estadoCodigo)
    ).length,
    operativas: list.filter((t) => t.estadoCodigo === CODE.OPERATIVE).length
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

  /** Solicitantes habituales + PM y Coordinador General (staff que también crea tickets). */
  const puedeCrearSolicitud = computed(() =>
    rolActivo.value === 'Solicitante'
    || hasRole(ROLES.PM)
    || hasRole(ROLES.COORDINADOR_GENERAL)
  )

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

  const stats = computed(() => statsFromList(solicitudes.value))

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

  async function resolveForRoute(param: string): Promise<SoporteTiSolicitud | null> {
    if (!param) return null
    const raw = decodeURIComponent(param.trim())
    const local = solicitudPorParamRuta(raw)
    if (local) return local

    if (/^\d+$/.test(raw)) {
      try {
        const res = await SoporteTiService.show(Number(raw))
        if (!res?.success || !res.data) return null
        upsertSolicitud(res.data)
        return res.data
      } catch {
        return null
      }
    }

    try {
      const res = await SoporteTiService.list({ q: raw, tipo: 'todos' })
      if (!res?.success || !res.data?.length) return null
      const mapped = res.data
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

  function addSystemMessage(chatUuid: string, _codigo: string, texto: string) {
    const msg: SoporteTiMensaje = {
      id: Date.now(),
      remitente: 'Sistema',
      iniciales: 'SYS',
      color: '#64748b',
      texto,
      esSistema: true,
      marcaTiempo: nowLabel()
    }
    agregarMensaje(chatUuid, msg)
  }

  function esSalaChatVisible(chatUuid: string): boolean {
    const { salaActivaUuid } = useSoporteTiChatRoom()
    return salaActivaUuid.value === chatUuid
  }

  function applyRemoteMessage(
    chatUuidEsperado: string,
    payload: SoporteTiWsMensajePayload,
    esActualizacion = false
  ) {
    const adapted = SoporteTiService.adaptWsMensaje(payload)
    if (!adapted.chatUuid || adapted.chatUuid !== chatUuidEsperado) return
    if (!esSalaChatVisible(chatUuidEsperado)) return

    const ui = adapted.mensaje
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
        texto: ui.texto || prev.texto
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

  function applyRemoteReads(
    chatUuid: string,
    payload: import('~/types/soporteTi').SoporteTiWsMensajesLeidosPayload
  ) {
    const adapted = SoporteTiService.adaptWsMensajesLeidos(payload)
    if (!adapted.mensajeIds.length || !esSalaChatVisible(chatUuid)) return
    aplicarMensajesLeidosWs(chatUuid, adapted.mensajeIds)
  }

  async function refrescarSolicitudPorChatUuid(chatUuid: string) {
    const s = solicitudPorChatUuid(chatUuid)
    if (!s?.backendId) return
    try {
      const res = await SoporteTiService.show(s.backendId)
      if (res.success && res.data) {
        merge(res.data)
      }
    } catch {
      // listado sigue usable; el detalle se puede recargar al entrar
    }
  }

  function applyRemoteState(payload: SoporteTiWsEstadoPayload) {
    void refrescarSolicitudPorChatUuid(payload.chat_uuid)
  }

  let cargarEnCurso: Promise<void> | null = null

  async function cargar(filters?: SoporteTiListFilters) {
    if (cargarEnCurso) return cargarEnCurso

    cargarEnCurso = (async () => {
      error.value = null
      try {
        const res = await SoporteTiService.list(filters)
        if (!res?.success) throw new Error(res.message || 'Error al cargar')
        solicitudes.value = res.data ?? []
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

  async function update(
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
      const res = await SoporteTiService.update(actualizada.backendId, actualizada)
      if (!res.success) {
        throw new Error(res.message || 'Error al guardar')
      }
      if (res.data) {
        merge(res.data)
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

  function merge(ui: SoporteTiSolicitud) {
    upsertSolicitud(ui)
  }

  async function updateAssignment(
    t: SoporteTiSolicitud,
    body: { pmUserId?: number | null; analistaUserId?: number | null }
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (t.backendId == null) {
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }
    try {
      const res = await SoporteTiService.updateAsignacion(t.backendId, body)
      if (!res.success) throw new Error(res.message || 'No se pudo actualizar la asignación')
      if (res.data) merge(res.data)
      return { ok: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      return { ok: false, error: msg || 'Error al guardar en el servidor' }
    }
  }

  async function updatePriority(
    t: SoporteTiSolicitud,
    prioridad: number
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (t.backendId == null) {
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }
    const idx = solicitudes.value.findIndex((s) => s.chatUuid === t.chatUuid)
    const antes = idx !== -1 ? solicitudes.value[idx] : null
    solicitudes.value = solicitudes.value.map((s) =>
      s.chatUuid === t.chatUuid ? { ...s, prioridad, ultimaActualizacion: nowLabel() } : s
    )
    try {
      const res = await SoporteTiService.updatePrioridad(t.backendId, prioridad)
      if (!res.success) throw new Error(res.message || 'No se pudo actualizar la prioridad')
      if (res.data) merge(res.data)
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

  async function updateComplexity(
    t: SoporteTiSolicitud,
    criticidad: string,
    rol?: 'pm' | 'analista' | 'legacy'
  ): Promise<{ ok: true; slaHoras: number } | { ok: false; error: string }> {
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
      ultimaActualizacion: nowLabel()
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
        merge(res.data)
      }
      const slaHoras = res.data?.slaHoras ?? 0
      return { ok: true, slaHoras }
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

  async function updateState(
    t: SoporteTiSolicitud,
    estadoCodigo: string
  ): Promise<{ ok: true; solicitud: SoporteTiSolicitud } | { ok: false; error: string }> {
    if (t.backendId == null) {
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }

    const idx = solicitudes.value.findIndex((s) => s.chatUuid === t.chatUuid)
    const antes = idx !== -1 ? solicitudes.value[idx] : null
    const actualizada = {
      ...applyStateChange(t, estadoCodigo),
      ultimaActualizacion: nowLabel()
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
        merge(res.data)
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

  async function create(payload: SoporteTiCreatePayload) {
    const res = await SoporteTiService.store(payload)
    if (!res.success || !res.data) throw new Error(res.message || 'No se pudo crear')
    const nueva = res.data
    solicitudes.value = [...solicitudes.value, nueva]
    addSystemMessage(nueva.chatUuid, nueva.codigo, `Ticket ${nueva.codigo} creado.`)
    return nueva
  }

  async function remove(
    t: SoporteTiSolicitud
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (t.backendId == null) {
      return { ok: false, error: 'La solicitud no tiene identificador en el servidor' }
    }
    try {
      const res = await SoporteTiService.destroy(t.backendId)
      if (!res.success) throw new Error(res.message || 'No se pudo eliminar')
      solicitudes.value = solicitudes.value.filter((s) => s.chatUuid !== t.chatUuid)
      if (t.chatUuid) resetSala(t.chatUuid)
      return { ok: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar'
      return { ok: false, error: msg }
    }
  }

  async function uploadMockup(
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
      merge(res.data)
      await cargarChatInicial(t.chatUuid)
      return { ok: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo subir la maqueta'
      return { ok: false, error: msg }
    }
  }

  async function sendChat(chatUuid: string, payload: SoporteTiEnviarMensajePayload) {
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

      const confirmado = res.data
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

  function applyRemoteSolicitudCreada(ui: SoporteTiSolicitud) {
    if (!ui.chatUuid) return
    upsertSolicitud(ui)
  }

  function handlersSala(chatUuid: string) {
    return {
      onMensajeCreado: (p: SoporteTiWsMensajePayload) =>
        applyRemoteMessage(chatUuid, p, false),
      onMensajeActualizado: (p: SoporteTiWsMensajePayload) =>
        applyRemoteMessage(chatUuid, p, true),
      onMensajesLeidos: (p) => applyRemoteReads(chatUuid, p),
      onEstadoActualizado: (p: SoporteTiWsEstadoPayload) => {
        if (p.chat_uuid !== chatUuid) return
        applyRemoteState(p)
      }
    }
  }

  return {
    rolActivo,
    puedeCrearSolicitud,
    solicitudes,
    stats,
    error,
    cargar,
    asegurarListadoCargado,
    update,
    updatePriority,
    updateComplexity,
    updateAssignment,
    updateState,
    create,
    remove,
    uploadMockup,
    sendChat,
    addSystemMessage,
    mensajesDe,
    metaDe,
    cargarChatInicial,
    cargarMensajesAnteriores,
    resetSala,
    solicitudPorChatUuid,
    solicitudPorCodigo,
    solicitudPorParamRuta,
    resolveForRoute,
    handlersSala,
    applyRemoteSolicitudCreada,
    nowLabel,
    registerLocalMockup(
      chatUuid: string,
      mq: SoporteTiMaqueta,
      mensajePm: string,
      archivoNombre?: string
    ) {
      const t = solicitudPorChatUuid(chatUuid)
      if (!t) return
      void update({
        ...t,
        maqueta: mq,
        ultimaActualizacion: nowLabel()
      })
      const quien = remitenteChatUi()
      const msg: SoporteTiMensaje = {
        id: Date.now(),
        remitente: quien.nombre,
        iniciales: quien.iniciales,
        color: quien.color,
        texto: mensajePm,
        esSistema: false,
        marcaTiempo: nowLabel(),
        esPropio: rolActivo.value === 'PM',
        archivoNombre: archivoNombre ?? mq.nombre,
        imagenes: mq.dataUrl
          ? [{ url: mq.dataUrl, nombre: mq.nombre, tamano: mq.tamano }]
          : undefined
      }
      agregarMensaje(chatUuid, msg)
      addSystemMessage(
        chatUuid,
        t.codigo,
        `Maqueta "${mq.nombre}" subida. Pendiente de aprobación del solicitante.`
      )
    }
  }
}
