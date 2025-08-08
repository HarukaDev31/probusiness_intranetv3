<template>
    <div>
        <!-- Image preview cards -->
        <div v-if="images && images.length > 0" class="flex gap-2 overflow-x-auto">
            <div 
                v-for="(image, index) in images" 
                :key="index"
                class="relative group cursor-pointer flex-shrink-0"
                @click="openImageModal(image)"
                @keydown.esc="closeModal"
            >
                <img 
                    :src="getImageUrl(image)" 
                    :alt="`Imagen ${index + 1}`"
                    class="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700 hover:border-green-500 transition-colors"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                    <UIcon 
                        name="i-heroicons-magnifying-glass-plus" 
                        class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            </div>
        </div>
        
        <!-- No images message -->
        <span v-else class="text-gray-500 dark:text-gray-400 text-sm">
            Sin imágenes
        </span>

        <!-- Image Modal -->
        <ImageModal 
            :is-open="showModal"
            :image-url="selectedImage"
            :alt-text="altText"
            @close="closeModal"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
    images: string[]
    altText?: string
}

const props = withDefaults(defineProps<Props>(), {
    altText: 'Vista previa de imagen'
})

// Modal state
const showModal = ref(false)
const selectedImage = ref('')

// Methods
const getImageUrl = (ruta: string) => {
    console.log(ruta)
    return `${ruta}`
}

const openImageModal = (imageUrl: string) => {
    selectedImage.value = getImageUrl(imageUrl)
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    selectedImage.value = ''
}
</script> 