<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">
          Calculadora de Importación
        </h1>
        <p class="text-lg text-gray-600">
          Complete todos los pasos para obtener su cotización de importación
        </p>
      </div>

      <!-- Stepper -->
      <div class="mb-8">
        <div class="flex items-center justify-center">
          <div class="flex items-center space-x-4">
            <div
              v-for="step in totalSteps"
              :key="step"
              class="flex items-center"
            >
              <!-- Step Circle -->
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-colors',
                  currentStep >= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                ]"
              >
                {{ step }}
              </div>
              
              <!-- Step Label -->
              <div
                :class="[
                  'ml-3 text-sm font-medium transition-colors',
                  currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                ]"
              >
                {{ getStepLabel(step) }}
              </div>

              <!-- Connector Line -->
              <div
                v-if="step < totalSteps"
                :class="[
                  'w-16 h-0.5 transition-colors',
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                ]"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
        <!-- Step 1: Información del Cliente -->
        <div v-if="currentStep === 1">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            Información del Cliente
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del cliente <span class="text-red-500">*</span>
              </label>
              <input
                v-model="clienteInfo.nombre"
                type="text"
                placeholder="Ingrese el nombre completo"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                DNI <span class="text-red-500">*</span>
              </label>
              <input
                v-model="clienteInfo.dni"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp <span class="text-red-500">*</span>
              </label>
              <input
                v-model="clienteInfo.whatsapp"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Correo <span class="text-red-500">*</span>
              </label>
              <input
                v-model="clienteInfo.correo"
                type="email"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Qty Proveedores <span class="text-red-500">*</span>
              </label>
              <input
                v-model="clienteInfo.qtyProveedores"
                type="number"
                min="1"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readonly
              />
            </div>
          </div>
        </div>

        <!-- Step 2: Información de la Carga -->
        <div v-if="currentStep === 2">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">
              Información de la Carga
            </h2>
            <div class="flex space-x-4 text-sm">
              <div class="bg-blue-100 px-3 py-1 rounded-md">
                <span class="font-medium">Total Cbm:</span> {{ calculosFinales.totalCbm.toFixed(1) }}
              </div>
              <div class="bg-blue-100 px-3 py-1 rounded-md">
                <span class="font-medium">Total Items:</span> {{ calculosFinales.totalItems }}
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div
              v-for="proveedor in proveedores"
              :key="proveedor.id"
              class="border-t pt-6"
            >
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-700">
                  {{ proveedor.id }}) Proveedor
                </h3>
                <button
                  @click="removeProveedor(proveedor.id)"
                  class="text-red-500 hover:text-red-700 p-2"
                  title="Eliminar proveedor"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>

              <div
                v-for="producto in proveedor.productos"
                :key="producto.id"
                class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4"
              >
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del producto <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="producto.nombre"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Cbm <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="producto.cbm"
                    type="number"
                    step="0.1"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Peso
                  </label>
                  <input
                    v-model.number="producto.peso"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Qty Caja
                  </label>
                  <input
                    v-model.number="producto.qtyCaja"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Precio <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="producto.precio"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad <span class="text-red-500">*</span>
                  </label>
                  <div class="flex space-x-2">
                    <input
                      v-model.number="producto.cantidad"
                      type="number"
                      min="0"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      @click="removeProducto(proveedor.id, producto.id)"
                      class="text-red-500 hover:text-red-700 p-2"
                      title="Eliminar producto"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <button
                @click="addProducto(proveedor.id)"
                class="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                + item
              </button>
            </div>

            <button
              @click="addProveedor"
              class="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              + Agregar Proveedor
            </button>
          </div>
        </div>

        <!-- Step 3: Resumen -->
        <div v-if="currentStep === 3">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Resumen</h2>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Información del Cliente -->
            <div class="bg-gray-50 p-6 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">Información del Cliente</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">Nombre:</span>
                  <span class="font-medium">{{ clienteInfo.nombre }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">DNI:</span>
                  <span class="font-medium">{{ clienteInfo.dni }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">WhatsApp:</span>
                  <span class="font-medium">{{ clienteInfo.whatsapp }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Correo:</span>
                  <span class="font-medium">{{ clienteInfo.correo }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Proveedores:</span>
                  <span class="font-medium">{{ clienteInfo.qtyProveedores }}</span>
                </div>
              </div>
            </div>

            <!-- Resumen de Carga -->
            <div class="bg-gray-50 p-6 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-700 mb-4">Resumen de Carga</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">Total CBM:</span>
                  <span class="font-medium">{{ calculosFinales.totalCbm.toFixed(1) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Total Items:</span>
                  <span class="font-medium">{{ calculosFinales.totalItems }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Valor FOB:</span>
                  <span class="font-medium">${{ calculosFinales.valorFOB.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista de Productos -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Productos por Proveedor</h3>
            <div class="space-y-4">
              <div
                v-for="proveedor in proveedores"
                :key="proveedor.id"
                class="border rounded-lg p-4"
              >
                <h4 class="font-medium text-gray-700 mb-2">Proveedor {{ proveedor.id }}</h4>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div
                    v-for="producto in proveedor.productos"
                    :key="producto.id"
                    class="bg-white p-3 rounded border"
                  >
                    <div class="font-medium text-sm">{{ producto.nombre }}</div>
                    <div class="text-xs text-gray-600">
                      CBM: {{ producto.cbm }} | Cantidad: {{ producto.cantidad }} | Precio: ${{ producto.precio }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Cálculos Finales -->
        <div v-if="currentStep === 4">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Cálculos Finales</h2>
          
          <!-- Botón para calcular -->
          <div class="mb-6">
            <button
              @click="calcularTotales"
              class="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              Calcular Totales
            </button>
          </div>

          <!-- Tabla de Cálculos -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border border-gray-300 px-4 py-2 text-left">Concepto</th>
                  <th
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    {{ proveedor.id }}
                  </th>
                  <th class="border border-gray-300 px-4 py-2 text-center bg-blue-100">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-50">N. Proveedor</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    {{ proveedor.id }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-gray-50">
                    {{ proveedores.length }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-50">Qty Cajas</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    {{ proveedor.productos.reduce((sum, p) => sum + p.qtyCaja, 0) }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-gray-50">
                    {{ proveedores.reduce((sum, p) => sum + p.productos.reduce((s, prod) => s + prod.qtyCaja, 0), 0) }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-50">Peso</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    {{ proveedor.productos.reduce((sum, p) => sum + p.peso, 0) }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-gray-50">
                    {{ proveedores.reduce((sum, p) => sum + p.productos.reduce((s, prod) => s + prod.peso, 0), 0) }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-50">Vol. x Prov.</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    {{ proveedor.productos.reduce((sum, p) => sum + (p.cbm * p.cantidad), 0).toFixed(1) }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-gray-50">
                    {{ calculosFinales.totalCbm.toFixed(1) }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-50">Nombre</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    {{ proveedor.productos[0]?.nombre || '-' }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-blue-100">
                    Total
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-50">Valor unitario</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    ${{ proveedor.productos[0]?.precio.toFixed(2) || '0.00' }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-gray-50">
                    -
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-50">Cantidad</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    {{ proveedor.productos[0]?.cantidad || 0 }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-gray-50">
                    {{ calculosFinales.totalItems }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-700 text-white">Valor FOB</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center bg-gray-700 text-white"
                  >
                    ${{ (proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0).toFixed(2) }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                    ${{ calculosFinales.valorFOB.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-50">Distribución %</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center"
                  >
                    {{ calculosFinales.valorFOB > 0 ? ((proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0) / calculosFinales.valorFOB * 100).toFixed(0) : 0 }}%
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                    100%
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-orange-100">Flete</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center bg-orange-100"
                  >
                    ${{ (proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0).toFixed(2) }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-orange-100">
                    ${{ calculosFinales.flete.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-700 text-white">Valor CFR</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center bg-gray-700 text-white"
                  >
                    ${{ ((proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0) * 2).toFixed(2) }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                    ${{ calculosFinales.valorCFR.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-orange-100">Seguro</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center bg-orange-100"
                  >
                    ${{ (proveedor.productos[0]?.precio || 0).toFixed(2) }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-orange-100">
                    ${{ calculosFinales.seguro.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-2 bg-gray-700 text-white">Valor CIF</td>
                  <td
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    class="border border-gray-300 px-4 py-2 text-center bg-gray-700 text-white"
                  >
                    ${{ ((proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0) * 2 + (proveedor.productos[0]?.precio || 0)).toFixed(2) }}
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                    ${{ calculosFinales.valorCIF.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tributos Aplicables -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Tributos Aplicables</h3>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-300">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="border border-gray-300 px-4 py-2 text-left">Concepto</th>
                    <th
                      v-for="proveedor in proveedores"
                      :key="proveedor.id"
                      class="border border-gray-300 px-4 py-2 text-center"
                    >
                      {{ proveedor.id }}
                    </th>
                    <th class="border border-gray-300 px-4 py-2 text-center bg-blue-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="border border-gray-300 px-4 py-2 bg-gray-50">Antidumping</td>
                    <td
                      v-for="proveedor in proveedores"
                      :key="proveedor.id"
                      class="border border-gray-300 px-4 py-2 text-center"
                    >
                      ${{ ((proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0) * 0.01).toFixed(2) }}
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                      ${{ calculosFinales.antidumping.toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 px-4 py-2 bg-gray-50">Ad Valorem</td>
                    <td
                      v-for="proveedor in proveedores"
                      :key="proveedor.id"
                      class="border border-gray-300 px-4 py-2 text-center"
                    >
                      <div class="bg-orange-100 px-2 py-1 rounded text-sm">0%</div>
                      $0.00
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                      ${{ calculosFinales.adValorem.toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 px-4 py-2 bg-gray-50">IGV 16%</td>
                    <td
                      v-for="proveedor in proveedores"
                      :key="proveedor.id"
                      class="border border-gray-300 px-4 py-2 text-center"
                    >
                      ${{ (((proveedor.productos[0]?.precio * proveedor.productos[0]?.cantidad || 0) * 2 + (proveedor.productos[0]?.precio || 0)) * 0.16).toFixed(2) }}
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                      ${{ calculosFinales.igv.toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 px-4 py-2 bg-gray-50">IPM 2%</td>
                    <td
                      v-for="proveedor in proveedores"
                      :key="proveedor.id"
                      class="border border-gray-300 px-4 py-2 text-center"
                    >
                      $0.00
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                      ${{ calculosFinales.ipm.toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 px-4 py-2 bg-gray-50">Percepción 3.5%</td>
                    <td
                      v-for="proveedor in proveedores"
                      :key="proveedor.id"
                      class="border border-gray-300 px-4 py-2 text-center"
                    >
                      $0.00
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                      ${{ calculosFinales.percepcion.toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 px-4 py-2 bg-gray-700 text-white">Total</td>
                    <td
                      v-for="proveedor in proveedores"
                      :key="proveedor.id"
                      class="border border-gray-300 px-4 py-2 text-center bg-gray-700 text-white"
                    >
                      $0.00
                    </td>
                    <td class="border border-gray-300 px-4 py-2 text-center bg-white">
                      ${{ calculosFinales.total.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between items-center">
        <button
          @click="prevStep"
          :disabled="!canGoPrev"
          :class="[
            'px-6 py-3 rounded-md transition-colors flex items-center space-x-2',
            canGoPrev
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Anterior</span>
        </button>

        <div class="text-center">
          <span class="text-gray-600">Paso {{ currentStep }} de {{ totalSteps }}</span>
        </div>

        <button
          v-if="currentStep < totalSteps"
          @click="nextStep"
          :disabled="!canGoNext"
          :class="[
            'px-6 py-3 rounded-md transition-colors flex items-center space-x-2',
            canGoNext
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          <span>Siguiente</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          v-else
          @click="finalizarCalculadora"
          class="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          Finalizar
        </button>
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
  canGoPrev
} = useCalculadoraImportacion()

const getStepLabel = (step: number): string => {
  switch (step) {
    case 1:
      return 'Información Cliente'
    case 2:
      return 'Información Carga'
    case 3:
      return 'Resumen'
    case 4:
      return 'Cálculos Finales'
    default:
      return ''
  }
}

const finalizarCalculadora = () => {
  // Aquí puedes implementar la lógica para finalizar la calculadora
  // Por ejemplo, enviar los datos a un servidor, mostrar un resumen, etc.
  alert('Calculadora finalizada exitosamente!')
}
</script>
