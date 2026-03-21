// app/(public)/login.tsx
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated,
  useColorScheme, StatusBar, ActivityIndicator, Modal,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path, Line, Polyline } from 'react-native-svg'
import { signInWithOAuth } from '../../src/lib/authService'
import * as WebBrowser from 'expo-web-browser'

// Necesario para que expo-web-browser complete la sesión OAuth al volver a la app
WebBrowser.maybeCompleteAuthSession()

const { height: H } = Dimensions.get('window')

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tokens = (isDark: boolean) => ({
  bg:           isDark ? '#0c0a09' : '#fafaf9',
  surface:      isDark ? '#141210' : '#ffffff',
  border:       isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)',
  text:         isDark ? '#fafaf9' : '#1c1917',
  muted:        isDark ? '#78716c' : '#a8a29e',
  subtext:      isDark ? '#57534e' : '#a8a29e',
  msgUser:      isDark ? '#1c1917' : '#ffffff',
  msgUserBorder:isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
})

// ─── Logo ─────────────────────────────────────────────────────────────────────
function GandiaLogo({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  )
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
function TypewriterText({ text, speed = 50, delay = 0, style, onComplete }: {
  text: string; speed?: number; delay?: number; style?: any; onComplete?: () => void
}) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const cursorAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ])).start()
    const t = setTimeout(() => {
      let i = 0
      const iv = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++ }
        else { clearInterval(iv); setShowCursor(false); onComplete?.() }
      }, speed)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(t)
  }, [])

  return (
    <Text style={style}>
      {displayed}
      {showCursor && <Animated.Text style={{ opacity: cursorAnim, color: '#2FAF8F' }}>|</Animated.Text>}
    </Text>
  )
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDot({ delay, color }: { delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: -4, duration: 300, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0,  duration: 300, useNativeDriver: true }),
      Animated.delay(600),
    ])).start()
  }, [])
  return <Animated.View style={[cs.dot, { backgroundColor: color, transform: [{ translateY: anim }] }]} />
}

// ─── Novedad card ─────────────────────────────────────────────────────────────
const NOVEDADES = [
  {
    tag: 'NOVEDAD — v7.1',
    headline: 'Modo sin\nconexión.',
    body: 'Registra pesajes y biometría sin señal en el corral. ',
    highlight: 'GANDIA sincroniza al reconectar.',
  },
  {
    tag: 'ACTUALIZACIÓN — v7.1',
    headline: 'Pasaporte\nganadero.',
    body: 'Cada animal con su historial completo, exportable y verificable. ',
    highlight: 'Listo para cualquier mercado.',
  },
  {
    tag: 'GANDIA — 2026',
    headline: 'Trazabilidad\ncertificada.',
    body: 'El origen de un animal es su mayor valor, certificado y protegido. ',
    highlight: 'GANDIA lo hace valer en el mundo.',
  },
]

function NovedadCard({ isDark }: { isDark: boolean }) {
  const t = tokens(isDark)
  const [index, setIndex] = useState(0)
  const [next, setNext]   = useState(1)
  const fadeOut = useRef(new Animated.Value(1)).current
  const lineW   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(lineW, { toValue: 1, duration: 1000, delay: 400, useNativeDriver: false }).start()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setIndex(i => {
          const ni = (i + 1) % NOVEDADES.length
          setNext((ni + 1) % NOVEDADES.length)
          return ni
        })
        Animated.timing(fadeOut, { toValue: 1, duration: 400, useNativeDriver: true }).start()
      })
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const n = NOVEDADES[index]

  return (
    <View style={[nc.wrap, {
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    }]}>
      <Animated.View style={[nc.topLine, {
        width: lineW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }]} />

      <Animated.View style={[nc.inner, { opacity: fadeOut }]}>
        <View style={nc.eyebrowRow}>
          <View style={nc.eyeDot} />
          <Text style={[nc.eyeText, { color: t.subtext }]}>{n.tag}</Text>
        </View>
        <Text style={[nc.headline, { color: t.text }]}>{n.headline}</Text>
        <Text style={[nc.body, { color: t.muted }]}>
          {n.body}<Text style={[nc.body, { color: '#2FAF8F' }]}>{n.highlight}</Text>
        </Text>
      </Animated.View>

      {/* Dots indicator */}
      <View style={nc.dots}>
        {NOVEDADES.map((_, i) => (
          <View key={i} style={[nc.dotInd, {
            backgroundColor: i === index ? '#2FAF8F' : (isDark ? '#44403c' : '#d6d3d1'),
            width: i === index ? 14 : 5,
          }]} />
        ))}
      </View>
    </View>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel, isDark }: {
  open: boolean; title: string; description: string; confirmLabel?: string; cancelLabel?: string
  onConfirm: () => void; onCancel: () => void; isDark: boolean
}) {
  const t      = tokens(isDark)
  const scaleA = useRef(new Animated.Value(0.94)).current
  const opA    = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(scaleA, { toValue: 1,  friction: 7, tension: 100, useNativeDriver: true }),
        Animated.timing(opA,    { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else { scaleA.setValue(0.94); opA.setValue(0) }
  }, [open])
  if (!open) return null
  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' } as any} />
      <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 } as any} pointerEvents="box-none">
        <Animated.View style={{ width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden', opacity: opA, transform: [{ scale: scaleA }] }}>
          <View style={{ height: 2, backgroundColor: '#2FAF8F', opacity: 0.6 }} />
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderTopWidth: 0, borderColor: t.border, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 }}>
            <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15, color: t.text, marginBottom: 6 }}>{title}</Text>
            <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 18 }}>{description}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={onCancel}  style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f4', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: t.muted }}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 13, color: '#fff' }}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── Rotating phrase ──────────────────────────────────────────────────────────
