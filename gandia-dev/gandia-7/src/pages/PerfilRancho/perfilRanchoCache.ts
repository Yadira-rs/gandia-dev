/**
 * GANDIA — perfilRanchoCache
 * Caché a nivel módulo para PerfilRancho.
 * Archivo separado para cumplir con react-refresh/only-export-components.
 */

export interface RanchExtendedCached {
  bio:            string
  surface_ha:     number | null
  capacity_heads: number | null
  active_heads:   number | null
  exportable_pct: number | null
  founded_year:   number | null
  address_street: string
  municipality:   string
  postal_code:    string
  lat:            number | null
  lng:            number | null
  email_contact:  string
  website:        string
  grazing_system: string
  supplementation:string
  water_supply:   string
  infrastructure: { key: string; label: string; value: string }[]
  certifications: { label: string; value: string }[]
  mortality_pct:  number | null
  weight_gain_kg: number | null
  team_members:   { name: string; role: string; ini: string }[]
  team_roles:     string[]
  linked_mvz:     { name: string; license: string; ini: string } | null
}

export interface ActivityItemCached {
  id:    number
  title: string
  desc:  string
  time:  string
  ico:   string
}

export let extCache:      RanchExtendedCached | null = null
export let activityCache: ActivityItemCached[]       = []

export function setExtCache(data: RanchExtendedCached | null) {
  extCache = data
}

export function setActivityCache(data: ActivityItemCached[]) {
  activityCache = data
}

export function invalidatePerfilRanchoCache() {
  extCache      = null
  activityCache = []
}