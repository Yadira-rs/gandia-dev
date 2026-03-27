import 'dotenv/config'

async function main() {
    try {
        console.log('\n🚀 Handeia Wiki — Scraper de fuentes oficiales')
        console.log(`   ${new Date().toISOString()}\n`)

        const SUPABASE_URL =
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL

        const SUPABASE_SERVICE_ROLE_KEY =
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.VITE_SUPABASE_SERVICE_KEY

        if (!SUPABASE_URL) {
            throw new Error(
                'Falta SUPABASE_URL (o VITE_SUPABASE_URL) en .env'
            )
        }

        if (!SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error(
                'Falta SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_SERVICE_KEY en .env'
            )
        }

        console.log('🔎 Debug ENV')
        console.log(`   URL: ${SUPABASE_URL}`)
        console.log(
            `   KEY PREFIX: ${SUPABASE_SERVICE_ROLE_KEY.slice(0, 12)}...`
        )
        console.log(
            `   KEY LENGTH: ${SUPABASE_SERVICE_ROLE_KEY.length}\n`
        )

        const endpoint = `${SUPABASE_URL}/functions/v1/wiki-scraper`

        console.log('📡 Llamando a wiki-scraper Edge Function...')
        console.log(`   ${endpoint}\n`)

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'x-master-key': 'GANDIA-MASTER-2026'
            },
            body: JSON.stringify({}),
        })

        const rawText = await response.text()

        let data: unknown = null
        try {
            data = rawText ? JSON.parse(rawText) : null
        } catch {
            data = rawText
        }

        if (!response.ok) {
            console.error('❌ Error HTTP en wiki scraper')
            console.error(`   Status: ${response.status} ${response.statusText}`)
            console.error('   Response:', data)
            throw new Error(
                `Error ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)
                }`
            )
        }

        console.log('✅ Wiki scraper ejecutado con éxito\n')
        console.log('📦 Respuesta:')
        console.dir(data, { depth: null, colors: true })

        process.exit(0)
    } catch (error) {
        console.error('\n❌ Error en wiki scraper:')
        if (error instanceof Error) {
            console.error(`   ${error.message}`)
            console.error(error.stack)
        } else {
            console.error(error)
        }
        process.exit(1)
    }
}

main()