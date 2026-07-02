import { defineAsyncComponent, type Component } from 'vue'
import ViewLoadingShell from '~/components/ViewLoadingShell.vue'

type ViewModule = { default: Component }

/**
 * Carga diferida de vistas pesadas (*View) con skeleton mientras descarga el chunk.
 */
export function createLazyView(loader: () => Promise<ViewModule>) {
  return defineAsyncComponent({
    loader,
    loadingComponent: ViewLoadingShell,
    delay: 80,
    timeout: 120_000,
  })
}
