<template>
    <div class="p-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center">
                <UIcon name="i-heroicons-shield-check" class="text-2xl mr-3 text-gray-700 dark:text-gray-300" />
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Regulaciones</h1>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
                Gestiona las regulaciones de antidumping, permisos, etiquetado y documentos especiales
            </p>
        </div>

        <!-- Navigation Tabs -->
        <UCard class="mb-6">
            <div class="flex flex-wrap gap-2">
                <UButton v-for="tab in tabs" :key="tab.id" :variant="activeTab === tab.id ? 'solid' : 'outline'"
                    :color="activeTab === tab.id ? 'primary' : 'neutral'" :icon="tab.icon" @click="activeTab = tab.id"
                    class="flex items-center gap-2">
                    {{ tab.label }}
                </UButton>
            </div>
        </UCard>

        <!-- Content Container -->
        <div class="space-y-6">
            <!-- Tab Antidumping -->
            <div v-if="activeTab === 'antidumping'">
                <div class="mb-4">
                    <UButton v-if="hasRole('Documentacion')" label="Crear Antidumping" icon="i-heroicons-plus"
                        color="primary" @click="navigateToCreate('antidumping')" />
                </div>
                <UCard>
                    <div class="flex items-center justify-between mb-4">

                        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportAntidumping"
                            :loading="loadingAntidumping">
                            Exportar
                        </UButton>
                    </div>

                    <UTable :data="antidumpingData" :columns="antidumpingColumns" :grouping="['nombre']"
                        :grouping-options="grouping_options" :loading="loadingAntidumping" :ui="{
                            root: 'min-w-full',
                            td: 'empty:p-0'
                        }" class="flex-1">
                        <template #title-cell="{ row }">
                            <div v-if="row.getIsGrouped()" class="flex items-center">
                                <span class="inline-block" :style="{ width: `calc(${row.depth} * 1rem)` }" />
                                <div class="flex items-center justify-between w-full">
                                    <strong>{{ row.original.nombre }}</strong>

                                    <div class="flex items-center gap-2">
                                        <UButton variant="outline" color="neutral" class="mr-2" size="xs"
                                            :icon="row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus'"
                                            @click="row.toggleExpanded()" />
                                        <!--Button to delete -->
                                        <UButton icon="i-heroicons-trash" variant="outline" color="red" size="xs"
                                            @click="deleteRubro(row.original.id)" />
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #expanded="{ row }">
                            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg m-2">


                                <UTable :data="row.original.regulaciones" :columns="[
                                    {
                                        accessorKey: 'id',
                                        header: 'ID',
                                        cell: ({ row }: { row: any }) => `#${row.index + 1}`
                                    },
                                    {
                                        accessorKey: 'descripcion',
                                        header: 'Descripción',
                                        cell: ({ row }: { row: any }) => {
                                            const descripcion = row.getValue('descripcion')
                                            if (!descripcion) return h('span', { class: 'text-gray-400 dark:text-gray-500' }, 'Sin descripción')

                                            // Dividir por saltos de línea HTML y normales
                                            const lines = descripcion.split(/<br\s*\/?>/i).flatMap((line: string) =>
                                                line.split('\n').filter((l: string) => l.trim())
                                            )

                                            return h('div', {
                                                class: 'max-w-xs text-wrap leading-relaxed',
                                                style: {
                                                    'white-space': 'pre-wrap',
                                                    'word-wrap': 'break-word'
                                                },
                                                title: descripcion.replace(/<br\s*\/?>/gi, '\n') // Tooltip con texto completo
                                            }, lines.map((line: string) =>
                                                h('div', {
                                                    class: 'text-sm text-gray-700 dark:text-gray-300 mb-1 last:mb-0'
                                                }, line.trim())
                                            ))
                                        }
                                    },
                                    {
                                        accessorKey: 'partida',
                                        header: 'Partida'
                                    },
                                    {
                                        accessorKey: 'precio_declarado',
                                        header: 'Precio Declarado',
                                        cell: ({ row }: { row: any }) => `$${row.getValue('precio_declarado')}`
                                    },
                                    {
                                        accessorKey: 'antidumping',
                                        header: 'Antidumping',
                                        cell: ({ row }: { row: any }) => `$${row.getValue('antidumping')}`
                                    },

                                    {
                                        id: 'actions',
                                        header: 'Acciones',
                                        cell: ({ row }: { row: any }) => h('div', { class: 'flex items-center gap-2' }, [
                                            h(UButton, {
                                                icon: 'i-heroicons-eye',
                                                variant: 'ghost',
                                                size: 'xs',
                                                color: 'blue',
                                                onClick: () => viewRegulationDetail(row.original.id),
                                                title: 'Ver detalle'
                                            }),
                                            ...(hasRole('Documentacion') ? [
                                                h(UButton, {
                                                    icon: 'i-heroicons-pencil-square',
                                                    variant: 'ghost',
                                                    size: 'xs',
                                                    color: 'green',
                                                    onClick: () => editRegulation(row.original.id),
                                                    title: 'Editar'
                                                })
                                            ] : []),
                                            ...(hasRole('Documentacion') ? [
                                                h(UButton, {
                                                    icon: 'i-heroicons-trash',
                                                    variant: 'ghost',
                                                    size: 'xs',
                                                    color: 'red',
                                                    onClick: () => deleteRegulation(row.original.id),
                                                    title: 'Eliminar'
                                                })
                                            ] : [])
                                        ])
                                    }
                                ]" :ui="{
                                    root: 'min-w-full',
                                    td: 'py-2 px-3'
                                }" />
                            </div>
                        </template>
                    </UTable>
                </UCard>
            </div>

            <!-- Tab Permisos -->
            <div v-if="activeTab === 'permisos'">
                <div class="mb-4">
                    <UButton v-if="hasRole('Documentacion')" label="Crear Permiso" icon="i-heroicons-plus"
                        color="primary" @click="navigateToCreate('permisos')" />
                </div>
                <UCard>
                    <div class="flex items-center justify-between mb-4">

                        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportPermisos"
                            :loading="loadingPermisos">
                            Exportar
                        </UButton>
                    </div>

                    <UTable :data="permisosData" :columns="permisosColumns" :grouping="['nombre']"
                        :grouping-options="grouping_options" :loading="loadingPermisos" :ui="{
                            root: 'min-w-full',
                            td: 'empty:p-0'
                        }" class="flex-1">
                        <template #title-cell="{ row }">
                            <div v-if="row.getIsGrouped()" class="flex items-center">
                                <span class="inline-block" :style="{ width: `calc(${row.depth} * 1rem)` }" />

                                <div class="flex items-center justify-between w-full">
                                    <strong>{{ row.original.nombre }}</strong>
                                    <div class="flex items-center gap-2">
                                        <UButton variant="outline" color="neutral" class="mr-2" size="xs"
                                            :icon="row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus'"
                                            @click="row.toggleExpanded()" />
                                        <!--Button to delete -->
                                        <UButton icon="i-heroicons-trash" variant="outline" color="red" size="xs"
                                            @click="deleteEntidad(row.original.id)" />
                                    </div>
                                </div>

                            </div>
                        </template>

                        <template #expanded="{ row }">
                            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg m-2">


                                <!-- Tabla de subitems para Permisos -->
                                <UTable :data="row.original.regulaciones" :columns="[
                                    {
                                        accessorKey: 'id',
                                        header: 'ID',
                                        cell: ({ row }: { row: any }) => `#${row.index + 1}`
                                    },
                                    {
                                        accessorKey: 'nombre',
                                        header: 'Nombre'
                                    },

                                    {
                                        accessorKey: 'c_permiso',
                                        header: 'C. Permiso',
                                        cell: ({ row }: { row: any }) => `S/.${row.getValue('c_permiso')}`
                                    },
                                    {
                                        accessorKey: 'c_tramitador',
                                        header: 'C. Tramitador',
                                        cell: ({ row }: { row: any }) => `S/.${row.getValue('c_tramitador')}`
                                    },

                                    {
                                        id: 'actions',
                                        header: 'Acciones',
                                        cell: ({ row }: { row: any }) => h('div', { class: 'flex items-center gap-2' }, [
                                            h(UButton, {
                                                icon: 'i-heroicons-eye',
                                                variant: 'ghost',
                                                size: 'xs',
                                                color: 'blue',
                                                onClick: () => viewPermisoDetail(row.original.id),
                                                title: 'Ver detalle'
                                            }),
                                            ...(hasRole('Documentacion') ? [
                                                h(UButton, {
                                                    icon: 'i-heroicons-pencil-square',
                                                    variant: 'ghost',
                                                    size: 'xs',
                                                    color: 'green',
                                                    onClick: () => editPermiso(row.original.id),
                                                    title: 'Editar'
                                                })
                                            ] : []),
                                            ...(hasRole('Documentacion') ? [
                                                h(UButton, {
                                                    icon: 'i-heroicons-trash',
                                                    variant: 'ghost',
                                                    size: 'xs',
                                                    color: 'red',
                                                    onClick: () => deletePermiso(row.original.id),
                                                    title: 'Eliminar'
                                                })
                                            ] : [])
                                        ])
                                    }
                                ]" :ui="{
                                    root: 'min-w-full',
                                    td: 'py-2 px-3'
                                }" />
                            </div>
                        </template>
                    </UTable>
                </UCard>
            </div>

            <!-- Tab Etiquetado -->
            <div v-if="activeTab === 'etiquetado'">
                <div class="mb-4">
                    <UButton v-if="hasRole('Documentacion')" label="Crear Etiquetado" icon="i-heroicons-plus"
                        color="primary" @click="navigateToCreate('etiquetado')" />
                </div>
                <UCard>
                    <div class="flex items-center justify-between mb-4">

                        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportEtiquetado"
                            :loading="loadingEtiquetado">
                            Exportar
                        </UButton>
                    </div>

                    <UTable :data="etiquetadoData" :columns="etiquetadoColumns" :grouping="['nombre']"
                        :grouping-options="grouping_options" :loading="loadingEtiquetado" :ui="{
                            root: 'min-w-full',
                            td: 'empty:p-0'
                        }" class="flex-1">
                        <template #title-cell="{ row }">
                            <div v-if="row.getIsGrouped()" class="flex items-center">
                                <span class="inline-block" :style="{ width: `calc(${row.depth} * 1rem)` }" />
                                <div class="flex items-center justify-between w-full">
                                    <strong>{{ row.original.nombre }}</strong>
                                    <div class="flex items-center gap-2">
                                        <UButton variant="outline" color="neutral" class="mr-2" size="xs"
                                            :icon="row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus'"
                                            @click="row.toggleExpanded()" />
                                        <!--Button to delete -->
                                        <UButton icon="i-heroicons-trash" variant="outline" color="red" size="xs"
                                            @click="deleteRubro(row.original.id)" />
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template #expanded="{ row }">
                            <UTable :data="row.original.regulaciones" :columns="[
                                {
                                    accessorKey: 'id',
                                    header: 'ID',
                                    cell: ({ row }: { row: any }) => `#${row.index + 1}`
                                },
                                {
                                    accessorKey: 'imagenes',
                                    header: 'Fotos',
                                    cell: ({ row }: { row: any }) => {
                                        const imagenes = row.getValue('imagenes')
                                        return h(ImagePreview, {
                                            images: imagenes || [],
                                            altText: 'Vista previa de imagen'
                                        })
                                    }
                                },
                                {
                                    accessorKey: 'observaciones',
                                    header: 'Descripciones minimas',
                                    cell: ({ row }: { row: any }) => {
                                        //foreach 30 word in a line
                                        const observaciones = row.getValue('observaciones')
                                        return h('div', {
                                            class: 'w-50 text-wrap',
                                            style: {
                                                'white-space': 'pre-wrap',
                                                'word-wrap': 'break-word'
                                            },
                                            title: observaciones // oltip con texto completo
                                        }, observaciones)
                                    }
                                },

                                {
                                    id: 'actions',
                                    header: 'Acciones',
                                    cell: ({ row }: { row: any }) => h('div', { class: 'flex items-center gap-2' }, [
                                        ...(hasRole('Documentacion') ? [
                                            h(UButton, {
                                                icon: 'i-heroicons-pencil-square',
                                                variant: 'ghost',
                                                size: 'xs',
                                                color: 'green',
                                                onClick: () => editEtiquetado(row.original.id),
                                                title: 'Editar'
                                            })
                                        ] : []),
                                        ...(hasRole('Documentacion') ? [
                                            h(UButton, {
                                                icon: 'i-heroicons-trash',
                                                variant: 'ghost',
                                                size: 'xs',
                                                color: 'red',
                                                onClick: () => deleteEtiquetado(row.original.id),
                                                title: 'Eliminar'
                                            })
                                        ] : [])
                                    ])
                                }
                            ]" :ui="{
                                root: 'min-w-full',
                                td: 'py-2 px-3'
                            }" />
                        </template>
                    </UTable>
                </UCard>
            </div>

            <!-- Tab Documentos Especiales -->
            <div v-if="activeTab === 'documentos'">
                <div class="mb-4">
                    <UButton v-if="hasRole('Documentacion')" label="Crear Documento Especial" icon="i-heroicons-plus"
                        color="primary" @click="navigateToCreate('documentos')" />
                </div>
                <UCard>
                    <div class="flex items-center justify-between mb-4">

                        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportDocumentos"
                            :loading="loadingDocumentos">
                            Exportar
                        </UButton>
                    </div>

                    <UTable :data="documentosData" :columns="documentosColumns" :grouping="['nombre']"
                        :grouping-options="grouping_options" :loading="loadingDocumentos" :ui="{
                            root: 'min-w-full',
                            td: 'empty:p-0'
                        }" class="flex-1">
                        <template #title-cell="{ row }">
                            <div v-if="row.getIsGrouped()" class="flex items-center">
                                <span class="inline-block" :style="{ width: `calc(${row.depth} * 1rem)` }" />

                                <div class="flex items-center justify-between w-full">
                                    <strong>{{ row.original.nombre }}</strong>
                                    <div class="flex items-center gap-2">
                                        <UButton variant="outline" color="neutral" class="mr-2" size="xs"
                                            :icon="row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus'"
                                            @click="row.toggleExpanded()" />
                                        <!--Button to delete -->
                                        <UButton icon="i-heroicons-trash" variant="outline" color="red" size="xs"
                                            @click="deleteRubro(row.original.id)" />
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template #expanded="{ row }">
                            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg m-2">


                                <!-- Tabla de subitems para Documentos Especiales -->
                                <UTable :data="row.original.regulaciones" :columns="[

                                    {
                                        accessorKey: 'observaciones',
                                        header: 'Comentarios',
                                        cell: ({ row }: { row: any }) => {
                                            const obs = row.getValue('observaciones')
                                            return obs ? obs : 'Sin observaciones'
                                        }
                                    },
                                    {
                                        accessorKey: 'documentos',
                                        header: 'Documentos a presentar',
                                        cell: ({ row }: { row: any }) => {
                                            const docs = row.getValue('documentos')
                                            const media = row.original.media
                                            return h(DocumentPreview, {
                                                documents: docs || [],
                                                media: media || []
                                            })
                                        }
                                    },

                                    {
                                        id: 'actions',
                                        header: 'Acciones',
                                        cell: ({ row }: { row: any }) => h('div', { class: 'flex items-center gap-2' }, [
                                            ...(hasRole('Documentacion') ? [
                                                h(UButton, {
                                                    icon: 'i-heroicons-pencil-square',
                                                    variant: 'ghost',
                                                    size: 'xs',
                                                    color: 'green',
                                                    onClick: () => editDocumento(row.original.id),
                                                    title: 'Editar'
                                                })
                                            ] : []),
                                            ...(hasRole('Documentacion') ? [
                                                h(UButton, {
                                                    icon: 'i-heroicons-trash',
                                                    variant: 'ghost',
                                                    size: 'xs',
                                                    color: 'red',
                                                    onClick: () => deleteDocumento(row.original.id),
                                                    title: 'Eliminar'
                                                })
                                            ] : [])
                                        ])
                                    }
                                ]" :ui="{
                                    root: 'min-w-full',
                                    td: 'py-2 px-3'
                                }" />
                            </div>
                        </template>
                    </UTable>
                </UCard>
            </div>
        </div>
    </div>

    <!-- Image Modal -->
    <ImageModal :is-open="showImageModal" :image-url="selectedImage" alt-text="Vista previa de imagen"
        @close="closeImageModal" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getGroupedRowModel } from '@tanstack/vue-table'
