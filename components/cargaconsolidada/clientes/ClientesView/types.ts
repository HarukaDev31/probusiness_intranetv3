export interface ClientesViewProps {
  role?: string
  basePath: string
  backBasePath?: string
}

export type ProveedorManualStatus = 'Pendiente' | 'Recibido' | 'Observado' | 'Revisado'
