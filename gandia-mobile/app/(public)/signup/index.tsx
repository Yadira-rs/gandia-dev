// app/(public)/signup/index.tsx  (o  app/(public)/signup.tsx según tu estructura)
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated, Pressable,
  useColorScheme, StatusBar, Modal, ScrollView,
  SafeAreaView, Dimensions, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { Path, Line, Polyline, Rect } from 'react-native-svg'
import { registerUser, getCurrentProfile } from '../../../src/lib/authService'
import { supabase } from '../../../src/lib/supabaseClient'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import Constants from 'expo-constants'

// Necesario para que expo-web-browser complete la sesión OAuth al volver a la app
WebBrowser.maybeCompleteAuthSession()

// DEBUG TEMPORAL — copia la URL que sale en consola y pégala en Supabase Dashboard → Auth → Redirect URLs
console.log('[GANDIA] Redirect URL:', Linking.createURL('/signup/personal'))

const { width: W } = Dimensions.get('window')

// ─── Tokens (mismo sistema que login.tsx) ────────────────────────────────────
const tokens = (isDark: boolean) => ({
  bg:            isDark ? '#0c0a09' : '#fafaf9',
  surface:       isDark ? '#141210' : '#ffffff',
  border:        isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)',
  text:          isDark ? '#fafaf9' : '#1c1917',
  muted:         isDark ? '#78716c' : '#a8a29e',
  subtext:       isDark ? '#57534e' : '#a8a29e',
  msgUser:       isDark ? '#1c1917' : '#ffffff',
  msgUserBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  inputBg:       isDark ? '#141210' : '#ffffff',
  inputBorder:   isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)',
  strengthTrack: isDark ? '#292524' : '#e7e5e4',
  chip:          isDark ? '#1c1917' : '#ffffff',
  chipBorder:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
})

// ─── Logo (idéntico al de login.tsx) ─────────────────────────────────────────
function GandiaLogo({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5"             stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5"             stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Apple Icon ───────────────────────────────────────────────────────────────
function AppleIcon({ color = '#fff' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  )
}

// ─── Microsoft Icon ───────────────────────────────────────────────────────────
function MicrosoftIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Rect x="3"  y="3"  width="8" height="8" fill="#0078d4" />
      <Rect x="13" y="3"  width="8" height="8" fill="#107c10" />
      <Rect x="3"  y="13" width="8" height="8" fill="#ffc119" />
      <Rect x="13" y="13" width="8" height="8" fill="#ff8c00" />
    </Svg>
  )
}

// ─── Typewriter (idéntico al de login.tsx) ────────────────────────────────────
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

// ─── Countdown ────────────────────────────────────────────────────────────────
function CountdownUnit({ value, label, isDark }: { value: number; label: string; isDark: boolean }) {
  return (
    <View style={[cd.unit, {
      backgroundColor: isDark ? '#141210' : '#ffffff',
      borderColor:     isDark ? '#292524' : 'rgba(0,0,0,0.10)',
    }]}>
      <Text style={cd.num}>{String(value).padStart(2, '0')}</Text>
      <Text style={[cd.label, { color: isDark ? '#78716c' : '#a8a29e' }]}>{label}</Text>
    </View>
  )
}

function CountdownDisplay({ isDark }: { isDark: boolean }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const target = new Date('2026-03-29T00:00:00').getTime()
    const update = () => {
      const diff = target - Date.now()
      if (diff > 0) setTime({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    update(); const iv = setInterval(update, 1000); return () => clearInterval(iv)
  }, [])
  return (
    <View style={cd.row}>
      <CountdownUnit value={time.d} label="Días"     isDark={isDark} />
      <Text style={cd.sep}>:</Text>
      <CountdownUnit value={time.h} label="Horas"    isDark={isDark} />
      <Text style={cd.sep}>:</Text>
      <CountdownUnit value={time.m} label="Minutos"  isDark={isDark} />
      <Text style={cd.sep}>:</Text>
      <CountdownUnit value={time.s} label="Segundos" isDark={isDark} />
    </View>
  )
}

// ─── Rotating phrase ──────────────────────────────────────────────────────────
const PHRASES = ['Ingresa tu correo para comenzar.', 'Sin tarjeta, sin compromiso.', 'Proceso simple en 3 pasos.']

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
        setIdx(i => (i + 1) % PHRASES.length)
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
    <Animated.Text style={[s.rotatingPhrase, { color: t.muted, opacity, transform: [{ translateY: ty }] }]}>
      {PHRASES[idx]}
    </Animated.Text>
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
    } else {
      scaleA.setValue(0.94); opA.setValue(0)
    }
  }, [open])

  if (!open) return null

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={m.backdrop} onPress={onCancel}>
        {/* toque fuera cierra */}
      </Pressable>
      <View style={m.sheet} pointerEvents="box-none">
        <Animated.View style={[m.card, { backgroundColor: t.surface, opacity: opA, transform: [{ scale: scaleA }] }]}>
          {/* línea verde top */}
          <View style={m.topLine} />
          <View style={[m.body, { borderColor: t.border, borderWidth: 1, borderTopWidth: 0 }]}>
            <Text style={[m.title, { color: t.text }]}>{title}</Text>
            <Text style={[m.desc,  { color: t.muted }]}>{description}</Text>
            <View style={m.btnRow}>
              <TouchableOpacity style={[m.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f4' }]} onPress={onCancel}>
                <Text style={[m.btnTxt, { color: t.muted }]}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.btn, m.btnConfirm]} onPress={onConfirm}>
                <Text style={[m.btnTxt, { color: '#fff', fontFamily: 'Geist-SemiBold' }]}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── Already Registered Screen ────────────────────────────────────────────────