import type { GroupingOptions } from '@tanstack/vue-table'
import AntidumpingService from '~/services/antidumpingService'
import PermisoService from '~/services/permisoService'
import EtiquetadoService from '~/services/etiquetadoService'
import DocumentoService from '~/services/documentoService'
import ImagePreview from '~/components/ImagePreview.vue'
import DocumentPreview from '~/components/DocumentPreview.vue'

// User role composable
const { hasRole } = useUserRole()

// Notifications and loading
const { showCreateSuccess, showUpdateSuccess, showDeleteSuccess, showServerError } = useNotifications()
const { withLoading } = useLoading()

const UBadge = resolveComponent('UBadge')


// Types
interface RegulationItem {
    id: number
    producto: string
    valor?: string
    entidad?: string
    permiso?: string
    costoBase?: number
    tipoEtiquetado?: string
    requisitos?: string
    tipoDocumento?: string
    estado: string
    fecha: string
}

// Types for hierarchical structure
interface AntidumpingRegulation {
    id: number
    descripcion: string
    partida: string
    precio_declarado: number
    antidumping: number
    observaciones?: string
    imagenes?: string[]
    estado: 'active' | 'inactive'
    created_at: string
    updated_at: string
}

interface ProductRubro {
    id: number
    nombre: string
    descripcion: string
    regulaciones: AntidumpingRegulation[]
}

