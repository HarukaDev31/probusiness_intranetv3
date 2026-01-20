<template>
  <div class="min-h-screen ">
    <div class="max-w-6xl mx-auto ">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">
          Calculadora de Importación
        </h1>
        <p class="text-lg ">
          Edite todos los pasos para guardar su cotización de importación
        </p>
      </div>

      <!-- Stepper -->
      <UCard class="mb-8">
        <div class="flex items-center justify-center">
          <div class="flex items-center space-x-4">
            <div v-for="step in totalSteps" :key="step" class="flex items-center">
              <div 
                @click="handleStepClick(step)" 
                class="flex flex-col items-center cursor-pointer group"
                :class="{ 'cursor-not-allowed opacity-50': !canGoToStep(step) }"
              >
                <!-- Step Label -->
                <div :class="[
                  'text-sm font-medium transition-colors mb-2 group-hover:text-green-700',
                  currentStep >= step ? 'text-green-600' : 'text-gray-500'
                ]">
                  {{ getStepLabel(step) }}
                </div>
                <!-- Step Circle -->
                <div :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all',
                  currentStep >= step
                    ? 'bg-green-600 text-white group-hover:bg-green-700 group-hover:scale-110'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 group-hover:scale-110'
                ]">
                  {{ step }}
                </div>
              </div>

              <!-- Connector Line -->
              <div v-if="step < totalSteps" :class="[
                'w-16 h-0.5 transition-colors mx-4 mt-6',
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

          <!-- Selección de tipo de cliente -->
          <div class="mb-8">
            <h3 class="text-xl font-semibold mb-4">Escoge el tipo de cliente:</h3>
            <div class="flex gap-4">
              <button 
                @click="clienteInfo.tipoDocumento = 'DNI'"
                :class="[
                  'px-8 py-3 rounded-full font-semibold transition-all',
                  clienteInfo.tipoDocumento === 'DNI' 
                    ? 'bg-orange-500 text-white shadow-lg' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-500'
                ]"
              >
                DNI
              </button>
              <button 
                @click="clienteInfo.tipoDocumento = 'RUC'"
                :class="[
                  'px-8 py-3 rounded-full font-semibold transition-all',
                  clienteInfo.tipoDocumento === 'RUC' 
                    ? 'bg-orange-500 text-white shadow-lg' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-500'
                ]"
              >
                RUC
              </button>
            </div>
          </div>

          <!-- Campos para DNI -->
          <div v-if="clienteInfo.tipoDocumento === 'DNI'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <UFormField name="nombre">
                <template #label>
                  Nombre completo: <span class="text-red-500">*</span>
                </template>
                <UInput v-model="clienteInfo.nombre" type="text" placeholder="" required
                  class="w-full" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Dni:" name="dni">
                <UInput class="w-full" v-model="clienteInfo.dni" type="text" placeholder="" />
              </UFormField>
            </div>

            <div>
              <UFormField name="whatsapp">
                <template #label>
                  WhatsApp <span class="text-red-500">*</span>
                </template>
                <UInputMenu v-model="selectedCliente" required :items="clientes" placeholder="51 934 958 839"
                    class="flex-1 w-full" @update:searchTerm="getClientesByWhatsapp"
                    @update:model-value="onClienteSelected">
                    {{ displayWhatsapp }}
                  </UInputMenu>
              </UFormField>
            </div>

            <div>
              <UFormField label="Correo:" name="correo">
                <UInput class="w-full" v-model="clienteInfo.correo" type="email" placeholder="" />
              </UFormField>
            </div>

            <div>
              <UFormField name="qtyProveedores">
                <template #label>
                  Qty Proveedores <span class="text-red-500">*</span>
                </template>
                <UInput class="w-full" v-model.number="clienteInfo.qtyProveedores" type="number" required :min="1" :max="6"
                  placeholder="" size="md" variant="outline" @blur="() => { if (!clienteInfo.qtyProveedores || clienteInfo.qtyProveedores < 1) clienteInfo.qtyProveedores = 1 }" />
              </UFormField>
            </div>
          </div>

          <!-- Campos para RUC -->
          <div v-else-if="clienteInfo.tipoDocumento === 'RUC'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <UFormField name="empresa">
                <template #label>
                  Empresa: <span class="text-red-500">*</span>
                </template>
                <UInput v-model="clienteInfo.empresa" type="text" placeholder="Grupo Chijuakay SAC" required
                  class="w-full" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Ruc:" name="ruc">
                <UInput class="w-full" v-model="clienteInfo.ruc" type="text" placeholder="" />
              </UFormField>
            </div>

            <div>
              <UFormField name="whatsapp">
                <template #label>
                  WhatsApp <span class="text-red-500">*</span>
                </template>
                <UInputMenu v-model="selectedCliente" required :items="clientes" placeholder="51 934 958 839"
                  class="flex-1 w-full" @update:searchTerm="getClientesByWhatsapp"
                  @update:model-value="onClienteSelected">
                  {{ displayWhatsapp }}
                </UInputMenu>
              </UFormField>
            </div>

            <div>
              <UFormField label="Correo:" name="correo">
                <UInput class="w-full" v-model="clienteInfo.correo" type="email" placeholder="" />
              </UFormField>
            </div>

            <div>
              <UFormField name="qtyProveedores">
                <template #label>
                  Qty Proveedores <span class="text-red-500">*</span>
                </template>
                <UInput class="w-full" v-model.number="clienteInfo.qtyProveedores" type="number" required :min="1" :max="6"
                  placeholder="" size="md" variant="outline" @blur="() => { if (!clienteInfo.qtyProveedores || clienteInfo.qtyProveedores < 1) clienteInfo.qtyProveedores = 1 }" />
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
              <div class="px-3 py-1 rounded-md">
                <span class="font-medium">Total Cajas:</span> {{ totalCajas }}
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div v-for="(proveedor, index) in proveedores" :key="proveedor.id" class="border-t pt-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold ">
                  <span>Proveedor #{{ proveedor.id }} </span>
                  <UButton v-if="index + 1 > MAX_PROVEEDORES" color="warning" variant="soft" size="sm"
                    @click="proveedor.extraProveedor = 1" class="ml-2">
                    <UIcon name="i-heroicons-plus" class="w-5 h-5" />
                    {{ formatCurrency(TARIFA_EXTRA_PROVEEDOR) }}
                  </UButton>
                </h3>
                <UButton v-if="proveedores.length > 1" @click="confirmDeleteProveedor(proveedor.id)" color="error" variant="outline"
                  title="Eliminar proveedor">
                  <UIcon name="i-heroicons-trash" class="w-5 h-5" />
                </UButton>
                <div>
                  <label class="block text-sm font-medium  mb-2">
                    CBM Total <span class="text-red-500">*</span>
                  </label>
                  <UInput class="w-full" v-model.number="proveedor.cbm" type="number" step="0.1" min="0"
                    placeholder="0.0" size="md" variant="outline" />
                </div>

                <div>
                  <label class="block text-sm font-medium  mb-2">
                    Peso Total
                  </label>
                  <UInput class="w-full" v-model.number="proveedor.peso" type="number" min="0" placeholder="0" size="md"
                    variant="outline" />
                </div>

                <div>
                  <label class="block text-sm font-medium  mb-2">
                    Qty Cajas
                  </label>
                  <UInput class="w-full" v-model.number="proveedor.qtyCaja" type="number" min="0" placeholder="0"
                    size="md" variant="outline" />
                </div>
              </div>


              <!-- Lista de Productos -->
              <div class="space-y-4">
                <h4 class="text-md font-medium ">Productos del Proveedor</h4>

                <div v-for="(producto, index) in proveedor.productos" :key="producto.id"
                  class="grid grid-cols-1 gap-4 p-4 rounded-lg items-center" :class="{
                    'md:grid-cols-11': !producto.showValoracion,
                    'md:grid-cols-12': producto.showValoracion
                  }">
                  <div class="col-span-1">
                    <label class="block text-sm font-medium  mb-2">
                      <UBadge color="warning" variant="soft" size="sm">
                        {{ index + 1 }}
                        {{ index + 1 > getExtraItem(proveedor.cbm).item_base ? 'Extra ' +
                          formatCurrency(getExtraItem(proveedor.cbm).tarifa) : '' }}
                      </UBadge>
                    </label>
                  </div>
                  <div class="col-span-4">

                    <label class="block text-sm font-medium  mb-2">
                      Nombre del producto <span class="text-red-500">*</span>
                    </label>
                    <UInput class="w-full" v-model="producto.nombre" type="text" placeholder="Nombre del producto"
                      size="md" variant="outline" />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium  mb-2">
                      Precio <span class="text-red-500">*</span>
                    </label>
                    <UInput class="w-full" v-model.number="producto.precio" type="number" step
                      placeholder="0.00" size="md" variant="outline">
                      <template #leading>
                        <span class="text-gray-500">$</span>
                      </template>
                    </UInput>
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium  mb-2">
                      Cantidad <span class="text-red-500">*</span>
                    </label>
                    <div class="flex space-x-2">
                      <UInput class="w-full" v-model.number="producto.cantidad" type="number" min="0" placeholder="0"
                        size="md" variant="outline" />
                    </div>
                  </div>

                  <div v-if="producto.showValoracion" class="col-span-2">
                    <div>
                      <label class="block text-sm font-medium  mb-2">
                        P.Ajuste
                      </label>
                      <UInput class="w-full" v-model.number="producto.valoracion" type="number" step="0.01" min="0" placeholder="0.00"
                        size="md" variant="outline">
                        <template #leading>
                          <span class="text-gray-500">$</span>
                        </template>
                      </UInput>
                    </div>

                  </div>
                  <div class="flex justify-end">
                    <div class="flex space-x-2">

                      <UButton @click="producto.showValoracion = !producto.showValoracion" color="primary"
                        variant="soft" size="sm" icon="i-heroicons-cog-6-tooth" />
                      <UButton v-if="proveedor.productos.length > 1" @click="confirmDeleteProducto(proveedor.id, producto.id)" color="error" variant="soft" size="sm"
                        icon="i-heroicons-trash" title="Eliminar producto" />
                    </div>
                  </div>
                </div>
              </div>

              <UButton @click="addProducto(proveedor.id)" :disabled="getDisabledByRangeItem(proveedor)"
                class="bg-orange-500  rounded-md hover:bg-orange-600 transition-colors">
                + item
              </UButton>
            </div>

            <UButton @click="addProveedor" color="success" size="sm"
              :disabled="proveedores.length >= MAX_PROVEEDORES + MAX_PROVEEDORES_EXTRA">
              + Agregar Proveedor
            </UButton>
          </div>
        </div>

        <!-- Step 3: Resumen -->
        <div v-if="currentStep === 3">
          <h2 class="text-2xl font-bold mb-6">Resumen</h2>
          
          <!-- Información del Cliente -->
          <div class="flex gap-8 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-700 dark:text-gray-300">Cliente:</span>
              <div class="w-72">
                <UInput :value="clienteInfo.tipoDocumento === 'RUC' ? clienteInfo.empresa : clienteInfo.nombre" class="w-full" disabled size="md" variant="outline" />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-700 dark:text-gray-300">WhatsApp:</span>
              <div class="w-48">
                <UInput :value="clienteInfo.whatsapp" class="w-full" disabled size="md" variant="outline" />
              </div>
            </div>
            <!--tarifa actual-->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-700 dark:text-gray-300">Tarifa actual:</span>
              <div class="w-32">
                <UInput :value="formatCurrency(selectedTarifa?.tarifa || 0)" class="w-full" disabled size="md" variant="outline" />
              </div>
            </div>
            <!--tipo de cambio-->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-700 dark:text-gray-300">T.C.: <span class="text-red-500">*</span></span>
              <div class="w-24">
                <UInput v-model.number="tipoCambio" type="number" step="0.01" min="0" placeholder="3.70" class="w-full" size="md" variant="outline" />
              </div>
            </div>
          </div>

        </div>

        <!-- Step 4: Cálculos Finales -->
        <div v-if="currentStep === 3">



          <!-- Tabla de Cálculos -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>

              </thead>
              <tbody>
                <tr>
                  <td class="bg-red-500 dark:bg-red-700 text-white font-semibold px-4 py-2">Tipo de cliente:</td>
                  <td class="text-center px-4 py-2" :colspan="proveedores.length">
                    <div class="flex items-center gap-4">
                      <USelect v-model="clienteInfo.tipoCliente" :items="tarifasSelect" item-value="value"
                        item-title="label" placeholder="Selecciona un tipo de cliente" class="flex-1 max-w-xs" />
                      <template v-if="selectedTarifa && selectedTarifa.label === 'MANUAL'">
                        <div class="flex flex-col items-start">
                          <UInput v-model.number="selectedTarifa.tarifa" type="number" min="0" placeholder="Tarifa manual" class="w-32" required />
                          <span v-if="!selectedTarifa.tarifa || selectedTarifa.tarifa <= 0" class="text-red-500 text-xs">La tarifa manual es obligatoria</span>
                        </div>
                      </template>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">N. Proveedor</td>
                  <td v-for="proveedor in proveedores" :key="proveedor.id" class="text-center px-4 py-2"
                    :colspan="proveedor.productos.length">
                    {{ proveedor.id }}
                  </td>
                  <td class="bg-blue-500 dark:bg-blue-700 text-white font-semibold text-center px-4 py-2">
                    Total
                  </td>
                </tr>
                <tr>
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Qty Cajas</td>
                  <td v-for="proveedor in proveedores" :key="proveedor.id" class="text-center"
                    :colspan="proveedor.productos.length">
                    <UInput class="w-full" v-model.number="proveedor.qtyCaja" type="number" min="0" placeholder="0"
                      size="md" variant="outline" :ui="{ base: 'text-center'}" />
                  </td>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ totalCajas }}
                  </td>
                </tr>
                <tr>
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Peso</td>
                  <td v-for="proveedor in proveedores" :key="proveedor.id" class="text-center"
                    :colspan="proveedor.productos.length">
                    <UInput class="w-full" v-model.number="proveedor.peso" type="number" min="0" placeholder="0"
                      size="md" variant="outline" :ui="{ base: 'text-center'}" />
                  </td>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ totalPeso }}
                  </td>
                </tr>
                <tr>
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Vol. x Prov.</td>
                  <td v-for="proveedor in proveedores" :key="proveedor.id" class="text-center"
                    :colspan="proveedor.productos.length">
                    <UInput class="w-full" v-model.number="proveedor.cbm" type="number" min="0" placeholder="0"
                      size="md" variant="outline" :ui="{ base: 'text-center'}" />
                  </td>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ totalCbm }}
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-2">Productos</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      <UInput class="w-full" v-model="producto.nombre" type="text" placeholder="Nombre del producto"
                        size="md" variant="outline" :ui="{ base: 'text-center'}" />
                    </td>
                  </template>
                  <td class="bg-blue-500 dark:bg-blue-700 text-white font-semibold text-center px-4 py-2">
                    Total
                  </td>
                </tr>
                <tr>
                  <td class="bg-primary text-white font-semibold px-4 py-2">Valor unitario</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      <UInput class="w-full" v-model.number="producto.precio" type="number" step="0.01" min="0"
                        placeholder="0.00" size="md" variant="outline" :ui="{ base: 'text-center'}">
                        <template #leading>
                          <span class="text-gray-500">$</span>
                        </template>
                      </UInput>
                    </td>
                  </template>
                </tr>
                <tr v-if="existsValoracion">
                  <td class="bg-primary text-white font-semibold px-4 py-2">Valor Ajustado</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                      <UInput class="w-full" v-model.number="producto.valoracion" type="number" step="0.01" min="0" placeholder="0.00"
                        size="md" variant="outline" :ui="{ base: 'text-center'}">
                        <template #leading>
                          <span class="text-gray-500">$</span>
                        </template>
                      </UInput>
                    </td>
                  </template>
                </tr>
                <tr>
                  <td class="bg-primary text-white font-semibold px-4 py-2">Cantidad</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      <UInput class="w-full" v-model.number="producto.cantidad" type="number" min="0" placeholder="0"
                        size="md" variant="outline" :ui="{ base: 'text-center'}" />
                    </td>
                  </template>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ totalItems }}
                  </td>
                </tr>
                <tr>
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Valor FOB</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      {{ (producto.precio * producto.cantidad || 0).toFixed(2) }}
                    </td>
                  </template>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ totalValorFOB.toFixed(2) }}
                  </td>
                </tr>
                <tr v-if="existsValoracion">
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Ajustado FOB</td>

                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                      {{ (producto.valoracion * producto.cantidad || 0).toFixed(2) }}
                    </td>
                  </template>
                  <td class=" text-center bg-blue-100 dark:bg-blue-400 px-4 py-2">
                    {{ totalValorFOBAjustado.toFixed(2) }}
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-2">Distribución %</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      <UInput :value="totalValorFOB > 0 ? ((producto.precio * producto.cantidad || 0) / totalValorFOB * 100).toFixed(0) + '%' : '0%'" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </template>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    100%
                  </td>
                </tr>
                <tr>
                  <td class="bg-primary text-white font-semibold px-4 py-2">Flete</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      <UInput :value="formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).flete)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </template>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ formatCurrency(getTotals(proveedores, selectedTarifa).flete) }}
                  </td>
                </tr>
                <tr>
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Valor CFR</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      <UInput :value="formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).cfr)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </template>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ formatCurrency(getTotals(proveedores, selectedTarifa).cfr) }}
                  </td>
                </tr>
                <tr v-if="existsValoracion">
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Ajustado CFR</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center ">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center ">
                      <UInput :value="formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).cfrAjustado)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </template>
                  <td class=" text-center bg-blue-100 dark:bg-blue-400 px-4 py-2">
                    {{ formatCurrency(getTotals(proveedores, selectedTarifa).cfrAjustado) }}
                  </td>
                </tr>
                <tr>
                  <td class="bg-primary text-white font-semibold px-4 py-2">Seguro</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      <UInput :value="formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).seguro)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </template>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ formatCurrency(totalSeguro) }}
                  </td>
                </tr>
                <tr>
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Valor CIF</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class="text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class="text-center">
                      <UInput :value="formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).cif)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </template>
                  <td class="bg-blue-100 dark:bg-blue-400 text-center px-4 py-2">
                    {{ formatCurrency(getTotals(proveedores, selectedTarifa).cif) }}
                  </td>
                </tr>
                <tr v-if="existsValoracion">
                  <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Ajustado CIF</td>
                  <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                    <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                      {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).cifAjustado) }}
                    </td>
                  </template>
                  <td class=" text-center bg-blue-100 dark:bg-blue-400 px-4 py-2">
                    {{ formatCurrency(getTotals(proveedores, selectedTarifa).cifAjustado) }}
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
                    <th class=" text-left"></th>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <th v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput class="w-full text-center" v-model.number="producto.antidumpingCU" type="number" min="0"
                                                  placeholder="0" size="md" color="primary" :ui="{ base: 'bg-primary text-white text-center placeholder-white/70' }" >
                                                  <template #leading>
                                                    <span class="text-white">$</span>
                                                  </template>
                                                </UInput>
                      </th>
                    </template>
                    <th class=" text-center"></th>
                  </tr>
                </thead>
                <tbody>

                  <tr>
                    <td class=" ">Antidumping</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput :value="formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).antidumping)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ formatCurrency(getTributos(proveedores, selectedTarifa).totalAntidumping) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" "></td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput class="w-full text-white" v-model.number="producto.adValoremP" type="number" min="0"
                                                  placeholder="0" size="md" color="primary" :ui="{ base: 'bg-primary text-white text-center placeholder-white/70' }" >
                                                  <template #leading>
                                                    <span class="text-white">%</span>
                                                  </template>
                                                </UInput>
                      </td>
                    </template>
                    <td class=" text-center ">
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Ad Valorem</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput :value="formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).adValorem)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ formatCurrency(getTributos(proveedores, selectedTarifa).totalAdValorem) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">IGV 16%</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput :value="formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).igv)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ formatCurrency(totalIGV) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">IPM 2%</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput :value="formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).ipm)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ formatCurrency(getTributos(proveedores, selectedTarifa).totalIPM || 0) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Percepción 3.5%</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput :value="formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).percepcion)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ formatCurrency(getTributos(proveedores, selectedTarifa).totalPercepcion) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="bg-gray-200 dark:bg-gray-700 font-semibold px-4 py-2">Total</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center ">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center bg-gray-200 dark:bg-gray-700 font-semibold">
                        {{ formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).total) }}
                      </td>
                    </template>
                    <td class=" text-center bg-gray-200 dark:bg-gray-700 font-semibold">
                      {{ formatCurrency(getTributos(proveedores, selectedTarifa).total) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <!-- Costos destinos -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold  mb-4">Costos Destinos</h3>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse ">

                <tbody>
                  <tr>
                    <td class=" "></td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class="bg-gray-200 dark:bg-gray-700 text-center">
                        {{ (getPorDistribucion(proveedores, selectedTarifa, producto).distribucion * 100).toFixed(2) + '%' }}
                      </td>
                    </template>
                    <td class=" text-center bg-gray-200 dark:bg-gray-700">
                      100%
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Item</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center bg">
                        <UInput :value="formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).costoDestino)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>

                    </template>
                    <td class=" text-center">
                      <UInput :value="formatCurrency(getTotals(proveedores, selectedTarifa).costoDestino)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <!-- Costos total de Importacion -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold  mb-4">Costos Total de Importacion</h3>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse ">

                <tbody>
                  <tr>
                    <td class=" ">Item</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput :value="producto.nombre" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>
                    </template>
                    <td class=" text-center"></td>
                  </tr>
                  <tr>
                    <td class=" ">Costo total</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput :value="formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).costoTotal)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>

                    </template>
                    <td class=" text-center">
                      <UInput :value="formatCurrency(getTotals(proveedores, selectedTarifa).costoTotal)" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </tr>

                  <tr>
                    <td class=" ">Cantidad</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput :value="producto.cantidad" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                      </td>

                    </template>
                    <td class=" text-center">
                      <UInput :value="totalItems" class="w-full" disabled size="md" variant="outline" :ui="{ base: 'text-center' }" />
                    </td>
                  </tr>
                  <tr>
                    <td class="bg-gray-200 dark:bg-gray-700">Costo unit. usd</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center bg-gray-200 dark:bg-gray-700">
                          {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).costoUSD) }}
                        </td>

                    </template>
                    <td class=" text-center bg-gray-200 dark:bg-gray-700">
                      {{ formatCurrency(getTotals(proveedores, selectedTarifa).costoUSD) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="bg-primary text-white">Costo unit. pen</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center bg-primary text-white">
                        {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).costoPEN) }}
                      </td>

                    </template>
                    <td class=" text-center bg-primary text-white">
                      {{ formatCurrency(getTotals(proveedores, selectedTarifa).costoPEN) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Step 4: Terminar -->
        <div v-if="currentStep === 4">
          <h2 class="text-2xl font-bold mb-6">Terminar</h2>

          <div class="space-y-6">
            <!-- Cantidad proveedores -->
            <div class="grid grid-cols-2 gap-4 items-center">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Cantidad proveedores:
                </label>
                <UInput :modelValue="proveedores.length" type="number" disabled class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">
                  Tarifa adicional (opcional):
                </label>
                <UInput v-model.number="tarifaExtraProveedorManual" type="number" step="0.01" min="0"
                  placeholder="0.00" class="w-full">
                  <template #leading>
                    <span class="text-gray-500">$</span>
                  </template>
                </UInput>
              </div>
            </div>

            <!-- Cantidad Items -->
            <div class="grid grid-cols-2 gap-4 items-center">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Cantidad items:
                </label>
                <UInput :modelValue="totalItems" type="number" disabled class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">
                  Tarifa adicional (opcional):
                </label>
                <UInput v-model.number="tarifaExtraItemManual" type="number" step="0.01" min="0"
                  placeholder="0.00" class="w-full">
                  <template #leading>
                    <span class="text-gray-500">$</span>
                  </template>
                </UInput>
              </div>
            </div>

            <!-- Descuento -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Descuento (opcional):
              </label>
              <UInput v-model.number="tarifaDescuento" type="number" step="0.01" min="0"
                placeholder="0.00" class="w-full max-w-md">
                <template #leading>
                  <span class="text-gray-500">$</span>
                </template>
              </UInput>
            </div>

            <!-- Selecciona el vendedor -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Selecciona el vendedor: <span class="text-red-500">*</span>
              </label>
              <USelect v-model="selectedVendedor" :items="vendedores" placeholder="Seleccionar" 
                class="w-full max-w-md" />
            </div>

            <!-- Selecciona el consolidado -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Selecciona el consolidado: <span class="text-red-500">*</span>
              </label>
              <USelect v-model="selectedContenedor" :items="contenedores" placeholder="Seleccionar"
                class="w-full max-w-md" />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Navigation -->
      <div class="flex justify-between items-center my-6">
        <UButton @click="prevStep" :disabled="!canGoPrev" color="primary" size="lg" icon="i-heroicons-arrow-left"
          :label="'Anterior'">

        </UButton>

        <div class="text-center">
          <span class="">Paso {{ currentStep }} de {{ totalSteps }}</span>
        </div>

        <UButton v-if="currentStep < totalSteps" 
          @click="nextStep" 
          :disabled="
            (currentStep === 3 && selectedTarifa && selectedTarifa.label === 'MANUAL' && (!selectedTarifa.tarifa || selectedTarifa.tarifa <= 0)) ||
            !canGoNext
          "
          color="primary" 
          size="lg"
          icon="i-heroicons-arrow-right" 
          :label="'Siguiente'">

        </UButton>

        <UButton v-else 
          @click="saveCotizacion()" 
          color="primary" 
          size="lg" 
          icon="i-heroicons-arrow-right"
          :label="'Finalizar'"
          :disabled="
            !selectedVendedor || 
            !selectedContenedor || 
            (selectedTarifa && selectedTarifa.label === 'MANUAL' && (!selectedTarifa.tarifa || selectedTarifa.tarifa <= 0))
          "
        >
          Finalizar
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navigateTo } from '#imports'
import { useCalculadoraImportacion } from '~/composables/useCalculadoraImportacion'
import type { Proveedor, Tarifa, ProductoItem } from '~/types/calculadora-importacion'
import { useSpinner } from '@/composables/commons/useSpinner'
import { useModal } from '@/composables/commons/useModal'
const { withSpinner } = useSpinner()
const { showSuccess, showError, showConfirmation } = useModal()

const selectedCliente = ref<any>(null)
const displayWhatsapp = computed(() => {
  return clienteInfo.value.whatsapp || ''
})

const {
  currentStep,
  totalSteps,
  clienteInfo,
  proveedores,
  nextStep,
  prevStep,
  goToStep,
  addProveedor,
  removeProveedor,
  addProducto,
  removeProducto,
  isStepValid,
  canGoNext,
  canGoPrev,
  getClientesByWhatsapp,
  getTarifas,
  clientes,
  tarifas,
  tipoClientes,
  tarifasSelect,
  totalItems,
  totalCbm,
  selectedTarifa,
  MAX_PROVEEDORES,
  MAX_PROVEEDORES_EXTRA,
  TARIFA_EXTRA_PROVEEDOR,
  TARIFAS_EXTRA_ITEM_PER_CBM,
  handleEndFormulario,
  handleChangeToStep2,
  vendedores,
  contenedores,
  tarifaDescuento,
  tarifaExtraProveedorManual,
  tarifaExtraItemManual,
  tipoCambio,
  calculatedExtraProveedores,
  calculatedExtraItems,
  selectedVendedor,
  selectedContenedor,
  fetchVendedores,
  fetchContenedores
  , loadCotizacionById
} = useCalculadoraImportacion()
const saveCotizacion = async () => {
  if (selectedTarifa && selectedTarifa.value && selectedTarifa.value.label === 'MANUAL' && (!selectedTarifa.value.tarifa || selectedTarifa.value.tarifa <= 0)) {
    showError('La tarifa manual es obligatoria y debe ser mayor a 0', 'error')
    return
  }
  if (!selectedVendedor) {
    showError('Debes seleccionar un vendedor', 'error')
    return
  }
  if (!selectedContenedor) {
    showError('Debes seleccionar un consolidado', 'error')
    return
  }
  try {
    await withSpinner(async () => {
      const response = await handleEndFormulario()
      if (response.success) {
        showSuccess('Cotización creada correctamente', 'success')
        navigateTo('/cotizaciones')
      } else {
        showError('Error al crear la cotización', 'error')
      }
    })
  } catch (error) {
    showError('Error al crear la cotización', 'error')
  }
}

const onClienteSelected = (cliente: any) => {
  if (cliente && typeof cliente === 'object') {
    clienteInfo.value.nombre = cliente.nombre || ''
    clienteInfo.value.dni = cliente.documento || ''
    clienteInfo.value.correo = cliente.correo || ''
    clienteInfo.value.empresa = cliente.razon_social || cliente.empresa || ''
    clienteInfo.value.ruc = cliente.ruc || ''
    
    // Guardar el whatsapp como string
    const whatsappValue = cliente.whatsapp || cliente.celular || cliente.label || ''
    clienteInfo.value.whatsapp = whatsappValue
    selectedCliente.value = cliente
  }
}
const getStepLabel = (step: number): string => {
  switch (step) {
    case 1:
      return 'Datos'
    case 2:
      return 'Carga'
    case 3:
      return 'Costo'
    case 4:
      return 'Terminar'
    default:
      return ''
  }
}

const canGoToStep = (step: number): boolean => {
  // Siempre puedes ir al paso 1
  if (step === 1) return true

  // Solo puedes ir a un paso si todos los pasos anteriores están completos
  for (let i = 1; i < step; i++) {
    if (!isStepValid(i)) {
      return false
    }
  }

  // Para el paso 4, validar también la tarifa manual si corresponde
  if (step === 4 && selectedTarifa?.value && selectedTarifa.value.label === 'MANUAL' && (!selectedTarifa.value.tarifa || selectedTarifa.value.tarifa <= 0)) {
    return false
  }

  return true
}

const handleStepClick = (step: number) => {
  // No permitir navegar si no se puede ir a ese step
  if (!canGoToStep(step)) {
    return
  }
  
  // Si estamos en el paso 1 y queremos ir al 2, ejecutar la lógica de cambio
  if (currentStep.value === 1 && step === 2) {
    if (!isStepValid(1)) {
      showError('Por favor complete todos los campos requeridos', 'error')
      return
    }
    handleChangeToStep2()
  }
  
  // Si estamos en el paso 2 y queremos ir al 3, validar
  if (currentStep.value === 2 && step === 3) {
    if (!isStepValid(2)) {
      showError('Por favor complete la información de la carga correctamente', 'error')
      return
    }
  }
  
  // Si estamos en el paso 3 y queremos ir al 4, validar
  if (currentStep.value === 3 && step === 4) {
    if (!isStepValid(3)) {
      showError('Por favor complete los cálculos correctamente', 'error')
      return
    }
  }
  
  // Navegar al step
  goToStep(step)
}

const confirmDeleteProveedor = (proveedorId: string) => {
  showConfirmation(
    'Eliminar Proveedor',
    '¿Está seguro que desea eliminar este proveedor? Esta acción no se puede deshacer.',
    () => removeProveedor(proveedorId)
  )
}

const confirmDeleteProducto = (proveedorId: string, productoId: string) => {
  showConfirmation(
    'Eliminar Producto',
    '¿Está seguro que desea eliminar este producto? Esta acción no se puede deshacer.',
    () => removeProducto(proveedorId, productoId)
  )
}


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
const totalValorFOBAjustado = computed(() => {
  //if showValoracion is true, then use valoracion, otherwise use precio
  return proveedores.value.reduce((sum, p) =>
    sum + p.productos.reduce((sumProd, prod) =>
      sumProd + (prod.showValoracion ? (prod.valoracion || 0) * (prod.cantidad || 0) : (prod.precio || 0) * (prod.cantidad || 0)), 0
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

// Estados de colapso para las secciones del paso 3
const collapsedSections = ref({
  calculos: false,
  tributos: false,
  costosDestino: false,
  costosTotal: false
})

const getDisabledByRangeItem = (proveedor: Proveedor) => {
  const totalCbm = proveedor.cbm;
  const tarifa = TARIFAS_EXTRA_ITEM_PER_CBM.find(tarifa => {
    
    return totalCbm >= tarifa.limit_inf && totalCbm <= tarifa.limit_sup
  })
  return proveedor.productos.length >= tarifa?.item_base + tarifa?.item_extra ? true : false
}
const getExtraItem = (cbm: number) => {
  const tarifa = TARIFAS_EXTRA_ITEM_PER_CBM.find(tarifa => {
    return cbm >= tarifa.limit_inf && cbm <= tarifa.limit_sup
  })
  return {
    item_base: tarifa?.item_base,
    item_extra: tarifa?.item_extra,
    tarifa: tarifa?.tarifa
  }
}
// Total de flete
const totalFlete = computed(() => {
  return fletePorProducto.value.reduce((sum, item) => sum + item.valor, 0)
})
const totalSeguro = computed(() => {
  return totalValorFOB.value > 5000 ? 100 : 50
})
// Total de seguro

const round2 = (value: number) => Math.round(value * 100) / 100;

const calcularDistribucionBase = (proveedores: Proveedor[], tarifa: Tarifa) => {
  const FLETE_PORCENTAJE = 0.6;
  const COSTO_DESTINO_PORCENTAJE = 0.4;

  const cbm = proveedores.reduce((sum, proveedor) => sum + proveedor.cbm, 0);

  // Validación defensiva
  if (!tarifa || typeof tarifa !== 'object') {
    return {
      flete: 0,
      cbm,
      cfr: 0,
      cif: 0,
      costoDestino: 0,
      costoServicio: 0,
      cfrAjustado: 0,
      cifAjustado: 0,
      seguro: 0
    };
  }

  let costoServicio = 0;
  if (tarifa.type === 'STANDARD') {
    costoServicio = cbm * tarifa.tarifa;
  } else if (tarifa.type === 'PLAIN') {
    costoServicio = tarifa.tarifa;
  }

  const fleteTotal = round2(costoServicio * FLETE_PORCENTAJE);
  const cfr = round2(totalValorFOB.value + fleteTotal);
  const cfrAjustado = round2(totalValorFOBAjustado.value + fleteTotal);
  const seguro = round2(totalSeguro.value);
  const cif = round2(cfr + seguro);
  const costoDestino = round2(costoServicio * COSTO_DESTINO_PORCENTAJE);
  const cifAjustado = round2(cfrAjustado + seguro);
  return {
    flete: fleteTotal,
    cbm: round2(cbm),
    cfr,
    cif,
    costoDestino,
    costoServicio: round2(costoServicio),
    cfrAjustado,
    cifAjustado,
    seguro
  };
};

// Función para calcular tributos por producto sin dependencia circular
const getTributosPorProducto = (proveedores: Proveedor[], tarifa: Tarifa, producto: ProductoItem) => {
  const IGV = 0.16;
  const IPM = 0.02;
  const PERCEPCION = 0.035;

  // Calculamos la distribución base una sola vez
  const { cif, flete, seguro } = calcularDistribucionBase(proveedores, tarifa);
  const valorFob = round2(producto.precio * producto.cantidad);
  const valorFobAjustado = round2(producto.valoracion * producto.cantidad);
  const distribucion = totalValorFOB.value > 0 ? round2(valorFob / totalValorFOB.value) : 0;
  const fleteDistribuido = round2(flete * distribucion);
  const cifDistribuido = round2(cif * distribucion);
  const seguroDistribuido = round2(seguro * distribucion);
  const cifAjustadoDistribuido = round2(valorFobAjustado > 0 ? valorFobAjustado + fleteDistribuido + seguroDistribuido : cifDistribuido);
  const maxCif = round2(Math.max(cifDistribuido, cifAjustadoDistribuido));
  const antidumping = round2(producto.antidumpingCU * producto.cantidad);
  const adValorem = round2(maxCif * producto.adValoremP / 100);
  const igv = round2((maxCif * IGV) + (adValorem * IGV));
  const ipm = round2((maxCif * IPM) + (adValorem * IPM));
  const percepcion = round2((maxCif * PERCEPCION) + (adValorem * PERCEPCION) + (igv * PERCEPCION) + (ipm * PERCEPCION));
  const total = round2(adValorem + igv + ipm + percepcion);

  return {
    antidumping,
    adValorem,
    igv,
    ipm,
    percepcion,
    total
  };
};

// Función para obtener totales de tributos
const getTributos = (proveedores: Proveedor[], tarifa: Tarifa) => {
  const sumAntidumping = round2(proveedores.reduce((sum, proveedor) =>
    sum + proveedor.productos.reduce((sumProd, prod) =>
      sumProd + prod.antidumpingCU * prod.cantidad, 0), 0));

  // Calculamos tributos por producto
  const tributosPorProducto = proveedores.flatMap(proveedor =>
    proveedor.productos.map(producto => getTributosPorProducto(proveedores, tarifa, producto))
  );

  return {
    totalAntidumping: sumAntidumping,
    totalAdValorem: round2(tributosPorProducto.reduce((sum, item) => sum + item.adValorem, 0)),
    totalIGV: round2(tributosPorProducto.reduce((sum, item) => sum + item.igv, 0)),
    totalIPM: round2(tributosPorProducto.reduce((sum, item) => sum + item.ipm, 0)),
    totalPercepcion: round2(tributosPorProducto.reduce((sum, item) => sum + item.percepcion, 0)),
    total: round2(tributosPorProducto.reduce((sum, item) => sum + item.total, 0))
  };
};
//computed exists valoracion
const existsValoracion = computed(() => {
  return proveedores.value.some(proveedor =>
    proveedor.productos.some(producto => producto.showValoracion === true)
  )
})
// Función principal refactorizada
const getPorDistribucion = (proveedores: Proveedor[], tarifa: Tarifa, producto: ProductoItem) => {
  // Obtenemos los valores base sin dependencias circulares
  const { flete, cfr, cif, costoDestino, cfrAjustado } = calcularDistribucionBase(proveedores, tarifa);

  // Calculamos tributos para este producto específico
  const { antidumping, total } = getTributosPorProducto(proveedores, tarifa, producto);

  const valorFob = round2(producto.precio * producto.cantidad);
  const valorFobAjustado = round2(producto.valoracion * producto.cantidad);
  const distribucion = totalValorFOB.value > 0 ? round2(valorFob / totalValorFOB.value) : 0;

  // Distribución proporcional
  const cfrDistribuido = round2(cfr * distribucion);
  const cifDistribuido = round2(cif * distribucion);
  const costoDestinoDistribuido = round2(costoDestino * distribucion);
  const seguroDistribuido = round2(totalSeguro.value * distribucion);
  const fleteDistribuido = round2(flete * distribucion);
  const cfrAjustadoDistribuido = round2(valorFobAjustado > 0 ? valorFobAjustado + fleteDistribuido : cfrDistribuido);
  const cifAjustadoDistribuido = round2(valorFobAjustado > 0 ? valorFobAjustado + fleteDistribuido + seguroDistribuido : cifDistribuido);
  const costoTotal = round2(cfrDistribuido + antidumping + total);
  const costoUSD = round2(producto.cantidad === 0 ? 0 : costoTotal / producto.cantidad);
  const costoPEN = round2(costoUSD * tipoCambio.value);

  return {
    flete: fleteDistribuido,
    seguro: seguroDistribuido,
    cif: cifDistribuido,
    costoDestino: costoDestinoDistribuido,
    cfr: cfrDistribuido,
    costoUSD,
    costoPEN,
    distribucion,
    costoTotal,
    cfrAjustado: cfrAjustadoDistribuido,
    cifAjustado: cifAjustadoDistribuido
  };
};

// Función getTotals actualizada
const getTotals = (proveedores: Proveedor[], tarifa: Tarifa) => {
  const { totalAntidumping, total } = getTributos(proveedores, tarifa);
  const { flete, cbm, cfr, cif, costoDestino, cfrAjustado, cifAjustado } = calcularDistribucionBase(proveedores, tarifa);

  const costoTotal = round2(cfr + totalAntidumping + total);
  const costoUSD = round2(totalItems.value === 0 ? 0 : costoTotal / totalItems.value);
  const costoPEN = round2(costoUSD * tipoCambio.value);
  return {
    flete,
    cbm,
    cfr,
    cif,
    costoDestino,
    costoUSD,
    costoPEN,
    costoTotal,
    cfrAjustado,
    cifAjustado
  };
};
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

  alert('Calculadora finalizada exitosamente!')
}

// Validar cantidad de proveedores - solo cuando el valor es numérico válido
watch(() => clienteInfo.value.qtyProveedores, (newValue) => {
  // Solo validar si el valor es un número válido (no null, undefined, o NaN)
  if (newValue === null || newValue === undefined || typeof newValue !== 'number' || isNaN(newValue)) {
    return // Permitir valores inválidos mientras se escribe
  }
  
  if (newValue < 1) {
    clienteInfo.value.qtyProveedores = 1
  } else if (newValue > 6) {
    clienteInfo.value.qtyProveedores = 6
  }
})
const route = useRoute()
const rawId = route.params.id
const cotizacionId = Number(Array.isArray(rawId) ? rawId[0] : (rawId ?? 0))

onMounted(async () => {
  await getClientesByWhatsapp('')
  await getTarifas()
  // Si hay un id, cargar la cotización desde el composable
  if (cotizacionId) {
    try {
      await withSpinner(async () => {
        await loadCotizacionById(cotizacionId)
      })
    } catch (err) {
      showError('Error al cargar la cotización', 'error')
    }
  }
      // Si el composable cargó el whatsapp pero no hay cliente seleccionado,
      // intentar encontrar el objeto correspondiente en `clientes` para
      // que `UInputMenu` muestre la opción correcta.
      if (clienteInfo.value.whatsapp && !selectedCliente.value) {
        const w = String(clienteInfo.value.whatsapp)
        const found = (clientes.value || []).find((c: any) => {
          const cand = String(c.whatsapp || c.telefono || c.celular || c.label || c.whatsapp_cliente || '')
          return cand === w || cand.includes(w)
        })
        if (found) {
          selectedCliente.value = found
        } else {
          selectedCliente.value = { label: w, whatsapp: w }
        }
      }
  // fetchVendedores y fetchContenedores solo en step 4
})

// Solo cargar vendedores y contenedores al llegar al paso 4
watch(currentStep, async (step) => {
  if (step === 4) {
    await fetchVendedores()
    await fetchContenedores()
  }
})
</script>
<style scoped>
/**style table add spacing between rows */
table {
  border-spacing: 8px 4px;
  border-collapse: separate;
}
table td {
  padding: 10px;
  border-radius: 8px;
}
table th {
  padding: 10px;
  border-radius: 8px;
}

</style>