// TODO (compañero): este componente se muestra si al verificar sesión en Supabase
// el usuario ya tiene perfil. Recibe status, accountId y rejectionReason del perfil.
function AlreadyRegisteredScreen({ status, accountId, rejectionReason, onGoHome, onGoLogin, isDark }: {
  status: 'pending' | 'approved' | 'rejected'
  accountId: string; rejectionReason?: string
  onGoHome: () => void; onGoLogin: () => void
  isDark: boolean
}) {
  const t = tokens(isDark)
  const opacity = useRef(new Animated.Value(0)).current
  const ty      = useRef(new Animated.Value(24)).current
  const [step, setStep] = useState(0)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(ty,      { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start()
    if (status === 'pending') {
      setTimeout(() => setStep(1), 400)
      setTimeout(() => setStep(2), 800)
      setTimeout(() => setStep(3), 1200)
    }
  }, [])

  // ── APROBADO ──
  if (status === 'approved') return (
    <View style={[ar.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[ar.card, { backgroundColor: isDark ? '#0f0e0d' : '#ffffff', borderColor: t.border, opacity, transform: [{ translateY: ty }] }]}>
        <View style={[ar.iconWrap, { backgroundColor: 'rgba(47,175,143,0.12)', borderColor: 'rgba(47,175,143,0.25)' }]}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </Svg>
        </View>
        <View style={ar.badge}>
          <View style={ar.badgeDot} />
          <Text style={[ar.badgeTxt, { color: '#2FAF8F' }]}>Cuenta activa</Text>
        </View>
        <Text style={[ar.title,  { color: t.text }]}>¡Tu cuenta está aprobada!</Text>
        <Text style={[ar.body,   { color: t.muted }]}>Ya puedes acceder al sistema GANDIA.</Text>
        <View style={[ar.idBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: t.border }]}>
          <View style={ar.idDot} />
          <Text style={[ar.idTxt, { color: t.muted }]}>N° de cuenta: <Text style={ar.idVal}>{accountId}</Text></Text>
        </View>
        <TouchableOpacity style={ar.btnPrimary} onPress={onGoLogin}>
          <Text style={ar.btnPrimaryTxt}>Ir a iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ar.btnSecondary, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f4' }]} onPress={onGoHome}>
          <Text style={[ar.btnSecondaryTxt, { color: t.muted }]}>Volver al inicio</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )

  // ── RECHAZADO ──
  if (status === 'rejected') return (
    <View style={[ar.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[ar.card, { backgroundColor: isDark ? '#0f0e0d' : '#ffffff', borderColor: t.border, opacity, transform: [{ translateY: ty }] }]}>
        <View style={[ar.iconWrap, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.20)' }]}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </Svg>
        </View>
        <View style={[ar.badge, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.20)' }]}>
          <View style={[ar.badgeDot, { backgroundColor: '#ef4444' }]} />
          <Text style={[ar.badgeTxt, { color: '#ef4444' }]}>Solicitud rechazada</Text>
        </View>
        <Text style={[ar.title,  { color: t.text }]}>Tu solicitud fue rechazada</Text>
        <Text style={[ar.body,   { color: t.muted }]}>El equipo GANDIA no pudo aprobar tu solicitud.</Text>
        <View style={[ar.idBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: t.border }]}>
          <Text style={[ar.idLabel, { color: t.subtext }]}>N° de solicitud</Text>
          <Text style={[ar.idValCenter, { color: '#ef4444' }]}>{accountId || '—'}</Text>
        </View>
        {rejectionReason ? (
          <View style={ar.reasonBox}>
            <Text style={ar.reasonLabel}>Motivo</Text>
            <Text style={ar.reasonTxt}>{rejectionReason}</Text>
          </View>
        ) : null}
        {['Revisa que tu información sea correcta', 'Contacta soporte si crees que es un error', 'Puedes crear una nueva solicitud'].map((label, i) => (
          <View key={i} style={ar.checkRow}>
            <View style={[ar.checkDot, { backgroundColor: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.30)' }]}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M13 16h-1v-4h-1m1-4h.01" />
              </Svg>
            </View>
            <Text style={[ar.checkTxt, { color: t.muted }]}>{label}</Text>
          </View>
        ))}
        <View style={[ar.supportRow, { borderTopColor: t.border }]}>
          <Text style={[ar.supportTxt, { color: t.muted }]}>¿Dudas? <Text style={ar.supportEmail}>soporte@gandia.mx</Text></Text>
        </View>
        <TouchableOpacity style={[ar.btnSecondary, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f5f5f4', marginTop: 4 }]} onPress={onGoHome}>
          <Text style={[ar.btnSecondaryTxt, { color: t.muted }]}>Volver al inicio</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )

  // ── PENDIENTE ──
  const PENDING_STEPS = ['Datos personales e institucionales recibidos', 'Solicitud en cola de revisión', 'Recibirás aviso cuando sea aprobada']
  return (
    <View style={[ar.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[ar.card, { backgroundColor: isDark ? '#0f0e0d' : '#ffffff', borderColor: t.border, opacity, transform: [{ translateY: ty }] }]}>
        <View style={[ar.iconWrap, { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.20)' }]}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </Svg>
        </View>
        <Text style={[ar.title, { color: t.text }]}>Tu solicitud está en revisión</Text>
        <Text style={[ar.body,  { color: t.muted }]}>El equipo GANDIA está revisando tu solicitud.</Text>
        <View style={[ar.idBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: t.border }]}>
          <Text style={[ar.idLabel, { color: t.subtext }]}>N° de solicitud</Text>
          {accountId
            ? <Text style={[ar.idValCenter, { color: '#f59e0b' }]}>{accountId}</Text>
            : <View style={ar.idSpinner}><View style={ar.idSpinnerDot} /></View>}
        </View>
        {PENDING_STEPS.map((label, i) => (
          <View key={i} style={[ar.checkRow, { opacity: step > i ? 1 : 0.2 }]}>
            <View style={[ar.checkDot, step > i ? { backgroundColor: '#f59e0b', borderColor: '#f59e0b' } : { backgroundColor: 'transparent', borderColor: isDark ? '#44403c' : '#d6d3d1' }]}>
              {step > i ? (
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 13l4 4L19 7" />
                </Svg>
              ) : null}
            </View>
            <Text style={[ar.checkTxt, { color: t.muted }]}>{label}</Text>
          </View>
        ))}
        <View style={[ar.supportRow, { borderTopColor: t.border }]}>
          <Text style={[ar.supportTxt, { color: t.muted }]}>Revisión en <Text style={{ color: t.text, fontFamily: 'Geist-SemiBold' }}>24–48 h hábiles</Text>.</Text>
        </View>
        <TouchableOpacity style={[ar.btnSecondary, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f5f5f4', marginTop: 4 }]} onPress={onGoHome}>
          <Text style={[ar.btnSecondaryTxt, { color: t.muted }]}>Entendido, volver al inicio</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

// ─── Password strength helper ─────────────────────────────────────────────────
const getStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: '', color: '', pct: 0 }
  let score = 0
  if (pwd.length >= 8)           score++
  if (pwd.length >= 12)          score++
  if (/[A-Z]/.test(pwd))         score++
  if (/[0-9]/.test(pwd))         score++
  if (/[^A-Za-z0-9]/.test(pwd))  score++
  const map = [
    { label: '',          color: '',        pct: 0   },
    { label: 'Muy débil', color: '#ef4444', pct: 20  },
    { label: 'Débil',     color: '#f97316', pct: 40  },
    { label: 'Media',     color: '#eab308', pct: 60  },
    { label: 'Fuerte',    color: '#22c55e', pct: 80  },
    { label: 'Muy fuerte',color: '#2FAF8F', pct: 100 },
  ]
  return { score, ...map[Math.min(score, 5)] }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SignUpAuth() {
  const router      = useRouter()
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tokens(isDark)

  // ── Estado de sesión existente ────────────────────────────────────────────
  const [existingStatus,          setExistingStatus]          = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [existingAccountId,       setExistingAccountId]       = useState('')
  const [existingRejectionReason, setExistingRejectionReason] = useState('')
  const [checkingProfile,         setCheckingProfile]         = useState(true)

  // Verificar al montar si el usuario ya tiene sesión y perfil
  useEffect(() => {
    const checkProfile = async () => {
      try {
        // 1. Leer sesión de AsyncStorage directamente (no getSession que puede colgarse)
        let sessionUser: { id: string; email?: string; app_metadata?: Record<string, unknown> } | null = null
        try {
          const raw = await AsyncStorage.getItem('gandia-auth-token')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.user?.id) sessionUser = parsed.user
          }
        } catch { /* ignore */ }

        // Fallback: SDK con timeout 3s
        if (!sessionUser) {
          const sessionPromise = supabase.auth.getSession()
          const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000))
          const result = await Promise.race([sessionPromise, timeoutPromise])
          if (result && 'data' in result && result.data.session?.user) {
            sessionUser = result.data.session.user
          }
        }

        // Sin sesión → limpiar flags huérfanos y mostrar formulario
        if (!sessionUser) {
          await Promise.all([
            AsyncStorage.removeItem('signup-completed'),
            AsyncStorage.removeItem('user-status'),
            AsyncStorage.removeItem('account-id'),
          ])
          setCheckingProfile(false)
          return
        }

        // 2. Leer AsyncStorage rápido primero (si ya completó el signup antes)
        const completed   = await AsyncStorage.getItem('signup-completed')
        const localStatus = await AsyncStorage.getItem('user-status')
        const localAccId  = await AsyncStorage.getItem('account-id')
        if (completed === 'true' && (localStatus === 'pending' || localStatus === 'approved' || localStatus === 'rejected') && localAccId) {
          setExistingStatus(localStatus as 'pending' | 'approved' | 'rejected')
          setExistingAccountId(localAccId)
          setCheckingProfile(false)
          return
        }

        // 3. Consultar perfil en Supabase
        const profile = await getCurrentProfile()

        if (!profile) {
          // Sin perfil → viene de OAuth o acaba de crear cuenta, ir a personal
          const provider = (sessionUser.app_metadata?.provider as string) || 'email'
          const email    = sessionUser.email || ''
          await AsyncStorage.setItem('signup-auth-method', provider)
          if (email) await AsyncStorage.setItem('signup-email', email)
          router.replace('/(public)/signup/personal' as any)
          return
        }

        const status = profile.status as 'pending' | 'approved' | 'rejected'
        if (status !== 'pending' && status !== 'approved' && status !== 'rejected') {
          setCheckingProfile(false)
          return
        }

        const accountId       = profile.account_id || ''
        const rejectionReason = (profile as any)?.rejection_reason || ''

        await AsyncStorage.setItem('signup-completed', 'true')
        await AsyncStorage.setItem('user-status', status)
        if (accountId) await AsyncStorage.setItem('account-id', accountId)

        setExistingStatus(status)
        setExistingAccountId(accountId)
        setExistingRejectionReason(rejectionReason)
      } catch (err) {
        console.log('[SignUpAuth] checkProfile error:', err)
        await Promise.all([
          AsyncStorage.removeItem('signup-completed'),
          AsyncStorage.removeItem('user-status'),
          AsyncStorage.removeItem('account-id'),
        ])
      }
      setCheckingProfile(false)
    }

    // Safety timeout: si tarda más de 8s, mostrar formulario de todas formas
    const safetyTimer = setTimeout(() => setCheckingProfile(false), 8000)
    checkProfile().finally(() => clearTimeout(safetyTimer))
  }, [])

  // ── Pantalla principal ────────────────────────────────────────────────────
  const [showSubtitle,    setShowSubtitle]    = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<'google' | null>(null)
  const cardOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(cardOpacity, { toValue: 1, duration: 700, delay: 2800, useNativeDriver: true }).start()
  }, [])

  // ── Confirm modal ─────────────────────────────────────────────────────────
  const [modal, setModal] = useState({ open: false, title: '', description: '', confirmLabel: 'Confirmar', onConfirm: () => {} })
  const showConfirm = (title: string, description: string, confirmLabel: string, onConfirm: () => void) =>
    setModal({ open: true, title, description, confirmLabel, onConfirm })
  const closeModal = () => setModal(m => ({ ...m, open: false }))

  // ── Chat email flow ───────────────────────────────────────────────────────
  const [showEmailChat,   setShowEmailChat]   = useState(false)
  const [emailStep,       setEmailStep]       = useState<'email' | 'password' | 'confirm-password'>('email')
  const [emailForm,       setEmailForm]       = useState({ email: '', password: '' })
  const [userInput,       setUserInput]       = useState('')
  const [passwordInput,   setPasswordInput]   = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirmPwd,  setShowConfirmPwd]  = useState(false)
  const [messages,        setMessages]        = useState<Array<{ type: 'assistant' | 'user'; text: string }>>([])
  const [isTyping,        setIsTyping]        = useState(false)
  const [isProcessing,    setIsProcessing]    = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const emailInputRef   = useRef<TextInput>(null)
  const passwordInputRef = useRef<TextInput>(null)

  // progreso del header (0–100)
  const progressWidth = emailStep === 'email' ? 33 : emailStep === 'password' ? 66 : 100

  // ── Scroll al final cuando llegan mensajes ────────────────────────────────
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages, isTyping])

  // ── Focus al input correcto ────────────────────────────────────────────────
  useEffect(() => {
    if (!showEmailChat) return
    setTimeout(() => {
      if (emailStep === 'email') emailInputRef.current?.focus()
      else passwordInputRef.current?.focus()
    }, 300)
  }, [showEmailChat, emailStep])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    if (loadingProvider) return
    setLoadingProvider('google')
    try {
      // Con expo run:android el scheme gandia-mobile:// queda registrado en Android.
      // openAuthSessionAsync SÍ funciona con custom schemes en dev builds.
      const redirectTo = 'gandia-mobile://signup/personal'
      console.log('[Google OAuth] redirectUrl:', redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })

      if (error || !data?.url) {
        console.error('[Google OAuth] error:', error)
        setLoadingProvider(null)
        return
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      console.log('[Google OAuth] result.type:', result.type)

      if (result.type !== 'success' || !result.url) {
        setLoadingProvider(null)
        return
      }

      console.log('[Google OAuth] callback URL:', result.url)
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url)
      if (sessionError) {
        console.error('[Google OAuth] exchangeCodeForSession error:', sessionError)
        setLoadingProvider(null)
        return
      }

      await AsyncStorage.setItem('signup-auth-method', 'google')
      router.replace('/(public)/signup/personal' as any)

    } catch (err) {
      console.error('[Google OAuth] error inesperado:', err)
      setLoadingProvider(null)
    }
  }

  const handleEmail = () => {
    setShowEmailChat(true)
    setMessages([])
    setEmailStep('email')
    setEmailForm({ email: '', password: '' })
    setUserInput('')
    setPasswordInput('')
    setShowPassword(false)
    setShowConfirmPwd(false)
    setIsProcessing(false)
    setTimeout(() => setMessages([{ type: 'assistant', text: 'Perfecto. ¿Cuál es tu correo electrónico?' }]), 300)
  }

  const handleSend = async () => {
    const isPwdStep = emailStep === 'password' || emailStep === 'confirm-password'
    const value = isPwdStep ? passwordInput.trim() : userInput.trim()
    if (!value || isProcessing) return

    setMessages(prev => [...prev, { type: 'user', text: isPwdStep ? '••••••••' : value }])
    if (isPwdStep) setPasswordInput(''); else setUserInput('')
    setIsProcessing(true); setIsTyping(true)

    setTimeout(async () => {
      setIsTyping(false)
      try {

        // ── Paso 1: Email ─────────────────────────────────────────────────
        if (emailStep === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setMessages(p => [...p, { type: 'assistant', text: 'Email inválido. Intenta de nuevo.' }])
            setIsProcessing(false); return
          }
          setEmailForm(p => ({ ...p, email: value }))
          setEmailStep('password')
          setMessages(p => [...p, { type: 'assistant', text: `Correo: ${value}. Ahora crea una contraseña segura.` }])
          setIsProcessing(false); return
        }

        // ── Paso 2: Contraseña ────────────────────────────────────────────
        if (emailStep === 'password') {
          const strength = getStrength(value)
          if (value.length < 8) {
            setMessages(p => [...p, { type: 'assistant', text: 'Mínimo 8 caracteres.' }])
            setIsProcessing(false); return
          }
          if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
            setMessages(p => [...p, { type: 'assistant', text: 'Incluye letras y al menos un número.' }])
            setIsProcessing(false); return
          }
          if (strength.score < 2) {
            setMessages(p => [...p, { type: 'assistant', text: 'Contraseña muy débil. Añade mayúsculas, números o símbolos.' }])
            setIsProcessing(false); return
          }
          setEmailForm(p => ({ ...p, password: value }))
          setEmailStep('confirm-password')
          setMessages(p => [...p, { type: 'assistant', text: 'Bien. Confirma tu contraseña para continuar.' }])
          setIsProcessing(false); return
        }

        // ── Paso 3: Confirmar + crear cuenta ─────────────────────────────
        if (emailStep === 'confirm-password') {
          if (value !== emailForm.password) {
            setMessages(p => [...p, { type: 'assistant', text: 'Las contraseñas no coinciden. Intenta de nuevo.' }])
            setIsProcessing(false); return
          }
          setMessages(p => [...p, { type: 'assistant', text: 'Creando tu cuenta...' }])
          setIsTyping(true)

          const { userId, email: confirmedEmail } = await registerUser(emailForm.email, emailForm.password)
          await AsyncStorage.setItem('signup-user-id', userId)
          await AsyncStorage.setItem('signup-email', confirmedEmail)
          await AsyncStorage.setItem('signup-auth-method', 'email')

          setIsTyping(false)
          setMessages(p => [...p, { type: 'assistant', text: '¡Cuenta creada! Revisa tu correo para confirmarla y luego continúa.' }])
          setTimeout(() => router.push('/(public)/signup/personal' as any), 1500)
          setIsProcessing(false); return
        }

      } catch (err: unknown) {
        setIsTyping(false)
        setMessages(p => [...p, { type: 'assistant', text: `Error: ${err instanceof Error ? err.message : 'Inténtalo de nuevo.'}` }])
        setIsProcessing(false)
      }
    }, 800)
  }

  const handleBack = () => {
    if (showEmailChat) {
      showConfirm('¿Regresar?', 'Se perderá el progreso del registro.', 'Sí, regresar', () => {
        closeModal()
        setShowEmailChat(false)
        setMessages([])
        setEmailStep('email')
        setEmailForm({ email: '', password: '' })
        setPasswordInput('')
        setShowPassword(false)
        setIsProcessing(false)
      })
    } else {
      showConfirm('¿Salir del registro?', 'Volverás a la pantalla anterior.', 'Sí, salir', () => {
        closeModal()
        router.back()
      })
    }
  }

  // ─── Render: checking profile ────────────────────────────────────────────
  if (checkingProfile) {
    return <View style={{ flex: 1, backgroundColor: t.bg }} />
  }

  // ─── Render: ya registrado ───────────────────────────────────────────────
  if (existingStatus) {
    return (
      <AlreadyRegisteredScreen
        status={existingStatus}
        accountId={existingAccountId}
        rejectionReason={existingRejectionReason}
        onGoHome={() => router.replace('/(public)/splash' as any)}
        onGoLogin={() => router.replace('/(public)/login')}
        isDark={isDark}
      />
    )
  }

  // ─── Render: pantalla principal + modal email ────────────────────────────
  const isPasswordStep = emailStep === 'password' || emailStep === 'confirm-password'
  const pwdStrength    = getStrength(passwordInput)
  const canSend        = isPasswordStep ? passwordInput.trim().length > 0 : userInput.trim().length > 0

  return (
    <>
    {/* ── Modal email chat ── */}
    <Modal visible={showEmailChat} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleBack}>
      <SafeAreaView style={[cs.root, { backgroundColor: t.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

        <ConfirmModal
          open={modal.open} title={modal.title} description={modal.description}
          confirmLabel={modal.confirmLabel} onConfirm={modal.onConfirm} onCancel={closeModal}
          isDark={isDark}
        />

        {/* ── Header ── */}
        <View style={[cs.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
          <View style={[cs.progressTrack, { backgroundColor: isDark ? '#1c1917' : '#e7e5e4' }]}>
            <View style={[cs.progressBar, { width: `${progressWidth}%` as any }]} />
          </View>
          <View style={cs.headerRow}>
            <TouchableOpacity style={cs.backBtn} onPress={handleBack}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 19l-7-7 7-7" />
              </Svg>
              <Text style={[cs.backText, { color: t.muted }]}>Volver</Text>
            </TouchableOpacity>

            <View style={cs.headerCenter}>
              <GandiaLogo size={18} />
              <Text style={[cs.headerBrand, { color: t.text }]}>GANDIA</Text>
              <View style={[cs.headerDiv, { backgroundColor: t.border }]} />
              <Text style={[cs.headerSub, { color: t.muted }]}>Registro</Text>
            </View>

            <View style={cs.headerRight}>
              <Text style={[cs.stepNum, { color: t.muted }]}>
                {emailStep === 'email' ? '01' : emailStep === 'password' ? '02' : '03'} / 03
              </Text>
              <View style={[cs.headerDiv, { backgroundColor: t.border }]} />
              <Text style={[cs.stepLabel, { color: t.muted }]}>
                {emailStep === 'email' ? 'Correo' : emailStep === 'password' ? 'Contraseña' : 'Confirmar'}
              </Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[cs.messages, !messages.some(m => m.type === 'user') && { flex: 1 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {!messages.some(m => m.type === 'user') && (
              <View style={cs.empty}>
                <Text style={[cs.emptyTitle, { color: t.text }]}>{'Crea tu cuenta\nen minutos.'}</Text>
                <RotatingPhrase isDark={isDark} />
                <View style={cs.chips}>
                  {['Verificación segura', 'Revisión 24–48 h', 'Acceso inmediato'].map((label, i) => (
                    <View key={i} style={[cs.chip, { backgroundColor: t.chip, borderColor: t.chipBorder }]}>
                      <Text style={[cs.chipTxt, { color: t.muted }]}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {messages.map((msg, i) => (
              <View key={i} style={msg.type === 'user' ? cs.rowUser : cs.rowBot}>
                {msg.type === 'user' ? (
                  <View style={[cs.bubbleUser, { backgroundColor: t.msgUser, borderColor: t.msgUserBorder }]}>
                    <Text style={[cs.bubbleUserTxt, { color: t.text }]}>{msg.text}</Text>
                  </View>
                ) : (
                  <Text style={[cs.bubbleBot, { color: isDark ? '#a8a29e' : '#57534e' }]}>{msg.text}</Text>
                )}
              </View>
            ))}

            {isTyping && (
              <View style={cs.typingRow}>
                <TypingDot delay={0}   color={isDark ? '#44403c' : '#d6d3d1'} />
                <TypingDot delay={120} color={isDark ? '#44403c' : '#d6d3d1'} />
                <TypingDot delay={240} color={isDark ? '#44403c' : '#d6d3d1'} />
              </View>
            )}
          </ScrollView>

          <View style={[cs.inputWrap, { backgroundColor: t.bg }]}>
            <View style={[cs.inputCard, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
              {isPasswordStep ? (
                <>
                  <TextInput
                    ref={passwordInputRef}
                    style={[cs.input, { color: t.text }]}
                    placeholder={emailStep === 'password' ? 'Contraseña segura...' : 'Repite tu contraseña...'}
                    placeholderTextColor={t.subtext}
                    secureTextEntry={emailStep === 'password' ? !showPassword : !showConfirmPwd}
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    onSubmitEditing={() => canSend && !isProcessing && handleSend()}
                    editable={!isProcessing}
                    autoCapitalize="none"
                    returnKeyType="send"
                  />
                  {emailStep === 'password' && passwordInput.length > 0 && (
                    <View style={cs.strengthWrap}>
                      <View style={[cs.strengthTrack, { backgroundColor: t.strengthTrack }]}>
                        <View style={[cs.strengthBar, { width: `${pwdStrength.pct}%` as any, backgroundColor: pwdStrength.color }]} />
                      </View>
                      <Text style={[cs.strengthLabel, { color: pwdStrength.color }]}>{pwdStrength.label}</Text>
                    </View>
                  )}
                  {emailStep === 'password' && passwordInput.length > 0 && (
                    <View style={cs.strengthHints}>
                      {[
                        { ok: passwordInput.length >= 8, label: '8+ caracteres' },
                        { ok: /[A-Z]/.test(passwordInput), label: 'Mayúscula' },
                        { ok: /[0-9]/.test(passwordInput), label: 'Número' },
                        { ok: /[^A-Za-z0-9]/.test(passwordInput), label: 'Símbolo' },
                      ].map((r, i) => (
                        <Text key={i} style={[cs.hintItem, { color: r.ok ? '#2FAF8F' : t.subtext }]}>
                          {r.ok ? '✓' : '·'} {r.label}
                        </Text>
                      ))}
                    </View>
                  )}
                  <View style={cs.inputActions}>
                    <TouchableOpacity style={cs.eyeBtn} onPress={() => emailStep === 'password' ? setShowPassword(p => !p) : setShowConfirmPwd(p => !p)}>
                      <Text style={[cs.eyeTxt, { color: t.muted }]}>
                        {(emailStep === 'password' ? showPassword : showConfirmPwd) ? 'Ocultar' : 'Mostrar'}
                      </Text>
                    </TouchableOpacity>
                    <SendButton canSend={canSend} isProcessing={isProcessing} onPress={handleSend} />
                  </View>
                </>
              ) : (
                <>
                  <TextInput
                    ref={emailInputRef}
                    style={[cs.input, { color: t.text }]}
                    placeholder="tu@correo.com"
                    placeholderTextColor={t.subtext}
                    value={userInput}
                    onChangeText={setUserInput}
                    onSubmitEditing={() => canSend && !isProcessing && handleSend()}
                    editable={!isProcessing}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                  />
                  <View style={[cs.inputActions, { justifyContent: 'flex-end' }]}>
                    <SendButton canSend={canSend} isProcessing={isProcessing} onPress={handleSend} />
                  </View>
                </>
              )}
            </View>
            <Text style={[cs.hint, { color: t.subtext }]}>GANDIA · Registro seguro</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>

    {/* ── Pantalla principal ── */}
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

      <ConfirmModal
        open={modal.open} title={modal.title} description={modal.description}
        confirmLabel={modal.confirmLabel} onConfirm={modal.onConfirm} onCancel={closeModal}
        isDark={isDark}
      />

      {/* Back */}
      <TouchableOpacity style={[s.backFab, { backgroundColor: t.surface, borderColor: t.border }]} onPress={handleBack}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15 19l-7-7 7-7" />
        </Svg>
        <Text style={[s.backFabTxt, { color: t.muted }]}>Volver</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Top: logo + title ── */}
        <View style={s.top}>
          <View style={s.logoWrap}>
            <GandiaLogo size={38} />
          </View>

          <View style={s.eyebrow}>
            {showSubtitle && (
              <TypewriterText
                text="Sistema institucional de trazabilidad ganadera"
                speed={22}
                delay={200}
                style={[s.eyebrowText, { color: t.subtext }]}
              />
            )}
          </View>

          <TypewriterText
            text="Bienvenido a GANDIA"
            speed={65}
            onComplete={() => setShowSubtitle(true)}
            style={[s.title, { color: t.text }]}
          />
        </View>

        {/* ── Countdown ── */}
        <View style={s.countdownWrap}>
          <Text style={[s.countdownLabel, { color: t.subtext }]}>Lanzamiento Oficial</Text>
          <CountdownDisplay isDark={isDark} />
          <Text style={[s.countdownSub, { color: t.subtext }]}>GANDIA 7 — BETA · Acceso Restringido</Text>
        </View>

        {/* ── Card de botones ── */}
        <Animated.View style={[s.card, { backgroundColor: t.surface, borderColor: t.border, opacity: cardOpacity }]}>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.18)' }, loadingProvider === 'google' && s.disabled]}
            onPress={handleGoogle}
            disabled={loadingProvider !== null}
            activeOpacity={0.85}
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator size="small" color="#1c1917" />
            ) : (
              <>
                <GoogleIcon />
                <Text style={[s.btnText, { color: '#1c1917' }]}>Continuar con Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 24, justifyContent: 'center', marginVertical: 2 }}>
            <View style={{ height: 1, backgroundColor: t.border }} />
            <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
              <Text style={{ paddingHorizontal: 10, fontSize: 9, fontFamily: 'Geist-Medium', color: t.muted, letterSpacing: 1, textTransform: 'uppercase', backgroundColor: t.surface }}>Próximamente</Text>
            </View>
          </View>

          <View style={[s.btn, s.disabled, {
            backgroundColor: isDark ? '#141210' : '#111',
            borderColor:     isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)',
          }]}>
            <AppleIcon color="#fff" />
            <Text style={[s.btnText, { color: 'rgba(255,255,255,0.75)' }]}>Continuar con Apple</Text>
          </View>

          <View style={[s.btn, s.disabled, { backgroundColor: t.surface, borderColor: t.border }]}>
            <MicrosoftIcon />
            <Text style={[s.btnText, { color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)' }]}>Continuar con Microsoft</Text>
          </View>

          <View style={s.divRow}>
            <View style={[s.divLine, { backgroundColor: t.border }]} />
            <Text style={[s.divTxt, { color: t.muted }]}>o</Text>
            <View style={[s.divLine, { backgroundColor: t.border }]} />
          </View>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: 'transparent', borderColor: t.border }, loadingProvider !== null && s.disabled]}
            onPress={handleEmail}
            disabled={loadingProvider !== null}
            activeOpacity={0.85}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.text} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </Svg>
            <Text style={[s.btnText, { color: t.text }]}>Continuar con Email</Text>
          </TouchableOpacity>

          <View style={[s.loginRow, { borderTopColor: t.border }]}>
            <Text style={[s.loginTxt, { color: t.muted }]}>
              ¿Ya tienes una cuenta?{' '}
              <Text style={s.loginLink} onPress={() => router.replace('/(public)/login')}>
                Inicia sesión
              </Text>
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      <View style={s.footer}>
        {['Durango, México', 'Validación UGRD', 'Sistema Seguro v7.0'].map((txt, i) => (
          <View key={i} style={s.footerItem}>
            {i > 0 && <View style={[s.fdot, { backgroundColor: t.subtext }]} />}
            <Text style={[s.ftxt, { color: i === 2 ? '#2FAF8F' : t.subtext }]}>{txt}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
    </>
  )
}

// ─── Send button (extraído para no repetir) ───────────────────────────────────
function SendButton({ canSend, isProcessing, onPress }: { canSend: boolean; isProcessing: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[cs.sendBtn, (!canSend || isProcessing) && { backgroundColor: 'rgba(47,175,143,0.25)' }]}
      onPress={onPress}
      disabled={!canSend || isProcessing}
      activeOpacity={0.8}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Line x1="12" y1="19" x2="12" y2="5" />
          <Polyline points="5 12 12 5 19 12" />
        </Svg>
      )}
    </TouchableOpacity>
  )
}

// ─── StyleSheet: pantalla principal ──────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 40 },

  backFab: {
    position: 'absolute', top: 52, left: 20, zIndex: 50,
    height: 36, borderRadius: 10, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 12, gap: 4,
  },
  backFabTxt: { fontSize: 13, fontFamily: 'Geist-Medium' },

  top: { alignItems: 'center', paddingTop: 96, paddingHorizontal: 24, paddingBottom: 32 },
  logoWrap:    { marginBottom: 18 },
  eyebrow:     { height: 18, marginBottom: 8, alignItems: 'center', paddingHorizontal: 20 },
  eyebrowText: { fontSize: 10, fontFamily: 'Geist-Medium', letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center' },
  title:       { fontFamily: 'InstrumentSerif-Italic', fontSize: 26, letterSpacing: -0.5, textAlign: 'center' },

  // Countdown
  countdownWrap:  { alignItems: 'center', gap: 10, marginBottom: 32 },
  countdownLabel: { fontSize: 9, fontFamily: 'Geist-SemiBold', letterSpacing: 2, textTransform: 'uppercase' },
  countdownSub:   { fontSize: 10, fontFamily: 'Geist-Medium', letterSpacing: 1 },

  // Card
  card: {
    width: '100%', maxWidth: 400, borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 18, paddingVertical: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
    gap: 10, marginHorizontal: 20,
  },
  btn: {
    height: 48, borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 14,
  },
  btnText: { fontFamily: 'Geist-Medium', fontSize: 14, flex: 1 },
  disabled: { opacity: 0.6 },

  divRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  divLine: { flex: 1, height: 1 },
  divTxt:  { fontFamily: 'Geist-Regular', fontSize: 12 },

  loginRow: { borderTopWidth: 1, marginTop: 8, paddingTop: 14 },
  loginTxt: { fontFamily: 'Geist-Regular', fontSize: 12, textAlign: 'center' },
  loginLink:{ color: '#2FAF8F', fontFamily: 'Geist-Medium' },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', gap: 8, paddingBottom: 32, paddingHorizontal: 24,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ftxt: { fontSize: 10, fontFamily: 'Geist-Regular', letterSpacing: 0.3 },
  fdot: { width: 3, height: 3, borderRadius: 2, opacity: 0.5 },

  rotatingPhrase: { fontFamily: 'InstrumentSerif-Italic', fontSize: 14, textAlign: 'center', minHeight: 22 },
})

// ─── StyleSheet: chat flow ────────────────────────────────────────────────────
const cs = StyleSheet.create({
  root:   { flex: 1 },
  header: { borderBottomWidth: 1 },
  progressTrack: { height: 2 },
  progressBar:   { height: 2, backgroundColor: '#2FAF8F' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 50,
  },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText:   { fontSize: 12, fontFamily: 'Geist-Medium' },
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

  messages: { padding: 20, gap: 0, paddingBottom: 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40, gap: 14 },
  emptyTitle: { fontFamily: 'InstrumentSerif-Italic', fontSize: 34, lineHeight: 42, textAlign: 'center', letterSpacing: -0.5 },

  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  chip:    { height: 28, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipTxt: { fontSize: 11, fontFamily: 'Geist-Medium' },

  rowUser: { alignItems: 'flex-end',   marginBottom: 18 },
  rowBot:  { alignItems: 'flex-start', marginBottom: 18 },

  bubbleUser: {
    maxWidth: '75%', borderRadius: 16, borderBottomRightRadius: 4,
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bubbleUserTxt: { fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 22 },
  bubbleBot:     { maxWidth: '85%', fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 24 },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, marginBottom: 18 },
  dot:       { width: 6, height: 6, borderRadius: 3 },

  // Input
  inputWrap: { padding: 12, paddingBottom: 16 },
  inputCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  input: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    fontSize: 14, fontFamily: 'Geist-Regular', minHeight: 50,
  },
  inputActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingBottom: 10, gap: 8,
  },
  eyeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  eyeTxt: { fontSize: 12, fontFamily: 'Geist-Medium' },
  sendBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center',
  },
  hint: { textAlign: 'center', fontSize: 10, fontFamily: 'Geist-Medium', letterSpacing: 0.5, marginTop: 8 },

  // Strength
  strengthWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  strengthTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  strengthBar:   { height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 10, fontFamily: 'Geist-Medium', minWidth: 60, textAlign: 'right' },
  strengthHints: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 10, flexWrap: 'wrap' },
  hintItem:      { fontSize: 10, fontFamily: 'Geist-Medium' },
})

// ─── StyleSheet: modal ────────────────────────────────────────────────────────
const m = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:    { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  card:     { width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden' },
  topLine:  { height: 2, backgroundColor: '#2FAF8F', opacity: 0.6 },
  body:     { borderRadius: 0, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 },
  title:    { fontFamily: 'Geist-SemiBold', fontSize: 15, marginBottom: 6 },
  desc:     { fontFamily: 'Geist-Regular', fontSize: 13, lineHeight: 20, marginBottom: 18 },
  btnRow:   { flexDirection: 'row', gap: 10 },
  btn:      { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnConfirm: { backgroundColor: '#2FAF8F' },
  btnTxt:   { fontFamily: 'Geist-Medium', fontSize: 13 },
})

// ─── StyleSheet: Already Registered ──────────────────────────────────────────
const ar = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 380, borderRadius: 24, borderWidth: 1,
    padding: 28, alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6,
  },
  iconWrap:    { width: 64, height: 64, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(47,175,143,0.10)', borderWidth: 1, borderColor: 'rgba(47,175,143,0.20)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2FAF8F' },
  badgeTxt:    { fontSize: 11, fontFamily: 'Geist-SemiBold' },
  title:       { fontFamily: 'Geist-SemiBold', fontSize: 20, textAlign: 'center' },
  body:        { fontFamily: 'Geist-Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  idBox:       { width: '100%', borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  idDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2FAF8F' },
  idTxt:       { fontFamily: 'Geist-Regular', fontSize: 12 },
  idVal:       { fontFamily: 'Geist-SemiBold', color: '#2FAF8F' },
  idLabel:     { fontFamily: 'Geist-Medium', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', width: '100%' },
  idValCenter: { fontFamily: 'Geist-SemiBold', fontSize: 16, letterSpacing: 3, textAlign: 'center', width: '100%' },
  idSpinner:   { alignItems: 'center', width: '100%', paddingVertical: 4 },
  idSpinnerDot:{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#f59e0b', borderTopColor: 'transparent' },
  reasonBox:   { width: '100%', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)', borderRadius: 12, padding: 14 },
  reasonLabel: { fontSize: 10, fontFamily: 'Geist-Medium', color: 'rgba(239,68,68,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  reasonTxt:   { fontSize: 13, fontFamily: 'Geist-Regular', color: 'rgba(239,68,68,0.85)', lineHeight: 20 },
  checkRow:    { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkDot:    { width: 16, height: 16, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkTxt:    { fontSize: 12, fontFamily: 'Geist-Regular', lineHeight: 18, flex: 1 },
  supportRow:  { width: '100%', borderTopWidth: 1, paddingTop: 14, marginTop: 4 },
  supportTxt:  { fontSize: 12, fontFamily: 'Geist-Regular', textAlign: 'center' },
  supportEmail:{ fontFamily: 'Geist-SemiBold', color: '#fafaf9' },
  btnPrimary:      { width: '100%', height: 44, borderRadius: 14, backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnPrimaryTxt:   { fontFamily: 'Geist-SemiBold', fontSize: 14, color: '#fff' },
  btnSecondary:    { width: '100%', height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryTxt: { fontFamily: 'Geist-Medium', fontSize: 14 },
})

// ─── StyleSheet: countdown ────────────────────────────────────────────────────
const cd = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unit:  { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, minWidth: 58, alignItems: 'center' },
  num:   { fontSize: 28, fontFamily: 'Geist-SemiBold', color: '#2FAF8F', letterSpacing: -0.5, lineHeight: 32 },
  label: { fontSize: 9, fontFamily: 'Geist-Medium', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  sep:   { fontSize: 20, fontFamily: 'Geist-SemiBold', color: '#57534e', marginBottom: 10 },
})