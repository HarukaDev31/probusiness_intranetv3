/**
 * Archivo central que importa y ejecuta todos los registros de eventos por rol
 * 
 * Para agregar un nuevo evento:
 * 1. Ve al archivo del rol correspondiente (ej: cotizador.ts)
 * 2. Usa registerEventHandler() y subscribeEventToRole()
 * 3. El evento se registrará automáticamente al iniciar la aplicación
 */

import { registerAdminEvents } from './admin'
import { registerCotizadorEvents } from './cotizador'
import { registerDocumentacionEvents } from './documentacion'
import { registerContenedorConsolidadoEvents } from './contenedor-consolidado'
import { registerContenedorAlmacenEvents } from './contenedor-almacen'
import { registerCoordinacionEvents } from './coordinacion'
import { registerUserEvents } from './user'

/**
 * Registra todos los eventos de todos los roles
 * Esta función se ejecuta antes de la suscripción a los canales
 */
export const registerAllRoleEvents = () => {
  console.log('📡 Registrando eventos de WebSocket por rol...')
  
  registerAdminEvents()
  registerCotizadorEvents()
  registerDocumentacionEvents()
  registerContenedorConsolidadoEvents()
  registerContenedorAlmacenEvents()
  registerCoordinacionEvents()
  registerUserEvents()
  
  console.log('✅ Todos los eventos de roles registrados')
}

