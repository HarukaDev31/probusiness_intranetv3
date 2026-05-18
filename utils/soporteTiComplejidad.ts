/** Complejidad persistida en API como `criticidad`. */
export const SOPORTE_TI_COMPLEJIDADES = ['Baja', 'Media', 'Alta', 'Máxima'] as const

export type SoporteTiComplejidad = (typeof SOPORTE_TI_COMPLEJIDADES)[number]

export function complejidadOk(valor: string | null | undefined): valor is SoporteTiComplejidad {
  return SOPORTE_TI_COMPLEJIDADES.includes(valor as SoporteTiComplejidad)
}
