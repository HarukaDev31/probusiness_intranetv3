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
                    <UButton label="Crear Antidumping" icon="i-heroicons-plus" color="primary"
                        @click="navigateToCreate('antidumping')" />
                </div>
                <UCard>
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <UIcon name="i-heroicons-shield-check" class="text-xl mr-2 text-gray-600" />
                            <h3 class="text-lg font-semibold">Regulaciones Antidumping</h3>
                        </div>
                        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportAntidumping"
                            :loading="loadingAntidumping">
                            Exportar
                        </UButton>
                    </div>

                    <UTable v-model:expanded="expandedAntidumping" :data="antidumpingData" :columns="antidumpingColumns"
                        :ui="{ tr: 'data-[expanded=true]:bg-elevated/50' }" :loading="loadingAntidumping"
                        class="flex-1">
                        <template #expanded="{ row }">
                            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg m-2">
                                <h4 class="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                    Regulaciones de {{ row.original.nombre }}
                                </h4>
                                <div class="space-y-3">
                                    <div v-for="regulacion in row.original.regulaciones" :key="regulacion.id"
                                        class="bg-white dark:bg-gray-700 p-3 rounded border hover:shadow-md transition-shadow">
                                        <div class="flex justify-between items-start mb-2">
                                            <h5 class="font-medium text-gray-900 dark:text-white">
                                                {{ regulacion.descripcion }}
                                            </h5>
                                            <div class="flex items-center gap-2">
                                                <UBadge :variant="regulacion.estado === 'active' ? 'solid' : 'subtle'"
                                                    :color="regulacion.estado === 'active' ? 'success' : 'neutral'"
                                                    class="text-xs">
                                                    {{ regulacion.estado === 'active' ? 'Activo' : 'Inactivo' }}
                                                </UBadge>
                                                <UButton
                                                    icon="i-heroicons-eye"
                                                    variant="ghost"
                                                    size="xs"
                                                    color="blue"
                                                    @click="viewRegulationDetail(regulacion.id)"
                                                    title="Ver detalle"
                                                />
                                                <UButton
                                                    icon="i-heroicons-pencil-square"
                                                    variant="ghost"
                                                    size="xs"
                                                    color="green"
                                                    @click="editRegulation(regulacion.id)"
                                                    title="Editar"
                                                />
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span class="text-gray-500 dark:text-gray-400">Partida:</span>
                                                <span class="ml-1 font-medium">{{ regulacion.partida }}</span>
                                            </div>
                                            <div>
                                                <span class="text-gray-500 dark:text-gray-400">Precio Declarado:</span>
                                                <span class="ml-1 font-medium">${{ regulacion.precio_declarado }}</span>
                                            </div>
                                            <div>
                                                <span class="text-gray-500 dark:text-gray-400">Antidumping:</span>
                                                <span class="ml-1 font-medium text-red-600">{{ regulacion.antidumping
                                                    }}%</span>
                                            </div>
                                            <div>
                                                <span class="text-gray-500 dark:text-gray-400">Fecha:</span>
                                                <span class="ml-1 font-medium">{{ new
                                                    Date(regulacion.created_at).toLocaleDateString() }}</span>
                                            </div>
                                        </div>
                                       
                                    </div>
                                </div>
                            </div>
                        </template>
                    </UTable>
                </UCard>
            </div>

            <!-- Tab Permisos -->
            <div v-if="activeTab === 'permisos'">
                <div class="mb-4">
                    <UButton label="Crear Permiso" icon="i-heroicons-plus" color="primary"
                        @click="navigateToCreate('permisos')" />
                </div>
                <UCard>
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <UIcon name="i-heroicons-document-text" class="text-xl mr-2 text-gray-600" />
                            <h3 class="text-lg font-semibold">Regulaciones de Permisos</h3>
                        </div>
                        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportPermisos"
                            :loading="loadingPermisos">
                            Exportar
                        </UButton>
                    </div>

                    <UTable v-model:expanded="expandedPermisos" :data="permisosData" :columns="permisosColumns"
                        :ui="{ tr: 'data-[expanded=true]:bg-elevated/50' }" :loading="loadingPermisos"
                        class="flex-1">
                        <template #expanded="{ row }">
                            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg m-2">
                                <h4 class="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                    Regulaciones de {{ row.original.nombre }}
                                </h4>
                                <div class="space-y-3">
                                    <div v-for="regulacion in row.original.regulaciones" :key="regulacion.id"
                                        class="bg-white dark:bg-gray-700 p-3 rounded border hover:shadow-md transition-shadow">
                                        <div class="flex justify-between items-start mb-2">
                                            <h5 class="font-medium text-gray-900 dark:text-white">
                                                {{ regulacion.nombre }}
                                            </h5>
                                            <div class="flex items-center gap-2">
                                                <UBadge :variant="regulacion.estado === 'active' ? 'solid' : 'subtle'"
                                                    :color="regulacion.estado === 'active' ? 'success' : 'neutral'"
                                                    class="text-xs">
                                                    {{ regulacion.estado === 'active' ? 'Activo' : 'Inactivo' }}
                                                </UBadge>
                                                <UButton
                                                    icon="i-heroicons-eye"
                                                    variant="ghost"
                                                    size="xs"
                                                    color="blue"
                                                    @click="viewPermisoDetail(regulacion.id)"
                                                    title="Ver detalle"
                                                />
                                                <UButton
                                                    icon="i-heroicons-pencil-square"
                                                    variant="ghost"
                                                    size="xs"
                                                    color="green"
                                                    @click="editPermiso(regulacion.id)"
                                                    title="Editar"
                                                />
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                            
                                            <div>
                                                <span class="text-gray-500 dark:text-gray-400">C. Permiso:</span>
                                                <span class="ml-1 font-medium">S/.{{ regulacion.c_permiso }}</span>
                                            </div>
                                            <div>
                                                <span class="text-gray-500 dark:text-gray-400">C. Tramitador:</span>
                                                <span class="ml-1 font-medium">S/.{{ regulacion.c_tramitador }}</span>
                                            </div>
                                        </div>
                                        
                                    </div>
                                </div>
                            </div>
                        </template>
                    </UTable>
                </UCard>
            </div>

            <!-- Tab Etiquetado -->
            <div v-if="activeTab === 'etiquetado'">
                <div class="mb-4">
                    <UButton label="Crear Etiquetado" icon="i-heroicons-plus" color="primary"
                        @click="navigateToCreate('etiquetado')" />
                </div>
                <UCard>
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <UIcon name="i-heroicons-tag" class="text-xl mr-2 text-gray-600" />
                            <h3 class="text-lg font-semibold">Regulaciones de Etiquetado</h3>
                        </div>
                        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportEtiquetado"
                            :loading="loadingEtiquetado">
                            Exportar
                        </UButton>
                    </div>

                    <UTable v-model:expanded="expandedEtiquetado" :data="etiquetadoData" :columns="etiquetadoColumns"
                        :ui="{ tr: 'data-[expanded=true]:bg-elevated/50' }" :loading="loadingEtiquetado"
                        class="flex-1">
                        <template #expanded="{ row }">
                            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg m-2">
                                <h4 class="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                    Regulaciones de {{ row.original.nombre }}
                                </h4>
                                <div class="space-y-3">
                                    <div v-for="regulacion in row.original.regulaciones" :key="regulacion.id"
                                        class="bg-white dark:bg-gray-700 p-3 rounded border hover:shadow-md transition-shadow">
                                        <div class="flex justify-between items-start mb-3">
                                            <div class="flex-1">
                                                <!-- Observaciones -->
                                                <div v-if="regulacion.observaciones">
                                                    <span class="text-gray-500 dark:text-gray-400 text-sm">Observaciones:</span>
                                                    <p class="text-sm text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                        {{ regulacion.observaciones }}
                                                    </p>
                                                </div>
                                                
                                                <!-- Imágenes -->
                                                <div v-if="regulacion.imagenes && regulacion.imagenes.length > 0" class="mt-3">
                                                    <span class="text-gray-500 dark:text-gray-400 text-sm">Imágenes:</span>
                                                    <div class="flex gap-2 mt-2 overflow-x-auto">
                                                        <div 
                                                            v-for="(imagen, imgIndex) in regulacion.imagenes" 
                                                            :key="imgIndex"
                                                            class="relative group cursor-pointer flex-shrink-0"
                                                            @click="openImageModal(imagen)"
                                                        >
                                                            <img 
                                                                :src="getImageUrl(imagen)" 
                                                                :alt="`Imagen ${imgIndex + 1}`"
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
                                                </div>
                                            </div>
                                            
                                            <div class="flex items-center gap-2 ml-4">
                                                <UButton
                                                    icon="i-heroicons-pencil-square"
                                                    variant="ghost"
                                                    size="xs"
                                                    color="green"
                                                    @click="editEtiquetado(regulacion.id)"
                                                    title="Editar"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </UTable>
                </UCard>
            </div>

            <!-- Tab Documentos Especiales -->
            <div v-if="activeTab === 'documentos'">
                <div class="mb-4">
                    <UButton label="Crear Documento Especial" icon="i-heroicons-plus" color="primary"
                        @click="navigateToCreate('documentos')" />
                </div>
                <UCard>
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <UIcon name="i-heroicons-document" class="text-xl mr-2 text-gray-600" />
                            <h3 class="text-lg font-semibold">Regulaciones de Documentos Especiales</h3>
                        </div>
                        <UButton icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportDocumentos"
                            :loading="loadingDocumentos">
                            Exportar
                        </UButton>
                    </div>

                    <UTable v-model:expanded="expandedDocumentos" :data="documentosData" :columns="documentosColumns"
                        :ui="{ tr: 'data-[expanded=true]:bg-elevated/50' }" :loading="loadingDocumentos"
                        class="flex-1">
                        <template #expanded="{ row }">
                            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg m-2">
                                <h4 class="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                    Regulaciones de {{ row.original.nombre }}
                                </h4>
                                <div class="space-y-3">
                                    <div v-for="regulacion in row.original.regulaciones" :key="regulacion.id"
                                        class="bg-white dark:bg-gray-700 p-3 rounded border hover:shadow-md transition-shadow">
                                        <div class="flex justify-between items-start mb-3">
                                            <div class="flex-1">
                                                <!-- Observaciones -->
                                                <div v-if="regulacion.observaciones">
                                                    <span class="text-gray-500 dark:text-gray-400 text-sm">Observaciones:</span>
                                                    <p class="text-sm text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                        {{ regulacion.observaciones }}
                                                    </p>
                                                </div>
                                                
                                                <!-- Documentos -->
                                                <div v-if="(regulacion.documentos && regulacion.documentos.length > 0) || (regulacion.media && regulacion.media.length > 0)" class="mt-3">
                                                    <span class="text-gray-500 dark:text-gray-400 text-sm">Documentos:</span>
                                                    <div class="flex gap-2 mt-2 overflow-x-auto">
                                                        <!-- Documentos como strings (rutas) -->
                                                        <div 
                                                            v-for="(documento, docIndex) in regulacion.documentos" 
                                                            :key="`doc-${docIndex}`"
                                                            class="relative group cursor-pointer flex-shrink-0"
                                                            @click="openDocumentModal(documento)"
                                                        >
                                                            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors flex items-center justify-center">
                                                                <UIcon 
                                                                    name="i-heroicons-document" 
                                                                    class="w-8 h-8 text-gray-500 dark:text-gray-400"
                                                                />
                                                            </div>
                                                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                                                                <UIcon 
                                                                    name="i-heroicons-arrow-down-tray" 
                                                                    class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                                />
                                                            </div>
                                                            <div class="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                                                                {{ getFileExtension(documento) }}
                                                            </div>
                                                        </div>
                                                        
                                                        <!-- Documentos como objetos media -->
                                                        <div 
                                                            v-for="(documento, docIndex) in regulacion.media" 
                                                            :key="`media-${docIndex}`"
                                                            class="relative group cursor-pointer flex-shrink-0"
                                                            @click="openDocumentModal(documento.ruta)"
                                                        >
                                                            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors flex items-center justify-center">
                                                                <UIcon 
                                                                    name="i-heroicons-document" 
                                                                    class="w-8 h-8 text-gray-500 dark:text-gray-400"
                                                                />
                                                            </div>
                                                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                                                                <UIcon 
                                                                    name="i-heroicons-arrow-down-tray" 
                                                                    class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                                />
                                                            </div>
                                                            <div class="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                                                                {{ documento.extension.toUpperCase() }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="flex items-center gap-2 ml-4">
                                                <UButton
                                                    icon="i-heroicons-pencil-square"
                                                    variant="ghost"
                                                    size="xs"
                                                    color="green"
                                                    @click="editDocumento(regulacion.id)"
                                                    title="Editar"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </UTable>
                </UCard>
            </div>
        </div>
    </div>

    <!-- Image Modal -->
    <ImageViewerModal 
        :show-modal="showImageModal" 
        :image-url="selectedImage" 
        @close="closeImageModal" 
    />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, h } from 'vue'
