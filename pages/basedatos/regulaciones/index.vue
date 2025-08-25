<template>
    <div class="p-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center">
                <UIcon name="i-heroicons-shield-check" class="text-2xl mr-3 text-gray-700 dark:text-gray-300" />
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Regulación aduanera</h1>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
                Gestiona las regulaciones de antidumping, permisos, etiquetado y documentos especiales
            </p>
        </div>
        <div class="border-t border-gray-300 my-4"></div>

        <!-- Navigation Tabs -->
        <div class="mb-6 flex items-center justify-between">
            <div class="flex gap-2 p-2 rounded-lg">
                <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                    'px-5 py-2 rounded-md text-sm font-medium transition-colors',
                    activeTab === tab.id
                    ? 'bg-white dark:bg-gray-400 text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-500 hover:bg-white hover:text-gray-900 dark:hover:bg-gray-400 dark:hover:text-gray-900 outline outline-gray-300'
                ]"
                style="border: none;"
                >
                {{ tab.label }}
                </button>
            </div>
            <UButton
                v-if="hasRole('Documentacion')"
                label="Crear"
                icon="i-heroicons-plus"
                color="primary"
                class="px-6"
                @click="navigateToCreate(activeTab)"
            />
        </div>
        <!-- Modal de crear rubro-->
        <UModal v-model="showCreateModal" :title="getCreateTitle(activeTab)" :triger="true">
            <UButton label="Regulación" icon="i-heroicons-plus" variant="outline"
                @click="showCreateModal = true"
                :loading="getLoading(activeTab)" loading-icon="i-heroicons-plus" />
            <template #body>
                <div class="space-y-4">
                    <div v-if="activeTab === 'antidumping'">
                        <h2 class="text-lg font-semibold mb-4">Crear Producto Antidumping</h2>
                        <!-- Formulario de crear producto antidumping -->
                        <UInput v-model="newProduct.nombre" placeholder="Ej: Zapatillas deportivas" class="w-full" />
                    </div>
                    <div v-else-if="activeTab === 'permisos'">
                        <h2 class="text-lg font-semibold mb-4">Crear Entidad</h2>
                        <!-- Formulario de crear entidad permisos -->
                        <UInput v-model="newEntity.nombre" placeholder="Ej: Nombre de la entidad" class="w-full" />
                    </div>
                    <div v-else-if="activeTab === 'etiquetado'">
                        <h2 class="text-lg font-semibold mb-4">Crear Producto Etiquetado</h2>
                        <!-- Formulario de crear etiquetado -->
                        <UInput v-model="newEtiquetado.nombre" placeholder="Ej: Nombre del producto" class="w-full" />
                    </div>
                    <div v-else-if="activeTab === 'documentos'">
                        <h2 class="text-lg font-semibold mb-4">Crear Documento Especial</h2>
                        <!-- Formulario de crear documento especial -->
                    </div>
                </div>
            </template>

            <template #footer="{ close }">
                <div class="flex justify-end gap-3">
                <UButton label="Cancelar" variant="outline" @click="close" />
                <UButton :label="getCreateButtonLabel(activeTab)" color="primary" @click="() => { handleCreate(activeTab); close(); }"
                />
                </div>
            </template>
        </UModal>

        <!-- Content Container -->
            <!-- Tab Antidumping -->
            <div v-if="activeTab === 'antidumping'">
                <UCard class="bg-transparent ring-0">
                    <div class="flex gap-8 max-w-full">
                        <!-- Lista de rubros/productos -->
                        <div class="w-100 flex flex-col gap-4">
                            <!-- Encabezados -->
                            <div class="flex items-center px-4 py-2 text-gray-500 font-medium gap-4">
                                <span class="w-14 mr-10 text-center">N°</span>
                                <span class="flex-1">Producto</span>
                                <span class="w-20 text-right">Acción</span>
                            </div>
                            <div
                            v-for="rubro in antidumpingData"
                            :key="rubro.id"
                            @click="selectedRubroId = rubro.id"
                            :class="[
                                'flex items-center justify-between px-4 py-6 rounded-lg bg-white dark:bg-gray-800 cursor-pointer transition-all',
                                selectedRubroId === rubro.id ? 'border border-orange-500 shadow' : 'border border-transparent',
                                'hover:border-orange-300 hover:shadow'
                            ]"
                            >
                            <span class="font-bold text-gray-500 w-14 text-center mr-10">{{ rubro.id }}</span>
                            <span class="font-semibold text-gray-800 dark:text-gray-200 flex-1">{{ rubro.nombre }}</span>
                            <div class="flex gap-2">
                                <UButton
                                icon="i-heroicons-pencil-square"
                                variant="ghost"
                                size="xs"
                                color="primary"
                                @click.stop="editRubro(rubro.id)"
                                />
                                <UButton
                                icon="i-heroicons-trash"
                                variant="ghost"
                                size="xs"
                                color="red"
                                @click.stop="deleteRubro(rubro.id)"
                                />
                            </div>
                            </div>
                        </div>
                        <!-- Tabla de regulaciones del rubro seleccionado -->
                        <div class="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <UTable
                            v-if="selectedRubro"
                            :data="selectedRubro.regulaciones"
                            :columns="[
                                { accessorKey: 'id', header: 'N°', cell: ({ row }) => row.index + 1 },
                                { accessorKey: 'descripcion', header: 'Descripción', cell: ({ row }) => row.getValue('descripcion').slice(0, 50) + (row.getValue('descripcion').length > 50 ? '...' : '') },
                                { accessorKey: 'partida', header: 'Partida' },
                                { accessorKey: 'precio_declarado', header: 'P. Declaración', cell: ({ row }) => `$${row.getValue('precio_declarado')}` },
                                { accessorKey: 'antidumping', header: 'Antidumping', cell: ({ row }) => `$${row.getValue('antidumping')}` },
                                {
                                id: 'actions',
                                header: 'Acciones',
                                cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
                                    h(UButton, {
                                    icon: 'i-heroicons-eye',
                                    variant: 'ghost',
                                    size: 'xs',
                                    color: 'blue',
                                    onClick: () => viewRegulationDetail(row.original.id),
                                    title: 'Ver detalle'
                                    }),
                                    h(UButton, {
                                    icon: 'i-heroicons-pencil-square',
                                    variant: 'ghost',
                                    size: 'xs',
                                    color: 'primary',
                                    onClick: () => editRegulation(row.original.id),
                                    title: 'Editar'
                                    }),
                                    h(UButton, {
                                    icon: 'i-heroicons-trash',
                                    variant: 'ghost',
                                    size: 'xs',
                                    color: 'red',
                                    onClick: () => deleteRegulation(row.original.id),
                                    title: 'Eliminar'
                                    })
                                ])
                                }
                            ]"
                            :ui="{ root: 'min-w-full', td: 'py-2 px-3' }"
                            />
                        </div>
                    </div>
                    <!-- Detalle de regulación debajo de la tabla -->
                    <div class="flex gap-8">
                        <div class="w-120">
                        </div>
                        <div
                        v-if="regulationDetail"
                        class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex">
                            <!-- Documentos a presentar -->
                            <div class="w-1/2 pr-6 border-r border-gray-200 dark:border-gray-700">
                                <h4 class="font-semibold mb-4">Imágenes de producto</h4>
                                <div v-if="regulationDetail.imagenes && regulationDetail.imagenes.length">
                                    <div class="flex gap-2 mt-2">
                                    <img v-for="(img, idx) in regulationDetail.imagenes" :key="idx" :src="getImageUrl(img)" class="w-35 h-35 object-cover rounded border cursor-pointer" @click="openImageModal(img)" />
                                    </div>
                                </div>
                                <div v-else class="text-gray-400 text-sm">Sin imagenes</div>
                            </div>
                                <!-- Comentarios -->
                            <div class="w-1/2 pl-6 flex flex-col justify-start">
                                <h4 class="font-semibold mb-4">Observaciones:</h4>
                                <div class="bg-gray-50 dark:bg-gray-900 rounded p-3 text-gray-800 dark:text-gray-200 min-h-[80px]">
                                {{ regulationDetail.observaciones || 'Sin observaciones' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>


            <!-- Tab Permisos -->
            <div v-if="activeTab === 'permisos'">
                <!-- <UCard>
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

                                        <UButton icon="i-heroicons-trash" variant="outline" color="red" size="xs"
                                            @click="deleteEntidad(row.original.id)" />
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
                </UCard> -->
                <UCard class="bg-transparent ring-0">
                    <div class="flex gap-8">
                    <!-- Lista de entidades/rubros -->
                    <div class="w-120 flex flex-col gap-4">
                        <!-- Encabezados -->
                        <div class="flex items-center px-4 py-2 text-gray-500 font-medium gap-4">
                        <span class="w-14 mr-10 text-center">N°</span>
                        <span class="flex-1">Entidad</span>
                        <span class="w-20 text-right">Acción</span>
                        </div>
                        <div
                        v-for="entidad in permisosData"
                        :key="entidad.id"
                        @click="selectedRubroId = entidad.id"
                        :class="[
                            'flex items-center justify-between px-4 py-6 rounded-lg bg-white dark:bg-gray-800 cursor-pointer transition-all',
                            selectedRubroId === entidad.id ? 'border border-orange-500 shadow' : 'border border-transparent',
                            'hover:border-orange-300 hover:shadow'
                        ]"
                        >
                        <span class="font-bold text-gray-500 w-14 text-center mr-10">{{ entidad.id }}</span>
                        <span class="font-semibold text-gray-800 dark:text-gray-200 flex-1">{{ entidad.nombre }}</span>
                        <div class="flex gap-2">
                            <UButton
                            icon="i-heroicons-pencil-square"
                            variant="ghost"
                            size="xs"
                            color="primary"
                            @click.stop="editPermiso(entidad.id)"
                            />
                            <UButton
                            icon="i-heroicons-trash"
                            variant="ghost"
                            size="xs"
                            color="red"
                            @click.stop="deleteEntidad(entidad.id)"
                            />
                        </div>
                        </div>
                    </div>
                    <!-- Tabla de regulaciones de la entidad seleccionada -->
                    <div class="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <UTable
                        v-if="selectedEntidad"
                        :data="selectedEntidad.regulaciones"
                        :columns="[
                            { accessorKey: 'id', header: 'N°', cell: ({ row }) => row.index + 1 },
                            { accessorKey: 'nombre', header: 'Nombre' },
                            { accessorKey: 'c_permiso', header: 'C. Permiso', cell: ({ row }) => `S/.${row.getValue('c_permiso')}` },
                            { accessorKey: 'c_tramitador', header: 'C. Tramitador', cell: ({ row }) => `S/.${row.getValue('c_tramitador')}` },
                            {
                            id: 'actions',
                            header: 'Acciones',
                            cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
                                h(UButton, {
                                icon: 'i-heroicons-eye',
                                variant: 'ghost',
                                size: 'xs',
                                color: 'blue',
                                onClick: () => viewPermisoDetail(row.original.id),
                                title: 'Ver detalle'
                                }),
                                h(UButton, {
                                icon: 'i-heroicons-pencil-square',
                                variant: 'ghost',
                                size: 'xs',
                                color: 'primary',
                                onClick: () => editPermiso(row.original.id),
                                title: 'Editar'
                                }),
                                h(UButton, {
                                icon: 'i-heroicons-trash',
                                variant: 'ghost',
                                size: 'xs',
                                color: 'red',
                                onClick: () => deletePermiso(row.original.id),
                                title: 'Eliminar'
                                })
                            ])
                            }
                        ]"
                        :ui="{ root: 'min-w-full', td: 'py-2 px-3' }"
                        />
                    </div>
                    </div>
                    <!-- Detalle de regulación debajo de la tabla -->
                    <div class="flex gap-8">
                        <div class="w-120">
                        </div>
                        <div
                        v-if="permisoDetail"
                        class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex">
                            <!-- Documentos a presentar -->
                            <div class="w-1/2 pr-6 border-r border-gray-200 dark:border-gray-700">
                                <h4 class="font-semibold mb-4">Documentos a presentar</h4>
                                <div v-if="permisoDetail.documentos && permisoDetail.documentos.length">
                                    <div v-for="(doc, idx) in permisoDetail.documentos" :key="idx" class="flex items-center gap-3 mb-3 p-2 rounded bg-gray-50 dark:bg-gray-900">
                                        <!-- Icono según tipo de archivo -->
                                        <FileIcon :file="{ file_ext: getFileExtension(doc), nombre: doc }" />
                                        <div class="flex-1">
                                            <div class="font-medium text-gray-800 dark:text-gray-200 text-sm truncate break-all max-w-[250px] overflow-hidden">{{ getFileName(doc) }}</div>
                                            <div class="text-xs text-gray-500"></div>
                                        </div>
                                        <UButton
                                        icon="i-heroicons-arrow-down-tray"
                                        size="xs"
                                        variant="ghost"
                                        color="primary"
                                        @click="openDocumentModal(doc)"
                                        aria-label="Descargar"
                                        />
                                    </div>
                                </div>
                                <div v-else class="text-gray-400 text-sm">Sin documentos</div>
                            </div>
                                <!-- Comentarios -->
                            <div class="w-1/2 pl-6 flex flex-col justify-start">
                                <h4 class="font-semibold mb-4">Comentarios</h4>
                                <div class="bg-gray-50 dark:bg-gray-900 rounded p-3 text-gray-800 dark:text-gray-200 min-h-[80px]">
                                {{ permisoDetail.observaciones || 'Sin observaciones' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
            
            </div>

            <!-- Tab Etiquetado -->
            <div v-if="activeTab === 'etiquetado'">
                <!-- <UCard>
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
                                            const imagenes = row.getValue('imagenes') as string[] || []
                                            
                                            if (imagenes.length === 0) {
                                                return h('span', { class: 'text-gray-400 text-sm' }, 'Sin imágenes')
                                            }
                                            
                                            return h('div', { class: 'flex flex-wrap gap-1' }, 
                                                imagenes.slice(0, 3).map((imagen, index) => 
                                                    h('img', {
                                                        src: getImageUrl(imagen),
                                                        alt: `Imagen ${index + 1}`,
                                                        class: 'w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity border border-gray-200',
                                                        onClick: () => openImageModal(imagen)
                                                    })
                                                ).concat(
                                                    imagenes.length > 3 ? [
                                                        h('div', { 
                                                            class: 'w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
                                                            onClick: () => openImageModal(imagenes[3])
                                                        }, `+${imagenes.length - 3}`)
                                                    ] : []
                                                )
                                            )
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
                </UCard> -->
  
                <UCard class="bg-transparent ring-0">
                    <div class="flex gap-8">
                        <!-- Lista de rubros/productos -->
                        <div class="w-120 flex flex-col gap-4">
                            <!-- Encabezados -->
                            <div class="flex items-center px-4 py-2 text-gray-500 font-medium gap-4">
                                <span class="w-14 mr-10 text-center">N°</span>
                                <span class="flex-1">Producto</span>
                                <span class="w-20 text-right">Acción</span>
                            </div>
                            <div
                                v-for="rubro in etiquetadoData"
                                :key="rubro.id"
                                @click="selectedRubroId = rubro.id"
                                :class="[
                                'flex items-center justify-between px-4 py-6 rounded-lg bg-white dark:bg-gray-800 cursor-pointer transition-all',
                                selectedRubroId === rubro.id ? 'border border-orange-500 shadow' : 'border border-transparent',
                                'hover:border-orange-300 hover:shadow'
                                ]"
                            >
                                <span class="font-bold text-gray-500 w-14 text-center mr-10">{{ rubro.id }}</span>
                                <span class="font-semibold text-gray-800 dark:text-gray-200 flex-1">{{ rubro.nombre }}</span>
                                <div class="flex gap-2">
                                <UButton
                                    icon="i-heroicons-pencil-square"
                                    variant="ghost"
                                    size="xs"
                                    color="primary"
                                    @click.stop="editEtiquetado(rubro.id)"
                                />
                                </div>
                            </div>
                        </div>
                        <!-- Tabla de regulaciones del rubro seleccionado -->
                        <div class="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <UTable
                                v-if="selectedEtiquetado"
                                :data="selectedEtiquetado.regulaciones"
                                :columns="[
                                { accessorKey: 'imagenes', header: 'Imágenes', cell: ({ row }) => {
                                    const imagenes = row.getValue('imagenes') || []
                                    if (imagenes.length === 0) {
                                    return h('span', { class: 'text-gray-400 text-sm' }, 'Sin imágenes')
                                    }
                                    return h('div', { class: 'flex flex-wrap gap-1' },
                                    imagenes.slice(0, 3).map((imagen, index) =>
                                        h('img', {
                                        src: getImageUrl(imagen),
                                        alt: `Imagen ${index + 1}`,
                                        class: 'w-30 h-30 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity border border-gray-200',
                                        onClick: () => openImageModal(imagen)
                                        })
                                    ).concat(
                                        imagenes.length > 3 ? [
                                        h('div', {
                                            class: 'w-30 h-30 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
                                            onClick: () => openImageModal(imagenes[3])
                                        }, `+${imagenes.length - 3}`)
                                        ] : []
                                    )
                                    )
                                } },
                                {
                                    accessorKey: 'observaciones',
                                    header: () => h('div', { class: 'flex items-center justify-between' }, [
                                        h('span', { class: 'font-semibold' }, 'Descripciones mínimas'),
                                        h('div', { class: 'flex gap-2' }, [
                                        h(UButton, {
                                            icon: 'i-heroicons-pencil-square',
                                            variant: 'ghost',
                                            size: 'xs',
                                            color: 'primary',
                                            onClick: () => {editEtiquetado(selectedEtiquetado.regulaciones[0]?.id)},
                                            title: 'Editar'
                                        }),
                                        h(UButton, {
                                            icon: 'i-heroicons-trash',
                                            variant: 'ghost',
                                            size: 'xs',
                                            color: 'red',
                                            onClick: () => {deleteEtiquetado(selectedEtiquetado.regulaciones[0]?.id)},
                                            title: 'Eliminar'
                                        })
                                        ])
                                    ]),
                                    cell: ({ row }) => {
                                        const observaciones = row.getValue('observaciones')
                                        return h('div', {
                                        class: 'whitespace-pre-line break-words max-w-[400px]'
                                        }, observaciones)
                                    }
                                }
                                ]"
                                :ui="{ root: 'min-w-full', td: 'py-2 px-3' }"
                            />
                        </div>
                    </div>
                    </UCard>
            </div>

            <!-- Tab Documentos Especiales -->
            <div v-if="activeTab === 'documentos'">
                <!-- <UCard>
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
                </UCard> -->
                <UCard class="bg-transparent ring-0">
                    <div class="flex gap-8">
                        <!-- lista de rubros/productos-->
                        <div class="w-120 flex flex-col gap-4">
                            <!-- Encabezados -->
                            <div class="flex items-center px-4 py-2 text-gray-500 font-medium gap-4">
                                <span class="w-14 mr-10 text-center">N°</span>
                                <span class="flex-1">Producto</span>
                                <span class="w-20 text-right">Acción</span>
                            </div>
                            <div
                                v-for="rubro in documentosData"
                                :key="rubro.id"
                                @click="selectedRubroId = rubro.id"
                                :class="[
                                'flex items-center justify-between px-4 py-6 rounded-lg bg-white dark:bg-gray-800 cursor-pointer transition-all',
                                selectedRubroId === rubro.id ? 'border border-orange-500 shadow' : 'border border-transparent',
                                'hover:border-orange-300 hover:shadow'
                                ]"
                            >
                                <span class="font-bold text-gray-500 w-14 text-center mr-10">{{ rubro.id }}</span>
                                <span class="font-semibold text-gray-800 dark:text-gray-200 flex-1">{{ rubro.nombre }}</span>
                                <div class="flex gap-2">
                                <UButton
                                    icon="i-heroicons-pencil-square"
                                    variant="ghost"
                                    size="xs"
                                    color="primary"
                                    @click.stop="editDocumento(rubro.id)"
                                />
                                </div>
                            </div>
                        </div>
                        <!-- Detalles de Documentos Especiales-->
                         <div v-if="selectedDocumentos && selectedDocumentos.regulaciones.length" class="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex gap-8">
                            <!-- Documentos a presentar -->
                            <div class="w-1/2 pr-6 border-r border-gray-200 dark:border-gray-700">
                                <h4 class="font-semibold mb-4">Documentos a presentar</h4>
                                <div v-if="(selectedDocumentos.regulaciones[0].media && selectedDocumentos.regulaciones[0].media.length) || 
                                    (selectedDocumentos.regulaciones[0].documentos && selectedDocumentos.regulaciones[0].documentos.length)">
                            <div class="flex flex-col gap-3">
                                <!-- Media (archivos con metadatos) -->
                                <div v-for="doc in selectedDocumentos.regulaciones[0].media || []" :key="doc.id" class="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900">
                                <FileIcon :file="{ file_ext: doc.extension, nombre: doc.nombre_original }" />
                                <div class="flex-1">
                                    <div class="font-medium text-gray-800 dark:text-gray-200 text-sm truncate break-all max-w-[250px] overflow-hidden">
                                    {{ doc.nombre_original }}
                                    </div>
                                    <div class="text-xs text-gray-500">{{ (doc.peso / 1024).toFixed(0) }} KB</div>
                                </div>
                                <UButton
                                    icon="i-heroicons-arrow-down-tray"
                                    size="xs"
                                    variant="ghost"
                                    color="primary"
                                    @click="openDocumentModal(doc.ruta)"
                                    aria-label="Descargar"
                                />
                                </div>
                                <!-- Documentos (solo rutas o nombres) -->
                                <div v-for="(doc, idx) in selectedDocumentos.regulaciones[0].documentos || []" :key="`doc-${idx}`" class="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-900">
                                <FileIcon :file="{ file_ext: getFileExtension(doc), nombre: getFileName(doc) }" />
                                <div class="flex-1">
                                    <div class="font-medium text-gray-800 dark:text-gray-200 text-sm truncate break-all max-w-[250px] overflow-hidden">
                                    {{ getFileName(doc) }}
                                    </div>
                                </div>
                                <UButton
                                    icon="i-heroicons-arrow-down-tray"
                                    size="xs"
                                    variant="ghost"
                                    color="primary"
                                    @click="openDocumentModal(doc)"
                                    aria-label="Descargar"
                                />
                                </div>
                            </div>
                            </div>
                            <div v-else class="text-gray-400 text-sm">Sin documentos</div>
                            </div>
                            <!-- Comentarios -->
                            <div class="w-1/2 pl-6 flex flex-col justify-start">
                                <div class="flex items-center justify-between mb-4">
                                <h4 class="font-semibold">Comentarios</h4>
                                <div class="flex gap-1">
                                    <UButton
                                    icon="i-heroicons-pencil-square"
                                    variant="outline"
                                    size="xs"
                                    color="primary"
                                    @click="editDocumento(selectedDocumentos.regulaciones[0]?.id)"
                                    aria-label="Editar"
                                    />
                                    <UButton
                                    icon="i-heroicons-trash"
                                    variant="outline"
                                    size="xs"
                                    color="red"
                                    @click="deleteDocumento(selectedDocumentos.regulaciones[0]?.id)"
                                    aria-label="Eliminar"
                                    />
                                </div>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-900 rounded p-3 text-gray-800 dark:text-gray-200 min-h-[80px]">
                                {{ selectedDocumentos.regulaciones[0]?.observaciones || 'Sin comentarios' }}
                                </div>
                            </div>
                        </div>
                    </div>        
                </UCard>              
            </div>
        </div>

    <ImageModal :is-open="showImageModal" :image-url="selectedImage" alt-text="Vista previa de imagen"
        @close="closeImageModal" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getGroupedRowModel } from '@tanstack/vue-table'
