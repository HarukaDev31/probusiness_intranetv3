<template>
    <div class="p-4 md:p-8">
        <h1 class="text-lg md:text-xl font-medium text-onix-pro">Mi cuenta</h1>
    </div>

    <div class="user-profile-container">
        <div class="user-profile">
            <!-- Información Personal -->
            <UCard class="profile-header flex" style="grid-area: profile-header;" :key="formKey" :ui="{
                root: 'w-full',
                body: 'w-full'
            }">
                <div class="edit-header flex flex-row w-full justify-end items-end">
                    <UButton variant="ghost" @click="toggleEditProfile"
                        :icon="isEditingProfile ? 'i-heroicons-x-mark' : 'i-heroicons-pencil'"
                        class="h-8 w-8 align-end justify-end items-end">
                    </UButton>
                </div>
                <div class="profile-info px-4">
                    <div class="pb-8">
                        <div class="profile-avatar__container flex justify-center items-center mx-auto">
                            <UAvatar :src="previewImage || userProfile.photoUrl" alt="Foto de perfil"
                                class="profile-avatar" />

                            <div class="profile-avatar__overlay" v-if="isEditingProfile"
                                @click="openSimpleUploadFile()">
                                <UButton variant="solid" class="h-8 w-8 text-white rounded-full"
                                    @click="openSimpleUploadFile()" icon="i-heroicons-camera" color="primary">
                                </UButton>
                            </div>
                        </div>

                        <h2 class="profile-name text-center">{{ userProfile.fullName || '-' }}</h2>
                        <div class="profile-dni text-center">
                            <span v-if="!isEditingProfile">DNI: {{ userProfile.dni || '-' }}</span>
                            <div v-else class="flex flex-row justify-center items-center gap-2">
                                <label class="text-sm font-medium">DNI:</label>
                                <UInput v-model="profileForm.dni" class="edit-input w-32 text-center"
                                    placeholder="DNI" />
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-1 profile-fields"
                        :class="isEditingProfile ? 'items-center' : 'items-start'">
                        <p class="flex w-full flex-row sm:flex-row place-content-start gap-1 sm:gap-2 profile-field">
                            <strong class="w-full sm:w-1/3 font-medium break-words">F.Nacimiento:</strong>
                            <span v-if="!isEditingProfile" class="w-full flex-1 sm:w-40 word-break break-words">
                                {{ formatDate(userProfile.fechaNacimiento) }}
                            </span>
                            <UInput v-else type="date" v-model="profileForm.fechaNacimiento"
                                class="edit-input w-full sm:w-40" />
                        </p>
                        <p class="flex w-full flex-row sm:flex-row place-content-start gap-1 sm:gap-2">
                            <strong class="w-full sm:w-1/3 font-medium">País:</strong>
                            <span v-if="!isEditingProfile" class="w-full flex-1 sm:w-40 word-break break-words">
                                {{ getCountryName() }}
                            </span>
                            <USelect v-else v-model="profileForm.country" class="edit-input w-full sm:w-40"
                                :items="paises" placeholder="Seleccionar país" @update:modelValue="handleCountryChange" />
                        </p>
                        <p class="flex w-full flex-row sm:flex-row place-content-start gap-1 sm:gap-2">
                            <strong class="w-full sm:w-1/3 font-medium">Departamento:</strong>
                            <span v-if="!isEditingProfile" class="w-full flex-1 sm:w-40 word-break break-words">
                                {{ getDepartmentName() }}
                            </span>
                            <USelect v-else v-model="profileForm.department" class="edit-input w-full sm:w-40"
                                :items="departamentosForSelect" item-value="value" item-title="label"
                                placeholder="Seleccionar departamento" @update:modelValue="handleDepartmentChange" />
                        </p>
                        <p class="flex w-full flex-row sm:flex-row place-content-start gap-1 sm:gap-2">
                            <strong class="w-full sm:w-1/3 font-medium">Provincia:</strong>
                            <span v-if="!isEditingProfile" class="w-full flex-1 sm:w-40 word-break break-words">
                                {{ getProvinceName() }}
                            </span>
                            <USelect v-else v-model="profileForm.city" class="edit-input w-full sm:w-40"
                                :items="provinciasForSelect" item-value="value" item-title="label"
                                placeholder="Seleccionar provincia" @update:modelValue="handleProvinceChange" />
                        </p>
                        <p class="flex w-full flex-row sm:flex-row place-content-start gap-1 sm:gap-2">
                            <strong class="w-full sm:w-1/3 font-medium">Distrito:</strong>
                            <span v-if="!isEditingProfile" class="w-full flex-1 sm:w-40 word-break break-words">
                                {{ getDistrictName() }}
                            </span>
                            <USelect v-else v-model="profileForm.district" class="edit-input w-full sm:w-40"
                                :items="distritosForSelect" item-value="value" item-title="label"
                                placeholder="Seleccionar distrito" />
                        </p>
                        <p class="flex w-full flex-row sm:flex-row place-content-start gap-1 sm:gap-2">
                            <strong class="w-full sm:w-1/3 font-medium">Correo:</strong>
                            <span v-if="!isEditingProfile" class="w-full flex-1 sm:w-40 word-break break-words">
                                {{ userProfile.email || '-' }}
                            </span>
                            <UInput v-else type="email" v-model="profileForm.email" class="edit-input w-full sm:w-40" />
                        </p>
                        <p class="flex w-full flex-row sm:flex-row place-content-start gap-1 sm:gap-2">
                            <strong class="w-full sm:w-1/3 font-medium">Celular:</strong>
                            <span v-if="!isEditingProfile" class="w-full flex-1 sm:w-40 word-break break-words">
                                {{ userProfile.phone || '-' }}
                            </span>
                            <UInput v-else v-model="profileForm.phone" class="edit-input w-full sm:w-40" />
                        </p>
                    </div>
                    <!-- Botón de guardar para el perfil -->
                    <UButton v-if="isEditingProfile" @click="saveProfile" :loading="loading"
                        class="w-full sm:w-60 mx-auto mt-4 py-4 flex items-center justify-center text-white">
                        Guardar
                    </UButton>
                </div>
            </UCard>

          
            <!-- Metas -->
            <UCard class="profile-goals" style="grid-area: profile-goals;" :ui="{
                root: 'w-full',
                body: 'w-full'
            }">
                <div class="flex flex-row gap-2 items-center justify-between mb-4">
                    <div class="flex flex-row gap-2 items-center">
                        <h3>Mis metas</h3>
                        <img src="/assets/icon/star.svg" alt="Metas" class="business-icon mb-4 md:mb-1" />
                    </div>
                    <UButton variant="ghost" @click="toggleEditGoals"
                        :icon="isEditingGoals ? 'i-heroicons-x-mark' : 'i-heroicons-pencil'" class="h-8 w-8">
                    </UButton>
                </div>

                <UTextarea v-model="profileForm.goals" placeholder="Ingresa tus metas personales"
                    :disabled="!isEditingGoals" class="w-full" :rows="4" />

                <!-- Botón de guardar para las metas -->
                <UButton v-if="isEditingGoals" @click="saveGoals" :loading="loading"
                    class="w-full sm:w-80 mx-auto mt-4 py-4 flex items-center justify-center text-white">
                    Guardar
                </UButton>
            </UCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { UserProfile } from '@/types/userprofile'
