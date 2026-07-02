/**
 * Convierte imports estáticos de *View en lazy load (sin Suspense en template:
 * createLazyView ya muestra ViewLoadingShell mientras carga el chunk).
 * Uso: node scripts/apply-lazy-views.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const pagesDir = path.join(root, 'pages')

const VIEW_IMPORT_RE = /^import (\w+) from '(~\/components\/[^']+\.vue)'\s*$/m

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.vue')) files.push(full)
  }
  return files
}

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  if (content.includes('createLazyView')) return false

  const match = content.match(VIEW_IMPORT_RE)
  if (!match) return false

  const [, componentName, importPath] = match

  content = content.replace(
    VIEW_IMPORT_RE,
    `import { createLazyView } from '~/utils/lazyView'\n\nconst ${componentName} = createLazyView(() => import('${importPath}'))`,
  )

  fs.writeFileSync(filePath, content, 'utf8')
  return true
}

let updated = 0
for (const file of walk(pagesDir)) {
  if (transformFile(file)) {
    updated++
    console.log('updated:', path.relative(root, file))
  }
}
console.log(`Done. ${updated} files updated.`)