import type { GroupingOptions } from '@tanstack/vue-table'
import {AntidumpingService} from '~/services/antidumpingService'
import {PermisoService} from '~/services/permisoService'
import {EtiquetadoService} from '~/services/etiquetadoService'
import {DocumentoService} from '~/services/documentoService'
import ImageModal from '~/components/ImageModal.vue'
import DocumentPreview from '~/components/DocumentPreview.vue'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import {ProductRubroService} from '../services/productRubroService'
import {EntityService} from '~/services/entityService'
import FileIcon from '~/components/commons/FileIcon.vue'
// User role composable
const { hasRole } = useUserRole()   


const selectedRubroId = ref<number | null>(null)
const selectedRubro = computed(() =>
  antidumpingData.value.find(r => r.id === selectedRubroId.value) || antidumpingData.value[0]
)

// Computed para la entidad seleccionada en permisos
const selectedEntidad = computed(() =>
  permisosData.value.find(e => e.id === selectedRubroId.value) || permisosData.value[0]
)

//Computed para la entidad seleccionada en etiquetado
const selectedEtiquetado = computed(() =>
  etiquetadoData.value.find(e => e.id === selectedRubroId.value) || etiquetadoData.value[0]
)

//Computed para la entidad seleccionada en documentos
const selectedDocumentos = computed(() =>
  documentosData.value.find(e => e.id === selectedRubroId.value) || documentosData.value[0]
)

