import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const source = join(root, '.output', 'public')
const target = join(root, 'dist')

if (!existsSync(source)) {
  console.error('[copy-netlify-dist] No existe .output/public. Ejecuta nuxt build primero.')
  process.exit(1)
}

if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true })
}

mkdirSync(target, { recursive: true })
cpSync(source, target, { recursive: true })

if (!existsSync(join(target, 'index.html'))) {
  console.error('[copy-netlify-dist] Falta dist/index.html tras el build.')
  process.exit(1)
}

console.log('[copy-netlify-dist] Copiado .output/public → dist')
