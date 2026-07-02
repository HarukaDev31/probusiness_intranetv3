import { ensurePromiseWithResolversPolyfill } from '~/utils/promiseWithResolversPolyfill'

export default defineNuxtPlugin(() => {
  ensurePromiseWithResolversPolyfill()
})
