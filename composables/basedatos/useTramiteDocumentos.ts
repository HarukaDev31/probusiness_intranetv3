import { ref } from 'vue'
import { TramiteAduanaDocumentoService } from '~/services/basedatos/tramiteAduanaDocumentoService'
import type { TramiteDocumento, DocumentoCategoria, TramiteCategoria } from '~/types/basedatos/tramiteAduana'

export function useTramiteDocumentos() {
  const documentos = ref<TramiteDocumento[]>([])
  const categorias = ref<TramiteCategoria[]>([])
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const tramiteInfo = ref<{
    id: number
    estado: string
    entidad: string | null
    tipo_permiso: string | null
    consolidado: string | null
  } | null>(null)

  /** Documentos filtrados por categoría (nombre de carpeta) */
  function getDocumentosByCategoria(categoria: string): TramiteDocumento[] {
    return documentos.value.filter(d => d.categoria === categoria)
  }

  async function loadDocumentos(idTramite: number) {
    loading.value = true
    error.value = null
    try {
      const res = await TramiteAduanaDocumentoService.list(idTramite)
      if (res.success) {
        documentos.value = res.data
        if (res.tramite) {
          tramiteInfo.value = res.tramite
        }
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
    } catch (e: any) {
      categorias.value = []
    }
  }

  /** Crea la categoría y devuelve la creada (con id) para poder enviar id_categoria al subir el archivo. */
  async function createCategoria(
    idTramite: number,
    nombre: string
  ): Promise<TramiteCategoria | null> {
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
    idCategoria?: number
  ): Promise<boolean> {
    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('categoria', categoria)
      formData.append('nombre_documento', nombreDocumento)
      formData.append('archivo', archivo)
      if (idCategoria != null) {
        formData.append('id_categoria', String(idCategoria))
      }

      const res = await TramiteAduanaDocumentoService.upload(idTramite, formData)
      if (res.success && res.data) {
        documentos.value.push(res.data)
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
    idCategoria?: number
  ): Promise<boolean> {
    uploading.value = true
    try {
      let allSuccess = true
      for (const archivo of archivos) {
        const formData = new FormData()
        formData.append('categoria', categoria)
        formData.append('nombre_documento', nombreDocumento)
        formData.append('archivo', archivo)
        if (idCategoria != null) {
          formData.append('id_categoria', String(idCategoria))
        }

        const res = await TramiteAduanaDocumentoService.upload(idTramite, formData)
        if (res.success && res.data) {
          documentos.value.push(res.data)
        } else {
          error.value = res.error || 'Error al subir documento'
          allSuccess = false
        }
      }
      return allSuccess
    } catch (e: any) {
      error.value = e.message || 'Error al subir documentos'
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
    deleteDocumento,
    getDownloadUrl,
  }
}
