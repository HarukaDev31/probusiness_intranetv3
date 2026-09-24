import { defineAsyncComponent, h, type Component } from 'vue'
import ViewLoadingShell from '~/components/ViewLoadingShell.vue'

type ViewModule = { default: Component }

const ViewLoadError = {
  name: 'ViewLoadError',
  setup() {
    return () =>
      h('div', { class: 'flex min-h-[40vh] flex-col items-center justify-center gap-2 p-8 text-center' }, [
        h('p', { class: 'text-sm text-gray-600 dark:text-gray-300' }, 'No se pudo cargar la vista.'),
        h(
          'button',
          {
            type: 'button',
            class: 'text-sm font-medium text-primary-600 hover:underline',
            onClick: () => {
              if (process.client) window.location.reload()
            },
          },
          'Recargar'
        ),
      ])
  },
}

/**
 * Carga diferida de vistas pesadas (*View) con skeleton mientras descarga el chunk.
 * No usar como raíz de páginas con keepalive: si navegas antes de resolver, KeepAlive puede congelar en blanco.
 */
export function createLazyView(loader: () => Promise<ViewModule>) {
  return defineAsyncComponent({
    loader,
    loadingComponent: ViewLoadingShell,
    errorComponent: ViewLoadError,
    delay: 80,
    timeout: 120_000,
  })
}
