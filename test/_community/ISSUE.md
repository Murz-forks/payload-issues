# Bug: `addSessionToUser` fails on auth collections with localized fields

## Summary

`addSessionToUser` (exported from `payload/shared`) passes the entire user document to
`payload.db.updateOne`. On MongoDB, when the auth collection has `localized: true` fields,
this fails because `findByID` returns flattened locale values while Mongoose expects the
embedded locale object.

## Reproduction

See [README.md](./README.md) in this directory.

```bash
pnpm docker:start mongodb
PAYLOAD_DATABASE=mongodb pnpm test:int _community
```

Failing test: `reproduces CastError when addSessionToUser writes a flattened user document`

## Error

```
CastError: Cast to Embedded failed for value "Test User" (type string) at path "displayName"
ObjectParameterError: Parameter "obj" to Document() must be an object, got "Test User" (type string)
```

## Root cause

`packages/payload/src/auth/sessions.ts`:

```ts
await payload.db.updateOne({
  id: user.id,
  collection: collectionConfig.slug,
  data: user, // entire document — includes flattened localized fields
  req,
  returning: false,
})
```

The same pattern exists in `revokeSession`.

## Suggested fix

Update only the fields that change:

```ts
await payload.db.updateOne({
  id: user.id,
  collection: collectionConfig.slug,
  data: {
    sessions: user.sessions,
    updatedAt: null,
  },
  req,
  returning: false,
})
```

## Environment

- Payload: 4.0.0-beta.0 (monorepo main; same bug in 3.85.x)
- Adapter: `@payloadcms/db-mongodb`
- Localization enabled with multiple locales
