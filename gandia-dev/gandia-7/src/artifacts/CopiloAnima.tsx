/**
 * CopiloAnima — Copiloto flotante del nivel Ánima.
 *
 * Mejoras v3:
 *   1. Historial de conversación (últimas 4 entradas)
 *   2. Estado de error con mensaje y reintento
 *   3. Chip activo muestra spinner mientras procesa
 *   4. Transición animada al cambiar de dominio
 *   5. visualViewport listener para teclado móvil
 *   6. Accesibilidad: aria-label, role=dialog, focus trap
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ArtifactDomain } from './artifactTypes'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface CopiloAction {
  id:    string
  label: string
  icon:  React.ReactNode
}

// Mini historial de conversación
interface HistoryEntry {
  id:     string
  role:   'user' | 'agent'
  text:   string
  status: 'ok' | 'error'
}

interface Props {
  domain:    ArtifactDomain
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAction?: (actionId: string, payload?: any) => void
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────

const IcoPlus      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoStar      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const IcoDownload  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IcoClock     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoLeaf      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 16 8M17.5 3.5C15 2 11 2 8 5c-3 3-3 7-1.5 9.5"/><path d="M6.5 14.5C8 17 12 19 16 17c4-2 5-6 3.5-9.5"/></svg>
const IcoAlert     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoRefresh   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
const IcoBadge     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
const IcoTimer     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>
const IcoFile      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IcoPending   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const IcoSearch    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoShield    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoCamera    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
const IcoClipboard = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
const IcoReport    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>

// ─── ACCIONES SUGERIDAS POR DOMINIO ──────────────────────────────────────────

const SUGGESTED_ACTIONS: Record<ArtifactDomain, CopiloAction[]> = {
  passport:      [{ id: 'create_passport', label: 'Crear pasaporte',  icon: <IcoPlus /> },  { id: 'filter_eligible',  label: 'Solo elegibles',   icon: <IcoStar /> },     { id: 'export_list',     label: 'Exportar lista',   icon: <IcoDownload /> }],
  twins:         [{ id: 'view_timeline',   label: 'Ver historial',    icon: <IcoClock /> }, { id: 'add_event',        label: 'Registrar evento', icon: <IcoPlus /> },     { id: 'view_feeding',    label: 'Ver alimentación', icon: <IcoLeaf /> }],
  monitoring:    [{ id: 'view_alerts',     label: 'Ver alertas',      icon: <IcoAlert /> }, { id: 'refresh_sensors',  label: 'Actualizar',       icon: <IcoRefresh /> }],
  certification: [{ id: 'new_cert',        label: 'Nueva cert.',      icon: <IcoBadge /> }, { id: 'expiring',         label: 'Por vencer',       icon: <IcoTimer /> }],
  tramites:      [{ id: 'new_tramite',     label: 'Nuevo trámite',    icon: <IcoFile /> },  { id: 'pending',          label: 'Pendientes',       icon: <IcoPending /> }],
  verification:  [{ id: 'new_audit',       label: 'Nueva auditoría',  icon: <IcoSearch /> },{ id: 'history',          label: 'Ver historial',    icon: <IcoClock /> }],
  sanidad:       [{ id: 'check_risk',      label: 'Riesgo zona',      icon: <IcoShield /> },{ id: 'report_senasica',  label: 'Reportar',         icon: <IcoReport /> },   { id: 'view_protocol',   label: 'Protocolo',        icon: <IcoClipboard /> }],
  biometria:     [{ id: 'capture_morro',   label: 'Nueva captura',    icon: <IcoCamera /> },{ id: 'view_historial',   label: 'Historial',        icon: <IcoClock /> },    { id: 'register_animal', label: 'Registrar',        icon: <IcoPlus /> }],
  exportacion:   [{ id: 'nueva_solicitud', label: 'Nueva solicitud',  icon: <IcoPlus /> },  { id: 'escanear_aretes',  label: 'Escanear aretes',  icon: <IcoCamera /> },   { id: 'validar_aretes',  label: 'Validar aretes',   icon: <IcoBadge /> },   { id: 'exportar_excel',  label: 'Exportar Excel',   icon: <IcoDownload /> }],
  vinculacion:   [{ id: 'nueva_vinculacion', label: 'Nueva vinculación', icon: <IcoPlus /> }, { id: 'ver_pendientes', label: 'Ver pendientes', icon: <IcoTimer /> }, { id: 'ver_activas', label: 'Ver activas', icon: <IcoBadge /> }, { id: 'ver_historial', label: 'Historial', icon: <IcoClock /> }],
}

// ─── fix #5 — hint contextual por dominio ────────────────────────────────────

const DOMAIN_HINT: Record<ArtifactDomain, string> = {
  passport:      'Gestiona fichas y expedientes ganaderos',
  twins:         'Consulta eventos, dieta e historial del animal',
  monitoring:    'Revisa alertas y estado de sensores en campo',
  certification: 'Administra certificaciones y vencimientos',
  tramites:      'Sigue trámites activos ante SENASICA',
  verification:  'Audita y verifica registros del sistema',
  sanidad:       'Monitorea riesgos sanitarios y protocolos',
  biometria:     'Captura y consulta huellas de morro',
  exportacion:   'Gestiona solicitudes de aretes azules SENASICA',
  vinculacion:   'Administra tu red de acceso institucional',
}

const DOMAIN_LABEL: Record<ArtifactDomain, string> = {
  passport:      'Ficha',
  twins:         'Gemelo',
  monitoring:    'Monitor',
  certification: 'Certif.',
  tramites:      'Trámites',
  verification:  'Verif.',
  sanidad:       'Sanidad',
  biometria:     'Biometría',
  exportacion:   'Exportación',
  vinculacion:   'Vinculaciones',
}

// ─── ESTADO ───────────────────────────────────────────────────────────────────

type CopiloState = 'idle' | 'thinking' | 'done' | 'error'

// ─── COMPONENTE ──────────────────────────────────────────────────────────────

export default function CopiloAnima({ domain, onAction }: Props) {
  const [open,         setOpen]         = useState(false)
  const [closing,      setClosing]      = useState(false)
  const [input,        setInput]        = useState('')
  const [copiloState,  setCopiloState]  = useState<CopiloState>('idle')
  const [thinkText,    setThinkText]    = useState('')
  const [resultText,   setResultText]   = useState('')
  const [errorText,    setErrorText]    = useState('')
  const [activeChip,   setActiveChip]   = useState('')
  const [history,      setHistory]      = useState<HistoryEntry[]>([])
  const [panelVisible, setPanelVisible] = useState(false)
  const [kbOffset,     setKbOffset]     = useState(0)

  // Drag-to-reposition
  const [pos,      setPos]      = useState<{x:number,y:number}|null>(null)
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef<{mx:number,my:number,ex:number,ey:number}|null>(null)
  const fabRef     = useRef<HTMLButtonElement>(null)

  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const panelRef  = useRef<HTMLDivElement>(null)
  const actions   = SUGGESTED_ACTIONS[domain]
  const label     = DOMAIN_LABEL[domain]
  const hint      = DOMAIN_HINT[domain]

  // #4 — domain change: reset durante el render (patrón recomendado por React
  //      para sincronizar estado derivado de props, sin useEffect).
  //      Ver: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [trackedDomain, setTrackedDomain] = useState<ArtifactDomain>(domain)
  if (trackedDomain !== domain) {
    setTrackedDomain(domain)
    setHistory([])
    setCopiloState('idle')
    setErrorText('')
  }

  // Panel enter
  useEffect(() => {
    if (open) requestAnimationFrame(() => setPanelVisible(true))
  }, [open])

  // Autofocus
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 130)
  }, [open])

  // #5 — visualViewport: lift panel above software keyboard on mobile
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setKbOffset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    return () => { vv.removeEventListener('resize', onResize); vv.removeEventListener('scroll', onResize) }
  }, [])

  // Drag handlers — pointer events for mouse + touch
  const onDragStart = useCallback((e: React.PointerEvent) => {
    // Only drag on the FAB itself (not clicks that open/close panel)
    // We detect drag vs click by distance moved
    const fab = fabRef.current
    if (!fab) return
    const rect = fab.getBoundingClientRect()
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ex: rect.left, ey: rect.top }
    setDragging(false)
    fab.setPointerCapture(e.pointerId)
  }, [])

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragOrigin.current) return
    const dx = e.clientX - dragOrigin.current.mx
    const dy = e.clientY - dragOrigin.current.my
    if (!dragging && Math.hypot(dx, dy) < 6) return   // treat as click if < 6px
    setDragging(true)
    const FAB_W = 44; const FAB_H = 44
    const newX = Math.min(Math.max(dragOrigin.current.ex + dx, 8), window.innerWidth  - FAB_W - 8)
    const newY = Math.min(Math.max(dragOrigin.current.ey + dy, 8), window.innerHeight - FAB_H - 8)
    setPos({ x: newX, y: newY })
  }, [dragging])

  const onDragEnd = useCallback((e: React.PointerEvent) => {
    fabRef.current?.releasePointerCapture(e.pointerId)
    dragOrigin.current = null
    // If it was a real drag, consume the event so onClick doesn't fire
    if (dragging) setTimeout(() => setDragging(false), 50)
  }, [dragging])

  // #6 — focus trap inside panel when open
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const getFocusable = () => Array.from(
      panel.querySelectorAll<HTMLElement>('button:not([disabled]),textarea:not([disabled])')
    )
    const trap = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const els = getFocusable()
      if (!els.length) return
      const first = els[0]; const last = els[els.length - 1]
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus() } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus() } }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [open])

  // fix #2 — helper para resetear altura del textarea
  const resetTA = () => {
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }

  // fix #1 — cierre con animación de salida
  const handleClose = useCallback(() => {
    setClosing(true)
    setPanelVisible(false)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
      setInput('')
      resetTA()
    }, 200)
  }, [])

  const executeAction = useCallback((actionLabel: string, actionId?: string) => {
    if (copiloState === 'thinking') return
    setCopiloState('thinking')
    setThinkText(actionLabel)
    setActiveChip(actionId ?? '')   // #3 — chip activo
    setInput('')
    resetTA()

    // #1 — entrada del usuario en historial
    const uid = Date.now().toString()
    setHistory(prev => [...prev.slice(-3), { id: uid, role: 'user', text: actionLabel, status: 'ok' }])

    // Simula error ocasional (~15%) — reemplazar con respuesta real del backend
    const willFail = Math.random() < 0.15

    setTimeout(() => {
      setActiveChip('')
      if (willFail) {
        // #2 — estado de error
        setCopiloState('error')
        const msg = `No se pudo ejecutar "${actionLabel}"`
        setErrorText(msg)
        setHistory(prev => [...prev.slice(-3), { id: uid + 'e', role: 'agent', text: msg, status: 'error' }])
        setTimeout(() => { setCopiloState('idle'); setErrorText('') }, 3500)
      } else {
        setCopiloState('done')
        const ok = `${actionLabel} completado`
        setResultText(ok)
        if (actionId) onAction?.(actionId)
        setHistory(prev => [...prev.slice(-3), { id: uid + 'a', role: 'agent', text: ok, status: 'ok' }])
        setTimeout(() => { setCopiloState('idle'); setResultText(''); setThinkText('') }, 2600)
      }
    }, 1400)
  }, [copiloState, onAction])

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || copiloState === 'thinking') return
    executeAction(trimmed)
  }, [input, copiloState, executeAction])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') handleClose()
  }

  const isThinking = copiloState === 'thinking'

  return (
    <>
      <style>{`
        @keyframes copilo-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes copilo-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(6px) scale(0.98); }
        }
        @keyframes copilo-fade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes copilo-check {
          from { stroke-dashoffset: 28; }
          to   { stroke-dashoffset: 0; }
        }
        .copilo-enter { animation: copilo-in  0.22s cubic-bezier(0.34,1.4,0.64,1) forwards; }
        .copilo-exit  { animation: copilo-out 0.18s ease forwards; }
        .copilo-fade  { animation: copilo-fade 0.2s ease forwards; }
        .copilo-check-path {
          stroke-dasharray: 28;
          stroke-dashoffset: 28;
          animation: copilo-check 0.35s 0.1s ease forwards;
        }
      `}</style>

      {/* #5 keyboard, drag positioning */}
      <div
        className={"fixed z-60 flex flex-col items-end gap-3" + (pos ? '' :
          " right-4 sm:right-6 bottom-[max(5rem,env(safe-area-inset-bottom,1.25rem))] md:bottom-6")}
        style={pos
          ? { left: pos.x, top: pos.y, transition: dragging ? 'none' : 'left 0.15s,top 0.15s' }
          : kbOffset > 0 ? { bottom: `${kbOffset + 16}px` } : undefined
        }
      >

        {/* ── Panel ── */}
        {(open || closing) && (
          <div
            ref={panelRef}
            role="dialog"
            aria-label={"Copiloto " + label}
            aria-modal="false"
            className={`w-[288px] flex flex-col overflow-hidden rounded-2xl
                        bg-white dark:bg-[#111010]
                        border border-stone-200/60 dark:border-white/[0.07]
                        ${panelVisible && !closing ? 'copilo-enter' : ''}
                        ${closing                  ? 'copilo-exit'  : ''}
                        ${!panelVisible && !closing ? 'opacity-0'   : ''}`}
            style={{
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.04),
                0 8px 24px rgba(0,0,0,0.08),
                0 24px 48px rgba(0,0,0,0.12)
              `,
            }}
          >

            {/* Accent line */}
            <div
              className="h-0.5 w-full shrink-0"
              style={{ background: 'linear-gradient(90deg, #2FAF8F00, #2FAF8FCC 40%, #2FAF8F60 70%, #2FAF8F00)' }}
            />

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0 text-stone-400 dark:text-stone-500"
                >
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                </svg>
                <span className="text-[12.5px] font-semibold tracking-[-0.01em]
                                 text-stone-800 dark:text-stone-100">
                  Copiloto
                </span>
                <span className="text-stone-300 dark:text-stone-600 text-[12px] select-none">/</span>
                <span className="text-[11.5px] font-medium truncate text-stone-400 dark:text-stone-500">
                  {label}
                </span>
              </div>

              <button
                onClick={handleClose}
                aria-label="Cerrar copiloto"
                className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg
                           text-stone-300 dark:text-stone-600
                           hover:text-stone-500 dark:hover:text-stone-400
                           hover:bg-stone-100 dark:hover:bg-white/6 transition-all"
              >
                <svg className="w-2.75 h-2.75" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* ── fix #4 — estados con crossfade via key ── */}

            {copiloState === 'thinking' && (
              <div key="thinking" className="flex gap-3 px-4 pb-3 copilo-fade">
                <div className="shrink-0 w-px self-stretch"
                  style={{ background: 'linear-gradient(to bottom, #2FAF8F, rgba(47,175,143,0.2))' }}
                />
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="#2FAF8F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  </svg>
                  <span className="ch-serif italic text-[12px] text-stone-400 dark:text-stone-500 truncate">
                    {thinkText}
                  </span>
                </div>
              </div>
            )}

            {copiloState === 'done' && (
              <div key="done" className="flex gap-3 px-4 pb-3 copilo-fade">
                <div className="shrink-0 w-px self-stretch"
                  style={{ background: 'rgba(47,175,143,0.25)' }}
                />
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="shrink-0 w-3 h-3 text-[#2FAF8F]" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline className="copilo-check-path" points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="ch-serif italic text-[12px] text-stone-400 dark:text-stone-500 truncate">
                    {resultText}
                  </span>
                </div>
              </div>
            )}

            {/* ── #2 — Estado de error con reintento ── */}
            {copiloState === 'error' && (
              <div key="error" className="flex gap-3 px-4 pb-3 copilo-fade">
                <div className="shrink-0 w-px self-stretch bg-red-300/60 dark:bg-red-700/50" />
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="shrink-0 w-3 h-3 text-red-400" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span className="text-[12px] text-stone-500 dark:text-stone-400 truncate">
                      {errorText}
                    </span>
                  </div>
                  <button
                    onClick={() => { setCopiloState('idle'); setErrorText('') }}
                    className="self-start text-[11px] font-medium text-[#2FAF8F]
                               hover:underline underline-offset-2 transition-all"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* ── #1 historial + hint + #3 chips ── */}
            {copiloState === 'idle' && (
              <div key="idle" className="copilo-fade">

                {/* Mini historial — pares acción / resultado */}
                {history.length > 0 ? (
                  <div className="px-4 pb-3 flex flex-col gap-2">
                    {/* Agrupamos de a pares: [user, agent] */}
                    {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => {
                      const user  = history[i * 2]
                      const agent = history[i * 2 + 1]
                      return (
                        <div key={user?.id ?? i} className="flex flex-col gap-0.5">
                          {/* Acción del usuario */}
                          {user && (
                            <div className="flex items-center gap-1.5">
                              <svg className="shrink-0 w-2.5 h-2.5 text-stone-300 dark:text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                              <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{user.text}</span>
                            </div>
                          )}
                          {/* Respuesta del agente */}
                          {agent && (
                            <div className="flex items-center gap-1.5 pl-4">
                              {agent.status === 'error' ? (
                                <svg className="shrink-0 w-2.5 h-2.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              ) : (
                                <svg className="shrink-0 w-2.5 h-2.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                              <span className={"text-[11px] truncate " + (agent.status === 'error' ? 'text-red-400' : 'text-stone-400 dark:text-stone-500')}>
                                {agent.text}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="px-4 pb-2 text-[11px] text-stone-300 dark:text-stone-600 leading-snug">
                    {hint}
                  </p>
                )}

                <div className="px-3 pb-2 grid grid-cols-2 gap-1.5">
                  {actions.map(a => (
                    <ActionChip
                      key={a.id}
                      action={a}
                      disabled={isThinking}
                      active={activeChip === a.id}
                      onPress={() => executeAction(a.label, a.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="mx-3 h-px bg-stone-100 dark:bg-white/5" />

            {/* Input */}
            <div className="p-3">
              <InputRow
                inputRef={inputRef}
                value={input}
                onChange={setInput}
                onKeyDown={handleKey}
                onSubmit={handleSubmit}
                disabled={isThinking}
              />
            </div>

          </div>
        )}

        {/* ── FAB ── */}
        <FABButton
          fabRef={fabRef}
          open={open}
          state={copiloState}
          isDragging={dragging}
          onClick={() => { if (!dragging) { if (open) { handleClose() } else { setOpen(true) } } }}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
        />

      </div>
    </>
  )
}

// ─── ACTION CHIP ──────────────────────────────────────────────────────────────

function ActionChip({
  action,
  disabled,
  active,
  onPress,
}: {
  action:   CopiloAction
  disabled: boolean
  active:   boolean
  onPress:  () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      aria-disabled={disabled}
      aria-busy={active}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex items-center gap-2 h-8 px-2.5 rounded-xl
                 text-[11.5px] font-medium transition-all duration-150
                 active:scale-[0.96] text-left
                 disabled:opacity-40 disabled:pointer-events-none"
      style={{
        background: active  ? 'rgba(47,175,143,0.06)' :
                    hovered ? 'rgba(0,0,0,0.03)'       : 'transparent',
        border: `1px solid ${active ? 'rgba(47,175,143,0.25)' : hovered ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.07)'}`,
      }}
    >
      {/* #3 — spinner en chip activo */}
      <span className="w-3.5 h-3.5 shrink-0 transition-colors duration-150
                       text-stone-400 dark:text-stone-500
                       group-hover:text-stone-600 dark:group-hover:text-stone-300">
        {active ? (
          <svg className="animate-spin text-[#2FAF8F]" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : action.icon}
      </span>
      <span className={"truncate transition-colors duration-150 " + (
        active ? 'text-[#2FAF8F]'
               : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200'
      )}>
        {action.label}
      </span>
    </button>
  )
}

