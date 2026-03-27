/**
 * FieldSphere.tsx
 * Esfera agente animada estilo ElevenLabs — adaptada a GANDIA.
 *
 * Estados:
 *   idle       → quieta, ondas muy lentas, color apagado
 *   listening  → activa, responde al volumen del micrófono, verde brillante
 *   saving     → animación de guarda, color sólido, rotación suave
 *   queued     → pulso lento, color semi-apagado
 *   syncing    → ondas activas, animación "subiendo", verde vivo
 *   error      → pulso rojo
 */

import { useEffect, useRef, useCallback } from 'react'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type SphereState = 'idle' | 'listening' | 'saving' | 'queued' | 'syncing' | 'error'

interface SphereConfig {
    baseColor: [number, number, number]   // RGB
    glowColor: [number, number, number]
    speed: number                      // velocidad base de la animación
    amplitude: number                      // deformación del blob (0-1)
    glowOpacity: number
    pulseScale: boolean                     // ¿pulsa el tamaño?
    layers: number                      // capas del blob
}

const STATE_CONFIG: Record<SphereState, SphereConfig> = {
    idle: {
        baseColor: [47, 175, 143],
        glowColor: [47, 175, 143],
        speed: 0.3,
        amplitude: 0.06,
        glowOpacity: 0.08,
        pulseScale: false,
        layers: 3,
    },
    listening: {
        baseColor: [47, 200, 160],
        glowColor: [47, 220, 170],
        speed: 1.4,
        amplitude: 0.22,
        glowOpacity: 0.30,
        pulseScale: false,
        layers: 4,
    },
    saving: {
        baseColor: [47, 175, 143],
        glowColor: [100, 200, 180],
        speed: 0.8,
        amplitude: 0.10,
        glowOpacity: 0.22,
        pulseScale: false,
        layers: 3,
    },
    queued: {
        baseColor: [100, 160, 140],
        glowColor: [47, 175, 143],
        speed: 0.4,
        amplitude: 0.05,
        glowOpacity: 0.10,
        pulseScale: true,
        layers: 2,
    },
    syncing: {
        baseColor: [60, 220, 160],
        glowColor: [60, 255, 180],
        speed: 1.8,
        amplitude: 0.18,
        glowOpacity: 0.35,
        pulseScale: false,
        layers: 5,
    },
    error: {
        baseColor: [220, 80, 80],
        glowColor: [255, 100, 100],
        speed: 1.0,
        amplitude: 0.08,
        glowOpacity: 0.28,
        pulseScale: true,
        layers: 2,
    },
}

// ─── WAVE POINTS ─────────────────────────────────────────────────────────────
// Genera los puntos del blob usando superposición de ondas sinusoidales
// en coordenadas polares.

function getBlobPoints(
    cx: number,
    cy: number,
    radius: number,
    time: number,
    amplitude: number,
    layer: number,
    volume: number,     // 0-1, del micrófono
    numPoints = 180,
): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = []
    const seed = layer * 1.7

    // Amplitud dinámica: la base más el volumen del micrófono
    const dynAmp = amplitude + volume * 0.18

    for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2

        // Superposición de 4 ondas sinusoidales con frecuencias y fases distintas
        const r =
            radius +
            radius * dynAmp * (
                Math.sin(angle * 2 + time * 1.0 + seed) * 0.40 +
                Math.sin(angle * 3 - time * 0.7 + seed * 2) * 0.25 +
                Math.sin(angle * 5 + time * 0.5 + seed * 3) * 0.20 +
                Math.sin(angle * 7 - time * 0.3 + seed * 4) * 0.15
            )

        points.push({
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
        })
    }

    return points
}

// Dibuja un blob suave con bezier curves
function drawBlob(
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
) {
    if (points.length < 3) return
    ctx.beginPath()
    ctx.moveTo(
        (points[0].x + points[1].x) / 2,
        (points[0].y + points[1].y) / 2,
    )
    for (let i = 1; i < points.length - 1; i++) {
        const mx = (points[i].x + points[i + 1].x) / 2
        const my = (points[i].y + points[i + 1].y) / 2
        ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my)
    }
    ctx.closePath()
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

interface FieldSphereProps {
    state: SphereState
    volume?: number          // 0-1 del micrófono en tiempo real
    size?: number          // px, default 220
}

