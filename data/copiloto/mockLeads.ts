import type { CopilotoLead } from '~/types/copiloto/lead'

/** Datos de demostración (maqueta probusiness-dashboard) hasta conectar API. */
export const MOCK_COPILOTO_LEADS: CopilotoLead[] = [
  {
    id: 'lead-1',
    av: 'CM',
    name: 'Carlos Mendoza',
    sub: 'En línea · Meta Ads · Cliente activo',
    score: 84,
    prob: '78%',
    temp: 82,
    tLbl: 'Caliente (82%)',
    action: 'Responder cotización ahora',
    why: 'Lead en línea. Cada min sin respuesta baja 4% la prob. de cierre.',
    prev: '¿Cuánto demora el envío?',
    dot: '#ef4444',
    cbm: '14.8 CBM',
    inv: 'S/ 38,400',
    advisorId: 'gianella',
    advisorName: 'Gianella Ríos',
    hist: [
      { f: 'Mar 25', r: 'SHG→CLO', c: '14 CBM', p: 'S/ 6,200' },
      { f: 'Ene 25', r: 'SHG→CLO', c: '15.2 CBM', p: 'S/ 6,800' },
      { f: 'Nov 24', r: 'GZH→CLO', c: '14.5 CBM', p: 'S/ 7,100' }
    ],
    msgs: [
      {
        dir: 'in',
        txt: 'Hola, vi su publicidad en Facebook. Quiero importar ropa de China. ¿Cuánto cobran?',
        t: '10:42',
        temp: 55,
        sigs: ['Intención de compra', 'Pregunta por precio'],
        why: 'Primer mensaje con intención de compra clara.'
      },
      {
        dir: 'out',
        txt: '¡Hola Carlos! Claro, con gusto. ¿Qué tipo de prendas y qué volumen aproximado manejas?',
        t: '10:45'
      },
      {
        dir: 'in',
        txt: 'Textiles, como 10-15 CBM al mes. Estoy comparando opciones con otros agentes.',
        t: '10:47',
        temp: 48,
        sigs: ['Comparador activo', 'Volumen definido']
      },
      {
        dir: 'out',
        txt: 'Entiendo. Te puedo dar precio fijo en flete — sin sorpresas. ¿Te armo una cotización hoy mismo?',
        t: '10:49'
      },
      {
        dir: 'in',
        txt: 'Sí, me interesa. ¿Cuánto demora el envío desde Shanghai?',
        t: '10:52',
        temp: 74,
        sigs: ['Interés confirmado', 'Señal de cierre próximo']
      }
    ]
  },
  {
    id: 'lead-2',
    av: 'AQ',
    name: 'Ana Quispe',
    sub: 'Última vez 3h · TikTok · Primera importación',
    score: 52,
    prob: '32%',
    temp: 45,
    tLbl: 'Tibio (45%)',
    action: 'Enviar reactivación con gancho',
    why: '3h de silencio post-interés. Un mensaje con valor concreto recupera el 40% de estos leads.',
    prev: 'Necesito pensarlo, te aviso.',
    dot: '#eab308',
    cbm: '—',
    inv: '—',
    advisorId: 'pedro',
    advisorName: 'Pedro Soto',
    hist: [],
    msgs: [
      {
        dir: 'in',
        txt: 'Buenas, vi tu video en TikTok sobre importar de China. ¿Cómo funciona?',
        t: '09:30',
        temp: 50,
        sigs: ['Interés inicial']
      },
      {
        dir: 'out',
        txt: '¡Hola Ana! Con gusto te explico. ¿Qué producto tienes en mente importar?',
        t: '09:34'
      },
      {
        dir: 'in',
        txt: 'Accesorios de moda. Pero no sé nada del proceso, es mi primera vez.',
        t: '09:36',
        temp: 42,
        sigs: ['Primera importación']
      },
      {
        dir: 'out',
        txt: 'No te preocupes, te guío desde cero. ¿Tienes un volumen estimado?',
        t: '09:38'
      },
      {
        dir: 'in',
        txt: 'Mmm necesito pensarlo. Te aviso.',
        t: '09:45',
        temp: 25,
        sigs: ['Postergación clara']
      },
      { dir: 'sys', txt: '⏳ 3 horas sin respuesta del cliente — copiloto en espera', t: '' }
    ]
  },
  {
    id: 'lead-3',
    av: 'LP',
    name: 'Luis Paredes',
    sub: 'Inactivo 48h · Orgánico · Sin historial',
    score: 22,
    prob: '8%',
    temp: 15,
    tLbl: 'Frío (15%)',
    action: 'Último intento o archivar',
    why: 'Score crítico (22). Si no responde en 24h, archivar y liberar tiempo.',
    prev: 'Hola, quería saber precios.',
    dot: '#94a3b8',
    cbm: '—',
    inv: '—',
    advisorId: 'lucia',
    advisorName: 'Lucía Vega',
    hist: [],
    msgs: [
      {
        dir: 'in',
        txt: 'Hola, quería saber precios de importación.',
        t: 'Hace 2d',
        temp: 30,
        sigs: ['Consulta genérica']
      },
      {
        dir: 'out',
        txt: 'Hola Luis, ¡claro! ¿Qué producto y qué volumen aproximado?',
        t: 'Hace 2d'
      },
      { dir: 'sys', txt: '⬇ 48 horas sin respuesta del cliente', t: '' }
    ]
  }
]
