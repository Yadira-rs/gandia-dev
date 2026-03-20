// app/(public)/signup/confirmation.tsx
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, Modal, Animated, Platform,
  useColorScheme, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg'
import { createUserProfile, getCurrentProfile } from '../../../src/lib/authService'
import type { UserRole } from '../../../src/lib/authService'

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'

type CustomType = 'summary' | 'terms'

interface Message {
  type: 'assistant' | 'user'
  text?: string
  customType?: CustomType
  id: number
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tokens = (isDark: boolean) => ({
  bg:            isDark ? '#0c0a09' : '#fafaf9',
  surface:       isDark ? '#141210' : '#ffffff',
  surfaceAlt:    isDark ? '#1c1917' : '#ffffff',
  border:        isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)',
  borderSoft:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
  text:          isDark ? '#fafaf9' : '#1c1917',
  muted:         isDark ? '#78716c' : '#a8a29e',
  subtext:       isDark ? '#57534e' : '#a8a29e',
  subtle:        isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  msgUser:       isDark ? '#1c1917' : '#ffffff',
  msgUserBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
})

// ─── Labels ───────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<Role, string> = {
  producer: 'Productor Ganadero',
  mvz:      'Médico Veterinario Zootecnista',
  union:    'Unión Ganadera',
  exporter: 'Exportador',
  auditor:  'Auditor / Inspector',
}

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Nombre', birthdate: 'Nacimiento', gender: 'Género',
  curp: 'CURP', phone: 'Teléfono', address: 'Domicilio',
  state: 'Estado', municipality: 'Municipio', postalCode: 'C.P.',
  rfc: 'RFC', country: 'País', role: 'Rol',
  ranchName: 'Rancho', uppNumber: 'UPP', siniigaNumber: 'SINIIGA',
  operationType: 'Tipo operación', cattleType: 'Tipo ganado', herdSize: 'Tamaño hato',
  ranchAddress: 'Dir. rancho', location: 'Estado rancho',
  license: 'Cédula', university: 'Universidad', specialty: 'Especialidad',
  unionName: 'Unión', region: 'Región', affiliates: 'Afiliados',
  companyName: 'Empresa', taxId: 'RFC/Tax ID', exportType: 'Tipo exportación',
  destination: 'Destino', entity: 'Entidad', auditType: 'Tipo auditoría',
}

