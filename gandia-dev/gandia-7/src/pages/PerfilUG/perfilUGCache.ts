/**
 * GANDIA — perfilUGCache
 * Caché a nivel módulo para PerfilUG.
 * Archivo separado para cumplir con react-refresh/only-export-components.
 */

export interface DirectivoCached {
  id:       string
  nombre:   string
  cargo:    string
  periodo:  string
  email:    string
  telefono: string
}

export interface ZonaCached {
  id:         string
  zona:       string
  municipios: string
  cabezas:    string
}

export interface ServicioCached {
  icon:  string
  title: string
  desc:  string
}

export interface AfiliacionCached {
  siglas: string
  nombre: string
  nivel:  string
}

export interface UGExtendedCached {
  bio:                 string
  naturaleza:          string
  ubicacion:           string
  fundacion:           number | null
  rfc:                 string
  organismo_nacional:  string
  afil_sagarpa:        string
  socios_activos:      number | null
  municipios_count:    number | null
  cabezas_registradas: number | null
  anios_trayectoria:   number | null
  cuota_mensual:       number | null
  proxima_asamblea:    string
  socios_al_corriente: number | null
  tramites_mes:        number | null
  satisfaccion:        number | null
  tramites_activos:    number | null
  tramites_en_proceso: number | null
  telefono:            string
  email_contact:       string
  sitio_web:           string
  horario:             string
  direccion:           string
  directiva:           DirectivoCached[]
  zonas:               ZonaCached[]
  servicios:           ServicioCached[]
  afiliaciones:        AfiliacionCached[]
}

export let ugExtCache: UGExtendedCached | null = null

export function setUGExtCache(data: UGExtendedCached | null) {
  ugExtCache = data
}

export function invalidatePerfilUGCache() {
  ugExtCache = null
}