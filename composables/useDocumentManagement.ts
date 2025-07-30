import { ref } from 'vue'

// Interface para slots de documentos nuevos
interface DocumentSlot {
  file: File | null
  preview: string | null
}

export function useDocumentManagement() {
  // Document slots for new documents
  const documentSlots = ref<DocumentSlot[]>([
    { file: null, preview: null }
  ])

  const addDocumentSlot = () => {
    // Limpiar slots vacíos antes de agregar uno nuevo
    documentSlots.value = documentSlots.value.filter(slot => slot.file !== null)
    documentSlots.value.push({ file: null, preview: null })
  }

  const selectDocument = (index: number) => {
    // Crear un input file oculto
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx'
    
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files[0]) {
        const file = target.files[0]
        const reader = new FileReader()
        
        reader.onload = (e) => {
          documentSlots.value[index] = {
            file: file,
            preview: e.target?.result as string
          }
          
          // Limpiar slots vacíos después de seleccionar
          setTimeout(() => {
            documentSlots.value = documentSlots.value.filter(slot => slot.file !== null || slot === documentSlots.value[index])
          }, 100)
        }
        
        reader.readAsDataURL(file)
      }
    }
    
    input.click()
  }

  const removeDocumentSlot = (index: number) => {
    documentSlots.value.splice(index, 1)
    
    // Asegurar que siempre haya al menos un slot vacío
    if (documentSlots.value.length === 0 || documentSlots.value.every(slot => slot.file !== null)) {
      documentSlots.value.push({ file: null, preview: null })
    }
  }

  return {
    documentSlots,
    addDocumentSlot,
    selectDocument,
    removeDocumentSlot
  }
} 