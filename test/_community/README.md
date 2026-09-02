# Reproduction: `payload.auth()` / JWT strategy ignores locale when loading the user

## Issue

`payload.auth()` and `req.user` (populated by JWT / API-key strategies) always return
localized fields on the auth collection in `localization.defaultLocale`.

Passing `createLocalReq({ locale: 'es' })` as `req`, or requesting `?locale=es` over
HTTP, has no effect. JWT `findByID` / API-key `find` never receive `locale`,
`fallbackLocale`, or `req`.

Contrast (these **do** honor locale):

- `payload.findByID({ locale: 'es' })`
- `payload.login({ locale: 'es' })`
- `GET /api/users/me?locale=es` (`meOperation` re-fetches with `req`)

## Run the failing tests

From the Payload repo root:

```bash
pnpm install
pnpm test:int _community
```

Expected: the two tests titled `payload.auth() returns localized fields…` and
`HTTP req.user is loaded in the request locale…` fail. Localized `displayName` comes
back as `"English Name"` (default locale) instead of `"Nombre Español"`.

The control tests (`findByID`, `login`, `/me`) pass.

## Config

See `config.ts`:

- localization: `en` (default) + `es`
- `users.displayName` is `localized: true`
- custom `GET /api/whoami` returns `req.user.displayName` after strategies run