export function FieldSphere({ state, volume = 0, size = 220 }: FieldSphereProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number>(0)
    const timeRef = useRef(0)
    const lastTimeRef = useRef<number | null>(null)

    // ── Config animada (lerp hacia el target) ────────────────────────────────
    const currentRef = useRef<SphereConfig>({ ...STATE_CONFIG.idle })

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const lerpRGB = (
        a: [number, number, number],
        b: [number, number, number],
        t: number,
    ): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const now = performance.now()
        const dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0.016
        lastTimeRef.current = now

        const target = STATE_CONFIG[state]
        const curr = currentRef.current
        const t = 1 - Math.pow(0.05, dt * 4)  // suavizado adaptativo

        // Lerp hacia el estado target
        curr.speed = lerp(curr.speed, target.speed, t)
        curr.amplitude = lerp(curr.amplitude, target.amplitude, t)
        curr.glowOpacity = lerp(curr.glowOpacity, target.glowOpacity, t)
        curr.baseColor = lerpRGB(curr.baseColor, target.baseColor, t)
        curr.glowColor = lerpRGB(curr.glowColor, target.glowColor, t)

        timeRef.current += dt * curr.speed

        const dpr = window.devicePixelRatio || 1
        const w = canvas.width / dpr
        const h = canvas.height / dpr
        const cx = w / 2
        const cy = h / 2
        const radius = (Math.min(w, h) / 2) * 0.52

        // Pulso de escala
        let scaleBoost = 1
        if (target.pulseScale) {
            scaleBoost = 1 + Math.sin(timeRef.current * 2.5) * 0.04
        }
        const r = radius * scaleBoost

        // Limpiar
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
        ctx.save()
        ctx.scale(1, 1)

        const [br, bg, bb] = curr.baseColor
        const [gr, gg, gb] = curr.glowColor

        // ── Glow exterior ────────────────────────────────────────────────────────
        const glowLayers = [
            { radius: r * 2.2, opacity: curr.glowOpacity * 0.25 },
            { radius: r * 1.7, opacity: curr.glowOpacity * 0.45 },
            { radius: r * 1.3, opacity: curr.glowOpacity * 0.70 },
        ]
        for (const g of glowLayers) {
            const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, g.radius)
            grad.addColorStop(0, `rgba(${gr},${gg},${gb},${g.opacity})`)
            grad.addColorStop(1, `rgba(${gr},${gg},${gb},0)`)
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(cx, cy, g.radius, 0, Math.PI * 2)
            ctx.fill()
        }

        // ── Capas del blob ────────────────────────────────────────────────────────
        const numLayers = target.layers
        for (let l = 0; l < numLayers; l++) {
            const layerProgress = l / numLayers
            const layerRadius = r * (0.60 + layerProgress * 0.40)
            const layerAlpha = 0.06 + layerProgress * 0.10
            const layerAmp = curr.amplitude * (1 - layerProgress * 0.3)

            const points = getBlobPoints(
                cx, cy,
                layerRadius,
                timeRef.current + l * 0.8,
                layerAmp,
                l,
                volume,
            )

            const fill = ctx.createRadialGradient(
                cx, cy - r * 0.2,    // centro de gradiente ligeramente arriba
                r * 0.1,
                cx, cy,
                layerRadius * 1.1,
            )
            fill.addColorStop(0, `rgba(${br + 40},${bg + 40},${bb + 40},${layerAlpha * 1.8})`)
            fill.addColorStop(0.5, `rgba(${br},${bg},${bb},${layerAlpha})`)
            fill.addColorStop(1, `rgba(${Math.max(0, br - 20)},${Math.max(0, bg - 20)},${Math.max(0, bb - 20)},${layerAlpha * 0.4})`)

            drawBlob(ctx, points)
            ctx.fillStyle = fill
            ctx.fill()
        }

        // ── Blob principal ────────────────────────────────────────────────────────
        const mainPoints = getBlobPoints(cx, cy, r, timeRef.current, curr.amplitude, 99, volume)
        const mainFill = ctx.createRadialGradient(cx, cy - r * 0.25, r * 0.15, cx, cy, r * 1.05)
        mainFill.addColorStop(0, `rgba(${Math.min(255, br + 60)},${Math.min(255, bg + 60)},${Math.min(255, bb + 60)},0.90)`)
        mainFill.addColorStop(0.4, `rgba(${br},${bg},${bb},0.85)`)
        mainFill.addColorStop(1, `rgba(${Math.max(0, br - 30)},${Math.max(0, bg - 30)},${Math.max(0, bb - 30)},0.65)`)

        drawBlob(ctx, mainPoints)
        ctx.fillStyle = mainFill
        ctx.fill()

        // ── Reflejo/highlight interior ────────────────────────────────────────────
        const highlight = ctx.createRadialGradient(
            cx - r * 0.25, cy - r * 0.30,
            r * 0.02,
            cx - r * 0.1, cy - r * 0.15,
            r * 0.55,
        )
        highlight.addColorStop(0, 'rgba(255,255,255,0.22)')
        highlight.addColorStop(1, 'rgba(255,255,255,0)')
        drawBlob(ctx, mainPoints)
        ctx.fillStyle = highlight
        ctx.fill()

        ctx.restore()
        rafRef.current = requestAnimationFrame(draw)
    }, [state, volume])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const dpr = window.devicePixelRatio || 1
        canvas.width = size * dpr
        canvas.height = size * dpr
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.scale(dpr, dpr)

        rafRef.current = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(rafRef.current)
    }, [draw, size])

    return (
        <canvas
            ref={canvasRef}
            style={{ width: size, height: size }}
            className="select-none pointer-events-none"
            aria-hidden="true"
        />
    )
}