interface AntidumpingResponse {
    success: boolean
    data: ProductRubro[]
    error?: string
}

// Interface para la respuesta jerárquica del backend
interface AntidumpingHierarchicalResponse {
    status: string
    data: {
        id: number
        nombre: string
        created_at: string
        updated_at: string
        regulaciones: {
            id: number
            descripcion: string
            partida: string
            precio_declarado: string
            antidumping: string
            observaciones: string
            imagenes: string[]
            estado: string
            created_at: string
            updated_at: string
        }[]
    }[]
    pagination: {
        current_page: number
        last_page: number
        per_page: number
        total: number
        from: number
        to: number
    }
}

// Interface para la respuesta jerárquica de permisos
interface PermisoHierarchicalResponse {
    success: boolean
    data: {
        id: number
        nombre: string
        descripcion: string
        created_at: string
        updated_at: string
        regulaciones: {
            id: number
            tipo: string
            id_rubro: number
            rubro_nombre: string
            nombre: string
            c_permiso: number
            c_tramitador: number
            observaciones?: string
            documentos?: string[]
            estado: string
            created_at: string
            updated_at: string
        }[]
    }[]
    pagination: {
        current_page: number
        last_page: number
        per_page: number
        total: number
        from: number
        to: number
    }
}

// Interface para entidades de permisos
interface PermisoEntidad {
    id: number
    nombre: string
    descripcion: string
    regulaciones: PermisoRegulation[]
}

