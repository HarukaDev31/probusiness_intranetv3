/** Textos de ayuda (ícono «i») de Flujo de caja. */
export const CHINA_INFO: Record<string, Array<[string, string]>> = {
  tc: [['Uso:', 'escribe el tipo de cambio general del mes. Los montos se guardan en RMB; con él se ven en USD y entran los fletes.'], ['Cerrado:', 'en un mes cerrado el TC queda fijo.']],
  cerrar: [['Uso:', 'se habilita solo en el último mes abierto. Pide el saldo del estado de cuenta y lo compara con el sistema.'], ['Resultado:', 'el saldo final pasa como saldo inicial del mes siguiente.']],
  saldo: [['Fuente:', 'último saldo escrito en un cierre semanal. No se calcula con movimientos.'], ['Sin cierres:', 'muestra el saldo inicial del mes.']],
  ingresos: [['Fuente:', 'Operaciones (cobros confirmados) y Pago a proveedores (USD del socio ya cambiados a RMB).'], ['Debajo:', 'lo proyectado: cobros pendientes con fecha de llegada del contenedor.']],
  egresos: [['Fuente:', 'Estado de contenedores (fletes), Pago a proveedores (RMB pagado), Costos fijos e Inversiones.'], ['Debajo:', 'lo que falta salir en el periodo.']],
  util: [['Fórmula:', 'ingresos − egresos del periodo.'], ['Negativo:', 'si sale más de lo que entra se ve en rojo.'], ['Debajo:', 'lo proyectado al cierre de la semana o del mes.']],
  weeks: [['Barras:', 'verde = ingresos, naranja = egresos. Sólido ya pasó, rayado está por pasar.'], ['Uso:', 'clic en una semana para filtrar.'], ['Semanas:', 'de lunes a domingo. Se cierran el lunes siguiente, antes de mover dinero.'], ['Cerrar semana:', 'sube el pantallazo del banco, el saldo y los USD por cambiar. Luego queda solo lectura.']],
  cliIn: [['Fórmula:', 'suma de cobros e ingresos de cada cliente en el periodo (reales + proyectados).'], ['%:', 'participación sobre el total de ingresos.']],
  cliOut: [['Fórmula:', 'suma de pagos a proveedores de cada cliente en el periodo.'], ['Generales:', 'fletes, costos fijos e inversiones no son de un solo cliente y se agrupan aparte.']],
  late: [['Qué es:', 'cobros de operaciones y pagos de flete que pasaron su fecha límite: 7 días antes del arribo del contenedor.'], ['Días:', 'desde esa fecha límite. Rojo oscuro: más de 14 días.'], ['Uso:', 'Abrir lleva a Operaciones o a Estado de contenedores; al registrar el pago sale de la lista.']],
  pend: [['Qué es:', 'cobros y pagos proyectados que aún no pasan.'], ['Cobros y fletes:', 'vencen 7 días antes del arribo del contenedor; aquí se ve la cuenta regresiva. Al pasar esa fecha van a Cobros y pagos atrasados.'], ['Colores:', 'naranja: vence en 3 días o menos.'], ['Uso:', 'Abrir lleva a la sección donde se registra.']],
  movs: [['Qué es:', 'solo los movimientos ya realizados (reales) del periodo.'], ['Uso:', 'filtra por origen; el filtro también aplica a Por realizar.']],
  fijos: [['Qué es:', 'gastos que se repiten cada mes.'], ['Cálculo:', 'se descuentan solos el último día del mes como egreso.'], ['Uso:', 'interruptor para pausar, × para eliminar (pide confirmación).']],
  invs: [['Qué es:', 'inversiones del año para operar en China.'], ['Barra:', 'pagado ÷ presupuesto.'], ['Uso:', 'al marcar pagada se pregunta si se vuelve a invertir y en qué fecha.']],
  gran: [['Uso:', 'agrupa los cierres por mes, trimestre o semestre. Tarjetas, gráficos y comparación cambian juntos.']],
  chIn: [['Qué es:', 'ingresos y egresos de cada periodo. Sólido = real, rayado = proyectado.']],
  uHist: [['Fórmula:', 'utilidad de cada periodo = ingresos − egresos.'], ['Barras:', 'verde arriba = ganó, rojo abajo = perdió. Rayado incluye montos proyectados.'], ['Acum.:', 'suma de la utilidad desde enero.']],
  ch0: [['Fuente:', 'saldo final del mes anterior.']],
  ch1: [['Fórmula:', 'ingresos del mes − egresos del mes.']],
  ch2: [['Fórmula:', 'saldo inicial + variación de caja.'], ['Uso:', 'pasa como saldo inicial del mes siguiente.']],
  chT: [['Qué es:', 'cada periodo en una columna: ingresos, egresos, % contra el anterior (total) y saldo final.'], ['Según banco:', 'saldo del estado de cuenta escrito al cerrar; diferencia = banco − sistema.'], ['Uso:', '"Ver mes" abre el flujo de ese mes en solo lectura.']]
}
