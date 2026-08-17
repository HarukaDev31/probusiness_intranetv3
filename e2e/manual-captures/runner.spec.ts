import { expect, test, type Page } from '@playwright/test'
import { runActions } from './actions'
import { inferCaptureType, inferIntent } from './intent'
import { normalizeManifest } from './manifest'
import { detectPii } from './pii'
import { assertCaptureSize } from './quality'

test.describe('runner de capturas', () => {
  test('detecta PII básica sin exponerla', () => {
    const matches = detectPii('Contacto demo@empresa.pe, DNI 12345678, móvil 987 654 321')
    expect(matches.map(match => match.type)).toEqual(['email', 'telefono', 'dni'])
    expect(matches.every(match => !match.masked.includes('12345678'))).toBeTruthy()
  })

  test('respeta excepciones explícitas de PII', () => {
    expect(detectPii('demo@empresa.pe', ['demo@empresa.pe'])).toEqual([])
  })

  test('convierte el manifiesto plano canónico', () => {
    const manifest = normalizeManifest({
      schema_version: 1,
      screens: { 'pedidos/detalle': { url: '/pedidos/42' } },
      captures: [{
        capture_key: 'comercial__pedidos__editar',
        roles: ['comercial'],
        screen: 'pedidos/detalle',
        modulo: 'pedidos',
        flow: 'Editar pedido',
        step: { number: 2, title: 'Editar con el lápiz' },
        hint: 'Abre el modal de edición.',
        output: 'comercial__pedidos__editar.png',
      }],
    })

    const screen = manifest.roles[0].screens[0]
    const shot = screen.shots[0]
    expect(screen.url).toBe('/pedidos/42')
    expect(screen.sourceId).toBe('pedidos/detalle')
    expect(shot.id).toBe('comercial__pedidos__editar')
    expect(shot.type).toBe('modal')
    expect(shot.intent?.title).toBe('Editar con el lápiz')
    expect(shot.output).toBe('comercial__pedidos__editar.png')
  })

  test('prioriza URL de captura e infiere intenciones conservadoras', () => {
    const manifest = normalizeManifest({
      schema_version: 1,
      screens: { listado: '/ruta-base' },
      captures: [{
        capture_key: 'rol__listado__filtros',
        roles: ['rol'],
        screen: 'listado',
        step: { title: 'Usar filtros' },
        hint: 'Sección de búsqueda',
        url: '/ruta-especifica',
        output: 'rol__listado__filtros.png',
      }],
    })
    expect(manifest.roles[0].screens[0].url).toBe('/ruta-especifica')
    expect(inferIntent('Nuevo cliente', '')).toBe('create')
    expect(inferIntent('Editar', 'Usa el lápiz')).toBe('edit')
    expect(inferIntent('Abrir ficha', 'Pantalla destino')).toBe('view')
    expect(inferCaptureType('Filtros', '')).toBe('seccion')
    expect(inferCaptureType('Crear viático', 'Recorta el formulario de alta')).toBe('modal')
    expect(inferCaptureType('Tarjetas y detalle', 'Recorta una tarjeta de noticia')).toBe('seccion')
  })

  test('aplica overrides por capture_key en el manifiesto anidado', () => {
    const manifest = normalizeManifest({
      version: 1,
      roles: [{
        slug: 'asistente-comercial',
        screens: [{
          id: 'news',
          url: '/news',
          shots: [{
            id: 'news__leer-avisos__paso-01-tarjetas-y-detalle',
            type: 'page',
            intent: { title: 'Tarjetas y detalle', hint: 'Recorta una tarjeta' },
          }],
        }],
      }],
    })
    const shot = manifest.roles[0].screens[0].shots[0]
    expect(shot.type).toBe('seccion')
    expect(shot.target).toEqual({ css: '[data-manual-capture="news-card"]' })
  })

  test('rechaza recortes diminutos y admite secciones amplias', () => {
    expect(() => assertCaptureSize(
      { id: 'news-card', type: 'seccion' },
      { width: 182, height: 75 },
    )).toThrow(/recorte/i)
    expect(() => assertCaptureSize(
      { id: 'ok-section', type: 'seccion', minWidth: 480, minHeight: 180 },
      { width: 640, height: 280 },
    )).not.toThrow()
  })

  test('rechaza entradas canónicas sin URL resoluble', () => {
    expect(() => normalizeManifest({
      schema_version: 1,
      captures: [{
        capture_key: 'rol__pantalla__accion',
        roles: ['rol'],
        screen: 'pantalla',
        step: { title: 'Guardar' },
        output: 'rol__pantalla__accion.png',
      }],
    })).toThrow(/url o screen URL/i)
  })

  test('ejecuta click, fill, select, goto y wait declarativos', async () => {
    const calls: string[] = []
    const locator = {
      click: async () => { calls.push('click') },
      fill: async (value: string) => { calls.push(`fill:${value}`) },
      selectOption: async (value: string | string[]) => { calls.push(`select:${String(value)}`) },
      waitFor: async ({ state }: { state: string }) => { calls.push(`wait:${state}`) },
    }
    const page = {
      locator: () => locator,
      getByTestId: () => locator,
      getByRole: () => locator,
      getByText: () => locator,
      goto: async (url: string) => { calls.push(`goto:${url}`) },
      waitForTimeout: async (ms: number) => { calls.push(`sleep:${ms}`) },
    } as unknown as Page

    await runActions(page, [
      { type: 'fill', target: '#nombre', value: 'Ejemplo' },
      { type: 'select', target: '#estado', value: 'ok' },
      { type: 'click', target: '#abrir' },
      { type: 'goto', url: '/destino' },
      { type: 'wait', ms: 50 },
      { type: 'wait', target: '#resultado', state: 'visible' },
    ])

    expect(calls).toEqual([
      'fill:Ejemplo',
      'select:ok',
      'click',
      'goto:/destino',
      'sleep:50',
      'wait:visible',
    ])
  })
})