const LOGIN_PHRASES = ['Ingresa tu email para continuar.', 'Acceso seguro y cifrado.', 'Tu trazabilidad en un solo lugar.']

function RotatingPhrase({ isDark }: { isDark: boolean }) {
  const t = tokens(isDark)
  const [idx, setIdx] = useState(0)
  const opacity = useRef(new Animated.Value(1)).current
  const ty      = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const iv = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(ty,      { toValue: 4, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % LOGIN_PHRASES.length)
        ty.setValue(-4)
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(ty,      { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start()
      })
    }, 3000)
    return () => clearInterval(iv)
  }, [])
  return (
    <Animated.Text style={{ fontFamily: 'InstrumentSerif-Italic', fontSize: 14, color: t.muted, textAlign: 'center', minHeight: 22, opacity, transform: [{ translateY: ty }] }}>
      {LOGIN_PHRASES[idx]}
    </Animated.Text>
  )
}

// ─── Chat Modal ───────────────────────────────────────────────────────────────
function ChatLoginModal({ visible, onClose, onSuccess, isDark }: {
  visible: boolean; onClose: () => void; onSuccess: () => void; isDark: boolean
}) {
  const t = tokens(isDark)
  const [messages, setMessages]             = useState<Array<{ type: 'user' | 'bot'; content: string }>>([])
  const [userInput, setUserInput]           = useState('')
  const [passwordInput, setPasswordInput]   = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [step, setStep]                     = useState<'email' | 'password'>('email')
  const [pendingEmail, setPendingEmail]     = useState('')
  const [isTyping, setIsTyping]             = useState(false)
  const [isProcessing, setIsProcessing]     = useState(false)
  const [forgotSent, setForgotSent]         = useState(false)
  const [confirmModal, setConfirmModal]     = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const hasUserMsg = messages.some(m => m.type === 'user')

  useEffect(() => {
    if (visible && messages.length === 0) {
      setStep('email'); setPendingEmail(''); setUserInput(''); setPasswordInput(''); setForgotSent(false)
      setTimeout(() => setMessages([{ type: 'bot', content: 'Hola 👋 Bienvenido de nuevo a GANDIA. Ingresa tu email para continuar.' }]), 300)
    }
  }, [visible])

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages, isTyping])

  const addMsg = (type: 'bot' | 'user', content: string) =>
    setMessages(p => [...p, { type, content }])

  const handleForgotPassword = () => {
    if (!pendingEmail || isProcessing) return
    setIsProcessing(true)
    setForgotSent(false)
    setTimeout(() => {
      // TODO (compañero): supabase.auth.resetPasswordForEmail(pendingEmail)
      addMsg('bot', `Te enviamos un enlace de recuperación a ${pendingEmail}. Revisa tu bandeja de entrada.`)
      setForgotSent(true)
      setIsProcessing(false)
    }, 800)
  }

  const handleSend = async () => {
    if (isProcessing) return
    if (step === 'email') {
      const value = userInput.trim()
      if (!value) return
      addMsg('user', value); setUserInput('')
      setIsProcessing(true); setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          addMsg('bot', 'Ese email no parece válido. Intenta de nuevo.')
          setIsProcessing(false); return
        }
        setPendingEmail(value); setStep('password')
        addMsg('bot', 'Ingresa tu contraseña para continuar.')
        setIsProcessing(false)
      }, 700)
      return
    }
    if (step === 'password') {
      const value = passwordInput.trim()
      if (!value) return
      addMsg('user', '••••••••'); setPasswordInput('')
      setIsProcessing(true); setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        // TODO (compañero): supabase.auth.signInWithPassword({ email: pendingEmail, password: value })
        addMsg('bot', 'Contraseña verificada ✓\n\nValidando tu cuenta...')
        setTimeout(() => onSuccess(), 800)
      }, 700)
    }
  }

  const canSend = step === 'email' ? userInput.trim().length > 0 : passwordInput.trim().length > 0

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <ConfirmModal
          open={confirmModal}
          title="¿Regresar?"
          description="Se perderá el progreso del inicio de sesión."
          confirmLabel="Sí, regresar"
          onConfirm={() => {
            setConfirmModal(false)
            setMessages([]); setStep('email'); setPendingEmail('')
            setUserInput(''); setPasswordInput(''); setIsProcessing(false)
            onClose()
          }}
          onCancel={() => setConfirmModal(false)}
          isDark={isDark}
        />

        {/* Header */}
        <View style={[cs.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
          <View style={[cs.progressTrack, { backgroundColor: isDark ? '#1c1917' : '#e7e5e4' }]}>
            <View style={[cs.progressBar, { width: step === 'email' ? '50%' : '100%' }]} />
          </View>
          <View style={cs.headerRow}>
            <TouchableOpacity onPress={() => setConfirmModal(true)} style={cs.backBtn} activeOpacity={0.6}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M15 19l-7-7 7-7" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={[cs.backText, { color: t.muted }]}>Volver</Text>
            </TouchableOpacity>

            <View style={cs.headerCenter}>
              <GandiaLogo size={16} />
              <Text style={[cs.headerBrand, { color: t.text }]}>GANDIA</Text>
              <View style={[cs.headerDiv, { backgroundColor: t.border }]} />
              <Text style={[cs.headerSub, { color: t.muted }]}>Iniciar Sesión</Text>
            </View>

            <View style={cs.headerRight}>
              <Text style={[cs.stepNum, { color: t.muted }]}>{step === 'email' ? '01' : '02'} / 02</Text>
              <View style={[cs.headerDiv, { backgroundColor: t.border }]} />
              <Text style={[cs.stepLabel, { color: t.muted }]}>{step === 'email' ? 'Correo' : 'Contraseña'}</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={[cs.messages, !hasUserMsg && { flex: 1 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header siempre visible */}
            <View style={[cs.empty, { paddingTop: 32, paddingBottom: 24 }]}>
              <Text style={[cs.emptyTitle, { color: t.text }]}>{'Bienvenido\nde nuevo.'}</Text>
              <RotatingPhrase isDark={isDark} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
                {['Acceso seguro', 'Verificación UGRD', 'Datos cifrados'].map((label, i) => (
                  <View key={i} style={{ height: 28, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, backgroundColor: t.surface, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Geist-Medium', color: t.muted }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {messages.map((m, i) => (
              <View key={i} style={[cs.msgRow, m.type === 'user' ? cs.rowUser : cs.rowBot]}>
                {m.type === 'user' ? (
                  <View style={[cs.bubbleUser, { backgroundColor: t.msgUser, borderColor: t.msgUserBorder }]}>
                    <Text style={[cs.bubbleUserText, { color: t.text }]}>{m.content}</Text>
                  </View>
                ) : (
                  <Text style={[cs.bubbleBot, { color: isDark ? '#d6d3d1' : '#57534e' }]}>{m.content}</Text>
                )}
              </View>
            ))}

            {isTyping && (
              <View style={[cs.msgRow, cs.rowBot]}>
                <View style={cs.typingRow}>
                  {[0, 1, 2].map(i => <TypingDot key={i} delay={i * 120} color={isDark ? '#57534e' : '#d6d3d1'} />)}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input — estilo web */}
          <View style={[cs.inputWrap, { backgroundColor: t.bg }]}>
            <View style={[cs.inputCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <TextInput
                style={[cs.input, { color: t.text }]}
                placeholder={step === 'password' ? 'Tu contraseña...' : 'tu@email.com'}
                placeholderTextColor={t.muted}
                value={step === 'password' ? passwordInput : userInput}
                onChangeText={step === 'password' ? setPasswordInput : setUserInput}
                secureTextEntry={step === 'password' && !showPassword}
                keyboardType={step === 'email' ? 'email-address' : 'default'}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isProcessing}
                onSubmitEditing={handleSend}
                multiline={step === 'email'}
              />
              <View style={cs.inputActions}>
                {step === 'password' && (
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={cs.eyeBtn} activeOpacity={0.6}>
                    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                      {showPassword ? (
                        <>
                          <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke={t.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                          <Path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke={t.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                          <Path d="M1 1l22 22" stroke={t.muted} strokeWidth="1.75" strokeLinecap="round"/>
                        </>
                      ) : (
                        <>
                          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={t.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                          <Path d="M12 9a3 3 0 100 6 3 3 0 000-6z" stroke={t.muted} strokeWidth="1.75"/>
                        </>
                      )}
                    </Svg>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!canSend || isProcessing}
                  style={[cs.sendBtn, (!canSend || isProcessing) && { backgroundColor: isDark ? '#292524' : '#e7e5e4' }]}
                  activeOpacity={0.8}
                >
                  {isProcessing
                    ? <ActivityIndicator size="small" color={isDark ? '#57534e' : '#a8a29e'} />
                    : <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                        <Line x1="12" y1="19" x2="12" y2="5"
                          stroke={canSend ? '#fff' : (isDark ? '#57534e' : '#a8a29e')}
                          strokeWidth="2" strokeLinecap="round" />
                        <Polyline points="5 12 12 5 19 12"
                          stroke={canSend ? '#fff' : (isDark ? '#57534e' : '#a8a29e')}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Olvidé mi contraseña — solo en step password */}
            {step === 'password' && (
              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={isProcessing || forgotSent}
                style={cs.forgotBtn}
                activeOpacity={0.6}
              >
                <Text style={[cs.forgotText, { color: forgotSent ? '#2FAF8F' : t.muted }]}>
                  {forgotSent ? '✓ Enlace enviado' : '¿Olvidaste tu contraseña?'}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={[cs.hint, { color: isDark ? '#292524' : '#d6d3d1' }]}>GANDIA · Acceso seguro</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const colorScheme = useColorScheme()
  const [scheme, setScheme] = useState<'light' | 'dark'>(colorScheme === 'dark' ? 'dark' : 'light')
  useEffect(() => {
    if (colorScheme === 'light' || colorScheme === 'dark') setScheme(colorScheme)
  }, [colorScheme])

  const isDark = scheme === 'dark'
  const t = tokens(isDark)
  const router = useRouter()

  const [showSubtitle, setShowSubtitle]   = useState(false)
  const [showChat, setShowChat]           = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(16)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start()
  }, [])

  const handleGoogleLogin = async () => {
    if (loadingGoogle) return
    setLoadingGoogle(true)
    try {
      await signInWithOAuth('google', () => {
        router.replace('/(app)/chat' as any)
      })
    } catch (err) {
      console.error('[Login Google]', err)
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <ChatLoginModal
        visible={showChat}
        onClose={() => setShowChat(false)}
        onSuccess={() => router.replace('/(app)/chat' as any)}
        isDark={isDark}
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* ── Top ── */}
        <View style={s.top}>
          <View style={s.logoWrap}><GandiaLogo size={34} /></View>
          <View style={s.eyebrow}>
            {showSubtitle && (
              <TypewriterText
                text="Sistema de trazabilidad de alta certeza"
                speed={25} delay={200}
                style={[s.eyebrowText, { color: t.subtext }]}
              />
            )}
          </View>
          <TypewriterText
            text="Bienvenido de nuevo"
            speed={55}
            style={[s.title, { color: t.text }]}
            onComplete={() => setShowSubtitle(true)}
          />
        </View>

        {/* ── Center ── */}
        <View style={s.center}>
          <NovedadCard isDark={isDark} />

          <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>

            {/* Google */}
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.12)' }, loadingGoogle && s.disabled]}
              onPress={handleGoogleLogin}
              disabled={loadingGoogle}
              activeOpacity={0.8}
            >
              {loadingGoogle
                ? <ActivityIndicator size="small" color="#1c1917" />
                : <><GoogleIcon /><Text style={[s.btnText, { color: '#1c1917' }]}>Continuar con Google</Text></>
              }
            </TouchableOpacity>

            {/* Próximamente — absolute text para centrado perfecto */}
            <View style={{ height: 24, justifyContent: 'center', marginVertical: 2 }}>
              <View style={{ height: 1, backgroundColor: t.border }} />
              <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
                <Text style={{ paddingHorizontal: 10, fontSize: 9, fontFamily: 'Geist-Medium', color: t.muted, letterSpacing: 1, textTransform: 'uppercase', backgroundColor: t.surface }}>Próximamente</Text>
              </View>
            </View>

            {/* Apple */}
            <View style={[s.btn, s.disabled, {
              backgroundColor: isDark ? '#141210' : '#111',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)',
            }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="#fff">
                <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </Svg>
              <Text style={[s.btnText, { color: 'rgba(255,255,255,0.75)' }]}>Continuar con Apple</Text>
            </View>

            {/* Microsoft */}
            <View style={[s.btn, s.disabled, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path fill="#0078d4" d="M3 3h8v8H3z" />
                <Path fill="#107c10" d="M13 3h8v8h-8z" />
                <Path fill="#ffc119" d="M3 13h8v8H3z" />
                <Path fill="#ff8c00" d="M13 13h8v8h-8z" />
              </Svg>
              <Text style={[s.btnText, { color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)' }]}>Continuar con Microsoft</Text>
            </View>

            {/* Divider */}
            <View style={s.divRow}>
              <View style={[s.divLine, { backgroundColor: t.border }]} />
              <Text style={[s.divTxt, { color: t.muted }]}>o</Text>
              <View style={[s.divLine, { backgroundColor: t.border }]} />
            </View>

            {/* Email */}
            <TouchableOpacity
              style={[s.btn, { backgroundColor: 'transparent', borderColor: t.border }]}
              onPress={() => setShowChat(true)}
              activeOpacity={0.8}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke={t.text} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={[s.btnText, { color: t.text }]}>Continuar con Email</Text>
            </TouchableOpacity>

            {/* Signup */}
            <View style={[s.signupRow, { borderTopColor: t.border }]}>
              <Text style={[s.signupTxt, { color: t.muted }]}>
                ¿Aún no tienes cuenta?{' '}
                <Text style={s.signupLink} onPress={() => router.push('/(public)/signup' as any)}>
                  Solicita acceso Beta
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View style={[s.fdot, { backgroundColor: '#2FAF8F' }]} />
          <Text style={[s.ftxt, { color: t.subtext }]}>Durango, México</Text>
          <View style={[s.fdot, { backgroundColor: t.subtext }]} />
          <Text style={[s.ftxt, { color: t.subtext }]}>Validación UGRD</Text>
          <View style={[s.fdot, { backgroundColor: t.subtext }]} />
          <Text style={[s.ftxt, { color: '#2FAF8F' }]}>Sistema Seguro v7.0</Text>
        </View>

      </Animated.View>
    </SafeAreaView>
  )
}

// ─── Styles main ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  top: { alignItems: 'center', paddingTop: 88, paddingHorizontal: 24, paddingBottom: 48 },
  logoWrap: { marginBottom: 18 },
  eyebrow:  { height: 18, marginBottom: 8, alignItems: 'center' },
  eyebrowText: {
    fontSize: 10, fontFamily: 'Geist-Medium',
    letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center',
  },
  title: {
    fontFamily: 'InstrumentSerif-Italic', fontSize: 26,
    letterSpacing: -0.5, textAlign: 'center',
  },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    paddingHorizontal: 20, gap: 48, paddingBottom: 8,
  },

  card: {
    width: '100%', maxWidth: 400,
    borderRadius: 20, borderWidth: 1, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
    gap: 8,
  },

  btn: {
    height: 46, borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 0, paddingHorizontal: 14,
  },
  disabled: { opacity: 0.75 },
  btnText:  { fontFamily: 'Geist-Medium', fontSize: 14, flex: 1 },

  badge:    { backgroundColor: 'rgba(47,175,143,0.18)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(47,175,143,0.3)' },
  badgeTxt: { fontSize: 10, fontFamily: 'Geist-SemiBold', color: '#2FAF8F', letterSpacing: 0.4 },

  proximLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 6, justifyContent: 'center' },
  proximLine:  { flex: 1, height: 1 },
  proximTxt:   { fontSize: 10, fontFamily: 'Geist-Medium', letterSpacing: 1, textTransform: 'uppercase' },

  divRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 10 },
  divLine: { flex: 1, height: 1 },
  divTxt:  { fontFamily: 'Geist-Regular', fontSize: 12 },

  signupRow:  { borderTopWidth: 1, marginTop: 14, paddingTop: 14 },
  signupTxt:  { fontFamily: 'Geist-Regular', fontSize: 12, textAlign: 'center' },
  signupLink: { color: '#2FAF8F', fontFamily: 'Geist-Medium' },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', gap: 8, paddingBottom: 32, paddingHorizontal: 24,
  },
  ftxt: { fontSize: 10, fontFamily: 'Geist-Regular', letterSpacing: 0.3 },
  fdot: { width: 3, height: 3, borderRadius: 2, opacity: 0.6 },
})

// ─── Novedad styles ───────────────────────────────────────────────────────────
const nc = StyleSheet.create({
  wrap: {
    width: '100%', maxWidth: 400,
    borderWidth: 1, borderRadius: 16,
    overflow: 'hidden',
  },
  topLine: { height: 1.5, backgroundColor: '#2FAF8F', opacity: 0.6 },
  inner:   { padding: 16, gap: 6, height: 130 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeDot:     { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2FAF8F' },
  eyeText:    { fontSize: 9, fontFamily: 'Geist-SemiBold', letterSpacing: 2, textTransform: 'uppercase' },
  headline:   { fontFamily: 'InstrumentSerif-Italic', fontSize: 22, lineHeight: 26, letterSpacing: -0.3 },
  body:       { fontFamily: 'Geist-Regular', fontSize: 11, lineHeight: 17 },
  dots: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  dotInd: { height: 5, borderRadius: 3 },
})

// ─── Chat styles ──────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  header:        { borderBottomWidth: 1 },
  progressTrack: { height: 2 },
  progressBar:   { height: 2, backgroundColor: '#2FAF8F' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 50,
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 12, fontFamily: 'Geist-Medium' },
  headerCenter: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  headerBrand: { fontSize: 13, fontFamily: 'Geist-SemiBold', letterSpacing: 0.5 },
  headerDiv:   { width: 1, height: 12 },
  headerSub:   { fontSize: 11, fontFamily: 'Geist-Medium' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepNum:     { fontSize: 10, fontFamily: 'Geist-SemiBold', letterSpacing: 1 },
  stepLabel:   { fontSize: 11, fontFamily: 'Geist-Medium' },

  messages: { padding: 20, gap: 20, paddingBottom: 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  emptyTitle: {
    fontFamily: 'InstrumentSerif-Italic', fontSize: 34,
    lineHeight: 42, textAlign: 'center', letterSpacing: -0.5, marginBottom: 10,
  },
  emptyHint: { fontFamily: 'Geist-Regular', fontSize: 13, textAlign: 'center' },

  msgRow: {},
  rowBot:  { alignItems: 'flex-start', marginBottom: 20 },
  rowUser: { alignItems: 'flex-end',   marginBottom: 20 },

  // User bubble — card con borde igual que web
  bubbleUser: {
    maxWidth: '75%', borderRadius: 16, borderBottomRightRadius: 4,
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bubbleUserText: { fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 22 },

  // Bot — texto plano igual que web
  bubbleBot: { maxWidth: '85%', fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 24 },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // Input
  inputWrap: { padding: 12, paddingBottom: 16 },
  inputCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  input: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    fontSize: 14, fontFamily: 'Geist-Regular', minHeight: 50, maxHeight: 120,
  },
  inputActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    paddingHorizontal: 10, paddingBottom: 10, gap: 8,
  },
  eyeBtn:  { paddingHorizontal: 8, paddingVertical: 4 },
  eyeText: { fontSize: 12, fontFamily: 'Geist-Medium' },
  sendBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center',
  },
  hint: { textAlign: 'center', fontSize: 10, fontFamily: 'Geist-Medium', letterSpacing: 0.5, marginTop: 8 },
  forgotBtn: { alignItems: 'center', paddingVertical: 8 },
  forgotText: { fontSize: 12, fontFamily: 'Geist-Medium' },
})