// New product form
const newProduct = ref({
  nombre: ''
})
// New entity form
const newEntity = ref({
  nombre: ''
})

//New etiquetado form
const newEtiquetado = ref({
  nombre: ''
})

//New documento form
const newDocumento = ref({
  nombre: ''
})

// Form data
const formData = ref({
  producto: null as any,
  descripcion: '',
  partida: '',
  precioDeclarado: '',
  antidumping: '',
  observaciones: ''
})

// Modal state
const showCreateModal = ref(false)

const createProduct = async () => {
    showConfirmation('Crear Categoría', '¿Estás seguro de que deseas crear esta categoría?', 
    async () => {
        try {
            // Validar campo requerido
            if (!newProduct.value.nombre) {
            console.error('Nombre es requerido')
            return
            }
            const response = await ProductRubroService.createProductRubro({
            nombre: newProduct.value.nombre,
            tipo: 'ANTIDUMPING'
            })
            if (response.success) {

            formData.value.producto = {
                label: response.data.nombre,
                value: response.data.id.toString()
            }
            newProduct.value = {
                nombre: ''
            }
            showCreateModal.value = false
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
                showSuccess('Creación Exitosa', 'La categoría se ha creado correctamente.')

            console.log('Rubro creado exitosamente:', response.data)
            } else {
            console.error('Error al crear rubro:', response.error)
            }
        } catch (error) {
            console.error('Error al crear categoría:', error)
        }
    })
}
const createEntity = async () => {
    showConfirmation('Crear Entidad', '¿Estás seguro de que deseas crear esta entidad?', 
    async () => {
        try {
            // Validar campo requerido
            if (!newEntity.value.nombre) {
                console.error('Nombre es requerido')
                return
            }
            const response = await EntityService.createEntity({
                nombre: newEntity.value.nombre,
                descripcion: newEntity.value.descripcion || ''
            })
            if (response.success) {
                newEntity.value = {
                    nombre: '',
                    descripcion: ''
                }
                showCreateModal.value = false
                await loadPermisosData()
                showSuccess('Creación Exitosa', 'La entidad se ha creado correctamente.')
            } else {
                console.error('Error al crear entidad:', response.error)
            }
        } catch (error) {
            console.error('Error al crear entidad:', error)
        }
    })
}
const createEtiqueta = async() => {
    showConfirmation('Crear Etiquetado', '¿Estás seguro de que deseas crear este etiquetado?', 
    async () => {
        try {
            // Validar campo requerido
            if (!newEtiquetado.value.nombre) {
                console.error('Nombre es requerido')
                return
            }
            const response = await EtiquetadoService.createEtiquetado({
                nombre: newEtiquetado.value.nombre
            })
            if (response.success) {
                newEtiquetado.value = {
                    nombre: ''
                }
                showCreateModal.value = false
                await loadEtiquetadoData()
                showSuccess('Creación Exitosa', 'El etiquetado se ha creado correctamente.')
            } else {
                console.error('Error al crear etiquetado:', response.error)
            }
        } catch (error) {
            console.error('Error al crear etiquetado:', error)
        }
    })
}

