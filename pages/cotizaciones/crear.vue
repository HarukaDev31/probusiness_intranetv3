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
                    required
                    class="w-full" />
                </UFormField>
              </div>
  
              <div>
                <UFormField label="DNI" name="dni">
                  <UInput class="w-full" v-model="clienteInfo.dni" type="text" />
                </UFormField>
              </div>
  
              <div>
                <UFormField label="WhatsApp" name="whatsapp">
                  <UInputMenu v-model="clienteInfo.whatsapp" required :items="clientes" placeholder="Buscar whatsapp..."
                    class="flex-1 w-full" @update:searchTerm="getClientesByWhatsapp"
                    @update:model-value="onClienteSelected" />
  
                </UFormField>
              </div>
  
              <div>
                <UFormField label="Correo" name="correo">
                  <UInput class="w-full" v-model="clienteInfo.correo" type="email" />
                </UFormField>
              </div>
  
              <div>
                <UFormField label="Qty Proveedores" name="qtyProveedores">
                  <UInput class="w-full" v-model="clienteInfo.qtyProveedores" type="number" required :min="1" :max="6"
                    placeholder="1-6 proveedores" size="md" variant="outline" />
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
              <div v-for="(proveedor, index) in proveedores" :key="proveedor.id" class="border-t pt-6">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-semibold ">
                    <span>{{ proveedor.id }} Proveedor</span>
                    <UButton v-if="index + 1 > MAX_PROVEEDORES" color="warning" variant="soft" size="sm"
                      @click="proveedor.extraProveedor = 1" class="ml-2">
                      <UIcon name="i-heroicons-plus" class="w-5 h-5" />
                      {{ formatCurrency(TARIFA_EXTRA_PROVEEDOR) }}
                    </UButton>
                  </h3>
                  <UButton @click="removeProveedor(proveedor.id)" color="error" variant="outline"
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
                          {{ index + 1 > getExtraItem(proveedor.cbm).item_base ? 'Extra ' + formatCurrency(getExtraItem(proveedor.cbm).tarifa) : '' }}
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
                      <UInput class="w-full" v-model.number="producto.precio" type="number" step="0.01" min="0"
                        placeholder="0.00" size="md" variant="outline" />
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
                        <UInput class="w-full" v-model.number="producto.valoracion" type="number" min="0" placeholder="0"
                          size="md" variant="outline" />
                      </div>
  
                    </div>
                    <div class="flex justify-end">
                      <div class="flex space-x-2">
  
                        <UButton @click="producto.showValoracion = !producto.showValoracion" color="primary"
                          variant="soft" size="sm" icon="i-heroicons-cog-6-tooth" />
                        <UButton @click="removeProducto(proveedor.id, producto.id)" color="error" variant="soft" size="sm"
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
  
  
          </div>
  
          <!-- Step 4: Cálculos Finales -->
          <div v-if="currentStep === 3">
  
  
  
            <!-- Tabla de Cálculos -->
            <div class="overflow-x-auto">
              <table class="w-full  ">
                <thead>
  
                </thead>
                <tbody>
                  <tr>
                    <td class=" ">Tipo de cliente</td>
                    <td class=" text-center " :colspan="proveedores.length">
                      <USelect v-model="clienteInfo.tipoCliente" :items="tarifasSelect" item-value="value"
                        item-title="label" placeholder="Selecciona un tipo de cliente" />
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">N. Proveedor</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center"
                      :colspan="proveedor.productos.length">
                      {{ proveedor.id }}
                    </td>
                    <td class=" text-center ">
                      {{ proveedores.length }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Qty Cajas</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center"
                      :colspan="proveedor.productos.length">
                      <UInput class="w-full" v-model.number="proveedor.qtyCaja" type="number" min="0" placeholder="0"
                        size="md" variant="outline" />
                    </td>
                    <td class=" text-center ">
                      {{ totalCajas }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Peso</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center"
                      :colspan="proveedor.productos.length">
                      <UInput class="w-full" v-model.number="proveedor.peso" type="number" min="0" placeholder="0"
                        size="md" variant="outline" />
                    </td>
                    <td class=" text-center ">
                      {{ totalPeso }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Vol. x Prov.</td>
                    <td v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center"
                      :colspan="proveedor.productos.length">
                      <UInput class="w-full" v-model.number="proveedor.cbm" type="number" min="0" placeholder="0"
                        size="md" variant="outline" />
                    </td>
                    <td class=" text-center ">
                      {{ totalCbm }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Nombre</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput class="w-full" v-model="producto.nombre" type="text" placeholder="Nombre del producto"
                          size="md" variant="outline" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      Total
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Valor unitario</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput class="w-full" v-model.number="producto.precio" type="number" step="0.01" min="0"
                          placeholder="0.00" size="md" variant="outline" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      -
                    </td>
                  </tr>
                  <tr v-if="existsValoracion">
                    <td class=" ">Valor Ajustado</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput class="w-full" v-model.number="producto.valoracion" type="number" min="0" placeholder="0"
                          size="md" variant="outline" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      -
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Cantidad</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        <UInput class="w-full" v-model.number="producto.cantidad" type="number" min="0" placeholder="0"
                          size="md" variant="outline" />
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ totalItems }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Valor FOB</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center ">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center ">
                        {{ (producto.precio * producto.cantidad || 0).toFixed(2) }}
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ totalValorFOB.toFixed(2) }}
                    </td>
                  </tr>
                  <tr v-if="existsValoracion">
                    <td class=" ">Ajustado FOB</td>
  
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        {{ (producto.valoracion * producto.cantidad || 0).toFixed(2) }}
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ totalValorFOBAjustado.toFixed(2) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Distribución %</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        {{ totalValorFOB > 0 ? ((producto.precio * producto.cantidad || 0) / totalValorFOB *
                          100).toFixed(0) : 0 }}%
                      </td>
                    </template>
                    <td class=" text-center ">
                      100%
                    </td>
                  </tr>
                  <tr>
                    <td class=" px-4 py-2">Flete</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).flete) }}
                      </td>
                    </template>
                    <td class=" text-center">
                      {{ formatCurrency(getTotals(proveedores, selectedTarifa).flete) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Valor CFR</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center ">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center ">
                        {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).cfr) }}
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ formatCurrency(getTotals(proveedores, selectedTarifa).cfr) }}
                    </td>
                  </tr>
                  <tr v-if="existsValoracion">
                    <td class=" ">Ajustado CFR</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center ">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center ">
                        {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).cfrAjustado) }}
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ formatCurrency(getTotals(proveedores, selectedTarifa).cfrAjustado) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" px-4 py-2">Seguro</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).seguro) }}
                      </td>
                    </template>
                    <td class=" text-center">
                      {{ formatCurrency(totalSeguro) }}
                    </td>
                  </tr>
                  <tr>
                    <td class=" ">Valor CIF</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).cif) }}
                      </td>
                    </template>
                    <td class=" text-center ">
                      {{ formatCurrency(getTotals(proveedores, selectedTarifa).cif) }}
                    </td>
                  </tr>
                  <tr v-if="existsValoracion">
                    <td class=" ">Ajustado CIF</td>
                    <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                      <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                        {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).cifAjustado) }}
                      </td>
                    </template>
                    <td class=" text-center ">
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
                          <UInput class="w-full" v-model.number="producto.antidumpingCU" type="number" min="0"
                            placeholder="0" size="md" variant="outline" />
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
                          {{ formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).antidumping)
                          }}
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
                          <UInput class="w-full" v-model.number="producto.adValoremP" type="number" min="0"
                            placeholder="0" size="md" variant="outline" />
                        </td>
                      </template>
                      <td class=" text-center ">
                      </td>
                    </tr>
                    <tr>
                      <td class=" ">Ad Valorem</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).adValorem) }}
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
                          {{ formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).igv) }}
                        </td>
                      </template>
                      <td class=" text-center ">
                        {{ totalIGV.toFixed(2) }}
                      </td>
                    </tr>
                    <tr>
                      <td class=" ">IPM 2%</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).ipm) }}
                        </td>
                      </template>
                      <td class=" text-center ">
                        $0.00
                      </td>
                    </tr>
                    <tr>
                      <td class=" ">Percepción 3.5%</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).percepcion) }}
                        </td>
                      </template>
                      <td class=" text-center ">
                        {{ formatCurrency(getTributos(proveedores, selectedTarifa).totalPercepcion) }}
                      </td>
                    </tr>
                    <tr>
                      <td class=" ">Total</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center ">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center ">
                          {{ formatCurrency(getTributosPorProducto(proveedores, selectedTarifa, producto).total) }}
                        </td>
                      </template>
                      <td class=" text-center ">
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
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ (getPorDistribucion(proveedores, selectedTarifa, producto).distribucion * 100).toFixed(2)
                          }}%
                        </td>
                      </template>
                      <td class=" text-center">100%</td>
                    </tr>
                    <tr>
                      <td class=" ">Item</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).costoDestino) }}
                        </td>
  
                      </template>
                      <td class=" text-center">
                        {{ formatCurrency(getTotals(proveedores, selectedTarifa).costoDestino) }}
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
                          {{ producto.nombre }}
                        </td>
                      </template>
                      <td class=" text-center"></td>
                    </tr>
                    <tr>
                      <td class=" ">Costo total</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).costoTotal) }}
                        </td>
  
                      </template>
                      <td class=" text-center">
                        {{ formatCurrency(getTotals(proveedores, selectedTarifa).costoTotal) }}
                      </td>
                    </tr>
  
                    <tr>
                      <td class=" ">Cantidad</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ producto.cantidad }}
                        </td>
  
                      </template>
                      <td class=" text-center">
                        {{ totalItems }}
                      </td>
                    </tr>
                    <tr>
                      <td class=" ">Costo unit. usd</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).costoUSD) }}
                        </td>
  
                      </template>
                      <td class=" text-center">
                        {{ formatCurrency(getTotals(proveedores, selectedTarifa).costoUSD) }}
                      </td>
                    </tr>
                    <tr>
                      <td class=" ">Costo unit. pen</td>
                      <template v-for="proveedor in proveedores" :key="proveedor.id" class=" text-center">
                        <td v-for="producto in proveedor.productos" :key="producto.id" class=" text-center">
                          {{ formatCurrency(getPorDistribucion(proveedores, selectedTarifa, producto).costoPEN) }}
                        </td>
  
                      </template>
                      <td class=" text-center">
                        {{ formatCurrency(getTotals(proveedores, selectedTarifa).costoPEN) }}
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
  
          <UButton v-else @click="handleEndFormulario" color="primary" size="lg" icon="i-heroicons-arrow-right"
            :label="'Finalizar'">
            Finalizar
          </UButton>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useCalculadoraImportacion } from '~/composables/useCalculadoraImportacion'
  import type { Proveedor, Tarifa, ProductoItem } from '~/types/calculadora-importacion'
  
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
    handleEndFormulario
  } = useCalculadoraImportacion()
  
  const onClienteSelected = (cliente: any) => {
    clienteInfo.value.nombre = cliente.nombre || ''
    clienteInfo.value.dni = cliente.documento || ''
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
  
  const getDisabledByRangeItem = (proveedor: Proveedor) => {
    const totalCbm = proveedor.cbm;
    const tarifa = TARIFAS_EXTRA_ITEM_PER_CBM.find(tarifa => {
      console.log(totalCbm, tarifa.limit_inf, tarifa.limit_sup)
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
  
  const calcularDistribucionBase = (proveedores: Proveedor[], tarifa: Tarifa) => {
    const TC = 3.7;
    const FLETE_PORCENTAJE = 0.6;
    const COSTO_DESTINO_PORCENTAJE = 0.4;
  
    const cbm = proveedores.reduce((sum, proveedor) => sum + proveedor.cbm, 0);
  
    let costoServicio = 0;
    if (tarifa.type === 'STANDARD') {
      costoServicio = cbm * tarifa.tarifa;
    } else if (tarifa.type === 'PLAIN') {
      costoServicio = tarifa.tarifa;
    }
  
    const fleteTotal = costoServicio * FLETE_PORCENTAJE;
    const cfr = totalValorFOB.value + fleteTotal;
    const cfrAjustado = totalValorFOBAjustado.value + fleteTotal;
    const cif = cfr + totalSeguro.value;
    const costoDestino = totalValorFOB.value * COSTO_DESTINO_PORCENTAJE;
    const cifAjustado = cfrAjustado + totalSeguro.value;
    return {
      flete: fleteTotal,
      cbm,
      cfr,
      cif,
      costoDestino,
      costoServicio,
      cfrAjustado,
      cifAjustado,
      seguro: totalSeguro.value
    };
  };
  
  // Función para calcular tributos por producto sin dependencia circular
  const getTributosPorProducto = (proveedores: Proveedor[], tarifa: Tarifa, producto: ProductoItem) => {
    const IGV = 0.16;
    const IPM = 0.02;
    const PERCEPCION = 0.035;
  
    // Calculamos la distribución base una sola vez
    const { cif, flete, seguro } = calcularDistribucionBase(proveedores, tarifa);
    const valorFob = producto.precio * producto.cantidad;
    const valorFobAjustado = producto.valoracion * producto.cantidad;
    const distribucion = valorFob / totalValorFOB.value;
    const fleteDistribuido = flete * distribucion;
    const cifDistribuido = cif * distribucion;
    const seguroDistribuido = seguro * distribucion;
    const cifAjustadoDistribuido = valorFobAjustado > 0 ? valorFobAjustado + fleteDistribuido + seguroDistribuido : cifDistribuido;
    const maxCif = Math.max(cifDistribuido, cifAjustadoDistribuido);
    const antidumping = producto.antidumpingCU * producto.cantidad;
    const adValorem = maxCif * producto.adValoremP / 100;
    const igv = (maxCif * IGV) + (adValorem * IGV);
    const ipm = (maxCif * IPM) + (adValorem * IPM);
    const percepcion = (maxCif * PERCEPCION) + (adValorem * PERCEPCION) + (igv * PERCEPCION) + (ipm * PERCEPCION);
    const total = adValorem + igv + ipm + percepcion;
  
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
    const sumAntidumping = proveedores.reduce((sum, proveedor) =>
      sum + proveedor.productos.reduce((sumProd, prod) =>
        sumProd + prod.antidumpingCU * prod.cantidad, 0), 0);
  
    // Calculamos tributos por producto
    const tributosPorProducto = proveedores.flatMap(proveedor =>
      proveedor.productos.map(producto => getTributosPorProducto(proveedores, tarifa, producto))
    );
  
    return {
      totalAntidumping: sumAntidumping,
      totalAdValorem: tributosPorProducto.reduce((sum, item) => sum + item.adValorem, 0),
      totalIGV: tributosPorProducto.reduce((sum, item) => sum + item.igv, 0),
      totalIPM: tributosPorProducto.reduce((sum, item) => sum + item.ipm, 0),
      totalPercepcion: tributosPorProducto.reduce((sum, item) => sum + item.percepcion, 0),
      total: tributosPorProducto.reduce((sum, item) => sum + item.total, 0)
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
    const TC = 3.7;
  
    // Obtenemos los valores base sin dependencias circulares
    const { flete, cfr, cif, costoDestino, cfrAjustado } = calcularDistribucionBase(proveedores, tarifa);
  
    // Calculamos tributos para este producto específico
    const { antidumping, total } = getTributosPorProducto(proveedores, tarifa, producto);
  
    const valorFob = producto.precio * producto.cantidad;
    const valorFobAjustado = producto.valoracion * producto.cantidad;
    const distribucion = valorFob / totalValorFOB.value;
  
    // Distribución proporcional
    const cfrDistribuido = cfr * distribucion;
    const cifDistribuido = cif * distribucion;
    const costoDestinoDistribuido = costoDestino * distribucion;
    const seguroDistribuido = totalSeguro.value * distribucion;
    const fleteDistribuido = flete * distribucion;
    const cfrAjustadoDistribuido = valorFobAjustado > 0 ? valorFobAjustado + fleteDistribuido : cfrDistribuido;
    const cifAjustadoDistribuido = valorFobAjustado > 0 ? valorFobAjustado + fleteDistribuido + seguroDistribuido : cifDistribuido;
    const costoTotal = cfrDistribuido + antidumping + total;
    const costoUSD = producto.cantidad === 0 ? 0 : costoTotal / producto.cantidad;
    const costoPEN = costoUSD * TC;
  
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
    const TC = 3.7;
  
    const { totalAntidumping, total } = getTributos(proveedores, tarifa);
    const { flete, cbm, cfr, cif, costoDestino, cfrAjustado, cifAjustado } = calcularDistribucionBase(proveedores, tarifa);
  
    const costoTotal = cfr + totalAntidumping + total;
    const costoUSD = totalItems.value === 0 ? 0 : costoTotal / totalItems.value;
    const costoPEN = costoUSD * TC;
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
  
  // Validar cantidad de proveedores
  watch(() => clienteInfo.value.qtyProveedores, (newValue) => {
    if (newValue < 1) {
      clienteInfo.value.qtyProveedores = 1
    } else if (newValue > 6) {
      clienteInfo.value.qtyProveedores = 6
    }
  })
  onMounted(async () => {
    await getClientesByWhatsapp('')
    await getTarifas()
  })
  </script>
  