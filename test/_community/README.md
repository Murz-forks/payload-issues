# Reproduction: `addSessionToUser` fails on auth collections with localized fields

## Issue

Payload's `addSessionToUser` (`payload/shared`) passes the entire user document to `db.updateOne`.
When the auth collection has `localized: true` fields, `findByID` returns flattened locale values
(e.g. `displayName: "Test User"`), but the MongoDB adapter expects the embedded locale object
(e.g. `{ en: "Test User", es: "..." }`). Mongoose throws:

```
CastError: Cast to Embedded failed for value "Test User" (type string) at path "displayName"
```

## Run the failing test

This reproduction requires **MongoDB** (Mongoose `CastError` on embedded localized fields).

From the Payload repo root:

```bash
pnpm install
pnpm docker:start mongodb   # if MongoDB is not already running locally
PAYLOAD_DATABASE=mongodb pnpm test:int _community
```

## Expected fix

`addSessionToUser` (and similarly `revokeSession`) should only update changed fields:

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

## Config

See `config.ts` — a minimal auth `users` collection with one localized `displayName` field and
localization enabled for `en` and `es`.
