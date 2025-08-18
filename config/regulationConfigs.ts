import type { RegulationFormConfig } from '../composables/useRegulationForm'
import type { RegulationEditConfig } from '../composables/useRegulationEdit'

// Configuración para Antidumping
export const antidumpingConfig: RegulationFormConfig = {
  endpoint: '/api/base-datos/regulaciones/antidumping',
  title: 'Nueva Regulación Antidumping',
  subtitle: 'Completa la información de la nueva regulación antidumping',
  icon: 'i-heroicons-plus-circle',
  requiredFields: ['producto', 'descripcion', 'partida'],
  fields: {
    producto: {
      type: 'select',
      label: 'Producto Seleccionado',
      placeholder: 'Buscar producto...',
      required: true,
      icon: 'i-heroicons-magnifying-glass'
    },
    descripcion: {
      type: 'textarea',
      label: 'Descripción del Producto',
      placeholder: 'Ingrese la descripción del producto...',
      required: true
    },
    partida: {
      type: 'text',
      label: 'Partida Arancelaria',
      placeholder: 'Ej: 6403.91.00.00',
      required: true,
      icon: 'i-heroicons-tag'
    },
    observaciones: {
      type: 'textarea',
      label: 'Observaciones',
      placeholder: 'Agregar observaciones sobre el antidumping...'
    },
    imagenes: {
      type: 'image',
      label: 'Imágenes'
    }
  }
}

// Configuración para Permisos
export const permisosConfig: RegulationFormConfig = {
  endpoint: '/api/base-datos/regulaciones/permisos',
  title: 'Nueva Regulación de Permiso',
  subtitle: 'Completa la información del nuevo permiso',
  icon: 'i-heroicons-plus-circle',
  requiredFields: ['entidad'],
  fields: {
    entidad: {
      type: 'select',
      label: 'Entidad',
      placeholder: 'Seleccionar entidad',
      required: true,
      icon: 'i-heroicons-building-office'
    },
    nombrePermiso: {
      type: 'text',
      label: 'Nombre del permiso',
      placeholder: 'Nombre del permiso para el producto seleccionado',
      icon: 'i-heroicons-tag'
    },
    codigoPermiso: {
      type: 'text',
      label: 'C. Permiso',
      placeholder: 'PRM-2024-001',
      icon: 'i-heroicons-qr-code'
    },
    costoBase: {
      type: 'number',
      label: 'Costo Base',
      placeholder: '90.00',
      icon: 'i-heroicons-currency-dollar'
    },
    costoTramitador: {
      type: 'number',
      label: 'C. Tramitador',
      placeholder: '50.00',
      icon: 'i-heroicons-user'
    },
    observaciones: {
      type: 'textarea',
      label: 'Observaciones',
      placeholder: 'Agregar observaciones sobre el permiso...'
    },
    documentos: {
      type: 'file',
      label: 'Documentos'
    }
  }
}

// Configuración para Etiquetado
export const etiquetadoConfig: RegulationFormConfig = {
  endpoint: '/api/base-datos/regulaciones/etiquetado',
  title: 'Nueva Regulación de Etiquetado',
  subtitle: 'Completa la información del nuevo etiquetado',
  icon: 'i-heroicons-plus-circle',
  requiredFields: ['producto'],
  fields: {
    producto: {
      type: 'select',
      label: 'Producto Seleccionado',
      placeholder: 'Buscar producto...',
      required: true,
      icon: 'i-heroicons-magnifying-glass'
    },
    observaciones: {
      type: 'textarea',
      label: 'Observaciones',
      placeholder: 'Agregar observaciones sobre el etiquetado...'
    },
    imagenes: {
      type: 'image',
      label: 'Imágenes'
    }
  }
}

// Configuración para Documentos Especiales
export const documentosConfig: RegulationFormConfig = {
  endpoint: '/api/base-datos/regulaciones/documentos',
  title: 'Nueva Regulación de Documentos Especiales',
  subtitle: 'Completa la información de los documentos especiales',
  icon: 'i-heroicons-plus-circle',
  requiredFields: ['producto'],
  fields: {
    producto: {
      type: 'select',
      label: 'Producto Seleccionado',
      placeholder: 'Buscar producto...',
      required: true,
      icon: 'i-heroicons-magnifying-glass'
    },
    observaciones: {
      type: 'textarea',
      label: 'Observaciones',
      placeholder: 'Agregar observaciones sobre los documentos...'
    },
    documentos: {
      type: 'file',
      label: 'Documentos'
    }
  }
}

// Configuraciones de edición
export const antidumpingEditConfig: RegulationEditConfig = {
  endpoint: '/api/base-datos/regulaciones/antidumping',
  getByIdEndpoint: '/api/base-datos/regulaciones/antidumping',
  title: 'Editar Regulación Antidumping',
  subtitle: 'Modifica la información del antidumping',
  icon: 'i-heroicons-pencil-square',
  requiredFields: ['producto', 'descripcion', 'partida'],
  fields: antidumpingConfig.fields
}

export const permisosEditConfig: RegulationEditConfig = {
  endpoint: '/api/base-datos/regulaciones/permisos',
  getByIdEndpoint: '/api/base-datos/regulaciones/permisos',
  title: 'Editar Regulación de Permiso',
  subtitle: 'Modifica la información del permiso',
  icon: 'i-heroicons-pencil-square',
  requiredFields: ['entidad'],
  fields: permisosConfig.fields
}

export const etiquetadoEditConfig: RegulationEditConfig = {
  endpoint: '/api/base-datos/regulaciones/etiquetado',
  getByIdEndpoint: '/api/base-datos/regulaciones/etiquetado',
  title: 'Editar Regulación de Etiquetado',
  subtitle: 'Modifica la información del etiquetado',
  icon: 'i-heroicons-pencil-square',
  requiredFields: ['producto'],
  fields: etiquetadoConfig.fields
}

export const documentosEditConfig: RegulationEditConfig = {
  endpoint: '/api/base-datos/regulaciones/documentos',
  getByIdEndpoint: '/api/base-datos/regulaciones/documentos',
  title: 'Editar Regulación de Documentos Especiales',
  subtitle: 'Modifica la información de los documentos especiales',
  icon: 'i-heroicons-pencil-square',
  requiredFields: ['producto'],
  fields: documentosConfig.fields
} 