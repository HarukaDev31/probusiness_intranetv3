/**
 * Duplica páginas de cargaconsolidada/abiertos y completados
 * en coordinacion y documentacion (misma estructura, rutas reemplazadas).
 */
const fs = require('fs')
const path = require('path')

const BASE = 'pages/cargaconsolidada'

const ABIRTOS_PATHS = [
  'factura-guia/[id].vue',
  'clientes/[id].vue',
  'clientes/documentacion/[id].vue',
  'entrega/[id].vue',
  'entrega/clientes/[id].vue',
  'cotizaciones/[id].vue',
  'cotizaciones/documentacion/[id].vue',
  'cotizaciones/proveedor/documentacion/[id].vue',
]

const COMPLETADOS_PATHS = [
  'factura-guia/[id].vue',
  'clientes/[id].vue',
  'clientes/documentacion/[id].vue',
  'entrega/[id].vue',
  'entrega/clientes/[id].vue',
  'entrega/fechas-horarios/[id].vue',
  'entrega/firma-carga/[id].vue',
  'cotizaciones/[id].vue',
  'cotizaciones/documentacion/[id].vue',
  'cotizaciones/proveedor/documentacion/[id].vue',
  'cotizaciones/proveedor/documentacion-china/[id].vue',
]

function copyWithReplace(srcPath, destPath, fromStr, toStr) {
  const fullSrc = path.join(BASE, srcPath)
  const fullDest = path.join(BASE, destPath)
  if (!fs.existsSync(fullSrc)) {
    console.warn('Skip (not found):', fullSrc)
    return
  }
  const content = fs.readFileSync(fullSrc, 'utf8')
  const newContent = content.split(fromStr).join(toStr)
  fs.mkdirSync(path.dirname(fullDest), { recursive: true })
  fs.writeFileSync(fullDest, newContent)
  console.log('Created:', fullDest)
}

// Abiertos -> coordinacion/abiertos y documentacion/abiertos
for (const rel of ABIRTOS_PATHS) {
  const src = `abiertos/${rel}`
  copyWithReplace(src, `coordinacion/abiertos/${rel}`, '/cargaconsolidada/abiertos', '/cargaconsolidada/coordinacion/abiertos')
  copyWithReplace(src, `documentacion/abiertos/${rel}`, '/cargaconsolidada/abiertos', '/cargaconsolidada/documentacion/abiertos')
}

// Completados -> coordinacion/completados y documentacion/completados
for (const rel of COMPLETADOS_PATHS) {
  const src = `completados/${rel}`
  copyWithReplace(src, `coordinacion/completados/${rel}`, '/cargaconsolidada/completados', '/cargaconsolidada/coordinacion/completados')
  copyWithReplace(src, `documentacion/completados/${rel}`, '/cargaconsolidada/completados', '/cargaconsolidada/documentacion/completados')
}

console.log('Done.')
