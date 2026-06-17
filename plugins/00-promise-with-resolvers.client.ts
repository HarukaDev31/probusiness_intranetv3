/**
 * pdfjs-dist v5+ y otras libs usan Promise.withResolvers (ES2024).
 * Safari / WebViews antiguos no lo tienen → polyfill antes de cargar el PDF viewer.
 */
export default defineNuxtPlugin(() => {
  if (typeof Promise.withResolvers === 'function') return

  Promise.withResolvers = function withResolvers<T = unknown>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
})