import SimpleUploadFile from '~/components/commons/SimpleUploadFile.vue'
import { useOverlay } from '#imports'
import { useProfile } from '~/composables/commons/perfil/useProfile'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useOptions } from '~/composables/commons/useOptions'
import { useLocation } from '~/composables/commons/useLocation'
import { formatCurrency, formatDateTimeToDmy } from '~/utils/formatters'
import { useModal } from '~/composables/commons/useModal'
import { CalendarDate } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import { useUserRole } from '@/composables/auth/useUserRole'
const { withSpinner } = useSpinner();
const { showSuccess, showError } = useModal();
const { paises, getPaises } = useOptions();
const { departamentos, provincias, distritos, fetchDepartamentos, fetchProvincias, fetchAllProvincias, fetchDistritos } = useLocation();
const {
  userData,
  currentRole,
  userName,
  userEmail,
  userPhotoUrl,
  currentId,
  fetchCurrentUser
} = useUserRole()

// Computed para convertir a formato de USelect
const departamentosForSelect = computed(() => {
    return departamentos.value.map(d => ({
        value: d.id,
        label: d.label || d.nombre
    }));
});

const provinciasForSelect = computed(() => {
    // Las provincias ya vienen con formato { value, label } del backend
    if (!provincias.value || provincias.value.length === 0) {
        return [];
    }
    console.log('🔍 Provincias disponibles:', provincias.value);
    return provincias.value;
});

