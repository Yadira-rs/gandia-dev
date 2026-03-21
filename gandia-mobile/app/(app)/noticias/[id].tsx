// app/(app)/noticias/[id].tsx
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, useColorScheme,
  Animated, KeyboardAvoidingView, Platform, Linking,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg'
import { supabase } from '../../../src/lib/supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────
type Perfil = 'Productor' | 'Exportador' | 'MVZ' | 'Union' | 'Auditor'

interface Noticia {
  id: string
  slug: string
  titulo: string
  cuerpo: string
  fuente: string
  url_original: string | null
  categoria: string
  urgente: boolean
  urgencia_nivel: string
  resumen_general: string
  resumenes_ia: Record<string, string>
  impacto_ia: string
  acciones_ia: string[]
  relevancia: Record<string, number>
  lectura_minutos: number
  publicada_en: string
  relacionadas: string[]
}

interface NoticiaRelacionada {
  id: string
  titulo: string
  categoria: string
  tiempo_relativo: string
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tokens = (isDark: boolean) => ({
  bg:         isDark ? '#0c0a09' : '#fafaf9',
  surface:    isDark ? '#141210' : '#ffffff',
  surface2:   isDark ? '#1c1917' : '#f5f4f3',
  border:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  borderSoft: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:       isDark ? '#fafaf9' : '#1c1917',
  textSub:    isDark ? '#d6d3d1' : '#44403c',
  muted:      isDark ? '#78716c' : '#a8a29e',
  mutedLight: isDark ? '#44403c' : '#e7e5e4',
  inputBg:    isDark ? '#1c1917' : '#ffffff',
})

const PERFILES: Perfil[] = ['Productor', 'Exportador', 'MVZ', 'Union', 'Auditor']

const URGENCIA_COLOR: Record<string, string> = {
  alta:  '#ef4444',
  media: '#f59e0b',
  baja:  '#2FAF8F',
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1)  return 'Hace menos de 1 hora'
  if (h < 24) return `Hace ${h} hora${h > 1 ? 's' : ''}`
  if (d < 7)  return `Hace ${d} día${d > 1 ? 's' : ''}`
  return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const sp = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function Icon({ name, color, size = 16 }: { name: string; color: string; size?: number }) {
  const p = { ...sp, stroke: color, strokeWidth: '1.75' }
  const s = size
  const icons: Record<string, React.ReactElement> = {
    back: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Line {...p} x1="19" y1="12" x2="5" y2="12" />
        <Polyline {...p} points="12 19 5 12 12 5" />
      </Svg>
    ),
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
    shield: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </Svg>
    ),
    external: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <Polyline {...p} points="15 3 21 3 21 9" />
        <Line {...p} x1="10" y1="14" x2="21" y2="3" />
      </Svg>
    ),
    alert: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <Line {...p} x1="12" y1="9" x2="12" y2="13" />
        <Line {...p} x1="12" y1="17" x2="12.01" y2="17" />
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonDetail({ isDark }: { isDark: boolean }) {
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
    <Animated.View style={{ opacity: op, paddingHorizontal: 20, paddingTop: 8 }}>
      <View style={[sk.pill, { backgroundColor: bg, width: 100 }]} />
      <View style={[sk.line, { backgroundColor: bg, width: '100%', height: 22, marginTop: 16 }]} />
      <View style={[sk.line, { backgroundColor: bg, width: '88%', height: 22, marginTop: 8 }]} />
      <View style={[sk.line, { backgroundColor: bg, width: '60%', height: 22, marginTop: 8, marginBottom: 24 }]} />
      {[100, 95, 88, 70, 92, 80, 75].map((w, i) => (
        <View key={i} style={[sk.line, { backgroundColor: bg, width: `${w}%`, marginTop: 10 }]} />
      ))}
    </Animated.View>
  )
}
const sk = StyleSheet.create({
  pill: { height: 10, borderRadius: 6 },
  line: { height: 14, borderRadius: 6 },
})

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NoticiaDetalleScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>()
  const router   = useRouter()
  const insets   = useSafeAreaInsets()
  const isDark   = useColorScheme() === 'dark'
  const t        = tokens(isDark)

  const [perfil, setPerfil]         = useState<Perfil>('Productor')
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [noticia, setNoticia]       = useState<Noticia | null>(null)
  const [relacionadas, setRelacionadas] = useState<NoticiaRelacionada[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [query, setQuery]           = useState('')
  const [focused, setFocused]       = useState(false)
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const inputRef  = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)

  // ─── Fetch ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('noticias')
        .select('*')
        .eq('id', id)
        .eq('activa', true)
        .single()

      if (err || !data) {
        setError('No se encontró la noticia.')
        setLoading(false)
        return
      }

      setNoticia(data as Noticia)

      if (data.relacionadas && data.relacionadas.length > 0) {
        const { data: rel } = await supabase
          .from('v_noticias_feed')
          .select('id, titulo, categoria, tiempo_relativo')
          .in('id', data.relacionadas)
          .limit(3)
        setRelacionadas((rel as NoticiaRelacionada[]) ?? [])
      }

      setLoading(false)
    }
    void fetch()
  }, [id])

  // ─── Chat ─────────────────────────────────────────────────
  const handleQuery = async () => {
    if (!query.trim() || chatLoading || !noticia) return
    const q = query.trim()
    setQuery('')
    setChatLoading(true)
    setChatHistory(prev => [...prev, { q, a: '' }])
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Eres el analista de GANDIA, plataforma de trazabilidad ganadera en México. Perfil del usuario: ${perfil}. Responde en español, tono profesional. Sin emojis. Máximo 3 párrafos cortos. Sé específico y accionable.`,
          messages: [{
            role: 'user',
            content: `Noticia: ${noticia.titulo}\n\nContenido: ${noticia.cuerpo.slice(0, 1500)}\n\nConsulta del ${perfil}: ${q}`,
          }],
        }),
      })
      const data = await res.json()
      const answer: string = data.content?.[0]?.text ?? ''
      setChatHistory(prev => prev.map((h, i) => i === prev.length - 1 ? { ...h, a: answer } : h))
    } catch {
      setChatHistory(prev => prev.map((h, i) => i === prev.length - 1 ? { ...h, a: 'No se pudo procesar la consulta.' } : h))
    }
    setChatLoading(false)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)
  }

  const sugerencias = noticia ? [
    `¿Cómo me afecta como ${perfil}?`,
    '¿Qué debo hacer esta semana?',
    `Impacto para ${perfil}`,
  ] : []

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* ── Sub-header ──────────────────────────────────── */}
      <View style={[s.subHeader, { borderBottomColor: t.borderSoft }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="back" color={t.muted} size={16} />
          <Text style={[s.backText, { color: t.muted }]}>Noticias</Text>
        </TouchableOpacity>

        {/* Perfil selector */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={[s.perfilBtn, { borderColor: t.border }]}
            onPress={() => setPerfilOpen(p => !p)}
            activeOpacity={0.7}
          >
            <Text style={[s.perfilText, { color: t.textSub }]}>{perfil}</Text>
            <Icon name="chevron" color={t.muted} size={12} />
          </TouchableOpacity>

          {perfilOpen && (
            <View style={[s.dropdown, { backgroundColor: t.surface, borderColor: t.border }]}>
              {PERFILES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.dropItem, p === perfil && { backgroundColor: 'rgba(47,175,143,0.08)' }]}
                  onPress={() => { setPerfil(p); setPerfilOpen(false); setChatHistory([]) }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dropText, { color: p === perfil ? '#2FAF8F' : t.textSub }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Loading ─────────────────────────────────── */}
        {loading && <SkeletonDetail isDark={isDark} />}

        {/* ── Error ───────────────────────────────────── */}
        {error && !loading && (
          <View style={s.errorWrap}>
            <Text style={[s.errorText, { color: t.muted }]}>{error}</Text>
            <TouchableOpacity onPress={() => router.back()} style={s.errorBtn} activeOpacity={0.7}>
              <Text style={s.errorBtnText}>Volver a noticias</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Artículo ────────────────────────────────── */}
        {noticia && !loading && (
          <View style={s.article}>

            {/* Meta */}
            <View style={s.metaRow}>
              {noticia.urgente && (
                <View style={s.urgenteRow}>
                  <Icon name="alert" color="#ef4444" size={12} />
                  <Text style={s.urgenteBadge}>URGENTE ·</Text>
                </View>
              )}
              <Text style={[s.categoria, { color: t.muted }]}>{noticia.categoria}</Text>
              <Text style={[s.dot, { color: t.mutedLight }]}>·</Text>
              <Text style={[s.tiempo, { color: t.muted }]}>{tiempoRelativo(noticia.publicada_en)}</Text>
              <Text style={[s.dot, { color: t.mutedLight }]}>·</Text>
              <Text style={[s.tiempo, { color: t.muted }]}>{noticia.lectura_minutos} min</Text>
            </View>

            {/* Título */}
            <Text style={[s.titulo, { color: t.text }]}>{noticia.titulo}</Text>

            {/* Fuente */}
            <View style={[s.fuenteRow, { borderBottomColor: t.borderSoft }]}>
              <View style={[s.fuenteIcon, { backgroundColor: t.surface2 }]}>
                <Icon name="shield" color={t.muted} size={13} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.fuenteName, { color: t.text }]}>{noticia.fuente}</Text>
                {noticia.url_original && (
                  <TouchableOpacity
                    onPress={() => noticia.url_original && Linking.openURL(noticia.url_original)}
                    activeOpacity={0.7}
                    style={s.urlRow}
                  >
                    <Text style={s.urlText}>Ver fuente original</Text>
                    <Icon name="external" color="#2FAF8F" size={11} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Análisis IA ─────────────────────────── */}
            <View style={[s.aiCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={[s.aiCardHeader, { borderBottomColor: t.borderSoft }]}>
                <View style={s.aiCardLabel}>
                  <Icon name="spark" color="#2FAF8F" size={13} />
                  <Text style={s.aiCardLabelText}>Análisis para {perfil}</Text>
                </View>
                {noticia.urgencia_nivel && (
                  <Text style={[s.urgenciaTag, { color: URGENCIA_COLOR[noticia.urgencia_nivel] ?? t.muted }]}>
                    {`Urgencia ${noticia.urgencia_nivel}`.toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={s.aiCardBody}>
                {/* Resumen personalizado */}
                <Text style={[s.aiResumen, { color: t.textSub }]}>
                  {noticia.resumenes_ia?.[perfil] ?? noticia.resumen_general}
                </Text>

                {/* Impacto */}
                {!!noticia.impacto_ia && (
                  <View style={s.impactoWrap}>
                    <Text style={[s.impactoLabel, { color: t.muted }]}>IMPACTO DIRECTO</Text>
                    <Text style={[s.impactoText, { color: t.textSub }]}>{noticia.impacto_ia}</Text>
                  </View>
                )}

                {/* Acciones */}
                {noticia.acciones_ia && noticia.acciones_ia.length > 0 && (
                  <View style={s.accionesWrap}>
                    <Text style={[s.accionesLabel, { color: t.muted }]}>ACCIONES RECOMENDADAS</Text>
                    {noticia.acciones_ia.map((accion, i) => (
                      <View key={i} style={s.accionRow}>
                        <View style={s.accionDot} />
                        <Text style={[s.accionText, { color: t.textSub }]}>{accion}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* ── Cuerpo del artículo ─────────────────── */}
            <View style={s.cuerpoWrap}>
              {noticia.cuerpo.split('\n\n').filter(Boolean).map((parrafo, i) => (
                <Text key={i} style={[s.parrafo, { color: t.textSub }]}>{parrafo}</Text>
              ))}
            </View>

            {/* Ornament */}
            <View style={s.ornament}>
              {[0,1,2].map(i => <View key={i} style={[s.ornamentDot, { backgroundColor: t.mutedLight }]} />)}
            </View>

            {/* ── Chat history ────────────────────────── */}
            {chatHistory.length > 0 && (
              <View style={s.chatWrap}>
                <View style={[s.chatDivider, { marginBottom: 24 }]}>
                  <View style={[s.divLine, { backgroundColor: t.mutedLight }]} />
                  <Text style={[s.divLabel, { color: t.muted }]}>TUS CONSULTAS</Text>
                  <View style={[s.divLine, { backgroundColor: t.mutedLight }]} />
                </View>

                {chatHistory.map((h, i) => (
                  <View key={i} style={[s.chatItem, i < chatHistory.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.borderSoft, paddingBottom: 28, marginBottom: 28 }]}>
                    <Text style={[s.chatPerfilLabel, { color: t.muted }]}>{perfil} preguntó</Text>
                    <Text style={[s.chatQuestion, { color: t.text }]}>{h.q}</Text>

                    <View style={s.chatAnswerRow}>
                      <View style={{ marginTop: 2 }}>
                        <Icon name="spark" color="#2FAF8F" size={13} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {!h.a ? (
                          <View style={{ gap: 8 }}>
                            {[100, 85, 65].map((w, j) => (
                              <View key={j} style={{ height: 12, borderRadius: 6, width: `${w}%`, backgroundColor: isDark ? '#292524' : '#e7e5e4' }} />
                            ))}
                          </View>
                        ) : (
                          h.a.split('\n\n').filter(Boolean).map((p, j) => (
                            <Text key={j} style={[s.chatAnswer, { color: t.textSub }]}>{p}</Text>
                          ))
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Relacionadas ────────────────────────── */}
            {relacionadas.length > 0 && (
              <View style={s.relacionadasWrap}>
                <View style={s.relacionadasHeader}>
                  <Text style={[s.relacionadasLabel, { color: t.muted }]}>MÁS EN {noticia.categoria}</Text>
                  <View style={[s.divLine, { backgroundColor: t.mutedLight, flex: 1 }]} />
                </View>
                {relacionadas.map((r, i) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[s.relacionadaItem, {
                      borderBottomColor: t.borderSoft,
                      borderBottomWidth: i < relacionadas.length - 1 ? 1 : 0,
                    }]}
                    onPress={() => router.push(`/(app)/noticias/${r.id}` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={s.metaRow}>
                      <Text style={[s.categoria, { color: t.muted }]}>{r.categoria}</Text>
                      <Text style={[s.dot, { color: t.mutedLight }]}>·</Text>
                      <Text style={[s.tiempo, { color: t.muted }]}>{r.tiempo_relativo}</Text>
                    </View>
                    <Text style={[s.relacionadaTitulo, { color: t.text }]} numberOfLines={2}>
                      {r.titulo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

          </View>
        )}
      </ScrollView>

      {/* ── Barra consulta flotante ─────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={s.searchFloat}
      >
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={s.searchBlur}
        >
          <View style={[s.searchInner, { paddingBottom: insets.bottom + 10 }]}>

            {/* Sugerencias */}
            {focused && !query && sugerencias.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
                contentContainerStyle={{ gap: 8, paddingRight: 16 }}
                keyboardShouldPersistTaps="always"
              >
                {sugerencias.map((sug, i) => (
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
                onSubmitEditing={handleQuery}
                placeholder="Preguntar sobre esta noticia…"
                placeholderTextColor={t.muted}
                returnKeyType="send"
                style={[s.input, { color: t.text }]}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={handleQuery}
                  disabled={chatLoading}
                  style={s.sendBtn}
                  activeOpacity={0.8}
                >
                  {chatLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Icon name="send" color="#fff" size={14} />
                  }
                </TouchableOpacity>
              )}
            </View>

            <Text style={[s.searchFooter, { color: t.muted }]}>
              Análisis contextualizado por GANDIA · {noticia?.fuente ?? ''}
            </Text>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { paddingTop: 0 },

  // Sub-header
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 44, borderBottomWidth: 1 },
  backBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText:  { fontFamily: 'Geist-Medium', fontSize: 13 },
  perfilBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  perfilText:{ fontFamily: 'Geist-Medium', fontSize: 12 },
  dropdown:  { position: 'absolute', right: 0, top: 36, width: 150, borderRadius: 14, borderWidth: 1, zIndex: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  dropItem:  { paddingHorizontal: 14, paddingVertical: 11 },
  dropText:  { fontFamily: 'Geist-Medium', fontSize: 13 },

  // Article
  article:    { paddingHorizontal: 20, paddingTop: 20 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  urgenteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  urgenteBadge: { fontFamily: 'Geist-Bold', fontSize: 9.5, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5 },
  categoria:  { fontFamily: 'Geist-SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  dot:        { fontSize: 11 },
  tiempo:     { fontFamily: 'Geist-Regular', fontSize: 11 },
  titulo:     { fontFamily: 'Geist-SemiBold', fontSize: 26, lineHeight: 34, letterSpacing: -0.5, marginBottom: 20 },

  // Fuente
  fuenteRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingBottom: 20, marginBottom: 20, borderBottomWidth: 1 },
  fuenteIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fuenteName: { fontFamily: 'Geist-SemiBold', fontSize: 13, marginBottom: 3 },
  urlRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  urlText:    { fontFamily: 'Geist-Regular', fontSize: 11, color: '#2FAF8F' },

  // AI Card
  aiCard:        { borderRadius: 16, borderWidth: 1, marginBottom: 28, overflow: 'hidden' },
  aiCardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
  aiCardLabel:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  aiCardLabelText: { fontFamily: 'Geist-SemiBold', fontSize: 11, color: '#2FAF8F' },
  urgenciaTag:   { fontFamily: 'Geist-Bold', fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  aiCardBody:    { padding: 16, gap: 16 },
  aiResumen:     { fontFamily: 'Geist-Regular', fontSize: 14, lineHeight: 22 },
  impactoWrap:   { gap: 6 },
  impactoLabel:  { fontFamily: 'Geist-SemiBold', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 1 },
  impactoText:   { fontFamily: 'Geist-Regular', fontSize: 13.5, lineHeight: 21 },
  accionesWrap:  { gap: 8 },
  accionesLabel: { fontFamily: 'Geist-SemiBold', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 1 },
  accionRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  accionDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2FAF8F', marginTop: 6 },
  accionText:    { fontFamily: 'Geist-Regular', fontSize: 13, lineHeight: 20, flex: 1 },

  // Cuerpo
  cuerpoWrap: { gap: 18, marginBottom: 32 },
  parrafo:    { fontFamily: 'Geist-Regular', fontSize: 16, lineHeight: 28, letterSpacing: -0.1 },

  // Ornament
  ornament:    { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 24 },
  ornamentDot: { width: 4, height: 4, borderRadius: 2 },

  // Chat
  chatWrap:       { marginBottom: 32 },
  chatDivider:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine:        { height: 1 },
  divLabel:       { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' },
  chatItem:       {},
  chatPerfilLabel:{ fontFamily: 'Geist-SemiBold', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  chatQuestion:   { fontFamily: 'Geist-SemiBold', fontSize: 20, lineHeight: 28, letterSpacing: -0.3, marginBottom: 16 },
  chatAnswerRow:  { flexDirection: 'row', gap: 10 },
  chatAnswer:     { fontFamily: 'Geist-Regular', fontSize: 14.5, lineHeight: 24, marginBottom: 8 },

  // Relacionadas
  relacionadasWrap:   { marginTop: 16, marginBottom: 16 },
  relacionadasHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  relacionadasLabel:  { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' },
  relacionadaItem:    { paddingVertical: 18 },
  relacionadaTitulo:  { fontFamily: 'Geist-SemiBold', fontSize: 15, lineHeight: 22, letterSpacing: -0.2 },

  // Error
  errorWrap:    { paddingTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  errorText:    { fontFamily: 'Geist-Regular', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  errorBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(47,175,143,0.1)' },
  errorBtnText: { fontFamily: 'Geist-Medium', fontSize: 13, color: '#2FAF8F' },

  // Search bar flotante
  searchFloat:  { position: 'absolute', bottom: 0, left: 0, right: 0 },
  searchBlur:   { overflow: 'hidden' },
  searchInner:  { paddingTop: 10, paddingHorizontal: 16 },
  sugChip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  sugText:     { fontFamily: 'Geist-Regular', fontSize: 12 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 50, borderRadius: 18, borderWidth: 1 },
  input:       { flex: 1, fontFamily: 'Geist-Regular', fontSize: 14, height: 50 },
  sendBtn:     { width: 34, height: 34, borderRadius: 11, backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center' },
  searchFooter:{ fontFamily: 'Geist-Regular', fontSize: 10, textAlign: 'center', marginTop: 6, marginBottom: 2 },
})