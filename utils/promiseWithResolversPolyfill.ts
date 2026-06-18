/** Safari / iOS < 17.4 y otros entornos sin Promise.withResolvers (pdf.js 4+). */
export function ensurePromiseWithResolversPolyfill(): void {
  if (typeof Promise === 'undefined') return

  const P = Promise as PromiseConstructor & {
    withResolvers?: <T>() => {
      promise: Promise<T>
      resolve: (value: T | PromiseLike<T>) => void
      reject: (reason?: unknown) => void
    }
  }

  if (typeof P.withResolvers === 'function') return

  P.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}
