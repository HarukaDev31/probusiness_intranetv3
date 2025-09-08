<template>
  <section class="content-header px-4 xl:px-4 sm:px-2" style="height: 93vh;">
    <!-- Hero Section -->
    <div class="hero-section relative h-100 bg-cover bg-center bg-no-repeat  mb-4 rounded-xl" 
         style="background-image: url('https://intranet.probusiness.pe/assets/img/backgrounds/inicioview.png');">
      <div class="absolute inset-0 "></div>
      <div class="container relative flex items-center mx-4 h-full">
        <div class="text-white lg:text-5xl sm:text-4xl text-4xl xl:py-5 main-text font-normal z-10">
          ¡Hola,<br> bienvenido!
        </div>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="container w-full max-w-full flex align-middle justify-center mb-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-1 h-full min-h-50 max-w-7xl">
        <!-- Dollar Stats -->
        <div class="col-span-1 h-full px-1">
          <div class="card stat-card bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 h-40">
            <div class="card-body flex justify-between items-center px-4 h-full">
              <div class="icon-container px-2">
                <i class="fa fa-dollar text-6xl text-orange-500 "></i>
              </div>
              <div class="text-container text-center">
                <div class="text-7xl font-bold text-gray-800 dark:text-white" id="Dolars import">15M</div>
                <p class="text-muted dark:text-gray-400 text-center text-sm">Dólares en importaciones</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Users Stats -->
        <div class="col-span-1 h-full px-1">
          <div class="card stat-card bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 h-40">
            <div class="card-body flex justify-between items-center px-4 h-full">
              <div class="icon-container px-2">
                <i class="fa fa-users text-6xl text-orange-500 "></i>
              </div>
              <div class="text-container text-center">
                <div class="text-7xl font-bold text-gray-800 dark:text-white" id="Clients satisfied">5K</div>
                <p class="text-muted dark:text-gray-400 text-center text-sm">Clientes satisfechos</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Package Stats -->
        <div class="col-span-1 h-full px-1">
          <div class="card stat-card bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 h-40">
            <div class="card-body flex justify-between items-center px-4 h-full">
              <div class="icon-container px-2">
                <i class="fas fa-box-open stat-icon text-6xl text-orange-500 "></i>
              </div>
              <div class="text-container text-center">
                <div class="text-7xl font-bold text-gray-800 dark:text-white" id="CBM sells">1100</div>
                <p class="text-muted dark:text-gray-400 text-center text-sm">CBM vendidos</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Container Stats -->
        <div class="col-span-1 h-full px-1">
          <div class="card stat-card bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 h-40">
            <div class="card-body flex justify-between items-center px-4 h-full">
              <div class="icon-container px-2">
                <i class="fas fa-ship stat-icon text-6xl text-orange-500 "></i>
              </div>
              <div class="text-container text-center">
                <div class="text-7xl font-bold text-gray-800 dark:text-white" id="Containers imported">10K</div>
                <p class="text-muted dark:text-gray-400 text-center text-sm">Contenedores importados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>

<style scoped>
/* Estilos específicos para mantener la funcionalidad original */
@import url('https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,100..900;1,100..900&display=swap');

* {
  font-family: 'Epilogue', sans-serif;
}
.content-header {
  font-family: 'Epilogue', sans-serif;
}

.hero-section {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.main-text {
  font-weight: 400;
  z-index: 3;
}

.stat-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.dark .stat-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-container {
  flex: 1;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-text {
    font-size: 2rem;
  }
  
  .stat-card .card-body {
    flex-direction: column;
    gap: 1rem;
  }
  
  .icon-container {
    order: -1;
  }
}

@media (max-width: 640px) {
  .main-text {
    font-size: 1.75rem;
  }
}
</style> 