import { BaseService } from '~/services/base/BaseService'
import type {
  ManualUsuarioApiResponse,
  ManualUsuarioContext,
  ManualUsuarioManualData,
  ManualAdminMeta,
  ManualAdminPageSummary,
  ManualPage,
  ManualBlock,
  ManualMediaItem,
  ManualCapturaCatalogItem,
} from '~/types/manualUsuario'

export class ManualUsuarioService extends BaseService {
  private static baseUrl = '/api/manual-usuario'
  private static adminUrl = '/api/manual-usuario/admin'

  static async getContext(): Promise<ManualUsuarioContext> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualUsuarioContext>>(this.baseUrl, {
      method: 'GET',
    })
    return res.data
  }

  static async getMyManual(): Promise<ManualUsuarioManualData> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualUsuarioManualData>>(
      `${this.baseUrl}/me`,
      { method: 'GET' }
    )
    return res.data
  }

  static async getRoleManual(slug: string): Promise<ManualUsuarioManualData> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualUsuarioManualData>>(
      `${this.baseUrl}/roles/${encodeURIComponent(slug)}`,
      { method: 'GET' }
    )
    return res.data
  }

  static async downloadMyPdf(): Promise<Blob> {
    return this.downloadPdfBlob(`${this.baseUrl}/me/pdf`)
  }

  static async downloadRolePdf(slug: string): Promise<Blob> {
    return this.downloadPdfBlob(`${this.baseUrl}/roles/${encodeURIComponent(slug)}/pdf`)
  }

  static async downloadGlobalPdf(): Promise<Blob> {
    return this.downloadPdfBlob(`${this.baseUrl}/pdf`)
  }

  /** Descarga PDF binario y valida que no sea un JSON de error. */
  private static async downloadPdfBlob(endpoint: string): Promise<Blob> {
    const raw = await this.apiCall<Blob | ArrayBuffer | Uint8Array>(endpoint, {
      method: 'GET',
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    })

    const blob = raw instanceof Blob
      ? raw
      : new Blob([raw as BlobPart], { type: 'application/pdf' })

    const headBuf = await blob.slice(0, 5).arrayBuffer()
    const head = String.fromCharCode(...new Uint8Array(headBuf))
    if (head.startsWith('%PDF')) {
      return blob.type === 'application/pdf'
        ? blob
        : new Blob([blob], { type: 'application/pdf' })
    }

    // Posible error JSON con responseType blob
    const text = await blob.text()
    try {
      const parsed = JSON.parse(text)
      throw new Error(parsed?.message || parsed?.error || 'No se pudo generar el PDF')
    } catch (e: any) {
      if (e?.message && !String(e.message).includes('JSON')) throw e
      throw new Error('La respuesta del servidor no es un PDF válido')
    }
  }

  /** Descarga un asset o media del manual con JWT. */
  static async fetchAsset(pathOrUrl: string): Promise<Blob> {
    let endpoint = pathOrUrl
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      try {
        const u = new URL(pathOrUrl)
        endpoint = u.pathname + u.search
      } catch {
        endpoint = pathOrUrl
      }
    }
    const idxAssets = endpoint.indexOf('/api/manual-usuario/assets/')
    const idxMedia = endpoint.indexOf('/api/manual-usuario/media/')
    if (idxAssets >= 0) {
      endpoint = endpoint.slice(idxAssets)
    } else if (idxMedia >= 0) {
      endpoint = endpoint.slice(idxMedia)
    } else if (!endpoint.startsWith('/api/')) {
      endpoint = `${this.baseUrl}/assets/${endpoint.replace(/^\/+/, '')}`
    }

    return this.apiCall<Blob>(endpoint, {
      method: 'GET',
      responseType: 'blob',
    })
  }

  // ---- Admin (root) ----

  static async adminMeta(): Promise<ManualAdminMeta> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualAdminMeta>>(`${this.adminUrl}/meta`, {
      method: 'GET',
    })
    return res.data
  }

  static async adminListPages(params?: { role_slug?: string; publicado?: boolean }): Promise<ManualAdminPageSummary[]> {
    const q = new URLSearchParams()
    if (params?.role_slug) q.set('role_slug', params.role_slug)
    if (params?.publicado !== undefined) q.set('publicado', String(params.publicado))
    const qs = q.toString()
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualAdminPageSummary[]>>(
      `${this.adminUrl}/pages${qs ? `?${qs}` : ''}`,
      { method: 'GET' }
    )
    return res.data
  }

  static async adminGetPage(id: number): Promise<ManualPage> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualPage>>(`${this.adminUrl}/pages/${id}`, {
      method: 'GET',
    })
    return res.data
  }

  static async adminCreatePage(payload: Record<string, unknown>): Promise<ManualPage> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualPage>>(`${this.adminUrl}/pages`, {
      method: 'POST',
      body: payload,
    })
    return res.data
  }

  static async adminCopyPage(
    id: number,
    payload: {
      role_slug: string
      titulo?: string
      modulo_key?: string
      descripcion?: string | null
      publicado?: boolean
    }
  ): Promise<ManualPage> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualPage>>(`${this.adminUrl}/pages/${id}/copy`, {
      method: 'POST',
      body: payload,
    })
    return res.data
  }

  static async adminUpdatePage(id: number, payload: Record<string, unknown>): Promise<ManualPage> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualPage>>(`${this.adminUrl}/pages/${id}`, {
      method: 'PUT',
      body: payload,
    })
    return res.data
  }

  static async adminDeletePage(id: number): Promise<void> {
    await this.apiCall(`${this.adminUrl}/pages/${id}`, { method: 'DELETE' })
  }

  static async adminCreateBlock(paginaId: number, payload: Record<string, unknown>): Promise<ManualBlock> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualBlock>>(
      `${this.adminUrl}/pages/${paginaId}/bloques`,
      { method: 'POST', body: payload }
    )
    return res.data
  }

  static async adminCreateBlockFromPageWidget(
    paginaId: number,
    payload: { parent_id: number; page_key: string; widget_key: string; titulo?: string }
  ): Promise<ManualBlock> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualBlock>>(
      `${this.adminUrl}/pages/${paginaId}/bloques/from-page-widget`,
      { method: 'POST', body: payload }
    )
    return res.data
  }

  static async adminUpdateBlock(id: number, payload: Record<string, unknown>): Promise<ManualBlock> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualBlock>>(`${this.adminUrl}/bloques/${id}`, {
      method: 'PUT',
      body: payload,
    })
    return res.data
  }

  static async adminDeleteBlock(id: number): Promise<void> {
    await this.apiCall(`${this.adminUrl}/bloques/${id}`, { method: 'DELETE' })
  }

  static async adminReorderBlocks(items: Array<{ id: number; orden: number }>): Promise<void> {
    await this.apiCall(`${this.adminUrl}/bloques/reorder`, {
      method: 'POST',
      body: { items },
    })
  }

  static async adminListMedia(roleSlug?: string): Promise<ManualMediaItem[]> {
    const qs = roleSlug ? `?role_slug=${encodeURIComponent(roleSlug)}` : ''
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualMediaItem[]>>(`${this.adminUrl}/media${qs}`, {
      method: 'GET',
    })
    return res.data
  }

  static async adminUploadMedia(file: File, opts?: { alt?: string; role_slug?: string }): Promise<ManualMediaItem> {
    const fd = new FormData()
    fd.append('file', file)
    if (opts?.alt) fd.append('alt', opts.alt)
    if (opts?.role_slug) fd.append('role_slug', opts.role_slug)

    const res = await this.apiCall<ManualUsuarioApiResponse<ManualMediaItem>>(`${this.adminUrl}/media`, {
      method: 'POST',
      body: fd,
    })
    return res.data
  }

  static async adminDeleteMedia(id: number): Promise<void> {
    await this.apiCall(`${this.adminUrl}/media/${id}`, { method: 'DELETE' })
  }

  static async adminListCapturas(): Promise<ManualCapturaCatalogItem[]> {
    const res = await this.apiCall<ManualUsuarioApiResponse<ManualCapturaCatalogItem[]>>(
      `${this.adminUrl}/capturas`,
      { method: 'GET' }
    )
    return res.data
  }

  static async adminAssignCaptura(
    blockId: number,
    payload: { media_id?: number | null; capture_key?: string | null }
  ): Promise<{ block: ManualBlock; updated: number }> {
    const res = await this.apiCall<ManualUsuarioApiResponse<{ block: ManualBlock; updated: number }>>(
      `${this.adminUrl}/bloques/${blockId}/asignar-captura`,
      { method: 'POST', body: payload }
    )
    return res.data
  }
}
