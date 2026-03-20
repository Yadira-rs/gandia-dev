// supabase/functions/radar-ai/index.ts
// Edge Function — punto de entrada seguro para todas las llamadas a Claude
// La API key NUNCA sale al frontend; vive en secrets de Supabase.
//
// Deploy: supabase functions deploy radar-ai
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const MODEL             = 'claude-sonnet-4-20250514'

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Tipos de request ──────────────────────────────────────────────────────────
interface RequestBody {
  type:    'search' | 'article-chat' | 'summary'
  query?:  string
  context: string
  perfil:  string
}

// ── Prompts por tipo ──────────────────────────────────────────────────────────
function buildMessages(body: RequestBody) {
  const { type, query, context, perfil } = body

  if (type === 'search') {
    const system = `Eres el analista de inteligencia de HANDEIA, la plataforma de trazabilidad ganadera más avanzada de México.

Perfil del usuario que consulta: ${perfil}.

Tu trabajo:
- Responder con análisis editorial, profesional y directo
- Priorizar fuentes marcadas como [OFICIAL] o [VERIFICADO]
- Mencionar cuando hay divergencia entre fuentes oficiales y reportes de campo
- Sin emojis. Español sobrio. Máximo 4 párrafos cortos.
- Si la pregunta implica múltiples perspectivas, termina con un campo "perspectivas" en JSON

Responde SIEMPRE en este formato JSON exacto:
{
  "answer": "Tu análisis en texto, párrafos separados por doble salto de línea",
  "perspectivas": {
    "oficial": "Lo que dicen las fuentes oficiales (o null si no aplica)",
    "campo": "Lo que reportan productores/campo (o null si no aplica)"
  } 
}

Si no hay perspectivas divergentes, perspectivas puede ser null.`

    const user = `Noticias recientes disponibles:\n${context}\n\nConsulta del ${perfil}: ${query ?? ''}`

    return { system, messages: [{ role: 'user', content: user }] }
  }

  if (type === 'article-chat') {
    const system = `Eres el analista de HANDEIA. Perfil: ${perfil}.
El usuario tiene una noticia frente a él y te hace una pregunta específica sobre ella.
Responde en español. Tono editorial, sin emojis. Máximo 3 párrafos. Sé concreto y accionable.

Responde en JSON: { "answer": "texto de respuesta" }`

    const user = `Noticia / contexto:\n${context}\n\nPregunta del ${perfil}: ${query ?? ''}`

    return { system, messages: [{ role: 'user', content: user }] }
  }

  // type === 'summary'
  const system = `Eres un analista editorial del sector ganadero mexicano.
Redacta el resumen del día en 2-3 oraciones concisas y estratégicas.
Sin emojis. Español directo. Primera persona del plural cuando aplique.
Responde en JSON: { "resumen": "texto del resumen" }`

  const user = `Noticias del día:\n${context}\n\nRedacta el resumen ejecutivo del panorama ganadero para tomadores de decisiones.`

  return { system, messages: [{ role: 'user', content: user }] }
}

// ── Handler principal ─────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

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

  if (!body.type || !body.context) {
    return new Response(JSON.stringify({ error: 'Missing required fields: type, context' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { system, messages } = buildMessages(body)

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 1024,
        system,
        messages,
      }),
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

    // Parsear el JSON de la respuesta de Claude
    let parsed: Record<string, unknown> = {}
    try {
      // Limpiar posibles backticks de markdown
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(clean) as Record<string, unknown>
    } catch {
      // Si no es JSON válido, devolver como texto plano en campo answer
      parsed = { answer: rawText }
    }

    return new Response(JSON.stringify(parsed), {
      status:  200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('radar-ai error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error', answer: 'No se pudo procesar la consulta.' }), {
      status:  500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})