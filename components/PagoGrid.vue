  <template>
    <div class="pago-grid">
      <div class="grid-container">
        <div v-for="pago in props.pagoDetails" :key="pago.id_pago">
          <div class="pago-item" @click="openPagoDetailsModal(pago)">
            <div class="pago-content"
              :class="STATUS_BG_PAGOS_CLASSES[pago.status as keyof typeof STATUS_BG_PAGOS_CLASSES]">
              {{ formatCurrency(parseFloat(pago.monto), props.currency) }}
            </div>
          </div>
        </div>
        <div v-for="index in numberOfPagos - computedCountPagosDetails" :key="index" class="pago-item"
          @click="openCreatePagoModal(index)">
          <div class="pago-content">
            <UIcon name="i-heroicons-plus" class="md:w-6 md:h-6 w-4 h-4" />

          </div>
        </div>
      </div>
    </div>
  </template>

<script setup lang="ts">
import { useOverlay } from '#imports'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import PagoDetailsModal from '~/components/commons/PagoDetailsModal.vue'
import type { PagosDetails } from '~/types/cargaconsolidada/clientes/pagos'
import { STATUS_BG_CLASSES, STATUS_BG_PAGOS_CLASSES } from '~/constants/ui'
import { useUserRole } from '~/composables/auth/useUserRole'
const { currentRole, currentId, isCoordinacion } = useUserRole()
const overlay = useOverlay()
const modalPagos = overlay.create(CreatePagoModal)
const modalPagoDetails = overlay.create(PagoDetailsModal)
interface Props {
  numberOfPagos: number
  pagoDetails: PagosDetails[]
  clienteNombre: string
  currency: string
  showDelete?: boolean
}
const computedCountPagosDetails = computed(() => {
  return props.pagoDetails.length
})
const props = withDefaults(defineProps<Props>(), {
  currency: 'PEN',
  showDelete: true
})

const emit = defineEmits<{
  openModal: [pagoIndex: number]
  save: [data: any]
  close: []
  delete: [pagoId: number]
}>()

const openCreatePagoModal = (pagoIndex: number) => {

  modalPagos.open({
    clienteNombre: props.clienteNombre,
    currency: props.currency,
    onClose: () => {
      emit('close')
    },
    onSave: (data: any) => {
      emit('save', data)
    }
  })

}



const openPagoDetailsModal = (pago: PagosDetails) => {

  modalPagoDetails.open({
    pagoDetails: pago,
    currency: props.currency,
    showDelete: props.showDelete,
    onDelete: (pagoId: number) => {
      if (props.showDelete) {
        emit('delete', pagoId)
      }
    },
    onClose: () => {
      emit('close')
    }
  })

}
</script>

<style scoped>
.pago-grid {
  width: 100%;
}

.grid-container {
  display: flex;
  flex-direction: row;
  padding: 1rem;
  gap: .5rem;
}

.pago-item:hover {

  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pago-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 0.5em;
  border: 1px solid #dee2e6;
  padding: 0.8rem;
  cursor: pointer;
  width: 7em;
}

.pago-icon {
  width: 40px;
  height: 40px;
  background: #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.pago-text {
  font-weight: 500;
  font-size: 0.9rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.2rem;
    padding: 0.2rem;
    align-items: center;
  }

  .pago-item {
    padding: 0.2rem;
    min-height: 50px;
  }

  .pago-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .pago-text {
    font-size: 0.8rem;
  }
}
</style>
