/**
 * useAnimales.ts
 * 
 * Hook central de datos para la Ficha Ganadera.
 * Reemplaza MOCK_PASSPORT y la lista mock de FichaPerfilesWidget.
 * 
 * ARCHIVO → src/hooks/useAnimales.ts
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// ─── Helper para extraer mensaje de error de unknown ─────────────────────────
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) return String((e as { message: unknown }).message)
  return String(e)
}

// ─── PassportData — tipo público para FichaCard ───────────────────────────────
// Definido aquí para no depender de mockData (que es solo para simulaciones).

export interface PassportData {
  nombre:      string
  siniiga:     string
  rfid:        string
  raza:        string
  sexo:        string
  peso:        string
  nacimiento:  string
  upp:         string
  propietario: string
  exportLabel: string
  verificado:  string
  estatus:     string
  mrz:         [string, string]
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AnimalDB {
  id:               string
  siniiga:          string
  rfid:             string | null
  nombre:           string | null
  raza:             string
  especie:          string
  sexo:             'macho' | 'hembra'
  fecha_nacimiento: string   // 'YYYY-MM-DD'
  peso_kg:          number | null
  rancho_id:        string
  propietario_id:   string
  upp:              string | null
  estado_mx:        string | null
  municipio:        string | null
  estatus:          'activo' | 'vendido' | 'muerto' | 'exportado' | 'baja'
  export_label:     string | null
  verificado_por:   string | null
  mrz:              string[] | null
  created_at:       string
  updated_at:       string
}

export interface DocumentoDB {
  id:               string
  animal_id:        string
  rancho_id:        string
  subido_por:       string
  tipo:             string
  nombre:           string
  storage_path:     string
  url:              string | null
  mime_type:        string | null
  tamano_bytes:     number | null
  descripcion:      string | null
  fecha_documento:  string | null
  emisor:           string | null
  hash_sha256:      string | null
  created_at:       string
}

export interface NuevoAnimalInput {
  siniiga:            string
  rfid?:              string
  nombre?:            string
  raza:               string
  especie?:           string
  sexo:               'macho' | 'hembra'
  fecha_nacimiento:   string   // 'YYYY-MM-DD'
  peso_kg?:           number
  peso_nacimiento?:   number   // kg al nacer — base para curva de crecimiento twins
  peso_meta?:         number   // kg objetivo de engorda (exportación/venta)
  ganancia_diaria_kg?: number  // kg/día esperado — proyección de salida twins
  upp?:               string
  estado_mx:          string
  municipio?:         string
  export_label?:      string
}

// ─── CONVERSIÓN DB → PassportData (compatible con FichaCard existente) ────────

export function dbToPassportData(animal: AnimalDB, propietario?: string): PassportData {
  const fechaDate  = new Date(animal.fecha_nacimiento + 'T00:00:00')
  const fechaStr   = fechaDate.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const mrz = animal.mrz && animal.mrz.length >= 2
    ? [animal.mrz[0], animal.mrz[1]] as [string, string]
    : ['', ''] as [string, string]

  return {
    nombre:      animal.nombre ?? '—',
    siniiga:     animal.siniiga,
    rfid:        animal.rfid ?? '—',
    raza:        animal.raza,
    sexo:        animal.sexo === 'hembra' ? 'Hembra' : 'Macho',
    peso:        animal.peso_kg ? `${animal.peso_kg} kg` : '—',
    nacimiento:  fechaStr,
    upp:         animal.upp ?? '—',
    propietario: propietario ?? '—',
    exportLabel: animal.export_label ?? 'Sin clasificación',
    verificado:  animal.verificado_por ?? '—',
    estatus:     animal.estatus.toUpperCase(),
    mrz,
  }
}

// ─── HOOK: lista de animales del rancho ───────────────────────────────────────

export function useAnimalesList(ranchoId: string | null) {
  const [animales,  setAnimales]  = useState<AnimalDB[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchAnimales = useCallback(async () => {
    if (!ranchoId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('animales')
        .select('*')
        .eq('rancho_id', ranchoId)
        .neq('estatus', 'baja')
        .order('created_at', { ascending: false })

      if (err) throw err
      setAnimales(data ?? [])
    } catch (e: unknown) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [ranchoId])

  useEffect(() => {
    fetchAnimales()
  }, [fetchAnimales])

  return { animales, loading, error, refetch: fetchAnimales }
}

// ─── HOOK: detalle de un animal ───────────────────────────────────────────────

export function useAnimalDetalle(animalId: string | null) {
  const [animal,  setAnimal]  = useState<AnimalDB | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetchAnimal = useCallback(async (id: string | null) => {
    if (!id) { setAnimal(null); return }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('animales')
      .select('*')
      .eq('id', id)
      .single()
    if (err) setError(err.message)
    else     setAnimal(data)
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchAnimal(animalId) }, [animalId, fetchAnimal])

  return { animal, loading, error }
}

// ─── HOOK: documentos de un animal ───────────────────────────────────────────

export function useAnimalDocumentos(animalId: string | null) {
  const [documentos, setDocumentos] = useState<DocumentoDB[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    if (!animalId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('animal_documentos')
        .select('*')
        .eq('animal_id', animalId)
        .order('created_at', { ascending: false })

      if (err) throw err
      setDocumentos(data ?? [])
    } catch (e: unknown) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [animalId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  return { documentos, loading, error, refetch: fetchDocs }
}

// ─── ACCIÓN: registrar nuevo animal ──────────────────────────────────────────

export async function registrarAnimal(
  input:     NuevoAnimalInput,
  ranchoId:  string,
  userId:    string
): Promise<{ animal: AnimalDB | null; error: string | null }> {
  try {
    // 1. Generar MRZ via Edge Function (client-side — confirmado funcional)
    const { data: mrzData, error: mrzErr } = await supabase.functions.invoke('generate-mrz', {
      body: {
        nombre:          input.nombre ?? '',
        siniiga:         input.siniiga,
        estadoMx:        input.estado_mx,
        fechaNacimiento: input.fecha_nacimiento,
        sexo:            input.sexo,
      },
    })

    if (mrzErr) throw new Error(`MRZ error: ${mrzErr.message}`)

    // 2. Insertar con el MRZ ya generado
    const { data, error: insertErr } = await supabase
      .from('animales')
      .insert({
        ...input,
        especie:        input.especie ?? 'bovino',
        rancho_id:      ranchoId,
        propietario_id: userId,
        mrz:            mrzData.mrz,
        estatus:        'activo',
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    return { animal: data, error: null }
  } catch (e: unknown) {
    return { animal: null, error: errMsg(e) }
  }
}

// ─── ACCIÓN: subir documento ──────────────────────────────────────────────────

export async function subirDocumento(params: {
  file:         File
  animalId:     string
  ranchoId:     string
  userId:       string
  tipo:         DocumentoDB['tipo']
  siniiga?:     string   // ← para auto-evento en timeline twins
  descripcion?: string
  emisor?:      string
  fechaDoc?:    string   // 'YYYY-MM-DD'
}): Promise<{ doc: DocumentoDB | null; error: string | null }> {
  const { file, animalId, ranchoId, userId, tipo, descripcion, emisor, fechaDoc } = params

  try {
    // 1. Subir archivo a Storage
    const ext          = file.name.split('.').pop() ?? 'bin'
    const storagePath  = `${ranchoId}/${animalId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('animal-documentos')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert:      false,
      })

    if (uploadErr) throw uploadErr

    // 2. Calcular hash SHA-256 del archivo (opcional, mejora integridad)
    const buffer   = await file.arrayBuffer()
    const hashBuf  = await crypto.subtle.digest('SHA-256', buffer)
    const hashHex  = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // 3. Insertar metadata en BD
    const { data, error: insertErr } = await supabase
      .from('animal_documentos')
      .insert({
        animal_id:       animalId,
        rancho_id:       ranchoId,
        subido_por:      userId,
        tipo,
        nombre:          file.name,
        storage_path:    storagePath,
        mime_type:       file.type,
        tamano_bytes:    file.size,
        descripcion:     descripcion ?? null,
        emisor:          emisor ?? null,
        fecha_documento: fechaDoc ?? null,
        hash_sha256:     hashHex,
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    // ── Auto-evento en timeline twins ─────────────────────────────────────────
    // Cuando se sube un documento, se registra automáticamente en el timeline
    // del Gemelo Digital del animal como auditoría pendiente.
    if (params.siniiga) {
      const TIPO_LABEL: Record<string, string> = {
        factura:       'Factura',        cuvq:          'CUVQ',
        reemo:         'Guía REEMO',     resultado_lab: 'Resultado de laboratorio',
        vacunacion:    'Vacunación',     foto_oficial:  'Foto oficial',
        foto_campo:    'Foto campo',     identificacion: 'Identificación',
        firma_mvz:     'Firma MVZ',      otro:          'Documento',
      }
      // Fire-and-forget — no bloquea la respuesta al usuario
      void supabase.from('twins_eventos').insert({
        animal_id: params.siniiga,
        tipo:      'auditoria',
        fecha:     new Date().toISOString(),
        data: {
          titulo:    `Documento subido: ${TIPO_LABEL[params.tipo] ?? params.tipo}`,
          valor:     file.name,
          cert:      'pendiente',
          ubicacion: '',
          hash:      hashHex,
        },
      })
    }

    return { doc: data, error: null }
  } catch (e: unknown) {
    return { doc: null, error: errMsg(e) }
  }
}

// ─── ACCIÓN: obtener URL firmada de un documento ─────────────────────────────

export async function getDocumentoUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('animal-documentos')
    .createSignedUrl(storagePath, 60 * 60)   // 1 hora de validez

  return data?.signedUrl ?? null
}

// ─── HOOK: rancho del usuario autenticado ─────────────────────────────────────
// Usado por FichaPerfilesWidget, FichaNuevoWidget y FichaDocumentosWidget
// para obtener el rancho_id sin depender de campos any en el perfil.

export function useRanchoId(userId: string | null) {
  const [ranchoId, setRanchoId] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const fetchRancho = useCallback(async (uid: string | null) => {
    if (!uid) { setRanchoId(null); return }
    setLoading(true)
    try {
      // 1. Intentar perfil extendido (específico de ranchos)
      const { data: ext } = await supabase
        .from('ranch_extended_profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle()
      
      if (ext?.id) {
        setRanchoId(ext.id)
      } else {
        // 2. Fallback: perfil base (account_id suele ser el ID operativo)
        const { data: base } = await supabase
          .from('user_profiles')
          .select('account_id')
          .eq('user_id', uid)
          .maybeSingle()
        setRanchoId(base?.account_id ?? null)
      }
    } catch {
      setRanchoId(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchRancho(userId) }, [userId, fetchRancho])

  return { ranchoId, loading }
}

// ─── HELPER: obtener userId desde la sesión activa de Supabase ────────────────
// Los widgets llaman esto en lugar de depender de UserContext.user

export async function getAuthUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}