// ─── INPUT ROW ────────────────────────────────────────────────────────────────

function InputRow({
  inputRef,
  value,
  onChange,
  onKeyDown,
  onSubmit,
  disabled,
}: {
  inputRef:  React.RefObject<HTMLTextAreaElement | null>
  value:     string
  onChange:  (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmit:  () => void
  disabled:  boolean
}) {
  const hasInput = value.trim().length > 0

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  return (
    <div
      className="relative rounded-xl px-3 py-2 transition-colors duration-150
                 bg-stone-50 dark:bg-white/4
                 border border-stone-200/80 dark:border-white/8
                 focus-within:border-stone-300 dark:focus-within:border-white/[0.14]"
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Instrucción o pregunta…"
        className="w-full bg-transparent text-[12px] outline-none resize-none
                   text-stone-700 dark:text-stone-200 leading-normal
                   placeholder:text-stone-300 dark:placeholder:text-stone-600
                   disabled:opacity-40 max-h-32 overflow-y-auto pr-8
                   [&::-webkit-scrollbar]:w-0.75
                   [&::-webkit-scrollbar-track]:bg-transparent
                   [&::-webkit-scrollbar-thumb]:bg-stone-200
                   dark:[&::-webkit-scrollbar-thumb]:bg-stone-700
                   [&::-webkit-scrollbar-thumb]:rounded-full"
        style={{ height: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgb(214 211 208) transparent' }}
      />

      <button
        onClick={onSubmit}
        disabled={!hasInput || disabled}
        className="absolute right-2 bottom-1.75 w-6 h-6 shrink-0
                   flex items-center justify-center rounded-lg
                   transition-all duration-150 active:scale-90 disabled:opacity-20"
        style={{
          background: hasInput ? '#2FAF8F' : 'transparent',
          border:     hasInput ? 'none'    : '1.5px solid #d6d3d1',
        }}
      >
        <svg
          className="w-3 h-3"
          style={{ color: hasInput ? 'white' : '#a8a29e' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round"
        >
          <line x1="12" y1="19" x2="12" y2="5"/>
          <polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>
    </div>
  )
}

// ─── FAB BUTTON ───────────────────────────────────────────────────────────────

function FABButton({
  fabRef,
  open,
  state,
  isDragging,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  fabRef:        React.RefObject<HTMLButtonElement | null>
  open:          boolean
  state:         CopiloState
  isDragging:    boolean
  onClick:       () => void
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp:   (e: React.PointerEvent) => void
}) {
  return (
    <button
      ref={fabRef}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title="Copiloto — arrastra para mover"
      aria-label={open ? 'Cerrar copiloto' : 'Abrir copiloto'}
      aria-expanded={open}
      aria-haspopup="dialog"
      className={"w-11 h-11 rounded-full flex items-center justify-center relative transition-all duration-200 " +
        (isDragging ? "scale-95 cursor-grabbing" : "hover:scale-105 active:scale-95 cursor-grab")}
      style={{
        background: '#2FAF8F',
        boxShadow: state === 'thinking'
          ? '0 0 0 0 rgba(47,175,143,0.4), 0 4px 20px rgba(47,175,143,0.5)'
          : '0 4px 14px rgba(47,175,143,0.4), 0 2px 6px rgba(0,0,0,0.1)',
      }}
    >
      {state === 'thinking' && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-[#2FAF8F]" />
      )}

      {state === 'thinking' ? (
        <svg className="w-4.5 h-4.5 animate-spin" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      ) : state === 'done' ? (
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : open ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      ) : (
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        </svg>
      )}
    </button>
  )
}