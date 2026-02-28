import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const DISMISSED_KEY = 'gandia-profile-banner-dismissed'

// Chequea si el perfil está incompleto según el rol
async function checkIncomplete(userId: string, role: string): Promise<boolean> {
  if (role === 'producer') {
    const { data } = await supabase
      .from('ranch_extended_profiles')
      .select('name, active_heads')
      .eq('user_id', userId)
      .maybeSingle()
    return !data?.name || !data?.active_heads
  }

  if (role === 'union') {
    const { data } = await supabase
      .from('union_extended_profiles')
      .select('nombre, socios_activos')
      .eq('user_id', userId)
      .maybeSingle()
    return !data?.nombre || !data?.socios_activos
  }

  // mvz, exporter, auditor — no hay tabla extendida definida aún, no mostrar banner
  return false
}

export default function ProfileBanner() {
  const navigate              = useNavigate()
  const [show,    setShow]    = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      const role = profile?.role as string | null
      if (!role) return

      const incomplete = await checkIncomplete(user.id, role)
      if (incomplete) {
        setShow(true)
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      }
    }
    check()
  }, [])

  const dismiss = () => {
    setVisible(false)
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setTimeout(() => setShow(false), 400)
  }

  if (!show) return null

  return (
    <>
      <style>{`
        @keyframes pb-slide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pb-wrap { animation: pb-slide 400ms cubic-bezier(.16,1,.3,1) both; }
        .pb-link {
          position: relative;
          transition: color 180ms ease;
        }
        .pb-link::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0; right: 0;
          height: 1px;
          background: currentColor;
          opacity: 0.4;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 220ms cubic-bezier(.16,1,.3,1);
        }
        .pb-link:hover::after { transform: scaleX(1); }
        .pb-x { transition: opacity 150ms ease; opacity: 0.3; }
        .pb-x:hover { opacity: 0.7; }
      `}</style>

      <div
        className="pb-wrap shrink-0 px-4 pt-3 pb-1"
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 400ms cubic-bezier(.16,1,.3,1), transform 400ms cubic-bezier(.16,1,.3,1)',
        }}
      >
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-800/70 bg-white dark:bg-[#1a1714]"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <span className="w-[5px] h-[5px] rounded-full bg-[#2FAF8F] shrink-0" />

          <p
            className="flex-1 text-[13px] font-medium text-stone-600 dark:text-stone-300 leading-none"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Tu perfil está incompleto — algunas funciones pueden estar limitadas.
          </p>

          <button
            onClick={() => navigate('/perfil/editar')}
            className="pb-link shrink-0 text-[12px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200"
            style={{ fontFamily: "'Geist', system-ui, sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Completar →
          </button>

          <div className="shrink-0 w-px h-4 bg-stone-200 dark:bg-stone-800" />

          <button
            onClick={dismiss}
            className="pb-x shrink-0 flex items-center justify-center text-stone-400 dark:text-stone-600"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
            aria-label="Cerrar"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}