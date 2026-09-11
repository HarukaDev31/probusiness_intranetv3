<template>
  <UModal :show="show" @close="closeModal">
    <template #header>
      <div class="text-lg font-semibold">
        Crear vendedor
      </div>
    </template>

    <template #body>
      <div class="space-y-4 w-full">
        <template v-if="!credencialesGeneradas">
          <p class="text-sm text-gray-500">
            El vendedor se crea con rol Cotizador en tu propia organización. El correo, la
            contraseña y el celular se generan automáticamente.
          </p>

          <UFormField label="Nombres y apellidos" required>
            <UInput
              v-model="nombresApellidos"
              placeholder="Nombre completo"
              class="w-full"
              @keyup.enter="handleCrear"
            />
          </UFormField>
        </template>

        <template v-else>
          <p class="text-sm text-gray-500">
            Guarda estas credenciales, no se volverán a mostrar aquí.
          </p>
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm">
            <div><span class="font-medium">Correo:</span> {{ credencialesGeneradas.email }}</div>
            <div><span class="font-medium">Contraseña:</span> {{ credencialesGeneradas.password }}</div>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton v-if="!credencialesGeneradas" color="neutral" variant="outline" @click="closeModal">
          Cancelar
        </UButton>
        <UButton
          v-if="!credencialesGeneradas"
          color="primary"
          :loading="loading"
          :disabled="!canSubmit || loading"
          @click="handleCrear"
        >
          Crear vendedor
        </UButton>
        <UButton v-else color="primary" @click="closeModal">
          Listo
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { GrupoService } from '~/services/panelAcceso/grupoService'
import { UsuarioAdminService } from '~/services/panelAcceso/usuarioAdminService'
import { useModal } from '~/composables/commons/useModal'

interface Props {
  show?: boolean
  onCreated?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  show: true
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { showError, showSuccess } = useModal()

const loading = ref(false)
const nombresApellidos = ref('')
const credencialesGeneradas = ref<{ email: string; password: string } | null>(null)

const canSubmit = computed(() => nombresApellidos.value.trim() !== '')

const closeModal = () => {
  nombresApellidos.value = ''
  credencialesGeneradas.value = null
  emit('close')
}

function slugify(texto: string, fallback: string): string {
  const sinTildes = texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  const slug = sinTildes.replace(/[^a-z0-9]+/g, '').replace(/^\.+|\.+$/g, '')
  return slug || fallback
}

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)]
  }
  return pass
}

function generarCelular(): string {
  // Placeholder numérico único (9 dígitos, formato PE) para no dejar el
  // campo vacío; el vendedor lo actualizará con su celular real luego.
  let numero = '9'
  for (let i = 0; i < 8; i++) {
    numero += Math.floor(Math.random() * 10)
  }
  return numero
}

const handleCrear = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    // id_grupo se resuelve siempre dentro de la organización del usuario
    // autenticado (GrupoService ya filtra por ella en el backend); nunca se
    // manda un id_grupo "adivinado" de otra organización.
    const gruposRes = await GrupoService.getGrupos({ search: 'Cotizador' })
    const grupoCotizador = gruposRes.data?.find(
      (g) => g.cargo.trim().toLowerCase() === 'cotizador'
    )

    if (!grupoCotizador) {
      showError('No se pudo crear el vendedor', 'No se encontró el cargo "Cotizador" en tu organización.')
      return
    }

    const nombre = nombresApellidos.value.trim()
    const primerNombre = nombre.split(/\s+/)[0] || nombre
    const usuarioSlug = slugify(primerNombre, 'vendedor')
    const dominioSlug = slugify(grupoCotizador.organizacion || '', 'empresa')
    const password = generarPassword()

    // Reintenta con un sufijo distinto si el correo autogenerado ya existe.
    let intento = 0
    let ultimoMensaje = 'Intenta nuevamente.'
    while (intento < 5) {
      const sufijo = intento === 0 ? '' : String(Math.floor(10 + Math.random() * 90))
      const email = `${usuarioSlug}${sufijo}@${dominioSlug}.com`

      // id_empresa / id_org se ignoran en el backend salvo para la organización
      // admin (ID_Organizacion=1): siempre se fuerza la del usuario autenticado.
      const res = await UsuarioAdminService.createUsuario({
        id_empresa: grupoCotizador.id_empresa,
        id_org: grupoCotizador.id_org,
        id_grupo: grupoCotizador.id,
        usuario: email,
        nombres_apellidos: nombre,
        password,
        password_sin_encriptar: password,
        celular: generarCelular(),
        estado: 1
      })

      if (res.success) {
        showSuccess('Vendedor creado', 'El vendedor se creó correctamente.')
        credencialesGeneradas.value = { email, password }
        props.onCreated?.()
        return
      }

      ultimoMensaje = typeof res.message === 'string' ? res.message : ultimoMensaje
      const yaExiste = /ya existe/i.test(ultimoMensaje)
      if (!yaExiste) {
        showError('No se pudo crear el vendedor', ultimoMensaje)
        return
      }
      intento++
    }

    showError('No se pudo crear el vendedor', ultimoMensaje)
  } catch (error: any) {
    showError('Error al crear el vendedor', error?.message || 'Intenta nuevamente.')
  } finally {
    loading.value = false
  }
}
</script>
