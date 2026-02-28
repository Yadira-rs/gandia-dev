/**
 * GANDIA — perfilAuditorCache
 * Caché a nivel módulo para PerfilAuditor.
 * Archivo separado para cumplir con react-refresh/only-export-components.
 */

export interface AmbitoCached {
  id:          string
  title:       string
  description: string
  nivel:       'Federal' | 'Internacional'
}

export interface AuditoriaCached {
  id:          string
  nombre:      string
  tipo:        string
  fecha:       string
  resultado:   'aprobado' | 'observaciones' | 'suspendido'
  puntuacion:  string
}

export interface DictamenCached {
  id:     string
  folio:  string
  titulo: string
  tipo:   string
  fecha:  string
  estado: 'favorable' | 'observaciones' | 'desfavorable'
}

export interface NormativaCached {
  id:    string
  clave: string
  desc:  string
}

export interface AcredCached {
  id:     string
  nombre: string
  vence:  string
  estado: 'vigente' | 'por-vencer' | 'vencido'
}

export interface AuditorExtendedCached {
  titulo:                   string
  ubicacion:                string
  registro_senasica:        string
  organizacion:             string
  anios_exp:                number | null
  descripcion:              string
  telefono:                 string
  email_contact:            string
  sitio_web:                string
  horario:                  string
  auditorias_realizadas:    number | null
  cumplimiento_prom:        number | null
  estados_cubiertos:        number | null
  audits_mes:               number | null
  auditorias_aprobadas:     number | null
  dictamenes_sin_apelacion: number | null
  certs_export_ok:          number | null
  dictamenes_total:         number | null
  ambitos:                  AmbitoCached[]
  auditorias:               AuditoriaCached[]
  dictamenes:               DictamenCached[]
  normativas:               NormativaCached[]
  acreditaciones:           AcredCached[]
}

export let auditorExtCache: AuditorExtendedCached | null = null

export function setAuditorExtCache(data: AuditorExtendedCached | null) {
  auditorExtCache = data
}

export function invalidatePerfilAuditorCache() {
  auditorExtCache = null
}