import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

// Collections - CORREGIDO: usar named imports para Users y Media
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import Categories from './collections/Categories'
import Authors from './collections/Authors'
import Posts from './collections/Posts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    Media,
    Categories,
    Authors,
    Posts,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  
  // ✅ CONFIGURACIÓN DE CORS
  cors: [
    'http://localhost:5173',      // Frontend React
    'http://localhost:3000',      // Payload admin
    'http://localhost:4173',      // Vite preview
  ],
  
  // ✅ CSRF para permitir requests
  csrf: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
  ],
})