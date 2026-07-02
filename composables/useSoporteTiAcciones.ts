import type { SoporteTiSolicitud } from '~/types/soporteTi'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { marcarEstadoCambiadoPorMi } from '~/utils/soporteTiWsEstadoSkip'

export function useSoporteTiAcciones() {
  const {
    actualizarComplejidadSolicitud,
    actualizarEstadoSolicitud,
    agregarMensajeSistema,
    subirMaqueta,
    enviarChat
  } = useSoporteTi()
  const { showError, showSuccess } = useModal()
  const { withSpinner } = useSpinner()

  function complejidadActual(t: SoporteTiSolicitud, rol?: 'pm' | 'analista' | 'legacy') {
    const g = t.gestion
    if (t.tipo === 'A' && rol === 'pm') return g.complejidadPmValor
    if (t.tipo === 'A' && rol === 'analista') return g.complejidadAnalistaValor
    return g.complejidadValor ?? t.criticidad
  }

  async function cambiarComplejidad(
    t: SoporteTiSolicitud,
    criticidad: string,
    opts?: { mensajeExito?: string; rol?: 'pm' | 'analista' | 'legacy' }
  ): Promise<boolean> {
    if (complejidadActual(t, opts?.rol) === criticidad) return true
    const rol = opts?.rol
    const etiquetaRol =
      t.tipo === 'A' && rol === 'pm'
        ? 'Complejidad PM'
        : t.tipo === 'A' && rol === 'analista'
          ? 'Complejidad analista'
          : 'Complejidad'
    try {
      await withSpinner(async () => {
        const res = await actualizarComplejidadSolicitud(t, criticidad, rol)
        if (res.ok === false) throw new Error(res.error)
      }, 'Actualizando complejidad…')
      agregarMensajeSistema(
        t.chatUuid,
        t.codigo,
        `${etiquetaRol} actualizada a «${criticidad}».`
      )
      showSuccess(
        `${etiquetaRol} actualizada`,
        opts?.mensajeExito ?? `El ticket ${t.codigo} quedó en «${criticidad}».`
      )
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar la complejidad.'
      showError('Error al actualizar complejidad', msg)
      return false
    }
  }

  async function cambiarEstado(
    t: SoporteTiSolicitud,
    codigo: string,
    opts?: { rolEtiqueta?: string }
  ): Promise<boolean> {
    if (!codigo || codigo === t.estadoCodigo) return true
    try {
      let estadoLabel = codigo
      await withSpinner(async () => {
        const res = await actualizarEstadoSolicitud(t, codigo)
        if (res.ok === false) throw new Error(res.error)
        estadoLabel = res.solicitud.estado
      }, 'Actualizando estado…')
      marcarEstadoCambiadoPorMi(t.chatUuid)
      showSuccess('Estado actualizado', `El ticket ${t.codigo} pasó a «${estadoLabel}».`)
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar el estado.'
      showError('Error al actualizar estado', msg)
      return false
    }
  }

  async function pasarEnMaqueta(
    t: SoporteTiSolicitud,
    archivos: File[],
    opts?: { mensaje?: string; cambiarEstado?: boolean }
  ): Promise<boolean> {
    if (!archivos.length) {
      showError('Archivos requeridos', 'Debes adjuntar al menos un archivo de maqueta.')
      return false
    }

    const cambiarEstadoFlag = opts?.cambiarEstado ?? t.estadoCodigo === 'pendiente'
    const mensajePm = opts?.mensaje?.trim() || 'He subido la maqueta para revisión.'

    try {
      await withSpinner(async () => {
        const sub = await subirMaqueta(t, archivos[0], mensajePm)
        if (sub.ok === false) throw new Error(sub.error)

        if (cambiarEstadoFlag && t.estadoCodigo === 'pendiente') {
          const res = await actualizarEstadoSolicitud(t, 'en_maqueta')
          if (res.ok === false) throw new Error(res.error)
          marcarEstadoCambiadoPorMi(t.chatUuid)
          agregarMensajeSistema(
            t.chatUuid,
            t.codigo,
            'El ticket pasó a «En maqueta». Pendiente de aprobación del solicitante.'
          )
        }

        if (archivos.length > 1) {
          await enviarChat(t.chatUuid, {
            texto: 'Archivos adicionales de la maqueta.',
            imagenes: archivos.slice(1)
          })
        }
      }, 'Subiendo maqueta…')

      showSuccess(
        cambiarEstadoFlag ? 'Maqueta enviada' : 'Maqueta actualizada',
        cambiarEstadoFlag
          ? `El ticket ${t.codigo} está en «En maqueta» y el chat fue notificado.`
          : `La maqueta de ${t.codigo} quedó registrada y visible en el chat.`
      )
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo completar la operación.'
      showError('Error al subir maqueta', msg)
      return false
    }
  }

  return { cambiarComplejidad, cambiarEstado, pasarEnMaqueta }
}
