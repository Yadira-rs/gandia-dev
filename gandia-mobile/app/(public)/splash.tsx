// app/(public)/splash.tsx
import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Animated,
  Dimensions, StatusBar, useColorScheme,
} from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'

const { width: W, height: H } = Dimensions.get('window')

export default function SplashScreen() {
  const router      = useRouter()
  const colorScheme = useColorScheme()          // 'light' | 'dark' | null
  // null = aún no resuelto → esperamos; fallback a 'light' si tarda
  const [scheme, setScheme] = useState<'light' | 'dark'>(
    colorScheme === 'dark' ? 'dark' : 'light'
  )

  useEffect(() => {
    if (colorScheme === 'light' || colorScheme === 'dark') {
      setScheme(colorScheme)
    }
  }, [colorScheme])

  const isDark = scheme === 'dark'

  const [progress, setProgress] = useState(0)
  const [pct, setPct]           = useState(0)
  const done                    = useRef(false)

  // ── Tokens de color (igual que la web) ────────────────────────────────────
  const bg          = isDark ? '#0c0a09' : '#F5F4F3'
  const textCorner  = isDark ? '#57534e' : '#a8a29e'
  const titleColor  = isDark ? '#fafaf9' : '#171717'
  const subColor    = isDark ? '#78716c' : '#a8a29e'
  const countColor  = isDark ? '#78716c' : '#a8a29e'
  const countSufx   = isDark ? '#44403c' : '#d6d3d1'
  const glowOpacity = isDark ? 0.13 : 0.09

  // ── Animated values ───────────────────────────────────────────────────────
  const fadeRoot    = useRef(new Animated.Value(1)).current
  const logoScale   = useRef(new Animated.Value(0.88)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const glowScale   = useRef(new Animated.Value(1)).current
  const glowOp      = useRef(new Animated.Value(0.4)).current
  const titleTY     = useRef(new Animated.Value(12)).current
  const titleOp     = useRef(new Animated.Value(0)).current
  const subTY       = useRef(new Animated.Value(12)).current
  const subOp       = useRef(new Animated.Value(0)).current
  const bottomTY    = useRef(new Animated.Value(12)).current
  const bottomOp    = useRef(new Animated.Value(0)).current
  const tagOp       = useRef(new Animated.Value(0)).current
  const layerBY     = useRef(new Animated.Value(0)).current
  const layerMY     = useRef(new Animated.Value(0)).current
  const layerTY2    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Logo entrance
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1,  friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1,  duration: 400, useNativeDriver: true }),
      ]),
    ]).start()

    // Corner tags
    Animated.timing(tagOp, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }).start()

    // Title / subtitle / bottom slide-up
    const slide = (ty: Animated.Value, op: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(ty, { toValue: 0, duration: 700, delay, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 700, delay, useNativeDriver: true }),
      ]).start()

    slide(titleTY,  titleOp,  500)
    slide(subTY,    subOp,    680)
    slide(bottomTY, bottomOp, 820)

    // Glow pulse (escala + opacidad como la web)
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(glowScale, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowOp,    { toValue: 0.7,  duration: 2000, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(glowScale, { toValue: 1.00, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowOp,    { toValue: 0.4,  duration: 2000, useNativeDriver: true }),
      ]),
    ])).start()

    // Layer float
    const float = (anim: Animated.Value, delay: number, range: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: -range, duration: 1800, delay,  useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,      duration: 1800,         useNativeDriver: true }),
      ])).start()

    float(layerBY,  1200, 2)
    float(layerMY,  1500, 1.2)
    float(layerTY2, 1800, 0.5)
  }, [])

  // ── Progress ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          if (!done.current) {
            done.current = true
            Animated.timing(fadeRoot, { toValue: 0, duration: 650, useNativeDriver: true })
              .start(() => router.replace('/(public)/login'))
          }
          return 100
        }
        const inc = prev < 60 ? Math.random() * 14 : Math.random() * 5
        return Math.min(prev + inc, 100)
      })
    }, 180)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { setPct(Math.round(progress)) }, [progress])

  return (
    <Animated.View style={[s.root, { backgroundColor: bg, opacity: fadeRoot }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
      />



      {/* Corner tags */}
      <Animated.View style={[s.tagLeft, { opacity: tagOp }]}>
        <Text style={[s.tagText, { color: textCorner }]}>Sistema Institucional</Text>
      </Animated.View>
      <Animated.View style={[s.tagRight, { opacity: tagOp }]}>
        <Text style={[s.tagText, { color: textCorner }]}>v7.0</Text>
      </Animated.View>

      {/* Center */}
      <View style={s.center}>

        {/* Logo */}
        <Animated.View style={[s.logoWrap, {
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }]}>


          {/* Las 3 capas SVG con float independiente */}
          <View style={s.layersContainer}>
            <Animated.View style={[s.layer, { transform: [{ translateY: layerBY }] }]}>
              <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
                <Path d="M2 17l10 5 10-5" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
            <Animated.View style={[s.layer, { transform: [{ translateY: layerMY }] }]}>
              <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
                <Path d="M2 12l10 5 10-5" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
            <Animated.View style={[s.layer, { transform: [{ translateY: layerTY2 }] }]}>
              <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
                <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Wordmark */}
        <View style={s.wordmark}>
          <Animated.Text style={[s.title, { color: titleColor, opacity: titleOp, transform: [{ translateY: titleTY }] }]}>
            {'GANDIA '}
            <Text style={s.titleAccent}>7</Text>
          </Animated.Text>
          <Animated.Text style={[s.subtitle, { color: subColor, opacity: subOp, transform: [{ translateY: subTY }] }]}>
            Trazabilidad Ganadera
          </Animated.Text>
        </View>
      </View>

      {/* Bottom */}
      <Animated.View style={[s.bottom, { opacity: bottomOp, transform: [{ translateY: bottomTY }] }]}>
        <Text style={[s.bottomLabel, { color: subColor }]}>Inicializando sistema</Text>
        <Text style={[s.bottomPct, { color: countColor }]}>
          {pct}<Text style={{ color: countSufx }}>%</Text>
        </Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressBar, { width: `${progress}%` as any }]} />
      </View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Corner tags ──
  tagLeft: {
    position: 'absolute',
    top: 52,
    left: 28,
  },
  tagRight: {
    position: 'absolute',
    top: 52,
    right: 28,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'Geist-Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Center ──
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },

  // ── Logo ──
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  layersContainer: {
    width: 52,
    height: 52,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // ── Wordmark ──
  wordmark: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#2FAF8F',
  },
  subtitle: {
    fontFamily: 'Geist-Medium',
    fontSize: 11,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // ── Bottom ──
  bottom: {
    position: 'absolute',
    bottom: 24,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomLabel: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 13,
  },
  bottomPct: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 13,
  },

  // ── Progress ──
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressBar: {
    height: 2,
    backgroundColor: '#2FAF8F',
    shadowColor: '#2FAF8F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
})