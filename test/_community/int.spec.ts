import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { englishDisplayName, spanishDisplayName, usersSlug } from './config.js'

let payload: Payload
let restClient: NextRESTClient
let token: string
let userId: number | string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('payload.auth() ignores locale when loading the user document', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

    const user = (
      await payload.find({
        collection: usersSlug,
        limit: 1,
        where: { email: { equals: devUser.email } },
      })
    ).docs[0]

    if (!user) {
      throw new Error('Expected onInit to seed the dev user')
    }

    userId = user.id

    await payload.update({
      id: userId,
      collection: usersSlug,
      data: { displayName: spanishDisplayName },
      locale: 'es',
    })

    const login = await restClient.login({ slug: usersSlug })
    token = login.token
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('stores distinct localized values (control)', async () => {
    const enDoc = await payload.findByID({
      id: userId,
      collection: usersSlug,
      locale: 'en',
    })
    const esDoc = await payload.findByID({
      id: userId,
      collection: usersSlug,
      locale: 'es',
    })

    expect(enDoc.displayName).toBe(englishDisplayName)
    expect(esDoc.displayName).toBe(spanishDisplayName)
  })

  it('payload.login() returns localized fields for the requested locale (control)', async () => {
    const result = await payload.login({
      collection: usersSlug,
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      locale: 'es',
    })

    expect(result.user?.displayName).toBe(spanishDisplayName)
  })

  it('GET /api/users/me?locale=es returns localized fields (control)', async () => {
    const data = await restClient
      .GET(`/${usersSlug}/me`, {
        query: { locale: 'es' },
      })
      .then((res) => res.json())

    expect(data.user.displayName).toBe(spanishDisplayName)
  })

  it('payload.auth() returns localized fields when createLocalReq({ locale }) is passed', async () => {
    const req = await createLocalReq({ locale: 'es' }, payload)
    const { user } = await payload.auth({
      headers: new Headers({
        Authorization: `JWT ${token}`,
      }),
      req,
    })

    expect(user?.displayName).toBe(spanishDisplayName)
  })

  it('HTTP req.user is loaded in the request locale (?locale=es)', async () => {
    const data = await restClient
      .GET('/whoami', {
        query: { locale: 'es' },
      })
      .then((res) => res.json())

    expect(data.locale).toBe('es')
    expect(data.displayName).toBe(spanishDisplayName)
  })
})
