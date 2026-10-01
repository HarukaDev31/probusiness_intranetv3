import { useOverlay } from '#imports'
import ActivityModal from '~/components/calendar/ActivityModal.vue'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import type { CalendarActivityCatalogItem, CalendarEvent, CreateCalendarEventRequest, IsoDate } from '~/types/calendar'

interface OpenActivityModalOptions {
  /** Actividad a editar; sin ella el modal crea una nueva. */
  event?: CalendarEvent | null
  /** Fecha inicial al crear (ej. el día clicado en el calendario). */
  initialDate?: IsoDate
}

/**
 * Abre el modal de crear/editar actividad con todo el flujo (guardar, borrar, catálogo).
 * afterChange se ejecuta tras crear, editar o eliminar para que la vista recargue su lista.
 */
export const useActivityModal = (afterChange: () => Promise<void>) => {
  const store = useCalendarStore()
  const { showSuccess, showError, showConfirmation } = useModal()
  const modal = useOverlay().create(ActivityModal)
  let openKey = 0

  const confirmDelete = (event: CalendarEvent) => {
    showConfirmation(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar la actividad "${event.name}"?`,
      async () => {
        if (await store.deleteActivity(event.id)) {
          showSuccess('Actividad eliminada', 'La actividad se ha eliminado correctamente.')
          await afterChange()
        } else {
          showError('Error', store.error.value ?? 'No se pudo eliminar la actividad.')
        }
      }
    )
  }

  const save = async (event: CalendarEvent | null, data: CreateCalendarEventRequest): Promise<boolean> => {
    const result = event
      ? await store.updateActivity({ ...data, id: event.id })
      : await store.createActivity(data)
    if (!result) {
      showError('Error', store.error.value ?? 'No se pudo guardar la actividad.')
      return false
    }
    showSuccess(
      event ? 'Actividad actualizada' : 'Actividad creada',
      event ? 'La actividad se ha actualizado correctamente.' : 'La actividad se ha creado correctamente.'
    )
    modal.close()
    await afterChange()
    return true
  }

  const createInCatalog = async (name: string): Promise<CalendarActivityCatalogItem | null> => {
    const created = await store.createActivityInCatalog(name)
    if (created) showSuccess('Catálogo', `Actividad "${name}" agregada al catálogo`)
    else showError('Error', store.error.value ?? 'No se pudo crear la actividad en el catálogo')
    return created
  }

  const deleteFromCatalog = async (catalogId: number) => {
    if (await store.deleteActivityFromCatalog(catalogId)) {
      showSuccess('Eliminada del catálogo', 'Los eventos ya creados con esta actividad no se modifican.')
      modal.patch({ actividadesPredefinidas: store.activityCatalog.value })
    } else {
      showError('Error', 'No se pudo eliminar del catálogo (puede estar en uso en algún evento).')
    }
  }

  const open = ({ event = null, initialDate }: OpenActivityModalOptions = {}) => {
    openKey++
    modal.open({
      openKey,
      event,
      initialDate,
      responsables: store.responsables.value,
      contenedores: store.contenedores.value,
      calendarPermissions: store.calendarPermissions.value,
      getResponsableColor: store.getResponsableColor,
      usaConsolidado: store.usaConsolidado.value,
      actividadesPredefinidas: store.activityCatalog.value,
      onSave: (data: CreateCalendarEventRequest) => save(event, data),
      onDelete: event
        ? () => {
            modal.close()
            confirmDelete(event)
          }
        : undefined,
      onCreateActivity: createInCatalog,
      onUpdateActivity: (id: number, name: string) => store.updateActivityInCatalog(id, name),
      onDeleteFromCatalog: deleteFromCatalog,
      onClose: () => modal.close()
    })
  }

  return { open, confirmDelete }
}