// Interface para regulaciones de permisos
interface PermisoRegulation {
    id: number
    tipo: string
    id_rubro: number
    rubro_nombre: string
    nombre: string
    c_permiso: number
    c_tramitador: number
    observaciones?: string
    documentos?: string[]
    estado: string
    created_at: string
    updated_at: string
}

// Interface para la respuesta jerárquica de etiquetado
interface EtiquetadoHierarchicalResponse {
    success: boolean
    data: EtiquetadoEntidad[]
    pagination: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
    error?: string
}

// Interface para entidades de etiquetado
interface EtiquetadoEntidad {
    id: number
    nombre: string
    descripcion: string
    regulaciones: EtiquetadoRegulation[]
}

// Interface para regulaciones de etiquetado
interface EtiquetadoRegulation {
    id: number
    tipo: string
    observaciones: string
    imagenes: string[]
    estado: string
    created_at: string
    updated_at: string
}

// Interface para la respuesta jerárquica de documentos especiales
interface DocumentoHierarchicalResponse {
    success: boolean
    data: DocumentoEntidad[]
    pagination: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
    error?: string
}

// Interface para entidades de documentos especiales
interface DocumentoEntidad {
    id: number
    nombre: string
    descripcion: string
    regulaciones: DocumentoRegulation[]
}

