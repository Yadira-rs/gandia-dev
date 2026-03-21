#!/usr/bin/env node
// scripts/pipeline-noticias.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pipeline de ingesta y procesamiento de noticias para Handeia Radar
// Corre cada 6 horas. Puede ejecutarse manualmente: npx ts-node scripts/pipeline-noticias.ts
//
// Variables de entorno requeridas (.env):
//   SUPABASE_URL         = https://xxxxx.supabase.co
//   SUPABASE_SERVICE_KEY = eyJ... (service role key — NO la anon key)
//   ANTHROPIC_API_KEY    = sk-ant-...
//   NEWS_API_KEY         = tu clave de NewsAPI.org
//
// Para automatizar en GitHub Actions cada 6h, usa .github/workflows/pipeline.yml
// ─────────────────────────────────────────────────────────────────────────────

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env') })
import { createHash } from 'crypto'

// ── CONFIG ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.SUPABASE_URL  ?? process.env.VITE_SUPABASE_URL  ?? ''
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_SERVICE_KEY ?? ''
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const NEWS_API_KEY  = process.env.NEWS_API_KEY  ?? ''

const MODEL = 'claude-sonnet-4-20250514'

// Keywords para buscar noticias ganaderas en México
const KEYWORDS = [
  'ganadero Mexico', 'bovinos Mexico', 'SENASICA', 'exportacion bovinos',
  'sanidad animal Mexico', 'trazabilidad ganadera', 'becerro precio Mexico',
  'SADER ganadero', 'Mexico cattle', 'Mexico livestock', 'USDA cattle Mexico',
  'beef cattle Mexico', 'livestock disease Mexico',
]

// IDs de fuentes en tu tabla news_sources (ajustar según lo que tengas)
const SOURCE_HTI_MAP: Record<string, { id_hint: string; score: number }> = {
  'gob.mx':           { id_hint: 'SENASICA',   score: 93 },
  'usda.gov':         { id_hint: 'USDA',        score: 94 },
  'fao.org':          { id_hint: 'FAO',         score: 92 },
  'economia.gob.mx':  { id_hint: 'SNIIM',       score: 90 },
  'agroempresario':   { id_hint: 'Agro',        score: 72 },
  'elfinanciero':     { id_hint: 'El Financiero', score: 74 },
}

// ── TIPOS ─────────────────────────────────────────────────────────────────────
interface NewsAPIArticle {
  title:       string
  description: string | null
  content:     string | null
  url:         string
  source:      { name: string; id: string | null }
  author:      string | null
  publishedAt: string
  urlToImage:  string | null
}

interface EnrichedNoticia {
  slug:                string
  titulo:              string
  titulo_original:     string
  cuerpo:              string
  url_original:        string
  fuente:              string
  fuente_origen:       string
  autor:               string | null
  categoria:           string
  urgente:             boolean
  urgencia_nivel:      string
  resumenes_ia:        Record<string, string>
  resumen_general:     string
  impacto_ia:          string
  acciones_ia:         string
  relevancia:          Record<string, number>
  relacionadas:        string[]
  lectura_minutos:     number
  activa:              boolean
  procesada_ia:        boolean
  publicada_en:        string
  trust_index:         number
  verification_status: string
  content_hash:        string
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80)
    + '-' + Date.now().toString(36)
}

function contentHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 32)
}

function estimarLectura(text: string): number {
  return Math.max(1, Math.ceil(text.split(' ').length / 200))
}

function calcularHTIBase(sourceUrl: string): number {
  for (const [domain, cfg] of Object.entries(SOURCE_HTI_MAP)) {
    if (sourceUrl.includes(domain)) return cfg.score
  }
  return 52 // APINews genérico
}

function verificationStatusFromHTI(score: number): string {
  if (score >= 90) return 'oficial'
  if (score >= 75) return 'verificado'
  if (score >= 60) return 'en_revision'
  if (score >= 40) return 'comunitario'
  return 'no_verificado'
}

// ── SUPABASE HELPERS ──────────────────────────────────────────────────────────

async function supabaseGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey:          SUPABASE_KEY,
      Authorization:   `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
    },
  })
  if (!res.ok) throw new Error(`Supabase GET ${path}: ${res.status}`)
  return res.json()
}

async function supabaseInsert(table: string, data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey:          SUPABASE_KEY,
      Authorization:   `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      Prefer:          'return=minimal',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase INSERT ${table}: ${res.status} - ${err}`)
  }
}

async function supabaseUpsert(table: string, data: Record<string, unknown>, onConflict: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: {
      apikey:          SUPABASE_KEY,
      Authorization:   `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      Prefer:          'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase UPSERT ${table}: ${res.status} - ${err}`)
  }
}

