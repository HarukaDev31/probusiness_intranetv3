<template>
  <div class="min-h-screen ">
    <div class="max-w-6xl mx-auto ">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">
          Calculadora de Importación
        </h1>
        <p class="text-lg ">
          Complete todos los pasos para obtener su cotización de importación
        </p>
      </div>

      <!-- Stepper -->
      <UCard class="mb-8">
        <div class="flex items-center justify-center">
          <div class="flex items-center space-x-4">
            <div v-for="step in totalSteps" :key="step" class="flex items-center">
              <!-- Step Circle -->
              <div :class="[
                'w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-colors',
                currentStep >= step
                  ? 'bg-green-600 '
                  : 'bg-gray-200 text-gray-500'
              ]">
                {{ step }}
              </div>

              <!-- Step Label -->
              <div :class="[
                'ml-3 text-sm font-medium transition-colors',
                currentStep >= step ? 'text-green-600' : 'text-gray-500'
              ]">
                {{ getStepLabel(step) }}
              </div>

              <!-- Connector Line -->
              <div v-if="step < totalSteps" :class="[
                'w-16 h-0.5 transition-colors',
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              ]"></div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Step Content -->
      <UCard class="rounded-lg shadow-lg  ">
        <!-- Step 1: Información del Cliente -->
        <div v-if="currentStep === 1">
          <h2 class="text-2xl font-bold mb-6">
            Información del Cliente
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <UFormField label="Nombre del cliente" name="nombre">
                <UInput v-model="clienteInfo.nombre" type="text" placeholder="Ingrese el nombre completo"
                  class="w-full px-4 py-2  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </UFormField>
            </div>

            <div>
              <UFormField label="DNI" name="dni">
                <UInput v-model="clienteInfo.dni" type="text"
                  class="w-full px-4 py-2  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </UFormField>
            </div>

            <div>
              <UFormField label="WhatsApp" name="whatsapp">
                <UInputMenu v-model="clienteInfo.whatsapp" :items="clientes" placeholder="Buscar whatsapp..."
                  class="flex-1" @update:searchTerm="(term: string) => getClientesByWhatsapp(term)"
                  @update:model-value="onClienteSelected" />

              </UFormField>
            </div>

            <div>
              <UFormField label="Correo" name="correo">
                <UInput v-model="clienteInfo.correo" type="email"
                  class="w-full px-4 py-2  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Qty Proveedores" name="qtyProveedores" :rules="[
                {
                  rule: (value) => value >= 1 && value <= 6,
                  message: 'El número de proveedores debe estar entre 1 y 6'
                }
              ]">
                <UInput v-model="clienteInfo.qtyProveedores" type="number" :min="1" :max="6"
                  placeholder="1-6 proveedores" class="w-full" size="md" variant="outline" />
                <p class="text-xs text-gray-500 mt-1">Mínimo: 1, Máximo: 6 proveedores</p>
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Step 2: Información de la Carga -->
        <div v-if="currentStep === 2">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold ">
              Información de la Carga
            </h2>
            <div class="flex space-x-4 text-sm">
              <div class="px-3 py-1 rounded-md">
                <span class="font-medium">Total Cbm:</span> {{ totalCbm.toFixed(1) }}
              </div>
              <div class="px-3 py-1 rounded-md">
                <span class="font-medium">Total Items:</span> {{ totalItems }}
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div v-for="proveedor in proveedores" :key="proveedor.id" class="border-t pt-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold ">
                  {{ proveedor.id }}) Proveedor
                </h3>
                <UButton @click="removeProveedor(proveedor.id)" class="text-red-500 hover:text-red-700 p-2"
                  title="Eliminar proveedor">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                </UButton>
                <div>
                  <label class="block text-sm font-medium  mb-2">
                    CBM Total <span class="text-red-500">*</span>
                  </label>
                  <UInput v-model.number="proveedor.cbm" type="number" step="0.1" min="0" placeholder="0.0" size="md"
                    variant="outline" />
                </div>

                <div>
                  <label class="block text-sm font-medium  mb-2">
                    Peso Total
                  </label>
                  <UInput v-model.number="proveedor.peso" type="number" min="0" placeholder="0" size="md"
                    variant="outline" />
                </div>

                <div>
                  <label class="block text-sm font-medium  mb-2">
                    Qty Cajas
                  </label>
                  <UInput v-model.number="proveedor.qtyCaja" type="number" min="0" placeholder="0" size="md"
                    variant="outline" />
                </div>
              </div>


              <!-- Lista de Productos -->
              <div class="space-y-4">
                <h4 class="text-md font-medium ">Productos del Proveedor</h4>

                <div v-for="producto in proveedor.productos" :key="producto.id"
                  class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg">
                  <div>
                    <label class="block text-sm font-medium  mb-2">
                      Nombre del producto <span class="text-red-500">*</span>
                    </label>
                    <UInput v-model="producto.nombre" type="text" placeholder="Nombre del producto" size="md"
                      variant="outline" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium  mb-2">
                      Precio <span class="text-red-500">*</span>
                    </label>
                    <UInput v-model.number="producto.precio" type="number" step="0.01" min="0" placeholder="0.00"
                      size="md" variant="outline" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium  mb-2">
                      Cantidad <span class="text-red-500">*</span>
                    </label>
                    <div class="flex space-x-2">
                      <UInput v-model.number="producto.cantidad" type="number" min="0" placeholder="0" size="md"
                        variant="outline" class="flex-1" />
                      <UButton @click="removeProducto(proveedor.id, producto.id)" color="error" variant="soft" size="sm"
                        icon="i-heroicons-trash" title="Eliminar producto" />
                    </div>
                  </div>
                </div>
              </div>

              <UButton @click="addProducto(proveedor.id)"
                class="bg-orange-500  px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
                + item
              </UButton>
            </div>

            <UButton @click="addProveedor"
              class="bg-blue-500  px-6 py-3 rounded-md hover:bg-blue-600 transition-colors">
              + Agregar Proveedor
            </UButton>
          </div>
        </div>

        <!-- Step 3: Resumen -->
        <div v-if="currentStep === 3">
          <h2 class="text-2xl font-bold mb-6">Resumen</h2>

          <!-- Información del Cliente -->
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Información del Cliente</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <UFormField label="Nombre del cliente" name="nombre">
                <div class="font-medium ">{{ clienteInfo.nombre || 'Miguel Villegas Perez' }}</div>
              </UFormField>
              <UFormField label="DNI" name="dni">
                <div class="font-medium ">{{ clienteInfo.dni || '45464656' }}</div>
              </UFormField>
              <div class="p-4 rounded-lg ">
                <UFormField label="Correo" name="correo">
                  <div class="font-medium ">{{ clienteInfo.correo || 'mvillegas@probusiness.pe' }}</div>
                </UFormField>
              </div>
              <div class="p-4 rounded-lg ">
                <div class="text-sm text-gray-600 mb-1">WhatsApp:</div>
                <div class="font-medium ">{{ clienteInfo.whatsapp || '934958592' }}</div>
              </div>
            </div>
          </div>




          <!-- Botón para continuar -->

        </div>

        <!-- Step 4: Cálculos Finales -->
        <div v-if="currentStep === 3">



          <!-- Tabla de Cálculos -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse ">
              <thead>

              </thead>
              <tbody>
                <tr>
                  <td class=" px-4 py-2 ">N. Proveedor</td>
                  <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center"
                    :colspan="proveedor.productos.length">
                    {{ proveedor.id }}
                  </td>
                  <td class=" px-4 py-2 text-center ">
                    {{ proveedores.length }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Qty Cajas</td>
                  <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center"
                    :colspan="proveedor.productos.length">
                    {{ proveedor.qtyCaja || 0 }}
                  </td>
                  <td class=" px-4 py-2 text-center ">
                    {{ totalCajas }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Peso</td>
                  <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center"
                    :colspan="proveedor.productos.length">
                    {{ proveedor.peso || 0 }}
                  </td>
                  <td class=" px-4 py-2 text-center ">
                    {{ totalPeso }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Vol. x Prov.</td>
                  <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center"
                    :colspan="proveedor.productos.length">
                    {{ proveedor.cbm || 0 }}
                  </td>
                  <td class=" px-4 py-2 text-center ">
                    {{ calculosFinales.totalCbm.toFixed(1) }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Nombre</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center">
                      {{ producto.nombre || '-' }}
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center ">
                    Total
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Valor unitario</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center">
                      ${{ producto.precio.toFixed(2) || '0.00' }}
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center ">
                    -
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Cantidad</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center">
                      {{ producto.cantidad || 0 }}
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center ">
                    {{ calculosFinales.totalItems }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Valor FOB</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center ">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center ">
                      ${{ (producto.precio * producto.cantidad || 0).toFixed(2) }}
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center ">
                    ${{ totalValorFOB.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Distribución %</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center">
                      {{ totalValorFOB > 0 ? ((producto.precio * producto.cantidad || 0) / totalValorFOB *
                      100).toFixed(0) : 0 }}%
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center ">
                    100%
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2">Flete</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center">
                      ${{ (producto.precio * producto.cantidad || 0).toFixed(2) }}
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center">
                    ${{ totalFlete.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Valor CFR</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center ">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center ">
                      ${{ ((producto.precio * producto.cantidad || 0) * 2).toFixed(2) }}
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center ">
                    ${{ totalCFR.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2">Seguro</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center">
                      ${{ (producto.precio || 0).toFixed(2) }}
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center">
                    ${{ totalSeguro.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class=" px-4 py-2 ">Valor CIF</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" px-4 py-2 text-center">
                      ${{ ((producto.precio * producto.cantidad || 0) * 2 +
                        (producto.precio || 0)).toFixed(2) }}
                    </td>
                  </template>
                  <td class=" px-4 py-2 text-center ">
                    ${{ totalCIF.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tributos Aplicables -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold  mb-4">Tributos Aplicables</h3>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse ">
                <thead>
                  <tr>
                    <th class=" px-4 py-2 text-left">Concepto</th>
                    <th v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                      {{ proveedor.id }}
                    </th>
                    <th class=" px-4 py-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class=" px-4 py-2 ">Antidumping</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                      ${{ ((proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0) * 0.01).toFixed(2)
                      }}
                    </td>
                    <td class=" px-4 py-2 text-center ">
                      ${{ totalAntidumping.toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" px-4 py-2 ">Ad Valorem</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                      <div class="px-2 py-1 rounded text-sm">0%</div>
                      $0.00
                    </td>
                    <td class=" px-4 py-2 text-center ">
                      $0.00
                    </td>
                  </tr>
                  <tr>
                    <td class=" px-4 py-2 ">IGV 16%</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                      ${{ (((proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0) * 2 +
                        (proveedor.productos[0]?.precio || 0)) * 0.16).toFixed(2) }}
                    </td>
                    <td class=" px-4 py-2 text-center ">
                      ${{ totalIGV.toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" px-4 py-2 ">IPM 2%</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                      $0.00
                    </td>
                    <td class=" px-4 py-2 text-center ">
                      $0.00
                    </td>
                  </tr>
                  <tr>
                    <td class=" px-4 py-2 ">Percepción 3.5%</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center">
                      $0.00
                    </td>
                    <td class=" px-4 py-2 text-center ">
                      $0.00
                    </td>
                  </tr>
                  <tr>
                    <td class=" px-4 py-2 ">Total</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" px-4 py-2 text-center ">
                      $0.00
                    </td>
                    <td class=" px-4 py-2 text-center ">
                      ${{ totalTributos.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Navigation -->
      <div class="flex justify-between items-center">
        <UButton @click="prevStep" :disabled="!canGoPrev" color="primary" size="lg" icon="i-heroicons-arrow-left"
          :label="'Anterior'">

        </UButton>

        <div class="text-center">
          <span class="">Paso {{ currentStep }} de {{ totalSteps }}</span>
        </div>

        <UButton v-if="currentStep < totalSteps" @click="nextStep" :disabled="!canGoNext" color="primary" size="lg"
          icon="i-heroicons-arrow-right" :label="'Siguiente'">

        </UButton>

        <UButton v-else @click="finalizarCalculadora" color="primary" size="lg" icon="i-heroicons-arrow-right"
          :label="'Finalizar'">
          Finalizar
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCalculadoraImportacion } from '~/composables/useCalculadoraImportacion'

const {
  currentStep,
  totalSteps,
  clienteInfo,
  proveedores,
  calculosFinales,
  nextStep,
  prevStep,
  goToStep,
  addProveedor,
  removeProveedor,
  addProducto,
  removeProducto,
  calcularTotales,
  isStepValid,
  canGoNext,
  canGoPrev,
  getClientesByWhatsapp,
  getTarifas,
  clientes,
  tarifas
} = useCalculadoraImportacion()

const onClienteSelected = (cliente: any) => {
  clienteInfo.value.nombre = cliente.nombre || ''
  clienteInfo.value.dni = cliente.documento || ''
  clienteInfo.value.whatsapp = cliente.label || ''
  clienteInfo.value.correo = cliente.correo || ''
}
const getStepLabel = (step: number): string => {
  switch (step) {
    case 1:
      return 'Información Cliente'
    case 2:
      return 'Información Carga'
    case 3:
      return 'Calculos'

    default:
      return ''
  }
}
const totalCbm = computed(() => {
  return proveedores.value.reduce((sum, proveedor) => sum + proveedor.cbm, 0)
})

const totalItems = computed(() => {
  return proveedores.value.reduce((sum, proveedor) => sum + proveedor.productos.length, 0)
})

// Computed para cálculos de proveedores
const proveedoresResumen = computed(() => {
  return proveedores.value.map(proveedor => ({
    id: proveedor.id,
    qtyCajas: proveedor.qtyCaja || 0,
    peso: proveedor.peso || 0,
    cbm: proveedor.cbm || 0,
    productos: proveedor.productos.map(producto => ({
      id: producto.id,
      nombre: producto.nombre || '-',
      precio: producto.precio || 0,
      cantidad: producto.cantidad || 0,
      valorFOB: (producto.precio || 0) * (producto.cantidad || 0)
    }))
  }))
})

// Total de cajas
const totalCajas = computed(() => {
  return proveedores.value.reduce((sum, p) => sum + (p.qtyCaja || 0), 0)
})

// Total de peso
const totalPeso = computed(() => {
  return proveedores.value.reduce((sum, p) => sum + (p.peso || 0), 0)
})

// Total valor FOB
const totalValorFOB = computed(() => {
  return proveedores.value.reduce((sum, p) =>
    sum + p.productos.reduce((sumProd, prod) =>
      sumProd + (prod.precio || 0) * (prod.cantidad || 0), 0
    ), 0
  )
})

// Distribución por producto
const distribucionPorProducto = computed(() => {
  const total = totalValorFOB.value
  if (total <= 0) return []

  return proveedores.value.flatMap(proveedor =>
    proveedor.productos.map(producto => ({
      proveedorId: proveedor.id,
      productoId: producto.id,
      porcentaje: ((producto.precio || 0) * (producto.cantidad || 0) / total * 100).toFixed(0)
    }))
  )
})

// Cálculos de flete y seguro
const fletePorProducto = computed(() => {
  return proveedores.value.flatMap(proveedor =>
    proveedor.productos.map(producto => ({
      proveedorId: proveedor.id,
      productoId: producto.id,
      valor: (producto.precio || 0) * (producto.cantidad || 0)
    }))
  )
})

const seguroPorProducto = computed(() => {
  return proveedores.value.flatMap(proveedor =>
    proveedor.productos.map(producto => ({
      proveedorId: proveedor.id,
      productoId: producto.id,
      valor: producto.precio || 0
    }))
  )
})

// Total de flete
const totalFlete = computed(() => {
  return fletePorProducto.value.reduce((sum, item) => sum + item.valor, 0)
})

// Total de seguro
const totalSeguro = computed(() => {
  return seguroPorProducto.value.reduce((sum, item) => sum + item.valor, 0)
})

// Cálculos de CFR y CIF
const valorCFRPorProducto = computed(() => {
  return proveedores.value.flatMap(proveedor =>
    proveedor.productos.map(producto => ({
      proveedorId: proveedor.id,
      productoId: producto.id,
      valor: ((producto.precio || 0) * (producto.cantidad || 0)) * 2
    }))
  )
})

const valorCIFPorProducto = computed(() => {
  return proveedores.value.flatMap(proveedor =>
    proveedor.productos.map(producto => ({
      proveedorId: proveedor.id,
      productoId: producto.id,
      valor: ((producto.precio || 0) * (producto.cantidad || 0)) * 2 + (producto.precio || 0)
    }))
  )
})

// Totales de CFR y CIF
const totalCFR = computed(() => {
  return valorCFRPorProducto.value.reduce((sum, item) => sum + item.valor, 0)
})

const totalCIF = computed(() => {
  return valorCIFPorProducto.value.reduce((sum, item) => sum + item.valor, 0)
})

// Cálculos de tributos
const antidumpingPorProducto = computed(() => {
  return proveedores.value.flatMap(proveedor =>
    proveedor.productos.map(producto => ({
      proveedorId: proveedor.id,
      productoId: producto.id,
      valor: ((producto.precio || 0) * (producto.cantidad || 0)) * 0.01
    }))
  )
})

const igvPorProducto = computed(() => {
  return proveedores.value.flatMap(proveedor =>
    proveedor.productos.map(producto => ({
      proveedorId: proveedor.id,
      productoId: producto.id,
      valor: (((producto.precio || 0) * (producto.cantidad || 0)) * 2 + (producto.precio || 0)) * 0.16
    }))
  )
})

// Totales de tributos
const totalAntidumping = computed(() => {
  return antidumpingPorProducto.value.reduce((sum, item) => sum + item.valor, 0)
})

const totalIGV = computed(() => {
  return igvPorProducto.value.reduce((sum, item) => sum + item.valor, 0)
})

const totalTributos = computed(() => {
  return totalAntidumping.value + totalIGV.value
})

const finalizarCalculadora = () => {
  // Aquí puedes implementar la lógica para finalizar la calculadora
  // Por ejemplo, enviar los datos a un servidor, mostrar un resumen, etc.
  alert('Calculadora finalizada exitosamente!')
}

// Validar cantidad de proveedores
watch(() => clienteInfo.value.qtyProveedores, (newValue) => {
  if (newValue < 1) {
    clienteInfo.value.qtyProveedores = 1
  } else if (newValue > 6) {
    clienteInfo.value.qtyProveedores = 6
  }
})
</script>
