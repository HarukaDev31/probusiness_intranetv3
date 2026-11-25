import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'

/** Spinner + modal de éxito o error para las acciones del Encargado China. Devuelve si salió bien. */
export function useChinaAction(title: string) {
  const { withSpinner } = useSpinner()
  const { showError, showSuccess } = useModal()

  async function run(action: () => Promise<unknown>, success = '', message = 'Guardando…'): Promise<boolean> {
    try {
      await withSpinner(async () => { await action() }, message)
      if (success) showSuccess(title, success)
      return true
    } catch (error: unknown) {
      showError(title, error instanceof Error ? error.message : 'Ocurrió un error.')
      return false
    }
  }

  return { run }
}
