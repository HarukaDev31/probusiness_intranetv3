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
                  <img class="img-logo" src="/assets/img/logos/logo_probusiness.png" alt="Logo ProBusiness" title="Logo ProBusiness">
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
                          :class="showPassword ? 'fa-solid fa-fw fa-eye-slash' : 'fa-solid fa-fw fa-eye'"
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
              <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-600">{{ error }}</p>
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,100..900;1,100..900&display=swap');

* {
  font-family: 'Epilogue', sans-serif;
}

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

.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-heading {
  padding: 20px;
  border-bottom: 1px solid #eee;
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

.Welcome p {
  color: #666;
  font-size: 14px;
  margin-bottom: 0;
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

.input-group-addon {
  background-color: #f8f9fa;
  border-right: 1px solid #ddd;
  padding: 10px 12px;
  color: #666;
}

.form-control {
  flex: 1;
  border: none;
  padding: 12px;
  font-size: 14px;
  outline: none;
}

.form-control:focus {
  box-shadow: none;
  border-color: #FF6700;
}

.input-group:focus-within {
  border-color: #FF6700;
  box-shadow: 0 0 0 2px rgba(255, 103, 0, 0.2);
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

.btn-link:hover {
  color: #FF6700;
  text-decoration: none;
}

.btn-block {
  width: 100%;
}

.toggle-password {
  padding: 10px 12px;
  background-color: #f8f9fa;
  border-left: 1px solid #ddd;
  color: #666;
}

.help-block {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
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