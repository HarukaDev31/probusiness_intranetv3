export const SOPORTE_TI_IMAGEN_COLORES = [
  '#6b7280',
  '#d1d5db',
  '#ffffff',
  '#22d3ee',
  '#22c55e',
  '#a855f7',
  '#f97316',
  '#ef4444'
] as const

export const SOPORTE_TI_IMAGEN_GROSORES = [3, 6, 10, 16] as const

export function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

export function canvasAArchivo(
  canvas: HTMLCanvasElement,
  nombre: string,
  tipo = 'image/jpeg',
  calidad = 0.92
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo exportar la imagen'))
          return
        }
        const base = nombre.replace(/\.[^.]+$/, '') || 'imagen'
        resolve(new File([blob], `${base}.jpg`, { type: tipo, lastModified: Date.now() }))
      },
      tipo,
      calidad
    )
  })
}

/** Combina imagen base (con rotación) y capa de trazos en un canvas de salida. */
export async function combinarImagenConTrazos(opts: {
  src: string
  rotacion: number
  trazoCanvas: HTMLCanvasElement | null
}): Promise<HTMLCanvasElement> {
  const img = await cargarImagen(opts.src)
  const rad = (opts.rotacion * Math.PI) / 180
  const swap = opts.rotacion % 180 !== 0
  const w = swap ? img.naturalHeight : img.naturalWidth
  const h = swap ? img.naturalWidth : img.naturalHeight

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')

  ctx.translate(w / 2, h / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)

  if (opts.trazoCanvas && opts.trazoCanvas.width > 0 && opts.escalaTrazo > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(
      opts.trazoCanvas,
      0,
      0,
      opts.trazoCanvas.width,
      opts.trazoCanvas.height,
      0,
      0,
      w,
      h
    )
  }

  return out
}
