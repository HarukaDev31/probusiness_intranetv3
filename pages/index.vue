<template>
  <section class="content-header px-4 xl:px-4 sm:px-2" style="height: 93vh;">
    <!-- Hero Section -->
    <div class="hero-section relative h-100 bg-cover bg-center bg-no-repeat rounded-lg mb-4" 
         style="background-image: url('https://intranet.probusiness.pe/assets/img/backgrounds/inicioview.png');">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="container relative flex items-center mx-4 h-full">
        <div class="text-white lg:text-5xl sm:text-4xl text-4xl xl:py-5 main-text font-normal z-10">
          ¡Hola,<br> bienvenido!
        </div>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="container px-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 h-full min-h-50">
        <!-- Dollar Stats -->
        <div class="col-span-1 h-full px-1">
          <div class="card stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 h-full">
            <div class="card-body flex justify-between items-center px-0 h-full">
              <div class="icon-container px-2">
                <i class="bi bi-currency-dollar stat-icon text-2xl text-orange-500 dark:text-orange-400"></i>
              </div>
              <div class="text-container text-center">
                <div class="text-3xl font-bold text-gray-800 dark:text-white" id="Dolars import">15M</div>
                <p class="text-muted dark:text-gray-400 text-center text-sm">Dólares en importaciones</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Users Stats -->
        <div class="col-span-1 h-full px-1">
          <div class="card stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 h-full">
            <div class="card-body flex justify-between items-center px-0 h-full">
              <div class="icon-container px-2">
                <i class="bi bi-people stat-icon text-2xl text-blue-500 dark:text-blue-400"></i>
              </div>
              <div class="text-container text-center">
                <div class="text-3xl font-bold text-gray-800 dark:text-white" id="Clients satisfied">5K</div>
                <p class="text-muted dark:text-gray-400 text-center text-sm">Clientes satisfechos</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Package Stats -->
        <div class="col-span-1 h-full px-1">
          <div class="card stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 h-full">
            <div class="card-body flex justify-between items-center px-0 h-full">
              <div class="icon-container px-2">
                <i class="bi bi-box-seam stat-icon text-2xl text-green-500 dark:text-green-400"></i>
              </div>
              <div class="text-container text-center">
                <div class="text-3xl font-bold text-gray-800 dark:text-white" id="CBM sells">1100</div>
                <p class="text-muted dark:text-gray-400 text-center text-sm">CBM vendidos</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Container Stats -->
        <div class="col-span-1 h-full px-1">
          <div class="card stat-card bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 h-full">
            <div class="card-body flex justify-between items-center px-0 h-full">
              <div class="icon-container px-2">
                <i class="fas fa-ship stat-icon text-2xl text-purple-500 dark:text-purple-400"></i>
              </div>
              <div class="text-container text-center">
                <div class="text-3xl font-bold text-gray-800 dark:text-white" id="Containers imported">10K</div>
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