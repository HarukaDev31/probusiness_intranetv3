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
        <UButton
          v-for="tab in tabs"
          :key="tab.id"
          :variant="activeTab === tab.id ? 'solid' : 'outline'"
          :color="activeTab === tab.id ? 'primary' : 'neutral'"
          :icon="tab.icon"
          @click="activeTab = tab.id"
          class="flex items-center gap-2"
        >
          {{ tab.label }}
        </UButton>
      </div>
    </UCard>

    <!-- Content Container -->
    <div class="space-y-6">
      <!-- Tab Antidumping -->
      <div v-if="activeTab === 'antidumping'">
        <div class="mb-4">
          <UButton 
            label="Crear Antidumping" 
            icon="i-heroicons-plus"
            color="primary"
            @click="navigateToCreate('antidumping')"
          />
        </div>
        <DataTable
          title="Regulaciones Antidumping"
          icon="i-heroicons-shield-check"
          :data="antidumpingData"
          :columns="antidumpingColumns"
          :loading="loadingAntidumping"
          search-placeholder="Buscar regulaciones antidumping..."
          :show-export="true"
          empty-state-message="No se encontraron regulaciones antidumping."
          @export="exportAntidumping"
        />
      </div>

      <!-- Tab Permisos -->
      <div v-if="activeTab === 'permisos'">
        <div class="mb-4">
          <UButton 
            label="Crear Permiso" 
            icon="i-heroicons-plus"
            color="primary"
            @click="navigateToCreate('permisos')"
          />
        </div>
        <DataTable
          title="Regulaciones de Permisos"
          icon="i-heroicons-document-text"
          :data="permisosData"
          :columns="permisosColumns"
          :loading="loadingPermisos"
          search-placeholder="Buscar permisos..."
          :show-export="true"
          empty-state-message="No se encontraron permisos."
          @export="exportPermisos"
        />
      </div>

      <!-- Tab Etiquetado -->
      <div v-if="activeTab === 'etiquetado'">
        <div class="mb-4">
          <UButton 
            label="Crear Etiquetado" 
            icon="i-heroicons-plus"
            color="primary"
            @click="navigateToCreate('etiquetado')"
          />
        </div>
        <DataTable
          title="Regulaciones de Etiquetado"
          icon="i-heroicons-tag"
          :data="etiquetadoData"
          :columns="etiquetadoColumns"
          :loading="loadingEtiquetado"
          search-placeholder="Buscar etiquetados..."
          :show-export="true"
          empty-state-message="No se encontraron regulaciones de etiquetado."
          @export="exportEtiquetado"
        />
      </div>

      <!-- Tab Documentos Especiales -->
      <div v-if="activeTab === 'documentos'">
        <div class="mb-4">
          <UButton 
            label="Crear Documento Especial" 
            icon="i-heroicons-plus"
            color="primary"
            @click="navigateToCreate('documentos')"
          />
        </div>
        <DataTable
          title="Documentos Especiales"
          icon="i-heroicons-document"
          :data="documentosData"
          :columns="documentosColumns"
          :loading="loadingDocumentos"
          search-placeholder="Buscar documentos especiales..."
          :show-export="true"
          empty-state-message="No se encontraron documentos especiales."
          @export="exportDocumentos"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

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

// Loading states
const loadingAntidumping = ref(false)
const loadingPermisos = ref(false)
const loadingEtiquetado = ref(false)
const loadingDocumentos = ref(false)

// Data
const antidumpingData = ref<RegulationItem[]>([])
const permisosData = ref<RegulationItem[]>([])
const etiquetadoData = ref<RegulationItem[]>([])
const documentosData = ref<RegulationItem[]>([])

// Columns for Antidumping
const antidumpingColumns = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'producto',
    header: 'Producto'
  },
  {
    accessorKey: 'valor',
    header: 'Valor'
  },
  {
    accessorKey: 'estado',
    header: 'Estado'
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha'
  }
]

