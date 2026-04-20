<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <UButton icon="i-heroicons-arrow-left" color="neutral" variant="outline" label="Regresar" @click="goBack" />
        <h1 class="text-lg font-semibold">Importar Datos de Facturacion</h1>
        <UBadge
          v-if="realtimeStatus"
          :color="realtimeStatus === 'COMPLETADO' ? 'success' : 'error'"
          variant="soft"
          size="sm"
        >
          {{ realtimeStatus === 'COMPLETADO' ? 'Importacion finalizada en tiempo real' : 'Importacion finalizada con errores' }}
        </UBadge>
      </div>

      <UButton icon="i-heroicons-arrow-up-tray" color="primary" label="Importar Excel" @click="openUploadModal" />
    </div>

    <UCard>
      <div class="text-sm text-gray-600 dark:text-gray-300 space-y-2">
        <p>Sube un Excel para crear registros en historial de facturacion.</p>
        <p class="font-medium">Columnas esperadas: <span class="font-normal">nombre, celular, dni, correo/Column3, documento, titular, domicilio_fiscal, destino_entrega.</span></p>
        <p class="text-xs">La vinculacion con usuario se hace por correo, celular y documento usando reglas del sistema.</p>
      </div>
    </UCard>

    <UCard>
      <UTable :data="imports" :columns="columns" :loading="loading" class="w-full">
        <template #empty-state>
          <div class="py-8 text-center text-sm text-gray-500">No hay importaciones registradas.</div>
        </template>
      </UTable>
    </UCard>

  </div>
</template>

<script setup lang="ts">
import { h, onMounted, onUnmounted, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import SimpleUploadFile from '~/components/commons/SimpleUploadFile.vue'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { useUsuarioDatosFacturacionImport } from '~/composables/basedatos/useUsuarioDatosFacturacionImport'
import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'

const UButton = resolveComponent('UButton')

const { withSpinner } = useSpinner()
const { showSuccess, showError, showConfirmation } = useModal()
const overlay = useOverlay()
const simpleUploadFileModal = overlay.create(SimpleUploadFile)
const { currentRole } = useUserRole()
const realtimeStatus = ref<string | null>(null)

const {
  loading,
  imports,
  loadImports,
  uploadExcel,
  rollbackImport,
} = useUsuarioDatosFacturacionImport()

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'nombre_archivo',
    header: 'Archivo',
    cell: ({ row }) => row.getValue('nombre_archivo')
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    cell: ({ row }) => {
      const raw = row.getValue('created_at') as string
      return raw ? new Date(raw).toLocaleString('es-PE') : '-'
    }
  },
  {
    accessorKey: 'cantidad_rows',
    header: 'Filas Creadas',
    cell: ({ row }) => row.getValue('cantidad_rows') ?? 0
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => row.getValue('estado')
  },
  {
    accessorKey: 'accion',
    header: 'Accion',
    cell: ({ row }) => {
      const estado = row.original?.estado
      return h(UButton as any, {
        size: 'xs',
        color: 'error',
        variant: 'ghost',
        icon: 'i-heroicons-arrow-uturn-left',
        disabled: estado === 'ROLLBACK',
        onClick: () => {
          if (row.original?.id) {
            confirmRollback(row.original.id)
          }
        }
      }, () => 'Rollback')
    }
  }
]

const goBack = () => {
  navigateTo('/basedatos/clientes')
}

const validateUploadFile = (file: File) => {
  const allowed = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'text/csv'
  ]

  if (!allowed.includes(file.type)) {
    return 'Archivo no permitido. Usa Excel o CSV.'
  }

  return null
}

const openUploadModal = () => {
  simpleUploadFileModal.open({
    title: 'Subir Excel de Facturacion',
    onClose: () => simpleUploadFileModal.close(),
    onSave: async (data: { file: File }) => {
      const validationError = validateUploadFile(data.file)
      if (validationError) {
        showError('Archivo no permitido', validationError)
        return
      }

      await withSpinner(async () => {
        const result = await uploadExcel(data.file)
        if (result.success) {
          showSuccess('Importacion completada', result.message || 'Se importo el archivo correctamente.')
          return
        }

        showError('Error de importacion', result.error || 'No se pudo procesar el archivo.')
      }, 'Procesando importacion...')
    }
  })
}

const confirmRollback = async (idImport: number) => {
  showConfirmation(
    'Confirmar rollback',
    'Se eliminaran los registros de facturacion creados por este Excel. Esta accion no se puede deshacer. Deseas continuar?',
    async () => {
      await withSpinner(async () => {
        const result = await rollbackImport(idImport)
        if (result.success) {
          showSuccess('Rollback ejecutado', result.message || 'La importacion fue revertida correctamente.')
          return
        }

        showError('Error de rollback', result.error || 'No se pudo revertir la importacion.')
      }, 'Ejecutando rollback...')
    }
  )
}

const onRealtimeImportFinished = async (event: Event) => {
  if (currentRole.value !== ROLES.CONTABILIDAD) {
    return
  }

  const customEvent = event as CustomEvent<any>
  const status = String(customEvent?.detail?.status || '').toUpperCase()
  if (!status) {
    return
  }

  realtimeStatus.value = status
  await loadImports()
}

onMounted(async () => {
  await loadImports()

  if (process.client) {
    window.addEventListener('udf-import-finished', onRealtimeImportFinished as EventListener)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('udf-import-finished', onRealtimeImportFinished as EventListener)
  }
})
</script>
