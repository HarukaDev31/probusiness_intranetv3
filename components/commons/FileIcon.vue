<template>
   
    <UIcon :name="getFileIcon(file)" class="text-2xl text-gray-500" />
</template>

<script setup lang="ts">
import { FILE_ICONS_MAP } from '../../constants/file'
import { UIcon } from '#components'
import type { FileItem } from '../../types/commons/file'

const props = defineProps<{
    file: FileItem | File
}>()
const getFileIcon = (file: FileItem | File) => {
    if (file instanceof File) {
        const extension = file.name.split('.').pop()?.toLowerCase()
        return FILE_ICONS_MAP[extension as keyof typeof FILE_ICONS_MAP] || 'i-heroicons-document-text'
    }
    if ('file_ext' in file) {
        const extension = file.file_name?.split('.').pop()?.toLowerCase()
        const extension2 = file.file_ext?.split('.').pop()?.toLowerCase()
        return FILE_ICONS_MAP[extension as keyof typeof FILE_ICONS_MAP] || FILE_ICONS_MAP[extension2 as keyof typeof FILE_ICONS_MAP] || 'i-heroicons-document-text'
    }
    return 'i-heroicons-document-text'
}
</script>  