// Columns for Permisos
const permisosColumns = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'producto',
    header: 'Producto'
  },
  {
    accessorKey: 'entidad',
    header: 'Entidad'
  },
  {
    accessorKey: 'permiso',
    header: 'Permiso'
  },
  {
    accessorKey: 'costoBase',
    header: 'Costo Base'
  },
  {
    accessorKey: 'estado',
    header: 'Estado'
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha'
  }
]

// Columns for Etiquetado
const etiquetadoColumns = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'producto',
    header: 'Producto'
  },
  {
    accessorKey: 'tipoEtiquetado',
    header: 'Tipo Etiquetado'
  },
  {
    accessorKey: 'requisitos',
    header: 'Requisitos'
  },
  {
    accessorKey: 'estado',
    header: 'Estado'
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha'
  }
]

// Columns for Documentos Especiales
const documentosColumns = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'producto',
    header: 'Producto'
  },
  {
    accessorKey: 'tipoDocumento',
    header: 'Tipo Documento'
  },
  {
    accessorKey: 'requisitos',
    header: 'Requisitos'
  },
  {
    accessorKey: 'estado',
    header: 'Estado'
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha'
  }
]

// Methods
const loadAntidumpingData = async () => {
  loadingAntidumping.value = true
  try {
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1000))
    antidumpingData.value = [
      {
        id: 1,
        producto: 'Producto A',
        valor: '15.5%',
        estado: 'Activo',
        fecha: '2024-01-15'
      },
      {
        id: 2,
        producto: 'Producto B',
        valor: '8.2%',
        estado: 'Inactivo',
        fecha: '2024-01-10'
      }
    ]
  } catch (error) {
    console.error('Error loading antidumping data:', error)
  } finally {
    loadingAntidumping.value = false
  }
}

const loadPermisosData = async () => {
  loadingPermisos.value = true
  try {
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1000))
    permisosData.value = [
      {
        id: 1,
        producto: 'Producto C',
        entidad: 'SUNAT',
        permiso: 'Permiso de Importación',
        costoBase: 1500,
        estado: 'Aprobado',
        fecha: '2024-01-20'
      },
      {
        id: 2,
        producto: 'Producto D',
        entidad: 'MINCETUR',
        permiso: 'Certificado de Origen',
        costoBase: 800,
        estado: 'Pendiente',
        fecha: '2024-01-18'
      }
    ]
  } catch (error) {
    console.error('Error loading permisos data:', error)
  } finally {
    loadingPermisos.value = false
  }
}

const loadEtiquetadoData = async () => {
  loadingEtiquetado.value = true
  try {
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1000))
    etiquetadoData.value = [
      {
        id: 1,
        producto: 'Producto E',
        tipoEtiquetado: 'Etiquetado Nutricional',
        requisitos: 'Información nutricional detallada, ingredientes, alérgenos',
        estado: 'Aprobado',
        fecha: '2024-01-22'
      },
      {
        id: 2,
        producto: 'Producto F',
        tipoEtiquetado: 'Etiquetado de Seguridad',
        requisitos: 'Advertencias de seguridad, instrucciones de uso',
        estado: 'Pendiente',
        fecha: '2024-01-19'
      }
    ]
  } catch (error) {
    console.error('Error loading etiquetado data:', error)
  } finally {
    loadingEtiquetado.value = false
  }
}

const loadDocumentosData = async () => {
  loadingDocumentos.value = true
  try {
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1000))
    documentosData.value = [
      {
        id: 1,
        producto: 'Producto G',
        tipoDocumento: 'Certificado Sanitario',
        requisitos: 'Certificado de salud animal, análisis de laboratorio',
        estado: 'Aprobado',
        fecha: '2024-01-25'
      },
      {
        id: 2,
        producto: 'Producto H',
        tipoDocumento: 'Permiso Ambiental',
        requisitos: 'Estudio de impacto ambiental, certificado de cumplimiento',
        estado: 'Pendiente',
        fecha: '2024-01-23'
      }
    ]
  } catch (error) {
    console.error('Error loading documentos data:', error)
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
