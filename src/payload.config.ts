import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Pages } from './collections/Pages'
import { Settings } from './collections/Settings'
import { Users } from './collections/Users'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: 'Payload Wiki',
      description: "A customizable knowledge base.",
    }
  },
  collections: [
    Users,
    Pages,
    Categories
  ],
  globals: [
    Settings
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    prodMigrations: migrations,
    client: {
      url: 'libsql://alaria-captaincrouton89.aws-us-east-1.turso.io',
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
  ],
})