const distritosForSelect = computed(() => {
    return distritos.value.map(d => ({
        value: d.id,
        label: d.label || d.nombre
    }));
});

// Estadísticas - los datos vienen filtrados del backend cuando se aplican filtros
const filteredStats = computed(() => {
    return {
        soldCBM: userProfile.value.soldCBM || 0,
        embarquedCBM: userProfile.value.embarquedCBM || 0
    };
});

// Función para formatear CalendarDate a string para mostrar
const formatCalendarDateDisplay = (date: CalendarDate | null): string => {
    if (!date) return '';
    try {
        return dateFormatter.format(date.toDate(getLocalTimeZone()));
    } catch (e) {
        return `${date.day}/${date.month}/${date.year}`;
    }
};

// Función para convertir CalendarDate a string YYYY-MM-DD
const formatCalendarDateToString = (date: CalendarDate | null): string | undefined => {
    if (!date) return undefined;
    try {
        const year = date.year;
        const month = String(date.month).padStart(2, '0');
        const day = String(date.day).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error('Error al formatear fecha:', e);
        return undefined;
    }
};

// Verificar si hay filtros activos
const hasFilterActive = computed(() => {
    return fechaInicio.value !== null || fechaFin.value !== null;
});

// Función para cargar el perfil con filtros
const loadProfileWithFilter = async () => {
    try {
        loadingProfile.value = true;
        const fechaInicioStr = formatCalendarDateToString(fechaInicio.value);
        const fechaFinStr = formatCalendarDateToString(fechaFin.value);
        
        console.log('🔍 Aplicando filtros:', { fechaInicioStr, fechaFinStr });
        
        const response = await getProfileData(fechaInicioStr, fechaFinStr);
        if (response && response.success) {
            console.log('✅ Perfil cargado con filtros:', response.user);
            userProfile.value = response.user;
            // No emitir evento para evitar que el padre recargue sin filtros
            // Los datos filtrados vienen directamente del backend
        } else {
            showError('Error al cargar el perfil', 'No se pudieron aplicar los filtros');
        }
    } catch (error) {
        console.error('Error al cargar el perfil con filtros:', error);
        showError('Error al cargar el perfil', 'No se pudieron aplicar los filtros');
    } finally {
        loadingProfile.value = false;
    }
};

// Función para aplicar el filtro
const applyFilter = async () => {
    await loadProfileWithFilter();
};

// Función para limpiar el filtro de fechas
const clearDateRange = async () => {
    fechaInicio.value = null;
    fechaFin.value = null;
    showCBMFilter.value = false;
    // Recargar perfil sin filtros (sin parámetros)
    try {
        loadingProfile.value = true;
        console.log('🔍 Limpiando filtros, recargando perfil sin parámetros');
        const response = await getProfileData(undefined, undefined);
        if (response && response.success) {
            userProfile.value = response.user;
            // Emitir evento para que el padre también actualice
            emit('profileUpdated');
        }
    } catch (error) {
        console.error('Error al limpiar filtros:', error);
        showError('Error al limpiar filtros', 'No se pudieron limpiar los filtros');
    } finally {
        loadingProfile.value = false;
    }
};

defineOptions({
    inheritAttrs: false
})

const overlay = useOverlay();
const simpleUploadFile = overlay.create(SimpleUploadFile);
const { updateProfile, loading, getProfile: getProfileData } = useProfile();
const loadingProfile = ref(false);
const showCBMFilter = ref(false);

const props = defineProps({
    userProfile: {
        type: Object as () => UserProfile,
        required: true
    }
});

