/**
 * PASO 3 — Edge Function: generate-mrz
 * 
 * DÓNDE CREAR:
 *   supabase/functions/generate-mrz/index.ts
 * 
 * CÓMO DESPLEGAR:
 *   supabase functions deploy generate-mrz --no-verify-jwt
 * 
 * CÓMO SE DISPARA:
 *   Se llama desde el cliente justo ANTES de insertar el animal.
 *   El cliente recibe el mrz[], luego hace el INSERT con esos valores.
 *   Alternativa: usar un Database Trigger (ver nota al final).
 * 
 * VARIABLES DE ENTORNO necesarias en Supabase Dashboard → Settings → Edge Functions:
 *   SUPABASE_URL        (ya viene automático)
 *   SUPABASE_SERVICE_KEY (ya viene automático — usa service_role para bypassear RLS)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ─── Tabla de pesos ICAO para dígito verificador ──────────────────────────────
const ICAO_WEIGHTS = [7, 3, 1]

const ICAO_VALUES: Record<string, number> = {
  '<': 0, '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14,
  'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19,
  'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24,
  'P': 25, 'Q': 26, 'R': 27, 'S': 28, 'T': 29,
  'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35,
}

/**
 * Calcula el dígito verificador ICAO sobre un string.
 * Caracteres desconocidos se tratan como 0.
 */
function checkDigit(input: string): string {
  let sum = 0
  for (let i = 0; i < input.length; i++) {
    const char = input[i].toUpperCase()
    const val  = ICAO_VALUES[char] ?? 0
    sum += val * ICAO_WEIGHTS[i % 3]
  }
  return String(sum % 10)
}

/**
 * Sanitiza un string para MRZ:
 *  - Mayúsculas
 *  - Quita acentos (á→A, etc.)
 *  - Reemplaza espacios y caracteres no alfanuméricos con '<'
 */
function sanitize(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita tildes
    .replace(/[^A-Z0-9]/g, '<')
}

/**
 * Rellena o trunca un string con '<' hasta la longitud deseada.
 */
function pad(str: string, len: number): string {
  const s = str.slice(0, len)
  return s.padEnd(len, '<')
}

/**
 * Genera las 2 líneas MRZ para un bovino mexicano.
 * 
 * Formato adaptado de ICAO TD1 a bovinos (40 chars por línea):
 * 
 * Línea 1 (40 chars):
 *   [0-4]   'MXBOV'              → país (MX) + especie (BOV)
 *   [5]     '<'                  → separador
 *   [6-21]  nombre 16 chars      → nombre del animal, padded con '<'
 *   [22-39] '<'*18               → relleno
 * 
 * Línea 2 (40 chars):
 *   [0-8]   siniiga 9 chars      → últimos 9 dígitos del número SINIIGA
 *   [9]     checkDigit(siniiga)  → dígito verificador del SINIIGA
 *   [10-11] estado 2 chars       → clave estado (NL, DGO, etc.)
 *   [12-19] fechaNac 8 chars     → YYYYMMDD
 *   [20]    sexo 1 char          → 'M' o 'F'
 *   [21-28] '0'*7 + checkDigit  → campo libre (peso futuro) + dígito
 *   [29-30] 'MX'                → país de registro
 *   [31-39] '<'*9               → relleno
 */
function generateMRZ(params: {
  nombre:          string
  siniiga:         string
  estadoMx:        string
  fechaNacimiento: string   // 'YYYY-MM-DD'
  sexo:            'macho' | 'hembra'
}): [string, string] {
  const { nombre, siniiga, estadoMx, fechaNacimiento, sexo } = params

  // ── Línea 1 ───────────────────────────────────────────────────────────────
  const nombreClean = sanitize(nombre || 'ANONIMO')
  const line1 = pad(`MXBOV<${nombreClean}`, 40)

  // ── Línea 2 ───────────────────────────────────────────────────────────────
  // SINIIGA: tomar solo los últimos 9 caracteres del número (sin guiones)
  const siniigaClean = siniiga.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const siniigaField = pad(siniigaClean.slice(-9), 9)
  const siniigaCheck = checkDigit(siniigaField)

  // Estado: 2-3 letras → normalizar a 2
  const estadoField  = pad(sanitize(estadoMx).slice(0, 2), 2)

  // Fecha de nacimiento: YYYYMMDD
  const fechaField   = fechaNacimiento.replace(/-/g, '').slice(0, 8)
  const fechaCheck   = checkDigit(fechaField)

  // Sexo
  const sexoChar     = sexo === 'hembra' ? 'F' : 'M'

  // Campo libre (7 ceros por ahora — puede ser peso en kg en futuras versiones)
  const libreField   = '0000000'
  const libreCheck   = checkDigit(libreField)

  // Dígito compuesto sobre todo lo importante
  const compositeInput = `${siniigaField}${siniigaCheck}${fechaField}${fechaCheck}${libreField}${libreCheck}`
  const compositeCheck = checkDigit(compositeInput)

  const line2Raw = `${siniigaField}${siniigaCheck}${estadoField}${fechaField}${sexoChar}${libreField}${libreCheck}MX${compositeCheck}`
  const line2    = pad(line2Raw, 40)

  return [line1, line2]
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  // CORS — ajusta el origen a tu dominio en producción
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const body = await req.json()
    const { nombre, siniiga, estadoMx, fechaNacimiento, sexo } = body

    // Validación mínima
    if (!siniiga || !estadoMx || !fechaNacimiento || !sexo) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: siniiga, estadoMx, fechaNacimiento, sexo' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const mrz = generateMRZ({ nombre, siniiga, estadoMx, fechaNacimiento, sexo })

    return new Response(
      JSON.stringify({ mrz }),
      {
        status: 200,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * ── NOTA: Cómo llamar esta función desde el cliente ──────────────────────────
 * 
 * const { data, error } = await supabase.functions.invoke('generate-mrz', {
 *   body: {
 *     nombre:          'Lupita',
 *     siniiga:         'MX-NL-2024-000142',
 *     estadoMx:        'NL',
 *     fechaNacimiento: '2021-03-14',
 *     sexo:            'hembra',
 *   }
 * })
 * // data.mrz → ['MXBOV<LUPITA<<<<...', 'N000142<8NL20210314F...']
 * 
 * ── ALTERNATIVA: Database Trigger ────────────────────────────────────────────
 * Si prefieres que el MRZ se genere automáticamente en el INSERT sin tocar
 * el cliente, puedes crear un trigger BEFORE INSERT en la tabla animales
 * que llame a la función pg_net para invocar la Edge Function.
 * Más complejo pero más seguro (el cliente nunca puede pasar un MRZ falso).
 * 
 * edit post. se opto por esta esta es la que esta actualemnete 
 */