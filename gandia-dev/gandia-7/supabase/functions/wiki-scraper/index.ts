// supabase/functions/wiki-scraper/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Scraper legal de fuentes oficiales públicas para Wiki Handeia
// Solo consume RSS feeds y APIs públicas gubernamentales — sin scraping ilegal.
// Ejecutar vía cron en Supabase o trigger manual desde el panel editorial.
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')      ?? ''
const SUPABASE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FuenteOficial {
  id:          string
  nombre:      string
  tipo:        string
  rss_url:     string | null
  dominio:     string
  trust_base:  number
  ultima_sync: string | null
}

interface RSSItem {
  titulo:      string
  descripcion: string
  url:         string
  fecha:       string
}

interface HechoExtraido {
  afirmacion:     string
  contexto:       string
  dominio:        string
  tema:           string
  fuente_nombre:  string
  fuente_url:     string
  fuente_fecha:   string
  calidad_fuente: number
  confianza:      number
}

// ─── Parser RSS básico (sin librerías externas) ───────────────────────────────
// Legal: todos los RSS son feeds públicos diseñados para consumo programático

function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const match of itemMatches) {
    const content = match[1]

    const titulo     = extractTag(content, 'title')
    const descripcion = extractTag(content, 'description') || extractTag(content, 'summary')
    const url        = extractTag(content, 'link') || extractTag(content, 'guid')
    const fecha      = extractTag(content, 'pubDate') || extractTag(content, 'dc:date')

    if (titulo && url) {
      items.push({
        titulo:      cleanText(titulo),
        descripcion: cleanText(descripcion ?? ''),
        url:         url.trim(),
        fecha:       fecha ?? new Date().toISOString(),
      })
    }
  }

  return items.slice(0, 20) // Máximo 20 items por fuente por sync
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<\\!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
  return m ? m[1].trim() : null
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')  // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Extractor de Hechos vía Claude ──────────────────────────────────────────
// Claude analiza el contenido del RSS y extrae afirmaciones verificables