const emit = defineEmits<{
    profileUpdated: []
}>();

// Estados reactivos
const userProfile = ref({} as UserProfile);
const isEditingProfile = ref(false);
const isEditingGoals = ref(false);
const previewImage = ref<string | null>(null);
const pendingPhotoFile = ref<File | null>(null);
const formKey = ref(0);

// Filtro de fecha para estadísticas - un solo filtro para ambos campos
const fechaInicio = shallowRef<CalendarDate | null>(null);
const fechaFin = shallowRef<CalendarDate | null>(null);

// DateFormatter para mostrar fechas
const dateFormatter = new DateFormatter('es-ES', {
    dateStyle: 'medium'
});

// Formulario
const profileForm = ref({
    fullName: '',
    email: '',
    dni: '',
    fechaNacimiento: '',
    country: null as number | null,
    department: null as number | null,
    city: null as number | null,
    district: null as number | null,
    phone: '',
    goals: ''
});

// Inicializar datos
onMounted(async () => {
    userProfile.value = props.userProfile;
    
    // Cargar países primero
    await getPaises();
    await nextTick();
    
    // Si hay un país seleccionado (Perú = 1), cargar ubicaciones peruanas
    if (userProfile.value.idCountry === 1) {
        await fetchDepartamentos();
        await nextTick();
        
        // Cargar provincias si hay un departamento seleccionado
        if (userProfile.value.idDepartment) {
            try {
                await fetchProvincias(userProfile.value.idDepartment);
                await nextTick();
                
                // Cargar distritos si hay una provincia seleccionada
                if (userProfile.value.idProvince) {
                    await fetchDistritos(userProfile.value.idProvince);
                    await nextTick();
                }
            } catch (error) {
                console.error('Error cargando provincias/distritos:', error);
            }
        }
    }
    
    await nextTick();
    await initializeForms();
});

const initializeForms = () => {
    // Inicializar formulario usando los IDs directamente del UserProfile
    profileForm.value = {
        fullName: userProfile.value.fullName || '',
        email: userProfile.value.email || '',
        dni: userProfile.value.dni || '',
        fechaNacimiento: formatDateForInput(userProfile.value.fechaNacimiento) || '',
        country: userProfile.value.idCountry || null,
        department: userProfile.value.idDepartment || null,
        city: userProfile.value.idProvince || null,
        district: userProfile.value.idDistrict || null,
        phone: userProfile.value.phone || '',
        goals: userProfile.value.goals || ''
    };
};

// Función para formatear fecha para input type="date"
const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';

    try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }

        return '';
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return '';
    }
};

// Función para formatear fecha para mostrar
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    return formatDateTimeToDmy(dateString);
};

// Funciones para obtener nombres de ubicaciones
const getCountryName = (): string => {
    if (!userProfile.value.idCountry) return '-';
    const foundCountry = paises.value.find(p => p.value === userProfile.value.idCountry);
    return foundCountry ? foundCountry.label : '-';
};

const getDepartmentName = (): string => {
    if (!userProfile.value.idDepartment) return '-';
    const foundDept = departamentos.value.find(d => d.id === userProfile.value.idDepartment);
    return foundDept ? foundDept.label : '-';
};

const getProvinceName = (): string => {
    if (!userProfile.value.idProvince) return '-';
    const foundProvince = provincias.value.find(p => p.value === userProfile.value.idProvince);
    return foundProvince ? foundProvince.label : '-';
};

const getDistrictName = (): string => {
    if (!userProfile.value.idDistrict) return '-';
    const foundDistrict = distritos.value.find(d => d.id === userProfile.value.idDistrict);
    return foundDistrict ? foundDistrict.label : '-';
};

