/**
 * GANDIA — perfilExportadorCache
 * Caché a nivel módulo para PerfilExportador.
 * Archivo separado para cumplir con react-refresh/only-export-components.
 */

export interface DirectivoCached {
  id:       string
  nombre:   string
  cargo:    string
  email:    string
  telefono: string
}

export interface ProveedorCached {
  id:      string
  nombre:  string
  estado:  string
  cabezas: string
  clase:   'A' | 'B' | 'C'
}
export interface CruceCached {
  id:      string
  ciudad:  string
  destino: string
  activo:  boolean
}

export interface CertCached {
  id:          string
  nombre:      string
  numero:      string
  vencimiento: string
  estado:      'vigente' | 'por-vencer' | 'vencido'
}

export interface OperacionCached {
  id:          string
  destino:     string
  bandera:     string
  cabezas:     string
  porcentaje:  number
  estado:      string
}

export interface ExportadorExtendedCached {
  razon_social:           string
  naturaleza:             string
  ubicacion:              string
  fundacion:              number | null
  rfc:                    string
  licencia_usda:          string
  descripcion:            string
  empleados:              number | null
  rastros_tif:            number | null
  corrales_concentracion: number | null
  telefono:               string
  email_contact:          string
  sitio_web:              string
  horario:                string
  tasa_rechazo:           number | null
  cabezas_embarque:       number | null
  cumplimiento_doc:       number | null
  cabezas_anio:           number | null
  paises_destino:         number | null
  valor_exportado:        number | null
  equipo:                 DirectivoCached[]
  proveedores:            ProveedorCached[]
  cruces:                 CruceCached[]
  certificaciones:        CertCached[]
  operaciones:            OperacionCached[]
}

export let exportadorExtCache: ExportadorExtendedCached | null = null

export function setExportadorExtCache(data: ExportadorExtendedCached | null) {
  exportadorExtCache = data
}

export function invalidatePerfilExportadorCache() {
  exportadorExtCache = null
}