/**
 * GANDIA — perfilMVZCache
 * Caché a nivel módulo para PerfilMVZ.
 * Archivo separado para cumplir con react-refresh/only-export-components.
 */

export interface EstudioCached {
  id:          string
  grado:       string
  institucion: string
  periodo:     string
  tipo:        'licenciatura' | 'maestria' | 'diplomado'
}

export interface ExpCached {
  id:          string
  cargo:       string
  empresa:     string
  periodo:     string
  descripcion: string
  activo:      boolean
}

export interface CertCached {
  id:     string
  nombre: string
  vence:  string
  estado: 'vigente' | 'por-vencer' | 'vencido'
}

export interface ClienteCached {
  id:        string
  nombre:    string
  municipio: string
  cabezas:   string
  tipo:      string
}

export interface ServicioCached {
  id:     string
  label:  string
  precio: string
}

export interface MVZExtendedCached {
  bio:                  string
  titulo:               string
  ubicacion:            string
  cedula:               string
  senasica_num:         string
  universidad:          string
  anio_egreso:          number | null
  anios_exp:            number | null
  celular:              string
  email_contact:        string
  sitio_web:            string
  disponibilidad:       string
  diagnostico_acertado: number | null
  clientes_contrato:    number | null
  certs_aprobados:      number | null
  visitas_mes:          number | null
  certs_emitidos:       number | null
  ranchos_atendidos:    number | null
  animales_anio:        number | null
  estados_cobertura:    string[]
  especialidades:       string[]
  estudios:             EstudioCached[]
  experiencias:         ExpCached[]
  certificaciones:      CertCached[]
  clientes:             ClienteCached[]
  servicios:            ServicioCached[]
}

export let mvzExtCache: MVZExtendedCached | null = null

export function setMVZExtCache(data: MVZExtendedCached | null) {
  mvzExtCache = data
}

export function invalidatePerfilMVZCache() {
  mvzExtCache = null
}