const AUTH_LABELS: Record<string, string> = {
  google: 'Google', apple: 'Apple ID', microsoft: 'Microsoft', email: 'Correo electrónico',
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function GandiaLogo({ size = 17 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5"             stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5"             stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
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
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, { transform: [{ translateY: anim }] }]} />
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, description, confirmLabel = 'Confirmar', onConfirm, onCancel, isDark }: {
  open: boolean; title: string; description: string; confirmLabel?: string
  onConfirm: () => void; onCancel: () => void; isDark: boolean
}) {
  const t = tokens(isDark)
  const scale = useRef(new Animated.Value(0.94)).current
  const op    = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 100, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start()
    } else { scale.setValue(0.94); op.setValue(0) }
  }, [open])
  if (!open) return null
  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' } as any} />
      <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 } as any} pointerEvents="box-none">
        <Animated.View style={{ width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden', opacity: op, transform: [{ scale }] }}>
          <View style={{ height: 2, backgroundColor: '#2FAF8F', opacity: 0.6 }} />
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderTopWidth: 0, borderColor: t.border, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 }}>
            <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15, color: t.text, marginBottom: 6 }}>{title}</Text>
            <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 18 }}>{description}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={onCancel} style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f4', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: t.muted }}>Cancelar</Text>
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

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ accountId, name, onDismiss, isDark }: {
  accountId: string; name: string; onDismiss: () => void; isDark: boolean
}) {
  const [step, setStep] = useState(0)
  const slideAnim = useRef(new Animated.Value(24)).current
  const opAnim    = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.6)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.timing(opAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true, delay: 100 }),
    ]).start()
    const t1 = setTimeout(() => setStep(1), 600)
    const t2 = setTimeout(() => setStep(2), 1100)
    const t3 = setTimeout(() => setStep(3), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const checks = [
    'Información personal verificada',
    'Datos institucionales registrados',
    'Solicitud enviada al equipo GANDIA',
  ]

  return (
    <Modal visible animationType="none" transparent statusBarTranslucent>
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)' } as any} />
      <Animated.View style={[
        { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 } as any,
        { opacity: opAnim },
      ]}>
        <Animated.View style={{ width: '100%', maxWidth: 360, transform: [{ translateY: slideAnim }] }}>
          <View style={{ height: 2, backgroundColor: '#2FAF8F', opacity: 0.7, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
          <View style={{ backgroundColor: '#0f0e0d', borderWidth: 1, borderTopWidth: 0, borderColor: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' }}>

            {/* Close */}
            <TouchableOpacity onPress={onDismiss} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
                <Path d="M6 18L18 6M6 6l12 12" />
              </Svg>
            </TouchableOpacity>

            <View style={{ paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24 }}>
              {/* Icon */}
              <Animated.View style={{ alignItems: 'center', marginBottom: 20, transform: [{ scale: scaleAnim }] }}>
                <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(47,175,143,0.12)', borderWidth: 1, borderColor: 'rgba(47,175,143,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </Svg>
                </View>
              </Animated.View>

              <Text style={{ fontFamily: 'Geist-Bold', fontSize: 19, color: '#fff', textAlign: 'center', letterSpacing: -0.3, marginBottom: 6 }}>
                ¡Solicitud enviada!
              </Text>
              <Text style={{ fontFamily: 'Geist-Regular', fontSize: 12.5, color: '#78716c', textAlign: 'center', marginBottom: 20 }}>
                Hola <Text style={{ color: '#d6d3d1', fontFamily: 'Geist-Medium' }}>{name}</Text>, tu registro está en revisión
              </Text>

              {/* Account ID */}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Geist-Medium', fontSize: 9.5, color: '#57534e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                  N° de solicitud
                </Text>
                {accountId ? (
                  <Text style={{ fontFamily: 'Geist-Bold', fontSize: 15, color: '#2FAF8F', letterSpacing: 3 }}>
                    {accountId}
                  </Text>
                ) : (
                  <ActivityIndicator size="small" color="#2FAF8F" />
                )}
              </View>

              {/* Checks */}
              <View style={{ gap: 10, marginBottom: 4 }}>
                {checks.map((label, i) => (
                  <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, step <= i && { opacity: 0.18 }]}>
                    <View style={[
                      { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
                      step > i
                        ? { backgroundColor: '#2FAF8F' }
                        : { borderWidth: 1.5, borderColor: '#44403c' }
                    ]}>
                      {step > i && (
                        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M5 13l4 4L19 7" />
                        </Svg>
                      )}
                    </View>
                    <Text style={{ fontFamily: 'Geist-Regular', fontSize: 12, color: '#a8a29e' }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tear */}
            <View style={{ height: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <View style={{ position: 'absolute', width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' }} />
              <View style={{ position: 'absolute', left: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: '#0c0a09' }} />
              <View style={{ position: 'absolute', right: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: '#0c0a09' }} />
            </View>

            <View style={{ paddingHorizontal: 28, paddingVertical: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: 'rgba(47,175,143,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </Svg>
                </View>
                <Text style={{ flex: 1, fontFamily: 'Geist-Regular', fontSize: 12, color: '#78716c', lineHeight: 18 }}>
                  Revisión en <Text style={{ fontFamily: 'Geist-SemiBold', color: '#fff' }}>24–48 h hábiles</Text>. Te avisaremos cuando tu cuenta esté activa.
                </Text>
              </View>
              <TouchableOpacity onPress={onDismiss} style={{ height: 42, borderRadius: 12, backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.85}>
                <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 13, color: '#fff' }}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label, sublabel, isDark, linkLabel }: {
  checked: boolean; onChange: () => void; label: string
  sublabel?: string; isDark: boolean; linkLabel?: string
}) {
  const t = tokens(isDark)
  return (
    <TouchableOpacity onPress={onChange} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 2 }}>
      <View style={[
        { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
        checked
          ? { backgroundColor: '#2FAF8F', borderColor: '#2FAF8F' }
          : { backgroundColor: t.surface, borderColor: isDark ? '#44403c' : '#d6d3d1' },
      ]}>
        {checked && (
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 13l4 4L19 7" />
          </Svg>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: isDark ? '#d6d3d1' : '#57534e', lineHeight: 20 }}>
          {label}
          {linkLabel && <Text style={{ fontFamily: 'Geist-Medium', color: '#2FAF8F' }}> {linkLabel}</Text>}
        </Text>
        {sublabel && <Text style={{ fontFamily: 'Geist-Medium', fontSize: 11, color: '#2FAF8F', marginTop: 2 }}>{sublabel}</Text>}
      </View>
    </TouchableOpacity>
  )
}

// ─── Terms Section ────────────────────────────────────────────────────────────
function TermsSection({ termsAccepted, setTermsAccepted, notifications, setNotifications, handleConfirm, isSubmitting, isSuccess, submitError, retryCount, isDark }: {
  termsAccepted: { terms: boolean; privacy: boolean; notice: boolean }
  setTermsAccepted: React.Dispatch<React.SetStateAction<{ terms: boolean; privacy: boolean; notice: boolean }>>
  notifications: { alerts: boolean; newsletter: boolean }
  setNotifications: React.Dispatch<React.SetStateAction<{ alerts: boolean; newsletter: boolean }>>
  handleConfirm: () => void
  isSubmitting: boolean; isSuccess: boolean
  submitError: string | null; retryCount: number
  isDark: boolean
}) {
  const t = tokens(isDark)
  const allAccepted = termsAccepted.terms && termsAccepted.privacy && termsAccepted.notice
  const toggle = (k: keyof typeof termsAccepted) => setTermsAccepted(p => ({ ...p, [k]: !p[k] }))
  const toggleN = (k: keyof typeof notifications) => setNotifications(p => ({ ...p, [k]: !p[k] }))

  // Estado visual del botón
  const isActive   = allAccepted && !isSubmitting && !isSuccess
  const isDisabled = !allAccepted || isSubmitting || isSuccess

  return (
    <View style={{ gap: 10 }}>
      {/* Required */}
      <View style={[ts.card, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
        <View style={ts.cardHeader}>
          <Text style={[ts.sectionLabel, { color: t.muted }]}>REQUERIDO</Text>
          <Text style={{ fontFamily: 'Geist-Medium', fontSize: 10, color: '#f87171' }}>* Obligatorio</Text>
        </View>
        <Checkbox isDark={isDark} checked={termsAccepted.terms}    onChange={() => toggle('terms')}    label="Acepto los términos y condiciones de GANDIA"  linkLabel="(leer)" />
        <View style={ts.divider} />
        <Checkbox isDark={isDark} checked={termsAccepted.privacy}  onChange={() => toggle('privacy')}  label="Acepto la política de privacidad (LFPDPPP)"    linkLabel="(leer)" />
        <View style={ts.divider} />
        <Checkbox isDark={isDark} checked={termsAccepted.notice}   onChange={() => toggle('notice')}   label="He leído y acepto el aviso de privacidad"      linkLabel="(leer)" />
      </View>

      {/* Notifications */}
      <View style={[ts.card, { backgroundColor: t.surfaceAlt, borderColor: t.borderSoft }]}>
        <Text style={[ts.sectionLabel, { color: t.muted, marginBottom: 12 }]}>NOTIFICACIONES</Text>
        <Checkbox isDark={isDark} checked={notifications.alerts}      onChange={() => toggleN('alerts')}      label="Recibir alertas sanitarias y avisos del sistema" sublabel="Recomendado" />
        <View style={ts.divider} />
        <Checkbox isDark={isDark} checked={notifications.newsletter}  onChange={() => toggleN('newsletter')}  label="Recibir boletines del sector ganadero" />
      </View>

      {/* Hint — pendientes */}
      {!allAccepted && !isSubmitting && (
        <View style={[ts.hintRow, { borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
          <View style={ts.hintDot} />
          <Text style={[ts.hintTxt, { color: t.muted }]}>
            Acepta los 3 términos requeridos para activar el botón
          </Text>
        </View>
      )}

      {/* Error */}
      {submitError && (
        <View style={[ts.errorCard, { borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)', backgroundColor: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)' }]}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 12.5, color: '#ef4444', marginBottom: 4 }}>Error al crear la cuenta</Text>
              <Text style={{ fontFamily: 'Geist-Regular', fontSize: 12, color: isDark ? 'rgba(239,68,68,0.8)' : '#ef4444', lineHeight: 17 }}>{submitError}</Text>
              {retryCount < 3 && (
                <TouchableOpacity onPress={handleConfirm} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, alignSelf: 'flex-start' }}>
                  <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 11.5, color: '#fff' }}>Reintentar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ── Submit button ── */}
      <TouchableOpacity
        onPress={handleConfirm}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          ts.submitBtn,
          // Activo: verde con sombra
          isActive && ts.submitBtnActive,
          // Éxito: verde sin sombra (ya no se puede pulsar)
          isSuccess && ts.submitBtnSuccess,
          // Deshabilitado: sin sombra, borde sutil, fondo casi transparente
          (!allAccepted && !isSubmitting) && [
            ts.submitBtnDisabled,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            },
          ],
        ]}
      >
        {isSuccess ? (
          <>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 13l4 4L19 7" />
            </Svg>
            <Text style={[ts.submitTxt, { color: '#fff' }]}>Cuenta registrada</Text>
          </>
        ) : isSubmitting ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[ts.submitTxt, { color: '#fff' }]}>Creando cuenta...</Text>
          </>
        ) : (
          <>
            {/* Icono: candado cuando desactivado, check cuando activo */}
            {allAccepted ? (
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </Svg>
            ) : (
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </Svg>
            )}
            <Text style={[
              ts.submitTxt,
              { color: allAccepted ? '#fff' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') },
            ]}>
              Crear mi cuenta en GANDIA
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ pData, iData, authMethod, email, onEditPersonal, onEditInstitutional, isDark }: {
  pData: Record<string, unknown>
  iData: Record<string, unknown>
  authMethod: string
  email: string
  onEditPersonal: () => void
  onEditInstitutional: () => void
  isDark: boolean
}) {
  const t = tokens(isDark)
  const [expanded, setExpanded] = useState<'personal' | 'institutional' | null>(null)

  const personalFields = [
    { key: 'fullName',     value: String(pData.fullName  || '') },
    { key: 'birthdate',    value: String(pData.birthdate || '') },
    { key: 'gender',       value: String(pData.gender    || '') },
    { key: 'curp',         value: String(pData.curp      || '') },
    { key: 'phone',        value: String(pData.phone     || '') },
    { key: 'address',      value: String(pData.address   || '') },
    { key: 'municipality', value: String(pData.municipality || '') },
    { key: 'state',        value: String(pData.state     || '') },
    { key: 'postalCode',   value: String(pData.postalCode || '') },
    { key: 'rfc',          value: String(pData.rfc       || '') },
    { key: 'role',         value: ROLE_LABELS[pData.role as Role] || String(pData.role || '') },
  ].filter(f => f.value && f.value !== 'undefined' && f.value.trim() !== '')

  const institutionalFields = Object.entries(iData)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([key, value]) => ({ key, value: String(value) }))

  const displayedP = expanded === 'personal'       ? personalFields       : personalFields.slice(0, 5)
  const displayedI = expanded === 'institutional'  ? institutionalFields  : institutionalFields.slice(0, 5)

  return (
    <View style={[sc.card, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
      {/* Auth method header */}
      <View style={[sc.authRow, { backgroundColor: 'rgba(47,175,143,0.06)', borderBottomColor: t.borderSoft }]}>
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </Svg>
        <Text style={{ fontFamily: 'Geist-Regular', fontSize: 11.5, color: t.muted }}>
          Acceso: <Text style={{ fontFamily: 'Geist-SemiBold', color: '#2FAF8F' }}>{AUTH_LABELS[authMethod] || authMethod}</Text>
          {email ? <Text style={{ color: t.subtext }}>  ·  {email}</Text> : null}
        </Text>
      </View>

      {/* Personal */}
      <View style={sc.section}>
        <View style={sc.sectionHeader}>
          <Text style={[sc.sectionTitle, { color: t.text }]}>Datos Personales</Text>
          <TouchableOpacity onPress={onEditPersonal} style={sc.editBtn} activeOpacity={0.7}>
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </Svg>
            <Text style={sc.editTxt}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={{ gap: 8 }}>
          {displayedP.map(f => (
            <View key={f.key} style={sc.fieldRow}>
              <Text style={[sc.fieldLabel, { color: t.muted }]}>{FIELD_LABELS[f.key] || f.key}</Text>
              <Text style={[sc.fieldValue, { color: t.text }]} numberOfLines={2}>{f.value}</Text>
            </View>
          ))}
        </View>
        {personalFields.length > 5 && (
          <TouchableOpacity onPress={() => setExpanded(expanded === 'personal' ? null : 'personal')} style={{ marginTop: 8 }}>
            <Text style={sc.expandTxt}>
              {expanded === 'personal' ? 'Ver menos ↑' : `+${personalFields.length - 5} más`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Institutional */}
      <View style={[sc.section, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
        <View style={sc.sectionHeader}>
          <Text style={[sc.sectionTitle, { color: t.text }]}>Datos Institucionales</Text>
          <TouchableOpacity onPress={onEditInstitutional} style={sc.editBtn} activeOpacity={0.7}>
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </Svg>
            <Text style={sc.editTxt}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={{ gap: 8 }}>
          {displayedI.map(f => (
            <View key={f.key} style={sc.fieldRow}>
              <Text style={[sc.fieldLabel, { color: t.muted }]}>{FIELD_LABELS[f.key] || f.key}</Text>
              <Text style={[sc.fieldValue, { color: t.text }]} numberOfLines={2}>{f.value}</Text>
            </View>
          ))}
        </View>
        {institutionalFields.length > 5 && (
          <TouchableOpacity onPress={() => setExpanded(expanded === 'institutional' ? null : 'institutional')} style={{ marginTop: 8 }}>
            <Text style={sc.expandTxt}>
              {expanded === 'institutional' ? 'Ver menos ↑' : `+${institutionalFields.length - 5} más`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function SignUpConfirmation() {
  const router      = useRouter()
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tokens(isDark)

  const [messages,     setMessages]    = useState<Message[]>([])
  const [isTyping,     setIsTyping]    = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess,    setIsSuccess]   = useState(false)
  const [accountId,    setAccountId]   = useState('')
  const [showTerms,    setShowTerms]   = useState(false)
  const [submitError,  setSubmitError] = useState<string | null>(null)
  const [retryCount,   setRetryCount]  = useState(0)

  const [termsAccepted, setTermsAccepted]   = useState({ terms: false, privacy: false, notice: false })
  const [notifications, setNotifications]   = useState({ alerts: true, newsletter: false })

  const [personalData,      setPersonalData]      = useState<Record<string, unknown> | null>(null)
  const [institutionalData, setInstitutionalData] = useState<Record<string, unknown> | null>(null)
  const [authMethod, setAuthMethod] = useState('email')
  const [email, setEmail]           = useState('')

  const scrollRef   = useRef<ScrollView>(null)
  const initialized = useRef(false)
  const msgId       = useRef(0)

  const [modal, setModal] = useState({ open: false, title: '', description: '', confirmLabel: 'Confirmar', onConfirm: () => {} })
  const showConfirm = (title: string, desc: string, label: string, fn: () => void) =>
    setModal({ open: true, title, description: desc, confirmLabel: label, onConfirm: fn })
  const closeModal = () => setModal(m => ({ ...m, open: false }))

  const nextId = () => { msgId.current += 1; return msgId.current }
  const addMsg = (msg: Omit<Message, 'id'>) =>
    setMessages(prev => [...prev, { ...msg, id: nextId() }])

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)
  }, [messages, isTyping, showTerms])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadData()
  }, [])

  const loadData = async () => {
    const personalStr      = await AsyncStorage.getItem('signup-personal-data')
    const institutionalStr = await AsyncStorage.getItem('signup-institutional-data')
    const authM            = await AsyncStorage.getItem('signup-auth-method') || 'email'
    const emailV           = await AsyncStorage.getItem('signup-email') || ''

    if (!personalStr || !institutionalStr) {
      router.replace('/(public)/signup/personal' as any)
      return
    }

    try {
      const pData = JSON.parse(personalStr)
      const iData = JSON.parse(institutionalStr)
      if (!pData.fullName || !pData.role) throw new Error('Datos incompletos')

      setPersonalData(pData)
      setInstitutionalData(iData)
      setAuthMethod(authM)
      setEmail(emailV)

      const firstName = String(pData.fullName).split(' ')[0]

      setTimeout(() => {
        addMsg({ type: 'assistant', text: `¡Excelente, ${firstName}! Llegamos al último paso. Revisa que todo esté correcto:` })
        setTimeout(() => {
          addMsg({ type: 'assistant', customType: 'summary' })
          setTimeout(() => {
            setIsTyping(true)
            setTimeout(() => {
              setIsTyping(false)
              addMsg({ type: 'assistant', text: '¿Todo se ve bien? Acepta los términos para crear tu cuenta:' })
              setTimeout(() => setShowTerms(true), 350)
            }, 800)
          }, 800)
        }, 1000)
      }, 500)

    } catch (err) {
      console.error('[SignUpConfirmation]', err)
      router.replace('/(public)/signup/personal' as any)
    }
  }

  const handleBack = () => {
    if (isSubmitting || isSuccess) return
    showConfirm(
      '¿Regresar al paso anterior?',
      'Podrás editar tu información institucional antes de confirmar.',
      'Sí, regresar',
      () => { closeModal(); router.replace('/(public)/signup/institutional' as any) }
    )
  }

  const handleConfirm = async () => {
    if (isSubmitting || isSuccess || !personalData || !institutionalData) return
    setIsSubmitting(true)
    setIsTyping(true)
    setSubmitError(null)

    const timeoutId = setTimeout(() => {
      setIsTyping(false)
      setIsSubmitting(false)
      setSubmitError('La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.')
    }, 20000)

    try {
      const authMethod = await AsyncStorage.getItem('signup-auth-method') ?? 'email'
      const emailStored = await AsyncStorage.getItem('signup-email') ?? ''

      let serverAccountId = await createUserProfile({
        auth_method: authMethod,
        email:       emailStored,
        role:        personalData.role as UserRole,
        personal_data:     personalData as Record<string, string | number | boolean | null>,
        institutional_data: institutionalData as Record<string, string | number | boolean | null>,
        terms_accepted: {
          terms:       termsAccepted.terms,
          privacy:     termsAccepted.privacy,
          notice:      termsAccepted.notice,
          accepted_at: new Date().toISOString(),
        },
        notifications_preferences: {
          alerts:     notifications.alerts,
          newsletter: notifications.newsletter,
        },
        status:   'pending',
        metadata: {
          signup_completed_at: new Date().toISOString(),
          retry_count: retryCount,
        },
      })

      // Si el trigger de DB todavía no generó account_id, reintentar una vez
      if (!serverAccountId) {
        try {
          const profile = await getCurrentProfile()
          serverAccountId = profile?.account_id ?? ''
        } catch { /* ignore */ }
      }

      clearTimeout(timeoutId)
      setIsTyping(false)
      setIsSuccess(true)
      setAccountId(serverAccountId)

      await Promise.all([
        AsyncStorage.removeItem('signup-auth-method'),
        AsyncStorage.removeItem('signup-email'),
        AsyncStorage.removeItem('signup-user-id'),
        AsyncStorage.removeItem('signup-personal-data'),
        AsyncStorage.removeItem('signup-institutional-data'),
      ])
      await AsyncStorage.setItem('signup-completed', 'true')
      await AsyncStorage.setItem('user-status', 'pending')
      if (serverAccountId) await AsyncStorage.setItem('account-id', serverAccountId)

    } catch (err: unknown) {
      clearTimeout(timeoutId)
      setIsTyping(false)
      setIsSubmitting(false)
      const newRetry = retryCount + 1
      setRetryCount(newRetry)
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
      let userMsg = `Error: ${err instanceof Error ? err.message : 'Problema desconocido.'}`
      if (msg.includes('network') || msg.includes('fetch'))
        userMsg = 'Sin conexión a internet. Verifica tu red e intenta de nuevo.'
      else if (msg.includes('sesión') || msg.includes('session'))
        userMsg = 'Tu sesión expiró. Reinicia el proceso de registro.'
      else if (msg.includes('ya existe') || msg.includes('duplicate'))
        userMsg = 'Esta cuenta ya fue registrada. Intenta iniciar sesión.'
      if (newRetry >= 3)
        userMsg += ' Si el problema persiste, contacta soporte: soporte@gandia.mx'
      setSubmitError(userMsg)
    }
  }

  const renderCustom = (msg: Message) => {
    if (msg.customType === 'summary' && personalData && institutionalData) {
      return (
        <SummaryCard
          pData={personalData}
          iData={institutionalData}
          authMethod={authMethod}
          email={email}
          onEditPersonal={() => router.replace('/(public)/signup/personal' as any)}
          onEditInstitutional={() => router.replace('/(public)/signup/institutional' as any)}
          isDark={isDark}
        />
      )
    }
    return null
  }

  const firstName = personalData ? String(personalData.fullName || '').split(' ')[0] : ''

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

      {isSuccess && (
        <SuccessScreen
          accountId={accountId}
          name={firstName}
          onDismiss={() => router.replace('/(public)/splash' as any)}
          isDark={isDark}
        />
      )}

      <ConfirmModal
        open={modal.open} title={modal.title} description={modal.description}
        confirmLabel={modal.confirmLabel} onConfirm={modal.onConfirm} onCancel={closeModal}
        isDark={isDark}
      />

      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <View style={[s.progressTrack, { backgroundColor: isDark ? '#1c1917' : '#e7e5e4' }]}>
          <View style={[s.progressBar, { width: '100%' }]} />
        </View>
        <View style={s.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            disabled={isSubmitting || isSuccess}
            style={[s.backBtn, (isSubmitting || isSuccess) && { opacity: 0.3 }]}
            activeOpacity={0.6}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 19l-7-7 7-7" />
            </Svg>
            <Text style={[s.backTxt, { color: t.muted }]}>Volver</Text>
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <GandiaLogo size={17} />
            <Text style={[s.headerBrand, { color: t.text }]}>GANDIA</Text>
            <View style={[s.headerDivider, { backgroundColor: t.border }]} />
            <Text style={[s.headerSub, { color: t.muted }]}>
              {isSuccess ? 'Registro completado ✓' : 'Confirmación final'}
            </Text>
          </View>

          <Text style={[s.stepNum, { color: '#2FAF8F' }]}>04 / 04</Text>
        </View>
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[s.messages, messages.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={s.empty}>
            <Text style={[s.emptyTitle, { color: t.text }]}>Casi listo.</Text>
            <Text style={[s.emptyHint, { color: t.muted }]}>Paso 4 de 4 — Confirmación</Text>
          </View>
        )}

        {messages.map(msg => (
          <View key={msg.id} style={msg.type === 'user' ? s.rowUser : s.rowBot}>
            {msg.type === 'user' ? (
              <View style={[s.bubbleUser, { backgroundColor: t.msgUser, borderColor: t.msgUserBorder }]}>
                <Text style={[s.bubbleUserTxt, { color: t.text }]}>{msg.text}</Text>
              </View>
            ) : msg.customType ? (
              <View style={s.customWrap}>{renderCustom(msg)}</View>
            ) : (
              <Text style={[s.bubbleBot, { color: isDark ? '#a8a29e' : '#57534e' }]}>{msg.text}</Text>
            )}
          </View>
        ))}

        {isTyping && (
          <View style={[s.rowBot, { flexDirection: 'row', gap: 5, paddingVertical: 4 }]}>
            <TypingDot delay={0}   color={isDark ? '#44403c' : '#d6d3d1'} />
            <TypingDot delay={120} color={isDark ? '#44403c' : '#d6d3d1'} />
            <TypingDot delay={240} color={isDark ? '#44403c' : '#d6d3d1'} />
          </View>
        )}

        {showTerms && (
          <View style={{ marginTop: 4 }}>
            <TermsSection
              termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted}
              notifications={notifications} setNotifications={setNotifications}
              handleConfirm={handleConfirm}
              isSubmitting={isSubmitting} isSuccess={isSuccess}
              submitError={submitError} retryCount={retryCount}
              isDark={isDark}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── StyleSheet: main ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  header:        { borderBottomWidth: 1 },
  progressTrack: { height: 2 },
  progressBar:   { height: 2, backgroundColor: '#2FAF8F' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 50,
  },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backTxt:      { fontSize: 12, fontFamily: 'Geist-Medium' },
  headerCenter: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  headerBrand:   { fontSize: 13, fontFamily: 'Geist-SemiBold', letterSpacing: 0.5 },
  headerDivider: { width: 1, height: 12 },
  headerSub:     { fontSize: 11, fontFamily: 'Geist-Medium' },
  stepNum:       { fontSize: 10, fontFamily: 'Geist-SemiBold', letterSpacing: 1 },
  messages:   { padding: 20, gap: 20, paddingBottom: 40 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40, gap: 10 },
  emptyTitle: { fontFamily: 'InstrumentSerif-Italic', fontSize: 38, lineHeight: 46, textAlign: 'center', letterSpacing: -0.5 },
  emptyHint:  { fontFamily: 'Geist-Regular', fontSize: 13, textAlign: 'center' },
  rowUser:    { alignItems: 'flex-end' },
  rowBot:     { alignItems: 'flex-start' },
  bubbleUser: {
    maxWidth: '75%', borderRadius: 16, borderBottomRightRadius: 4,
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bubbleUserTxt: { fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 22 },
  bubbleBot:     { maxWidth: '90%', fontSize: 14.5, fontFamily: 'Geist-Regular', lineHeight: 24 },
  customWrap:    { width: '100%' },
})

// ─── StyleSheet: terms ────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 2 },
  errorCard:    { borderRadius: 14, borderWidth: 1, padding: 14 },

  // Hint row cuando faltan checkboxes
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  hintDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#a8a29e', opacity: 0.5 },
  hintTxt: { fontFamily: 'Geist-Regular', fontSize: 12, flex: 1 },

  // Botón base (sin sombra ni color — los estados lo definen)
  submitBtn: {
    height: 50, borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderColor: 'transparent',
  },
  // Activo: verde + sombra verde
  submitBtnActive: {
    backgroundColor: '#2FAF8F',
    borderColor: 'transparent',
    shadowColor: '#2FAF8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  // Éxito: verde sin sombra
  submitBtnSuccess: {
    backgroundColor: '#2FAF8F',
    borderColor: 'transparent',
  },
  // Deshabilitado: fantasma, sin sombra
  submitBtnDisabled: {
    // backgroundColor y borderColor se inyectan inline (dependen de isDark)
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },

  submitTxt: { fontFamily: 'Geist-SemiBold', fontSize: 13.5 },
  hint:      { fontFamily: 'Geist-Regular', fontSize: 11, textAlign: 'center' },
})

// ─── StyleSheet: summary card ─────────────────────────────────────────────────
const sc = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  authRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1,
  },
  section:       { paddingHorizontal: 14, paddingVertical: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontFamily: 'Geist-SemiBold', fontSize: 13 },
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editTxt:       { fontFamily: 'Geist-Medium', fontSize: 11.5, color: '#2FAF8F' },
  fieldRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  fieldLabel:    { fontFamily: 'Geist-Regular', fontSize: 12, flex: 1 },
  fieldValue:    { fontFamily: 'Geist-Medium', fontSize: 12.5, flex: 1.5, textAlign: 'right' },
  expandTxt:     { fontFamily: 'Geist-Medium', fontSize: 11.5, color: '#2FAF8F' },
})