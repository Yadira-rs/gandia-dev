// app/(app)/noticias/index.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, useColorScheme,
  Animated, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg'
import { supabase } from '../../../src/lib/supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────
type Perfil = 'Productor' | 'Exportador' | 'MVZ' | 'Union' | 'Auditor'

interface Noticia {
  id: string
  slug: string
  titulo: string
  resumen_general: string
  resumenes_ia: Record<string, string>
  fuente: string
  categoria: string
  tiempo_relativo: string
  lectura_minutos: number
  urgente: boolean
  urgencia_nivel: string
  relevancia: Record<string, number>
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIAS = ['Todas', 'Sanidad', 'Precios', 'Normativa', 'Clima', 'Exportacion', 'Mercados', 'General']
const PERFILES: Perfil[] = ['Productor', 'Exportador', 'MVZ', 'Union', 'Auditor']

const SUGERENCIAS = [
  'Precios esta semana',
  'Nuevas regulaciones',
  'Estado sanitario norte',
  'Noticias urgentes',
]

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tokens = (isDark: boolean) => ({
  bg:         isDark ? '#0c0a09' : '#fafaf9',
  surface:    isDark ? '#1c1917' : '#ffffff',
  border:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  borderSoft: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:       isDark ? '#fafaf9' : '#1c1917',
  textSub:    isDark ? '#d6d3d1' : '#44403c',
  muted:      isDark ? '#78716c' : '#a8a29e',
  mutedLight: isDark ? '#44403c' : '#e7e5e4',
  inputBg:    isDark ? '#1c1917' : '#ffffff',
})

// ─── Icons ────────────────────────────────────────────────────────────────────
const sp = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function Icon({ name, color, size = 16 }: { name: string; color: string; size?: number }) {
  const p = { ...sp, stroke: color, strokeWidth: '1.75' }
  const s = size
  const icons: Record<string, React.ReactElement> = {
    spark: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </Svg>
    ),
    search: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle {...p} cx="11" cy="11" r="7.5" />
        <Line {...p} x1="20.5" y1="20.5" x2="16.1" y2="16.1" />
      </Svg>
    ),
    send: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Line {...p} x1="12" y1="19" x2="12" y2="5" />
        <Polyline {...p} points="5 12 12 5 19 12" />
      </Svg>
    ),
    refresh: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Polyline {...p} points="23 4 23 10 17 10" />
        <Path {...p} d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </Svg>
    ),
    chevron: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Polyline {...p} points="6 9 12 15 18 9" />
      </Svg>
    ),
  }
  return icons[name] ?? <></>
}