const handleCountryChange = async (value: number | null) => {
    console.log('🔍 País cambiado:', value);
    profileForm.value.country = value;
    
    // Si cambia el país, limpiar selects dependientes
    if (value !== userProfile.value.idCountry) {
        profileForm.value.department = null;
        profileForm.value.city = null;
        profileForm.value.district = null;
        departamentos.value = [];
        provincias.value = [];
        distritos.value = [];
    }

    // Si se selecciona Perú (ID = 1), cargar departamentos
    if (value === 1) {
        try {
            console.log('🔍 Cargando departamentos para Perú');
            await fetchDepartamentos();
            console.log('🔍 Departamentos cargados:', departamentos.value.length);
            
            // Si el departamento del perfil coincide con el país seleccionado, mantenerlo
            if (profileForm.value.department && userProfile.value.idDepartment === profileForm.value.department) {
                await nextTick();
                await fetchProvincias(profileForm.value.department);
                
                // Si la provincia del perfil coincide con el departamento, mantenerla
                if (profileForm.value.city && userProfile.value.idProvince === profileForm.value.city) {
                    await nextTick();
                    await fetchDistritos(profileForm.value.city);
                }
            }
        } catch (error) {
            console.error('Error al cargar departamentos:', error);
        }
    }
};

const handleDepartmentChange = async (value: number | null) => {
    console.log('🔍 Departamento cambiado:', value);
    profileForm.value.city = null;
    profileForm.value.district = null;
    profileForm.value.department = value;

    if (value) {
        try {
            console.log('🔍 Cargando provincias para departamento:', value);
            await fetchProvincias(value);
            console.log('🔍 Provincias cargadas:', provincias.value.length);
            
            // Si ya hay una provincia en el perfil y corresponde a este departamento, cargar sus distritos
            if (userProfile.value.idProvince) {
                await nextTick();
                // Verificar si la provincia pertenece al departamento seleccionado
                const province = provincias.value.find(p => p.value === userProfile.value.idProvince);
                if (province) {
                    await fetchDistritos(userProfile.value.idProvince);
                }
            }
        } catch (error) {
            console.error('Error al cargar provincias:', error);
        }
    } else {
        provincias.value = [];
        distritos.value = [];
    }
};

const handleProvinceChange = async (value: number | null) => {
    console.log('🔍 Provincia cambiada:', value);
    profileForm.value.district = null;
    profileForm.value.city = value;

    if (value) {
        try {
            console.log('🔍 Cargando distritos para provincia:', value);
            await fetchDistritos(value);
            console.log('🔍 Distritos cargados:', distritos.value.length);
        } catch (error) {
            console.error('Error al cargar distritos:', error);
        }
    } else {
        distritos.value = [];
    }
};

// Funciones de edición
const toggleEditProfile = () => {
    isEditingProfile.value = !isEditingProfile.value;
    if (!isEditingProfile.value) {
        initializeForms();
        previewImage.value = null;
        pendingPhotoFile.value = null;
        formKey.value++;
    }
};

const toggleEditGoals = () => {
    isEditingGoals.value = !isEditingGoals.value;
    if (!isEditingGoals.value) {
        profileForm.value.goals = userProfile.value.goals || '';
    }
};

// Funciones de guardado
const saveProfile = async () => {
    try {
        const apiData: any = {
            email: profileForm.value.email || '',
            phone: profileForm.value.phone || '',
            dni: profileForm.value.dni || '',
            fecha_nacimiento: profileForm.value.fechaNacimiento || '',
            goals: profileForm.value.goals || ''
        };

        // Enviar IDs directamente
        if (profileForm.value.country !== null && profileForm.value.country !== undefined) {
            apiData.country = profileForm.value.country.toString();
        }

        if (profileForm.value.department !== null && profileForm.value.department !== undefined) {
            apiData.departamento = profileForm.value.department.toString();
        }

        if (profileForm.value.city !== null && profileForm.value.city !== undefined) {
            apiData.city = profileForm.value.city.toString();
        }

        if (profileForm.value.district !== null && profileForm.value.district !== undefined) {
            apiData.distrito = profileForm.value.district.toString();
        }

        await withSpinner(async () => {
            const response = await updateProfile(apiData, pendingPhotoFile.value || undefined);
            
            if (response.success) {
                showSuccess('Perfil actualizado exitosamente', 'El perfil se ha actualizado correctamente');
                emit('profileUpdated');
            } else {
                showError('Error al guardar el perfil', 'Error al guardar el perfil');
            }
        }, 'Guardando perfil...')

        // Actualizar el perfil local con los nuevos datos
        userProfile.value = { 
            ...userProfile.value, 
            email: apiData.email,
            phone: apiData.phone,
            dni: apiData.dni,
            fechaNacimiento: apiData.fecha_nacimiento,
            goals: apiData.goals,
            idCountry: profileForm.value.country || userProfile.value.idCountry,
            idDepartment: profileForm.value.department || userProfile.value.idDepartment,
            idProvince: profileForm.value.city || userProfile.value.idProvince,
            idDistrict: profileForm.value.district || userProfile.value.idDistrict
        };
        
        formKey.value++;
        previewImage.value = null;
        pendingPhotoFile.value = null;
        isEditingProfile.value = false;
    } catch (error) {
        console.error('Error al guardar el perfil:', error);
        showError('Error al guardar el perfil', 'Error al guardar el perfil');
    }
};

