export interface ClientesViewProps {
  role?: string
  basePath: string
  backBasePath?: string
}

export type ProveedorManualStatus = 'Pendiente' | 'Solicitado' | 'Entregado' | 'Observado' | 'Revisado'