// Interface para regulaciones de documentos especiales
interface DocumentoRegulation {
    id: number
    tipo: string
    observaciones: string
    documentos: string[]
    media?: DocumentoMedia[]
    estado: string
    created_at: string
    updated_at: string
}

// Interface para media de documentos especiales
interface DocumentoMedia {
    id: number
    id_regulacion: number
    extension: string
    peso: number
    nombre_original: string
    ruta: string
    created_at: string
    updated_at: string
}

// Tabs configuration
const tabs = [
    {
        id: 'antidumping',
        label: 'Antidumping',
        icon: 'i-heroicons-shield-check'
    },
    {
        id: 'permisos',
        label: 'Permisos',
        icon: 'i-heroicons-document-text'
    },
    {
        id: 'etiquetado',
        label: 'Etiquetado',
        icon: 'i-heroicons-tag'
    },
    {
        id: 'documentos',
        label: 'Doc. Especiales',
        icon: 'i-heroicons-document'
    }
]

// Active tab - initialize from URL query parameter
const route = useRoute()
const activeTab = ref(route.query.tab as string || 'antidumping')

// Validate that the tab is valid
if (!['antidumping', 'permisos', 'etiquetado', 'documentos'].includes(activeTab.value)) {
    activeTab.value = 'antidumping'
}

// Service instances
const antidumpingService = AntidumpingService.getInstance()
const permisoService = PermisoService.getInstance()
const etiquetadoService = EtiquetadoService.getInstance()
const documentoService = DocumentoService.getInstance()
import entityService from '~/services/entityService'

// Loading states
const loadingAntidumping = ref(false)
const loadingPermisos = ref(false)
const loadingEtiquetado = ref(false)
const loadingDocumentos = ref(false)

// Data
const antidumpingData = ref<ProductRubro[]>([])
const permisosData = ref<PermisoEntidad[]>([])
const etiquetadoData = ref<EtiquetadoEntidad[]>([])
const documentosData = ref<DocumentoEntidad[]>([])

// Image modal state
const showImageModal = ref(false)
const selectedImage = ref('')
const UButton = resolveComponent('UButton')

