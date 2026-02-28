// supabase/functions/newsletter-subscribe/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Deploy:
//   supabase functions deploy newsletter-subscribe --no-verify-jwt
//
// Secrets necesarios (supabase secrets set …):
//   RESEND_API_KEY      → API key de Resend
//   RESEND_AUDIENCE_ID  → ID de tu Audience en Resend
//   FROM_EMAIL          → "GANDIA 7 <noreply@gandia.mx>"
//                         (usa "onboarding@resend.dev" si aún no verificas dominio)
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// ── Email de bienvenida ───────────────────────────────────────────────────────
function buildWelcomeEmail(email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a GANDIA 7</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#111111;border:1px solid #242424;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 24px;border-bottom:1px solid #1C1C1C;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <div style="width:8px;height:8px;border-radius:50%;background:#2FAF8F;display:inline-block;
                                box-shadow:0 0 8px rgba(47,175,143,0.6);"></div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#FAFAFA;font-size:15px;font-weight:600;letter-spacing:-0.3px;">
                      GANDIA 7
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <h1 style="color:#FAFAFA;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.4px;">
                ¡Bienvenido a nuestro newsletter! 🎉
              </h1>
              <p style="color:#A3A3A3;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Gracias por suscribirte. A partir de ahora recibirás cada mes
                análisis, normativas, noticias y tecnología ganadera directo en tu bandeja.
              </p>

              <!-- Beneficios -->
              <table cellpadding="0" cellspacing="0" width="100%"
                     style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;margin-bottom:24px;">
                <tr><td style="padding:20px;">
                  <p style="color:#555;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 14px;">
                    Qué recibirás
                  </p>
                  ${['Guías técnicas exclusivas', 'Alertas de normativas', 'Casos de éxito'].map(item => `
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                    <tr>
                      <td style="width:16px;vertical-align:top;padding-top:1px;">
                        <span style="color:#2FAF8F;font-size:14px;font-weight:bold;">✓</span>
                      </td>
                      <td style="padding-left:8px;">
                        <span style="color:#A3A3A3;font-size:13px;">${item}</span>
                      </td>
                    </tr>
                  </table>`).join('')}
                </td></tr>
              </table>

              <p style="color:#555;font-size:11px;line-height:1.6;margin:0;">
                Si no solicitaste esta suscripción, puedes ignorar este mensaje.<br/>
                Enviado a: <span style="color:#A3A3A3;">${email}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #1C1C1C;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color:#333;font-size:10.5px;margin:0;">
                      © 2026 GANDIA 7 Technologies S.A. de C.V. · Durango, México
                    </p>
                  </td>
                  <td align="right">
                    <a href="https://gandia.mx/legal?section=privacy"
                       style="color:#2FAF8F;font-size:10.5px;text-decoration:none;">
                      Privacidad
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// ── Handler ───────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405)
  }

  // ── 1. Validar email ────────────────────────────────────────────────────────
  let email: string
  try {
    const body = await req.json()
    email = (body?.email ?? '').trim().toLowerCase()
  } catch {
    return json({ error: 'Body inválido' }, 400)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return json({ error: 'Email inválido' }, 422)
  }

  const resendKey  = Deno.env.get('RESEND_API_KEY')!
  const audienceId = Deno.env.get('RESEND_AUDIENCE_ID')!
  const fromEmail  = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'

  // ── 2. Agregar contacto a Audience ──────────────────────────────────────────
  try {
    const contactRes = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      }
    )

    if (!contactRes.ok) {
      const err = await contactRes.text()
      console.error('Resend contact error:', err)
    }
  } catch (err) {
    console.error('Resend contact exception:', err)
    return json({ error: 'Error al registrar suscripción. Intenta de nuevo.' }, 500)
  }

  // ── 3. Enviar email de bienvenida ───────────────────────────────────────────
  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: '¡Bienvenido al newsletter de GANDIA 7!',
        html: buildWelcomeEmail(email),
      }),
    })

    if (!emailRes.ok) {
      const err = await emailRes.text()
      console.error('Resend email error:', err)
      // No fallamos la suscripción si el email de bienvenida falla
    }
  } catch (err) {
    console.error('Resend email exception:', err)
  }

  return json({ success: true, message: 'Suscripción registrada' })
})