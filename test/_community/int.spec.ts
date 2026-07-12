import type { Payload, TypedUser } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { addSessionToUser } from 'payload/shared'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { usersSlug } from './config.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describeMongoDB = process.env.PAYLOAD_DATABASE === 'mongodb' ? describe : describe.skip

describeMongoDB('addSessionToUser with localized auth fields', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('reproduces CastError when addSessionToUser writes a flattened user document', async () => {
    const {
      docs: [userDoc],
    } = await payload.find({
      collection: usersSlug,
      limit: 1,
    })

    expect(userDoc).toBeDefined()
    expect(typeof userDoc.displayName).toBe('string')

    const user = await payload.findByID({
      id: userDoc.id,
      collection: usersSlug,
    })

    expect(typeof user.displayName).toBe('string')

    const req = await createLocalReq({}, payload)
    const collectionConfig = payload.collections[usersSlug].config

    const userForSession: TypedUser = {
      ...user,
      collection: usersSlug,
    }

    await expect(
      addSessionToUser({
        collectionConfig,
        payload,
        req,
        user: userForSession,
      }),
    ).rejects.toThrow(/Cast to Embedded failed.*displayName/)
  })
})