// Grouping options
const grouping_options = ref<GroupingOptions>({
    groupedColumnMode: 'remove',
    getGroupedRowModel: getGroupedRowModel()
})
const { showConfirmation, showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

// Helper function to get color by status
const getColorByStatus = (status: string) => {
    return {
        active: 'success',
        inactive: 'error'
    }[status] || 'neutral'
}

// Columns for Antidumping (hierarchical structure)
const antidumpingColumns: TableColumn<any>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: any }) => `#${row.index + 1}`
    },
    {
        accessorKey: 'nombre',
        header: 'Rubro'
    },
    {
        id: 'title',
        header: 'Producto'
    },




]

// Columns for Permisos (hierarchical structure)
const permisosColumns: TableColumn<any>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: any }) => `#${row.index + 1}`
    },
    {
        accessorKey: 'nombre',
        header: 'Rubro'
    },
    {
        id: 'title',
        header: 'Entidad'
    },

]

// Columns for Etiquetado (hierarchical structure)
const etiquetadoColumns: TableColumn<any>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: any }) => `#${row.index + 1}`
    },
    {
        accessorKey: 'nombre',
        header: 'Rubro'
    },
    {
        id: 'title',
        header: 'Producto'
    },

]

// Columns for Documentos Especiales (hierarchical structure)
const documentosColumns: TableColumn<any>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: any }) => `#${row.index + 1}`
    },
    {
        accessorKey: 'nombre',
        header: 'Rubro'
    },
    {
        id: 'title',
        header: 'Producto'
    },
]

// Helper function to transform data for grouping
const transformDataForGrouping = (data: any[], groupBy: string) => {
    return data.map(item => ({
        ...item,
        [groupBy]: item[groupBy] || 'Sin categoría'
    }))
}

// Methods
const loadAntidumpingData = async () => {
    loadingAntidumping.value = true
    try {
        // Llamar al servicio para obtener los datos de antidumping
        const response = await withLoading(
            () => antidumpingService.getAntidumpingList(),
            'loadAntidumping',
            'Cargando datos de antidumping...'
        )

        if (response.success && response.data) {
            // Hacer cast a la respuesta jerárquica del backend
            const hierarchicalResponse = response as unknown as AntidumpingHierarchicalResponse

            // El backend ya devuelve la estructura jerárquica correcta
            const transformedData = hierarchicalResponse.data.map(rubro => ({
                id: rubro.id,
                nombre: rubro.nombre,
                descripcion: `Descripción de ${rubro.nombre}`, // Puedes ajustar esto según necesites
                regulaciones: rubro.regulaciones.map(regulacion => ({
                    id: regulacion.id,
                    descripcion: regulacion.descripcion,
                    partida: regulacion.partida,
                    precio_declarado: regulacion.precio_declarado,
                    antidumping: regulacion.antidumping,
                    observaciones: regulacion.observaciones,
                    imagenes: regulacion.imagenes || [],
                    estado: regulacion.estado as 'active' | 'inactive',
                    created_at: regulacion.created_at,
                    updated_at: regulacion.updated_at
                }))
            }))

            antidumpingData.value = transformDataForGrouping(transformedData, 'nombre')
            console.log('Datos de antidumping cargados:', antidumpingData.value)
        } else {
            console.error('Error al cargar datos de antidumping:', response.error)
            antidumpingData.value = []
            showServerError('cargar datos de antidumping', response.error)
        }
    } catch (error: any) {
        console.error('Error loading antidumping data:', error)
        antidumpingData.value = []
        showServerError('cargar datos de antidumping', error.message)
    } finally {
        loadingAntidumping.value = false
    }
}

const loadPermisosData = async () => {
    loadingPermisos.value = true
    try {
        // Llamar al servicio para obtener los datos de permisos
        const response = await permisoService.getPermisos()

        if (response.success && response.data) {
            // Hacer cast a la respuesta jerárquica del backend
            const hierarchicalResponse = response as unknown as PermisoHierarchicalResponse

            // El backend ya devuelve la estructura jerárquica correcta
            const transformedData = hierarchicalResponse.data.map(entidad => ({
                id: entidad.id,
                nombre: entidad.nombre,
                descripcion: entidad.descripcion,
                regulaciones: entidad.regulaciones.map(regulacion => ({
                    id: regulacion.id,
                    tipo: regulacion.tipo,
                    id_rubro: regulacion.id_rubro,
                    rubro_nombre: regulacion.rubro_nombre,
                    nombre: regulacion.nombre,
                    c_permiso: regulacion.c_permiso,
                    c_tramitador: regulacion.c_tramitador,
                    observaciones: regulacion.observaciones,
                    documentos: regulacion.documentos || [],
                    estado: regulacion.estado,
                    created_at: regulacion.created_at,
                    updated_at: regulacion.updated_at
                }))
            }))

            permisosData.value = transformDataForGrouping(transformedData, 'nombre')
            console.log('Datos de permisos cargados:', permisosData.value)
        } else {
            console.error('Error al cargar datos de permisos:', response.error)
            permisosData.value = []
        }
    } catch (error) {
        console.error('Error loading permisos data:', error)
        permisosData.value = []
    } finally {
        loadingPermisos.value = false
    }
}