// ─── Skeleton Summary ─────────────────────────────────────────────────────────
function SkeletonSummary({ isDark }: { isDark: boolean }) {
  const op = useRef(new Animated.Value(0.35)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1,    duration: 750, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  const bg = isDark ? '#292524' : '#e7e5e4'
  return (
    <Animated.View style={{ opacity: op, gap: 8 }}>
      {[100, 88, 62].map((w, i) => (
        <View key={i} style={{ height: 11, borderRadius: 6, backgroundColor: bg, width: `${w}%` }} />
      ))}
    </Animated.View>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonItem({ isDark }: { isDark: boolean }) {
  const op = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  const bg = isDark ? '#292524' : '#e7e5e4'
  return (
    <Animated.View style={[sk.wrap, { opacity: op, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
      <View style={[sk.pill, { backgroundColor: bg, width: 80 }]} />
      <View style={[sk.line, { backgroundColor: bg, width: '100%', marginTop: 10 }]} />
      <View style={[sk.line, { backgroundColor: bg, width: '75%', marginTop: 6 }]} />
      <View style={[sk.line, { backgroundColor: bg, width: '55%', marginTop: 10, height: 10 }]} />
    </Animated.View>
  )
}
const sk = StyleSheet.create({
  wrap: { paddingVertical: 24, borderBottomWidth: 1 },
  pill: { height: 10, borderRadius: 6 },
  line: { height: 14, borderRadius: 6 },
})

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NoticiasScreen() {
  const router    = useRouter()
  const insets    = useSafeAreaInsets()
  const isDark    = useColorScheme() === 'dark'
  const t         = tokens(isDark)

  const [perfil, setPerfil]               = useState<Perfil>('Productor')
  const [filtro, setFiltro]               = useState('Todas')
  const [perfilOpen, setPerfilOpen]       = useState(false)
  const [query, setQuery]                 = useState('')
  const [focused, setFocused]             = useState(false)
  const [noticias, setNoticias]           = useState<Noticia[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [summary, setSummary]             = useState('')
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryAge, setSummaryAge]       = useState('')
  const [summaryError, setSummaryError]   = useState<string | null>(null)
  const [aiLoading, setAiLoading]         = useState(false)
  const [aiAnswer, setAiAnswer]           = useState<{ q: string; a: string } | null>(null)

  const inputRef = useRef<TextInput>(null)

  // ─── Fetch noticias ───────────────────────────────────────
  const fetchNoticias = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('v_noticias_feed')
        .select('*')
        .order('urgente', { ascending: false })

      if (filtro !== 'Todas') {
        q = q.eq('categoria', filtro.toUpperCase())
      }

      const { data, error: err } = await q
      if (err) throw err
      setNoticias((data as Noticia[]) ?? [])
    } catch {
      setError('No se pudieron cargar las noticias.')
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { void fetchNoticias() }, [fetchNoticias])

  // ─── Resumen diario IA ────────────────────────────────────
  const generateSummary = useCallback(async (lista: Noticia[]) => {
    setSummaryLoading(true)
    setSummaryError(null)
    setSummary('')
    const now = new Date()
    setSummaryAge(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`)

    if (lista.length === 0) {
      setSummaryError('server')
      setSummaryLoading(false)
      return
    }

    const ctx = lista.slice(0, 5)
      .map(n => `${n.categoria}: ${n.titulo}. ${n.resumen_general ?? ''}`)
      .join(' ')

    const fetchPromise = fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Eres el asistente de noticias ganaderas de Gandia 7. Con base en estas noticias recientes: ${ctx}\n\nEscribe un resumen ejecutivo breve (2-3 oraciones) del panorama del sector hoy. Sin títulos, solo el párrafo.`,
        }],
      }),
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 30000)
    )

    try {
      const res = await Promise.race([fetchPromise, timeoutPromise])
      if (!res.ok) throw new Error('server')
      const data = await res.json()
      const text: string = data.content?.map((b: any) => b.text ?? '').join('') ?? ''
      setSummary(text)
    } catch (err: any) {
      if (err?.message === 'timeout') {
        setSummaryError('timeout')
      } else if (err?.message === 'Network request failed') {
        setSummaryError('offline')
      } else {
        setSummaryError('server')
      }
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      void generateSummary(noticias)
    }
  }, [loading])

  // ─── Consulta IA ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!query.trim() || aiLoading) return
    const q = query.trim()
    setQuery('')
    setAiLoading(true)
    setAiAnswer({ q, a: '' })
    const ctx = noticias.slice(0, 8)
      .map(n => `${n.categoria}: ${n.titulo}. ${n.resumen_general ?? ''}`)
      .join(' ')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Eres el asistente de Gandia 7. Noticias del día: ${ctx}\n\nEl usuario es un ${perfil}. Responde esta pregunta de forma concisa y útil: ${q}`,
          }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map((b: any) => b.text ?? '').join('') ?? ''
      setAiAnswer({ q, a: text })
    } catch {
      setAiAnswer({ q, a: 'No se pudo obtener respuesta. Intenta de nuevo.' })
    } finally {
      setAiLoading(false)
    }
  }

  // ─── Sorted noticias ──────────────────────────────────────
  const sorted = [...noticias].sort((a, b) => {
    const ra = a.relevancia?.[perfil] ?? 0
    const rb = b.relevancia?.[perfil] ?? 0
    return rb - ra
  })

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Header ──────────────────────────────────────── */}
        <View style={s.pageHeader}>
          <View style={s.pageTitleRow}>
            <Text style={[s.pageTitle, { color: t.text }]}>Noticias</Text>

            {/* Selector de perfil */}
            <TouchableOpacity
              style={[s.perfilBtn, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={() => setPerfilOpen(p => !p)}
              activeOpacity={0.7}
            >
              <Text style={[s.perfilBtnText, { color: t.textSub }]}>{perfil}</Text>
              <Icon name="chevron" color={t.muted} size={13} />
            </TouchableOpacity>
          </View>

          {/* Dropdown perfiles */}
          {perfilOpen && (
            <>
              <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPerfilOpen(false)} />
              <View style={[s.dropdown, { backgroundColor: t.surface, borderColor: t.border, top: 46 }]}>
                {PERFILES.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[s.dropdownItem, p === perfil && { backgroundColor: 'rgba(47,175,143,0.08)' }]}
                    onPress={() => { setPerfil(p); setPerfilOpen(false) }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.dropdownText, { color: p === perfil ? '#2FAF8F' : t.textSub }]}>{p}</Text>
                    {p === perfil && <View style={s.activeDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ── Resumen IA ──────────────────────────────────── */}
        <View style={[s.summaryCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={s.summaryHeader}>
            <View style={s.summaryLabelRow}>
              <Icon name="spark" color="#2FAF8F" size={13} />
              <Text style={s.summaryLabel}>Resumen del día</Text>
            </View>
            <View style={s.summaryMeta}>
              {summaryAge && !summaryError ? <Text style={[s.summaryAge, { color: t.muted }]}>{summaryAge}</Text> : null}
              {!summaryLoading && !summaryError && (
                <TouchableOpacity onPress={() => generateSummary(noticias)} activeOpacity={0.6}>
                  <Icon name="refresh" color={t.muted} size={13} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {summaryLoading ? (
            <SkeletonSummary isDark={isDark} />
          ) : summaryError ? (
            <View style={s.summaryErrorWrap}>
              <Text style={[s.summaryErrorText, { color: t.muted }]}>
                {summaryError === 'offline'
                  ? 'Sin conexión a internet. Conéctate y vuelve a intentarlo.'
                  : summaryError === 'timeout'
                  ? 'La solicitud tardó demasiado. Verifica tu conexión.'
                  : 'No se pudo conectar al servidor. Intenta de nuevo.'}
              </Text>
              <TouchableOpacity onPress={() => generateSummary(noticias)} style={s.summaryRetryBtn} activeOpacity={0.7}>
                <Icon name="refresh" color="#2FAF8F" size={12} />
                <Text style={s.summaryRetryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[s.summaryText, { color: t.textSub }]}>{summary}</Text>
          )}
        </View>

        {/* ── Filtros ─────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filtrosScroll}
          contentContainerStyle={s.filtrosContent}
        >
          {CATEGORIAS.map(cat => {
            const active = filtro === cat
            return (
              <TouchableOpacity
                key={cat}
                style={[s.filtroChip, {
                  backgroundColor: active ? '#2FAF8F' : t.surface,
                  borderColor:     active ? '#2FAF8F' : t.border,
                }]}
                onPress={() => setFiltro(cat)}
                activeOpacity={0.7}
              >
                <Text style={[s.filtroText, { color: active ? '#fff' : t.muted }]}>{cat}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* ── Divider label ───────────────────────────────── */}
        <View style={[s.dividerRow, { marginHorizontal: 20 }]}>
          <View style={[s.dividerLine, { backgroundColor: t.mutedLight }]} />
          <Text style={[s.dividerLabel, { color: t.muted }]}>
            {loading ? 'Cargando…' : `${sorted.length} noticia${sorted.length !== 1 ? 's' : ''}`}
          </Text>
          <View style={[s.dividerLine, { backgroundColor: t.mutedLight }]} />
          <Text style={[s.dividerRight, { color: t.muted }]}>Prioridad: {perfil}</Text>
        </View>

        {/* ── Respuesta IA ────────────────────────────────── */}
        {aiAnswer && (
          <View style={[s.aiCard, { backgroundColor: t.surface, borderColor: t.border, marginHorizontal: 20 }]}>
            <Text style={[s.aiQuestion, { color: t.muted }]}>{aiAnswer.q}</Text>
            {!aiAnswer.a ? (
              <View style={s.aiSkeleton}>
                {[100, 85, 65].map((w, i) => (
                  <View key={i} style={[s.aiLine, { width: `${w}%`, backgroundColor: isDark ? '#292524' : '#e7e5e4' }]} />
                ))}
              </View>
            ) : (
              <View style={s.aiAnswerRow}>
                <Icon name="spark" color="#2FAF8F" size={13} />
                <Text style={[s.aiAnswer, { color: t.textSub }]}>{aiAnswer.a}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Noticias ────────────────────────────────────── */}
        <View style={{ marginHorizontal: 20 }}>
          {loading && (
            [1,2,3,4].map(i => <SkeletonItem key={i} isDark={isDark} />)
          )}

          {error && !loading && (
            <View style={s.emptyWrap}>
              <Text style={[s.emptyText, { color: t.muted }]}>{error}</Text>
              <TouchableOpacity onPress={fetchNoticias} style={s.retryBtn} activeOpacity={0.7}>
                <Text style={s.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && sorted.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={[s.emptyText, { color: t.muted }]}>No hay noticias en esta categoría.</Text>
            </View>
          )}

          {!loading && !error && sorted.map((n, i) => (
            <TouchableOpacity
              key={n.id}
              style={[s.article, {
                borderBottomColor: t.borderSoft,
                borderBottomWidth: i < sorted.length - 1 ? 1 : 0,
              }]}
              onPress={() => router.push(`/(app)/noticias/${n.id}` as any)}
              activeOpacity={0.75}
            >
              {/* Meta row */}
              <View style={s.metaRow}>
                {n.urgente && (
                  <Text style={s.urgenteBadge}>URGENTE ·</Text>
                )}
                <Text style={[s.categoria, { color: t.muted }]}>{n.categoria}</Text>
                <Text style={[s.dot, { color: t.mutedLight }]}>·</Text>
                <Text style={[s.tiempo, { color: t.muted }]}>{n.tiempo_relativo}</Text>
              </View>

              {/* Título */}
              <Text style={[s.titulo, { color: t.text }]} numberOfLines={3}>
                {n.titulo}
              </Text>

              {/* Resumen */}
              <Text style={[s.resumen, { color: t.textSub }]} numberOfLines={3}>
                {n.resumenes_ia?.[perfil] ?? n.resumen_general}
              </Text>

              {/* Footer */}
              <View style={s.articleFooter}>
                <View style={s.footerLeft}>
                  <Text style={[s.fuente, { color: t.muted }]}>{n.fuente}</Text>
                  <Text style={[s.dot, { color: t.mutedLight }]}>·</Text>
                  <Text style={[s.lectura, { color: t.muted }]}>{n.lectura_minutos} min</Text>
                </View>
                <View style={s.leerBtn}>
                  <Icon name="spark" color="#2FAF8F" size={12} />
                  <Text style={s.leerText}>Leer</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* ── Barra búsqueda flotante ─────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={s.searchFloat}
      >
        {/* Fade gradient */}
        <View style={s.searchFade} pointerEvents="none">
          <View style={[s.fadeTop, { backgroundColor: t.bg }]} />
        </View>

        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={s.searchBlur}
        >
          <View style={[s.searchInner, { paddingBottom: insets.bottom + 10 }]}>

            {/* Sugerencias */}
            {focused && !query && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.sugsScroll}
                contentContainerStyle={s.sugsContent}
                keyboardShouldPersistTaps="always"
              >
                {SUGERENCIAS.map((sug, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.sugChip, { backgroundColor: t.surface, borderColor: t.border }]}
                    onPress={() => { setQuery(sug); inputRef.current?.focus() }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.sugText, { color: t.muted }]}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={[s.inputRow, {
              backgroundColor: isDark ? 'rgba(28,25,23,0.95)' : 'rgba(255,255,255,0.98)',
              borderColor: t.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.10,
              shadowRadius: 16,
              elevation: 8,
            }]}>
              <Icon name="search" color={t.muted} size={16} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={handleSubmit}
                placeholder="Buscar noticias o preguntar a la IA…"
                placeholderTextColor={t.muted}
                returnKeyType="send"
                style={[s.input, { color: t.text }]}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={aiLoading}
                  style={s.sendBtn}
                  activeOpacity={0.8}
                >
                  {aiLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Icon name="send" color="#fff" size={14} />
                  }
                </TouchableOpacity>
              )}
            </View>

            <Text style={[s.searchFooter, { color: t.muted }]}>
              Normativa SENASICA · USDA · FDA · Precios SNIIM
            </Text>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { paddingTop: 8 },

  // Page header
  pageHeader:   { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, zIndex: 10 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  pageTitle:    { fontFamily: 'Geist-SemiBold', fontSize: 24, letterSpacing: -0.5 },
  perfilBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  perfilBtnText:{ fontFamily: 'Geist-Medium', fontSize: 12 },

  // Dropdown
  dropdown:     { position: 'absolute', right: 0, top: 48, width: 160, borderRadius: 14, borderWidth: 1, zIndex: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11 },
  dropdownText: { fontFamily: 'Geist-Medium', fontSize: 13 },
  activeDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2FAF8F' },

  // Summary card
  summaryCard:   { marginHorizontal: 20, marginTop: 16, marginBottom: 4, borderRadius: 16, borderWidth: 1, padding: 16 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryLabel:  { fontFamily: 'Geist-SemiBold', fontSize: 11, color: '#2FAF8F', textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryAge:    { fontFamily: 'Geist-Regular', fontSize: 11 },
  summarySkeletons: { gap: 6 },
  summaryLine:   { height: 10, borderRadius: 5 },
  summaryText:   { fontFamily: 'Geist-Regular', fontSize: 13.5, lineHeight: 21 },
  summaryErrorWrap:  { gap: 8 },
  summaryErrorText:  { fontFamily: 'Geist-Regular', fontSize: 13, lineHeight: 20 },
  summaryRetryBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  summaryRetryText:  { fontFamily: 'Geist-Medium', fontSize: 12, color: '#2FAF8F' },

  // Filtros
  filtrosScroll:   { marginTop: 16 },
  filtrosContent:  { paddingHorizontal: 20, gap: 8 },
  filtroChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filtroText:      { fontFamily: 'Geist-Medium', fontSize: 12 },

  // Divider
  dividerRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 4 },
  dividerLine:   { flex: 1, height: 1 },
  dividerLabel:  { fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  dividerRight:  { fontFamily: 'Geist-Regular',  fontSize: 10 },

  // AI card
  aiCard:      { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, marginTop: 8 },
  aiQuestion:  { fontFamily: 'Geist-SemiBold', fontSize: 13, marginBottom: 10 },
  aiAnswerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  aiAnswer:    { fontFamily: 'Geist-Regular', fontSize: 13.5, lineHeight: 21, flex: 1 },
  aiSkeleton:  { gap: 6 },
  aiLine:      { height: 10, borderRadius: 5, marginTop: 4 },

  // Article
  article:      { paddingVertical: 24 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  urgenteBadge: { fontFamily: 'Geist-Bold', fontSize: 9.5, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5 },
  categoria:    { fontFamily: 'Geist-SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  dot:          { fontSize: 11 },
  tiempo:       { fontFamily: 'Geist-Regular', fontSize: 11 },
  titulo:       { fontFamily: 'Geist-SemiBold', fontSize: 17, lineHeight: 24, letterSpacing: -0.3, marginBottom: 8 },
  resumen:      { fontFamily: 'Geist-Regular',  fontSize: 13.5, lineHeight: 22, marginBottom: 12 },
  articleFooter:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fuente:       { fontFamily: 'Geist-Medium', fontSize: 11.5 },
  lectura:      { fontFamily: 'Geist-Regular', fontSize: 11.5 },
  leerBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leerText:     { fontFamily: 'Geist-Medium', fontSize: 11.5, color: '#2FAF8F' },

  // Empty / Error
  emptyWrap:  { paddingVertical: 48, alignItems: 'center' },
  emptyText:  { fontFamily: 'Geist-Regular', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  retryBtn:   { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(47,175,143,0.1)' },
  retryText:  { fontFamily: 'Geist-Medium', fontSize: 13, color: '#2FAF8F' },

  // Search bar flotante
  searchFloat:  { position: 'absolute', bottom: 0, left: 0, right: 0 },
  searchFade:   { height: 48, pointerEvents: 'none' },
  fadeTop:      { flex: 1, opacity: 0, },  // placeholder — usamos BlurView directamente
  searchBlur:   { overflow: 'hidden' },
  searchInner:  { paddingTop: 10, paddingHorizontal: 16 },
  sugsScroll:  { marginBottom: 8 },
  sugsContent: { gap: 8, paddingRight: 16 },
  sugChip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  sugText:     { fontFamily: 'Geist-Regular', fontSize: 12 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 50, borderRadius: 18, borderWidth: 1 },
  input:       { flex: 1, fontFamily: 'Geist-Regular', fontSize: 14, height: 50 },
  sendBtn:     { width: 34, height: 34, borderRadius: 11, backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center' },
  searchFooter:{ fontFamily: 'Geist-Regular', fontSize: 10, textAlign: 'center', marginTop: 6, marginBottom: 2, color: '#a8a29e' },
})