// ── CLAUDE ────────────────────────────────────────────────────────────────────

async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${res.status} - ${err}`)
  }

  const data = await res.json() as { content: { type: string; text: string }[] }
  return data.content.filter(c => c.type === 'text').map(c => c.text).join('')
}

// ── PASO 1: Fetch noticias de NewsAPI ─────────────────────────────────────────

async function fetchNewsAPI(): Promise<NewsAPIArticle[]> {
  const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)]
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`

  console.log(`📡 Buscando: "${keyword}"`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NewsAPI error: ${res.status}`)

  const data = await res.json() as { articles: NewsAPIArticle[]; status: string }
  console.log(`   → ${data.articles?.length ?? 0} artículos encontrados`)
  return data.articles ?? []
}

// ── PASO 2: Verificar duplicados ──────────────────────────────────────────────

async function getExistingHashes(): Promise<Set<string>> {
  const data = await supabaseGet('noticias?select=content_hash&activa=eq.true&limit=500') as { content_hash: string }[]
  return new Set(data.map(r => r.content_hash))
}

// ── PASO 3: Enriquecer noticia con IA ─────────────────────────────────────────

async function enrichNoticia(article: NewsAPIArticle): Promise<EnrichedNoticia | null> {
  const rawText = [article.title, article.description, article.content]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 3000)

  if (rawText.length < 50) return null

  const system = `Eres el sistema de procesamiento de inteligencia de HANDEIA, plataforma ganadera de México.
Analiza noticias del sector ganadero y genera contenido enriquecido.
Responde SOLO en JSON válido, sin markdown, sin comentarios.`

  const user = `Analiza esta noticia del sector ganadero mexicano:

TÍTULO: ${article.title}
FUENTE: ${article.source.name}
FECHA: ${article.publishedAt}
TEXTO: ${rawText}

Responde con este JSON exacto (todos los campos son obligatorios):
{
  "titulo": "título limpio y optimizado en español",
  "categoria": "SANIDAD | PRECIOS | NORMATIVA | CLIMA | EXPORTACION | MERCADOS | GENERAL",
  "urgente": true o false,
  "urgencia_nivel": "ALTA | MEDIA | BAJA",
  "resumen_general": "resumen objetivo en 2 oraciones",
  "resumenes_ia": {
    "Productor": "impacto para productores ganaderos en 2 oraciones",
    "Exportador": "impacto para exportadores bovinos en 2 oraciones",
    "MVZ": "implicaciones veterinarias/sanitarias en 2 oraciones",
    "Union": "relevancia para uniones ganaderas en 2 oraciones",
    "Auditor": "implicaciones de cumplimiento/normativa en 2 oraciones"
  },
  "impacto_ia": "descripción concreta del impacto operativo en 1-2 oraciones",
  "acciones_ia": ["acción concreta 1", "acción concreta 2", "acción concreta 3"],
  "relevancia": {
    "Productor": número del 1 al 10,
    "Exportador": número del 1 al 10,
    "MVZ": número del 1 al 10,
    "Union": número del 1 al 10,
    "Auditor": número del 1 al 10
  }
}`

  try {
    const rawResponse = await callClaude(system, user)
    const clean       = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed      = JSON.parse(clean) as {
      titulo:          string
      categoria:       string
      urgente:         boolean
      urgencia_nivel:  string
      resumen_general: string
      resumenes_ia:    Record<string, string>
      impacto_ia:      string
      acciones_ia:     string[]
      relevancia:      Record<string, number>
    }

    const trust = calcularHTIBase(article.url)
    const cuerpo = rawText

    const noticia: EnrichedNoticia = {
      slug:                slugify(parsed.titulo),
      titulo:              parsed.titulo,
      titulo_original:     article.title,
      cuerpo,
      url_original:        article.url,
      fuente:              article.source.name,
      fuente_origen:       'api',
      autor:               article.author,
      categoria:           parsed.categoria,
      urgente:             parsed.urgente,
      urgencia_nivel:      parsed.urgencia_nivel,
      resumenes_ia:        parsed.resumenes_ia,
      resumen_general:     parsed.resumen_general,
      impacto_ia:          parsed.impacto_ia,
      acciones_ia:         JSON.stringify(parsed.acciones_ia),
      relevancia:          parsed.relevancia,
      relacionadas:        [],
      lectura_minutos:     estimarLectura(cuerpo),
      activa:              true,
      procesada_ia:        true,
      publicada_en:        article.publishedAt,
      trust_index:         trust,
      verification_status: verificationStatusFromHTI(trust),
      content_hash:        contentHash(article.title + article.url),
    }

    return noticia
  } catch (err) {
    console.error(`   ⚠️  Error procesando "${article.title}":`, err)
    return null
  }
}

// ── PASO 4: Guardar en Supabase ───────────────────────────────────────────────

async function saveNoticia(noticia: EnrichedNoticia): Promise<void> {
  await supabaseUpsert('noticias', noticia as unknown as Record<string, unknown>, 'content_hash')
}

// ── PASO 5: Generar resumen del día ───────────────────────────────────────────

async function generateDailySummary(noticias: EnrichedNoticia[]): Promise<void> {
  if (noticias.length === 0) {
    console.log('ℹ️  Sin noticias nuevas. No se genera resumen.')
    return
  }

  const ctx = noticias.slice(0, 8)
    .map(n => `[${n.categoria}] ${n.titulo}. ${n.resumen_general}`)
    .join('\n')

  const system = `Eres un analista editorial del sector ganadero mexicano. Sin emojis. Español sobrio.`
  const user   = `Resume el panorama del sector ganadero hoy en 2-3 oraciones para tomadores de decisiones.\n\nNoticias:\n${ctx}`

  try {
    const resumen = await callClaude(system, user)

    // Marcar resúmenes anteriores como inactivos
    await fetch(`${SUPABASE_URL}/rest/v1/daily_summary?activo=eq.true`, {
      method:  'PATCH',
      headers: {
        apikey:         SUPABASE_KEY,
        Authorization:  `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activo: false }),
    })

    await supabaseInsert('daily_summary', {
      resumen_texto:       resumen.trim(),
      noticias_procesadas: noticias.length,
      activo:              true,
    })

    console.log('✅ Resumen diario generado y guardado')
  } catch (err) {
    console.error('⚠️  Error generando resumen diario:', err)
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Handeia Radar — Pipeline de noticias')
  console.log(`   ${new Date().toISOString()}\n`)

  if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY || !NEWS_API_KEY) {
    console.error('❌ Faltan variables de entorno. Revisa .env')
    process.exit(1)
  }

  try {
    // 1. Fetch noticias
    const articles = await fetchNewsAPI()
    if (articles.length === 0) {
      console.log('ℹ️  Sin artículos de NewsAPI. Terminando.')
      return
    }

    // 2. Obtener hashes existentes
    console.log('🔍 Verificando duplicados...')
    const existingHashes = await getExistingHashes()
    const nuevos = articles.filter(a => {
      const hash = contentHash(a.title + a.url)
      return !existingHashes.has(hash)
    })
    console.log(`   → ${nuevos.length} noticias nuevas de ${articles.length}\n`)

    if (nuevos.length === 0) {
      console.log('ℹ️  Todas las noticias ya están en la base. Terminando.')
      return
    }

    // 3. Procesar con Claude (con pausa para no saturar la API)
    console.log('🤖 Procesando con IA...')
    const processed: EnrichedNoticia[] = []
    for (let i = 0; i < nuevos.length; i++) {
      const article = nuevos[i]
      console.log(`   [${i + 1}/${nuevos.length}] ${article.title.slice(0, 60)}...`)
      const enriched = await enrichNoticia(article)
      if (enriched) {
        processed.push(enriched)
        await saveNoticia(enriched)
        console.log(`   ✓  Guardada — HTI: ${enriched.trust_index} · ${enriched.categoria}`)
      }
      // Pausa entre llamadas para no saturar la API de Claude
      if (i < nuevos.length - 1) {
        await new Promise(r => setTimeout(r, 1200))
      }
    }

    console.log(`\n📊 ${processed.length} noticias procesadas y guardadas\n`)

    // 4. Generar resumen del día
    console.log('📝 Generando resumen del día...')
    await generateDailySummary(processed)

    console.log('\n✅ Pipeline completado exitosamente\n')

  } catch (err) {
    console.error('\n❌ Error en pipeline:', err)
    process.exit(1)
  }
}

main()