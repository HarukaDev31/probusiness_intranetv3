export interface DeleteReasonOption {
  id: number
  name: string
}

export interface DeleteCotizacionReasonModalHandlers {
  fetchReasons: () => Promise<DeleteReasonOption[]>
  createReason: (name: string) => Promise<void>
  updateReason: (id: number, name: string) => Promise<void>
  deleteReason: (id: number) => Promise<void>
  confirmDeleteCotizacion: (reasonId: number) => Promise<void>
}

