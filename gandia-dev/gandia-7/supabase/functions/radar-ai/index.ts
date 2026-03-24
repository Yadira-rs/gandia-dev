// supabase/functions/radar-ai/index.ts
// VERSIÓN ACTUALIZADA — agrega contexto de Wiki Handeia a Siete
// Cambios: nueva función fetchWikiContext + inyección en buildMessages

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')      ?? ''
const SUPABASE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const MODEL             = 'claude-sonnet-4-20250514'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  type:    'search' | 'article-chat' | 'summary' | 'chat'
  query?:  string
  context: string
  perfil:  string
  mode?:   string
}

// ─── Contexto Wiki — Hechos verificados relevantes para la query ──────────────

interface WikiHecho {
  id:            string
  afirmacion:    string
  fuente_nombre: string
  fuente_articulo: string | null
  hti:           number
  verificado_at: string
  dominio:       string
}

async function fetchWikiContext(query: string): Promise<WikiHecho[]> {
  if (!query || query.trim().length < 3) return []

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Full-text search en afirmaciones y contexto
    const { data } = await supabase
      .from('wiki_hechos')
      .select('id,afirmacion,fuente_nombre,fuente_articulo,hti,verificado_at,dominio')
      .eq('estado', 'activo')
      .gte('hti', 70)                                           // Solo Hechos confiables
      .textSearch('afirmacion', query, { config: 'spanish' })
      .order('hti', { ascending: false })
      .limit(5)

    return (data as WikiHecho[]) ?? []
  } catch (err) {
    console.error('[wiki context] error:', err)
    return []
  }
}

function formatWikiForPrompt(hechos: WikiHecho[]): string {
  if (hechos.length === 0) return ''
  return hechos.map(h =>
    `[WIKI-${h.id.slice(0,8)}] HTI:${h.hti} | ${h.dominio.toUpperCase()} | "${h.afirmacion}" | Fuente: ${h.fuente_nombre}${h.fuente_articulo ? ` ${h.fuente_articulo}` : ''}`
  ).join('\n')
}

// ─── buildMessages — con soporte Wiki ────────────────────────────────────────

