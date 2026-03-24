// supabase/functions/approve-moderator/index.ts
// Aprueba una solicitud de moderador usando service role (bypassa RLS)
// Deploy: supabase functions deploy approve-moderator

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { app_id, user_id, tipo, estado_mx, bio } = await req.json()

    if (!app_id || !user_id) {
      return new Response(JSON.stringify({ error: 'app_id y user_id requeridos' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Cliente con service role — bypassa RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Crear creator_profile nivel 4
    const { error: cpErr } = await supabase.from('creator_profiles').insert({
      user_id,
      creator_type: tipo ?? 'productor',
      estado_mx:    estado_mx ?? null,
      bio:          bio ?? null,
      nivel:        4,
      status:       'activo',
      trust_score:  85,
    })
    if (cpErr) throw new Error(cpErr.message)

    // 2. Marcar solicitud como aprobada
    const { error: appErr } = await supabase
      .from('moderator_applications')
      .update({ status: 'aprobado' })
      .eq('id', app_id)
    if (appErr) throw new Error(appErr.message)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})