interface ChinaOperationAmounts {
  billing_type: string
  cbm: number | null
  rate: number | null
  amount: number | null
  fob: number | null
  freight: number | null
  costs: { amount: number | null }[]
}

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

/**
 * Total de una operación para mostrarlo mientras se escribe.
 * Es la MISMA fórmula que ChinaBillingCalculator::operationMetrics (backend), que recalcula y guarda al registrar:
 * servicio (CBM × tarifa, o monto fijo) + FOB + flete + costos adicionales.
 */
export function chinaOperationTotal(data: ChinaOperationAmounts): number {
  const service = data.billing_type === 'cbm'
    ? Number(data.cbm || 0) * Number(data.rate || 0)
    : Number(data.amount || 0)
  const extras = data.costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0)
  return roundMoney(roundMoney(service) + Number(data.fob || 0) + Number(data.freight || 0) + roundMoney(extras))
}
