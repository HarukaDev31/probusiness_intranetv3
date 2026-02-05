<template>
  <div class="fondo_pantalla">
    <div class="login-wrapper">
      <!-- Background Image -->
      <div class="bg-image">
        <img 
          src="/assets/img/backgrounds/portada_probusiness.webp" 
          width="1920" 
          height="1080" 
          class="image" 
          alt=""
          role="presentation"
          loading="lazy"
        />
      </div>
      
      <!-- Login Panel -->
      <div class="panel-container">
        <div class="panel">
          <div class="panel-heading">
            <div class="logo-container">
              <img 
                class="img-logo" 
                :src="logoSrc" 
                width="200" 
                height="200" 
                alt="Logo ProBusiness"
                loading="eager"
              />
            </div>
          </div>
          <div class="panel-body">
            <!-- Login Form -->
            <form @submit.prevent="handleLogin" id="form-login" novalidate>
              <div class="welcome-section">
                <h2>¡Bienvenido de nuevo!</h2>
                <p>Ingresa tu correo y contraseña para acceder a tu cuenta</p>
              </div>
              
              <!-- Email Field -->
              <div class="form-group">
                <label for="txt-usuario" class="sr-only">Correo electrónico</label>
                <div class="input-group">
                  <span class="input-group-addon" aria-hidden="true">
                    <i class="fa-solid fa-user fa-lg"></i>
                  </span>
                  <input
                    v-model="email"
                    type="email"
                    id="txt-usuario"
                    name="No_Usuario"
                    class="form-control"
                    autocomplete="email"
                    autocorrect="off"
                    autocapitalize="none"
                    placeholder="Ingresa tu correo"
                    required
                    aria-required="true"
                    :aria-invalid="error ? 'true' : 'false'"
                  />
                </div>
                <span v-if="error" class="help-block" role="alert">{{ error }}</span>
              </div>

              <!-- Password Field -->
              <div class="form-group">
                <label for="txt-password" class="sr-only">Contraseña</label>
                <div class="input-group">
                  <span class="input-group-addon" aria-hidden="true">
                    <i class="fa-solid fa-lock fa-lg"></i>
                  </span>
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    id="txt-password"
                    name="No_Password"
                    class="form-control"
                    autocomplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    required
                    aria-required="true"
                    :aria-invalid="error ? 'true' : 'false'"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    :aria-pressed="showPassword"
                    class="toggle-password"
                    tabindex="0"
                  >
                    <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- Forgot Password Link -->
              <div class="form-group">
                <button 
                  type="button" 
                  id="btn-recuperar_cuenta" 
                  class="btn btn-link"
                  aria-label="Recuperar contraseña"
                >
                  Recuperar contraseña
                </button>
              </div>

              <!-- Login Button -->
              <div class="form-group">
                <button 
                  type="submit" 
                  id="btn-login" 
                  class="btn btn-success btn-block"
                  :disabled="loading"
                  :aria-busy="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span :aria-live="loading ? 'polite' : 'off'">
                    {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
                  </span>
                </button>
              </div>
            </form>

            <!-- Error Message -->
            <div 
              v-if="error" 
              class="error-message" 
              role="alert"
              aria-live="assertive"
            >
              <p>{{ error }}</p>
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
const localLogo = '/assets/img/logos/logo_probusiness.webp'
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
    const bg = '/assets/img/backgrounds/portada_probusiness.webp'
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

.login-wrapper {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
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

.dark .panel-heading {
  border-bottom: 1px solid #374151;
}

.logo-container {
  text-align: center;
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

.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-section h2 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.dark .welcome-section h2 {
  color: #f9fafb;
}

.welcome-section p {
  color: #666;
  font-size: 14px;
  margin-bottom: 0;
}

.dark .welcome-section p {
  color: #d1d5db;
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
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
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.toggle-password:hover {
  background-color: #e9ecef;
}

.toggle-password:focus {
  outline: 2px solid #FF6700;
  outline-offset: -2px;
}

.dark .toggle-password {
  background-color: #374151;
  border-left: 1px solid #4b5563;
  color: #d1d5db;
}

.dark .toggle-password:hover {
  background-color: #4b5563;
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

.error-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
}

.dark .error-message {
  background-color: rgba(127, 29, 29, 0.2);
  border-color: #991b1b;
}

.error-message p {
  margin: 0;
  font-size: 0.875rem;
  color: #dc2626;
}

.dark .error-message p {
  color: #f87171;
}

/* Responsive Design */
@media (min-width: 992px) and (max-width: 1199px) {
  .panel-container {
    width: 40%;
  }
}

/* Tablet and below */
@media (max-width: 991px) {
  .fondo_pantalla {
    flex-direction: column;
    padding: 4% 6%;
    align-items: center;
    justify-content: flex-start;
    min-height: 100vh;
  }

  .login-wrapper {
    flex-direction: column;
    width: 100%;
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

  .welcome-section h2 { 
    font-size: 22px; 
  }

  .welcome-section p { 
    font-size: 14px; 
  }

  .form-control { 
    padding: 12px; 
    font-size: 15px;
  }

  .btn-success { 
    padding: 14px 18px; 
    font-size: 16px; 
    border-radius: 8px;
  }

  .toggle-password { 
    padding: 14px;
  }
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