const saveGoals = async () => {
    try {
        await withSpinner(async () => {
            const updateData: any = {
                goals: profileForm.value.goals || '',
                email: profileForm.value.email || '',
                phone: profileForm.value.phone || '',
                dni: profileForm.value.dni || '',
                fecha_nacimiento: profileForm.value.fechaNacimiento || '',
            };

            // Incluir IDs de ubicación
            if (profileForm.value.country !== null && profileForm.value.country !== undefined) {
                updateData.country = profileForm.value.country.toString();
            }

            if (profileForm.value.department !== null && profileForm.value.department !== undefined) {
                updateData.departamento = profileForm.value.department.toString();
            }

            if (profileForm.value.city !== null && profileForm.value.city !== undefined) {
                updateData.city = profileForm.value.city.toString();
            }

            if (profileForm.value.district !== null && profileForm.value.district !== undefined) {
                updateData.distrito = profileForm.value.district.toString();
            }

            const response = await updateProfile(updateData);
            if (response.success) {
                showSuccess('Metas actualizadas exitosamente', 'Las metas se han actualizado correctamente');
                emit('profileUpdated');
                isEditingGoals.value = false;
            } else {
                showError('Error al guardar las metas', 'Error al guardar las metas')
            }
        }, 'Guardando metas...')
        userProfile.value.goals = profileForm.value.goals;
    } catch (error) {
        console.error('Error al guardar las metas:', error);
        showError('Error al guardar las metas', 'Error al guardar las metas')
    }
};

// Función para abrir el modal de subida de archivos
const openSimpleUploadFile = () => {
    simpleUploadFile.open({
        title: 'Subir foto de perfil',
        withNameField: false,
        onSave: (data: { file: File }) => {
            handlePhotoUpload(data.file);
        },
    });
};

// Manejar la subida de foto
const handlePhotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    previewImage.value = url;
    pendingPhotoFile.value = file;
};

// Limpiar recursos al desmontar
onUnmounted(() => {
    if (previewImage.value) {
        URL.revokeObjectURL(previewImage.value);
    }
});

// Watcher para reaccionar a cambios en las props del userProfile
watch(() => props.userProfile, (newUserProfile) => {
    if (newUserProfile) {
        userProfile.value = newUserProfile;
        formKey.value++;
        if (!isEditingProfile.value && !isEditingGoals.value) {
            nextTick(() => {
                initializeForms();
            });
        }
    }
}, { deep: true, immediate: true });


</script>

<style scoped>
.edit-input {
    border-radius: 4px;
    padding: 0.5rem;
    font-size: 1rem;
}

.user-profile-container {
    width: 100%;
    max-width: 100vw;
    overflow-x: auto;
    padding: 0;
}

.user-profile {
    display: grid;
    grid-template-areas:
        "profile-header profile-goals";
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 1.5rem;
    padding: 2rem;
    max-width: 100%;
    overflow: hidden;
}

/* Pantallas grandes */
@media (min-width: 1400px) {
    .user-profile {
        grid-template-columns: 1fr 1.2fr;
        padding: 2.5rem;
    }
}

/* Tablet grande */
@media (max-width: 1280px) {
    .user-profile {
        grid-template-columns: 1fr 1fr;
        padding: 1.5rem;
        gap: 1rem;
    }
}

