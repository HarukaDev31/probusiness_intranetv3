import type { WaInboxTemplate, WaInboxTemplateParamDef } from '~/types/whatsapp-inbox'

const FILE_PARAM_PATTERN =
  /archivo|file|documento|document|imagen|image|media|adjunto|pdf|header|header_media/i

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

export function getTemplateParamDefs(tpl: WaInboxTemplate): WaInboxTemplateParamDef[] {
  if (tpl.param_defs?.length) {
    return tpl.param_defs
  }
  return (tpl.params ?? []).map((name) => ({
    name,
    type: isFileTemplateParam(name) ? 'file' : 'text',
    label: name.replace(/_/g, ' ')
  }))
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

export function acceptedTypesForParam(def: WaInboxTemplateParamDef): string[] {
  const kind = (def.file_kind || 'document').toLowerCase()
  if (kind === 'image') {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  }
  if (kind === 'video') {
    return ['.mp4', '.3gp']
  }
  return ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.jpg', '.jpeg', '.png']
}
