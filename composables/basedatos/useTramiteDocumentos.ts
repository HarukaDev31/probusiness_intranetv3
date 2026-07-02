import { ref } from 'vue'
import { TramiteAduanaDocumentoService } from '~/services/basedatos/tramiteAduanaDocumentoService'
import { TramiteAduanaService } from '~/services/basedatos/tramiteAduanaService'
import type {
  TramiteDocumento,
  DocumentoCategoria,
  DocumentoSeccion,
  TramiteCategoria,
  TipoPermisoSection,
  PagoConDatos,
  ComprobanteVerificacion,
} from '~/types/basedatos/tramiteAduana'

/** Si la categoría es Expediente/CPB → f_inicio; Decreto (resolutivo) o Hoja resumen → f_termino (días lo calcula el backend). */
function getFechaUpdateType(categoria: string): 'f_inicio' | 'f_termino' | null {
  const n = (categoria || '').trim().toLowerCase()
  // Expediente o CPB, Expediente CPB, etc.
  if ((n.includes('expediente') && n.includes('cpb')) || n === 'expediente cpb' || n === 'expediente o cpb') return 'f_inicio'
  // Decreto resolutivo, Decreto, etc.
  if (n.includes('decreto')) return 'f_termino'
  // Hoja resumen
  if (n.includes('hoja resumen')) return 'f_termino'
  return null
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Llama a updateTipoPermisoFechas solo si existe (evita "is not a function" si el servicio no tiene el método). */
async function updateTipoPermisoFechasSafe(
  tramiteId: number,
  tipoPermisoId: number,
  payload: { f_inicio?: string | null; f_termino?: string | null }
): Promise<void> {
  const fn = TramiteAduanaService?.updateTipoPermisoFechas
  if (typeof fn === 'function') {
    await fn.call(TramiteAduanaService, tramiteId, tipoPermisoId, payload)
  }
}

export function useTramiteDocumentos() {
  const documentos = ref<TramiteDocumento[]>([])
  const categorias = ref<TramiteCategoria[]>([])
  const tiposPermisoSections = ref<TipoPermisoSection[]>([])
  const pagoServicio = ref<TramiteDocumento[]>([])
  /** Cada pago con documento + monto, fecha, banco (para mostrar uno debajo del otro) */
  const pagosConDatos = ref<PagoConDatos[]>([])
  /** Solo RH o Factura del tramitador (compartido) */
  const seguimientoCompartido = ref<TramiteDocumento[]>([])
  /** Comprobantes de derecho por tipo (tabla pagos_permiso_derecho_tramite) */
  const comprobantesDerechoPorTipo = ref<Record<number, ComprobanteVerificacion[]>>({})
  /** Comprobantes del tramitador (tabla pagos_permiso_tramite) */
  const comprobantesTramitador = ref<ComprobanteVerificacion[]>([])
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const tramiteInfo = ref<{
    id: number
    estado: string
    entidad: string | null
    cliente: string | null
    tipos_permiso: string[]
    consolidado: string | null
    f_caducidad: string | null
  } | null>(null)

  /** Documentos filtrados por categoría (nombre de carpeta) — compatibilidad */
  function getDocumentosByCategoria(categoria: string): TramiteDocumento[] {
    return documentos.value.filter(d => d.categoria === categoria)
  }

  /** Incluye en las secciones todos los documentos de data que falten (por si el backend no los agrupa) */
  function mergeDocumentosEnSecciones() {
    const docIds = (arr: TramiteDocumento[]) => new Set(arr.map(d => d.id))
    for (const doc of documentos.value) {
      const sec = doc.seccion
      if (sec === 'pago_servicio') {
        if (!docIds(pagoServicio.value).has(doc.id)) pagoServicio.value.push(doc)
        continue
      }
      if (sec === 'seguimiento') {
        if (doc.id_tipo_permiso == null) {
          if (!docIds(seguimientoCompartido.value).has(doc.id)) seguimientoCompartido.value.push(doc)
        } else {
          const s = tiposPermisoSections.value.find(t => t.id_tipo_permiso === doc.id_tipo_permiso)
          if (s) {
            const seg = s.seguimiento ?? []
            if (!docIds(seg).has(doc.id)) {
              s.seguimiento = [...seg, doc]
            }
          }
        }
        continue
      }
      if ((sec === 'documentos_tramite' || sec === 'fotos') && doc.id_tipo_permiso != null) {
        const s = tiposPermisoSections.value.find(t => t.id_tipo_permiso === doc.id_tipo_permiso)
        if (s) {
          if (sec === 'documentos_tramite' && !docIds(s.documentos_tramite).has(doc.id)) {
            s.documentos_tramite = [...s.documentos_tramite, doc]
          }
          if (sec === 'fotos' && !docIds(s.fotos).has(doc.id)) {
            s.fotos = [...s.fotos, doc]
          }
        }
      }
    }
  }

  async function loadDocumentos(idTramite: number) {
    loading.value = true
    error.value = null
    try {
      const res = await TramiteAduanaDocumentoService.list(idTramite)
      if (res.success) {
        documentos.value = res.data
        if (res.tramite) tramiteInfo.value = res.tramite
        categorias.value = res.categorias ?? []
        tiposPermisoSections.value = res.tipos_permiso_sections ?? []
        pagoServicio.value = res.pago_servicio ?? []
        pagosConDatos.value = res.pagos_con_datos ?? []
        seguimientoCompartido.value = res.seguimiento_compartido ?? []
        comprobantesDerechoPorTipo.value = res.comprobantes_derecho_por_tipo ?? {}
        comprobantesTramitador.value = res.comprobantes_tramitador ?? []
        // Asegurar que todos los documentos de data estén en las secciones (por si el backend no los incluye)
        mergeDocumentosEnSecciones()
      } else {
        error.value = res.error || 'Error al cargar documentos'
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar documentos'
    } finally {
      loading.value = false
    }
  }

  async function loadCategorias(idTramite: number) {
    try {
      const res = await TramiteAduanaDocumentoService.listCategorias(idTramite)
      if (res.success) {
        categorias.value = res.data
      } else {
        categorias.value = []
      }
    } catch {
      categorias.value = []
    }
  }

  async function createCategoria(idTramite: number, nombre: string): Promise<TramiteCategoria | null> {
    try {
      const res = await TramiteAduanaDocumentoService.createCategoria(idTramite, nombre)
      if (res.success && res.data) {
        categorias.value = [...categorias.value, res.data]
        return res.data
      }
      error.value = res.error || 'Error al crear la categoría'
      return null
    } catch (e: any) {
      error.value = e.message || 'Error al crear la categoría'
      return null
    }
  }

  async function uploadDocumento(
    idTramite: number,
    categoria: DocumentoCategoria,
    nombreDocumento: string,
    archivo: File,
    idCategoria?: number,
    seccion?: DocumentoSeccion,
    idTipoPermiso?: number | null
  ): Promise<boolean> {
    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('categoria', categoria)
      formData.append('nombre_documento', nombreDocumento)
      formData.append('archivo', archivo)
      if (idCategoria != null) formData.append('id_categoria', String(idCategoria))
      if (seccion) formData.append('seccion', seccion)
      if (idTipoPermiso != null) formData.append('id_tipo_permiso', String(idTipoPermiso))

      const res = await TramiteAduanaDocumentoService.upload(idTramite, formData)
      if (res.success && res.data) {
        documentos.value.push(res.data)
        // Si el backend asignó una categoría nueva (ej. nombre como categoría), añadirla a la lista para que se muestre como título
        if (res.data.id_categoria != null && !categorias.value.some(c => c.id === res.data.id_categoria)) {
          categorias.value.push({
            id: res.data.id_categoria,
            id_tramite: idTramite,
            nombre: categoria,
            seccion: (seccion ?? 'documentos_tramite') as 'documentos_tramite' | 'seguimiento',
            id_tipo_permiso: idTipoPermiso ?? null,
          })
        }
        // Actualizar sección correspondiente
        if (res.data.seccion === 'pago_servicio' && !res.data.id_tipo_permiso) {
          pagoServicio.value.push(res.data)
        } else if (res.data.seccion === 'seguimiento') {
          if (!res.data.id_tipo_permiso) {
            seguimientoCompartido.value.push(res.data)
          } else {
            const sec = tiposPermisoSections.value.find(s => s.id_tipo_permiso === res.data.id_tipo_permiso)
            if (sec && sec.seguimiento) sec.seguimiento.push(res.data)
          }
        } else if (res.data.id_tipo_permiso) {
          const sec = tiposPermisoSections.value.find(s => s.id_tipo_permiso === res.data.id_tipo_permiso)
          if (sec) {
            if (res.data.seccion === 'fotos') sec.fotos.push(res.data)
            else sec.documentos_tramite.push(res.data)
          }
        }
        // Actualizar f_inicio / f_termino por tipo_permiso según categoría (Expediente CPB → inicio; Decreto/Hoja resumen → termino; días lo calcula el backend)
        if (res.data.id_tipo_permiso != null) {
          const tipo = getFechaUpdateType(categoria)
          if (tipo === 'f_inicio') await updateTipoPermisoFechasSafe(idTramite, res.data.id_tipo_permiso, { f_inicio: todayISO() })
          if (tipo === 'f_termino') await updateTipoPermisoFechasSafe(idTramite, res.data.id_tipo_permiso, { f_termino: todayISO() })
        }
        return true
      }
      error.value = res.error || 'Error al subir documento'
      return false
    } catch (e: any) {
      error.value = e.message || 'Error al subir documento'
      return false
    } finally {
      uploading.value = false
    }
  }

  async function uploadDocumentos(
    idTramite: number,
    categoria: DocumentoCategoria,
    nombreDocumento: string,
    archivos: File[],
    idCategoria?: number,
    seccion?: DocumentoSeccion,
    idTipoPermiso?: number | null
  ): Promise<boolean> {
    uploading.value = true
    try {
      let allSuccess = true
      for (const archivo of archivos) {
        const ok = await uploadDocumento(idTramite, categoria, nombreDocumento, archivo, idCategoria, seccion, idTipoPermiso)
        if (!ok) allSuccess = false
      }
      return allSuccess
    } catch (e: any) {
      error.value = e.message || 'Error al subir documentos'
      return false
    } finally {
      uploading.value = false
    }
  }

  /** Sube todos los archivos en una sola petición batch. items: { idTipoPermiso, file, seccion, idCategoria, categoria } */
  async function uploadBatch(
    idTramite: number,
    items: Array<{ idTipoPermiso: number; file: File; seccion: DocumentoSeccion; idCategoria: number; categoria: string }>
  ): Promise<boolean> {
    if (items.length === 0) return true
    uploading.value = true
    try {
      const formData = new FormData()
      for (const it of items) {
        formData.append('id_tipo_permiso[]', String(it.idTipoPermiso))
        formData.append('archivo[]', it.file)
        formData.append('seccion[]', it.seccion)
        formData.append('id_categoria[]', String(it.idCategoria))
        formData.append('categoria[]', it.categoria)
      }
      const res = await TramiteAduanaDocumentoService.uploadBatch(idTramite, formData)
      if (!res.success) {
        error.value = res.error ?? 'Error al subir'
        return false
      }
      res.data.forEach((doc, i) => {
        const it = items[i]
        documentos.value.push(doc)
        if (doc.id_categoria != null && !categorias.value.some(c => c.id === doc.id_categoria)) {
          categorias.value.push({
            id: doc.id_categoria,
            id_tramite: idTramite,
            nombre: it?.categoria ?? 'Documento',
            seccion: (doc.seccion ?? 'documentos_tramite') as 'documentos_tramite' | 'seguimiento',
            id_tipo_permiso: doc.id_tipo_permiso ?? null,
          })
        }
        if (doc.seccion === 'pago_servicio' && !doc.id_tipo_permiso) {
          pagoServicio.value.push(doc)
        } else if (doc.seccion === 'seguimiento') {
          if (!doc.id_tipo_permiso) {
            seguimientoCompartido.value.push(doc)
          } else {
            const sec = tiposPermisoSections.value.find(s => s.id_tipo_permiso === doc.id_tipo_permiso)
            if (sec?.seguimiento) sec.seguimiento.push(doc)
          }
        } else if (doc.id_tipo_permiso) {
          const sec = tiposPermisoSections.value.find(s => s.id_tipo_permiso === doc.id_tipo_permiso)
          if (sec) {
            if (doc.seccion === 'fotos') sec.fotos.push(doc)
            else sec.documentos_tramite.push(doc)
          }
        }
      })
      // Actualizar f_inicio / f_termino por tipo_permiso según categoría (Expediente CPB → inicio; Decreto/Hoja resumen → termino)
      for (let i = 0; i < res.data.length; i++) {
        const doc = res.data[i]
        const categoria = items[i]?.categoria ?? doc.categoria
        if (doc.id_tipo_permiso == null) continue
        const tipo = getFechaUpdateType(categoria)
        if (tipo === 'f_inicio') await updateTipoPermisoFechasSafe(idTramite, doc.id_tipo_permiso, { f_inicio: todayISO() })
        if (tipo === 'f_termino') await updateTipoPermisoFechasSafe(idTramite, doc.id_tipo_permiso, { f_termino: todayISO() })
      }
      return true
    } catch (e: any) {
      error.value = e.message || 'Error al subir'
      return false
    } finally {
      uploading.value = false
    }
  }

  /** Una sola petición: documentos + guardar por tipo (f_caducidad por tipo) + pago (voucher). Incluye actualización f_inicio/f_termino por categoría. */
  async function guardarTodo(
    idTramite: number,
    payload: {
      items: Array<{ idTipoPermiso: number; file: File; seccion: DocumentoSeccion; idCategoria: number; categoria: string }>
      guardarTipos: Array<{ id_tipo_permiso: number; documentos_tramite_ids: number[]; fotos_ids: number[]; seguimiento_ids: number[]; f_caducidad?: string | null }>
      /** Nuevos pagos (vouchers) a registrar; se envían todos en Guardar todo */
      pagos?: Array<{ monto: string; banco: string; fecha_cierre: string; voucher: File }>
      /** Actualizar monto, banco y fecha de pagos ya subidos (se guardan en Guardar todo) */
      pagoActualizaciones?: Array<{ id_documento: number; monto: string; banco: string; fecha_cierre: string }>
    }
  ): Promise<boolean> {
    uploading.value = true
    try {
      const formData = new FormData()
      for (const it of payload.items) {
        formData.append('id_tipo_permiso[]', String(it.idTipoPermiso))
        formData.append('archivo[]', it.file)
        formData.append('seccion[]', it.seccion)
        formData.append('id_categoria[]', String(it.idCategoria))
        formData.append('categoria[]', it.categoria)
      }
      formData.append('guardar_tipos', JSON.stringify(payload.guardarTipos))
      if (payload.pagos && payload.pagos.length > 0) {
        for (const p of payload.pagos) {
          formData.append('pago_monto[]', p.monto)
          formData.append('pago_banco[]', p.banco)
          formData.append('pago_fecha_cierre[]', p.fecha_cierre)
          formData.append('pago_voucher[]', p.voucher)
        }
      }
      if (payload.pagoActualizaciones && payload.pagoActualizaciones.length > 0) {
        formData.append('pago_actualizaciones', JSON.stringify(payload.pagoActualizaciones))
      }

      const res = await TramiteAduanaDocumentoService.guardarTodo(idTramite, formData)
      if (!res.success) {
        error.value = res.error ?? 'Error al guardar'
        return false
      }
      const items = payload.items
      res.data.forEach((doc, i) => {
        const it = items[i]
        documentos.value.push(doc)
        if (it && doc.id_categoria != null && !categorias.value.some(c => c.id === doc.id_categoria)) {
          categorias.value.push({
            id: doc.id_categoria,
            id_tramite: idTramite,
            nombre: it.categoria ?? 'Documento',
            seccion: (doc.seccion ?? 'documentos_tramite') as 'documentos_tramite' | 'seguimiento',
            id_tipo_permiso: doc.id_tipo_permiso ?? null,
          })
        }
        if (doc.seccion === 'pago_servicio' && !doc.id_tipo_permiso) {
          pagoServicio.value.push(doc)
        } else if (doc.seccion === 'seguimiento') {
          if (!doc.id_tipo_permiso) {
            seguimientoCompartido.value.push(doc)
          } else {
            const sec = tiposPermisoSections.value.find(s => s.id_tipo_permiso === doc.id_tipo_permiso)
            if (sec?.seguimiento) sec.seguimiento.push(doc)
          }
        } else if (doc.id_tipo_permiso) {
          const sec = tiposPermisoSections.value.find(s => s.id_tipo_permiso === doc.id_tipo_permiso)
          if (sec) {
            if (doc.seccion === 'fotos') sec.fotos.push(doc)
            else sec.documentos_tramite.push(doc)
          }
        }
      })
      // Las fechas (f_inicio/f_termino/días) se actualizan en el backend dentro de guardar-todo según categoría
      return true
    } catch (e: any) {
      error.value = e.message || 'Error al guardar'
      return false
    } finally {
      uploading.value = false
    }
  }

  async function deleteDocumento(id: number): Promise<boolean> {
    try {
      const res = await TramiteAduanaDocumentoService.delete(id)
      if (res.success) {
        documentos.value = documentos.value.filter(d => d.id !== id)
        pagoServicio.value = pagoServicio.value.filter(d => d.id !== id)
        pagosConDatos.value = pagosConDatos.value.filter(p => p.document.id !== id)
        seguimientoCompartido.value = seguimientoCompartido.value.filter(d => d.id !== id)
        tiposPermisoSections.value = tiposPermisoSections.value.map(s => ({
          ...s,
          documentos_tramite: s.documentos_tramite.filter(d => d.id !== id),
          fotos: s.fotos.filter(d => d.id !== id),
          seguimiento: (s.seguimiento ?? []).filter(d => d.id !== id),
        }))
        return true
      }
      error.value = res.error || 'Error al eliminar documento'
      return false
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar documento'
      return false
    }
  }

  function getDownloadUrl(id: number): string {
    return TramiteAduanaDocumentoService.getDownloadUrl(id)
  }

  return {
    documentos,
    categorias,
    tiposPermisoSections,
    pagoServicio,
    pagosConDatos,
    seguimientoCompartido,
    comprobantesDerechoPorTipo,
    comprobantesTramitador,
    loading,
    uploading,
    error,
    tramiteInfo,
    getDocumentosByCategoria,
    loadDocumentos,
    loadCategorias,
    createCategoria,
    uploadDocumento,
    uploadDocumentos,
    uploadBatch,
    guardarTodo,
    deleteDocumento,
    getDownloadUrl,
  }
}