async function extraerHechos(
  items:   RSSItem[],
  fuente:  FuenteOficial,
): Promise<HechoExtraido[]> {
  if (items.length === 0) return []

  const contenido = items.map((item, i) =>
    `[${i + 1}] TÍTULO: ${item.titulo}\nDESCRIPCIÓN: ${item.descripcion}\nURL: ${item.url}\nFECHA: ${item.fecha}`
  ).join('\n\n---\n\n')

  const system = `Eres un extractor de hechos verificables para Wiki Handeia, base de conocimiento del sector ganadero de México.
Tu tarea: analizar contenido de fuentes oficiales y extraer SOLO afirmaciones factuales verificables.

REGLAS CRÍTICAS:
- Solo extrae afirmaciones CONCRETAS y VERIFICABLES (fechas, números, requisitos, plazos, regulaciones)
- NUNCA extraigas opiniones, noticias generales o eventos sin impacto regulatorio
- Cada afirmación debe poder ser verdadera o falsa (no ambigua)
- Solo extrae si hay suficiente certeza — prefiere no extraer a extraer algo dudoso
- Dominio: ${fuente.dominio}
- Fuente: ${fuente.nombre} (confianza base: ${fuente.trust_base})

Responde SOLO en JSON válido, sin markdown:
{
  "hechos": [
    {
      "afirmacion": "Afirmación concreta en una oración",
      "contexto": "1-2 oraciones de contexto para el lector humano",
      "dominio": "${fuente.dominio}",
      "tema": "slug-del-tema-en-kebab-case",
      "fuente_nombre": "Nombre exacto de la regulación o documento",
      "fuente_url": "URL del item de donde viene",
      "fuente_fecha": "YYYY-MM-DD",
      "calidad_fuente": 90,
      "confianza": 85
    }
  ]
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: `Contenido a analizar de ${fuente.nombre}:\n\n${contenido}` }],
    }),
  })

  if (!res.ok) {
    console.error(`Claude error: ${res.status}`)
    return []
  }

  const data = await res.json() as { content: { type: string; text: string }[] }
  const text = data.content.find(c => c.type === 'text')?.text ?? ''

  try {
    const parsed = JSON.parse(text) as { hechos: HechoExtraido[] }
    return parsed.hechos ?? []
  } catch {
    console.error('Error parsing Claude response:', text)
    return []
  }
}

// ─── Función principal de scraping ───────────────────────────────────────────

async function scrapeFuente(fuente: FuenteOficial, supabase: ReturnType<typeof createClient>) {
  let itemsHallados = 0
  let itemsNuevos   = 0
  let error: string | undefined

  try {
    if (fuente.tipo === 'rss' && fuente.rss_url) {
      // Fetch RSS — legal, son feeds públicos de gobierno
      const rssRes = await fetch(fuente.rss_url, {
        headers: {
          'User-Agent':  'HandeiaBot/1.0 (wiki.handeia.mx; contacto@handeia.mx)',
          'Accept':      'application/rss+xml, application/xml, text/xml',
        },
      })

      if (!rssRes.ok) {
        throw new Error(`RSS fetch failed: ${rssRes.status}`)
      }

      const rssText = await rssRes.text()
      const items   = parseRSS(rssText)
      itemsHallados = items.length

      if (items.length > 0) {
        const hechos = await extraerHechos(items, fuente)

        for (const hecho of hechos) {
          // Verificar si ya existe un Hecho con afirmación similar
          const { data: existente } = await supabase
            .from('wiki_hechos')
            .select('id')
            .eq('fuente_url', hecho.fuente_url)
            .single()

          if (!existente) {
            // Insertar como nuevo Hecho en estado 'en_revision' para revisión editorial
            const { error: insertError } = await supabase
              .from('wiki_hechos')
              .insert({
                afirmacion:       hecho.afirmacion,
                contexto:         hecho.contexto,
                dominio:          hecho.dominio,
                tema:             hecho.tema,
                jurisdiccion:     'MX',
                fuente_nombre:    hecho.fuente_nombre,
                fuente_url:       hecho.fuente_url,
                fuente_fecha:     hecho.fuente_fecha,
                fuente_oficial_id: fuente.id,
                calidad_fuente:   hecho.calidad_fuente,
                hti:              hecho.confianza,
                estado:           'en_revision', // siempre empieza en revisión
                origen:           'scraper',
              })

            if (!insertError) itemsNuevos++
          }
        }
      }

      // Actualizar ultima_sync
      await supabase
        .from('wiki_fuentes_oficiales')
        .update({ ultima_sync: new Date().toISOString() })
        .eq('id', fuente.id)
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Error scraping ${fuente.nombre}:`, error)
  }

  // Log del scrape
  await supabase.from('wiki_scrape_log').insert({
    fuente_id:     fuente.id,
    items_hallados: itemsHallados,
    items_nuevos:   itemsNuevos,
    error,
  })

  return { itemsHallados, itemsNuevos, error }
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Verificar autorización
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.includes(SUPABASE_KEY.slice(0, 20))) {
    // Aceptar también token de usuario admin
    const token = authHeader?.replace('Bearer ', '')
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }
    }
  }

  try {
    let body: { fuente_id?: string } = {}
    try { body = await req.json() } catch { /* sin body = scrape todas */ }

    // Obtener fuentes activas
    const query = supabase.from('wiki_fuentes_oficiales').select('*').eq('activa', true)
    if (body.fuente_id) query.eq('id', body.fuente_id)

    const { data: fuentes, error: fetchError } = await query
    if (fetchError || !fuentes) throw new Error('No se pudieron obtener las fuentes')

    const resultados = await Promise.allSettled(
      fuentes.map(f => scrapeFuente(f as FuenteOficial, supabase))
    )

    const resumen = resultados.map((r, i) => ({
      fuente:   (fuentes[i] as FuenteOficial).nombre,
      resultado: r.status === 'fulfilled' ? r.value : { error: 'Promise rejected' },
    }))

    return new Response(JSON.stringify({ ok: true, resumen }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('wiki-scraper error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})