import AntidumpingService from '~/services/antidumpingService'
import PermisoService from '~/services/permisoService'
import EtiquetadoService from '~/services/etiquetadoService'
import DocumentoService from '~/services/documentoService'

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

// Active tab
const activeTab = ref('antidumping')

// Service instances
const antidumpingService = AntidumpingService.getInstance()
const permisoService = PermisoService.getInstance()
const etiquetadoService = EtiquetadoService.getInstance()
const documentoService = DocumentoService.getInstance()

// Expanded state for tables
const expandedAntidumping = ref({})
const expandedPermisos = ref({})
const expandedEtiquetado = ref({})
const expandedDocumentos = ref({})

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
const UBadge = resolveComponent('UBadge')

// Columns for Antidumping (hierarchical structure)
const antidumpingColumns = [
    {
        id: 'expand',
        cell: ({ row }: { row: any }) =>
            h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-chevron-down',
                square: true,
                'aria-label': 'Expand',
                ui: {
                    leadingIcon: [
                        'transition-transform',
                        row.getIsExpanded() ? 'duration-200 rotate-180' : ''
                    ]
                },
                onClick: () => row.toggleExpanded()
            })
    },
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: any }) => `#${row.getValue('id')}`
    },
    {
        accessorKey: 'nombre',
        header: 'Rubro'
    },
    {
        accessorKey: 'descripcion',
        header: 'Descripción'
    },
    {
        accessorKey: 'regulaciones',
        header: 'Regulaciones',
        cell: ({ row }: { row: any }) => {
            const regulaciones = row.getValue('regulaciones') as AntidumpingRegulation[]
            return h(UBadge, {
                variant: 'subtle',
                color: 'primary'
            }, `${regulaciones.length} regulaciones`)
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const regulaciones = row.getValue('regulaciones') as AntidumpingRegulation[]
            const activas = regulaciones.filter(r => r.estado === 'active').length
            const total = regulaciones.length
            return h(UBadge, {
                variant: 'subtle',
                color: activas === total ? 'success' : activas > 0 ? 'warning' : 'error'
            }, `${activas}/${total} activas`)
        }
    }
]

