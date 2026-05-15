import type { SoporteTiChatsPorUuid, SoporteTiSolicitud } from '~/types/soporteTi'
import { resolverEstado } from '~/constants/soporteTiEstados'

function camposEstado(nombre: string) {
  const e = resolverEstado(nombre)
  return { estadoId: e.id, estadoCodigo: e.codigo, estado: e.nombre }
}

/** UUID fijos de demo (salas de chat estables entre recargas). */
export const SOPORTE_TI_SEED_CHAT_UUIDS = {
  PRJ_001: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  PRJ_002: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  REQ_001: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  REQ_002: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  REQ_003: '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
  REQ_004: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
  PRJ_003: '6ba7b815-9dad-11d1-80b4-00c04fd430c8'
} as const

export function getSoporteTiSeedSolicitudes(): SoporteTiSolicitud[] {
  return [
    {
      chatUuid: SOPORTE_TI_SEED_CHAT_UUIDS.PRJ_001,
      codigo: 'PRJ-001',
      tipo: 'A',
      subtipoB: null,
      titulo: 'Portal de reportes financieros',
      area: 'Finanzas',
      solicitante: 'María Torres',
      pm: 'Jorge M.',
      analista: 'Ana T.',
      criticidad: 'Alta',
      ...camposEstado('En maqueta'),
      faseIndex: 1,
      progreso: 25,
      slaHoras: 72,
      horasTranscurridas: 30,
      fechaRegistro: '10 may',
      ultimaActualizacion: '12 may',
      fechaFinEstimado: '30 may',
      maqueta: null
    },
    {
      chatUuid: SOPORTE_TI_SEED_CHAT_UUIDS.PRJ_002,
      codigo: 'PRJ-002',
      tipo: 'A',
      subtipoB: null,
      titulo: 'Módulo de inventario v2',
      area: 'Logística',
      solicitante: 'Carlos Ríos',
      pm: 'Jorge M.',
      analista: 'Roberto S.',
      criticidad: 'Media',
      ...camposEstado('En progreso'),
      faseIndex: 2,
      progreso: 55,
      slaHoras: 48,
      horasTranscurridas: 20,
      fechaRegistro: '05 may',
      ultimaActualizacion: '12 may',
      fechaFinEstimado: '25 may',
      maqueta: {
        nombre: 'inventario_mock.png',
        tamano: '1.4 MB',
        fechaEntrega: '11 may',
        aprobada: true
      }
    },
    {
      chatUuid: SOPORTE_TI_SEED_CHAT_UUIDS.REQ_001,
      codigo: 'REQ-001',
      tipo: 'B',
      subtipoB: 'B1',
      titulo: 'Error al generar PDF en facturación',
      area: 'Finanzas',
      solicitante: 'María Torres',
      pm: null,
      analista: 'Roberto S.',
      criticidad: 'Baja',
      ...camposEstado('Pendiente'),
      faseIndex: 0,
      progreso: 0,
      slaHoras: 8,
      horasTranscurridas: 2,
      fechaRegistro: '13 may',
      ultimaActualizacion: '13 may',
      fechaFinEstimado: null,
      maqueta: null
    },
    {
      chatUuid: SOPORTE_TI_SEED_CHAT_UUIDS.REQ_002,
      codigo: 'REQ-002',
      tipo: 'B',
      subtipoB: 'B2',
      titulo: 'Acceso módulo RRHH para nuevos usuarios',
      area: 'RRHH',
      solicitante: 'Luis Vera',
      pm: null,
      analista: 'Ana T.',
      criticidad: 'Baja',
      ...camposEstado('Hecho'),
      faseIndex: 0,
      progreso: 100,
      slaHoras: 4,
      horasTranscurridas: 3,
      fechaRegistro: '11 may',
      ultimaActualizacion: '12 may',
      fechaFinEstimado: null,
      maqueta: null
    },
    {
      chatUuid: SOPORTE_TI_SEED_CHAT_UUIDS.REQ_003,
      codigo: 'REQ-003',
      tipo: 'B',
      subtipoB: 'B1',
      titulo: 'Dashboard no carga en Safari',
      area: 'TI',
      solicitante: 'Sofía Mena',
      pm: null,
      analista: 'Roberto S.',
      criticidad: 'Media',
      ...camposEstado('En progreso'),
      faseIndex: 0,
      progreso: 60,
      slaHoras: 16,
      horasTranscurridas: 10,
      fechaRegistro: '12 may',
      ultimaActualizacion: '13 may',
      fechaFinEstimado: null,
      maqueta: null
    },
    {
      chatUuid: SOPORTE_TI_SEED_CHAT_UUIDS.REQ_004,
      codigo: 'REQ-004',
      tipo: 'B',
      subtipoB: 'B2',
      titulo: 'Ajuste textos en correos automáticos',
      area: 'Marketing',
      solicitante: 'Pedro Chu',
      pm: null,
      analista: 'Ana T.',
      criticidad: 'Baja',
      ...camposEstado('Desplegado'),
      faseIndex: 0,
      progreso: 100,
      slaHoras: 4,
      horasTranscurridas: 4,
      fechaRegistro: '09 may',
      ultimaActualizacion: '11 may',
      fechaFinEstimado: null,
      maqueta: null
    },
    {
      chatUuid: SOPORTE_TI_SEED_CHAT_UUIDS.PRJ_003,
      codigo: 'PRJ-003',
      tipo: 'A',
      subtipoB: null,
      titulo: 'Integración con ERP externo',
      area: 'Operaciones',
      solicitante: 'Rosa Lima',
      pm: 'Jorge M.',
      analista: 'Ana T.',
      criticidad: 'Máxima',
      ...camposEstado('Observado'),
      faseIndex: 3,
      progreso: 80,
      slaHoras: 120,
      horasTranscurridas: 130,
      fechaRegistro: '01 may',
      ultimaActualizacion: '10 may',
      fechaFinEstimado: '20 jun',
      maqueta: {
        nombre: 'erp_wireframe.pdf',
        tamano: '2.3 MB',
        fechaEntrega: '05 may',
        aprobada: true
      }
    }
  ]
}

