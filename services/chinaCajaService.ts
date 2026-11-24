import { BaseService } from './base/BaseService'
import type { ChinaCashHistory, ChinaCashMonth, ChinaContainer, ChinaContainerOptions, ChinaPending } from '~/types/china-caja'

interface One<T> { success: boolean; data: T }

/** Etapas, Estado de contenedores, Flujo de caja e Inicio del Encargado China. */
export class ChinaCajaService extends BaseService {
  private static baseUrl = '/api/china-caja'

  static pending() {
    return this.apiCall<One<ChinaPending[]>>(`${this.baseUrl}/pendientes`)
  }

  static containers(scope: 'shipping' | 'stages' = 'shipping') {
    return this.apiCall<One<ChinaContainer[]> & { options: ChinaContainerOptions }>(`${this.baseUrl}/contenedores?scope=${scope}`)
  }

  static updateContainer(id: number, values: Record<string, string | number | boolean | File | null>) {
    const form = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value instanceof File) form.append(key, value)
      else if (typeof value === 'boolean') form.append(key, value ? '1' : '0')
      else form.append(key, value === null ? '' : String(value))
    })
    return this.apiCall<One<ChinaContainer>>(`${this.baseUrl}/contenedores/${id}`, { method: 'POST', body: form })
  }

  static payFreight(ids: number[], paidOn: string, voucher: File | null) {
    const form = new FormData()
    ids.forEach((id) => form.append('container_ids[]', String(id)))
    form.append('paid_on', paidOn)
    if (voucher) form.append('voucher', voucher)
    else form.append('manual', '1')
    return this.apiCall<One<{ id: number }>>(`${this.baseUrl}/fletes`, { method: 'POST', body: form })
  }

  static cancelFreight(id: number) {
    return this.apiCall(`${this.baseUrl}/fletes/${id}`, { method: 'DELETE' })
  }

  static month(month: string) {
    return this.apiCall<One<ChinaCashMonth>>(`${this.baseUrl}/meses/${month}`)
  }

  static history(year: number) {
    return this.apiCall<One<ChinaCashHistory[]>>(`${this.baseUrl}/cierres/${year}`)
  }

  static settings(month: string, body: { exchange_rate?: number; opening_balance?: number }) {
    return this.apiCall(`${this.baseUrl}/meses/${month}`, { method: 'PUT', body })
  }

  static closeWeek(month: string, startsOn: string, balance: number, screenshot: File) {
    const form = new FormData()
    form.append('starts_on', startsOn)
    form.append('balance', String(balance))
    form.append('screenshot', screenshot)
    return this.apiCall(`${this.baseUrl}/meses/${month}/semanas`, { method: 'POST', body: form })
  }

  static closeMonth(month: string, balance: number) {
    return this.apiCall(`${this.baseUrl}/meses/${month}/cerrar`, { method: 'POST', body: { balance } })
  }

  static addFixedCost(body: { name: string; amount: number }) {
    return this.apiCall(`${this.baseUrl}/costos-fijos`, { method: 'POST', body })
  }

  static toggleFixedCost(id: number, active: boolean) {
    return this.apiCall(`${this.baseUrl}/costos-fijos/${id}`, { method: 'PUT', body: { active } })
  }

  static removeFixedCost(id: number) {
    return this.apiCall(`${this.baseUrl}/costos-fijos/${id}`, { method: 'DELETE' })
  }

  static addInvestment(body: { name: string; amount: number; due_on: string }) {
    return this.apiCall(`${this.baseUrl}/inversiones`, { method: 'POST', body })
  }

  static payInvestment(id: number, body: { paid_on: string; again_on?: string; again_amount?: number }) {
    return this.apiCall(`${this.baseUrl}/inversiones/${id}/pagar`, { method: 'POST', body })
  }

  static removeInvestment(id: number) {
    return this.apiCall(`${this.baseUrl}/inversiones/${id}`, { method: 'DELETE' })
  }
}
