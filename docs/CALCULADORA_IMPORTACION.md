# Calculadora de Importación

## Descripción

La Calculadora de Importación es una aplicación web que permite a los usuarios calcular costos de importación a través de un formulario de 4 pasos. La aplicación está construida con Nuxt 3, Vue 3, TypeScript y Tailwind CSS.

## Características

### Paso 1: Información del Cliente
- Nombre del cliente (requerido)
- DNI (requerido)
- WhatsApp (requerido)
- Correo electrónico (requerido)
- Cantidad de proveedores (automático)

### Paso 2: Información de la Carga
- Gestión dinámica de proveedores
- Productos por proveedor con campos:
  - Nombre del producto (requerido)
  - CBM (requerido)
  - Peso
  - Cantidad por caja
  - Precio (requerido)
  - Cantidad (requerido)
- Agregar/eliminar proveedores y productos
- Cálculo automático de totales

### Paso 3: Resumen
- Vista previa de toda la información ingresada
- Resumen de datos del cliente
- Resumen de carga con totales
- Lista de productos por proveedor

### Paso 4: Cálculos Finales
- Tabla detallada de cálculos por proveedor
- Cálculos automáticos de:
  - Valor FOB
  - Flete
  - Seguro
  - Valor CFR
  - Valor CIF
- Tributos aplicables:
  - Antidumping
  - Ad Valorem
  - IGV 16%
  - IPM 2%
  - Percepción 3.5%

## Estructura del Proyecto

```
├── composables/
│   └── useCalculadoraImportacion.ts    # Lógica de estado y funciones
├── types/
│   └── calculadora-importacion.ts      # Definiciones de tipos TypeScript
├── pages/
│   └── cotizaciones/
│       └── index.vue                   # Página principal de la calculadora
└── docs/
    └── CALCULADORA_IMPORTACION.md      # Esta documentación
```

## Uso

### Instalación

1. Asegúrate de tener Node.js instalado
2. Instala las dependencias:
   ```bash
   npm install
   ```

### Desarrollo

1. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre tu navegador en `http://localhost:3000/cotizaciones`

### Construcción

1. Construye la aplicación para producción:
   ```bash
   npm run build
   ```

2. Previsualiza la versión de producción:
   ```bash
   npm run preview
   ```

## Tecnologías Utilizadas

- **Nuxt 3**: Framework de Vue.js para aplicaciones universales
- **Vue 3**: Framework de JavaScript progresivo
- **TypeScript**: Superset de JavaScript con tipado estático
- **Tailwind CSS**: Framework de CSS utilitario
- **Composition API**: API de composición de Vue 3

## Funcionalidades Técnicas

### Estado Reactivo
- Uso de `ref()` y `computed()` para estado reactivo
- Validación de pasos en tiempo real
- Cálculos automáticos de totales

### Validación
- Campos requeridos marcados con asterisco rojo
- Validación por paso antes de permitir continuar
- Botones de navegación habilitados/deshabilitados según validación

### Gestión de Datos
- Estructura de datos jerárquica (proveedores → productos)
- IDs únicos para cada elemento
- Renumeración automática al eliminar elementos

### Cálculos
- Cálculos automáticos de volúmenes y pesos
- Aplicación de impuestos y tasas
- Totales por proveedor y generales

## Personalización

### Estilos
Los estilos están implementados con Tailwind CSS y pueden ser personalizados modificando:
- Colores en las clases de Tailwind
- Espaciado y tamaños
- Bordes y sombras

### Cálculos
Los cálculos de impuestos y tasas están en el composable `useCalculadoraImportacion.ts`:
- Modifica las fórmulas en la función `calcularTotales()`
- Ajusta los porcentajes de impuestos
- Personaliza los cálculos de flete y seguro

### Validaciones
Las validaciones están en la función `isStepValid()`:
- Agrega nuevas reglas de validación
- Modifica los campos requeridos por paso
- Personaliza los mensajes de error

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte técnico o preguntas sobre la implementación, contacta al equipo de desarrollo o crea un issue en el repositorio.


