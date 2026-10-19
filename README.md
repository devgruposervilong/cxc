# CXC G&M

Dashboard de cuentas por cobrar. Esta rama (`cloudflare-vite-pwa`) es la
version nueva: React + Vite (PWA) en el navegador y un Worker de Cloudflare
con Hono + D1 (SQLite) + Drizzle ORM + Better Auth.

La version anterior (Next.js + Prisma/PostgreSQL sobre Vercel) sigue intacta
en la rama `main`. Ambas conviven hasta que la nueva este estable.

## Stack

- **Frontend**: React 19 + Vite, TanStack Router, Query, Table y Form, Zod,
  Tailwind CSS 4, `vite-plugin-pwa`.
- **Backend**: Cloudflare Worker + Hono en `/api/*`.
- **Base de datos**: Cloudflare D1 (SQLite) con Drizzle y migraciones SQL en
  `drizzle/`.
- **Auth**: Better Auth (sesiones en D1, plugin admin) + invitaciones de un
  solo uso.

## Requisitos

- Node 22 o superior.
- En Windows: **Microsoft Visual C++ Redistributable mas reciente**. Si
  `wrangler` falla con `write EOF` o `0xC0000135`, el runtime `workerd` no
  puede cargar sus DLLs; instalar el redistribuible (x64) y reiniciar.
- Cuenta de Cloudflare con acceso a Workers y D1 (solo para desplegar).

## Desarrollo local

```bash
npm install
copy .dev.vars.example .dev.vars   # PowerShell: Copy-Item
npm run db:migrate:local           # aplica drizzle/*.sql a D1 local
npm run dev                        # http://localhost:5173
```

`.dev.vars` guarda los secretos locales:

```
BETTER_AUTH_SECRET=<secreto largo y aleatorio>
SETUP_TOKEN=<token de un solo uso>
RESEND_API_KEY=        # opcional
EMAIL_FROM=            # opcional
```

El primer administrador se crea en `/setup` con el `SETUP_TOKEN`. Despues de
crearlo, ese endpoint queda bloqueado para siempre (solo funciona si no
existe ningun usuario).

## Scripts

| Script | Que hace |
| --- | --- |
| `npm run dev` | Vite + Worker + D1 local con hot reload |
| `npm run build` | `tsc` + build de produccion del cliente y del Worker |
| `npm run deploy` | build + `wrangler deploy` |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera una migracion Drizzle tras editar `worker/db/schema.ts` |
| `npm run db:migrate:local` | Aplica migraciones a D1 local |
| `npm run db:migrate:remote` | Aplica migraciones a D1 remoto |
| `npm run cf-typegen` | Regenera `worker-configuration.d.ts` |
| `npm run export:masters` | Exporta `client` y `seller` desde Postgres (ver abajo) |

## Despliegue en Cloudflare

1. Iniciar sesion:

   ```bash
   npx wrangler login
   ```

2. Crear la base D1 y copiar el `database_id` en `wrangler.jsonc`:

   ```bash
   npx wrangler d1 create cxc-db
   ```

3. Cargar los secretos (produccion):

   ```bash
   npx wrangler secret put BETTER_AUTH_SECRET
   npx wrangler secret put SETUP_TOKEN
   # opcionales, solo con dominio verificado en Resend
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put EMAIL_FROM
   ```

4. Aplicar migraciones y desplegar:

   ```bash
   npm run db:migrate:remote
   npm run deploy
   ```

5. Entrar de inmediato a `https://<tu-dominio>/setup` y crear el
   administrador. Luego rotar/eliminar `SETUP_TOKEN`:

   ```bash
   npx wrangler secret delete SETUP_TOKEN
   ```

## Migrar los maestros (client y seller)

Solo se migran los maestros. `upload` y `document` arrancan vacios: el primer
Excel se sube desde la app nueva.

1. En `.env` (no se despliega) debe estar el `DATABASE_URL` de Prisma
   Accelerate del proyecto anterior.
