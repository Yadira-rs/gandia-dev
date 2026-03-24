import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import Categories from './collections/Categories'
import Authors from './collections/Authors'
import Posts from './collections/Posts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: Users.slug },
  collections: [Users, Media, Categories, Authors, Posts],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),
  plugins: [
    s3Storage({
      collections: { media: true },
      bucket: 'media',
      config: {
        endpoint: 'https://hmicjywweeozibtycesg.storage.supabase.co/storage/v1/s3',
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.SUPABASE_S3_KEY || '',
          secretAccessKey: process.env.SUPABASE_S3_SECRET || '',
        },
        forcePathStyle: true,
      },
    }),
  ],
  cors: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
  ],
  csrf: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
  ],
})