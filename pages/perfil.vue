<template>
    <main>
      <UserProfileSkeleton v-if="isLoading" />
      <UserProfileComponent 
        v-else 
        :userProfile="profile" 
        class="user-profile" 
        @profile-updated="handleProfileUpdate" 
      />
      <!-- <Sidebar :userProfile="userProfile" class="sidebar" /> -->
    </main>
  </template>
  <script setup lang="ts">
  import UserProfileSkeleton from '@/components/profile/UserProfileSkeleton.vue';
  import type { UserProfile } from '@/types/userprofile';
  import UserProfileComponent from '@/components/profile/UserProfileComponent.vue';
  import { useProfile } from '@/composables/commons/perfil/useProfile';
  const { profile, loading, error, getProfile } = useProfile();
  const isLoading = ref(true);
  
  // Función para manejar la actualización del perfil
  const handleProfileUpdate = async () => {
    try {
      isLoading.value = true;
      const response = await getProfile(); // Recargar los datos del perfil desde el backend
      
      // Actualizar auth_user en localStorage si el perfil se actualizó correctamente
      if (response && response.success && process.client) {
        try {
          const authUser = localStorage.getItem('auth_user')
          if (authUser) {
            const userData = JSON.parse(authUser)
            const updatedUser = response.user
            
            // Actualizar campos en el nivel raíz de auth_user
            if (updatedUser.photoUrl !== undefined) userData.photoUrl = updatedUser.photoUrl
            if (updatedUser.fullName !== undefined) userData.fullName = updatedUser.fullName
            if (updatedUser.phone !== undefined) userData.phone = updatedUser.phone
            if (updatedUser.email !== undefined) userData.email = updatedUser.email
            
            // Actualizar campos en raw si existe
            if (userData.raw) {
              if (updatedUser.photoUrl !== undefined) userData.raw.photoUrl = updatedUser.photoUrl
              if (updatedUser.fullName !== undefined) userData.raw.nombres_apellidos = updatedUser.fullName
              if (updatedUser.email !== undefined) userData.raw.email = updatedUser.email
              if (updatedUser.phone !== undefined) userData.raw.phone = updatedUser.phone
              if (updatedUser.dni !== undefined) userData.raw.dni = updatedUser.dni
              if (updatedUser.fechaNacimiento !== undefined) userData.raw.fechaNacimiento = updatedUser.fechaNacimiento
              if (updatedUser.goals !== undefined) userData.raw.goals = updatedUser.goals
              if (updatedUser.idCountry !== undefined) userData.raw.idCountry = updatedUser.idCountry
              if (updatedUser.idDepartment !== undefined) userData.raw.idDepartment = updatedUser.idDepartment
              if (updatedUser.idProvince !== undefined) userData.raw.idProvince = updatedUser.idProvince
              if (updatedUser.idDistrict !== undefined) userData.raw.idDistrict = updatedUser.idDistrict
              if (updatedUser.soldCBM !== undefined) userData.raw.soldCBM = updatedUser.soldCBM
              if (updatedUser.embarquedCBM !== undefined) userData.raw.embarquedCBM = updatedUser.embarquedCBM
            }
            
            // Guardar el auth_user actualizado en localStorage
            localStorage.setItem('auth_user', JSON.stringify(userData))
            
            // Emitir evento personalizado para que el sidebar se actualice
            window.dispatchEvent(new CustomEvent('auth_user_updated'))
            
            console.log('✅ auth_user actualizado en localStorage:', userData)
          }
        } catch (e) {
          console.error('Error al actualizar auth_user en localStorage:', e)
        }
      }
      
      isLoading.value = false;
    } catch (error) {
      console.error('Error al recargar el perfil:', error);
      isLoading.value = false;
    }
  };
  onMounted(async () => {
    try {
      const response = await getProfile();
      if (!response.success) {
        throw new Error('Error al cargar los datos del perfil');
      }
  
      isLoading.value = false;
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      // isLoading.value = false;
    }
  
  
  });
  </script>