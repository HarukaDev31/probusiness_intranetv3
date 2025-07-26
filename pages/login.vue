<template>
  <div class="min-h-screen flex">
    <!-- Left Side - Orange Background with Container -->
    <div class="hidden lg:flex lg:w-1/2 bg-orange-500 relative overflow-hidden">
      <!-- Shipping Container -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="relative">
          <!-- Container Shadow -->
          <div class="absolute -bottom-4 -right-4 w-full h-4 bg-orange-600 rounded-lg transform rotate-12 opacity-30"></div>
          
          <!-- Main Container -->
          <div class="relative w-80 h-56 bg-white rounded-lg transform rotate-12 shadow-2xl">
            <!-- Container Front Face -->
            <div class="absolute inset-0 bg-white rounded-lg border-2 border-gray-300">
              <!-- Corrugated Panels -->
              <div class="absolute inset-0 flex">
                <div v-for="i in 8" :key="i" class="flex-1 border-r border-gray-300"></div>
              </div>
              
              <!-- Container Markings -->
              <div class="absolute top-4 left-4 text-xs font-bold text-gray-800">
                <div>ATSU 120185</div>
                <div>22G1</div>
              </div>
              
              <!-- Square Box with Number -->
              <div class="absolute top-4 right-4 w-6 h-6 border-2 border-gray-800 flex items-center justify-center">
                <span class="text-xs font-bold">6</span>
              </div>
              
              <!-- Specifications -->
              <div class="absolute bottom-4 left-4 text-xs text-gray-700 space-y-1">
                <div class="flex justify-between w-32">
                  <span>MAX. GF</span>
                  <span>30.480 KGS</span>
                </div>
                <div class="flex justify-between w-32">
                  <span>TARE</span>
                  <span>2.200 KGS</span>
                </div>
                <div class="flex justify-between w-32">
                  <span>NET</span>
                  <span>28.280 KGS</span>
                </div>
                <div class="flex justify-between w-32">
                  <span>CU. CAF</span>
                  <span>67.200 LBS</span>
                </div>
              </div>
            </div>
            
            <!-- Container Right Side -->
            <div class="absolute -right-8 top-0 w-8 h-56 bg-gray-200 rounded-r-lg transform rotate-90 origin-left">
              <!-- Probusiness Logo on Side -->
              <div class="absolute inset-0 flex items-center justify-center transform -rotate-90">
                <div class="flex items-center space-x-2">
                  <div class="relative">
                    <div class="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
                    </div>
                    <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-orange-500"></div>
                  </div>
                  <span class="text-sm font-bold text-black">probusiness</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side - Login Form -->
    <div class="flex-1 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <!-- Login Card -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <!-- Header/Logo -->
          <div class="text-center mb-8">
            <div class="flex items-center justify-center space-x-2 mb-6">
              <div class="relative">
                <div class="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
                </div>
                <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-orange-500"></div>
              </div>
              <span class="text-xl font-bold text-black">probusiness</span>
            </div>
            
            <!-- Welcome Message -->
            <h2 class="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido de nuevo!</h2>
            <p class="text-gray-600">Ingresa tu correo y contraseña para acceder a tu cuenta</p>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Email Field -->
            <div>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <input
                  v-model="email"
                  type="email"
                  required
                  class="block w-full pl-10 pr-3 py-3 border-b-2 border-gray-300 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="admin"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="block w-full pl-10 pr-12 py-3 border-b-2 border-gray-300 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg v-if="showPassword" class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                  </svg>
                  <svg v-else class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Forgot Password Link -->
            <div class="text-right">
              <a href="#" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                Recuperar contraseña
              </a>
            </div>

            <!-- Login Button -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <div v-if="loading" class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </button>
          </form>

          <!-- Error Message -->
          <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Define layout for this page
definePageMeta({
  layout: 'auth'
})

// Auth composable
const { login, loading, error } = useAuth()

// Login page state
const email = ref('admin')
const password = ref('')
const showPassword = ref(false)

// Login handler
const handleLogin = async () => {
  const success = await login({
    email: email.value,
    password: password.value
  })
  
  if (success) {
    // Redirect to dashboard on success
    await navigateTo('/')
  }
}

// Set page title
useHead({
  title: 'Iniciar Sesión - Probusiness'
})
</script> 