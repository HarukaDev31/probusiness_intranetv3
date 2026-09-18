/** CBM cotizado completo: volumen normal + IMO. */
export function cbmTotalConImo(proveedor: {
  cbm_total?: number | string | null
  cbm_imo?: number | string | null
} | null | undefined): number {
  const total = Number(proveedor?.cbm_total ?? 0)
  const imo = Number(proveedor?.cbm_imo ?? 0)
  const normal = Number.isFinite(total) ? total : 0
  const imoVal = Number.isFinite(imo) ? imo : 0
  return normal + imoVal
}

/** Parte el CBM total mostrado para guardar solo el volumen no IMO. */
export function cbmNormalDesdeTotal(
  full: number | string | null | undefined,
  imo: number | string | null | undefined
): number {
  const fullNum = Number(full) || 0
  const imoNum = Number(imo) || 0
  return Math.max(0, fullNum - imoNum)
}
