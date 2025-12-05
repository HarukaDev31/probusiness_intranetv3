<template>
  <div class="fondo_pantalla">
    <div class="">
      <div class="justify-between items-center flex w-full">
        <!-- Background Image -->
        <div class="bg-image" alt="Portada ProBusiness" title="Portada ProBusiness">
          <img src="/assets/img/backgrounds/portada_probusiness.png" class="image" alt="Portada ProBusiness" title="Portada ProBusiness">
        </div>
        
        <!-- Login Panel -->
        <div class="panel-container">
          <div class="panel panel-default">
            <div class="panel-heading">
              <div class="row row-login-logo">
                <div class="col-md-12 col-lg-12 text-center">
                  <img class="img-logo" :src="logoSrc" alt="Logo ProBusiness" title="Logo ProBusiness">
                </div>
              </div>
            </div>
            <div class="panel-body">
              <!-- Login Form -->
              <form @submit.prevent="handleLogin" id="form-login">
                <div id="div-login" class="row">
                  <div class="Welcome" style="text-align: center;">
                    <div><h2>¡Bienvenido de nuevo!</h2></div>
                    <p>Ingresa tu correo y contraseña para acceder a tu cuenta</p><br>
                  </div>
                  
                  <!-- Email Field -->
                  <div class="col-xs-12 col-sm-6 col-md-12 col-lg-12">
                    <div class="form-group">
                      <div class="input-group">
                        <span class="input-group-addon">
                          <i class="fa-solid fa-user fa-lg" aria-hidden="true"></i>
                        </span>
                        <input
                          v-model="email"
                          type="text"
                          id="txt-usuario"
                          name="No_Usuario"
                          inputmode="email"
                          class="form-control inputBgOpaque input-Minuscula input-username"
                          autocomplete="on"
                          autocorrect="off"
                          autocapitalize="none"
                          placeholder="Ingresa tu correo"
                          required
                        />
                      </div>
                      <span class="help-block" id="error"></span>
                    </div>
                  </div>

                  <!-- Password Field -->
                  <div class="col-xs-12 col-sm-6 col-md-12 col-lg-12">
                    <div class="form-group">
                      <div class="input-group">
                        <span class="input-group-addon">
                          <i class="fa-solid fa-lock fa-lg" aria-hidden="true"></i>
                        </span>
                        <input
                          v-model="password"
                          :type="showPassword ? 'text' : 'password'"
                          id="txt-password"
                          name="No_Password"
                          class="form-control pwd inputBgOpaque"
                          autocomplete="on"
                          placeholder="Ingresa tu contraseña"
                          required
                        />
                        <span 
                          @click="showPassword = !showPassword"
                          :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                          class="field-icon toggle-password"
                          style="cursor: pointer;"
                        ></span>
                      </div>
                      <span class="help-block" id="error"></span>
                    </div>
                  </div>

                  <!-- Forgot Password Link -->
                  <div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                    <div class="form-group">
                      <div class="div-msg"></div>
                      <button type="button" id="btn-recuperar_cuenta" class="btn btn-link btn-md btn-block">
                        Recuperar contraseña
                      </button><br>
                    </div>
                  </div>

                  <!-- Login Button -->
                  <div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                    <div class="form-group">
                      <button 
                        type="submit" 
                        id="btn-login" 
                        class="btn btn-success btn-md btn-block"
                        :disabled="loading"
                      >
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                        {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              <!-- Error Message -->
              <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
              </div>

             
            </div>
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
import { useAuth } from '../composables/auth/useAuth'
import { useSpinner } from '../composables/commons/useSpinner'
// Auth composable
const { login, loading, error } = useAuth()

// Color mode composable
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// Logo handling: usar URL pública del intranet para el logo oscuro
const intranetLogoUrl = 'https://intranetback.probusiness.pe/storage/logo_icons/logo_header_white.png'
const localLogo = '/assets/img/logos/logo_probusiness.png'
const logoSrc = computed(() => isDark.value ? intranetLogoUrl : localLogo)

import { onMounted } from 'vue'

// Login page state
const email = ref('')
const password = ref('')
const showPassword = ref(false)

// Preload images before showing the UI using the global spinner
const { withSpinner } = useSpinner()

const preloadImage = (url: string, timeout = 10_000) => {
  return new Promise<void>((resolve, reject) => {
    try {
      const img = new Image()
      let timer: any = null
      img.onload = () => {
        if (timer) clearTimeout(timer)
        resolve()
      }
      img.onerror = (e) => {
        if (timer) clearTimeout(timer)
        resolve()
      }
      img.src = url
      timer = setTimeout(() => {
        resolve()
      }, timeout)
    } catch (err) {
      resolve()
    }
  })
}

onMounted(() => {
  // preload both background and logo (logoSrc may be external)
  withSpinner(async () => {
    const bg = '/assets/img/backgrounds/portada_probusiness.png'
    const logo = isDark.value ? intranetLogoUrl : localLogo
    await Promise.all([preloadImage(bg), preloadImage(logo)])
  }, 'Cargando...')
})

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

// Theme toggle handler
const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Set page title
useHead({
  title: 'Iniciar Sesión - Probusiness'
})
</script>

<style scoped>

.fondo_pantalla {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #FF6700;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 5%;
}

.bg-image {
  position: relative;
  width: 55%;
  height: 100%;
  z-index: 1;
  opacity: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.panel-container {
  background-color: white;
  position: relative;
  width: 40%;
  height: 90%;
  z-index: 2;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  min-height: 700px;
}

/* Dark mode styles for panel */
.dark .panel-container {
  background-color: #1f2937;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-heading {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

/* Dark mode styles for panel heading */
.dark .panel-heading {
  border-bottom: 1px solid #374151;
}

.panel-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.img-logo {
  width: 70%;
  max-width: 250px;
  height: auto;
}

.Welcome h2 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

/* Dark mode styles for welcome text */
.dark .Welcome h2 {
  color: #f9fafb;
}

.Welcome p {
  color: #666;
  font-size: 14px;
  margin-bottom: 0;
}

/* Dark mode styles for welcome paragraph */
.dark .Welcome p {
  color: #d1d5db;
}

.form-group {
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

/* Dark mode styles for input group */
.dark .input-group {
  border: 1px solid #4b5563;
}

.input-group-addon {
  background-color: #f8f9fa;
  border-right: 1px solid #ddd;
  padding: 10px 12px;
  color: #666;
}

/* Dark mode styles for input group addon */
.dark .input-group-addon {
  background-color: #374151;
  border-right: 1px solid #4b5563;
  color: #d1d5db;
}

.form-control {
  flex: 1;
  border: none;
  padding: 12px;
  font-size: 14px;
  outline: none;
  background-color: white;
  color: #333;
}

/* Dark mode styles for form control */
.dark .form-control {
  background-color: #374151;
  color: #f9fafb;
}

.dark .form-control::placeholder {
  color: #9ca3af;
}

.form-control:focus {
  box-shadow: none;
  border-color: #FF6700;
}

.input-group:focus-within {
  border-color: #FF6700;
  box-shadow: 0 0 0 2px rgba(255, 103, 0, 0.2);
}

/* Dark mode focus styles */
.dark .input-group:focus-within {
  border-color: #FF6700;
  box-shadow: 0 0 0 2px rgba(255, 103, 0, 0.3);
}

.btn {
  padding: 12px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-success {
  background-color: #FF6700;
  color: white;
}

.btn-success:hover {
  background-color: #E55A00;
}

.btn-success:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  color: #585858;
  text-decoration: none;
  text-align: start;
  padding-top: 2%;
  padding-bottom: 2%;
  border: none;
  font-size: 14px;
}

/* Dark mode styles for link button */
.dark .btn-link {
  color: #d1d5db;
}

.btn-link:hover {
  color: #FF6700;
  text-decoration: none;
}

.btn-block {
  width: 100%;
}

.toggle-password {
  padding: 14px;
  background-color: #f8f9fa;
  border-left: 1px solid #ddd;
  color: #666;
}

/* Dark mode styles for toggle password */
.dark .toggle-password {
  background-color: #374151;
  border-left: 1px solid #4b5563;
  color: #d1d5db;
}

.help-block {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

/* Dark mode styles for help block */
.dark .help-block {
  color: #f87171;
}

.div-msg {
  min-height: 20px;
}

/* Responsive Design */
@media (min-width: 992px) and (max-width: 1199px) {
  .panel-container {
    width: 40%;
    right: 5%;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .panel-container {
    width: 100%;
    right: 0%;
    top: 0%;
    height: 100%;
    border-radius: 0;
  }
}

@media (min-width: 576px) and (max-width: 767px) {
  .panel-container {
    width: 100%;
    right: 0%;
    top: 0%;
    height: 100%;
    border-radius: 0;
  }
}

@media (max-width: 575px) {
  .panel-container {
    width: 100%;
    right: 0%;
    top: 0%;
    height: 100%;
    border-radius: 0;
  }
}

/* Mobile improvements: stack layout, center panel, hide background image, increase tap targets */
@media (max-width: 768px) {
  .fondo_pantalla {
    flex-direction: column;
    padding: 4% 6%;
    align-items: center;
    justify-content: flex-start;
    min-height: 100vh;
  }
  .bg-image {
    display: none;
  }
  .panel-container {
    width: 100%;
    max-width: 440px;
    min-height: auto;
    height: auto;
    margin: 1.5rem 0;
    border-radius: 12px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.18);
  }
  .panel-body {
    padding: 1.25rem;
  }
  .img-logo {
    width: 60%;
    margin: 0 auto 0.5rem auto;
    display: block;
  }
  .Welcome h2 { font-size: 22px; }
  .Welcome p { font-size: 14px; }
  .form-control { padding: 12px; font-size: 15px }
  .btn-success { padding: 14px 18px; font-size: 16px; border-radius: 8px }
  .toggle-password { padding: 14px }
}

/* Font Awesome Icons */
.fa-solid {
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
}

/* Spinner for loading state */
.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: text-bottom;
  border: 0.125em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

.me-2 {
  margin-right: 0.5rem;
}
</style> 