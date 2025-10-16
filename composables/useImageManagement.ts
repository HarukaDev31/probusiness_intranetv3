import { ref } from 'vue'

// Interface para imágenes existentes
interface ExistingImage {
  id: number
  id_regulacion: number
  extension: string
  peso: number
  nombre_original: string
  ruta: string
  created_at: string
  updated_at: string
}

// Interface para slots de imágenes nuevas
interface ImageSlot {
  file: File | null
  preview: string | null
}

export function useImageManagement() {
  // Existing images and deletion tracking
  const existingImages = ref<ExistingImage[]>([])
  const imagesToDelete = ref<number[]>([])
  const imagesToDeleteBackend = ref<number[]>([])

  // Image slots for new images
  const imageSlots = ref<ImageSlot[]>([
    { file: null, preview: null }
  ])

  const getImageUrl = (ruta: string) => {
    const config = useRuntimeConfig()
    return `${config.public.apiBaseUrl}/storage/${ruta}`
}

  const toggleImageDelete = (imageId: number) => {
    const index = imagesToDelete.value.indexOf(imageId)
    if (index > -1) {
      imagesToDelete.value.splice(index, 1)
      // También remover del array del backend
      const backendIndex = imagesToDeleteBackend.value.indexOf(imageId)
      if (backendIndex > -1) {
        imagesToDeleteBackend.value.splice(backendIndex, 1)
      }
    } else {
      imagesToDelete.value.push(imageId)
      // También agregar al array del backend
      imagesToDeleteBackend.value.push(imageId)
    }
    
  }

  const deleteSelectedImages = () => {
    if (imagesToDelete.value.length === 0) {
      return
    }
    
    // Eliminar las imágenes seleccionadas de la lista visual
    existingImages.value = existingImages.value.filter(img => !imagesToDelete.value.includes(img.id))
    // Limpiar la selección visual
    imagesToDelete.value = []
    // Mantener las imágenes marcadas para el backend
    
  }

  const deselectAllImages = () => {
    imagesToDelete.value = []
    imagesToDeleteBackend.value = []
  }

  const addImageSlot = () => {
    // Limpiar slots vacíos antes de agregar uno nuevo
    imageSlots.value = imageSlots.value.filter(slot => slot.file !== null)
    imageSlots.value.push({ file: null, preview: null })
  }

  const selectImage = (index: number) => {
    // Crear un input file oculto
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files[0]) {
        const file = target.files[0]
        const reader = new FileReader()
        
        reader.onload = (e) => {
          imageSlots.value[index] = {
            file: file,
            preview: e.target?.result as string
          }
          
          // Limpiar slots vacíos después de seleccionar
          setTimeout(() => {
            imageSlots.value = imageSlots.value.filter(slot => slot.file !== null || slot === imageSlots.value[index])
          }, 100)
        }
        
        reader.readAsDataURL(file)
      }
    }
    
    input.click()
  }

  const removeImageSlot = (index: number) => {
    imageSlots.value.splice(index, 1)
    
    // Asegurar que siempre haya al menos un slot vacío
    if (imageSlots.value.length === 0 || imageSlots.value.every(slot => slot.file !== null)) {
      imageSlots.value.push({ file: null, preview: null })
    }
  }

  const setExistingImages = (images: ExistingImage[]) => {
    existingImages.value = images
    imagesToDelete.value = []
    imagesToDeleteBackend.value = []
  }

  return {
    existingImages,
    imagesToDelete,
    imagesToDeleteBackend,
    imageSlots,
    getImageUrl,
    toggleImageDelete,
    deleteSelectedImages,
    deselectAllImages,
    addImageSlot,
    selectImage,
    removeImageSlot,
    setExistingImages
  }
} 