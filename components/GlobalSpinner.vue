<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isSpinning"
        class="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/50 backdrop-blur-sm loader-overlay">
        <div class="loader-container">
          <div class="logo-spinner">
            <div class="spinner-ring"></div>
            <div class="logo-container">
              <svg width="40" height="38" viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M33.4782 18.5198L23.4012 18.5168L30.5249 25.5186L26.8054 29.1115L19.6599 22.1416V32.0007H14.4333V22.1628L7.28935 29.1024L3.60112 25.4791L10.756 18.5213H0.635254L0.657098 13.4238L9.20523 13.4588C9.59215 13.8387 16.8329 20.9546 16.9686 21.0883C18.7129 19.3952 23.0766 15.1959 24.8817 13.4557L33.5001 13.4588L33.4782 18.5213V18.5198Z"
                  fill="#111111" />
                <path
                  d="M19.6554 9.82114L19.6601 0.00607932L14.432 0V9.83634L7.32391 2.87096L3.60449 6.46383L16.9688 19.5982L18.8598 17.7729L30.5298 6.50335L26.8431 2.88008L19.6554 9.82114Z"
                  fill="#FF500B" />
              </svg>
            </div>
          </div>
          <div class="loading-text">
            <span class="text-primary">Cargando</span>
            <span class="dots">
              <span class="dot">.</span>
              <span class="dot">.</span>
              <span class="dot">.</span>
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useSpinner } from '../composables/commons/useSpinner'
const { isSpinning, spinnerMessage } = useSpinner()


</script>
<style scoped>
.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
}

/* Dark mode overlay */
.dark .loader-overlay {
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(31, 41, 55, 0.95) 100%);
}

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.logo-spinner {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #FF500B;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
  box-shadow: 0 0 20px rgba(255, 80, 11, 0.3);
}

.spinner-ring::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border: 3px solid transparent;
  border-top: 3px solid rgba(255, 80, 11, 0.2);
  border-radius: 50%;
  animation: spin 2s linear infinite reverse;
}

.logo-container {
  position: relative;
  z-index: 2;
  background: white;
  border-radius: 50%;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: pulse 2s ease-in-out infinite;
}

/* Dark mode logo container */
.dark .logo-container {
  background: #1f2937;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(255, 80, 11, 0.2);
  }
}

/* Dark mode pulse animation adjustments */
.dark .logo-container {
  animation: pulseDark 2s ease-in-out infinite;
}

@keyframes pulseDark {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(255, 80, 11, 0.3);
  }
}

.loading-text {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.025em;
}

/* Dark mode loading text */
.dark .loading-text {
  color: #d1d5db;
}

.text-primary {
  color: #FF500B;
  margin-right: 0.25rem;
}

.dots {
  display: flex;
  gap: 0.125rem;
}

.dot {
  animation: dotPulse 1.4s ease-in-out infinite;
  color: #FF500B;
  font-weight: bold;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .logo-spinner {
    width: 100px;
    height: 100px;
  }
  
  .logo-container {
    padding: 0.75rem;
  }
  
  .loading-text {
    font-size: 1rem;
  }
}
</style>