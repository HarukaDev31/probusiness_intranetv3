# Componente FileDisplay

## Descripción

El componente `FileDisplay` es un componente reutilizable para mostrar archivos que puede manejar tanto archivos individuales como múltiples archivos. Está diseñado para mostrar archivos con opciones de descarga y eliminación, y incluye estados de carga y mensajes personalizables.

## Características

- ✅ **Flexibilidad de tipos**: Acepta `File`, `FileItem` o arrays de estos tipos
- ✅ **Estados múltiples**: Carga, con archivos, sin archivos
- ✅ **Iconos inteligentes**: Detecta automáticamente el tipo de archivo y muestra iconos apropiados
- ✅ **Acciones**: Descarga y eliminación de archivos
- ✅ **Responsive**: Se adapta a diferentes tamaños de pantalla
- ✅ **Tema oscuro**: Soporte completo para modo oscuro
- ✅ **Accesibilidad**: Tooltips y etiquetas descriptivas

## Uso Básico

```vue
<template>
  <FileDisplay
    title="Documentos del Proyecto"
    :files="archivos"
    :loading="cargando"
    @download="manejarDescarga"
    @delete="manejarEliminacion"
  />
</template>

<script setup>
const archivos = ref([])
const cargando = ref(false)

const manejarDescarga = (archivo, indice) => {
  console.log('Descargando:', archivo)
}

const manejarEliminacion = (archivo, indice) => {
  console.log('Eliminando:', archivo)
}
</script>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Título opcional del componente |
| `files` | `File \| FileItem \| (File \| FileItem)[] \| null` | `undefined` | Archivos a mostrar |
| `loading` | `boolean` | `false` | Estado de carga |
| `emptyMessage` | `string` | `'No hay archivos seleccionados'` | Mensaje cuando no hay archivos |
| `allowDownload` | `boolean` | `true` | Permite descargar archivos |
| `allowDelete` | `boolean` | `true` | Permite eliminar archivos |

## Events

| Event | Payload | Descripción |
|-------|---------|-------------|
| `download` | `(file: File \| FileItem, index: number)` | Emitido cuando se hace clic en descargar |
| `delete` | `(file: File \| FileItem, index: number)` | Emitido cuando se hace clic en eliminar |

## Tipos de Archivo Soportados

### Tipos de entrada:
- **`File`**: Archivos nativos del navegador
- **`FileItem`**: Archivos del servidor con metadatos
- **`File[]`**: Array de archivos nativos
- **`FileItem[]`**: Array de archivos del servidor
- **`null`**: Sin archivos

### Tipos de archivo reconocidos:
- **PDF**: Icono rojo con documento
- **Excel**: Icono verde con hoja de cálculo
- **Word**: Icono azul con documento
- **Imágenes**: Icono púrpura con imagen
- **Archivos comprimidos**: Icono amarillo con archivo
- **Otros**: Icono gris genérico

## Estados del Componente

### 1. Estado de Carga (`loading: true`)
```vue
<FileDisplay
  title="Cargando archivos..."
  :loading="true"
/>
```
- Muestra 3 skeletons animados
- Simula la estructura de archivos reales
- Animación de pulso suave

### 2. Sin Archivos
```vue
<FileDisplay
  title="Documentos"
  :files="[]"
  empty-message="No hay documentos disponibles"
/>
```
- Mensaje personalizable
- Icono de archivo vacío
- Centrado y estilizado

### 3. Con Archivos
```vue
<FileDisplay
  title="Documentos del Proyecto"
  :files="archivos"
  @download="descargarArchivo"
  @delete="eliminarArchivo"
/>
```
- Lista de archivos con iconos
- Información de nombre y tamaño
- Botones de acción

## Ejemplos de Uso

### Archivo Individual
```vue
<FileDisplay
  title="Documento Principal"
  :files="archivoIndividual"
  :loading="cargando"
/>
```

### Múltiples Archivos
```vue
<FileDisplay
  title="Documentos del Cliente"
  :files="archivosCliente"
  :loading="cargandoCliente"
  @download="descargarArchivo"
  @delete="eliminarArchivo"
/>
```

### Solo Lectura
```vue
<FileDisplay
  title="Documentos de Referencia"
  :files="archivosReferencia"
  :allow-download="false"
  :allow-delete="false"
/>
```

### Mensaje Personalizado
```vue
<FileDisplay
  title="Facturas Pendientes"
  :files="facturas"
  empty-message="No hay facturas pendientes de revisión"
/>
```

## Integración con Composables

### Con useCotizacionProveedor
```vue
<template>
  <FileDisplay
    title="Documentos de China"
    :files="documentosChina"
    :loading="loadingDocumentos"
    @download="descargarDocumento"
    @delete="eliminarDocumento"
  />
</template>

<script setup>
const {
  documentosChina,
  loadingDocumentos,
  getDocumentosChina
} = useCotizacionProveedor()

const descargarDocumento = (archivo, indice) => {
  // Lógica de descarga
}

const eliminarDocumento = (archivo, indice) => {
  // Lógica de eliminación
}

onMounted(() => {
  getDocumentosChina(route.params.id)
})
</script>
```

## Personalización de Estilos

### Clases CSS Disponibles
- `.file-display`: Contenedor principal
- `.file-item`: Cada elemento de archivo
- `.file-icon`: Icono del archivo
- `.file-info`: Información del archivo
- `.file-actions`: Botones de acción

### Modificación de Colores
```vue
<FileDisplay
  title="Documentos"
  :files="archivos"
  class="custom-file-display"
/>
```

```css
.custom-file-display .file-item {
  @apply border-blue-300 bg-blue-50;
}

.custom-file-display .file-item:hover {
  @apply border-blue-400 bg-blue-100;
}
```

## Consideraciones de Accesibilidad

- **Tooltips**: Cada botón de acción tiene un tooltip descriptivo
- **Contraste**: Colores optimizados para modo claro y oscuro
- **Navegación**: Soporte para navegación por teclado
- **Etiquetas**: Textos descriptivos para lectores de pantalla

## Rendimiento

- **Lazy rendering**: Solo renderiza archivos visibles
- **Keys únicas**: Usa keys optimizadas para Vue
- **Computed properties**: Cálculos eficientes para metadatos
- **Event delegation**: Manejo eficiente de eventos

## Compatibilidad

- **Vue 3**: Compatible con Composition API
- **TypeScript**: Tipado completo incluido
- **Tailwind CSS**: Estilos basados en Tailwind
- **Nuxt 3**: Optimizado para Nuxt
- **Navegadores**: Soporte para navegadores modernos

## Troubleshooting

### Problema: Los archivos no se muestran
**Solución**: Verifica que la prop `files` tenga el formato correcto y no sea `null` o `undefined`.

### Problema: Los iconos no se muestran
**Solución**: Asegúrate de que los archivos tengan nombres con extensiones válidas.

### Problema: Los eventos no se emiten
**Solución**: Verifica que los listeners estén correctamente configurados en el componente padre.

## Contribución

Para contribuir al componente:
1. Mantén la consistencia con el diseño del proyecto
2. Agrega tests para nuevas funcionalidades
3. Documenta cualquier cambio en la API
4. Sigue las convenciones de TypeScript del proyecto