const loadEtiquetadoData = async () => {
    loadingEtiquetado.value = true
    try {
        // Llamar al servicio para obtener los datos de etiquetado
        const response = await etiquetadoService.getEtiquetadosHierarchical()

        if (response.success && response.data) {
            // El backend ya devuelve la estructura jerárquica correcta
            const transformedData = response.data.map(rubro => ({
                id: rubro.id,
                nombre: rubro.nombre,
                descripcion: rubro.descripcion,
                regulaciones: rubro.regulaciones.map(regulacion => ({
                    id: regulacion.id,
                    tipo: regulacion.tipo,
                    observaciones: regulacion.observaciones,
                    imagenes: regulacion.imagenes || [],
                    estado: regulacion.estado,
                    created_at: regulacion.created_at,
                    updated_at: regulacion.updated_at
                }))
            }))

            etiquetadoData.value = transformDataForGrouping(transformedData, 'nombre')
            console.log('Datos de etiquetado cargados:', etiquetadoData.value)
        } else {
            console.error('Error al cargar datos de etiquetado:', response.error)
            etiquetadoData.value = []
        }
    } catch (error) {
        console.error('Error loading etiquetado data:', error)
        etiquetadoData.value = []
    } finally {
        loadingEtiquetado.value = false
    }
}

const loadDocumentosData = async () => {
    loadingDocumentos.value = true
    try {
        // Llamar al servicio para obtener los datos de documentos especiales
        const response = await documentoService.getDocumentosHierarchical()

        if (response.success && response.data) {
            // El backend ya devuelve la estructura jerárquica correcta
            const transformedData = response.data.map(rubro => ({
                id: rubro.id,
                nombre: rubro.nombre,
                descripcion: rubro.descripcion,
                regulaciones: rubro.regulaciones.map(regulacion => ({
                    id: regulacion.id,
                    tipo: regulacion.tipo,
                    observaciones: regulacion.observaciones,
                    documentos: regulacion.documentos || [],
                    media: regulacion.media || [],
                    estado: regulacion.estado,
                    created_at: regulacion.created_at,
                    updated_at: regulacion.updated_at
                }))
            }))

            documentosData.value = transformDataForGrouping(transformedData, 'nombre')
            console.log('Datos de documentos especiales cargados:', documentosData.value)
        } else {
            console.error('Error al cargar datos de documentos especiales:', response.error)
            documentosData.value = []
        }
    } catch (error) {
        console.error('Error loading documentos data:', error)
        documentosData.value = []
    } finally {
        loadingDocumentos.value = false
    }
}

const exportAntidumping = () => {
    console.log('Exporting antidumping data')
}

const exportPermisos = () => {
    console.log('Exporting permisos data')
}

const exportEtiquetado = () => {
    console.log('Exporting etiquetado data')
}

const exportDocumentos = () => {
    console.log('Exporting documentos data')
}

// Navigation function
const navigateToCreate = (type: string) => {
    switch (type) {
        case 'antidumping':
            navigateTo('/basedatos/regulaciones/antidumping/crear')
            break
        case 'permisos':
            navigateTo('/basedatos/regulaciones/permisos/crear')
            break
        case 'etiquetado':
            navigateTo('/basedatos/regulaciones/etiquetado/crear')
            break
        case 'documentos':
            navigateTo('/basedatos/regulaciones/documentos/crear')
            break
    }
}

// View regulation detail
const viewRegulationDetail = (regulationId: number) => {
    navigateTo(`/basedatos/regulaciones/antidumping/${regulationId}`)
}

// Edit regulation
const editRegulation = (regulationId: number) => {
    console.log('Navigating to edit:', regulationId)
    navigateTo(`/basedatos/regulaciones/antidumping/editar/${regulationId}`)
}
const deleteRegulation = (regulationId: number) => {
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const response = await AntidumpingService.getInstance().deleteAntidumping(regulationId)
                    if (response.success) {
                        await loadAntidumpingData()
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                    }
                }, 'Eliminando archivo...')
                await loadAntidumpingData()
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}