// Columns for Permisos (hierarchical structure)
const permisosColumns = [
    {
        id: 'expand',
        cell: ({ row }: { row: any }) =>
            h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-chevron-down',
                square: true,
                'aria-label': 'Expand',
                ui: {
                    leadingIcon: [
                        'transition-transform',
                        row.getIsExpanded() ? 'duration-200 rotate-180' : ''
                    ]
                },
                onClick: () => row.toggleExpanded()
            })
    },
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: any }) => `#${row.getValue('id')}`
    },
    {
        accessorKey: 'nombre',
        header: 'Entidad'
    },
    {
        accessorKey: 'descripcion',
        header: 'Descripción'
    },
    {
        accessorKey: 'regulaciones',
        header: 'Regulaciones',
        cell: ({ row }: { row: any }) => {
            const regulaciones = row.getValue('regulaciones') as PermisoRegulation[]
            return h(UBadge, {
                variant: 'subtle',
                color: 'primary'
            }, `${regulaciones.length} regulaciones`)
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const regulaciones = row.getValue('regulaciones') as PermisoRegulation[]
            const activas = regulaciones.filter(r => r.estado === 'active').length
            const total = regulaciones.length
            return h(UBadge, {
                variant: 'subtle',
                color: activas === total ? 'success' : activas > 0 ? 'warning' : 'error'
            }, `${activas}/${total} activas`)
        }
    }
]