function buildMessages(body: RequestBody, useWebSearch: boolean, wikiContext: WikiHecho[]) {
  const { type, query, context, perfil } = body
  const hasWiki = wikiContext.length > 0
  const wikiBlock = hasWiki ? formatWikiForPrompt(wikiContext) : ''

  if (type === 'search' || type === 'chat') {
    const noContext = !context || context.trim().length < 20

    const wikiInstructions = hasWiki ? `

WIKI HANDEIA (base de conocimiento verificado — MÁXIMA PRIORIDAD):
${wikiBlock}

INSTRUCCIONES WIKI:
- Si la respuesta está en la Wiki Handeia, ÚSALA como fuente primaria y cítala así: [Wiki Handeia · HTI XX · Fuente]
- La Wiki tiene mayor prioridad que las noticias y que web search
- Si usas un Hecho Wiki, menciona que es información verificada con fuente oficial
- Formato de cita: "Según Wiki Handeia (${hasWiki ? wikiContext[0].fuente_nombre : 'fuente oficial'}, HTI ${hasWiki ? wikiContext[0].hti : 'XX'}): [afirmación]"` : ''

    const system = noContext
      ? `Eres Siete, el asistente de inteligencia de HANDEIA, plataforma ganadera de México. Perfil del usuario: ${perfil}.${wikiInstructions}
${hasWiki ? '' : 'No tienes noticias verificadas de Handeia para esta consulta.'}
${useWebSearch ? 'Usa web search para complementar.' : ''}
Sin emojis. Español sobrio. Máximo 4 párrafos.
Responde en JSON exacto:
{
  "answer": "Tu análisis",
  "sin_contexto": ${!hasWiki},
  "wiki_usada": ${hasWiki},
  "wiki_hechos_ids": ${hasWiki ? JSON.stringify(wikiContext.map(h => h.id.slice(0,8))) : '[]'},
  "perspectivas": null
}`
      : `Eres Siete, el asistente de inteligencia de HANDEIA, la plataforma de trazabilidad ganadera más avanzada de México.
Perfil del usuario: ${perfil}.${wikiInstructions}

Tienes acceso a:
1. Wiki Handeia (hechos verificados con fuente oficial) — PRIORIDAD MÁXIMA
2. Noticias verificadas de Handeia — segunda fuente
3. Web search — última opción, solo si las anteriores no cubren el tema

Sin emojis. Español sobrio. Máximo 4 párrafos.
Responde en JSON exacto:
{
  "answer": "Tu análisis citando fuentes en orden de prioridad",
  "sin_contexto": false,
  "wiki_usada": ${hasWiki},
  "wiki_hechos_ids": ${hasWiki ? JSON.stringify(wikiContext.map(h => h.id.slice(0,8))) : '[]'},
  "perspectivas": {
    "oficial": "Lo que dicen fuentes oficiales / Wiki Handeia (o null)",
    "campo": "Lo que reportan productores/campo (o null)"
  }
}`

    const userContent = [
      hasWiki    ? `Hechos verificados Wiki Handeia:\n${wikiBlock}` : '',
      !noContext ? `Noticias recientes verificadas en Handeia:\n${context}` : '',
      `Consulta del ${perfil}: ${query ?? ''}`,
    ].filter(Boolean).join('\n\n')

    const tools = useWebSearch ? [{ type: 'web_search_20250305', name: 'web_search' }] : undefined

    return { system, messages: [{ role: 'user', content: userContent }], tools }
  }

  if (type === 'article-chat') {
    const wikiAdd = hasWiki ? `\n\nHechos Wiki relacionados:\n${wikiBlock}` : ''
    const system = `Eres Siete, el asistente de HANDEIA. Perfil: ${perfil}.${wikiAdd}
El usuario tiene una noticia frente a él y te hace una pregunta específica.
Si hay Hechos Wiki relevantes, úsalos para dar mayor certeza a tu respuesta.
Responde en español. Tono editorial, sin emojis. Máximo 3 párrafos.
Responde en JSON: { "answer": "texto", "wiki_usada": ${hasWiki} }`

    const user = `Noticia / contexto:\n${context}\n\nPregunta del ${perfil}: ${query ?? ''}`
    return { system, messages: [{ role: 'user', content: user }], tools: undefined }
  }

  // summary
  const system = `Eres un analista editorial del sector ganadero mexicano.
Redacta el resumen del día en 2-3 oraciones concisas y estratégicas.
Sin emojis. Español directo.
Responde en JSON: { "resumen": "texto del resumen" }`

  const user = `Noticias del día:\n${context}\n\nRedacta el resumen ejecutivo del panorama ganadero para tomadores de decisiones.`
  return { system, messages: [{ role: 'user', content: user }], tools: undefined }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  let body: RequestBody
  try {
    body = await req.json() as RequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  if (!body.type) {
    return new Response(JSON.stringify({ error: 'Missing required field: type' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const useWebSearch = body.type === 'search' && body.mode === 'investigacion'

    // ← NUEVO: buscar Hechos Wiki relevantes para search y chat
    let wikiContext: WikiHecho[] = []
    if ((body.type === 'search' || body.type === 'chat') && body.query) {
      wikiContext = await fetchWikiContext(body.query)
    }

    const { system, messages, tools } = buildMessages(body, useWebSearch, wikiContext)

    const claudePayload: Record<string, unknown> = {
      model:      MODEL,
      max_tokens: 1024,
      system,
      messages,
    }
    if (tools) claudePayload.tools = tools

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(claudePayload),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      console.error('Claude API error:', claudeRes.status, errText)
      throw new Error(`Claude API error: ${claudeRes.status}`)
    }

    const claudeData = await claudeRes.json() as {
      content: { type: string; text: string }[]
    }

    const rawText = claudeData.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')
      .replace(/]*>(.*?)<\/antml:cite>/gs, '$1')
      .replace(/<[^>]+>/g, '')

    let parsed: Record<string, unknown> = {}
    try {
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(clean) as Record<string, unknown>
    } catch {
      parsed = { answer: rawText }
    }

    const usedWebSearch = claudeData.content.some(c => c.type === 'tool_use')
    if (usedWebSearch && parsed.sin_contexto === false) {
      parsed.sin_contexto = true
    }

    // ← NUEVO: inyectar los Hechos Wiki usados en la respuesta para que el frontend los muestre
    if (wikiContext.length > 0) {
      parsed.wiki_hechos = wikiContext.map(h => ({
        id:            h.id,
        afirmacion:    h.afirmacion,
        fuente_nombre: h.fuente_nombre,
        hti:           h.hti,
        dominio:       h.dominio,
      }))
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('radar-ai error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error', answer: 'No se pudo procesar la consulta.' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})