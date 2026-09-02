import type { CollectionConfig, Endpoint } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const usersSlug = 'users'

export const englishDisplayName = 'English Name'
export const spanishDisplayName = 'Nombre Español'

/**
 * Minimal auth collection with a localized field. JWT / payload.auth() should
 * return this field in the request locale, matching findByID and /me.
 */
export const UsersCollection: CollectionConfig = {
  slug: usersSlug,
  admin: {
    useAsTitle: 'displayName',
  },
  auth: true,
  fields: [
    {
      name: 'displayName',
      type: 'text',
      localized: true,
      required: true,
    },
  ],
}

/**
 * Returns `req.user` after auth strategies run, so we can observe whether HTTP
 * `?locale=` was applied when the user document was loaded.
 */
const whoamiEndpoint: Endpoint = {
  path: '/whoami',
  method: 'get',
  handler: (req) =>
    Response.json({
      displayName: req.user && 'displayName' in req.user ? req.user.displayName : null,
      locale: req.locale,
      userId: req.user?.id ?? null,
    }),
}

export default buildConfigWithDefaults(
  {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
      user: usersSlug,
    },
    collections: [UsersCollection],
    endpoints: [whoamiEndpoint],
    localization: {
      defaultLocale: 'en',
      locales: ['en', 'es'],
    },
    onInit: async (payload) => {
      await payload.create({
        collection: usersSlug,
        locale: 'en',
        data: {
          displayName: englishDisplayName,
          email: devUser.email,
          password: devUser.password,
        },
      })
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  { disableAutoLogin: true },
)