// Columns for Etiquetado (hierarchical structure)
const etiquetadoColumns = [
    {
        id: 'expand',
        cell: ({ row }: { row: any }) =>
            h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-chevron-down',
                square: true,
                'aria-label': 'Expand',
                ui: {
                    leadingIcon: [
                        'transition-transform',
                        row.getIsExpanded() ? 'duration-200 rotate-180' : ''
                    ]
                },
                onClick: () => row.toggleExpanded()
            })
    },
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: any }) => `#${row.getValue('id')}`
    },
    {
        accessorKey: 'nombre',
        header: 'Rubro'
    },
    {
        accessorKey: 'descripcion',
        header: 'Descripción'
    },
    {
        accessorKey: 'regulaciones',
        header: 'Regulaciones',
        cell: ({ row }: { row: any }) => {
            const regulaciones = row.getValue('regulaciones') as EtiquetadoRegulation[]
            return h(UBadge, {
                variant: 'subtle',
                color: 'primary'
            }, `${regulaciones.length} regulaciones`)
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const regulaciones = row.getValue('regulaciones') as EtiquetadoRegulation[]
            const activas = regulaciones.filter(r => r.estado === 'active').length
            const total = regulaciones.length
            return h(UBadge, {
                variant: 'subtle',
                color: activas === total ? 'success' : activas > 0 ? 'warning' : 'error'
            }, `${activas}/${total} activas`)
        }
    }
]