// View permiso detail
const viewPermisoDetail = (regulationId: number) => {
    navigateTo(`/basedatos/regulaciones/permisos/${regulationId}`)
}

// Edit permiso
const editPermiso = (regulationId: number) => {
    console.log('Navigating to edit permiso:', regulationId)
    navigateTo(`/basedatos/regulaciones/permisos/editar/${regulationId}`)
}

// View etiquetado detail
const viewEtiquetadoDetail = (regulationId: number) => {
    navigateTo(`/basedatos/regulaciones/etiquetado/${regulationId}`)
}

// Edit etiquetado
const editEtiquetado = (regulationId: number) => {
    console.log('Navigating to edit etiquetado:', regulationId)
    navigateTo(`/basedatos/regulaciones/etiquetado/editar/${regulationId}`)
}

// Edit documento especial
const editDocumento = (regulationId: number) => {
    console.log('Navigating to edit documento:', regulationId)
    navigateTo(`/basedatos/regulaciones/documentos/editar/${regulationId}`)
}

// Open document modal
const openDocumentModal = (documentUrl: string) => {
    const config = useRuntimeConfig()
    const fullUrl = `${config.public.apiBaseUrl}${documentUrl}`
    window.open(fullUrl, '_blank')
}

// Get file extension from path
const getFileExtension = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toUpperCase() || 'FILE'
    return extension
}

// Image modal functions
const getImageUrl = (ruta: string) => {
    const config = useRuntimeConfig()
    return `${config.public.apiBaseUrl}${ruta}`
}

const openImageModal = (imageUrl: string) => {
    selectedImage.value = getImageUrl(imageUrl)
    showImageModal.value = true
}

const closeImageModal = () => {
    showImageModal.value = false
    selectedImage.value = ''
}

const deleteRubro = (id: number) => {
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const response = await AntidumpingService.getInstance().deleteRubro(id)
                    if (response.success) {
                        //if activeTab is antidumping, loadAntidumpingData()
                        if (activeTab.value === 'antidumping') {
                            await loadAntidumpingData()
                        }
                        //if activeTab is permisos, loadPermisosData()
                        if (activeTab.value === 'permisos') {
                            await loadPermisosData()
                        }
                        //if activeTab is etiquetado, loadEtiquetadoData()
                        if (activeTab.value === 'etiquetado') {
                            await loadEtiquetadoData()
                        }
                        //if activeTab is documentos, loadDocumentosData()
                        if (activeTab.value === 'documentos') {
                            await loadDocumentosData()
                        }
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                    }
                }, 'Eliminando archivo...')
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}
const deletePermiso = (id: number) => {
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const response = await PermisoService.getInstance().deletePermiso(id)
                    if (response.success) {
                        await loadPermisosData()
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                    }
                }, 'Eliminando archivo...')
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}

const deleteEntidad = (id: number) => {
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const response = await entityService.getInstance().deleteEntity(id)
                    if (response.success) {
                        await loadPermisosData()
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                    }
                }, 'Eliminando archivo...')
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}
const deleteDocumento = (id: number) => {
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const response = await DocumentoService.getInstance().deleteDocumento(id)
                    if (response.success) {
                        await loadDocumentosData()
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                    }
                }, 'Eliminando archivo...')
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}

const deleteEtiquetado = (id: number) => {
    showConfirmation(
        'Confirmar eliminación',
        '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
        async () => {
            try {
                await withSpinner(async () => {
                    const response = await EtiquetadoService.getInstance().deleteEtiquetado(id)
                    if (response.success) {
                        await loadEtiquetadoData()
                        showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
                    }
                }, 'Eliminando archivo...')
            } catch (error) {
                console.error('Error al eliminar archivo:', error)
                showError('Error de Eliminación', 'Error al eliminar el archivo')
            }
        }
    )
}

watch(activeTab, (newTab) => {
    switch (newTab) {
        case 'antidumping':
            loadAntidumpingData()
            break
        case 'permisos':
            loadPermisosData()
            break
        case 'etiquetado':
            loadEtiquetadoData()
            break
        case 'documentos':
            loadDocumentosData()
            break
    }
})

// Load initial data
onMounted(() => {
    const currentTab = route.query.tab as string
    if (currentTab) {
        activeTab.value = currentTab
    }
    if (activeTab.value === 'antidumping') {
        loadAntidumpingData()
    } else if (activeTab.value === 'permisos') {
        loadPermisosData()
    } else if (activeTab.value === 'etiquetado') {
        loadEtiquetadoData()
    } else if (activeTab.value === 'documentos') {
        loadDocumentosData()
    }
})
</script>