2. Generar el cliente de Prisma y exportar:

   ```bash
   npx prisma generate
   npm run export:masters
   ```

   Esto crea `d1-masters.sql` con `INSERT ... ON CONFLICT(code) DO UPDATE`:
   es idempotente y **no** sobrescribe ids existentes ni el `seller.userId`
   (los usuarios ya enlazados se conservan).

3. Aplicarlo en D1 remoto:

   ```bash
   npx wrangler d1 execute cxc-db --remote --file d1-masters.sql
   ```

## Usuarios, roles e invitaciones

- **admin**: todo (subir/guardar/eliminar cargas, gestionar usuarios e
  invitaciones, ver todos los portales).
- **user**: solo lectura del dashboard y exportar Excel.
- **seller**: solo su propio portal `/vendedor/:keyUrl`.

Los usuarios se crean desde `/admin/usuarios` -> *Nueva invitacion*. Se genera
un enlace de un solo uso que vence en 7 dias; **copiarlo o compartirlo por
WhatsApp** no se vuelve a mostrar en texto plano. Si se pierde, la lista de
invitaciones pendientes permite *Regenerar* el enlace (anula el anterior y crea
uno nuevo) o *Revocar* la invitacion. Si `RESEND_API_KEY` y `EMAIL_FROM` estan
configurados, ademas se envia por correo (requiere dominio verificado; mientras
no haya dominio, el correo queda deshabilitado).

El administrador puede cambiar roles, bloquear/desbloquear cuentas y revocar
invitaciones pendientes.

## Estructura

```
worker/
  index.ts              Worker Hono (monta /api/*)
  auth.ts               Better Auth + adaptador Drizzle
  middleware/auth.ts    requireSession / requireStaff / requireAdmin
  routes/               account, uploads, sellers, admin
  services/             load-upload, persist-upload, get-seller-portal
  repositories/         Drizzle repositories + mappers
  db/                   schema.ts (Drizzle) y client.ts
  lib/tokens.ts         token de invitacion + hash SHA-256
drizzle/                migraciones SQL de D1
src/
  routes/               TanStack Router (file-based)
  hooks/                use* con TanStack Query (unico consumidor de lib/api.ts)
  components/           dashboard, tabla TanStack, portal, admin
  lib/                  cliente API (fetch), sesion, query keys y query options
  panel.tsx             estado del panel principal
lib/                    logica de negocio compartida (morosidad, ranking, etc.)
scripts/export-masters.ts  exportacion one-time desde Postgres
```

## Assets de marca

El logo original esta en `assets/logo-original.png`. En `public/` viven las
variantes generadas a partir de el:

- `favicon.ico` (16/32/48/256) + `favicon-16x16.png` y `favicon-32x32.png`.
- `apple-touch-icon.png` (180, iOS) e `icons/mstile-150x150.png` con
  `browserconfig.xml` (Windows).
- `icons/icon-192.png` e `icons/icon-512.png` (PWA `any`),
  `icons/maskable-192.png` y `icons/maskable-512.png` (`maskable`) e
  `icons/monochrome-512.png` (iconos tematicos de Android).
- `logo.png` / `logo-mark.png` (tinta negra transparente) y
  `logo-white.png` / `logo-mark-white.png` (blancos, para fondos oscuros).
- `og-image.png` (1200x630) para la vista previa al compartir enlaces.

Si el logo cambia hay que regenerar estas variantes conservando nombres y
tamanos: el manifest (`vite.config.ts`) y los `<link>` de `index.html` ya
apuntan a esos archivos.

## Notas

- `worker-configuration.d.ts` se regenera con `npm run cf-typegen`; incluye
  los bindings y los secretos de `.dev.vars`.
- `prisma/` y `scripts/export-masters.ts` existen solo para la migracion
  one-time de maestros; la app en runtime no usa Prisma.
- La PWA es "always online": el service worker solo existe para que la app
  sea instalable, no cachea datos de negocio.
- La instalacion se maneja desde la app (`InstallAppButton`): captura
  `beforeinstallprompt` cuando el navegador lo expone y muestra instrucciones
  propias en iOS o cuando el navegador no dispara el evento.
