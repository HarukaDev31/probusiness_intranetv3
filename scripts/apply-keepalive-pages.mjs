/**
 * Añade keepalive a listados frecuentes (fusiona con definePageMeta existente si hay).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const targets = [
  { file: 'pages/cargaconsolidada/abiertos/index.vue', name: 'cargaconsolidada-abiertos' },
  { file: 'pages/cargaconsolidada/completados/index.vue', name: 'cargaconsolidada-completados' },
  { file: 'pages/cargaconsolidada/coordinacion/abiertos/index.vue', name: 'cargaconsolidada-coordinacion-abiertos' },
  { file: 'pages/cargaconsolidada/coordinacion/completados/index.vue', name: 'cargaconsolidada-coordinacion-completados' },
  { file: 'pages/cargaconsolidada/documentacion/abiertos/index.vue', name: 'cargaconsolidada-documentacion-abiertos' },
  { file: 'pages/cargaconsolidada/documentacion/completados/index.vue', name: 'cargaconsolidada-documentacion-completados' },
  { file: 'pages/viaticos/pendientes.vue', name: 'viaticos-pendientes' },
  { file: 'pages/viaticos/completados.vue', name: 'viaticos-completados' },
  { file: 'pages/copiloto/index.vue', name: 'copiloto-index', layout: 'default', key: 'copiloto-advisor' },
  { file: 'pages/copiloto/equipo/index.vue', name: 'copiloto-equipo-index', layout: 'default', key: 'copiloto-equipo' },
]

for (const target of targets) {
  const full = path.join(root, target.file)
  if (!fs.existsSync(full)) continue

  let content = fs.readFileSync(full, 'utf8')
  if (content.includes('keepalive: true')) continue

  const extra = [
    target.layout ? `layout: '${target.layout}'` : null,
    target.key ? `key: '${target.key}'` : null,
    `name: '${target.name}'`,
    'keepalive: true',
  ].filter(Boolean).join(', ')

  if (/definePageMeta\s*\(\s*\{[\s\S]*?\}\s*\)/.test(content)) {
    content = content.replace(
      /definePageMeta\s*\(\s*\{([\s\S]*?)\}\s*\)/,
      (_, inner) => `definePageMeta({${inner.trim().replace(/,\s*$/, '')}, ${extra} })`,
    )
  } else if (content.includes('<script setup')) {
    content = content.replace(
      /<script setup lang="ts">\s*\n/,
      `<script setup lang="ts">\ndefinePageMeta({ ${extra} })\n\n`,
    )
  }

  fs.writeFileSync(full, content, 'utf8')
  console.log('keepalive:', target.file)
}

console.log('Done.')
