/**
 * useBiometriaConfig.ts — Config biométrica persistida en localStorage
 * ARCHIVO → src/artifacts/biometria/widgets/useBiometriaConfig.ts
 *
 * Migración futura: reemplazar load/save por fetch a tabla biometria_config en Supabase
 */

export interface BiometriaConfig {
  umbral_match:     number
  umbral_candidato: number
  umbral_nuevo:     number
  peso_cv:          number
  peso_ia:          number
  calidad_min:      number
}

export interface Parametro {
  id:     string
  grupo:  string
  label:  string
  desc:   string
  valor:  string
  tag?:   string
  tagOk?: boolean
}

export const PARAMS_DEFAULT: Parametro[] = [
  { id: 'umbral_match',     grupo: 'Umbrales', label: 'Umbral match',      desc: 'Score mínimo para identificación automática',     valor: '0.90', tag: 'Recomendado', tagOk: true  },
  { id: 'umbral_candidato', grupo: 'Umbrales', label: 'Umbral candidato',  desc: 'Zona gris — requiere confirmación manual',        valor: '0.80'                                    },
  { id: 'umbral_nuevo',     grupo: 'Umbrales', label: 'Umbral nuevo',      desc: 'Por debajo → registrar como animal nuevo',        valor: '0.70'                                    },
  { id: 'peso_cv',          grupo: 'Motor',    label: 'Peso Fingerprint',  desc: 'Porcentaje motor clásico en la fusión',           valor: '55%',  tag: 'Activo',     tagOk: true  },
  { id: 'peso_ia',          grupo: 'Motor',    label: 'Peso IA Embedding', desc: 'Complementario al motor clásico (suma 100%)',     valor: '45%'                                     },
  { id: 'calidad_min',      grupo: 'Captura',  label: 'Calidad mínima',    desc: 'Imágenes por debajo se rechazan automáticamente', valor: '65%',  tag: 'Revisar',    tagOk: false },
]

export function storageKey(ranchoId: string) {
  return `biometria_config_${ranchoId}`
}

export function loadConfig(ranchoId: string | null): Parametro[] {
  if (!ranchoId) return PARAMS_DEFAULT
  try {
    const raw = localStorage.getItem(storageKey(ranchoId))
    if (!raw) return PARAMS_DEFAULT
    const saved = JSON.parse(raw) as Record<string, string>
    return PARAMS_DEFAULT.map(p => ({ ...p, valor: saved[p.id] ?? p.valor }))
  } catch {
    return PARAMS_DEFAULT
  }
}

export function saveConfig(ranchoId: string, params: Parametro[]) {
  const map: Record<string, string> = {}
  params.forEach(p => { map[p.id] = p.valor })
  localStorage.setItem(storageKey(ranchoId), JSON.stringify(map))
}

export function parseBiometriaConfig(params: Parametro[]): BiometriaConfig {
  const get    = (id: string) => parseFloat(params.find(p => p.id === id)?.valor ?? '0')
  const getPct = (id: string) => parseFloat(params.find(p => p.id === id)?.valor ?? '0') / 100
  return {
    umbral_match:     get('umbral_match'),
    umbral_candidato: get('umbral_candidato'),
    umbral_nuevo:     get('umbral_nuevo'),
    peso_cv:          getPct('peso_cv'),
    peso_ia:          getPct('peso_ia'),
    calidad_min:      getPct('calidad_min'),
  }
}

/** Hook para consumir la config desde cualquier componente */
export function useBiometriaConfig(ranchoId: string | null): BiometriaConfig {
  return parseBiometriaConfig(loadConfig(ranchoId))
}