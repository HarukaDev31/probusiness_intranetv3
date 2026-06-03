import type { WaInboxTemplate, WaInboxTemplateParamDef } from '~/types/whatsapp-inbox'

const FILE_PARAM_PATTERN =
  /archivo|file|documento|document|imagen|image|media|adjunto|pdf|header|header_media/i

export type WaInboxTemplateFileKind = 'document' | 'image' | 'video'

export function headerFormatToFileKind(
  headerFormat?: string | null
): WaInboxTemplateFileKind | null {
  const f = (headerFormat || '').toUpperCase()
  if (f === 'DOCUMENT') return 'document'
  if (f === 'IMAGE') return 'image'
  if (f === 'VIDEO') return 'video'
  return null
}

export function isFileTemplateParam(name: string, explicitType?: string) {
  if (explicitType === 'file') return true
  return FILE_PARAM_PATTERN.test(name)
}

export function paramTypeLabel(def: WaInboxTemplateParamDef): string {
  if (def.type === 'file') {
    const kind = (def.file_kind || 'document').toLowerCase()
    if (kind === 'image') return 'Archivo (imagen)'
    if (kind === 'video') return 'Archivo (video)'
    return 'Archivo (documento)'
  }
  return 'Texto'
}

export function paramTypeBadgeColor(def: WaInboxTemplateParamDef): 'neutral' | 'info' | 'warning' {
  if (def.type === 'file') {
    const kind = (def.file_kind || 'document').toLowerCase()
    if (kind === 'image') return 'info'
    if (kind === 'video') return 'warning'
    return 'neutral'
  }
  return 'neutral'
}

/** Tipo de archivo exigido por el parámetro (encabezado Meta o file_kind del API). */
export function resolveParamFileKind(
  def: WaInboxTemplateParamDef,
  tpl: WaInboxTemplate
): WaInboxTemplateFileKind {
  const fromDef = (def.file_kind || '').toLowerCase()
  if (fromDef === 'document' || fromDef === 'image' || fromDef === 'video') {
    return fromDef
  }
  if (def.name === 'header_media' || def.name === 'header') {
    const fromHeader = headerFormatToFileKind(tpl.header_format)
    if (fromHeader) return fromHeader
  }
  if (/imagen|image/i.test(def.name) || /imagen|image/i.test(def.label || '')) {
    return 'image'
  }
  if (/video/i.test(def.name) || /video/i.test(def.label || '')) {
    return 'video'
  }
  return 'document'
}

export function getTemplateParamDefs(tpl: WaInboxTemplate): WaInboxTemplateParamDef[] {
  let defs: WaInboxTemplateParamDef[]

  if (tpl.param_defs?.length) {
    defs = tpl.param_defs.map((d) => ({ ...d }))
  } else {
    defs = (tpl.params ?? []).map((name) => ({
      name,
      type: isFileTemplateParam(name) ? 'file' as const : 'text' as const,
      label: name.replace(/_/g, ' ')
    }))
  }

  const headerKind = headerFormatToFileKind(tpl.header_format)
  if (headerKind) {
    const headerIdx = defs.findIndex(
      (d) => d.type === 'file' && (d.name === 'header_media' || d.name === 'header')
    )
    const headerLabel =
      headerKind === 'document'
        ? 'PDF de encabezado (requerido)'
        : headerKind === 'image'
          ? 'Imagen de encabezado (requerido)'
          : 'Video de encabezado (requerido)'

    if (headerIdx >= 0) {
      defs[headerIdx] = {
        ...defs[headerIdx],
        type: 'file',
        file_kind: headerKind,
        label: defs[headerIdx].label || headerLabel
      }
    } else {
      defs.unshift({
        name: 'header_media',
        type: 'file',
        file_kind: headerKind,
        label: headerLabel
      })
    }
  }

  return defs.map((d) => {
    if (d.type !== 'file') return d
    return { ...d, file_kind: resolveParamFileKind(d, tpl) }
  })
}

export function buildTemplatePreview(
  text: string,
  defs: WaInboxTemplateParamDef[],
  values: Record<string, string>
) {
  let out = text
  for (const def of defs) {
    if (def.type === 'file') continue
    const val = values[def.name]?.trim()
    out = out.replace(new RegExp(`\\{\\{${def.name}\\}\\}`, 'g'), val || `{{${def.name}}}`)
  }
  return out
}

export function textParamsFilled(
  defs: WaInboxTemplateParamDef[],
  values: Record<string, string>
) {
  return defs
    .filter((d) => d.type !== 'file')
    .every((d) => (values[d.name] ?? '').trim() !== '')
}

export function fileParamsFilled(
  defs: WaInboxTemplateParamDef[],
  files: Record<string, File[]>
) {
  return defs
    .filter((d) => d.type === 'file')
    .every((d) => (files[d.name]?.length ?? 0) > 0)
}

export function acceptedTypesForParam(
  def: WaInboxTemplateParamDef,
  tpl?: WaInboxTemplate | null
): string[] {
  const kind = tpl ? resolveParamFileKind(def, tpl) : ((def.file_kind || 'document').toLowerCase())
  if (kind === 'image') {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  }
  if (kind === 'video') {
    return ['.mp4', '.3gp']
  }
  return ['.pdf']
}

export function uploadMessageForParam(
  def: WaInboxTemplateParamDef,
  tpl?: WaInboxTemplate | null
): string {
  const kind = tpl ? resolveParamFileKind(def, tpl) : 'document'
  if (kind === 'image') {
    return 'Sube una imagen (JPG, PNG, GIF o WebP) para el encabezado de la plantilla'
  }
  if (kind === 'video') {
    return 'Sube un video MP4 o 3GP para el encabezado de la plantilla'
  }
  return 'Sube un PDF para el encabezado de la plantilla'
}

export function fileMatchesParamKind(
  file: File,
  def: WaInboxTemplateParamDef,
  tpl: WaInboxTemplate
): boolean {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
  const allowed = acceptedTypesForParam(def, tpl)
  if (!allowed.some((t) => t === ext)) {
    return false
  }
  const kind = resolveParamFileKind(def, tpl)
  if (kind === 'document') {
    return file.type === 'application/pdf' || ext === '.pdf'
  }
  if (kind === 'image') {
    return file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
  }
  return file.type.startsWith('video/') || ['.mp4', '.3gp'].includes(ext)
}
