# CXC G&M

Rama `cloudflare-vite-pwa`: React + Vite (PWA) sobre Cloudflare Workers con
Hono, D1 + Drizzle y Better Auth. La app Next.js anterior sigue en `main`
(produccion en Vercel) y no se debe tocar desde esta rama.

## Comandos

- `npm run dev` / `npm run build` / `npm run typecheck` / `npm run lint`
- `npm run db:generate` despues de editar `worker/db/schema.ts`
- `npm run db:migrate:local` y `db:migrate:remote`
- `npm run cf-typegen` despues de cambiar bindings o secretos

## Convenciones

- Frontend: TanStack Router file-based (`src/routes`), Query, Table y Form.
  El alias `@/` apunta a la raiz del repo (no a `src/`).
- Backend: rutas Hono en `worker/routes`, logica en `worker/services`, acceso
  a datos en `worker/repositories`. **No usar Prisma en runtime.**
- D1: ids cuid2, totales en `REAL`, migraciones versionadas en `drizzle/`.
- Auth: Better Auth con roles `admin`, `user` y `seller`. Los guards del
  frontend se basan en `/api/me`; el backend valida siempre la sesion.
- `generated/` y `d1-masters.sql` son artefactos one-time de la migracion a
  D1: no se commitean.
- Secretos locales en `.dev.vars` (nunca commitear). En produccion se cargan
  con `wrangler secret put`.
- En Windows, si `workerd` falla al arrancar, instalar el Visual C++
  Redistributable mas reciente (ver README).
