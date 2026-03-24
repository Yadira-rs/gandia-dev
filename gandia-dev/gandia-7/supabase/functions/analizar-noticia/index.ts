/// <reference lib="deno.ns" />

/**
 * GANDIA â€” Edge Function: analizar-noticia
 * VersiÃ³n: 1.0.0
 *
 * Recibe una noticia cruda (del pipeline ) y:
 *  1. Valida y deduplica por content_hash
 *  2. Llama a Claude para anÃ¡lisis completo
 *  3. Inserta / actualiza la noticia enriquecida en Supabase
 *
 * InvocaciÃ³n esperada (POST):
 * {
 *   titulo:          string   (requerido)
 *   cuerpo:          string   (requerido)
 *   fuente:          string   (requerido)
 *   fuente_origen:   "DOF" | "USDA" | "NEWSAPI" | "MANUAL"
 *   url_original?:  string
 *   autor?:         string
 *   publicada_en?:  string   (ISO 8601 â€” default: now)
 * }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

// â”€â”€â”€ TIPOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface NoticiaInput {
  titulo: string
  cuerpo: string
  fuente: string
  fuente_origen: 'DOF' | 'USDA' | 'NEWSAPI' | 'MANUAL'
  url_original?: string
  autor?: string
  publicada_en?: string
}

interface AnalisisIA {
  categoria: 'SANIDAD' | 'PRECIOS' | 'NORMATIVA' | 'EXPORTACION' | 'CLIMA' | 'MERCADOS' | 'GENERAL'
  urgente: boolean
  urgencia_nivel: 'alta' | 'media' | 'baja'
  resumen_general: string
  resumenes_ia: {
    Productor: string
    Exportador: string
    MVZ: string
    Union: string
    Auditor: string
  }
  relevancia: {
    Productor: number
    Exportador: number
    MVZ: number
    Union: number
    Auditor: number
  }
  impacto_ia: string
  acciones_ia: string[]
  lectura_minutos: number
}

// â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function estimarLectura(texto: string): number {
  const palabras = texto.trim().split(/\s+/).length
  const minutos = Math.ceil(palabras / 200) // 200 palabras/min promedio
  return Math.min(Math.max(minutos, 1), 60)
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  }
}

// â”€â”€â”€ PROMPT CLAUDE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function buildPrompt(noticia: NoticiaInput): string {
  return `Eres el motor de anÃ¡lisis de GANDIA, una plataforma de inteligencia para el sector ganadero mexicano.

Analiza la siguiente noticia y devuelve ÃšNICAMENTE un objeto JSON vÃ¡lido, sin texto adicional, sin bloques de cÃ³digo, sin explicaciones.

NOTICIA:
TÃ­tulo: ${noticia.titulo}
Fuente: ${noticia.fuente}
Contenido: ${noticia.cuerpo}

INSTRUCCIONES DE ANÃLISIS:

1. **categoria**: Elige UNA de: SANIDAD, PRECIOS, NORMATIVA, EXPORTACION, CLIMA, MERCADOS, GENERAL

2. **urgente**: true si implica acciÃ³n inmediata (brotes, cambios regulatorios con fecha prÃ³xima, alertas sanitarias)

3. **urgencia_nivel**: "alta" (acciÃ³n en <72h), "media" (acciÃ³n en <2 semanas), "baja" (informativa)

4. **resumen_general**: Resumen neutro de 2-3 oraciones. Datos concretos cuando existan.

5. **resumenes_ia**: Resumen personalizado por perfil, cada uno mÃ¡ximo 2 oraciones, enfocado en LO QUE IMPORTA a ese perfil:
   - Productor: impacto en el rancho, costos, operaciÃ³n diaria
   - Exportador: requisitos de exportaciÃ³n, plazos, certificaciones
   - MVZ: aspectos sanitarios, protocolos tÃ©cnicos, normativa clÃ­nica
   - Union: impacto en la industria, gremio, polÃ­tica sectorial
   - Auditor: cumplimiento normativo, auditorÃ­as, trazabilidad

6. **relevancia**: PuntuaciÃ³n 0-100 para cada perfil (quÃ© tan relevante es esta noticia para ese perfil)

7. **impacto_ia**: AnÃ¡lisis de impacto de 1-2 oraciones, concreto y directo

8. **acciones_ia**: Array de 2-4 acciones concretas que deberÃ­a tomar el usuario (verbos en infinitivo, mÃ¡x 12 palabras cada una)

9. **lectura_minutos**: EstimaciÃ³n entre 1 y 10

RESPONDE SOLO CON ESTE JSON (sin markdown, sin bloques de cÃ³digo):
{
  "categoria": "...",
  "urgente": false,
  "urgencia_nivel": "...",
  "resumen_general": "...",
  "resumenes_ia": {
    "Productor": "...",
    "Exportador": "...",
    "MVZ": "...",
    "Union": "...",
    "Auditor": "..."
  },
  "relevancia": {
    "Productor": 0,
    "Exportador": 0,
    "MVZ": 0,
    "Union": 0,
    "Auditor": 0
  },
  "impacto_ia": "...",
  "acciones_ia": ["...", "..."],
  "lectura_minutos": 3
}`
}

// â”€â”€â”€ HANDLER PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  // Solo POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'MÃ©todo no permitido. Usa POST.' }),
      { status: 405, headers: corsHeaders() }
    )
  }

  try {
    // â”€â”€ 1. Leer y validar body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let body: NoticiaInput
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body invÃ¡lido. Se espera JSON.' }),
        { status: 400, headers: corsHeaders() }
      )
    }

    const { titulo, cuerpo, fuente, fuente_origen } = body

    if (!titulo || !cuerpo || !fuente || !fuente_origen) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos: titulo, cuerpo, fuente, fuente_origen' }),
        { status: 400, headers: corsHeaders() }
      )
    }

    // â”€â”€ 2. Inicializar clientes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    })

    // â”€â”€ 3. Deduplicar por content_hash â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const contentHash = await sha256(`${titulo}::${fuente}`)

    const { data: existente } = await supabase
      .from('noticias')
      .select('id, titulo')
      .eq('content_hash', contentHash)
      .maybeSingle()

    if (existente) {
      return new Response(
        JSON.stringify({
          status: 'duplicado',
          message: 'Esta noticia ya existe en la base de datos.',
          id: existente.id,
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    // â”€â”€ 4. Llamar a Claude â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let analisis: AnalisisIA

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: buildPrompt(body),
          },
        ],
      })

      type ContentBlock = { type: string; text?: string }
      const rawText = (message.content as ContentBlock[])
        .filter((block: ContentBlock) => block.type === 'text')
        .map((block: ContentBlock) => block.text ?? '')
        .join('')
        .trim()

      // Limpiar posibles bloques de cÃ³digo que Claude agregue
      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      analisis = JSON.parse(cleanJson)
    } catch (err) {
      console.error('Error al llamar a Claude:', err)

      // Fallback: insertar con anÃ¡lisis mÃ­nimo para no perder la noticia
      analisis = {
        categoria: 'GENERAL',
        urgente: false,
        urgencia_nivel: 'baja',
        resumen_general: titulo,
        resumenes_ia: {
          Productor: titulo,
          Exportador: titulo,
          MVZ: titulo,
          Union: titulo,
          Auditor: titulo,
        },
        relevancia: {
          Productor: 50,
          Exportador: 50,
          MVZ: 50,
          Union: 50,
          Auditor: 50,
        },
        impacto_ia: 'AnÃ¡lisis pendiente.',
        acciones_ia: ['Revisar noticia completa'],
        lectura_minutos: estimarLectura(cuerpo),
      }
    }

    // â”€â”€ 5. Insertar en Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const noticiaRow = {
      titulo: titulo.trim(),
      titulo_original: titulo.trim(),
      cuerpo: cuerpo.trim(),
      fuente: fuente.trim(),
      fuente_origen,
      url_original: body.url_original ?? null,
      autor: body.autor ?? null,
      publicada_en: body.publicada_en ?? new Date().toISOString(),
      content_hash: contentHash,
      procesada_ia: true,

      // Campos del anÃ¡lisis IA
      categoria: analisis.categoria,
      urgente: analisis.urgente,
      urgencia_nivel: analisis.urgencia_nivel,
      resumen_general: analisis.resumen_general,
      resumenes_ia: analisis.resumenes_ia,
      relevancia: analisis.relevancia,
      impacto_ia: analisis.impacto_ia,
      acciones_ia: analisis.acciones_ia,
      lectura_minutos: analisis.lectura_minutos,
      activa: true,
    }

    const { data: insertada, error: insertError } = await supabase
      .from('noticias')
      .insert([noticiaRow])
      .select('id, slug, titulo, categoria, urgente')
      .single()

    if (insertError) {
      console.error('Error al insertar noticia:', insertError)
      return new Response(
        JSON.stringify({ error: 'Error al guardar la noticia.', detail: insertError.message }),
        { status: 500, headers: corsHeaders() }
      )
    }

    // â”€â”€ 6. Respuesta exitosa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    return new Response(
      JSON.stringify({
        status: 'ok',
        message: 'Noticia analizada e insertada correctamente.',
        noticia: insertada,
      }),
      { status: 201, headers: corsHeaders() }
    )

  } catch (err) {
    console.error('Error inesperado en Edge Function:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: corsHeaders() }
    )
  }
})

