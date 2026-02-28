// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface PassportData {
  id:           string
  siniiga:      string
  rfid:         string
  raza:         string
  sexo:         string
  peso:         string
  nacimiento:   string
  upp:          string
  propietario:  string
  exportLabel:  string
  verificado:   string
  estatus:      'Elegible' | 'En revisión' | 'Suspendido'
  photo:        string
  mrz:          [string, string]
  vacunas:      { nombre: string; fecha: string; vence: string; estado: 'vigente' | 'vencida' }[]
  movimientos:  { fecha: string; origen: string; destino: string; tipo: string }[]
}

// ─── DATOS SIMULADOS ──────────────────────────────────────────────────────────

export const MOCK_PASSPORT: PassportData = {
  id:          'EJM-892',
  siniiga:     '01-2388-4799-20',
  rfid:        'MEX-A-00892',
  raza:        'Angus × Charolais',
  sexo:        'Macho entero',
  peso:        '450 kg',
  nacimiento:  '12 ENE 2024',
  upp:         'Rancho La Esperanza',
  propietario: 'Arturo Valenzuela R.',
  exportLabel: '★ Arete Azul · USA',
  verificado:  '2026-02-19',
  estatus:     'Elegible',
  photo:       'https://images.unsplash.com/photo-1546445317-29f4545e9d53?q=80&w=600',
  mrz: [
    'P<MEX<BOVINO<<EJM892<<<<<<<<<<<<<<<<<<<',
    '012388479920MEX2024012246M<<<<<<DURANGO<NORTE<4',
  ],
  vacunas: [
    { nombre: 'Fiebre Aftosa',       fecha: '2025-08-01', vence: '2026-08-01', estado: 'vigente'  },
    { nombre: 'Brucelosis',          fecha: '2025-06-15', vence: '2026-06-15', estado: 'vigente'  },
    { nombre: 'Rabia Paralítica',    fecha: '2024-11-20', vence: '2025-11-20', estado: 'vencida'  },
    { nombre: 'Carbón Sintomático',  fecha: '2025-09-10', vence: '2026-09-10', estado: 'vigente'  },
  ],
  movimientos: [
    { fecha: '2026-01-12', origen: 'Rancho La Esperanza', destino: 'SINIIGA Central', tipo: 'Registro'       },
    { fecha: '2025-11-03', origen: 'Agostadero Norte',    destino: 'Rancho La Esperanza', tipo: 'Traslado'   },
    { fecha: '2025-07-22', origen: 'UPP Origen',          destino: 'Agostadero Norte', tipo: 'Traslado'       },
  ],
}

// Función para detectar si el mensaje del usuario habla de pasaportes
export function detectPassportIntent(text: string): boolean {
  const keywords = [
    'pasaporte', 'passport', 'ejm', 'siniiga', 'arete azul',
    'trazabilidad', 'expediente', 'bovino', 'exportar animal',
    'pasaporte digital', 'crear pasaporte', 'ver pasaporte',
  ]
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k))
}