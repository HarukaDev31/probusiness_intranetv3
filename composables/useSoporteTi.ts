import { computed } from 'vue'
import type { SoporteTiRol } from '~/constants/soporteTi'
import {
  SOPORTE_TI_DEMO_SOLICITANTE,
  SOPORTE_TI_ROL_META,
  SOPORTE_TI_ROLES
} from '~/constants/soporteTi'
import { SoporteTiService } from '~/services/soporteTiService'
import type {
  SoporteTiCreatePayload,
  SoporteTiEnviarMensajePayload,
  SoporteTiMensaje,
  SoporteTiSolicitud,
  SoporteTiMaqueta,
  SoporteTiWsEstadoPayload,
  SoporteTiWsMensajePayload
} from '~/types/soporteTi'
import {
  buildCreateApiBody,
  mapMensajeApiToUi,
  mapSolicitudApiToUi,
  mapSolicitudUiToApiPatch
} from '~/utils/soporteTiMappers'
import { getSoporteTiSeedSolicitudes } from '~/utils/soporteTiSeed'
import { useSoporteTiChat } from '~/composables/useSoporteTiChat'
import { generarChatUuid } from '~/utils/soporteTiUuid'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import { estadoPorCodigo, estadoPorId, resolverEstado } from '~/constants/soporteTiEstados'

function etiquetaAhora(): string {
  const d = new Date()
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
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

export function useSoporteTi() {
  const config = useRuntimeConfig()
  const usarApi = computed(() => config.public.soporteTiUseApi === true)
  const { publicarDemo } = useSoporteTiChatRoom()
  const {
    mensajesDe,
    metaDe,
    agregarMensaje,
    actualizarMensajeEnSala,
    resetChats,
    cargarChatInicial,
    cargarMensajesAnteriores,
    initDemoStore
  } = useSoporteTiChat()

  const rolActivo = useState<SoporteTiRol>('soporte-ti-rol', () => 'PM')
  const solicitudes = useState<SoporteTiSolicitud[]>('soporte-ti-solicitudes', () => [])
  const seleccion = useState<SoporteTiSolicitud | null>('soporte-ti-seleccion', () => null)
  const loading = useState('soporte-ti-loading', () => false)
  const error = useState<string | null>('soporte-ti-error', () => null)

  const solicitudesVisibles = computed(() => {
    if (rolActivo.value === 'Solicitante') {
      return solicitudes.value.filter(
        (s) => s.solicitante === SOPORTE_TI_DEMO_SOLICITANTE
      )
    }
    return solicitudes.value
  })

  const stats = computed(() => {
    const list = solicitudesVisibles.value
    return {
      total: list.length,
      pendientes: list.filter((t) => t.estadoCodigo === 'pendiente').length,
      enProgreso: list.filter((t) =>
        ['en_progreso', 'en_maqueta', 'hecho'].includes(t.estadoCodigo)
      ).length,
      operativas: list.filter((t) => t.estadoCodigo === 'operativo').length
    }
  })

  function solicitudPorChatUuid(chatUuid: string) {
    return solicitudes.value.find((s) => s.chatUuid === chatUuid) ?? null
  }

  function solicitudPorCodigo(codigo: string) {
    return solicitudes.value.find((s) => s.codigo === codigo) ?? null
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

  async function cargar() {
    loading.value = true
    error.value = null
    try {
      resetChats()
      if (usarApi.value) {
        const res = await SoporteTiService.list()
        if (!res.success) throw new Error(res.message || 'Error al cargar')
        solicitudes.value = res.data.map(mapSolicitudApiToUi)
      } else {
        solicitudes.value = getSoporteTiSeedSolicitudes()
        initDemoStore()
      }
    } catch (e: any) {
      error.value = e?.message || 'Error al cargar'
      solicitudes.value = getSoporteTiSeedSolicitudes()
      resetChats()
      initDemoStore()
    } finally {
      loading.value = false
    }
  }

  async function actualizarSolicitud(
    actualizada: SoporteTiSolicitud,
    opts?: { emitirWs?: boolean }
  ) {
    solicitudes.value = solicitudes.value.map((s) =>
      s.chatUuid === actualizada.chatUuid ? actualizada : s
    )
    if (seleccion.value?.chatUuid === actualizada.chatUuid) {
      seleccion.value = actualizada
    }

    const emitir = opts?.emitirWs !== false
    if (!usarApi.value && emitir) {
      const anterior = solicitudPorChatUuid(actualizada.chatUuid)
      if (anterior && anterior.estadoId !== actualizada.estadoId) {
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

    if (!usarApi.value || actualizada.backendId == null) return
    try {
      await SoporteTiService.update(
        actualizada.backendId,
        mapSolicitudUiToApiPatch(actualizada)
      )
    } catch {
      /* estado local ya aplicado */
    }
  }

  async function crearSolicitud(payload: SoporteTiCreatePayload) {
    const sla = payload.tipo === 'A' ? 72 : 8
    const hoyCorto = etiquetaAhora().split(' ').slice(0, 2).join(' ')
    const chatUuid = generarChatUuid()

    if (usarApi.value) {
      const res = await SoporteTiService.store(
        buildCreateApiBody(payload, SOPORTE_TI_DEMO_SOLICITANTE)
      )
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
    const nueva: SoporteTiSolicitud = {
      backendId: null,
      chatUuid,
      codigo,
      tipo: payload.tipo,
      subtipoB: payload.tipo === 'B' ? payload.subtipoB : null,
      titulo: payload.titulo || 'Nueva solicitud',
      area: payload.area,
      solicitante: SOPORTE_TI_DEMO_SOLICITANTE,
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
    solicitudes.value = [...solicitudes.value, nueva]
    agregarMensajeSistema(chatUuid, codigo, `Ticket ${codigo} creado. SLA: ${sla}h.`)
    return nueva
  }

  async function enviarChat(chatUuid: string, payload: SoporteTiEnviarMensajePayload) {
    const ticket = solicitudPorChatUuid(chatUuid)
    if (!ticket) return

    const meta = SOPORTE_TI_ROL_META[rolActivo.value]
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

  function setRol(r: SoporteTiRol) {
    rolActivo.value = r
    seleccion.value = null
  }

  function handlersSala(chatUuid: string) {
    return {
      onMensajeCreado: (p: SoporteTiWsMensajePayload) => aplicarMensajeRemoto(p, false),
      onMensajeActualizado: (p: SoporteTiWsMensajePayload) => aplicarMensajeRemoto(p, true),
      onEstadoActualizado: (p: SoporteTiWsEstadoPayload) => aplicarEstadoRemoto(p)
    }
  }

  return {
    SOPORTE_TI_ROLES,
    rolActivo,
    setRol,
    solicitudesVisibles,
    stats,
    seleccion,
    setSeleccion: (s: SoporteTiSolicitud | null) => {
      seleccion.value = s
    },
    loading,
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
      const meta = SOPORTE_TI_ROL_META.PM
      const msg: SoporteTiMensaje = {
        id: Date.now(),
        remitente: meta.nombre,
        iniciales: meta.iniciales,
        color: meta.color,
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
