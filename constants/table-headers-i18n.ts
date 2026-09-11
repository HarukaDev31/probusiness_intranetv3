import { ROLES } from '~/constants/roles'
import type { TableColumn } from '@nuxt/ui'

/**
 * Roles que ven tablas y menús en inglés.
 * Agregar un rol aquí activa la traducción en DataTable y SidebarMenu.
 */
export const TABLE_ENGLISH_ROLES: string[] = [
  ROLES.CONTENEDOR_ALMACEN,
]

/** Títulos de página / DataTable. */
export const TABLE_TITLES_EN: Record<string, string> = {
  'Carga Consolidada Abierta': 'Open Consolidated Cargo',
  'Carga Consolidada Completada': 'Completed Consolidated Cargo',
  Clientes: 'Customers',
}

/** Headers de columna y labels de filtro (español → inglés). */
export const TABLE_HEADERS_EN: Record<string, string> = {
  Carga: 'Cargo',
  Mes: 'Month',
  Año: 'Year',
  País: 'Country',
  'F. Cierre': 'Cut off',
  'F. Arribo': 'Arrival',
  'F. Entrega': 'Delivery',
  Empresa: 'Company',
  Estado: 'Status',
  'CBM Perú': 'CBM Peru',
  'CBM China': 'CBM China',
  'Límite CBM IMO': 'IMO CBM Limit',
  'CBM IMO': 'CBM IMO',
  Acciones: 'Actions',
  Cliente: 'Customer',
  'Tel. proveedor': 'Supplier Phone',
  Peso: 'Weight',
  Proveedor: 'Supplier',
  Fecha: 'Date',
  Contacto: 'Contact',
  'T. Cliente': 'Client type',
  Volumen: 'Volume',
  Asesor: 'Advisor',
  Productos: 'Products',
  'F. llegada': 'Arrival date',
  'F. Llegada': 'Arrival date',
  'Tipo Rotulado': 'Label type',
  Cotizacion: 'Quotation',
  Cotización: 'Quotation',
  Impuesto: 'Tax',
  Impuestos: 'Taxes',
  Logistica: 'Logistics',
  Logística: 'Logistics',
  Tarifa: 'Rate',
  Descuento: 'Discount',
  'Cargos extra': 'Extra charges',
  Todos: 'All',
  'Selecciona un año': 'Select a year',
  'Selecciona un estado': 'Select a status',
  'Seleccionar país': 'Select country',
  'Seleccionar estado': 'Select status',
  Rubro: 'Category',
  'Tipo Producto': 'Product Type',
  Campaña: 'Campaign',
  'Seleccionar rubro': 'Select category',
  'Seleccionar tipo': 'Select type',
  'Seleccionar campaña': 'Select campaign',
}

/** Nombres de menú (español → inglés). Fallback si no hay No_Menu_China. */
export const MENU_LABELS_EN: Record<string, string> = {
  Menú: 'Menu',
  'Carga Consolidada': 'Consolidated Cargo',
  Completados: 'Finished',
  Abiertos: 'Open',
  Embarcados: 'Shipped',
  Pendientes: 'Pending',
  Cotizaciones: 'Quotations',
  Clientes: 'Customers',
  Customers: 'Customers',
  Documentación: 'Documentation',
  Notificaciones: 'Notifications',
  Preferencias: 'Preferences',
  'Preferencias de avisos': 'Alert preferences',
  'Modo oscuro': 'Dark mode',
  'Cerrar sesión': 'Log out',
  'Cargando menú...': 'Loading menu...',
  'Expandir menú': 'Expand menu',
  'Minimizar menú': 'Collapse menu',
  Usuario: 'User',
  'Sin rol': 'No role',
  Inicio: 'Home',
  Perfil: 'Profile',
  Calendario: 'Calendar',
}

export function usesEnglishTableHeaders(role?: string | null): boolean {
  if (!role) return false
  const normalized = role.toLowerCase()
  return TABLE_ENGLISH_ROLES.some((item) => item.toLowerCase() === normalized)
}

export function translateTableText(text: string, role?: string | null): string {
  if (!usesEnglishTableHeaders(role)) return text
  return TABLE_TITLES_EN[text] || TABLE_HEADERS_EN[text] || text
}

export function translateMenuLabel(
  name: string,
  role?: string | null,
  nameEn?: string | null,
): string {
  if (!usesEnglishTableHeaders(role)) return name
  const fromDb = (nameEn || '').trim()
  if (fromDb) return fromDb
  return MENU_LABELS_EN[name] || TABLE_HEADERS_EN[name] || name
}

export function applyEnglishTableHeaders<T extends TableColumn<any>>(
  columns: T[],
  role?: string | null,
): T[] {
  if (!usesEnglishTableHeaders(role)) return columns
  return columns.map((col) => {
    if (typeof col.header === 'string') {
      return { ...col, header: TABLE_HEADERS_EN[col.header] || col.header }
    }
    return col
  })
}