export function getSoporteTiSeedChats(): SoporteTiChatsPorUuid {
  return {
    [SOPORTE_TI_SEED_CHAT_UUIDS.PRJ_001]: [
      {
        id: 1,
        remitente: 'Sistema',
        iniciales: 'SYS',
        color: '#64748b',
        texto: 'Ticket PRJ-001 creado. SLA asignado: 72h.',
        esSistema: true,
        marcaTiempo: '10 may 09:00'
      },
      {
        id: 2,
        remitente: 'María Torres',
        iniciales: 'MT',
        color: '#6d28d9',
        texto: 'Adjunto el documento de requerimientos iniciales del portal.',
        esSistema: false,
        marcaTiempo: '10 may 10:15',
        imagenes: [
          {
            url: 'https://placehold.co/400x240/e9d5ff/6d28d9?text=Requerimientos',
            nombre: 'requerimientos.png'
          }
        ]
      },
      {
        id: 3,
        remitente: 'Jorge M.',
        iniciales: 'JM',
        color: '#1d4ed8',
        texto: 'Revisado. Iniciando fase de levantamiento. ¿Disponible mañana a las 10am?',
        esSistema: false,
        marcaTiempo: '10 may 14:00'
      },
      {
        id: 4,
        remitente: 'María Torres',
        iniciales: 'MT',
        color: '#6d28d9',
        texto: 'Confirmado para mañana 10am.',
        esSistema: false,
        marcaTiempo: '10 may 14:30',
        replyToId: 3,
        replyTo: {
          id: 3,
          remitente: 'Jorge M.',
          texto: 'Revisado. Iniciando fase de levantamiento…'
        }
      }
    ],
    [SOPORTE_TI_SEED_CHAT_UUIDS.REQ_003]: [
      {
        id: 1,
        remitente: 'Sistema',
        iniciales: 'SYS',
        color: '#64748b',
        texto: 'Ticket REQ-003 creado. SLA: 16h.',
        esSistema: true,
        marcaTiempo: '12 may 08:00'
      },
      {
        id: 2,
        remitente: 'Sofía Mena',
        iniciales: 'SM',
        color: '#6d28d9',
        texto: 'El problema ocurre en Safari 16+. Adjunto captura de la consola.',
        esSistema: false,
        marcaTiempo: '12 may 08:20',
        imagenes: [
          {
            url: 'https://placehold.co/400x200/fee2e2/b91c1c?text=Consola+Safari',
            nombre: 'consola_safari.png'
          }
        ]
      }
    ]
  }
}
