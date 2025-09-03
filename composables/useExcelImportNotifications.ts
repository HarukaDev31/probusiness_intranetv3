import { useNotifications } from './useNotifications'

export const useExcelImportNotifications = () => {
  const { showSuccess, showError } = useNotifications()

  const handleImportExcelCompleted = (data: any) => {
    console.log('📊 Importación Excel completada:', data)
    
    // Mostrar notificación de éxito
    showSuccess({
      title: 'Importación Completada',
      subtitle: 'Archivo Excel procesado',
      message: data.message || 'La importación se ha completado exitosamente.',
      autoClose: true,
      duration: 5000
    })

    // Aquí puedes agregar lógica adicional como:
    // - Recargar datos de la página actual
    // - Actualizar contadores
    // - Mostrar estadísticas
    if (data.estadisticas) {
      console.log('📈 Estadísticas de importación:', data.estadisticas)
    }
  }

  const handleImportExcelError = (data: any) => {
    console.error('❌ Error en importación Excel:', data)
    
    showError({
      title: 'Error de Importación',
      subtitle: 'Problema al procesar archivo',
      message: data.message || 'Ha ocurrido un error durante la importación del archivo Excel.',
      showRetryButton: true
    })
  }

  const handleImportExcelProgress = (data: any) => {
    console.log('⏳ Progreso de importación:', data)
    // Aquí puedes mostrar un progreso en tiempo real
  }

  return {
    handleImportExcelCompleted,
    handleImportExcelError,
    handleImportExcelProgress
  }
}
