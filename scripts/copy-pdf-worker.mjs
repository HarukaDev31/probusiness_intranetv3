import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '..', '..')
const source = join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.js')
const publicDir = join(root, 'public')
const target = join(publicDir, 'pdf.worker.legacy.min.js')

if (!existsSync(source)) {
  console.warn('[copy-pdf-worker] pdfjs-dist worker no encontrado, omitiendo copia')
  process.exit(0)
}

mkdirSync(publicDir, { recursive: true })
copyFileSync(source, target)
console.log('[copy-pdf-worker] Copiado a public/pdf.worker.legacy.min.js')