/* Tablet pequeño */
@media (max-width: 900px) {
    .user-profile {
        grid-template-areas:
            "profile-header"
            "profile-goals";
        grid-template-columns: 1fr;
        grid-template-rows: repeat(3, auto);
        gap: 1rem;
        padding: 1rem;
    }
}

/* Mobile */
@media (max-width: 768px) {
    .user-profile {
        grid-template-areas:
            "profile-header"
            "profile-goals";
        grid-template-columns: 1fr;
        grid-template-rows: repeat(3, auto);
        gap: 1rem;
        padding: 1rem;
    }
}

.profile-header {
    align-items: flex-end;
    height: auto;
    display: flex;
    flex-direction: column;
    min-height: fit-content;
    width: 100%;
}

@media (max-width: 768px) {
    .profile-header {
        min-height: auto;
    }
}

.profile-stats {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    min-height: fit-content;
    width: 100%;
}

@media (max-width: 1024px) {
    .profile-stats .text-2xl {
        font-size: 1.5rem;
    }
}

@media (max-width: 768px) {
    .profile-stats {
        padding: 1rem;
    }
}

.profile-goals {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    height: fit-content;
    width: 100%;
    max-width: 100%;
    min-width: 0;
}

@media (max-width: 1280px) {
    .profile-goals {
        padding: 1.2rem;
    }
}

@media (max-width: 1024px) {
    .profile-goals {
        padding: 1rem;
    }
}

@media (max-width: 768px) {
    .profile-goals {
        padding: 1rem;
    }

    .profile-goals h3 {
        font-size: 1.2rem;
        margin-bottom: 1rem;
    }

    .user-profile p {
        font-size: .9rem;
    }
}

/* Force stacking of label+value on small screens to avoid horizontal overflow */
@media (max-width: 768px) {
    .profile-fields p {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 0.5rem;
    }
    .profile-fields p strong {
        width: 100% !important;
        text-align: left !important;
        margin-bottom: 0.25rem;
    }
    .profile-name {
        text-align: center;
        font-size: 1.25rem;
        margin-top: 0.25rem;
        font-weight: 600;
    }
    .profile-dni {
        text-align: center;
        margin-bottom: 0.5rem;
    }
}

.profile-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
}

@media (max-width: 768px) {
    .profile-avatar {
        width: 80px;
        height: 80px;
        margin-bottom: 0.5rem;
    }
}

.profile-avatar__container {
    position: relative;
    width: 100px;
    height: 100px;
    overflow: hidden;
    margin-bottom: 1rem;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

@media (max-width: 768px) {
    .profile-avatar__container {
        margin-bottom: 0.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }
}

.profile-avatar__overlay {
    z-index: 2;
    position: absolute;
    bottom: 0;
    right: 0;
    width: 2em;
    height: 2em;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

/* Estilos específicos para móvil EN MODO EDICIÓN únicamente */
@media (max-width: 768px) {
    .profile-fields.items-center {
        display: flex !important;
        flex-direction: column !important;
        gap: 0.75rem;
        align-items: center !important;
    }

    .profile-fields.items-center p {
        display: flex !important;
        flex-direction: column !important;
        gap: 0.25rem;
        margin-bottom: 0;
        width: 100%;
        max-width: 320px;
        min-height: 2.2em;
        align-items: flex-start;
        justify-content: center;
    }

    .profile-fields.items-center p strong {
        width: auto !important;
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 0.25rem;
        text-align: left;
    }

    .profile-fields.items-center p span,
    .profile-fields.items-center p .edit-input {
        width: 100% !important;
        font-size: 0.875rem;
        word-break: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
    }

    .profile-fields.items-center p span {
        color: #374151;
        padding: 0.25rem 0;
    }
}

/* Estilos generales para manejo de texto largo */
.profile-fields p span,
.profile-fields p .edit-input {
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    max-width: 100%;
    box-sizing: border-box;
}

.profile-fields p {
    min-width: 0;
    flex: 1;
}

.edit-input {
    box-sizing: border-box;
    width: 100%;
    word-break: break-word;
    overflow-wrap: break-word;
}
</style>