// Notifications and loading

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

import {EntityService} from '~/services/entityService'

// Loading states
const loading = ref(false)
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
        header: 'Producto'
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
            () => AntidumpingService.getAntidumpingList(),
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
            showError('cargar datos de antidumping', response.error)
        }
    } catch (error: any) {
        console.error('Error loading antidumping data:', error)
        antidumpingData.value = []
        showError('cargar datos de antidumping', error.message)
    } finally {
        loadingAntidumping.value = false
    }
}

const loadPermisosData = async () => {
    loadingPermisos.value = true
    try {
        // Llamar al servicio para obtener los datos de permisos
        const response = await PermisoService.getPermisos()

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
        const response = await EtiquetadoService.getEtiquetadosHierarchical()

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
        const response = await DocumentoService.getDocumentosHierarchical()

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
const getLoading = (tab: string) => {
  switch (tab) {
    case 'antidumping': return loadingAntidumping.value
    case 'permisos': return loadingPermisos.value
    case 'etiquetado': return loadingEtiquetado.value
    case 'documentos': return loadingDocumentos.value
    default: return false
  }
}


const getCreateTitle = (tab: string) => {
  switch (tab) {
    case 'antidumping': return 'Crear Nuevo Producto'
    case 'permisos': return 'Crear Nueva Entidad'
    case 'etiquetado': return 'Crear Nuevo Etiquetado'
    case 'documentos': return 'Crear Nuevo Documento Especial'
    default: return 'Crear'
  }
}

const getCreateButtonLabel = (tab: string) => {
  switch (tab) {
    case 'antidumping': return 'Crear Producto'
    case 'permisos': return 'Crear Entidad'
    case 'etiquetado': return 'Crear Etiquetado'
    case 'documentos': return 'Crear Documento'
    default: return 'Crear'
  }
}

const handleCreate = (tab: string) => {
  switch (tab) {
    case 'antidumping': createProduct(); break
    case 'permisos': createEntity(); break
    case 'etiquetado': createEtiqueta(); break
    case 'documentos': createDocumento(); break
  }
}


const regulationDetail = ref<AntidumpingRegulation | null>(null)
// View regulation detail
const viewRegulationDetail = (regulationId: number) => {
    // Busca la regulación en el rubro seleccionado
    const regulacion = selectedRubro.value?.regulaciones.find(r => r.id === regulationId) || null
    regulationDetail.value = regulacion
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
                    const response = await AntidumpingService.deleteAntidumping(regulationId)
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


const permisoDetail = ref<PermisoRegulation | null>(null)
// View permiso detail
const viewPermisoDetail = (regulationId: number) => {
  // Busca la regulación en la entidad seleccionada
  const regulacion = selectedEntidad.value?.regulaciones.find(r => r.id === regulationId) || null
  permisoDetail.value = regulacion
}

// Edit permiso
const editPermiso = (regulationId: number) => {
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
    if (!documentUrl) {
        showError('Descarga de documento', 'La URL del documento no es válida.')
        return
    }
    const config = useRuntimeConfig()
    // Si la ruta ya es absoluta, úsala tal cual
    const fullUrl = documentUrl.startsWith('http')
        ? documentUrl
        : `${config.public.apiBaseUrl}${documentUrl}`
    window.open(fullUrl, '_blank')
}

// Get file extension from path
const getFileExtension = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toUpperCase() || 'FILE'
    return extension
}

//get name document
const getFileName = (filePath: string): string => {
  return filePath.split('/').pop() || filePath
}

// Image modal functions
const getImageUrl = (ruta: string) => {
    return ruta
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
                    const response = await AntidumpingService.deleteRubro(id)
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
                    const response = await PermisoService.deletePermiso(id)
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
                    const response = await EntityService.deleteEntity(id)
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
                    const response = await DocumentoService.deleteDocumento(id)
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
                    const response = await EtiquetadoService.deleteEtiquetado(id)
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