// Columns for Documentos Especiales (hierarchical structure)
const documentosColumns = [
    {
        id: 'expand',
        cell: ({ row }: { row: any }) =>
            h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-chevron-down',
                square: true,
                'aria-label': 'Expand',
                ui: {
                    leadingIcon: [
                        'transition-transform',
                        row.getIsExpanded() ? 'duration-200 rotate-180' : ''
                    ]
                },
                onClick: () => row.toggleExpanded()
            })
    },
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: any }) => `#${row.getValue('id')}`
    },
    {
        accessorKey: 'nombre',
        header: 'Rubro'
    },
    {
        accessorKey: 'descripcion',
        header: 'Descripción'
    },
    {
        accessorKey: 'regulaciones',
        header: 'Regulaciones',
        cell: ({ row }: { row: any }) => {
            const regulaciones = row.getValue('regulaciones') as DocumentoRegulation[]
            return h(UBadge, {
                variant: 'subtle',
                color: 'primary'
            }, `${regulaciones.length} regulaciones`)
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const regulaciones = row.getValue('regulaciones') as DocumentoRegulation[]
            const activas = regulaciones.filter(r => r.estado === 'active').length
            const total = regulaciones.length
            return h(UBadge, {
                variant: 'subtle',
                color: activas === total ? 'success' : activas > 0 ? 'warning' : 'error'
            }, `${activas}/${total} activas`)
        }
    }
]

// Methods
const loadAntidumpingData = async () => {
  loadingAntidumping.value = true
  try {
    // Llamar al servicio para obtener los datos de antidumping
    const response = await antidumpingService.getAntidumpingList()
    
    if (response.success && response.data) {
      // Hacer cast a la respuesta jerárquica del backend
      const hierarchicalResponse = response as unknown as AntidumpingHierarchicalResponse
      
      // El backend ya devuelve la estructura jerárquica correcta
      antidumpingData.value = hierarchicalResponse.data.map(rubro => ({
        id: rubro.id,
        nombre: rubro.nombre,
        descripcion: `Descripción de ${rubro.nombre}`, // Puedes ajustar esto según necesites
        regulaciones: rubro.regulaciones.map(regulacion => ({
          id: regulacion.id,
          descripcion: regulacion.descripcion,
          partida: regulacion.partida,
          precio_declarado: parseFloat(regulacion.precio_declarado),
          antidumping: parseFloat(regulacion.antidumping),
          observaciones: regulacion.observaciones,
          imagenes: regulacion.imagenes || [],
          estado: regulacion.estado as 'active' | 'inactive',
          created_at: regulacion.created_at,
          updated_at: regulacion.updated_at
        }))
      }))
      
      console.log('Datos de antidumping cargados:', antidumpingData.value)
    } else {
      console.error('Error al cargar datos de antidumping:', response.error)
      antidumpingData.value = []
    }
  } catch (error) {
    console.error('Error loading antidumping data:', error)
    antidumpingData.value = []
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
            permisosData.value = hierarchicalResponse.data.map(entidad => ({
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
            etiquetadoData.value = response.data.map(rubro => ({
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
            documentosData.value = response.data.map(rubro => ({
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
  const fullUrl = `http://localhost:8000${documentUrl}`
  window.open(fullUrl, '_blank')
}

// Get file extension from path
const getFileExtension = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toUpperCase() || 'FILE'
  return extension
}

// Image modal functions
const openImageModal = (imageUrl: string) => {
  selectedImage.value = imageUrl
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = ''
}

// Watch for tab changes to load data
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
    loadAntidumpingData()
})
</script>
